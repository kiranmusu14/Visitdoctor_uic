interface Env {
  DATA_API_URL?: string;
  GROQ_API_KEY?: string;
  GROQ_API_KEY_ASK?: string;
  GROQ_ASK_API_KEY?: string;
  ASK_GROQ_API_KEY?: string;
  GROQ_API_KEY_COORDINATOR?: string;
  GROQ_API_KEY_CALIBRATION?: string;
  GROQ_API_KEY_MAIN?: string;
  GROQ_MAIN_API_KEY?: string;
  groq?: string;
  groq2?: string;
  GROQ_MODEL?: string;
  DB?: D1Database;
}

interface QueryResponse<T> {
  success: boolean;
  count?: number;
  results?: T[];
  error?: string;
}

interface SummaryRow {
  id: string;
  first: string;
  last: string;
  age: number | null;
  gender: string | null;
  race: string | null;
  ethnicity: string | null;
  income: number | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  total_visits: number;
  ed_visits: number;
  inpatient_visits: number;
  ed_inpatient_total_cost: number;
  chronic_condition_count: number;
  has_active_careplan: number;
}

interface ConditionRow {
  DESCRIPTION: string;
  START?: string;
}

interface ObservationRow {
  DATE?: string;
  DESCRIPTION: string;
  VALUE: string;
}

interface MedicationRow {
  DESCRIPTION: string;
}

interface DebtRow {
  total_outstanding?: number | null;
  TOTAL_OUTSTANDING?: number | null;
}

interface EncounterRow {
  START: string;
  DESCRIPTION: string;
  REASONDESCRIPTION?: string | null;
  TOTAL_CLAIM_COST?: number | null;
}

interface CarePlanRow {
  START?: string | null;
  STOP?: string | null;
  DESCRIPTION?: string | null;
}

interface ScoreItem {
  label: string;
  points: number;
  evidence: string;
}

interface ModuleWeight {
  weight: number;
  rationale: string;
}

interface CalibrationWeights {
  medical_reasoning: {
    primary_evidence_base: string;
    population_context: string;
    key_insight: string;
  };
  module_weights: {
    A_ed_utilization: ModuleWeight;
    B_care_plan: ModuleWeight;
    C_sdoh: ModuleWeight;
    D_chronic: ModuleWeight;
    E_prapare: ModuleWeight;
    F_medication: ModuleWeight;
    G_financial: ModuleWeight;
  };
  sub_weights: {
    A: { emergency_visits: number; recent_ed_pattern: number };
    B: { has_active_careplan: number; care_plan_gap_duration: number };
    C: { sdoh_flag_count: number; sdoh_severity: number };
    D: { chronic_condition_count: number; high_risk_conditions: number };
    E: { prapare_flag_count: number; prapare_severity: number };
    F: {
      on_opioids: number;
      polypharmacy: number;
      high_risk_med_count: number;
    };
    G: { outstanding_debt: number; debt_severity: number };
  };
  top_3_critical_features: Array<{
    feature: string;
    module: string;
    clinical_justification: string;
    odds_ratio_estimate: string;
  }>;
  triage_thresholds: {
    high_bucket_min_score: number;
    medium_bucket_min_score: number;
    rationale: string;
  };
  weights_sum_check: number;
}

interface CalibrationResult extends CalibrationWeights {
  source: "groq" | "fallback";
  top_modules: string;
}

interface PatientProfile {
  conditions: string[];
  medications: string[];
  sdoh: string[];
  prapare: string[];
  outstanding_debt: number;
  recent_ed_visits: number;
  care_plan_gap_months: number;
  sdoh_count: number;
  has_severe_sdoh: 0 | 1;
  prapare_count: number;
  prapare_severity: number;
  on_opioids: 0 | 1;
  polypharmacy: 0 | 1;
  high_risk_med_count: number;
  has_high_risk_conditions: 0 | 1;
}

interface SentinelOutput {
  score: number;
  bucket: "High" | "Medium" | "Low";
  priority: "P0" | "P1" | "P2";
  tags: string[];
  top_driver: string;
  breakdown: Record<"A" | "B" | "C" | "D" | "E" | "F" | "G", number>;
  triage: "TRIAGE" | "IGNORE";
}

interface CoordinatorOutput {
  risk_summary: string;
  top_barriers: Array<{
    barrier: string;
    evidence: string;
    actionability: "High" | "Medium" | "Low";
  }>;
  recommended_intervention: {
    action: string;
    rationale: string;
    talking_points: string[];
  };
  patient_facing_outreach?: string;
  priority: string;
  priority_reason: string;
  rag_lessons_applied?: string[];
  confidence: number;
  grounding_check: "GROUNDED";
}

interface RiskReviewOutput {
  stance: "Aligned" | "Possibly under-scored" | "Possibly over-scored" | "Needs human review";
  clinical_take: string;
  score_commentary: string;
  supporting_evidence: string[];
  watchouts: string[];
  human_review_flag: boolean;
  confidence: number;
  grounding_check: "GROUNDED";
}

interface AskResponse {
  answer: string;
  evidence: string[];
  queries: Array<{
    label: string;
    sql: string;
    rowCount: number;
  }>;
  followUp: string;
}

interface AskQueryResult {
  label: string;
  sql: string;
  rows: Record<string, unknown>[];
  error: string;
}

interface AskPatientTarget {
  id: string;
  name: string;
}

interface RagContext {
  approved: Array<Record<string, unknown>>;
  rejected: Array<Record<string, unknown>>;
  corrected: Array<Record<string, unknown>>;
  semantic: Array<Record<string, unknown>>;
  history: Record<string, unknown> | null;
  notes: Array<Record<string, unknown>>;
}

interface PatientRisk {
  patient: SummaryRow;
  displayName: string;
  score: number;
  riskLevel: string;
  scoreItems: ScoreItem[];
  barriers: string[];
  clinicalDrivers: string[];
  sdohConditions: string[];
  prapareSignals: string[];
  medicationSignals: {
    activeMedCount: number;
    opioidMedications: string[];
    polypharmacy: boolean;
  };
  financialSignals: {
    totalOutstanding: number;
    lowIncome: boolean;
  };
  recentEd: EncounterRow[];
  sentinel: SentinelOutput;
  coordinator: CoordinatorOutput;
  riskReview: RiskReviewOutput;
  calibrationSource: "groq" | "fallback";
  outreachDraft: string;
  draftSource: "groq" | "deterministic";
}

