import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { TraumaPrimarySurveyProgress } from '../trauma-primary-survey';

export const TRAUMA_PRIMARY_SURVEY_TUTOR_VERSION = '0.1.0';

export interface TraumaPrimarySurveyPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the alphabet. Everyone starts at A, and this
 * patient has a leg that has not stopped bleeding after direct pressure — which
 * is why the sequence is <C>ABCDE and why the engine will not let the airway
 * review happen first.
 *
 * It is silent on the unassisted setting, silent once the repeat survey is
 * recorded, and silent for any scenario version it was not written against.
 */
export function traumaPrimarySurveyInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: TraumaPrimarySurveyProgress },
): TraumaPrimarySurveyPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.repeatedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.activatedAtTick === null) return prompt('trauma-activation', true,
    'Take the handoff without interrupting it, then say out loud what order you are working in.',
    'Thirty-five minutes from a high-energy mechanism, suspected injuries, the vital signs, the fact that direct pressure has already failed, what has been done so far, and what is needed on arrival. A handoff interrupted is a handoff repeated, and the detail people talk over is usually the one that changes the order of the next five minutes — here it is the words "failed direct pressure". Activate the trauma and major-haemorrhage responses, and declare the sequence explicitly as <C>ABCDE with a repeat survey planned, because a team that has heard the order out loud does not have to guess who is doing what. Team activation, leadership, communication and handoff performance are not simulated.');

  if (patient.catastrophicHemorrhageAtTick === null) return prompt('trauma-hemorrhage', true,
    'Stop the bleeding first. That is what the C in front of the alphabet is for.',
    'A local-protocol tourniquet proximal to the life-threatening left lower-leg haemorrhage, with the application time written down and the distal limb handed over explicitly. The engine will refuse the airway review until this is recorded, and that refusal is the lesson: exsanguination from a limb can empty a circulation faster than an obstructed airway empties it of oxygen, and the airway of a patient who has bled out is not a problem anyone gets to solve. Direct pressure has already failed here, which is the whole indication — a tourniquet after failed pressure is not an escalation of aggression, it is the next step. The application time matters because the clock on a tourniquet starts the moment it is tight, and the person who removes it needs to know when that was. Pressure, placement, tightening, device selection, limb assessment, pain and tissue outcome are not simulated.');

  if (patient.airwayBreathingAtTick === null) return prompt('trauma-airway', true,
    'Now A and B — and notice that he is telling you the answer to A himself.',
    'He speaks coherently, which is the fastest airway assessment there is: a patient making clear sentences has a patent airway and adequate ventilation to drive it, at least for now. In-line spinal-motion precautions throughout, respiratory rate 26, SpO₂ 96% on oxygen, breath sounds and chest movement present on both sides, and no authored tension pattern. The reason bilateral findings get stated rather than assumed is that a tension pneumothorax in a hypotensive trauma patient is the one thing here that would make the circulation problem unfixable by circulation measures. Examination, spinal protection, oxygen delivery, and any airway or chest procedure are not simulated.');

  if (patient.circulationAtTick === null) return prompt('trauma-circulation', true,
    'He is still shocked with the external bleeding controlled. That means it is inside.',
    'Heart rate 124 and blood pressure 88/56 after the tourniquet, with an authored unstable pelvis. That combination is the argument for everything recorded here at once: a purpose-made pelvic binder, warmed blood components through a major-haemorrhage pathway, early tranexamic acid by local protocol, calcium and coagulation surveillance, and immediate definitive-control intent. Warmed and blood rather than clear fluid, because crystalloid in this patient dilutes what little clotting capacity is left and cools him further, and he is already at 35.6 degrees. The eFAST showing free fluid in the right upper quadrant directs the surgeon rather than delaying him, and a negative one would not have excluded anything — it is a pointer, not a clearance. Access, product or dose selection, delivery, binder placement, imaging, procedures and response are not simulated.');

  if (patient.disabilityExposureAtTick === null) return prompt('trauma-exposure', true,
    'D and E, and the part of E people do badly: the back, and then the blanket.',
    'Confused but following commands, pupils equal, glucose 118, no lateralising deficit — and the glucose is on that list because hypoglycaemia is a treatable cause of confusion that a head injury will happily be blamed for. Then full exposure with a coordinated posterior-surface review, which is where a second catastrophic bleed hides: you cannot find a wound in the back of a patient nobody has turned over. And the moment it is done, cover him again. He is 35.6 degrees, and hypothermia in a bleeding trauma patient is not a comfort issue — cold blood does not clot, so every minute uncovered undoes some of what the blood components are trying to do. Examination, log-roll, spinal protection, warming and occult-injury exclusion are not simulated.');

  return prompt('trauma-repeat', true,
    'Do the whole thing again. A primary survey done once is a photograph.',
    'Repeat <C>ABCDE: no visible limb rebleeding, airway still patent with coherent speech, breathing still bilateral at 97%, heart rate 112 and blood pressure 100/62 after the bounded response, still following commands, 35.8 degrees after the heat-loss measures. Every one of those is a comparison rather than a value, and the repeat exists because the injuries you cannot see are the ones that declare themselves by changing something you already measured. Note what has not resolved: the abdominal and pelvic concern with a positive eFAST is unchanged and goes directly to the definitive-control team, with times, trends, interventions and the uncertainties named rather than smoothed over. No procedure, transport, later deterioration, disposition or outcome is simulated here.');
}
