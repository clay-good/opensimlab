import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { SepticShockLabelSnapshot } from '@platform/kernel/protocol';
import type { SepticShockLabelAction } from './septic-shock-label';

export function SepticShockLabelTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: SepticShockLabelSnapshot;
  readonly onAction: (action: SepticShockLabelAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const labs = assessment.labObservation; const perfusion = assessment.perfusionObservation;
  const observation = assessment.observation;
  const decision = (action: SepticShockLabelAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  // Each part of the definition is shown separately. A single verdict would hide the thing this
  // lesson is about: which parts the treatment made answerable, and which were answerable already.
  // Two states, because in this authored case the completed trial always satisfies the criterion it
  // makes readable. Rendering a "Not met" arm that cannot occur would be decoration, not information.
  const part = (readable: boolean, text: string) =>
    <li>{readable ? 'Met' : 'Not yet decidable'}: {text}</li>;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <p className="syringe__remaining" role="status">{assessment.resuscitationIntentAtTick !== null
      ? `Resuscitation intent recorded ${assessment.resuscitationIntentInsideCeiling ? 'inside the hour' : 'after the hour had passed'}.`
      : assessment.ceilingPassed
        ? 'One hour has elapsed with no bounded resuscitation intent recorded. The ceiling has passed, and that is reported rather than hidden.'
        : `Ceiling: ${Math.ceil((assessment.ceilingDueInSeconds ?? 0) / 60)} simulated min remain of the hour this tier carries.`}</p>
    <p className="syringe__remaining">Selected sources: the Sepsis-3 consensus definitions and the 2026 international sepsis guidelines. Open the source view for exact wording and grades.</p>
    <section className="syringe septic-shock-label__section" aria-labelledby="septic-shock-label-definition-title">
      <div id="septic-shock-label-definition-title" className="syringe__name">{assessment.trialObserved
        ? 'All three can now be answered.' : 'Two of these three cannot be answered yet.'}</div>
      <p className="syringe__remaining">Supplied starting findings were temperature 38.9 C, heart rate 118/min, BP 84/48 mmHg with a mean of 60, respiratory rate 26/min, SpO2 94% in air, drowsy but rousable, lactate 3.6 mmol/L, white cells 17.1 x10^9/L, creatinine 132 µmol/L, and capillary refill 4.1 s, with no vasopressor running and no fluid resuscitation completed. These remain historical starting findings.</p>
      <p className="syringe__remaining">Septic shock requires all three of the following together:</p>
      <ul className="syringe__remaining">
        {part(assessment.trialObserved, 'vasopressors needed to maintain a mean arterial pressure at or above 65 mmHg')}
        {part(assessment.trialObserved, 'that mean pressure actually held at the target on support')}
        {part(true, 'a serum lactate above 2 mmol/L, which the current value already exceeds; the definition asks for it after resuscitation')}
      </ul>
      <p className="syringe__remaining">{assessment.trialObserved
        ? 'All three can now be read together, and this meets septic shock. It did so only once the treatment had run: the label reflects a treatment as much as a patient, and a team resuscitating differently could have produced a different label for the same person. That is a property of the definition rather than a failure of care.'
        : 'The lactate is already above the threshold, but the threshold applies after resuscitation, and the other two parts describe a vasopressor that is not running. This is not caution. Two of the three have no truth value yet.'}</p>
      <p className="syringe__remaining">The consensus task force stated plainly that criteria for adequate fluid resuscitation and for need for vasopressor therapy could not be explicitly specified, because they are highly user dependent. Nothing here supplies the missing definition.</p>
      <p className="syringe__remaining">Hypoperfusion: {assessment.hypoperfusionAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.hypoperfusionAtTick)}`}. Critical care: {assessment.criticalCareAtTick === null ? 'not yet activated' : 'activated on the perfusion pattern'}. Classification: {assessment.classificationOpenAtTick === null ? 'not yet recorded' : 'recorded as open, with the reason'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-hypoperfusion', 'Record the hypoperfusion as measured', assessment.hypoperfusionAtTick !== null)}
        {decision('activate-critical-care', 'Activate critical care on the pattern', assessment.criticalCareAtTick !== null)}
        {decision('record-classification-open', 'Record the classification as open', assessment.classificationOpenAtTick !== null)}
      </div>
    </section>
    <section className="syringe septic-shock-label__section" aria-labelledby="septic-shock-label-intent-title">
      <div id="septic-shock-label-intent-title" className="syringe__name">The trial is also the measurement.</div>
      <p className="syringe__remaining">Bounded qualified-team resuscitation intent is available now. No fluid volume, rate, vasoactive agent, dose, or endpoint is selected here, and antimicrobial, source-control, and steroid decisions remain qualified-team work.</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the pressure, fluid, and lactate targets, and the certainty of evidence each one rests on.'
        : 'Supplied boundaries: an initial mean arterial pressure target of 65 mmHg over higher targets is a strong recommendation on moderate certainty, and for adults 65 or older an initial range of 60 to 65 mmHg is suggested on low certainty; the target is a floor with a tolerance band, and the evidence supports 65 over higher rather than over lower. At least 30 mL/kg of crystalloid in the first three hours is conditional on low certainty, hedged with an explicit warning about the harms of both under- and over-resuscitation. Fluids first with vasopressors if hypotension persists is conditional on very low certainty, the weakest statement here, with a carve-out for concurrent vasopressors in unstable shock. Serial lactate is conditional on low certainty, and the instruction is to individualize after the initial bolus by watching the decrement rather than continuing fluids until the lactate normalizes. Capillary refill is a conditional adjunct with no standardized technique. Corticosteroids are conditional on low certainty; trials agree they speed shock reversal and disagree about mortality.'}</p>
      <p className="syringe__remaining">Resuscitation intent: {assessment.resuscitationIntentAtTick === null ? 'not yet recorded' : assessment.resuscitationIntentInsideCeiling ? 'recorded inside the hour' : 'recorded after the hour had passed'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Monitoring: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-resuscitation-intent', 'Record bounded resuscitation intent', assessment.resuscitationIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the targets and their certainty', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange continuous perfusion monitoring', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe septic-shock-label__section" aria-labelledby="septic-shock-label-observation-title">
      <div id="septic-shock-label-observation-title" className="syringe__name">Reassess. The trial decides the label.</div>
      <p className="syringe__remaining">{labs
        ? `Last requested laboratory evidence at simulated ${formatElapsed(labs.atTick)}: lactate ${labs.lactateMmolL.toFixed(1)} mmol/L; white cells ${labs.whiteCellsX109L.toFixed(1)} x10^9/L; creatinine ${labs.creatinineUmolL} µmol/L; base excess ${labs.baseExcessMmolL.toFixed(1)} mmol/L. A raised lactate here is not a reading of tissue oxygen debt.`
        : 'No new laboratory-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{perfusion
        ? `Last requested examination at simulated ${formatElapsed(perfusion.atTick)}: BP ${perfusion.systolicMmHg}/${perfusion.diastolicMmHg} mmHg, mean ${perfusion.meanArterialMmHg} mmHg; heart rate ${perfusion.heartRateBpm}/min; capillary refill ${perfusion.capillaryRefillSeconds.toFixed(1)} s; ${perfusion.vasopressorRunning ? 'vasopressor support running, so this is a supported pressure' : 'no vasopressor running, so this is an unsupported pressure'}. A perfusion-only look does not refresh laboratory evidence.`
        : 'No new perfusion-only examination has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; mean pressure ${observation.meanArterialMmHg} mmHg; lactate ${observation.lactateMmolL.toFixed(1)} mmol/L; capillary refill ${observation.capillaryRefillSeconds.toFixed(1)} s; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.trialObserved && <p className="syringe__remaining">The authored resuscitation is complete and the pressure is held on vasopressor support. The definition became readable at that moment, not before it.</p>}
      {(assessment.earlyLabelAttempted || assessment.hypoxiaAttempted || assessment.normalizationAttempted || assessment.mapTargetAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the measured state before treatment, the recorded reason the classification was open, and whether intent fell inside the hour all travel with the patient. No organism, treatment effect, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-labs', 'Check laboratory evidence only')}{decision('check-perfusion', 'Check perfusion only')}
        {decision('reassess', 'Reassess perfusion and laboratory evidence')}
        {decision('handoff', 'Hand off the measured state and the label')}
        {decision('declare-shock-now', 'Declare septic shock now')}
        {decision('lactate-means-hypoxia', 'Read the lactate as tissue hypoxia')}
        {decision('resuscitate-to-normal-lactate', 'Give fluids until the lactate normalizes')}
        {decision('raise-the-map-target', 'Raise the pressure target above 65')}
      </div>
    </section>
  </>;
}
