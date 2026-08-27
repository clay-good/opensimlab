import { Button } from '@platform/ui';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MyxedemaSnapshot } from '@platform/kernel/protocol';
import type { MyxedemaAction } from './myxedema';
import { myxedemaInlinePrompt, MYXEDEMA_SOURCE_HREF, MYXEDEMA_ATA_SOURCE_HREF } from './tutor/myxedema-guidance';

export function MyxedemaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: MyxedemaSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: MyxedemaAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = myxedemaInlinePrompt(guidance, { scenarioVersion, myxedema: assessment });
  const observation = assessment.observation;
  const decision = (action: MyxedemaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  const earlierChoices = [assessment.oxygenOnlyAtTick !== null && 'oxygen without ventilation',
    assessment.waitForLabsChosen && 'waiting for laboratory confirmation',
    assessment.earlyThyroxineAttempted && 'thyroxine before steroid coverage',
    assessment.rapidRewarmingAttempted && 'rapid rewarming request'].filter(Boolean);
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p>
      <p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining"><a href={MYXEDEMA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Read the 2026 consensus (opens in a new tab)</a>{' · '}
      <a href={MYXEDEMA_ATA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Steroid sequence: ATA 2014 (opens in a new tab)</a></p>
    <section className="syringe myxedema__section" aria-labelledby="myxedema-breathing-title">
      <div id="myxedema-breathing-title" className="syringe__name">Protect breathing. Treat the emergency.</div>
      <p className="syringe__remaining">Current alertness: {assessment.alertness}. Myxedema coma is a severe hypothyroid emergency; the name does not require complete unconsciousness.</p>
      <p className="syringe__remaining">Ventilation moves air to remove carbon dioxide. Oxygen can raise saturation without correcting inadequate ventilation.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. The patient clock keeps running until you pause.'}</p>
      <p className="syringe__remaining">Ventilation: {assessment.ventilationAtTick === null ? 'not started' : 'qualified support started'}. Team support: {assessment.supportActive ? 'active' : 'not yet called'}.</p>
      <div className="crisis-drug__actions">
        {decision('ventilate', 'Start qualified ventilation support', assessment.ventilationAtTick !== null)}
        {decision('call-support', 'Call qualified support', assessment.supportActive)}
        {decision('oxygen-only', 'Use oxygen without ventilation', assessment.oxygenOnlyAtTick !== null || assessment.ventilationAtTick !== null)}
        {decision('wait-for-labs', 'Wait for laboratory confirmation', assessment.ventilationAtTick !== null && assessment.hydrocortisoneAtTick !== null && assessment.levothyroxineAtTick !== null)}
      </div>
    </section>
    <section className="syringe myxedema__section" aria-labelledby="myxedema-treatment-title">
      <div id="myxedema-treatment-title" className="syringe__name">Steroid first. Keep care moving.</div>
      <p className="syringe__remaining">Hydrocortisone provides empiric steroid coverage before IV levothyroxine replaces thyroid hormone. Follow this order without an artificial wait or laboratory gate.</p>
      <p className="syringe__remaining">Steroid: {assessment.hydrocortisoneAtTick === null ? 'not started' : 'started'}. Thyroid replacement: {assessment.levothyroxineAtTick === null ? 'not started' : 'started'}. Supportive care: {assessment.supportiveCareAtTick === null ? 'not started' : 'started'}.</p>
      <p className="syringe__remaining">Supportive care means individualized circulation and temperature management, metabolic review, and treatment of the trigger. No dose, T3 selection, or warming procedure is simulated.</p>
      <div className="crisis-drug__actions">
        {decision('hydrocortisone', 'Start qualified hydrocortisone coverage', assessment.hydrocortisoneAtTick !== null)}
        {decision('levothyroxine', 'Start qualified IV levothyroxine', assessment.levothyroxineAtTick !== null)}
        {decision('supportive-care', 'Start qualified supportive care', assessment.supportiveCareAtTick !== null)}
        {decision('rapid-rewarming', 'Choose rapid rewarming')}
      </div>
    </section>
    <section className="syringe myxedema__section" aria-labelledby="myxedema-response-title">
      <div id="myxedema-response-title" className="syringe__name">Reassess support. Hand off ongoing risk.</div>
      <p className="syringe__remaining">{observation
        ? `Last bedside and blood-gas reassessment at simulated ${Math.floor(observation.atTick / (60 * TICKS_PER_SECOND))} min: temperature ${observation.coreTemperatureC}°C, BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg, HR ${observation.heartRateBpm}/min, RR ${observation.respiratoryRateBpm}/min, SpO₂ ${observation.spo2Percent}%, PaCO₂ ${observation.paco2MmHg} mmHg; ${observation.alertness}. PaCO₂ is arterial carbon dioxide from this requested observation, not a live monitor value. This observation can become stale.`
        : 'No new bedside and blood-gas reassessment has been requested. Check breathing, alertness, circulation, and temperature throughout care.'}</p>
      {assessment.ventilationDueInSeconds !== null && <p className="syringe__remaining">Authored ventilation checkpoint in {assessment.ventilationDueInSeconds} simulated seconds. The 5-minute contrast is not a predicted clinical response.</p>}
      {assessment.responseDueInSeconds !== null && <p className="syringe__remaining">Authored complete-care checkpoint in {Math.ceil(assessment.responseDueInSeconds / 60)} simulated min. This 1-hour partial-support contrast is not thyroid-hormone kinetics.</p>}
      <p className="syringe__remaining">Continue frequent assessment; never wait for a checkpoint if the patient worsens. Supported improvement does not establish independent breathing, recovery, or discharge readiness.</p>
      {earlierChoices.length > 0 && <p className="syringe__remaining">Earlier choices stay in this run: {earlierChoices.join('; ')}.</p>}
      {(assessment.ventilationDelayed || assessment.endocrineTreatmentDelayed) && <p className="syringe__remaining">An authored deterioration occurred while {assessment.ventilationDelayed && assessment.endocrineTreatmentDelayed ? 'ventilation and endocrine treatment were' : assessment.ventilationDelayed ? 'ventilation was' : 'endocrine treatment was'} incomplete. Later treatment does not erase that delay.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: ongoing breathing support, treatment, and risk are handed off. This is not recovery or discharge clearance.'
        : 'Instructor takeover ended this branch. Open the debrief, then try a different decision. The teaching stop does not predict a patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('reassess', 'Reassess breathing, blood gas, and circulation')}
        {decision('handoff', 'Hand off ongoing treatment and risk')}
      </div>
    </section>
  </>;
}
