import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHyponatremiaSnapshot } from '@platform/kernel/protocol';
import type { RenalHyponatremiaAction } from './hyponatremia';
import { renalHyponatremiaInlinePrompt, RENAL_HYPONATREMIA_SOURCE_HREF } from './renal-hyponatremia-tutor';

export function RenalHyponatremiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalHyponatremiaSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalHyponatremiaAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalHyponatremiaInlinePrompt(guidance, { scenarioVersion, renalHyponatremia: assessment });
  const observation = assessment.observation; const sodium = assessment.sodiumObservation; const neurologic = assessment.neurologicObservation;
  const symptoms = (value: { alertness: string; headache: boolean; nausea: boolean }) =>
    `${value.alertness}; headache ${value.headache ? 'present' : 'absent'}; nausea ${value.nausea ? 'present' : 'absent'}`;
  const decision = (action: RenalHyponatremiaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected source: <a href={RENAL_HYPONATREMIA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Society for Endocrinology 2022 guidance</a> (opens in a new tab). This lesson follows its persistent-symptom pathway, not a universal regional rule.</p>
    <section className="syringe renal-hyponatremia__section" aria-labelledby="renal-hyponatremia-rescue-title">
      <div id="renal-hyponatremia-rescue-title" className="syringe__name">Treat the presentation. Reassess the person.</div>
      <p className="syringe__remaining">Supplied sodium: 118 mmol/L. The patient is awake but confused, with headache and nausea without vomiting or seizure. This is the historical starting assessment; the sodium of 118 remains the original correction baseline.</p>
      <p className="syringe__remaining">Qualified symptom-led rescue is available now. It does not wait for support acknowledgment, cause classification, or another laboratory click. No dose, formulation, or delivery schedule is prescribed.</p>
      <p className="syringe__remaining">Initial rescue: {assessment.rescueAtTick === null ? 'not yet requested' : 'requested'}.</p>
      <div className="crisis-drug__actions">{decision('rescue', 'Request qualified symptom-led rescue', assessment.rescueAtTick !== null)}</div>
    </section>
    <section className="syringe renal-hyponatremia__section" aria-labelledby="renal-hyponatremia-context-title">
      <div id="renal-hyponatremia-context-title" className="syringe__name">Keep cause and neurologic review open.</div>
      <p className="syringe__remaining">{assessment.contextReviewedAtTick === null
        ? 'Review the pretreatment specimens, thiazide exposure, and diagnostic uncertainty while rescue proceeds.'
        : 'Supplied pretreatment results: measured serum osmolality 250 mOsm/kg, glucose 99 mg/dL, potassium 3.6 mmol/L; urine osmolality 460 mOsm/kg and urine sodium 52 mmol/L. These specimens precede treatment. Thiazide exposure confounds interpretation; the urine results do not establish SIAD.'}</p>
      <p className="syringe__remaining">Neurologic and alternate-cause evaluation is available at any time. It does not gate rescue, confirm a diagnosis, or itself resolve symptoms.</p>
      <p className="syringe__remaining">Support: {assessment.supportActive ? 'active' : 'not yet called'}. Context review: {assessment.contextReviewedAtTick === null ? 'not recorded' : 'recorded'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}. Neurologic review: {assessment.neurologicReviewAtTick === null ? 'not requested' : 'requested'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('call-support', 'Call qualified acute-care and specialist support', assessment.supportActive)}
        {decision('review-context', 'Review pretreatment specimens and medication context', assessment.contextReviewedAtTick !== null)}
        {decision('monitor', 'Arrange sodium and neurologic surveillance', assessment.monitoringAtTick !== null)}
        {decision('evaluate-neurology', 'Arrange neurologic and alternate-cause evaluation', assessment.neurologicReviewAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-hyponatremia__section" aria-labelledby="renal-hyponatremia-observation-title">
      <div id="renal-hyponatremia-observation-title" className="syringe__name">Keep sodium and symptoms together.</div>
      <p className="syringe__remaining">{sodium
        ? `Last requested sodium at simulated ${formatElapsed(sodium.atTick)}: ${sodium.sodiumMmolL} mmol/L (${sodium.changeFromBaselineMmolL >= 0 ? '+' : ''}${sodium.changeFromBaselineMmolL} from the original 118). A sodium-only check does not refresh symptoms or the full assessment.`
        : 'No new sodium-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{neurologic
        ? `Last requested neurologic assessment at simulated ${formatElapsed(neurologic.atTick)}: ${symptoms(neurologic)}. A neurologic-only check does not refresh sodium.`
        : 'No new neurologic-only assessment has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: sodium ${observation.sodiumMmolL} mmol/L (${observation.changeFromBaselineMmolL >= 0 ? '+' : ''}${observation.changeFromBaselineMmolL} from the original 118); ${symptoms(observation)}; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg. These are historical observations, not live measurements.`
        : 'No new full sodium, symptom, and bedside assessment has been requested.'}</p>
      {assessment.rescueDueInSeconds !== null && <p className="syringe__remaining">Authored initial-response checkpoint in {Math.ceil(assessment.rescueDueInSeconds / 60)} simulated min.</p>}
      {assessment.additionalRescueDueInSeconds !== null && <p className="syringe__remaining">Authored additional-response checkpoint in {Math.ceil(assessment.additionalRescueDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">The 60- and 30-minute response contrasts are authored, not predicted kinetics or required clinical waits. Reassess earlier whenever needed. A current full first-response assessment is needed for this lesson’s selected limited additional rescue. It remains distinct from unrestricted normalization.</p>
      {assessment.persistentSymptomsObserved && <p className="syringe__remaining">A full assessment recorded continuing confusion, headache, and nausea despite a sodium rise. The number does not establish recovery.</p>}
      {assessment.additionalResponseObserved && <p className="syringe__remaining">The observed +6 mmol/L rise is not a clinical stopping rule. Expert treatment review, monitoring, and cause evaluation continue; no treatment is automatically stopped.</p>}
      {(assessment.sodiumNormalizationAttempted || assessment.numberOnlyRecoveryAttempted || assessment.siadhLabelAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: persistent symptoms and continuing expert care are handed off. This is not symptom resolution or discharge readiness.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-sodium', 'Check sodium only')}{decision('check-neurology', 'Check neurologic symptoms only')}
        {decision('reassess', 'Reassess sodium, symptoms, and bedside response')}
        {decision('additional-rescue', 'Request qualified limited additional rescue', assessment.additionalRescueAtTick !== null)}
        {decision('handoff', 'Hand off persistent symptoms and continuing care')}
        {decision('normalize-now', 'Normalize sodium now')}
        {decision('sodium-means-recovered', 'Declare recovery from sodium alone')}
        {decision('siadh-now', 'Label the cause SIAD now')}
      </div>
    </section>
  </>;
}
