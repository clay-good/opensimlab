import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HemorrhagicShockProgress } from '../hemorrhagic-shock';

export const HEMORRHAGIC_SHOCK_TUTOR_VERSION = '0.1.0';

export interface HemorrhagicShockPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is that resuscitation buys time. It does not buy
 * time; it buys distance, and only towards a control that somebody else has to
 * perform. Blood replaces what has been lost and cannot touch the reason it is
 * being lost, so the control lane and the blood lane run alongside each other
 * from the moment of recognition rather than one after the other.
 *
 * It is silent on the unassisted setting, silent once the reassessment is
 * recorded, and silent for any scenario version it was not written against.
 */
export function hemorrhagicShockInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: HemorrhagicShockProgress },
): HemorrhagicShockPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.mechanismAndPerfusionReviewedAtTick === null) return prompt('hs-recognize', true,
    'Read the pattern, and note that nothing here is bleeding where you can see it.',
    'High-energy blunt mechanism, an unstable pelvis, heart rate 132, a narrow pulse pressure at 55 mmHg mean, cool mottled skin, inattention, lactate 5.8 mmol/L and a core temperature of 35.3°C. There is no external blood, which is exactly the trap: the pelvis is a container large enough to hide a fatal volume, and waiting to see red is waiting for a sign this injury does not produce. Recognition opens two lanes that run alongside each other from here — control and resuscitation — and the order in which you start them matters far less than the fact that neither waits for the other. This screen performs no examination and measures nothing; the findings are authored.');
  if (patient.pelvicStabilizationAtTick === null) return prompt('hs-stabilize', true,
    'Close the container before you argue about the fluid.',
    'A purpose-made pelvic binder at the greater trochanters is the cheapest thing in this room and the only one that acts on the volume of the space the blood is going into. It is an intent recorded here, not a device placed: fit, position, pressure injury, fracture pattern and any physical control of the bleeding are outside this vignette. It comes before escalation for a practical reason rather than a doctrinal one — the escalation is a phone call to people who will take minutes to arrive, and the binder is a thing your hands can do in the meantime.');
  if (patient.definitiveControlEscalatedAtTick === null) return prompt('hs-escalate', true,
    'Make the call now, while she is still on the resuscitation you have not started.',
    'Immediate escalation for definitive pelvic bleeding control — trauma, surgery, and interventional capability — is a step people take late because it feels like something you do once you have stabilized the patient. That is the wrong way round. There is no stabilization to be had while the bleeding continues, and every minute of resuscitation you deliver first is a minute the people who can actually stop it have not been asked to come. Imaging, packing, embolization, operation, transport and outcome are not simulated; the recorded step is the asking.');
  if (patient.majorHemorrhageActivatedAtTick === null) return prompt('hs-activate', true,
    'Activate the major-hemorrhage response, and say what it is for.',
    'Activation releases blood products immediately rather than one negotiated unit at a time, and it is a separate recorded step from giving anything because it is the step that makes the next one possible at speed. Crystalloid is what fills the gap when nothing better has been ordered, and it dilutes the clotting factors and the oxygen-carrying capacity of someone who is short of both. Local activation, specimens, compatibility, inventory, plasma, platelets, fibrinogen, calcium, tranexamic acid, warming and team workflow are not simulated.');
  if (patient.redCellsAtTick === null) return prompt('hs-red-cells', true,
    'Two units, and be clear with yourself about what they are.',
    'A fixed bridge of two adult packed-red-cell units — 300 mL and 60 g of haemoglobin each as a teaching product — replaces some of what has been lost while the control you have already asked for is arranged. It is a bridge and not a treatment: it carries oxygen across an interval, and it has no effect whatsoever on the vessel that is emptying. No universal trauma ratio is claimed here and no individual response is produced; a run that transfuses and stops has moved the number on the monitor and nothing else.');
  if (patient.coagulationAndTemperatureAtTick === null) return prompt('hs-monitor', true,
    'Look at the two things bleeding does to the patient rather than the two it does to the numbers.',
    'Core temperature and the coagulation panel, because a cold patient does not clot and a diluted one has less to clot with, and each transfused unit and each minute exposed makes both slightly worse. This is the review that stops the resuscitation being a volume exercise. Active warming, repeated goal-directed coagulation management and the systems that deliver them are not simulated here — what is recorded is that the panel was read.');
  return prompt('hs-reassess', true,
    'Reassess, and read the result for what it is rather than what you want it to be.',
    'Serial perfusion evidence after a bounded bridge, with concealed bleeding still running. A better number here means the replacement is keeping up for the moment, and it means nothing at all about the source; the only thing that ends this is the control you escalated to. Repeat lactate and any outcome are outside this short vignette, so what travels with her is the set of times — recognition, stabilization, escalation, activation, the bridge, the panel — and the fact that the bleeding was never stopped in this room.');
}
