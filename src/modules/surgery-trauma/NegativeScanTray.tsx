import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { NegativeScanSnapshot } from '@platform/kernel/protocol';
import type { NegativeScanAction } from './negative-scan';

export function NegativeScanTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: NegativeScanSnapshot;
  readonly onAction: (action: NegativeScanAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const observations = assessment.observationRecord; const operative = assessment.operativeRecord;
  const observation = assessment.observation;
  const decision = (action: NegativeScanAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {/* This lesson does not yet carry a private tutor. The audit says so, and nothing here
        pretends otherwise. */}
    <p className="syringe__remaining" role="status">Day {assessment.postoperativeDay} after a sigmoid resection with a primary colorectal anastomosis and no diverting stoma. Heart rate above 100 for {assessment.tachycardiaHours} hours. No flatus passed.</p>
    <p className="syringe__remaining">Selected sources: a 452-patient cohort of vital signs after bowel resection, and two single-centre series of computed tomography for anastomotic leakage. Open the source view for exact wording and confidence intervals.</p>
    <section className="syringe negative-scan__section" aria-labelledby="negative-scan-course-title">
      <div id="negative-scan-course-title" className="syringe__name">Read him against his own operation, not against a normal ward day.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 110/min, blood pressure 110/68 mmHg, respiratory rate 22/min, oxygen saturation 95% in air, temperature 37.4 C, and alert. He has passed no flatus, is not tolerating oral intake, and needs more analgesia than yesterday. These remain historical starting observations.</p>
      <p className="syringe__remaining">The abdominal CT reported eighteen hours ago says no evidence of an anastomotic leak, with a small volume of free fluid and free gas within expected postoperative appearances.</p>
      <p className="syringe__remaining">Operative course: {assessment.operativeCourseRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.operativeCourseRecordedAtTick)} as the reference for everything else`}. Failure to progress: {assessment.progressRecordedAtTick === null ? 'not yet recorded' : 'recorded against that course with its duration'}. Limits of the scan: {assessment.scanLimitsRecordedAtTick === null ? 'not yet recorded' : 'recorded explicitly'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-operative-course', 'Record the operation and the course it predicts', assessment.operativeCourseRecordedAtTick !== null)}
        {decision('record-the-failure-to-progress', 'Record the failure to progress against that course', assessment.progressRecordedAtTick !== null)}
        {decision('record-what-the-scan-excludes', 'Record what the scan does and does not exclude', assessment.scanLimitsRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe negative-scan__section" aria-labelledby="negative-scan-escalation-title">
      <div id="negative-scan-escalation-title" className="syringe__name">No evidence of a leak is not the same sentence as no leak.</div>
      <p className="syringe__remaining">{assessment.scanLimitsRecordedAtTick === null
        ? 'A report is an observation with a sensitivity, not a verdict. Record what it can and cannot rule out before you rely on it.'
        : 'Published negative predictive values for this scan were 0.70 in one series and 88 percent in another, against leak rates of 10.9 and 7.8 percent. Neither turns this patient into a patient without a leak.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what any of this licenses.'
        : 'Supplied boundaries: in 452 bowel resections, tachycardia and tachypnoea were almost routine and the positive predictive value of any aberrant sign was 4 to 11 percent, with 19 leaks among 271 complications — a reason not to act on one reading, not a reason to stop looking. Against that, delayed reintervention after a false-negative scan carried mortality of 62.5 percent in eight patients, and 45.5 against 4.2 percent in another single-centre series. All are small numbers, and none of them is about this abdomen.'}</p>
      <p className="syringe__remaining">Operating team: {assessment.escalationAtTick === null ? 'not yet contacted' : `contacted at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.surgicalIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-the-operating-team', 'Contact the team that made the anastomosis', assessment.escalationAtTick !== null)}
        {decision('record-bounded-surgical-intent', 'Record bounded qualified-team intent', assessment.surgicalIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe negative-scan__section" aria-labelledby="negative-scan-observation-title">
      <div id="negative-scan-observation-title" className="syringe__name">Reassess. He is not going to crash and settle this for you.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}% on air; temperature ${observations.coreTemperatureC.toFixed(1)} C; above 100 for ${observations.tachycardiaHours} hours. This partial check supplies no operative record and no course.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{operative
        ? `Last requested operative record at simulated ${formatElapsed(operative.atTick)}: ${operative.procedure}, day ${operative.postoperativeDay}, ${operative.diverted ? 'with a diverting stoma' : 'with no diverting stoma'}; ${operative.flatusPassed ? 'flatus passed' : 'no flatus passed'}; ${operative.tolerating ? 'tolerating oral intake' : 'not tolerating oral intake'}. This partial check supplies no new observations.`
        : 'No new operative-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; blood pressure ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; temperature ${observation.coreTemperatureC.toFixed(1)} C; above 100 for ${observation.tachycardiaHours} hours; ${observation.flatusPassed ? 'flatus passed' : 'no flatus'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.roundCompleted && <p className="syringe__remaining">The observations have been repeated and are unchanged. He has vomited once since the last round and has still passed no flatus.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The operating team has answered. They confirmed the procedure and the anastomosis from their own record, stated that a report of no evidence of a leak does not override a patient off his expected course, and own re-imaging, direct assessment, and any return to theatre.</p>}
      {(assessment.scanExclusionAttempted || assessment.routineDismissalAttempted || assessment.rescanDeferralAttempted || assessment.treatTheNumbersAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the operation and the day, the failure to progress against the course it predicts, the limits of the reported scan, the contact made, and the bounded surgical intent all travel with the patient. No leak, operative decision, or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-operative-record', 'Check the operative record only')}
        {decision('reassess', 'Reassess observations and operative record')}
        {decision('handoff', 'Hand off the course and what it rests on')}
        {decision('the-scan-was-negative-so-it-is-not-a-leak', 'The scan was negative, so it is not a leak')}
        {decision('abnormal-vitals-are-routine-after-bowel-surgery', 'These numbers are routine after bowel surgery')}
        {decision('repeat-the-scan-tomorrow-and-review-then', 'Repeat the scan tomorrow and review then')}
        {decision('treat-the-numbers-and-watch-overnight', 'Treat the numbers and watch overnight')}
      </div>
    </section>
  </>;
}
