import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { QuietChestSnapshot } from '@platform/kernel/protocol';
import type { QuietChestAction } from './quiet-chest';
import { quietChestInlinePrompt } from './quiet-chest-tutor';

export function QuietChestTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: QuietChestSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: QuietChestAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = quietChestInlinePrompt(guidance, { scenarioVersion, quietChest: assessment });
  const observations = assessment.observationRecord; const chest = assessment.chestRecord;
  const observation = assessment.observation;
  const decision = (action: QuietChestAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining" role="status">Fall down four steps at home {assessment.hoursSinceFall} hours ago, aged 81. {assessment.fracturedRibs} left-sided rib fractures on reported imaging. Pneumothorax {assessment.pneumothoraxReported ? 'reported' : 'not reported'}. Mild chronic obstructive pulmonary disease, and she {assessment.livesAlone ? 'lives alone' : 'lives with family'}.</p>
    <p className="syringe__remaining">Selected sources: two retrospective cohorts of rib fractures in older patients, and a systematic review of randomised trials of continuous epidural analgesia that found no firm evidence either way. Open the source view for exact wording and rates.</p>
    <section className="syringe quiet-chest__section" aria-labelledby="quiet-chest-record-title">
      <div id="quiet-chest-record-title" className="syringe__name">The chart is normal. Ask what it was measuring.</div>
      <p className="syringe__remaining">Supplied observations are heart rate 84/min, blood pressure 138/76 mmHg, respiratory rate 18/min at rest, oxygen saturation 96% on air, and temperature 36.6 C. Every one of them is normal, and every one was taken while she was lying still. A full breath and a cough have {assessment.effortObserved ? 'been observed' : 'not been asked for or observed'}.</p>
      <p className="syringe__remaining">She would like to be at home tonight, and the department is full.</p>
      <p className="syringe__remaining">Fall and fracture count: {assessment.injuryRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.injuryRecordedAtTick)}`}. What comfortable at rest measures: {assessment.comfortLimitsRecordedAtTick === null ? 'not yet recorded' : 'recorded beside the chart'}. What the count predicts: {assessment.countRecordedAtTick === null ? 'not yet recorded' : 'recorded with its figures'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-fall-and-what-was-broken', 'Record the fall and what it broke', assessment.injuryRecordedAtTick !== null)}
        {decision('record-what-comfortable-at-rest-measures', 'Record what comfortable at rest measures', assessment.comfortLimitsRecordedAtTick !== null)}
        {decision('record-what-the-count-predicts', 'Record what the count predicts', assessment.countRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe quiet-chest__section" aria-labelledby="quiet-chest-escalation-title">
      <div id="quiet-chest-escalation-title" className="syringe__name">Ask for the interval, not just the bed.</div>
      <p className="syringe__remaining">{assessment.countRecordedAtTick === null
        ? 'The risk these fractures carry in an older patient develops over the second and third day, as pain stops the bases of the lungs being filled. Record what the count predicts before deciding what tonight’s chart licenses.'
        : 'In 277 patients aged 65 and over against 187 younger ones with the same mean fracture count and the same mean injury severity, pneumonia occurred in 31 percent against 17 and mortality was 22 percent against 10.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what any of this licenses.'
        : 'Supplied boundaries: 31 against 17 percent pneumonia and 22 against 10 percent mortality in one single-centre cohort, five times the adjusted odds of death in another registry of 405 patients, both retrospective — and the first reports the odds of pneumonia per additional rib as 1.16 in its results and 27 percent in its conclusion, which do not match. Against that, six randomised trials of continuous epidural analgesia in 223 patients, all at high risk of bias, found no significant difference in mortality, pneumonia or ventilation days. The risk is real; the remedy is not established.'}</p>
      <p className="syringe__remaining">Admitting team: {assessment.escalationAtTick === null ? 'not yet asked' : `asked at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.admissionIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-the-admitting-team', 'Ask the team that owns the plan to take her', assessment.escalationAtTick !== null)}
        {decision('record-bounded-admission-intent', 'Record bounded qualified-team intent', assessment.admissionIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe quiet-chest__section" aria-labelledby="quiet-chest-observation-title">
      <div id="quiet-chest-observation-title" className="syringe__name">Reassess. Nothing is going to deteriorate tonight.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min at rest; oxygen saturation ${observations.spo2Percent}%; temperature ${observations.coreTemperatureC.toFixed(1)} C. This partial check supplies no chest record, and all of it was recorded at rest.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{chest
        ? `Last requested chest record at simulated ${formatElapsed(chest.atTick)}: ${chest.mechanism}, ${chest.hoursSinceFall} hours ago; ${chest.fracturedRibs} left-sided rib fractures; pneumothorax ${chest.pneumothoraxReported ? 'reported' : 'not reported'}; haemothorax ${chest.haemothoraxReported ? 'reported' : 'not reported'}; ${chest.copd ? 'known mild chronic obstructive pulmonary disease' : 'no known lung disease'}; ${chest.livesAlone ? 'lives alone' : 'lives with family'}; full breath and cough ${chest.effortObserved ? 'observed' : 'not observed'}. This partial check supplies no new observations.`
        : 'No new chest-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; respiratory rate ${observation.respiratoryRateBpm}/min at rest; oxygen saturation ${observation.spo2Percent}%; ${observation.hoursSinceFall} hours since the fall; ${observation.fracturedRibs} fractures; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.familyCalled && <p className="syringe__remaining">Her daughter has telephoned to say she cannot stay tonight after all. The rate, the saturation and the comfort are exactly as they were, and the going-home plan has lost the part that made it safe.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The admitting team has answered. They confirmed the fracture count and her age from their own record, stated that the risk they are admitting her for is the next two to three days rather than tonight, and own the analgesia plan, the observation interval, any respiratory input, and the timing of discharge.</p>}
      {(assessment.normalNumbersAttempted || assessment.filmClaimAttempted || assessment.painReportAttempted || assessment.dischargeAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the fall and its hours, the count recorded beside her age, what the resting chart was measuring, that she will be alone tonight, and the bounded intent all travel with the patient. No complication, discharge date, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-chest-record', 'Check the chest record only')}
        {decision('reassess', 'Reassess observations and chest record')}
        {decision('handoff', 'Hand off the plan and its interval')}
        {decision('her-numbers-are-normal-so-she-can-go-home', 'Her numbers are normal, so she can go home')}
        {decision('there-is-no-pneumothorax-on-the-film', 'There is no pneumothorax on the film')}
        {decision('she-says-the-pain-is-manageable', 'She says the pain is manageable')}
        {decision('send-her-home-with-tablets-and-review-in-a-week', 'Send her home with tablets and review in a week')}
      </div>
    </section>
  </>;
}
