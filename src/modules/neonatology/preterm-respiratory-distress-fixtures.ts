import type { PretermRespiratoryDistressAction } from './preterm-respiratory-distress';

/**
 * Reference transcripts for the preterm respiratory distress lesson.
 *
 * The error path names the support branch from the gestation. Twenty-nine
 * weeks with grunting and retractions makes the answer feel automatic, and the
 * shape refused here is choosing it before the CPAP-capable team, the thermal
 * plan and the breathing itself have been established — because it is the
 * spontaneous breathing, not the gestation, that puts this newborn on the CPAP
 * branch. The recovery path starts from exactly those refusals and still
 * reaches a correct handoff in the same run.
 */
export const PRETERM_RESPIRATORY_DISTRESS_FIXTURES = {
  scenarioId: 'preterm-respiratory-distress', contentVersion: '0.1.1', seed: 2946,
  noAction: [],
  expert: [
    [0, 'activate-preterm-respiratory-distress-newborn-respiratory-thermal-and-family-support'],
    [1, 'reconcile-preterm-respiratory-distress-gestation-breathing-work-heart-rate-oxygenation-temperature-and-whole-dyad'],
    [2, 'recognize-spontaneously-breathing-preterm-respiratory-distress-suitable-for-qualified-initial-cpap'],
    [3, 'review-qualified-cpap-oxygen-thermal-monitoring-and-escalation-boundaries'],
    [4, 'review-preterm-respiratory-distress-fixed-ten-minute-qualified-report'],
    [5, 'handoff-preterm-respiratory-distress-breathing-oxygen-thermal-glucose-infection-family-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-spontaneously-breathing-preterm-respiratory-distress-suitable-for-qualified-initial-cpap'],
    [1, 'review-preterm-respiratory-distress-fixed-ten-minute-qualified-report'],
    [2, 'handoff-preterm-respiratory-distress-breathing-oxygen-thermal-glucose-infection-family-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-spontaneously-breathing-preterm-respiratory-distress-suitable-for-qualified-initial-cpap'],
    [1, 'handoff-preterm-respiratory-distress-breathing-oxygen-thermal-glucose-infection-family-and-outcome-risk'],
    [2, 'activate-preterm-respiratory-distress-newborn-respiratory-thermal-and-family-support'],
    [3, 'reconcile-preterm-respiratory-distress-gestation-breathing-work-heart-rate-oxygenation-temperature-and-whole-dyad'],
    [4, 'recognize-spontaneously-breathing-preterm-respiratory-distress-suitable-for-qualified-initial-cpap'],
    [5, 'review-qualified-cpap-oxygen-thermal-monitoring-and-escalation-boundaries'],
    [6, 'review-preterm-respiratory-distress-fixed-ten-minute-qualified-report'],
    [7, 'handoff-preterm-respiratory-distress-breathing-oxygen-thermal-glucose-infection-family-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PretermRespiratoryDistressAction])[];
  expert: readonly (readonly [number, PretermRespiratoryDistressAction])[];
  commonError: readonly (readonly [number, PretermRespiratoryDistressAction])[];
  recovery: readonly (readonly [number, PretermRespiratoryDistressAction])[];
};
