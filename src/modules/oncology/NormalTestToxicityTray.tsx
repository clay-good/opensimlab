import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { NormalTestToxicitySnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { NormalTestToxicityAction } from './normal-test-toxicity';
import { normalTestToxicityInlinePrompt } from './normal-test-toxicity-tutor';

export function NormalTestToxicityTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: NormalTestToxicitySnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: NormalTestToxicityAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = normalTestToxicityInlinePrompt(guidance, { scenarioVersion, normalTestToxicity: assessment });
  const observations = assessment.observationRecord; const treatment = assessment.treatmentRecord;
  const observation = assessment.observation;
  const decision = (action: NormalTestToxicityAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* The drug status leads, because it is the only thing here that changes with the clock. */}
    <p className="syringe__remaining" role="status">Cycle {assessment.cycleNumber}, day {assessment.dayOfCycle}. The drug is {assessment.drugWithheldAtTick === null ? 'NOT withheld' : 'withheld'}. The supply is {assessment.supplyHeldByPatient ? 'in his own bag' : 'held by the service'}.</p>
    <p className="syringe__remaining">Selected sources: a prospective safety analysis of pre-treatment genotype-guided dosing, and a meta-analysis of variant predictors of severe toxicity across 7365 patients. Open the source view for exact wording and grades.</p>
    <section className="syringe normal-test-toxicity__section" aria-labelledby="normal-test-toxicity-action-title">
      <div id="normal-test-toxicity-action-title" className="syringe__name">One action here needs nobody’s permission.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 96/min, blood pressure 112/68 mmHg, respiratory rate 16/min, oxygen saturation 98% in air, and temperature 36.9 C, with eight stools a day above baseline since yesterday, a mouth too sore to eat, and painful peeling palms and soles. These remain historical starting observations.</p>
      <p className="syringe__remaining">The referral letter states at the top that his pre-treatment genotype panel was {assessment.genotypePanelWildType ? 'wild type' : 'variant'}. He took this morning’s dose.</p>
      <p className="syringe__remaining">Drug: {assessment.drugWithheldAtTick === null ? 'not yet withheld' : `withheld at simulated ${formatElapsed(assessment.drugWithheldAtTick)}`}. Toxicity: {assessment.toxicityRecordedAtTick === null ? 'not yet recorded' : 'recorded with its severity and cycle day'}. What the test excludes: {assessment.exclusionsRecordedAtTick === null ? 'not yet recorded' : 'recorded'}.</p>
      <div className="crisis-drug__actions">
        {decision('withhold-the-drug-now', 'Withhold the drug now', assessment.drugWithheldAtTick !== null)}
        {decision('record-the-toxicity-and-its-severity', 'Record the toxicity and its severity', assessment.toxicityRecordedAtTick !== null)}
        {decision('record-what-the-normal-test-does-not-exclude', 'Record what the normal test does not exclude', assessment.exclusionsRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe normal-test-toxicity__section" aria-labelledby="normal-test-toxicity-evidence-title">
      <div id="normal-test-toxicity-evidence-title" className="syringe__name">A panel that stratifies risk is not a clearance.</div>
      <p className="syringe__remaining">{assessment.exclusionsRecordedAtTick === null
        ? 'A normal result on a pre-treatment panel is not the same as a patient who has been cleared. Record what it does and does not support.'
        : 'In the cohort that established genotype-guided dosing, severe toxicity still occurred in 231 of 1018 wild-type patients — 23 percent — and in 39 percent of variant carriers after their doses were reduced. Severe toxicity is reported in up to 30 percent of patients on these drugs.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what this result licenses.'
        : 'Supplied boundaries: the variants screened for were associated with severe toxicity at adjusted relative risks of roughly 2.9 to 4.4 across 7365 patients, which is why a wild-type result means those variants were absent rather than that the enzyme works. Nothing here diagnoses a deficiency, and none of these figures is a probability for this patient.'}</p>
      <p className="syringe__remaining">Acute oncology: {assessment.escalationAtTick === null ? 'not yet contacted' : `contacted at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded supportive intent: {assessment.supportiveIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-acute-oncology', 'Contact acute oncology', assessment.escalationAtTick !== null)}
        {decision('record-bounded-supportive-intent', 'Record bounded qualified-team intent', assessment.supportiveIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe normal-test-toxicity__section" aria-labelledby="normal-test-toxicity-observation-title">
      <div id="normal-test-toxicity-observation-title" className="syringe__name">Reassess. The clock is the only thing moving.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}% on air; temperature ${observations.coreTemperatureC.toFixed(1)} C; ${observations.stoolsToday} stools today. This partial check supplies nothing about the treatment record.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{treatment
        ? `Last requested treatment record at simulated ${formatElapsed(treatment.atTick)}: cycle ${treatment.cycleNumber}, day ${treatment.dayOfCycle}; pre-treatment panel ${treatment.genotypeResult}; supply ${treatment.suppliedToPatient ? 'held by the patient' : 'held by the service'}; drug ${treatment.drugWithheld ? 'withheld' : 'not withheld'}.`
        : 'No new treatment-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; ${observation.stoolsToday} stools today; drug ${observation.drugWithheld ? 'withheld' : 'not withheld'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.nextDoseDue && <p className="syringe__remaining">{assessment.nextDoseTaken
        ? 'The evening dose fell due and he took it, because nobody had told him not to. He did what he was asked to do.'
        : 'The evening dose fell due. He took the box out, looked at it, and put it back, because he had been told plainly not to take it and why.'}</p>}
      {assessment.serviceObserved && <p className="syringe__remaining">Acute oncology has answered. They confirm the drug stays stopped and own grading, further treatment, and any restart.</p>}
      {(assessment.testExclusionAttempted || assessment.waitForServiceAttempted || assessment.doseAdviceAttempted || assessment.symptomaticOnlyAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the stopped drug and when it stopped, what the normal panel does not exclude, the toxicity with its severity and cycle day, and whether a further dose was taken all travel with him. No deficiency, grade, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-the-treatment-record', 'Check the treatment record only')}
        {decision('reassess', 'Reassess observations and treatment record')}
        {decision('handoff', 'Hand off the stopped drug and what it rests on')}
        {decision('the-test-was-normal-so-not-the-drug', 'The test was normal, so not the drug')}
        {decision('wait-for-oncology-before-stopping', 'Wait for oncology before stopping')}
        {decision('advise-him-to-halve-the-dose', 'Advise him to halve the dose')}
        {decision('treat-the-symptoms-and-review-tomorrow', 'Treat the symptoms and review tomorrow')}
      </div>
    </section>
  </>;
}
