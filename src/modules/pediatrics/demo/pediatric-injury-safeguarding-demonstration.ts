import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricInjurySafeguarding, type PediatricInjurySafeguardingAction,
  type PediatricInjurySafeguardingProgress,
} from '../pediatric-injury-safeguarding';
import { pediatricInjurySafeguardingInlinePrompt } from '../tutor/pediatric-injury-safeguarding-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricInjurySafeguardingProgress): string {
  const prompt = pediatricInjurySafeguardingInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_INJURY_SAFEGUARDING_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricInjurySafeguardingDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricInjurySafeguarding(scenario);
}

export interface PediatricInjurySafeguardingDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricInjurySafeguardingAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a concern that is not a conclusion.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, assesses no development, takes no history,
 * interviews no caregiver, solicits no disclosure, collects no free text and
 * nothing identifying, identifies, dates, photographs or maps no bruise,
 * calculates no screening rule, acquires and interprets no test or image,
 * diagnoses no abuse, names no person, judges no credibility, confronts and
 * separates nobody, determines no reporting threshold, jurisdiction, agency,
 * referral, report, custody action or placement, and predicts no outcome.
 */
export function pediatricInjurySafeguardingDemonstrationStep(
  patient?: PediatricInjurySafeguardingProgress,
): PediatricInjurySafeguardingDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'A concern was raised accurately, a child is safe in a supervised room this hour, and nobody in this example diagnosed anything, accused anyone, or decided where she sleeps tonight. Every one of those was somebody else\'s to do, and none of them has been done yet. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-injury-development-history-and-whole-child',
      narration: narrate(patient) };
  }
  if (patient.concernAtTick === null) {
    return { id: 'concern', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-injury-safeguarding-concern-without-diagnosis',
      narration: narrate(patient) };
  }
  if (patient.safeguardingAtTick === null) {
    return { id: 'safeguarding', focus: 'actions', progress: 0.46, action: 'activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership',
      narration: narrate(patient) };
  }
  if (patient.alternativesAtTick === null) {
    return { id: 'alternatives', focus: 'actions', progress: 0.64, action: 'review-pediatric-injury-medical-alternatives-and-information-boundary',
      narration: narrate(patient) };
  }
  if (patient.laterSafetyAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-injury-later-safety-state',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-injury-unresolved-safeguarding-risk',
    narration: narrate(patient) };
}
