import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { PossibleSepsisSnapshot } from '@platform/kernel/protocol';
import type { PossibleSepsisAction } from './possible-sepsis';

export function PossibleSepsisTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: PossibleSepsisSnapshot;
  readonly onAction: (action: PossibleSepsisAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const labs = assessment.labObservation; const perfusion = assessment.perfusionObservation;
  const observation = assessment.observation;
  const decision = (action: PossibleSepsisAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {/* The ceiling is the first thing on the page once it exists, and it never hides. */}
    <p className="syringe__remaining" role="status">{assessment.immediatePathApplies
      ? 'The immediate path now applies: the pressure has fallen and antimicrobial therapy is indicated within the hour. No time-limited investigation remains available.'
      : assessment.ceilingPassed
        ? 'Three hours have elapsed since first suspicion with no antimicrobial intent recorded. The ceiling has passed, and that is recorded rather than hidden.'
        : assessment.ceilingDueInSeconds !== null
          ? `Ceiling: ${Math.ceil(assessment.ceilingDueInSeconds / 60)} simulated min remain of the three hours from first suspicion.`
          : 'The time of first suspicion has not been recorded, so no ceiling is displayed. It is running regardless.'}</p>
    <p className="syringe__remaining">Selected sources: the 2026 international sepsis guidelines, which are tiered rather than uniform, and the 2021 position paper on the national quality measure. Open the source view for exact wording and grades.</p>
    <section className="syringe possible-sepsis__section" aria-labelledby="possible-sepsis-recognition-title">
      <div id="possible-sepsis-recognition-title" className="syringe__name">Not shock. Not nothing. Start the clock.</div>
      <p className="syringe__remaining">Supplied findings: temperature 38.4 C, heart rate 108/min, BP 118/72 mmHg with no hypotension, respiratory rate 22/min, SpO2 95% in air, alert and orientated. No source identified so far. Lactate 2.4 mmol/L, white cells 13.6 x10^9/L, C-reactive protein 96 mg/L.</p>
      <p className="syringe__remaining">Infection cannot be excluded and neither can a non-infective cause. In comparable populations roughly a third of patients treated empirically for suspected sepsis turn out to have no bacterial infection.</p>
      <p className="syringe__remaining">Time of first suspicion: {assessment.timeZeroAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.timeZeroAtTick)}`}. Uncertainty: {assessment.uncertaintyAtTick === null ? 'not yet recorded' : 'recorded as it stands, without assigning a tier'}. Time-limited assessment: {assessment.assessmentAtTick === null ? 'not yet requested' : 'requested, with the clock running'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-time-zero', 'Record the time infection was first suspected', assessment.timeZeroAtTick !== null)}
        {decision('record-uncertainty', 'Record the uncertainty and request senior assessment', assessment.uncertaintyAtTick !== null)}
        {decision('request-time-limited-assessment', 'Request a time-limited rapid assessment', assessment.assessmentAtTick !== null)}
      </div>
    </section>
    <section className="syringe possible-sepsis__section" aria-labelledby="possible-sepsis-intent-title">
      <div id="possible-sepsis-intent-title" className="syringe__name">Conditional does not mean optional.</div>
      <p className="syringe__remaining">Bounded qualified-team antimicrobial intent is available now and remains available at any point. No agent, dose, route, or combination is selected here, and de-escalation once cultures return is a qualified-team decision.</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what each tier of the current guidance recommends, and on what certainty of evidence.'
        : 'Supplied boundaries: septic shock, and probable or definite sepsis without shock, carry a strong recommendation for antimicrobials immediately and ideally within one hour. Possible sepsis without shock carries a conditional suggestion for a time-limited course of rapid investigation and, if concern persists, antimicrobials within three hours of first suspicion. Every one of those statements rests on very low certainty of evidence, including the strong ones, so conditional does not mean optional. Sepsis is a clinical diagnosis and should not be ruled in or out on a single biomarker or test. The national quality measure is still built around the one-hour clock and has moved into value-based purchasing, so a three-hour path can be guideline-endorsed and still be measured against a faster clock.'}</p>
      <p className="syringe__remaining">Antimicrobial intent: {assessment.antimicrobialIntentAtTick === null ? 'not yet recorded' : assessment.antimicrobialInsideCeiling ? 'recorded inside the ceiling' : 'recorded after the ceiling had passed'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Close monitoring: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-antimicrobial-intent', 'Record bounded antimicrobial intent', assessment.antimicrobialIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the tiers and their certainty', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange close continuous monitoring', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe possible-sepsis__section" aria-labelledby="possible-sepsis-observation-title">
      <div id="possible-sepsis-observation-title" className="syringe__name">Reassess. The clock does not pause.</div>
      <p className="syringe__remaining">{labs
        ? `Last requested laboratory evidence at simulated ${formatElapsed(labs.atTick)}: lactate ${labs.lactateMmolL.toFixed(1)} mmol/L; white cells ${labs.whiteCellsX109L.toFixed(1)} x10^9/L; C-reactive protein ${labs.crpMgL} mg/L; source ${labs.sourceIdentified ? 'identified' : 'not identified'}. No single value here rules infection in or out.`
        : 'No new laboratory-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{perfusion
        ? `Last requested examination at simulated ${formatElapsed(perfusion.atTick)}: BP ${perfusion.systolicMmHg}/${perfusion.diastolicMmHg} mmHg; heart rate ${perfusion.heartRateBpm}/min; ${perfusion.hypotensive ? 'hypotensive, so the immediate path applies' : 'not hypotensive'}. A perfusion-only look does not refresh laboratory evidence.`
        : 'No new perfusion-only examination has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; lactate ${observation.lactateMmolL.toFixed(1)} mmol/L; source ${observation.sourceIdentified ? 'identified' : 'not identified'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      <p className="syringe__remaining">A time-limited assessment is not an interval of observation, and the clock does not pause while results are awaited. The ceiling runs from first suspicion rather than from any result.</p>
      {assessment.investigationObserved && <p className="syringe__remaining">Concern for infection persists and a source is identified. The likelihood is now higher than possible, which the qualified team classifies rather than you, and the ceiling has not moved.</p>}
      {(assessment.waitAttempted || assessment.tierAttempted || assessment.singleTestAttempted || assessment.deferralAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the recorded time of first suspicion travels with the patient, along with whether intent fell inside the ceiling and an open classification. No tier, organism, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-labs', 'Check laboratory evidence only')}{decision('check-perfusion', 'Check perfusion only')}
        {decision('reassess', 'Reassess perfusion and laboratory evidence')}
        {decision('handoff', 'Hand off the clock and the open classification')}
        {decision('wait-and-see', 'Observe and review later')}
        {decision('assign-the-tier', 'Assign the likelihood tier yourself')}
        {decision('single-test-rules-out', 'Rule infection out on one biomarker')}
        {decision('defer-without-a-ceiling', 'Defer antimicrobials with no time limit')}
      </div>
    </section>
  </>;
}
