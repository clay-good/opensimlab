import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ArdsLungProtectiveProgress } from '../ards-lung-protective';

export const ARDS_LUNG_PROTECTIVE_TUTOR_VERSION = '0.1.0';

export interface ArdsLungProtectivePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the weight on the chart. She is 92 kg, 500 mL
 * looks like a modest breath for her, and the lung being ventilated is the size
 * her height predicts — 61.5 kg — which makes that same breath 8.1 mL/kg. Fat
 * does not add alveoli. The second reflex arrives at the reassessment: the pH
 * falls to 7.29 and the carbon dioxide rises, and the instinct is to undo the
 * thing that caused it.
 *
 * It is silent on the unassisted setting, silent once the escalation is
 * recorded, and silent for any scenario version it was not written against.
 */
export function ardsLungProtectiveInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: ArdsLungProtectiveProgress },
): ArdsLungProtectivePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.escalationAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.baselineAtTick === null) return prompt('ards-baseline', true,
    'Read the whole setup before you change any part of it.',
    '500 mL at 24, PEEP 8, FiO2 0.70, saturation 90%, PaO2 64, pH 7.36, PaCO2 42, plateau 32, passive synchrony, MAP 72. Two numbers there are already saying something. A PaO2 of 64 on 0.70 is a badly injured lung — the oxygen is going in and not arriving. And the plateau of 32 is the one to sit with: plateau is the pressure the alveoli actually see at the end of a breath, and 32 is above where lung protection lives, so this ventilator is currently stretching her every twenty-five seconds. Nothing is sampled, verified or measured on this screen, and no ARDS diagnosis is made here.');
  if (patient.pbwAtTick === null) return prompt('ards-pbw', true,
    'Before you touch the tidal volume, work out whose lung you are ventilating.',
    'She weighs 92 kg and she is 170 cm, and the number that matters is the second one: predicted body weight is 61.5 kg. Lung size tracks height, not adiposity — fat does not add alveoli — so 500 mL is not the modest breath it looks like against 92 kg. It is 8.1 mL/kg of the lung she actually has. This step is separate from the next one because the ordering is the mistake: set a volume first and the basis becomes a justification, establish the basis first and the volume follows from it. It is a fixed teaching calculation, not a bedside calculator.');
  if (patient.protectionAtTick === null) return prompt('ards-protect', true,
    'Now the settings — a volume from the basis, and a ceiling on the pressure.',
    'About 6 mL/kg predicted body weight, so a 370 mL intent, with a plateau limit below 30. Both halves are needed: a small volume in a stiff enough lung can still generate a high plateau, so volume alone is not protection. And the respiratory rate is handed to the local protocol and the pH response rather than fixed here, because dropping the volume by a quarter has to go somewhere and the rate is where the compensation happens. No ventilator is programmed, no hold performed, and auto-PEEP, dead space and the delivered mechanics are not simulated.');
  if (patient.reassessmentAtTick === null) return prompt('ards-reassess', true,
    'The pH fell. That is the cost, and it was the right trade.',
    'Thirty minutes on: delivered 370 mL, plateau down from 32 to 27, saturation 91%, PaO2 66, pH 7.29, PaCO2 up from 42 to 52, synchrony passive, MAP 70. Read the plateau first — 32 to 27 is the injury you removed, and it is why the volume came down. The acidaemia is the price of ventilating a smaller breath, and permissive hypercapnia is the name for accepting it deliberately rather than discovering it. The instinct here is to put the volume back to fix the pH, which trades a number you can see for lung injury you cannot. It is bounded rather than unlimited: the pH, the mechanics, the synchrony and the circulation stay under review, and no individualized target is claimed.');
  return prompt('ards-escalate', true,
    'She is still hypoxaemic on a protective setting. That is the next problem.',
    'Persistent moderate-severe hypoxaemia after the ventilation is already protective, so the escalation is about oxygenation rather than about undoing the protection. Local protocolized PEEP and FiO2 adjustment, with surveillance for pressure, oxygen toxicity, barotrauma and haemodynamics, because more PEEP is not free — it can raise the plateau and drop the venous return in a woman whose MAP is 70. Then the prone-positioning intent, and the duration is the part that matters: prolonged, more than twelve hours a day, by a team who does it. Recruitment manoeuvres, sedation, paralysis, the physical turn, the complications, ECMO, the later course and the outcome are all outside this lesson.');
}
