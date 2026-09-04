import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMscc, type MsccAction, type MsccProgress,
} from '../metastatic-spinal-cord-compression';
import { msccInlinePrompt } from '../tutor/metastatic-spinal-cord-compression-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: MsccProgress): string {
  const prompt = msccInlinePrompt('guided', { scenarioVersion: '0.1.0', mscc: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const MSCC_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMsccDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMscc(scenario);
}

export interface MsccDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MsccAction; readonly finished?: boolean;
}

/**
 * The worked example for a window measured in how far he can walk.
 *
 * The pain is three weeks old and the emergency is forty-eight hours old. What
 * he can do when treatment starts is the thing most strongly tied to what he
 * will do afterwards, and he has not walked since the assessment — so the
 * recognition happens before any image confirms it. This is also a long
 * referral chain rather than a single decision, and the scan has to be the
 * whole spine rather than the level that hurts. The example moves nobody,
 * orders and interprets no imaging, and selects no drug, dose, or procedure.
 */
export function msccDemonstrationStep(
  patient?: MsccProgress,
): MsccDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on with a level, a plan being argued, and legs that have not changed. Nothing was proven and nothing was excluded — not the definitive treatment, not the function, not whether he walks again. This ends the example, not the compression.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-mscc-cancer-pain-motor-sensory-bladder-and-whole-patient-clock',
      narration: 'Separate the three weeks of pain from the forty-eight hours of function. The mid-thoracic pain has been building for three weeks and now wakes him and worsens with coughing — that is the warning. The emergency is what happened in the last two days: independent walking became two-person support, both legs weakened, and voiding became difficult. And the examination localizes it: hip flexion 3/5 with increased tone, brisk reflexes, bilateral extensor plantars and reduced pin sensation below about T8 is a cord level, not a root.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-neurology-mscc-oncologic-emergency-before-imaging-confirmation',
      narration: 'Call it an oncologic emergency now, before any scan confirms it. Known metastatic cancer, movement-sensitive back pain, bilateral upper-motor-neuron leg weakness, a thoracic sensory level, lost gait and urinary difficulty is the constellation — and no single one of those is sufficient on its own, which is why it is the pattern being named rather than any one finding. He has not walked since this assessment, and how much he can do when treatment starts is the thing most closely tied to how much he will do afterwards.' };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.46, action: 'activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership',
      narration: narrate(patient) };
  }
  if (patient.boundaryAtTick === null) {
    return { id: 'boundary', focus: 'monitor', progress: 0.64, action: 'review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary',
      narration: 'Image the whole spine, and keep the precautions individualized. Whole-spine MRI is the standard here because disease at other levels changes what the definitive plan has to cover, and imaging only the level that hurts is how a second lesion gets missed. Stability and movement precautions, early guideline-directed corticosteroid care, and the choice between surgery and radiotherapy are all individualized decisions belonging to the teams now involved — no drug, dose or operation is selected here, and he is not moved.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-mscc-strict-later-qualified-mri-and-unresolved-function-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s 4-hour report. The interval is a contrast rather than a required wait, and nothing here says what any individual patient recovers.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-mscc-level-stability-function-bladder-definitive-care-and-active-risk',
    narration: 'The whole-spine MRI describes a metastatic T6 lesion with epidural extension and severe cord compression with focal signal change, plus separate lumbar metastases that are not compressing anything — which is exactly why the whole spine was imaged. Hip flexion is still 3/5, the T8 level persists, and the bladder scan found 780 mL before the team drained it. Hand off the surgery-or-radiotherapy decision, the stability, the function, the bladder, the skin and the rehabilitation, and call none of it recovery.' };
}
