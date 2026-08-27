import { Button } from '@platform/ui';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HypercalcemiaSnapshot } from '@platform/kernel/protocol';
import type { HypercalcemiaAction } from './hypercalcemia';
import { hypercalcemiaInlinePrompt, HYPERCALCEMIA_SOURCE_HREF, HYPERCALCEMIA_ES_SOURCE_HREF } from './tutor/hypercalcemia-guidance';

export function HypercalcemiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: HypercalcemiaSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: HypercalcemiaAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = hypercalcemiaInlinePrompt(guidance, { scenarioVersion, hypercalcemia: assessment });
  const observation = assessment.observation;
  const decision = (action: HypercalcemiaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  const earlierChoices = [assessment.unrestrictedFluidsAttempted && 'unrestricted fluids',
    assessment.routineDiureticAttempted && 'routine loop diuretic',
    assessment.waitForCauseChosen && 'waiting for the cause investigation'].filter(Boolean);
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p>
      <p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining"><a href={HYPERCALCEMIA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Emergency guidance: SfE 2016 (opens in a new tab)</a>{' · '}
      <a href={HYPERCALCEMIA_ES_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Malignancy guidance: ES 2023 (opens in a new tab)</a></p>
    <section className="syringe hypercalcemia__section" aria-labelledby="hypercalcemia-volume-title">
      <div id="hypercalcemia-volume-title" className="syringe__name">Support circulation. Respect fluid tolerance.</div>
      <p className="syringe__remaining">Current alertness: {assessment.alertness}. This fictional patient has malignancy-related hypercalcemia, dehydration, heart failure with preserved ejection fraction (HFpEF), and chronic kidney disease (CKD) stage 3b. Supplied creatinine is 2.2 mg/dL, above a 1.4 mg/dL baseline.</p>
      <p className="syringe__remaining">Supplied initial adjusted calcium: 16.4 mg/dL. This is the starting laboratory result, not a current calcium reading.</p>
      <p className="syringe__remaining">Qualified hydration includes immediate volume and cardiac assessment. It can start before the separate cardiorenal review; no fluid volume or infusion rate is selected here.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. The patient clock keeps running until you pause.'}</p>
      <p className="syringe__remaining">Hydration: {assessment.fluidsAtTick === null ? 'not started' : 'individualized support started'}. Team support: {assessment.supportActive ? 'active' : 'not yet called'}.</p>
      <div className="crisis-drug__actions">
        {decision('tailored-fluids', 'Start qualified tailored hydration', assessment.fluidsAtTick !== null)}
        {decision('call-support', 'Call qualified support', assessment.supportActive)}
        {decision('unrestricted-fluids', 'Choose unrestricted fluids')}
        {decision('routine-diuretic', 'Add a routine loop diuretic')}
      </div>
      <p className="syringe__remaining">A loop diuretic is not routine calcium-lowering care. A qualified team may use one for fluid overload; that individualized decision is not simulated.</p>
    </section>
    <section className="syringe hypercalcemia__section" aria-labelledby="hypercalcemia-treatment-title">
      <div id="hypercalcemia-treatment-title" className="syringe__name">Bridge now. Plan beyond the bridge.</div>
      <p className="syringe__remaining">Calcitonin is a short bridge; antiresorptive treatment acts more slowly on calcium release from bone. Arrange both without waiting for hydration to finish. The qualified team selects the antiresorptive after reviewing renal risk.</p>
      <p className="syringe__remaining">Cardiorenal review: {assessment.cardiorenalAssessedAtTick === null ? 'not yet recorded' : 'recorded'}. Calcitonin: {assessment.calcitoninAtTick === null ? 'not started' : 'started'}. Antiresorptive pathway: {assessment.antiresorptiveAtTick === null ? 'not started' : 'started'}.</p>
      <p className="syringe__remaining">Calcitonin is limited to 48–72 hours because its effect wanes. No drug dose or antiresorptive agent is selected in this lesson. Investigating the cause continues alongside urgent treatment.</p>
      <div className="crisis-drug__actions">
        {decision('calcitonin', 'Start qualified calcitonin bridge', assessment.calcitoninAtTick !== null)}
        {decision('assess-cardiorenal', 'Review cardiac and renal risk', assessment.cardiorenalAssessedAtTick !== null)}
        {decision('antiresorptive', 'Start qualified antiresorptive pathway', assessment.antiresorptiveAtTick !== null)}
        {decision('wait-for-cause', 'Wait for the cause investigation', assessment.fluidsAtTick !== null && assessment.calcitoninAtTick !== null)}
      </div>
    </section>
    <section className="syringe hypercalcemia__section" aria-labelledby="hypercalcemia-response-title">
      <div id="hypercalcemia-response-title" className="syringe__name">Observe the response. Hand off ownership.</div>
      <p className="syringe__remaining">{observation
        ? `Last requested assessment at simulated ${Math.floor(observation.atTick / (60 * TICKS_PER_SECOND))} min: adjusted calcium ${observation.adjustedCalciumMgDl} mg/dL, BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg, HR ${observation.heartRateBpm}/min, RR ${observation.respiratoryRateBpm}/min, SpO₂ ${observation.spo2Percent}%, temperature ${observation.coreTemperatureC}°C; ${observation.alertness}. Fluid tolerance: ${observation.fluidTolerance}. Calcium belongs to this requested result, not a live monitor. This observation can become stale.`
        : 'No new bedside and calcium reassessment has been requested. Review mental status, circulation, breathing, and fluid tolerance throughout care.'}</p>
      {assessment.fluidDueInSeconds !== null && <p className="syringe__remaining">Authored fluid checkpoint in {Math.ceil(assessment.fluidDueInSeconds / 60)} simulated min. The 15-minute circulation contrast does not establish calcium correction.</p>}
      {assessment.bridgeDueInSeconds !== null && <p className="syringe__remaining">Authored bridge checkpoint in {Math.ceil(assessment.bridgeDueInSeconds / 60)} simulated min. The 4-hour partial calcium contrast is not predicted treatment kinetics or an antiresorptive response.</p>}
      <p className="syringe__remaining">Continue frequent assessment; never wait for a checkpoint if the patient worsens. These are authored teaching states, not predicted physiology. Partial improvement does not establish recovery or discharge readiness.</p>
      {earlierChoices.length > 0 && <p className="syringe__remaining">Earlier choices stay in this run: {earlierChoices.join('; ')}.</p>}
      {assessment.urgentTreatmentDelayed && <p className="syringe__remaining">An urgent-treatment omission was recorded at an authored checkpoint. Later treatment does not erase that delay.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: ongoing treatment, serial calcium, fluid tolerance, and cancer care are handed off. This is not recovery or discharge clearance.'
        : 'Instructor takeover ended this branch. Open the debrief, then try a different decision. The teaching stop does not predict a patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('reassess', 'Reassess calcium, circulation, and fluid tolerance')}
        {decision('handoff', 'Hand off ongoing treatment and risk')}
      </div>
    </section>
  </>;
}
