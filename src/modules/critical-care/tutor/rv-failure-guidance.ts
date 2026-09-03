import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RvFailureProgress } from '../rv-failure';

export const RV_FAILURE_TUTOR_VERSION = '0.1.0';

export interface RvFailurePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is whichever one the learner reaches for first,
 * because this patient invites two opposite ones and punishes both. She is
 * grossly congested, which asks for a diuretic; she is hypotensive and
 * underperfused, which asks for fluid. Her central venous pressure is 18 and
 * her wedge is 10 — the congestion is all on the right, and the left ventricle
 * is small because the right one is not delivering.
 *
 * It is silent on the unassisted setting, silent once the trajectory is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function rvFailureInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: RvFailureProgress },
): RvFailurePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('rvf-recognition', true,
    'She is congested and underperfused at the same time. Both halves of that are the diagnosis.',
    'A fifty-two-year-old woman with pulmonary arterial hypertension, worsening oedema and abdominal distension after several days of poor intake and interrupted pulmonary-vascular therapy. Her MAP is 58, rate 116 in sinus, refill five seconds, extremities cool, mentation slowing, urine 12 mL/h, lactate up from 2.8 to 4.3. Her JVP is elevated and her lungs have no B-lines, and she is 91% on supplemental oxygen. Congestion without pulmonary oedema, in a patient who is not perfusing — that combination is right-sided, and the interrupted therapy is the part of the history most likely to explain why now. Activate pulmonary-hypertension, cardiac and shock help off that trajectory rather than off the pressure.');
  if (patient.phenotypeAtTick === null) return prompt('rvf-phenotype', true,
    'Look at the ventricle and the filling pressures together, and do not let one number decide.',
    'The echo reports a severely dilated right ventricle with reduced systolic function, systolic septal flattening, a small underfilled left ventricle, no effusion and no acute severe left-sided valve lesion. The panel reports a central venous pressure of 18, a wedge of 10 and a cardiac index of 1.8. Read the two filling pressures against each other: 18 on the right and 10 on the left is where the congestion is and where it is not, and the small left ventricle is small because the right one is not delivering to it, not because she is dry. The septal flattening is the same fact seen a second way — a right ventricle under enough pressure to intrude on the left. No single value there is a diagnostic or treatment cutoff, and the acute triggers stay open while you read it.');
  if (patient.supportAtTick === null) return prompt('rvf-support', true,
    'Both of the obvious moves are wrong here. Say what you are protecting instead.',
    'A congested patient invites a diuretic and a hypotensive one invites fluid, and this ventricle tolerates neither reflex: more volume distends a right ventricle that is already pushing the septum into the left one, and reflex decongestion in a patient whose output is 1.8 can take away the filling she is running on. Neither is forbidden as a matter of principle — what is excluded is doing either automatically. What gets recorded is a review, individualised and expert-selected: her preload, her systemic perfusion, her pulmonary afterload and her right-ventricular contractility, alongside the oxygenation, acid-base balance and rhythm that all raise pulmonary vascular resistance when they go wrong. No universal target is set, no dose is selected, and nothing is prescribed.');
  if (patient.triggersAtTick === null) return prompt('rvf-triggers', true,
    'Now why this happened now — and the specialist therapy nobody has restarted.',
    'Hypoxia, acidosis, infection, arrhythmia, ischaemia, acute pulmonary embolism, medication interruption and ventilatory load all stay under review, and the first two are worth holding onto because they are both consequences of her state and causes of it getting worse. The interrupted pulmonary-vascular therapy is the trigger this history hands you, and restarting it is a specialist decision rather than a resumption — these are drugs where stopping and starting has its own hazards, and this lesson selects none of them. Keeping both the precipitant work and the pulmonary-vascular pathway active is the step, and neither is closed by having explained the physiology.');
  return prompt('rvf-reassessment', true,
    'Read every axis, and do not let improvement stand in for resolution.',
    'The fixed response improves. Perfusion, congestion, rhythm, oxygenation, the right-ventricular pattern, the filling pressure, the output and the organ trajectory all get read together — a patient whose problem is a pressure-loaded ventricle can look better on one axis while another is quietly worse, which is precisely why the reassessment is plural. No universal endpoint is claimed and nothing here is resolved. Nothing in this lesson examines her, acquires or interprets monitoring, an ECG, a laboratory result, an echo, a catheter or an image, calculates, diagnoses, changes oxygen or ventilation, delivers fluid, diuresis or a drug, obtains access, doses, performs a procedure, provides mechanical support, determines disposition, or predicts outcome.');
}
