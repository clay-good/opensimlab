import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalProteinuriaRatioSnapshot } from '@platform/kernel/protocol';
import type { RenalProteinuriaAction } from './proteinuria-ratio';
import { renalProteinuriaRatioInlinePrompt, RENAL_PROTEINURIA_SOURCE_HREF } from './renal-proteinuria-ratio-tutor';

export function RenalProteinuriaRatioTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalProteinuriaRatioSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalProteinuriaAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalProteinuriaRatioInlinePrompt(guidance, { scenarioVersion, renalProteinuriaRatio: assessment });
  const observation = assessment.observation; const ratio = assessment.ratioObservation;
  const clinical = assessment.clinicalObservation;
  const decision = (action: RenalProteinuriaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected source: <a href={RENAL_PROTEINURIA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>2018 study of biological variability in CKD</a> (opens in a new tab). Fifty clinically stable outpatients, cross-sectional, and its reference change values describe variation in a stable population rather than ruling out change in an unstable one. The patient here is fictional.</p>
    <section className="syringe renal-proteinuria__section" aria-labelledby="renal-proteinuria-variation-title">
      <div id="renal-proteinuria-variation-title" className="syringe__name">168 to 312 is +86%. The band is ±124%.</div>
      <p className="syringe__remaining">Supplied: albumin-creatinine ratio 168 mg/g last clinic and 312 mg/g today, both random afternoon spot samples. Estimated GFR 58 mL/min/1.73 m², unchanged. The team has read the change as progression and is preparing to change treatment today.</p>
      <p className="syringe__remaining">{assessment.variationComparedAtTick === null
        ? 'Compare the change against the variation the measurement carries before acting on it.'
        : 'Recorded: the within-person coefficient of variation for a random spot ratio was 29.7%, with reference change values of +124% and −55%. This +86% rise sits inside that band — which does not establish it is noise, and does not establish it is real. It establishes that this pair cannot tell them apart.'}</p>
      <p className="syringe__remaining">{assessment.samplingReviewedAtTick === null
        ? 'Then look at how each sample was taken.'
        : 'Recorded: both values are random afternoon spot samples. Protein excretion varies through the day, peaking at 6 to 12 hours and lowest at 18 to 24 in the series behind this lesson, and the first morning void reads lower than the 24-hour ratio. A dipstick reports a concentration, so a dilute sample reads lower. None of this makes either supplied value wrong.'}</p>
      <p className="syringe__remaining">Comparison: {assessment.variationComparedAtTick === null ? 'not made' : 'made'}. Sampling: {assessment.samplingReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Matched repeat: {assessment.repeatRequestedAtTick === null ? 'not requested' : assessment.repeatReturned ? 'returned' : 'pending'}.</p>
      <div className="crisis-drug__actions">
        {decision('compare-variation', 'Compare the rise against the reference change', assessment.variationComparedAtTick !== null)}
        {decision('review-sampling', 'Review how each sample was taken', assessment.samplingReviewedAtTick !== null)}
        {decision('request-repeat', 'Request a matched first morning sample', assessment.repeatRequestedAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-proteinuria__section" aria-labelledby="renal-proteinuria-patient-title">
      <div id="renal-proteinuria-patient-title" className="syringe__name">Everything else about her is the same.</div>
      <p className="syringe__remaining">{assessment.patientReviewedAtTick === null
        ? 'Check her against the number before the number changes her treatment.'
        : 'Reviewed: blood pressure 128/78 against 126/76, weight 71 kg at both visits, creatinine unchanged, sediment bland, no oedema, no new medicines, and she reports feeling exactly as she did last time. That is agreement between an unchanged patient and an uncertain measurement — not proof that nothing is happening.'}</p>
      <p className="syringe__remaining">This lesson selects no drug, no dose, and no treatment change, and it does not decide whether her treatment should change.</p>
      <p className="syringe__remaining">Clinical review: {assessment.patientReviewedAtTick === null ? 'not done' : 'done'}. Decision: {assessment.decisionOwnedAtTick === null ? 'not yet owned' : 'owned by the qualified team'}. Support: {assessment.supportActive ? 'active' : 'not yet called'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged with sampling conditions recorded'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('review-patient', 'Check the patient against the number', assessment.patientReviewedAtTick !== null)}
        {decision('own-decision', 'Place the treatment decision with the team', assessment.decisionOwnedAtTick !== null)}
        {decision('call-support', 'Call qualified renal support', assessment.supportActive)}
        {decision('monitor', 'Arrange review with sampling conditions recorded', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-proteinuria__section" aria-labelledby="renal-proteinuria-observation-title">
      <div id="renal-proteinuria-observation-title" className="syringe__name">One request would have settled most of this.</div>
      <p className="syringe__remaining">{ratio
        ? `Last requested ratio at simulated ${formatElapsed(ratio.atTick)}: ${ratio.ratioMgPerG} mg/g${ratio.firstMorning ? ', first morning under matched conditions' : ', random afternoon spot'}. This partial result supplies no clinical findings and settles no cause.`
        : 'No new ratio has been requested.'}</p>
      <p className="syringe__remaining">{clinical
        ? `Last requested clinical findings at simulated ${formatElapsed(clinical.atTick)}: blood pressure ${clinical.systolicMmHg}/78 mmHg, weight ${clinical.weightKg} kg, both unchanged. This partial result supplies no ratio.`
        : 'No new clinical findings have been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: ratio ${observation.ratioMgPerG} mg/g${observation.firstMorning ? ' from the matched first morning sample' : ' from a random afternoon spot sample'}; the supplied pair rose ${observation.risePercent}% against a reference change of +124%; blood pressure ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg and weight ${observation.weightKg} kg, both unchanged. These are historical observations, not live measurements.`
        : 'No new full ratio and clinical assessment has been requested.'}</p>
      {assessment.repeatDueInSeconds !== null && <p className="syringe__remaining">Authored matched-sample checkpoint in {Math.ceil(assessment.repeatDueInSeconds / 60)} simulated min.</p>}
      {assessment.repeatReturned && <p className="syringe__remaining">The matched first morning sample has returned. It narrows the question considerably. It is still one value: not a timed collection, not a cause, and not proof that nothing changed.</p>}
      <p className="syringe__remaining">No timed collection, biopsy, imaging, cause, progression, or stability is established at any point in this rehearsal.</p>
      {assessment.uncomparedContrastObserved && <p className="syringe__remaining">A full assessment recorded the authored contrast in which the change stood uncompared. It is a teaching comparison, not a prediction.</p>}
      {(assessment.changeTreatmentAttempted || assessment.callItProgressionAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the question is narrower and still open, and what it rests on is stated. No cause, progression, stability, or discharge readiness is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-ratio', 'Check the ratio only')}{decision('check-clinical', 'Check the clinical findings only')}
        {decision('reassess', 'Reassess the ratio and the clinical picture')}
        {decision('handoff', 'Hand off the narrowed question and its basis')}
        {decision('change-treatment', 'Change treatment on this pair of values')}
        {decision('call-it-progression', 'Record the change as progression')}
      </div>
    </section>
  </>;
}
