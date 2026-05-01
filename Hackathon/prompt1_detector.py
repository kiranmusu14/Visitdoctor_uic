"""
Prompt 1 — The Preventable Visit Detector
==========================================
Finds patients most at risk of an avoidable ED visit, scores them on
clinical AND social factors, drafts coordinator-ready outreach, then
waits for coordinator approval / modification / rejection before acting.

Pattern: Filter → Score → Rank → Draft → Human reviews → Agent adapts

Setup (same venv as Workshop/):
  pip install claude-agent-sdk requests
  claude login
  python Hackathon/prompt1_detector.py

How to interact:
  1. Ask the agent to run its analysis:
       "Find the top 5 patients most at risk of a preventable ED visit"
  2. Agent ranks patients, pulls their profiles, drafts outreach for #1
  3. Respond with one of:
       "approve"                      — locks in the outreach as-is
       "modify: she has a daughter who can drive — remove transport barrier"
       "reject"                       — agent moves to the next patient
  4. Keep going until you're satisfied or type 'exit'
"""

import asyncio
import json
import tempfile
import requests
from typing import Any

from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    tool,
    create_sdk_mcp_server,
    AssistantMessage,
    UserMessage,
    TextBlock,
    ToolUseBlock,
)

CYAN  = "\033[36m"
GREEN = "\033[32m"
DIM   = "\033[2m"
BOLD  = "\033[1m"
RESET = "\033[0m"

D1 = "https://uic-hackathon-data.christian-7f4.workers.dev/query"


def _sql(query: str) -> dict:
    try:
        r = requests.post(D1, json={"sql": query}, timeout=15)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        return {"success": False, "error": str(e), "results": []}


# ── SYSTEM PROMPT ──────────────────────────────────────────────────────

SYSTEM = """You are a preventable-visit detection agent helping care coordinators
at a value-based primary care practice. Your job is to identify patients most at
risk of an avoidable ED visit and draft personalized outreach for a coordinator
to review.

DATABASE FACTS
- 117 synthetic patients. Names have numeric suffixes (Lindsay928 Brekke496).
- patient_summary: one row per patient — ed_visits, chronic_condition_count,
  has_active_careplan (0 = gap), income.
- conditions: active = STOP IS NULL. Includes clinical AND SDOH (search
  DESCRIPTION for 'housing', 'food', 'transport', 'employ', 'stress',
  'partner abuse', 'social isolation').
- observations: PRAPARE social screenings (VALUE column has answers).
- medications: active = STOP IS NULL. Count > 5 = polypharmacy risk.
- careplans: active = STOP IS NULL.
- claims_transactions: PATIENTID join key (not PATIENT — all other tables use PATIENT).

RISK SCORING LOGIC (apply mentally, show your work)
Clinical score (0–10):
  +3  ed_visits > 5
  +2  ed_visits 3–5
  +2  chronic_condition_count > 8
  +1  chronic_condition_count 5–8
  +2  has_active_careplan = 0
  +1  polypharmacy (>5 active meds)
  +1  opioid medication present

Social score (0–6):
  +2  housing instability condition
  +2  food insecurity condition
  +1  transport barrier condition
  +1  income < 20000

WORKFLOW — follow this exactly:
1. Call rank_at_risk_patients to get the top candidates.
2. For each top candidate, call get_patient_profile (conditions + SDOH + observations).
3. Call get_medication_signals to check polypharmacy/opioids.
4. Compute the composite risk score (clinical + social). Show each component.
5. Draft a coordinator-ready outreach note (2–3 sentences, specific to this patient's
   barriers and conditions). Format it clearly under "OUTREACH DRAFT:".
6. STOP and explicitly ask the coordinator:
     "→ Type APPROVE to confirm, MODIFY: <your change> to adjust, or REJECT to move
        to the next patient."
7. Wait for coordinator response:
   - APPROVE → confirm outreach is finalized for that patient, offer to continue
     to the next.
   - MODIFY: <text> → rewrite the outreach incorporating the coordinator's local
     knowledge, show the revised draft, ask again.
   - REJECT → move to the next highest-risk patient and repeat from step 2.

Always show your reasoning. The coordinator's input MUST change what happens next."""


# ── TOOLS ──────────────────────────────────────────────────────────────

@tool(
    "rank_at_risk_patients",
    "Return the top N patients at highest risk of a preventable ED visit. "
    "Ranked by ed_visits DESC where has_active_careplan = 0. "
    "Returns id, name, ed_visits, chronic_condition_count, income, has_active_careplan.",
    {"limit": int},
)
async def rank_at_risk_patients(args: dict[str, Any]) -> dict[str, Any]:
    limit = min(int(args.get("limit", 10)), 20)
    sql = f"""
        SELECT id, first, last, ed_visits, inpatient_visits,
               chronic_condition_count, has_active_careplan,
               income, ed_inpatient_total_cost
        FROM patient_summary
        WHERE ed_visits > 2
        ORDER BY
            (ed_visits * 2 + chronic_condition_count + (1 - has_active_careplan) * 3) DESC,
            ed_visits DESC
        LIMIT {limit}
    """
    result = _sql(sql)
    return {"content": [{"type": "text", "text": json.dumps(result)}]}


