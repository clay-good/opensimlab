import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalPhosphateTargetSnapshot } from '@platform/kernel/protocol';
import type { RenalPhosphateAction } from './phosphate-target';
import { renalPhosphateTargetInlinePrompt, RENAL_PHOSPHATE_SOURCE_HREF } from './renal-phosphate-target-tutor';

export function RenalPhosphateTargetTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalPhosphateTargetSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalPhosphateAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalPhosphateTargetInlinePrompt(guidance, { scenarioVersion, renalPhosphateTarget: assessment });
  const observation = assessment.observation; const phosphate = assessment.phosphateObservation;
  const nutrition = assessment.nutritionObservation;
  const decision = (action: RenalPhosphateAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected source: <a href={RENAL_PHOSPHATE_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>2012 randomised comparison of three binders against placebo</a> (opens in a new tab). One hundred and forty-eight patients over nine months, with the phosphorus change as the primary endpoint and the calcification findings secondary. The patient here is fictional.</p>
    <section className="syringe renal-phosphate__section" aria-labelledby="renal-phosphate-surrogate-title">
      <div id="renal-phosphate-surrogate-title" className="syringe__name">The target is standing in for something.</div>
      <p className="syringe__remaining">Supplied: estimated GFR 26 mL/min/1.73 m², not on dialysis. Phosphate 1.62 mmol/L, calcium 2.24, parathyroid hormone 31 pmol/L, bicarbonate 22. The clinic protocol is to start a binder to bring the phosphate into the printed range.</p>
      <p className="syringe__remaining">{assessment.surrogateReviewedAtTick === null
        ? 'Name what the range is standing in for before treating toward it.'
        : 'Recorded: the target is a serum value standing in for vascular and bone outcomes nobody in this room can see, and that this rehearsal never supplies. Moving the value is not the same as moving what it stands for — which says nothing about whether his phosphate is harmless.'}</p>
      <p className="syringe__remaining">{assessment.trialReviewedAtTick === null
        ? 'There is a randomised comparison in his own population. Read it, including the half that rarely gets quoted.'
        : 'Recorded: in 148 patients with an estimated GFR of 20–45 randomised to calcium acetate, lanthanum, sevelamer, or placebo, serum and urinary phosphorus fell and secondary hyperparathyroidism was attenuated — and coronary and abdominal aortic calcification increased significantly against placebo. The authors concluded that safety and efficacy remain uncertain. Uncertainty in both directions, from one trial of 148 patients over nine months.'}</p>
      <p className="syringe__remaining">Surrogate: {assessment.surrogateReviewedAtTick === null ? 'not named' : 'named'}. Trial: {assessment.trialReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Decision: {assessment.decisionOwnedAtTick === null ? 'not yet owned' : 'owned by the qualified team'}.</p>
      <div className="crisis-drug__actions">
        {decision('review-surrogate', 'Name the target as a surrogate', assessment.surrogateReviewedAtTick !== null)}
        {decision('review-trial', 'Review the randomised comparison', assessment.trialReviewedAtTick !== null)}
        {decision('own-decision', 'Place the binder decision with the team', assessment.decisionOwnedAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-phosphate__section" aria-labelledby="renal-phosphate-intake-title">
      <div id="renal-phosphate-intake-title" className="syringe__name">Two restrictions already. Six kilograms gone.</div>
      <p className="syringe__remaining">{assessment.intakeReviewedAtTick === null
        ? 'Before tightening anything again, ask what he is actually eating and how he has been doing on what was already asked of him.'
        : 'Reviewed: the diet has been restricted twice, appetite has been poor for four months, and nobody has discussed the difference between protein-bound phosphate and the additive phosphate in processed food and drinks. What he is eating is not in any number on this screen.'}</p>
      <p className="syringe__remaining">Weight 74 kg a year ago, 68 kg today. Albumin 38 g/L a year ago, 31 g/L today. Those are findings, not a diagnosis of malnutrition, and not proof the restrictions caused them.</p>
      <p className="syringe__remaining">This lesson selects no binder, no dose, no diet, no target, and no education programme, and it does not decide whether a binder should be started.</p>
      <p className="syringe__remaining">Intake: {assessment.intakeReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Support: {assessment.supportActive ? 'active' : 'not yet called'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged with the weight trend open'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('review-intake', 'Review what he is actually eating', assessment.intakeReviewedAtTick !== null)}
        {decision('call-support', 'Call qualified renal and dietetic support', assessment.supportActive)}
        {decision('monitor', 'Arrange continuing biochemical and nutritional review', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-phosphate__section" aria-labelledby="renal-phosphate-observation-title">
      <div id="renal-phosphate-observation-title" className="syringe__name">Which column actually moved?</div>
      <p className="syringe__remaining">{phosphate
        ? `Last requested phosphate at simulated ${formatElapsed(phosphate.atTick)}: ${phosphate.phosphateMmolL.toFixed(2)} mmol/L. It has not changed, because nothing in this rehearsal is a treatment.`
        : 'No new phosphate-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{nutrition
        ? `Last requested nutritional findings at simulated ${formatElapsed(nutrition.atTick)}: weight ${nutrition.weightKg} kg, albumin ${nutrition.albuminGL} g/L. These are findings, not a diagnosis of malnutrition.`
        : 'No new nutritional findings have been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: phosphate ${observation.phosphateMmolL.toFixed(2)} mmol/L; weight ${observation.weightKg} kg; albumin ${observation.albuminGL} g/L; parathyroid hormone ${observation.parathyroidPmolL} pmol/L; ${observation.restrictionsApplied} dietary restrictions documented in the retrieved letters. These are historical observations, not live measurements.`
        : 'No new full phosphate, nutritional, and record assessment has been requested.'}</p>
      {assessment.recordsDueInSeconds !== null && <p className="syringe__remaining">Authored records-retrieval checkpoint in {Math.ceil(assessment.recordsDueInSeconds / 60)} simulated min.</p>}
      {assessment.recordsOpened && <p className="syringe__remaining">The previous clinic letters are open. They record what was restricted and when. They establish no cause for the weight and albumin change, and they contain no vascular imaging or bone assessment.</p>}
      <p className="syringe__remaining">The phosphate does not change across this rehearsal. No vascular imaging, bone assessment, or outcome is available at any point, which is the same absence the target itself carries.</p>
      {assessment.unexaminedContrastObserved && <p className="syringe__remaining">A full assessment recorded the authored contrast in which the protocol target stood unexamined. It is a teaching comparison, not a prediction.</p>}
      {(assessment.treatTheNumberAttempted || assessment.restrictFurtherAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the decision is handed on with the context the number does not carry. No target, outcome, cause, or discharge readiness is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-phosphate', 'Check phosphate only')}{decision('check-nutrition', 'Check weight and albumin only')}
        {decision('reassess', 'Reassess phosphate, nutrition, and the record')}
        {decision('handoff', 'Hand off the owned decision and its context')}
        {decision('treat-the-number', 'Start a binder to bring the value into range')}
        {decision('restrict-further', 'Tighten the dietary restriction again')}
      </div>
    </section>
  </>;
}
