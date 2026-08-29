/**
 * The renal-electrolyte module's limitations.
 *
 * Split out of the single register so a module's cockpit chunk carries its own entries and not the
 * other fourteen modules'. An entry is filed here if a renal-electrolyte scenario names it through `briefIn`
 * or declares it in its own metadata; a few entries are named by scenarios in two modules and are
 * filed in both. The complete register is assembled in `../limitations.ts`.
 */

import type { Limitation } from './types';

export const RENAL_ELECTROLYTE_LIMITATIONS: readonly Limitation[] = [
  {
    id: 'renal-hypermagnesemia-antagonism',
    headline: 'Calcium can counter magnesium toxicity without removing magnesium.',
    simplification: 'Qualified calcium care produces a temporary authored circulation response. Respiratory support changes supported respiratory rate and saturation independently; neither intervention lowers the modeled magnesium.',
    whereItMisleads: 'An improved pulse, pressure, or supported breathing pattern is interpreted as magnesium clearance, spontaneous respiratory recovery, or permission to stop support.',
    correctUnderstanding: 'Separate respiratory and circulatory support from magnesium removal. Reassess the whole patient and magnesium with qualified teams; a temporary symptom response does not establish correction or replace renal-aware elimination care.',
    briefIn: ['hypermagnesemia-antagonism-and-removal'],
  },
  {
    id: 'renal-hypermagnesemia-authored-contrasts',
    headline: 'Response and recurrent toxicity use authored contrasts, not a calcium redosing clock.',
    simplification: 'The case uses a finite 30-minute calcium benefit and a selected 60-minute removal response. Clinical toxicity can recur without a magnesium rise. Supported breathing remains supported after partial improvement.',
    whereItMisleads: 'These clocks become expected drug durations, required waits, automatic calcium repeats, dialysis prescriptions, biochemical rebound, or guaranteed recovery.',
    correctUnderstanding: 'Clinical support and removal proceed independently of administrative or repeat-test gates. Repeat calcium requires qualified clinical review. No exact patient trajectory, dialysis kinetics, obligatory rebound, or validated outcome follows from this authored model.',
    briefIn: ['hypermagnesemia-antagonism-and-removal'],
  },
  {
    id: 'renal-hypermagnesemia-continuing-care',
    headline: 'A lower magnesium level does not close renal or respiratory care.',
    simplification: 'Stopping further intake does not instantly clear absorbed magnesium. The later partial response preserves residual weakness and respiratory-support needs; historical kidney and other laboratory values are not refreshed.',
    whereItMisleads: 'Constipation proves bowel obstruction, all renal impairment receives forced diuresis, or handoff requires normal magnesium and unnecessary late calcium after an observed removal response.',
    correctUnderstanding: 'Individualize exposure, bowel, urine-output, volume, elimination, and serial clinical review. Current full findings can support transfer with removal still pending. Handoff closes rehearsal, not ventilation, surveillance, or unresolved risk.',
    briefIn: ['hypermagnesemia-antagonism-and-removal'],
  },
  {
    id: 'renal-hypocalcemia-measurement',
    headline: 'Albumin-adjusted total calcium is not a measured ionized-calcium result.',
    simplification: 'The case supplies discordant historical total and adjusted calcium alongside low measured ionized calcium at actual pH. No protein-binding, pH-correction, or laboratory-error solver is supplied.',
    whereItMisleads: 'A reassuring adjusted estimate erases symptoms and low ionized calcium, or a new ionized check silently refreshes albumin, pH, phosphate, kidney function, or QTc.',
    correctUnderstanding: 'Interpret calcium with symptoms, actual measurement conditions, and kidney context. Ionized measurement needs appropriate specimen handling. Historical values remain historical, and no formula replaces the supplied ionized result.',
    briefIn: ['hypocalcemia-ionized-calcium-and-ckd'],
  },
  {
    id: 'renal-hypocalcemia-authored-contrasts',
    headline: 'Calcium response and recurrence use authored contrasts, not drug or mineral kinetics.',
    simplification: 'Rescue, uncovered recurrence, and continuing calcium care produce selected 15-, 45-, and 60-minute observations. Continuing care can begin immediately after rescue; the early response does not have to be observed first.',
    whereItMisleads: 'A teaching checkpoint becomes a required wait, a predictable drug duration, a calcium dose, or a rapid activated-vitamin-D effect.',
    correctUnderstanding: 'Use qualified monitored rescue and individualized ongoing calcium care with renal-aware prescription and reassessment. Mineral-care and follow-up acknowledgments do not drive the modeled calcium response. No normal calcium, QT recovery, kidney recovery, or injury outcome is predicted.',
    briefIn: ['hypocalcemia-ionized-calcium-and-ckd'],
  },
  {
    id: 'renal-hypocalcemia-continuing-care',
    headline: 'Symptom relief does not end risk after denosumab in advanced kidney disease.',
    simplification: 'Perioral tingling and low ionized calcium persist through partial improvement. A full current assessment can support monitored transfer while a delivered treatment response remains pending.',
    whereItMisleads: 'Handoff becomes discharge clearance, normal magnesium requires automatic replacement, or denosumab is permanently stopped without a coordinated future-treatment plan.',
    correctUnderstanding: 'Preserve kidney-specific mineral care, continuing calcium, acute surveillance, and longer-term follow-up. Future medication decisions require qualified review and fracture-risk safeguards. Routine label follow-up intervals do not replace acute reassessment; a completed rehearsal is not durable recovery.',
    briefIn: ['hypocalcemia-ionized-calcium-and-ckd'],
  },
  {
    id: 'renal-hypernatremia-authored-contrasts',
    headline: 'Circulation and sodium changes are authored contrasts, not water-replacement kinetics.',
    simplification: 'A 15-minute circulation response leaves sodium high. Water-only care can partly lower sodium before recurrence with uncovered losses; combined care later produces another partial improvement. No dose, clearance, fluid-deficit, or injury model is supplied.',
    whereItMisleads: 'A clock becomes a required wait, a fixed sodium change predicts a patient response, or improved pressure proves resolved dehydration.',
    correctUnderstanding: 'Restore depleted circulation promptly, then individualize water and ongoing-loss replacement with serial reassessment. Authored checkpoints and session stops are not treatment deadlines, optimal correction rates, or outcome predictions.',
    briefIn: ['hypernatremia-water-access-and-losses'],
  },
  {
    id: 'renal-hypernatremia-individualized-care',
    headline: 'Reliable assisted water access supports continuity but is not a biochemical treatment gate.',
    simplification: 'Qualified access support includes safe route and assistance review without forcing oral intake. Delivered continuing-loss care does not instantly stop diarrhea; adequate water replacement can work before long-term access is secured.',
    whereItMisleads: 'An acknowledgment supplies water, every patient receives desmopressin, or concentrated urine excludes every renal cause of hypernatremia.',
    correctUnderstanding: 'Interpret urine findings with the full clinical context, assess route and swallowing suitability individually, and reconcile deficit, maintenance, ongoing losses, and all other intake. This case supplies no established desmopressin indication, diagnosis challenge, or universal regional prescription.',
    briefIn: ['hypernatremia-water-access-and-losses'],
  },
  {
    id: 'renal-hypernatremia-observed-findings',
    headline: 'Sodium-only and fluid-balance-only checks keep separate histories.',
    simplification: 'Partial observations do not refresh an older full panel. Handoff can transfer unresolved recurrence and a pending response after qualified care and current combined assessment.',
    whereItMisleads: 'A treatment request or timer becomes an observed response, or a newer sodium result silently updates urine output and continuing losses.',
    correctUnderstanding: 'Request current combined findings and hand off ongoing replacement, assisted access, monitoring, and escalation. Neither an earlier partial improvement nor completed rehearsal proves durable correction, renal recovery, or discharge readiness.',
    briefIn: ['hypernatremia-water-access-and-losses'],
  },
  {
    id: 'renal-hyponatremia-authored-contrasts',
    headline: 'Sodium changes are authored assessment contrasts, not treatment kinetics.',
    simplification: 'Selected qualified rescue yields authored 118-to-123 and then 124 mmol/L checkpoints after 60 and 30 minutes. No dose, clearance, urine-loss, or delayed-injury model is supplied.',
    whereItMisleads: 'A fixed change predicts a patient response, a clock becomes a required wait, or a +6 mmol/L handoff becomes an automatic treatment stop.',
    correctUnderstanding: 'Individualize symptom-led treatment and close sodium, neurologic, urine-output, and fluid-balance surveillance. The selected 2022 Society for Endocrinology pathway is not a universal regional schedule; correction limits are ceilings, not routine targets.',
    briefIn: ['hyponatremia-symptoms-and-reassessment'],
  },
  {
    id: 'renal-hyponatremia-persistent-symptoms',
    headline: 'A better sodium number does not resolve the supplied neurologic symptoms.',
    simplification: 'Confusion, headache, and nausea persist through both authored response checkpoints. Qualified alternative-cause evaluation is available at any time but generates no diagnosis or cure.',
    whereItMisleads: 'Numeric improvement becomes neurologic recovery, concentrated urine during thiazide exposure proves SIAD, or recent symptoms prove acute duration.',
    correctUnderstanding: 'Continue expert treatment decisions and investigate unresolved symptoms. Interpret contemporaneous pretreatment specimens with medications and alternative causes, preserve the original correction window, and do not infer severe malnutrition from poor intake alone.',
    briefIn: ['hyponatremia-symptoms-and-reassessment'],
  },
  {
    id: 'renal-hyponatremia-observed-findings',
    headline: 'Partial sodium or neurologic checks do not refresh the older full assessment.',
    simplification: 'Each requested partial and full observation keeps its own timestamp; care acknowledgments and elapsed time do not acquire results.',
    whereItMisleads: 'A newer sodium result silently updates symptoms, or an old full panel authorizes further treatment or completed handoff after a changed response.',
    correctUnderstanding: 'Request current combined findings and transfer unresolved symptoms, cumulative correction, surveillance, investigation, and escalation. Handoff ends rehearsal, not clinical care, and establishes neither discharge readiness nor durable safety.',
    briefIn: ['hyponatremia-symptoms-and-reassessment'],
  },
  {
    id: 'renal-hypokalemia-authored-contrasts',
    headline: 'Replacement and recurrent losses use authored contrasts, not potassium or magnesium kinetics.',
    simplification: 'Separate potassium and magnesium care can produce partial observations before combined improvement. Continuing unmanaged losses can cause an authored recurrence; the 30-, 60-, and 120-minute checkpoints are not clinical waits or grading deadlines.',
    whereItMisleads: 'Fixed laboratory changes become expected patient responses, magnesium is made a prerequisite to urgent potassium treatment, or a teaching stop predicts arrhythmia or death.',
    correctUnderstanding: 'Treat severe deficiency promptly with qualified monitoring and individualized replacement. Magnesium deficiency can make potassium correction difficult, but potassium-only care is not necessarily ineffective. No dose, clearance, arrhythmia, or renal-recovery solver is supplied.',
    briefIn: ['hypokalemia-magnesium-and-ongoing-losses'],
  },
  {
    id: 'renal-hypokalemia-individualized-care',
    headline: 'Continuing-loss care is delivered support, not instant diarrhea cessation or a universal medication rule.',
    simplification: 'Potassium, magnesium, and individualized continuing-loss management are independent qualified care requests. Loss management alone does not replenish deficits or prove the underlying illness has ended.',
    whereItMisleads: 'A planning acknowledgment stops losses, an unchanged usual replacement fits every patient, or improved serum findings establish replenished body stores.',
    correctUnderstanding: 'Coordinate ongoing-loss replacement and contributor management with kidney, volume, medication, and clinical reassessment. Avoid unmonitored rapid potassium administration and continue appropriate electrolyte and cardiac surveillance.',
    briefIn: ['hypokalemia-magnesium-and-ongoing-losses'],
  },
  {
    id: 'renal-hypokalemia-observed-findings',
    headline: 'A potassium-only or ECG-only check cannot refresh older magnesium findings.',
    simplification: 'Partial and full observations retain separate timestamps. The waveform selects qualitative T-wave flattening only; it supplies no U waves or quantitative QT/QU measurement and cannot establish electrolyte concentrations.',
    whereItMisleads: 'A better waveform, one potassium value, or an elapsed response clock becomes proof of corrected magnesium, restored stores, or durable rhythm safety.',
    correctUnderstanding: 'Request fresh combined findings when needed and transfer unresolved deficits, recurrent-loss history, and continuing surveillance. Handoff ends rehearsal, not replacement needs, and grants no discharge or competence certification.',
    briefIn: ['hypokalemia-magnesium-and-ongoing-losses'],
  },
  {
    id: 'renal-hyperkalemia-authored-contrasts',
    headline: 'Cardiac protection, shifting, removal, and rebound use fictional contrasts, not treatment kinetics.',
    simplification: 'Calcium has a finite 45-minute ECG benefit; shifting, delivered removal care, and rebound use 30-, 60-, and 150-minute checkpoints. No dose response, arrhythmia, arrest, or kidney-recovery model is supplied.',
    whereItMisleads: 'An authored clock becomes a safe waiting interval, a normal ECG establishes potassium safety, or a fixed response predicts a patient outcome.',
    correctUnderstanding: 'Treat promptly and reassess according to qualified clinical judgment. Calcium does not lower potassium, shifting does not remove total-body potassium, and ECG morphology is qualitative rather than a calibrated potassium or QRS measurement.',
    briefIn: ['hyperkalemia-cardioprotection-and-rebound'],
  },
  {
    id: 'renal-hyperkalemia-individualized-care',
    headline: 'A removal plan is not delivered elimination, and delivered care is not automatic dialysis.',
    simplification: 'Qualified calcium, insulin-glucose care, and delivered individualized elimination are dose-free requests. Support, context, monitoring, and planning do not themselves lower potassium.',
    whereItMisleads: 'A consultation instantly clears potassium, a binder alone becomes emergency rescue, or all patients receive identical dialysis, diuresis, or medication cessation.',
    correctUnderstanding: 'Individualize treatment and elimination with renal or critical-care expertise, including kidney trajectory, volume, urine output, contributors, and refractory disease. Preserve glucose prevention and surveillance; hypoglycemia is a risk, not an inevitable simulated event.',
    briefIn: ['hyperkalemia-cardioprotection-and-rebound'],
  },
  {
    id: 'renal-hyperkalemia-observed-findings',
    headline: 'ECG-only and glucose-only checks do not refresh historical potassium findings.',
    simplification: 'Requested observations retain separate timestamps. Accepted care and elapsed response clocks do not disclose new laboratory results. Observed rebound remains part of the learning history after later care.',
    whereItMisleads: 'An improved waveform or old potassium result justifies ending monitoring, or handoff is mistaken for durable correction or discharge.',
    correctUnderstanding: 'Repeat ECG, potassium, glucose, and bedside assessment as indicated; hand off unresolved risks, elimination progress, and continuing surveillance. A bounded teaching stop does not certify clinical safety or competence.',
    briefIn: ['hyperkalemia-cardioprotection-and-rebound'],
  },
];
