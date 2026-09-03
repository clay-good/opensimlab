import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricFbao, type PediatricFbaoAction, type PediatricFbaoProgress,
} from '../pediatric-foreign-body-airway-obstruction';
import { pediatricFbaoInlinePrompt } from '../tutor/pediatric-fbao-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: PediatricFbaoProgress): string {
  const prompt = pediatricFbaoInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const PEDIATRIC_FBAO_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricFbaoDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricFbao(scenario);
}

export interface PediatricFbaoDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricFbaoAction; readonly finished?: boolean;
}

/**
 * The worked example for a child going down a ladder.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, assesses no responsiveness, pulse, airway or
 * cough, acquires and interprets no ECG or test, visualizes, sweeps, suctions
 * or removes no object, performs no back blow, chest or abdominal thrust,
 * ventilation, compression, laryngoscopy or procedure, and determines no
 * disposition or outcome. The restraint at the top of the ladder is as
 * deliberate as the escalation at the bottom.
 */
export function pediatricFbaoDemonstrationStep(
  patient?: PediatricFbaoProgress,
): PediatricFbaoDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Three minutes, three different right answers, and the grape is still somewhere nobody can see. Nothing was cleared, nothing was declared, and the restraint at the start was as much a decision as the compressions at the end. This ends the example, not the evaluation.' };
  }
  if (patient.reconciledAtTick === null) {
    return { id: 'reconcile', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child',
      narration: narrate(patient) };
  }
  if (patient.effectiveCoughAtTick === null) {
    return { id: 'effectiveCough', focus: 'actions', progress: 0.28, action: 'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance',
      narration: narrate(patient) };
  }
  if (patient.severeResponsiveAtTick === null) {
    return { id: 'severe', focus: 'monitor', progress: 0.46, action: 'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition',
      narration: narrate(patient) };
  }
  if (patient.responsivePathwayAtTick === null) {
    return { id: 'responsive', focus: 'actions', progress: 0.64, action: 'activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway',
      narration: narrate(patient) };
  }
  if (patient.unresponsivePathwayAtTick === null) {
    return { id: 'unresponsive', focus: 'actions', progress: 0.82, action: 'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.94, action: 'handoff-pediatric-foreign-body-airway-obstruction-active-risk',
    narration: narrate(patient) };
}
