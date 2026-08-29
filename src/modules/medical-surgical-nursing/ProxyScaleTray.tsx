import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { ProxyScaleSnapshot } from '@platform/kernel/protocol';
import { PROXY_SCALE_ITEMS, type ProxyScaleAction } from './proxy-scale';

export function ProxyScaleTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: ProxyScaleSnapshot;
  readonly onAction: (action: ProxyScaleAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const behaviours = assessment.behaviourRecord; const context = assessment.contextRecord;
  const observation = assessment.observation;
  const decision = (action: ProxyScaleAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {/* The total is shown with what it counts, never alone: a bare number invites being read
        as an intensity, which is the error this lesson exists to refuse. */}
    <p className="syringe__remaining" role="status">Behavioural total {assessment.behaviouralTotal}, the sum of {assessment.itemCount} observed items. Self-report {assessment.selfReportAvailable ? 'available' : 'unavailable'}.</p>
    <p className="syringe__remaining">Selected sources: a state-of-the-science review of tools for nonverbal older adults, a professional position statement setting out the assessment hierarchy, and a narrative review of non-communicative pain. Open the source view for exact wording.</p>
    <section className="syringe proxy-scale__section" aria-labelledby="proxy-scale-items-title">
      <div id="proxy-scale-items-title" className="syringe__name">Four items scored. Not four out of ten.</div>
      <p className="syringe__remaining">Supplied starting observations were pulse 78/min, blood pressure 132/76 mmHg, respiratory rate 18/min, oxygen saturation 96% in air, temperature 36.9 C, all unremarkable, one day after hemiarthroplasty, awake and not speaking with a flat facial expression. These remain historical starting observations.</p>
      <ul className="syringe__remaining">
        {PROXY_SCALE_ITEMS.map((item) => (
          <li key={item.id}>{item.label}: {item.points}</li>
        ))}
      </ul>
      <p className="syringe__remaining">{assessment.limitsRecordedAtTick === null
        ? 'The reference standard for pain is self-report, and it is unavailable here.'
        : 'The total is not an intensity out of ten and has no validated conversion to one. It also cannot be read downward: a limited behavioural repertoire produces few behaviours whether or not something hurts, and the item sets are not comprehensive.'}</p>
      <p className="syringe__remaining">Self-report: {assessment.selfReportAttemptedAtTick === null ? 'not yet attempted' : `attempted at simulated ${formatElapsed(assessment.selfReportAttemptedAtTick)}, unsuccessful`}. Behaviours: {assessment.behavioursRecordedAtTick === null ? 'not yet recorded' : 'recorded as behaviours'}. Limits: {assessment.limitsRecordedAtTick === null ? 'not yet stated' : 'stated in both directions'}.</p>
      <div className="crisis-drug__actions">
        {decision('attempt-self-report', 'Attempt self-report first', assessment.selfReportAttemptedAtTick !== null)}
        {decision('record-the-observed-behaviours', 'Record the observed behaviours', assessment.behavioursRecordedAtTick !== null)}
        {decision('record-what-the-score-is-not', 'State what the total is not', assessment.limitsRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe proxy-scale__section" aria-labelledby="proxy-scale-hierarchy-title">
      <div id="proxy-scale-hierarchy-title" className="syringe__name">A hierarchy, not a number.</div>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review where a behavioural total sits among the other things you can know about this man.'
        : 'Supplied boundaries: attempt self-report; consider whether a cause of pain is present; observe behaviours; obtain a proxy report from someone who knows the person; and treat the response to an analgesic trial as further information. Pulse and blood pressure sit at the bottom as unreliable indicators. A published review concluded no behavioural tool could then be recommended for broad adoption on its intensity claims.'}</p>
      <p className="syringe__remaining">{assessment.familyArrived
        ? (assessment.proxyHistoryAtTick === null
          ? 'His daughter is here for visiting. She has cared for him at home for four years.'
          : 'Recorded in her words: he goes quiet and still rather than restless, he holds his breath in a particular way, and the flat expression is not how he was last week.')
        : 'There is nobody present who knows his baseline.'}</p>
      <p className="syringe__remaining">Proxy history: {assessment.proxyHistoryAtTick === null ? 'not obtained' : 'obtained and recorded'}. Analgesic intent: {assessment.analgesicIntentAtTick === null ? 'not recorded' : 'recorded, with the reasoning stated'}. Reassessment: {assessment.monitoringAtTick === null ? 'not scheduled' : 'scheduled, with behaviours recorded alongside the total'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('seek-the-proxy-history', 'Ask someone who knows him', assessment.proxyHistoryAtTick !== null)}
        {decision('record-analgesic-intent', 'Record bounded analgesic intent', assessment.analgesicIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the hierarchy and its certainty', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Schedule reassessment', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe proxy-scale__section" aria-labelledby="proxy-scale-observation-title">
      <div id="proxy-scale-observation-title" className="syringe__name">Reassess. The total will not move.</div>
      <p className="syringe__remaining">{behaviours
        ? `Last requested observation at simulated ${formatElapsed(behaviours.atTick)}: total ${behaviours.total} across ${behaviours.itemCount} items; self-report ${behaviours.selfReportAvailable ? 'available' : 'unavailable'}. This partial observation supplies no history and no proxy account.`
        : 'No new behavioural observation has been requested.'}</p>
      <p className="syringe__remaining">{context
        ? `Last requested context at simulated ${formatElapsed(context.atTick)}: ${context.recentSurgery ? 'an operation yesterday that would be expected to hurt' : 'no recent procedure'}; ${context.analgesiaCharted ? 'regular analgesia charted' : 'none charted'}; ${context.proxyAvailable ? 'a relative who knows his baseline is present' : 'no proxy present'}. A cause of pain being present is itself a step in the hierarchy.`
        : 'No new context check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: total ${observation.total}; self-report ${observation.selfReportAvailable ? 'available' : 'unavailable'}; ${observation.proxyAvailable ? 'proxy present' : 'no proxy present'}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.reviewObserved && <p className="syringe__remaining">The qualified team has reviewed and recorded that the total is unchanged, that a total is not an intensity, and that the response to treatment is further evidence rather than confirmation that the score was right.</p>}
      {(assessment.intensityReadAttempted || assessment.vitalsTrusted || assessment.zeroReadAttempted || assessment.waitedForRequest) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the attempted self-report, the behaviours with their total, the proxy account, and the reassessment schedule all travel with the patient. No intensity, cause, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-behaviours', 'Observe the behaviours only')}{decision('check-context', 'Check cause and baseline only')}
        {decision('reassess', 'Reassess behaviours and context')}
        {decision('handoff', 'Hand off the number as what it is')}
        {decision('read-four-as-four-out-of-ten', 'Chart it as 4 out of 10')}
        {decision('vitals-confirm-the-pain', 'Check the pulse to confirm')}
        {decision('zero-would-mean-comfortable', 'A zero would mean comfortable')}
        {decision('wait-until-they-ask', 'Wait until he asks')}
      </div>
    </section>
  </>;
}
