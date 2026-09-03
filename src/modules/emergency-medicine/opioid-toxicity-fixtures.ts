import type { OpioidToxicityAction } from './opioid-toxicity';

/**
 * Reference transcripts for the emergency opioid-toxicity lesson.
 *
 * The common-error path is the one that reaches for the antidote as though it
 * were the airway: the pattern is reviewed and the naloxone intent recorded
 * with nobody ventilating a patient breathing four times a minute. It is
 * refused. The recovery path skips each intervening step in turn, is refused
 * for both, and still completes from the same positions.
 */
export const OPIOID_TOXICITY_FIXTURES = {
  scenarioId: 'opioid-toxicity', contentVersion: '0.1.0', seed: 6407,
  noAction: [],
  expert: [
    [0, 'review-opioid-toxicity-pattern'],
    [1, 'record-opioid-ventilation-support'],
    [2, 'record-opioid-naloxone-intent'],
    [3, 'reassess-opioid-initial-response'],
    [4, 'review-opioid-recurrence'],
    [5, 'record-opioid-recurrence-and-safety-plan'],
  ],
  commonError: [
    [0, 'review-opioid-toxicity-pattern'],
    // The antidote first, with nobody ventilating.
    [1, 'record-opioid-naloxone-intent'],
  ],
  recovery: [
    // Ventilation before anyone has established there is a pulse.
    [0, 'record-opioid-ventilation-support'],
    [1, 'review-opioid-toxicity-pattern'],
    [2, 'record-opioid-ventilation-support'],
    [3, 'record-opioid-naloxone-intent'],
    // The safety plan before the recurrence panel that motivates it.
    [4, 'record-opioid-recurrence-and-safety-plan'],
    [5, 'reassess-opioid-initial-response'],
    [6, 'review-opioid-recurrence'],
    [7, 'record-opioid-recurrence-and-safety-plan'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, OpioidToxicityAction])[];
  expert: readonly (readonly [number, OpioidToxicityAction])[];
  commonError: readonly (readonly [number, OpioidToxicityAction])[];
  recovery: readonly (readonly [number, OpioidToxicityAction])[];
};
