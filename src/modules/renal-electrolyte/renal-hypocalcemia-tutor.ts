import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHypocalcemiaSnapshot } from '@platform/kernel/protocol';
import { renalHypocalcemiaDemonstrationStep } from './demo/renal-hypocalcemia-demonstration';

export const RENAL_HYPOCALCEMIA_SOURCE_HREF = 'https://www.fda.gov/drugs/drug-safety-communications/fda-adds-boxed-warning-increased-risk-severe-hypocalcemia-patients-advanced-chronic-kidney-disease';

/** Shares only public care and requested observations with the worked example. */
export function renalHypocalcemiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalHypocalcemia?: RenalHypocalcemiaSnapshot;
}) {
  const patient = input.renalHypocalcemia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const step = renalHypocalcemiaDemonstrationStep(patient);
  if (level === 'coached' && (!step.action || step.action === 'handoff')) return null;
  return { id: `renal-hypocalcemia-${step.id}`, suggestion: step.narration,
    because: 'Use the requested observations and bedside response. Authored checkpoints are teaching contrasts, not predicted physiology or required clinical waits.',
    sourceHref: RENAL_HYPOCALCEMIA_SOURCE_HREF };
}
