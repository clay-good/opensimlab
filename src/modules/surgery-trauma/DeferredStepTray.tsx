import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DeferredStepSnapshot } from '@platform/kernel/protocol';
import type { DeferredStepAction } from './deferred-step';
import { deferredStepInlinePrompt } from './deferred-step-tutor';

export function DeferredStepTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: DeferredStepSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: DeferredStepAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = deferredStepInlinePrompt(guidance, { scenarioVersion, deferredStep: assessment });
  const observations = assessment.observationRecord; const wound = assessment.woundRecord;
  const observation = assessment.observation;
  const decision = (action: DeferredStepAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining" role="status">Open tibial fracture, bone visible through a six-centimetre contaminated wound. {assessment.minutesSinceInjury} minutes since injury, {assessment.minutesSinceArrival} since arrival. Antibiotic {assessment.antibioticGiven ? 'given' : 'not given'}. Anybody objecting: {assessment.objectionRecorded ? 'yes' : 'nobody'}. {assessment.pulsesPresent ? 'Foot warm, pulses palpable, sensation normal.' : 'Pulses not felt.'}</p>
    <p className="syringe__remaining">Selected sources: two retrospective series that put the threshold at 66 minutes from injury and 120 minutes from arrival respectively, and an older series that named early antibiotics without any threshold. Open the source view for exact wording and rates.</p>
    <section className="syringe deferred-step__section" aria-labelledby="deferred-step-record-title">
      <div id="deferred-step-record-title" className="syringe__name">Nobody has refused anything. Find the step anyway.</div>
      <p className="syringe__remaining">The board says orthopaedics will review her and give the antibiotics then. The on-call registrar is in theatre with another case{assessment.reviewSlipped ? ', and theatre has now said the review will not happen before half past five' : ''}.</p>
      <p className="syringe__remaining">Authored observations are heart rate 88/min, blood pressure 124/74 mmHg, respiratory rate 16/min, oxygen saturation 98% on air, and temperature 36.7 C. Every one is normal, and they will stay normal.</p>
      <p className="syringe__remaining">Injury and clock: {assessment.injuryRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.injuryRecordedAtTick)}`}. Step that is waiting: {assessment.pendingStepRecordedAtTick === null ? 'not yet recorded' : 'recorded as outstanding'}. What the interval is attached to: {assessment.attachmentRecordedAtTick === null ? 'not yet recorded' : 'recorded as the finding'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-injury-and-the-clock', 'Record the injury and the clock', assessment.injuryRecordedAtTick !== null)}
        {decision('record-the-step-that-is-waiting', 'Record the step that is waiting', assessment.pendingStepRecordedAtTick !== null)}
        {decision('record-what-the-interval-is-attached-to', 'Record what the interval is attached to', assessment.attachmentRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe deferred-step__section" aria-labelledby="deferred-step-escalation-title">
      <div id="deferred-step-escalation-title" className="syringe__name">Ask for a decision, not a visit.</div>
      <p className="syringe__remaining">{assessment.attachmentRecordedAtTick === null
        ? 'A step with a therapeutic window measured in minutes has been tied to the moment a particular person becomes free. Record that before deciding what the plan licenses.'
        : 'The decision needs the injury, the time of it, and the absence of a documented allergy. None of those requires anybody to walk into the department.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what any of this licenses.'
        : 'Supplied boundaries: in 137 type III open tibial fractures, antibiotics beyond 66 minutes from injury independently predicted deep infection at 90 days (odds ratio 3.78; 95% CI 1.16-12.31), with 1 infection in 36 when nothing was delayed against 17 in 42 when both antibiotics and coverage were; in 230 open fractures elsewhere, administration beyond 120 minutes from arrival carried a 2.4-fold hazard, though the underlying median comparison of 61 against 83 minutes missed significance at p=0.053; and an older series of 1,104 wounds with 77 infections named early antibiotics as the single most important factor with no threshold. Two numbers, two clocks, all retrospective.'}</p>
      <p className="syringe__remaining">Team that can prescribe: {assessment.escalationAtTick === null ? 'not yet called' : `called at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.prescribingIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-the-team-that-can-prescribe', 'Ask the team that can decide it now', assessment.escalationAtTick !== null)}
        {decision('record-bounded-prescribing-intent', 'Record bounded qualified-team intent', assessment.prescribingIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe deferred-step__section" aria-labelledby="deferred-step-observation-title">
      <div id="deferred-step-observation-title" className="syringe__name">Reassess. Only the clock is moving.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}%; temperature ${observations.coreTemperatureC.toFixed(1)} C. This partial check supplies no wound record, and all of it is normal.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{wound
        ? `Last requested wound record at simulated ${formatElapsed(wound.atTick)}: ${wound.injury}, ${wound.minutesSinceInjury} minutes since injury and ${wound.minutesSinceArrival} since arrival; wound ${wound.woundLengthCm} cm with bone visible and ${wound.contaminated ? 'visible contamination' : 'no visible contamination'}; ${wound.pulsesPresent ? 'pulses palpable, sensation normal' : 'pulses not felt'}; antibiotic ${wound.antibioticGiven ? 'given' : 'not given'}; documented allergy ${wound.allergyDocumented ? 'present' : 'none'}. This partial check supplies no new observations.`
        : 'No new wound-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; temperature ${observation.coreTemperatureC.toFixed(1)} C; ${observation.minutesSinceInjury} minutes since injury; antibiotic ${observation.antibioticGiven ? 'given' : 'still not given'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.reviewSlipped && <p className="syringe__remaining">Theatre has rung: the registrar’s case has become more complicated and the review will not happen before half past five. Nothing about the patient has changed, and the step attached to that review has moved with it.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The team that can prescribe has answered within minutes and did not need to see her first. They state that the step does not have to wait for their review, and own the prescription, the wound dressing and photography, and the debridement and its timing.</p>}
      {(assessment.reviewGateAttempted || assessment.noHurryAttempted || assessment.morningChartAttempted || assessment.theatreAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the injury with the minutes measured from it, the step recorded as outstanding, what the interval had been attached to, the decision asked for without a visit, and the bounded intent all travel with the patient. No infection, effect, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-wound-record', 'Check the wound record only')}
        {decision('reassess', 'Reassess observations and wound record')}
        {decision('handoff', 'Hand off the step and its clock')}
        {decision('orthopaedics-will-give-them-when-they-review-her', 'Orthopaedics will give them when they review her')}
        {decision('she-is-stable-so-there-is-no-hurry', 'She is stable, so there is no hurry')}
        {decision('it-can-go-on-the-morning-drug-chart', 'It can go on the morning drug chart')}
        {decision('wait-until-she-is-in-theatre-anyway', 'Wait until she is in theatre anyway')}
      </div>
    </section>
  </>;
}
