import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MsccProgress } from '../metastatic-spinal-cord-compression';

export const MSCC_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a window measured in how far he can walk.
 *
 * The pain is three weeks old and the emergency is forty-eight hours old:
 * independent walking became two-person support, both legs weakened, and voiding
 * became difficult. What he can do when treatment starts is the thing most
 * strongly tied to what he will be able to do afterwards, and he has not walked
 * since the assessment — so the recognition happens before any image confirms
 * it. This is also a long referral chain rather than a single decision, and the
 * scan has to be the whole spine rather than the level that hurts. None of
 * these prompts moves him, orders or interprets imaging, or selects a drug,
 * dose, or procedure.
 */
export function msccInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly mscc?: MsccProgress;
}) {
  const patient = input.mscc;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('mscc-trajectory', true,
    'Separate the three weeks of pain from the forty-eight hours of function.',
    'The mid-thoracic pain has been building for three weeks and now wakes him and worsens with coughing — that is the warning. The emergency is what happened in the last two days: independent walking became two-person support, both legs weakened, and voiding became difficult. And the examination localizes it — hip flexion 3/5 with increased tone, brisk reflexes, bilateral extensor plantars and reduced pin sensation below about T8 is a cord level, not a root.');
  if (patient.recognitionAtTick === null) return prompt('mscc-recognition', true,
    'Call it an oncologic emergency now, before any scan confirms it.',
    'Known metastatic cancer, movement-sensitive back pain, bilateral upper-motor-neuron leg weakness, a thoracic sensory level, lost gait and urinary difficulty is the constellation — and no single one of those is sufficient on its own, which is why it is the pattern being named rather than any one finding. He has not walked since this assessment, and how much he can do when treatment starts is the thing most closely tied to how much he will do afterwards. That is why this cannot wait for imaging.');
  if (patient.ownershipAtTick === null) return prompt('mscc-ownership', true,
    'Start the referral chain, because it is longer here than almost anywhere.',
    'Spinal surgery and radiotherapy both have to look at this before anyone knows which one it is, and oncology, radiology, nursing, pharmacy, rehabilitation, pain, bladder, skin and thrombosis prevention all have work that starts today rather than later. Deciding what should happen is not the same as arranging for it to happen, and in this illness the arranging is the slow part.');
  if (patient.boundaryAtTick === null) return prompt('mscc-boundary', true,
    'Image the whole spine, and keep the precautions individualized.',
    'Whole-spine MRI is the standard here because disease at other levels changes what the definitive plan has to cover, and imaging only the level that hurts is how a second lesion gets missed. Stability and movement precautions, early guideline-directed corticosteroid care, and the choice between surgery and radiotherapy are all individualized decisions belonging to the teams now involved — you are not selecting a drug, a dose, or an operation, and you are not moving him.');
  if (patient.laterAtTick === null) return prompt('mscc-later', false,
    'Record the boundaries, let the interval pass, and read the 4-hour report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual patient recovers.');
  return prompt('mscc-handoff', true,
    'Hand off a confirmed level, an unchanged examination, and a bladder nobody had asked about.',
    'The whole-spine MRI describes a metastatic T6 lesion with epidural extension and severe cord compression with focal signal change, plus separate lumbar metastases that are not compressing anything — which is exactly why the whole spine was imaged. Hip flexion is still 3/5, the T8 level persists, and the bladder scan found 780 mL before the team drained it. The surgery-or-radiotherapy decision, the stability, the function, the bladder, the skin and the rehabilitation all travel with him, and nothing here is recovery.');
}
