import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { OxygenTargetScaleSnapshot } from '@platform/kernel/protocol';
import { OXYGEN_TARGET_SCALE_ONE, OXYGEN_TARGET_SCALE_TWO, type OxygenTargetScaleAction } from './oxygen-target-scale';

export function OxygenTargetScaleTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: OxygenTargetScaleSnapshot;
  readonly onAction: (action: OxygenTargetScaleAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prescription = assessment.prescriptionRecord; const chart = assessment.chartRecord;
  const observation = assessment.observation;
  const decision = (action: OxygenTargetScaleAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {/* The score is never shown without the scale it was computed on. A bare 3 is the error. */}
    <p className="syringe__remaining" role="status">Saturation {assessment.saturationPercent}% {assessment.onSupplementalOxygen ? 'on oxygen' : 'breathing air'}, scored {assessment.chartedScore} on scale {assessment.chartedScale}. Prescribed target {assessment.prescribedTargetRange} on scale {assessment.prescribedScale}.</p>
    <p className="syringe__remaining">Selected sources: the national early warning score specification that publishes both saturation scales, a national oxygen guideline, one randomised trial of titrated versus high-flow oxygen, and one comparison of the two scales. Open the source view for exact figures.</p>
    <section className="syringe oxygen-target-scale__section" aria-labelledby="oxygen-target-scale-documents-title">
      <div id="oxygen-target-scale-documents-title" className="syringe__name">Two documents, one patient.</div>
      <p className="syringe__remaining">Supplied starting observations were pulse 84/min, blood pressure 128/74 mmHg, respiratory rate 18/min, temperature 36.8 C, oxygen saturation {assessment.saturationPercent}% breathing air, awake and speaking in full sentences. These remain historical starting observations.</p>
      <p className="syringe__remaining">{prescription
        ? `Prescription read at simulated ${formatElapsed(prescription.atTick)}: target ${prescription.prescribedTargetRange} on scale ${prescription.prescribedScale}; the scale decision is ${prescription.scaleDecisionDocumented ? 'documented in the notes' : 'not documented'}.`
        : 'The prescription and the documented scale decision have not been read.'}</p>
      <p className="syringe__remaining">{chart
        ? `Chart read at simulated ${formatElapsed(chart.atTick)}: ${chart.saturationPercent}% ${chart.onSupplementalOxygen ? 'on oxygen' : 'breathing air'}, scored on scale ${chart.chartedScale}, giving ${chart.chartedScore} for the saturation.`
        : 'The observation chart and the scale it is scored on have not been read.'}</p>
      <ul className="syringe__remaining">
        {OXYGEN_TARGET_SCALE_ONE.map((band) => <li key={`one-${band.score}`}>Scale 1 — {band.label}: {band.score}</li>)}
        {OXYGEN_TARGET_SCALE_TWO.map((band) => <li key={`two-${band.score}`}>Scale 2 — {band.label}: {band.score}</li>)}
      </ul>
      <div className="crisis-drug__actions">
        {decision('check-the-prescription', 'Read the prescription and the scale decision')}
        {decision('check-the-chart', 'Read the chart and its scale')}
        {decision('record-the-scale-mismatch', 'Record that the documents disagree', assessment.mismatchRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe oxygen-target-scale__section" aria-labelledby="oxygen-target-scale-score-title">
      <div id="oxygen-target-scale-score-title" className="syringe__name">The number did not move.</div>
      <p className="syringe__remaining">{assessment.rescoredAtTick === null
        ? 'The saturation has not been recalculated against the prescribed range.'
        : `Recalculated at simulated ${formatElapsed(assessment.rescoredAtTick)}: ${assessment.saturationPercent}% breathing air scores ${assessment.prescribedScaleScore} on the prescribed scale. The measurement is unchanged; the range it is compared with is not.`}</p>
      <p className="syringe__remaining">{assessment.consequencesRecordedAtTick === null
        ? 'What the recalculation changes, and what it leaves untouched, has not been stated.'
        : 'Stated: only the score changed. What the correction removes is a reason to give her oxygen she does not need; what it does not supply is evidence that she is well.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what a corrected score does and does not license.'
        : 'Supplied boundaries: the guideline warns that a patient inside the prescribed range scores points on the ordinary scale and that this may prompt staff to raise the inspired oxygen and put her at risk. One cluster-randomised trial found lower mortality with a titrated strategy than with routine high-flow oxygen, and the same guideline states that it is not known whether this range is the ideal one. The second scale has not been shown to detect deterioration better than the first.'}</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('rescore-on-the-prescribed-scale', 'Rescore on the prescribed scale', assessment.rescoredAtTick !== null)}
        {decision('record-what-the-rescore-changes', 'State what the rescore changes', assessment.consequencesRecordedAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe oxygen-target-scale__section" aria-labelledby="oxygen-target-scale-response-title">
      <div id="oxygen-target-scale-response-title" className="syringe__name">Whose decision it is.</div>
      <p className="syringe__remaining">Confirmation: {assessment.confirmationAtTick === null ? 'not requested' : `requested at simulated ${formatElapsed(assessment.confirmationAtTick)}`}. Observation: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged on the corrected chart, with air or oxygen recorded'}.</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: ${observation.saturationPercent}% ${observation.onSupplementalOxygen ? 'on oxygen' : 'breathing air'}, unchanged; chart on scale ${observation.chartedScale}, scoring ${observation.chartedScore}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.colleagueAskedToRaiseOxygen && <p className="syringe__remaining">A colleague has read the score off the chart and offered to put oxygen on her to bring the saturation up. The chart said a number was wrong, and raising it is the obvious way to fix a saturation.</p>}
      {assessment.reviewObserved && <p className="syringe__remaining">The qualified team has confirmed the documented decision and the prescribed range, recorded that the wrong chart was in use and that the unused section should have been crossed out, and recorded that a corrected score is not a statement that she is well.</p>}
      {(assessment.oxygenRaiseAttempted || assessment.scaleAssumedFromDiagnosis || assessment.lowerScoreReadAsWell || assessment.higherOfBothScoresTaken) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the prescribed range with its documented decision, the scale the chart had been using, and a score that fell without the patient changing all travel with her. No cause, trajectory, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('confirm-the-scale-with-the-team', 'Take the scale decision to the team', assessment.confirmationAtTick !== null)}
        {decision('monitor', 'Arrange observation on the corrected chart', assessment.monitoringAtTick !== null)}
        {decision('reassess', 'Reassess the documents and the observation')}
        {decision('handoff', 'Hand off the corrected score')}
        {decision('raise-the-oxygen-to-correct-it', 'Put oxygen on to bring it up')}
        {decision('assume-the-diagnosis-sets-the-scale', 'The diagnosis sets the scale')}
        {decision('a-lower-score-means-she-is-improving', 'A lower score means she improved')}
        {decision('score-both-and-take-the-higher', 'Score both and take the higher')}
      </div>
    </section>
  </>;
}
