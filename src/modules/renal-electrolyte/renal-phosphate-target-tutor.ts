import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalPhosphateTargetSnapshot } from '@platform/kernel/protocol';
import { renalPhosphateTargetDemonstrationStep } from './demo/renal-phosphate-target-demonstration';

export const RENAL_PHOSPHATE_SOURCE_HREF = 'https://doi.org/10.1681/ASN.2012030223';

/** Shares only public care and requested observations with the worked example. */
export function renalPhosphateTargetInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalPhosphateTarget?: RenalPhosphateTargetSnapshot;
}) {
  const patient = input.renalPhosphateTarget;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const step = renalPhosphateTargetDemonstrationStep(patient);
  if (level === 'coached' && (!step.action || step.action === 'handoff')) return null;
  return { id: `renal-phosphate-${step.id}`, suggestion: step.narration,
    because: 'Use the requested observations and the retrieved record. Authored checkpoints are teaching contrasts, not predicted physiology or required clinical waits.',
    sourceHref: RENAL_PHOSPHATE_SOURCE_HREF };
}
