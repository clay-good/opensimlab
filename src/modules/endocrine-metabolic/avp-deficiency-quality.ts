import type { QualityRecordEnvelope } from '@platform/catalog/scenario-quality';

// Literal evidence for this implemented version, not clinical sign-off or a generated pass.
const identity = { schemaVersion: 1, scenarioId: 'hypernatremic-dehydration-avp-deficiency', contentVersion: '0.1.1' } as const;
const model = 'src/modules/endocrine-metabolic/avp-deficiency.ts';
const scenario = 'src/modules/endocrine-metabolic/scenarios/hypernatremic-dehydration-avp-deficiency.ts';
const fixtures = 'src/modules/endocrine-metabolic/avp-deficiency-fixtures.ts';
const tray = 'src/modules/endocrine-metabolic/AvpDeficiencyTray.tsx';
const tutor = 'src/modules/endocrine-metabolic/avp-deficiency-tutor.ts';
const demo = 'src/modules/endocrine-metabolic/demo/avp-deficiency-demonstration.ts';
const hook = 'src/modules/endocrine-metabolic/demo/useAvpDeficiencyDemonstration.ts';
const brief = 'docs/evidence-briefs/hypernatremic-dehydration-avp-deficiency.md';
const unit = 'tests/unit/endocrine-avp-deficiency.test.ts';
const replay = 'tests/integration/avp-deficiency-runs.test.ts';
const session = 'tests/integration/avp-deficiency-demonstration-session.test.tsx';
const reporting = 'tests/ui/avp-deficiency-report-surfaces.test.tsx';
const accessibility = 'tests/ui/avp-deficiency-accessibility.test.tsx';
const sfe = 'https://doi.org/10.1530/EC-18-0154';
const tomkins = 'https://doi.org/10.1210/clinem/dgac381';

type Category = 'starting-setting' | 'preselected-action' | 'stocked-action' | 'hidden-trait'
  | 'scripted-delay' | 'time-scale' | 'randomization-range' | 'tutor-threshold';
function authored(id: string, category: Category, value: string | number | boolean | null,
  sourceRefs: readonly string[], rationale: string, educationalEffect: string) {
  return { id, category, value, sourceRefs, rationale, practiceRegions: ['US', 'GB'],
    applicability: 'Authored content 0.1.1; US and GB share this known-AVP-deficiency pathway, not a universal prescription.', educationalEffect };
}