interface RankedPatient {
  patient: SummaryRow;
  displayName: string;
  score: number;
  riskLevel: SentinelOutput["bucket"];
  priority: SentinelOutput["priority"];
  topDriver: string;
  tags: string[];
  breakdown: SentinelOutput["breakdown"];
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

type GroqPurpose = "default" | "ask" | "coordinator" | "calibration";

const DEFAULT_DATA_API =
  "https://uic-hackathon-data.christian-7f4.workers.dev/query";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const EMBEDDING_DIMENSIONS = 128;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_bucket TEXT NOT NULL,
  priority TEXT NOT NULL,
  tags TEXT NOT NULL,
  breakdown TEXT NOT NULL,
  action TEXT NOT NULL,
  original_rec TEXT NOT NULL,
  human_edit TEXT,
  final_rec TEXT,
  rejection_reason TEXT,
  coordinator_notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_history (
  patient_id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  times_searched INTEGER DEFAULT 0,
  last_searched TEXT,
  last_action TEXT,
  total_approvals INTEGER DEFAULT 0,
  total_modifications INTEGER DEFAULT 0,
  total_rejections INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rag_examples (
  id TEXT PRIMARY KEY,
  outcome TEXT NOT NULL,
  patient_tags TEXT NOT NULL,
  top_driver TEXT NOT NULL,
  risk_bucket TEXT NOT NULL,
  original_rec TEXT NOT NULL,
  human_correction TEXT,
  final_rec TEXT,
  rejection_reason TEXT,
  lesson TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS coordinator_notes (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  note TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decision_embeddings (
  id TEXT PRIMARY KEY,
  rag_id TEXT NOT NULL,
  patient_id TEXT,
  patient_name TEXT,
  outcome TEXT NOT NULL,
  risk_bucket TEXT NOT NULL,
  top_driver TEXT NOT NULL,
  patient_tags TEXT NOT NULL,
  source_text TEXT NOT NULL,
  vector TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rag_outcome ON rag_examples(outcome);
CREATE INDEX IF NOT EXISTS idx_rag_bucket ON rag_examples(risk_bucket);
CREATE INDEX IF NOT EXISTS idx_rag_driver ON rag_examples(top_driver);
CREATE INDEX IF NOT EXISTS idx_decisions_pid ON decisions(patient_id);
CREATE INDEX IF NOT EXISTS idx_notes_pid ON coordinator_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_embedding_rag ON decision_embeddings(rag_id);
CREATE INDEX IF NOT EXISTS idx_embedding_bucket ON decision_embeddings(risk_bucket);
CREATE INDEX IF NOT EXISTS idx_embedding_driver ON decision_embeddings(top_driver);
`;

const WEIGHT_CALIBRATION_PROMPT = `
You are a clinical data scientist and medical informaticist with expertise in
preventable ED utilization, social determinants of health, and population health
risk stratification.

Your task is to analyze the available patient features from a healthcare dataset
and assign evidence-based weights for predicting PREVENTABLE ED VISITS.

AVAILABLE FEATURE MODULES:

MODULE A: ED UTILIZATION HISTORY
- emergency_visits: Total lifetime ED visit count
- recent_ed_pattern: Visits in the most recent 6-month window relative to this synthetic record
- Prior ED use is the strongest predictor of future ED use.

MODULE B: CARE PLAN STATUS
- has_active_careplan: Binary active care plan status
- care_plan_gap_duration: Months since care plan was active, capped at 24
- Absence of care planning is directly actionable by coordinators.

MODULE C: SOCIAL DETERMINANTS OF HEALTH
- sdoh_flag_count: Active SDOH conditions
- sdoh_severity: High-severity flags such as IPV, homelessness, justice involvement
- SDOH strongly shapes whether outpatient care is reachable.

MODULE D: CHRONIC CONDITION BURDEN
- chronic_condition_count: Active chronic diagnoses
- high_risk_conditions: Diabetes, CHF, COPD, CKD, substance use, overdose, chronic pain
- Multimorbidity increases ED conversion risk.

MODULE E: PRAPARE SCREENING FLAGS
- prapare_flag_count: Food, transportation, housing, education, health-care access, financial strain
- prapare_severity: Multiple or high-severity social needs from screening
- PRAPARE needs predict ED utilization and are coordinator-actionable.

MODULE F: MEDICATION RISK
- on_opioids: Active opioid prescription
- polypharmacy: 5+ active medications
- high_risk_med_count: High-alert meds such as opioids, anticoagulants, insulin, benzodiazepines
- Medication risk can trigger reconciliation and follow-up.

MODULE G: FINANCIAL BARRIERS
- outstanding_debt: Total unpaid medical bills
- debt_severity: Debt greater than $10K
- Medical debt is associated with delayed care and ED-as-primary-care use.

YOUR TASK:
1. Assign a weight from 0-100 to each module. Weights must sum exactly to 100.
2. Within each module, assign sub-weights to individual features. Each module's sub-weights must sum to 1.0.
3. Identify the top 3 critical features overall with clinical justification.
4. Set HIGH and MEDIUM triage thresholds on a 0-100 weighted score.
Prefer sensitivity over specificity because missing a high-risk patient is worse than over-triaging.

RESPOND IN THIS EXACT JSON FORMAT. No preamble. No markdown.
{
  "medical_reasoning": {
    "primary_evidence_base": "2-3 sentence summary of the strongest evidence base you used",
    "population_context": "1-2 sentences on why these weights fit a high-utilization Medicaid-like population",
    "key_insight": "1 sentence on the single most important finding that shaped your weights"
  },
  "module_weights": {
    "A_ed_utilization": { "weight": 0, "rationale": "" },
    "B_care_plan":      { "weight": 0, "rationale": "" },
    "C_sdoh":           { "weight": 0, "rationale": "" },
    "D_chronic":        { "weight": 0, "rationale": "" },
    "E_prapare":        { "weight": 0, "rationale": "" },
    "F_medication":     { "weight": 0, "rationale": "" },
    "G_financial":      { "weight": 0, "rationale": "" }
  },
  "sub_weights": {
    "A": { "emergency_visits": 0, "recent_ed_pattern": 0 },
    "B": { "has_active_careplan": 0, "care_plan_gap_duration": 0 },
    "C": { "sdoh_flag_count": 0, "sdoh_severity": 0 },
    "D": { "chronic_condition_count": 0, "high_risk_conditions": 0 },
    "E": { "prapare_flag_count": 0, "prapare_severity": 0 },
    "F": { "on_opioids": 0, "polypharmacy": 0, "high_risk_med_count": 0 },
    "G": { "outstanding_debt": 0, "debt_severity": 0 }
  },
  "top_3_critical_features": [
    {
      "feature": "",
      "module": "",
      "clinical_justification": "",
      "odds_ratio_estimate": ""
    }
  ],
  "triage_thresholds": {
    "high_bucket_min_score": 0,
    "medium_bucket_min_score": 0,
    "rationale": ""
  },
  "weights_sum_check": 100
}
`;

const DEFAULT_CALIBRATION: CalibrationWeights = {
  medical_reasoning: {
    primary_evidence_base:
      "Prior ED utilization, multimorbidity, unmet social needs, and care coordination gaps are repeatedly associated with future avoidable acute care use. The weights emphasize predictors that are both high-signal and actionable during a care coordination intervention.",
    population_context:
      "In a high-utilization Medicaid-like cohort, care access barriers and unmanaged chronic complexity can convert routine outpatient needs into ED visits. The calibration therefore favors sensitivity and gives substantial weight to care-plan gaps and SDOH.",
    key_insight:
      "The strongest preventable-visit signal is frequent ED use combined with no active care plan and documented barriers to outpatient care.",
  },
  module_weights: {
    A_ed_utilization: {
      weight: 28,
      rationale: "Prior ED use is the strongest empirical predictor of future ED use.",
    },
    B_care_plan: {
      weight: 16,
      rationale: "No active care plan is a directly actionable care-management gap.",
    },
    C_sdoh: {
      weight: 14,
      rationale: "Active social barriers explain why primary care may be hard to access.",
    },
    D_chronic: {
      weight: 15,
      rationale: "Multimorbidity raises the chance that symptoms escalate to acute care.",
    },
    E_prapare: {
      weight: 10,
      rationale: "PRAPARE flags add patient-reported context about access needs.",
    },
    F_medication: {
      weight: 9,
      rationale: "Opioids and polypharmacy are actionable medication safety risks.",
    },
    G_financial: {
      weight: 8,
      rationale: "Medical debt can delay outpatient care and push patients toward the ED.",
    },
  },
  sub_weights: {
    A: { emergency_visits: 0.75, recent_ed_pattern: 0.25 },
    B: { has_active_careplan: 0.7, care_plan_gap_duration: 0.3 },
    C: { sdoh_flag_count: 0.55, sdoh_severity: 0.45 },
    D: { chronic_condition_count: 0.55, high_risk_conditions: 0.45 },
    E: { prapare_flag_count: 0.65, prapare_severity: 0.35 },
    F: { on_opioids: 0.45, polypharmacy: 0.35, high_risk_med_count: 0.2 },
    G: { outstanding_debt: 0.45, debt_severity: 0.55 },
  },
  top_3_critical_features: [
    {
      feature: "emergency_visits",
      module: "A",
      clinical_justification:
        "Prior ED utilization is the clearest observed signal that a patient may return to the ED.",
      odds_ratio_estimate: "Strong positive association; exact OR varies by study.",
    },
    {
      feature: "has_active_careplan",
      module: "B",
      clinical_justification:
        "A missing active care plan is an immediately actionable care coordination gap.",
      odds_ratio_estimate: "Not stable across settings.",
    },
    {
      feature: "sdoh_severity",
      module: "C",
      clinical_justification:
        "Severe barriers such as IPV, homelessness, or social isolation can block timely outpatient care.",
      odds_ratio_estimate: "Directionally elevated risk; exact OR varies by need.",
    },
  ],
  triage_thresholds: {
    high_bucket_min_score: 55,
    medium_bucket_min_score: 30,
    rationale:
      "Thresholds are sensitivity-oriented for care coordination: high captures clear outreach priorities, medium captures patients worth review.",
  },
  weights_sum_check: 100,
};

let calibrationPromise: Promise<CalibrationResult> | null = null;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      if (request.method === "GET" && url.pathname === "/") {
        return htmlResponse(renderApp());
      }

      if (request.method === "GET" && (url.pathname === "/trail" || url.pathname === "/decisions")) {
        return htmlResponse(await renderDecisionTrailPage(env));
      }

      if (request.method === "GET" && url.pathname === "/api/health") {
        const calibration = await getCalibration(env);
        return jsonResponse({
          ok: true,
          prompt: "Prompt 1",
          groqConfigured: Boolean(getGroqApiKey(env)),
          groqAskConfigured: Boolean(getGroqApiKey(env, "ask")),
          groqDefaultConfigured: Boolean(getGroqApiKey(env, "default")),
          calibrationSource: calibration.source,
        });
      }

      if (request.method === "POST" && url.pathname === "/api/analyze") {
        return jsonResponse(await handleAnalyze(request, env));
      }

      if (request.method === "POST" && url.pathname === "/api/rank") {
        return jsonResponse(await handleRank(request, env));
      }

      if (request.method === "POST" && url.pathname === "/api/review") {
        return jsonResponse(await handleReview(request, env));
      }

      if (request.method === "POST" && url.pathname === "/api/ask") {
        return jsonResponse(await handleAsk(request, env));
      }

      if (request.method === "GET" && url.pathname === "/api/patient-suggestions") {
        return jsonResponse(await handlePatientSuggestions(url, env));
      }

      if (request.method === "GET" && url.pathname === "/api/decision-trail") {
        return jsonResponse(await getDecisionTrail(env));
      }

      if (
        request.method === "POST" &&
        (url.pathname === "/decide" || url.pathname === "/api/decide")
      ) {
        return jsonResponse(await handleDecisionLog(request, env));
      }

      if (
        request.method === "GET" &&
        (url.pathname === "/setup" || url.pathname === "/api/setup")
      ) {
        return jsonResponse(await setupMemoryDatabase(env));
      }

      if (
        request.method === "GET" &&
        (url.pathname === "/rag/stats" || url.pathname === "/api/rag/stats")
      ) {
        return jsonResponse(await getRagStats(env));
      }

      if (
        request.method === "GET" &&
        (url.pathname.startsWith("/history/") || url.pathname.startsWith("/api/history/"))
      ) {
        const patientId = decodeURIComponent(url.pathname.split("/").pop() || "");
        return jsonResponse(await getPatientMemory(env, patientId));
      }

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return jsonResponse({ error: message }, 500);
    }
  },
};

async function handleAnalyze(
  request: Request,
  env: Env,
): Promise<{
  patients: PatientRisk[];
  generatedAt: string;
  mode: string;
  calibration: {
    source: "groq" | "fallback";
    top_modules: string;
    key_insight: string;
  };
}> {
  const body = await readJsonObject(request);
  const limit = clampNumber(body.limit, 1, 8, 5);
  const patientId =
    typeof body.patientId === "string" ? body.patientId.trim() : "";
  const patientQuery =
    typeof body.patientQuery === "string" ? body.patientQuery.trim() : "";
  const calibration = await getCalibration(env);
  const candidates = patientId
    ? await findPatientById(env, patientId)
    : patientQuery
      ? await findPatientsByName(env, patientQuery, Math.max(limit, 5))
      : await findPopulationCandidates(env, Math.max(limit * 2, 8));

  const profiles = await Promise.all(
    candidates.slice(0, Math.max(limit * 2, 8)).map((patient) =>
      buildPatientRisk(env, patient, calibration),
    ),
  );

  const patients = profiles
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    patients,
    generatedAt: new Date().toISOString(),
    mode: patientId || patientQuery ? "patient-search" : "population-scan",
    calibration: {
      source: calibration.source,
      top_modules: calibration.top_modules,
      key_insight: calibration.medical_reasoning.key_insight,
    },
  };
}

async function handleRank(
  request: Request,
  env: Env,
): Promise<{
  patients: RankedPatient[];
  generatedAt: string;
  mode: string;
  calibration: {
    source: "groq" | "fallback";
    top_modules: string;
    key_insight: string;
  };
}> {
  const body = await readJsonObject(request);
  const limit = clampNumber(body.limit, 1, 20, 10);
  const calibration = await getCalibration(env);
  const patients = await rankPopulationPatients(env, calibration, limit);

  return {
    patients,
    generatedAt: new Date().toISOString(),
    mode: "population-ranking",
    calibration: {
      source: calibration.source,
      top_modules: calibration.top_modules,
      key_insight: calibration.medical_reasoning.key_insight,
    },
  };
}

async function handleReview(
  request: Request,
  env: Env,
): Promise<{
  status: string;
  finalDraft?: string;
  revisedDraft?: string;
  auditMessage: string;
  memorySaved: boolean;
  memoryError?: string;
}> {
  const body = await readJsonObject(request);
  const action = typeof body.action === "string" ? body.action.toLowerCase() : "";
  const patientName =
    typeof body.patientName === "string" ? body.patientName : "this patient";
  const currentDraft =
    typeof body.currentDraft === "string" ? body.currentDraft : "";
  const patient =
    body.patient && typeof body.patient === "object" && !Array.isArray(body.patient)
      ? (body.patient as Partial<SummaryRow>)
      : null;
  const sentinel =
    body.sentinel && typeof body.sentinel === "object" && !Array.isArray(body.sentinel)
      ? (body.sentinel as SentinelOutput)
      : null;
  const originalRec =
    body.originalRec && typeof body.originalRec === "object" && !Array.isArray(body.originalRec)
      ? body.originalRec
      : { outreachDraft: currentDraft };
  const barriers = Array.isArray(body.barriers)
    ? body.barriers.filter((item): item is string => typeof item === "string")
    : [];

  if (action === "approve") {
    const memory = await logDecisionBestEffort(env, {
      patient,
      patientName,
      sentinel,
      originalRec,
      action: "approved",
      finalRec: originalRec,
      coordinatorNotes: readOptionalString(body.note),
    });
    return {
      status: "approved",
      finalDraft: currentDraft,
      auditMessage: `Coordinator approved outreach for ${patientName}.${memory.saved ? " Saved to Decision Trail." : ""}`,
      memorySaved: memory.saved,
      memoryError: memory.error,
    };
  }

  if (action === "reject") {
    const rejectionReason = readOptionalString(body.note);
    const memory = await logDecisionBestEffort(env, {
      patient,
      patientName,
      sentinel,
      originalRec,
      action: "rejected",
      rejectionReason,
      coordinatorNotes: rejectionReason,
    });
    return {
      status: "rejected",
      auditMessage: `Coordinator rejected outreach for ${patientName}; move to the next ranked patient.${memory.saved ? " Saved to Decision Trail." : ""}`,
      memorySaved: memory.saved,
      memoryError: memory.error,
    };
  }

  if (action === "modify") {
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (!note) {
      throw new Error("A modification note is required.");
    }

    const deterministic = reviseDraft(currentDraft, note, barriers);
    const revisedDraft =
      (await reviseWithGroq(env, {
        patientName,
        currentDraft,
        note,
        barriers,
      })) ?? deterministic;
    const finalRec = { revisedDraft, humanEdit: note };

    const memory = await logDecisionBestEffort(env, {
      patient,
      patientName,
      sentinel,
      originalRec,
      action: "modified",
      humanEdit: note,
      finalRec,
      coordinatorNotes: note,
    });

    return {
      status: "modified",
      revisedDraft,
      auditMessage: `Coordinator modified outreach for ${patientName}: ${note}${memory.saved ? " Saved to Decision Trail." : ""}`,
      memorySaved: memory.saved,
      memoryError: memory.error,
    };
  }

  throw new Error("Unknown review action.");
}

async function handleAsk(request: Request, env: Env): Promise<AskResponse> {
  const body = await readJsonObject(request);
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    throw new Error("Ask a question first.");
  }

  const selectedPatient = compactJson(body.selectedPatient, 9000);
  const rankedPatients = compactJson(body.rankedPatients, 5000);
  const askRagPacket = await buildAskRagPacket(
    env,
    question,
    body.selectedPatient,
    body.rankedPatients,
  );

  const deterministicRiskCount = await answerRiskBucketCountQuestion(
    env,
    question,
    body.rankedPatients,
  );
  if (deterministicRiskCount) {
    return deterministicRiskCount;
  }

  const directDatabaseAnswer = await answerDirectDatabaseQuestion(
    env,
    question,
    body.selectedPatient,
  );
  if (directDatabaseAnswer) {
    return directDatabaseAnswer;
  }

  if (!getGroqApiKey(env, "ask")) {
    return {
      answer:
        "Groq is not configured for the Ask Agent, so I can only use the visible dashboard. Select a patient and I can summarize the Sentinel score, top barriers, and outreach recommendation shown on screen.",
      evidence: [],
      queries: [],
      followUp: "Configure GROQ_API_KEY_ASK or GROQ_API_KEY to enable open-ended questions.",
    };
  }

  if (question.toLowerCase().match(/\blearn|memory|rag|decision history|past decision|approved|rejected|modified/)) {
    const memoryAnswer = await answerMemoryQuestion(env, question);
    if (memoryAnswer) {
      return memoryAnswer;
    }
  }

  const plan = shouldAnswerFromAskRag(question, askRagPacket)
    ? []
    : await buildQuestionQueryPlan(
      env,
      question,
      selectedPatient,
      rankedPatients,
      compactJson(askRagPacket, 12000),
    );
  const queryResults = await Promise.all(
    plan.map(async (item) => {
      const sql = normalizeGeneratedSql(item.sql);
      if (!sql) {
        return {
          label: item.label,
          sql: item.sql,
          rows: [],
          error: "Rejected non-SELECT or unsafe SQL.",
        };
      }
      try {
        return {
          label: item.label,
          sql,
          rows: await queryDatabase<Record<string, unknown>>(env, sql),
          error: "",
        };
      } catch (error) {
        return {
          label: item.label,
          sql,
          rows: [],
          error: error instanceof Error ? error.message : "Query failed.",
        };
      }
    }),
  );

  const answer = await answerQuestionWithGroq(
    env,
    question,
    selectedPatient,
    rankedPatients,
    askRagPacket,
    queryResults,
  );

  return {
    ...answer,
    queries: [
      ...describeAskRagLookups(askRagPacket),
      ...queryResults
      .filter((item) => !item.error)
      .map((item) => ({
        label: item.label,
        sql: item.sql,
        rowCount: item.rows.length,
      })),
    ],
  };
}

async function handlePatientSuggestions(
  url: URL,
  env: Env,
): Promise<{
  suggestions: Array<{
    id: string;
    name: string;
    age: number | null;
    ed_visits: number;
    chronic_condition_count: number;
    has_active_careplan: number;
  }>;
}> {
  const query = (url.searchParams.get("q") || "").trim();
  if (query.length < 2) {
    return { suggestions: [] };
  }

  const patients = await findPatientsByName(env, query, 8);
  return {
    suggestions: patients.map((patient) => ({
      id: patient.id,
      name: cleanName(patient.first, patient.last),
      age: patient.age,
      ed_visits: patient.ed_visits,
      chronic_condition_count: patient.chronic_condition_count,
      has_active_careplan: patient.has_active_careplan,
    })),
  };
}

async function handleDecisionLog(
  request: Request,
  env: Env,
): Promise<{ success: boolean; message: string }> {
  const body = await readJsonObject(request);
  const patient =
    body.patient && typeof body.patient === "object" && !Array.isArray(body.patient)
      ? (body.patient as Partial<SummaryRow>)
      : null;
  const sentinel =
    body.sentinel && typeof body.sentinel === "object" && !Array.isArray(body.sentinel)
      ? (body.sentinel as SentinelOutput)
      : null;
  const action = readString(body.action, "").toLowerCase();
  if (action !== "approved" && action !== "modified" && action !== "rejected") {
    throw new Error("Decision action must be approved, modified, or rejected.");
  }
  if (!patient?.id || !sentinel) {
    throw new Error("Decision log requires patient and sentinel payloads.");
  }

  await logDecision(env, {
    patient: patient as Partial<SummaryRow> & { id: string },
    patientName: readString(body.patientName, cleanName(patient.first || "", patient.last || "")),
    sentinel,
    originalRec: body.originalRec || {},
    action,
    humanEdit: readOptionalString(body.humanEdit),
    finalRec: body.finalRec || null,
    rejectionReason: readOptionalString(body.rejectionReason),
    coordinatorNotes: readOptionalString(body.coordinatorNotes),
  });

  return { success: true, message: "Decision stored in D1 memory." };
}

async function findPopulationCandidates(
  env: Env,
  limit: number,
): Promise<SummaryRow[]> {
  const sql = `
    SELECT id, first, last, age, gender, race, ethnicity, income, city, state, zip,
           total_visits, ed_visits, inpatient_visits, ed_inpatient_total_cost,
           chronic_condition_count, has_active_careplan
    FROM patient_summary
    WHERE ed_visits > 0
    ORDER BY
      CASE WHEN has_active_careplan = 0 THEN 1 ELSE 0 END DESC,
      ed_visits DESC,
      chronic_condition_count DESC,
      ed_inpatient_total_cost DESC
    LIMIT ${limit}
  `;
  return queryDatabase<SummaryRow>(env, sql);
}

async function findPatientsByName(
  env: Env,
  query: string,
  limit: number,
): Promise<SummaryRow[]> {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 4);

  if (tokens.length === 0) {
    return findPopulationCandidates(env, limit);
  }

  const where = tokens
    .map((token) => {
      const safe = escapeSql(token);
      return `(LOWER(first) LIKE '%${safe}%' OR LOWER(last) LIKE '%${safe}%')`;
    })
    .join(" AND ");

  const sql = `
    SELECT id, first, last, age, gender, race, ethnicity, income, city, state, zip,
           total_visits, ed_visits, inpatient_visits, ed_inpatient_total_cost,
           chronic_condition_count, has_active_careplan
    FROM patient_summary
    WHERE ${where}
    ORDER BY ed_visits DESC, chronic_condition_count DESC
    LIMIT ${limit}
  `;
  return queryDatabase<SummaryRow>(env, sql);
}

async function findPatientById(env: Env, id: string): Promise<SummaryRow[]> {
  const safeId = escapeSql(id);
  const sql = `
    SELECT id, first, last, age, gender, race, ethnicity, income, city, state, zip,
           total_visits, ed_visits, inpatient_visits, ed_inpatient_total_cost,
           chronic_condition_count, has_active_careplan
    FROM patient_summary
    WHERE id = '${safeId}'
    LIMIT 1
  `;
  return queryDatabase<SummaryRow>(env, sql);
}

async function findRankingCandidates(
  env: Env,
  limit: number,
): Promise<SummaryRow[]> {
  const sql = `
    SELECT id, first, last, age, gender, race, ethnicity, income, city, state, zip,
           total_visits, ed_visits, inpatient_visits, ed_inpatient_total_cost,
           chronic_condition_count, has_active_careplan
    FROM patient_summary
    WHERE ed_visits > 0
       OR has_active_careplan = 0
       OR chronic_condition_count >= 5
    ORDER BY
      ed_visits DESC,
      CASE WHEN has_active_careplan = 0 THEN 1 ELSE 0 END DESC,
      chronic_condition_count DESC,
      ed_inpatient_total_cost DESC
    LIMIT ${limit}
  `;
  return queryDatabase<SummaryRow>(env, sql);
}

async function rankPopulationPatients(
  env: Env,
  calibration: CalibrationResult,
  limit: number,
): Promise<RankedPatient[]> {
  const candidateLimit = Math.max(limit * 5, 60);
  const candidates = await findRankingCandidates(env, Math.min(candidateLimit, 120));
  if (!candidates.length) {
    return [];
  }

  const idsSql = candidates
    .map((patient) => `'${escapeSql(patient.id)}'`)
    .join(", ");

  const sdohExpr = sqlLikeAny("LOWER(DESCRIPTION)", [
    "homeless",
    "housing",
    "employment",
    "unemployed",
    "social isolation",
    "limited social",
    "intimate partner",
    "abuse",
    "violence",
    "food",
  ]);
  const severeSdohExpr = sqlLikeAny("LOWER(DESCRIPTION)", [
    "homeless",
    "intimate partner",
    "abuse",
    "violence",
    "jail",
    "criminal",
  ]);
  const highRiskConditionExpr = sqlLikeAny("LOWER(DESCRIPTION)", [
    "diabetes",
    "heart failure",
    "congestive",
    "copd",
    "chronic obstructive",
    "kidney",
    "renal",
    "substance",
    "overdose",
    "opioid",
    "chronic pain",
    "migraine",
  ]);
  const observationExpr = [
    "housing",
    "transport",
    "car",
    "ride",
    "food",
    "stress",
    "work",
    "employment",
    "prapare",
    "money",
    "medicine",
    "health care",
  ].map((term) =>
    `(LOWER(DESCRIPTION) LIKE '%${escapeSql(term)}%' OR LOWER(VALUE) LIKE '%${escapeSql(term)}%')`
  ).join(" OR ");
  const observationText = "LOWER(COALESCE(DESCRIPTION,'') || ' ' || COALESCE(VALUE,''))";
  const prapareSevereExpr = sqlLikeAny(observationText, [
    "homeless",
    "unable to get",
    "food",
    "medicine",
    "health care",
    "quite a bit",
    "very much",
  ]);
  const opioidExpr = sqlLikeAny("LOWER(DESCRIPTION)", [
    "opioid",
    "oxycodone",
    "hydrocodone",
    "morphine",
    "fentanyl",
    "tramadol",
    "codeine",
    "buprenorphine",
    "methadone",
  ]);
  const highRiskMedExpr = sqlLikeAny("LOWER(DESCRIPTION)", [
    "opioid",
    "oxycodone",
    "hydrocodone",
    "morphine",
    "fentanyl",
    "tramadol",
    "warfarin",
    "insulin",
    "benzodiazepine",
    "diazepam",
    "alprazolam",
    "clonazepam",
  ]);

  const [
    conditionRows,
    observationRows,
    medicationRows,
    debtRows,
    recentEdRows,
    carePlanRows,
  ] = await Promise.all([
    queryDatabase<Record<string, unknown>>(
      env,
      `
        SELECT PATIENT,
               SUM(CASE WHEN ${sdohExpr} THEN 1 ELSE 0 END) AS sdoh_count,
               MAX(CASE WHEN ${severeSdohExpr} THEN 1 ELSE 0 END) AS severe_sdoh,
               MAX(CASE WHEN ${highRiskConditionExpr} THEN 1 ELSE 0 END) AS high_risk_condition
        FROM conditions
        WHERE STOP IS NULL AND PATIENT IN (${idsSql})
        GROUP BY PATIENT
      `,
    ),
    queryDatabase<Record<string, unknown>>(
      env,
      `
        SELECT PATIENT,
               COUNT(*) AS prapare_count,
               MAX(CASE WHEN ${prapareSevereExpr} THEN 1 ELSE 0 END) AS prapare_severe
        FROM observations
        WHERE PATIENT IN (${idsSql})
          AND (${observationExpr})
        GROUP BY PATIENT
      `,
    ),
    queryDatabase<Record<string, unknown>>(
      env,
      `
        SELECT PATIENT,
               COUNT(*) AS active_med_count,
               SUM(CASE WHEN ${opioidExpr} THEN 1 ELSE 0 END) AS opioid_count,
               SUM(CASE WHEN ${highRiskMedExpr} THEN 1 ELSE 0 END) AS high_risk_med_count
        FROM medications
        WHERE STOP IS NULL AND PATIENT IN (${idsSql})
        GROUP BY PATIENT
      `,
    ),
    queryDatabase<Record<string, unknown>>(
      env,
      `
        SELECT PATIENTID,
               ROUND(SUM(OUTSTANDING), 2) AS total_outstanding
        FROM claims_transactions
        WHERE PATIENTID IN (${idsSql})
        GROUP BY PATIENTID
      `,
    ),
    queryDatabase<Record<string, unknown>>(
      env,
      `
        SELECT e.PATIENT,
               COUNT(*) AS recent_ed_visits
        FROM encounters e
        JOIN (
          SELECT PATIENT, MAX(START) AS latest_start
          FROM encounters
          WHERE ENCOUNTERCLASS = 'emergency'
            AND PATIENT IN (${idsSql})
          GROUP BY PATIENT
        ) latest ON latest.PATIENT = e.PATIENT
        WHERE e.ENCOUNTERCLASS = 'emergency'
          AND e.PATIENT IN (${idsSql})
          AND (julianday(latest.latest_start) - julianday(e.START)) <= 183
        GROUP BY e.PATIENT
      `,
    ),
    queryDatabase<Record<string, unknown>>(
      env,
      `
        SELECT PATIENT,
               MAX(COALESCE(STOP, START)) AS latest_plan_date
        FROM careplans
        WHERE PATIENT IN (${idsSql})
        GROUP BY PATIENT
      `,
    ),
  ]);

  const conditionByPatient = indexRowsById(conditionRows, "PATIENT");
  const observationByPatient = indexRowsById(observationRows, "PATIENT");
  const medicationByPatient = indexRowsById(medicationRows, "PATIENT");
  const debtByPatient = indexRowsById(debtRows, "PATIENTID");
  const recentEdByPatient = indexRowsById(recentEdRows, "PATIENT");
  const carePlanByPatient = indexRowsById(carePlanRows, "PATIENT");

  return candidates
    .map((patient) => {
      const condition = conditionByPatient.get(patient.id) || {};
      const observation = observationByPatient.get(patient.id) || {};
      const medication = medicationByPatient.get(patient.id) || {};
      const debt = debtByPatient.get(patient.id) || {};
      const recentEd = recentEdByPatient.get(patient.id) || {};
      const carePlan = carePlanByPatient.get(patient.id) || {};

      const prapareCount = rowNumber(observation, "prapare_count", "PRAPARE_COUNT");
      const prapareSevere = rowNumber(observation, "prapare_severe", "PRAPARE_SEVERE");
      const activeMedCount = rowNumber(medication, "active_med_count", "ACTIVE_MED_COUNT");
      const sdohCount = rowNumber(condition, "sdoh_count", "SDOH_COUNT");
      const severeSdoh = rowNumber(condition, "severe_sdoh", "SEVERE_SDOH") || prapareSevere;
      const profile: PatientProfile = {
        conditions: [],
        medications: [],
        sdoh: [],
        prapare: [],
        outstanding_debt: rowNumber(debt, "total_outstanding", "TOTAL_OUTSTANDING"),
        recent_ed_visits: rowNumber(recentEd, "recent_ed_visits", "RECENT_ED_VISITS"),
        care_plan_gap_months: calculateCarePlanGapMonthsFromDate(
          patient,
          rowString(carePlan, "latest_plan_date", "LATEST_PLAN_DATE"),
        ),
        sdoh_count: sdohCount,
        has_severe_sdoh: severeSdoh > 0 ? 1 : 0,
        prapare_count: prapareCount,
        prapare_severity: Math.min(prapareCount + prapareSevere, 3),
        on_opioids: rowNumber(medication, "opioid_count", "OPIOID_COUNT") > 0 ? 1 : 0,
        polypharmacy: activeMedCount >= 5 ? 1 : 0,
        high_risk_med_count: rowNumber(medication, "high_risk_med_count", "HIGH_RISK_MED_COUNT"),
        has_high_risk_conditions: rowNumber(condition, "high_risk_condition", "HIGH_RISK_CONDITION") > 0 ? 1 : 0,
      };
      const sentinel = sentinelScore(patient, profile, calibration);
      return {
        patient,
        displayName: cleanName(patient.first, patient.last),
        score: sentinel.score,
        riskLevel: sentinel.bucket,
        priority: sentinel.priority,
        topDriver: sentinel.top_driver,
        tags: sentinel.tags,
        breakdown: sentinel.breakdown,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function buildPatientRisk(
  env: Env,
  patient: SummaryRow,
  calibration: CalibrationResult,
): Promise<PatientRisk> {
  const patientId = escapeSql(patient.id);
  const [
    activeConditions,
    socialObservations,
    activeMedications,
    debtRows,
    edHistory,
    carePlans,
  ] = await Promise.all([
    queryDatabase<ConditionRow>(
      env,
      `
        SELECT DESCRIPTION, START
        FROM conditions
        WHERE PATIENT = '${patientId}' AND STOP IS NULL
        ORDER BY START DESC
        LIMIT 80
      `,
    ),
    queryDatabase<ObservationRow>(
      env,
      `
        SELECT DATE, DESCRIPTION, VALUE
        FROM observations
        WHERE PATIENT = '${patientId}'
          AND (
            LOWER(DESCRIPTION) LIKE '%housing%'
            OR LOWER(DESCRIPTION) LIKE '%transport%'
            OR LOWER(DESCRIPTION) LIKE '%car%'
            OR LOWER(DESCRIPTION) LIKE '%ride%'
            OR LOWER(DESCRIPTION) LIKE '%food%'
            OR LOWER(DESCRIPTION) LIKE '%stress%'
            OR LOWER(DESCRIPTION) LIKE '%work%'
            OR LOWER(DESCRIPTION) LIKE '%employment%'
            OR LOWER(DESCRIPTION) LIKE '%prapare%'
          )
        ORDER BY DATE DESC
        LIMIT 25
      `,
    ),
    queryDatabase<MedicationRow>(
      env,
      `
        SELECT DESCRIPTION
        FROM medications
        WHERE PATIENT = '${patientId}' AND STOP IS NULL
        ORDER BY START DESC
        LIMIT 80
      `,
    ),
    queryDatabase<DebtRow>(
      env,
      `
        SELECT ROUND(SUM(OUTSTANDING), 2) AS total_outstanding
        FROM claims_transactions
        WHERE PATIENTID = '${patientId}'
        LIMIT 1
      `,
    ),
    queryDatabase<EncounterRow>(
      env,
      `
        SELECT START, DESCRIPTION, REASONDESCRIPTION, TOTAL_CLAIM_COST
        FROM encounters
        WHERE PATIENT = '${patientId}' AND ENCOUNTERCLASS = 'emergency'
        ORDER BY START DESC
        LIMIT 80
      `,
    ),
    queryDatabase<CarePlanRow>(
      env,
      `
        SELECT START, STOP, DESCRIPTION
        FROM careplans
        WHERE PATIENT = '${patientId}'
        ORDER BY START DESC
        LIMIT 20
      `,
    ),
  ]);

  const sdohConditions = activeConditions
    .map((row) => row.DESCRIPTION)
    .filter(isSdohCondition);

  const prapareSignals = socialObservations
    .filter(isAdverseObservation)
    .map((row) => `${row.DESCRIPTION}: ${row.VALUE}`);

  const barriers = buildBarrierList(
    patient,
    sdohConditions,
    prapareSignals,
    debtRows,
  );
  const clinicalDrivers = activeConditions
    .map((row) => row.DESCRIPTION)
    .filter((description) => !isSdohCondition(description))
    .filter((description) => !isCareProcessSignal(description))
    .slice(0, 6);
  const opioidMedications = activeMedications
    .map((row) => row.DESCRIPTION)
    .filter(isOpioidMedication);
  const activeMedCount = activeMedications.length;
  const totalOutstanding = normalizeNumber(
    debtRows[0]?.total_outstanding ?? debtRows[0]?.TOTAL_OUTSTANDING ?? 0,
  );
  const profile: PatientProfile = {
    conditions: clinicalDrivers,
    medications: activeMedications.map((row) => row.DESCRIPTION),
    sdoh: sdohConditions,
    prapare: prapareSignals,
    outstanding_debt: totalOutstanding,
    recent_ed_visits: countRecentEdVisits(edHistory),
    care_plan_gap_months: calculateCarePlanGapMonths(patient, carePlans),
    sdoh_count: sdohConditions.length,
    has_severe_sdoh: hasSevereSdoh(sdohConditions, prapareSignals),
    prapare_count: prapareSignals.length,
    prapare_severity: calculatePrapareSeverity(prapareSignals),
    on_opioids: opioidMedications.length > 0 ? 1 : 0,
    polypharmacy: activeMedCount >= 5 ? 1 : 0,
    high_risk_med_count: countHighRiskMedications(activeMedications),
    has_high_risk_conditions: hasHighRiskConditions(activeConditions) ? 1 : 0,
  };

  const sentinel = sentinelScore(patient, profile, calibration);
  const [riskReview, coordinator] = await Promise.all([
    buildRiskReviewOutput(env, patient, profile, sentinel, calibration),
    buildCoordinatorOutput(
      env,
      patient,
      profile,
      sentinel,
      calibration,
    ),
  ]);
  const scoreItems = buildScoreItems(sentinel, calibration, profile, patient);
  const score = sentinel.score;
  const riskLevel = sentinel.bucket;

  const displayName = cleanName(patient.first, patient.last);
  const baseProfile: PatientRisk = {
    patient,
    displayName,
    score,
    riskLevel,
    scoreItems,
    barriers,
    clinicalDrivers,
    sdohConditions,
    prapareSignals,
    medicationSignals: {
      activeMedCount,
      opioidMedications,
      polypharmacy: activeMedCount >= 5,
    },
    financialSignals: {
      totalOutstanding,
      lowIncome: normalizeNumber(patient.income) > 0 && normalizeNumber(patient.income) < 20000,
    },
    recentEd: edHistory.slice(0, 5),
    sentinel,
    coordinator,
    riskReview,
    calibrationSource: calibration.source,
    outreachDraft: formatCoordinatorDraft(patient, coordinator),
    draftSource: coordinator.grounding_check === "GROUNDED" && calibration.source === "groq"
      ? "groq"
      : "deterministic",
  };

  return baseProfile;
}

async function getCalibration(env: Env): Promise<CalibrationResult> {
  if (!calibrationPromise) {
    calibrationPromise = calibrateWeights(env);
  }
  return calibrationPromise;
}

async function calibrateWeights(env: Env): Promise<CalibrationResult> {
  const groqCalibration = await calibrateWithGroq(env);
  if (groqCalibration) {
    return {
      ...groqCalibration,
      source: "groq",
      top_modules: topModules(groqCalibration),
    };
  }

  return {
    ...DEFAULT_CALIBRATION,
    source: "fallback",
    top_modules: topModules(DEFAULT_CALIBRATION),
  };
}

async function calibrateWithGroq(env: Env): Promise<CalibrationWeights | null> {
  const data = await callGroq(env, [
    {
      role: "system",
      content:
        "Return strict JSON only. Do not include markdown fences or commentary.",
    },
    { role: "user", content: WEIGHT_CALIBRATION_PROMPT },
  ], 1500, "calibration");

  if (!data) {
    return null;
  }

  const parsed = parseJsonObject(data);
  if (!parsed) {
    return null;
  }

  return normalizeCalibration(parsed);
}

function normalizeCalibration(raw: Record<string, unknown>): CalibrationWeights | null {
  const fallback = DEFAULT_CALIBRATION;
  const moduleWeights = raw.module_weights as Record<string, unknown> | undefined;
  const subWeights = raw.sub_weights as Record<string, unknown> | undefined;
  const thresholds = raw.triage_thresholds as Record<string, unknown> | undefined;

  if (!moduleWeights || !subWeights || !thresholds) {
    return null;
  }

  const calibration: CalibrationWeights = {
    medical_reasoning: {
      primary_evidence_base: readString(
        (raw.medical_reasoning as Record<string, unknown> | undefined)?.primary_evidence_base,
        fallback.medical_reasoning.primary_evidence_base,
      ),
      population_context: readString(
        (raw.medical_reasoning as Record<string, unknown> | undefined)?.population_context,
        fallback.medical_reasoning.population_context,
      ),
      key_insight: readString(
        (raw.medical_reasoning as Record<string, unknown> | undefined)?.key_insight,
        fallback.medical_reasoning.key_insight,
      ),
    },
    module_weights: {
      A_ed_utilization: readModuleWeight(moduleWeights.A_ed_utilization, fallback.module_weights.A_ed_utilization),
      B_care_plan: readModuleWeight(moduleWeights.B_care_plan, fallback.module_weights.B_care_plan),
      C_sdoh: readModuleWeight(moduleWeights.C_sdoh, fallback.module_weights.C_sdoh),
      D_chronic: readModuleWeight(moduleWeights.D_chronic, fallback.module_weights.D_chronic),
      E_prapare: readModuleWeight(moduleWeights.E_prapare, fallback.module_weights.E_prapare),
      F_medication: readModuleWeight(moduleWeights.F_medication, fallback.module_weights.F_medication),
      G_financial: readModuleWeight(moduleWeights.G_financial, fallback.module_weights.G_financial),
    },
    sub_weights: {
      A: readSubWeights(subWeights.A, fallback.sub_weights.A),
      B: readSubWeights(subWeights.B, fallback.sub_weights.B),
      C: readSubWeights(subWeights.C, fallback.sub_weights.C),
      D: readSubWeights(subWeights.D, fallback.sub_weights.D),
      E: readSubWeights(subWeights.E, fallback.sub_weights.E),
      F: readSubWeights(subWeights.F, fallback.sub_weights.F),
      G: readSubWeights(subWeights.G, fallback.sub_weights.G),
    },
    top_3_critical_features: Array.isArray(raw.top_3_critical_features)
      ? raw.top_3_critical_features
          .map(readCriticalFeature)
          .filter((item): item is CalibrationWeights["top_3_critical_features"][number] => Boolean(item))
          .slice(0, 3)
      : fallback.top_3_critical_features,
    triage_thresholds: {
      high_bucket_min_score: clampNumber(thresholds.high_bucket_min_score, 0, 100, fallback.triage_thresholds.high_bucket_min_score),
      medium_bucket_min_score: clampNumber(thresholds.medium_bucket_min_score, 0, 100, fallback.triage_thresholds.medium_bucket_min_score),
      rationale: readString(thresholds.rationale, fallback.triage_thresholds.rationale),
    },
    weights_sum_check: 100,
  };

  const total = Object.values(calibration.module_weights).reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  if (total <= 0) {
    return fallback;
  }
  if (Math.round(total) !== 100) {
    normalizeModuleWeightsTo100(calibration.module_weights);
  }

  return calibration;
}

function normalizeModuleWeightsTo100(
  weights: CalibrationWeights["module_weights"],
): void {
  const entries = Object.entries(weights) as Array<[keyof CalibrationWeights["module_weights"], ModuleWeight]>;
  const total = entries.reduce((sum, [, value]) => sum + value.weight, 0) || 1;
  let running = 0;
  entries.forEach(([key, value], index) => {
    if (index === entries.length - 1) {
      weights[key].weight = Math.max(0, Number((100 - running).toFixed(2)));
      return;
    }
    const normalized = Number(((value.weight / total) * 100).toFixed(2));
    weights[key].weight = normalized;
    running += normalized;
  });
}

function sentinelScore(
  patient: SummaryRow,
  profile: PatientProfile,
  weights: CalibrationWeights,
): SentinelOutput {
  const w = weights.module_weights;
  const sw = weights.sub_weights;

  const edNorm = Math.min(patient.ed_visits / 50, 1);
  const recentNorm = Math.min((profile.recent_ed_visits || 0) / 10, 1);
  const scoreA =
    (edNorm * sw.A.emergency_visits +
      recentNorm * sw.A.recent_ed_pattern) *
    w.A_ed_utilization.weight;

  const noPlan = patient.has_active_careplan === 0 ? 1 : 0;
  const gapNorm = Math.min((profile.care_plan_gap_months || 0) / 24, 1);
  const scoreB =
    (noPlan * sw.B.has_active_careplan +
      gapNorm * sw.B.care_plan_gap_duration) *
    w.B_care_plan.weight;

  const sdohNorm = Math.min((profile.sdoh_count || 0) / 5, 1);
  const sdohSev = profile.has_severe_sdoh || 0;
  const scoreC =
    (sdohNorm * sw.C.sdoh_flag_count + sdohSev * sw.C.sdoh_severity) *
    w.C_sdoh.weight;

  const condNorm = Math.min(patient.chronic_condition_count / 20, 1);
  const highRisk = profile.has_high_risk_conditions || 0;
  const scoreD =
    (condNorm * sw.D.chronic_condition_count +
      highRisk * sw.D.high_risk_conditions) *
    w.D_chronic.weight;

  const prapNorm = Math.min((profile.prapare_count || 0) / 5, 1);
  const prapSev = Math.min((profile.prapare_severity || 0) / 3, 1);
  const scoreE =
    (prapNorm * sw.E.prapare_flag_count +
      prapSev * sw.E.prapare_severity) *
    w.E_prapare.weight;

  const opioid = profile.on_opioids || 0;
  const poly = profile.polypharmacy || 0;
  const highMed = Math.min((profile.high_risk_med_count || 0) / 3, 1);
  const scoreF =
    (opioid * sw.F.on_opioids +
      poly * sw.F.polypharmacy +
      highMed * sw.F.high_risk_med_count) *
    w.F_medication.weight;

  const debtNorm = Math.min((profile.outstanding_debt || 0) / 100000, 1);
  const debtSev = (profile.outstanding_debt || 0) > 10000 ? 1 : 0;
  const scoreG =
    (debtNorm * sw.G.outstanding_debt + debtSev * sw.G.debt_severity) *
    w.G_financial.weight;

  const total = Math.round(
    scoreA + scoreB + scoreC + scoreD + scoreE + scoreF + scoreG,
  );

  const thresholds = weights.triage_thresholds;
  let bucket: SentinelOutput["bucket"] = "Low";
  let priority: SentinelOutput["priority"] = "P2";
  if (total >= thresholds.high_bucket_min_score) {
    bucket = "High";
    priority = "P0";
  } else if (total >= thresholds.medium_bucket_min_score) {
    bucket = "Medium";
    priority = "P1";
  }

  const breakdown = {
    A: scoreA,
    B: scoreB,
    C: scoreC,
    D: scoreD,
    E: scoreE,
    F: scoreF,
    G: scoreG,
  };
  const topDriver = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "A";
  const moduleNames: Record<string, string> = {
    A: "ED Visit History",
    B: "No Active Care Plan",
    C: "SDOH Barriers",
    D: "Chronic Condition Burden",
    E: "PRAPARE Flags",
    F: "Medication Risk",
    G: "Financial Barriers",
  };

  const tags: string[] = [];
  if (!patient.has_active_careplan) tags.push("no-care-plan");
  if (patient.ed_visits > 10) tags.push("ed-frequent-flyer");
  if (profile.sdoh_count >= 2) tags.push("sdoh-barriers");
  if (profile.on_opioids) tags.push("opioid-rx");
  if (profile.polypharmacy) tags.push("polypharmacy");
  if ((profile.outstanding_debt || 0) > 10000) tags.push("high-debt");
  if (profile.has_high_risk_conditions) tags.push("high-risk-dx");

  return {
    score: total,
    bucket,
    priority,
    tags,
    top_driver: moduleNames[topDriver],
    breakdown: {
      A: Math.round(scoreA),
      B: Math.round(scoreB),
      C: Math.round(scoreC),
      D: Math.round(scoreD),
      E: Math.round(scoreE),
      F: Math.round(scoreF),
      G: Math.round(scoreG),
    },
    triage: bucket === "High" || total >= thresholds.medium_bucket_min_score
      ? "TRIAGE"
      : "IGNORE",
  };
}

async function buildCoordinatorOutput(
  env: Env,
  patient: SummaryRow,
  profile: PatientProfile,
  sentinel: SentinelOutput,
  calibration: CalibrationResult,
): Promise<CoordinatorOutput> {
  const ragContext = await retrieveRagContext(env, sentinel, patient.id);
  const prompt = buildRagCoordinatorPrompt(
    patient,
    profile,
    sentinel,
    calibration,
    ragContext,
  );
  const response = await callGroq(env, [
    {
      role: "system",
      content:
        "Return strict JSON only. Do not include markdown fences or commentary.",
    },
    { role: "user", content: prompt },
  ], 900, "coordinator");
  const parsed = response ? parseJsonObject(response) : null;
  return normalizeCoordinatorOutput(parsed, patient, profile, sentinel);
}

async function buildRiskReviewOutput(
  env: Env,
  patient: SummaryRow,
  profile: PatientProfile,
  sentinel: SentinelOutput,
  calibration: CalibrationResult,
): Promise<RiskReviewOutput> {
  const prompt = `
You are the Risk Review loop for a healthcare care-coordination demo.

The Sentinel score is LOCKED and deterministic. You must not recalculate it, change it, or output a new score.
Your job is to give a grounded clinical take on whether the locked score appears consistent with the evidence.
If something looks mismatched, flag it for human review instead of changing the score.

LOCKED SENTINEL OUTPUT:
Risk Bucket: ${sentinel.bucket}
Risk Score: ${sentinel.score}/100
Priority: ${sentinel.priority}
Top Driver: ${sentinel.top_driver}
Tags: ${sentinel.tags.join(", ") || "none"}
Breakdown: ${JSON.stringify(sentinel.breakdown)}

PATIENT EVIDENCE:
Name: ${cleanName(patient.first, patient.last)}, Age ${patient.age ?? "unknown"}
ED Visits: ${patient.ed_visits}
Inpatient Visits: ${patient.inpatient_visits}
Active Care Plan: ${patient.has_active_careplan ? "YES" : "NO"}
Chronic Condition Count: ${patient.chronic_condition_count}
Chronic Conditions: ${profile.conditions.slice(0, 6).join("; ") || "none on record"}
Medication Risk: ${profile.medications.length} active medications; opioids ${profile.on_opioids ? "YES" : "NO"}; polypharmacy ${profile.polypharmacy ? "YES" : "NO"}
SDOH: ${profile.sdoh.join("; ") || "none detected"}
PRAPARE: ${profile.prapare.join("; ") || "none detected"}
Outstanding Debt: ${formatCurrency(profile.outstanding_debt)}
Calibration Insight: ${calibration.medical_reasoning.key_insight}

Return strict JSON only:
{
  "stance": "Aligned | Possibly under-scored | Possibly over-scored | Needs human review",
  "clinical_take": "1-2 sentence clinical interpretation of the locked score",
  "score_commentary": "1 sentence explicitly saying this is advisory and the Sentinel score remains locked",
  "supporting_evidence": ["grounded evidence point 1", "grounded evidence point 2", "grounded evidence point 3"],
  "watchouts": ["thing a human should double-check, or 'None'"],
  "human_review_flag": false,
  "confidence": 0.0,
  "grounding_check": "GROUNDED"
}
`;

  const response = await callGroq(env, [
    {
      role: "system",
      content:
        "Return strict JSON only. Do not rescore. The Sentinel score is locked. Ground every claim in the provided evidence.",
    },
    { role: "user", content: prompt },
  ], 650, "coordinator");
  const parsed = response ? parseJsonObject(response) : null;
  return normalizeRiskReviewOutput(parsed, patient, profile, sentinel);
}

function buildCoordinatorPrompt(
  patient: SummaryRow,
  profile: PatientProfile,
  sentinel: SentinelOutput,
  calibration: CalibrationResult,
): string {
  return `
You are a care coordination intelligence agent — the Coordinator.

The Sentinel Agent has already made the risk decision deterministically.
Your role is NOT to re-score. Your role is to explain WHY and recommend WHAT TO DO.
Ground every claim in the patient evidence below. Do not hallucinate or infer beyond the data.

SENTINEL OUTPUT:
Risk Bucket: ${sentinel.bucket}
Risk Score: ${sentinel.score}/100
Priority: ${sentinel.priority}
Tags: ${sentinel.tags.join(", ") || "none"}
Score Breakdown:
Module A — ED Utilization: ${sentinel.breakdown.A} pts
Module B — Care Plan: ${sentinel.breakdown.B} pts
Module C — SDOH: ${sentinel.breakdown.C} pts
Module D — Chronic Burden: ${sentinel.breakdown.D} pts
Module E — PRAPARE: ${sentinel.breakdown.E} pts
Module F — Medication Risk: ${sentinel.breakdown.F} pts
Module G — Financial Barrier: ${sentinel.breakdown.G} pts

PATIENT GROUNDING EVIDENCE:
Name: ${cleanName(patient.first, patient.last)}, Age ${patient.age ?? "unknown"}
ED Visits: ${patient.ed_visits} lifetime
Active Care Plan: ${patient.has_active_careplan ? "YES" : "NO — critical gap"}
Chronic Conditions (${patient.chronic_condition_count}):
${profile.conditions.slice(0, 6).map((item) => `- ${item}`).join("\n") || "- None on record"}
Active Medications:
${profile.medications.slice(0, 5).map((item) => `- ${item}`).join("\n") || "- None on record"}
SDOH Flags Detected:
${profile.sdoh.map((item) => `- ${item}`).join("\n") || "- None detected"}
PRAPARE Screening:
${profile.prapare.map((item) => `- ${item}`).join("\n") || "- No PRAPARE data"}
Outstanding Medical Debt: ${formatCurrency(profile.outstanding_debt)}

CALIBRATION CONTEXT:
Top weighted modules: ${calibration.top_modules}
Key clinical insight: ${calibration.medical_reasoning.key_insight}
Most critical feature for this patient: ${sentinel.top_driver}

YOUR OUTPUT — respond in this exact JSON format, no preamble:
{
  "risk_summary": "<2 sentences. Cite 2-3 specific data points from the evidence above. No generic statements.>",
  "top_barriers": [
    {
      "barrier": "<specific barrier name>",
      "evidence": "<exact data point from above that proves this>",
      "actionability": "High"
    },
    {
      "barrier": "<specific barrier name>",
      "evidence": "<exact data point from above that proves this>",
      "actionability": "Medium"
    }
  ],
  "recommended_intervention": {
    "action": "<specific action>",
    "rationale": "<1 sentence grounded in the data>",
    "talking_points": [
      "<specific talking point for coordinator call #1>",
      "<specific talking point for coordinator call #2>"
    ]
  },
  "priority": "${sentinel.priority}",
  "priority_reason": "<1 sentence why this is ${sentinel.priority} not lower priority>",
  "confidence": 0.8,
  "grounding_check": "GROUNDED"
}
`;
}

function buildRagCoordinatorPrompt(
  patient: SummaryRow,
  profile: PatientProfile,
  sentinel: SentinelOutput,
  calibration: CalibrationResult,
  ragContext: RagContext,
): string {
  const approvedBlock = ragContext.approved.length
    ? ragContext.approved
        .map((item) => `APPROVED [${readString(item.risk_bucket, "?")}/${readString(item.top_driver, "?")}]: ${readString(item.lesson, "")}`)
        .join("\n")
    : "No approved examples yet.";
  const rejectedBlock = ragContext.rejected.length
    ? ragContext.rejected
        .map((item) => `REJECTED [reason: ${readString(item.rejection_reason, "not specified")}]: ${readString(item.lesson, "")}`)
        .join("\n")
    : "No rejections recorded yet.";
  const correctedBlock = ragContext.corrected.length
    ? ragContext.corrected
        .map((item) => `CORRECTED: Coordinator added "${readString(item.human_correction, "")}". ${readString(item.lesson, "")}`)
        .join("\n")
    : "No corrections recorded yet.";
  const semanticBlock = ragContext.semantic.length
    ? ragContext.semantic
        .map((item) =>
          `EMBEDDED MATCH ${readString(item.similarity, "0")} [${readString(item.outcome, "?")} ${readString(item.risk_bucket, "?")}/${readString(item.top_driver, "?")}]: ${readString(item.source_text, "")}`,
        )
        .join("\n")
    : "No embedding matches yet.";
  const history = ragContext.history
    ? `This patient has been reviewed ${readString(ragContext.history.times_searched, "0")} time(s). Last action: ${readString(ragContext.history.last_action, "none")}. Approvals: ${readString(ragContext.history.total_approvals, "0")} | Modifications: ${readString(ragContext.history.total_modifications, "0")} | Rejections: ${readString(ragContext.history.total_rejections, "0")}.`
    : "First time this patient is being reviewed.";
  const notes = ragContext.notes.length
    ? ragContext.notes
        .map((item) => `[${readString(item.created_at, "").split("T")[0]}] "${readString(item.note, "")}" after ${readString(item.action_taken, "")}`)
        .join("\n")
    : "No prior coordinator notes for this patient.";

  return `
You are a care coordination intelligence agent — the Coordinator.
You learn from past coordinator decisions stored in Cloudflare D1.
Use that memory to improve the recommendation, but ground every patient claim in the current patient evidence.
The Sentinel score is deterministic and locked. Do not override it.

SENTINEL OUTPUT:
Patient: ${cleanName(patient.first, patient.last)}, Age ${patient.age ?? "unknown"}
Score: ${sentinel.score}/100
Bucket: ${sentinel.bucket}
Priority: ${sentinel.priority}
Top Driver: ${sentinel.top_driver}
Tags: ${sentinel.tags.join(", ") || "none"}
Breakdown:
- A ED Utilization: ${sentinel.breakdown.A} pts
- B Care Plan: ${sentinel.breakdown.B} pts
- C SDOH: ${sentinel.breakdown.C} pts
- D Chronic: ${sentinel.breakdown.D} pts
- E PRAPARE: ${sentinel.breakdown.E} pts
- F Medication: ${sentinel.breakdown.F} pts
- G Financial: ${sentinel.breakdown.G} pts

PATIENT GROUNDING EVIDENCE:
ED Visits: ${patient.ed_visits}
Active Care Plan: ${patient.has_active_careplan ? "YES" : "NO"}
Conditions (${patient.chronic_condition_count}): ${profile.conditions.slice(0, 5).join(", ") || "None"}
Medications: ${profile.medications.slice(0, 4).join(", ") || "None"}
SDOH Flags: ${profile.sdoh.join(", ") || "None"}
PRAPARE Flags: ${profile.prapare.join(", ") || "None"}
Outstanding Debt: ${formatCurrency(profile.outstanding_debt)}

CALIBRATION CONTEXT:
Top weighted modules: ${calibration.top_modules}
Key clinical insight: ${calibration.medical_reasoning.key_insight}

PATIENT HISTORY FROM D1:
${history}

Prior coordinator notes:
${notes}

RAG LEARNING CONTEXT:
What worked:
${approvedBlock}

What failed:
${rejectedBlock}

What coordinators corrected:
${correctedBlock}

Embedding-similar memory:
${semanticBlock}

Task:
Apply the lessons above. Avoid rejected patterns. Replicate approved patterns. Incorporate coordinator corrections as default behavior when relevant.

Respond in strict JSON:
{
  "risk_summary": "<2 sentences. Cite 2-3 exact patient data points.>",
  "top_barriers": [
    {
      "barrier": "<specific barrier>",
      "evidence": "<exact value from patient data>",
      "actionability": "High"
    },
    {
      "barrier": "<specific barrier>",
      "evidence": "<exact value from patient data>",
      "actionability": "Medium"
    }
  ],
  "recommended_intervention": {
    "action": "<specific executable action>",
    "rationale": "<1 sentence grounded in data>",
    "talking_points": [
      "<specific talking point for this patient>",
      "<specific talking point for this patient>"
    ]
  },
  "patient_facing_outreach": "<3-4 sentence message a care coordinator can read on the call>",
  "priority": "${sentinel.priority}",
  "priority_reason": "<1 sentence why ${sentinel.priority} not lower>",
  "rag_lessons_applied": ["<which D1 lesson or note you used, or 'No prior lessons yet'>"],
  "confidence": 0.8,
  "grounding_check": "GROUNDED"
}
`;
}

function buildScoreItems(
  sentinel: SentinelOutput,
  calibration: CalibrationWeights,
  profile: PatientProfile,
  patient: SummaryRow,
): ScoreItem[] {
  return [
    {
      label: "Module A — ED utilization",
      points: sentinel.breakdown.A,
      evidence: `${patient.ed_visits} lifetime ED visits; ${profile.recent_ed_visits} visits in recent record window. Weight: ${calibration.module_weights.A_ed_utilization.weight}.`,
    },
    {
      label: "Module B — Care plan",
      points: sentinel.breakdown.B,
      evidence: patient.has_active_careplan
        ? "Active care plan on file."
        : `No active care plan; gap capped at ${profile.care_plan_gap_months} months.`,
    },
    {
      label: "Module C — SDOH",
      points: sentinel.breakdown.C,
      evidence: `${profile.sdoh_count} active SDOH condition(s); severe SDOH flag ${profile.has_severe_sdoh ? "present" : "not present"}.`,
    },
    {
      label: "Module D — Chronic burden",
      points: sentinel.breakdown.D,
      evidence: `${patient.chronic_condition_count} active conditions; high-risk diagnosis ${profile.has_high_risk_conditions ? "present" : "not present"}.`,
    },
    {
      label: "Module E — PRAPARE",
      points: sentinel.breakdown.E,
      evidence: `${profile.prapare_count} PRAPARE/access flags; severity ${profile.prapare_severity}/3.`,
    },
    {
      label: "Module F — Medication risk",
      points: sentinel.breakdown.F,
      evidence: `${profile.medications.length} active meds; opioid ${profile.on_opioids ? "yes" : "no"}; polypharmacy ${profile.polypharmacy ? "yes" : "no"}.`,
    },
    {
      label: "Module G — Financial barriers",
      points: sentinel.breakdown.G,
      evidence: `${formatCurrency(profile.outstanding_debt)} outstanding debt.`,
    },
  ];
}

function formatCoordinatorDraft(
  patient: SummaryRow,
  coordinator: CoordinatorOutput,
): string {
  const firstName = cleanToken(patient.first);
  const talkingPoints = coordinator.recommended_intervention.talking_points
    .map((point) => `- ${point}`)
    .join("\n");

  return [
    `Coordinator summary: ${coordinator.risk_summary}`,
    `Recommended intervention: ${coordinator.recommended_intervention.action}`,
    `Rationale: ${coordinator.recommended_intervention.rationale}`,
    `Patient-facing outreach draft: ${coordinator.patient_facing_outreach || `Hi ${firstName}, this is your care team. We would like to schedule a care coordination call to ${coordinator.recommended_intervention.action.toLowerCase()}.`}`,
    `Talking points:\n${talkingPoints}`,
  ].join("\n\n");
}

function normalizeCoordinatorOutput(
  raw: Record<string, unknown> | null,
  patient: SummaryRow,
  profile: PatientProfile,
  sentinel: SentinelOutput,
): CoordinatorOutput {
  if (!raw) {
    return fallbackCoordinatorOutput(patient, profile, sentinel);
  }

  const intervention = raw.recommended_intervention as Record<string, unknown> | undefined;
  const topBarriers = Array.isArray(raw.top_barriers)
    ? raw.top_barriers
        .map((item) => readBarrier(item))
        .filter((item): item is CoordinatorOutput["top_barriers"][number] => Boolean(item))
        .slice(0, 2)
    : [];

  return {
    risk_summary: readString(
      raw.risk_summary,
      fallbackCoordinatorOutput(patient, profile, sentinel).risk_summary,
    ),
    top_barriers: topBarriers.length > 0
      ? topBarriers
      : fallbackCoordinatorOutput(patient, profile, sentinel).top_barriers,
    recommended_intervention: {
      action: readString(
        intervention?.action,
        fallbackCoordinatorOutput(patient, profile, sentinel).recommended_intervention.action,
      ),
      rationale: readString(
        intervention?.rationale,
        fallbackCoordinatorOutput(patient, profile, sentinel).recommended_intervention.rationale,
      ),
      talking_points: Array.isArray(intervention?.talking_points)
        ? intervention.talking_points
            .filter((item): item is string => typeof item === "string")
            .slice(0, 3)
        : fallbackCoordinatorOutput(patient, profile, sentinel).recommended_intervention.talking_points,
    },
    patient_facing_outreach: readString(
      raw.patient_facing_outreach,
      fallbackCoordinatorOutput(patient, profile, sentinel).patient_facing_outreach || "",
    ),
    priority: sentinel.priority,
    priority_reason: readString(
      raw.priority_reason,
      fallbackCoordinatorOutput(patient, profile, sentinel).priority_reason,
    ),
    rag_lessons_applied: Array.isArray(raw.rag_lessons_applied)
      ? raw.rag_lessons_applied
          .filter((item): item is string => typeof item === "string")
          .slice(0, 5)
      : fallbackCoordinatorOutput(patient, profile, sentinel).rag_lessons_applied,
    confidence: Math.max(0.5, clampNumber(raw.confidence, 0, 1, 0.78)),
    grounding_check: "GROUNDED",
  };
}

function normalizeRiskReviewOutput(
  raw: Record<string, unknown> | null,
  patient: SummaryRow,
  profile: PatientProfile,
  sentinel: SentinelOutput,
): RiskReviewOutput {
  const fallback = fallbackRiskReviewOutput(patient, profile, sentinel);
  if (!raw) {
    return fallback;
  }

  const stance = readRiskReviewStance(raw.stance, fallback.stance);
  const evidence = Array.isArray(raw.supporting_evidence)
    ? raw.supporting_evidence
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .slice(0, 4)
    : fallback.supporting_evidence;
  const watchouts = Array.isArray(raw.watchouts)
    ? raw.watchouts
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .slice(0, 3)
    : fallback.watchouts;

  return {
    stance,
    clinical_take: readString(raw.clinical_take, fallback.clinical_take),
    score_commentary: readString(
      raw.score_commentary,
      "This is an advisory LLM review; the Sentinel score remains the locked risk score.",
    ),
    supporting_evidence: evidence.length ? evidence : fallback.supporting_evidence,
    watchouts: watchouts.length ? watchouts : fallback.watchouts,
    human_review_flag: typeof raw.human_review_flag === "boolean"
      ? raw.human_review_flag
      : stance !== "Aligned",
    confidence: Math.max(0.5, clampNumber(raw.confidence, 0, 1, fallback.confidence)),
    grounding_check: "GROUNDED",
  };
}

function readRiskReviewStance(value: unknown, fallback: RiskReviewOutput["stance"]): RiskReviewOutput["stance"] {
  const text = readString(value, fallback).toLowerCase();
  if (text.includes("under")) {
    return "Possibly under-scored";
  }
  if (text.includes("over")) {
    return "Possibly over-scored";
  }
  if (text.includes("review")) {
    return "Needs human review";
  }
  return "Aligned";
}

function fallbackRiskReviewOutput(
  patient: SummaryRow,
  profile: PatientProfile,
  sentinel: SentinelOutput,
): RiskReviewOutput {
  const highSignals = [
    patient.ed_visits >= 10 ? `${patient.ed_visits} ED visits` : "",
    patient.has_active_careplan ? "" : "no active care plan",
    patient.chronic_condition_count >= 5 ? `${patient.chronic_condition_count} chronic conditions` : "",
    profile.outstanding_debt > 10000 ? `${formatCurrency(profile.outstanding_debt)} outstanding debt` : "",
    profile.polypharmacy ? "polypharmacy" : "",
    profile.on_opioids ? "active opioid prescription" : "",
  ].filter(Boolean);
  const stance: RiskReviewOutput["stance"] =
    sentinel.bucket === "Low" && highSignals.length >= 3
      ? "Needs human review"
      : sentinel.bucket === "High" && highSignals.length === 0
        ? "Possibly over-scored"
        : "Aligned";

  return {
    stance,
    clinical_take: `${cleanName(patient.first, patient.last)}'s locked Sentinel score of ${sentinel.score}/100 appears ${stance === "Aligned" ? "consistent" : "worth reviewing"} based on ${highSignals.slice(0, 3).join(", ") || "the available patient profile"}.`,
    score_commentary: "This is an advisory LLM-style review; the Sentinel score remains locked and is not changed.",
    supporting_evidence: [
      `Locked Sentinel score: ${sentinel.score}/100 (${sentinel.bucket})`,
      `Top driver: ${sentinel.top_driver}`,
      `${patient.ed_visits} ED visits and ${patient.chronic_condition_count} chronic conditions`,
    ],
    watchouts: stance === "Aligned"
      ? ["None beyond normal coordinator review."]
      : ["Human coordinator should review whether the deterministic inputs are complete."],
    human_review_flag: stance !== "Aligned",
    confidence: stance === "Aligned" ? 0.82 : 0.68,
    grounding_check: "GROUNDED",
  };
}

function fallbackCoordinatorOutput(
  patient: SummaryRow,
  profile: PatientProfile,
  sentinel: SentinelOutput,
): CoordinatorOutput {
  const name = cleanName(patient.first, patient.last);
  const primaryBarrier = patient.has_active_careplan === 0
    ? {
        barrier: "No active care plan",
        evidence: "Active Care Plan: NO — critical gap",
        actionability: "High" as const,
      }
    : {
        barrier: sentinel.top_driver,
        evidence: `Top Sentinel driver: ${sentinel.top_driver}`,
        actionability: "Medium" as const,
      };
  const secondaryEvidence = profile.prapare[0] || profile.sdoh[0] || `${formatCurrency(profile.outstanding_debt)} outstanding medical debt`;

  return {
    risk_summary: `${name} is ${sentinel.bucket.toLowerCase()} priority with a Sentinel score of ${sentinel.score}/100, ${patient.ed_visits} lifetime ED visits, and ${patient.chronic_condition_count} active conditions. The record also shows ${patient.has_active_careplan === 0 ? "no active care plan" : "an active care plan"} and ${formatCurrency(profile.outstanding_debt)} in outstanding medical debt.`,
    top_barriers: [
      primaryBarrier,
      {
        barrier: "Access or social barrier",
        evidence: secondaryEvidence,
        actionability: profile.prapare_count || profile.sdoh_count ? "High" : "Medium",
      },
    ],
    recommended_intervention: {
      action: patient.has_active_careplan === 0
        ? "open a care management episode and schedule PCP follow-up within 48 hours"
        : "schedule a targeted care coordination follow-up this week",
      rationale: `The Sentinel score is driven by ${sentinel.top_driver}, with ${patient.ed_visits} ED visits and ${profile.prapare_count + profile.sdoh_count} documented social/access flags.`,
      talking_points: [
        `Acknowledge recent ED use and ask what symptoms or barriers made the ED feel like the best option.`,
        `Offer help with the most visible barrier: ${secondaryEvidence}.`,
      ],
    },
    patient_facing_outreach: `Hi ${cleanToken(patient.first)}, this is your care team. We noticed recent emergency care use and want to help make a care plan that fits what is happening day to day. Could we schedule a care coordination call this week to review symptoms, barriers, and next steps together?`,
    priority: sentinel.priority,
    priority_reason: `${sentinel.priority} is assigned because the deterministic score reached ${sentinel.score}/100 and the top driver was ${sentinel.top_driver}.`,
    rag_lessons_applied: ["No prior lessons yet"],
    confidence: 0.78,
    grounding_check: "GROUNDED",
  };
}

function readBarrier(value: unknown): CoordinatorOutput["top_barriers"][number] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const actionability = readString(record.actionability, "Medium");
  return {
    barrier: readString(record.barrier, "Documented barrier"),
    evidence: readString(record.evidence, "Patient record evidence"),
    actionability: actionability === "High" || actionability === "Low" ? actionability : "Medium",
  };
}

function countRecentEdVisits(edHistory: EncounterRow[]): number {
  const timestamps = edHistory
    .map((item) => Date.parse(item.START))
    .filter((value) => Number.isFinite(value));
  if (timestamps.length === 0) {
    return 0;
  }
  const latest = Math.max(...timestamps);
  const sixMonthsMs = 183 * 24 * 60 * 60 * 1000;
  return timestamps.filter((value) => latest - value <= sixMonthsMs).length;
}

function calculateCarePlanGapMonths(
  patient: SummaryRow,
  carePlans: CarePlanRow[],
): number {
  if (patient.has_active_careplan === 1) {
    return 0;
  }
  const stopped = carePlans
    .map((plan) => Date.parse(plan.STOP || plan.START || ""))
    .filter((value) => Number.isFinite(value));
  if (stopped.length === 0) {
    return 24;
  }
  const latest = Math.max(...stopped);
  const now = Date.now();
  return Math.max(0, Math.min(24, Math.round((now - latest) / (30.44 * 24 * 60 * 60 * 1000))));
}

function calculateCarePlanGapMonthsFromDate(
  patient: SummaryRow,
  latestPlanDate: string,
): number {
  if (patient.has_active_careplan === 1) {
    return 0;
  }
  const latest = Date.parse(latestPlanDate || "");
  if (!Number.isFinite(latest)) {
    return 24;
  }
  return Math.max(0, Math.min(24, Math.round((Date.now() - latest) / (30.44 * 24 * 60 * 60 * 1000))));
}

function sqlLikeAny(column: string, terms: string[]): string {
  return terms
    .map((term) => `${column} LIKE '%${escapeSql(term.toLowerCase())}%'`)
    .join(" OR ");
}

function indexRowsById(
  rows: Array<Record<string, unknown>>,
  key: string,
): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  rows.forEach((row) => {
    const value = row[key] ?? row[key.toLowerCase()] ?? row[key.toUpperCase()];
    if (typeof value === "string" && value) {
      map.set(value, row);
    }
  });
  return map;
}

function rowNumber(row: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = row[key] ?? row[key.toLowerCase()] ?? row[key.toUpperCase()];
    if (value !== undefined && value !== null) {
      return normalizeNumber(value);
    }
  }
  return 0;
}

