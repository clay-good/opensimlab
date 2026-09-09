import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UnfinishedSurveySnapshot } from '@platform/kernel/protocol';
import type { UnfinishedSurveyAction } from './unfinished-survey';
import { unfinishedSurveyInlinePrompt } from './unfinished-survey-tutor';

export function UnfinishedSurveyTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: UnfinishedSurveySnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: UnfinishedSurveyAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = unfinishedSurveyInlinePrompt(guidance, { scenarioVersion, unfinishedSurvey: assessment });
  const observations = assessment.observationRecord; const injuries = assessment.injuryRecord;
  const observation = assessment.observation;
  const decision = (action: UnfinishedSurveyAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining" role="status">Motorcycle collision {assessment.hoursSinceInjury} hours ago, sedated and ventilated in intensive care. {assessment.listedInjuries} injuries listed from reported whole-body imaging. Secondary survey {assessment.secondarySurveyDocumented ? 'documented as complete' : 'not documented'}. Tertiary survey {assessment.tertiarySurveyDocumented ? 'documented' : 'not documented'}.</p>
    <p className="syringe__remaining">Selected sources: a prospective study that named the tertiary survey, a systematic review of ten observational studies of its effect, and a before-and-after cohort in which formalising it did not reduce missed injury. Open the source view for exact wording and rates.</p>
    <section className="syringe unfinished-survey__section" aria-labelledby="unfinished-survey-record-title">
      <div id="unfinished-survey-record-title" className="syringe__name">The record is accurate. Read what it actually says.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 88/min, blood pressure 118/68 mmHg, ventilated at a set rate of 14/min, oxygen saturation 98%, and temperature 36.8 C. He is sedated, intubated, and was a Glasgow Coma Scale of 6 at the scene. These remain historical starting observations, and none of them is abnormal.</p>
      <p className="syringe__remaining">The ward has asked whether he can be stepped down tonight.</p>
      <p className="syringe__remaining">Why the examination was limited: {assessment.examinationLimitsRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.examinationLimitsRecordedAtTick)}`}. What the injury list rests on: {assessment.injuryListRecordedAtTick === null ? 'not yet recorded' : 'recorded beside the list'}. Third survey not done: {assessment.surveyIncompleteRecordedAtTick === null ? 'not yet recorded' : 'recorded as a live finding'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-why-he-could-not-be-examined', 'Record why he could not be examined', assessment.examinationLimitsRecordedAtTick !== null)}
        {decision('record-what-the-injury-list-rests-on', 'Record what the injury list rests on', assessment.injuryListRecordedAtTick !== null)}
        {decision('record-that-the-third-survey-is-not-done', 'Record that the third survey is not done', assessment.surveyIncompleteRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe unfinished-survey__section" aria-labelledby="unfinished-survey-escalation-title">
      <div id="unfinished-survey-escalation-title" className="syringe__name">Ask for the step, not for permission.</div>
      <p className="syringe__remaining">{assessment.surveyIncompleteRecordedAtTick === null
        ? 'The tertiary survey is the deliberate head-to-toe reexamination performed once the patient can take part, with the imaging reviewed again beside it. Record that it has not happened before deciding what his record licenses.'
        : 'In 399 patients surveyed prospectively, a registry rate of 2 percent became 41 missed injuries in 36 patients, 9 percent; 21 of the 41 were extremity fractures, and the commonest reason for missing them was an altered level of consciousness.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what any of this licenses.'
        : 'Supplied boundaries: the survey found 9 percent against a registry 2; a systematic review of ten observational studies put injuries it finds at 4.3 percent and those it still misses at 1.5, with none randomised and moderate risk of bias; and formalising it in 487 patients raised performance from 27 to 42 percent while missed injury did not fall — 3.8 against 4.8 percent in hospital, 13.7 against 11.5 at one month, cumulative above 15. Worth doing, and not proven to fix this.'}</p>
      <p className="syringe__remaining">Trauma team: {assessment.escalationAtTick === null ? 'not yet asked' : `asked at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.surveyIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-the-trauma-team', 'Ask the team that owns the survey to complete it', assessment.escalationAtTick !== null)}
        {decision('record-bounded-survey-intent', 'Record bounded qualified-team intent', assessment.surveyIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe unfinished-survey__section" aria-labelledby="unfinished-survey-observation-title">
      <div id="unfinished-survey-observation-title" className="syringe__name">Reassess. Nothing is going to deteriorate.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; ventilated at a set rate of ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}%; temperature ${observations.coreTemperatureC.toFixed(1)} C. This partial check supplies no injury record, and none of these is abnormal.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{injuries
        ? `Last requested injury record at simulated ${formatElapsed(injuries.atTick)}: ${injuries.mechanism}, ${injuries.hoursSinceInjury} hours ago; ${injuries.listedInjuries} injuries listed from ${injuries.imagingReported ? 'reported whole-body imaging' : 'imaging not yet reported'} and a secondary survey documented as complete; ${injuries.sedated ? 'sedated and ventilated' : 'sedation lightened for the neurological assessment'}; tertiary survey ${injuries.tertiarySurveyDocumented ? 'documented' : 'not documented'}. This partial check supplies no new observations.`
        : 'No new injury-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; blood pressure ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; ${observation.hoursSinceInjury} hours since injury; ${observation.listedInjuries} injuries listed; tertiary survey ${observation.tertiarySurveyDocumented ? 'documented' : 'still not documented'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.sedationLightened && <p className="syringe__remaining">Sedation has been lightened for the routine neurological assessment. He opens his eyes, localises to the right, does not move the left arm, and grimaces when the left forearm is handled. The ventilator, the drain, the pressures and every monitored number are exactly as they were, and the ward has asked a second time.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The trauma team has answered. They confirmed from their own record that no tertiary survey has been documented, stated that the secondary survey entry records an examination rather than an absence of injury, and own completing the survey, re-reviewing the imaging against it, and anything that follows.</p>}
      {(assessment.documentationClaimAttempted || assessment.imagingClaimAttempted || assessment.noComplaintClaimAttempted || assessment.clearNowAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: why he could not be examined, what the injury list rests on, the assessment recorded as unfinished, the request made to the team that owns it, and the bounded intent all travel with the patient. No missed injury, disposition, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-injury-record', 'Check the injury record only')}
        {decision('reassess', 'Reassess observations and injury record')}
        {decision('handoff', 'Hand off the unfinished assessment')}
        {decision('the-secondary-survey-is-documented-complete', 'The secondary survey is documented complete')}
        {decision('the-pan-scan-would-have-shown-it', 'The whole-body scan would have shown it')}
        {decision('he-has-not-complained-of-anything', 'He has not complained of anything')}
        {decision('clear-him-now-and-review-if-something-appears', 'Clear him now and review if something appears')}
      </div>
    </section>
  </>;
}
