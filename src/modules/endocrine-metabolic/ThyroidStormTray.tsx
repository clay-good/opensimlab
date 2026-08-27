import { Button } from '@platform/ui';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ThyroidStormAction, ThyroidStormSnapshot } from './thyroid-storm';
import { thyroidInlinePrompt, THYROID_SOURCE_HREF } from './tutor/thyroid-guidance';

export function ThyroidStormTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource }: {
  readonly assessment?: ThyroidStormSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: ThyroidStormAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = thyroidInlinePrompt(guidance, { scenarioVersion, thyroidStorm: assessment });
  const observation = assessment.observation;
  const decision = (action: ThyroidStormAction, label: string, accepted = false) => {
    const unavailable = !!assessment.ended || accepted;
    // Retain the focused control after accepted care; unavailable clicks do nothing.
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  const earlierChoices = [assessment.waitForLabsChosen && 'waiting for laboratory confirmation',
    assessment.blanketBetaBlockadeChosen && 'blanket beta-blockade request',
    assessment.earlyIodineAttempted && 'early iodine request'].filter(Boolean);
  return <>
    {prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p>
      <p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining"><a href={THYROID_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Read the 2026 consensus (opens in a new tab)</a></p>
    <section className="syringe thyroid-storm__section" aria-labelledby="thyroid-urgent-title">
      <div id="thyroid-urgent-title" className="syringe__name">Treat the emergency. Protect circulation.</div>
      <p className="syringe__remaining">Current alertness: {assessment.alertness}. This fictional suspected thyroid storm needs qualified treatment and investigation together.</p>
      <p className="syringe__remaining">Synthesis blockade means antithyroid medicine that limits new hormone production. Supportive care includes steroids, cooling, breathing and circulation support, and treatment of the trigger.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. The patient clock keeps running until you pause.'}</p>
      <p className="syringe__remaining">Support: {assessment.supportActive ? 'active' : 'not yet called'}. Synthesis blockade: {assessment.synthesisAtTick === null ? 'not started' : 'started'}. Supportive care: {assessment.supportiveCareAtTick === null ? 'not started' : 'started'}.</p>
      <div className="crisis-drug__actions">
        {decision('call-support', 'Call qualified support', assessment.supportActive)}
        {decision('synthesis-blockade', 'Start qualified synthesis blockade', assessment.synthesisAtTick !== null)}
        {decision('supportive-care', 'Start qualified supportive care', assessment.supportiveCareAtTick !== null)}
        {decision('wait-for-labs', 'Wait for laboratory confirmation', assessment.synthesisAtTick !== null && assessment.supportiveCareAtTick !== null)}
      </div>
    </section>
    <section className="syringe thyroid-storm__section" aria-labelledby="thyroid-sequence-title">
      <div id="thyroid-sequence-title" className="syringe__name">Look beyond the pulse. Keep the sequence clear.</div>
      <p className="syringe__remaining">{assessment.circulationRisk === 'unassessed'
        ? 'Perfusion and congestion have not yet been assessed. Do not delay urgent care for this review.'
        : 'Circulation assessment: poor perfusion with pulmonary congestion. The fast pulse may be compensatory; qualified cardiac assessment and individualized rate-control review remain essential.'}</p>
      <p className="syringe__remaining">Rate-control review: {assessment.rateControlReviewedAtTick === null ? 'not recorded' : 'recorded; no automatic beta-blocker administration'}.</p>
      <p className="syringe__remaining">{assessment.iodineAtTick !== null ? 'Iodine treatment accepted after the selected interval.'
        : assessment.synthesisAtTick === null ? 'Iodine follows at least 1 hour of thionamide synthesis blockade in this selected pathway; other specialist pathways may differ.'
        : assessment.iodineDueInSeconds === null ? 'The branch ended before an iodine decision was accepted.'
        : assessment.iodineDueInSeconds > 0 ? `Iodine interval: ${Math.ceil(assessment.iodineDueInSeconds / 60)} simulated min remaining. Urgent care and frequent reassessment continue now.`
        : 'At least 1 simulated hour has elapsed after synthesis blockade. Iodine still needs an explicit decision.'}</p>
      <div className="crisis-drug__actions">
        {decision('assess-circulation', 'Assess perfusion and congestion', assessment.circulationAssessedAtTick !== null)}
        {decision('rate-control-review', 'Request individualized rate-control review', assessment.rateControlReviewedAtTick !== null)}
        {decision('blanket-beta-blockade', 'Choose blanket beta blockade for the fast pulse')}
        {decision('iodine', 'Start qualified iodine pathway', assessment.iodineAtTick !== null)}
      </div>
    </section>
    <section className="syringe thyroid-storm__section" aria-labelledby="thyroid-response-title">
      <div id="thyroid-response-title" className="syringe__name">Reassess frequently. Hand off ongoing risk.</div>
      <p className="syringe__remaining">{observation
        ? `Last bedside reassessment at simulated ${Math.floor(observation.atTick / (60 * TICKS_PER_SECOND))} min: temperature ${observation.coreTemperatureC}°C, BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg, HR ${observation.heartRateBpm}/min, RR ${observation.respiratoryRateBpm}/min, SpO₂ ${observation.spo2Percent}%; ${observation.alertness}. This observation can become stale.`
        : 'No new bedside reassessment has been requested. Check temperature, alertness, breathing, and perfusion throughout care.'}</p>
      {assessment.responseDueInSeconds !== null && <p className="syringe__remaining">Authored early partial-support checkpoint in {Math.ceil(assessment.responseDueInSeconds / 60)} simulated min. This 2-hour teaching checkpoint is not a predicted clinical response. Continue frequent assessment; never wait for it if the patient worsens.</p>}
      <p className="syringe__remaining">An improved observation is not recovery. Ongoing thyroid-directed treatment, cardiac and laboratory review, and precipitant care need qualified ownership. No doses or drug kinetics are simulated.</p>
      {earlierChoices.length > 0 && <p className="syringe__remaining">Earlier choices stay in this run: {earlierChoices.join('; ')}.</p>}
      {assessment.urgentCoverageDelayed && <p className="syringe__remaining">An authored deterioration occurred while urgent treatment was incomplete. Repairing the plan does not erase that delay.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: ongoing treatment and risk are handed off. This is not recovery or discharge clearance.'
        : 'Instructor takeover ended this branch. Open the debrief, then try a different decision. The teaching stop does not predict a patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('reassess', 'Reassess temperature, breathing, and perfusion')}
        {decision('handoff', 'Hand off ongoing treatment and risk')}
      </div>
    </section>
  </>;
}
