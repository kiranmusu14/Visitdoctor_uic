# Preventable Visit Detector Pipeline

## Goal

Find patients most likely to have a preventable emergency department visit, explain why they are high risk, and draft coordinator-ready outreach that a human can approve or personalize.

Core pattern:

```text
Filter patients -> Build risk features -> Score -> Rank -> Pull patient profile -> Draft outreach -> Human review
```

## Best Dataset Signals

The strongest MVP signal is:

```text
High ED utilization + no active care plan
```

Why this fits the prompt:

- `patient_summary` already has `ed_visits`, `chronic_condition_count`, `has_active_careplan`, and cost.
- There are only 13 patients with at least one ED visit and no active care plan, so the agent can produce a focused list.
- Lindsay Brekke is the best demo patient: 44 ED visits, 10 active chronic conditions, no active care plan, SDOH flags, and over $100K outstanding debt.

Useful feature counts from the dataset:

| Feature | Patients |
|---|---:|
| ED visits >= 5 | 11 |
| ED visits >= 10 | 3 |
| No active care plan | 25 |
| ED visit + no active care plan | 13 |
| Chronic conditions >= 10 | 64 |
| Active SDOH condition | 98 |
| Adverse PRAPARE / social observation | 83 |
| Outstanding debt > $10K | 93 |
| Active medications >= 5 | 25 |
| Active opioid medication | 12 |
| ED visit in last 24 months | 25 |

## Feature Groups

### 1. Utilization Risk

Source: `patient_summary`, `encounters`

Use:

- `ed_visits`
- `inpatient_visits`
- `ed_inpatient_total_cost`
- Recent ED visits from `encounters.START`

Why it matters:

Past ED use is the clearest signal that the patient may return to the ED. Recent ED use makes the signal more urgent.

### 2. Care Management Gap

Source: `patient_summary`, `careplans`

Use:

- `has_active_careplan = 0`
- Or `careplans.STOP IS NULL` to check directly

Why it matters:

A patient with ED use and no active care plan is exactly the kind of patient a care coordinator can intervene on.

### 3. Clinical Complexity

Source: `patient_summary`, `conditions`

Use:

- `chronic_condition_count`
- Active conditions where `STOP IS NULL`
- Watch for chronic pain, hypertension, diabetes, ischemic heart disease, obesity, substance use, migraine, etc.

Why it matters:

Multiple active conditions increase the chance of unmanaged symptoms becoming an ED visit.

### 4. Social Barriers

Source: `conditions`, `observations`

Active SDOH conditions:

- Stress
- Limited social contact
- Housing unsatisfactory or homeless
- Lack of access to transportation
- Transport problem
- Unemployed
- Intimate partner abuse
- Refugee
- Low education
- Criminal record

PRAPARE / observation barriers:

- Homelessness
- Worried about losing housing
- Transportation kept patient from appointments or medications
- High stress
- Unemployed
- Limited social contact

Why it matters:

These explain why the patient may not be able to use primary care before symptoms escalate.

### 5. Financial Barriers

Source: `claims_transactions`

Use:

- `SUM(OUTSTANDING)` grouped by `PATIENTID`
- Important: this table joins on `PATIENTID`, not `PATIENT`

Why it matters:

High outstanding debt can cause patients to avoid outpatient care and wait until symptoms become urgent.

### 6. Medication Risk

Source: `medications`

Use:

- Active meds where `STOP IS NULL`
- Polypharmacy: active medication count >= 5
- Opioid signal: medication description contains hydrocodone, oxycodone, fentanyl, morphine, codeine, tramadol, methadone, or buprenorphine

Why it matters:

Polypharmacy increases complexity. Opioids plus ED use can indicate pain, substance use risk, overdose risk, or poor care continuity.

### 7. Care Gap Signals

Source: `procedures`

Use:

- Missing depression screening
- Missing substance use assessment
- Missing medication reconciliation

Note:

Medication reconciliation is not a strong splitter here because almost every patient has one. Depression screening and substance assessment are more useful.

## MVP Scoring Model

Use deterministic code for scoring. Let the AI explain and draft outreach, not do arithmetic.

| Signal | Points |
|---|---:|
| ED visits >= 5 | +25 |
| No active care plan | +20 |
| Chronic conditions >= 10 | +15 |
| Any SDOH or adverse PRAPARE barrier | +15 |
| Outstanding debt > $10K | +10 |
| Active medications >= 5 | +10 |
| Active opioid medication | +10 |
| Any ED visit in last 24 months | +5 |
| Each ED visit, capped at 10 visits | +2 each |
| Each active SDOH condition, capped at 3 | +3 each |

Risk levels:

| Score | Risk Level |
|---:|---|
| 80+ | Very high |
| 55-79 | High |
| 35-54 | Moderate |
| < 35 | Low |

## Top Demo Patients From This Scoring

| Patient | Why they work for demo |
|---|---|
| Lindsay928 Brekke496 | 44 ED visits, no care plan, 10 chronic conditions, SDOH barriers, high debt |
| Werner409 Cruickshank494 | 33 ED visits, 6 inpatient visits, 17 chronic conditions, polypharmacy |
| Giovanni385 Paucek755 | $3.4M ED/inpatient cost, 53 inpatient visits, 21 chronic conditions |
| Chantelle310 Oberbrunner298 | $2.5M ED/inpatient cost, 8 ED visits, 42 inpatient visits, high debt |
| Emerald468 Botsford977 | 25 chronic conditions, 12 active meds, many social observations |

Best prompt-specific demo:

```text
Lindsay Brekke
```

She is ideal because the agent can say:

```text
This is not just a high-cost patient. This is a high-ED-use patient with no active care plan, social barriers, and a clear coordinator intervention opportunity.
```

