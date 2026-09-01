import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { TensionPneumothoraxProgress } from '../neonatal-tension-pneumothorax';

export const TENSION_PNEUMOTHORAX_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a suspicion that cannot wait for its confirmation.
 *
 * The whole difficulty here is that the thing which would confirm the diagnosis
 * takes longer than the diagnosis allows. So the prompts hold two statements
 * together that sound contradictory and are not: decompression should not wait
 * for radiography, and this is still a suspicion with airway obstruction,
 * equipment failure, atelectasis and other causes open. Neither is softened to
 * make the other easier. None of them selects a device, a size, a site, or an
 * analgesic, because those are local-protocol and qualified-team work, and none
 * reads the partial two-minute response as a resolved air leak.
 */
export function tensionPneumothoraxInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly tensionPneumothorax?: TensionPneumothoraxProgress;
}) {
  const patient = input.tensionPneumothorax;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('tension-pneumothorax-support', true,
    'Confirm a team that can decompress, not only one that can ventilate.',
    'Airway, ventilation, decompression, drain, monitoring, analgesia, imaging and the parents all need an owner. The decompression-capable part is the one that is easy to assume and expensive to discover missing.');
  if (patient.contextAtTick === null) return prompt('tension-pneumothorax-context', true,
    'Connect the support already running to the moment it stopped working.',
    'Gestation, the respiratory disease, the device and circuit report, and the clocked deterioration belong in one sentence. A sudden change during positive-pressure support is a different finding from a gradual one.');
  if (patient.recognitionAtTick === null) return prompt('tension-pneumothorax-recognize', true,
    'Record this as a suspected pattern, and act on it as one.',
    'Rapid deterioration on positive pressure with asymmetric movement and air entry, plus circulatory compromise, supports urgent suspected tension pneumothorax. Airway obstruction or displacement, equipment failure, atelectasis, hemorrhage and infection all stay open — and none of that is a reason to wait for a film.');
  if (patient.readinessAtTick === null) return prompt('tension-pneumothorax-readiness', true,
    'Review what the qualified team decides, and what the guidance already settles.',
    'For an unstable newborn with this pattern, emergency decompression should not wait for radiography. The device, size, site, analgesia, ventilation changes, drain and imaging are local-protocol work; this lesson chooses none of them.');
  if (patient.reassessmentAtTick === null) return prompt('tension-pneumothorax-observe', false,
    'Let the authored interval pass, then read the qualified team’s report.',
    'Two minutes is a contrast rather than a required wait or a predicted response time. Nothing here says how quickly a real chest answers.');
  return prompt('tension-pneumothorax-handoff', true,
    'Hand off a partial response, and say which part is partial.',
    'A heart rate of 138 with 91% on 60% oxygen and still-asymmetric chest movement is improvement without resolution. The air leak is not proven resolved, the diagnosis is not confirmed, the alternatives are not excluded, and the next team needs all four of those stated.');
}
