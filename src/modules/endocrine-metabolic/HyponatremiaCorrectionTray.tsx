import { Button } from '@platform/ui';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HyponatremiaCorrectionSnapshot } from '@platform/kernel/protocol';
import type { HyponatremiaCorrectionAction } from './hyponatremia-correction';
import { hyponatremiaCorrectionInlinePrompt, HYPONATREMIA_CORRECTION_SOURCE_HREF,
  HYPONATREMIA_CORRECTION_LIMITS_SOURCE_HREF } from './hyponatremia-correction-tutor';

export function HyponatremiaCorrectionTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: HyponatremiaCorrectionSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: HyponatremiaCorrectionAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = hyponatremiaCorrectionInlinePrompt(guidance, { scenarioVersion, hyponatremiaCorrection: assessment });
  const observation = assessment.observation;
  const decision = (action: HyponatremiaCorrectionAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  const earlierChoices = [assessment.normalizationAttempted && 'aiming for immediate normalization',
    assessment.symptomWaitChosen && 'waiting for symptoms'].filter(Boolean);
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining"><a href={HYPONATREMIA_CORRECTION_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Emergency guidance: SfE 2022 (opens in a new tab)</a>{' · '}
      <a href={HYPONATREMIA_CORRECTION_LIMITS_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Correction limits: Sterns et al. 2024 (opens in a new tab)</a></p>
    <section className="syringe sodium-correction__section" aria-labelledby="sodium-correction-window-title">
      <div id="sodium-correction-window-title" className="syringe__name">Keep the original correction window.</div>
      <p className="syringe__remaining">Original sodium: 106 mmol/L. Supplied post-rescue sodium: 111 mmol/L after one hour, a rise of 5. This lesson starts at correction-hour 1; the window does not restart. The seizure has stopped, hypertonic saline is off, and the thiazide has been withheld.</p>
      <p className="syringe__remaining">Selected high-risk teaching plan: a 4–6 mmol/L daily goal and no more than 8 mmol/L in any 24 hours, counted from the original value. Do not aim for immediate normalization. This plan is not a universal regional prescription.</p>
      <p className="syringe__remaining">{assessment.riskReviewedAtTick === null
        ? 'Review the supplied risk, potassium, nutrition, and cause context with the qualified team.'
        : 'Supplied context: malnutrition, alcohol-use disorder, potassium 2.7 mmol/L, unknown hyponatremia duration, recent thiazide use, and poor intake. Potassium care contributes to correction. These possible causes do not prove SIADH; no potassium dose or kinetics is selected.'}</p>
      <p className="syringe__remaining">Risk review: {assessment.riskReviewedAtTick === null ? 'not recorded' : 'recorded'}. Team support: {assessment.supportActive ? 'active' : 'not yet called'}. Serial surveillance: {assessment.monitoringAtTick === null ? 'not yet arranged' : 'arranged'}.</p>
      <div className="crisis-drug__actions">
        {decision('review-risk', 'Review correction window and risk', assessment.riskReviewedAtTick !== null)}
        {decision('call-support', 'Call qualified support', assessment.supportActive)}
        {decision('monitor', 'Arrange serial sodium and urine checks', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe sodium-correction__section" aria-labelledby="sodium-correction-response-title">
      <div id="sodium-correction-response-title" className="syringe__name">Observe. Respond to the result.</div>
      <p className="syringe__remaining">{observation
        ? `Last requested assessment at simulated ${Math.floor(observation.atTick / (60 * TICKS_PER_SECOND))} min (${60 + Math.floor(observation.atTick / (60 * TICKS_PER_SECOND))} min after the original sodium): sodium ${observation.sodiumMmolL} mmol/L, total rise ${observation.sodiumMmolL - 106} mmol/L; urine output ${observation.urineOutputMlPerHour} mL/hour; ${observation.alertness}. This result is historical and can become stale; it is not a live sodium monitor.`
        : 'No new sodium and urine-output assessment has been requested. The supplied hour-1 result is historical, not a live measurement.'}</p>
      <p className="syringe__remaining">Highest supplied or requested sodium: {assessment.peakObservedSodiumMmolL} mmol/L, a rise of {assessment.peakObservedSodiumMmolL - 106} from the original 106. A later lower result does not erase this peak.</p>
      <p className="syringe__remaining">Reactive water-loss management follows observed water diuresis. After observed excessive correction, request expert-directed relowering as well; either response may be requested first. Neither waits for administrative acknowledgments. Prophylactic clamp strategies are outside this lesson, not declared wrong.</p>
      <p className="syringe__remaining">Water-loss management: {assessment.waterLossControlAtTick === null ? 'not requested' : 'requested'}. Relowering: {assessment.reloweringAtTick === null ? 'not requested' : 'requested'}. No fluid or desmopressin dose is selected.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your next observation or response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('reassess', 'Reassess sodium and urine output')}
        {decision('control-water-loss', 'Request qualified water-loss management', assessment.waterLossControlAtTick !== null)}
        {decision('relower', 'Request expert-directed relowering', assessment.reloweringAtTick !== null)}
      </div>
    </section>
    <section className="syringe sodium-correction__section" aria-labelledby="sodium-correction-handoff-title">
      <div id="sodium-correction-handoff-title" className="syringe__name">Carry the whole record forward.</div>
      {assessment.responseDueInSeconds !== null && <p className="syringe__remaining">Authored reassessment checkpoint in {Math.ceil(assessment.responseDueInSeconds / 60)} simulated min. This 60-minute teaching checkpoint does not establish a response or predict treatment kinetics.</p>}
      <p className="syringe__remaining">Continue frequent sodium, urine-output, potassium, neurologic, and cause surveillance. Never wait for new symptoms or an authored checkpoint to reassess. The receiving team owns the continuing 24–48-hour plan; no result here proves lasting safety or prevention of osmotic demyelination.</p>
      {earlierChoices.length > 0 && <p className="syringe__remaining">Earlier choices stay in this run: {earlierChoices.join('; ')}.</p>}
      {assessment.overcorrectionObserved && <p className="syringe__remaining">An excessive rise was observed. Later care does not erase that correction history.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the correction window, observed peak, response requests, and continuing risks are handed off. This is not recovery or discharge clearance.'
        : 'Instructor takeover ended this branch. Open the debrief, then try a different decision. This teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('handoff', 'Hand off correction history and continuing care')}
        {decision('normalize-now', 'Aim for normal sodium now')}
        {decision('wait-for-symptoms', 'Wait for new symptoms')}
      </div>
    </section>
  </>;
}
