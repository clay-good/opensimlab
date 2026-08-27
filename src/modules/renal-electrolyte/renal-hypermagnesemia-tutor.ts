import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHypermagnesemiaSnapshot } from '@platform/kernel/protocol';
import { renalHypermagnesemiaDemonstrationStep } from './demo/renal-hypermagnesemia-demonstration';

export const RENAL_HYPERMAGNESEMIA_SOURCE_HREF = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6028801/';

/** Shares only public care and requested observations with the worked example. */
export function renalHypermagnesemiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalHypermagnesemia?: RenalHypermagnesemiaSnapshot;
}) {
  const patient = input.renalHypermagnesemia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const step = renalHypermagnesemiaDemonstrationStep(patient);
  if (level === 'coached' && (!step.action || step.action === 'handoff')) return null;
  return { id: `renal-hypermagnesemia-${step.id}`, suggestion: step.narration,
    because: 'Use the requested observations and bedside response. Authored checkpoints are teaching contrasts, not predicted physiology or required clinical waits.',
    sourceHref: RENAL_HYPERMAGNESEMIA_SOURCE_HREF };
}
