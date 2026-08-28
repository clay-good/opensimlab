import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { NecrotizingInfectionSnapshot } from '@platform/kernel/protocol';
import type { NecrotizingInfectionAction } from './necrotizing-infection';

export function NecrotizingInfectionTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: NecrotizingInfectionSnapshot;
  readonly onAction: (action: NecrotizingInfectionAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const labs = assessment.labObservation; const limb = assessment.limbObservation;
  const observation = assessment.observation;
  const decision = (action: NecrotizingInfectionAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <p className="syringe__remaining">Selected sources: a 2019 diagnostic-accuracy meta-analysis, 2022 international surgical pathways, and a 2020 timing meta-analysis. Open the source view for exact locators. The score, the signs, and the clock in this case are all reported with their measured limits.</p>
    <section className="syringe necrotizing-infection__section" aria-labelledby="necrotizing-infection-recognition-title">
      <div id="necrotizing-infection-recognition-title" className="syringe__name">The number is reassuring. The patient is not.</div>
      <p className="syringe__remaining">Supplied findings: 36 hours of oral antibiotics without settling, severe pain extending past the edge of the redness, temperature 37.4 C, heart rate 104/min, BP 118/72 mmHg. No crepitus. No bullae.</p>
      <p className="syringe__remaining">Supplied laboratory evidence: white cells 14.8 x10^9/L, C-reactive protein 132 mg/L, sodium 136 mmol/L, creatinine 118 µmol/L, glucose 11.4 mmol/L, haemoglobin 12.6 g/dL, lactate 2.4 mmol/L. Derived risk score {assessment.riskScore}, below its usual cutoff of 6. Pooled sensitivity at that cutoff is near two-thirds, so roughly one confirmed case in three scores below it.</p>
      <p className="syringe__remaining">Pain reconciled: {assessment.recognitionAtTick === null ? 'not yet' : 'yes; a soft sign with poor specificity, and still the one worth acting on'}. Border: {assessment.marginMarkedAtTick === null ? 'not yet marked' : 'marked and timed, so progression can be measured'}. Surgical review: {assessment.surgeryAtTick === null ? 'not yet requested' : 'requested for consideration of exploration'}.</p>
      <div className="crisis-drug__actions">
        {decision('recognize-disproportionate-pain', 'Reconcile the pain with the whole patient', assessment.recognitionAtTick !== null)}
        {decision('mark-the-margin', 'Mark and time the erythema border', assessment.marginMarkedAtTick !== null)}
        {decision('call-surgery', 'Request urgent surgical review', assessment.surgeryAtTick !== null)}
      </div>
    </section>
    <section className="syringe necrotizing-infection__section" aria-labelledby="necrotizing-infection-intent-title">
      <div id="necrotizing-infection-intent-title" className="syringe__name">Antimicrobials alongside surgery, never instead.</div>
      <p className="syringe__remaining">Bounded qualified-team antimicrobial intent per local protocol is available now. No agent, dose, route, incision, extent, or theatre time is selected here. Antimicrobials do not treat dead tissue, and exploration is the only test that can exclude this.</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what the score, the physical signs, and the timing evidence actually establish.'
        : 'Supplied boundaries: the score was derived against selected severe-cellulitis controls and counts late physiology, so early disease scores low by construction; it must not be used to exclude. Crepitus and bullae are roughly a quarter and a fifth sensitive, so their absence is not reassurance. Imaging is reasonably sensitive and still not exclusionary, and must never delay exploration. Earlier surgery is consistently associated with survival across observational studies, but that evidence is confounded by indication in both directions and there is no randomised trial and no validated hour threshold.'}</p>
      <p className="syringe__remaining">Antimicrobial intent: {assessment.antimicrobialIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-antimicrobial-intent', 'Record bounded antimicrobial intent', assessment.antimicrobialIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the score, the signs, and the clock', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange surveillance and recheck the border', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe necrotizing-infection__section" aria-labelledby="necrotizing-infection-observation-title">
      <div id="necrotizing-infection-observation-title" className="syringe__name">Watch the border, not the score.</div>
      <p className="syringe__remaining">{labs
        ? `Last requested laboratory evidence at simulated ${formatElapsed(labs.atTick)}: white cells ${labs.whiteCellsX109L.toFixed(1)} x10^9/L; C-reactive protein ${labs.crpMgL} mg/L; sodium ${labs.sodiumMmolL} mmol/L; lactate ${labs.lactateMmolL.toFixed(1)} mmol/L; derived score ${labs.riskScore}. A laboratory-only check does not refresh the limb examination.`
        : 'No new laboratory-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{limb
        ? `Last requested limb examination at simulated ${formatElapsed(limb.atTick)}: erythema ${limb.beyondMarginCm === 0 ? 'at the marked border' : `${limb.beyondMarginCm} cm beyond the marked border`}; skin ${limb.dusky ? 'dusky' : 'erythematous without duskiness'}; crepitus and bullae absent. A limb-only look does not refresh laboratory evidence.`
        : 'No new limb-only examination has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: temperature ${observation.coreTemperatureC.toFixed(1)} C; heart rate ${observation.heartRateBpm}/min; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; lactate ${observation.lactateMmolL.toFixed(1)} mmol/L; derived score ${observation.riskScore}; erythema ${observation.beyondMarginCm === 0 ? 'at the marked border' : `${observation.beyondMarginCm} cm beyond the marked border`}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.progressionDueInSeconds !== null && <p className="syringe__remaining">Authored progression in {Math.ceil(assessment.progressionDueInSeconds / 3600)} simulated h.</p>}
      <p className="syringe__remaining">The authored progression happens whatever you record, because only an operation treats this and the operation is not in this rehearsal. What changes is whether the surgical team is already mobilized when it arrives.</p>
      {assessment.progressionObserved && <p className="syringe__remaining">The score is now firmly positive. It became useful only after the interval in which acting on it mattered, which is the lesson rather than a reward.</p>}
      {(assessment.scoreExclusionAttempted || assessment.imagingDelayAttempted || assessment.crepitusExclusionAttempted || assessment.oralContinuationAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the marked border, the pending surgical decision, and an unconfirmed diagnosis are handed off. Only exploration can confirm or exclude it.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-labs', 'Check laboratory evidence only')}{decision('check-limb', 'Check the limb only')}
        {decision('reassess', 'Reassess the limb and laboratory evidence')}
        {decision('handoff', 'Hand off an unconfirmed diagnosis and pending surgery')}
        {decision('score-excludes', 'Declare the diagnosis excluded by the score')}
        {decision('wait-for-imaging', 'Wait for imaging before surgical review')}
        {decision('absent-crepitus-excludes', 'Treat absent crepitus and bullae as reassurance')}
        {decision('continue-oral-antibiotics', 'Continue the oral course and review tomorrow')}
      </div>
    </section>
  </>;
}
