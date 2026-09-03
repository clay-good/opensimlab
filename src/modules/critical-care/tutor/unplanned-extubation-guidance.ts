import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UnplannedExtubationProgress } from '../unplanned-extubation';

export const UNPLANNED_EXTUBATION_TUTOR_VERSION = '0.1.0';

export interface UnplannedExtubationPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is not the wrong answer — it is arriving at the
 * right one without looking. Most unplanned extubations do not need the tube
 * back, this one does, and a learner who reintubates on the word "extubation"
 * rather than on the panel has learned nothing transferable. The second reflex
 * is the opposite mistake and the more dangerous one: reaching for noninvasive
 * support, which in a failing airway buys comfort for everyone except the
 * patient.
 *
 * It is silent on the unassisted setting, silent once the response is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function unplannedExtubationInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: UnplannedExtubationProgress },
): UnplannedExtubationPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('uex-support', true,
    'Say it out loud, get oxygen on, and call the airway people. All three now.',
    'The disconnect alarm has sounded and the tube is visibly outside the mouth after repositioning. Announcing the event is a step rather than a courtesy — an unplanned extubation is a room-wide problem and the people who need to know cannot infer it from an alarm. Oxygen goes on and respiratory therapy, senior ICU and airway help are called before anybody has decided what happens next, because the one thing you know already is that he has no airway and the help takes time to arrive. Note what you have lost along with the tube: there is no continuous exhaled carbon dioxide without one, so the signal you would most want for the next few minutes is gone.');
  if (patient.assessmentAtTick === null) return prompt('uex-assess', true,
    'Now read the patient, because not every unplanned extubation needs the tube back.',
    'This is the step worth defending. A large share of unplanned extubations never need reintubation, and a team that reintubates on the phrase rather than on the patient will also reintubate the ones who would have been fine. So: patency, work of breathing, oxygenation, ventilation, mental status, secretions, circulation. He is at 36 a minute with accessory-muscle use, a hoarse weak voice and a weak cough with pooled secretions, 86% despite face-mask oxygen, pH 7.27 with a carbon dioxide of 58, newly drowsy, 116, MAP 78. Read all of it before you conclude anything — the answer here happens to be the obvious one, and it should still be an answer rather than an assumption.');
  if (patient.failureAtTick === null) return prompt('uex-classify', true,
    'Name it as failure, and notice how many independent things are saying so.',
    'Four separate axes converge. The work: 36 a minute using accessory muscles. The gas exchange: 86% on a mask with a pH of 7.27 and a carbon dioxide of 58, which is failure of oxygenation and ventilation together. Airway protection: a weak cough, pooled secretions and a hoarse weak voice in a patient who is newly drowsy. And the trajectory, which is the one that decides it — none of this is improving. Any one of those alone might be watched; all four together, in a patient who is becoming less awake, is post-extubation respiratory failure, and the classification is what makes the next step a decision rather than a panic.');
  if (patient.airwayPlanAtTick === null) return prompt('uex-plan', true,
    'Prompt reintubation by the experienced team — and do not rent time from noninvasive support.',
    'What gets recorded is preoxygenation and reintubation intent for the people you called in the first step. The specific thing this lesson refuses is using noninvasive support to delay a failing airway: it makes the numbers look better for a while in a patient who cannot protect his airway and is getting drowsier, and the time it buys is taken from the intubation that is going to happen anyway, under worse conditions and with a fuller stomach. That is different from noninvasive support having no place — it has a real one, in the patients this panel does not describe. You select no drug, touch no equipment, and intubate nobody.');
  return prompt('uex-reassess', true,
    'Prove the tube is where you think it is, read the patient again, then talk about why he got extubated.',
    'Placement evidence comes first and it is reported rather than assumed — this is the patient who has just demonstrated what happens when everyone believes an airway is secure. Then the whole-patient response, because a correctly placed tube in a patient who is not improving is still a problem. And then the part that is easy to skip once the emergency is over: this was an unplanned extubation after repositioning, which is a securement, sedation, mobility, staffing and communication question, and the handoff records that review as intent. Nothing here examines him, acquires monitoring, delivers oxygen, ventilates by mask, gives a drug, handles airway equipment, intubates, images, diagnoses, determines disposition, or predicts outcome.');
}
