import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UnownedDelaySnapshot } from '@platform/kernel/protocol';
import type { UnownedDelayAction } from './unowned-delay';
import { unownedDelayInlinePrompt } from './unowned-delay-tutor';

export function UnownedDelayTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: UnownedDelaySnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: UnownedDelayAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = unownedDelayInlinePrompt(guidance, { scenarioVersion, unownedDelay: assessment });
  const observations = assessment.observationRecord; const delay = assessment.delayRecord;
  const observation = assessment.observation;
  const decision = (action: UnownedDelayAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining" role="status">Displaced femoral neck fracture, aged 84, admitted {assessment.hoursSinceAdmission} hours ago and not yet operated. {assessment.cancellations} cancellations. {assessment.fastedHours} hours fasted across those days. Echocardiogram {assessment.echoRequested ? 'requested' : 'not requested'} and {assessment.echoBooked ? 'booked' : 'not booked'}; requesting clinician {assessment.echoRequesterNamed ? 'named' : 'not named in the record'}.</p>
    <p className="syringe__remaining">Selected sources: a population cohort of 42,230 hip fracture patients, a meta-analysis of sixteen observational studies, and a randomised trial of accelerated surgery that found no difference. They do not agree. Open the source view for exact wording and rates.</p>
    <section className="syringe unowned-delay__section" aria-labelledby="unowned-delay-record-title">
      <div id="unowned-delay-record-title" className="syringe__name">Three reasons, no authors.</div>
      <p className="syringe__remaining">An echocardiogram for a murmur that appears in no examination entry, requested by nobody the record names. A medical review awaited, of no named person, with no question attached. A list that was full on a day from which nobody rebooked her. Outstanding medical question: {assessment.medicalQuestionOutstanding ? 'documented' : 'none documented'}.</p>
      <p className="syringe__remaining">Authored observations are heart rate 92/min, blood pressure 132/70 mmHg, respiratory rate 18/min, oxygen saturation 95% on air, and temperature 36.4 C — the same numbers as on admission. Nobody in these notes argues that she should not have the operation.</p>
      <p className="syringe__remaining">Fracture and clock: {assessment.fractureRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.fractureRecordedAtTick)}`}. What each delay was for: {assessment.delayReasonsRecordedAtTick === null ? 'not yet recorded' : 'recorded with its missing authors'}. What is still outstanding: {assessment.pendingRecordedAtTick === null ? 'not yet recorded' : 'recorded separately from the paperwork'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-fracture-and-the-clock', 'Record the fracture and the clock', assessment.fractureRecordedAtTick !== null)}
        {decision('record-what-each-delay-was-for', 'Record what each delay was for', assessment.delayReasonsRecordedAtTick !== null)}
        {decision('record-what-is-still-being-waited-for', 'Record what is still being waited for', assessment.pendingRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe unowned-delay__section" aria-labelledby="unowned-delay-escalation-title">
      <div id="unowned-delay-escalation-title" className="syringe__name">Give the wait an owner.</div>
      <p className="syringe__remaining">{assessment.pendingRecordedAtTick === null
        ? 'A delay described as clinical and a delay that is organisational are fixed by two different telephone calls. Record which one this is before making either.'
        : 'What is left is a slot. Ask the person who holds the list for a named place with a named consultant, rather than escalating a general concern nobody can act on.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what any of this licenses.'
        : 'Supplied boundaries: complications rose beyond a 24-hour wait in 42,230 population-cohort patients, with matched 30-day mortality 6.5 against 5.8 percent and the composite 12.2 against 10.1; a meta-analysis of sixteen observational studies put the adjusted relative risk of death with earlier surgery at 0.81; and a randomised trial of 2,970 patients that moved the median wait from 24 hours to 6 found mortality of 9 against 10 percent, hazard ratio 0.91, with no difference in major complications. Accelerating a prompt pathway is not proven to help, and none of it describes a third day nobody signed for.'}</p>
      <p className="syringe__remaining">Team that owns the list: {assessment.escalationAtTick === null ? 'not yet asked' : `asked at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.schedulingIntentAtTick === null ? 'not recorded' : 'recorded as the qualified teams’ decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-the-team-that-owns-the-list', 'Ask the team that owns the list to own the wait', assessment.escalationAtTick !== null)}
        {decision('record-bounded-scheduling-intent', 'Record bounded qualified-team intent', assessment.schedulingIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe unowned-delay__section" aria-labelledby="unowned-delay-observation-title">
      <div id="unowned-delay-observation-title" className="syringe__name">Reassess. Only the clock is moving.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}%; temperature ${observations.coreTemperatureC.toFixed(1)} C. This partial check supplies no delay record, and these are the admission numbers.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{delay
        ? `Last requested delay record at simulated ${formatElapsed(delay.atTick)}: ${delay.injury}, admitted ${delay.hoursSinceAdmission} hours ago; ${delay.cancellations} cancellations; ${delay.fastedHours} hours fasted; echocardiogram ${delay.echoBooked ? 'booked' : 'requested but not booked'}; requester ${delay.echoRequesterNamed ? 'named' : 'not named'}; outstanding medical question ${delay.medicalQuestionOutstanding ? 'documented' : 'none documented'}. This partial check supplies no new observations.`
        : 'No new delay-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; blood pressure ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; ${observation.hoursSinceAdmission} hours since admission; ${observation.cancellations} cancellations; ${observation.fastedHours} hours fasted; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.listLost && <p className="syringe__remaining">The emergency theatre has taken another case and this evening is gone, which makes tomorrow the third day and this the third cancellation. Every monitored number is exactly what it was on admission.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The team that owns the list has answered, quickly, and had not known she was still waiting. She is against a named slot with a named consultant; they state that the echocardiogram request was never theirs and is not a gate they recognise, and they own the scheduling, any preoperative investigation they do want, and the fasting instruction that follows the slot.</p>}
      {(assessment.echoGateAttempted || assessment.listFullAttempted || assessment.oneMoreNightAttempted || assessment.keepFastedAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the fracture with its hours, each delay with its reason and its missing author, what is still outstanding, the owner the wait now has, and the bounded intent all travel with the patient. No operation, theatre time, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-delay-record', 'Check the delay record only')}
        {decision('reassess', 'Reassess observations and delay record')}
        {decision('handoff', 'Hand off the wait and its owner')}
        {decision('she-is-not-fit-until-the-echo-is-done', 'She is not fit until the echo is done')}
        {decision('the-list-is-full-so-it-is-out-of-our-hands', 'The list is full, so it is out of our hands')}
        {decision('one-more-night-will-not-make-a-difference', 'One more night will not make a difference')}
        {decision('keep-her-fasted-in-case-a-slot-appears', 'Keep her fasted in case a slot appears')}
      </div>
    </section>
  </>;
}
