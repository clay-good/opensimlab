import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { PairedReadingSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PairedReadingAction } from './paired-reading';
import { pairedReadingInlinePrompt } from './paired-reading-tutor';

export function PairedReadingTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: PairedReadingSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: PairedReadingAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = pairedReadingInlinePrompt(guidance, { scenarioVersion, pairedReading: assessment });
  const device = assessment.oximeterRecord; const patient = assessment.patientRecord;
  const observation = assessment.observation;
  const decision = (action: PairedReadingAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* Both numbers appear together the moment the second one exists, and the first is never
        amended: it is a true record of what the device displayed. */}
    <p className="syringe__remaining" role="status">Oximeter: {assessment.oximeterPercent}% on air, good trace. {assessment.arterialPercent === null
      ? 'The arterial sample sent earlier has not returned.'
      : `Arterial saturation from the same minute: ${assessment.arterialPercent}%.`}</p>
    <p className="syringe__remaining">Selected sources: a systematic review and meta-analysis of occult hypoxaemia, a cohort correspondence on pulse-oximetry bias, and a 2025 regulatory draft guidance. Open the source view for exact wording and certainty.</p>
    <section className="syringe paired-reading__section" aria-labelledby="paired-reading-reading-title">
      <div id="paired-reading-reading-title" className="syringe__name">A reading is not a saturation.</div>
      <p className="syringe__remaining">Supplied starting observations were oximeter 94% on room air with a good plethysmographic trace, a warm hand, no nail covering, respiratory rate 24 counted for a full minute, blood pressure 132/78 mmHg, pulse 98/min, temperature 37.4 C, alert and speaking in full sentences, four days after abdominal surgery. These remain historical starting observations.</p>
      <p className="syringe__remaining">{assessment.gapExplainedAtTick === null
        ? 'Every bedside explanation for a wrong reading — poor trace, cold hand, nail covering, motion, probe position — can be checked. None of them explains a reading that is too high.'
        : 'This gap is not a poor trace, a cold hand, nail covering, motion, or probe position. Pulse oximetry infers saturation from how light is absorbed, and skin pigmentation changes that absorbance, so the device overestimates arterial saturation more often in patients with darker skin. A systematic review of 732,505 paired measurements reports occult hypoxaemia roughly two-thirds more common in Black patients, at moderate certainty of evidence.'}</p>
      <p className="syringe__remaining">Reading recorded: {assessment.oximeterRecordedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(assessment.oximeterRecordedAtTick)}`}. Paired values: {assessment.pairedAtTick === null ? 'not recorded' : 'recorded together, with the reading unamended'}. Gap characterised: {assessment.gapExplainedAtTick === null ? 'not yet' : 'recorded'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-oximeter-reading', 'Record the oximeter reading', assessment.oximeterRecordedAtTick !== null)}
        {decision('record-the-paired-values', 'Record both values together', assessment.pairedAtTick !== null)}
        {decision('record-what-the-gap-is-not', 'State what the gap is and is not', assessment.gapExplainedAtTick !== null)}
      </div>
    </section>
    <section className="syringe paired-reading__section" aria-labelledby="paired-reading-escalation-title">
      <div id="paired-reading-escalation-title" className="syringe__name">The error has a direction.</div>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what this device does well, what it does not, and what a recent regulatory change did and did not do.'
        : 'Supplied boundaries: the bias is optical rather than a perfusion artifact, so repositioning the probe, warming the hand, or switching digits does not correct it. The 2025 draft guidance applies to devices submitted for approval in future; it does not recall or recalibrate devices already in service. The oximeter trends change within one patient comparatively well, and reports an absolute value comparable across patients comparatively poorly.'}</p>
      <p className="syringe__remaining">Escalation: {assessment.escalationAtTick === null ? 'not yet requested' : `requested at simulated ${formatElapsed(assessment.escalationAtTick)} on the arterial value`}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Observation: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged, independent of the oximeter'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-on-the-arterial-value', 'Escalate on the arterial value', assessment.escalationAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange oximeter-independent observation', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe paired-reading__section" aria-labelledby="paired-reading-observation-title">
      <div id="paired-reading-observation-title" className="syringe__name">Reassess. The display will not move.</div>
      <p className="syringe__remaining">{device
        ? `Last requested device check at simulated ${formatElapsed(device.atTick)}: reading ${device.readingPercent}%; ${device.goodTrace ? 'good trace' : 'poor trace'}; ${device.warmPeriphery ? 'warm periphery' : 'cool periphery'}; ${device.nailCoveringPresent ? 'nail covering present' : 'no nail covering'}. Every artifact that would explain a falsely low reading is absent, and none would explain a falsely high one.`
        : 'No new device check has been requested.'}</p>
      <p className="syringe__remaining">{patient
        ? `Last requested observation at simulated ${formatElapsed(patient.atTick)}: respiratory rate ${patient.respiratoryRateBpm} counted for a full minute; ${patient.speakingFullSentences ? 'speaking in full sentences' : 'speaking in short phrases'}; ${patient.arterialAvailable ? 'arterial result available' : 'no arterial result yet'}. This partial observation supplies no device check.`
        : 'No new observation of the patient has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: oximeter ${observation.readingPercent}%; respiratory rate ${observation.respiratoryRateBpm}; ${observation.arterialAvailable ? 'arterial result available' : 'no arterial result yet'}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.gasObserved && <p className="syringe__remaining">The arterial sample returned at {assessment.arterialPercent}% while the oximeter read {assessment.oximeterPercent}%. Both numbers are from the same minute and the same patient.</p>}
      {assessment.reviewObserved && <p className="syringe__remaining">The review is acting on the arterial value. The oximeter continues to read in the nineties, correctly by its own calibration, and no fault is found with the device or with anyone who read it.</p>}
      {(assessment.repositionAttempted || assessment.warmingAttempted || assessment.trendTrusted || assessment.standardAssumedFixed) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: both values, the reason the gap exists, and the fact that the chart will keep reading reassuringly all travel with the patient. No cause or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-oximeter', 'Check the device only')}{decision('check-patient', 'Observe the patient only')}
        {decision('reassess', 'Reassess the device and the patient')}
        {decision('handoff', 'Hand off both numbers')}
        {decision('reposition-the-probe', 'Reposition the probe')}
        {decision('warm-the-hand', 'Warm the hand')}
        {decision('trust-the-oximeter-trend', 'The numbers are steady, so she is stable')}
        {decision('the-device-standard-was-fixed', 'The 2025 standard fixed this')}
      </div>
    </section>
  </>;
}
