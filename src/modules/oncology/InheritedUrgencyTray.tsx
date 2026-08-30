import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { InheritedUrgencySnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { InheritedUrgencyAction } from './inherited-urgency';
import { inheritedUrgencyInlinePrompt } from './inherited-urgency-tutor';

export function InheritedUrgencyTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: InheritedUrgencySnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: InheritedUrgencyAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = inheritedUrgencyInlinePrompt(guidance, { scenarioVersion, inheritedUrgency: assessment });
  const observations = assessment.observationRecord; const imaging = assessment.imagingRecord;
  const observation = assessment.observation;
  const decision = (action: InheritedUrgencyAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* The grade comes from the findings. The swelling is how this looks at every grade. */}
    <p className="syringe__remaining" role="status">Facial and neck swelling with filled neck veins and chest-wall collaterals. The findings that would make this the grade that cannot wait are {assessment.emergencyFindingsPresent ? 'present' : 'not present'}: no stridor, fully alert, blood pressure unchanged.</p>
    <p className="syringe__remaining">Selected sources: a review of evolving etiologies and treatment strategies for the superior vena cava syndrome, and the proposed classification system it grades against. Open the source view for exact wording and grades.</p>
    <section className="syringe inherited-urgency__section" aria-labelledby="inherited-urgency-findings-title">
      <div id="inherited-urgency-findings-title" className="syringe__name">Three findings decide whether this waits.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 88/min, blood pressure 128/76 mmHg, respiratory rate 18/min, oxygen saturation 96% in air, and temperature 36.8 C. These remain historical starting observations.</p>
      <p className="syringe__remaining">There is no tissue diagnosis. The biopsy list is tomorrow morning.</p>
      <p className="syringe__remaining">Grading findings: {assessment.findingsRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.findingsRecordedAtTick)}`}. The tissue decides: {assessment.tissueRecordedAtTick === null ? 'not recorded' : 'recorded'}. Diagnostic pathway: {assessment.pathwaySecuredAtTick === null ? 'not yet secured' : `secured at simulated ${formatElapsed(assessment.pathwaySecuredAtTick)}`}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-findings-that-would-make-it-an-emergency', 'Record the findings that would make it an emergency', assessment.findingsRecordedAtTick !== null)}
        {decision('record-that-the-tissue-decides-the-treatment', 'Record that the tissue decides the treatment', assessment.tissueRecordedAtTick !== null)}
        {decision('secure-the-diagnostic-pathway', 'Secure the diagnostic pathway', assessment.pathwaySecuredAtTick !== null)}
      </div>
    </section>
    <section className="syringe inherited-urgency__section" aria-labelledby="inherited-urgency-evidence-title">
      <div id="inherited-urgency-evidence-title" className="syringe__name">Somebody is offering to treat him tonight.</div>
      <p className="syringe__remaining">{assessment.treatmentOffered
        ? 'The radiation oncology registrar has a slot tonight and is willing to use it. Nothing about the patient has changed since you started: what arrived is an offer, not a deterioration.'
        : 'The biopsy list is tomorrow morning. What is decided before then decides what can be decided after it.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? `About ${assessment.lifeThreateningGradePercent} percent present with the life-threatening grade. Review the boundaries and the certainty behind them, in both directions, before deciding what that proportion licenses.`
        : `Supplied boundaries: only about ${assessment.lifeThreateningGradePercent} percent present with the grade defined by significant cerebral oedema, significant laryngeal oedema, or significant haemodynamic compromise, and any of those is an indication for emergent intervention. Death is very rarely caused by the syndrome itself; one series of 1,986 patients reported one death. A proportion is not this patient’s risk, and it is not a reason to stop looking.`}</p>
      <p className="syringe__remaining">Bounded intent: {assessment.treatmentIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-bounded-treatment-intent', 'Record bounded qualified-team intent', assessment.treatmentIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe inherited-urgency__section" aria-labelledby="inherited-urgency-observation-title">
      <div id="inherited-urgency-observation-title" className="syringe__name">Reassess. Absent and checked is not absent and assumed.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}% on air; ${observations.stridor ? 'stridor present' : 'no stridor'}; ${observations.consciousLevel}.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{imaging
        ? `Last requested supplied imaging at simulated ${formatElapsed(imaging.atTick)}: computed tomogram taken ${imaging.imagingAgeHours} hours ago with caval compression and ${imaging.caudalCollaterals ? 'collateral filling' : 'no collateral filling'}; ${imaging.tissueDiagnosisAvailable ? 'tissue diagnosis available' : 'no tissue diagnosis'}; biopsy ${imaging.biopsyBooked ? 'booked' : 'not yet booked'}. Supplied, not acquired.`
        : 'No new imaging check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: respiratory rate ${observation.respiratoryRateBpm}/min; oxygen saturation ${observation.spo2Percent}% on air; ${observation.stridor ? 'stridor present' : 'no stridor'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.treatmentOffered && <p className="syringe__remaining">A treatment slot has been offered for tonight. The patient is as he was.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">Acute oncology has accepted him, the biopsy is booked and flagged for the morning, and the ward knows which findings to call about. They own radiotherapy, stenting, systemic therapy, steroid and anticoagulation decisions.</p>}
      {(assessment.treatBeforeTissueAttempted || assessment.swellingOnlyAttempted || assessment.sendHomeAttempted || assessment.diureticAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the imaging finding, the grading findings and when they were last checked, the state of the biopsy booking, and what to call about overnight all travel with him. No diagnosis, treatment effect, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-the-supplied-imaging', 'Check the supplied imaging only')}
        {decision('reassess', 'Reassess the patient and the imaging')}
        {decision('handoff', 'Hand off what would change the answer')}
        {decision('start-radiotherapy-tonight-before-the-biopsy', 'Start radiotherapy tonight, before the biopsy')}
        {decision('the-swelling-alone-makes-it-an-emergency', 'The swelling alone makes it an emergency')}
        {decision('send-him-home-to-await-the-biopsy', 'Send him home to await the biopsy')}
        {decision('treat-the-distended-veins-with-a-diuretic', 'Treat the distended veins with a diuretic')}
      </div>
    </section>
  </>;
}
