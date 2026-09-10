import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalEstimatedFiltrationSnapshot } from '@platform/kernel/protocol';
import type { RenalEstimateAction } from './estimated-filtration';
import { renalEstimatedFiltrationInlinePrompt, RENAL_ESTIMATE_SOURCE_HREF } from './renal-estimated-filtration-tutor';

export function RenalEstimatedFiltrationTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalEstimatedFiltrationSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalEstimateAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalEstimatedFiltrationInlinePrompt(guidance, { scenarioVersion, renalEstimatedFiltration: assessment });
  const observation = assessment.observation; const creatinine = assessment.creatinineObservation;
  const marker = assessment.markerObservation;
  const decision = (action: RenalEstimateAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected source: <a href={RENAL_ESTIMATE_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>2021 equations validated against measured filtration</a> (opens in a new tab). Its accuracy figures are population statistics from development and validation cohorts, not a guarantee for an individual, and the patient here is fictional.</p>
    <section className="syringe renal-estimate__section" aria-labelledby="renal-estimate-precision-title">
      <div id="renal-estimate-precision-title" className="syringe__name">68 is an estimate. Ask how wide.</div>
      <p className="syringe__remaining">Supplied: creatinine 71 µmol/L, reported estimated filtration 68 mL/min/1.73 m². She is 81, 44 kg, frail, housebound, and fourteen months past a below-knee amputation. A renally eliminated medicine is due today at the dose that estimate supports.</p>
      <p className="syringe__remaining">{assessment.precisionReviewedAtTick === null
        ? 'Read what the reported number claims before anyone acts on it.'
        : 'Recorded: in the validation work behind these equations, 85% or more of estimates fell within 30% of measured filtration — which is also up to one value in seven outside even that band. A reported 68 is compatible with a wide span of true values. That is a property of the estimate, not a claim about her.'}</p>
      <p className="syringe__remaining">{assessment.generationReviewedAtTick === null
        ? 'Then ask what the estimate was generated from.'
        : 'Recorded: this estimate infers filtration from creatinine, which comes from muscle. Frailty, 44 kg, low muscle mass, and an amputation all lower production without touching the kidney, and push a creatinine-based estimate up. The figure is indexed to 1.73 m², a population convention rather than her body. None of this establishes that her filtration is low.'}</p>
      <p className="syringe__remaining">Width: {assessment.precisionReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Generation: {assessment.generationReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Second marker: {assessment.secondMarkerRequestedAtTick === null ? 'not requested' : assessment.secondMarkerReturned ? 'returned' : 'pending'}.</p>
      <div className="crisis-drug__actions">
        {decision('review-precision', 'Review what the reported estimate claims', assessment.precisionReviewedAtTick !== null)}
        {decision('review-generation', 'Review what the estimate was generated from', assessment.generationReviewedAtTick !== null)}
        {decision('request-second-marker', 'Request a differently generated marker', assessment.secondMarkerRequestedAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-estimate__section" aria-labelledby="renal-estimate-discordance-title">
      <div id="renal-estimate-discordance-title" className="syringe__name">When two estimates disagree, that is the result.</div>
      <p className="syringe__remaining">{!assessment.secondMarkerReturned
        ? 'The second marker has not returned. There is nothing to compare yet, and the first estimate has not changed in the meantime.'
        : assessment.discordanceReviewedAtTick === null
          ? 'The second estimate is 38 against the first 68 — a disagreement of more than 30%. Record the disagreement rather than choosing between them.'
          : 'Recorded: the two estimates disagree by more than 30%, neither is a measurement, and this rehearsal supplies no measured filtration rate to settle it. In one retrospective cohort of one drug, a discordance of this size was associated with drug exposure higher than predicted — an association in older, longer-stay patients, not a rule and not a correction factor.'}</p>
      <p className="syringe__remaining">This lesson selects no drug, no dose, no adjustment, no equation, and no marker, and it does not decide whether the medicine should be started.</p>
      <p className="syringe__remaining">Disagreement: {assessment.discordanceReviewedAtTick === null ? 'not recorded' : 'recorded'}. Medicine decision: {assessment.medicineOwnedAtTick === null ? 'not yet owned' : 'owned by the qualified team'}. Support: {assessment.supportActive ? 'active' : 'not yet called'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged with the confusion open'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('review-discordance', 'Record the disagreement between the estimates', assessment.discordanceReviewedAtTick !== null)}
        {decision('own-medicine-decision', 'Place the medicine decision with the team', assessment.medicineOwnedAtTick !== null)}
        {decision('call-support', 'Call qualified renal and pharmacy support', assessment.supportActive)}
        {decision('monitor', 'Arrange continuing review', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-estimate__section" aria-labelledby="renal-estimate-observation-title">
      <div id="renal-estimate-observation-title" className="syringe__name">The measured line stays empty.</div>
      <p className="syringe__remaining">{creatinine
        ? `Last requested creatinine at simulated ${formatElapsed(creatinine.atTick)}: ${creatinine.creatinineUmolL} µmol/L, reported estimate ${creatinine.creatinineEstimate} mL/min/1.73 m². Repeating this marker repeats the same inference from the same input.`
        : 'No new creatinine-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{marker
        ? (marker.cystatinEstimate === null
          ? 'The second marker was requested and has not returned. Nothing is available to compare.'
          : `Last requested second-marker estimate at simulated ${formatElapsed(marker.atTick)}: ${marker.cystatinEstimate} mL/min/1.73 m². This is an estimate rather than a measurement.`)
        : 'No new second-marker result has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: creatinine ${observation.creatinineUmolL} µmol/L with a reported estimate of ${observation.creatinineEstimate} mL/min/1.73 m²; second-marker estimate ${observation.cystatinEstimate === null ? 'not returned' : `${observation.cystatinEstimate} mL/min/1.73 m²`}; measured filtration not available. She remains slower than her baseline and mildly confused, with no cause established.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.secondMarkerDueInSeconds !== null && <p className="syringe__remaining">Authored second-marker checkpoint in {Math.ceil(assessment.secondMarkerDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">No measured filtration rate is supplied at any point in this rehearsal, and the disagreement is not resolved. Her confusion is a supplied finding with no cause established and is not attributed to any medicine here.</p>
      {assessment.unreviewedContrastObserved && <p className="syringe__remaining">A full assessment recorded the authored contrast in which the reported estimate stood unexamined. It is a teaching comparison, not a prediction.</p>}
      {(assessment.doseOnEstimateAttempted || assessment.convenientNumberAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: what is handed on is the uncertainty, stated as uncertainty. No filtration rate, cause, dose, or discharge readiness is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-creatinine', 'Check creatinine only')}{decision('check-second-marker', 'Check the second marker only')}
        {decision('reassess', 'Reassess both estimates and the bedside')}
        {decision('handoff', 'Hand off the uncertainty and the owned decision')}
        {decision('dose-on-estimate', 'Start at the dose the estimate supports')}
        {decision('take-the-convenient-number', 'Adopt whichever estimate suits the plan')}
      </div>
    </section>
  </>;
}
