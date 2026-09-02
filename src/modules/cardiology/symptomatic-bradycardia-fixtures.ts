import type { SymptomaticBradycardiaAction } from './symptomatic-bradycardia';

/**
 * Reference transcripts for the symptomatic sinus-bradycardia lesson.
 *
 * The common-error path is the one the unordered pair invites: one review
 * lane is done and the referral is reached for as though that were enough.
 * The recovery path takes the pair in the other order — which the engine
 * accepts without comment — after being refused for skipping the stability
 * reconciliation, and is refused once more for closing the plan before the
 * referral exists.
 */
export const SYMPTOMATIC_BRADYCARDIA_FIXTURES = {
  scenarioId: 'symptomatic-sinus-bradycardia-reassessment', contentVersion: '0.1.0', seed: 4471,
  noAction: [],
  expert: [
    [0, 'reconcile-symptomatic-bradycardia-stability'],
    [1, 'review-symptomatic-bradycardia-context'],
    [2, 'correlate-symptomatic-bradycardia-record'],
    [3, 'record-symptomatic-bradycardia-pacing-evaluation'],
    [4, 'handoff-symptomatic-bradycardia-plan'],
  ],
  commonError: [
    [0, 'reconcile-symptomatic-bradycardia-stability'],
    [1, 'correlate-symptomatic-bradycardia-record'],
    // One lane of two, and then the referral.
    [2, 'record-symptomatic-bradycardia-pacing-evaluation'],
  ],
  recovery: [
    // Reviewing before the patient has been reconciled.
    [0, 'review-symptomatic-bradycardia-context'],
    [1, 'reconcile-symptomatic-bradycardia-stability'],
    // The other order, which is not an error.
    [2, 'correlate-symptomatic-bradycardia-record'],
    [3, 'review-symptomatic-bradycardia-context'],
    // Closing the plan before there is a referral to close.
    [4, 'handoff-symptomatic-bradycardia-plan'],
    [5, 'record-symptomatic-bradycardia-pacing-evaluation'],
    [6, 'handoff-symptomatic-bradycardia-plan'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SymptomaticBradycardiaAction])[];
  expert: readonly (readonly [number, SymptomaticBradycardiaAction])[];
  commonError: readonly (readonly [number, SymptomaticBradycardiaAction])[];
  recovery: readonly (readonly [number, SymptomaticBradycardiaAction])[];
};
