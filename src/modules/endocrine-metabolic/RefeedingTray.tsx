import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RefeedingSnapshot } from '@platform/kernel/protocol';
import type { RefeedingAction } from './refeeding';
import { refeedingInlinePrompt, REFEEDING_SOURCE_HREF, REFEEDING_ALTERNATIVE_SOURCE_HREF } from './refeeding-tutor';

export function RefeedingTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RefeedingSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: RefeedingAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = refeedingInlinePrompt(guidance, { scenarioVersion, refeeding: assessment });
  const observation = assessment.observation;
  const decision = (action: RefeedingAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  const earlierChoices = [assessment.feedingAdvanceAttempted && 'automatic feeding advancement',
    assessment.monitoringStopAttempted && 'premature monitoring closure'].filter(Boolean);
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Source context: <a href={REFEEDING_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>ASPEN 2020</a>{' · '}
      <a href={REFEEDING_ALTERNATIVE_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>AuSPEN 2025</a>. Both open in a new tab; their feeding recommendations differ.</p>
    <section className="syringe refeeding__section" aria-labelledby="refeeding-electrolytes-title">
      <div id="refeeding-electrolytes-title" className="syringe__name">Address the whole electrolyte picture.</div>
      <p className="syringe__remaining">Nutrition restarted 30 hours ago after 10 days of negligible intake. Supplied prefeeding phosphate/potassium/magnesium: 1.00/3.8/0.80 mmol/L; supplied current values: 0.30/2.7/0.48 mmol/L. These are historical starting findings, not live laboratory measurements.</p>
      <p className="syringe__remaining">Qualified phosphate, potassium, and magnesium care is available now. A phosphate-only request is valid partial care, not complete rescue. New laboratory results, context review, or support acknowledgment must not delay urgent treatment.</p>
      <p className="syringe__remaining">Comprehensive electrolyte care: {assessment.completeElectrolytesAtTick === null ? 'not requested' : 'requested'}. Phosphate care: {assessment.phosphateAtTick === null ? 'not separately requested' : 'requested'}.</p>
      <div className="crisis-drug__actions">
        {decision('replace-electrolytes', 'Request comprehensive electrolyte care', assessment.completeElectrolytesAtTick !== null)}
        {decision('phosphate-only', 'Request phosphate-only care', assessment.phosphateAtTick !== null || assessment.completeElectrolytesAtTick !== null)}
      </div>
    </section>
    <section className="syringe refeeding__section" aria-labelledby="refeeding-nutrition-title">
      <div id="refeeding-nutrition-title" className="syringe__name">Coordinate vitamins, nutrition, and surveillance.</div>
      <p className="syringe__remaining">Thiamine administration is not documented. Arrange qualified support while reviewing all calorie sources, medication carriers, fluid balance, and ongoing nutritional needs. Each care request is independent.</p>
      <p className="syringe__remaining">Nutrition review prevents automatic advancement during this severe decline. It selects neither a universal feeding rate nor stopping all nutrition. No replacement dose, route, infusion, or calorie calculation is selected.</p>
      <p className="syringe__remaining">{assessment.contextReviewedAtTick === null
        ? 'Review the supplied feeding timeline, prior electrolytes, vitamin record, and alternative causes. Not every low phosphate result establishes refeeding syndrome.'
        : 'Supplied context: creatinine 0.8 mg/dL and glucose 126 mg/dL; neither has a response model. Alternative causes and renal function still require qualified review. This is an established feeding-associated concern, not a diagnostic score.'}</p>
      <p className="syringe__remaining">Thiamine: {assessment.thiamineAtTick === null ? 'not requested' : 'requested'}. Nutrition plan: {assessment.nutritionPlanAtTick === null ? 'not requested' : 'requested'}. Team support: {assessment.supportActive ? 'active' : 'not yet called'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('thiamine', 'Request qualified thiamine support', assessment.thiamineAtTick !== null)}
        {decision('review-nutrition', 'Review the individualized nutrition plan', assessment.nutritionPlanAtTick !== null)}
        {decision('call-support', 'Call qualified support', assessment.supportActive)}
        {decision('review-context', 'Review feeding and electrolyte context', assessment.contextReviewedAtTick !== null)}
        {decision('monitor', 'Arrange serial electrolytes and bedside checks', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe refeeding__section" aria-labelledby="refeeding-observation-title">
      <div id="refeeding-observation-title" className="syringe__name">Reassess the trajectory. Hand off continuing care.</div>
      <p className="syringe__remaining">{observation
        ? `Last requested assessment at simulated ${formatElapsed(observation.atTick)}: phosphate ${observation.phosphateMmolL.toFixed(2)} mmol/L, potassium ${observation.potassiumMmolL.toFixed(1)} mmol/L, magnesium ${observation.magnesiumMmolL.toFixed(2)} mmol/L; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new electrolyte and bedside reassessment has been requested. The supplied findings remain historical.'}</p>
      {assessment.electrolyteDueInSeconds !== null && <p className="syringe__remaining">Authored electrolyte checkpoint in {Math.ceil(assessment.electrolyteDueInSeconds / 60)} simulated min.</p>}
      {assessment.responseDueInSeconds !== null && <p className="syringe__remaining">Authored combined-care checkpoint in {Math.ceil(assessment.responseDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">These 30- and 60-minute contrasts are not predicted kinetics or required clinical waits. Reassess earlier whenever needed. An early improvement may not be sustained; partial response is not normalization or discharge clearance.</p>
      {assessment.recurrentDeclineObserved && <p className="syringe__remaining">A requested assessment recorded recurrent decline. Later care does not erase that observation.</p>}
      {earlierChoices.length > 0 && <p className="syringe__remaining">Earlier choices stay in this run: {earlierChoices.join('; ')}.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: continuing nutrition, supplementation, and surveillance are handed off. This is not durable safety or discharge clearance.'
        : 'Instructor takeover ended this branch. Open the debrief, then try a different response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('reassess', 'Reassess electrolytes and bedside response')}
        {decision('handoff', 'Hand off nutrition and electrolyte surveillance')}
        {decision('advance-feeding', 'Advance feeding automatically')}
        {decision('stop-monitoring', 'Stop electrolyte monitoring now')}
      </div>
    </section>
  </>;
}
