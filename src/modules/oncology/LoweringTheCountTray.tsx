import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { LoweringTheCountSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { LoweringTheCountAction } from './lowering-the-count';
import { loweringTheCountInlinePrompt } from './lowering-the-count-tutor';

export function LoweringTheCountTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: LoweringTheCountSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: LoweringTheCountAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = loweringTheCountInlinePrompt(guidance, { scenarioVersion, loweringTheCount: assessment });
  const observations = assessment.observationRecord; const results = assessment.resultRecord;
  const observation = assessment.observation;
  const decision = (action: LoweringTheCountAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* The count and the findings together. The count alone is the thing being refused. */}
    <p className="syringe__remaining" role="status">Supplied white cell count {assessment.whiteCellCount} × 10⁹/L with blasts on the film, breathless at rest and confused. Leukostasis here is {assessment.leukostasisIsClinical ? 'a clinical designation, not a number' : 'defined by the count'}.</p>
    <p className="syringe__remaining">Selected sources: a systematic review and meta-analysis of leukapheresis in acute myeloid leukaemia, and a narrative review of haematological emergencies. Open the source view for exact wording and grades.</p>
    <section className="syringe lowering-the-count__section" aria-labelledby="lowering-the-count-picture-title">
      <div id="lowering-the-count-picture-title" className="syringe__name">The findings, not the number, make this an emergency.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 108/min, blood pressure 108/62 mmHg, respiratory rate 26/min, oxygen saturation 92% in air, and temperature 37.4 C. These remain historical starting observations.</p>
      <p className="syringe__remaining">There is no marrow result. The haematology registrar is elsewhere in the hospital.</p>
      <p className="syringe__remaining">Clinical picture: {assessment.pictureRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.pictureRecordedAtTick)}`}. What the count licenses: {assessment.licenceRecordedAtTick === null ? 'not recorded' : 'recorded'}. Haematology: {assessment.escalationAtTick === null ? 'not yet called' : `called at simulated ${formatElapsed(assessment.escalationAtTick)}`}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-clinical-picture-not-the-count', 'Record the clinical picture, not the count', assessment.pictureRecordedAtTick !== null)}
        {decision('escalate-to-haematology-now', 'Call haematology now', assessment.escalationAtTick !== null)}
        {decision('record-what-the-count-does-and-does-not-license', 'Record what the count does not license', assessment.licenceRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe lowering-the-count__section" aria-labelledby="lowering-the-count-evidence-title">
      <div id="lowering-the-count-evidence-title" className="syringe__name">You can move the number. That is not the question.</div>
      <p className="syringe__remaining">{assessment.licenceRecordedAtTick === null
        ? 'Up to 20 percent of acute myeloid leukaemia presents with a count above 100 and early mortality is high, so cytoreduction is indicated. Which one, and by what route, is a different question.'
        : 'Emergent cytoreduction is indicated and the optimal strategy is unknown; a systematic review found no standardised guidelines. The count licenses urgency and does not select a manoeuvre.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them, in both directions, before deciding what a falling count would prove.'
        : 'Supplied boundaries: across 13 retrospective studies of 1,743 patients the risk ratio for early death with leukapheresis was 0.88, 95% confidence interval 0.69 to 1.13, and its authors argue against routine use. That interval includes benefit as well as harm, and the studies show their own confounding — patients with clinical leukostasis were about twice as likely to receive it. Nobody has shown it helps; that is not the same as showing it does not.'}</p>
      <p className="syringe__remaining">Bounded intent: {assessment.treatmentIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-bounded-cytoreduction-intent', 'Record bounded qualified-team intent', assessment.treatmentIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe lowering-the-count__section" aria-labelledby="lowering-the-count-observation-title">
      <div id="lowering-the-count-observation-title" className="syringe__name">Reassess. He is the thing that is moving.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}% on air; ${observations.consciousLevel}.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{results
        ? `Last requested supplied results at simulated ${formatElapsed(results.atTick)}: white cell count ${results.whiteCellCount} × 10⁹/L with blasts, taken ${results.resultAgeMinutes} minutes ago; ${results.marrowAvailable ? 'marrow available' : 'no marrow result'}. Supplied, not acquired.`
        : 'No new results check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: respiratory rate ${observation.respiratoryRateBpm}/min; oxygen saturation ${observation.spo2Percent}% on air; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.clinicallyWorse && <p className="syringe__remaining">He is more breathless and harder to rouse than he was. The supplied count has not changed, because it is the same sample.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">Haematology has answered and is coming. They own the cytoreduction strategy, transfusion, prophylaxis and definitive treatment, and say that treating the leukaemia is what changes his outcome.</p>}
      {(assessment.apheresisStandDownAttempted || assessment.countOnlyAttempted || assessment.waitForMarrowAttempted || assessment.deliriumAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the count with the findings that make it an emergency, their timing, any deterioration, and the bounded intent all travel with him. No diagnosis, treatment effect, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-the-supplied-results', 'Check the supplied results only')}
        {decision('reassess', 'Reassess the patient and the results')}
        {decision('handoff', 'Hand off what makes it an emergency')}
        {decision('send-him-for-apheresis-and-stand-down', 'Send him for apheresis and stand down')}
        {decision('the-count-alone-makes-the-diagnosis', 'The count alone makes the diagnosis')}
        {decision('wait-for-the-marrow-before-calling', 'Wait for the marrow before calling')}
        {decision('treat-the-confusion-as-delirium', 'Treat the confusion as delirium')}
      </div>
    </section>
  </>;
}