## Pipeline Steps

### Step 1. Filter Candidate Patients

Start with a focused cohort:

```sql
SELECT id, first, last, ed_visits, inpatient_visits, ed_inpatient_total_cost,
       chronic_condition_count, has_active_careplan, income
FROM patient_summary
WHERE ed_visits > 0
ORDER BY ed_visits DESC
LIMIT 50;
```

MVP filter:

```sql
SELECT id, first, last, ed_visits, inpatient_visits, ed_inpatient_total_cost,
       chronic_condition_count, has_active_careplan, income
FROM patient_summary
WHERE ed_visits >= 3
  AND has_active_careplan = 0
ORDER BY ed_visits DESC
LIMIT 10;
```

### Step 2. Build Patient Features

For each candidate, query:

```sql
-- Active clinical and SDOH conditions
SELECT DESCRIPTION, START
FROM conditions
WHERE PATIENT = :patient_id
  AND STOP IS NULL
ORDER BY START DESC
LIMIT 100;
```

```sql
-- PRAPARE / social observations
SELECT DATE, DESCRIPTION, VALUE
FROM observations
WHERE PATIENT = :patient_id
  AND (
    DESCRIPTION LIKE '%Housing%'
    OR DESCRIPTION LIKE '%transportation%'
    OR DESCRIPTION LIKE '%Stress%'
    OR DESCRIPTION LIKE '%Employment%'
    OR DESCRIPTION LIKE '%education%'
    OR DESCRIPTION LIKE '%refugee%'
  )
ORDER BY DATE DESC
LIMIT 100;
```

```sql
-- Active medication complexity
SELECT DESCRIPTION, START
FROM medications
WHERE PATIENT = :patient_id
  AND STOP IS NULL
ORDER BY START DESC
LIMIT 100;
```

```sql
-- Financial barrier
SELECT PATIENTID, SUM(OUTSTANDING) AS outstanding_debt
FROM claims_transactions
WHERE PATIENTID = :patient_id
GROUP BY PATIENTID
LIMIT 1;
```

```sql
-- Care gap check
SELECT DESCRIPTION, COUNT(*) AS procedure_count
FROM procedures
WHERE PATIENT = :patient_id
  AND (
    DESCRIPTION LIKE '%Depression screening%'
    OR DESCRIPTION LIKE '%Assessment of substance use%'
    OR DESCRIPTION LIKE '%Medication reconciliation%'
  )
GROUP BY DESCRIPTION
LIMIT 50;
```

### Step 3. Score Deterministically

Convert the feature rows into a structured object:

```json
{
  "patient_id": "...",
  "ed_visits": 44,
  "has_active_careplan": false,
  "chronic_condition_count": 10,
  "sdoh_count": 5,
  "adverse_social_observation_count": 2,
  "outstanding_debt": 111533.42,
  "active_med_count": 0,
  "opioid_active": false,
  "risk_score": 114,
  "risk_level": "Very high"
}
```

### Step 4. Rank and Explain

Return the top 5 patients with:

- Risk score
- Top 3 reasons
- Most likely preventable visit driver
- Recommended coordinator action
- Confidence level

Example:

```text
1. Lindsay Brekke - Very high risk, score 114
   Reasons: 44 ED visits, no active care plan, 10 chronic conditions, SDOH barriers, $111K debt.
   Likely driver: unmanaged chronic migraine / pain plus access and financial barriers.
   Next action: coordinator outreach to schedule primary care follow-up and confirm transport or financial assistance needs.
```

### Step 5. Human-in-the-Loop Question

Do not just ask "approve?"

Ask a question where human knowledge changes the recommendation:

```text
Lindsay has high ED use and social barriers. Before I draft outreach, do you know whether she has reliable transportation or a family member who can help her get to appointments?
```

Then branch:

| Human answer | Agent changes |
|---|---|
| Has reliable family transport | Recommend appointment scheduling around family availability |
| No reliable transport | Recommend medical transport program and telehealth option |
| Financial barrier is the main issue | Recommend financial counseling before scheduling |
| Patient prefers phone/text | Change outreach channel and tone |

### Step 6. Draft Outreach

Output should be coordinator-ready, not patient-direct medical advice.

Template:

```text
Patient: Lindsay Brekke
Risk level: Very high
Reason for outreach: 44 ED visits, no active care plan, active chronic conditions, SDOH/financial barriers.

Coordinator action:
1. Call patient within 48 hours.
2. Offer primary care follow-up for migraine/pain management.
3. Ask about transportation and appointment availability.
4. Screen for financial assistance needs due to high outstanding balance.
5. Create or update active care plan after coordinator review.

Suggested message:
"Hi Lindsay, this is [Coordinator] from your care team. We noticed you have needed emergency care several times, and we would like to help you get support before symptoms become urgent. Would you be open to scheduling a care planning visit this week?"
```

## Recommended Build Scope

### Build this first

- One `query_database` tool
- Deterministic scoring function
- Top 5 ranked patients
- One detailed patient profile
- One human question
- One revised outreach recommendation

### Add only if time remains

- Map using patient `LAT` / `LON`
- Race, ethnicity, and income equity lens
- Persist coordinator decisions to a small local or D1 table
- Trend ED visits over time

## Demo Story

Use this 5-minute flow:

1. Problem: care coordinators cannot manually review every patient before a preventable ED visit.
2. Agent run: "Find patients at highest risk of a preventable ED visit."
3. Ranking: show Lindsay Brekke at the top.
4. Explanation: show clinical, social, financial, and care-plan risk factors.
5. Human moment: coordinator answers a transport or financial-barrier question.
6. Outcome: agent updates outreach and creates a coordinator-ready intervention plan.

