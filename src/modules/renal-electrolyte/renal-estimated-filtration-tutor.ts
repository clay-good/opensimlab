import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalEstimatedFiltrationSnapshot } from '@platform/kernel/protocol';
import { renalEstimatedFiltrationDemonstrationStep } from './demo/renal-estimated-filtration-demonstration';

export const RENAL_ESTIMATE_SOURCE_HREF = 'https://doi.org/10.1056/NEJMoa2102953';

/** Shares only public care and requested observations with the worked example. */
export function renalEstimatedFiltrationInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalEstimatedFiltration?: RenalEstimatedFiltrationSnapshot;
}) {
  const patient = input.renalEstimatedFiltration;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const step = renalEstimatedFiltrationDemonstrationStep(patient);
  if (level === 'coached' && (!step.action || step.action === 'handoff')) return null;
  return { id: `renal-estimate-${step.id}`, suggestion: step.narration,
    because: 'Use the requested observations and what each estimate was generated from. Authored checkpoints are teaching contrasts, not predicted physiology or required clinical waits.',
    sourceHref: RENAL_ESTIMATE_SOURCE_HREF };
}
