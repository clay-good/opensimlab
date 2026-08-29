import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { RareEarlyMyocarditisSnapshot } from '@platform/kernel/protocol';
import type { RareEarlyMyocarditisAction } from './rare-early-myocarditis';

export function RareEarlyMyocarditisTray({ assessment, onAction, demonstrating = false }: {
  readonly assessment?: RareEarlyMyocarditisSnapshot;
  readonly onAction: (action: RareEarlyMyocarditisAction) => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const observations = assessment.observationRecord; const results = assessment.resultRecord;
  const observation = assessment.observation;
  const decision = (action: RareEarlyMyocarditisAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {/* The interval leads. It is the finding a learner is most likely to file as background. */}
    <p className="syringe__remaining" role="status">{assessment.weeksSinceStart} weeks and {assessment.cyclesGiven} cycles into combination checkpoint therapy. Supplied troponin markedly raised; supplied electrocardiogram shows new first-degree block. He is {assessment.monitored ? 'on a monitor' : 'not on a monitor'}.</p>
    <p className="syringe__remaining">Selected sources: a 161-patient multicentre series of checkpoint-inhibitor myocarditis, and a pharmacovigilance meta-analysis of fatal checkpoint-inhibitor toxicity. Open the source view for exact wording and grades.</p>
    <section className="syringe rare-early-myocarditis__section" aria-labelledby="rare-early-myocarditis-finding-title">
      <div id="rare-early-myocarditis-finding-title" className="syringe__name">He is inside the described window.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 72/min, blood pressure 118/70 mmHg, respiratory rate 18/min, oxygen saturation 96% in air, and temperature 36.6 C. These remain historical starting observations.</p>
      <p className="syringe__remaining">Five days of fatigue, breathlessness on exertion only, aching and weak shoulders. No chest pain. He is apologising for wasting anybody’s time.</p>
      <p className="syringe__remaining">Interval: {assessment.intervalRecordedAtTick === null ? 'not yet recorded' : `recorded at simulated ${formatElapsed(assessment.intervalRecordedAtTick)}`}. What does not sound cardiac: {assessment.nonCardiacRecordedAtTick === null ? 'not recorded' : 'recorded, shoulders included'}. Monitoring: {assessment.monitoringAtTick === null ? 'not arranged' : 'arranged, with its reason'}.</p>
      <div className="crisis-drug__actions">
        {decision('record-the-exposure-interval', 'Record the exposure interval', assessment.intervalRecordedAtTick !== null)}
        {decision('record-what-is-present-that-is-not-cardiac', 'Record what does not sound cardiac', assessment.nonCardiacRecordedAtTick !== null)}
        {decision('arrange-continuous-rhythm-monitoring', 'Arrange continuous rhythm monitoring', assessment.monitoringAtTick !== null)}
      </div>
    </section>
    <section className="syringe rare-early-myocarditis__section" aria-labelledby="rare-early-myocarditis-threshold-title">
      <div id="rare-early-myocarditis-threshold-title" className="syringe__name">Two numbers, answering two different questions.</div>
      <p className="syringe__remaining">{assessment.intervalRecordedAtTick === null
        ? 'The interval is part of the finding, not background to it. Record where he sits in the described window.'
        : 'In a 161-patient series, onset came a median of 4 weeks after starting, at a median of the second cycle, with deaths occurring mainly within 60 days.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what the rarity licenses.'
        : 'Supplied boundaries: reported trial incidence roughly 0.1 to 1 percent and higher with combination regimens; historical mortality quoted at 30 to 50 percent, and myocarditis had the highest fatality of any checkpoint-inhibitor toxicity at 52 of 131 reported cases. The series is retrospective and drawn from centres that see these patients, so it describes people already diagnosed rather than everyone at risk.'}</p>
      <p className="syringe__remaining">Both teams: {assessment.escalationAtTick === null ? 'not yet contacted' : `contacted at simulated ${formatElapsed(assessment.escalationAtTick)}`}. Bounded intent: {assessment.treatmentIntentAtTick === null ? 'not recorded' : 'recorded as the qualified teams’ decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('escalate-to-both-teams', 'Contact cardiology and oncology together', assessment.escalationAtTick !== null)}
        {decision('record-bounded-treatment-intent', 'Record bounded qualified-team intent', assessment.treatmentIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe rare-early-myocarditis__section" aria-labelledby="rare-early-myocarditis-observation-title">
      <div id="rare-early-myocarditis-observation-title" className="syringe__name">Reassess. Only the conduction moves.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; oxygen saturation ${observations.spo2Percent}% on air; rhythm ${observations.rhythm}. ${observations.monitored ? 'He is on a monitor.' : 'He is not on a monitor, so the rhythm is whatever the last strip showed.'}`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{results
        ? `Last requested supplied results at simulated ${formatElapsed(results.atTick)}: ${results.weeksSinceStart} weeks and ${results.cyclesGiven} cycles in; electrocardiogram ${results.conduction}; troponin ${results.troponinMarkedlyRaised ? 'markedly raised' : 'not raised'}. Supplied, not acquired.`
        : 'No new results check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; rhythm ${observation.rhythm}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.conductionProgressed && <p className="syringe__remaining">The monitor has recorded a change: the first-degree block is now intermittent Mobitz type I, with no symptoms accompanying it. He is still sitting up talking.</p>}
      {!assessment.monitored && <p className="syringe__remaining">Nothing is watching his conduction. Whatever it is doing, it is not being recorded.</p>}
      {assessment.teamsObserved && <p className="syringe__remaining">Both teams have answered together. They hold imaging, further testing, immunosuppressive treatment, rhythm management and any restart jointly, and have recorded that neither owns this alone.</p>}
      {(assessment.rarityDismissalAttempted || assessment.troponinDismissalAttempted || assessment.deferralAttempted || assessment.coronaryOnlyAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the interval, the troponin with the conduction and the shoulders together, the monitoring and its reason, and the bounded intent all travel with him. No diagnosis or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-the-supplied-results', 'Check the supplied results only')}
        {decision('reassess', 'Reassess the patient and the results')}
        {decision('handoff', 'Hand off the window and what it rests on')}
        {decision('it-is-too-rare-to-be-that', 'It is far too rare to be that')}
        {decision('the-troponin-is-raised-in-lots-of-things', 'Troponin is raised in lots of things')}
        {decision('repeat-the-troponin-in-a-week', 'Repeat the troponin in a week')}
        {decision('treat-it-as-a-coronary-syndrome-and-stop-there', 'Run the coronary pathway and stop there')}
      </div>
    </section>
  </>;
}
