import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { TransientResponseSnapshot } from '@platform/kernel/protocol';
import type { TransientResponseAction } from './transient-response';
import { transientResponseInlinePrompt } from './transient-response-tutor';

export function TransientResponseTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: TransientResponseSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: TransientResponseAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = transientResponseInlinePrompt(guidance, { scenarioVersion, transientResponse: assessment });
  const observations = assessment.observationRecord; const response = assessment.responseRecord;
  const observation = assessment.observation;
  const decision = (action: TransientResponseAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining" role="status">Restrained driver, front of the car into a barrier at speed, {assessment.minutesSinceInjury} minutes ago. Abdomen tender and distending. Free fluid {assessment.freeFluidReported ? 'reported on a bedside scan already performed' : 'not reported'}. {assessment.bolusCount} warmed boluses given before this assessment.</p>
    <p className="syringe__remaining">Selected sources: a registry study of time in the department before an operation, a single-centre series of hypotensive torso gunshot wounds, and a multicentre registry study of early whole-body imaging. All three are retrospective, and they do not agree. Open the source view for exact wording and rates.</p>
    <section className="syringe transient-response__section" aria-labelledby="transient-response-record-title">
      <div id="transient-response-record-title" className="syringe__name">Read the shape, not the reading.</div>
      <p className="syringe__remaining">The first bolus took his pressure up and held it for {assessment.firstResponseHeldMinutes} minutes. The second took it up less far and held it for {assessment.secondResponseHeldMinutes}. Current authored observations are heart rate {assessment.observation?.heartRateBpm ?? (assessment.fallen ? 124 : 112)}/min and blood pressure {assessment.fallen ? '84/50' : '96/58'} mmHg. He is awake and answering.</p>
      <p className="syringe__remaining">Somebody has asked whether he should go to the scanner first. It is free.</p>
      <p className="syringe__remaining">Mechanism and clock: {assessment.mechanismRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.mechanismRecordedAtTick)}`}. Shape of the response: {assessment.responseRecordedAtTick === null ? 'not yet recorded' : 'recorded as a pattern'}. What a picture can and cannot do: {assessment.imagingLimitsRecordedAtTick === null ? 'not yet recorded' : 'recorded in both directions'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-mechanism-and-the-clock', 'Record the mechanism and the clock', assessment.mechanismRecordedAtTick !== null)}
        {decision('record-the-shape-of-the-response', 'Record the shape of the response', assessment.responseRecordedAtTick !== null)}
        {decision('record-what-a-picture-cannot-do', 'Record what a picture can and cannot do', assessment.imagingLimitsRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe transient-response__section" aria-labelledby="transient-response-escalation-title">
      <div id="transient-response-escalation-title" className="syringe__name">Call the team that can stop it.</div>
      <p className="syringe__remaining">{assessment.responseRecordedAtTick === null
        ? 'A transient response is a pressure that answers volume and then falls again, each answer smaller and sooner than the last. Record the pattern before deciding what any single reading licenses.'
        : 'In 243 registry patients hypotensive on arrival with isolated abdominal injury, the probability of death rose with every minute spent in the department — as much as 0.35 percent a minute, about 1 percent every 3 minutes — for the 165 who were there 90 minutes or less.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what any of this licenses.'
        : 'Supplied boundaries: up to 0.35 percent a minute in 243 registry patients; a hazard ratio of 1.89 (1.10 to 3.26) beyond 10 minutes in 309 hypotensive torso gunshot wounds, and 2.67 (0.97 to 7.34) at or below a systolic of 70, which that paper’s own conclusion calls almost threefold; and better survival with early whole-body imaging in 4,621 blunt trauma patients, number needed to scan 17 or 32. All retrospective, none randomised, two about somebody else.'}</p>
      <p className="syringe__remaining">Operating team: {assessment.escalationAtTick === null ? 'not yet called' : `called at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.operativeIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-the-theatre-team', 'Call the team that can stop the bleeding', assessment.escalationAtTick !== null)}
        {decision('record-bounded-operative-intent', 'Record bounded qualified-team intent', assessment.operativeIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe transient-response__section" aria-labelledby="transient-response-observation-title">
      <div id="transient-response-observation-title" className="syringe__name">Reassess. The number will move; the interval only goes one way.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}%; temperature ${observations.coreTemperatureC.toFixed(1)} C. This partial check supplies no response history, and one reading out of a falling pattern is the reading this lesson is about.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{response
        ? `Last requested response record at simulated ${formatElapsed(response.atTick)}: ${response.mechanism}, ${response.minutesSinceInjury} minutes ago; ${response.bolusCount} warmed boluses; the first answer held ${response.firstResponseHeldMinutes} minutes and the second ${response.secondResponseHeldMinutes}; free fluid ${response.freeFluidReported ? 'reported' : 'not reported'}. This partial check supplies no new observations.`
        : 'No new response-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; blood pressure ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; ${observation.minutesSinceInjury} minutes since injury; answers holding ${observation.firstResponseHeldMinutes} then ${observation.secondResponseHeldMinutes} minutes; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.fallen && <p className="syringe__remaining">The pressure has fallen a third time, to 84/50 with a rate of 124, five minutes after an answer that held for nine, and nothing was taken away to cause it.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The operating team has answered and is on its way. They repeated the response pattern back, stated that a patient who will not stay up is still bleeding and that naming the site does not change what has to happen to it, and own the transfer, any imaging on the way or not at all, and the operation and its timing.</p>}
      {(assessment.stabilityClaimAttempted || assessment.scanFirstAttempted || assessment.anotherLitreAttempted || assessment.waitForBloodAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the mechanism and its minutes, the response recorded as a shrinking pattern, what a picture can and cannot do here, the call that was made without waiting, and the bounded intent all travel with the patient. No injury, effect, disposition, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-response-record', 'Check the response record only')}
        {decision('reassess', 'Reassess observations and response record')}
        {decision('handoff', 'Hand off the decision and its clock')}
        {decision('he-came-back-up-so-he-is-stable', 'He came back up, so he is stable')}
        {decision('send-him-for-a-scan-before-calling', 'Send him for a scan before calling')}
        {decision('give-another-litre-and-see', 'Give another litre and see')}
        {decision('wait-for-the-cross-matched-blood-before-calling', 'Wait for the cross-matched blood before calling')}
      </div>
    </section>
  </>;
}
