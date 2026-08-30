import { Button } from '@platform/ui';
import { formatElapsed } from '@platform/clock/simulation-clock';
import type { PrognosisQuestionSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PrognosisQuestionAction } from './prognosis-question';
import { prognosisQuestionInlinePrompt } from './prognosis-question-tutor';

export function PrognosisQuestionTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  readonly assessment?: PrognosisQuestionSnapshot; readonly scenarioVersion: string;
  readonly onAction: (action: PrognosisQuestionAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const prompt = prognosisQuestionInlinePrompt(guidance, { scenarioVersion, prognosisQuestion: assessment });
  const observations = assessment.observationRecord; const said = assessment.conversationRecord;
  const observation = assessment.observation;
  const decision = (action: PrognosisQuestionAction, label: string, accepted = false) => {
    const unavailable = demonstrating || !!assessment.ended || accepted;
    return <Button aria-disabled={unavailable} onClick={unavailable ? undefined : () => onAction(action)}>{label}</Button>;
  };
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p><p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    {/* The question leads, because nothing else on this screen is about it. */}
    <p className="syringe__remaining" role="status">He has asked: “how long have I got?” Nothing on the monitor bears on it, and the observations {assessment.observationsAnswerTheQuestion ? 'answer it' : 'will not answer it however often they are taken'}.</p>
    <p className="syringe__remaining">Selected sources: a prospective cohort of doctors’ survival predictions, a study of what patients on incurable chemotherapy believe it will do, and a study of survival scenarios built from an oncologist’s estimate. Open the source view for exact wording and grades.</p>
    <section className="syringe prognosis-question__section" aria-labelledby="prognosis-question-intent-title">
      <div id="prognosis-question-intent-title" className="syringe__name">Find the question behind the question first.</div>
      <p className="syringe__remaining">Supplied starting observations were heart rate 82/min, blood pressure 124/72 mmHg, respiratory rate 16/min, oxygen saturation 97% in air, and temperature 36.7 C, and alert. These remain historical starting observations, and none of them is relevant.</p>
      <p className="syringe__remaining">He has said before that he does not want “all the details”. His daughter is in the room.</p>
      <p className="syringe__remaining">What he wants it for: {assessment.intentAskedAtTick === null ? 'not established' : `established at simulated ${formatElapsed(assessment.intentAskedAtTick)}`}. Question recorded: {assessment.questionRecordedAtTick === null ? 'not yet' : 'in his own words'}. What he believes the treatment is for: {assessment.beliefCheckedAtTick === null ? 'not checked' : 'checked'}.</p>
      <div className="crisis-drug__actions">
        {decision('ask-what-he-wants-to-know', 'Ask what he wants the number for', assessment.intentAskedAtTick !== null)}
        {decision('record-the-question-as-asked', 'Record the question in his own words', assessment.questionRecordedAtTick !== null)}
        {decision('check-what-he-believes-the-treatment-is-for', 'Check what he thinks the treatment is for', assessment.beliefCheckedAtTick !== null)}
      </div>
    </section>
    <section className="syringe prognosis-question__section" aria-labelledby="prognosis-question-answer-title">
      <div id="prognosis-question-answer-title" className="syringe__name">A number, or the shape of one.</div>
      <p className="syringe__remaining">{assessment.answeredAtTick === null
        ? 'A single figure will be heard as a date. Three scenarios give him something he can plan against.'
        : 'Given as a typical figure with a worse and a better case. In the study of that method, observed survival fell between half and double the estimate in 63 percent, at a quarter or less in 6 percent, and at three times or more in 14 percent.'}</p>
      <p className="syringe__remaining">{assessment.directionStatedAtTick === null
        ? 'An estimate without its direction of error is heard at whichever end he can bear.'
        : 'He has been told which way it is likely to be wrong: only 20 percent of such predictions were accurate to within a third, 63 percent were over-optimistic, and the doctors who knew their patients longest were the least accurate.'}</p>
      <p className="syringe__remaining">Answer: {assessment.answeredAtTick === null ? 'not given' : 'given as scenarios'}. Direction of the error: {assessment.directionStatedAtTick === null ? 'not stated' : 'stated'}. Boundaries: {assessment.boundariesReviewedAtTick === null ? 'not reviewed' : 'reviewed'}.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. Pause whenever you need time to think.'}</p>
      <div className="crisis-drug__actions">
        {decision('answer-with-scenarios-not-a-number', 'Answer with scenarios, not a number', assessment.answeredAtTick !== null)}
        {decision('state-the-direction-of-the-error', 'State which way the estimate is wrong', assessment.directionStatedAtTick !== null)}
        {decision('review-boundaries', 'Review the boundaries and their certainty', assessment.boundariesReviewedAtTick !== null)}
      </div>
    </section>
    <section className="syringe prognosis-question__section" aria-labelledby="prognosis-question-readback-title">
      <div id="prognosis-question-readback-title" className="syringe__name">What he repeats back is the only test.</div>
      <p className="syringe__remaining">{observations
        ? `Last requested observations at simulated ${formatElapsed(observations.atTick)}: heart rate ${observations.heartRateBpm}/min; blood pressure ${observations.systolicMmHg}/${observations.diastolicMmHg} mmHg; temperature ${observations.coreTemperatureC.toFixed(1)} C. Unremarkable, and not an answer to anything he asked.`
        : 'No new observation-only check has been requested.'}</p>
      <p className="syringe__remaining">{said
        ? `Last requested conversation record at simulated ${formatElapsed(said.atTick)}: question ${said.questionRecorded ? 'recorded' : 'not recorded'}; purpose ${said.purposeKnown ? 'established' : 'not established'}; belief ${said.beliefChecked ? 'checked' : 'not checked'}; answer ${said.answerGiven ? 'given' : 'not given'}; direction ${said.directionStated ? 'stated' : 'not stated'}.`
        : 'No new conversation-record check has been requested.'}</p>
      <p className="syringe__remaining">{observation
        ? `Last requested full assessment at simulated ${formatElapsed(observation.atTick)}: heart rate ${observation.heartRateBpm}/min; ${observation.alertness}; answer ${observation.answerGiven ? 'given' : 'not given'}; direction ${observation.directionStated ? 'stated' : 'not stated'}.`
        : 'No new full assessment has been requested.'}</p>
      {assessment.askedAgain && <p className="syringe__remaining">He has asked again, and said why: his daughter is getting married in four months and he has been asked whether to book anything. He is deciding whether to buy a suit.</p>}
      {assessment.readbackObserved && assessment.readback === 'best-case-only' && <p className="syringe__remaining">In the corridor he repeated it back to his daughter as the best case, on its own, as though it were the answer. Nothing was misheard.</p>}
      {assessment.readbackObserved && assessment.readback === 'all-three-scenarios' && <p className="syringe__remaining">In the corridor he repeated all three scenarios back to his daughter, and added, unprompted, that he was told doctors tend to guess long.</p>}
      {(assessment.singleNumberAttempted || assessment.nobodyKnowsAttempted || assessment.reassuranceAttempted || assessment.prematureAnswerAttempted) && <p className="syringe__remaining">Earlier refused choices stay in this run; they do not prevent a later appropriate handoff.</p>}
      {assessment.ended && <p className="syringe__remaining">{assessment.ended === 'handoff'
        ? 'Practice complete: the question in his own words, his belief about the treatment, the scenarios, the direction of the error, and what he actually repeated back all travel with him. No prognosis or outcome is certified.'
        : 'Instructor takeover ended this branch. Open the debrief, then try another response. The teaching stop predicts no patient outcome.'}</p>}
      <div className="crisis-drug__actions">
        {decision('check-observations', 'Check the observations only')}{decision('check-what-was-said', 'Check what has been said so far')}
        {decision('reassess', 'Reassess the patient and the conversation')}
        {decision('handoff', 'Hand off what he took from it')}
        {decision('give-a-single-number', 'Give him a single number')}
        {decision('say-nobody-can-know', 'Tell him nobody can know')}
        {decision('reassure-and-move-on', 'Reassure him and move on')}
        {decision('answer-before-asking-what-he-wants', 'Answer now, ask afterwards')}
      </div>
    </section>
  </>;
}
