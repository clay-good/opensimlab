import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { LaboratoryTlsSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { LaboratoryTlsAction } from './laboratory-tls';
import { laboratoryTlsInlinePrompt } from './laboratory-tls-tutor';

export function LaboratoryTlsTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: LaboratoryTlsSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: LaboratoryTlsAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = laboratoryTlsInlinePrompt(guidance, { scenarioVersion, laboratoryTls: assessment });
  const observations = assessment.observationRecord; const bloods = assessment.bloodRecord;
  const observation = assessment.observation;
  const decision = (action: LaboratoryTlsAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* Both halves, always together. Either alone is one of the two readings the ward is stuck on. */}
    <p className="syringe__remaining" role="status">Laboratory criteria: {assessment.laboratoryCriteriaMet ? 'met' : 'not met'}. Clinical criteria: {assessment.clinicalCriteriaMet ? 'met' : 'not met'}. This is {assessment.hoursAfterTreatment} hours after the first cycle.</p>
    <p className="syringe__remaining">Selected sources: the 1993 series that defined both terms, a 788-patient European incidence review, and a 2024 narrative review of haematological emergencies. Open the source view for exact wording and grades.</p>
    <section className="syringe laboratory-tls__section" aria-labelledby="laboratory-tls-definition-title">
      <div id="laboratory-tls-definition-title" className="syringe__name">The definition is met by his results, not by him.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 86/min, blood pressure 126/74 mmHg, respiratory rate 16/min, oxygen saturation 98% in air, temperature 36.8 C, sinus rhythm, and passing urine freely. These remain historical starting observations.</p>
      <p className="syringe__remaining">The ward is split: that he has tumour lysis syndrome and needs intensive care, and that he is well so these are just numbers. He is asking when he can have breakfast.</p>
      <p className="syringe__remaining">Definition recorded: {assessment.definitionRecordedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(assessment.definitionRecordedAtTick)}`}. What crossed and when: {assessment.crossingRecordedAtTick === null ? 'not recorded' : 'recorded'}. Crossing risk: {assessment.riskRecordedAtTick === null ? 'not recorded' : 'recorded'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-which-definition-is-met', 'Record which definition is met', assessment.definitionRecordedAtTick !== null)}
        {decision('record-what-crossed-and-when', 'Record what crossed, and when', assessment.crossingRecordedAtTick !== null)}
        {decision('record-the-crossing-risk', 'Record what raises the risk of crossing', assessment.riskRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe laboratory-tls__section" aria-labelledby="laboratory-tls-window-title">
      <div id="laboratory-tls-window-title" className="syringe__name">A window, not an event.</div>
      <p className="syringe__remaining">{assessment.crossingRecordedAtTick === null
        ? 'Laboratory changes come before anything is visible. The hours since treatment decide whether this is early in a window or late in an event.'
        : 'Laboratory changes are described within the first 6 to 24 hours and the first clinical signs at 48 to 72. A well patient with moved bloods at 18 hours is the expected appearance of the thing being watched for.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what this label licenses.'
        : 'Supplied boundaries: 42 percent laboratory and 6 percent clinical in the defining 102-patient series; hyperuricaemia in 18.9 percent of 788 European patients with 27.8 percent of those meeting tumour-lysis criteria. A 2024 review restates that second study as a laboratory rate of 18.9 percent, which is not what it measured. None of these is a probability for this man.'}</p>
      <p className="syringe__remaining">Treating team: {assessment.escalationAtTick === null ? 'not yet contacted' : `contacted at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.treatmentIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-the-treating-team', 'Report the trajectory to the treating team', assessment.escalationAtTick !== null)}
        {decision('record-bounded-monitoring-and-treatment-intent', 'Record bounded qualified-team intent', assessment.treatmentIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe laboratory-tls__section" aria-labelledby="laboratory-tls-observation-title">
      <div id="laboratory-tls-observation-title" className="syringe__name">Reassess. The bloods move; he does not.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; temperature ${observations.coreTemperatureC.toFixed(1)} C; rhythm ${observations.rhythm}; ${observations.urineOutput}. This partial check supplies no blood results.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{bloods
        ? `Last requested bloods at simulated ${formatElapsed(bloods.atTick)}, ${bloods.hoursAfterTreatment} hours after treatment: phosphate, potassium and urate ${bloods.risingSet ? 'risen again from the previous set' : 'risen from pre-treatment'}; corrected calcium fallen; creatinine ${bloods.creatinineUnchanged ? 'unchanged' : 'changed'}. Laboratory criteria ${bloods.laboratoryCriteriaMet ? 'met' : 'not met'}; clinical criteria ${bloods.clinicalCriteriaMet ? 'met' : 'not met'}.`
        : 'No new blood check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; rhythm ${observation.rhythm}; creatinine ${observation.creatinineUnchanged ? 'unchanged' : 'changed'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.repeatReturned && <p className="syringe__remaining">The repeat set has returned: the phosphate has risen again and the corrected calcium fallen further, with the creatinine unchanged and the rhythm sinus. The laboratory picture has moved and the patient has not.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The treating team has answered. They own hydration, hypouricaemic treatment, monitoring frequency and any renal referral, and have asked to be told if the creatinine moves or the rhythm changes rather than when the next number crosses a line.</p>}
      {(assessment.dismissalAttempted || assessment.overcallAttempted || assessment.waitForNextSetAttempted || assessment.standDownAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: which definition is met, what crossed and when, his pre-treatment renal function, and what the team asked to be told all travel with him. No clinical tumour lysis or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-the-bloods', 'Check the bloods only')}
        {decision('reassess', 'Reassess the patient and the bloods')}
        {decision('handoff', 'Hand off the window and what it rests on')}
        {decision('he-is-well-so-it-is-just-numbers', 'He is well, so these are just numbers')}
        {decision('call-it-tumour-lysis-and-move-him-to-intensive-care', 'Call it tumour lysis, move him to intensive care')}
        {decision('wait-for-the-next-set-before-telling-anyone', 'Wait for the next set before telling anyone')}
        {decision('treat-the-potassium-and-stand-down', 'Treat the potassium and stand down')}
      </div>
    </section>
  </>;
}
