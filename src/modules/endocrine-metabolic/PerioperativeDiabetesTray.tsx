import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PerioperativeDiabetesSnapshot } from '@platform/kernel/protocol';
import type { PerioperativeDiabetesAction } from './perioperative-diabetes';
import { perioperativeDiabetesInlinePrompt, PERIOPERATIVE_DIABETES_SOURCE_HREF, PERIOPERATIVE_DIABETES_UK_SOURCE_HREF } from './perioperative-diabetes-tutor';

export function PerioperativeDiabetesTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: PerioperativeDiabetesSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: PerioperativeDiabetesAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = perioperativeDiabetesInlinePrompt(guidance, { scenarioVersion, perioperativeDiabetes: assessment });
  const observation = assessment.observation; const glucose = assessment.glucoseObservation;
  const decision = (action: PerioperativeDiabetesAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  const earlierChoices = [assessment.omitInsulinAttempted && 'omitting insulin while fasting',
    assessment.cgmOnlyAttempted && 'relying on CGM alone', assessment.clearanceAttempted && 'automatic surgical clearance'].filter(Boolean);
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Source context: <a href={PERIOPERATIVE_DIABETES_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>ADA 2026</a>{' · '}
      <a href={PERIOPERATIVE_DIABETES_UK_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Association of Anaesthetists and JBDS 2026</a>. Both open in a new tab; individual plans and regional targets can differ.</p>
    <section className="syringe perioperative-diabetes__section" aria-labelledby="perioperative-diabetes-insulin-title">
      <div id="perioperative-diabetes-insulin-title" className="syringe__name">Protect insulin continuity while fasting.</div>
      <p className="syringe__remaining">This patient has type 1 diabetes. Her pump stopped 90 minutes ago without background insulin replacement. The elective operation is delayed beyond one missed meal. Supplied glucose: 180 mg/dL; blood ketones: 0.6 mmol/L. These are historical starting findings, not live measurements.</p>
      <p className="syringe__remaining">Qualified, verified alternative insulin delivery is available now. It does not wait for new laboratory results, support acknowledgment, or a fasting-plan request. This is not a blind pump restart or a fixed insulin route, dose, or rate.</p>
      <p className="syringe__remaining">Insulin continuity: {assessment.insulinAtTick === null ? 'not yet restored' : 'qualified delivery requested'}.</p>
      <div className="crisis-drug__actions">{decision('restore-insulin', 'Restore qualified insulin delivery', assessment.insulinAtTick !== null)}</div>
    </section>
    <section className="syringe perioperative-diabetes__section" aria-labelledby="perioperative-diabetes-plan-title">
      <div id="perioperative-diabetes-plan-title" className="syringe__name">Coordinate the fasting and perioperative plan.</div>
      <p className="syringe__remaining">Support, context review, planning, and surveillance are independent tasks. Individualize insulin, substrate, fluid, electrolyte, theater timing, and postoperative needs. Planning selects no prescription and does not itself change glucose or ketones.</p>
      <p className="syringe__remaining">{assessment.contextReviewedAtTick === null
        ? 'Review the actual insulin-delivery history, prolonged fasting, and supplied metabolic context while care continues.'
        : 'Supplied context: pH 7.38, bicarbonate 24 mmol/L, potassium 4.2 mmol/L, and creatinine 0.8 mg/dL. These are historical findings with no acidosis-response model; new clinical concerns require qualified reassessment.'}</p>
      <p className="syringe__remaining">Team support: {assessment.supportActive ? 'active' : 'not yet called'}. Context review: {assessment.contextReviewedAtTick === null ? 'not recorded' : 'recorded'}. Fasting plan: {assessment.fastingPlanAtTick === null ? 'not requested' : 'requested'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('call-support', 'Call qualified perioperative support', assessment.supportActive)}
        {decision('review-context', 'Review insulin and fasting context', assessment.contextReviewedAtTick !== null)}
        {decision('plan-fasting', 'Plan individualized fasting care', assessment.fastingPlanAtTick !== null)}
        {decision('monitor', 'Arrange blood-glucose and ketone surveillance', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe perioperative-diabetes__section" aria-labelledby="perioperative-diabetes-observation-title">
      <div id="perioperative-diabetes-observation-title" className="syringe__name">Keep glucose and full assessments distinct.</div>
      <p className="syringe__remaining">{glucose
        ? `Last requested blood glucose at simulated ${formatElapsed(glucose.atTick)}: ${glucose.glucoseMgDl} mg/dL. This is a historical measurement; a glucose-only check does not refresh ketones.`
        : 'No new blood-glucose measurement has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: glucose ${observation.glucoseMgDl} mg/dL, blood ketones ${observation.ketonesMmolL.toFixed(1)} mmol/L; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full glucose, ketone, and bedside assessment has been requested. Supplied findings remain historical.'}</p>
      {assessment.earlyDueInSeconds !== null && <p className="syringe__remaining">Authored early assessment checkpoint in {Math.ceil(assessment.earlyDueInSeconds / 60)} simulated min.</p>}
      {assessment.responseDueInSeconds !== null && <p className="syringe__remaining">Authored later assessment checkpoint in {Math.ceil(assessment.responseDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">The 30- and 60-minute contrasts are authored, not predicted insulin kinetics or required clinical waits. Reassess earlier whenever needed. CGM alone or a better glucose result cannot establish the full response, diagnose or exclude ketoacidosis, or automatically clear surgery.</p>
      {assessment.deteriorationObserved && <p className="syringe__remaining">A requested full assessment recorded deterioration. Later care does not erase that observation.</p>}
      {earlierChoices.length > 0 && <p className="syringe__remaining">Earlier choices stay in this run: {earlierChoices.join('; ')}.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: verified insulin continuity and perioperative responsibilities are handed off. This is not surgical clearance or durable safety.'
        : 'Instructor takeover ended this branch. Open the debrief, then try a different response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-glucose', 'Check blood glucose only')}
        {decision('reassess', 'Reassess glucose, ketones, and bedside response')}
        {decision('handoff', 'Hand off insulin continuity and perioperative care')}
        {decision('omit-insulin', 'Omit insulin while fasting')}
        {decision('cgm-only', 'Rely on CGM alone')}
        {decision('clear-surgery', 'Clear surgery automatically')}
      </div>
    </section>
  </>;
}
