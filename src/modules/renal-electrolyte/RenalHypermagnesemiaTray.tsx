import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHypermagnesemiaSnapshot } from '@platform/kernel/protocol';
import type { RenalHypermagnesemiaAction } from './hypermagnesemia';
import { renalHypermagnesemiaInlinePrompt, RENAL_HYPERMAGNESEMIA_SOURCE_HREF } from './renal-hypermagnesemia-tutor';

export function RenalHypermagnesemiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalHypermagnesemiaSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalHypermagnesemiaAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalHypermagnesemiaInlinePrompt(guidance, { scenarioVersion, renalHypermagnesemia: assessment });
  const observation = assessment.observation; const magnesium = assessment.magnesiumObservation;
  const neuromuscular = assessment.neuromuscularObservation;
  const examination = (value: { reflexesPresent: boolean; severeWeakness: boolean }) =>
    `reflexes ${value.reflexesPresent ? 'present' : 'absent'}; ${value.severeWeakness ? 'severe' : 'residual'} weakness persists`;
  const decision = (action: RenalHypermagnesemiaAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected source: <a href={RENAL_HYPERMAGNESEMIA_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>2018 emergency-dialysis case series</a> (opens in a new tab). This observational source is not a treatment protocol; the patient and response contrasts are fictional.</p>
    <section className="syringe renal-hypermagnesemia__section" aria-labelledby="renal-hypermagnesemia-support-title">
      <div id="renal-hypermagnesemia-support-title" className="syringe__name">Support breathing. Counter toxicity.</div>
      <p className="syringe__remaining">Supplied magnesium: 4.6 mmol/L, with drowsiness, absent reflexes, severe weakness, and slow breathing. These are historical starting findings.</p>
      <p className="syringe__remaining">Qualified breathing support, calcium antagonism, and magnesium removal are independently available now. Calcium temporarily supports circulation; it does not remove magnesium or replace breathing support. No dose, airway technique, or ventilator settings are selected.</p>
      <p className="syringe__remaining">Breathing: {assessment.breathingAtTick === null ? 'qualified support not yet started' : 'qualified support active; displayed respiratory rate is supported, not proof of independent breathing'}. Calcium requests: {assessment.calciumRequests}. A repeat request requires qualified clinical review, not an automatic schedule.</p>
      <div className="crisis-drug__actions">
        {decision('support-breathing', 'Start qualified breathing support', assessment.breathingAtTick !== null)}
        {decision('calcium', 'Request qualified calcium antagonism')}
      </div>
    </section>
    <section className="syringe renal-hypermagnesemia__section" aria-labelledby="renal-hypermagnesemia-removal-title">
      <div id="renal-hypermagnesemia-removal-title" className="syringe__name">Stop exposure. Deliver removal.</div>
      <p className="syringe__remaining">{assessment.contextReviewedAtTick === null
        ? 'Review known stage 4 CKD, magnesium hydroxide for constipation over 14 days, five days without a bowel movement, and reduced urine.'
        : 'Supplied historical context: documented eGFR 18 mL/min/1.73 m² without dialysis; magnesium 4.6 mmol/L, potassium 4.8 mmol/L, total calcium 2.24 mmol/L, sodium 138 mmol/L, and glucose 108 mg/dL. The history does not establish bowel obstruction, new renal clearance, or acute kidney injury. No ECG interval measurement is supplied.'}</p>
      <p className="syringe__remaining">Stopping further exposure does not clear the existing burden. Delivered removal is distinct from consultation or a plan. Removal modality, fluids, and diuretics require individualized qualified review.</p>
      <p className="syringe__remaining">Exposure: {assessment.stopMagnesiumAtTick === null ? 'not yet stopped' : 'stopped'}. Removal: {assessment.removalAtTick === null ? 'not yet delivered' : 'delivered'}. Support: {assessment.supportActive ? 'active' : 'not yet called'}. Context: {assessment.contextReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('stop-magnesium', 'Stop further magnesium exposure', assessment.stopMagnesiumAtTick !== null)}
        {decision('deliver-removal', 'Deliver qualified magnesium-removal care', assessment.removalAtTick !== null)}
        {decision('call-support', 'Call qualified acute-care and renal support', assessment.supportActive)}
        {decision('review-context', 'Review magnesium exposure and renal context', assessment.contextReviewedAtTick !== null)}
        {decision('monitor', 'Arrange magnesium and bedside surveillance', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-hypermagnesemia__section" aria-labelledby="renal-hypermagnesemia-observation-title">
      <div id="renal-hypermagnesemia-observation-title" className="syringe__name">Reassess the person and the magnesium.</div>
      <p className="syringe__remaining">{magnesium
        ? `Last requested magnesium at simulated ${formatElapsed(magnesium.atTick)}: ${magnesium.magnesiumMmolL.toFixed(1)} mmol/L. A magnesium-only check does not refresh the neuromuscular or full assessment.`
        : 'No new magnesium-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{neuromuscular
        ? `Last requested neuromuscular assessment at simulated ${formatElapsed(neuromuscular.atTick)}: ${examination(neuromuscular)}. A neuromuscular-only check does not refresh magnesium.`
        : 'No new neuromuscular-only assessment has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: magnesium ${observation.magnesiumMmolL.toFixed(1)} mmol/L; ${examination(observation)}; ${observation.alertness}; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg. These are historical observations, not live measurements.`
        : 'No new full magnesium, neuromuscular, and bedside assessment has been requested.'}</p>
      {assessment.calciumDueInSeconds !== null && <p className="syringe__remaining">Authored calcium review in {Math.ceil(assessment.calciumDueInSeconds / 60)} simulated min.</p>}
      {assessment.removalDueInSeconds !== null && <p className="syringe__remaining">Authored removal checkpoint in {Math.ceil(assessment.removalDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">The five-, 30-, and 60-minute contrasts are authored, not predicted kinetics, clinical waits, or redosing intervals. Fresh full findings can support handoff while removal is pending. Earlier teaching panels and normal magnesium are not required.</p>
      {assessment.recurrenceObserved && <p className="syringe__remaining">A full assessment recorded recurrent clinical toxicity after temporary antagonism. This is not a new magnesium rise.</p>}
      {(assessment.calciumClearanceAttempted || assessment.routineDiuresisAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: breathing support, residual risk, and continued review are handed off. Support is not automatically withdrawn; this is not discharge readiness.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-magnesium', 'Check magnesium only')}{decision('check-neuromuscular', 'Check neuromuscular findings only')}
        {decision('reassess', 'Reassess magnesium, neuromuscular, and bedside response')}
        {decision('handoff', 'Hand off supported breathing and magnesium care')}
        {decision('calcium-means-clearance', 'Declare magnesium cleared after calcium')}
        {decision('routine-diuresis', 'Start routine fluid loading and diuresis')}
      </div>
    </section>
  </>;
}
