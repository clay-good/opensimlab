import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHypernatremiaSnapshot } from '@platform/kernel/protocol';
import type { RenalHypernatremiaAction } from './hypernatremia';
import { renalHypernatremiaInlinePrompt, RENAL_HYPERNATREMIA_SOURCE_HREF } from './renal-hypernatremia-tutor';

export function RenalHypernatremiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalHypernatremiaSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalHypernatremiaAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalHypernatremiaInlinePrompt(guidance, { scenarioVersion, renalHypernatremia: assessment });
  const observation = assessment.observation; const sodium = assessment.sodiumObservation; const balance = assessment.fluidBalanceObservation;
  const fluidBalance = (value: { urineOutputMlPerHour: number; ongoingDiarrhea: boolean }) =>
    `urine output ${value.urineOutputMlPerHour} mL/hour; ongoing diarrhea ${value.ongoingDiarrhea ? 'present' : 'absent'}`;
  const decision = (action: RenalHypernatremiaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected source: <a href={RENAL_HYPERNATREMIA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Yun et al. 2023 review</a> (opens in a new tab). This review informs the lesson; it is not a dosing protocol.</p>
    <section className="syringe renal-hypernatremia__section" aria-labelledby="renal-hypernatremia-volume-title">
      <div id="renal-hypernatremia-volume-title" className="syringe__name">Restore circulation. Keep water needs distinct.</div>
      <p className="syringe__remaining">Supplied sodium: 164 mmol/L. The patient is awake, thirsty, and fatigued with BP 88/52 mmHg and urine output 20 mL/hour. These are historical starting findings; sodium duration is unknown.</p>
      <p className="syringe__remaining">Qualified circulation rescue is available immediately, without review or another laboratory click. After its circulation response, water replacement and ongoing-loss care are available independently of new measurements or administrative steps. No dose, route, or correction rate is prescribed.</p>
      <p className="syringe__remaining">Circulation rescue: {assessment.volumeAtTick === null ? 'not yet requested' : 'requested'}. Water replacement: {assessment.waterAtTick === null ? 'not yet requested' : 'requested'}. Ongoing-loss care: {assessment.lossManagementAtTick === null ? 'not yet delivered' : 'delivered'}.</p>
      <div className="crisis-drug__actions">
        {decision('restore-volume', 'Request qualified circulation restoration', assessment.volumeAtTick !== null)}
        {decision('replace-water', 'Request qualified water replacement', assessment.waterAtTick !== null)}
        {decision('manage-losses', 'Deliver qualified ongoing-loss care', assessment.lossManagementAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-hypernatremia__section" aria-labelledby="renal-hypernatremia-access-title">
      <div id="renal-hypernatremia-access-title" className="syringe__name">Make safe access part of care.</div>
      <p className="syringe__remaining">{assessment.contextReviewedAtTick === null
        ? 'Review three days of diarrhea, physical water-access barriers, assistance needs, and the supplied blood and urine results.'
        : 'Supplied historical context: potassium 3.7 mmol/L, glucose 108 mg/dL, serum osmolality 348 mOsm/kg, urine osmolality 850 mOsm/kg, and urine sodium 12 mmol/L. Concentrated urine does not establish AVP deficiency or exclude every other cause. These are not new measurements.'}</p>
      <p className="syringe__remaining">Deliver safe individualized water access and assistance at any time, using an appropriate route rather than forced oral intake. Access support is not a gate for the modeled sodium response. Ongoing-loss care does not instantly stop diarrhea.</p>
      <p className="syringe__remaining">Support: {assessment.supportActive ? 'active' : 'not yet called'}. Context review: {assessment.contextReviewedAtTick === null ? 'not recorded' : 'recorded'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}. Safe access: {assessment.waterAccessAtTick === null ? 'not yet delivered' : 'delivered'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('assist-water-access', 'Deliver safe water access and assistance', assessment.waterAccessAtTick !== null)}
        {decision('call-support', 'Call qualified acute-care and specialist support', assessment.supportActive)}
        {decision('review-context', 'Review water access, losses, and supplied context', assessment.contextReviewedAtTick !== null)}
        {decision('monitor', 'Arrange sodium and fluid-balance surveillance', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-hypernatremia__section" aria-labelledby="renal-hypernatremia-observation-title">
      <div id="renal-hypernatremia-observation-title" className="syringe__name">Reassess sodium and continuing losses together.</div>
      <p className="syringe__remaining">{sodium
        ? `Last requested sodium at simulated ${formatElapsed(sodium.atTick)}: ${sodium.sodiumMmolL} mmol/L (${sodium.changeFromBaselineMmolL} from the original 164). A sodium-only check does not refresh fluid balance or the full assessment.`
        : 'No new sodium-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{balance
        ? `Last requested fluid balance at simulated ${formatElapsed(balance.atTick)}: ${fluidBalance(balance)}. A fluid-balance-only check does not refresh sodium.`
        : 'No new fluid-balance-only assessment has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: sodium ${observation.sodiumMmolL} mmol/L (${observation.changeFromBaselineMmolL} from the original 164); ${fluidBalance(observation)}; ${observation.alertness}; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg. These are historical observations, not live measurements.`
        : 'No new full sodium, fluid-balance, and bedside assessment has been requested.'}</p>
      {assessment.volumeDueInSeconds !== null && <p className="syringe__remaining">Authored circulation checkpoint in {Math.ceil(assessment.volumeDueInSeconds / 60)} simulated min.</p>}
      {assessment.waterDueInSeconds !== null && <p className="syringe__remaining">Authored water-response checkpoint in {Math.ceil(assessment.waterDueInSeconds / 60)} simulated min.</p>}
      {assessment.combinedDueInSeconds !== null && <p className="syringe__remaining">Authored combined-care checkpoint in {Math.ceil(assessment.combinedDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">The 15-minute, two-hour, and four-hour contrasts are authored, not predicted kinetics or required clinical waits. Better circulation does not prove sodium correction. Earlier panels need not be recreated; handoff needs current full findings and ownership of continuing care, not normal sodium.</p>
      {assessment.recurrenceObserved && <p className="syringe__remaining">A full assessment recorded recurrence with continuing losses. Keep that history visible during subsequent care.</p>}
      {(assessment.empiricDesmopressinAttempted || assessment.normalizationAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: continuing water, loss, access, and surveillance needs are handed off. This is not normalization or discharge readiness.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-sodium', 'Check sodium only')}{decision('check-fluid-balance', 'Check fluid balance only')}
        {decision('reassess', 'Reassess sodium, fluid balance, and bedside response')}
        {decision('handoff', 'Hand off continuing water and loss care')}
        {decision('empiric-desmopressin', 'Give empiric desmopressin')}
        {decision('normalize-now', 'Normalize sodium now')}
      </div>
    </section>
  </>;
}