function rowString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key] ?? row[key.toLowerCase()] ?? row[key.toUpperCase()];
    if (typeof value === "string") {
      return value;
    }
  }
  return "";
}

function hasSevereSdoh(sdoh: string[], prapare: string[]): 0 | 1 {
  const text = `${sdoh.join(" ")} ${prapare.join(" ")}`.toLowerCase();
  return text.match(/homeless|intimate partner|abuse|violence|criminal record|jail|detention|unable to get/) ? 1 : 0;
}

function calculatePrapareSeverity(prapare: string[]): number {
  const text = prapare.join(" ").toLowerCase();
  let severity = Math.min(prapare.length, 3);
  if (text.match(/homeless|unable to get|food|medicine|health care|quite a bit|very much/)) {
    severity += 1;
  }
  return Math.min(severity, 3);
}

function countHighRiskMedications(medications: MedicationRow[]): number {
  return medications.filter((row) =>
    row.DESCRIPTION.toLowerCase().match(
      /opioid|oxycodone|hydrocodone|morphine|fentanyl|tramadol|warfarin|insulin|benzodiazepine|diazepam|alprazolam|clonazepam/,
    ),
  ).length;
}

function hasHighRiskConditions(conditions: ConditionRow[]): boolean {
  return conditions.some((row) =>
    row.DESCRIPTION.toLowerCase().match(
      /diabetes|heart failure|congestive|copd|chronic obstructive|kidney|renal|substance|overdose|opioid|chronic pain|migraine/,
    ),
  );
}

