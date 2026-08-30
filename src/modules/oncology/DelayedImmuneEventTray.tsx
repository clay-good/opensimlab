import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DelayedImmuneEventSnapshot } from '@platform/kernel/protocol';
import type { DelayedImmuneEventAction } from './delayed-immune-event';
import { delayedImmuneEventInlinePrompt } from './delayed-immune-event-tutor';

export function DelayedImmuneEventTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: DelayedImmuneEventSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: DelayedImmuneEventAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = delayedImmuneEventInlinePrompt(guidance, { scenarioVersion, delayedImmuneEvent: assessment });
  const observations = assessment.observationRecord; const exposure = assessment.exposureRecord;
  const observation = assessment.observation;
  const decision = (action: DelayedImmuneEventAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* The exposure is stated plainly and immediately. The lesson is not that it is hidden. */}
    <p className="syringe__remaining" role="status">Completed exposure: {assessment.checkpointInhibitorCycles} cycles of an anti-PD-1 checkpoint inhibitor, last dose {assessment.weeksSinceLastDose} weeks ago. It is not on the current medication list, because it stopped.</p>
    <p className="syringe__remaining">Selected sources: a collected case series of delayed immune-related events, a society clinical practice guideline on checkpoint-inhibitor adverse events, and a pharmacovigilance meta-analysis of fatal checkpoint-inhibitor toxicity. Open the source view for exact wording and grades.</p>
    <section className="syringe delayed-immune-event__section" aria-labelledby="delayed-immune-event-history-title">
      <div id="delayed-immune-event-history-title" className="syringe__name">Nothing here is hidden. It is just no longer written down.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 104/min, blood pressure 106/64 mmHg, respiratory rate 18/min, oxygen saturation 98% in air, temperature 36.8 C, and alert, with seven stools today above his own baseline over three weeks. These remain historical starting observations.</p>
      <p className="syringe__remaining">The referral letter says infectious gastroenteritis and does not mention the immunotherapy.</p>
      <p className="syringe__remaining">Exposure: {assessment.exposureRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.exposureRecordedAtTick)} as current history`}. Symptom course: {assessment.courseRecordedAtTick === null ? 'not yet recorded' : 'recorded against his own baseline'}. Infection evaluation: {assessment.infectionEvaluationAtTick === null ? 'not yet recorded' : 'recorded as running alongside'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-completed-exposure', 'Record the completed exposure as current history', assessment.exposureRecordedAtTick !== null)}
        {decision('record-the-symptom-course', 'Record the course against his baseline', assessment.courseRecordedAtTick !== null)}
        {decision('record-infection-evaluation-in-parallel', 'Record infection evaluation alongside', assessment.infectionEvaluationAtTick !== null)}
      </div>
    </section>
    <section className="syringe delayed-immune-event__section" aria-labelledby="delayed-immune-event-escalation-title">
      <div id="delayed-immune-event-escalation-title" className="syringe__name">An interval is not a defence.</div>
      <p className="syringe__remaining">{assessment.exposureRecordedAtTick === null
        ? 'A drug that finished is still an exposure. Record it where the next reader will find it.'
        : 'Immune-related adverse events can occur at any point during treatment or after it has ceased, including beyond six to twelve months. In the collected series the median off-treatment interval was six months, after a median of four doses.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what this exposure licenses.'
        : 'Supplied boundaries: the delayed-event series collected 23 cases and reports no incidence, so it cannot say how likely this is here; its argument is diagnostic, that misattribution leads to unnecessary or harmful interventions. In pharmacovigilance data colitis caused 135 of 193 reported anti-CTLA-4 deaths while colitis itself carried a reported fatality of about 2 to 5 percent; this patient received an anti-PD-1 drug, whose fatal spectrum was different.'}</p>
      <p className="syringe__remaining">Treating service: {assessment.escalationAtTick === null ? 'not yet contacted' : `contacted at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.treatmentIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-the-treating-service', 'Contact the service that gave the drug', assessment.escalationAtTick !== null)}
        {decision('record-bounded-treatment-intent', 'Record bounded qualified-team intent', assessment.treatmentIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe delayed-immune-event__section" aria-labelledby="delayed-immune-event-observation-title">
      <div id="delayed-immune-event-observation-title" className="syringe__name">Reassess. The observations will not rescue you.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}% on air; temperature ${observations.coreTemperatureC.toFixed(1)} C; ${observations.stoolsToday} stools today. This partial check supplies no history and no exposure record.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{exposure
        ? `Last requested history at simulated ${formatElapsed(exposure.atTick)}: ${exposure.checkpointInhibitorCycles} cycles completed, last dose ${exposure.weeksSinceLastDose} weeks ago; ${exposure.onCurrentMedicationList ? 'on the current medication list' : 'absent from the current medication list'}; ${exposure.referralAttribution}. This partial check supplies no new observations.`
        : 'No new exposure-history check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; blood pressure ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; temperature ${observation.coreTemperatureC.toFixed(1)} C; ${observation.stoolsToday} stools today; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.courseProgressed && <p className="syringe__remaining">An eighth stool has been counted today, with cramping that settles between episodes. The observations have barely moved.</p>}
      {assessment.serviceObserved && <p className="syringe__remaining">The treating service has answered. They confirmed the {assessment.checkpointInhibitorCycles} cycles and the {assessment.weeksSinceLastDose}-week interval from their own records, own grading, investigation and treatment, and recorded that the interval does not exclude an immune-related cause.</p>}
      {(assessment.attributionExclusionAttempted || assessment.motilityAttempted || assessment.waitForResultsAttempted || assessment.dischargeAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the completed exposure with its interval, the course against his baseline, the concurrent infection evaluation, the contact made, and the bounded treatment intent all travel with the patient. No diagnosis, grade, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-exposure-history', 'Check the exposure history only')}
        {decision('reassess', 'Reassess observations and exposure history')}
        {decision('handoff', 'Hand off the exposure and what it rests on')}
        {decision('stopped-months-ago-so-not-the-drug', 'It stopped months ago, so not the drug')}
        {decision('slow-the-gut-and-review-tomorrow', 'Slow the gut and review tomorrow')}
        {decision('wait-for-stool-results-before-escalating', 'Wait for the stool results first')}
        {decision('discharge-with-oral-rehydration', 'Discharge with oral fluids and safety-netting')}
      </div>
    </section>
  </>;
}