const defaults = [
  authored('patient-demographics', 'starting-setting', '{"ageYears":67,"sex":"male","heightCm":178,"weightKg":72,"asaClass":4}', [scenario, brief],
    'Fictional adult and compatibility values, not population estimates or dosing inputs.', 'Sets the encounter without teaching a replacement calculation.'),
  authored('history-and-prior-care', 'starting-setting', 'Established isolated AVP deficiency after remote pituitary surgery; two scheduled prescribed desmopressin doses omitted during restricted drinking access and intercurrent illness. Hypernatremia duration is unknown. No known drug allergies is supplied fiction; swallowing and route review remain necessary.', [scenario, brief, sfe, tomkins],
    'The diagnosis and medication omission are supplied, not hidden diagnostic answers. This is not immediate postoperative management or acute sodium loading.', 'Keeps reliable medication and water access central without generalizing to every hypernatremia cause.'),
  authored('supplied-electrolytes', 'starting-setting', '{"potassiumMmolL":3.8,"creatinineMgDl":1.6}', [scenario, tray, brief],
    'Authored initial laboratory context; neither potassium nor creatinine has a treatment-response model.', 'Prompts renal and electrolyte surveillance without implying normal follow-up results.'),
  authored('schema-baseline', 'starting-setting', '{"heartRateBpm":112,"meanArterialMmHg":66,"strokeVolumeMl":55,"hemoglobinGPerDl":13.6,"bloodVolumeMl":4200,"coreTemperatureC":37.1,"arterialStiffness":1,"baroreflexGain":1,"fixedStrokeVolume":true}', [scenario, brief],
    'Schema-compatible constants, not a validated hemodynamic or water-balance calibration.', 'Separates generic engine compatibility from authored circulation states.'),
  authored('schema-airway-respiratory', 'starting-setting', '{"difficulty":0.1,"difficultMaskVentilation":false,"respiratoryProfile":"healthy"}', [scenario],
    'Inactive compatibility settings beside a supplied awake patient with a patent airway.', 'No airway-procedure skill or validated respiratory-risk estimate is implied.'),
  authored('monitoring', 'starting-setting', '["ecg","nibp","pulse-oximetry","temperature"]', [scenario],
    'Authored monitor availability; sodium, urine output, and urine concentration still need explicit assessment.', 'Prevents monitor presence from substituting for surveillance decisions.'),
  authored('inactive-ventilator', 'preselected-action', '{"mode":"manual","fio2":0.21,"tidalVolumeMl":450,"respiratoryRateBpm":20,"freshGasFlowLPerMin":10,"delivering":false}', [scenario, 'src/modules/anesthesia/engine.ts#invalidParameters', accessibility],
    'Inactive schema defaults, not delivered oxygen or ventilation. FiO2 and exhaled CO2 are unavailable.', 'Avoids unsupported equipment claims in monitor, Why, reporting, and nonvisual output.'),
  authored('formulary', 'stocked-action', '[]', [scenario, sfe, tomkins],
    'No selectable drug dose, fluid volume, infusion rate, or formulation conversion.', 'Rehearses qualified care intent rather than prescribing competence.'),
  authored('initial-live-vitals', 'starting-setting', '{"systolicMmHg":90,"diastolicMmHg":54,"meanArterialMmHg":66,"heartRateBpm":112,"respiratoryRateBpm":20,"spo2Percent":98,"coreTemperatureC":37.1,"alertness":"awake, thirsty, and tired"}', [model, scenario, brief],
    'Authored circulatory compromise with unchanged respiratory, saturation, temperature, and alertness fields throughout the lesson.', 'Makes volume urgency visible without inventing a consciousness score.'),
  authored('restored-live-vitals', 'hidden-trait', '{"systolicMmHg":110,"diastolicMmHg":68,"meanArterialMmHg":82,"heartRateBpm":92,"respiratoryRateBpm":20,"spo2Percent":98,"coreTemperatureC":37.1,"alertness":"awake, thirsty, and tired"}', [model, brief],
    'Becomes public after the authored volume checkpoint; no laboratory or urine value is part of live vitals.', 'Better pressure permits continued qualified care but does not prove corrected sodium.'),
  authored('delayed-live-vitals', 'hidden-trait', '{"systolicMmHg":80,"diastolicMmHg":46,"meanArterialMmHg":57,"heartRateBpm":124,"respiratoryRateBpm":20,"spo2Percent":98,"coreTemperatureC":37.1,"alertness":"awake, thirsty, and tired"}', [model, brief],
    'Authored no-volume deterioration, superseded by restored circulation after treatment; not predicted shock kinetics.', 'Retains a meaningful delay contrast without scripting death or neurologic injury.'),
  authored('supplied-initial-findings', 'starting-setting', '{"sodiumMmolL":162,"urineOutputMlPerHour":60}', [scenario, model, tray],
    'Supplied historical findings, not a new requested result; initial urine osmolality remains undisclosed until assessment.', 'Low urine output cannot exclude the known diagnosis during hypovolemia.'),
  authored('initial-public-state', 'preselected-action', '{"supportActive":false,"contextReviewedAtTick":null,"monitoringAtTick":null,"volumeAtTick":null,"waterAtTick":null,"desmopressinAtTick":null,"volumeDueInSeconds":null,"responseDueInSeconds":null,"circulationRestored":false,"volumeObserved":false,"diluteLossesObserved":false,"responseObserved":false,"peakObservedSodiumMmolL":162,"volumeDelayed":false,"normalizationAttempted":false,"withholdingChosen":false,"observation":null,"alertness":"awake, thirsty, and tired","choiceFeedback":null,"ended":null,"authoredStateTransitions":true,"doseModelAvailable":false,"durableRecoveryProven":false}', [model, 'src/platform/kernel/protocol.ts'],
    'No care, response credit, new finding, or learner mistake is preselected. Observed peak begins with the supplied sodium.', 'Distinguishes established history from decisions and evidence created during practice.'),
  authored('initial-hidden-state', 'hidden-trait', '{"supportAt":null,"contextAt":null,"monitoringAt":null,"volumeAt":null,"waterAt":null,"desmopressinAt":null,"circulationRestored":false,"delayed":false,"desmopressinResponded":false,"responded":false,"responseSodium":162,"sodium":162,"urineOutput":60,"urineOsmolality":100,"volumeObserved":false,"diluteObserved":false,"responseObserved":false,"peakObserved":162,"normalizationAttempted":false,"withholdingChosen":false,"observation":null,"feedback":null,"ended":null}', [model],
    'Literal internal state for audit, not a learner-facing debug interface or extra patient information.', 'Makes private laboratory and response boundaries reviewable.'),
  authored('authored-laboratory-contrasts', 'hidden-trait', '{"initial":{"sodiumMmolL":162,"urineOutputMlPerHour":60,"urineOsmolalityMosmPerKg":100},"afterVolume":{"sodiumMmolL":163,"urineOutputMlPerHour":450,"urineOsmolalityMosmPerKg":95},"delayed":{"sodiumMmolL":164,"urineOutputMlPerHour":60,"urineOsmolalityMosmPerKg":100},"afterDesmopressin":{"sodiumMmolL":163,"urineOutputMlPerHour":80,"urineOsmolalityMosmPerKg":500},"uncontrolled":{"sodiumMmolL":165,"urineOutputMlPerHour":450,"urineOsmolalityMosmPerKg":95},"promptResponse":{"sodiumMmolL":162,"urineOutputMlPerHour":80,"urineOsmolalityMosmPerKg":500},"delayedResponse":{"sodiumMmolL":163,"urineOutputMlPerHour":80,"urineOsmolalityMosmPerKg":500},"lateResponse":{"sodiumMmolL":164,"urineOutputMlPerHour":80,"urineOsmolalityMosmPerKg":500}}', [model, brief, unit],
    'Fictional requested-result contrasts, not fluid or drug kinetics. After-volume and desmopressin-only entries show prompt care; delayed care holds its already higher sodium.', 'Requires fresh observation and distinguishes antidiuresis from water-deficit correction.'),
  authored('combined-response-policy', 'hidden-trait', 'At the second accepted water/desmopressin request, capture responseSodium = Math.max(162, current private sodium - 1). After the combined interval, prompt 163 becomes 162, delayed 164 becomes 163, and late 165 becomes 164. Volume restoration uses Math.max(current sodium, 163); either water or desmopressin alone prevents the authored further rise without lowering achieved sodium.', [model, unit, session, brief],
    'An authored partial-response rule, not a sodium-rate prescription, water-balance equation, or normalization guarantee.', 'Prevents delayed recovery from erasing earlier hypernatremia or requiring an unreachable course.'),
  authored('declared-actions', 'stocked-action', '["call-support","review-context","restore-volume","monitor","reassess","replace-water","restore-desmopressin","handoff","normalize-now","withhold-desmopressin"]', [model, tray, sfe, tomkins],
    'Ten dose-free choices include refused normalization and a retained withholding choice. Repeated accepted treatment is a no-op, not automatic redosing.', 'Makes plausible alternatives and their boundaries observable.'),
  authored('care-and-handoff-prerequisites', 'tutor-threshold', 'Volume restoration is immediately available. Water and known prescribed desmopressin become independently available when public circulationRestored is true, without new laboratory, context, support, monitoring-button, or other-treatment prerequisites. Handoff requires support, context, monitoring, both requests, and a fresh combined-care observation; an earlier teaching assessment is not a clinical handoff gate.', [model, tutor, unit, replay, sfe],
    'Selected depleted-circulation pathway, not a universal instruction to withhold maintenance desmopressin or wait 15 minutes.', 'Separates urgent care, educational observations, and continuing ownership.'),
  authored('ticks-per-second', 'time-scale', 10, ['src/platform/clock/simulation-clock.ts'],
    'Shared simulated-time resolution, not a clinical sampling interval.', 'Makes accepted action times and boundaries reproducible.'),
  authored('volume-interval-ticks', 'scripted-delay', 9000, [model, brief],
    'Authored 15-minute circulation contrast after volume acceptance, not required clinical waiting.', 'Creates a visible change before the later water-balance contrast.'),
  authored('volume-delay-ticks', 'scripted-delay', 18000, [model, brief],
    'Authored 30-minute deterioration if volume has not started; this threshold does not determine objective credit.', 'Retains the actual start time and delay narrative without a one-tick pass/fail boundary.'),
  authored('desmopressin-interval-ticks', 'scripted-delay', 18000, [model, brief],
    'Authored 30-minute urine contrast after desmopressin; no automatic event reveals its private results.', 'Less urine must be requested and interpreted, not equated with sodium correction.'),
  authored('uncontrolled-loss-interval-ticks', 'scripted-delay', 72000, [model, brief],
    'Authored 120 minutes after volume acceptance, not after its 15-minute checkpoint; sodium rises privately if neither water nor desmopressin was accepted.', 'Makes incomplete care consequential without announcing an unrequested laboratory change.'),
  authored('combined-response-interval-ticks', 'scripted-delay', 72000, [model, brief],
    'Authored 120 minutes after the later water/desmopressin request, independent of administrative steps.', 'Separates treatment requests from a fresh later partial-response assessment.'),
  authored('missing-volume-stop-ticks', 'scripted-delay', 36000, [model, brief],
    'Authored 60-minute instructor stop if volume restoration remains absent.', 'Bounds untreated practice without predicting death or supplying a new laboratory result.'),
  authored('unfinished-session-ticks', 'scripted-delay', 180000, [model, brief, unit],
    'Authored 300-minute unfinished stop; late 165-to-164 recovery can finish before it.', 'Keeps the promised recovery path reachable while bounding unfinished practice.'),
  authored('public-checkpoint-policy', 'tutor-threshold', 'Volume countdown follows accepted volume and public circulation response. Combined countdown follows max(waterAtTick, desmopressinAtTick), never private sodium or response magnitude. Both return zero at a due boundary until advance, then null; reading a future snapshot never advances state. Checkpoint messages request reassessment without revealing sodium, urine output, osmolality, or unobserved peak.', [model, unit, demo, hook, session],
    'Information-boundary convention, not a guarantee of physiologic response or a safe interval without checks.', 'Equal public histories retain equal timers, messages, and feedback across different latent sodium values.'),
  authored('observed-peak-policy', 'tutor-threshold', 'Peak is max(supplied 162, explicitly requested sodium values). Private rises, later lower sodium, elapsed clocks, accepted treatment, and handoff never backfill or erase the observed peak. Only reassessment updates historical sodium and urine findings.', [model, tray, unit, reporting],
    'A record of supplied or observed findings, not an inferred live laboratory maximum.', 'Preserves earlier exposure without disclosing unrequested state.'),
  authored('estimated-simulated-minutes', 'time-scale', 135, [scenario, fixtures, brief],
    'Approximate expert course: 15-minute circulation plus 120-minute combined-care contrast, with decision reading additional in wall time.', 'Distinguishes catalog duration from the 300-minute maximum branch.'),
  authored('timeline-and-replay-ticks', 'starting-setting', '{"avp-deficiency-presentation":0,"avp-deficiency-boundary":0,"avp-deficiency-first-response":1}', [scenario],
    'Initial narrative and limitations plus a repeatable early decision point.', 'Keeps supplied context visible during rehearsal and replay.'),
  authored('fixture-seed', 'randomization-range', 4919, [fixtures, replay],
    'Fixed reference seed; the AVP model has no stochastic clinical variation.', 'Supports reproducibility without implying validation across a randomized patient population.'),
  authored('shared-url-seed-default', 'randomization-range', 20260819, ['src/routes/AnesthesiaRoute.tsx'],
    'Shared route fallback when no seed is supplied, distinct from the dedicated fixture seed.', 'Documents launch behavior without adding seed-dependent AVP physiology.'),
  authored('expert-fixture', 'scripted-delay', '[[0,"restore-volume"],[1,"review-context"],[2,"call-support"],[3,"monitor"],[9000,"reassess"],[9001,"replace-water"],[9002,"restore-desmopressin"],[81002,"reassess"],[81003,"handoff"]]', [fixtures, replay, session],
    'Nine reference choices and two observation periods; one-tick spacing is not a clinical speed target.', 'Shows circulation-first care with separate observation and continuing ownership.'),
  authored('common-error-fixture', 'scripted-delay', '[[0,"normalize-now"],[1,"withhold-desmopressin"],[18000,"reassess"]]', [fixtures, replay],
    'Authored normalization attempt, withholding, and delayed assessment before instructor takeover.', 'Makes mistaken choices inspectable without manufacturing treatment effects.'),
  authored('recovery-fixture', 'scripted-delay', '[[0,"normalize-now"],[1,"withhold-desmopressin"],[18000,"reassess"],[18001,"restore-volume"],[18002,"review-context"],[18003,"call-support"],[18004,"monitor"],[27001,"reassess"],[27002,"restore-desmopressin"],[27003,"replace-water"],[99003,"reassess"],[99004,"handoff"]]', [fixtures, replay],
    'Twelve choices include medication before water and retain the observed 164 despite later 163.', 'Allows recovery without rewriting delayed care or earlier mistakes.'),
  authored('no-action-fixture', 'scripted-delay', '[]', [fixtures, replay],
    'No learner action or requested finding before the no-volume instructor stop.', 'Leaves the supplied peak at 162 rather than importing a private rise.'),
  authored('example-playback-speed', 'time-scale', 60, ['src/routes/AnesthesiaRoute.tsx', hook, session],
    'Optional 60x observation speed with learner-paced, paused decisions.', 'Preserves simulated intervals without requiring 135 minutes of wall time.'),
  authored('manual-restart-speed', 'time-scale', 1, ['src/routes/AnesthesiaRoute.tsx', reporting],
    'Leaving or restarting an example returns ordinary practice to 1x; ordinary practice otherwise retains a selected speed.', 'Avoids surprising the learner with inherited demonstration acceleration.'),
  authored('initial-guidance', 'preselected-action', 'coached', ['src/platform/session/session-store.ts', tutor],
    'Shared session assistance default; no treatment or observation is selected.', 'Provides quiet help without controlling the learner’s decisions.'),
  authored('standalone-guidance', 'preselected-action', 'unassisted', [tray],
    'The standalone tray is silent if its caller supplies no guidance prop.', 'Makes assistance depend on explicit session wiring rather than implicit clinical behavior.'),
  authored('demonstration-eligibility', 'tutor-threshold', '{"contentVersion":"0.1.1","demonstrationVersion":"0.1.1"}', [demo, hook, 'src/modules/anesthesia/demo/useObservedDemonstration.ts', 'src/modules/anesthesia/demo/useDemonstration.ts'],
    'Exact content and authored demonstration algorithm; the generic controller dispatches one ordinary action per confirmation.', 'Prevents stale callbacks after takeover, reset, or disposal from creating extra care.'),
  authored('example-progress-landmarks', 'tutor-threshold', '{"preparing":0,"volume":0.05,"context":0.15,"support":0.25,"monitor":0.35,"volume-observation":0.4,"volume-reassessment":0.5,"water":0.6,"desmopressin":0.65,"response-observation":0.75,"response-reassessment":0.85,"handoff":0.95,"finished":1}', [demo, 'src/modules/anesthesia/ui/DemonstrationBar.tsx'],
    'Display positions, not elapsed-time percentages or competence scores.', 'Keeps the current example step understandable without grading clinical performance.'),
  authored('guidance-policy', 'tutor-threshold', 'Exact content 0.1.1 only. Guided follows accepted public state; Coached omits nonurgent observation waits and handoff; Unassisted is silent. Once circulation is restored, missing water/desmopressin prompts precede administrative review. The example observes first for teaching, not because a new laboratory click is a care gate.', [tutor, demo, tray, 'tests/ui/endocrine-avp-deficiency.test.tsx', replay],
    'Authored instructional priorities, not a second treatment model or a hidden diagnosis.', 'Preserves clinical alternatives and identical engine behavior across assistance levels.'),
  authored('objective-predicates', 'tutor-threshold', '{"avp-context":"support and context review","avp-circulation":"volume restoration and either circulation or later response assessment; delay is retained, not a credit cutoff","avp-water-control":"water and desmopressin and fresh later response, without normalization attempt or withholding choice","avp-reassessment":"separate circulation-phase and later response assessments","avp-handoff":"accepted continuing-care handoff"}', ['src/modules/anesthesia/ui/Debrief.tsx', model, replay],
    'Five event-bound educational predicates, not safety certification. Circulation reports actual start seconds and retained deterioration without making its authored clock a grading threshold. Final-only assessment can support handoff but not earlier observation credit.', 'Keeps recovery and an error-free course distinct without arbitrary timing penalties.'),
  authored('reference-objective-outcomes', 'tutor-threshold', '{"expert":["met","met","met","met","met"],"commonError":["not-met","not-met","not-met","not-met","not-met"],"recovery":["met","met","not-met","met","met"],"noAction":["not-met","not-met","not-met","not-met","not-met"]}', [fixtures, replay, 'src/modules/anesthesia/ui/Debrief.tsx'],
    'Expected findings for the fixed reference transcripts; later partial correction does not erase prior behavior.', 'Makes the declared learning outcomes auditable.'),
  authored('shared-transport-defaults', 'time-scale', '{"phase":"idle","transport":"idle","speed":1,"tick":0,"elapsed":"00:00:00","ready":false,"tickMs":100,"singleStepTicks":10,"maxCatchupTicks":50,"speedMultipliers":[1,2,5,60]}', ['src/platform/session/session-store.ts', 'src/platform/clock/simulation-clock.ts', 'src/platform/kernel/protocol.ts', session],
    'Initial shared transport and clock constants. Beginning a session enters briefing; controls govern time, not the AVP care state.', 'Keeps reading pauses, single steps, capped catch-up, and recorded replay timing explicit.'),
  authored('report-defaults', 'preselected-action', '{"open":false,"category":"","note":"","recentContext":null,"noteLimit":160,"actionLimit":20,"snapshotScalarLimit":32,"jsonCharacterLimit":16384}', ['src/platform/reporting/ScenarioProblemReport.tsx', 'src/platform/reporting/contracts.ts', 'src/modules/endocrine-metabolic/avp-deficiency-reporting.ts', 'src/routes/AnesthesiaRoute.tsx', reporting],
    'Report starts closed with no note, category, or optional context selected. Character and context bounds are software limits, not clinical information defaults.', 'Avoids implicit transmission of session details or fabricated action outcomes.'),
];

