import type { QualityRecordEnvelope } from '@platform/catalog/scenario-quality';

// Deliberately literal: a content change must not carry these authored records forward.
const identity = { schemaVersion: 1, scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', contentVersion: '0.1.0' } as const;
const model = 'src/modules/endocrine-metabolic/hypocalcemia.ts';
const scenario = 'src/modules/endocrine-metabolic/scenarios/hypocalcemic-tetany-rescue-and-recurrence.ts';
const tray = 'src/modules/endocrine-metabolic/HypocalcemiaTray.tsx';
const fixtures = 'src/modules/endocrine-metabolic/hypocalcemia-fixtures.ts';
const demo = 'src/modules/endocrine-metabolic/demo/hypocalcemia-demonstration.ts';
const tutor = 'src/modules/endocrine-metabolic/tutor/hypocalcemia-guidance.ts';
const brief = 'docs/evidence-briefs/hypocalcemic-tetany-rescue-and-recurrence.md';
const unit = 'tests/unit/endocrine-hypocalcemia.test.ts';
const replay = 'tests/integration/hypocalcemia-runs.test.ts';
const sfe = 'https://doi.org/10.1530/EC-16-0056';
const addendum = 'https://doi.org/10.1530/EC-16-0056a';
const ese = 'https://doi.org/10.1093/ejendo/lvaf222';
const airway = 'https://doi.org/10.1111/anae.15585';

type Category = 'starting-setting' | 'preselected-action' | 'stocked-action' | 'hidden-trait'
  | 'scripted-delay' | 'time-scale' | 'randomization-range' | 'tutor-threshold';
function authored(id: string, category: Category, value: string | number | boolean | null,
  sourceRefs: readonly string[], rationale: string, educationalEffect: string,
  applicability = 'Authored content 0.1.0 in US and GB practice profiles; not an individual treatment prediction.') {
  return { id, category, value, sourceRefs, rationale, practiceRegions: ['US', 'GB'], applicability, educationalEffect };
}

const defaults = [
  authored('patient-demographics', 'starting-setting', '{"ageYears":46,"sex":"female","heightCm":165,"weightKg":68,"asaClass":3}', [scenario, brief],
    'Fictional postoperative adult, not a population estimate or weight-based dose input.', 'Establishes context without a dosing exercise.'),
  authored('postoperative-day', 'starting-setting', 1, [scenario, brief, sfe, airway],
    'Authored day after total thyroidectomy; sources establish relevant differential, not this patient or timing.', 'Connects tetany with ongoing postoperative and neck-risk review.'),
  authored('history-and-initial-safety', 'starting-setting', 'Tetany and perioral tingling; patent airway; no supplied neck swelling, hematoma, or seizure; no known drug allergies. Medication, supplement, intake and vitamin D context need qualified review.', [scenario, model, brief],
    'Supplied history is intentionally incomplete; absence of a scripted catastrophe does not establish durable safety.', 'Keeps continuing surveillance and cause review necessary.'),
  authored('schema-baseline', 'starting-setting', '{"heartRateBpm":98,"meanArterialMmHg":83,"strokeVolumeMl":70,"hemoglobinGPerDl":12.5,"bloodVolumeMl":4400,"coreTemperatureC":36.8,"arterialStiffness":1,"baroreflexGain":1,"fixedStrokeVolume":true}', [scenario, brief],
    'Schema-compatible baseline; unused generic physiology values do not generate the hypocalcemia states.', 'Prevents placeholder parameters becoming inferred clinical targets.'),
  authored('schema-airway-respiratory', 'starting-setting', '{"difficulty":0.1,"difficultMaskVentilation":false,"respiratoryProfile":"healthy"}', [scenario, brief],
    'Compatibility settings, not predicted airway difficulty or proof of respiratory safety.', 'Separates qualified risk assessment from procedural competence.'),
  authored('monitoring', 'starting-setting', '["ecg","nibp","pulse-oximetry","temperature"]', [scenario, sfe],
    'Authored monitor availability; the source supports ECG-monitored rescue, not a dynamically measured QTc.', 'Supplies visible physiology while requested calcium remains historical.'),
  authored('inactive-ventilator', 'preselected-action', '{"mode":"manual","fio2":0.21,"tidalVolumeMl":450,"respiratoryRateBpm":20,"freshGasFlowLPerMin":10,"delivering":false}', [scenario, brief, 'src/modules/anesthesia/engine.ts#invalidParameters'],
    'Inactive schema defaults, not a delivered respiratory prescription. FiO2 and exhaled CO2 are not supplied in this lesson.', 'Avoids treating generic equipment defaults as care already delivered.'),
  authored('formulary', 'stocked-action', '[]', [scenario, addendum],
    'No selectable drug doses or preparations; preparation equivalence requires qualified real-world prescribing.', 'Prevents dosage or access competence claims.'),
  authored('initial-model-state', 'preselected-action', '{"supportActive":false,"riskAssessedAtTick":null,"causeReviewedAtTick":null,"calciumAtTick":null,"magnesiumAtTick":null,"continuingCareAtTick":null,"calciumDueInSeconds":null,"responseDueInSeconds":null,"calciumResponseObserved":false,"responseObserved":false,"urgentTreatmentDelayed":false,"recurrenceOccurred":false,"oralOnlyChosen":false,"waitForLabsChosen":false,"waitForMagnesiumChosen":false,"stopAfterReliefAttempted":false,"observation":null,"choiceFeedback":null,"ended":null,"authoredStateTransitions":true,"doseModelAvailable":false,"durableRecoveryProven":false}', [model],
    'No treatment, observation, delay, error, or recovery credit is preselected.', 'The learner must initiate care and request evidence.'),
  authored('fixed-vital-values', 'starting-setting', '{"systolicMmHg":112,"diastolicMmHg":68,"meanArterialMmHg":83,"spo2Percent":98,"coreTemperatureC":36.8}', [model, brief],
    'Authored constants across every branch, not hemodynamic or oxygenation predictions.', 'Keeps the lesson centered on rescue and recurrence.'),
  authored('initial-response-values', 'starting-setting', '{"heartRateBpm":98,"respiratoryRateBpm":20,"adjustedCalciumMgDl":6.6}', [model, brief],
    'Authored initial tetany state; 6.6 mg/dL is approximately 1.65 mmol/L, not an independently measured result.', 'Shows a symptomatic low-calcium emergency without a threshold calculator.'),
  authored('delay-response-values', 'starting-setting', '{"heartRateBpm":110,"respiratoryRateBpm":24,"adjustedCalciumMgDl":6.6}', [model, brief],
    'Authored distress contrast after missing rescue, not a prediction of deterioration.', 'Makes omitted urgent care consequential without scripting catastrophe.'),
  authored('relief-response-values', 'starting-setting', '{"heartRateBpm":90,"respiratoryRateBpm":18,"adjustedCalciumMgDl":7}', [model, brief],
    'Authored partial symptom relief; not calcium kinetics or normalization.', 'Tests whether relief is mistaken for durable correction.'),
  authored('recurrence-response-values', 'starting-setting', '{"heartRateBpm":106,"respiratoryRateBpm":22,"adjustedCalciumMgDl":6.7}', [model, brief],
    'Authored recurrent-spasm contrast with missing magnesium or continuing care, not isolated clinical causality.', 'Supports an explicit recovery path and retained omission evidence.'),
  authored('later-response-values', 'starting-setting', '{"heartRateBpm":86,"respiratoryRateBpm":18,"adjustedCalciumMgDl":7.2}', [model, brief],
    'Authored incomplete stabilization under full support; low calcium and tingling remain.', 'Requires continuing-risk handoff, not discharge or treatment cessation.'),
  authored('supplied-qtc-ms', 'starting-setting', 520, [scenario, tray, brief, sfe],
    'Fictional fixed ECG report; the source motivates cardiac surveillance but does not validate this value.', 'QTc is neither calculated from the waveform nor normalized after a button.'),
  authored('supplied-cause-panel', 'hidden-trait', '{"magnesiumMmolL":0.45,"pthPgMl":4,"pthReferenceLow":15,"pthReferenceHigh":65,"phosphateMgDl":5.4,"phosphateReferenceLow":2.5,"phosphateReferenceHigh":4.5,"creatinineMgDl":0.9}', [tray, brief, sfe, ese],
    'Authored low-magnesium/low-PTH/high-phosphate panel with preserved renal function and illustrative assay ranges; revealed only after cause review.', 'Informs qualified magnesium and continuing care without diagnosing permanent hypoparathyroidism or supplying normal follow-up values.'),
  authored('declared-actions', 'stocked-action', '["call-support","assess-risk","calcium-rescue","review-cause","magnesium","continuing-care","reassess","handoff","oral-only","wait-for-labs","wait-for-magnesium","stop-after-relief"]', [model, sfe, ese, addendum],
    'Twelve dose-free care intents and distractors; calcium rescue has no prerequisite, and cause review gates only magnesium/continuing care.', 'Makes sequencing, refusal and later correction observable without simulating prescriptions.'),
  authored('complete-care-elements', 'stocked-action', '["calcium-rescue","assess-risk","review-cause","magnesium","continuing-care","call-support"]', [model],
    'Six accepted care elements start the later authored clock from the last acceptance; no biological effect is inferred from completion.', 'Prevents checkbox completion from substituting for a later observation.'),
  authored('ticks-per-second', 'time-scale', 10, ['src/platform/clock/simulation-clock.ts'],
    'Simulation clock resolution, not a clinical measurement interval.', 'Makes authored deadlines and replay timestamps deterministic.'),
  authored('urgent-delay-ticks', 'scripted-delay', 3000, [model, brief],
    'Authored five-minute missing-rescue flag; not a safe delay or clinical deadline.', 'Retains treatment-delay evidence after correction.'),
  authored('calcium-response-ticks', 'scripted-delay', 9000, [model, brief],
    'Authored 15-minute relief checkpoint after rescue; not administration time or calcium kinetics.', 'Separates accepted rescue from observed initial response.'),
  authored('recurrence-ticks', 'scripted-delay', 27000, [model, brief],
    'Authored 45-minute recurrence checkpoint after rescue if either magnesium or continuing care remains absent.', 'Contrasts incomplete care with ongoing support; no drug-duration prediction.'),
  authored('later-response-ticks', 'scripted-delay', 36000, [model, brief],
    'Authored 60-minute partial-support checkpoint after all six care elements, not activated-vitamin-D efficacy.', 'Requires an explicitly requested later assessment.'),
  authored('no-rescue-takeover-ticks', 'scripted-delay', 18000, [model, brief],
    'Authored 30-minute instructor stop without calcium rescue; no predicted seizure, arrest or airway obstruction.', 'Bounds the no-action lesson without claiming a safe treatment window.'),
  authored('unfinished-session-ticks', 'scripted-delay', 108000, [model, brief],
    'Authored 180-minute unfinished-session stop regardless of omitted step.', 'Keeps every branch bounded.'),
  authored('estimated-simulated-minutes', 'time-scale', 60, [scenario, brief],
    'Approximate prompt-care observation duration, not the maximum branch or wall-clock reading time.', 'Keeps catalog and search duration honest.'),
  authored('timeline-and-replay-ticks', 'starting-setting', '{"hypocalcemia-presentation":0,"hypocalcemia-boundary":0,"hypocalcemia-first-response":1}', [scenario],
    'Two initial narrative records and an authored return point immediately before early actions.', 'Preserves presentation, limitations and a repeatable counterfactual start.'),
  authored('fixture-seed', 'randomization-range', 4906, [fixtures, replay],
    'Reference replay seed; this model has no seeded clinical variation or hidden random trait.', 'Reproduces reference courses without implying tested stochastic outcome ranges.'),
  authored('expert-fixture', 'scripted-delay', '[[0,"calcium-rescue"],[1,"assess-risk"],[2,"review-cause"],[3,"magnesium"],[4,"continuing-care"],[6,"call-support"],[9000,"reassess"],[36006,"reassess"],[36007,"handoff"]]', [fixtures, replay],
    'Authored transcript timestamps in ticks; rapid parallel-care ordering is not a clinical speed requirement.', 'Observes initial and later phases before handoff.'),
  authored('common-error-fixture', 'scripted-delay', '[[0,"oral-only"],[1,"wait-for-labs"],[2,"wait-for-magnesium"],[3,"call-support"],[3000,"reassess"]]', [fixtures, replay],
    'Authored omission branch ending at the model takeover bound.', 'Preserves diagnostic delay and missing rescue as learning evidence.'),
  authored('recovery-fixture', 'scripted-delay', '[[0,"oral-only"],[1,"wait-for-labs"],[2,"wait-for-magnesium"],[3,"call-support"],[3000,"reassess"],[3001,"calcium-rescue"],[3002,"assess-risk"],[3003,"review-cause"],[12001,"reassess"],[12002,"stop-after-relief"],[30001,"reassess"],[30002,"magnesium"],[30003,"continuing-care"],[66003,"reassess"],[66004,"handoff"]]', [fixtures, replay],
    'Authored recovery observes recurrence before completing cause care; errors are never erased.', 'Separates correcting a decision from retroactively earning all objective credit.'),
  authored('no-action-fixture', 'scripted-delay', '[]', [fixtures, replay],
    'No learner actions before the authored takeover.', 'Tests intentional absence of care rather than an undefined run.'),
  authored('example-playback-speed', 'time-scale', 60, ['src/routes/AnesthesiaRoute.tsx', 'tests/integration/demonstration-runs.test.tsx'],
    'Optional 60x simulated observation speed; decision reading pauses the patient clock.', 'Keeps the full authored interval available without forcing an hour of wall time.'),
  authored('manual-restart-speed', 'time-scale', 1, ['src/routes/AnesthesiaRoute.tsx', 'tests/ui/hypocalcemia-report-surfaces.test.tsx'],
    'Manual restart returns to normal speed; this is a transport default, not care.', 'Prevents inherited example speed from surprising the learner.'),
  authored('example-progress-landmarks', 'tutor-threshold', '{"preparing":0,"calcium-rescue":0.05,"risk":0.15,"cause":0.25,"magnesium":0.35,"continuing-care":0.4,"support":0.45,"calcium-observation":0.5,"calcium-reassessment":0.6,"continuing-observation":0.7,"continuing-reassessment":0.85,"handoff":0.95,"finished":1}', [demo],
    'Display progress fractions for nine decisions and two observed waits; not a competence score.', 'Explains example position without grading physiology.'),
  authored('guidance-thresholds', 'tutor-threshold', 'Guided offers the next accepted-state decision; Coached suppresses nonurgent waits/handoff prompts; Unassisted is silent. Version 0.1.0 only. No additional clinical numeric threshold.', [tutor, demo, 'tests/ui/endocrine-hypocalcemia.test.tsx'],
    'Author-selected guidance policy follows the same care/observation state and six clocks.', 'Avoids hidden numeric rules, late-only reassessment loops, and tutor state mutation.'),
  authored('initial-guidance', 'preselected-action', 'coached', ['src/platform/session/session-store.ts', tray],
    'The shared session defaults to Coached; the standalone tray falls back to Unassisted if no guidance prop is supplied.', 'Makes the initial assistance level explicit and keeps the optional quiet mode available.'),
  authored('observation-credit-and-handoff', 'tutor-threshold', 'Pre-final relief or recurrence observation plus later fresh observation earns full reassessment credit; full care and later fresh observation alone permit handoff.', [model, 'src/modules/anesthesia/ui/Debrief.tsx', unit, replay],
    'An educational evidence distinction, not a clinical rule requiring recovery to be observed twice.', 'Missed early evidence affects feedback without blocking appropriate continuing-care handoff.'),
];

export const HYPOCALCEMIA_QUALITY_RECORDS: readonly QualityRecordEnvelope[] = [
  { moduleId: 'endocrine-metabolic', kind: 'training-value', record: { ...identity,
    fictionalTimeEvolvingState: true, incompleteInformation: true, learnerAction: true, consequence: true,
    reassessment: true, causalDebrief: true, staticOutputSubstitute: false,
    evidence: [
      `${model}#Hypocalcemia.advance: accepted rescue, missing continuing care and elapsed support select distinct authored courses independently of observations.`,
      `${tray}: cause findings require explicit review; historical calcium is never silently refreshed.`,
      `${unit}: immediate rescue, refused/stale choices, recurrence, two-phase credit and late-only handoff are asserted.`,
      `${replay}: real-engine expert/common-error/recovery/no-action runs bind actions, states, events and five objectives to this version.`,
      'src/modules/anesthesia/ui/Debrief.tsx#hypocalcemia-reassessment: recorded delay and recurrence remain distinct from recovery, durable correction, or competence.',
      `${brief}: source boundaries and fictional clocks explain why a static calcium lookup cannot rehearse this action/observation sequence. These records do not establish independent clinical review.`,
    ],
  } },
  { moduleId: 'endocrine-metabolic', kind: 'authored-defaults', record: { ...identity, defaults } },
  { moduleId: 'endocrine-metabolic', kind: 'scenario-hazard', record: { ...identity, hazards: [
    { category: 'premature-closure', disposition: 'mitigated', description: 'Reduced spasm could be mistaken for durable correction, permanent diagnosis, or discharge readiness.', evidence: [
      `${model}#Hypocalcemia.apply: stop-after-relief never stops care; handoff retains active risk.`, `${unit}: late-only handoff and retained mistakes.`, ese, `${brief}#hazards-verification-and-remaining-work`] },
    { category: 'cue-leakage', disposition: 'tested', description: 'Hidden cause values or a not-yet-requested calcium result could leak through tutor, reporting, or nonvisual output.', evidence: [
      'tests/ui/endocrine-hypocalcemia.test.tsx: cause findings remain hidden until review.', 'tests/ui/hypocalcemia-report-surfaces.test.tsx: opted-in context omits hidden findings and prose.',
      'tests/ui/hypocalcemia-accessibility.test.tsx: requested calcium stays historical.', `${tray}: title names the known condition because the objective is rescue and recurrence, not diagnosis.`] },
    { category: 'negative-transfer', disposition: 'limited', description: 'A dose-free button could imply calcium, magnesium, access, infusion, airway, or seizure-management competence.', evidence: [
      addendum, sfe, `${scenario}#hypocalcemia-boundary`, 'src/platform/docs/limitations.ts#hypocalcemia-qualified-care-and-cause-limits', `${model}: rescue includes qualified monitoring but selects no prescription.`] },
    { category: 'unsupported-precision', disposition: 'limited', description: 'Fictional response times, calcium magnitudes, or a fixed QTc might be mistaken for kinetics or live measurement.', evidence: [
      `${brief}#fictional-defaults-and-clocks`, 'src/platform/docs/limitations.ts#hypocalcemia-authored-response-and-recurrence', `${replay}: automatic checkpoints do not refresh stored calcium.`, `${tray}: QTc is explicitly supplied, never calculated.`] },
    { category: 'omitted-alternatives', disposition: 'limited', description: 'A postoperative low-PTH/low-magnesium branch does not cover every hypocalcemia cause, treatment alternative, or new neck emergency.', evidence: [
      sfe, ese, airway, `${scenario}#hypocalcemia-risk`, 'src/platform/docs/limitations.ts#hypocalcemia-postoperative-airway-and-handoff', `${model}: risk review retains postoperative airway/surgical escalation.`] },
    { category: 'invalid-actions', disposition: 'tested', description: 'Unknown payloads, generic actions, premature cause therapy, or stale delay choices could mutate care or create false evidence.', evidence: [
      `${unit}: cause prerequisites, same-tick ordering, stale delay and ended-state guards.`, `${replay}: generic action isolation and payload rejection.`, 'tests/ui/hypocalcemia-report-surfaces.test.tsx: rejected payload content is omitted from reports.'] },
    { category: 'model-boundary-crossing', disposition: 'limited', description: 'Generic monitor equipment or published source scope could imply an unmodeled measurement, treatment effect, or real-patient decision tool.', evidence: [
      'src/modules/anesthesia/engine.ts#invalidParameters', 'tests/ui/hypocalcemia-accessibility.test.tsx: unavailable oxygen/CO2 and historical calcium in actual Cockpit output.', `${brief}: schema-only defaults, no magnesium/QT normalization or activated-vitamin-D efficacy.`] },
    { category: 'catastrophic-outcome-framing', disposition: 'mitigated', description: 'A teaching delay or timeout could be read as a prediction of seizure, arrest, airway obstruction, or punishment.', evidence: [
      `${model}#Hypocalcemia.advance: both takeovers are explicitly instructor stops; airway remains patent.`, `${scenario}#hypocalcemia-boundary`, `${unit}: bounded no-action and unfinished paths without catastrophe.`] },
    { category: 'accessibility-misunderstanding', disposition: 'limited', description: 'Visual changes, focus loss, or announcements could hide uncertainty or imply a stronger finding than the supplied report.', evidence: [
      'tests/ui/hypocalcemia-accessibility.test.tsx: live-region, keyboard summary and Why-panel checks.', 'tests/integration/demonstration-runs.test.tsx: paused waits and duplicate-dispatch protection.',
      `${brief}: local desktop/320 px checks are limited; full screen-reader, keyboard, reduced-motion, color-vision, zoom, offline and performance verification remain pending. No state-space pass record is supplied.`] },
    { category: 'regional-variation', disposition: 'limited', description: 'UK/European source guidance and illustrative assay ranges could be mistaken for a universal local prescription or for verification of every supported profile.', evidence: [
      sfe, addendum, ese, `${brief}: illustrative assay ranges and excluded dose/preparation decisions.`, 'src/modules/anesthesia/catalog/scenario-completion.ts: US and GB profiles are declared; a complete region/state-space matrix remains pending.'] },
  ] } },
];
