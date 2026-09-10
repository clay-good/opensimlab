import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalRhabdomyolysisSnapshot } from '@platform/kernel/protocol';
import type { RenalRhabdomyolysisAction } from './rhabdomyolysis';
import { renalRhabdomyolysisInlinePrompt, RENAL_RHABDOMYOLYSIS_SOURCE_HREF } from './renal-rhabdomyolysis-tutor';

export function RenalRhabdomyolysisTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: RenalRhabdomyolysisSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: RenalRhabdomyolysisAction) => void; readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void; readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = renalRhabdomyolysisInlinePrompt(guidance, { scenarioVersion, renalRhabdomyolysis: assessment });
  const observation = assessment.observation; const kinase = assessment.creatineKinaseObservation;
  const renal = assessment.renalObservation;
  const decision = (action: RenalRhabdomyolysisAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected source: <a href={RENAL_RHABDOMYOLYSIS_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>2013 risk prediction cohort</a> (opens in a new tab). Retrospective, two hospitals in one city, and restricted to a creatine kinase above 5,000 U/L. It describes observed distributions, not a prediction for any individual, and the patient here is fictional.</p>
    <section className="syringe renal-rhabdomyolysis__section" aria-labelledby="renal-rhabdomyolysis-bedside-title">
      <div id="renal-rhabdomyolysis-bedside-title" className="syringe__name">The urgent finding is not in the blood.</div>
      <p className="syringe__remaining">Supplied starting findings: creatine kinase 48,000 U/L, creatinine 88 µmol/L, potassium 4.4 mmol/L, urine output 1.4 mL/kg/h, dark urine, dipstick-positive for blood with no red cells. Thighs and shoulders very sore two days after a first heavy session in eight months.</p>
      <p className="syringe__remaining">{assessment.compartmentExaminedAtTick === null
        ? 'A compartment syndrome is found at the bedside and released surgically. No creatine kinase value rules it in or out, and it is the one thing here that is time-critical.'
        : 'Examined and recorded: pain on passive stretch, tension, distal pulses, sensation. No compartment concern at this examination — which has to be repeated, because it is a finding and not a result. No pressure is measured and no procedure is performed here.'}</p>
      <p className="syringe__remaining">{assessment.causeReviewedAtTick === null
        ? 'Establish the cause. In the cohort behind this lesson, the observed risk tracked the cause rather than the number.'
        : 'Recorded: unaccustomed exercise, with no trauma, crush, toxin, heat illness, seizure, arrest, or sepsis supplied. The observed rate of replacement therapy or death in that cohort ran from 3.2% for exercise to 41.2% for compartment syndrome and 58.5% after cardiac arrest — a distribution in a retrospective cohort, not a prognosis for him.'}</p>
      <p className="syringe__remaining">Examination: {assessment.compartmentExaminedAtTick === null ? 'not yet performed' : 'performed and recorded'}. Cause: {assessment.causeReviewedAtTick === null ? 'not established' : 'established'}. Fluid ownership: {assessment.fluidsArrangedAtTick === null ? 'not yet arranged' : 'arranged and recorded'}.</p>
      <div className="crisis-drug__actions">
        {decision('examine-compartments', 'Examine the limbs for compartment syndrome', assessment.compartmentExaminedAtTick !== null)}
        {decision('review-cause', 'Establish the cause', assessment.causeReviewedAtTick !== null)}
        {decision('arrange-fluids', 'Arrange qualified fluid ownership', assessment.fluidsArrangedAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-rhabdomyolysis__section" aria-labelledby="renal-rhabdomyolysis-number-title">
      <div id="renal-rhabdomyolysis-number-title" className="syringe__name">48,000 is alarming. It is not a decision.</div>
      <p className="syringe__remaining">{assessment.numberReviewedAtTick === null
        ? 'Decide what the creatine kinase value settles before anyone acts on it.'
        : 'Reviewed: it is one variable among eight in the risk model, alongside age, sex, cause, creatinine, phosphate, calcium, and bicarbonate. In a separate series of thirty exertional cases, higher creatinine went with lower creatine kinase — and twenty-nine of thirty were still discharged only once the value was falling. No threshold, cutoff, dialysis criterion, or discharge criterion is taught here.'}</p>
      <p className="syringe__remaining">{assessment.additionsReviewedAtTick === null
        ? 'Two familiar additions are on the table. Review what the evidence for them actually shows.'
        : 'Reviewed: across twelve studies, fluid resuscitation decreased acute renal failure and dialysis need; neither bicarbonate nor mannitol improved either. That review rated its own evidence very low quality and mostly retrospective, so it is an absence of demonstrated benefit rather than a demonstrated absence — and it is not a reason to withhold fluid.'}</p>
      <p className="syringe__remaining">Number review: {assessment.numberReviewedAtTick === null ? 'not recorded' : 'recorded'}. Additions review: {assessment.additionsReviewedAtTick === null ? 'not recorded' : 'recorded'}. Support: {assessment.supportActive ? 'active' : 'not yet called'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged with repeat examination'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('review-number', 'Review what the creatine kinase decides', assessment.numberReviewedAtTick !== null)}
        {decision('review-additions', 'Review bicarbonate and mannitol', assessment.additionsReviewedAtTick !== null)}
        {decision('call-support', 'Call qualified acute-care and renal support', assessment.supportActive)}
        {decision('monitor', 'Arrange serial review and repeat examination', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe renal-rhabdomyolysis__section" aria-labelledby="renal-rhabdomyolysis-observation-title">
      <div id="renal-rhabdomyolysis-observation-title" className="syringe__name">Watch the two numbers move apart.</div>
      <p className="syringe__remaining">{kinase
        ? `Last requested creatine kinase at simulated ${formatElapsed(kinase.atTick)}: ${kinase.creatineKinaseUL.toLocaleString('en-US')} U/L. A creatine-kinase-only check supplies no kidney findings and no examination.`
        : 'No new creatine-kinase-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{renal
        ? `Last requested kidney findings at simulated ${formatElapsed(renal.atTick)}: creatinine ${renal.creatinineUmolL} µmol/L, urine output ${renal.urineMlPerKgPerHour.toFixed(1)} mL/kg/h. This partial result supplies no creatine kinase and no examination.`
        : 'No new kidney-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: creatine kinase ${observation.creatineKinaseUL.toLocaleString('en-US')} U/L; creatinine ${observation.creatinineUmolL} µmol/L; urine output ${observation.urineMlPerKgPerHour.toFixed(1)} mL/kg/h; potassium ${observation.potassiumMmolL} mmol/L; ${observation.compartmentConcern ? 'compartment concern present' : 'no compartment concern at this examination'}. These are historical observations, not live measurements.`
        : 'No new full creatine kinase, kidney, and bedside assessment has been requested.'}</p>
      {assessment.serialDueInSeconds !== null && <p className="syringe__remaining">Authored serial checkpoint in {Math.ceil(assessment.serialDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">The creatine kinase keeps rising across this rehearsal while the creatinine and urine output hold. That is authored and predicts nothing about any patient; it establishes no peak, no trajectory, and no disposition, and the examination has to be repeated whatever the numbers do.</p>
      {assessment.unexaminedContrastObserved && <p className="syringe__remaining">A full assessment recorded the authored contrast in which the limbs were still unexamined. It is a teaching comparison, not a prediction.</p>}
      {(assessment.dialysisOnNumberAttempted || assessment.additionsAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: fluid ownership, the repeated examination, and the decision about when he leaves are handed off. No peak and no prognosis is named, and this is not discharge readiness.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-creatine-kinase', 'Check creatine kinase only')}{decision('check-renal', 'Check kidney findings only')}
        {decision('reassess', 'Reassess creatine kinase, kidney, and examination')}
        {decision('handoff', 'Hand off fluid ownership and repeat examination')}
        {decision('dialyse-on-number', 'Request replacement therapy on the creatine kinase')}
        {decision('add-bicarbonate-and-mannitol', 'Add bicarbonate and mannitol')}
      </div>
    </section>
  </>;
}
