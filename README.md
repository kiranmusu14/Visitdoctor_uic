# Build with Claude: Agents for Healthcare
## UIC College of Business | May 1, 2026

A hackathon where you build AI agents applied to real healthcare problems. You don't need to be a coder — the strongest coders wire the agent, the strongest thinkers design the prompt, the strongest communicators deliver the demo.

---

## What's in this repo

This is a **resource kit**, not a scaffold. Build however you want, with whatever tools you brought.

```
README.md                    ← you are here
Hackathon/
  prompts.md                 ← the 3 challenge prompts in full
Workshop/
  01_chat_only.py            ← step 1: system prompt only
  02_with_tool.py            ← step 2: + tool definition
  03_full_loop.py            ← step 3: + agentic loop (full agent)
docs/
  healthcare_primer.md       ← what is MedEx, VBC, ED utilization, SDOH
  data_dictionary.md         ← what's in each table, key columns, gotchas
  agent_building_guide.md    ← the agent pattern: prompt + tools + loop
  agent_design_framework.md  ← 5 questions to answer BEFORE writing code
  cloudflare_deploy.md       ← 5-step Cloudflare Workers deploy guide
  shepherd_system_prompt.md  ← paste this into Claude Projects for a built-in teammate
data/
  schema.sql                 ← D1 database schema (9 tables + patient_summary view)
  *.csv                      ← all dataset CSVs if you prefer local files
examples/
  python/agent_example.py    ← full reference agent in Python (Anthropic SDK)
  typescript/agent_example.ts ← same in TypeScript
```

**Live services you can use today:**

| Service | URL |
|---|---|
| Patient data API | `https://uic-hackathon-data.christian-7f4.workers.dev/query` |
| Hackathon guide chatbot | `https://uic-hackathon-guide.christian-7f4.workers.dev/` |
| Patient lookup specialist | `https://uic-patient-lookup.christian-7f4.workers.dev/lookup` |

---

## Team demo: Preventable Visit Detector

This fork includes a working Prompt 1 app in `agent/`.

**Live app:** `https://silent-snow-e388.kkuma37.workers.dev`

The app helps a care coordinator find patients at risk of a preventable ED visit, explain the score, draft outreach, and store the human review decision.

### Architecture

```text
Browser UI
  -> Cloudflare Worker
  -> Live Hackathon Patient Data API
  -> Sentinel deterministic scoring
  -> Groq Coordinator / Ask Agent
  -> Cloudflare D1 decision memory
  -> Human approve / modify / reject
  -> D1 RAG lessons for future answers
```

Key pieces:

- `agent/src/index.ts` serves the UI and Worker API routes.
- Sentinel scoring is deterministic TypeScript using ED use, care plan status, SDOH, PRAPARE, chronic burden, medications, and financial barriers.
- Groq calibrates weights, explains the Sentinel result, drafts coordinator outreach, and answers open-ended questions.
- Cloudflare D1 stores the decision trail, patient history, coordinator notes, RAG lessons, and deterministic embedding vectors for similar past decisions.
- Modified recommendations become learning examples so the agent can reuse coordinator corrections.

### Worker routes

| Route | Purpose |
|---|---|
| `/` | Live care-coordination dashboard |
| `/trail` | Persistent Decision Trail |
| `/api/analyze` | Load and score a patient |
| `/api/rank` | Run Top 5, Top 10, or Top 20 population ranking |
| `/api/ask` | Ask Groq questions grounded in patient data and D1 RAG memory |
| `/api/review` | Approve, modify, or reject a recommendation |
| `/api/setup` | Create or update D1 memory tables |
| `/api/rag/stats` | Show what the agent has learned |

### Groq keys

Use two Groq keys if available:

```bash
cd agent
npx wrangler secret put GROQ_API_KEY       # main key: calibration + coordinator recommendations
npx wrangler secret put GROQ_API_KEY_ASK   # Ask Agent key: open-ended Q&A
```

Fallback behavior:

- If `GROQ_API_KEY_ASK` is present, `/api/ask` uses it.
- If `GROQ_API_KEY_ASK` is missing, `/api/ask` falls back to `GROQ_API_KEY`.
- Local legacy names `groq` and `groq2` are also supported for development only.
- Secrets are not committed to git.

### Local development

```bash
cd agent
npm install
npm run typecheck
npm run dev
```

Deploy:

```bash
cd agent
npm run deploy
```

---

## The database

The patient dataset is hosted on a public read-only HTTP API. No account required — just make HTTP requests.

**Endpoint:** `POST https://uic-hackathon-data.christian-7f4.workers.dev/query`

```bash
# Try it right now
curl -X POST https://uic-hackathon-data.christian-7f4.workers.dev/query \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT first, last, ed_inpatient_total_cost FROM patient_summary ORDER BY ed_inpatient_total_cost DESC LIMIT 5"}'
```

