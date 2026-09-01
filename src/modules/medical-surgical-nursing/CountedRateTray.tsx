import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { CountedRateSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CountedRateAction } from './counted-rate';
import { countedRateInlinePrompt } from './counted-rate-tutor';

export function CountedRateTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: CountedRateSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: CountedRateAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = countedRateInlinePrompt(guidance, { scenarioVersion, countedRate: assessment });
  const chart = assessment.chartRecord; const patient = assessment.patientRecord;
  const observation = assessment.observation;
  const decision = (action: CountedRateAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* Both numbers are shown together from the moment the second one exists, because the
        discrepancy is the finding and reconciling it would erase the lesson. */}
    <p className="syringe__remaining" role="status">Charted respiratory rates: {assessment.chartedEntries.join(', ')}. {assessment.countedRate === null
      ? 'Nothing has been counted for a full minute in this rehearsal yet.'
      : `Counted for a full minute: ${assessment.countedRate}.`}</p>
    <p className="syringe__remaining">Selected sources: a review naming respiratory rate the neglected vital sign, and an integrative review of how nurses actually measure and record it. Open the source view for exact wording.</p>
    <section className="syringe counted-rate__section" aria-labelledby="counted-rate-trend-title">
      <div id="counted-rate-trend-title" className="syringe__name">Six entries. Two values.</div>
      <p className="syringe__remaining">Supplied starting observations were oxygen saturation 95% in air, pulse 96/min, blood pressure 124/72 mmHg, temperature 37.2 C, alert and speaking in full sentences, two days after open abdominal surgery. These remain historical starting observations.</p>
      <p className="syringe__remaining">{assessment.trendReviewedAtTick === null
        ? 'Read the charted trend before deciding what kind of evidence it is.'
        : 'Read as a trend, that is a stable patient. Read as a distribution, it is six values drawn from a set of two, which is what estimation looks like when it is written down. Reviews of ward documentation describe exactly this clustering, and describe rates entered without being counted.'}</p>
      <p className="syringe__remaining">Trend reviewed: {assessment.trendReviewedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(assessment.trendReviewedAtTick)}`}. Counted: {assessment.countedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(assessment.countedAtTick)}`}. Discrepancy: {assessment.discrepancyRecordedAtTick === null ? 'not recorded' : 'recorded, and left unreconciled'}.</p>
      <div className="crisis-drug__actions">
        {decision('review-the-charted-trend', 'Review the charted trend', assessment.trendReviewedAtTick !== null)}
        {decision('count-for-a-full-minute', 'Count for a full minute', assessment.countedAtTick !== null)}
        {decision('record-the-discrepancy', 'Record the discrepancy', assessment.discrepancyRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe counted-rate__section" aria-labelledby="counted-rate-escalation-title">
      <div id="counted-rate-escalation-title" className="syringe__name">The strongest predictor, least reliably measured.</div>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what the respiratory rate predicts, and how reliably it is recorded.'
        : 'Supplied boundaries: respiratory rate is the single strongest routine predictor of in-hospital cardiac arrest, and also the observation most often estimated rather than counted. A rising rate precedes desaturation, so a normal oxygen saturation does not make it redundant. Whether a monitor-derived rate is equivalent to a counted one is not established in the retrievable evidence, and this lesson does not claim it either way.'}</p>
      <p className="syringe__remaining">Escalation: {assessment.escalationAtTick === null ? 'not yet requested' : `requested at simulated ${formatElapsed(assessment.escalationAtTick)} on the counted value`}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Increased observation: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged, with counting rather than estimation'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-on-the-counted-value', 'Escalate on the counted value', assessment.escalationAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange counted observation', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe counted-rate__section" aria-labelledby="counted-rate-observation-title">
      <div id="counted-rate-observation-title" className="syringe__name">Reassess. The column will not change.</div>
      <p className="syringe__remaining">{chart
        ? `Last requested chart review at simulated ${formatElapsed(chart.atTick)}: ${chart.entries.join(', ')} across ${chart.shifts} shifts, taking ${chart.distinctValues} distinct values. This partial review supplies no new observation of the patient.`
        : 'No new chart review has been requested.'}</p>
      <p className="syringe__remaining">{patient
        ? `Last requested observation at simulated ${formatElapsed(patient.atTick)}: respiratory rate ${patient.countedRate} counted for a full minute; oxygen saturation ${patient.spo2Percent}% on air; ${patient.usingAccessoryMuscles ? 'accessory muscle use present' : 'no accessory muscle use'}; ${patient.speakingFullSentences ? 'speaking in full sentences' : 'speaking in short phrases'}. This partial observation supplies no chart context.`
        : 'No new observation of the patient has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: charted ${observation.entries.join(', ')}; counted ${observation.countedRate}; oxygen saturation ${observation.spo2Percent}% on air. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.reviewObserved && <p className="syringe__remaining">The qualified team counted independently and reached the same number, and recorded that the charted column gave no indication of it.</p>}
      {(assessment.trendTrusted || assessment.monitorCharted || assessment.roundedToPrevious || assessment.retrospectiveEditAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the charted column as written, the counted rate, and the unreconciled discrepancy all travel with the patient. No cause or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-chart', 'Review the chart only')}{decision('check-patient', 'Observe the patient only')}
        {decision('reassess', 'Reassess the chart and the patient')}
        {decision('handoff', 'Hand off both numbers')}
        {decision('trust-the-flat-trend', 'The trend is flat, so he is stable')}
        {decision('chart-the-monitor-value', 'Chart the monitor rate instead')}
        {decision('round-to-the-previous-entry', 'Record a value near the last one')}
        {decision('correct-the-earlier-entries', 'Correct the earlier entries')}
      </div>
    </section>
  </>;
}
