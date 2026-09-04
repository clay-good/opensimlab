import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAcuteTracheostomyObstruction, type AcuteTracheostomyObstructionAction,
  type AcuteTracheostomyObstructionProgress,
} from '../acute-tracheostomy-obstruction';
import { acuteTracheostomyObstructionInlinePrompt } from '../tutor/acute-tracheostomy-obstruction-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: AcuteTracheostomyObstructionProgress): string {
  const prompt = acuteTracheostomyObstructionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ACUTE_TRACHEOSTOMY_OBSTRUCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAcuteTracheostomyObstructionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAcuteTracheostomyObstruction(scenario);
}

export interface AcuteTracheostomyObstructionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AcuteTracheostomyObstructionAction; readonly finished?: boolean;
}

/**
 * The worked example for a tracheostomy that has stopped working.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example takes none of the four shortcuts. It examines
 * nobody, acquires and interprets no capnography, oximetry or imaging,
 * removes no cap, valve, cannula or tube, passes no catheter, suctions
 * nothing, deflates no cuff, ventilates neither face nor stoma, intubates
 * nobody, and performs no procedure: it recognizes, oxygenates both routes,
 * and lets the experienced team take the bounded branch this device has.
 */
export function acuteTracheostomyObstructionDemonstrationStep(
  patient?: AcuteTracheostomyObstructionProgress,
): AcuteTracheostomyObstructionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He has a patent tracheostomy, an outer tube still where it belongs, a stoma track nobody had to fight for, and a team that knows why the lumen occluded and what has to change so it does not happen again tonight. Nothing here proves the patency will hold. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.1, action: 'reconcile-acute-tracheostomy-obstruction-anatomy-and-patency',
      narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.28, action: 'activate-acute-tracheostomy-obstruction-help-and-oxygenation',
      narration: narrate(patient) };
  }
  if (patient.devicePathwayAtTick === null) {
    return { id: 'pathway', focus: 'monitor', progress: 0.46, action: 'review-acute-tracheostomy-obstruction-device-pathway',
      narration: narrate(patient) };
  }
  if (patient.innerCannulaAtTick === null) {
    return { id: 'innerCannula', focus: 'actions', progress: 0.64, action: 'record-acute-tracheostomy-obstruction-inner-cannula-removal',
      narration: narrate(patient) };
  }
  if (patient.restorationAtTick === null) {
    return { id: 'restoration', focus: 'monitor', progress: 0.8, action: 'reassess-acute-tracheostomy-obstruction-restoration',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-acute-tracheostomy-obstruction-reassessment',
    narration: narrate(patient) };
}
