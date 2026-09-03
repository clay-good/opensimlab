import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { IntracranialHypertensionProgress } from '../intracranial-hypertension';

export const INTRACRANIAL_HYPERTENSION_TUTOR_VERSION = '0.1.0';

export interface IntracranialHypertensionPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is reaching for the osmotherapy. An ICP of 28 is
 * a number with a famous treatment attached, and the free interventions get
 * skipped past on the way to it — including a head turned 10° off neutral,
 * which is a partly obstructed jugular that no amount of hypertonic saline
 * fixes. The second reflex is treating the ICP alone, when the number that
 * matters to the brain is the perfusion pressure underneath it.
 *
 * It is silent on the unassisted setting, silent once the trajectory is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function intracranialHypertensionInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: IntracranialHypertensionProgress },
): IntracranialHypertensionPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('ich-recognize', true,
    'Read the pair, not the number, and get the people who do this.',
    'A thirty-four-year-old man, six hours from a severe blunt head injury and an evacuation, with a parenchymal monitor reading 28 for eight minutes on a consistent waveform. Twenty-eight is above the treatment threshold of 22, and the more useful number is underneath it: a MAP of 82 against that ICP leaves a cerebral perfusion pressure of 54, which is the figure the brain actually experiences. Sustained is doing work in that sentence — eight minutes of a consistent waveform is a pattern rather than a transient, and it is not a diagnosis or a prognosis either. Neurocritical care, neurosurgery, nursing, respiratory therapy and pharmacy are called now, because the next few steps are faster with them than without.');
  if (patient.contextAtTick === null) return prompt('ich-context', true,
    'Before you treat the number, ask whether something is causing it.',
    'The monitor first, because a wrong number is treated exactly as enthusiastically as a right one: the waveform is reported consistent. Then the patient — pupils unchanged from the post-operative examination, right 4 mm and sluggish, left 3 mm and reactive, so nothing new has happened neurologically that you know of. The imaging shows diffuse oedema with no reported new evacuable lesion. Then the drivers, which is where this becomes actionable: the head is elevated only 10° and the neck is rotated, there is intermittent dyssynchrony, temperature is 37.7, EtCO2 is 40, MAP 82, sodium 140, no seizure. Oxygenation, perfusion and bleeding are all unremarkable. None of that closes the question — monitor fidelity, examination and repeat imaging stay live — but two of those findings are things you can change without a drug.');
  if (patient.protectionAtTick === null) return prompt('ich-protect', true,
    'Do the free things first. A rotated neck is an obstructed jugular.',
    'Head neutral and elevation individualized, because venous outflow is mechanical and 10° with a turned neck is a partly obstructed drainage route that osmotherapy will not open. Then everything systemic that makes a brain worse: oxygenation, ventilation, perfusion, temperature, analgesia, sedation, ventilator synchrony, glucose, sodium, seizure surveillance. On the perfusion pressure, individualize inside 60 to 70 and do not force it above 70 — pushing pressure with vasopressors and fluid buys pulmonary and cardiac harm without buying brain. And prolonged prophylactic aggressive hyperventilation is not selected: dropping the carbon dioxide lowers the ICP by constricting the vessels that were delivering the blood, which is a way to make a good number out of a worse brain. Nothing here is positioned, delivered or dosed on this screen.');
  if (patient.rescueAtTick === null) return prompt('ich-rescue', true,
    'Now the osmotherapy — as an individualized intent, not a recipe.',
    'The guardrails are the step: agent suitability, sodium, chloride, osmolality, renal function, volume status, access, fluid balance, and a defined moment to look at the response. The cited guideline conditionally favours hypertonic sodium for initial ICP management after traumatic brain injury, and mannitol remains an effective alternative where sodium is unsuitable — so there is a lean, and it is not a rule, and his sodium of 140 and preserved urine output are inputs to that decision rather than a green light. No universal agent, formulation, concentration, dose or route is selected here, nothing is delivered, and no neurologic benefit is claimed by choosing.');
  return prompt('ich-reassess', true,
    'A better pressure in fifteen minutes is a start, not a result.',
    'The fixed response is ICP 19, MAP 84, so a perfusion pressure of 65 — inside the range, from both directions moving the right way — with heart rate 84, SpO2 97%, EtCO2 38, temperature 37.5, pupils unchanged and no new herniation sign. That is the immediate physiology answering, and it is worth having. It says nothing about whether the monitor is faithful, whether this control lasts, whether the pressure returns in an hour, what the examination or repeat imaging will show, whether a drain or an operation is coming, or how he recovers. Nothing here positions, measures, ventilates, doses, delivers, diagnoses, determines disposition, or predicts outcome.');
}
