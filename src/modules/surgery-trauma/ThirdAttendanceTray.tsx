import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ThirdAttendanceSnapshot } from '@platform/kernel/protocol';
import type { ThirdAttendanceAction } from './third-attendance';
import { thirdAttendanceInlinePrompt } from './third-attendance-tutor';

export function ThirdAttendanceTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: ThirdAttendanceSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: ThirdAttendanceAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = thirdAttendanceInlinePrompt(guidance, { scenarioVersion, thirdAttendance: assessment });
  const observations = assessment.observationRecord; const attendance = assessment.attendanceRecord;
  const observation = assessment.observation;
  const decision = (action: ThirdAttendanceAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining" role="status">{assessment.attendances} attendances in {assessment.daysSinceFirst} days, aged 26, with abdominal pain. Pain now {assessment.painLocalised ? 'localised to one place' : 'generalised'}. Imaging {assessment.imagingPerformed ? 'performed' : 'not performed at any visit'}.</p>
    <p className="syringe__remaining">Selected sources: a claims cohort of adults later diagnosed with appendicitis, a paediatric series on anchoring by triage complaint, and an analysis of nine million attendances in which patients admitted on a return visit did better than those admitted first time. Open the source view for exact wording and rates.</p>
    <section className="syringe third-attendance__section" aria-labelledby="third-attendance-record-title">
      <div id="third-attendance-record-title" className="syringe__name">Two accurate entries. Read what each one is.</div>
      <p className="syringe__remaining">Sunday: generalised abdominal pain, vomited once, discharged. Tuesday: recorded as settling with a soft abdomen, discharged, told to come back if it got worse. Both entries are accurate and neither clinician did anything wrong.</p>
      <p className="syringe__remaining">Authored observations are heart rate 96/min, blood pressure 118/70 mmHg, respiratory rate 16/min, oxygen saturation 99% on air, and temperature 37.4 C — very nearly what they were on both previous visits.</p>
      <p className="syringe__remaining">Attendances and findings: {assessment.attendancesRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.attendancesRecordedAtTick)}`}. What a previous assessment can say: {assessment.priorLimitsRecordedAtTick === null ? 'not yet recorded' : 'recorded beside the entries'}. What has changed: {assessment.changeRecordedAtTick === null ? 'not yet recorded' : 'recorded as a comparison'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-attendances-and-what-each-found', 'Record the attendances and what each found', assessment.attendancesRecordedAtTick !== null)}
        {decision('record-what-a-previous-assessment-can-say', 'Record what a previous assessment can say', assessment.priorLimitsRecordedAtTick !== null)}
        {decision('record-what-has-changed-since-the-last-visit', 'Record what has changed since the last visit', assessment.changeRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe third-attendance__section" aria-labelledby="third-attendance-escalation-title">
      <div id="third-attendance-escalation-title" className="syringe__name">Ask for an examination, not for a second opinion on the notes.</div>
      <p className="syringe__remaining">{assessment.changeRecordedAtTick === null
        ? 'The direction of travel between three examinations is the only thing in this case that no single visit contains. Record it before deciding what the two previous entries license.'
        : 'This is a third attendance in five days with pain that has localised and persisted, and nobody has examined the abdomen she has today.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what any of this licenses.'
        : 'Supplied boundaries: 6.0 percent of 101,375 adults later diagnosed with appendicitis had a potentially missed diagnosis at an earlier attendance, with an adjusted odds ratio of 1.68 for women with abdominal pain; a paediatric series found 8.8 against 3.8 percent missed by triage complaint, an odds ratio of 2.46, quoted for its mechanism rather than its rate; and among more than nine million attendances, those admitted on a return visit had lower in-hospital mortality than those admitted first time, 1.85 against 2.48 percent. Returning is common and is not itself a verdict.'}</p>
      <p className="syringe__remaining">Surgical team: {assessment.escalationAtTick === null ? 'not yet asked' : `asked at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.assessmentIntentAtTick === null ? 'not recorded' : 'recorded as the qualified team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-the-surgical-team', 'Ask the surgical team to see her', assessment.escalationAtTick !== null)}
        {decision('record-bounded-assessment-intent', 'Record bounded qualified-team intent', assessment.assessmentIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe third-attendance__section" aria-labelledby="third-attendance-observation-title">
      <div id="third-attendance-observation-title" className="syringe__name">Reassess. These numbers decided nothing twice already.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}%; temperature ${observations.coreTemperatureC.toFixed(1)} C. This partial check supplies no attendance record.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{attendance
        ? `Last requested attendance record at simulated ${formatElapsed(attendance.atTick)}: ${attendance.attendances} attendances in ${attendance.daysSinceFirst} days; first visit ${attendance.firstVisitFinding}; second visit ${attendance.secondVisitFinding}; pain ${attendance.painLocalised ? 'localised' : 'generalised'} and ${attendance.worseOnMovement ? 'worse on movement' : 'unchanged by movement'}; ${attendance.eatingToday ? 'has eaten today' : 'has not eaten today'}; imaging ${attendance.imagingPerformed ? 'performed' : 'not performed at any visit'}. This partial check supplies no new observations.`
        : 'No new attendance-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; temperature ${observation.coreTemperatureC.toFixed(1)} C; ${observation.attendances} attendances in ${observation.daysSinceFirst} days; pain ${observation.painLocalised ? 'localised' : 'generalised'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.colleagueSpoke && <p className="syringe__remaining">The clinician who saw her on Tuesday has passed the door, remembers her, says she was fine then and was told to come back if it got worse, and has asked kindly whether anything is actually different. Nothing about the patient has changed.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The surgical team has answered. They read the two previous entries as records of two earlier examinations rather than as conclusions about today, and own the examination, any investigation, any operation, and whether she is admitted or seen again tomorrow.</p>}
      {(assessment.seenTwiceAttempted || assessment.settlingClaimAttempted || assessment.anxiousClaimAttempted || assessment.sameAdviceAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the three attendances with what each found, the earlier entries as records of earlier examinations, the change between them, and the bounded intent all travel with the patient. No diagnosis, disposition, or outcome is certified, and no criticism of either previous clinician is recorded.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-attendance-record', 'Check the attendance record only')}
        {decision('reassess', 'Reassess observations and attendance record')}
        {decision('handoff', 'Hand off the examination that is owed')}
        {decision('she-has-been-seen-twice-already', 'She has been seen twice already')}
        {decision('the-notes-say-it-was-settling', 'The notes say it was settling')}
        {decision('she-is-anxious-and-keeps-coming-back', 'She is anxious and keeps coming back')}
        {decision('discharge-her-with-the-same-advice-again', 'Discharge her with the same advice again')}
      </div>
    </section>
  </>;
}
