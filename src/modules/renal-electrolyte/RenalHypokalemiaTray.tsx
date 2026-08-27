import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHypokalemiaSnapshot } from '@platform/kernel/protocol';
import type { RenalHypokalemiaAction } from './hypokalemia';
import { renalHypokalemiaInlinePrompt, RENAL_HYPOKALEMIA_SOURCE_HREF, RENAL_HYPOKALEMIA_MAGNESIUM_SOURCE_HREF } from './renal-hypokalemia-tutor';

export function RenalHypokalemiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalHypokalemiaSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalHypokalemiaAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalHypokalemiaInlinePrompt(guidance, { scenarioVersion, renalHypokalemia: assessment });
  const observation = assessment.observation; const ecg = assessment.ecgObservation; const potassium = assessment.potassiumObservation;
  const rhythmLabel = (rhythm: string) => rhythm === 'sinus' ? 'authored ECG improvement' : 'supplied flattened-T pattern';
  const decision = (action: RenalHypokalemiaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Source context: <a href={RENAL_HYPOKALEMIA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>NHS SPS potassium guidance</a>{' · '}
      <a href={RENAL_HYPOKALEMIA_MAGNESIUM_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>NHS SPS magnesium guidance</a>. Both open in a new tab; treatment must be individualized.</p>
    <section className="syringe renal-hypokalemia__section" aria-labelledby="renal-hypokalemia-care-title">
      <div id="renal-hypokalemia-care-title" className="syringe__name">Address potassium and magnesium together.</div>
      <p className="syringe__remaining">Supplied potassium: 2.3 mmol/L; magnesium: 0.40 mmol/L; qualitative flattened-T ECG pattern. These are historical starting findings. This patient has four days of diarrhea and takes hydrochlorothiazide.</p>
      <p className="syringe__remaining">Qualified potassium and magnesium care are available independently. Neither waits for the other, review, support acknowledgment, or another laboratory click. This lesson prescribes no dose, route, concentration, or infusion rate.</p>
      <p className="syringe__remaining">Potassium care: {assessment.potassiumAtTick === null ? 'not yet requested' : 'requested'}. Magnesium care: {assessment.magnesiumAtTick === null ? 'not yet requested' : 'requested'}.</p>
      <div className="crisis-drug__actions">
        {decision('potassium', 'Request qualified potassium replacement', assessment.potassiumAtTick !== null)}
        {decision('magnesium', 'Request qualified magnesium replacement', assessment.magnesiumAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-hypokalemia__section" aria-labelledby="renal-hypokalemia-loss-title">
      <div id="renal-hypokalemia-loss-title" className="syringe__name">Continue care for ongoing losses.</div>
      <p className="syringe__remaining">Coordinate actual replacement of ongoing losses and management of contributors, including medication review. This is delivered qualified care, not just planning, and does not instantly stop diarrhea. Supplied creatinine is 1.1 mg/dL; kidney function is historical context, not an evolving clearance model.</p>
      <p className="syringe__remaining">Support: {assessment.supportActive ? 'active' : 'not yet called'}. Context review: {assessment.contextReviewedAtTick === null ? 'not recorded' : 'recorded'}. Ongoing-loss care: {assessment.lossManagementAtTick === null ? 'not yet delivered' : 'delivered'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('call-support', 'Call qualified acute-care support', assessment.supportActive)}
        {decision('review-context', 'Review electrolyte, medication, and loss context', assessment.contextReviewedAtTick !== null)}
        {decision('manage-losses', 'Deliver individualized ongoing-loss care', assessment.lossManagementAtTick !== null)}
        {decision('monitor', 'Arrange electrolyte and ECG surveillance', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-hypokalemia__section" aria-labelledby="renal-hypokalemia-observation-title">
      <div id="renal-hypokalemia-observation-title" className="syringe__name">Keep partial checks and full findings distinct.</div>
      <p className="syringe__remaining">{potassium
        ? `Last requested potassium at simulated ${formatElapsed(potassium.atTick)}: ${potassium.potassiumMmolL.toFixed(1)} mmol/L. A potassium-only check does not refresh magnesium or the full assessment.`
        : 'No new potassium-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{ecg
        ? `Last requested ECG at simulated ${formatElapsed(ecg.atTick)}: ${rhythmLabel(ecg.rhythm)}. An ECG-only check does not refresh electrolytes.`
        : 'No new ECG assessment has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: potassium ${observation.potassiumMmolL.toFixed(1)} mmol/L; magnesium ${observation.magnesiumMmolL.toFixed(2)} mmol/L; ${rhythmLabel(observation.rhythm)}; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full potassium, magnesium, ECG, and bedside assessment has been requested.'}</p>
      {(assessment.potassiumDueInSeconds !== null || assessment.magnesiumDueInSeconds !== null) && <p className="syringe__remaining">An authored partial-response checkpoint is pending. Clinical reassessment need not wait for it.</p>}
      {assessment.responseDueInSeconds !== null && <p className="syringe__remaining">Authored combined-response checkpoint in {Math.ceil(assessment.responseDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">The 30-minute partial responses, 60-minute combined response, and 120-minute recurrence contrast are authored, not predicted replacement kinetics or safe waiting intervals. ECG appearance does not establish electrolyte concentrations; this waveform supplies no U-wave or QTc measurement. No arrhythmia, injury, or durable recovery is predicted.</p>
      {assessment.recurrenceObserved && <p className="syringe__remaining">A full assessment recorded recurrent depletion. Later treatment does not erase that observation.</p>}
      {(assessment.rapidPotassiumAttempted || assessment.monitoringStopAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: active risks and continuing electrolyte surveillance are handed off. This is not discharge readiness or durable safety.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-potassium', 'Check potassium only')}{decision('check-ecg', 'Check ECG only')}
        {decision('reassess', 'Reassess potassium, magnesium, ECG, and bedside response')}
        {decision('handoff', 'Hand off replacement and continuing surveillance')}
        {decision('rapid-potassium', 'Give rapid unmonitored potassium')}
        {decision('stop-monitoring', 'Stop electrolyte and ECG monitoring')}
      </div>
    </section>
  </>;
}
