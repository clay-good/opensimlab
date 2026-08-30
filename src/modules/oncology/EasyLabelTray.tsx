import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { EasyLabelSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EasyLabelAction } from './easy-label';
import { easyLabelInlinePrompt } from './easy-label-tutor';

export function EasyLabelTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: EasyLabelSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: EasyLabelAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = easyLabelInlinePrompt(guidance, { scenarioVersion, easyLabel: assessment });
  const observations = assessment.observationRecord; const results = assessment.resultRecord;
  const observation = assessment.observation;
  const decision = (action: EasyLabelAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* The label and the thing it still requires, in the same sentence, always. */}
    <p className="syringe__remaining" role="status">{assessment.stoolsAboveBaseline} stools a day above his baseline, four cycles in. The obvious label is a diagnosis of exclusion, and the competing causes are {assessment.competingCausesExcluded ? 'excluded' : 'not excluded'}.</p>
    <p className="syringe__remaining">Selected sources: a review of the differential diagnosis and management of this colitis, and a clinical practice update on its diagnosis and management. Open the source view for exact wording and grades.</p>
    <section className="syringe easy-label__section" aria-labelledby="easy-label-exclusion-title">
      <div id="easy-label-exclusion-title" className="syringe__name">A label is not a diagnosis until the exclusion has happened.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 92/min, blood pressure 118/72 mmHg, respiratory rate 18/min, temperature 36.8 C, and oxygen saturation 97% in air. These remain historical starting observations.</p>
      <p className="syringe__remaining">No microbiological studies have been reported. {assessment.historySurfaced ? 'The discharge summary in his record reports an admission and a course of antibiotics three weeks ago.' : 'A discharge summary sits unopened in his record.'}</p>
      <p className="syringe__remaining">Exclusion requirement: {assessment.exclusionRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.exclusionRecordedAtTick)}`}. What remains open: {assessment.outstandingRecordedAtTick === null ? 'not recorded' : 'recorded'}. Treating team: {assessment.escalationAtTick === null ? 'not yet called' : `called at simulated ${formatElapsed(assessment.escalationAtTick)}`}.</p>
      <div className="crisis-drug__actions">
        {decision('record-that-the-label-is-a-diagnosis-of-exclusion', 'Record that the label is a diagnosis of exclusion', assessment.exclusionRecordedAtTick !== null)}
        {decision('record-what-has-not-been-excluded', 'Record what has not been excluded', assessment.outstandingRecordedAtTick !== null)}
        {decision('escalate-so-both-can-start-together', 'Escalate so both can start together', assessment.escalationAtTick !== null)}
      </div>
    </section>
    <section className="syringe easy-label__section" aria-labelledby="easy-label-evidence-title">
      <div id="easy-label-evidence-title" className="syringe__name">Two rules, both true, pulling opposite ways.</div>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Treatment is indicated at grade 2 or above, and the competing causes have to be excluded first. Review the boundaries before deciding which of those you are going to disobey.'
        : 'Supplied boundaries: guidelines universally recommend corticosteroids as initial management at grade 2 or above, so delay is not free. And this is a diagnosis of exclusion whose competing causes present indistinguishably, with these patients at increased risk of infectious colitis, so microbiological studies should be performed first. Neither half can be dropped; only one of the two decisions has to wait for a result.'}</p>
      <p className="syringe__remaining">Bounded intent: {assessment.treatmentIntentAtTick === null ? 'not recorded' : 'recorded as the treating team’s and gastroenterology’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-bounded-treatment-intent', 'Record bounded qualified-team intent', assessment.treatmentIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe easy-label__section" aria-labelledby="easy-label-observation-title">
      <div id="easy-label-observation-title" className="syringe__name">Reassess. Looking at him will not separate the two.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; temperature ${observations.coreTemperatureC.toFixed(1)} C; ${observations.stoolsAboveBaseline} stools a day above baseline; ${observations.bloodInStool ? 'blood reported' : 'no blood reported'}.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{results
        ? `Last requested supplied results at simulated ${formatElapsed(results.atTick)}: ${results.microbiologyReported ? 'microbiology reported' : 'no microbiology reported'}; ${results.recentAntibiotics ? 'recent antibiotics and admission recorded' : 'no recent antibiotic exposure surfaced'}; ${results.cyclesCompleted} cycles completed. Supplied, not acquired.`
        : 'No new results check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: temperature ${observation.coreTemperatureC.toFixed(1)} C; ${observation.stoolsAboveBaseline} stools a day above baseline; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.historySurfaced && <p className="syringe__remaining">The discharge summary has surfaced. He had an admission and antibiotics three weeks ago, and nothing about him has changed since you started.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The treating team and gastroenterology have answered. They own the samples and the treatment decision together, not one behind the other.</p>}
      {(assessment.immunosuppressionAttempted || assessment.waitForAllAttempted || assessment.noFeverAttempted || assessment.fourCyclesAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: that the label requires exclusion and the exclusion has not happened, which causes remain open, the recent antibiotics, and the state of both halves all travel with him. No diagnosis, treatment effect, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-the-supplied-results', 'Check the supplied results only')}
        {decision('reassess', 'Reassess the patient and the results')}
        {decision('handoff', 'Hand off the open question')}
        {decision('start-immunosuppression-now-it-is-obviously-colitis', 'Start immunosuppression now, it is obviously colitis')}
        {decision('wait-for-every-result-before-telling-anyone', 'Wait for every result before telling anyone')}
        {decision('no-fever-so-it-cannot-be-infection', 'No fever, so it cannot be infection')}
        {decision('four-cycles-in-so-it-is-the-drug', 'Four cycles in, so it is the drug')}
      </div>
    </section>
  </>;
}
