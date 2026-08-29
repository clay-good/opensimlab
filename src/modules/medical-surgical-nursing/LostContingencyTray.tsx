import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { LostContingencySnapshot } from '@platform/kernel/protocol';
import type { LostContingencyAction } from './lost-contingency';

export function LostContingencyTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: LostContingencySnapshot;
  readonly onAction: (action: LostContingencyAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const spoken = assessment.spokenRecord; const notes = assessment.notesRecord;
  const observation = assessment.observation;
  const decision = (action: LostContingencyAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {/* The counts are shown side by side and never as a single total. The whole lesson is the
        difference between two numbers that describe the same patient. */}
    <p className="syringe__remaining" role="status">Said at handover: {assessment.spokenElements.length} elements. Written in the notes: {assessment.recordedElements.length}. The contingency is {assessment.contingencyWasSpoken ? 'in both' : 'in the notes and was not said'}.</p>
    <p className="syringe__remaining">Selected sources: an audiotape study of what sign-outs contain and what they lose between shifts, a structured-handoff programme and its cluster-randomised replication, and two systematic reviews. Open the source view for exact figures.</p>
    <section className="syringe lost-contingency__section" aria-labelledby="lost-contingency-sources-title">
      <div id="lost-contingency-sources-title" className="syringe__name">What was said, and what is written.</div>
      <p className="syringe__remaining">Supplied starting observations were pulse 88/min, blood pressure 118/70 mmHg, respiratory rate 17/min, oxygen saturation 96% in air, temperature 37.1 C, comfortable and sleeping between observations. These remain historical starting observations.</p>
      <p className="syringe__remaining">{spoken
        ? `Handover recorded at simulated ${formatElapsed(spoken.atTick)}:`
        : 'The spoken handover has not been written down. It is the only evidence that something was not said, and it fades.'}</p>
      {spoken && <ul className="syringe__remaining">
        {spoken.spokenElements.map((element) => <li key={element}>Said — {element}</li>)}
      </ul>}
      <p className="syringe__remaining">{notes
        ? `Notes read at simulated ${formatElapsed(notes.atTick)}. The record is complete and correct; nothing here was charted wrongly.`
        : 'The post-operative notes have not been read.'}</p>
      {notes && <ul className="syringe__remaining">
        {notes.recordedElements.map((element, index) => (
          <li key={element}>{index === notes.recordedElements.length - 1 ? 'Written, and not said — ' : 'Written — '}{element}</li>
        ))}
      </ul>}
      <div className="crisis-drug__actions">
        {decision('record-what-was-said', 'Write down what was actually said')}
        {decision('check-the-notes', 'Read the post-operative notes')}
        {decision('record-the-gap-as-a-transmission-gap', 'Record the difference', assessment.gapRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe lost-contingency__section" aria-labelledby="lost-contingency-plan-title">
      <div id="lost-contingency-plan-title" className="syringe__name">Found, not written.</div>
      <p className="syringe__remaining">{assessment.contingencyReconstructed
        ? `Reconstructed at simulated ${formatElapsed(assessment.reconstructedAtTick!)}, in the surgical team’s words: ${assessment.contingencyReconstructed}`
        : 'The contingency is still held only in the notes.'}</p>
      <p className="syringe__remaining">{assessment.consequencesRecordedAtTick === null
        ? 'What the gap changed, and what it left untouched, has not been stated.'
        : 'Stated: the gap changed who knew, and for how long. It did not change the plan and it did not change the patient.'}</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('reconstruct-the-contingency', 'Reconstruct the plan from the notes', assessment.reconstructedAtTick !== null)}
        {decision('record-what-the-gap-changes', 'State what the gap changed', assessment.consequencesRecordedAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe lost-contingency__section" aria-labelledby="lost-contingency-response-title">
      <div id="lost-contingency-response-title" className="syringe__name">Back to the people who wrote it.</div>
      <p className="syringe__remaining">Confirmation: {assessment.confirmationAtTick === null ? 'not requested' : `requested at simulated ${formatElapsed(assessment.confirmationAtTick)}`}. Observation: {assessment.monitoringAtTick === null ? 'not arranged' : `arranged, with the hourly output recorded against ${assessment.urineThresholdMl} mL and consecutive hours counted`}.</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: ${observation.spokenElements.length} elements said, ${observation.recordedElements.length} written. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.outputReported && <p className="syringe__remaining">The last hourly urine output was {assessment.urineHourlyMl} mL, above the plan’s threshold of {assessment.urineThresholdMl} mL, for {assessment.consecutiveHoursBelowThreshold} consecutive hours below it. Nothing is triggered. What it does is make the plan matter.</p>}
      {assessment.confirmationObserved && <p className="syringe__remaining">The surgical registrar has confirmed the plan stands as written, unchanged, and recorded that it was confirmed overnight.</p>}
      {(assessment.nothingSaidReadAsNothingApplies || assessment.memoryAskedFor || assessment.quietReadAsStable || assessment.ownPlanAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the contingency travels in the surgical team’s words, with its trigger, threshold, action, and owner, and with the fact that it was missing from the handover this shift received. No cause, trajectory, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('confirm-the-plan-with-the-team', 'Confirm the plan with the surgical team', assessment.confirmationAtTick !== null)}
        {decision('monitor', 'Keep the observations against the threshold', assessment.monitoringAtTick !== null)}
        {decision('reassess', 'Reassess the handover against the record')}
        {decision('handoff', 'Hand off the plan, said out loud')}
        {decision('nothing-said-means-nothing-applies', 'It was not said, so it does not apply')}
        {decision('ask-the-day-nurse-to-remember', 'Phone the day nurse to ask')}
        {decision('a-quiet-handover-means-a-stable-patient', 'A short handover means a simple patient')}
        {decision('write-a-plan-of-my-own', 'Write a contingency plan myself')}
      </div>
    </section>
  </>;
}