@tool(
    "get_patient_profile",
    "Return the clinical conditions AND social/SDOH barriers for a specific patient ID. "
    "Also returns the 5 most recent PRAPARE observation values. "
    "Call this for each candidate after rank_at_risk_patients.",
    {"patient_id": str},
)
async def get_patient_profile(args: dict[str, Any]) -> dict[str, Any]:
    pid = args["patient_id"].replace("'", "''")

    conditions_sql = f"""
        SELECT DESCRIPTION
        FROM conditions
        WHERE PATIENT = '{pid}' AND STOP IS NULL
        ORDER BY START DESC
        LIMIT 50
    """

    obs_sql = f"""
        SELECT DATE, DESCRIPTION, VALUE
        FROM observations
        WHERE PATIENT = '{pid}'
          AND CATEGORY = 'survey'
        ORDER BY DATE DESC
        LIMIT 10
    """

    careplan_sql = f"""
        SELECT DESCRIPTION, STOP
        FROM careplans
        WHERE PATIENT = '{pid}'
        ORDER BY START DESC
        LIMIT 5
    """

    conditions = _sql(conditions_sql)
    observations = _sql(obs_sql)
    careplans = _sql(careplan_sql)

    combined = {
        "conditions": conditions.get("results", []),
        "prapare_observations": observations.get("results", []),
        "careplans": careplans.get("results", []),
    }
    return {"content": [{"type": "text", "text": json.dumps(combined)}]}


@tool(
    "get_medication_signals",
    "Return active medication count and any opioid medications for a patient. "
    "Use this to detect polypharmacy risk (>5 active meds) and opioid use.",
    {"patient_id": str},
)
async def get_medication_signals(args: dict[str, Any]) -> dict[str, Any]:
    pid = args["patient_id"].replace("'", "''")

    count_sql = f"""
        SELECT COUNT(*) as active_med_count
        FROM medications
        WHERE PATIENT = '{pid}' AND STOP IS NULL
    """

    opioid_sql = f"""
        SELECT DESCRIPTION
        FROM medications
        WHERE PATIENT = '{pid}' AND STOP IS NULL
          AND (
            LOWER(DESCRIPTION) LIKE '%opioid%'
            OR LOWER(DESCRIPTION) LIKE '%oxycodone%'
            OR LOWER(DESCRIPTION) LIKE '%hydrocodone%'
            OR LOWER(DESCRIPTION) LIKE '%morphine%'
            OR LOWER(DESCRIPTION) LIKE '%fentanyl%'
            OR LOWER(DESCRIPTION) LIKE '%tramadol%'
            OR LOWER(DESCRIPTION) LIKE '%codeine%'
            OR LOWER(DESCRIPTION) LIKE '%buprenorphine%'
            OR LOWER(DESCRIPTION) LIKE '%methadone%'
          )
        LIMIT 10
    """

    count_result = _sql(count_sql)
    opioid_result = _sql(opioid_sql)

    combined = {
        "active_med_count": count_result.get("results", [{}])[0].get("active_med_count", 0),
        "opioid_medications": opioid_result.get("results", []),
    }
    return {"content": [{"type": "text", "text": json.dumps(combined)}]}


# ── AGENT LOOP ─────────────────────────────────────────────────────────

async def main():
    server = create_sdk_mcp_server(
        name="detector",
        version="1.0.0",
        tools=[rank_at_risk_patients, get_patient_profile, get_medication_signals],
    )

    with tempfile.TemporaryDirectory() as cwd:
        options = ClaudeAgentOptions(
            system_prompt=SYSTEM,
            cwd=cwd,
            mcp_servers={"detector": server},
            allowed_tools=[
                "mcp__detector__rank_at_risk_patients",
                "mcp__detector__get_patient_profile",
                "mcp__detector__get_medication_signals",
            ],
            disallowed_tools=[
                "Bash", "BashOutput", "Read", "Write", "Edit", "Glob", "Grep",
                "WebFetch", "WebSearch", "Task", "TodoWrite", "NotebookEdit",
                "KillShell", "SlashCommand",
            ],
        )

        async with ClaudeSDKClient(options=options) as client:
            print(f"\n{BOLD}{'─' * 60}{RESET}")
            print(f"{BOLD}PREVENTABLE VISIT DETECTOR — Prompt 1{RESET}")
            print(f"{'─' * 60}")
            print("Suggested starting prompt:")
            print(f"  {CYAN}Find the top 5 patients most at risk of a preventable ED visit.{RESET}")
            print("\nAfter the agent drafts outreach, respond with:")
            print(f"  {GREEN}approve{RESET}                  — confirm as-is")
            print(f"  {GREEN}modify: <your change>{RESET}    — update with local knowledge")
            print(f"  {GREEN}reject{RESET}                   — skip to next patient")
            print(f"{'─' * 60}\nType 'exit' to quit.\n")

            while True:
                try:
                    user_input = input("\n💬 Coordinator › ").strip()
                except (EOFError, KeyboardInterrupt):
                    print()
                    break

                if not user_input or user_input.lower() in ("exit", "quit"):
                    break

                await client.query(user_input)
                print(f"\n{BOLD}🤖 Agent ›{RESET}\n")

                async for message in client.receive_response():
                    if isinstance(message, AssistantMessage):
                        for block in message.content:
                            if isinstance(block, ToolUseBlock):
                                if block.name.startswith("mcp__detector__"):
                                    short = block.name.split("__")[-1]
                                    print(f"{CYAN}  🔧 {short}({block.input}){RESET}", flush=True)
                            elif isinstance(block, TextBlock):
                                print(block.text, end="", flush=True)
                    elif isinstance(message, UserMessage):
                        for block in message.content:
                            content = getattr(block, "content", None)
                            if isinstance(content, list):
                                for item in content:
                                    text = item.get("text", "") if isinstance(item, dict) else ""
                                    if "results" in text:
                                        try:
                                            data = json.loads(text)
                                            row_count = (
                                                len(data.get("results", []))
                                                if isinstance(data, dict)
                                                else 0
                                            )
                                            if row_count:
                                                print(
                                                    f"{DIM}   ← {row_count} rows{RESET}",
                                                    flush=True,
                                                )
                                        except (json.JSONDecodeError, AttributeError):
                                            pass
                print()


asyncio.run(main())