**Rules:** Only `SELECT` statements are allowed. Responses are JSON `{ "results": [...] }`.

**Tables:** `patients`, `encounters`, `conditions`, `medications`, `observations`, `procedures`, `claims_transactions`, `careplans`, `patient_summary` (pre-joined view — start here)

See `docs/data_dictionary.md` for what each table contains and `data/schema.sql` for the full schema.

---

## The dataset at a glance

117 synthetic patients (Synthea). Key facts to know for your agent:

| Stat | Value |
|---|---|
| Total healthcare costs | $27.9M across 8,316 encounters |
| Inpatient share | 35% of total cost, only 2.8% of encounters |
| Patients with at least one ED visit | 97 out of 117 (83%) |
| Top 3 patients by cost | Giovanni Paucek ($3.4M), Chad ($2.8M), Chantelle Oberbrunner ($2.5M) |
| Patients with no active care plan | 15 ED patients |
| Patients on opioids | 21 (19 are ED frequent flyers) |
| Patients with 5+ active medications | 25 |
| Patients with >$10K outstanding medical debt | 93 |

---

## The 3 challenge prompts

Pick one. 5 teams per prompt.

### Prompt 1: The Preventable Visit Detector
Build an agent that identifies patients at high risk of a preventable ED visit and drafts intervention recommendations for a care coordinator to review and approve.

**Pattern:** Filter → Score → Rank → Recommend → Human reviews

### Prompt 2: The Cost Explainer
Build a conversational agent a care manager can interrogate to understand why a patient is expensive and which costs are reducible.

**Pattern:** Human asks → Agent queries → Presents findings → Human digs deeper

### Prompt 3: The Care Barrier Agent
Build an agent that analyzes a patient's full record, identifies specific barriers (financial, social, logistical), and generates a barrier-informed care plan for a coordinator to review.

**Pattern:** Pull full profile → Identify barriers → Check care gaps → Generate plan → Human personalizes

Full prompts with data guidance in `Hackathon/prompts.md`.

---

## Getting started fast

Paste this URL into your AI agent (Claude Code, Cursor, Copilot, Codex — any of them):

```
https://raw.githubusercontent.com/csomora/INFORMS-UIC-Hackathon/main/SETUP.md
```

Your agent will check your environment, fix anything missing, and get you running your first query in under 10 minutes.

---

## Manual setup

**Option A — Cloudflare Workers (free, no API key needed)**
Uses Cloudflare Workers AI — free on Cloudflare's free tier. No external API key required.
Fork this repo → scaffold agents-starter → connect to Cloudflare Builds → every push auto-deploys → demo a live URL.
See `docs/cloudflare_deploy.md` for the full walkthrough (~15 min setup).

**Option B — Python** (requires an LLM API key)
```bash
git clone https://github.com/csomora/INFORMS-UIC-Hackathon
cd INFORMS-UIC-Hackathon/examples/python
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your_key_here   # or OPENAI_API_KEY, GROQ_API_KEY, etc.
python agent_example.py
```
Free key option: [Groq](https://console.groq.com) (OpenAI-compatible, generous free tier)

**Option C — TypeScript/Node** (requires an LLM API key)
```bash
cd examples/typescript
npm install
export ANTHROPIC_API_KEY=your_key_here
npm run start
```

**Option D — No code (Claude Projects fallback)**
1. Create a new Claude Project at claude.ai
2. Paste `docs/shepherd_system_prompt.md` as the project instructions
3. Upload the CSV files from `data/` as project knowledge
4. Claude becomes your agent — screen-record the conversation for your demo

---

## Judging criteria

| Criterion | Weight |
|---|---|
| Problem Framing — real, specific problem | 20% |
| Agent Design — multi-step, tool-using, goal-directed | 25% |
| Human-in-the-Loop — does human input meaningfully change the outcome? | 20% |
| Data Use — creative use of the dataset, not just loading it | 15% |
| Demo & Storytelling — problem → approach → demo → impact in 5 min | 20% |

---

## Demo tip: use these patients

| Patient | Why they're compelling |
|---|---|
| Giovanni Paucek | 63 ED/inpatient visits, $3.4M, 21 chronic conditions, overdose |
| Lindsay Brekke | 44 ED visits, chronic migraine, 10 conditions, NO active care plan |
| Chantelle Oberbrunner | 52 visits, $2.5M, 17 conditions, overdose |
| Soledad White | 35 chronic conditions (highest complexity), $276K ED/inpatient |
| Chad | 46 visits, $2.8M, 17 conditions, drug abuse |

---

## Stuck? Use the Shepherd Agent

Paste `docs/shepherd_system_prompt.md` into a Claude Project. Upload the CSVs. Ask it anything — it knows the dataset, the prompts, and the judging criteria. It will also tell you when you're over-scoping.
