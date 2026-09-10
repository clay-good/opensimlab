import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UnspokenDoubtSnapshot } from '@platform/kernel/protocol';
import type { UnspokenDoubtAction } from './unspoken-doubt';
import { unspokenDoubtInlinePrompt } from './unspoken-doubt-tutor';

export function UnspokenDoubtTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: UnspokenDoubtSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: UnspokenDoubtAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = unspokenDoubtInlinePrompt(guidance, { scenarioVersion, unspokenDoubt: assessment });
  const observations = assessment.observationRecord; const checklist = assessment.checklistRecord;
  const observation = assessment.observation;
  const decision = (action: UnspokenDoubtAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining" role="status">Anaesthetised, draped, team brief completed. Consent form: {assessment.consentSide}. Skin marking: {assessment.markedSide}. Label on the displayed image: {assessment.imageLabelSide}. Raised by anybody else: {assessment.raisedByAnyoneElse ? 'yes' : 'nobody'}. {assessment.incisionMade ? 'Incision made.' : 'No incision made.'}</p>
    <p className="syringe__remaining">Selected sources: a narrative synthesis of challenging authority in the operating room, a scale study of the intrapersonal factors behind speaking up, and a systematic review of interventions meant to improve it that found mixed results. Open the source view for exact wording and rates.</p>
    <section className="syringe unspoken-doubt__section" aria-labelledby="unspoken-doubt-record-title">
      <div id="unspoken-doubt-record-title" className="syringe__name">Nobody has done anything wrong. You are the only one who has looked.</div>
      <p className="syringe__remaining">Everybody in this room is competent and paying attention to their own part of it. The consultant is scrubbed{assessment.knifeRequested ? ' and has asked for the knife' : ' and has not asked for anything yet'}.</p>
      <p className="syringe__remaining">Authored observations are heart rate 78/min, blood pressure 110/64 mmHg, ventilated at a set rate of 12/min, oxygen saturation 99%, and temperature 36.4 C. They will not change, and no number here was ever going to catch a label.</p>
      <p className="syringe__remaining">What you noticed: {assessment.noticedStatedAtTick === null ? 'not yet stated' : `stated at simulated ${formatElapsed(assessment.noticedStatedAtTick)}`}. Ways you might be wrong: {assessment.fallibilityStatedAtTick === null ? 'not yet stated' : 'stated first'}. Cost of each mistake: {assessment.asymmetryStatedAtTick === null ? 'not yet stated' : 'stated'}.</p>
      <div className="crisis-drug__actions">
        {decision('state-what-you-have-noticed', 'State what you have noticed', assessment.noticedStatedAtTick !== null)}
        {decision('state-what-would-make-you-wrong', 'State what would make you wrong', assessment.fallibilityStatedAtTick !== null)}
        {decision('state-the-cost-of-each-mistake', 'State the cost of each mistake', assessment.asymmetryStatedAtTick !== null)}
      </div>
    </section>
    <section className="syringe unspoken-doubt__section" aria-labelledby="unspoken-doubt-escalation-title">
      <div id="unspoken-doubt-escalation-title" className="syringe__name">Say it in the room, before anything is cut.</div>
      <p className="syringe__remaining">{assessment.asymmetryStatedAtTick === null
        ? 'Being wrong out loud costs about ninety seconds and some embarrassment. Being right and silent costs the other side of a person. State that comparison before deciding how confident you need to be.'
        : 'You are very likely wrong, and that is a reason to check rather than a reason to be quiet. Say the observation, the ways you might be wrong, and the request — to everybody.'}</p>
      <p className="syringe__remaining">{assessment.boundariesReviewedAtTick === null
        ? 'Review the boundaries and the certainty behind them before deciding what any of this licenses.'
        : 'Supplied boundaries: a narrative synthesis screening 4,822 publications and including 31 studies found hierarchy, culture and education the most tested themes; a scale study found self-efficacy, social outcome expectations and assertive attitude accounting for 73 percent of the variance, with training level significantly associated with two of them; and a systematic review of fourteen interventions found mixed results, no consistent improvement, and specific doubt that education alone changes deeply rooted speaking-up behaviour. This rehearsal is one of those interventions.'}</p>
      <p className="syringe__remaining">Said in the room: {assessment.spokenAtTick === null ? 'not yet' : `at simulated ${formatElapsed(assessment.spokenAtTick)}`}. Bounded intent: {assessment.teamIntentAtTick === null ? 'not recorded' : 'recorded as the team’s decision'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('say-it-before-the-incision', 'Say it before the incision', assessment.spokenAtTick !== null)}
        {decision('record-bounded-team-intent', 'Record bounded team intent', assessment.teamIntentAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe unspoken-doubt__section" aria-labelledby="unspoken-doubt-observation-title">
      <div id="unspoken-doubt-observation-title" className="syringe__name">Reassess. Only one clock is running, and it is yours.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; ventilated at a set rate of ${observations.respiratoryRateBpm}/min; oxygen saturation ${observations.spo2Percent}%; temperature ${observations.coreTemperatureC.toFixed(1)} C. This partial check supplies no checklist record.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{checklist
        ? `Last requested checklist record at simulated ${formatElapsed(checklist.atTick)}: consent ${checklist.consentSide}; marking ${checklist.markedSide}; label on the displayed image ${checklist.imageLabelSide}; team brief ${checklist.briefCompleted ? 'completed' : 'not completed'}; raised by anybody else ${checklist.raisedByAnyoneElse ? 'yes' : 'nobody'}; ${checklist.incisionMade ? 'incision made' : 'no incision made'}. This partial check supplies no new observations.`
        : 'No new checklist-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; consent ${observation.consentSide}; marking ${observation.markedSide}; image labelled ${observation.imageLabelSide}; ${observation.incisionMade ? 'incision made' : 'no incision made'}; ${observation.alertness}. These are historical observations, not live measurements.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.knifeRequested && <p className="syringe__remaining">The consultant has asked for the knife. Nothing about the patient has changed, nobody has done anything wrong, and the room is one step further along than it was.</p>}
      {assessment.teamObserved && <p className="syringe__remaining">The consultant stopped, put the hand down and said thank you. Nobody was annoyed. The team is re-checking the side against the consent, the mark and the imaging before anything else happens.</p>}
      {(assessment.waitForSeniorAttempted || assessment.selfDoubtAttempted || assessment.afterwardsAttempted || assessment.quietAskAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: what you noticed, the ways you might be wrong stated first, the asymmetry between the two mistakes, that it was said aloud before anything was cut, and the bounded intent all travel. Nothing here settles whether you were right, and no error or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-checklist-record', 'Check the checklist record only')}
        {decision('reassess', 'Reassess observations and checklist record')}
        {decision('handoff', 'Hand off what was said')}
        {decision('wait-until-someone-more-senior-notices', 'Wait until someone more senior notices')}
        {decision('you-are-probably-misreading-it', 'You are probably misreading it')}
        {decision('mention-it-afterwards', 'Mention it afterwards')}
        {decision('ask-a-colleague-quietly-first', 'Ask a colleague quietly first')}
      </div>
    </section>
  </>;
}
