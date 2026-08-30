import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { TrialRuleSnapshot } from '@platform/kernel/protocol';
import type { TrialRuleAction } from './trial-rule';

export function TrialRuleTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: TrialRuleSnapshot;
  readonly onAction: (action: TrialRuleAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const observations = assessment.observationRecord; const imaging = assessment.imagingRecord;
  const observation = assessment.observation;
  const decision = (action: TrialRuleAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {/* The condition the cited rule attaches, stated next to the rule, every time. */}
    <p className="syringe__remaining" role="status">Restaging at nine weeks reports new lesions and enlarging disease. The criterion being cited permits treating through that while the patient is clinically stable, and she is {assessment.clinicallyStable ? 'clinically stable' : 'not clinically stable'}.</p>
    <p className="syringe__remaining">Selected sources: the response criteria for trials testing immunotherapeutics, and a review of atypical response patterns. Open the source view for exact wording and grades.</p>
    <section className="syringe trial-rule__section" aria-labelledby="trial-rule-trajectory-title">
      <div id="trial-rule-trajectory-title" className="syringe__name">The report is a moment. You are being asked about a slope.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 96/min, blood pressure 112/68 mmHg, respiratory rate 22/min, oxygen saturation 94% in air, and temperature 36.9 C. These remain historical starting observations.</p>
      <p className="syringe__remaining">Over three weeks she has gone from managing her own shopping to needing help to wash, and has lost six kilograms. A colleague says this could be pseudoprogression.</p>
      <p className="syringe__remaining">Trajectory: {assessment.trajectoryRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.trajectoryRecordedAtTick)}`}. What the criteria govern: {assessment.governanceRecordedAtTick === null ? 'not recorded' : 'recorded'}. Treating team: {assessment.escalationAtTick === null ? 'not yet called' : `called at simulated ${formatElapsed(assessment.escalationAtTick)}`}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-clinical-trajectory-not-just-the-scan', 'Record the trajectory, not just the scan', assessment.trajectoryRecordedAtTick !== null)}
        {decision('escalate-to-the-treating-team-now', 'Call the treating team now', assessment.escalationAtTick !== null)}
        {decision('record-what-the-criteria-do-and-do-not-govern', 'Record what the criteria do not govern', assessment.governanceRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe trial-rule__section" aria-labelledby="trial-rule-evidence-title">
      <div id="trial-rule-evidence-title" className="syringe__name">The rule was quoted at you. Here is what it says.</div>
      <p className="syringe__remaining">{assessment.documentRead
        ? 'The criteria are on the screen now. They permit continuing past a radiological progression while the patient is clinically stable, expect confirmation four to eight weeks later, and are described by their own working group as recommendations for data handling rather than patient management, and as not validated.'
        : 'The criteria are being fetched. What they allow, and what they attach that allowance to, are different sentences.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? `Pseudoprogression is real and uncommon; hyperprogression is real too. Review the boundaries and the certainty behind them before deciding what a report at nine weeks licenses.`
        : `Supplied boundaries: reported pseudoprogression rates do not exceed ${assessment.pseudoprogressionCeilingPercent} percent, on small series. Hyperprogression is reported at between 4 and 29 percent, including 13.8 percent on immunotherapy against 5.1 percent on chemotherapy in one lung-cancer comparison, with nothing established to offer once it has happened. The published advice is to distinguish them so as to avoid both premature discontinuation and a delayed next line.`}</p>
      <p className="syringe__remaining">Bounded intent: {assessment.treatmentIntentAtTick === null ? 'not recorded' : 'recorded as the treating team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-bounded-treatment-intent', 'Record bounded qualified-team intent', assessment.treatmentIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe trial-rule__section" aria-labelledby="trial-rule-observation-title">
      <div id="trial-rule-observation-title" className="syringe__name">Reassess. Both errors cost her something.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}% on air; ${observations.weightChangeKg} kg over ${observations.trajectoryWeeks} weeks; ${observations.functionalAccount}.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{imaging
        ? `Last requested supplied report at simulated ${formatElapsed(imaging.atTick)}: restaging at ${imaging.weeksOnTreatment} weeks reporting ${imaging.newLesions ? 'new lesions and enlarging disease' : 'no new lesions'}, ${imaging.reportAgeDays} days old; ${imaging.clinicallyStable ? 'clinically stable' : 'not clinically stable'}. Supplied, not acquired.`
        : 'No new report check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: respiratory rate ${observation.respiratoryRateBpm}/min; oxygen saturation ${observation.spo2Percent}% on air; ${observation.functionalAccount}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.documentRead && <p className="syringe__remaining">The cited criteria have been read. Their allowance is conditional on clinical stability, and they govern trial data rather than her management.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">Her treating team has answered and owns the decision. They will review her within days rather than at the eight-week scan, and say both errors are real.</p>}
      {(assessment.continueAttempted || assessment.stopAttempted || assessment.scanOnlyAttempted || assessment.waitAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the trajectory and its rate, the supplied report, and what the cited criterion actually governs all travel with her. No diagnosis, treatment effect, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-the-supplied-imaging-report', 'Check the supplied report only')}
        {decision('reassess', 'Reassess the patient and the report')}
        {decision('handoff', 'Hand off the direction and its rate')}
        {decision('call-it-pseudoprogression-and-continue', 'Call it pseudoprogression and continue')}
        {decision('stop-the-immunotherapy-and-tell-her-it-failed', 'Stop the immunotherapy and tell her it failed')}
        {decision('the-scan-alone-decides', 'The scan alone decides')}
        {decision('rescan-in-eight-weeks-and-review-then', 'Rescan in eight weeks and review then')}
      </div>
    </section>
  </>;
}
