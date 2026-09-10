import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHypomagnesemiaSnapshot } from '@platform/kernel/protocol';
import type { RenalHypomagnesemiaAction } from './hypomagnesemia';
import { renalHypomagnesemiaInlinePrompt, RENAL_HYPOMAGNESEMIA_SOURCE_HREF } from './renal-hypomagnesemia-tutor';

export function RenalHypomagnesemiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalHypomagnesemiaSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalHypomagnesemiaAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalHypomagnesemiaInlinePrompt(guidance, { scenarioVersion, renalHypomagnesemia: assessment });
  const observation = assessment.observation; const magnesium = assessment.magnesiumObservation;
  const potassium = assessment.potassiumObservation;
  const decision = (action: RenalHypomagnesemiaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected source: <a href={RENAL_HYPOMAGNESEMIA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>2007 mechanism review of hypokalemia in magnesium deficiency</a> (opens in a new tab). It is a mechanistic review, not a trial, and it states that magnesium deficiency alone does not necessarily cause hypokalemia. The patient and the response contrasts are fictional.</p>
    <section className="syringe renal-hypomagnesemia__section" aria-labelledby="renal-hypomagnesemia-support-title">
      <div id="renal-hypomagnesemia-support-title" className="syringe__name">Protect her. Stop the exposure.</div>
      <p className="syringe__remaining">Supplied starting findings: potassium 2.7 mmol/L after two replacements elsewhere with no recorded rise, ionized calcium 1.02 mmol/L, QTc 508 ms, cramping with a positive bedside carpal sign. These are historical.</p>
      <p className="syringe__remaining">Monitoring, stopping the long-term acid blocker, and qualified magnesium repletion are independent decisions. None waits for another and none waits for a repeat measurement. No dose, route, rate, product, or serum target is selected here.</p>
      <p className="syringe__remaining">Monitoring: {assessment.monitoringAtTick === null ? 'not yet arranged' : 'arranged with qualified QT review'}. Exposure: {assessment.stopExposureAtTick === null ? 'not yet stopped' : 'stopped and recorded for review'}. Repletion: {assessment.repletionAtTick === null ? 'not yet delivered' : 'delivered'}.</p>
      <div className="crisis-drug__actions">
        {decision('monitor', 'Start monitoring and qualified QT review', assessment.monitoringAtTick !== null)}
        {decision('replace-magnesium', 'Request qualified magnesium repletion', assessment.repletionAtTick !== null)}
        {decision('stop-exposure', 'Stop the long-term acid blocker with the team', assessment.stopExposureAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-hypomagnesemia__section" aria-labelledby="renal-hypomagnesemia-number-title">
      <div id="renal-hypomagnesemia-number-title" className="syringe__name">0.78 mmol/L is inside the range. It is not an all-clear.</div>
      <p className="syringe__remaining">{assessment.numberReviewedAtTick === null
        ? 'Decide what the supplied magnesium of 0.78 mmol/L excludes before you act on it. A commonly printed reference range is not the same as this patient having enough magnesium.'
        : 'Reviewed: the serum concentration is sustained from body pools, so an in-range value does not exclude depletion — and does not establish it. The supplied fractional excretion of magnesium of 1.4% is consistent with renal conservation and so points away from renal loss. It separates loss routes; it is not a diagnosis, a threshold, or a repletion instruction.'}</p>
      <p className="syringe__remaining">{assessment.contextReviewedAtTick === null
        ? 'Review the long-term acid suppression, months of loose stool, the two potassium replacements without a rise, and the low ionized calcium.'
        : 'Supplied historical context: long-term potassium-competitive acid blocker with no dose or attribution; loose stool most days for several months with no malabsorption diagnosis; sodium 139 mmol/L, bicarbonate 26 mmol/L, creatinine 74 µmol/L. No cause is established.'}</p>
      <p className="syringe__remaining">Number review: {assessment.numberReviewedAtTick === null ? 'not recorded' : 'recorded'}. Context: {assessment.contextReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Support: {assessment.supportActive ? 'active' : 'not yet called'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('review-number', 'Review what this magnesium value excludes', assessment.numberReviewedAtTick !== null)}
        {decision('review-context', 'Review exposure, losses, and prior replacement', assessment.contextReviewedAtTick !== null)}
        {decision('call-support', 'Call qualified acute-care and renal support', assessment.supportActive)}
      </div>
    </section>
    <section className="syringe renal-hypomagnesemia__section" aria-labelledby="renal-hypomagnesemia-observation-title">
      <div id="renal-hypomagnesemia-observation-title" className="syringe__name">Watch where a response would actually appear.</div>
      <p className="syringe__remaining">{magnesium
        ? `Last requested magnesium at simulated ${formatElapsed(magnesium.atTick)}: ${magnesium.magnesiumMmolL.toFixed(2)} mmol/L. A magnesium-only check refreshes nothing else, and a value that barely moves is not evidence that repletion failed.`
        : 'No new magnesium-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{potassium
        ? `Last requested potassium at simulated ${formatElapsed(potassium.atTick)}: ${potassium.potassiumMmolL.toFixed(1)} mmol/L. A potassium-only check supplies no magnesium, calcium, QT interval, or bedside examination.`
        : 'No new potassium-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: magnesium ${observation.magnesiumMmolL.toFixed(2)} mmol/L; potassium ${observation.potassiumMmolL.toFixed(1)} mmol/L; ionized calcium ${observation.ionizedCalciumMmolL.toFixed(2)} mmol/L; QTc ${observation.qtcMs} ms; ${observation.crampingPresent ? 'cramping persists' : 'cramping has settled'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full magnesium, potassium, calcium, and bedside assessment has been requested.'}</p>
      {assessment.repletionDueInSeconds !== null && <p className="syringe__remaining">Authored repletion checkpoint in {Math.ceil(assessment.repletionDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">The five- and 90-minute contrasts are authored, not predicted kinetics, clinical waits, or dosing schedules. Fresh full findings after an observed response support handoff; a normal magnesium and earlier panels are not required.</p>
      {assessment.untreatedContrastObserved && <p className="syringe__remaining">A full assessment recorded the authored untreated contrast. It is a teaching comparison, not a prediction about this patient.</p>}
      {(assessment.potassiumAloneAttempted || assessment.normalNumberClaimAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the pending repletion response, the medication decision, and continuing QT surveillance are handed off. The deficit may be far from corrected; this is not discharge readiness.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-magnesium', 'Check magnesium only')}{decision('check-potassium', 'Check potassium only')}
        {decision('reassess', 'Reassess magnesium, potassium, calcium, and bedside response')}
        {decision('handoff', 'Hand off repletion, medication review, and surveillance')}
        {decision('potassium-alone', 'Replace potassium again on its own')}
        {decision('normal-number-excludes', 'Record the magnesium as normal and exclude depletion')}
      </div>
    </section>
  </>;
}
