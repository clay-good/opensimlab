import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalContrastAttributionSnapshot } from '@platform/kernel/protocol';
import { renalContrastAttributionDemonstrationStep } from './demo/renal-contrast-attribution-demonstration';

export const RENAL_CONTRAST_SOURCE_HREF = 'https://doi.org/10.1148/radiol.2019192094';

/** Shares only public care and requested observations with the worked example. */
export function renalContrastAttributionInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalContrastAttribution?: RenalContrastAttributionSnapshot;
}) {
  const patient = input.renalContrastAttribution;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const step = renalContrastAttributionDemonstrationStep(patient);
  if (level === 'coached' && (!step.action || step.action === 'handoff')) return null;
  return { id: `renal-contrast-${step.id}`, suggestion: step.narration,
    because: 'Use the requested observations and the recorded chart. Authored checkpoints are teaching contrasts, not predicted physiology or required clinical waits.',
    sourceHref: RENAL_CONTRAST_SOURCE_HREF };
}
