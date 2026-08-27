import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHyperkalemiaSnapshot } from '@platform/kernel/protocol';
import type { RenalHyperkalemiaAction } from './hyperkalemia';
import { renalHyperkalemiaInlinePrompt, RENAL_HYPERKALEMIA_SOURCE_HREF, RENAL_HYPERKALEMIA_KDIGO_SOURCE_HREF } from './renal-hyperkalemia-tutor';

export function RenalHyperkalemiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalHyperkalemiaSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalHyperkalemiaAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalHyperkalemiaInlinePrompt(guidance, { scenarioVersion, renalHyperkalemia: assessment });
  const observation = assessment.observation; const ecg = assessment.ecgObservation; const glucose = assessment.glucoseObservation;
  const rhythmLabel = (rhythm: string) => rhythm === 'hyperkalemic-conduction' ? 'supplied conduction abnormality' : 'authored ECG improvement';
  const decision = (action: RenalHyperkalemiaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Source context: <a href={RENAL_HYPERKALEMIA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>UK Kidney Association</a>{' · '}
      <a href={RENAL_HYPERKALEMIA_KDIGO_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>KDIGO conference report</a>. Both open in a new tab; treatment must be individualized.</p>
    <section className="syringe renal-hyperkalemia__section" aria-labelledby="renal-hyperkalemia-urgent-title">
      <div id="renal-hyperkalemia-urgent-title" className="syringe__name">Protect the heart. Address potassium.</div>
      <p className="syringe__remaining">Supplied potassium: 6.9 mmol/L from a confirmed nonhemolyzed sample; blood glucose: 108 mg/dL; new qualitative ECG conduction change. These are historical starting findings. This patient has chronic kidney disease with acute kidney injury after dehydration.</p>
      <p className="syringe__remaining">Qualified cardioprotection, shifting, and removal are available independently. Calcium does not lower potassium. A better ECG is not proof of potassium control. No treatment waits for review, support acknowledgment, or another laboratory click.</p>
      <p className="syringe__remaining">Calcium requests: {assessment.calciumRequests}. Shifting treatment: {assessment.shiftAtTick === null ? 'not yet requested' : 'requested'}. Calcium can be requested again after reassessment; repeated care selects no fixed dose or schedule.</p>
      <div className="crisis-drug__actions">
        {decision('calcium', 'Request qualified calcium cardioprotection')}
        {decision('shift', 'Request qualified potassium shifting', assessment.shiftAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-hyperkalemia__section" aria-labelledby="renal-hyperkalemia-removal-title">
      <div id="renal-hyperkalemia-removal-title" className="syringe__name">Separate a plan from delivered removal.</div>
      <p className="syringe__remaining">Review kidney function, medications including lisinopril, volume status, and treatment suitability. Planning has no potassium effect. Qualified removal delivery is distinct and does not mean automatic dialysis or a universal modality.</p>
      <p className="syringe__remaining">Support: {assessment.supportActive ? 'active' : 'not yet called'}. Context review: {assessment.contextReviewedAtTick === null ? 'not recorded' : 'recorded'}. Removal plan: {assessment.removalPlanAtTick === null ? 'not requested' : 'requested'}. Delivered removal: {assessment.removalAtTick === null ? 'not confirmed' : 'confirmed'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('call-support', 'Call qualified acute-care and kidney support', assessment.supportActive)}
        {decision('review-context', 'Review kidney, sample, and medication context', assessment.contextReviewedAtTick !== null)}
        {decision('plan-removal', 'Plan individualized potassium removal', assessment.removalPlanAtTick !== null)}
        {decision('deliver-removal', 'Confirm qualified removal treatment delivered', assessment.removalAtTick !== null)}
        {decision('monitor', 'Arrange potassium, ECG, and glucose surveillance', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-hyperkalemia__section" aria-labelledby="renal-hyperkalemia-observation-title">
      <div id="renal-hyperkalemia-observation-title" className="syringe__name">Read each finding at its own time.</div>
      <p className="syringe__remaining">{ecg
        ? `Last requested ECG at simulated ${formatElapsed(ecg.atTick)}: ${rhythmLabel(ecg.rhythm)}. An ECG-only check does not refresh potassium.`
        : 'No new ECG assessment has been requested.'}</p>
      <p className="syringe__remaining">{glucose
        ? `Last requested blood glucose at simulated ${formatElapsed(glucose.atTick)}: ${glucose.glucoseMgDl} mg/dL. A glucose-only check does not refresh potassium.`
        : 'No new blood-glucose measurement has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: potassium ${observation.potassiumMmolL.toFixed(1)} mmol/L; blood glucose ${observation.glucoseMgDl} mg/dL; ${rhythmLabel(observation.rhythm)}; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full potassium, glucose, ECG, and bedside assessment has been requested.'}</p>
      {assessment.shiftDueInSeconds !== null && <p className="syringe__remaining">Authored shifting checkpoint in {Math.ceil(assessment.shiftDueInSeconds / 60)} simulated min.</p>}
      {assessment.removalDueInSeconds !== null && <p className="syringe__remaining">Authored removal checkpoint in {Math.ceil(assessment.removalDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">The 30- and 60-minute response contrasts, 45-minute calcium benefit, and 150-minute rebound branch are authored, not predicted kinetics or safe waiting intervals. Reassess earlier whenever needed. ECG appearance does not establish a potassium concentration; the waveform is not calibrated to QRS duration. No arrhythmia, injury, or durable recovery is predicted.</p>
      {assessment.reboundObserved && <p className="syringe__remaining">A full assessment recorded rebound. Later treatment does not erase that observation.</p>}
      {(assessment.ecgResolvedAttempted || assessment.glucoseMonitoringStopAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: active risks and continuing surveillance are handed off. This is not discharge readiness or durable safety.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-ecg', 'Check ECG only')}{decision('check-glucose', 'Check blood glucose only')}
        {decision('reassess', 'Reassess potassium, glucose, ECG, and bedside response')}
        {decision('handoff', 'Hand off treatment and continuing surveillance')}
        {decision('ecg-resolved', 'Treat ECG improvement as resolution')}
        {decision('stop-glucose-monitoring', 'Stop glucose monitoring')}
      </div>
    </section>
  </>;
}
