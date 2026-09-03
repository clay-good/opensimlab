import type { ExertionalHeatStrokeAction } from './exertional-heat-stroke';

/**
 * Reference transcripts for the emergency exertional-heat-stroke lesson.
 *
 * The common-error path is the one that treats this like any other collapse
 * with an altered mental state: the pattern is reviewed and the run then
 * reaches straight for the cooling target and the organ-injury plan, as though
 * the temperature were something to be observed rather than the thing to be
 * treated. Both are refused, because no cooling has been recorded. The
 * recovery path reaches for immersion before the support bundle and is refused,
 * then reaches for surveillance before the cooling target and is refused
 * again, and still completes from the same positions.
 */
export const EXERTIONAL_HEAT_STROKE_FIXTURES = {
  scenarioId: 'exertional-heat-stroke', contentVersion: '0.1.0', seed: 4131,
  noAction: [],
  expert: [
    [0, 'review-heat-stroke-pattern'],
    [1, 'record-heat-stroke-support'],
    [2, 'record-cold-water-immersion'],
    [3, 'reassess-heat-stroke-cooling-target'],
    [4, 'record-heat-stroke-organ-surveillance'],
  ],
  commonError: [
    [0, 'review-heat-stroke-pattern'],
    // Reading the thermometer instead of using it.
    [1, 'reassess-heat-stroke-cooling-target'],
    [2, 'record-heat-stroke-organ-surveillance'],
  ],
  recovery: [
    [0, 'review-heat-stroke-pattern'],
    // Immersion before the support bundle that keeps it safe.
    [1, 'record-cold-water-immersion'],
    [2, 'record-heat-stroke-support'],
    [3, 'record-cold-water-immersion'],
    // Surveillance before anyone has said where to stop cooling.
    [4, 'record-heat-stroke-organ-surveillance'],
    [5, 'reassess-heat-stroke-cooling-target'],
    [6, 'record-heat-stroke-organ-surveillance'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ExertionalHeatStrokeAction])[];
  expert: readonly (readonly [number, ExertionalHeatStrokeAction])[];
  commonError: readonly (readonly [number, ExertionalHeatStrokeAction])[];
  recovery: readonly (readonly [number, ExertionalHeatStrokeAction])[];
};
