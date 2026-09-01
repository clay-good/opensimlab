import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { MeningococcalSepsisSnapshot } from '@platform/kernel/protocol';
import type { MeningococcalSepsisAction } from './meningococcal-sepsis';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { meningococcalSepsisInlinePrompt } from './meningococcal-sepsis-tutor';

export function MeningococcalSepsisTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: MeningococcalSepsisSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: MeningococcalSepsisAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = meningococcalSepsisInlinePrompt(guidance, { scenarioVersion, meningococcalSepsis: assessment });
  const labs = assessment.labObservation; const perfusion = assessment.perfusionObservation;
  const observation = assessment.observation;
  const decision = (action: MeningococcalSepsisAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected sources: NICE NG240 (2024) and NG254 (2025), with the Phoenix paediatric sepsis criteria (JAMA 2024). Open the source view for exact recommendation numbers. These guidelines are not a treatment protocol for this fictional patient, and the presentation and response contrasts are authored.</p>
    <section className="syringe meningococcal-sepsis__section" aria-labelledby="meningococcal-sepsis-recognition-title">
      <div id="meningococcal-sepsis-recognition-title" className="syringe__name">See the rash. See the whole patient.</div>
      <p className="syringe__remaining">Supplied findings: fever 39.2 C, heart rate 138/min, BP 88/44 mmHg, respiratory rate 28/min, capillary refill 4 s, conscious level 14/15, and non-blanching petechiae including two lesions larger than 2 mm. These are historical starting findings.</p>
      <p className="syringe__remaining">Supplied laboratory evidence: lactate 4.1 mmol/L, platelets 96 x10^9/L, INR 1.5, white cells 3.4 x10^9/L, C-reactive protein 48 mg/L. The low count and modest marker are adverse and lagging, not reassurance. She is MenACWY vaccinated, which does not cover serogroup B.</p>
      <p className="syringe__remaining">Rash: {assessment.rashRecognizedAtTick === null ? 'not yet reconciled with the whole patient' : 'reconciled; recognition is not a diagnosis and no rash would still not exclude this'}. Senior ownership: {assessment.seniorAtTick === null ? 'not yet requested' : 'requested by telephone'}. Bloods: {assessment.bloodsAtTick === null ? 'not yet requested' : 'requested without delaying care'}.</p>
      <div className="crisis-drug__actions">
        {decision('recognize-rash', 'Reconcile the rash and the whole patient', assessment.rashRecognizedAtTick !== null)}
        {decision('call-senior', 'Call the senior clinical decision maker', assessment.seniorAtTick !== null)}
        {decision('request-bloods', 'Request cultures, lactate, clotting, and PCR', assessment.bloodsAtTick !== null)}
      </div>
    </section>
    <section className="syringe meningococcal-sepsis__section" aria-labelledby="meningococcal-sepsis-intent-title">
      <div id="meningococcal-sepsis-intent-title" className="syringe__name">Record intent. Keep the boundary visible.</div>
      <p className="syringe__remaining">Bounded qualified-team antimicrobial and fluid intent are independently available now. Recorded intent is neither a prescription nor proof that treatment reached the patient. No agent, dose, route, bolus volume, or vasoactive choice is selected here, and the critical-care referral asks a qualified team to review the need for access and vasoactive support.</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the one-hour antimicrobial target, the lagging inflammatory markers, the vaccination boundary, and the contested fluid ceiling.'
        : 'Supplied boundaries: antimicrobials within one hour of arrival; no marker rules this out; MenACWY does not cover serogroup B; do not delay transfer for pre-hospital antimicrobials; and the United Kingdom single-bolus cap and the international paediatric first-hour ceiling genuinely disagree for this weight. No lumbar-puncture, imaging, source-control, or contact-prophylaxis decision is supplied.'}</p>
      <p className="syringe__remaining">Antimicrobial intent: {assessment.antimicrobialIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Fluid and critical-care intent: {assessment.fluidIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-antimicrobial-intent', 'Record bounded antimicrobial intent', assessment.antimicrobialIntentAtTick !== null)}
        {decision('record-fluid-intent', 'Record bounded fluid and critical-care intent', assessment.fluidIntentAtTick !== null)}
        {decision('review-boundaries', 'Review timing, markers, and the fluid ceiling', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange continuous observations and conscious level', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe meningococcal-sepsis__section" aria-labelledby="meningococcal-sepsis-observation-title">
      <div id="meningococcal-sepsis-observation-title" className="syringe__name">Reassess the person, not just the number.</div>
      <p className="syringe__remaining">{labs
        ? `Last requested laboratory evidence at simulated ${formatElapsed(labs.atTick)}: lactate ${labs.lactateMmolL.toFixed(1)} mmol/L; platelets ${labs.plateletsX109L} x10^9/L; C-reactive protein ${labs.crpMgL} mg/L; white cells ${labs.whiteCellsX109L.toFixed(1)} x10^9/L. A laboratory-only check does not refresh the bedside assessment.`
        : 'No new laboratory-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{perfusion
        ? `Last requested examination at simulated ${formatElapsed(perfusion.atTick)}: capillary refill ${perfusion.capillaryRefillSeconds} s; conscious level ${perfusion.glasgowComaScore}/15; ${perfusion.spreadingPurpura ? 'spreading purpura' : 'petechiae with lesions larger than 2 mm'}. A perfusion-only check does not refresh laboratory evidence.`
        : 'No new perfusion-only examination has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg (MAP ${observation.meanArterialMmHg}); capillary refill ${observation.capillaryRefillSeconds} s; conscious level ${observation.glasgowComaScore}/15; lactate ${observation.lactateMmolL.toFixed(1)} mmol/L; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full bedside and laboratory assessment has been requested.'}</p>
      {assessment.responseDueInSeconds !== null && <p className="syringe__remaining">Authored one-hour response review in {Math.ceil(assessment.responseDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">The ten-minute and one-hour contrasts are authored, not predicted disease kinetics, safe waits, or grading cutoffs. A rising C-reactive protein is expected with elapsed time and is not by itself treatment failure. Fresh full findings can support handoff while shock is unresolved.</p>
      {assessment.incompleteResponseObserved && assessment.consultantAtTick === null && <p className="syringe__remaining">A full assessment recorded an inadequate response an hour after recorded intent. Telephone ownership has already happened; attendance in person has not.</p>}
      {(assessment.markerExclusionAttempted || assessment.vaccinationExclusionAttempted || assessment.transferDelayAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: unresolved shock, the unconfirmed diagnosis, contact questions, and continued review are handed off. This is not recovery or discharge readiness.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-labs', 'Check laboratory evidence only')}{decision('check-perfusion', 'Check perfusion and conscious level only')}
        {decision('reassess', 'Reassess bedside findings and laboratory response')}
        {decision('escalate-consultant', 'Alert a consultant to attend in person', assessment.consultantAtTick !== null)}
        {decision('handoff', 'Hand off unresolved shock and continuing care')}
        {decision('normal-markers-exclude', 'Declare sepsis excluded by the markers')}
        {decision('vaccination-excludes', 'Declare meningococcal disease excluded by vaccination')}
        {decision('delay-transfer-for-antibiotics', 'Hold transfer to give antimicrobials first')}
      </div>
    </section>
  </>;
}