async function callGroq(
  env: Env,
  messages: Array<{ role: "system" | "user"; content: string }>,
  maxTokens: number,
  purpose: GroqPurpose = "default",
): Promise<string | null> {
  const apiKey = getGroqApiKey(env, purpose);
  if (!apiKey) {
    return null;
  }

  const models = uniqueStrings([
    env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
    DEFAULT_GROQ_MODEL,
    "llama-3.1-8b-instant",
    "openai/gpt-oss-20b",
  ]);

  for (const model of models) {
    for (const jsonMode of [true, false]) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            max_tokens: maxTokens,
            ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
            messages,
          }),
        });

        if (!response.ok) {
          continue;
        }

        const data = (await response.json()) as GroqResponse;
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          return content;
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const jsonText = extractJsonObjectText(text);
  if (!jsonText) {
    return null;
  }
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    try {
      const repaired = jsonText
        .replace(/```json|```/gi, "")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/,\s*([}\]])/g, "$1");
      const parsed = JSON.parse(repaired) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
}

function extractJsonObjectText(text: string): string | null {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const firstBrace = trimmed.indexOf("{");
  if (firstBrace < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = firstBrace; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return trimmed.slice(firstBrace, index + 1);
      }
    }
  }

  const lastBrace = trimmed.lastIndexOf("}");
  return lastBrace > firstBrace ? trimmed.slice(firstBrace, lastBrace + 1) : null;
}

function readModuleWeight(value: unknown, fallback: ModuleWeight): ModuleWeight {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }
  const record = value as Record<string, unknown>;
  return {
    weight: clampNumber(record.weight, 0, 100, fallback.weight),
    rationale: readString(record.rationale, fallback.rationale),
  };
}

function readSubWeights<T extends Record<string, number>>(
  value: unknown,
  fallback: T,
): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }
  const record = value as Record<string, unknown>;
  const result: Record<string, number> = {};
  for (const key of Object.keys(fallback)) {
    result[key] = clampNumber(record[key], 0, 1, fallback[key]);
  }

  const sum = Object.values(result).reduce((total, item) => total + item, 0);
  if (sum <= 0.01) {
    return fallback;
  }

  if (Math.abs(sum - 1) > 0.01) {
    for (const key of Object.keys(result)) {
      result[key] = result[key] / sum;
    }
  }

  return result as T;
}

function readCriticalFeature(
  value: unknown,
): CalibrationWeights["top_3_critical_features"][number] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  return {
    feature: readString(record.feature, "unknown"),
    module: readString(record.module, "unknown"),
    clinical_justification: readString(record.clinical_justification, ""),
    odds_ratio_estimate: readString(record.odds_ratio_estimate, "not specified"),
  };
}

function readString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function readOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function topModules(calibration: CalibrationWeights): string {
  const labels: Record<keyof CalibrationWeights["module_weights"], string> = {
    A_ed_utilization: "ED utilization",
    B_care_plan: "Care plan",
    C_sdoh: "SDOH",
    D_chronic: "Chronic burden",
    E_prapare: "PRAPARE",
    F_medication: "Medication risk",
    G_financial: "Financial barriers",
  };
  return Object.entries(calibration.module_weights)
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, 3)
    .map(([key, value]) => `${labels[key as keyof typeof labels]} (${value.weight})`)
    .join(", ");
}

async function setupMemoryDatabase(env: Env): Promise<{ success: boolean; message: string; statements: number; embeddings_backfilled?: number }> {
  if (!env.DB) {
    return { success: false, message: "D1 binding DB is not configured.", statements: 0 };
  }

  const statements = SCHEMA_SQL.split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await env.DB.prepare(`${statement};`).run();
  }

  const embeddingsBackfilled = await backfillDecisionEmbeddings(env);

  return {
    success: true,
    message: "D1 memory schema created and embedding memory is ready.",
    statements: statements.length,
    embeddings_backfilled: embeddingsBackfilled,
  };
}

async function getRagStats(env: Env): Promise<Record<string, unknown>> {
  if (!env.DB) {
    return { total_decisions: 0, approved_examples: 0, rejected_examples: 0, learning_examples: 0, message: "D1 binding DB is not configured." };
  }

  const [approved, rejected, corrected, totalDecisions, embeddings] = await Promise.all([
    dbFirst(env, "SELECT COUNT(*) as count FROM rag_examples WHERE outcome = 'positive'"),
    dbFirst(env, "SELECT COUNT(*) as count FROM rag_examples WHERE outcome = 'negative'"),
    dbFirst(env, "SELECT COUNT(*) as count FROM rag_examples WHERE outcome = 'learning'"),
    dbFirst(env, "SELECT COUNT(*) as count FROM decisions"),
    dbFirst(env, "SELECT COUNT(*) as count FROM decision_embeddings").catch(() => ({ count: 0 })),
  ]);

  return {
    total_decisions: normalizeNumber(totalDecisions?.count),
    approved_examples: normalizeNumber(approved?.count),
    rejected_examples: normalizeNumber(rejected?.count),
    learning_examples: normalizeNumber(corrected?.count),
    embedding_examples: normalizeNumber(embeddings?.count),
    message: "Agent has learned from these decisions using SQL filters plus deterministic embedding retrieval.",
  };
}

async function getPatientMemory(env: Env, patientId: string): Promise<Record<string, unknown>> {
  if (!env.DB) {
    return { history: null, notes: [], decisions: [], message: "D1 binding DB is not configured." };
  }
  if (!patientId) {
    throw new Error("Missing patient id.");
  }

  const [history, notes, decisions] = await Promise.all([
    dbFirst(env, "SELECT * FROM patient_history WHERE patient_id = ?", [patientId]),
    dbAll(env, "SELECT * FROM coordinator_notes WHERE patient_id = ? ORDER BY created_at DESC LIMIT 20", [patientId]),
    dbAll(env, "SELECT * FROM decisions WHERE patient_id = ? ORDER BY created_at DESC LIMIT 20", [patientId]),
  ]);

  return { history, notes, decisions };
}

async function getDecisionTrail(env: Env): Promise<Record<string, unknown>> {
  if (!env.DB) {
    return {
      stats: { total_decisions: 0, approved_examples: 0, rejected_examples: 0, learning_examples: 0 },
      decisions: [],
      notes: [],
      message: "D1 binding DB is not configured.",
    };
  }

  const [stats, decisions, notes] = await Promise.all([
    getRagStats(env),
    dbAll(
      env,
      `SELECT id, patient_id, patient_name, risk_score, risk_bucket, priority,
              tags, breakdown, action, original_rec, human_edit, final_rec,
              rejection_reason, coordinator_notes, created_at
       FROM decisions
       ORDER BY created_at DESC LIMIT 50`,
    ),
    dbAll(
      env,
      `SELECT patient_id, patient_name, note, action_taken, created_at
       FROM coordinator_notes
       ORDER BY created_at DESC LIMIT 30`,
    ),
  ]);

  return { stats, decisions, notes };
}

async function dbRun(env: Env, sql: string, params: unknown[] = []): Promise<D1Result> {
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured.");
  }
  return env.DB.prepare(sql).bind(...params).run();
}

async function dbAll(
  env: Env,
  sql: string,
  params: unknown[] = [],
): Promise<Array<Record<string, unknown>>> {
  if (!env.DB) {
    return [];
  }
  const result = await env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();
  return result.results || [];
}

async function dbFirst(
  env: Env,
  sql: string,
  params: unknown[] = [],
): Promise<Record<string, unknown> | null> {
  if (!env.DB) {
    return null;
  }
  return env.DB.prepare(sql).bind(...params).first<Record<string, unknown>>();
}

async function retrieveRagContext(
  env: Env,
  sentinel: SentinelOutput,
  patientId: string,
): Promise<RagContext> {
  if (!env.DB) {
    return emptyRagContext();
  }

  try {
    const [approved, rejected, corrected, semantic, history, notes] = await Promise.all([
      dbAll(
        env,
        `SELECT lesson, patient_tags, top_driver, risk_bucket
         FROM rag_examples
         WHERE outcome = 'positive'
           AND (risk_bucket = ? OR top_driver = ?)
         ORDER BY created_at DESC LIMIT 3`,
        [sentinel.bucket, sentinel.top_driver],
      ),
      dbAll(
        env,
        `SELECT lesson, patient_tags, rejection_reason, risk_bucket
         FROM rag_examples
         WHERE outcome = 'negative'
           AND (risk_bucket = ? OR top_driver = ?)
         ORDER BY created_at DESC LIMIT 3`,
        [sentinel.bucket, sentinel.top_driver],
      ),
      dbAll(
        env,
        `SELECT lesson, human_correction, patient_tags
         FROM rag_examples
         WHERE outcome = 'learning'
           AND (risk_bucket = ? OR top_driver = ?)
         ORDER BY created_at DESC LIMIT 3`,
        [sentinel.bucket, sentinel.top_driver],
      ),
      retrieveSemanticRagExamples(env, sentinel),
      dbFirst(
        env,
        `SELECT times_searched, last_action,
                total_approvals, total_modifications, total_rejections
         FROM patient_history
         WHERE patient_id = ?`,
        [patientId],
      ),
      dbAll(
        env,
        `SELECT note, action_taken, created_at
         FROM coordinator_notes
         WHERE patient_id = ?
         ORDER BY created_at DESC LIMIT 5`,
        [patientId],
      ),
    ]);

    return { approved, rejected, corrected, semantic, history, notes };
  } catch {
    return emptyRagContext();
  }
}

function emptyRagContext(): RagContext {
  return {
    approved: [],
    rejected: [],
    corrected: [],
    semantic: [],
    history: null,
    notes: [],
  };
}

async function logDecisionBestEffort(
  env: Env,
  input: {
    patient: Partial<SummaryRow> | null;
    patientName: string;
    sentinel: SentinelOutput | null;
    originalRec: unknown;
    action: "approved" | "modified" | "rejected";
    humanEdit?: string | null;
    finalRec?: unknown;
    rejectionReason?: string | null;
    coordinatorNotes?: string | null;
  },
): Promise<{ saved: boolean; error?: string }> {
  if (!env.DB || !input.patient?.id || !input.sentinel) {
    return { saved: false, error: "Decision memory is missing DB, patient, or Sentinel data." };
  }

  const payload = input as {
    patient: Partial<SummaryRow> & { id: string };
    patientName: string;
    sentinel: SentinelOutput;
    originalRec: unknown;
    action: "approved" | "modified" | "rejected";
    humanEdit?: string | null;
    finalRec?: unknown;
    rejectionReason?: string | null;
    coordinatorNotes?: string | null;
  };

  try {
    await logDecision(env, payload);
    return { saved: true };
  } catch (error) {
    try {
      await setupMemoryDatabase(env);
      await logDecision(env, payload);
      return { saved: true };
    } catch (retryError) {
      const message = retryError instanceof Error
        ? retryError.message
        : error instanceof Error
          ? error.message
          : "Could not save decision memory.";
      return { saved: false, error: message };
    }
  }
}

