import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { ToxicShockSnapshot } from '@platform/kernel/protocol';
import type { ToxicShockAction } from './toxic-shock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { toxicShockInlinePrompt } from './toxic-shock-tutor';

export function ToxicShockTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: ToxicShockSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: ToxicShockAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = toxicShockInlinePrompt(guidance, { scenarioVersion, toxicShock: assessment });
  const labs = assessment.labObservation; const perfusion = assessment.perfusionObservation;
  const observation = assessment.observation;
  const decision = (action: ToxicShockAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected sources: the 2011 and 2010 surveillance case definitions, and a 2022 international outbreak notice. Open the source view for exact criteria lists. These are instruments for counting cases consistently, not for deciding treatment at a bedside.</p>
    <section className="syringe toxic-shock__section" aria-labelledby="toxic-shock-recognition-title">
      <div id="toxic-shock-recognition-title" className="syringe__name">Act on the pattern. The definition cannot close.</div>
      <p className="syringe__remaining">Supplied findings: temperature 39.4 C, heart rate 128/min, BP 88/44 mmHg, diffuse macular erythroderma, conjunctival and oropharyngeal hyperaemia, vomiting and diarrhoea from onset. Source control for the documented focus was completed by the qualified team before this rehearsal.</p>
      <p className="syringe__remaining">Supplied laboratory evidence: white cells 16.8 x10^9/L with 18% bands, platelets 118 x10^9/L, creatinine 1.9 mg/dL, alanine aminotransferase 78 U/L, creatine kinase 640 U/L, C-reactive protein 210 mg/L, lactate 3.4 mmol/L. Cultures pending with no growth so far.</p>
      <p className="syringe__remaining">Neither definition is met, and not for the same reason. One needs desquamation one to two weeks after the rash, which cannot have happened. The other needs the organism to grow, and it has not. The same pending culture answers one and violates the other, because one requires negative cultures and the other requires an isolate.</p>
      <p className="syringe__remaining">Pattern recognized: {assessment.recognitionAtTick === null ? 'not yet' : 'yes; a pattern, not a diagnosis'}. Critical care: {assessment.criticalCareAtTick === null ? 'not yet activated' : 'activated on the pattern'}. Cultures: {assessment.culturesAtTick === null ? 'not yet requested' : 'requested from blood and a sterile site'}.</p>
      <div className="crisis-drug__actions">
        {decision('recognize-toxin-pattern', 'Recognize the toxin-mediated pattern', assessment.recognitionAtTick !== null)}
        {decision('activate-critical-care', 'Activate critical care on the pattern', assessment.criticalCareAtTick !== null)}
        {decision('request-cultures', 'Request blood and sterile-site cultures', assessment.culturesAtTick !== null)}
      </div>
    </section>
    <section className="syringe toxic-shock__section" aria-labelledby="toxic-shock-intent-title">
      <div id="toxic-shock-intent-title" className="syringe__name">Record what is true, including what is unknown.</div>
      <p className="syringe__remaining">Bounded qualified-team intent for antimicrobial therapy and haemodynamic support is available now. No agent, dose, route, combination, adjunct, immunoglobulin, fluid volume, or vasoactive choice is selected here.</p>
      <p className="syringe__remaining">{assessment.definitionStatusAtTick === null
        ? 'The definition status can be recorded explicitly: that it is unmet, why it is unmet for each definition, and when it could be revisited.'
        : 'Recorded: the case definition is unmet. One definition is unmet for a temporal reason and the other for a microbiological reason. A re-check horizon of one to two weeks is named, and the record notes the definition may remain unmet permanently, including if the patient dies before desquamation could occur.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what a surveillance definition is for before treating a criteria count as a probability.'
        : 'Supplied boundaries: these definitions count cases consistently across populations rather than deciding treatment at a bedside. A criteria count is not a probability. The negative-culture requirement in one definition is a clause excluding other diagnoses, not evidence against infection. Cultures with no growth at four hours are uninformative rather than negative. Reported case fatality spans a wide range across series, so no single figure is asserted. The definitions have not been revised in over a decade despite a documented international rise in invasive infection, which changed alerting rather than the definitions.'}</p>
      <p className="syringe__remaining">Treatment intent: {assessment.treatmentIntentAtTick === null ? 'not yet recorded' : 'recorded'}. Definition status: {assessment.definitionStatusAtTick === null ? 'not yet recorded' : 'recorded as open'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-treatment-intent', 'Record bounded treatment intent', assessment.treatmentIntentAtTick !== null)}
        {decision('record-definition-status', 'Record the definition as unmet, with the reason', assessment.definitionStatusAtTick !== null)}
        {decision('review-boundaries', 'Review what a surveillance definition is for', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange perfusion and organ-function surveillance', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe toxic-shock__section" aria-labelledby="toxic-shock-observation-title">
      <div id="toxic-shock-observation-title" className="syringe__name">More criteria. Still no closure.</div>
      <p className="syringe__remaining">{labs
        ? `Last requested laboratory evidence at simulated ${formatElapsed(labs.atTick)}: platelets ${labs.plateletsX109L} x10^9/L; creatinine ${labs.creatinineMgDl.toFixed(1)} mg/dL; alanine aminotransferase ${labs.altUL} U/L; creatine kinase ${labs.ckUL} U/L; lactate ${labs.lactateMmolL.toFixed(1)} mmol/L; cultures ${labs.culturesPending ? 'no growth so far, which is uninformative rather than negative' : 'reported'}. A laboratory-only check does not refresh the perfusion assessment.`
        : 'No new laboratory-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{perfusion
        ? `Last requested examination at simulated ${formatElapsed(perfusion.atTick)}: BP ${perfusion.systolicMmHg}/${perfusion.diastolicMmHg} mmHg; heart rate ${perfusion.heartRateBpm}/min; temperature ${perfusion.coreTemperatureC.toFixed(1)} C; erythroderma present; desquamation absent and not yet possible. A perfusion-only look does not refresh laboratory evidence.`
        : 'No new perfusion-only examination has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; platelets ${observation.plateletsX109L} x10^9/L; creatinine ${observation.creatinineMgDl.toFixed(1)} mg/dL; lactate ${observation.lactateMmolL.toFixed(1)} mmol/L; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.deteriorationDueInSeconds !== null && <p className="syringe__remaining">Authored deterioration in {Math.ceil(assessment.deteriorationDueInSeconds / 3600)} simulated h.</p>}
      <p className="syringe__remaining">Accumulating criteria move both definitions closer and close neither. Desquamation belongs to a week or two from now, and an organism either grows or does not.</p>
      {assessment.deteriorationObserved && <p className="syringe__remaining">More criteria are now satisfied on both definitions. Neither has closed, and the reasons are unchanged.</p>}
      {(assessment.confirmationAttempted || assessment.criteriaExclusionAttempted || assessment.pendingCultureExclusionAttempted || assessment.negativeCultureMisreadAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the diagnosis is handed over explicitly open, with the reason recorded and the re-check named. No classification, organism, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-labs', 'Check laboratory evidence only')}{decision('check-perfusion', 'Check perfusion and the rash only')}
        {decision('reassess', 'Reassess perfusion and organ evidence')}
        {decision('handoff', 'Hand off an explicitly open diagnosis')}
        {decision('declare-confirmed', 'Declare a confirmed case')}
        {decision('criteria-count-excludes', 'Exclude it because thresholds are not crossed')}
        {decision('pending-cultures-exclude', 'Treat four-hour no-growth as negative')}
        {decision('negative-cultures-mean-no-infection', 'Read negative cultures as no infection')}
      </div>
    </section>
  </>;
}
