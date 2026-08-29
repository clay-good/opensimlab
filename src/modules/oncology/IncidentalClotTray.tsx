import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { IncidentalClotSnapshot } from '@platform/kernel/protocol';
import type { IncidentalClotAction } from './incidental-clot';

export function IncidentalClotTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: IncidentalClotSnapshot;
  readonly onAction: (action: IncidentalClotAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const observations = assessment.observationRecord; const report = assessment.reportRecord;
  const observation = assessment.observation;
  const decision = (action: IncidentalClotAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {/* Strength and certainty are stated with the recommendation, never underneath it. */}
    <p className="syringe__remaining" role="status">The recommendation here is {assessment.recommendationIsConditional ? 'conditional' : 'strong'}, on {assessment.certaintyOfEvidence} certainty in the evidence of effects. The report has gone {assessment.reportUnacknowledgedDays} days unacknowledged.</p>
    <p className="syringe__remaining">Selected sources: a society guideline on venous thromboembolism in cancer, a pooled analysis of 926 patients with incidentally found pulmonary embolism, and a registry cohort of 715. Open the source view for exact wording and grades.</p>
    <section className="syringe incidental-clot__section" aria-labelledby="incidental-clot-finding-title">
      <div id="incidental-clot-finding-title" className="syringe__name">Incidental describes how it was found.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 78/min, blood pressure 128/74 mmHg, respiratory rate 15/min, oxygen saturation 97% in air, and temperature 36.6 C, with no chest symptoms. These remain historical starting observations.</p>
      <p className="syringe__remaining">He has bled intermittently from the primary tumour for two months, most recently last week, with a haemoglobin that has drifted down.</p>
      <p className="syringe__remaining">Finding: {assessment.findingRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.findingRecordedAtTick)} with how it was found`}. Certainty: {assessment.certaintyRecordedAtTick === null ? 'not yet recorded' : 'recorded alongside the recommendation'}. Bleeding risk: {assessment.bleedingRiskRecordedAtTick === null ? 'not yet recorded' : 'recorded as his own'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-finding-and-how-it-was-found', 'Record the finding and how it was found', assessment.findingRecordedAtTick !== null)}
        {decision('record-the-certainty-of-the-recommendation', 'Record the strength and the certainty', assessment.certaintyRecordedAtTick !== null)}
        {decision('record-this-patients-bleeding-risk', 'Record his own bleeding risk', assessment.bleedingRiskRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe incidental-clot__section" aria-labelledby="incidental-clot-decision-title">
      <div id="incidental-clot-decision-title" className="syringe__name">Both reflexes answer a question the evidence has not settled.</div>
      <p className="syringe__remaining">{assessment.tradeoffRecordedAtTick === null
        ? 'One figure on its own is a different lesson. Record what treatment may prevent and what it may cause, in the same place.'
        : 'From the panel’s figures: about 89 fewer deaths and 77 fewer symptomatic emboli per 1000, and about 128 more major bleeds per 1000, all on very uncertain evidence. In the registry cohort, major bleeding exceeded symptomatic embolism during anticoagulation, and fatal bleeding exceeded fatal embolism.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what this recommendation licenses.'
        : 'Supplied boundaries: incidental pulmonary embolism is reported in roughly 3 percent of cancer patients; the pooled analysis followed 926 patients across 11 cohorts with a six-month mortality of about 37 percent, which belongs to the illness rather than to the clot or its treatment; the estimates are observational; and recurrence after a subsegmental clot was comparable to a more proximal one, so size does not settle it either.'}</p>
      <p className="syringe__remaining">Treating service: {assessment.escalationAtTick === null ? 'not yet contacted' : `contacted at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Shared decision: {assessment.sharedDecisionAtTick === null ? 'not recorded' : 'recorded as one to be made with him'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('record-the-benefit-and-the-harm-together', 'Record the benefit and the harm together', assessment.tradeoffRecordedAtTick !== null)}
        {decision('escalate-to-the-treating-service', 'Ask the treating service for a decision', assessment.escalationAtTick !== null)}
        {decision('record-the-decision-as-shared', 'Record it as a decision made with him', assessment.sharedDecisionAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe incidental-clot__section" aria-labelledby="incidental-clot-observation-title">
      <div id="incidental-clot-observation-title" className="syringe__name">Reassess. He is well, and stays well.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}% on air; temperature ${observations.coreTemperatureC.toFixed(1)} C. This partial check supplies neither the report nor the bleeding history.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{report
        ? `Last requested report at simulated ${formatElapsed(report.atTick)}: a ${report.clotLocation} pulmonary embolus, reported ${report.reportedDaysAgo} days ago on a scan performed ${report.scanIndication}; ${report.acknowledgedInRecord ? 'acknowledged in the record' : 'not yet acknowledged anywhere in the record'}.`
        : 'No new report check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; blood pressure ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg; oxygen saturation ${observation.spo2Percent}% on air; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.patientAsked && <p className="syringe__remaining">He has asked whether he has to have this treatment if he feels well, and said that the bleeding frightened him more than anything else has. He is not refusing anything.</p>}
      {assessment.serviceObserved && <p className="syringe__remaining">The treating service has answered. They own whether to anticoagulate, with what, and for how long, and have asked that the bleeding history and his account of it travel with the referral.</p>}
      {(assessment.dismissalAttempted || assessment.reflexTreatmentAttempted || assessment.waitForSymptomsAttempted || assessment.deferralAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the finding with how it was found, the conditional strength and very low certainty, the figures in both directions, and his bleeding history all travel with him. The decision is deliberately still open, and no treatment or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-the-report', 'Check the report only')}
        {decision('reassess', 'Reassess observations and the report')}
        {decision('handoff', 'Hand off the finding and the open decision')}
        {decision('incidental-so-no-action-needed', 'Incidental, so no action needed')}
        {decision('a-pe-is-a-pe-so-anticoagulate-now', 'A PE is a PE, so anticoagulate now')}
        {decision('wait-for-symptoms-before-deciding', 'Wait for symptoms before deciding')}
        {decision('leave-it-for-the-clinic-letter', 'Leave it for the clinic letter')}
      </div>
    </section>
  </>;
}
