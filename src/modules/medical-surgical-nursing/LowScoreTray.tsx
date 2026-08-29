import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { LowScoreSnapshot } from '@platform/kernel/protocol';
import type { LowScoreAction } from './low-score';

export function LowScoreTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: LowScoreSnapshot;
  readonly onAction: (action: LowScoreAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const observations = assessment.observationRecord; const context = assessment.contextRecord;
  const observation = assessment.observation;
  const decision = (action: LowScoreAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {/* The score is stated plainly and immediately, because the lesson is not that it is wrong. */}
    <p className="syringe__remaining" role="status">Aggregate early-warning score: {assessment.aggregateScore}. That is below the local escalation threshold, and it is calculated correctly.</p>
    <p className="syringe__remaining">Selected sources: a cohort study of early-warning-score accuracy in bacteraemia, the 2021 international sepsis guidelines, and a systematic review of rapid-response afferent-limb failure. Open the source view for exact wording and grades.</p>
    <section className="syringe low-score__section" aria-labelledby="low-score-observations-title">
      <div id="low-score-observations-title" className="syringe__name">Nothing here was done incorrectly.</div>
      <p className="syringe__remaining">Supplied starting observations were respiratory rate 18 counted for a full minute, oxygen saturation 96% in air with no supplemental oxygen, blood pressure 118/68 mmHg, heart rate 88/min, temperature 36.9 C, and alert. These remain historical starting observations.</p>
      <p className="syringe__remaining">Her daughter says she is not herself, and cannot say more than that. There is no field for it on the chart.</p>
      <p className="syringe__remaining">Observations: {assessment.observationsRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.observationsRecordedAtTick)}`}. What the score excludes: {assessment.exclusionsRecordedAtTick === null ? 'not yet recorded' : 'recorded'}. Family report: {assessment.familyReportRecordedAtTick === null ? 'not yet recorded' : 'recorded in the words it was given'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-observations-and-score', 'Record the observations and the score', assessment.observationsRecordedAtTick !== null)}
        {decision('record-what-the-score-excludes', 'Record what the score does not exclude', assessment.exclusionsRecordedAtTick !== null)}
        {decision('record-the-family-report', 'Record the family report as given', assessment.familyReportRecordedAtTick !== null)}
      </div>
    </section>
    <section className="syringe low-score__section" aria-labelledby="low-score-escalation-title">
      <div id="low-score-escalation-title" className="syringe__name">A screen is not a rule-out test.</div>
      <p className="syringe__remaining">{assessment.exclusionsRecordedAtTick === null
        ? 'A score below the threshold is not the same as a patient who has been cleared. Record what it does and does not support.'
        : 'In a cohort of patients with bacteraemia, a score at the escalation threshold had a sensitivity for sepsis of about 87 percent, so roughly one in eight patients with sepsis and a positive blood culture scored below it. The study authors state that a score below the threshold cannot definitively rule out sepsis.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what this number licenses.'
        : 'Supplied boundaries: the score is a screening instrument rather than a diagnostic test. Roughly a third of older adults with serious infection are not febrile. A rate-controlling medication blunts the tachycardia the score partly depends on. Current international sepsis guidance carries a strong recommendation, on moderate-quality evidence, against using one particular tool as a single screening instrument. None of this makes the score useless; it makes it a screen.'}</p>
      <p className="syringe__remaining">Escalation: {assessment.escalationAtTick === null ? 'not yet requested' : `requested at simulated ${formatElapsed(assessment.escalationAtTick)} on recorded concern`}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}. Increased observation: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-on-concern', 'Request review on recorded concern', assessment.escalationAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
        {decision('monitor', 'Arrange increased observation', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe low-score__section" aria-labelledby="low-score-observation-title">
      <div id="low-score-observation-title" className="syringe__name">Reassess. The number will not move.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: respiratory rate ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}% on air; systolic ${observations.systolicMmHg} mmHg; heart rate ${observations.heartRateBpm}/min; temperature ${observations.coreTemperatureC.toFixed(1)} C. Aggregate score ${observations.aggregateScore}. This partial check supplies no context about baseline or medication.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{context
        ? `Last requested context at simulated ${formatElapsed(context.atTick)}: ${context.rateControlMedication ? 'a rate-controlling medication is charted' : 'no rate-controlling medication is charted'}; ${context.afebrileOlderAdult ? 'an older adult, in whom fever is frequently absent in serious infection' : 'fever would be expected'}; baseline ${context.baselineDescription}. This partial check supplies no new observations.`
        : 'No new context check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: respiratory rate ${observation.respiratoryRateBpm}/min; heart rate ${observation.heartRateBpm}/min; temperature ${observation.coreTemperatureC.toFixed(1)} C; aggregate score ${observation.aggregateScore}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.familyConcernRaised && <p className="syringe__remaining">The daughter has said it again, more plainly. The observations and the score have not moved.</p>}
      {assessment.reviewObserved && <p className="syringe__remaining">The review has happened. Cultures were taken and later grew an organism, and the qualified team recorded that treatment was warranted at the time of the call. The score at that moment was still {assessment.aggregateScore}.</p>}
      {(assessment.recheckAttempted || assessment.feverExclusionAttempted || assessment.qsofaAttempted || assessment.documentationOnlyAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the observations with the score as calculated, what the score does not exclude, the family report, and the reason review was requested all travel with the patient. No diagnosis or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-context', 'Check baseline and medication only')}
        {decision('reassess', 'Reassess observations and context')}
        {decision('handoff', 'Hand off the concern and what it rests on')}
        {decision('score-is-low-so-recheck-later', 'Score is low, recheck in four hours')}
        {decision('no-fever-so-not-infection', 'No fever, so not infection')}
        {decision('use-qsofa-instead', 'Use a more specific score instead')}
        {decision('document-and-move-on', 'Document the concern and move on')}
      </div>
    </section>
  </>;
}
