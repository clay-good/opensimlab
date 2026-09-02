import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PostpartumPreeclampsiaProgress } from '../postpartum-severe-preeclampsia-warning-signs';

export const POSTPARTUM_PREECLAMPSIA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for an emergency that arrives after everyone has gone
 * home.
 *
 * She is six days past a term birth with no antepartum hypertension, which is
 * where a large share of severe postpartum hypertension and eclampsia actually
 * happens — after discharge, in someone nobody was watching for it. The error
 * this lesson refuses is waiting: for the urine protein, which is neither
 * required for the diagnosis nor able to settle it, or for the rest of the
 * laboratory to come back. Two correctly obtained severe-range readings fifteen
 * minutes apart are already the emergency, and the clock to treatment is sixty
 * minutes from the first of them. None of these prompts measures a pressure,
 * interviews or examines her, acquires or reads a laboratory value, or selects
 * an antihypertensive, magnesium, dose, route or target.
 */
export function postpartumPreeclampsiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly postpartumPreeclampsia?: PostpartumPreeclampsiaProgress;
}) {
  const patient = input.postpartumPreeclampsia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('preeclampsia-trajectory', true,
    'Start from what she has been telling you for four hours.',
    'Six days after a term birth, with no antepartum hypertension: a severe headache, flashing visual spots, and severe right upper-quadrant pain that the supplied history does not account for. Beside her own account sit two correctly obtained pressures of 178/114 and 174/112 fifteen minutes apart, platelets of 88, a creatinine that has risen from 0.7 to 1.2, and transaminases at more than twice the local upper limit. She is alert, conversant, and holding a six-day-old — none of which makes this less urgent.');
  if (patient.recognitionAtTick === null) return prompt('preeclampsia-recognition', true,
    'Call it an emergency on the two readings, and do not wait for the urine protein.',
    'Two properly obtained severe-range pressures fifteen minutes apart are the whole trigger, and the clock to treatment runs sixty minutes from the first of them. Proteinuria is not required to recognize preeclampsia with severe features and could not settle it either way — these symptoms and this organ evidence are already the severe features. Naming it closes nothing: hemorrhage, infection, a thrombotic microangiopathy, a vascular event and a medication effect all stay open behind the name.');
  if (patient.supportAtTick === null) return prompt('preeclampsia-support', true,
    'Start the protocol now, and let the cause work run beside it rather than before it.',
    'The severe-hypertension protocol, the qualified obstetric response and the seizure-prevention assessment begin now, while measurement quality, brain, vision, lung, platelet, liver, kidney, urine, medication and competing-cause evaluation continues in parallel. Nothing about the parallel work is allowed to move the treatment later. She is six days postpartum with her newborn and her chosen support person beside her, so the feeding, the support person and the trauma-informed care are part of the response rather than courtesies added to it.');
  if (patient.evidenceAtTick === null) return prompt('preeclampsia-evidence', true,
    'Read the organ evidence as severe features rather than as a pending workup.',
    'Platelets of 88, transaminases at twice the local ceiling, a creatinine that has nearly doubled, and a headache and visual symptoms that persist are four organs speaking at once. The urine ratio and the hemolysis evaluation are pending and stay pending; nothing here identifies which cause this is, excludes the alternatives, or establishes eligibility for anything.');
  if (patient.reassessmentAtTick === null) return prompt('preeclampsia-reassess', false,
    'Read the fixed later report as one reading rather than as control.',
    'The report is authored as 30 minutes after activation. It is a contrast rather than a required wait or a predicted response time, and nothing here says how fast any individual pressure comes down.');
  return prompt('preeclampsia-handoff', true,
    'Hand off a pressure that is no longer severe and a patient who is not safe.',
    '152/98 is out of the severe range and still hypertensive; it establishes no durable control, no target and no treatment effect, and her headache and visual spots are improved rather than gone. The recurrent pressure, the seizure and stroke risk, the pulmonary, hematologic, hepatic and renal risk, the repeat laboratories, the newborn and feeding, the trauma-informed support, the prompt follow-up that this diagnosis specifically requires, and her longer-term cardiovascular risk all travel with her.');
}
