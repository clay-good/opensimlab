import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RisingRequirementSnapshot } from '@platform/kernel/protocol';
import type { RisingRequirementAction } from './rising-requirement';
import { risingRequirementInlinePrompt } from './rising-requirement-tutor';

export function RisingRequirementTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: RisingRequirementSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RisingRequirementAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = risingRequirementInlinePrompt(guidance, { scenarioVersion, risingRequirement: assessment });
  const observations = assessment.observationRecord; const limb = assessment.limbRecord;
  const observation = assessment.observation;
  const decision = (action: RisingRequirementAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining" role="status">Closed tibial diaphyseal fracture {assessment.hoursSinceInjury} hours ago, in a below-knee cast. {assessment.analgesiaRequests} escalating requests for analgesia. One compartment pressure of {assessment.singlePressureMmHg} mmHg, measured once.</p>
    <p className="syringe__remaining">Selected sources: a systematic review of clinical findings in lower-leg compartment syndrome, and two tibial-fracture series of continuous compartment monitoring. Open the source view for exact wording and predictive values.</p>
    <section className="syringe rising-requirement__section" aria-labelledby="rising-requirement-clock-title">
      <div id="rising-requirement-clock-title" className="syringe__name">The only thing moving is how often he asks.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 96/min, blood pressure 128/74 mmHg, respiratory rate 18/min, oxygen saturation 99% in air, temperature 36.9 C, and alert. The foot is warm, the dorsalis pedis is easily felt, capillary refill is under two seconds, and sensation in the first web space is intact. These remain historical starting observations, and none of them is abnormal.</p>
      <p className="syringe__remaining">The note beside the single pressure reading says the pressure was not diagnostic.</p>
      <p className="syringe__remaining">Injury and clock: {assessment.injuryRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.injuryRecordedAtTick)} with the elapsed hours as a live quantity`}. Rising requirement: {assessment.requirementRecordedAtTick === null ? 'not yet recorded' : 'recorded as a direction with its interval'}. Limits of the reading: {assessment.pressureLimitsRecordedAtTick === null ? 'not yet recorded' : 'recorded explicitly'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-injury-and-the-clock', 'Record the injury and the hours on it', assessment.injuryRecordedAtTick !== null)}
        {decision('record-the-rising-requirement', 'Record the rising requirement as the finding', assessment.requirementRecordedAtTick !== null)}
        {decision('record-what-one-pressure-cannot-decide', 'Record what one reading cannot decide', assessment.pressureLimitsRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe rising-requirement__section" aria-labelledby="rising-requirement-escalation-title">
      <div id="rising-requirement-escalation-title" className="syringe__name">Call before the number, not after it.</div>
      <p className="syringe__remaining">{assessment.pressureLimitsRecordedAtTick === null
        ? 'A single reading is a measurement, not a verdict, and not the measurement that discriminates. Record what it can and cannot settle before you lean on it.'
        : 'In 116 monitored tibial fractures, 53 exceeded an absolute 30 mmHg in the first twelve hours and three had the syndrome. The differential against diastolic, followed continuously, is what tracked.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what any of this licenses.'
        : 'Supplied boundaries: clinical findings carried a sensitivity of 13 to 19 percent and a positive predictive value of 11 to 15, with specificity and negative predictive value of 97 to 98 — worth more absent than present; one finding put the probability near 25 percent and three at 93. Continuous differential monitoring in 850 tibial fractures reached 94 percent sensitivity and 98 percent specificity, with 141 of 152 fasciotomies confirmed and five missed. Tibial-fracture data, single centres, and none of it a licence to wait.'}</p>
      <p className="syringe__remaining">Surgical team: {assessment.escalationAtTick === null ? 'not yet called' : `called at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.decompressionIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-the-surgical-team', 'Call the team that owns the decision', assessment.escalationAtTick !== null)}
        {decision('record-bounded-decompression-intent', 'Record bounded qualified-team intent', assessment.decompressionIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe rising-requirement__section" aria-labelledby="rising-requirement-observation-title">
      <div id="rising-requirement-observation-title" className="syringe__name">Reassess. The monitor will not tell you.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}% on air; temperature ${observations.coreTemperatureC.toFixed(1)} C. This partial check supplies no limb record, and none of these is abnormal.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{limb
        ? `Last requested limb record at simulated ${formatElapsed(limb.atTick)}: ${limb.injury}, ${limb.hoursSinceInjury} hours ago, ${limb.immobilised ? 'in a below-knee cast' : 'not immobilised'}; ${limb.analgesiaRequests} escalating requests; pain on passive extension ${limb.painOnPassiveStretch ? 'present' : 'absent'}; ${limb.pulsePresent ? 'dorsalis pedis easily felt' : 'no pulse felt'}; one pressure of ${limb.singlePressureMmHg} mmHg. This partial check supplies no new observations.`
        : 'No new limb-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; blood pressure ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; ${observation.hoursSinceInjury} hours since injury; ${observation.analgesiaRequests} escalating requests; ${observation.pulsePresent ? 'pulse present' : 'no pulse'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.worsened && <p className="syringe__remaining">He has asked a fourth time and passive extension of the toes now stops him mid-sentence. The pulse, the capillary refill, the sensation and every monitored observation are exactly as they were.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The surgical team has answered. They confirmed the fracture and its timing from their own record, stated that a single reading neither establishes nor excludes this, and own repeat assessment, further measurement, and the decision to decompress.</p>}
      {(assessment.perfusionClaimAttempted || assessment.thresholdClaimAttempted || assessment.analgesiaAttempted || assessment.repeatPressureAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the injury with its hours, the requirement recorded as a rising trajectory, the limits of the single reading, the call made without waiting, and the bounded intent all travel with the patient. No diagnosis, operative decision, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-limb-record', 'Check the limb record only')}
        {decision('reassess', 'Reassess observations and limb record')}
        {decision('handoff', 'Hand off the clock and the direction')}
        {decision('pulses-are-present-so-perfusion-is-fine', 'Pulses are present, so perfusion is fine')}
        {decision('the-pressure-was-below-the-threshold', 'The pressure was below the threshold')}
        {decision('increase-analgesia-and-review-in-the-morning', 'Increase the analgesia and review in the morning')}
        {decision('wait-for-a-repeat-pressure-before-calling', 'Wait for a repeat pressure before calling')}
      </div>
    </section>
  </>;
}
