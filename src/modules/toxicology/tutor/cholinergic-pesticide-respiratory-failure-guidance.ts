import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CholinergicProgress } from '../cholinergic-pesticide-respiratory-failure';

export const CHOLINERGIC_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for the one lesson here where the patient is not the
 * first thing to protect.
 *
 * He is hypoxic, drowning in secretions and tiring, and he is also still wearing
 * the concentrate, in a room where nobody is yet in protective equipment. Every
 * instinct says go to him; the prompts say protect the room first, and say why
 * rather than asserting it. They also refuse the two shortcuts this poisoning
 * invites: the mnemonic, which names the muscarinic half and hides the
 * nicotinic and central halves that actually kill, and the cholinesterase
 * report, which marks exposure rather than grading him. The thing being watched
 * throughout is the breathing — bronchorrhea, bronchospasm, a weak cough and
 * weak neck flexion are one problem — and drying secretions is never allowed to
 * stand in for strength. None of them selects a glove, a washing method, a
 * drug, a dose, an airway, a ventilator setting, or a neuromuscular blocker.
 */
export function cholinergicInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly cholinergic?: CholinergicProgress;
}) {
  const patient = input.cholinergic;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('cholinergic-trajectory', true,
    'Say that he is still wearing it, in the same breath as the saturation.',
    'Forty-five minutes after an organophosphate concentrate splashed across his clothing in an enclosed space, he is here in wet work clothes before any decontamination, at 86% with copious secretions, fasciculations and weak neck flexion. The clothing is a finding about this room, not a detail of his history.');
  if (patient.recognitionAtTick === null) return prompt('cholinergic-recognize', true,
    'Name all three halves of the pattern, and refuse the two shortcuts.',
    'The muscarinic signs are the ones the mnemonic gives you, and they are not what kills him. The nicotinic weakness and the central depression are: fasciculations with weak neck flexion, a weak cough, and a pH of 7.27 with a PCO2 of 52 in someone breathing 30 times a minute. A markedly low plasma cholinesterase marks the exposure rather than grading him, and no single pupil, pulse or secretion closes this.');
  if (patient.safetyAtTick === null) return prompt('cholinergic-safety', true,
    'Protect the room before you treat the man in it.',
    'He is covered in concentrate and the people about to work on him are not yet protected. Appropriate PPE, contamination control, qualified clothing removal and dermal decontamination come first — not because he can wait, but because a second and third patient would make him wait far longer. Occupational safety and the co-workers still at the greenhouse need an owner too, alongside emergency, critical care, airway, respiratory, pharmacy and the poison center.');
  if (patient.evidenceAtTick === null) return prompt('cholinergic-evidence', true,
    'Read the secretions, the bronchospasm and the weakness as one respiratory problem.',
    'Bronchorrhea, wheeze, a weak cough and shallow tiring ventilation are not four findings competing for attention — they are the reason this poisoning kills, and the airway question is early rather than eventual. Coformulants, additional routes, the product label and red-cell acetylcholinesterase all stay qualified-team work, and this lesson selects no drug, dose, airway technique, ventilation setting, or neuromuscular blocker.');
  if (patient.reassessmentAtTick === null) return prompt('cholinergic-observe', false,
    'Record the intents as intents, let the interval pass, and read the 30-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how any individual exposure answers.');
  return prompt('cholinergic-handoff', true,
    'Hand off a chest that sounds better and a man who is still weak.',
    'Decontamination is done, the secretions and wheeze are markedly reduced, saturation is 96% on assisted ventilation, mentation is clearer — and the fasciculations and proximal weakness have not moved. Drying secretions is not neuromuscular recovery, and none of this proves the treatment did it, that decontamination is complete, or that his co-workers are safe. Recurrence, delayed intermediate syndrome, seizure risk, the exposure investigation and his ventilation all travel with him.');
}
