import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { EndocarditisHeartFailureSnapshot } from '@platform/kernel/protocol';
import type { EndocarditisHeartFailureAction } from './endocarditis-heart-failure';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { endocarditisHeartFailureInlinePrompt } from './endocarditis-heart-failure-tutor';

export function EndocarditisHeartFailureTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: EndocarditisHeartFailureSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: EndocarditisHeartFailureAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = endocarditisHeartFailureInlinePrompt(guidance, { scenarioVersion, endocarditisHeartFailure: assessment });
  const labs = assessment.labObservation; const perfusion = assessment.perfusionObservation;
  const observation = assessment.observation;
  const decision = (action: EndocarditisHeartFailureAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining">Selected sources: the 2023 European endocarditis guidelines with their 2025 corrigendum, the 2023 Duke-ISCVID criteria, and the 2015 United States statement, which predates both. Open the source view for exact locators.</p>
    <section className="syringe endocarditis__section" aria-labelledby="endocarditis-recognition-title">
      <div id="endocarditis-recognition-title" className="syringe__name">The antimicrobials are working. He is getting worse.</div>
      <p className="syringe__remaining">Supplied findings: day 3 of appropriate therapy for confirmed aortic-valve endocarditis, newly breathless on minimal exertion. Heart rate 118/min, BP 104/62 mmHg with a pulse pressure of 42, respiratory rate 26/min, SpO2 92% in air, temperature 38.4 C.</p>
      <p className="syringe__remaining">Supplied evidence: echocardiography reports a 12 mm aortic vegetation and new severe aortic regurgitation. White cells 16.8 x10^9/L, C-reactive protein 180 mg/L and falling, latest cultures no growth. The infection is responding. The valve is being destroyed at the same time, and no inflammatory marker measures that.</p>
      <p className="syringe__remaining">Mechanical failure recognized: {assessment.recognitionAtTick === null ? 'not yet' : 'yes; the valve and the infection are separate problems on separate clocks'}. Endocarditis team: {assessment.teamAtTick === null ? 'not yet convened' : 'convened, with a valve-surgery centre engaged'}. Surgical referral: {assessment.surgicalReferralAtTick === null ? 'not yet recorded' : 'recorded as urgent assessment and transfer'}.</p>
      <div className="crisis-drug__actions">
        {decision('recognize-mechanical-failure', 'Recognize mechanical failure, not drug failure', assessment.recognitionAtTick !== null)}
        {decision('call-endocarditis-team', 'Convene the endocarditis team and a surgical centre', assessment.teamAtTick !== null)}
        {decision('record-surgical-referral-intent', 'Record bounded urgent surgical-referral intent', assessment.surgicalReferralAtTick !== null)}
      </div>
    </section>
    <section className="syringe endocarditis__section" aria-labelledby="endocarditis-boundary-title">
      <div id="endocarditis-boundary-title" className="syringe__name">This clock is surgical, not antimicrobial.</div>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what the pulse pressure, the vegetation size, and the surgical timing tiers actually establish.'
        : 'Supplied boundaries: falling markers and clearing cultures describe the infection, not the valve. Acute severe regurgitation gives a normal or narrow pulse pressure, a soft or absent first heart sound, and a short quiet murmur; the collapsing pulse and wide pulse pressure of the textbook belong to chronic disease, where the ventricle has had time to dilate. Vegetation size is not a standalone surgical trigger, because that threshold operates together with an embolic episode or another indication. The surgical timing tiers are consensus operationalizations of urgency rather than randomised-trial thresholds, and the one major trial in this area enrolled a narrow stable population that does not generalise here.'}</p>
      <p className="syringe__remaining">Nothing here selects an operation, a prosthesis, a theatre time, or an anaesthetic plan, and no antimicrobial, fluid, diuretic, vasoactive agent, or oxygen setting is chosen. Recorded intent is not an accepted transfer.</p>
      <p className="syringe__remaining">Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Surveillance: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}. Current pulse pressure: {assessment.pulsePressureMmHg} mmHg.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('review-boundaries', 'Review the pulse pressure, vegetation, and timing tiers', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange perfusion and respiratory surveillance', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe endocarditis__section" aria-labelledby="endocarditis-observation-title">
      <div id="endocarditis-observation-title" className="syringe__name">Watch the breathing, not the temperature chart.</div>
      <p className="syringe__remaining">{labs
        ? `Last requested laboratory evidence at simulated ${formatElapsed(labs.atTick)}: white cells ${labs.whiteCellsX109L.toFixed(1)} x10^9/L; C-reactive protein ${labs.crpMgL} mg/L; creatinine ${labs.creatinineUmolL} µmol/L; lactate ${labs.lactateMmolL.toFixed(1)} mmol/L; cultures ${labs.culturesClearing ? 'no growth on the latest set' : 'growth on the admission set'}. A laboratory-only check does not refresh the perfusion assessment.`
        : 'No new laboratory-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{perfusion
        ? `Last requested examination at simulated ${formatElapsed(perfusion.atTick)}: BP ${perfusion.systolicMmHg}/${perfusion.diastolicMmHg} mmHg, pulse pressure ${perfusion.pulsePressureMmHg} mmHg; respiratory rate ${perfusion.respiratoryRateBpm}/min; oxygen saturation ${perfusion.spo2Percent}% on ${perfusion.oxygenSupport}; ${perfusion.cracklesToApices ? 'crackles to the apices' : 'bibasal crackles'}. A perfusion-only look does not refresh laboratory evidence.`
        : 'No new perfusion-only examination has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg, pulse pressure ${observation.pulsePressureMmHg} mmHg; respiratory rate ${observation.respiratoryRateBpm}/min; oxygen saturation ${observation.spo2Percent}% on ${observation.oxygenSupport}; C-reactive protein ${observation.crpMgL} mg/L; lactate ${observation.lactateMmolL.toFixed(1)} mmol/L; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.decompensationDueInSeconds !== null && <p className="syringe__remaining">Authored decompensation in {Math.ceil(assessment.decompensationDueInSeconds / 60)} simulated min.</p>}
      <p className="syringe__remaining">A narrow pulse pressure is the expected finding in acute severe regurgitation, not evidence against it. The decompensation occurs whatever you record, because the treatment is an operation that is not in this rehearsal; what changes is whether the surgical team is already engaged when it arrives.</p>
      {assessment.decompensationObserved && <p className="syringe__remaining">The C-reactive protein has fallen further while the patient has become very much worse. That divergence is the whole point.</p>}
      {(assessment.markerReassuranceAttempted || assessment.pulsePressureErrorAttempted || assessment.vegetationOnlyAttempted || assessment.deferralAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the pending surgical decision, the transfer, continuing antimicrobial therapy, and embolic risk are handed off. Neither operability nor survival is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-labs', 'Check laboratory evidence only')}{decision('check-perfusion', 'Check perfusion and breathing only')}
        {decision('reassess', 'Reassess perfusion and laboratory response')}
        {decision('handoff', 'Hand off a pending surgical decision')}
        {decision('markers-improving-means-better', 'Read the falling marker as an improving patient')}
        {decision('wide-pulse-pressure-expected', 'Exclude severe regurgitation on a narrow pulse pressure')}
        {decision('vegetation-size-alone-decides', 'Treat vegetation size as the surgical trigger')}
        {decision('continue-antimicrobials-and-review-tomorrow', 'Continue antimicrobials and review tomorrow')}
      </div>
    </section>
  </>;
}
