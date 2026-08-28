import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { ObstructedKidneySnapshot } from '@platform/kernel/protocol';
import type { ObstructedKidneyAction } from './obstructed-kidney';

export function ObstructedKidneyTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: ObstructedKidneySnapshot;
  readonly onAction: (action: ObstructedKidneyAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const labs = assessment.labObservation; const observations = assessment.observationsOnly;
  const observation = assessment.observation;
  const decision = (action: ObstructedKidneyAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <p className="syringe__remaining">Selected sources: AUA (2026) and EAU Urolithiasis (2026) on urgent decompression, with NICE NG253 (2025) on finding and controlling the source. Open the source view for exact statement numbers and their evidence grades. These guidelines are not a treatment protocol for this fictional patient, and the presentation and response contrasts are authored.</p>
    <section className="syringe obstructed-kidney__section" aria-labelledby="obstructed-kidney-recognition-title">
      <div id="obstructed-kidney-recognition-title" className="syringe__name">Antimicrobials are already running. She is still unwell.</div>
      <p className="syringe__remaining">Supplied findings: temperature 38.9 C, heart rate 118/min, BP 104/58 mmHg, respiratory rate 26/min, track-and-trigger score 8, alert but exhausted. Appropriate intravenous antimicrobial therapy is a supplied premise of this lesson, not a learner decision.</p>
      <p className="syringe__remaining">Supplied laboratory evidence: lactate 2.6 mmol/L, creatinine 148 µmol/L against a baseline near 70, white cells 18.4 x10^9/L, platelets 148 x10^9/L, C-reactive protein 210 mg/L. Supplied imaging: an 8 mm obstructing distal ureteric stone with moderate hydronephrosis.</p>
      <p className="syringe__remaining">Obstruction reconciled: {assessment.recognitionAtTick === null ? 'not yet' : 'yes; the organism, true degree of obstruction, and recoverable kidney function all remain open'}. Urology and interventional radiology: {assessment.urologyAtTick === null ? 'not yet involved' : 'involved early; the receiving team sets the timing after senior advice'}. Cultures: {assessment.culturesAtTick === null ? 'not yet requested' : 'requested, including a collecting-system sample at decompression'}.</p>
      <div className="crisis-drug__actions">
        {decision('recognize-obstruction', 'Reconcile the infection and the obstruction', assessment.recognitionAtTick !== null)}
        {decision('call-urology', 'Involve urology and interventional radiology', assessment.urologyAtTick !== null)}
        {decision('request-cultures', 'Request blood, urine, and collecting-system cultures', assessment.culturesAtTick !== null)}
      </div>
    </section>
    <section className="syringe obstructed-kidney__section" aria-labelledby="obstructed-kidney-intent-title">
      <div id="obstructed-kidney-intent-title" className="syringe__name">Record intent. Leave the choices that are not yours.</div>
      <p className="syringe__remaining">Bounded qualified-team intent for urgent decompression is available now. No modality, access, anaesthetic, operator, or time is chosen here, and recorded intent is not proof a drain was placed. Percutaneous nephrostomy and retrograde stenting are both acceptable, and this lesson marks neither as the right answer.</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what the timing and modality evidence does and does not establish before treating urgency as a number.'
        : 'Supplied boundaries: no guideline states an hour threshold here. Urological bodies recommend urgent drainage strongly on low-grade evidence, while the sepsis guidance supplying a six-hour figure grades it conditional on very-low-certainty observational evidence. Nephrostomy and stenting are not separated by outcome evidence. Inflammatory markers are not established decision tools. The European urological urosepsis section is withdrawn pending review, and the complicated-urinary-infection antibiotic trials rarely enrolled patients with obstruction, stones, or drains.'}</p>
      <p className="syringe__remaining">Decompression intent: {assessment.decompressionIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Definitive stone treatment: {assessment.stoneDeferralAtTick === null ? 'not yet deferred' : 'deferred until the infection is treated'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-decompression-intent', 'Record bounded urgent decompression intent', assessment.decompressionIntentAtTick !== null)}
        {decision('defer-stone-treatment', 'Defer definitive stone treatment', assessment.stoneDeferralAtTick !== null)}
        {decision('review-boundaries', 'Review timing, modality, and evidence limits', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange track-and-trigger surveillance', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe obstructed-kidney__section" aria-labelledby="obstructed-kidney-observation-title">
      <div id="obstructed-kidney-observation-title" className="syringe__name">Reassess the person, not just the marker.</div>
      <p className="syringe__remaining">{labs
        ? `Last requested laboratory evidence at simulated ${formatElapsed(labs.atTick)}: lactate ${labs.lactateMmolL.toFixed(1)} mmol/L; creatinine ${labs.creatinineUmolL} µmol/L; white cells ${labs.whiteCellsX109L.toFixed(1)} x10^9/L; platelets ${labs.plateletsX109L} x10^9/L; C-reactive protein ${labs.crpMgL} mg/L. A laboratory-only check does not refresh the observations.`
        : 'No new laboratory-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; BP ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; track-and-trigger score ${observations.trackAndTriggerScore}. An observations-only round does not refresh laboratory evidence.`
        : 'No new observations-only round has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg (MAP ${observation.meanArterialMmHg}); track-and-trigger score ${observation.trackAndTriggerScore}; lactate ${observation.lactateMmolL.toFixed(1)} mmol/L; creatinine ${observation.creatinineUmolL} µmol/L; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.decompressionDueInSeconds !== null && <p className="syringe__remaining">Authored post-decompression assessment in {Math.ceil(assessment.decompressionDueInSeconds / 3600)} simulated h.</p>}
      <p className="syringe__remaining">The six-hour contrasts are authored, not validated decompression deadlines, safe waits, or grading cutoffs. C-reactive protein lags by many hours, so it can keep rising while the patient improves. Drainage is not cure: deterioration after decompression is well described.</p>
      {assessment.untreatedResponseObserved && assessment.decompressionIntentAtTick === null && <p className="syringe__remaining">A full assessment recorded deterioration after six authored hours of antimicrobial care with the kidney still obstructed.</p>}
      {(assessment.antibioticsOnlyAttempted || assessment.markerDelayAttempted || assessment.modalityChoiceAttempted || assessment.earlyStoneTreatmentAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: unresolved infection, pending drainage timing, kidney recovery, and the later stone decision are handed off. This is not cure or discharge readiness.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-labs', 'Check laboratory evidence only')}{decision('check-observations', 'Check observations only')}
        {decision('reassess', 'Reassess observations and laboratory response')}
        {decision('handoff', 'Hand off unresolved infection and pending drainage')}
        {decision('antibiotics-are-enough', 'Continue antimicrobials alone')}
        {decision('wait-for-crp', 'Wait for the C-reactive protein trend')}
        {decision('choose-modality', 'Declare one drainage modality correct')}
        {decision('treat-stone-now', 'Proceed to definitive stone treatment now')}
      </div>
    </section>
  </>;
}
