import type { QualityRecordEnvelope } from '@platform/catalog/scenario-quality';

// Literal evidence for this implemented version, not a clinical sign-off or a generated pass.
const identity = { schemaVersion: 1, scenarioId: 'hyponatremia-aquaresis-and-overcorrection', contentVersion: '0.1.0' } as const;
const model = 'src/modules/endocrine-metabolic/hyponatremia-correction.ts';
const scenario = 'src/modules/endocrine-metabolic/scenarios/hyponatremia-aquaresis-and-overcorrection.ts';
const tray = 'src/modules/endocrine-metabolic/HyponatremiaCorrectionTray.tsx';
const fixtures = 'src/modules/endocrine-metabolic/hyponatremia-correction-fixtures.ts';
const demo = 'src/modules/endocrine-metabolic/demo/hyponatremia-correction-demonstration.ts';
const tutor = 'src/modules/endocrine-metabolic/hyponatremia-correction-tutor.ts';
const brief = 'docs/evidence-briefs/hyponatremia-aquaresis-and-overcorrection.md';
const unit = 'tests/unit/endocrine-hyponatremia-correction.test.ts';
const replay = 'tests/integration/hyponatremia-correction-runs.test.ts';
const session = 'tests/integration/hyponatremia-demonstration-session.test.tsx';
const reporting = 'tests/ui/hyponatremia-correction-report-surfaces.test.tsx';
const accessibility = 'tests/ui/hyponatremia-correction-accessibility.test.tsx';
const sfe = 'https://www.endocrinology.org/media/xhrhxhxm/emergency-management-of-severe-and-moderately-severely-symptomatic-hyponatraemia-in-adult-patients-2022.pdf';
const sterns = 'https://doi.org/10.2215/CJN.0000000000000244';
const european = 'https://doi.org/10.1530/EJE-13-1020';

type Category = 'starting-setting' | 'preselected-action' | 'stocked-action' | 'hidden-trait'
  | 'scripted-delay' | 'time-scale' | 'randomization-range' | 'tutor-threshold';
function authored(id: string, category: Category, value: string | number | boolean | null,
  sourceRefs: readonly string[], rationale: string, educationalEffect: string) {
  return { id, category, value, sourceRefs, rationale, practiceRegions: ['US', 'GB'],
    applicability: 'Authored content 0.1.0; US and GB use the same selected high-risk teaching plan, not a universal prescription.', educationalEffect };
}

