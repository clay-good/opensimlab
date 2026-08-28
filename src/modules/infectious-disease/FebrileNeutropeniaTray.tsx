import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { FebrileNeutropeniaSnapshot } from '@platform/kernel/protocol';
import type { FebrileNeutropeniaAction } from './febrile-neutropenia';

export function FebrileNeutropeniaTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: FebrileNeutropeniaSnapshot;
  readonly onAction: (action: FebrileNeutropeniaAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const labs = assessment.labObservation; const observations = assessment.observationsOnly;
  const observation = assessment.observation;
  const decision = (action: FebrileNeutropeniaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <p className="syringe__remaining">Selected sources: NICE CG151 (2012, still current), the IDSA 2010 neutropenia guideline, and the ASCO/IDSA 2018 outpatient update. Open the source view for exact locators. This field still runs on guidance published between 2010 and 2018, which is itself part of the lesson.</p>
    <section className="syringe febrile-neutropenia__section" aria-labelledby="febrile-neutropenia-recognition-title">
      <div id="febrile-neutropenia-recognition-title" className="syringe__name">He looks well. That is not the reassurance it seems.</div>
      <p className="syringe__remaining">Supplied findings: temperature 38.4 C, heart rate 104/min, BP 118/72 mmHg, respiratory rate 20/min, capillary refill 2 s, fully alert. Day 10 after chemotherapy. No cough, no dysuria, no line-site redness, no rash.</p>
      <p className="syringe__remaining">Supplied laboratory evidence: neutrophils 0.2 x10^9/L, white cells 0.8 x10^9/L, platelets 96 x10^9/L, C-reactive protein 42 mg/L, lactate 1.8 mmol/L. Without neutrophils there is no pus, erythema and swelling are muted, and imaging can stay clear. Around three in five episodes never localize, and most still turn out to be infection.</p>
      <p className="syringe__remaining">Recognition: {assessment.recognitionAtTick === null ? 'not yet recorded' : 'recorded; a blind examination is not a negative one'}. Pathway: {assessment.pathwayAtTick === null ? 'not yet activated' : 'activated, with the clock recorded from arrival'}. Cultures: {assessment.culturesAtTick === null ? 'not yet requested' : 'requested from a peripheral site and each line lumen'}.</p>
      <div className="crisis-drug__actions">
        {decision('recognize-neutropenic-fever', 'Recognize a neutropenic emergency', assessment.recognitionAtTick !== null)}
        {decision('activate-pathway', 'Activate the neutropenic sepsis pathway', assessment.pathwayAtTick !== null)}
        {decision('request-cultures', 'Request peripheral and line cultures', assessment.culturesAtTick !== null)}
      </div>
    </section>
    <section className="syringe febrile-neutropenia__section" aria-labelledby="febrile-neutropenia-intent-title">
      <div id="febrile-neutropenia-intent-title" className="syringe__name">Record intent. The agent is not yours to pick.</div>
      <p className="syringe__remaining">Bounded qualified-team intent for immediate empiric intravenous broad-spectrum therapy per local protocol is available now. Guidance delegates the agent to local microbiology policy, so no drug, dose, route, or combination is selected here, and recorded intent is not proof the first dose reached the patient.</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what the one-hour target and the risk scores actually establish before treating either as a decision rule.'
        : 'Supplied boundaries: the one-hour target is a system-design safety margin, not a validated biological threshold; the United Kingdom guidance says immediately and states no number, and the population-specific timing evidence is sparse and conflicting. Risk scores stratify disposition after the emergency response has begun; none is validated to decide whether antimicrobials are given, one is not validated in children, and the newer one is not validated in blood cancers or unstable patients.'}</p>
      <p className="syringe__remaining">Antimicrobial intent: {assessment.antimicrobialIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-antimicrobial-intent', 'Record bounded empiric antimicrobial intent', assessment.antimicrobialIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the timing target and the risk scores', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange continuous track-and-trigger surveillance', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe febrile-neutropenia__section" aria-labelledby="febrile-neutropenia-observation-title">
      <div id="febrile-neutropenia-observation-title" className="syringe__name">Reassess. Expect the numbers to mislead.</div>
      <p className="syringe__remaining">{labs
        ? `Last requested laboratory evidence at simulated ${formatElapsed(labs.atTick)}: neutrophils ${labs.absoluteNeutrophilsX109L.toFixed(1)} x10^9/L; white cells ${labs.whiteCellsX109L.toFixed(1)} x10^9/L; C-reactive protein ${labs.crpMgL} mg/L; lactate ${labs.lactateMmolL.toFixed(1)} mmol/L. A laboratory-only check does not refresh the observations.`
        : 'No new laboratory-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: temperature ${observations.coreTemperatureC.toFixed(1)} C; heart rate ${observations.heartRateBpm}/min; BP ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; capillary refill ${observations.capillaryRefillSeconds} s. An observations-only round does not refresh laboratory evidence.`
        : 'No new observations-only round has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: temperature ${observation.coreTemperatureC.toFixed(1)} C; heart rate ${observation.heartRateBpm}/min; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg (MAP ${observation.meanArterialMmHg}); neutrophils ${observation.absoluteNeutrophilsX109L.toFixed(1)} x10^9/L; C-reactive protein ${observation.crpMgL} mg/L; lactate ${observation.lactateMmolL.toFixed(1)} mmol/L; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.responseDueInSeconds !== null && <p className="syringe__remaining">Authored later assessment in {Math.ceil(assessment.responseDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">The authored contrasts are not validated biological cliffs or safe waiting periods. C-reactive protein takes many hours to rise, so it is uninformative at the door and its later climb is lag catching up. The white cell count cannot rise without neutrophils, and a falling temperature here is deterioration, not recovery.</p>
      {assessment.untreatedResponseObserved && assessment.antimicrobialIntentAtTick === null && <p className="syringe__remaining">A full assessment recorded a falling temperature with failing perfusion and no rise in the white cell count. That combination is worsening infection in a patient who cannot mount a count.</p>}
      {(assessment.crpReassuranceAttempted || assessment.scoreDeferralAttempted || assessment.sourceWaitAttempted || assessment.leukocytosisExpected) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: continuing neutropenia, pending cultures, an unidentified source, and daily reassessment are handed off. This is not cure or discharge readiness.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-labs', 'Check laboratory evidence only')}{decision('check-observations', 'Check observations only')}
        {decision('reassess', 'Reassess observations and laboratory response')}
        {decision('handoff', 'Hand off continuing neutropenia and pending cultures')}
        {decision('crp-reassures', 'Treat the modest marker as reassurance')}
        {decision('score-defers-antimicrobials', 'Use a low-risk score to defer therapy')}
        {decision('wait-for-source', 'Wait for a localizing sign or an image')}
        {decision('expect-leukocytosis', 'Read the flat white cell count as against infection')}
      </div>
    </section>
  </>;
}
