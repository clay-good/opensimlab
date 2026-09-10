import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalContrastAttributionSnapshot } from '@platform/kernel/protocol';
import type { RenalContrastAction } from './contrast-attribution';
import { renalContrastAttributionInlinePrompt, RENAL_CONTRAST_SOURCE_HREF } from './renal-contrast-attribution-tutor';

export function RenalContrastAttributionTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalContrastAttributionSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalContrastAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalContrastAttributionInlinePrompt(guidance, { scenarioVersion, renalContrastAttribution: assessment });
  const observation = assessment.observation; const creatinine = assessment.creatinineObservation;
  const perfusion = assessment.perfusionObservation;
  const decision = (action: RenalContrastAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected source: <a href={RENAL_CONTRAST_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>2020 ACR and NKF consensus statements</a> (opens in a new tab). A consensus statement is a position rather than a settled fact, it does not claim contrast never injures a kidney, and the patient here is fictional.</p>
    <section className="syringe renal-contrast__section" aria-labelledby="renal-contrast-label-title">
      <div id="renal-contrast-label-title" className="syringe__name">Someone wrote the cause down. No result reported it.</div>
      <p className="syringe__remaining">Supplied history: creatinine 96 µmol/L before a contrast-enhanced CT three days ago, 168 µmol/L now. The study was negative. The ward notes record “contrast-induced nephropathy”. No laboratory result, imaging report, biopsy, or nephrology opinion says it.</p>
      <p className="syringe__remaining">{assessment.labelReviewedAtTick === null
        ? 'Read the note as what it is before acting on it.'
        : 'Recorded: the label is an attribution, not a finding. The timing of the rise is shared by every other exposure of the same days, which is why timing alone attributes nothing.'}</p>
      <p className="syringe__remaining">{assessment.alternativesReviewedAtTick === null
        ? 'The label excluded nothing. Review what else was happening over those three days.'
        : 'Reviewed and still open: two recorded episodes with a systolic pressure below 90 mmHg, a renin-angiotensin blocker continued throughout, three days of a non-steroidal anti-inflammatory, and 38.4°C with C-reactive protein from 22 to 141 mg/L with no source supplied. None of these is thereby the cause.'}</p>
      <p className="syringe__remaining">Label: {assessment.labelReviewedAtTick === null ? 'not yet read as an attribution' : 'read as an attribution'}. Alternatives: {assessment.alternativesReviewedAtTick === null ? 'not reviewed' : 'reviewed and open'}. Exposures still running: {assessment.exposuresWithdrawnAtTick === null ? 'two' : 'none; both withdrawn with the team'}.</p>
      <div className="crisis-drug__actions">
        {decision('review-label', 'Read the written label as an attribution', assessment.labelReviewedAtTick !== null)}
        {decision('review-alternatives', 'Review what the label did not exclude', assessment.alternativesReviewedAtTick !== null)}
        {decision('withdraw-exposures', 'Withdraw the nephrotoxic exposures with the team', assessment.exposuresWithdrawnAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-contrast__section" aria-labelledby="renal-contrast-evidence-title">
      <div id="renal-contrast-evidence-title" className="syringe__name">After is not because.</div>
      <p className="syringe__remaining">{assessment.evidenceReviewedAtTick === null
        ? 'A creatinine that rose after an exposure is a sequence. Review what turns a sequence into an attribution, and what does not.'
        : 'Reviewed: a rise after an exposure attributes nothing without a comparison group. Work comparing contrast-enhanced, unenhanced and unscanned patients with propensity matching did not find the association the label assumes — and being single-centre and retrospective, with the sickest patients least likely to have received contrast, it argues against a strong causal claim rather than proving none.'}</p>
      <p className="syringe__remaining">Nothing in this lesson decides whether contrast should be given to anyone, prescribes or withholds fluid, sets a threshold, or orders or cancels imaging. It is about a sentence in a set of notes.</p>
      <p className="syringe__remaining">Evidence review: {assessment.evidenceReviewedAtTick === null ? 'not recorded' : 'recorded'}. Support: {assessment.supportActive ? 'active' : 'not yet called'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged with the source question open'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('review-evidence', 'Review what a rise after an exposure shows', assessment.evidenceReviewedAtTick !== null)}
        {decision('call-support', 'Call qualified renal and ward support', assessment.supportActive)}
        {decision('monitor', 'Arrange serial review with the source question open', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-contrast__section" aria-labelledby="renal-contrast-observation-title">
      <div id="renal-contrast-observation-title" className="syringe__name">Reassess, and notice what the trend does not settle.</div>
      <p className="syringe__remaining">{creatinine
        ? `Last requested creatinine at simulated ${formatElapsed(creatinine.atTick)}: ${creatinine.creatinineUmolL} µmol/L. A creatinine-only check refreshes nothing else, and its direction identifies no cause.`
        : 'No new creatinine-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{perfusion
        ? `Last requested observation record at simulated ${formatElapsed(perfusion.atTick)}: ${perfusion.episodes} episodes below a systolic 90 mmHg, lowest ${perfusion.lowestSystolicMmHg} mmHg. This partial record supplies no creatinine or inflammatory trend.`
        : 'No new observation record has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: creatinine ${observation.creatinineUmolL} µmol/L; ${observation.episodes} episodes below a systolic 90 mmHg, lowest ${observation.lowestSystolicMmHg} mmHg; C-reactive protein ${observation.cReactiveProteinMgL} mg/L; ${observation.nephrotoxinsRunning} nephrotoxic exposures still running. These are historical observations, not live measurements.`
        : 'No new full creatinine, perfusion, and exposure assessment has been requested.'}</p>
      {assessment.recordDueInSeconds !== null && <p className="syringe__remaining">Authored chart-retrieval checkpoint in {Math.ceil(assessment.recordDueInSeconds / 60)} simulated min.</p>}
      {assessment.recordOpened && <p className="syringe__remaining">The full observation and drug charts are open. They record four episodes below a systolic 90 mmHg and a lowest pressure of 78, not the two of the ward summary. They were available from the start.</p>}
      <p className="syringe__remaining">The creatinine keeps rising across this rehearsal whatever is done, because the lesson is about the reasoning and not about a treatment response. That rise is authored and predicts nothing about any patient; it confirms no cause, and a fall would confirm none either.</p>
      {assessment.unexaminedContrastObserved && <p className="syringe__remaining">A full assessment recorded the authored unexamined contrast, with the label standing and the exposures still running. It is a teaching comparison, not a prediction.</p>}
      {(assessment.attributionClaimAttempted || assessment.stopLookingAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the cause is handed over as unresolved, with the exposures withdrawn and the search open. This is not a diagnosis and not discharge readiness.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-creatinine', 'Check creatinine only')}{decision('check-perfusion', 'Check the observation record only')}
        {decision('reassess', 'Reassess creatinine, perfusion, and exposures')}
        {decision('handoff', 'Hand off an unresolved cause and an open search')}
        {decision('attribute-to-contrast', 'Record the injury as caused by contrast')}
        {decision('stop-looking', 'Accept the label and close the search')}
      </div>
    </section>
  </>;
}
