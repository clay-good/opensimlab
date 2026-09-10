import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHypomagnesemiaSnapshot } from '@platform/kernel/protocol';
import { renalHypomagnesemiaDemonstrationStep } from './demo/renal-hypomagnesemia-demonstration';

export const RENAL_HYPOMAGNESEMIA_SOURCE_HREF = 'https://doi.org/10.1681/ASN.2007070792';

/** Shares only public care and requested observations with the worked example. */
export function renalHypomagnesemiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalHypomagnesemia?: RenalHypomagnesemiaSnapshot;
}) {
  const patient = input.renalHypomagnesemia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const step = renalHypomagnesemiaDemonstrationStep(patient);
  if (level === 'coached' && (!step.action || step.action === 'handoff')) return null;
  return { id: `renal-hypomagnesemia-${step.id}`, suggestion: step.narration,
    because: 'Use the requested observations and bedside response. Authored checkpoints are teaching contrasts, not predicted physiology or required clinical waits.',
    sourceHref: RENAL_HYPOMAGNESEMIA_SOURCE_HREF };
}
