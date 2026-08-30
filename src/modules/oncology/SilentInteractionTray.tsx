import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { SilentInteractionSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SilentInteractionAction } from './silent-interaction';
import { silentInteractionInlinePrompt } from './silent-interaction-tutor';

export function SilentInteractionTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: SilentInteractionSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: SilentInteractionAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = silentInteractionInlinePrompt(guidance, { scenarioVersion, silentInteraction: assessment });
  const observations = assessment.observationRecord; const records = assessment.recordCheck;
  const observation = assessment.observation;
  const decision = (action: SilentInteractionAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* The absence is the presentation. Say so first, and keep saying it. */}
    <p className="syringe__remaining" role="status">She feels well and there is {assessment.anyAbnormalFinding ? 'an abnormal finding' : 'no abnormal finding of any kind'}: every observation and every supplied result is normal. The lists are the only place anything is wrong.</p>
    <p className="syringe__remaining">Selected sources: a population cohort of acid suppression alongside two oral targeted tablets, and a review of proton pump inhibitors alongside cancer treatments. Open the source view for exact wording and grades.</p>
    <section className="syringe silent-interaction__section" aria-labelledby="silent-interaction-records-title">
      <div id="silent-interaction-records-title" className="syringe__name">Three lists. All true. All different.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 74/min, blood pressure 124/78 mmHg, respiratory rate 16/min, oxygen saturation 98% in air, and temperature 36.6 C. These remain historical starting observations.</p>
      <p className="syringe__remaining">The clinic list holds her targeted tablet alone. The general practice list holds four items including an acid tablet started six weeks ago. {assessment.pharmacyRecordArrived ? 'The community pharmacy list has arrived and holds six, including one she buys herself.' : 'The community pharmacy list has been requested and has not arrived.'}</p>
      <p className="syringe__remaining">Reconciliation: {assessment.reconciledAtTick === null ? 'not yet done' : `done at simulated ${formatElapsed(assessment.reconciledAtTick)}`}. Direction of harm: {assessment.directionRecordedAtTick === null ? 'not recorded' : 'recorded'}. Treating team: {assessment.escalationAtTick === null ? 'not yet called' : `called at simulated ${formatElapsed(assessment.escalationAtTick)}`}.</p>
      <div className="crisis-drug__actions">
        {decision('reconcile-what-she-is-actually-taking', 'Reconcile what she is actually taking', assessment.reconciledAtTick !== null)}
        {decision('record-the-interaction-and-its-direction', 'Record the interaction and its direction', assessment.directionRecordedAtTick !== null)}
        {decision('escalate-to-the-treating-team-now', 'Call the treating team now', assessment.escalationAtTick !== null)}
      </div>
    </section>
    <section className="syringe silent-interaction__section" aria-labelledby="silent-interaction-evidence-title">
      <div id="silent-interaction-evidence-title" className="syringe__name">More than theory. Less than proof.</div>
      <p className="syringe__remaining">{assessment.directionRecordedAtTick === null
        ? 'Most of these targeted tablets need an acid stomach to dissolve. Which way does the harm run, and what would you expect to see if it were running?'
        : 'Suppressing the acid means less of the drug is absorbed, so the harm is less treatment rather than more toxicity. That is why there is nothing to see, and why there will be nothing to see later either.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what to say about the weeks already taken.'
        : 'Supplied boundaries: across 4,340 and 1,635 patients, concurrent acid suppression was associated with adjusted hazard ratios for death of 1.58 (95% CI 1.42 to 1.76) and 1.54 (95% CI 1.30 to 1.82). Retrospective, from prescribing and registry databases, and the authors write association rather than causation. The mechanism points the same way; neither fact licenses telling her that her treatment has been made ineffective.'}</p>
      <p className="syringe__remaining">Bounded intent: {assessment.treatmentIntentAtTick === null ? 'not recorded' : 'recorded as the treating team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-bounded-treatment-intent', 'Record bounded qualified-team intent', assessment.treatmentIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe silent-interaction__section" aria-labelledby="silent-interaction-observation-title">
      <div id="silent-interaction-observation-title" className="syringe__name">Reassess. It will still be normal.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}% on air; ${observations.symptomAccount}.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{records
        ? `Last requested supplied records at simulated ${formatElapsed(records.atTick)}: clinic ${records.clinicListItems} item, general practice ${records.practiceListItems}, ${records.pharmacyListAvailable ? `community pharmacy ${records.pharmacyListItems} including one bought rather than prescribed` : 'community pharmacy outstanding'}; overlap ${records.overlapWeeks} weeks. Supplied, not acquired.`
        : 'No new records check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: oxygen saturation ${observation.spo2Percent}% on air; ${observation.symptomAccount}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.pharmacyRecordArrived && <p className="syringe__remaining">The community pharmacy list has arrived. It holds an item neither other list did, and she did not count it as medicine because nobody prescribed it.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">Her treating team has answered and owns the decision. They have asked for the dates of the overlap rather than the diagnosis.</p>}
      {(assessment.stopInstructionAttempted || assessment.nothingToDoAttempted || assessment.theoreticalAttempted || assessment.notesOnlyAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: all three lists and how they differ, the item bought rather than prescribed, the weeks of overlap, and the direction of harm all travel with her. No diagnosis, treatment effect, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-the-supplied-records', 'Check the supplied records only')}
        {decision('reassess', 'Reassess the patient and the records')}
        {decision('handoff', 'Hand off what has no abnormality in it')}
        {decision('tell-her-to-stop-the-acid-tablets-today', 'Tell her to stop the acid tablets today')}
        {decision('nothing-is-wrong-so-there-is-nothing-to-do', 'Nothing is wrong, so there is nothing to do')}
        {decision('the-interaction-is-only-theoretical', 'The interaction is only theoretical')}
        {decision('write-it-in-the-notes-and-move-on', 'Write it in the notes and move on')}
      </div>
    </section>
  </>;
}
