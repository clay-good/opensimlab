import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { KnownLabelSnapshot } from '@platform/kernel/protocol';
import type { KnownLabelAction } from './known-label';
import { knownLabelInlinePrompt } from './known-label-tutor';

export function KnownLabelTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: KnownLabelSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: KnownLabelAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = knownLabelInlinePrompt(guidance, { scenarioVersion, knownLabel: assessment });
  const observations = assessment.observationRecord; const behaviour = assessment.behaviourRecord;
  const observation = assessment.observation;
  const decision = (action: KnownLabelAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining" role="status">41-year-old man with a severe learning disability. Chronic constipation recorded for {assessment.labelYears} years. Informant of {assessment.informantYears} years {assessment.informantPresent ? 'is present' : 'has gone home'}. Abdominal examination he could take part in: {assessment.examinationAchieved ? 'achieved' : 'not achieved'}.</p>
    <p className="syringe__remaining">Selected sources: a population-based prevalence study whose strongest finding supports the label, a confidential inquiry into premature deaths, and a narrative review naming diagnostic overshadowing. Open the source view for exact wording and rates.</p>
    <section className="syringe known-label__section" aria-labelledby="known-label-record-title">
      <div id="known-label-record-title" className="syringe__name">The label is probably right. That is the difficulty.</div>
      <p className="syringe__remaining">When he is distressed he is usually loud, agitated and self-injurious. Today he is quiet, rocking, keeping one hand flat on his abdomen, and will not sit down. He has eaten nothing since yesterday and refused the one thing he never refuses. The triage note reads “constipation / behaviour”, and his support worker says she has seen his constipation many times and this is not it.</p>
      <p className="syringe__remaining">Authored observations are heart rate 104/min, blood pressure 138/82 mmHg, respiratory rate 18/min, oxygen saturation 97% on air, and temperature 37.1 C. The pulse is a little fast and nothing here is alarming.</p>
      <p className="syringe__remaining">Label and what it explains: {assessment.labelRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.labelRecordedAtTick)}`}. Account of what changed: {assessment.carerAccountRecordedAtTick === null ? 'not yet recorded' : 'recorded as history, with its author'}. What the label cannot exclude: {assessment.exclusionLimitsRecordedAtTick === null ? 'not yet recorded' : 'recorded with its figures'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-label-and-what-it-explains', 'Record the label and what it explains', assessment.labelRecordedAtTick !== null)}
        {decision('record-what-has-changed-according-to-someone-who-knows-him', 'Record what changed, from someone who knows him', assessment.carerAccountRecordedAtTick !== null)}
        {decision('record-what-the-label-cannot-exclude', 'Record what the label cannot exclude', assessment.exclusionLimitsRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe known-label__section" aria-labelledby="known-label-escalation-title">
      <div id="known-label-escalation-title" className="syringe__name">Ask for an examination, not for an argument.</div>
      <p className="syringe__remaining">{assessment.exclusionLimitsRecordedAtTick === null
        ? 'A diagnosis that accounts for the abdomen, the not eating and the distress leaves no remainder to be curious about. Record what it can and cannot do before deciding what it licenses.'
        : 'In 1,023 adults with intellectual disabilities the mean number of physical conditions was 11.04 and 98.7 percent were multimorbid, with constipation among the five most prevalent. A true label here is one of about eleven, and none of them excludes any other.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what any of this licenses.'
        : 'Supplied boundaries: mean 11.04 conditions and 98.7 percent multimorbidity in 1,023 adults, constipation among the five commonest — the label is very likely correct; a confidential inquiry into 247 deaths found 22 percent dying before 50, median age at death 64 against 78 and 83 in the general population, and 37 percent of deaths amenable to good healthcare against 13 percent, with carers not feeling listened to significant at p=0.006; and a narrative review naming the pattern diagnostic overshadowing, quoted for framing rather than effect size. None of it says his constipation is absent.'}</p>
      <p className="syringe__remaining">Surgical team: {assessment.escalationAtTick === null ? 'not yet asked' : `asked at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.adjustmentIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-the-surgical-team', 'Ask the surgical team to see him', assessment.escalationAtTick !== null)}
        {decision('record-bounded-adjustment-intent', 'Record bounded qualified-team intent', assessment.adjustmentIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe known-label__section" aria-labelledby="known-label-observation-title">
      <div id="known-label-observation-title" className="syringe__name">Reassess. The chart will not decide this.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}%; temperature ${observations.coreTemperatureC.toFixed(1)} C. This partial check supplies no behaviour record.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{behaviour
        ? `Last requested behaviour and history record at simulated ${formatElapsed(behaviour.atTick)}: ${behaviour.label} recorded for ${behaviour.labelYears} years; usual response to distress ${behaviour.usualDistress}; today ${behaviour.todayDescription}; ${behaviour.eatingToday ? 'eating as usual' : 'nothing eaten since yesterday'}; informant ${behaviour.informantYears} years, ${behaviour.informantPresent ? 'present' : 'shift ended and gone home'}; examination he could take part in ${behaviour.examinationAchieved ? 'achieved' : 'not achieved'}. This partial check supplies no new observations.`
        : 'No new behaviour-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; temperature ${observation.coreTemperatureC.toFixed(1)} C; informant ${observation.informantPresent ? 'present' : 'gone home'}; examination ${observation.examinationAchieved ? 'achieved' : 'still not achieved'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.carerLeft && <p className="syringe__remaining">The support worker’s shift has ended and a relief worker who has met him twice has arrived. Nothing about the patient has changed; what has left the department is the only comparison anybody had.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The surgical team has answered. They read the constipation as almost certainly still present and as explaining part of the picture rather than as excluding anything, and own the examination with whatever adjustments and time it needs, any investigation, and whether he stays.</p>}
      {(assessment.baselineClaimAttempted || assessment.labelClaimAttempted || assessment.cannotAssessAttempted || assessment.laxativeAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the label with the work it was doing, the recorded account and its author, what the label cannot exclude, and the bounded intent all travel with the patient. No diagnosis, disposition, or outcome is certified, and nothing here asserts that the constipation is absent.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-behaviour-record', 'Check the behaviour record only')}
        {decision('reassess', 'Reassess observations and behaviour record')}
        {decision('handoff', 'Hand off the assessment and what it needs')}
        {decision('this-is-his-baseline-behaviour', 'This is his baseline behaviour')}
        {decision('the-notes-say-chronic-constipation', 'The notes say chronic constipation')}
        {decision('he-cannot-tell-us-where-it-hurts-so-we-cannot-assess-him', 'He cannot tell us where it hurts, so we cannot assess him')}
        {decision('give-him-something-for-his-bowels-and-review', 'Give him something for his bowels and review')}
      </div>
    </section>
  </>;
}
