import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHypernatremiaSnapshot } from '@platform/kernel/protocol';
import { renalHypernatremiaDemonstrationStep } from './demo/renal-hypernatremia-demonstration';

export const RENAL_HYPERNATREMIA_SOURCE_HREF = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10175862/';

/** Shares only public care and requested observations with the worked example. */
export function renalHypernatremiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalHypernatremia?: RenalHypernatremiaSnapshot;
}) {
  const patient = input.renalHypernatremia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const step = renalHypernatremiaDemonstrationStep(patient);
  if (level === 'coached' && (!step.action || step.action === 'handoff')) return null;
  return { id: `renal-hypernatremia-${step.id}`, suggestion: step.narration,
    because: 'Use the requested observations and bedside response. Authored checkpoints are teaching contrasts, not predicted physiology or required clinical waits.',
    sourceHref: RENAL_HYPERNATREMIA_SOURCE_HREF };
}
