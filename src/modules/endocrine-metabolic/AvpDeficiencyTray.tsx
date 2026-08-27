import { Button } from '@platform/ui';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AvpDeficiencySnapshot } from '@platform/kernel/protocol';
import type { AvpDeficiencyAction } from './avp-deficiency';
import { avpDeficiencyInlinePrompt, AVP_DEFICIENCY_SOURCE_HREF } from './avp-deficiency-tutor';

export function AvpDeficiencyTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: AvpDeficiencySnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: AvpDeficiencyAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = avpDeficiencyInlinePrompt(guidance, { scenarioVersion, avpDeficiency: assessment });
  const observation = assessment.observation;
  const decision = (action: AvpDeficiencyAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  const earlierChoices = [assessment.normalizationAttempted && 'aiming for immediate normalization',
    assessment.withholdingChosen && 'blanket withholding of prescribed desmopressin'].filter(Boolean);
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining"><a href={AVP_DEFICIENCY_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Inpatient guidance: SfE 2018 (opens in a new tab)</a></p>
    <section className="syringe avp-deficiency__section" aria-labelledby="avp-deficiency-volume-title">
      <div id="avp-deficiency-volume-title" className="syringe__name">Restore circulation. Keep the cause in view.</div>
      <p className="syringe__remaining">Known arginine vasopressin deficiency (AVP-D, formerly central diabetes insipidus) is supplied, not newly diagnosed here. It is distinct from diabetes mellitus.</p>
      <p className="syringe__remaining">Supplied initial sodium: 162 mmol/L; urine output: 60 mL/hour; BP: 90/54 mmHg. These are starting findings, not live laboratory or urine measurements. Low urine output during hypovolemia does not exclude known AVP-D.</p>
      <p className="syringe__remaining">Start qualified volume restoration immediately. Context review, support acknowledgment, and new laboratory results must not delay fluid-first care. The authored circulation checkpoint is not a required clinical waiting period.</p>
      <p className="syringe__remaining">{assessment.contextReviewedAtTick === null
        ? 'Review prescribed medication, drinking access, supplied electrolytes, and the unknown duration of hypernatremia while care proceeds.'
        : 'Supplied context: two scheduled prescribed desmopressin doses were omitted during restricted access to drinking water. Potassium is 3.8 mmol/L and creatinine 1.6 mg/dL. Hypernatremia duration is unknown; acute sodium loading is not assumed. No dose or deficit calculation is supplied.'}</p>
      <p className="syringe__remaining">Volume care: {assessment.volumeAtTick === null ? 'not started' : 'started'}. Context review: {assessment.contextReviewedAtTick === null ? 'not recorded' : 'recorded'}. Team support: {assessment.supportActive ? 'active' : 'not yet called'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <div className="crisis-drug__actions">
        {decision('restore-volume', 'Start qualified volume restoration', assessment.volumeAtTick !== null)}
        {decision('review-context', 'Review medication and water-access context', assessment.contextReviewedAtTick !== null)}
        {decision('call-support', 'Call qualified support', assessment.supportActive)}
        {decision('monitor', 'Arrange serial sodium and urine checks', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe avp-deficiency__section" aria-labelledby="avp-deficiency-water-title">
      <div id="avp-deficiency-water-title" className="syringe__name">Replace water. Address ongoing losses.</div>
      <p className="syringe__remaining">{assessment.circulationRestored
        ? 'The authored circulation has improved. Qualified water replacement and restoration of prescribed desmopressin are available independently now, without a new laboratory click or administrative prerequisite.'
        : 'Prioritize restoring the compromised circulation. Qualified water replacement and prescribed desmopressin care follow fluid-first assessment, not a fixed clinical waiting period.'}</p>
      <p className="syringe__remaining">A better pressure does not replace the water deficit. Water and desmopressin address different problems and require close monitoring together. Less urine alone does not establish sodium correction. No dose, route, infusion rate, or automatic redosing is selected.</p>
      <p className="syringe__remaining">Water replacement: {assessment.waterAtTick === null ? 'not requested' : 'requested'}. Desmopressin care: {assessment.desmopressinAtTick === null ? 'not requested' : 'requested'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('replace-water', 'Request tailored water replacement', assessment.waterAtTick !== null)}
        {decision('restore-desmopressin', 'Restore qualified desmopressin care', assessment.desmopressinAtTick !== null)}
      </div>
    </section>
    <section className="syringe avp-deficiency__section" aria-labelledby="avp-deficiency-observation-title">
      <div id="avp-deficiency-observation-title" className="syringe__name">Observe the trajectory. Hand off continuing care.</div>
      <p className="syringe__remaining">{observation
        ? `Last requested assessment at simulated ${Math.floor(observation.atTick / (60 * TICKS_PER_SECOND))} min: sodium ${observation.sodiumMmolL} mmol/L, urine output ${observation.urineOutputMlPerHour} mL/hour, urine osmolality ${observation.urineOsmolalityMosmPerKg} mOsm/kg; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; ${observation.alertness}. These findings are historical and can become stale, not live sodium or urine measurements.`
        : 'No new sodium, urine-output, or urine-concentration assessment has been requested. The supplied initial findings remain historical.'}</p>
      <p className="syringe__remaining">Highest supplied or requested sodium: {assessment.peakObservedSodiumMmolL} mmol/L. Original sodium: 162 mmol/L. A later lower value does not erase the observed peak or establish lasting safety.</p>
      {assessment.volumeDueInSeconds !== null && <p className="syringe__remaining">Authored circulation checkpoint in {Math.ceil(assessment.volumeDueInSeconds / 60)} simulated min. This 15-minute contrast is not predicted fluid kinetics.</p>}
      {assessment.responseDueInSeconds !== null && <p className="syringe__remaining">Authored combined-care checkpoint in {Math.ceil(assessment.responseDueInSeconds / 60)} simulated min. This two-hour contrast is not a predicted sodium response.</p>}
      <p className="syringe__remaining">Reassess whenever needed; never wait for a teaching checkpoint if the patient worsens. Hand off continuing sodium, urine, fluid-balance, neurologic, drinking-access, and medication surveillance, not normalization or discharge.</p>
      {earlierChoices.length > 0 && <p className="syringe__remaining">Earlier choices stay in this run: {earlierChoices.join('; ')}.</p>}
      {assessment.volumeDelayed && <p className="syringe__remaining">An authored volume-restoration delay was recorded. Later care does not erase it.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: continuing water balance, medication, and unresolved risks are handed off. This is not recovery or discharge clearance.'
        : 'Instructor takeover ended this branch. Open the debrief, then try a different decision. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('reassess', 'Reassess sodium, urine, and bedside response')}
        {decision('handoff', 'Hand off water balance and continuing care')}
        {decision('normalize-now', 'Aim for normal sodium now')}
        {decision('withhold-desmopressin', 'Withhold prescribed desmopressin throughout')}
      </div>
    </section>
  </>;
}