const defaults = [
  authored('patient-demographics', 'starting-setting', '{"ageYears":62,"sex":"female","heightCm":165,"weightKg":54,"asaClass":4}', [scenario, brief],
    'Fictional patient and compatibility values, not a population estimate or dosing input.', 'Establishes a post-rescue adult without implying dose calculation.'),
  authored('history-and-prior-care', 'starting-setting', 'Unknown duration; malnutrition; alcohol-use disorder; recent thiazide and poor intake are possible contributors, not proven SIADH. Seizure rescue is complete; hypertonic saline has stopped; thiazide is withheld. No known allergies is supplied fiction.', [scenario, brief, sfe, sterns, european],
    'Authored context supports qualified review without declaring the cause or proving that correction has stopped.', 'Distinguishes post-rescue surveillance from a new seizure-rescue checklist.'),
  authored('supplied-potassium-mmol-l', 'starting-setting', 2.7, [scenario, tray, brief, sterns, european],
    'Supplied low potassium increases concern and contributes to the correction plan; no replacement dose or independent potassium kinetics is modeled.', 'Keeps potassium, nutrition, and cause care within qualified monitoring.'),
  authored('schema-baseline', 'starting-setting', '{"heartRateBpm":84,"meanArterialMmHg":86,"strokeVolumeMl":70,"hemoglobinGPerDl":12.5,"bloodVolumeMl":3500,"coreTemperatureC":36.8,"arterialStiffness":1,"baroreflexGain":1,"fixedStrokeVolume":true}', [scenario, brief],
    'Schema-compatible constants; generic cardiovascular parameters do not generate this lesson’s fixed vitals or sodium course.', 'Avoids turning compatibility fields into physiologic predictions.'),
  authored('schema-airway-respiratory', 'starting-setting', '{"difficulty":0.1,"difficultMaskVentilation":false,"respiratoryProfile":"healthy"}', [scenario, brief],
    'Inactive compatibility settings alongside an authored awake patient, not validated airway or respiratory risk estimates.', 'No airway procedure or ventilation competence is implied.'),
  authored('monitoring', 'starting-setting', '["ecg","nibp","pulse-oximetry","temperature"]', [scenario],
    'Authored monitor availability; serial sodium and urine-output observations still require explicit requests.', 'Prevents monitor presence from substituting for surveillance decisions.'),
  authored('inactive-ventilator', 'preselected-action', '{"mode":"manual","fio2":0.21,"tidalVolumeMl":450,"respiratoryRateBpm":16,"freshGasFlowLPerMin":10,"delivering":false}', [scenario, brief, 'src/modules/anesthesia/engine.ts#invalidParameters'],
    'Inactive schema defaults, not administered oxygen or a respiratory prescription. FiO2 and exhaled CO2 are unavailable in the lesson.', 'Keeps generic settings out of clinical and nonvisual claims.'),
  authored('formulary', 'stocked-action', '[]', [scenario, sfe, european],
    'No selectable doses, fluid volumes, concentrations, or infusion rates.', 'Rehearses qualified care intent rather than prescription skill.'),
  authored('fixed-live-vitals', 'starting-setting', '{"systolicMmHg":118,"diastolicMmHg":70,"meanArterialMmHg":86,"heartRateBpm":84,"respiratoryRateBpm":16,"spo2Percent":98,"coreTemperatureC":36.8,"alertness":"awake but tired; no recurrent seizure is scripted"}', [model, brief],
    'Authored constants in every branch; neither sodium nor urine output is included in live vitals.', 'An unchanged appearance cannot prove controlled correction.'),
  authored('original-sodium-mmol-l', 'starting-setting', 106, [scenario, model, tray, brief],
    'Supplied pretreatment baseline remains the origin of every rise calculation.', 'Prevents transfer to this lesson from resetting the correction window.'),
  authored('supplied-post-rescue-sodium-mmol-l', 'starting-setting', 111, [scenario, model, tray, brief],
    'Supplied hour-1 result, not a new requested observation or ongoing live measurement.', 'Makes the prior rise of 5 visible before further choices.'),
  authored('correction-window-offset-minutes', 'time-scale', 60, [scenario, model, tray, brief],
    'Simulation tick zero starts one hour after the original sodium measurement.', 'Elapsed lesson time is added to, not substituted for, the correction window.'),
  authored('selected-high-risk-plan', 'tutor-threshold', '{"dailyGoalLowMmolL":4,"dailyGoalHighMmolL":6,"maximumRiseMmolL":8,"windowHours":24}', [sterns, sfe, european, scenario, model, tray],
    'Selected high-risk guidance from expert reaffirmation; general European limits differ. Exceeding 8 from 106 is not a target or an independently predicted injury.', 'Makes the original baseline and risk context actionable without a dose calculator.'),
  authored('initial-public-state', 'preselected-action', '{"supportActive":false,"riskReviewedAtTick":null,"monitoringAtTick":null,"waterLossControlAtTick":null,"reloweringAtTick":null,"aquaresisDueInSeconds":1800,"responseDueInSeconds":null,"aquaresisObserved":false,"overcorrectionObserved":false,"responseObserved":false,"peakObservedSodiumMmolL":111,"normalizationAttempted":false,"symptomWaitChosen":false,"observation":null,"alertness":"awake but tired; no recurrent seizure is scripted","choiceFeedback":null,"ended":null,"authoredStateTransitions":true,"doseModelAvailable":false,"durableRecoveryProven":false}', [model],
    'No learner request, new observation, mistake, or response credit is preselected. The peak starts at the already supplied 111.', 'Separates prior clinical context from decisions made in this rehearsal.'),
  authored('initial-hidden-state', 'hidden-trait', '{"aquaresis":false,"breached":false,"responded":false,"announcedAssessmentAt":null,"sodium":111,"urineOutput":75}', [model],
    'Internal authored state, not information sent to the learner. The public snapshot carries only requested findings.', 'Makes hidden-state boundaries auditable without adding a debug view.'),
  authored('authored-laboratory-contrasts', 'hidden-trait', '{"initial":{"sodiumMmolL":111,"urineOutputMlPerHour":75},"aquaresis":{"sodiumMmolL":112,"urineOutputMlPerHour":350},"uncontrolled":{"sodiumMmolL":115,"urineOutputMlPerHour":350},"untreatedStop":{"sodiumMmolL":116,"urineOutputMlPerHour":350},"laterResponse":{"sodiumMmolL":112,"urineOutputMlPerHour":100}}', [model, brief],
    'Fictional branch values, not drug kinetics or predicted water balance. The untreated-stop 116 is private and cannot be newly requested after the branch ends.', 'Requires fresh assessments; the observed peak never silently becomes the hidden peak.'),
  authored('declared-actions', 'stocked-action', '["call-support","review-risk","monitor","reassess","control-water-loss","relower","handoff","normalize-now","wait-for-symptoms"]', [model, sfe, sterns, european],
    'Nine dose-free choices include refused normalization and retained symptom waiting. Reactive control requires observed aquaresis; relowering requires an observed excessive rise.', 'Allows meaningful alternatives without falsely labeling prophylactic clamp strategies wrong.'),
  authored('response-and-handoff-prerequisites', 'tutor-threshold', 'Control and indicated relowering may be requested in either order after observed breach, without support/risk/monitor prerequisites. Early control before the 60-minute rise prevents that rise. After breach, control alone holds but does not relower sodium. Handoff additionally requires support, risk review, monitoring, and a fresh later response observation.', [model, unit, replay, sfe, sterns],
    'Selected authored care and evidence contract, not a rule delaying urgent rescue behind administrative tasks.', 'Separates clinical response eligibility, documented ownership, and observed effect.'),
  authored('ticks-per-second', 'time-scale', 10, ['src/platform/clock/simulation-clock.ts'],
    'Shared simulation resolution, not a clinical sampling interval.', 'Makes transcript times and exact boundaries reproducible.'),
  authored('aquaresis-ticks', 'scripted-delay', 18000, [model, brief],
    'Authored 30-minute observation contrast, never permission to omit earlier surveillance.', 'Creates an emerging problem that must be requested and interpreted.'),
  authored('uncontrolled-rise-ticks', 'scripted-delay', 36000, [model, brief],
    'Authored 60-minute excessive-rise contrast if control was not accepted before this tick.', 'Makes a missed early response consequential without announcing hidden results.'),
  authored('response-interval-ticks', 'scripted-delay', 36000, [model, brief],
    'Authored 60-minute interval after necessary response requests; not desmopressin or hypotonic-fluid kinetics.', 'Separates accepting a request from observing the later course.'),
  authored('missing-control-stop-ticks', 'scripted-delay', 72000, [model, brief],
    'Authored 120-minute instructor stop without water-loss control, not a treatment deadline or ODS outcome.', 'Bounds the untreated branch without leaking its last unrequested sodium.'),
  authored('unfinished-session-ticks', 'scripted-delay', 144000, [model, brief],
    'Authored 240-minute unfinished-session stop.', 'Keeps every branch finite without declaring recovery.'),
  authored('public-reassessment-checkpoint', 'tutor-threshold', 'The public 60-minute countdown uses accepted control and observed breach/accepted relowering only. It expires by elapsed time and announces a scheduled reassessment, regardless of hidden response readiness. A stale 112 with late control can therefore reach the checkpoint without relowering; only a new assessment reveals 115 and the need for combined rescue.', [model, unit, replay, demo, tray],
    'An information-boundary rule, not a promise of physiologic response or a safe waiting interval.', 'Prevents countdowns, feedback, or automatic notifications from revealing hidden correction status.'),
  authored('observed-peak-policy', 'tutor-threshold', 'Peak is the maximum of supplied 111 and explicitly requested sodium values. Hidden rise, elapsed time, later lower sodium, rescue, and handoff never silently replace or erase the observed peak; the original baseline stays 106.', [model, tray, unit, replay],
    'Auditable observation history, not a live inferred peak or a claim about neurologic injury.', 'Keeps prior exposure visible after an authored recovery.'),
  authored('continuing-surveillance-hours', 'time-scale', '[24,48]', [scenario, model, tray, brief, sfe, sterns, european],
    'Qualified continuing-care horizon in handoff, not a second simulated period or discharge timer.', 'Carries sodium, urine, potassium, neurologic, and cause surveillance beyond the rehearsal.'),
  authored('estimated-simulated-minutes', 'time-scale', 90, [scenario, brief, fixtures],
    'Approximate early-control course: 30 minutes to the emerging finding plus the 60-minute later checkpoint; decision reading takes additional wall time.', 'Keeps catalog duration distinct from the 240-minute maximum branch.'),
  authored('timeline-and-replay-ticks', 'starting-setting', '{"sodium-correction-presentation":0,"sodium-correction-boundary":0,"sodium-correction-first-review":1}', [scenario],
    'Initial narrative and boundary records plus a repeatable early decision return point.', 'Preserves context and the original correction window during replay.'),
  authored('fixture-seed', 'randomization-range', 4907, [fixtures, replay],
    'Fixed reference seed; this model has no random clinical variation.', 'Makes example courses reproducible without claiming stochastic validation.'),
  authored('shared-url-seed-default', 'randomization-range', 20260819, ['src/routes/AnesthesiaRoute.tsx'],
    'Shared route fallback when no seed is supplied; the sodium model is not seed-dependent.', 'Distinguishes a general launch default from the dedicated fixture seed.'),
  authored('expert-fixture', 'scripted-delay', '[[0,"review-risk"],[1,"call-support"],[2,"monitor"],[18000,"reassess"],[18001,"control-water-loss"],[54001,"reassess"],[54002,"handoff"]]', [fixtures, replay],
    'Seven authored choices and two observation intervals; tick spacing is not a clinical speed requirement.', 'Practices prevention without unnecessary relowering.'),
  authored('common-error-fixture', 'scripted-delay', '[[0,"normalize-now"],[1,"wait-for-symptoms"],[36000,"reassess"]]', [fixtures, replay],
    'Authored shortcut and delayed-surveillance branch with a requested excessive rise before takeover.', 'Retains mistakes without scripting a neurologic catastrophe.'),
  authored('recovery-fixture', 'scripted-delay', '[[0,"normalize-now"],[1,"wait-for-symptoms"],[36000,"reassess"],[36001,"relower"],[36002,"control-water-loss"],[36003,"review-risk"],[36004,"call-support"],[36005,"monitor"],[72002,"reassess"],[72003,"handoff"]]', [fixtures, replay],
    'Ten authored choices; urgent combined rescue precedes administrative review and later handoff.', 'Allows recovery while preserving the observed 115 and earlier choices.'),
  authored('no-action-fixture', 'scripted-delay', '[]', [fixtures, replay],
    'No requested observations or actions before instructor takeover.', 'Does not invent an observed excessive rise from private state.'),
  authored('example-playback-speed', 'time-scale', 60, ['src/routes/AnesthesiaRoute.tsx', session],
    'Optional 60x simulated observation speed with learner-paced decision pauses.', 'Preserves modeled intervals without forcing 90 minutes of wall time.'),
  authored('manual-restart-speed', 'time-scale', 1, ['src/routes/AnesthesiaRoute.tsx', reporting],
    'Manual restart returns to normal speed; no care effect is implied.', 'Avoids surprising the learner with inherited example speed.'),
  authored('initial-guidance', 'preselected-action', 'coached', ['src/platform/session/session-store.ts', tray],
    'Shared session default is Coached; the standalone tray defaults to Unassisted without a prop.', 'Makes quiet assistance a deliberate option rather than an implicit treatment.'),
  authored('example-progress-landmarks', 'tutor-threshold', '{"preparing":0,"risk":0.05,"support":0.15,"monitor":0.25,"observation":0.35,"reassessment":0.45,"control":0.55,"relower":0.6,"response-observation":0.7,"response-reassessment":0.85,"handoff":0.95,"finished":1}', [demo],
    'Display progress includes the conditional recovery step; not a competence score or elapsed-time percentage.', 'Explains example position without grading physiology.'),
  authored('guidance-policy', 'tutor-threshold', 'Exact content 0.1.0 only. Guided offers accepted-state next steps; Coached omits nonurgent waits and handoff; Unassisted is silent. Observed urgent control/relowering precedes missing administrative review. No private sodium or hidden branch flag is consulted.', [tutor, demo, unit, replay],
    'Author-selected instructional thresholds follow the public state, not a hidden diagnosis or a separate treatment model.', 'Protects mode equivalence and avoids leaking the result before reassessment.'),
  authored('objective-predicates', 'tutor-threshold', '{"sodium-correction-risk":"support and risk review","sodium-correction-surveillance":"monitoring no later than the first emerging observation and no symptom-wait choice","sodium-correction-response":"control and fresh later response, relowering if breach observed, and neither normalization attempt nor symptom-wait choice","sodium-correction-reassessment":"emerging aquaresis or excessive-rise observation and fresh later response observation","sodium-correction-handoff":"accepted continuing-care handoff"}', ['src/modules/anesthesia/ui/Debrief.tsx', model, replay],
    'Five event-bound educational predicates, not patient safety certification. Late administrative review does not invalidate urgent rescue; unobserved prevention earns no response credit.', 'Keeps successful handoff distinct from retroactively erasing missed surveillance or unsafe choices.'),
  authored('reference-objective-outcomes', 'tutor-threshold', '{"expert":["met","met","met","met","met"],"commonError":["not-met","not-met","not-met","not-met","not-met"],"recovery":["met","not-met","not-met","met","met"],"noAction":["not-met","not-met","not-met","not-met","not-met"]}', [fixtures, replay, 'src/modules/anesthesia/ui/Debrief.tsx'],
    'Expected authored learning evidence for the fixed transcripts; a later correction does not rewrite earlier decisions.', 'Makes the difference between recovery and an error-free course inspectable.'),
];

