import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHypocalcemiaSnapshot } from '@platform/kernel/protocol';
import type { RenalHypocalcemiaAction } from './hypocalcemia';
import { renalHypocalcemiaInlinePrompt, RENAL_HYPOCALCEMIA_SOURCE_HREF } from './renal-hypocalcemia-tutor';

export function RenalHypocalcemiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalHypocalcemiaSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalHypocalcemiaAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalHypocalcemiaInlinePrompt(guidance, { scenarioVersion, renalHypocalcemia: assessment });
  const observation = assessment.observation; const ionized = assessment.ionizedObservation; const symptoms = assessment.symptomObservation;
  const symptomText = (value: { carpopedalSpasm: boolean; perioralTingling: boolean }) =>
    `carpopedal spasm ${value.carpopedalSpasm ? 'present' : 'absent'}; perioral tingling ${value.perioralTingling ? 'present' : 'absent'}`;
  const decision = (action: RenalHypocalcemiaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected source: <a href={RENAL_HYPOCALCEMIA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>FDA 2024 safety communication</a> (opens in a new tab). This medication-safety source is not a general calcium-treatment guideline.</p>
    <section className="syringe renal-hypocalcemia__section" aria-labelledby="renal-hypocalcemia-treatment-title">
      <div id="renal-hypocalcemia-treatment-title" className="syringe__name">Treat the measured calcium and the person.</div>
      <p className="syringe__remaining">Supplied measured ionized calcium: 0.86 mmol/L at pH 7.40, with carpopedal spasm and perioral tingling. These are historical starting findings. The adjusted total-calcium estimate of 8.8 mg/dL does not override the measured ionized result.</p>
      <p className="syringe__remaining">Qualified rescue is available immediately. Continuing calcium care is available immediately after rescue, without waiting for the 15-minute teaching response, symptom relief, support acknowledgment, or another laboratory click. No formulation, dose, or infusion rate is prescribed.</p>
      <p className="syringe__remaining">Rescue: {assessment.rescueAtTick === null ? 'not yet requested' : 'requested'}. Continuing calcium care: {assessment.continuingAtTick === null ? 'not yet delivered' : 'delivered'}.</p>
      <div className="crisis-drug__actions">
        {decision('rescue-calcium', 'Request qualified calcium rescue', assessment.rescueAtTick !== null)}
        {decision('continue-calcium', 'Deliver qualified continuing calcium care', assessment.continuingAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-hypocalcemia__section" aria-labelledby="renal-hypocalcemia-context-title">
      <div id="renal-hypocalcemia-context-title" className="syringe__name">Keep CKD mineral care and follow-up in view.</div>
      <p className="syringe__remaining">{assessment.contextReviewedAtTick === null
        ? 'Review stage 4 CKD without dialysis, denosumab 21 days earlier, and the supplied calcium, albumin, mineral, and ECG context.'
        : 'Supplied historical context: total calcium 7.2 mg/dL, albumin 2.0 g/dL, adjusted total estimate 8.8 mg/dL, magnesium 0.80 mmol/L, phosphate 6.2 mg/dL, and eGFR 22 mL/min/1.73 m². The measured ionized calcium was 0.86 mmol/L at pH 7.40. Supplied QTc 520 ms is historical and is not measured by this waveform. No new mineral or QT response is provided.'}</p>
      <p className="syringe__remaining">Coordinate qualified activated-vitamin-D and mineral management without gating calcium care or implying a rapid vitamin-D effect. Arrange surveillance beyond the rehearsal. Future denosumab decisions remain specialist-owned, not automatic permanent discontinuation or restart.</p>
      <p className="syringe__remaining">Support: {assessment.supportActive ? 'active' : 'not yet called'}. Context review: {assessment.contextReviewedAtTick === null ? 'not recorded' : 'recorded'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}. Mineral care: {assessment.mineralCareAtTick === null ? 'not coordinated' : 'coordinated'}. Follow-up: {assessment.followUpAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('call-support', 'Call qualified acute-care and specialist support', assessment.supportActive)}
        {decision('review-context', 'Review measured calcium, CKD, and medication context', assessment.contextReviewedAtTick !== null)}
        {decision('monitor', 'Arrange ionized-calcium and clinical surveillance', assessment.monitoringAtTick !== null)}
        {decision('coordinate-mineral-care', 'Coordinate qualified CKD mineral care', assessment.mineralCareAtTick !== null)}
        {decision('arrange-follow-up', 'Arrange longer-term calcium and specialist follow-up', assessment.followUpAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-hypocalcemia__section" aria-labelledby="renal-hypocalcemia-observation-title">
      <div id="renal-hypocalcemia-observation-title" className="syringe__name">Relief is a response, not an endpoint.</div>
      <p className="syringe__remaining">{ionized
        ? `Last requested ionized calcium at simulated ${formatElapsed(ionized.atTick)}: ${ionized.ionizedCalciumMmolL.toFixed(2)} mmol/L. An ionized-only check does not refresh symptoms or the full assessment.`
        : 'No new ionized-calcium-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{symptoms
        ? `Last requested symptoms at simulated ${formatElapsed(symptoms.atTick)}: ${symptomText(symptoms)}. A symptom-only check does not refresh calcium.`
        : 'No new symptom-only assessment has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: ionized calcium ${observation.ionizedCalciumMmolL.toFixed(2)} mmol/L; ${symptomText(observation)}; ${observation.alertness}; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg. These are historical observations, not live measurements.`
        : 'No new full ionized-calcium, symptom, and bedside assessment has been requested.'}</p>
      {assessment.rescueDueInSeconds !== null && <p className="syringe__remaining">Authored rescue checkpoint in {Math.ceil(assessment.rescueDueInSeconds / 60)} simulated min.</p>}
      {assessment.continuingDueInSeconds !== null && <p className="syringe__remaining">Authored continuing-care checkpoint in {Math.ceil(assessment.continuingDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">The 15-, 45-, and 60-minute contrasts are authored, not predicted kinetics or required clinical waits. Earlier teaching panels need not be recreated. Current full findings can support handoff while a continuing-care response remains pending; normal calcium is not required.</p>
      {assessment.recurrenceObserved && <p className="syringe__remaining">A full assessment recorded recurrence after rescue without continuing calcium care. Keep that history visible during subsequent treatment.</p>}
      {(assessment.adjustedReassuranceAttempted || assessment.oralOnlyAttempted || assessment.stoppedAfterReliefAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: continuing calcium, mineral care, surveillance, and follow-up are handed off. This is not durable correction or discharge readiness.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-ionized', 'Check ionized calcium only')}{decision('check-symptoms', 'Check symptoms only')}
        {decision('reassess', 'Reassess ionized calcium, symptoms, and bedside response')}
        {decision('handoff', 'Hand off continuing calcium care and follow-up')}
        {decision('trust-adjusted-total', 'Trust adjusted total calcium alone')}
        {decision('oral-only', 'Use oral calcium alone instead of rescue')}
        {decision('stop-after-relief', 'Stop calcium care after symptom relief')}
      </div>
    </section>
  </>;
}