async function logDecision(
  env: Env,
  input: {
    patient: Partial<SummaryRow> & { id: string };
    patientName: string;
    sentinel: SentinelOutput;
    originalRec: unknown;
    action: "approved" | "modified" | "rejected";
    humanEdit?: string | null;
    finalRec?: unknown;
    rejectionReason?: string | null;
    coordinatorNotes?: string | null;
  },
): Promise<{ success: boolean; decision_id: string }> {
  const now = new Date().toISOString();
  const id = `${input.patient.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const patientName = input.patientName || cleanName(input.patient.first || "", input.patient.last || "");

  await dbRun(
    env,
    `INSERT INTO decisions
      (id, patient_id, patient_name, risk_score, risk_bucket, priority,
       tags, breakdown, action, original_rec, human_edit, final_rec,
       rejection_reason, coordinator_notes, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      input.patient.id,
      patientName,
      input.sentinel.score,
      input.sentinel.bucket,
      input.sentinel.priority,
      JSON.stringify(input.sentinel.tags),
      JSON.stringify(input.sentinel.breakdown),
      input.action,
      JSON.stringify(input.originalRec),
      input.humanEdit || null,
      input.finalRec ? JSON.stringify(input.finalRec) : null,
      input.rejectionReason || null,
      input.coordinatorNotes || null,
      now,
    ],
  );

  const approvalDelta = input.action === "approved" ? 1 : 0;
  const modificationDelta = input.action === "modified" ? 1 : 0;
  const rejectionDelta = input.action === "rejected" ? 1 : 0;

  await dbRun(
    env,
    `INSERT INTO patient_history
      (patient_id, patient_name, times_searched, last_searched,
       last_action, total_approvals, total_modifications,
       total_rejections, updated_at)
     VALUES (?,?,1,?,?,?,?,?,?)
     ON CONFLICT(patient_id) DO UPDATE SET
       times_searched = times_searched + 1,
       last_searched = excluded.last_searched,
       last_action = excluded.last_action,
       total_approvals = total_approvals + ?,
       total_modifications = total_modifications + ?,
       total_rejections = total_rejections + ?,
       updated_at = excluded.updated_at`,
    [
      input.patient.id,
      patientName,
      now,
      input.action,
      approvalDelta,
      modificationDelta,
      rejectionDelta,
      now,
      approvalDelta,
      modificationDelta,
      rejectionDelta,
    ],
  );

  if (input.coordinatorNotes) {
    await dbRun(
      env,
      `INSERT INTO coordinator_notes
        (id, patient_id, patient_name, note, action_taken, created_at)
       VALUES (?,?,?,?,?,?)`,
      [
        `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        input.patient.id,
        patientName,
        input.coordinatorNotes,
        input.action,
        now,
      ],
    );
  }

  await saveRagExample(env, input, now);
  return { success: true, decision_id: id };
}

async function saveRagExample(
  env: Env,
  input: {
    patient?: Partial<SummaryRow> & { id?: string };
    patientName?: string;
    sentinel: SentinelOutput;
    originalRec: unknown;
    action: "approved" | "modified" | "rejected";
    humanEdit?: string | null;
    finalRec?: unknown;
    rejectionReason?: string | null;
  },
  now: string,
): Promise<void> {
  const ragId = `rag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let outcome = "learning";
  let lesson = "";

  if (input.action === "approved") {
    outcome = "positive";
    lesson = `APPROVED pattern for [${input.sentinel.tags.join(", ")}] patients. Top driver was "${input.sentinel.top_driver}". Replicate this recommendation style and specificity level. Risk bucket: ${input.sentinel.bucket}. Score: ${input.sentinel.score}.`;
  } else if (input.action === "modified") {
    outcome = "learning";
    lesson = (await buildModificationLearningLesson(env, input)) ||
      `MODIFIED pattern for [${input.sentinel.tags.join(", ")}] patients. Coordinator corrected with: "${input.humanEdit || "not specified"}". Incorporate this local knowledge before drafting future recommendations for similar ${input.sentinel.bucket}/${input.sentinel.top_driver} patients.`;
  } else {
    outcome = "negative";
    lesson = `REJECTED pattern for [${input.sentinel.tags.join(", ")}] patients. Reason: "${input.rejectionReason || "not specified"}". Avoid generic recommendations for this tag set. Focus on specific data citations and executable action steps.`;
  }

  await dbRun(
    env,
    `INSERT INTO rag_examples
      (id, outcome, patient_tags, top_driver, risk_bucket,
       original_rec, human_correction, final_rec,
       rejection_reason, lesson, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      ragId,
      outcome,
      JSON.stringify(input.sentinel.tags),
      input.sentinel.top_driver,
      input.sentinel.bucket,
      JSON.stringify(input.originalRec),
      input.humanEdit || null,
      input.finalRec ? JSON.stringify(input.finalRec) : null,
      input.rejectionReason || null,
      lesson,
      now,
    ],
  );

  await saveDecisionEmbedding(env, {
    ragId,
    patientId: input.patient?.id || null,
    patientName: input.patientName || null,
    outcome,
    riskBucket: input.sentinel.bucket,
    topDriver: input.sentinel.top_driver,
    patientTags: input.sentinel.tags,
    sourceText: buildEmbeddingSourceText({
      outcome,
      lesson,
      riskBucket: input.sentinel.bucket,
      topDriver: input.sentinel.top_driver,
      tags: input.sentinel.tags,
      score: input.sentinel.score,
      humanEdit: input.humanEdit || null,
      rejectionReason: input.rejectionReason || null,
    }),
    createdAt: now,
  });
}

async function buildModificationLearningLesson(
  env: Env,
  input: {
    patient?: Partial<SummaryRow> & { id?: string };
    patientName?: string;
    sentinel: SentinelOutput;
    originalRec: unknown;
    humanEdit?: string | null;
    finalRec?: unknown;
  },
): Promise<string | null> {
  const edit = input.humanEdit?.trim();
  if (!edit) {
    return null;
  }

  const raw = await callGroq(env, [
    {
      role: "system",
      content:
        "Return strict JSON only. You convert a care coordinator's modification into a reusable RAG learning rule. Do not invent patient facts. Do not change the Sentinel score.",
    },
    {
      role: "user",
      content: `
Coordinator modified a recommendation.

Patient: ${input.patientName || "Unknown patient"}
Sentinel bucket: ${input.sentinel.bucket}
Priority: ${input.sentinel.priority}
Risk score: ${input.sentinel.score}
Top driver: ${input.sentinel.top_driver}
Tags: ${input.sentinel.tags.join(", ") || "none"}
Original recommendation:
${compactJson(input.originalRec, 4000)}
Coordinator correction:
${edit}
Final recommendation:
${compactJson(input.finalRec, 4000)}

Return JSON:
{
  "lesson": "1-2 sentence reusable rule beginning with MODIFIED LEARNING. Mention the coordinator correction, when to apply it, and what to avoid next time."
}
`,
    },
  ], 500, "coordinator");

  const parsed = raw ? parseJsonObject(raw) : null;
  const lesson = readOptionalString(parsed?.lesson);
  if (!lesson) {
    return null;
  }
  return lesson.startsWith("MODIFIED LEARNING")
    ? lesson
    : `MODIFIED LEARNING: ${lesson}`;
}

async function saveDecisionEmbedding(
  env: Env,
  input: {
    ragId: string;
    patientId: string | null;
    patientName: string | null;
    outcome: string;
    riskBucket: string;
    topDriver: string;
    patientTags: string[];
    sourceText: string;
    createdAt: string;
  },
): Promise<void> {
  if (!env.DB) {
    return;
  }

  const vector = JSON.stringify(createTextEmbedding(input.sourceText));
  const params = [
    `emb_${input.ragId}`,
    input.ragId,
    input.patientId,
    input.patientName,
    input.outcome,
    input.riskBucket,
    input.topDriver,
    JSON.stringify(input.patientTags),
    input.sourceText,
    vector,
    input.createdAt,
  ];

  const sql = `
    INSERT OR REPLACE INTO decision_embeddings
      (id, rag_id, patient_id, patient_name, outcome, risk_bucket,
       top_driver, patient_tags, source_text, vector, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `;

  try {
    await dbRun(env, sql, params);
  } catch {
    await ensureEmbeddingTable(env);
    await dbRun(env, sql, params);
  }
}

async function ensureEmbeddingTable(env: Env): Promise<void> {
  if (!env.DB) {
    return;
  }
  const statements = [
    `CREATE TABLE IF NOT EXISTS decision_embeddings (
      id TEXT PRIMARY KEY,
      rag_id TEXT NOT NULL,
      patient_id TEXT,
      patient_name TEXT,
      outcome TEXT NOT NULL,
      risk_bucket TEXT NOT NULL,
      top_driver TEXT NOT NULL,
      patient_tags TEXT NOT NULL,
      source_text TEXT NOT NULL,
      vector TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    "CREATE INDEX IF NOT EXISTS idx_embedding_rag ON decision_embeddings(rag_id)",
    "CREATE INDEX IF NOT EXISTS idx_embedding_bucket ON decision_embeddings(risk_bucket)",
    "CREATE INDEX IF NOT EXISTS idx_embedding_driver ON decision_embeddings(top_driver)",
  ];

  for (const statement of statements) {
    await env.DB.prepare(`${statement};`).run();
  }
}

async function backfillDecisionEmbeddings(env: Env): Promise<number> {
  if (!env.DB) {
    return 0;
  }
  await ensureEmbeddingTable(env);
  const rows = await dbAll(
    env,
    `SELECT r.id, r.outcome, r.patient_tags, r.top_driver, r.risk_bucket,
            r.human_correction, r.rejection_reason, r.lesson, r.created_at
     FROM rag_examples r
     LEFT JOIN decision_embeddings e ON e.rag_id = r.id
     WHERE e.id IS NULL
     ORDER BY r.created_at DESC
     LIMIT 100`,
  );

  for (const row of rows) {
    const tags = parseStringArray(row.patient_tags);
    const sourceText = buildEmbeddingSourceText({
      outcome: readString(row.outcome, "learning"),
      lesson: readString(row.lesson, ""),
      riskBucket: readString(row.risk_bucket, ""),
      topDriver: readString(row.top_driver, ""),
      tags,
      score: null,
      humanEdit: readOptionalString(row.human_correction),
      rejectionReason: readOptionalString(row.rejection_reason),
    });
    await saveDecisionEmbedding(env, {
      ragId: readString(row.id, `legacy_${Date.now()}`),
      patientId: null,
      patientName: null,
      outcome: readString(row.outcome, "learning"),
      riskBucket: readString(row.risk_bucket, ""),
      topDriver: readString(row.top_driver, ""),
      patientTags: tags,
      sourceText,
      createdAt: readString(row.created_at, new Date().toISOString()),
    });
  }

  return rows.length;
}

async function retrieveSemanticRagExamples(
  env: Env,
  sentinel: SentinelOutput,
): Promise<Array<Record<string, unknown>>> {
  if (!env.DB) {
    return [];
  }
  try {
    await ensureEmbeddingTable(env);
    const rows = await dbAll(
      env,
      `SELECT outcome, risk_bucket, top_driver, patient_tags, source_text, vector, created_at
       FROM decision_embeddings
       ORDER BY created_at DESC
       LIMIT 100`,
    );
    const queryVector = createTextEmbedding(buildSentinelEmbeddingQuery(sentinel));
    return rows
      .map((row) => {
        const vector = parseVector(row.vector);
        return {
          ...row,
          similarity: Number(cosineSimilarity(queryVector, vector).toFixed(3)),
        };
      })
      .filter((row) => normalizeNumber(row.similarity) > 0.12)
      .sort((a, b) => normalizeNumber(b.similarity) - normalizeNumber(a.similarity))
      .slice(0, 3);
  } catch {
    return [];
  }
}

function buildSentinelEmbeddingQuery(sentinel: SentinelOutput): string {
  return buildEmbeddingSourceText({
    outcome: "query",
    lesson: `Current patient pattern. Bucket ${sentinel.bucket}. Priority ${sentinel.priority}. Top driver ${sentinel.top_driver}. Tags ${sentinel.tags.join(", ")}. Breakdown A ${sentinel.breakdown.A} B ${sentinel.breakdown.B} C ${sentinel.breakdown.C} D ${sentinel.breakdown.D} E ${sentinel.breakdown.E} F ${sentinel.breakdown.F} G ${sentinel.breakdown.G}.`,
    riskBucket: sentinel.bucket,
    topDriver: sentinel.top_driver,
    tags: sentinel.tags,
    score: sentinel.score,
    humanEdit: null,
    rejectionReason: null,
  });
}

function buildEmbeddingSourceText(input: {
  outcome: string;
  lesson: string;
  riskBucket: string;
  topDriver: string;
  tags: string[];
  score: number | null;
  humanEdit: string | null;
  rejectionReason: string | null;
}): string {
  return [
    `outcome:${input.outcome}`,
    `bucket:${input.riskBucket}`,
    `top_driver:${input.topDriver}`,
    `tags:${input.tags.join(",") || "none"}`,
    input.score === null ? "" : `score:${input.score}`,
    input.humanEdit ? `human_correction:${input.humanEdit}` : "",
    input.rejectionReason ? `rejection_reason:${input.rejectionReason}` : "",
    `lesson:${input.lesson}`,
  ].filter(Boolean).join(" | ");
}

function createTextEmbedding(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = tokenizeEmbeddingText(text);
  const features = [...tokens];
  for (let index = 0; index < tokens.length - 1; index += 1) {
    features.push(`${tokens[index]}_${tokens[index + 1]}`);
  }

  for (const token of features) {
    const hash = hashString(token);
    const slot = Math.abs(hash) % EMBEDDING_DIMENSIONS;
    const sign = hash % 2 === 0 ? 1 : -1;
    const weight = token.includes("_") ? 0.65 : 1;
    vector[slot] += sign * weight;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / norm).toFixed(6)));
}

function tokenizeEmbeddingText(text: string): string[] {
  const stopwords = new Set([
    "the", "and", "or", "a", "an", "to", "of", "for", "with", "was", "is",
    "are", "be", "this", "that", "from", "into", "as", "by", "on", "in",
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !stopwords.has(token))
    .slice(0, 160);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash | 0;
}

function parseVector(value: unknown): number[] {
  if (typeof value !== "string") {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.map((item) => normalizeNumber(item)).slice(0, EMBEDDING_DIMENSIONS)
      : [];
  } catch {
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length) {
    return 0;
  }
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  return dot / ((Math.sqrt(normA) || 1) * (Math.sqrt(normB) || 1));
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value !== "string") {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

async function buildAskRagPacket(
  env: Env,
  question: string,
  selectedPatientValue: unknown,
  rankedPatientsValue: unknown,
): Promise<Record<string, unknown>> {
  const retrievalNotes: string[] = [];
  const packet: Record<string, unknown> = {
    retrieval_notes: retrievalNotes,
  };

  let primaryPatientId = "";
  let primarySentinel: SentinelOutput | null = null;
  let selectedName = "";

  if (isRecord(selectedPatientValue)) {
    const selectedSummary = summarizePatientRecordForAsk(selectedPatientValue);
    packet.selected_patient = selectedSummary;
    selectedName = readString(selectedSummary.name, "");
    primaryPatientId = readPatientIdFromRiskRecord(selectedPatientValue);
    primarySentinel = readSentinelFromRiskRecord(selectedPatientValue);
    retrievalNotes.push("Selected patient profile was used as retrieved patient context.");
  }

  const nameCandidate = extractPatientNameFromGeneralQuestion(question);
  if (
    nameCandidate &&
    (!selectedName || !namesRoughlyMatch(nameCandidate, selectedName))
  ) {
    try {
      const candidates = await findPatientsByName(env, nameCandidate, 1);
      const patient = candidates[0];
      if (patient) {
        const calibration = await getCalibration(env);
        const risk = await buildPatientRisk(env, patient, calibration);
        packet.named_patient = summarizeBuiltPatientRiskForAsk(risk);
        primaryPatientId = patient.id;
        primarySentinel = risk.sentinel;
        retrievalNotes.push(`Live patient profile retrieved for ${risk.displayName}.`);
      }
    } catch (error) {
      packet.named_patient_lookup_status =
        `Live named-patient lookup unavailable: ${error instanceof Error ? error.message : "query failed"}`;
    }
  }

  const rankedPatients = Array.isArray(rankedPatientsValue)
    ? rankedPatientsValue.filter(isRecord)
    : [];
  if (rankedPatients.length > 0) {
    packet.current_population_ranking = summarizeRankedPatientsForAsk(rankedPatients);
    retrievalNotes.push("Current population ranking was included as retrieved context.");
  } else if (shouldRetrieveRankingForAsk(question)) {
    try {
      const calibration = await getCalibration(env);
      const freshRanking = await rankPopulationPatients(env, calibration, 20);
      packet.current_population_ranking = summarizeRankedPatientsForAsk(
        freshRanking as unknown as Array<Record<string, unknown>>,
      );
      retrievalNotes.push("Fresh Top 20 Sentinel ranking was retrieved for the question.");
    } catch (error) {
      packet.ranking_lookup_status =
        `Population ranking lookup unavailable: ${error instanceof Error ? error.message : "query failed"}`;
    }
  }

  if (env.DB) {
    const memory: Record<string, unknown> = {};
    try {
      memory.stats = await getRagStats(env);
    } catch {
      memory.stats = { message: "D1 memory stats unavailable for this request." };
    }
    try {
      memory.recent_lessons = await dbAll(
        env,
        `SELECT outcome, top_driver, risk_bucket, lesson, created_at
         FROM rag_examples
         ORDER BY created_at DESC LIMIT 5`,
      );
    } catch {
      memory.recent_lessons = [];
    }
    if (primaryPatientId) {
      try {
        memory.patient_memory = await getPatientMemory(env, primaryPatientId);
      } catch {
        memory.patient_memory = { message: "No patient-specific memory retrieved." };
      }
    }
    if (primarySentinel) {
      try {
        memory.embedding_similar_lessons = await retrieveSemanticRagExamples(env, primarySentinel);
      } catch {
        memory.embedding_similar_lessons = [];
      }
    }
    packet.d1_memory = memory;
  }

  return packet;
}

function summarizeBuiltPatientRiskForAsk(risk: PatientRisk): Record<string, unknown> {
  return {
    name: risk.displayName,
    score: risk.score,
    risk_bucket: risk.riskLevel,
    priority: risk.sentinel.priority,
    top_driver: risk.sentinel.top_driver,
    tags: risk.sentinel.tags,
    score_breakdown: risk.sentinel.breakdown,
    patient_evidence: {
      age: risk.patient.age,
      ed_visits: risk.patient.ed_visits,
      inpatient_visits: risk.patient.inpatient_visits,
      chronic_condition_count: risk.patient.chronic_condition_count,
      active_care_plan: Boolean(risk.patient.has_active_careplan),
      ed_inpatient_total_cost: risk.patient.ed_inpatient_total_cost,
    },
    chronic_conditions: risk.clinicalDrivers.slice(0, 10),
    barriers: risk.barriers.slice(0, 8),
    sdoh_signals: risk.sdohConditions.slice(0, 8),
    prapare_signals: risk.prapareSignals.slice(0, 8),
    medication_signals: risk.medicationSignals,
    financial_signals: risk.financialSignals,
    recent_ed_examples: risk.recentEd.slice(0, 3).map((encounter) => ({
      date: encounter.START,
      reason: encounter.REASONDESCRIPTION || encounter.DESCRIPTION,
      cost: encounter.TOTAL_CLAIM_COST,
    })),
    risk_score_advisory: risk.riskReview,
    management_plan: summarizeCoordinatorForAsk(risk.coordinator as unknown as Record<string, unknown>),
  };
}

function summarizePatientRecordForAsk(record: Record<string, unknown>): Record<string, unknown> {
  const patient = isRecord(record.patient) ? record.patient : {};
  const sentinel = isRecord(record.sentinel) ? record.sentinel : {};
  const coordinator = isRecord(record.coordinator) ? record.coordinator : {};
  const name = readString(
    record.displayName,
    cleanName(readString(patient.first, ""), readString(patient.last, "")) || "selected patient",
  );
  return {
    name,
    score: normalizeNumber(record.score ?? sentinel.score),
    risk_bucket: readString(record.riskLevel, readString(sentinel.bucket, "")),
    priority: readString(sentinel.priority, ""),
    top_driver: readString(sentinel.top_driver, ""),
    tags: parseStringArray(sentinel.tags),
    score_breakdown: isRecord(sentinel.breakdown) ? sentinel.breakdown : {},
    patient_evidence: {
      age: patient.age ?? null,
      ed_visits: patient.ed_visits ?? null,
      inpatient_visits: patient.inpatient_visits ?? null,
      chronic_condition_count: patient.chronic_condition_count ?? null,
      active_care_plan: normalizeNumber(patient.has_active_careplan) === 1,
      ed_inpatient_total_cost: patient.ed_inpatient_total_cost ?? null,
    },
    chronic_conditions: parseStringArray(record.clinicalDrivers).slice(0, 10),
    barriers: parseStringArray(record.barriers).slice(0, 8),
    sdoh_signals: parseStringArray(record.sdohConditions).slice(0, 8),
    prapare_signals: parseStringArray(record.prapareSignals).slice(0, 8),
    medication_signals: isRecord(record.medicationSignals) ? record.medicationSignals : {},
    financial_signals: isRecord(record.financialSignals) ? record.financialSignals : {},
    risk_score_advisory: isRecord(record.riskReview) ? record.riskReview : {},
    management_plan: summarizeCoordinatorForAsk(coordinator),
  };
}

function summarizeCoordinatorForAsk(coordinator: Record<string, unknown>): Record<string, unknown> {
  const intervention = isRecord(coordinator.recommended_intervention)
    ? coordinator.recommended_intervention
    : {};
  return {
    risk_summary: readString(coordinator.risk_summary, ""),
    top_barriers: Array.isArray(coordinator.top_barriers)
      ? coordinator.top_barriers.filter(isRecord).slice(0, 4)
      : [],
    recommended_action: readString(intervention.action, ""),
    rationale: readString(intervention.rationale, ""),
    talking_points: parseStringArray(intervention.talking_points).slice(0, 4),
    patient_facing_outreach: readString(coordinator.patient_facing_outreach, ""),
    priority_reason: readString(coordinator.priority_reason, ""),
  };
}

function summarizeRankedPatientsForAsk(
  patients: Array<Record<string, unknown>>,
): Record<string, unknown> {
  const summarized = patients.slice(0, 20).map((patient) => ({
    name: readString(patient.displayName, "Unknown patient"),
    score: normalizeNumber(patient.score),
    risk_bucket: readRiskBucket(patient),
    priority: readString(patient.priority, ""),
    top_driver: readString(patient.topDriver, readString(patient.top_driver, "")),
    tags: parseStringArray(patient.tags),
    score_breakdown: isRecord(patient.breakdown) ? patient.breakdown : {},
  }));
  return {
    scope: "Top ranked patients from Sentinel scoring",
    count: summarized.length,
    patients: summarized,
  };
}

function readPatientIdFromRiskRecord(record: Record<string, unknown>): string {
  const patient = isRecord(record.patient) ? record.patient : {};
  return readString(patient.id, readString(record.id, ""));
}

function readSentinelFromRiskRecord(record: Record<string, unknown>): SentinelOutput | null {
  const sentinel = isRecord(record.sentinel) ? record.sentinel : null;
  if (!sentinel) {
    return null;
  }
  const breakdown = isRecord(sentinel.breakdown) ? sentinel.breakdown : {};
  return {
    score: normalizeNumber(sentinel.score),
    bucket: readString(sentinel.bucket, readString(record.riskLevel, "Low")) as SentinelOutput["bucket"],
    priority: readString(sentinel.priority, "P2") as SentinelOutput["priority"],
    tags: parseStringArray(sentinel.tags),
    top_driver: readString(sentinel.top_driver, ""),
    breakdown: {
      A: normalizeNumber(breakdown.A),
      B: normalizeNumber(breakdown.B),
      C: normalizeNumber(breakdown.C),
      D: normalizeNumber(breakdown.D),
      E: normalizeNumber(breakdown.E),
      F: normalizeNumber(breakdown.F),
      G: normalizeNumber(breakdown.G),
    },
    triage: readString(sentinel.triage, "IGNORE") as SentinelOutput["triage"],
  };
}

function shouldRetrieveRankingForAsk(question: string): boolean {
  return Boolean(
    question.toLowerCase().match(
      /\b(top|rank|ranking|highest|who is next|who should|which patients|list patients|population|high risk|medium risk|low risk)\b/,
    ),
  );
}

function shouldAnswerFromAskRag(question: string, packet: Record<string, unknown>): boolean {
  const normalized = question.toLowerCase();
  const hasPatientContext = isRecord(packet.selected_patient) || isRecord(packet.named_patient);
  const hasRankingContext = isRecord(packet.current_population_ranking);
  const hasMemoryContext = isRecord(packet.d1_memory);

  if (
    hasPatientContext &&
    normalized.match(
      /\b(chronic|condition|management|care plan|plan|intervention|recommend|outreach|barrier|why|risk|score|driver|medication|debt|cost|summary|profile|sdoh|prapare)\b/,
    )
  ) {
    return true;
  }

  if (
    hasRankingContext &&
    normalized.match(/\b(top|rank|ranking|who is next|who should|which patients|list|scores?|priority|bucket)\b/)
  ) {
    return true;
  }

  if (
    hasMemoryContext &&
    normalized.match(/\b(memory|learn|rag|decision history|past decision|approved|rejected|modified)\b/)
  ) {
    return true;
  }

  return false;
}

function describeAskRagLookups(packet: Record<string, unknown>): AskResponse["queries"] {
  const lookups: AskResponse["queries"] = [];
  if (isRecord(packet.selected_patient)) {
    lookups.push({
      label: "Selected patient RAG profile",
      sql: "Browser-selected patient profile + Sentinel score",
      rowCount: 1,
    });
  }
  if (isRecord(packet.named_patient)) {
    lookups.push({
      label: "Named patient RAG profile",
      sql: "Live patient lookup + deterministic Sentinel scoring",
      rowCount: 1,
    });
  }
  const ranking = isRecord(packet.current_population_ranking)
    ? packet.current_population_ranking
    : null;
  const rankedPatients = Array.isArray(ranking?.patients) ? ranking.patients : [];
  if (rankedPatients.length > 0) {
    lookups.push({
      label: "Population ranking RAG context",
      sql: "Top 20 deterministic Sentinel ranking",
      rowCount: rankedPatients.length,
    });
  }
  if (isRecord(packet.d1_memory)) {
    lookups.push({
      label: "D1 memory RAG context",
      sql: "Decision Trail lessons + embedding-similar examples",
      rowCount: 1,
    });
  }
  return lookups;
}

function extractPatientNameFromGeneralQuestion(question: string): string {
  const riskName = extractPatientNameFromRiskQuestion(question);
  if (riskName) {
    return riskName;
  }

  const normalized = question
    .replace(/['’]s\b/gi, " ")
    .replace(/[?!.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const patterns = [
    /\b(?:what\s+(?:are|is)|what'?s|how\s+much\s+(?:is|are)|show|tell|give|list|explain)\s+(.+?)\s+(?:outstanding\s+medical\s+debt|medical\s+debt|outstanding\s+debt|debt|balance|bill|bills|financial)\b/i,
    /\b(?:outstanding\s+medical\s+debt|medical\s+debt|outstanding\s+debt|debt|balance|bill|bills|financial)\s+(?:for|of|about)\s+(.+?)$/i,
    /\b(?:outstanding|balance)\s+(?:for|of|about)\s+(.+?)\s+(?:debt|bill|bills)?$/i,
    /\b(?:what\s+(?:are|is)|show|tell|give|list|explain)\s+(.+?)\s+(?:chronic|condition|conditions|management|care\s+plan|risk|barrier|barriers|recommendation|outreach|profile|medication|debt)\b/i,
    /\b(?:chronic|condition|conditions|management|care\s+plan|risk|barrier|barriers|recommendation|outreach|profile|medication|debt)\s+(?:for|of|about)\s+(.+?)$/i,
    /\b(?:for|of|about)\s+(.+?)\s+(?:chronic|condition|conditions|management|care\s+plan|risk|barrier|barriers|recommendation|outreach|profile|medication|debt)\b/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const candidate = cleanupPatientNameCandidate(match[1]);
      if (isLikelyPatientNameCandidate(candidate)) {
        return candidate;
      }
    }
  }

  return "";
}

function isLikelyPatientNameCandidate(candidate: string): boolean {
  const tokens = candidate.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens.length > 4) {
    return false;
  }
  const generic = new Set([
    "what", "which", "who", "why", "how", "the", "this", "that", "patient",
    "patients", "risk", "high", "medium", "low", "total", "number", "count",
    "condition", "conditions", "management", "plan", "care", "score",
  ]);
  return tokens.some((token) => !generic.has(token));
}

function namesRoughlyMatch(candidate: string, name: string): boolean {
  const normalizedName = name.toLowerCase();
  const tokens = candidate.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => normalizedName.includes(token));
}

async function buildQuestionQueryPlan(
  env: Env,
  question: string,
  selectedPatient: string,
  rankedPatients: string,
  askRagPacket: string,
): Promise<Array<{ label: string; sql: string }>> {
  const prompt = `
You help a care coordinator answer questions about a synthetic patient dataset.
Create at most 3 SQLite SELECT queries needed to answer the user's question.
If the database RAG packet or selected patient context already answers the question, return an empty queries array.
For patient-specific interpretation questions such as chronic conditions, management plan, why high risk, what should we do, explain the score, barriers, or outreach, prefer the RAG packet and return no queries.

Rules:
- Only SELECT statements.
- Always include LIMIT 20 or lower unless using a single aggregate row.
- Use patient_summary as the starting table.
- patient_summary columns: id, first, last, age, gender, race, ethnicity, income, city, state, zip, total_visits, ed_visits, inpatient_visits, ed_inpatient_total_cost, chronic_condition_count, has_active_careplan.
- conditions columns: START, STOP, PATIENT, ENCOUNTER, DESCRIPTION. Use START for ordering, not DATE.
- medications columns: START, STOP, PATIENT, DESCRIPTION. Use START for ordering.
- observations columns: DATE, PATIENT, DESCRIPTION, VALUE. Use DATE for ordering.
- encounters columns: START, STOP, PATIENT, ENCOUNTERCLASS, DESCRIPTION, TOTAL_CLAIM_COST, REASONDESCRIPTION. Use START for ordering.
- procedures and careplans use PATIENT as the patient id column.
- claims_transactions uses PATIENTID, not PATIENT.
- Names have numeric suffixes, so for name search use LOWER(first) LIKE '%token%' and LOWER(last) LIKE '%token%'.
- Do not write INSERT, UPDATE, DELETE, DROP, PRAGMA, WITH, or multiple statements.
- Do not use ORDER BY COUNT(*) unless the query has GROUP BY and COUNT(*) is selected with an alias.

Selected patient context:
${selectedPatient || "none"}

Current ranked patients:
${rankedPatients || "none"}

Database RAG packet already retrieved:
${askRagPacket || "none"}

Question:
${question}

Return strict JSON:
{
  "queries": [
    { "label": "short label", "sql": "SELECT ..." }
  ]
}
`;

  const raw = await callGroq(env, [
    {
      role: "system",
      content: "Return strict JSON only. No markdown.",
    },
    { role: "user", content: prompt },
  ], 700, "ask");
  const parsed = raw ? parseJsonObject(raw) : null;
  const queries = Array.isArray(parsed?.queries) ? parsed.queries : [];
  return queries
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }
      const record = item as Record<string, unknown>;
      return {
        label: readString(record.label, "Data lookup"),
        sql: readString(record.sql, ""),
      };
    })
    .filter((item): item is { label: string; sql: string } => Boolean(item?.sql))
    .slice(0, 3);
}

async function answerQuestionWithGroq(
  env: Env,
  question: string,
  selectedPatient: string,
  rankedPatients: string,
  askRagPacket: Record<string, unknown>,
  queryResults: AskQueryResult[],
): Promise<Omit<AskResponse, "queries">> {
  const prompt = `
You are the Q&A layer for a healthcare care-coordination agent.
The database RAG packet below is the primary source. It was retrieved from live patient data, current Sentinel rankings, and Cloudflare D1 decision memory before you were called.
Answer the user's question in plain English, grounded only in the database RAG packet, selected patient context, ranked patients, and public query summaries below.
If a supplemental query failed but the RAG packet answers the question, do not mention the failure and do not ask the user to retry.
If data is truly missing from every source, say exactly what is missing. Do not invent clinical facts.
Keep the answer concise but useful for a 5-minute hackathon demo.
Do not expose raw technical identifiers or coding fields such as PATIENT, PATIENTID, ENCOUNTER, SYSTEM, CODE, START, STOP, or UUIDs.
Prefer patient names, risk scores, ED visits, chronic condition counts, care plan status, condition descriptions, social barriers, medications, debt, and recommendation-relevant facts.
For chronic-condition and management-plan questions, use the patient chronic_conditions and management_plan fields from the RAG packet.
For debt, outstanding balance, bill, or financial-barrier questions, answer directly from financial_signals.totalOutstanding or financial_signals.total_outstanding.
For questions about whether the score makes sense, use risk_score_advisory. Make clear it is advisory and does not override Sentinel.

Database RAG packet:
${compactJson(askRagPacket, 18000)}

Selected patient context:
${selectedPatient || "none"}

Current ranked patients:
${rankedPatients || "none"}

Supplemental public query summaries:
${compactJson(buildPublicQueryContext(queryResults), 12000)}

Question:
${question}

Return strict JSON:
{
  "answer": "direct answer, 2-5 sentences or a compact list",
  "evidence": ["specific data point 1", "specific data point 2"],
  "followUp": "one useful follow-up question the coordinator could ask next"
}
`;

  const raw = await callGroq(env, [
    {
      role: "system",
      content: "Return strict JSON only. No markdown.",
    },
    { role: "user", content: prompt },
  ], 900, "ask");
  const parsed = raw ? parseJsonObject(raw) : null;

  if (!parsed) {
    const plainAnswer = sanitizePlainGroqAnswer(raw);
    if (plainAnswer) {
      return {
        answer: plainAnswer,
        evidence: queryResults
          .filter((item) => !item.error)
          .map((item) => `${item.label}: ${item.rows.length} row(s)`)
          .slice(0, 5),
        followUp: "Ask me to explain the score drivers or recommend the next action.",
      };
    }
    return buildDeterministicAskFallback(
      question,
      selectedPatient,
      rankedPatients,
      askRagPacket,
      queryResults,
    );
  }

  const fallback = buildDeterministicAskFallback(
    question,
    selectedPatient,
    rankedPatients,
    askRagPacket,
    queryResults,
  );
  const answerText = stripTechnicalIdentifiers(
    readString(parsed.answer, fallback.answer),
  );
  if (
    isUnhelpfulDataFailureAnswer(answerText) &&
    hasUsableAskRagContext(askRagPacket)
  ) {
    return fallback;
  }

  return {
    answer: answerText || fallback.answer,
    evidence: Array.isArray(parsed.evidence)
      ? parsed.evidence
          .filter((item): item is string => typeof item === "string")
          .map(stripTechnicalIdentifiers)
          .filter(Boolean)
          .slice(0, 5)
      : fallback.evidence,
    followUp: stripTechnicalIdentifiers(
      readString(parsed.followUp, fallback.followUp),
    ),
  };
}

function buildPublicQueryContext(queryResults: AskQueryResult[]): Array<Record<string, unknown>> {
  return queryResults.map((item) => {
    if (item.error) {
      return {
        label: item.label,
        status: "supplemental lookup unavailable",
      };
    }
    const summaries = item.rows
      .slice(0, 12)
      .map(summarizeResultRow)
      .filter(Boolean);
    return {
      label: item.label,
      status: "ok",
      row_count: item.rows.length,
      rows: summaries.length ? summaries : ["Rows returned, but no public-facing fields were useful."],
    };
  });
}

function buildAskRagFallbackAnswer(
  question: string,
  packet: Record<string, unknown>,
): Omit<AskResponse, "queries"> | null {
  const patient = getPrimaryAskRagPatient(packet);
  const normalized = question.toLowerCase();
  if (patient) {
    const name = readString(patient.name, "the selected patient");
    const score = readString(patient.score, "n/a");
    const risk = readString(patient.risk_bucket, "risk unknown");
    const evidence = isRecord(patient.patient_evidence) ? patient.patient_evidence : {};
    const conditions = parseStringArray(patient.chronic_conditions).slice(0, 6);
    const barriers = parseStringArray(patient.barriers).slice(0, 5);
    const plan = isRecord(patient.management_plan) ? patient.management_plan : {};
    const financialSignals = isRecord(patient.financial_signals) ? patient.financial_signals : {};
    const action = readString(plan.recommended_action, "");
    const rationale = readString(plan.rationale, "");

    if (normalized.match(/\b(debt|outstanding|balance|bill|bills|financial|cost|owed|owe)\b/)) {
      const totalOutstanding = normalizeNumber(
        financialSignals.totalOutstanding ??
        financialSignals.total_outstanding ??
        financialSignals.outstanding_debt,
      );
      const lowIncome = Boolean(financialSignals.lowIncome ?? financialSignals.low_income);
      return {
        answer: totalOutstanding > 0
          ? `${name}'s outstanding medical debt is ${formatCurrency(totalOutstanding)}. This is treated as a financial barrier in the retrieved profile${lowIncome ? ", alongside a low-income signal" : ""}.`
          : `${name} does not have a positive outstanding medical debt amount in the retrieved profile.`,
        evidence: [
          `Outstanding medical debt: ${formatCurrency(totalOutstanding)}`,
          `${name}: Sentinel score ${score}/100, ${risk} risk`,
          `Financial barrier flag: ${totalOutstanding > 10000 ? "high debt" : "not high debt"}`,
        ],
        followUp: `Would you like me to explain how debt affected ${name}'s risk score?`,
      };
    }

    if (normalized.match(/\b(chronic|condition|conditions|management|care plan|plan)\b/)) {
      const conditionText = conditions.length
        ? conditions.join(", ")
        : "no active chronic condition descriptions were included in the retrieved profile";
      const planText = action
        ? `${action}${rationale ? ` Rationale: ${rationale}` : ""}`
        : "no coordinator management plan was included in the retrieved profile";
      return {
        answer: `${name}'s retrieved chronic-condition profile includes: ${conditionText}. The current coordinator management plan is: ${planText}`,
        evidence: [
          `${name}: Sentinel score ${score}/100, ${risk} risk`,
          `ED visits: ${readString(evidence.ed_visits, "n/a")}`,
          `Chronic condition count: ${readString(evidence.chronic_condition_count, "n/a")}`,
          `Care plan active: ${readString(evidence.active_care_plan, "unknown")}`,
        ],
        followUp: `Would you like me to turn this into patient-facing outreach for ${name}?`,
      };
    }

    return {
      answer: `${name} is ${risk} risk with a Sentinel score of ${score}/100. Key drivers in the retrieved profile include ${readString(patient.top_driver, "the Sentinel top driver")}, ${readString(evidence.ed_visits, "n/a")} ED visits, ${readString(evidence.chronic_condition_count, "n/a")} chronic conditions, and ${barriers.slice(0, 2).join("; ") || "no additional barrier text in context"}.`,
      evidence: [
        `${name}: Sentinel score ${score}/100`,
        `Risk bucket: ${risk}`,
        `Top driver: ${readString(patient.top_driver, "n/a")}`,
      ],
      followUp: `Ask for ${name}'s chronic conditions, barriers, or outreach plan.`,
    };
  }

  const ranking = isRecord(packet.current_population_ranking)
    ? packet.current_population_ranking
    : null;
  const rankedPatients = Array.isArray(ranking?.patients)
    ? ranking.patients.filter(isRecord)
    : [];
  if (rankedPatients.length > 0) {
    const top = rankedPatients.slice(0, 10).map((patient) =>
      `${readString(patient.name, "Unknown patient")} (${readString(patient.risk_bucket, "risk unknown")}, score ${readString(patient.score, "n/a")})`,
    );
    return {
      answer: `From the retrieved Sentinel ranking, the top patients are: ${top.join(", ")}.`,
      evidence: [`Ranking context included ${rankedPatients.length} patient(s)`],
      followUp: "Ask me to explain one named patient from the ranking.",
    };
  }

  return null;
}

function getPrimaryAskRagPatient(packet: Record<string, unknown>): Record<string, unknown> | null {
  if (isRecord(packet.named_patient)) {
    return packet.named_patient;
  }
  if (isRecord(packet.selected_patient)) {
    return packet.selected_patient;
  }
  return null;
}

function hasUsableAskRagContext(packet: Record<string, unknown>): boolean {
  return Boolean(
    isRecord(packet.selected_patient) ||
    isRecord(packet.named_patient) ||
    isRecord(packet.current_population_ranking),
  );
}

function isUnhelpfulDataFailureAnswer(answer: string): boolean {
  return Boolean(
    answer.toLowerCase().match(
      /\b(failed data api|data api request failed|cannot determine|could not determine|please retry|try again)\b/,
    ),
  );
}

function buildDeterministicAskFallback(
  question: string,
  selectedPatient: string,
  rankedPatients: string,
  askRagPacket: Record<string, unknown>,
  queryResults: AskQueryResult[],
): Omit<AskResponse, "queries"> {
  const ragFallback = buildAskRagFallbackAnswer(question, askRagPacket);
  if (ragFallback) {
    return ragFallback;
  }

  const successfulQueries = queryResults.filter((item) => !item.error);
  const rows = successfulQueries.flatMap((item) => item.rows);
  if (rows.length > 0) {
    const summaries = uniqueStrings(rows.map(summarizeResultRow).filter(Boolean)).slice(0, 5);
    return {
      answer: summaries.length
        ? `Based on the live data: ${summaries.join(" ")}`
        : "The live data returned rows, but they only contained technical identifiers. Try asking for a patient summary, risk score, or care barriers.",
      evidence: successfulQueries.map((item) => `${item.label}: ${item.rows.length} row(s)`).slice(0, 5),
      followUp: "Ask me to explain one of these patients or run the population ranking.",
    };
  }

  const selected = parseJsonText(selectedPatient);
  if (isRecord(selected)) {
    const name = readString(selected.displayName, "selected patient");
    const score = readString(selected.score, "n/a");
    const riskLevel = readString(selected.riskLevel, "risk unknown");
    return {
      answer: `Based on the selected patient context, ${name} is ${riskLevel} risk with a score of ${score}.`,
      evidence: [`Selected patient: ${name}`, `Risk score: ${score}`, `Risk level: ${riskLevel}`],
      followUp: `Ask "why is ${name} ${riskLevel} risk?" for the score drivers.`,
    };
  }

  const ranked = parseJsonText(rankedPatients);
  if (Array.isArray(ranked) && ranked.length > 0) {
    const top = ranked
      .filter(isRecord)
      .slice(0, 5)
      .map((patient) => {
        const name = readString(patient.displayName, "Unknown patient");
        const score = readString(patient.score, "n/a");
        const risk = readString(patient.riskLevel, "risk unknown");
        return `${name} (${risk}, ${score})`;
      });
    return {
      answer: `Based on the visible ranking, the top results are: ${top.join(", ")}.`,
      evidence: [`Visible ranking: ${ranked.length} patient(s)`],
      followUp: "Click a ranked patient, then ask why they are high risk.",
    };
  }

  const errors = queryResults
    .filter((item) => item.error)
    .map((item) => `${item.label}: ${item.error}`)
    .slice(0, 3);

  return {
    answer: `I could not answer "${question}" from the available context. Run a population ranking or select a patient first, then ask again.`,
    evidence: errors,
    followUp: "Try: 'how many high risk patients?' or 'why is Lindsay high risk?'",
  };
}

function summarizeResultRow(row: Record<string, unknown>): string {
  const name = readString(row.patient_name, "")
    || readString(row.displayName, "")
    || readString(row.name, "")
    || (readString(row.first, "") || readString(row.last, "")
      ? cleanName(readString(row.first, ""), readString(row.last, ""))
      : "");

  const fields = usefulRowFacts(row);
  if (name) {
    return `${name}${fields.length ? ` (${fields.join(", ")})` : ""}.`;
  }
  return fields.length ? `${fields.join(", ")}.` : "";
}

function usefulRowFacts(row: Record<string, unknown>): string[] {
  const facts: string[] = [];
  const push = (label: string, value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return;
    }
    const text = String(value);
    if (looksLikeUuid(text)) {
      return;
    }
    facts.push(`${label}: ${text}`);
  };

  push("count", row.count ?? row.COUNT ?? row.total ?? row.TOTAL);
  push("age", row.age ?? row.AGE);
  push("gender", row.gender ?? row.GENDER);
  push("race", row.race ?? row.RACE);
  push("ethnicity", row.ethnicity ?? row.ETHNICITY);
  push("ED visits", row.ed_visits ?? row.emergency_visits ?? row.ED_VISITS);
  push("total visits", row.total_visits ?? row.TOTAL_VISITS);
  push("inpatient visits", row.inpatient_visits ?? row.INPATIENT_VISITS);
  push("conditions", row.chronic_condition_count ?? row.CHRONIC_CONDITION_COUNT);
  const carePlan = row.has_active_careplan ?? row.HAS_ACTIVE_CAREPLAN;
  if (carePlan !== undefined && carePlan !== null && carePlan !== "") {
    facts.push(`care plan: ${normalizeNumber(carePlan) ? "active" : "none"}`);
  }
  push("risk score", row.risk_score ?? row.score ?? row.SCORE);
  push("risk bucket", row.risk_bucket ?? row.bucket ?? row.BUCKET);
  push("priority", row.priority ?? row.PRIORITY);
  push("description", row.DESCRIPTION ?? row.description);
  push("value", row.VALUE ?? row.value);
  push("reason", row.REASONDESCRIPTION ?? row.reason_description);
  push("encounter class", row.ENCOUNTERCLASS ?? row.encounterclass);
  push("claim cost", row.TOTAL_CLAIM_COST ?? row.total_claim_cost);
  push("outstanding debt", row.total_outstanding ?? row.TOTAL_OUTSTANDING ?? row.outstanding_debt);
  push("total cost", row.ed_inpatient_total_cost ?? row.ED_INPATIENT_TOTAL_COST);

  return uniqueStrings(facts).slice(0, 5);
}

function sanitizePlainGroqAnswer(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  const cleaned = stripTechnicalIdentifiers(raw
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim());
  if (!cleaned || cleaned.startsWith("{") || cleaned.length < 20) {
    return null;
  }
  return cleaned.slice(0, 900);
}

function stripTechnicalIdentifiers(value: string): string {
  return value
    .replace(/\b(PATIENTID|PATIENT|ENCOUNTER|SYSTEM|CODE|START|STOP):\s*[^,\n.]+[,.\n]?/gi, "")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function answerRiskBucketCountQuestion(
  env: Env,
  question: string,
  rankedPatientsValue: unknown,
): Promise<AskResponse | null> {
  const normalized = question.toLowerCase();
  const asksCount = /\b(total|how many|number of|count)\b/.test(normalized);
  if (!asksCount || !/\brisk\b/.test(normalized)) {
    return null;
  }

  const bucket = normalized.match(/\bhigh[- ]risk\b|\bhigh\b/)
    ? "High"
    : normalized.match(/\bmedium[- ]risk\b|\bmedium\b/)
      ? "Medium"
      : normalized.match(/\blow[- ]risk\b|\blow\b/)
        ? "Low"
        : null;

  if (!bucket) {
    return null;
  }

  let rankedPatients = Array.isArray(rankedPatientsValue)
    ? rankedPatientsValue.filter(isRecord)
    : [];
  let source = "current ranked list";

  if (rankedPatients.length === 0) {
    const calibration = await getCalibration(env);
    rankedPatients = await rankPopulationPatients(env, calibration, 20) as unknown as Array<Record<string, unknown>>;
    source = "fresh Top 20 Sentinel ranking";
  }

  const matching = rankedPatients.filter((patient) =>
    readRiskBucket(patient) === bucket,
  );
  const names = matching
    .slice(0, 6)
    .map((patient) => {
      const name = readString(patient.displayName, "Unknown patient");
      const score = readString(patient.score, "n/a");
      const priority = readString(patient.priority, "");
      return `${name} (score ${score}${priority ? `, priority ${priority}` : ""})`;
    });

  const computedAnswer: AskResponse = {
    answer: `There ${matching.length === 1 ? "is" : "are"} ${matching.length} ${bucket.toLowerCase()}-risk patient${matching.length === 1 ? "" : "s"} in the ${source}.` +
      (names.length ? ` ${matching.length === 1 ? "Patient" : "Patients"}: ${names.join(", ")}.` : ""),
    evidence: [
      `${source}: ${rankedPatients.length} patients checked`,
      `${bucket} risk count: ${matching.length}`,
      ...names.slice(0, 3),
    ],
    queries: [
      {
        label: source === "current ranked list" ? "Visible Sentinel ranking" : "Fresh Top 20 Sentinel ranking",
        sql: "Sentinel deterministic scoring, not a raw SQL risk column",
        rowCount: rankedPatients.length,
      },
    ],
    followUp: `Would you like me to explain the top ${bucket.toLowerCase()}-risk patient?`,
  };

  if (!getGroqApiKey(env, "ask")) {
    return computedAnswer;
  }

  const raw = await callGroq(env, [
    {
      role: "system",
      content: "Return strict JSON only. You are wording a computed healthcare dashboard answer. Do not change the numbers. Do not describe risk score as age.",
    },
    {
      role: "user",
      content: `
User question: ${question}

Computed Sentinel result:
${JSON.stringify({
  source,
  bucket,
  checked: rankedPatients.length,
  count: matching.length,
  patients: matching.slice(0, 6).map((patient) => ({
    name: readString(patient.displayName, "Unknown patient"),
    risk_score: readString(patient.score, "n/a"),
    priority: readString(patient.priority, ""),
    risk_bucket: readRiskBucket(patient),
  })),
})}

Return JSON:
{
  "answer": "1-3 sentence answer using the computed numbers exactly",
  "evidence": ["short evidence item 1", "short evidence item 2"],
  "followUp": "one useful next question"
}
`,
    },
  ], 500, "ask");
  const parsed = raw ? parseJsonObject(raw) : null;

  if (!parsed) {
    return computedAnswer;
  }

  const groqAnswer = readString(parsed.answer, computedAnswer.answer);
  if (/\byears?\s+old\b/i.test(groqAnswer)) {
    return computedAnswer;
  }

  return {
    ...computedAnswer,
    answer: groqAnswer,
    evidence: Array.isArray(parsed.evidence)
      ? parsed.evidence.filter((item): item is string => typeof item === "string").slice(0, 5)
      : computedAnswer.evidence,
    followUp: readString(parsed.followUp, computedAnswer.followUp),
  };
}

function readRiskBucket(patient: Record<string, unknown>): string {
  const riskLevel = readString(patient.riskLevel, "");
  if (riskLevel) {
    return riskLevel;
  }
  const bucket = readString(patient.bucket, "");
  if (bucket) {
    return bucket;
  }
  const sentinel = isRecord(patient.sentinel) ? patient.sentinel : null;
  return sentinel ? readString(sentinel.bucket, "") : "";
}

async function answerDirectDatabaseQuestion(
  env: Env,
  question: string,
  selectedPatientValue: unknown,
): Promise<AskResponse | null> {
  const normalized = question.toLowerCase();
  const intent = normalized.match(/\b(debt|outstanding|balance|bill|bills|owed|owe|financial)\b/)
    ? "debt"
    : normalized.match(/\b(chronic|condition|conditions|diagnosis|diagnoses)\b/)
      ? "conditions"
      : normalized.match(/\b(medication|medications|meds|opioid|opioids|polypharmacy)\b/)
        ? "medications"
        : normalized.match(/\b(care plan|careplan|management plan)\b/)
          ? "careplan"
          : normalized.match(/\b(ed visits|emergency visits|visits|inpatient|total visits|cost)\b/)
            ? "visits"
            : "";

  if (!intent) {
    return null;
  }

  const target = await resolveAskPatientTarget(env, question, selectedPatientValue);
  if (!target) {
    return null;
  }

  try {
    if (intent === "debt") {
      const sql = `
        SELECT ROUND(COALESCE(SUM(OUTSTANDING), 0), 2) AS total_outstanding
        FROM claims_transactions
        WHERE PATIENTID = '${escapeSql(target.id)}'
        LIMIT 1
      `;
      const rows = await queryDatabase<Record<string, unknown>>(env, sql);
      const total = rowNumber(rows[0] || {}, "total_outstanding", "TOTAL_OUTSTANDING");
      return {
        answer: `${target.name}'s outstanding medical debt is ${formatCurrency(total)}.`,
        evidence: [
          `claims_transactions outstanding balance: ${formatCurrency(total)}`,
          "Live database aggregate used: SUM(OUTSTANDING)",
          "Join key used: PATIENTID",
        ],
        queries: [
          {
            label: "claims_transactions outstanding debt",
            sql: "SELECT SUM(OUTSTANDING) FROM claims_transactions WHERE PATIENTID = <selected patient>",
            rowCount: rows.length,
          },
        ],
        followUp: `Would you like me to explain how financial barriers affect ${target.name}'s risk score?`,
      };
    }

    if (intent === "conditions") {
      const sql = `
        SELECT DESCRIPTION
        FROM conditions
        WHERE PATIENT = '${escapeSql(target.id)}' AND STOP IS NULL
        ORDER BY START DESC
        LIMIT 12
      `;
      const rows = await queryDatabase<Record<string, unknown>>(env, sql);
      const conditions = rows
        .map((row) => rowString(row, "DESCRIPTION", "description"))
        .filter(Boolean);
      return {
        answer: conditions.length
          ? `${target.name}'s active conditions in the live database include: ${conditions.join(", ")}.`
          : `${target.name} has no active conditions returned by the live conditions table.`,
        evidence: [`Active conditions returned: ${conditions.length}`],
        queries: [{
          label: "active conditions",
          sql: "SELECT DESCRIPTION FROM conditions WHERE PATIENT = <selected patient> AND STOP IS NULL",
          rowCount: rows.length,
        }],
        followUp: `Would you like the care plan recommendation for ${target.name}?`,
      };
    }

    if (intent === "medications") {
      const sql = `
        SELECT DESCRIPTION
        FROM medications
        WHERE PATIENT = '${escapeSql(target.id)}' AND STOP IS NULL
        ORDER BY START DESC
        LIMIT 12
      `;
      const rows = await queryDatabase<Record<string, unknown>>(env, sql);
      const medications = rows
        .map((row) => rowString(row, "DESCRIPTION", "description"))
        .filter(Boolean);
      return {
        answer: medications.length
          ? `${target.name}'s active medications in the live database include: ${medications.join(", ")}.`
          : `${target.name} has no active medications returned by the live medications table.`,
        evidence: [`Active medications returned: ${medications.length}`],
        queries: [{
          label: "active medications",
          sql: "SELECT DESCRIPTION FROM medications WHERE PATIENT = <selected patient> AND STOP IS NULL",
          rowCount: rows.length,
        }],
        followUp: `Would you like me to check medication risk for ${target.name}?`,
      };
    }

    if (intent === "careplan") {
      const sql = `
        SELECT DESCRIPTION, START, STOP
        FROM careplans
        WHERE PATIENT = '${escapeSql(target.id)}'
        ORDER BY START DESC
        LIMIT 8
      `;
      const rows = await queryDatabase<Record<string, unknown>>(env, sql);
      const active = rows.filter((row) => !rowString(row, "STOP", "stop"));
      const latest = rows
        .map((row) => rowString(row, "DESCRIPTION", "description"))
        .filter(Boolean)
        .slice(0, 3);
      return {
        answer: active.length
          ? `${target.name} has ${active.length} active care plan(s) in the live database. Latest plan descriptions: ${latest.join(", ") || "not described"}.`
          : `${target.name} has no active care plan in the live careplans table.`,
        evidence: [
          `Care plans returned: ${rows.length}`,
          `Active care plans: ${active.length}`,
        ],
        queries: [{
          label: "careplans",
          sql: "SELECT DESCRIPTION, START, STOP FROM careplans WHERE PATIENT = <selected patient>",
          rowCount: rows.length,
        }],
        followUp: `Would you like the Coordinator recommendation for ${target.name}?`,
      };
    }

    if (intent === "visits") {
      const sql = `
        SELECT ed_visits, inpatient_visits, total_visits, ed_inpatient_total_cost,
               chronic_condition_count, has_active_careplan
        FROM patient_summary
        WHERE id = '${escapeSql(target.id)}'
        LIMIT 1
      `;
      const rows = await queryDatabase<Record<string, unknown>>(env, sql);
      const row = rows[0] || {};
      return {
        answer: `${target.name} has ${rowNumber(row, "ed_visits")} ED visits, ${rowNumber(row, "inpatient_visits")} inpatient visits, and ${rowNumber(row, "total_visits")} total visits in patient_summary. ED/inpatient total cost is ${formatCurrency(rowNumber(row, "ed_inpatient_total_cost"))}.`,
        evidence: [
          `ED visits: ${rowNumber(row, "ed_visits")}`,
          `Inpatient visits: ${rowNumber(row, "inpatient_visits")}`,
          `ED/inpatient total cost: ${formatCurrency(rowNumber(row, "ed_inpatient_total_cost"))}`,
        ],
        queries: [{
          label: "patient_summary visit facts",
          sql: "SELECT visit and cost fields FROM patient_summary WHERE id = <selected patient>",
          rowCount: rows.length,
        }],
        followUp: `Would you like me to explain ${target.name}'s Sentinel score drivers?`,
      };
    }
  } catch {
    return null;
  }

  return null;
}

async function resolveAskPatientTarget(
  env: Env,
  question: string,
  selectedPatientValue: unknown,
): Promise<AskPatientTarget | null> {
  const selected = readSelectedAskPatientTarget(selectedPatientValue);
  const requestedName = extractPatientNameFromGeneralQuestion(question);
  if (requestedName && (!selected || !namesRoughlyMatch(requestedName, selected.name))) {
    const candidates = await findPatientsByName(env, requestedName, 1);
    const patient = candidates[0];
    return patient
      ? { id: patient.id, name: cleanName(patient.first, patient.last) }
      : selected;
  }
  if (selected) {
    return selected;
  }
  if (requestedName) {
    const candidates = await findPatientsByName(env, requestedName, 1);
    const patient = candidates[0];
    return patient
      ? { id: patient.id, name: cleanName(patient.first, patient.last) }
      : null;
  }
  return null;
}

function readSelectedAskPatientTarget(value: unknown): AskPatientTarget | null {
  if (!isRecord(value)) {
    return null;
  }
  const patient = isRecord(value.patient) ? value.patient : {};
  const id = readString(patient.id, readString(value.id, ""));
  if (!id) {
    return null;
  }
  const name = readString(
    value.displayName,
    cleanName(readString(patient.first, ""), readString(patient.last, "")),
  );
  return { id, name: name || "selected patient" };
}

async function answerNamedPatientRiskQuestion(
  env: Env,
  question: string,
  selectedPatientValue: unknown,
): Promise<AskResponse | null> {
  if (isRecord(selectedPatientValue)) {
    return null;
  }

  const name = extractPatientNameFromRiskQuestion(question);
  if (!name) {
    return null;
  }

  const candidates = await findPatientsByName(env, name, 1);
  const patient = candidates[0];
  if (!patient) {
    return null;
  }

  const calibration = await getCalibration(env);
  const risk = await buildPatientRisk(env, patient, calibration);
  const compactRisk = compactJson({
    displayName: risk.displayName,
    score: risk.score,
    riskLevel: risk.riskLevel,
    priority: risk.sentinel.priority,
    topDriver: risk.sentinel.top_driver,
    breakdown: risk.sentinel.breakdown,
    tags: risk.sentinel.tags,
    barriers: risk.barriers,
    clinicalDrivers: risk.clinicalDrivers,
    sdohConditions: risk.sdohConditions,
    prapareSignals: risk.prapareSignals,
    medicationSignals: risk.medicationSignals,
    financialSignals: risk.financialSignals,
    coordinator: risk.coordinator,
    patient: {
      ed_visits: risk.patient.ed_visits,
      chronic_condition_count: risk.patient.chronic_condition_count,
      has_active_careplan: risk.patient.has_active_careplan,
      ed_inpatient_total_cost: risk.patient.ed_inpatient_total_cost,
    },
  }, 9000);

  const raw = await callGroq(env, [
    {
      role: "system",
      content:
        "Return strict JSON only. Explain a patient's Sentinel risk from the provided scored profile. Do not invent facts. Do not expose raw IDs.",
    },
    {
      role: "user",
      content: `
Question: ${question}

Scored patient profile:
${compactRisk}

Return JSON:
{
  "answer": "2-4 sentence answer explaining the risk score, top driver, and 2-3 grounded reasons",
  "evidence": ["specific data point 1", "specific data point 2", "specific data point 3"],
  "followUp": "one useful next question"
}
`,
    },
  ], 700, "ask");
  const parsed = raw ? parseJsonObject(raw) : null;

  const fallbackAnswer = `${risk.displayName} is ${risk.riskLevel} risk with a Sentinel score of ${risk.score}/100 and priority ${risk.sentinel.priority}. The top driver is ${risk.sentinel.top_driver}; key evidence includes ${risk.patient.ed_visits} ED visits, ${risk.patient.chronic_condition_count} chronic conditions, ${risk.patient.has_active_careplan ? "an active care plan" : "no active care plan"}, and ${risk.barriers.slice(0, 2).join("; ") || "documented care barriers"}.`;

  return {
    answer: parsed ? readString(parsed.answer, fallbackAnswer) : fallbackAnswer,
    evidence: parsed && Array.isArray(parsed.evidence)
      ? parsed.evidence.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [
          `Sentinel score: ${risk.score}/100`,
          `Top driver: ${risk.sentinel.top_driver}`,
          `${risk.patient.ed_visits} ED visits`,
          `${risk.patient.chronic_condition_count} chronic conditions`,
        ],
    queries: [
      {
        label: "Named patient Sentinel analysis",
        sql: "Live patient lookup + deterministic Sentinel scoring",
        rowCount: 1,
      },
    ],
    followUp: parsed
      ? readString(parsed.followUp, `Should I draft outreach for ${risk.displayName}?`)
      : `Should I draft outreach for ${risk.displayName}?`,
  };
}

function extractPatientNameFromRiskQuestion(question: string): string {
  const normalized = question
    .replace(/[?!.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const patterns = [
    /\bwhy\s+is\s+(.+?)\s+(?:high\s+risk|medium\s+risk|low\s+risk|risky|p0|p1|p2)\b/i,
    /\bexplain\s+(.+?)\s+(?:high\s+risk|medium\s+risk|low\s+risk|risk|p0|p1|p2)\b/i,
    /\bwhy\s+(.+?)\s+(?:high\s+risk|medium\s+risk|low\s+risk|risky|p0|p1|p2)\b/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return cleanupPatientNameCandidate(match[1]);
    }
  }

  return "";
}

function cleanupPatientNameCandidate(value: string): string {
  return value
    .replace(/['’]s\b/gi, " ")
    .replace(/\b(patient|the|is|was|are|at|a|an|outstanding|medical|debt|balance|bill|bills|financial|of|for|about)\b/gi, " ")
    .replace(/[^a-z0-9'\-\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function answerMemoryQuestion(env: Env, question: string): Promise<AskResponse | null> {
  if (!env.DB) {
    return null;
  }

  const [stats, recentLessons, recentDecisions] = await Promise.all([
    getRagStats(env),
    dbAll(
      env,
      `SELECT outcome, top_driver, risk_bucket, lesson, created_at
       FROM rag_examples
       ORDER BY created_at DESC LIMIT 5`,
    ),
    dbAll(
      env,
      `SELECT patient_name, action, risk_score, risk_bucket, priority, created_at
       FROM decisions
       ORDER BY created_at DESC LIMIT 5`,
    ),
  ]);

  const raw = await callGroq(env, [
    {
      role: "system",
      content: "Return strict JSON only. No markdown.",
    },
    {
      role: "user",
      content: `
Answer this question about the agent's Cloudflare D1 memory.
Question: ${question}

Stats:
${JSON.stringify(stats)}

Recent lessons:
${JSON.stringify(recentLessons)}

Recent decisions:
${JSON.stringify(recentDecisions)}

Return JSON:
{
  "answer": "direct answer",
  "evidence": ["data point 1", "data point 2"],
  "followUp": "useful next question"
}
`,
    },
  ], 700, "ask");
  const parsed = raw ? parseJsonObject(raw) : null;

  if (!parsed) {
    return {
      answer: `The D1 memory currently has ${stats.total_decisions} decisions, ${stats.approved_examples} approved examples, ${stats.learning_examples} modified learning examples, and ${stats.rejected_examples} rejected examples.`,
      evidence: recentLessons
        .map((item) => readString(item.lesson, ""))
        .filter(Boolean)
        .slice(0, 3),
      queries: [
        { label: "D1 RAG stats", sql: "D1 memory tables", rowCount: 1 },
      ],
      followUp: "Approve, modify, or reject a recommendation to teach the agent.",
    };
  }

  return {
    answer: readString(parsed.answer, `The D1 memory currently has ${stats.total_decisions} decisions.`),
    evidence: Array.isArray(parsed.evidence)
      ? parsed.evidence.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [],
    queries: [
      { label: "D1 RAG stats", sql: "D1 memory tables", rowCount: 1 },
      { label: "Recent RAG lessons", sql: "rag_examples ORDER BY created_at DESC LIMIT 5", rowCount: recentLessons.length },
      { label: "Recent decisions", sql: "decisions ORDER BY created_at DESC LIMIT 5", rowCount: recentDecisions.length },
    ],
    followUp: readString(parsed.followUp, "Approve, modify, or reject a recommendation to teach the agent."),
  };
}

function normalizeGeneratedSql(sql: string): string | null {
  const trimmed = sql.trim().replace(/;+\s*$/g, "");
  if (!/^select\b/i.test(trimmed)) {
    return null;
  }
  if (/[;]/.test(trimmed)) {
    return null;
  }
  if (/\b(insert|update|delete|drop|alter|create|pragma|attach|detach|replace|with)\b/i.test(trimmed)) {
    return null;
  }
  if (!/\blimit\b/i.test(trimmed)) {
    return `${trimmed} LIMIT 20`;
  }
  return trimmed;
}

function compactJson(value: unknown, maxLength: number): string {
  const text = JSON.stringify(value ?? null);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

function scorePatient(input: {
  patient: SummaryRow;
  barriers: string[];
  sdohConditionCount: number;
  prapareSignalCount: number;
  totalOutstanding: number;
  activeMedCount: number;
  opioidMedicationCount: number;
}): ScoreItem[] {
  const items: ScoreItem[] = [];
  const { patient } = input;

  addScore(items, patient.ed_visits >= 5, "Frequent ED use", 25, `${patient.ed_visits} ED visits`);
  addScore(
    items,
    patient.ed_visits >= 3 && patient.ed_visits < 5,
    "Elevated ED use",
    15,
    `${patient.ed_visits} ED visits`,
  );
  addScore(
    items,
    patient.ed_visits > 0 && patient.ed_visits < 3,
    "Any ED use",
    8,
    `${patient.ed_visits} ED visits`,
  );
  addScore(
    items,
    patient.has_active_careplan === 0,
    "No active care plan",
    20,
    "Care management gap",
  );
  addScore(
    items,
    patient.chronic_condition_count >= 10,
    "High clinical complexity",
    15,
    `${patient.chronic_condition_count} active conditions`,
  );
  addScore(
    items,
    patient.chronic_condition_count >= 5 && patient.chronic_condition_count < 10,
    "Moderate clinical complexity",
    8,
    `${patient.chronic_condition_count} active conditions`,
  );
  addScore(
    items,
    input.sdohConditionCount > 0 || input.prapareSignalCount > 0,
    "Documented social barrier",
    15,
    `${input.sdohConditionCount} condition flags, ${input.prapareSignalCount} PRAPARE signals`,
  );
  addScore(
    items,
    input.totalOutstanding > 10000,
    "Financial barrier",
    10,
    `${formatCurrency(input.totalOutstanding)} outstanding`,
  );
  addScore(
    items,
    input.activeMedCount >= 5,
    "Polypharmacy",
    10,
    `${input.activeMedCount} active medications`,
  );
  addScore(
    items,
    input.opioidMedicationCount > 0,
    "Opioid medication signal",
    10,
    `${input.opioidMedicationCount} active opioid medication(s)`,
  );
  addScore(
    items,
    patient.inpatient_visits > 0,
    "ED plus inpatient pattern",
    5,
    `${patient.inpatient_visits} inpatient visit(s)`,
  );

  const edVolumePoints = Math.min(patient.ed_visits, 10) * 2;
  if (edVolumePoints > 0) {
    items.push({
      label: "ED volume adjustment",
      points: edVolumePoints,
      evidence: `${patient.ed_visits} ED visits, capped at 10 visits`,
    });
  }

  const sdohDepthPoints = Math.min(input.sdohConditionCount, 3) * 3;
  if (sdohDepthPoints > 0) {
    items.push({
      label: "SDOH depth adjustment",
      points: sdohDepthPoints,
      evidence: `${input.sdohConditionCount} active SDOH condition(s), capped at 3`,
    });
  }

  if (input.barriers.some((barrier) => barrier.includes("Low income"))) {
    items.push({
      label: "Low income",
      points: 5,
      evidence: `Income ${formatCurrency(normalizeNumber(patient.income))}`,
    });
  }

  return items;
}

function addScore(
  items: ScoreItem[],
  condition: boolean,
  label: string,
  points: number,
  evidence: string,
): void {
  if (condition) {
    items.push({ label, points, evidence });
  }
}

function buildBarrierList(
  patient: SummaryRow,
  sdohConditions: string[],
  prapareSignals: string[],
  debtRows: DebtRow[],
): string[] {
  const barriers = new Set<string>();
  const joined = `${sdohConditions.join(" ")} ${prapareSignals.join(" ")}`.toLowerCase();
  const outstanding = normalizeNumber(
    debtRows[0]?.total_outstanding ?? debtRows[0]?.TOTAL_OUTSTANDING ?? 0,
  );

  if (patient.has_active_careplan === 0) {
    barriers.add("No active care plan");
  }
  if (joined.match(/transport|ride|\bcar\b/)) {
    barriers.add("Transportation access may be unreliable");
  }
  if (joined.match(/housing|homeless|losing your housing/)) {
    barriers.add("Housing instability signal");
  }
  if (joined.match(/food|hunger/)) {
    barriers.add("Food insecurity signal");
  }
  if (joined.match(/stress|social contact|isolation|abuse|violence/)) {
    barriers.add("Psychosocial stress or safety signal");
  }
  if (joined.match(/criminal record|jail|detention|correctional/)) {
    barriers.add("Legal or justice-system barrier signal");
  }
  if (joined.match(/education|primary school/)) {
    barriers.add("Low education access signal");
  }
  if (joined.match(/unemploy|part-time employment|temporary work|work situation/)) {
    barriers.add("Employment instability signal");
  }
  if (outstanding > 10000) {
    barriers.add(`Outstanding medical debt ${formatCurrency(outstanding)}`);
  }
  if (normalizeNumber(patient.income) > 0 && normalizeNumber(patient.income) < 20000) {
    barriers.add(`Low income ${formatCurrency(normalizeNumber(patient.income))}`);
  }

  return Array.from(barriers);
}

function draftOutreach(profile: Omit<PatientRisk, "outreachDraft" | "draftSource">): string {
  const firstName = cleanToken(profile.patient.first);
  const conditionFocus = profile.clinicalDrivers.slice(0, 2).join(" and ");
  const barrierFocus = profile.barriers.slice(0, 3).join("; ");
  const clinicalPhrase = conditionFocus
    ? `managing ${conditionFocus}`
    : "reviewing symptoms before they become urgent";
  const barrierPhrase = barrierFocus
    ? ` We should also address: ${barrierFocus}.`
    : "";
  const supportNeeds = ["cost", "daily-life"];
  if (profile.barriers.some((barrier) => barrier.toLowerCase().includes("transport"))) {
    supportNeeds.unshift("transportation");
  }
  const supportPhrase = joinHumanList(supportNeeds);

  return [
    `Coordinator note: ${profile.displayName} is ${profile.riskLevel.toLowerCase()} risk for another preventable ED visit: ${profile.patient.ed_visits} ED visits, ${profile.patient.chronic_condition_count} active conditions, and ${profile.patient.has_active_careplan === 0 ? "no active care plan" : "an active care plan on file"}.`,
    `Patient-facing outreach draft: Hi ${firstName}, this is your care team. We noticed recent emergency care use and want to help with ${clinicalPhrase} before symptoms become urgent.${barrierPhrase} Could we schedule a care coordination call this week and choose a plan that works with your ${supportPhrase} needs?`,
  ].join("\n\n");
}

async function draftWithGroq(
  env: Env,
  profile: Omit<PatientRisk, "draftSource">,
): Promise<string | null> {
  const apiKey = getGroqApiKey(env);
  if (!apiKey) {
    return null;
  }

  const prompt = {
    patientName: profile.displayName,
    riskLevel: profile.riskLevel,
    score: profile.score,
    edVisits: profile.patient.ed_visits,
    inpatientVisits: profile.patient.inpatient_visits,
    chronicConditionCount: profile.patient.chronic_condition_count,
    hasActiveCarePlan: profile.patient.has_active_careplan === 1,
    barriers: profile.barriers,
    clinicalDrivers: profile.clinicalDrivers.slice(0, 5),
    medicationSignals: profile.medicationSignals,
    totalOutstanding: profile.financialSignals.totalOutstanding,
  };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 280,
        messages: [
          {
            role: "system",
            content:
              "You draft concise care-coordinator outreach for synthetic healthcare demo data. Be specific, nonjudgmental, and action-oriented. Include a coordinator-facing reason and a patient-facing outreach draft. Do not invent facts.",
          },
          {
            role: "user",
            content:
              "Draft outreach for a coordinator to review using this risk profile:\n" +
              JSON.stringify(prompt),
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GroqResponse;
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function reviseDraft(currentDraft: string, note: string, barriers: string[]): string {
  const lowerNote = note.toLowerCase();
  let revised = currentDraft.trim();

  if (lowerNote.match(/daughter|son|family|friend/) && lowerNote.match(/drive|ride|transport/)) {
    revised = revised.replace(
      /Could we schedule a care coordination call this week and choose a plan that works with your .* needs\?/i,
      "Could we schedule a care coordination call this week, ideally when your support person can help with transportation, and review cost or daily-life barriers?",
    );
  }

  if (lowerNote.match(/tuesday|wednesday|thursday|friday|monday|morning|afternoon/)) {
    revised += `\n\nCoordinator personalization: Offer appointment times around this local context: ${note}`;
  } else {
    revised += `\n\nCoordinator personalization: Incorporate this local context before outreach: ${note}`;
  }

  if (barriers.length > 0 && lowerNote.match(/remove|not a barrier|no longer/)) {
    revised += "\n\nBarrier update: Coordinator local knowledge should override any stale barrier flags in the final message.";
  }

  return revised;
}

async function reviseWithGroq(
  env: Env,
  input: {
    patientName: string;
    currentDraft: string;
    note: string;
    barriers: string[];
  },
): Promise<string | null> {
  const apiKey = getGroqApiKey(env);
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 260,
        messages: [
          {
            role: "system",
            content:
              "Rewrite care-coordinator outreach after a human coordinator adds local knowledge. The human note must visibly change the recommendation. Keep it concise and do not invent facts.",
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GroqResponse;
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function isSdohCondition(description: string): boolean {
  const text = description.toLowerCase();
  if (text.includes("full-time employment")) {
    return false;
  }
  return Boolean(
    text.match(
      /housing|homeless|transport|food|stress|employ|social contact|social isolation|intimate partner|abuse|violence|criminal record|refugee|education/,
    ),
  );
}

function isCareProcessSignal(description: string): boolean {
  return Boolean(description.toLowerCase().match(/medication review|review due/));
}

function isAdverseObservation(row: ObservationRow): boolean {
  const description = row.DESCRIPTION.toLowerCase();
  const value = String(row.VALUE ?? "").toLowerCase();
  const joined = `${description} ${value}`;

  if (description.includes("housing status")) {
    return !value.match(/i have housing|own|rent|stable/);
  }
  if (description.includes("worried about losing your housing")) {
    return value.match(/yes|often|sometimes/) !== null;
  }
  if (description.includes("lack of transportation kept")) {
    return value.match(/yes|often|sometimes/) !== null;
  }
  if (description.match(/\bcar\b|ride|transport/) && value.match(/^no$|unable|problem/)) {
    return true;
  }
  if (joined.match(/homeless|shelter|street/)) {
    return true;
  }
  if (description.match(/food/) && value.match(/sometimes|often|yes/)) {
    return true;
  }
  if (joined.match(/unable to get|medicine or any health care|medical  dental  mental health  vision/)) {
    return true;
  }
  if (description.match(/stress/) && value.match(/somewhat|quite|very|high/)) {
    return true;
  }
  if (joined.match(/unemployed|losing your housing|worried/)) {
    return true;
  }

  return false;
}

function isOpioidMedication(description: string): boolean {
  return Boolean(
    description
      .toLowerCase()
      .match(/opioid|oxycodone|hydrocodone|morphine|fentanyl|tramadol|codeine|buprenorphine|methadone/),
  );
}

async function queryDatabase<T>(env: Env, sql: string): Promise<T[]> {
  const trimmed = sql.trim().replace(/;$/, "");
  if (!trimmed.toLowerCase().startsWith("select")) {
    throw new Error("Only SELECT statements are allowed.");
  }

  const response = await fetch(env.DATA_API_URL || DEFAULT_DATA_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql: trimmed }),
  });

  if (!response.ok) {
    throw new Error(`Data API request failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as QueryResponse<T>;
  if (!data.success) {
    throw new Error(data.error || "Data API query failed.");
  }

  return data.results ?? [];
}

async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  if (!request.body) {
    return {};
  }
  const parsed = (await request.json()) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  return parsed as Record<string, unknown>;
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function getGroqApiKey(env: Env, purpose: GroqPurpose = "default"): string | undefined {
  const mainKey = env.GROQ_API_KEY_MAIN ||
    env.GROQ_MAIN_API_KEY ||
    env.GROQ_API_KEY ||
    env.groq;
  if (purpose === "ask") {
    return env.GROQ_API_KEY_ASK ||
      env.GROQ_ASK_API_KEY ||
      env.ASK_GROQ_API_KEY ||
      env.groq2 ||
      mainKey;
  }
  if (purpose === "coordinator") {
    return env.GROQ_API_KEY_COORDINATOR || mainKey;
  }
  if (purpose === "calibration") {
    return env.GROQ_API_KEY_CALIBRATION || mainKey;
  }
  return mainKey;
}

function cleanName(first: string, last: string): string {
  return `${cleanToken(first)} ${cleanToken(last)}`.trim();
}

function cleanToken(value: string): string {
  return value.replace(/[0-9]/g, "").trim() || value;
}

function joinHumanList(items: string[]): string {
  if (items.length <= 1) {
    return items[0] || "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function normalizeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

function htmlResponse(html: string): Response {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function renderDecisionTrailPage(env: Env): Promise<string> {
  const trail = await getDecisionTrail(env);
  const stats = (trail.stats || {}) as Record<string, unknown>;
  const decisions = Array.isArray(trail.decisions)
    ? (trail.decisions as Array<Record<string, unknown>>)
    : [];
  const notes = Array.isArray(trail.notes)
    ? (trail.notes as Array<Record<string, unknown>>)
    : [];

  const decisionHtml = decisions.length
    ? decisions.map(renderDecisionTrailItem).join("")
    : `<div class="empty">No saved decisions yet. Go back to the app, load a patient, then approve, modify, or reject a recommendation.</div>`;

  const notesHtml = notes.length
    ? notes.slice(0, 8).map((note) => `
      <article class="note">
        <strong>${escapeHtmlText(readString(note.patient_name, "Unknown patient"))}</strong>
        <span>${escapeHtmlText(formatDateTimeText(note.created_at))} · ${escapeHtmlText(readString(note.action_taken, "action"))}</span>
        <p>${escapeHtmlText(readString(note.note, ""))}</p>
      </article>
    `).join("")
    : `<div class="empty">No coordinator notes yet.</div>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Decision Trail</title>
  <style>
    :root {
      --bg: #f6f7f4;
      --ink: #1d2527;
      --muted: #667277;
      --line: #d8dfdc;
      --teal: #0f766e;
      --rose: #b42318;
      --blue: #2563eb;
      --green-soft: #dff4ec;
      --amber-soft: #fff3cf;
      --rose-soft: #fde7e4;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    header {
      background: #fbfcfa;
      border-bottom: 1px solid var(--line);
    }
    .topbar, main {
      max-width: 1120px;
      margin: 0 auto;
      padding: 18px 22px;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }
    h1 { margin: 0; font-size: 22px; }
    h2 { margin: 0 0 12px; font-size: 16px; }
    a.button {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 7px 12px;
      color: var(--ink);
      background: #fff;
      text-decoration: none;
      font-weight: 750;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }
    .stat, .panel, .decision, .note {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .stat { padding: 12px; }
    .stat span { color: var(--muted); font-size: 12px; font-weight: 700; }
    .stat strong { display: block; font-size: 24px; }
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
      gap: 14px;
    }
    .panel { padding: 14px; }
    .list { display: grid; gap: 10px; }
    .decision {
      padding: 12px;
      border-left: 4px solid var(--teal);
    }
    .decision.rejected { border-left-color: var(--rose); }
    .decision.modified { border-left-color: var(--blue); }
    .decision-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .decision h3 {
      margin: 0;
      font-size: 15px;
    }
    .meta, .note span {
      color: var(--muted);
      font-size: 12px;
      margin-top: 4px;
    }
    .chip {
      border-radius: 999px;
      padding: 4px 8px;
      background: var(--green-soft);
      color: var(--teal);
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }
    .chip.rejected { background: var(--rose-soft); color: var(--rose); }
    .chip.modified { background: #e8efff; color: var(--blue); }
    p { margin: 8px 0 0; }
    .empty {
      color: var(--muted);
      border: 1px dashed #bcc8c4;
      border-radius: 8px;
      padding: 18px;
      text-align: center;
      background: #fff;
    }
    .note { padding: 10px; }
    .note p { color: #334044; font-size: 13px; }
    @media (max-width: 780px) {
      .topbar { align-items: flex-start; flex-direction: column; }
      .stats, .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="topbar">
      <div>
        <h1>Decision Trail</h1>
        <div class="meta">Persistent Cloudflare D1 memory for coordinator approvals, modifications, and rejections.</div>
      </div>
      <a class="button" href="/">Back to detector</a>
    </div>
  </header>
  <main>
    <section class="stats">
      ${trailStat("Total Decisions", stats.total_decisions)}
      ${trailStat("Approved", stats.approved_examples)}
      ${trailStat("Modified", stats.learning_examples)}
      ${trailStat("Rejected", stats.rejected_examples)}
    </section>
    <section class="grid">
      <div class="panel">
        <h2>Saved Decisions</h2>
        <div class="list">${decisionHtml}</div>
      </div>
      <aside class="panel">
        <h2>Recent Coordinator Notes</h2>
        <div class="list">${notesHtml}</div>
      </aside>
    </section>
  </main>
</body>
</html>`;
}

function trailStat(label: string, value: unknown): string {
  return `<div class="stat"><span>${escapeHtmlText(label)}</span><strong>${escapeHtmlText(String(normalizeNumber(value)))}</strong></div>`;
}

function renderDecisionTrailItem(decision: Record<string, unknown>): string {
  const action = readString(decision.action, "decision");
  const actionClass = action === "rejected" ? " rejected" : action === "modified" ? " modified" : "";
  const recommendation = decisionRecommendation(decision);
  const note = readOptionalString(decision.coordinator_notes)
    || readOptionalString(decision.human_edit)
    || readOptionalString(decision.rejection_reason);

  return `<article class="decision${actionClass}">
    <div class="decision-head">
      <div>
        <h3>${escapeHtmlText(readString(decision.patient_name, "Unknown patient"))}</h3>
        <div class="meta">${escapeHtmlText(formatDateTimeText(decision.created_at))} · Score ${escapeHtmlText(readString(decision.risk_score, "n/a"))}/100 · ${escapeHtmlText(readString(decision.risk_bucket, "bucket unknown"))} · ${escapeHtmlText(readString(decision.priority, "priority unknown"))}</div>
      </div>
      <span class="chip${actionClass}">${escapeHtmlText(capitalizeText(action))}</span>
    </div>
    ${note ? `<p><strong>Coordinator note:</strong> ${escapeHtmlText(note)}</p>` : ""}
    ${recommendation ? `<p><strong>Recommendation:</strong> ${escapeHtmlText(recommendation)}</p>` : ""}
  </article>`;
}

function decisionRecommendation(decision: Record<string, unknown>): string {
  const finalRec = parseJsonText(decision.final_rec);
  const originalRec = parseJsonText(decision.original_rec);
  if (isRecord(finalRec)) {
    const revised = readOptionalString(finalRec.revisedDraft);
    if (revised) return revised;
    const intervention = isRecord(finalRec.recommended_intervention)
      ? readOptionalString(finalRec.recommended_intervention.action)
      : null;
    if (intervention) return intervention;
  }
  if (isRecord(originalRec)) {
    const intervention = isRecord(originalRec.recommended_intervention)
      ? readOptionalString(originalRec.recommended_intervention.action)
      : null;
    if (intervention) return intervention;
    const outreach = readOptionalString(originalRec.outreachDraft);
    if (outreach) return outreach;
  }
  return "";
}

function parseJsonText(value: unknown): unknown {
  if (typeof value !== "string" || !value.trim()) {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatDateTimeText(value: unknown): string {
  if (typeof value !== "string" || !value) {
    return "Unknown time";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US");
}

function capitalizeText(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function escapeHtmlText(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderApp(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Preventable Visit Detector</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f4;
      --panel: #ffffff;
      --ink: #1d2527;
      --muted: #667277;
      --line: #d8dfdc;
      --teal: #0f766e;
      --teal-dark: #0b5d56;
      --amber: #b7791f;
      --rose: #b42318;
      --blue: #2563eb;
      --green-soft: #dff4ec;
      --amber-soft: #fff3cf;
      --rose-soft: #fde7e4;
      --shadow: 0 14px 30px rgba(30, 41, 44, 0.08);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }

    .shell {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto 1fr;
    }

    header {
      border-bottom: 1px solid var(--line);
      background: #fbfcfa;
    }

    .topbar {
      max-width: 1440px;
      margin: 0 auto;
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .brand h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 760;
      letter-spacing: 0;
    }

    .brand p {
      margin: 2px 0 0;
      color: var(--muted);
      font-size: 13px;
    }

    .status {
      min-width: 220px;
      padding: 9px 12px;
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 8px;
      color: var(--muted);
      font-size: 13px;
      text-align: right;
    }

    main {
      max-width: 1440px;
      width: 100%;
      margin: 0 auto;
      padding: 20px 24px 28px;
      display: grid;
      grid-template-columns: 360px minmax(0, 1fr) 380px;
      gap: 16px;
    }

    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      min-width: 0;
    }

    .panel-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .panel-header h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 720;
      letter-spacing: 0;
    }

    .panel-body { padding: 14px 16px 16px; }

    .controls {
      display: grid;
      gap: 10px;
    }

    .workflow {
      display: grid;
      gap: 10px;
    }

    .workflow + .workflow {
      border-top: 1px solid var(--line);
      padding-top: 14px;
      margin-top: 4px;
    }

    .workflow h3 {
      margin: 0;
      font-size: 14px;
      color: var(--ink);
    }

    label {
      display: grid;
      gap: 6px;
      font-size: 12px;
      color: var(--muted);
      font-weight: 650;
    }

    input, textarea, select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 11px;
      font: inherit;
      color: var(--ink);
      background: #fff;
    }

    textarea {
      min-height: 92px;
      resize: vertical;
    }

    button {
      min-height: 38px;
      border: 1px solid transparent;
      border-radius: 8px;
      padding: 9px 12px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
    }

    button:active { transform: translateY(1px); }
    button:disabled { cursor: not-allowed; opacity: 0.6; }
    .primary { background: var(--teal); color: #fff; }
    .primary:hover { background: var(--teal-dark); }
    .secondary { background: #fff; color: var(--ink); border-color: var(--line); }
    .secondary:hover { border-color: #a8b5b2; }
    .approve { background: var(--teal); color: #fff; }
    .modify { background: var(--blue); color: #fff; }
    .reject { background: #fff; color: var(--rose); border-color: #efb0aa; }

    .button-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .patient-suggestions {
      display: grid;
      gap: 6px;
      margin-top: -4px;
    }

    .patient-suggestions.empty { display: none; }

    .patient-suggestion {
      min-height: 36px;
      padding: 7px 9px;
      border-color: #cfe0dc;
      background: #f5fbf8;
      color: var(--teal-dark);
      font-size: 12px;
      font-weight: 750;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .patient-suggestion:hover {
      border-color: var(--teal);
      background: var(--green-soft);
    }

    .patient-suggestion small {
      color: var(--muted);
      font-weight: 650;
      white-space: nowrap;
    }

    .patient-list {
      display: grid;
      gap: 9px;
      margin-top: 14px;
      max-height: calc(100vh - 282px);
      overflow: auto;
      padding-right: 3px;
    }

    .patient-list.inline {
      margin-top: 0;
      max-height: 260px;
    }

    .patient-list.ranking {
      max-height: 430px;
    }

    .patient-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 11px;
      background: #fff;
      cursor: pointer;
    }

    .patient-card.selected {
      border-color: var(--teal);
      background: #f0fbf7;
    }

    .patient-card h3 {
      margin: 0 0 5px;
      font-size: 14px;
      line-height: 1.2;
    }

    .patient-card .meta {
      color: var(--muted);
      font-size: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }

    .risk-chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 750;
      background: var(--green-soft);
      color: var(--teal-dark);
      white-space: nowrap;
    }

    .risk-chip.very-high { background: var(--rose-soft); color: var(--rose); }
    .risk-chip.high { background: var(--amber-soft); color: var(--amber); }

    .scoreline {
      margin-top: 9px;
      height: 8px;
      border-radius: 999px;
      background: #edf1ef;
      overflow: hidden;
    }

    .scorebar {
      height: 100%;
      width: 0;
      background: linear-gradient(90deg, var(--teal), var(--amber), var(--rose));
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 14px;
    }

    .metric {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      background: #fff;
      min-height: 82px;
    }

    .metric span {
      color: var(--muted);
      font-size: 12px;
      font-weight: 650;
    }

    .metric strong {
      display: block;
      margin-top: 4px;
      font-size: 22px;
      line-height: 1.1;
    }

    .section {
      border-top: 1px solid var(--line);
      padding-top: 14px;
      margin-top: 14px;
    }

    .section h3 {
      margin: 0 0 9px;
      font-size: 14px;
    }

    .pill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }

    .pill {
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 5px 8px;
      background: #fff;
      color: #334044;
      font-size: 12px;
      max-width: 100%;
      overflow-wrap: anywhere;
    }

    .score-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .score-table td {
      border-bottom: 1px solid var(--line);
      padding: 8px 4px;
      vertical-align: top;
    }

    .score-table td:last-child {
      text-align: right;
      font-weight: 750;
      color: var(--teal-dark);
      white-space: nowrap;
    }

    .draft {
      white-space: pre-wrap;
      background: #f8faf9;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
      min-height: 170px;
    }

    .audit {
      display: grid;
      gap: 8px;
      max-height: 250px;
      overflow: auto;
      margin-top: 12px;
    }

    .audit-item {
      border-left: 3px solid var(--teal);
      background: #f8faf9;
      padding: 8px 10px;
      font-size: 12px;
      color: #334044;
    }

    .audit-item.rejected { border-left-color: var(--rose); }
    .audit-item.modified { border-left-color: var(--blue); }
    .audit-item.local { border-left-color: #98a6a2; }

    .trail-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .trail-title h3 { margin: 0; }

    .small-button {
      min-height: 30px;
      padding: 5px 9px;
      font-size: 12px;
    }

    .small-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 30px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 5px 9px;
      background: #fff;
      color: var(--ink);
      font-size: 12px;
      font-weight: 750;
      text-decoration: none;
      white-space: nowrap;
    }

    .trail-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .audit-meta {
      margin-top: 4px;
      color: var(--muted);
      line-height: 1.4;
    }

    .audit-note {
      margin-top: 5px;
      color: #334044;
      line-height: 1.4;
    }

    .empty {
      color: var(--muted);
      border: 1px dashed #bcc8c4;
      border-radius: 8px;
      padding: 18px;
      text-align: center;
      font-size: 13px;
    }

    .error {
      color: var(--rose);
      background: var(--rose-soft);
      border: 1px solid #f2aaa4;
      border-radius: 8px;
      padding: 10px;
      font-size: 13px;
      margin-top: 10px;
    }

    .ask-answer {
      margin-top: 10px;
      padding: 11px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #f8faf9;
      color: #334044;
      font-size: 13px;
      white-space: pre-wrap;
      min-height: 58px;
    }

    @media (max-width: 1180px) {
      main { grid-template-columns: 320px minmax(0, 1fr); }
      .review-panel { grid-column: 1 / -1; }
    }

    @media (max-width: 760px) {
      .topbar { align-items: flex-start; flex-direction: column; }
      .status { width: 100%; text-align: left; }
      main { grid-template-columns: 1fr; padding: 14px; }
      .detail-grid { grid-template-columns: 1fr; }
      .patient-list { max-height: none; }
      .button-row { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <div class="topbar">
        <div class="brand">
          <h1>Preventable Visit Detector</h1>
          <p>Prompt 1 · Filter → Score → Rank → Recommend → Human review</p>
        </div>
        <div id="status" class="status">Ready</div>
      </div>
    </header>

    <main>
      <section class="panel">
        <div class="panel-header">
          <h2>Risk Scan</h2>
          <span id="scanMode" class="risk-chip">Live data</span>
        </div>
        <div class="panel-body">
          <div class="controls">
            <div class="workflow">
              <h3>Patient scan</h3>
              <label>
                Patient name
                <input id="patientQuery" autocomplete="off" placeholder="Start typing: Lin, Rho, Gio...">
              </label>
              <div id="patientSuggestions" class="patient-suggestions empty" aria-live="polite"></div>
              <button id="scanBtn" class="primary" style="width: 100%;">Run patient scan</button>
              <div id="patientList" class="patient-list inline">
                <div class="empty">Search a patient to generate the full profile.</div>
              </div>
            </div>
            <div class="workflow">
              <h3>Population ranking</h3>
              <label>
                Ranked patients
                <select id="rankLimit">
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="20">Top 20</option>
                </select>
              </label>
              <button id="rankBtn" class="secondary" style="width: 100%;">Run ranking</button>
              <div id="rankList" class="patient-list inline ranking">
                <div class="empty">Run ranking to list patients and risk scores.</div>
              </div>
            </div>
            <label>
              Ask the agent
              <textarea id="askQuestion" placeholder="Ask why Lindsay is P0, who is next, what barriers matter, or what to do before outreach."></textarea>
            </label>
            <button id="askBtn" class="secondary" style="width: 100%;">Ask question</button>
            <div id="askAnswer" class="ask-answer">Ask a question after running a scan.</div>
          </div>
          <div id="error"></div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Patient Risk Profile</h2>
          <span id="draftSource" class="risk-chip">Draft</span>
        </div>
        <div id="details" class="panel-body">
          <div class="empty">Select or scan a patient.</div>
        </div>
      </section>

      <section class="panel review-panel">
        <div class="panel-header">
          <h2>Coordinator Review</h2>
          <span id="reviewState" class="risk-chip">Pending</span>
        </div>
        <div class="panel-body">
          <div id="draft" class="draft">Draft outreach will appear here.</div>
          <div class="section">
            <label>
              Coordinator local knowledge
              <textarea id="modifyNote" placeholder="Example: Her daughter can drive Tuesday afternoons, so remove the transport shuttle recommendation."></textarea>
            </label>
            <div class="button-row" style="margin-top: 10px;">
              <button id="approveBtn" class="approve">Approve</button>
              <button id="modifyBtn" class="modify">Modify</button>
            </div>
            <button id="rejectBtn" class="reject" style="width: 100%; margin-top: 8px;">Reject and next</button>
          </div>
          <div class="section">
            <div class="trail-title">
              <h3>Decision Trail</h3>
              <div class="trail-actions">
                <a class="small-link" href="/trail" target="_blank" rel="noopener">Open all</a>
                <button id="refreshTrailBtn" class="secondary small-button" type="button">Refresh</button>
              </div>
            </div>
            <div id="audit" class="audit"></div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script>
    var state = {
      patients: [],
      rankings: [],
      selectedIndex: -1,
      audit: JSON.parse(localStorage.getItem('detectorAudit') || '[]'),
      trail: null,
      trailPatientId: '',
      trailLoading: false,
      trailError: ''
    };

    var els = {
      status: document.getElementById('status'),
      scanMode: document.getElementById('scanMode'),
      patientQuery: document.getElementById('patientQuery'),
      patientSuggestions: document.getElementById('patientSuggestions'),
      rankLimit: document.getElementById('rankLimit'),
      scanBtn: document.getElementById('scanBtn'),
      rankBtn: document.getElementById('rankBtn'),
      error: document.getElementById('error'),
      patientList: document.getElementById('patientList'),
      rankList: document.getElementById('rankList'),
      details: document.getElementById('details'),
      draft: document.getElementById('draft'),
      draftSource: document.getElementById('draftSource'),
      reviewState: document.getElementById('reviewState'),
      askQuestion: document.getElementById('askQuestion'),
      askBtn: document.getElementById('askBtn'),
      askAnswer: document.getElementById('askAnswer'),
      modifyNote: document.getElementById('modifyNote'),
      approveBtn: document.getElementById('approveBtn'),
      modifyBtn: document.getElementById('modifyBtn'),
      rejectBtn: document.getElementById('rejectBtn'),
      refreshTrailBtn: document.getElementById('refreshTrailBtn'),
      audit: document.getElementById('audit')
    };

    var suggestionTimer = null;
    var lastSuggestionQuery = '';

    els.scanBtn.addEventListener('click', function () {
      runScan(els.patientQuery.value);
    });

    els.rankBtn.addEventListener('click', function () {
      runRanking();
    });

    els.patientQuery.addEventListener('input', function () {
      updatePatientSuggestions(els.patientQuery.value);
    });

    els.patientQuery.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        clearPatientSuggestions();
        runScan(els.patientQuery.value);
      }
    });

    els.approveBtn.addEventListener('click', function () {
      review('approve');
    });

    els.modifyBtn.addEventListener('click', function () {
      review('modify');
    });

    els.rejectBtn.addEventListener('click', function () {
      review('reject');
    });

    els.askBtn.addEventListener('click', function () {
      askAgent();
    });

    els.refreshTrailBtn.addEventListener('click', function () {
      var patient = selectedPatient();
      if (patient && patient.patient && patient.patient.id) {
        loadDecisionTrail(patient.patient.id);
      } else {
        renderAudit();
      }
    });

    renderAudit();

    function updatePatientSuggestions(query) {
      var trimmed = query.trim();
      lastSuggestionQuery = trimmed;
      if (suggestionTimer) {
        window.clearTimeout(suggestionTimer);
      }

      if (trimmed.length < 2) {
        clearPatientSuggestions();
        return;
      }

      suggestionTimer = window.setTimeout(function () {
        fetch('/api/patient-suggestions?q=' + encodeURIComponent(trimmed))
          .then(function (res) {
            if (!res.ok) return res.json().then(function (body) { throw new Error(body.error || 'Suggestion lookup failed'); });
            return res.json();
          })
          .then(function (data) {
            if (lastSuggestionQuery !== trimmed) return;
            renderPatientSuggestions(data.suggestions || [], trimmed);
          })
          .catch(function () {
            if (lastSuggestionQuery !== trimmed) return;
            clearPatientSuggestions();
          });
      }, 180);
    }

    function renderPatientSuggestions(suggestions, query) {
      if (!suggestions.length) {
        els.patientSuggestions.className = 'patient-suggestions';
        els.patientSuggestions.innerHTML = '<div class="empty">No patient names matching "' + escapeHtml(query) + '".</div>';
        return;
      }

      els.patientSuggestions.className = 'patient-suggestions';
      els.patientSuggestions.innerHTML = suggestions.map(function (patient, index) {
        var meta = 'Age ' + (patient.age == null ? 'unknown' : patient.age) + ' · ' +
          patient.ed_visits + ' ED · ' + patient.chronic_condition_count + ' conditions';
        return '<button class="patient-suggestion" type="button" data-suggestion-index="' + index + '">' +
          '<span>' + escapeHtml(patient.name) + '</span><small>' + escapeHtml(meta) + '</small></button>';
      }).join('');

      Array.prototype.forEach.call(els.patientSuggestions.querySelectorAll('[data-suggestion-index]'), function (button) {
        button.addEventListener('click', function () {
          var patient = suggestions[Number(button.getAttribute('data-suggestion-index'))];
          if (patient) {
            loadPatientById(patient.id, patient.name);
          }
        });
      });
    }

    function clearPatientSuggestions() {
      if (suggestionTimer) {
        window.clearTimeout(suggestionTimer);
      }
      els.patientSuggestions.className = 'patient-suggestions empty';
      els.patientSuggestions.innerHTML = '';
    }

    function runScan(patientQuery) {
      if (!patientQuery || !patientQuery.trim()) {
        showError('Type a patient name, or use Run ranking for the population list.');
        return;
      }
      runPatientScan({ patientQuery: patientQuery.trim() });
    }

    function loadPatientById(patientId, name) {
      if (!patientId) return;
      els.patientQuery.value = name || '';
      clearPatientSuggestions();
      runPatientScan({ patientId: patientId, patientQuery: name || '', limit: 1 });
    }

    function runPatientScan(payload) {
      setBusy(true, 'Scanning live patient data...');
      els.error.innerHTML = '';

      fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ limit: 5 }, payload))
      })
        .then(function (res) {
          if (!res.ok) return res.json().then(function (body) { throw new Error(body.error || 'Scan failed'); });
          return res.json();
        })
        .then(function (data) {
          state.patients = data.patients || [];
          state.selectedIndex = state.patients.length ? 0 : -1;
          els.scanMode.textContent = data.calibration && data.calibration.source === 'groq'
            ? 'Groq calibrated'
            : 'Fallback calibrated';
          renderPatientList();
          renderSelected();
          setBusy(false, 'Scan complete');
        })
        .catch(function (error) {
          setBusy(false, 'Ready');
          showError(error.message);
        });
    }

    function runRanking() {
      setBusy(true, 'Ranking population...');
      els.error.innerHTML = '';
      els.rankList.innerHTML = '<div class="empty">Calculating Sentinel scores...</div>';

      fetch('/api/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: Number(els.rankLimit.value) })
      })
        .then(function (res) {
          if (!res.ok) return res.json().then(function (body) { throw new Error(body.error || 'Ranking failed'); });
          return res.json();
        })
        .then(function (data) {
          state.rankings = data.patients || [];
          els.scanMode.textContent = data.calibration && data.calibration.source === 'groq'
            ? 'Groq calibrated'
            : 'Fallback calibrated';
          renderRankList();
          setBusy(false, 'Ranking complete');
        })
        .catch(function (error) {
          setBusy(false, 'Ready');
          showError(error.message);
          els.rankList.innerHTML = '<div class="empty">Ranking failed.</div>';
        });
    }

    function askAgent() {
      var question = els.askQuestion.value.trim();
      if (!question) {
        showError('Type a question first.');
        return;
      }
      setBusy(true, 'Answering question...');
      els.askAnswer.textContent = 'Thinking with live data...';
      els.error.innerHTML = '';

      fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          selectedPatient: compactPatient(selectedPatient()),
          rankedPatients: state.rankings
        })
      })
        .then(function (res) {
          if (!res.ok) return res.json().then(function (body) { throw new Error(body.error || 'Question failed'); });
          return res.json();
        })
        .then(function (data) {
          var evidence = data.evidence && data.evidence.length
            ? '\\n\\nEvidence:\\n- ' + data.evidence.join('\\n- ')
            : '';
          var queries = data.queries && data.queries.length
            ? '\\n\\nLive lookups: ' + data.queries.map(function (q) {
                return q.label + ' (' + q.rowCount + ' rows)';
              }).join(', ')
            : '';
          var followUp = data.followUp ? '\\n\\nNext: ' + data.followUp : '';
          els.askAnswer.textContent = data.answer + evidence + queries + followUp;
          setBusy(false, 'Answer ready');
        })
        .catch(function (error) {
          setBusy(false, 'Ready');
          els.askAnswer.textContent = 'Could not answer that yet.';
          showError(error.message);
        });
    }

    function review(action) {
      var patient = selectedPatient();
      if (!patient) return;
      var note = els.modifyNote.value.trim();
      if (action === 'modify' && !note) {
        showError('Add a coordinator note before modifying.');
        return;
      }

      setBusy(true, 'Applying coordinator decision...');
      fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          currentDraft: patient.outreachDraft,
          note: note,
          patientName: patient.displayName,
          barriers: patient.barriers,
          patient: patient.patient,
          sentinel: patient.sentinel,
          originalRec: patient.coordinator
        })
      })
        .then(function (res) {
          if (!res.ok) return res.json().then(function (body) { throw new Error(body.error || 'Review failed'); });
          return res.json();
        })
        .then(function (data) {
          if (data.revisedDraft) {
            patient.outreachDraft = data.revisedDraft;
            els.draft.textContent = data.revisedDraft;
          }
          if (data.finalDraft) {
            els.draft.textContent = data.finalDraft;
          }
          els.reviewState.textContent = capitalize(data.status);
          addAudit(data.auditMessage);
          if (data.memorySaved === false && data.memoryError) {
            showError('Decision was applied, but the D1 trail did not save: ' + data.memoryError);
          }
          if (action === 'reject') {
            moveNext();
          } else if (patient.patient && patient.patient.id) {
            loadDecisionTrail(patient.patient.id);
          }
          setBusy(false, 'Decision saved');
        })
        .catch(function (error) {
          setBusy(false, 'Ready');
          showError(error.message);
        });
    }

    function renderPatientList() {
      if (!state.patients.length) {
        els.patientList.innerHTML = '<div class="empty">No matching patients found.</div>';
        return;
      }

      els.patientList.innerHTML = state.patients.map(function (patient, index) {
        var selected = index === state.selectedIndex ? ' selected' : '';
        var levelClass = patient.riskLevel.toLowerCase().replace(' ', '-');
        var scoreWidth = Math.min(100, patient.score) + '%';
        return '<article class="patient-card' + selected + '" data-index="' + index + '">' +
          '<h3>' + escapeHtml(patient.displayName) + '</h3>' +
          '<div class="meta"><span>' + patient.patient.ed_visits + ' ED</span><span>' +
          patient.patient.chronic_condition_count + ' conditions</span><span>' +
          (patient.patient.has_active_careplan ? 'Care plan' : 'No care plan') + '</span></div>' +
          '<div style="margin-top: 9px; display:flex; justify-content:space-between; gap:8px; align-items:center;">' +
          '<span class="risk-chip ' + levelClass + '">' + escapeHtml(patient.riskLevel) + '</span>' +
          '<strong>' + patient.score + '</strong>' +
          '</div><div class="scoreline"><div class="scorebar" style="width:' + scoreWidth + '"></div></div>' +
          '</article>';
      }).join('');

      Array.prototype.forEach.call(els.patientList.querySelectorAll('.patient-card'), function (card) {
        card.addEventListener('click', function () {
          state.selectedIndex = Number(card.getAttribute('data-index'));
          renderPatientList();
          renderSelected();
        });
      });
    }

    function renderRankList() {
      if (!state.rankings.length) {
        els.rankList.innerHTML = '<div class="empty">No ranked patients returned.</div>';
        return;
      }

      els.rankList.innerHTML = state.rankings.map(function (patient, index) {
        var levelClass = patient.riskLevel.toLowerCase().replace(' ', '-');
        var scoreWidth = Math.min(100, patient.score) + '%';
        return '<article class="patient-card" data-rank-index="' + index + '">' +
          '<h3>' + escapeHtml(String(index + 1)) + '. ' + escapeHtml(patient.displayName) + '</h3>' +
          '<div class="meta"><span>' + patient.patient.ed_visits + ' ED</span><span>' +
          patient.patient.chronic_condition_count + ' conditions</span><span>' +
          (patient.patient.has_active_careplan ? 'Care plan' : 'No care plan') + '</span></div>' +
          '<div style="margin-top: 9px; display:flex; justify-content:space-between; gap:8px; align-items:center;">' +
          '<span class="risk-chip ' + levelClass + '">' + escapeHtml(patient.riskLevel) + '</span>' +
          '<strong>' + patient.score + '</strong>' +
          '</div><div class="meta" style="margin-top:6px;"><span>' +
          escapeHtml(patient.priority) + '</span><span>' + escapeHtml(patient.topDriver) +
          '</span></div><div class="scoreline"><div class="scorebar" style="width:' + scoreWidth + '"></div></div>' +
          '</article>';
      }).join('');

      Array.prototype.forEach.call(els.rankList.querySelectorAll('[data-rank-index]'), function (card) {
        card.addEventListener('click', function () {
          var patient = state.rankings[Number(card.getAttribute('data-rank-index'))];
          if (patient && patient.patient) {
            loadPatientById(patient.patient.id, patient.displayName);
          }
        });
      });
    }

    function renderSelected() {
      var patient = selectedPatient();
      if (!patient) {
        els.details.innerHTML = '<div class="empty">Select or scan a patient.</div>';
        els.draft.textContent = 'Draft outreach will appear here.';
        state.trail = null;
        state.trailPatientId = '';
        state.trailLoading = false;
        renderAudit();
        return;
      }

      els.draft.textContent = patient.outreachDraft;
      els.draftSource.textContent = patient.draftSource === 'groq' ? 'Groq draft' : 'Rule draft';
      els.reviewState.textContent = 'Pending';

      els.details.innerHTML =
        '<div class="detail-grid">' +
          metric('Risk score', patient.score, patient.riskLevel) +
          metric('ED visits', patient.patient.ed_visits, 'Inpatient ' + patient.patient.inpatient_visits) +
          metric('Outstanding', money(patient.financialSignals.totalOutstanding), 'Medical debt') +
        '</div>' +
        section('Barriers', pills(patient.barriers)) +
        section('Sentinel tags', pills([patient.sentinel.top_driver].concat(patient.sentinel.tags || []))) +
        section('LLM risk take', riskReviewCard(patient.riskReview)) +
        section('Clinical drivers', pills(patient.clinicalDrivers.slice(0, 6))) +
        section('Score evidence', scoreTable(patient.scoreItems)) +
        section('Recent ED encounters', recentEd(patient.recentEd));

      if (patient.patient && patient.patient.id) {
        loadDecisionTrail(patient.patient.id);
      }
    }

    function loadDecisionTrail(patientId) {
      if (!patientId) {
        state.trail = null;
        state.trailPatientId = '';
        state.trailLoading = false;
        state.trailError = '';
        renderAudit();
        return;
      }

      state.trailPatientId = patientId;
      state.trail = null;
      state.trailLoading = true;
      state.trailError = '';
      renderAudit();

      fetch('/api/history/' + encodeURIComponent(patientId))
        .then(function (res) {
          if (!res.ok) return res.json().then(function (body) { throw new Error(body.error || 'Could not load decision trail'); });
          return res.json();
        })
        .then(function (data) {
          if (state.trailPatientId !== patientId) return;
          state.trail = data;
          state.trailLoading = false;
          state.trailError = '';
          renderAudit();
        })
        .catch(function (error) {
          if (state.trailPatientId !== patientId) return;
          state.trailLoading = false;
          state.trailError = error.message;
          renderAudit();
        });
    }

    function metric(label, value, sublabel) {
      return '<div class="metric"><span>' + escapeHtml(label) + '</span><strong>' +
        escapeHtml(String(value)) + '</strong><span>' + escapeHtml(sublabel) + '</span></div>';
    }

    function section(title, body) {
      return '<div class="section"><h3>' + escapeHtml(title) + '</h3>' + body + '</div>';
    }

    function pills(items) {
      if (!items || !items.length) return '<div class="empty">None found in the queried data.</div>';
      return '<div class="pill-list">' + items.map(function (item) {
        return '<span class="pill">' + escapeHtml(item) + '</span>';
      }).join('') + '</div>';
    }

    function scoreTable(items) {
      return '<table class="score-table"><tbody>' + items.map(function (item) {
        return '<tr><td><strong>' + escapeHtml(item.label) + '</strong><br><span style="color:var(--muted)">' +
          escapeHtml(item.evidence) + '</span></td><td>+' + item.points + '</td></tr>';
      }).join('') + '</tbody></table>';
    }

    function riskReviewCard(review) {
      if (!review) return '<div class="empty">No LLM risk review returned.</div>';
      var evidence = review.supporting_evidence && review.supporting_evidence.length
        ? '<ul>' + review.supporting_evidence.map(function (item) {
            return '<li>' + escapeHtml(item) + '</li>';
          }).join('') + '</ul>'
        : '<div class="empty">No evidence listed.</div>';
      var watchouts = review.watchouts && review.watchouts.length
        ? '<div class="audit-meta">Watchouts: ' + escapeHtml(review.watchouts.join('; ')) + '</div>'
        : '';
      return '<div class="audit-item">' +
        '<strong>' + escapeHtml(review.stance || 'Advisory review') +
        (review.human_review_flag ? ' · human review flag' : '') + '</strong>' +
        '<div class="audit-meta">' + escapeHtml(review.clinical_take || '') + '</div>' +
        '<div class="audit-meta">' + escapeHtml(review.score_commentary || 'Advisory only; Sentinel score remains locked.') + '</div>' +
        evidence + watchouts +
        '</div>';
    }

    function recentEd(items) {
      if (!items || !items.length) return '<div class="empty">No recent ED encounters returned.</div>';
      return '<table class="score-table"><tbody>' + items.map(function (item) {
        return '<tr><td><strong>' + escapeHtml(item.START || '') + '</strong><br><span style="color:var(--muted)">' +
          escapeHtml(item.DESCRIPTION || item.REASONDESCRIPTION || 'Emergency encounter') +
          '</span></td><td>' + money(Number(item.TOTAL_CLAIM_COST || 0)) + '</td></tr>';
      }).join('') + '</tbody></table>';
    }

    function selectedPatient() {
      return state.selectedIndex >= 0 ? state.patients[state.selectedIndex] : null;
    }

    function compactPatient(patient) {
      if (!patient) return null;
      return {
        displayName: patient.displayName,
        score: patient.score,
        riskLevel: patient.riskLevel,
        patient: patient.patient,
        sentinel: patient.sentinel,
        barriers: patient.barriers,
        clinicalDrivers: patient.clinicalDrivers,
        sdohConditions: patient.sdohConditions,
        prapareSignals: patient.prapareSignals,
        medicationSignals: patient.medicationSignals,
        financialSignals: patient.financialSignals,
        riskReview: patient.riskReview,
        coordinator: patient.coordinator
      };
    }

    function moveNext() {
      if (state.selectedIndex < state.patients.length - 1) {
        state.selectedIndex += 1;
        renderPatientList();
        renderSelected();
      }
    }

    function addAudit(message) {
      state.audit.unshift({ message: message, at: new Date().toLocaleTimeString() });
      state.audit = state.audit.slice(0, 8);
      localStorage.setItem('detectorAudit', JSON.stringify(state.audit));
      renderAudit();
    }

    function renderAudit() {
      var patient = selectedPatient();
      var html = [];

      if (!patient) {
        html.push('<div class="empty">Select a patient to view the saved decision trail.</div>');
      } else if (state.trailLoading) {
        html.push('<div class="empty">Loading saved decisions for ' + escapeHtml(patient.displayName) + '...</div>');
      } else if (state.trailError) {
        html.push('<div class="error">Could not load saved decision trail: ' + escapeHtml(state.trailError) + '</div>');
      } else if (state.trail && state.trailPatientId === patient.patient.id) {
        var history = state.trail.history;
        var decisions = Array.isArray(state.trail.decisions) ? state.trail.decisions : [];
        var notes = Array.isArray(state.trail.notes) ? state.trail.notes : [];

        if (history) {
          html.push('<div class="audit-item"><strong>Patient review history</strong>' +
            '<div class="audit-meta">' +
            'Reviewed ' + escapeHtml(history.times_searched || 0) + ' time(s). Last action: ' +
            escapeHtml(history.last_action || 'none') + '. Approvals: ' +
            escapeHtml(history.total_approvals || 0) + ' | Modifications: ' +
            escapeHtml(history.total_modifications || 0) + ' | Rejections: ' +
            escapeHtml(history.total_rejections || 0) + '</div></div>');
        }

        if (decisions.length) {
          html = html.concat(decisions.map(renderSavedDecision));
        } else {
          html.push('<div class="empty">No saved coordinator decisions for this patient yet.</div>');
        }

        if (notes.length) {
          html.push('<div class="audit-item local"><strong>Coordinator notes</strong>' +
            notes.slice(0, 3).map(function (note) {
              return '<div class="audit-note">' + escapeHtml(formatDateTime(note.created_at)) +
                ': ' + escapeHtml(note.note || '') + '</div>';
            }).join('') + '</div>');
        }
      } else {
        html.push('<div class="empty">Saved decision trail will load after selecting a patient.</div>');
      }

      if (state.audit.length) {
        html.push('<div class="audit-item local"><strong>This browser session</strong>' +
          state.audit.slice(0, 4).map(function (item) {
            return '<div class="audit-note">' + escapeHtml(item.at) + ': ' +
              escapeHtml(item.message) + '</div>';
          }).join('') + '</div>');
      }

      els.audit.innerHTML = html.join('');
    }

    function renderSavedDecision(decision) {
      var action = String(decision.action || 'decision');
      var actionClass = action === 'rejected' ? ' rejected' : action === 'modified' ? ' modified' : '';
      var score = decision.risk_score || decision.risk_score === 0 ? decision.risk_score + '/100' : 'score not stored';
      var note = decision.coordinator_notes || decision.human_edit || decision.rejection_reason || '';
      var rec = savedRecommendation(decision);

      return '<div class="audit-item' + actionClass + '">' +
        '<strong>' + escapeHtml(capitalize(action)) + ' · ' + escapeHtml(formatDateTime(decision.created_at)) + '</strong>' +
        '<div class="audit-meta">' + escapeHtml(score) + ' · ' +
        escapeHtml(decision.risk_bucket || 'bucket unknown') + ' · ' +
        escapeHtml(decision.priority || 'priority unknown') + '</div>' +
        (note ? '<div class="audit-note"><strong>Note:</strong> ' + escapeHtml(note) + '</div>' : '') +
        (rec ? '<div class="audit-note"><strong>Recommendation:</strong> ' + escapeHtml(rec) + '</div>' : '') +
        '</div>';
    }

    function savedRecommendation(decision) {
      var finalRec = parseMaybeJson(decision.final_rec);
      var originalRec = parseMaybeJson(decision.original_rec);
      if (finalRec && finalRec.revisedDraft) return finalRec.revisedDraft;
      if (finalRec && finalRec.recommended_intervention && finalRec.recommended_intervention.action) {
        return finalRec.recommended_intervention.action;
      }
      if (originalRec && originalRec.recommended_intervention && originalRec.recommended_intervention.action) {
        return originalRec.recommended_intervention.action;
      }
      if (originalRec && originalRec.outreachDraft) return originalRec.outreachDraft;
      return '';
    }

    function parseMaybeJson(value) {
      if (!value || typeof value !== 'string') return value || null;
      try {
        return JSON.parse(value);
      } catch (error) {
        return null;
      }
    }

    function formatDateTime(value) {
      if (!value) return 'Unknown time';
      var date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleString();
    }

    function renderLegacyAudit() {
      if (!state.audit.length) {
        els.audit.innerHTML = '<div class="empty">No decisions yet.</div>';
        return;
      }
      els.audit.innerHTML = state.audit.map(function (item) {
        return '<div class="audit-item"><strong>' + escapeHtml(item.at) + '</strong><br>' +
          escapeHtml(item.message) + '</div>';
      }).join('');
    }

    function setBusy(isBusy, message) {
      els.status.textContent = message;
      els.scanBtn.disabled = isBusy;
      els.rankBtn.disabled = isBusy;
      els.askBtn.disabled = isBusy;
      els.approveBtn.disabled = isBusy;
      els.modifyBtn.disabled = isBusy;
      els.rejectBtn.disabled = isBusy;
      els.refreshTrailBtn.disabled = isBusy;
    }

    function showError(message) {
      els.error.innerHTML = '<div class="error">' + escapeHtml(message) + '</div>';
    }

    function money(value) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
    }

    function capitalize(value) {
      return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  </script>
</body>
</html>`;
}
