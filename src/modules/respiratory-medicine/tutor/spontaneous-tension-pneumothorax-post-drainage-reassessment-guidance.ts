import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PostTensionPneumothoraxProgress } from '../spontaneous-tension-pneumothorax-post-drainage-reassessment';

export const POST_TENSION_PNEUMOTHORAX_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a man who is well because of a tube.
 *
 * Six hours ago he was at 76/44 and 82% with a silent right chest; now he is
 * alert, talking in full sentences, and 93% on room air. Everything good about
 * that is being produced by a drain, and the thing this lesson is about is
 * that a drain is a piece of equipment which can stop working while the
 * patient still looks fine — for a while. So the system gets read before the
 * long-term planning: the bottle below the insertion site, the intact
 * connection, the swing, and the intermittent bubbling at six hours that says
 * the leak has not sealed. None of these prompts examines him, touches the
 * drain, selects suction or a clamp, delivers oxygen or a drug, or predicts a
 * recurrence.
 */
export function postTensionPneumothoraxInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly postTensionPneumothorax?: PostTensionPneumothoraxProgress;
}) {
  const patient = input.postTensionPneumothorax;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('ptx-trajectory', true,
    'Start from how close this was six hours ago.',
    'Abrupt right-sided pain and severe dyspnea in a man with emphysema, then 132, 76/44, 82%, confused and cold, with markedly reduced right chest movement and air entry. No trauma, no positive-pressure ventilation, no preceding procedure — a spontaneous tension pattern, treated immediately by the experienced team with a right pleural drain. That was the correct order: they treated the pattern rather than waiting to confirm it, and that decision is why there is a patient to reassess.');
  if (patient.drainageResponseAtTick === null) return prompt('ptx-drainage-response', true,
    'Credit the response without upgrading it into a resolution.',
    'Less pain, less work of breathing, alert and speaking full sentences, 96 and 108/64, 93% on room air, warm and refilling in two seconds, and right air entry reduced but better. The radiograph shows partial re-expansion with the drain in the pleural space and no contralateral pneumothorax or large collection. Partial is the word that matters: this establishes neither durable drain function nor complete re-expansion, and both of those are things that are true at a point in time rather than settled.');
  if (patient.systemAtTick === null) return prompt('ptx-system', true,
    'Read the drain as a system before you plan anything long-term.',
    'An upright bottle below the insertion site, an intact visible connection, respiratory swing, and intermittent bubbling at six hours. The swing says the drain is communicating with the pleural space; the bubbling says the air leak has not sealed. Every one of those observations is a thing that can stop being true — a bottle lifted above the patient, a connection pulled, swing lost because the tube blocked or kinked — and a drain that has quietly stopped working looks like a patient who is fine right up until he is not. The site is intact, without enlarging subcutaneous emphysema or bleeding.');
  if (patient.etiologyAtTick === null) return prompt('ptx-etiology', true,
    'Now the longer questions, and none of them are yours to settle.',
    'He has emphysema, so this is a secondary spontaneous pneumothorax rather than a primary one, which changes both the recurrence risk and the threshold for a definitive pleural procedure. Recurrence prevention, surgical fitness in a man with his lung disease, what he himself wants, and the definitive pleural strategy all need named pleural and thoracic ownership — and the persistent leak is what makes that conversation urgent rather than elective.');
  return prompt('ptx-handoff', true,
    'Hand off a drain that is working now.',
    'Nothing here establishes durable drain function, complete re-expansion, a sealed leak, a definitive plan, a disposition or a recurrence risk. What travels is how he presented and what was done, the partial response, every observation in the drain system and what each would look like if it failed, the deterioration triggers, and the pleural and thoracic ownership for the decisions nobody has made yet.');
}