export const AVP_DEFICIENCY_QUALITY_RECORDS: readonly QualityRecordEnvelope[] = [
  { moduleId: 'endocrine-metabolic', kind: 'training-value', record: { ...identity,
    fictionalTimeEvolvingState: true, incompleteInformation: true, learnerAction: true, consequence: true,
    reassessment: true, causalDebrief: true, staticOutputSubstitute: false, evidence: [
      `${model}: circulation, masked urine loss, single-component care, and combined partial response evolve separately; findings require requests.`,
      `${unit}: exact boundaries, independent care without administrative or laboratory gates, hidden-result noninterference, and retained history.`,
      `${replay}: four real-engine courses across all guidance levels, GB pathway, hostile actions, and event-bound debrief.`,
      `${session}: nine learner confirmations, real store/clock/recorder, both observation waits, stale-callback rejection, and every-frame replay for prompt and late recovery through in-process transport.`,
      `${tray}: learner interpretation, meaningful alternatives, and repeated observation cannot be replaced by a static sodium lookup.`,
      'src/modules/endocrine-metabolic/avp-deficiency-quality.ts: these three literal records are engineering evidence, not a state-space pass or clinical sign-off.',
      'tests/unit/avp-deficiency-quality.test.ts: checks literal records against actual model progression, scenario, fixtures, guidance, shared defaults, and debrief predicates.',
      `${brief}: fictional values and clocks do not establish clinical kinetics, prescription competence, independent review, or production reporting verification.`,
    ] } },
  { moduleId: 'endocrine-metabolic', kind: 'authored-defaults', record: { ...identity, defaults } },
  { moduleId: 'endocrine-metabolic', kind: 'scenario-hazard', record: { ...identity, hazards: [
    { category: 'premature-closure', disposition: 'mitigated', description: 'Improved pressure, less urine, accepted care, or a lower sodium could be mistaken for replaced water deficit, normalization, or discharge.', evidence: [
      `${model}: handoff requires fresh combined-care evidence and preserves hypernatremia and observed peak.`, `${replay}: desmopressin-only care does not earn confirmed combined-response credit.`, sfe, tomkins] },
    { category: 'cue-leakage', disposition: 'tested', description: 'Latent sodium, urine output, osmolality, or peak could escape through timers, feedback, reporting, or accessibility.', evidence: [
      `${unit}: equivalent public histories have equal full snapshots and checkpoint events across an unrequested sodium rise.`, `${reporting}: historical findings, absent initial osmolality, ambiguous outcomes, and private scalar injection are tested.`, `${accessibility}: historical findings and unsupported equipment remain distinct.`] },
    { category: 'negative-transfer', disposition: 'limited', description: 'An authored clock or circulation gate could teach delaying prescribed medication universally, fixed fluid rates, or automatic repeat doses.', evidence: [
      sfe, tomkins, `${scenario}#avp-deficiency-boundary`, `${tray}: known diagnosis and selected hypovolemia only; qualified care and earlier reassessment remain necessary.`, `${model}: water and desmopressin are independent after circulation, without new laboratory or administrative prerequisites.`] },
    { category: 'unsupported-precision', disposition: 'limited', description: 'Exact blood pressures, urine concentration, sodium steps, or clocks could be mistaken for measured physiology, a correction prescription, or an arbitrary pass/fail deadline.', evidence: [
      `${brief}#authored-contract`, `${model}: fixed branch contrasts and one-unit partial response have no dosing or water-balance solver.`, 'src/modules/anesthesia/ui/Debrief.tsx: actual volume-start seconds and retained deterioration are reported without making the authored 30-minute clock a credit cutoff.', `${replay}: volume at tick 17999 versus 18000 earns equal circulation credit with fresh assessment while the different delay evidence remains.`, `${session}: reproducible replay establishes software determinism, not treatment efficacy.`] },
    { category: 'omitted-alternatives', disposition: 'limited', description: 'The selected known-AVP-D pathway could be generalized to renal AVP resistance, new diagnosis, acute sodium loading, pregnancy, or every postoperative course.', evidence: [
      sfe, tomkins, `${scenario}: established isolated AVP deficiency after remote surgery and unknown hypernatremia duration.`, `${brief}: no dose, route conversion, fluid-deficit calculation, acute correction exception, or diagnostic challenge is taught.`] },
    { category: 'invalid-actions', disposition: 'tested', description: 'Generic interventions, malformed payloads, forged ticks, duplicate evidence, or stale callbacks could create unintended care or report outcomes.', evidence: [
      `${replay}: authoritative ticks and generic/extra-field action refusals.`, `${session}: duplicate, takeover, reset, and disposed callbacks do not dispatch additional actions.`, 'src/modules/endocrine-metabolic/avp-deficiency-reporting.ts: exact action/event matching omits ambiguous or missing outcomes.', 'tests/unit/avp-deficiency-reporting.test.ts: hostile, duplicate, and incomplete action evidence is bounded and excluded.'] },
    { category: 'model-boundary-crossing', disposition: 'limited', description: 'A sodium monitor, inactive ventilator, narrative display, or optional report could imply unsupported real-time physiology or prescribing capability.', evidence: [
      `${model}: new laboratory and urine findings are disclosed only through requested observations; supplied initial context stays historical.`, 'src/modules/anesthesia/ui/Cockpit.tsx: unavailable equipment and authored Why context stay separate.', 'src/modules/anesthesia/ui/ActionCockpit.tsx: the dedicated AVP tray replaces generic interventions.', 'src/modules/anesthesia/ui/Prebrief.tsx: dose-free scope and worked-example context precede practice.', `${brief}: no real-patient inputs, renal solver, or validated clinical predictions.`] },
    { category: 'catastrophic-outcome-framing', disposition: 'mitigated', description: 'Delay or instructor takeover could be mistaken for predicted death, neurologic injury, or punishment for exploration.', evidence: [
      `${model}: teaching stops do not change the supplied alertness into a catastrophe or expose an unrequested laboratory result.`, `${replay}: no-action and recovery transcripts retain uncertainty and earlier choices.`, `${brief}: unfinished practice is bounded without a clinical outcome claim.`] },
    { category: 'accessibility-misunderstanding', disposition: 'limited', description: 'Changing focus, clock, nonvisual values, or overlays could imply a stronger diagnosis or completed response than the visual lesson.', evidence: [
      'src/modules/anesthesia/ui/accessibility.ts: authored circulation and historical laboratory summaries omit inactive equipment.', `${accessibility}: keyboard summary, unavailable Why values, and filtered announcements are locally tested.`, `${reporting}: modal interaction keeps an example paused and context opt-in.`, `${session}: actual session components use in-process transport, not native browser Worker or assistive-technology certification.`, `${brief}: full exact-version inclusive-runtime verification remains pending; no state-space pass is supplied.`] },
    { category: 'regional-variation', disposition: 'limited', description: 'One shared US/GB pathway or a verified reference course could be mistaken for universal regional prescribing or a complete state-space matrix.', evidence: [
      sfe, tomkins, `${replay}: a GB expert course and US guidance comparisons use the same explicit selected pathway.`, `${brief}: dose, route, correction-rate selection, clinical review, comprehensive inclusive coverage, and production Turnstile/D1 evidence remain outside these three records.`] },
  ] } },
];
