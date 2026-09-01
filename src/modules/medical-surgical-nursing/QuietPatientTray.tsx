import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { QuietPatientSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { QuietPatientAction } from './quiet-patient';
import { quietPatientInlinePrompt } from './quiet-patient-tutor';

export function QuietPatientTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: QuietPatientSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: QuietPatientAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = quietPatientInlinePrompt(guidance, { scenarioVersion, quietPatient: assessment });
  const chart = assessment.chartRecord; const patient = assessment.patientRecord;
  const observation = assessment.observation;
  const decision = (action: QuietPatientAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* The count of screening results leads, because zero is the finding and it is easy to miss
        underneath three shifts of confident-sounding prose. */}
    <p className="syringe__remaining" role="status">Screening results in the record: {assessment.recordedScreenResults}. {assessment.screenPositive
      ? 'A screen has been performed in this rehearsal and is positive.'
      : 'No screen has been performed. The record holds no negative screen; it holds no screen.'}</p>
    <p className="syringe__remaining">Selected sources: a multicentre diagnostic accuracy study of the 4AT and CAM, a scoping review of delirium motor subtypes, and a review of hypoactive delirium recognition. Open the source view for exact figures.</p>
    <section className="syringe quiet-patient__section" aria-labelledby="quiet-patient-chart-title">
      <div id="quiet-patient-chart-title" className="syringe__name">Three shifts. No result.</div>
      <p className="syringe__remaining">Supplied starting observations were pulse 82/min, blood pressure 126/74 mmHg, respiratory rate 16/min, oxygen saturation 96% in air, temperature 36.8 C, all unremarkable, two days after fixation of a fractured neck of femur. These remain historical starting observations.</p>
      <ul className="syringe__remaining">
        {assessment.chartedImpressions.map((entry, index) => (
          <li key={entry}>Shift {index + 1}: “{entry}”</li>
        ))}
      </ul>
      <p className="syringe__remaining">{assessment.impressionsReviewedAtTick === null
        ? 'He has been sleeping through meals and is slow to answer. His family say this is not how he was at home a week ago.'
        : 'Every one of those entries is an impression, and none is a screening result. Absence of a positive finding and a negative finding are different things, and only the first is present here.'}</p>
      <p className="syringe__remaining">Impressions reviewed: {assessment.impressionsReviewedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(assessment.impressionsReviewedAtTick)}`}. Screen: {assessment.screenedAtTick === null ? 'not performed' : 'performed, and positive'}. Result recorded: {assessment.resultRecordedAtTick === null ? 'not yet' : 'recorded as a screening result'}.</p>
      <div className="crisis-drug__actions">
        {decision('review-the-charted-impression', 'Review the charted impressions', assessment.impressionsReviewedAtTick !== null)}
        {decision('screen-for-arousal', 'Perform the screen now', assessment.screenedAtTick !== null)}
        {decision('record-the-screen-result', 'Record the screening result', assessment.resultRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe quiet-patient__section" aria-labelledby="quiet-patient-escalation-title">
      <div id="quiet-patient-escalation-title" className="syringe__name">Quiet is the finding, not the reassurance.</div>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what the subtype prevalence and the screening accuracy figures do and do not license.'
        : 'Supplied boundaries: the hypoactive subtype is about half of cases in reported series and the most frequently missed, regularly read as depression or fatigue. Under routine multicentre use the 4AT reached 76% sensitivity and the CAM 40%, so a negative result is weak evidence of absence and a negative CAM excludes very little. Impaired arousal is itself scoreable, so a drowsy patient is one who can be screened rather than one who must be left. None of this establishes a cause or predicts what the review will find.'}</p>
      <p className="syringe__remaining">Escalation: {assessment.escalationAtTick === null ? 'not yet requested' : `requested at simulated ${formatElapsed(assessment.escalationAtTick)} on the screening result`}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Repeat screening: {assessment.monitoringAtTick === null ? 'not scheduled' : 'scheduled at defined intervals, with the reason recorded'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-on-the-positive-screen', 'Escalate on the screening result', assessment.escalationAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Schedule repeat screening', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe quiet-patient__section" aria-labelledby="quiet-patient-observation-title">
      <div id="quiet-patient-observation-title" className="syringe__name">Reassess. The observations will stay normal.</div>
      <p className="syringe__remaining">{chart
        ? `Last requested chart review at simulated ${formatElapsed(chart.atTick)}: ${chart.impressions.length} consecutive entries across ${chart.shifts} shifts, ${chart.screenResults} screening results. Observations, food and fluid charts, and pressure-area care are complete at every entry; the gap is specific rather than general neglect.`
        : 'No new chart review has been requested.'}</p>
      <p className="syringe__remaining">{patient
        ? `Last requested observation at simulated ${formatElapsed(patient.atTick)}: ${patient.rousable ? 'rousable' : 'not rousable'}; ${patient.attentive ? 'attentive' : 'inattentive within seconds'}; ${patient.agitated ? 'agitated' : 'not agitated'}; ${patient.familyReportsChange ? 'family report a change from a week ago' : 'no family report'}.`
        : 'No new observation of the patient has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: ${observation.rousable ? 'rousable' : 'not rousable'}, ${observation.attentive ? 'attentive' : 'inattentive'}; ${observation.screenResults} screening results across ${observation.shifts} shifts. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.handoverRepeated && assessment.screenedAtTick === null && <p className="syringe__remaining">The outgoing nurse has added it to the handover in the same words. A fourth entry is about to read exactly like the first three.</p>}
      {assessment.reviewObserved && <p className="syringe__remaining">The review has happened and reached the same conclusion, recording that the preceding three shifts contain no screening result of any kind. There was nothing to disagree with.</p>}
      {(assessment.deferralAttempted || assessment.quietReadAsSettled || assessment.earlierScreenTrusted || assessment.moodAttributed) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the impressions as written, the screen and its positive components, the repeat schedule, and the absence of any earlier result all travel with the patient. No cause or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-chart', 'Review the chart only')}{decision('check-patient', 'Observe the patient only')}
        {decision('reassess', 'Reassess the chart and the patient')}
        {decision('handoff', 'Hand off the screen and the gap')}
        {decision('let-them-sleep-and-screen-later', 'Let him sleep, screen later')}
        {decision('quiet-is-settled', 'He is quiet, so he is settled')}
        {decision('negative-earlier-screen-excludes', 'He screened negative before')}
        {decision('call-it-low-mood', 'This is low mood after surgery')}
      </div>
    </section>
  </>;
}
