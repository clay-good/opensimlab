import { Button } from '@platform/ui';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HypocalcemiaSnapshot } from '@platform/kernel/protocol';
import type { HypocalcemiaAction } from './hypocalcemia';
import { hypocalcemiaInlinePrompt, HYPOCALCEMIA_SOURCE_HREF, HYPOCALCEMIA_ESE_SOURCE_HREF } from './tutor/hypocalcemia-guidance';

export function HypocalcemiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: HypocalcemiaSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: HypocalcemiaAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = hypocalcemiaInlinePrompt(guidance, { scenarioVersion, hypocalcemia: assessment });
  const observation = assessment.observation;
  const decision = (action: HypocalcemiaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  const earlierChoices = [assessment.oralOnlyChosen && 'oral treatment alone', assessment.waitForLabsChosen && 'waiting for laboratory results',
    assessment.waitForMagnesiumChosen && 'waiting for magnesium before rescue', assessment.stopAfterReliefAttempted && 'stopping after symptom relief'].filter(Boolean);
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining"><a href={HYPOCALCEMIA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Emergency guidance: SfE 2016 (opens in a new tab)</a>{' · '}
      <a href={HYPOCALCEMIA_ESE_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Continuing care: ESE 2025 (opens in a new tab)</a></p>
    <section className="syringe hypocalcemia__section" aria-labelledby="hypocalcemia-rescue-title">
      <div id="hypocalcemia-rescue-title" className="syringe__name">Rescue now. Keep risk in view.</div>
      <p className="syringe__remaining">Current symptoms: {assessment.symptoms}. This fictional 46-year-old is one day after thyroidectomy. The supplied initial airway is patent; remain alert for airway, seizure, and postoperative neck concerns.</p>
      <p className="syringe__remaining">Supplied initial adjusted calcium: 6.6 mg/dL. Supplied QTc: 520 ms. These are starting findings, not live calcium or QTc measurements; the waveform does not calculate QTc.</p>
      <p className="syringe__remaining">Qualified IV calcium rescue includes ECG monitoring and can start immediately. Do not wait for risk review, the cause panel, support acknowledgment, or magnesium correction. No drug dose, infusion setting, or airway procedure is selected.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. The patient clock keeps running until you pause.'}</p>
      <p className="syringe__remaining">Calcium rescue: {assessment.calciumAtTick === null ? 'not started' : 'started with qualified monitoring'}. Risk review: {assessment.riskAssessedAtTick === null ? 'not recorded' : 'recorded'}. Team support: {assessment.supportActive ? 'active' : 'not yet called'}.</p>
      <div className="crisis-drug__actions">
        {decision('calcium-rescue', 'Start qualified calcium rescue', assessment.calciumAtTick !== null)}
        {decision('assess-risk', 'Review airway, seizure, and neck risk', assessment.riskAssessedAtTick !== null)}
        {decision('call-support', 'Call qualified support', assessment.supportActive)}
        {decision('oral-only', 'Choose oral treatment alone', assessment.calciumAtTick !== null)}
        {decision('wait-for-labs', 'Wait for laboratory results', assessment.calciumAtTick !== null)}
        {decision('wait-for-magnesium', 'Wait for magnesium before rescue', assessment.calciumAtTick !== null)}
      </div>
    </section>
    <section className="syringe hypocalcemia__section" aria-labelledby="hypocalcemia-cause-title">
      <div id="hypocalcemia-cause-title" className="syringe__name">Understand the cause. Prevent recurrence.</div>
      <p className="syringe__remaining">{assessment.causeReviewedAtTick === null
        ? 'The supplied cause panel has not been opened. Review it while rescue and monitoring continue.'
        : 'Supplied cause panel: magnesium 0.45 mmol/L; parathyroid hormone (PTH) 4 pg/mL (assay reference 15–65); phosphate 5.4 mg/dL (reference 2.5–4.5); creatinine 0.9 mg/dL with preserved renal function. These are supplied results, not a new test or proof of permanent hypoparathyroidism.'}</p>
      <p className="syringe__remaining">After cause review, qualified magnesium correction and continuing calcium/cause-directed care can begin independently. Neither waits for the other. Accepting care does not establish a normal magnesium or QTc.</p>
      <p className="syringe__remaining">Magnesium pathway: {assessment.magnesiumAtTick === null ? 'not started' : 'started'}. Continuing care: {assessment.continuingCareAtTick === null ? 'not started' : 'started'}.</p>
      <div className="crisis-drug__actions">
        {decision('review-cause', 'Review the supplied cause panel', assessment.causeReviewedAtTick !== null)}
        {decision('magnesium', 'Start qualified magnesium correction', assessment.magnesiumAtTick !== null)}
        {decision('continuing-care', 'Arrange continuing calcium and cause care', assessment.continuingCareAtTick !== null)}
        {decision('stop-after-relief', 'Stop after symptom relief')}
      </div>
    </section>
    <section className="syringe hypocalcemia__section" aria-labelledby="hypocalcemia-response-title">
      <div id="hypocalcemia-response-title" className="syringe__name">Reassess. Hand off continuing care.</div>
      <p className="syringe__remaining">{observation
        ? `Last requested assessment at simulated ${Math.floor(observation.atTick / (60 * TICKS_PER_SECOND))} min: adjusted calcium ${observation.adjustedCalciumMgDl} mg/dL, BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg, HR ${observation.heartRateBpm}/min, RR ${observation.respiratoryRateBpm}/min, SpO₂ ${observation.spo2Percent}%, temperature ${observation.coreTemperatureC}°C; ${observation.symptoms}. Calcium belongs to this requested result, not a live monitor. This observation can become stale.`
        : 'No new calcium and bedside reassessment has been requested. Monitor symptoms, breathing, circulation, and ECG throughout care.'}</p>
      {assessment.calciumDueInSeconds !== null && <p className="syringe__remaining">Authored relief checkpoint in {Math.ceil(assessment.calciumDueInSeconds / 60)} simulated min. The 15-minute contrast is not predicted calcium kinetics.</p>}
      {assessment.responseDueInSeconds !== null && <p className="syringe__remaining">Authored complete-care checkpoint in {Math.ceil(assessment.responseDueInSeconds / 60)} simulated min. The 1-hour partial-support contrast does not establish recovery.</p>}
      <p className="syringe__remaining">Continue frequent assessment; never wait for a checkpoint if the patient worsens. Missing magnesium or continuing care can produce an authored recurrence 45 minutes after rescue. These are teaching clocks, not safe delays, treatment predictions, or discharge criteria.</p>
      {earlierChoices.length > 0 && <p className="syringe__remaining">Earlier choices stay in this run: {earlierChoices.join('; ')}.</p>}
      {assessment.urgentTreatmentDelayed && <p className="syringe__remaining">An authored rescue delay was recorded. Later treatment does not erase it.</p>}
      {assessment.recurrenceOccurred && <p className="syringe__remaining">An authored recurrence was recorded. Later care does not erase this branch of the learning record.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: continuing treatment, serial calcium and magnesium review, ECG monitoring, and postoperative risk are handed off. This is not recovery or discharge clearance.'
        : 'Instructor takeover ended this branch. Open the debrief, then try a different decision. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('reassess', 'Reassess calcium and bedside response')}
        {decision('handoff', 'Hand off continuing treatment and risk')}
      </div>
    </section>
  </>;
}
