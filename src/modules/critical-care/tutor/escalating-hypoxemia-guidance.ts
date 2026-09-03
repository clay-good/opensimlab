import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EscalatingHypoxemiaProgress } from '../escalating-hypoxemia';

export const ESCALATING_HYPOXEMIA_TUTOR_VERSION = '0.1.0';

export interface EscalatingHypoxemiaPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the diagnosis a sick lung invites. A man with
 * bilateral opacities who desaturates after a turn will be assumed to have
 * worsened, and everything from a disconnected limb to a tube that has slid
 * into a bronchus produces the same number on the same screen — several of them
 * fixable in seconds. The lesson traces the oxygen path from the wall inwards
 * before it looks at the parenchyma, because a team that starts at the lungs
 * rarely goes back to check the circuit.
 *
 * It is silent on the unassisted setting, silent once the escalation is
 * recorded, and silent for any scenario version it was not written against.
 */
export function escalatingHypoxemiaInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: EscalatingHypoxemiaProgress },
): EscalatingHypoxemiaPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.escalationAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.signalAtTick === null) return prompt('ehx-signal', true,
    'Believe the drop and check the signal anyway. Both, in that order.',
    'A sixty-three-year-old intubated man with bilateral inflammatory opacities, deteriorating after a routine turn: on unchanged support of 430 mL at 22, PEEP 10, oxygen at 0.50, his saturation has fallen from 94% to 84% over six minutes. Two things corroborate it. The pleth is strong and regular, which is what separates a real decline from a cold finger or a moved probe. And the fixed arterial panel reports a PaO2 of 51 with a pH of 7.33 and a carbon dioxide of 47 — an independent measurement agreeing with the monitor. Urgency and verification are not in tension here: you act on the number and you also make sure it is a number, because a monitor-only diagnosis is how a team ends up treating a probe.');
  if (patient.supportAtTick === null) return prompt('ehx-support', true,
    'Oxygen and help now, while the troubleshooting runs. Not after it.',
    'He has a PaO2 of 51 and nobody knows why yet, and those two facts do not compete — support and escalation start before a cause is assumed, because the cause takes minutes to find and he does not have a reserve to spend on them. A senior and respiratory therapy get called now rather than when you have something to tell them, and the useful thing to say is what you have: a verified decline in a patient whose support has not changed. The troubleshooting continues while they come.');
  if (patient.deliveryPathAtTick === null) return prompt('ehx-path', true,
    'Follow the oxygen from the wall to the alveolus, in that direction, before you look at the lungs.',
    'The oxygen source, the circuit, the capnography, the tracheal-tube depth and the suction path — outside-in, in order, because the causes nearest the wall are the ones fixed in seconds and the ones a sick-lung story makes invisible. A disconnected or misconnected limb, an oxygen supply that is not delivering, a tube that has migrated into a bronchus during the turn he just had, an obstruction in the path: every one of them gives you 84% in a patient with bilateral opacities, and every one is missed by a team that has already decided his lungs are worse. Capnography is the fastest of these to read and the most informative about the tube. This is a review; you manipulate no equipment, pass nothing, and exchange nothing.');
  if (patient.bedsidePatternAtTick === null) return prompt('ehx-pattern', true,
    'Now the patient. Read the chest, the pressures, the capnogram and the circulation together.',
    'Bilateral air entry, what has and has not happened to the pressures, the capnogram shape and the circulation, taken as one pattern rather than four observations — asymmetry with a pressure change means something very different from symmetry without one. What the fixed panel supports is unresolved parenchymal hypoxemia, and that phrase is doing careful work: it is what remains after the delivery path was traced and found intact, rather than what was assumed at the start. It also does not exclude anything. A pneumothorax that has not declared itself yet, a collapse, an effusion and a pulmonary embolism all remain possible, which is why the next step is a request rather than a conclusion.');
  return prompt('ehx-escalate', true,
    'Ask for the gas and the image, keep the support protocolized, and read the whole patient again.',
    'Urgent repeat gas and imaging are recorded as intent, because the bedside pattern has taken this as far as the bedside can go. The support stays protocolized and lung-protective rather than improvised — a hypoxaemic patient invites somebody to reach for a setting, and the guardrails matter most in exactly that moment. The fixed response then gets reviewed across the whole patient, and it implies no universal setting and no outcome. Nothing in this lesson examines him, acquires a signal, manipulates equipment, passes a catheter, samples blood, images, diagnoses, programs a ventilator, rescues an airway, recruits, performs bronchoscopy, decompresses, exchanges a tube, prones, cannulates for ECMO, determines disposition, or predicts outcome.');
}
