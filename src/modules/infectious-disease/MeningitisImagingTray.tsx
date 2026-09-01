import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { MeningitisImagingSnapshot } from '@platform/kernel/protocol';
import { MENINGITIS_IMAGING_CRITERIA, type MeningitisImagingAction } from './meningitis-imaging';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { meningitisImagingInlinePrompt } from './meningitis-imaging-tutor';

export function MeningitisImagingTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: MeningitisImagingSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: MeningitisImagingAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = meningitisImagingInlinePrompt(guidance, { scenarioVersion, meningitisImaging: assessment });
  const features = assessment.featureObservation; const labs = assessment.labObservation;
  const observation = assessment.observation;
  const decision = (action: MeningitisImagingAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* The recorded fact is tested before the countdown, so a passed ceiling never reads as
        "nothing recorded" on a screen that also shows what was recorded. */}
    <p className="syringe__remaining" role="status">{assessment.antimicrobialIntentAtTick !== null
      ? `Antimicrobial intent recorded ${assessment.antimicrobialInsideCeiling ? 'inside the hour' : 'after the hour had passed'}.`
      : assessment.ceilingPassed
        ? 'One hour has elapsed since arrival with no antimicrobial intent recorded. The ceiling has passed, and that is reported rather than hidden.'
        : `Ceiling: ${Math.ceil((assessment.ceilingDueInSeconds ?? 0) / 60)} simulated min remain of the hour.`}</p>
    <p className="syringe__remaining">Selected sources: NICE NG240 (2024), the WHO 2025 meningitis guidelines, a Swedish cohort study, and the archived IDSA 2004 guideline. Open the source view for exact wording and grades.</p>
    <section className="syringe meningitis-imaging__section" aria-labelledby="meningitis-imaging-features-title">
      <div id="meningitis-imaging-features-title" className="syringe__name">The same patient, read five ways.</div>
      <p className="syringe__remaining">Supplied starting findings were temperature 38.7 C, heart rate 104/min, BP 128/74 mmHg, respiratory rate 20/min, SpO2 96% in air, Glasgow Coma Scale 14, C-reactive protein 142 mg/L, and white cells 15.1 x10^9/L. Present: age 68, maintenance immunosuppression after kidney transplantation, and a Glasgow Coma Scale of 14. Absent: focal deficit, seizure, papilloedema, pupillary abnormality, purpura, shock, and bleeding risk. These remain historical starting findings.</p>
      <p className="syringe__remaining">Every published rule set turns on exactly which of those features are present, so the absences are recorded as deliberately as the presences.</p>
      <p className="syringe__remaining">Features: {assessment.featuresRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.featuresRecordedAtTick)}`}. Ownership: {assessment.ownersActivatedAtTick === null ? 'not yet activated' : 'activated, with cultures drawn rather than resulted'}. Antimicrobial intent: {assessment.antimicrobialIntentAtTick === null ? 'not yet recorded' : assessment.antimicrobialInsideCeiling ? 'recorded inside the hour' : 'recorded after the hour had passed'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-triggering-features', 'Record the features and their absences', assessment.featuresRecordedAtTick !== null)}
        {decision('activate-time-critical-owners', 'Activate time-critical ownership', assessment.ownersActivatedAtTick !== null)}
        {decision('record-antimicrobial-intent', 'Record bounded antimicrobial intent', assessment.antimicrobialIntentAtTick !== null)}
      </div>
    </section>
    <section className="syringe meningitis-imaging__section" aria-labelledby="meningitis-imaging-criteria-title">
      <div id="meningitis-imaging-criteria-title" className="syringe__name">Which list are you standing in?</div>
      {assessment.criteriaCompared ? <>
        <p className="syringe__remaining">Each published set, applied to this one patient:</p>
        <ul className="syringe__remaining">
          {MENINGITIS_IMAGING_CRITERIA.map((set) => (
            <li key={set.id}><strong>{set.label}</strong>: {set.indicated ? 'image before puncture' : 'no imaging indicated'}. {set.reason}</li>
          ))}
        </ul>
        <p className="syringe__remaining">Two say image, three do not, and the patient did not change between those readings. In a published cohort the same population met the imaging criteria in roughly 7%, 32%, and 65% of cases under three of these sets.</p>
      </> : <p className="syringe__remaining">Compare the published criteria sets against this patient before assuming the question has one answer.</p>}
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty of evidence behind them.'
        : 'Supplied boundaries: antimicrobials start within one hour of arrival and diagnostics, imaging included, must not delay them; that target rests on evidence its own developers graded very low to low quality, which makes it a system-design margin rather than a validated deadline, and does not make missing it acceptable. Blood cultures are taken before antimicrobials, not reported before them. Imaging before puncture is not routine, but the exception lists differ materially between issuing bodies, and one widely cited set is marked archived by its own society with a 2004 data cutoff. A normal C-reactive protein, procalcitonin, or white cell count does not exclude bacterial meningitis, and neither does a negative Gram stain, whose sensitivity is roughly half. Lumbar puncture without preceding imaging was associated with lower mortality and more patients treated inside the hour in a large observational series; that is observational and confounding by indication is not excluded.'}</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('compare-criteria-sets', 'Compare the published criteria sets', assessment.criteriaComparedAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange continuous observation', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe meningitis-imaging__section" aria-labelledby="meningitis-imaging-observation-title">
      <div id="meningitis-imaging-observation-title" className="syringe__name">Reassess. The clock runs through the wait.</div>
      <p className="syringe__remaining">{features
        ? `Last requested neurological observation at simulated ${formatElapsed(features.atTick)}: Glasgow Coma Scale ${features.glasgowComaScale}; pupils ${features.pupilsEqualReactive ? 'equal and reactive' : 'not equal and reactive'}; ${features.focalDeficit ? 'focal deficit present' : 'no focal deficit'}; ${features.seizure ? 'seizure observed' : 'no seizure'}. A neurological look does not refresh laboratory evidence.`
        : 'No new neurological-only observation has been requested.'}</p>
      <p className="syringe__remaining">{labs
        ? `Last requested laboratory evidence at simulated ${formatElapsed(labs.atTick)}: C-reactive protein ${labs.crpMgL} mg/L; white cells ${labs.whiteCellsX109L.toFixed(1)} x10^9/L; ${labs.cerebrospinalFluidAvailable ? 'cerebrospinal fluid obtained, Gram stain reports no organism seen' : 'no cerebrospinal fluid obtained yet'}. None of these excludes bacterial meningitis.`
        : 'No new laboratory-only measurement has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: Glasgow Coma Scale ${observation.glasgowComaScale}; heart rate ${observation.heartRateBpm}/min; temperature ${observation.coreTemperatureC.toFixed(1)} C; C-reactive protein ${observation.crpMgL} mg/L. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.imagingObserved && <p className="syringe__remaining">The scan is reported: no space-occupying lesion, no midline shift, nothing that contraindicates a puncture. It changed no management, which is the common result rather than a lucky one.</p>}
      {(assessment.scanIsSaferAttempted || assessment.delayAttempted || assessment.crpAttempted || assessment.gramStainAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the recorded features and absences, which criteria sets they satisfy, whether intent fell inside the hour, and any microbiological yield lost all travel with the patient. No organism, treatment effect, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-features', 'Check neurological features only')}{decision('check-labs', 'Check laboratory evidence only')}
        {decision('reassess', 'Reassess features and laboratory evidence')}
        {decision('handoff', 'Hand off the features and what the wait cost')}
        {decision('scan-first-is-safer', 'Scan first, to be safe')}
        {decision('delay-antimicrobials-for-the-puncture', 'Hold antimicrobials until the puncture')}
        {decision('normal-crp-excludes', 'Exclude it on the normal C-reactive protein')}
        {decision('negative-gram-stain-excludes', 'Exclude it on the negative Gram stain')}
      </div>
    </section>
  </>;
}
