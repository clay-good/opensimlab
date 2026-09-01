import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { AfferentLimbSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { AFFERENT_LIMB_CRITERIA, type AfferentLimbAction } from './afferent-limb';
import { afferentLimbInlinePrompt } from './afferent-limb-tutor';

export function AfferentLimbTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: AfferentLimbSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: AfferentLimbAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = afferentLimbInlinePrompt(guidance, { scenarioVersion, afferentLimb: assessment });
  const criteria = assessment.criteriaRecord; const availability = assessment.availabilityRecord;
  const observation = assessment.observation;
  const decision = (action: AfferentLimbAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* The threshold state is stated first and never softened: it was met before this began. */}
    <p className="syringe__remaining" role="status">{assessment.metCriteriaCount} of {assessment.totalCriteriaCount} activation criteria met. The local policy requires {assessment.policyThreshold}. {assessment.calledAtTick === null
      ? 'The call has not been made.'
      : `Response team called at simulated ${formatElapsed(assessment.calledAtTick)}.`}</p>
    <p className="syringe__remaining">Selected sources: a systematic review of rapid-response afferent-limb performance, and a systematic review of failure to rescue in surgery. Open the source view for exact figures.</p>
    <section className="syringe afferent-limb__section" aria-labelledby="afferent-limb-criteria-title">
      <div id="afferent-limb-criteria-title" className="syringe__name">The recognition already happened.</div>
      <p className="syringe__remaining">Supplied starting observations were respiratory rate 30/min, blood pressure 88/54 mmHg, oxygen saturation 93% on newly required supplemental oxygen, pulse 118/min, temperature 37.8 C, alert, anxious, speaking in short phrases, five days after emergency laparotomy. These remain historical starting observations.</p>
      <ul className="syringe__remaining">
        {AFFERENT_LIMB_CRITERIA.map((entry) => (
          <li key={entry.id}>{entry.met ? 'Met' : 'Not met'}: {entry.label}</li>
        ))}
      </ul>
      <p className="syringe__remaining">{assessment.obstaclesRecordedAtTick === null
        ? 'The charge nurse says the team came yesterday and it was nothing, and that they are busy downstairs. The covering doctor is in theatre.'
        : 'Recorded: the team attended yesterday and found nothing, they are occupied elsewhere, and the covering doctor is in theatre. None of these is a clinical finding, and none appears among the criteria. Written down, they can be weighed; unwritten, they simply win.'}</p>
      <p className="syringe__remaining">Criteria recorded: {assessment.criteriaRecordedAtTick === null ? 'not yet' : `at simulated ${formatElapsed(assessment.criteriaRecordedAtTick)}`}. Obstacles recorded: {assessment.obstaclesRecordedAtTick === null ? 'not yet' : 'recorded plainly'}. Concern stated: {assessment.concernStatedAtTick === null ? 'not yet' : 'stated to a person, in words'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-met-criteria', 'Record the met criteria', assessment.criteriaRecordedAtTick !== null)}
        {decision('record-the-obstacles', 'Record the obstacles plainly', assessment.obstaclesRecordedAtTick !== null)}
        {decision('state-the-concern-explicitly', 'State the concern to a person', assessment.concernStatedAtTick !== null)}
      </div>
    </section>
    <section className="syringe afferent-limb__section" aria-labelledby="afferent-limb-call-title">
      <div id="afferent-limb-call-title" className="syringe__name">The criteria are the authorisation.</div>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review what is known about how escalation fails, and what those figures do and do not establish.'
        : 'Supplied boundaries: afferent-limb failure, meaning the call never made or made late, appears in roughly a fifth to a third of reviewed adverse events. Staff believed the situation was under control in about half of missed activations, and calling a physician first rather than the response team was the more frequent action in about three quarters. Delayed escalation appears in a fifth to nearly half of failure-to-rescue cases. These are observational findings about systems, not a prediction about this patient, and none establishes that a given delay caused a given death.'}</p>
      <p className="syringe__remaining">Call: {assessment.calledAtTick === null ? 'not made' : 'made on the met threshold'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Observation: {assessment.monitoringAtTick === null ? 'not increased' : 'increased, with the reason recorded'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('call-the-response-team', 'Call the response team', assessment.calledAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Increase observation', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe afferent-limb__section" aria-labelledby="afferent-limb-observation-title">
      <div id="afferent-limb-observation-title" className="syringe__name">Reassess. The patient will not change.</div>
      <p className="syringe__remaining">{criteria
        ? `Last requested criteria check at simulated ${formatElapsed(criteria.atTick)}: ${criteria.metCount} of ${criteria.totalCount} met, against a policy threshold of ${criteria.policyThreshold}. This partial check supplies no information about who is available.`
        : 'No new criteria check has been requested.'}</p>
      <p className="syringe__remaining">{availability
        ? `Last requested availability at simulated ${formatElapsed(availability.atTick)}: response team ${availability.responseTeamReachable ? 'reachable' : 'not reachable'}; covering doctor ${availability.coveringDoctorAvailable ? 'available' : 'in theatre'}; charge nurse ${availability.chargeNurseSupportive ? 'supportive' : 'discouraging the call'}. The response team is reachable regardless of the rest.`
        : 'No new availability check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: respiratory rate ${observation.respiratoryRateBpm}/min; systolic ${observation.systolicMmHg} mmHg; ${observation.metCount} of ${observation.totalCount} criteria met. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.pressureApplied && assessment.calledAtTick === null && <p className="syringe__remaining">The charge nurse has said it again. Nothing about the patient has changed, and the criteria are still met.</p>}
      {assessment.arrivalObserved && <p className="syringe__remaining">The response team is present and has taken over. They recorded that the criteria were met on arrival and said nothing about yesterday.</p>}
      {(assessment.doctorFirstAttempted || assessment.roundWaitAttempted || assessment.documentedOnlyAttempted || assessment.permissionSought) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: which criteria were met and when, that the call was made on the threshold rather than on permission, and the obstacles as recorded all travel with the patient. Whether the call proves necessary is not what made it correct.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome and is not evidence that the delay caused harm.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-criteria', 'Check the criteria only')}{decision('check-availability', 'Check who is available')}
        {decision('reassess', 'Reassess criteria and availability')}
        {decision('handoff', 'Hand off the call and its basis')}
        {decision('call-the-doctor-first', 'Call the covering doctor first')}
        {decision('wait-for-the-ward-round', 'Wait for the ward round')}
        {decision('document-and-wait', 'Document the concern and wait')}
        {decision('ask-permission-to-call', 'Ask the charge nurse for permission')}
      </div>
    </section>
  </>;
}
