import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalRhabdomyolysisSnapshot } from '@platform/kernel/protocol';
import { renalRhabdomyolysisDemonstrationStep } from './demo/renal-rhabdomyolysis-demonstration';

export const RENAL_RHABDOMYOLYSIS_SOURCE_HREF = 'https://doi.org/10.1001/jamainternmed.2013.9774';

/** Shares only public care and requested observations with the worked example. */
export function renalRhabdomyolysisInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalRhabdomyolysis?: RenalRhabdomyolysisSnapshot;
}) {
  const patient = input.renalRhabdomyolysis;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const step = renalRhabdomyolysisDemonstrationStep(patient);
  if (level === 'coached' && (!step.action || step.action === 'handoff')) return null;
  return { id: `renal-rhabdomyolysis-${step.id}`, suggestion: step.narration,
    because: 'Use the requested observations and the bedside examination. Authored checkpoints are teaching contrasts, not predicted physiology or required clinical waits.',
    sourceHref: RENAL_RHABDOMYOLYSIS_SOURCE_HREF };
}
