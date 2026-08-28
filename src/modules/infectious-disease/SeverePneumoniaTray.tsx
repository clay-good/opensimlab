import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { SeverePneumoniaSnapshot } from '@platform/kernel/protocol';
import type { SeverePneumoniaAction } from './severe-pneumonia';

export function SeverePneumoniaTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: SeverePneumoniaSnapshot;
  readonly onAction: (action: SeverePneumoniaAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const labs = assessment.labObservation; const respiratory = assessment.respiratoryObservation;
  const observation = assessment.observation;
  const decision = (action: SeverePneumoniaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <p className="syringe__remaining">Selected sources: the 2019 ATS/IDSA severity definition, NICE NG250 (2025), and a 2012 meta-analysis of severity tools for predicting critical-care admission. Open the source view for exact locators.</p>
    <section className="syringe severe-pneumonia__section" aria-labelledby="severe-pneumonia-recognition-title">
      <div id="severe-pneumonia-recognition-title" className="syringe__name">Both scores are right. They disagree.</div>
      <p className="syringe__remaining">Supplied findings: right lower and middle lobe consolidation, respiratory rate 30/min, SpO2 92% on an inspired fraction of 0.35 with an oxygenation ratio of 171, heart rate 116/min, BP 106/64 mmHg, temperature 38.7 C, orientated.</p>
      <p className="syringe__remaining">Supplied instruments: the mortality score reads 2, from urea and respiratory rate, placing him in a ward band. The severity criteria count 3, from a respiratory rate at or above 30, an oxygenation ratio at or below 250, and multilobar shadowing, which defines severe pneumonia. Nothing is hidden and nothing is mismeasured. The C-reactive protein of 284 mg/L and the sodium of 129 mmol/L appear in neither instrument.</p>
      <p className="syringe__remaining">Instruments reconciled: {assessment.reconciliationAtTick === null ? 'not yet' : 'yes; the disagreement is real'}. Mismatch recognized: {assessment.mismatchAtTick === null ? 'not yet' : 'yes; one of them answers a different question'}. Critical-care review: {assessment.criticalCareAtTick === null ? 'not yet requested' : 'requested, citing the severity criteria'}.</p>
      <div className="crisis-drug__actions">
        {decision('reconcile-supplied-scores', 'Hold both instruments together', assessment.reconciliationAtTick !== null)}
        {decision('recognize-instrument-mismatch', 'Ask what each instrument answers', assessment.mismatchAtTick !== null)}
        {decision('call-critical-care', 'Request critical-care review now', assessment.criticalCareAtTick !== null)}
      </div>
    </section>
    <section className="syringe severe-pneumonia__section" aria-labelledby="severe-pneumonia-intent-title">
      <div id="severe-pneumonia-intent-title" className="syringe__name">Record intent. The bed is not yours to give.</div>
      <p className="syringe__remaining">Bounded qualified-team intent for anticipated escalation of respiratory and circulatory support is available now. No oxygen device, flow, ventilation mode or pressure, fluid volume, vasoactive agent, antimicrobial, or steroid is selected here, and recorded intent is not an accepted bed.</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what the triage evidence establishes before treating either instrument as an order.'
        : 'Supplied boundaries: the mortality score is not wrong, it answers thirty-day mortality, and one national guideline uses it alongside clinical judgement rather than in isolation. The severity criteria have never been formally re-derived and their items carry unequal weight. No severity tool has been shown in a randomised trial to improve outcomes when used for critical-care triage, and the evidence that delayed escalation harms is observational and confounded by indication. The two guideline bodies publishing on this condition are, as of 2025, publicly split.'}</p>
      <p className="syringe__remaining">Escalation intent: {assessment.escalationIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-escalation-intent', 'Record bounded escalation intent', assessment.escalationIntentAtTick !== null)}
        {decision('review-boundaries', 'Review what the triage evidence establishes', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange oxygen-requirement and conscious-level surveillance', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe severe-pneumonia__section" aria-labelledby="severe-pneumonia-observation-title">
      <div id="severe-pneumonia-observation-title" className="syringe__name">Read the saturation with its oxygen.</div>
      <p className="syringe__remaining">{labs
        ? `Last requested laboratory evidence at simulated ${formatElapsed(labs.atTick)}: urea ${labs.ureaMmolL.toFixed(1)} mmol/L; white cells ${labs.whiteCellsX109L.toFixed(1)} x10^9/L; C-reactive protein ${labs.crpMgL} mg/L; sodium ${labs.sodiumMmolL} mmol/L; lactate ${labs.lactateMmolL.toFixed(1)} mmol/L. A laboratory-only check does not refresh the respiratory assessment.`
        : 'No new laboratory-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{respiratory
        ? `Last requested respiratory assessment at simulated ${formatElapsed(respiratory.atTick)}: respiratory rate ${respiratory.respiratoryRateBpm}/min; oxygen saturation ${respiratory.spo2Percent}% on an inspired fraction of ${respiratory.fio2.toFixed(2)}; oxygenation ratio ${respiratory.pfRatio}; ${respiratory.confused ? 'newly confused' : 'orientated'}. A respiratory-only look does not refresh laboratory evidence.`
        : 'No new respiratory-only assessment has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; oxygenation ratio ${observation.pfRatio} on an inspired fraction of ${observation.fio2.toFixed(2)}; lactate ${observation.lactateMmolL.toFixed(1)} mmol/L; mortality score ${observation.mortalityScore}; severity criteria met ${observation.severityCriteria}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.deteriorationDueInSeconds !== null && <p className="syringe__remaining">Authored deterioration in {Math.ceil(assessment.deteriorationDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">A saturation without its inspired fraction says very little: 92 percent on room air and 92 percent on a third inspired oxygen describe very different lungs, and it is the ratio that enters the severity criteria.</p>
      {assessment.deteriorationObserved && <p className="syringe__remaining">The mortality score has caught up and now reads 4. It was always going to, and it was never the instrument for the question of where this patient should be.</p>}
      {(assessment.mortalityScoreAttempted || assessment.waitAttempted || assessment.markerSeverityAttempted || assessment.saturationAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the pending level-of-care decision and continuing risk are handed off. Whether a critical-care bed exists is a real-world constraint this rehearsal does not model.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-labs', 'Check laboratory evidence only')}{decision('check-respiratory', 'Check the respiratory assessment only')}
        {decision('reassess', 'Reassess respiratory and laboratory response')}
        {decision('handoff', 'Hand off a pending level-of-care decision')}
        {decision('mortality-score-decides-the-bed', 'Let the mortality score settle the ward decision')}
        {decision('wait-for-deterioration', 'Request review once he deteriorates')}
        {decision('marker-grades-severity', 'Grade severity by the C-reactive protein')}
        {decision('saturation-alone-is-adequate', 'Read the saturation as adequate on its own')}
      </div>
    </section>
  </>;
}
