import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { LastKnownWellSnapshot } from '@platform/kernel/protocol';
import { LAST_KNOWN_WELL_TIMELINE, type LastKnownWellAction } from './last-known-well';

export function LastKnownWellTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: LastKnownWellSnapshot;
  readonly onAction: (action: LastKnownWellAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const timeline = assessment.timelineRecord; const patient = assessment.patientRecord;
  const observation = assessment.observation;
  const decision = (action: LastKnownWellAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {/* The onset field is shown as empty and stays empty. An empty field is the honest entry,
        and displaying it as such is what stops it being filled to look complete. */}
    <p className="syringe__remaining" role="status">Onset time: {assessment.onsetTimeRecorded ?? 'not known'}. Last known well {assessment.lastKnownWellClock}, found {assessment.foundClock}: an unwitnessed interval {assessment.unwitnessedHours} hours wide.</p>
    <p className="syringe__remaining">Selected sources: a randomised trial of treatment in stroke of unknown onset, and a systematic review of observation gaps preceding unrecognised deterioration. Open the source view for exact figures.</p>
    <section className="syringe last-known-well__section" aria-labelledby="last-known-well-timeline-title">
      <div id="last-known-well-timeline-title" className="syringe__name">Two certainties and a maybe.</div>
      <p className="syringe__remaining">Supplied starting observations were pulse 86/min, blood pressure 158/88 mmHg, respiratory rate 16/min, oxygen saturation 96% in air, temperature 36.7 C, blood glucose 6.2 mmol/L, awake with new right-sided weakness and word-finding difficulty. These remain historical starting observations.</p>
      <ul className="syringe__remaining">
        {LAST_KNOWN_WELL_TIMELINE.map((entry) => (
          <li key={entry.id}>{entry.clock} — {entry.label}{entry.certain ? '' : ' (uncertain)'}</li>
        ))}
      </ul>
      <p className="syringe__remaining">{assessment.boundRecordedAtTick === null
        ? 'The chart offers a box labelled onset time.'
        : 'Last known well is a bound: the deficit began at some point after 22:40. That is true and useful, and it is not an onset.'}</p>
      <p className="syringe__remaining">Bound: {assessment.boundRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.boundRecordedAtTick)}, labelled as a bound`}. Recollection: {assessment.recollectionRecordedAtTick === null ? 'not yet recorded' : 'recorded in her words, marked uncertain'}. Consequences: {assessment.consequencesRecordedAtTick === null ? 'not yet stated' : 'stated'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-last-known-well', 'Record last known well as a bound', assessment.boundRecordedAtTick !== null)}
        {decision('record-the-uncertain-recollection', 'Record the recollection as uncertain', assessment.recollectionRecordedAtTick !== null)}
        {decision('record-what-the-unknown-changes', 'State what the unknown changes', assessment.consequencesRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe last-known-well__section" aria-labelledby="last-known-well-activation-title">
      <div id="last-known-well-activation-title" className="syringe__name">Activation does not need the clock.</div>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what an unknown onset does and does not license.'
        : 'Supplied boundaries: last known well is a bound and should never be charted as an onset. An unknown time is a reason to escalate for assessment rather than to stand down: a randomised trial enrolled patients whose deficits began at an unknown time and found a higher rate of favourable outcome in the treated group, with eligibility assessed by imaging as a surrogate for lesion age rather than by a remembered time. It also reported numerically more deaths and significantly more parenchymal haematoma in that group, and it was stopped at 503 of a planned 800 patients when its funding ended, so it was never powered to measure harm. That describes a population and a pathway, not this patient, and the eligibility decision is not the ward’s to make.'}</p>
      <p className="syringe__remaining">Pathway: {assessment.pathwayActivatedAtTick === null ? 'not activated' : `activated at simulated ${formatElapsed(assessment.pathwayActivatedAtTick)} on the deficit`}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Observation: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged, with each finding timed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('activate-the-stroke-pathway', 'Activate the stroke pathway', assessment.pathwayActivatedAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange timed neurological observation', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe last-known-well__section" aria-labelledby="last-known-well-observation-title">
      <div id="last-known-well-observation-title" className="syringe__name">Reassess. The gap will not close.</div>
      <p className="syringe__remaining">{timeline
        ? `Last requested timeline check at simulated ${formatElapsed(timeline.atTick)}: ${timeline.certainEntries} of ${timeline.totalEntries} entries documented; the interval containing the onset is ${timeline.unwitnessedHours} hours wide. This partial check supplies no examination.`
        : 'No new timeline check has been requested.'}</p>
      <p className="syringe__remaining">{patient
        ? `Last requested observation at simulated ${formatElapsed(patient.atTick)}: ${patient.focalDeficit ? 'new right-sided weakness present' : 'no focal deficit'}; ${patient.speaking ? 'speaking with word-finding difficulty' : 'not speaking'}. The blood glucose supplied at discovery was ${patient.glucoseMmolL.toFixed(1)} mmol/L and is not retested here. The deficit is what activates the pathway, whatever time it began.`
        : 'No new observation of the patient has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: ${observation.focalDeficit ? 'deficit persists' : 'no deficit'}; unwitnessed interval ${observation.unwitnessedHours} hours. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.recollectionPressed && <p className="syringe__remaining">Pressed on the time, the care assistant moved it by an hour and said she would not swear to it. Pressing an uncertain recollection does not make it certain.</p>}
      {assessment.assessmentObserved && <p className="syringe__remaining">The stroke team has assessed, recorded the bound as a bound, kept the recollection separate and uncertain, and is proceeding on imaging-based assessment rather than a remembered time.</p>}
      {(assessment.recollectionChartedAttempted || assessment.boundChartedAttempted || assessment.nothingOfferedAttempted || assessment.waitedForFamily) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the bound, the uncertain recollection, the basis for activation, and an onset field that is empty because nobody knows what belongs in it all travel with the patient. No onset, eligibility, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-the-timeline', 'Check the timeline only')}{decision('check-patient', 'Observe the patient only')}
        {decision('reassess', 'Reassess the timeline and the patient')}
        {decision('handoff', 'Hand off the bound and the empty field')}
        {decision('chart-the-recollection-as-onset', 'Chart onset as 03:00')}
        {decision('chart-last-known-well-as-onset', 'Chart onset as 22:40')}
        {decision('unknown-onset-means-nothing-offered', 'Unknown onset, so nothing to offer')}
        {decision('wait-for-the-family-to-confirm', 'Wait for the family to confirm')}
      </div>
    </section>
  </>;
}
