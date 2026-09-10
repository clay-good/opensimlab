import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalProteinuriaRatioSnapshot } from '@platform/kernel/protocol';
import { renalProteinuriaRatioDemonstrationStep } from './demo/renal-proteinuria-ratio-demonstration';

export const RENAL_PROTEINURIA_SOURCE_HREF = 'https://doi.org/10.1053/j.ajkd.2018.04.023';

/** Shares only public care and requested observations with the worked example. */
export function renalProteinuriaRatioInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalProteinuriaRatio?: RenalProteinuriaRatioSnapshot;
}) {
  const patient = input.renalProteinuriaRatio;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const step = renalProteinuriaRatioDemonstrationStep(patient);
  if (level === 'coached' && (!step.action || step.action === 'handoff')) return null;
  return { id: `renal-proteinuria-${step.id}`, suggestion: step.narration,
    because: 'Use the requested observations and the sampling conditions each value was taken under. Authored checkpoints are teaching contrasts, not predicted physiology or required clinical waits.',
    sourceHref: RENAL_PROTEINURIA_SOURCE_HREF };
}