export const HYPONATREMIA_CORRECTION_QUALITY_RECORDS: readonly QualityRecordEnvelope[] = [
  { moduleId: 'endocrine-metabolic', kind: 'training-value', record: { ...identity,
    fictionalTimeEvolvingState: true, incompleteInformation: true, learnerAction: true, consequence: true,
    reassessment: true, causalDebrief: true, staticOutputSubstitute: false, evidence: [
      `${model}: water losses progress after prior rescue; early control and late combined rescue have distinct authored courses. Observation is separate from hidden evolution.`,
      `${unit}: exact boundaries, order-independent rescue, stale results, public timer noninterference, and retained peak are tested.`,
      'tests/unit/hyponatremia-correction-quality.test.ts: literal defaults are compared with actual model progression, authored scenario values, fixtures, UI text, and five debrief predicates; this is engineering evidence, not independent review.',
      `${replay}: real-engine expert, common-error, recovery, no-action, GB pathway, hostile action isolation, and event-bound debrief checks.`,
      `${tray}: source-linked interpretation and explicit observation cannot be replaced by a static sodium lookup.`,
      `${brief}: authored contrasts are not kinetics, ODS predictions, independent review, or evidence of clinical competence.`,
    ] } },
  { moduleId: 'endocrine-metabolic', kind: 'authored-defaults', record: { ...identity, defaults } },
  { moduleId: 'endocrine-metabolic', kind: 'scenario-hazard', record: { ...identity, hazards: [
    { category: 'premature-closure', disposition: 'mitigated', description: 'Stopped seizures or saline, accepted care, or a later lower sodium could be mistaken for safe correction or discharge.', evidence: [
      `${model}: handoff requires a fresh later response and retains the original window and observed peak.`, `${replay}: stale control without reassessment does not earn response credit.`, sfe, sterns] },
    { category: 'cue-leakage', disposition: 'tested', description: 'Hidden sodium, urine output, peak, or a limit crossing could leak through timers, notifications, tutor, reporting, or nonvisual output.', evidence: [
      `${unit}: equal public elapsed state has equal snapshots, feedback, live vitals and checkpoint events despite different latent sodium.`, `${reporting}: injected hidden fields and prose are excluded from opt-in context.`, `${accessibility}: requested results remain historical and unsupported equipment values remain unavailable.`] },
    { category: 'negative-transfer', disposition: 'limited', description: 'Dose-free requests or an authored hour could imply a treatment prescription, safe delay, or proficiency in desmopressin and hypotonic-fluid delivery.', evidence: [
      sfe, sterns, european, `${scenario}#hyponatremia-correction-boundary`, `${tray}: frequent reassessment and qualified care remain necessary; no dose or rate is selected.`] },
    { category: 'unsupported-precision', disposition: 'limited', description: 'Fictional sodium/urine magnitudes, fixed vital signs, or scheduled checkpoints could be read as measured kinetics or guaranteed response.', evidence: [
      `${brief}#fictional-defaults-and-branch-contract`, `${model}: public scheduled assessment is separate from private response readiness.`, `${unit}: late control does not relower sodium or refresh an old result.`] },
    { category: 'omitted-alternatives', disposition: 'limited', description: 'The selected reactive high-risk pathway could be mistaken for every hyponatremia cause or a universal rejection of prophylactic clamping.', evidence: [
      sfe, sterns, european, `${model}: unobserved reactive control is outside this lesson; prophylactic strategies are not declared wrong.`, `${brief}: unknown duration, possible thiazide/poor intake contribution, and necessary resuscitation boundaries.`] },
    { category: 'invalid-actions', disposition: 'tested', description: 'Generic drugs, malformed or extra-field payloads, invented timestamps, or stale choices could mutate care or fabricate evidence.', evidence: [
      `${unit}: repeated/refused/ended choices and observation copies.`, `${replay}: authoritative engine ticks, generic/adjacent action refusal, and no payload echo.`, `${reporting}: bounded allowlisted actions and context without private prose.`] },
    { category: 'model-boundary-crossing', disposition: 'limited', description: 'The lesson could imply a live sodium monitor, independent potassium effect, fluid-balance solver, or validated clinical prediction.', evidence: [
      `${model}: live vitals omit sodium and urine; requested observations alone reveal results.`, `${accessibility}: absent FiO2 and exhaled CO2 are not described as supplied physiology.`, `${brief}: no potassium kinetics, prescription, or ODS prediction.`] },
    { category: 'catastrophic-outcome-framing', disposition: 'mitigated', description: 'A missed observation or teaching timeout could imply immediate osmotic demyelination, recurrent seizure, or punishment.', evidence: [
      `${model}: both limits are instructor stops with unchanged authored alertness, not injury predictions.`, `${unit}: no-action takeover never exposes the private final sodium as an observed result.`, `${brief}: continuing surveillance remains necessary after the rehearsal.`] },
    { category: 'accessibility-misunderstanding', disposition: 'limited', description: 'A timer, focus change, or nonvisual announcement could obscure uncertainty or be mistaken for treatment success.', evidence: [
      `${accessibility}: local keyboard summary, Why-panel and announcement regressions.`, `${session}: real session/clock with in-process Worker transport checks learner-paced example and replay, not native browser Worker or assistive-technology certification.`,
      `${brief}: full exact-version screen-reader, keyboard, reduced-motion, color-vision, phone, zoom, offline, and performance verification remain pending. No state-space pass record is supplied.`] },
    { category: 'regional-variation', disposition: 'limited', description: 'The selected high-risk ceiling or one GB run could be mistaken for universal regional prescribing or a completed region/state-space matrix.', evidence: [
      sterns, sfe, european, `${replay}: US and GB use the same explicit selected teaching plan.`, `${brief}: general European limits differ; comprehensive region and clinical review coverage remains pending.`] },
  ] } },
];
