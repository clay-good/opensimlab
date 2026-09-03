import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { IntracranialHemorrhageProgress } from '../intracranial-hemorrhage-deterioration';

export const INTRACRANIAL_HEMORRHAGE_TUTOR_VERSION = '0.1.0';

export interface IntracranialHemorrhagePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the visible number. A systolic of 202 is on
 * the monitor, it has a target, and titrating it feels like treatment — while
 * the thing actually enlarging the haematoma is an INR of 3.2 that nobody can
 * see. The engine gates the pressure strategy behind the reversal intent for
 * exactly that reason.
 *
 * It is silent on the unassisted setting, silent once the escalation is
 * recorded, and silent for any scenario version it was not written against.
 */
export function intracranialHemorrhageInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: IntracranialHemorrhageProgress },
): IntracranialHemorrhagePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.escalatedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.deteriorationReviewedAtTick === null) return prompt('ich-deterioration', true,
    'The finding is not the deficit. The finding is that it is changing.',
    'Sudden headache, vomiting, dysarthria and left-sided weakness — and then eye opening and coherent speech both decreasing over fifteen minutes. A single snapshot of consciousness tells you very little; two snapshots fifteen minutes apart tell you almost everything, and this pair says the intracranial volume is still growing. Blood pressure 202/112, glucose 126, SpO₂ 96% on room air, breathing spontaneous, secretions handled for now. Read "for now" as the whole airway assessment: at this rate of change the airway is a trajectory rather than a status, and the moment to have the equipment ready is before the reassessment that finds he cannot manage. This screen performs no examination and scores no level of consciousness.');

  if (patient.pathwayActivatedAtTick === null) return prompt('ich-pathway', true,
    'Activate the pathway and do the free things while the imaging is still loading.',
    'Haemorrhage activation, head of the bed up, nothing by mouth, monitoring, access, the laboratory workflow, and airway equipment brought to the room. None of these waits on a diagnosis and none of them costs anything to be wrong about. Head elevation is the one people skip because it seems trivial: it improves venous drainage and costs nothing, which is a rare combination in this disease. The laboratory workflow is here rather than later because the number that decides the next ten minutes is a coagulation result. Physical care, equipment use, access, specimens and team performance are not simulated.');

  if (patient.findingsReviewedAtTick === null) return prompt('ich-findings', true,
    'Read the scan and the drug chart as one document.',
    'Twenty-eight millilitres of right thalamic haemorrhage with intraventricular extension and early hydrocephalus, and no authored herniation. Then the other half: warfarin taken yesterday evening, INR 3.2. Those two facts together are what makes this different from the same bleed in someone not anticoagulated — the haematoma is not a finished event, and the drug is the reason it keeps going. Intraventricular extension with early hydrocephalus is also the detail that decides who he needs: this is a neurosurgical problem as well as a neurocritical one, because a ventricle that is filling can be drained. This fixed screen does not interpret imaging, estimate expansion, or adjudicate a real reversal plan.');

  if (patient.reversalAtTick === null) return prompt('ich-reversal', true,
    'Reverse now, and give both agents. This is the step the engine will not let you skip.',
    'Stop the warfarin and record urgent four-factor prothrombin complex concentrate with intravenous vitamin K, without waiting for another coagulation result — the INR you have is enough, and the repeat will arrive after the window it was meant to inform. The reason both agents rather than one is worth holding onto: PCC replaces the missing factors within minutes and then wears off as those factors are consumed, while vitamin K takes hours to restore the liver\'s own production. Give PCC alone and the INR climbs back up in a patient whose brain is still bleeding. They are a pair because they cover different halves of the same clock. Product selection, patient-specific dosing, preparation, delivery, the INR response, thrombosis and haematoma response are not simulated.');

  if (patient.pressureControlAtTick === null) return prompt('ich-pressure', true,
    'Now the pressure — and smooth matters more than the number you land on.',
    'Sustained control toward a systolic of 140, maintained between 130 and 150, and deliberately not below 130. Two things are being said there. Lowering pressure reduces the chance of further expansion, which is why the target is not just "treat the hypertension". And the manner of the lowering is itself the treatment: large swings and repeated overshoot are associated with worse outcomes than a slightly higher steady pressure, so an agent you can hold still beats a bolus that wins the number and loses it again. The floor at 130 is there because this brain is under pressure and its perfusion depends on the systemic pressure you are lowering. Agent selection, titration, measurement technique, variability, cerebral perfusion and individual response are not simulated.');

  return prompt('ich-escalation', true,
    'Escalate to people who can operate, and hand over the times.',
    'Immediate transfer to neurocritical and neurosurgical capability, for three specific reasons rather than a general sense of severity: the alertness is worsening, there is intraventricular extension, and there is early hydrocephalus. The last two are things a surgeon can act on. What travels with him is the onset, the fifteen-minute deterioration, the airway surveillance that has not stopped, the CT, the warfarin timing, the INR, the reversal intent and the pressure plan — because the receiving team\'s first question is how fast this is moving, and only a set of times answers it. Airway intervention, ventricular drainage, surgery, expansion, complications, disposition and outcome remain outside this lesson.');
}
