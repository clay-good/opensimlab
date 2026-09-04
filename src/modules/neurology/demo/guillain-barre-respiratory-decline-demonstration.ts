import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsGbs, type GbsAction, type GbsProgress,
} from '../guillain-barre-respiratory-decline';
import { gbsInlinePrompt } from '../tutor/guillain-barre-respiratory-decline-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: GbsProgress): string {
  const prompt = gbsInlinePrompt('guided', { scenarioVersion: '0.1.0', gbs: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const GBS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsGbsDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsGbs(scenario);
}

export interface GbsDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: GbsAction; readonly finished?: boolean;
}

/**
 * The worked example for a story so typical it stops people looking.
 *
 * It shares the saturation trap with the myasthenic lesson and adds two things
 * that lesson does not have. A mimic must be excluded before the obvious answer
 * is allowed, because ascending weakness with areflexia is also what a cord
 * lesion looks like. And dysautonomia is a third axis of risk where the
 * instruction is to monitor rather than chase — a rate between 48 and 138 is a
 * reason for cardiac ownership, not a list of numbers to treat one at a time.
 * This example measures no mechanics, takes no gas or CSF, interprets no
 * monitor, and selects no drug, dose, oxygen, ventilation, airway, rhythm or
 * pressure treatment.
 */
export function gbsDemonstrationStep(
  patient?: GbsProgress,
): GbsDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on with three problems running at once and the right people watching all of them. Nothing was proven and nothing was excluded — not the diagnosis, not the treatment, not what his autonomic swings do tonight. This ends the example, not the illness.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.26, action: 'review-neurology-gbs-supportive-evidence-mimics-and-diagnostic-boundary',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.46, action: 'recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff',
      narration: narrate(patient) };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.64, action: 'activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership',
      narration: narrate(patient) };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-gbs-strict-later-respiratory-bulbar-and-autonomic-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s 4-hour report. The interval is a contrast rather than a required wait, and nothing here says what any individual patient does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-gbs-airway-dysautonomia-treatment-recurrence-and-active-risk',
    narration: 'He cannot lift his head, speaks one word per breath, has a barely audible cough and needs continuous help clearing saliva; the vital capacity is 1.5 litres, the single-breath count 8, the PaCO2 only 46 — and the saturation is still 96%. Meanwhile the captured interval swings between 48 and 138 beats and between 88/52 and 188/110. Hand off the airway, the ventilation and the dysautonomia as three live problems, along with the treatment decision, the recurrence risk and a diagnosis that is still probable rather than proven.' };
}
