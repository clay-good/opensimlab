import type { IntracranialHemorrhageAction } from './intracranial-hemorrhage-deterioration';

/**
 * Reference transcripts for the emergency intracranial-hemorrhage lesson.
 *
 * The common-error path is the one that treats the blood pressure of 202/112
 * as the emergency: the deterioration is reviewed, the pathway activated, the
 * CT and INR read, and the run then reaches for the pressure strategy with the
 * warfarin still working. It is refused. The recovery path skips each
 * intervening step in turn, is refused for both, and still completes from the
 * same positions.
 */
export const INTRACRANIAL_HEMORRHAGE_FIXTURES = {
  scenarioId: 'intracranial-hemorrhage-deterioration', contentVersion: '0.1.0', seed: 8620,
  noAction: [],
  expert: [
    [0, 'review-ich-deterioration'],
    [1, 'activate-ich-pathway'],
    [2, 'review-ich-findings-and-coagulopathy'],
    [3, 'record-warfarin-reversal-intent'],
    [4, 'record-smooth-ich-pressure-control'],
    [5, 'escalate-ich-neurocritical-care'],
  ],
  commonError: [
    [0, 'review-ich-deterioration'],
    [1, 'activate-ich-pathway'],
    [2, 'review-ich-findings-and-coagulopathy'],
    // The number on the monitor, with the anticoagulant still working.
    [3, 'record-smooth-ich-pressure-control'],
    [4, 'escalate-ich-neurocritical-care'],
  ],
  recovery: [
    // The pathway before anyone has looked at what changed.
    [0, 'activate-ich-pathway'],
    [1, 'review-ich-deterioration'],
    [2, 'activate-ich-pathway'],
    // The reversal before the CT and the INR that name what to reverse.
    [3, 'record-warfarin-reversal-intent'],
    [4, 'review-ich-findings-and-coagulopathy'],
    [5, 'record-warfarin-reversal-intent'],
    [6, 'record-smooth-ich-pressure-control'],
    [7, 'escalate-ich-neurocritical-care'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, IntracranialHemorrhageAction])[];
  expert: readonly (readonly [number, IntracranialHemorrhageAction])[];
  commonError: readonly (readonly [number, IntracranialHemorrhageAction])[];
  recovery: readonly (readonly [number, IntracranialHemorrhageAction])[];
};
