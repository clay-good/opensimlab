import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { TubeMigrationProgress } from '../tube-migration';

export const TUBE_MIGRATION_TUTOR_VERSION = '0.1.0';

export interface TubeMigrationPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is diagnosing before supporting. The picture is
 * so recognisable — turn the patient, lose the left side, mark goes from 22 to
 * 25 — that the temptation is to fix it immediately, and this chain puts help
 * and oxygen first because a saturation of 89% does not wait for a name. The
 * second reflex is the certainty itself: the timing and the depth make
 * mainstem migration the obvious answer, and obvious answers are where plugs
 * and pneumothoraces get missed.
 *
 * It is silent on the unassisted setting, silent once the response is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function tubeMigrationInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: TubeMigrationProgress },
): TubeMigrationPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognizedAtTick === null) return prompt('etm-recognize', true,
    'Something changed the moment she was turned. Name the change, not the cause.',
    'The ventilator is still asking for 420 mL at 18 on 0.50 and she is returning 310. Peak pressure went from 26 to 36 while plateau sits at 22 — that gap is the useful part, because a rising peak with a near-normal plateau is a resistance problem rather than a stiff lung. Left ventilation is markedly reduced, right ventilation persists, capnography is still there with an EtCO2 of 45, and the saturation has fallen from 97% to 89%. The capnogram matters enormously: it says the tube is still in an airway, which takes oesophageal placement off the table immediately. What you have is a change with a timestamp, and that is worth recording before it becomes a diagnosis.');
  if (patient.supportedAtTick === null) return prompt('etm-support', true,
    'Get help and oxygen now. She is at 89% and the answer can wait ninety seconds.',
    'This step comes before the position panel on purpose, and it is the discipline the lesson is built around: the picture is so recognisable that the reflex is to reach for the tube, and a patient desaturating on a ventilator needs support and more hands before she needs a name. Respiratory therapy, senior ICU and experienced airway help, and the intent to support oxygenation and ventilation. Whatever this turns out to be — a migrated tube, a plug, a pneumothorax from the turn — the first minute of it looks the same and is treated the same. No care is delivered here; the intent is what gets recorded.');
  if (patient.positionReviewedAtTick === null) return prompt('etm-position', true,
    'Now the panel — and keep the alternatives open while you read it.',
    '22 cm before the turn, 25 cm now, securement intact, cuff unchanged. Left ventilation markedly reduced with the right preserved and capnography continuous. Exhaled volume 310, peak 36, gas exchange worsening. That combination supports right-mainstem migration, and it is worth saying why the depth change is persuasive rather than decisive: securement being intact means the tube moved relative to a carina that also moved, since flexing the neck advances the tip, and a mark is a proxy for a position rather than the position. So mucus plugging, pneumothorax, atelectasis, consolidation, and circuit or ventilator problems all stay open. Nothing is examined or inspected on this screen.');
  if (patient.correctionAtTick === null) return prompt('etm-correct', true,
    'Correction by someone who does airways — and 22 is her number, not a rule.',
    'The intent recorded here is withdrawal and resecurement by experienced airway hands, for this authored migrated tube. The 22 cm is a case fact: it is where this woman\'s tube was documented before the turn, on her anatomy, and it is not a depth to carry to the next patient. Tube depth is individual, and "pull back to 22" as a habit is how a tube ends up above the cords in someone taller or shorter. Nothing is touched or moved here, and the correction is an intent rather than an action.');
  return prompt('etm-reassess', true,
    'Read the proof, and notice which parts of it are actually proof.',
    'Three minutes later: mark back at 22, typed tracheal position, bilateral ventilation, exhaled volume 410 against a commanded 420, peak 27 with plateau 21 and PEEP 8, continuous EtCO2 39, saturation 96% on an unchanged 0.50, heart rate 94, MAP 77. The strongest evidence in that list is the pair — the peak pressure falling back toward the plateau, and the exhaled volume returning to what was asked for. Those two say the resistance that appeared at the turn has gone. The unchanged FiO2 matters too: the oxygenation improved without anyone buying it. What is not here is a physical correction, an image, durability, a diagnosis, or an outcome, and none of that is in the model.');
}
