import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPericardialTamponade, type PericardialTamponadeAction,
  type PericardialTamponadeProgress,
} from '../pericardial-tamponade';

export const PERICARDIAL_TAMPONADE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPericardialTamponadeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPericardialTamponade(scenario);
}

export interface PericardialTamponadeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PericardialTamponadeAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a diagnosis everybody has already made.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Where the closing pair is unordered the example reviews the
 * etiology before the surveillance — a choice, not a rule. It examines nobody,
 * acquires or interprets no ECG, monitor, image, catheter, output or specimen,
 * diagnoses no etiology, selects or delivers no fluid, medication, drainage,
 * surgery or other treatment, manipulates or removes no catheter, manages no
 * complication, determines no disposition, and predicts no outcome.
 */
export function pericardialTamponadeDemonstrationStep(
  patient?: PericardialTamponadeProgress,
): PericardialTamponadeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is comfortable, her effusion is 9 mm rather than 30, and none of the questions has been answered. The drainage was somebody else\'s, the cause is still pending, and the catheter is still in her chest. What this review added was a written reason to keep looking at a patient who now looks fine. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.12, action: 'reconcile-pericardial-tamponade-trajectory',
      narration: 'The emergency was over before you arrived. Establish what it was before you read what it is. A sixty-four-year-old woman with active lung adenocarcinoma, two hours after an experienced team performed a reported image-guided pericardiocentesis. Before: ten days of progressive dyspnea and orthopnea, 116/min, 88/64, a respiratory rate of 24, 96% on air, alert but cool at the extremities, an elevated JVP and a pulsus paradoxus of 16 mmHg — and an echo describing a 30 mm circumferential effusion with right-atrial systolic and right-ventricular early-diastolic collapse and a plethoric IVC. It was the whole picture that established tamponade in this case, clinical and imaging together. No single one of those numbers is a threshold, and a pulsus of 16 does not diagnose anything on its own.' };
  }
  if (patient.drainageResponseAtTick === null) {
    return { id: 'drainage', focus: 'monitor', progress: 0.3, action: 'review-pericardial-tamponade-drainage-response',
      narration: 'Say what the drainage did — and be careful about the three things it does not tell you. The prior team reports 420 mL of serosanguineous fluid and a pericardial catheter left in place, and she is now improved: 88/min, 116/72, a respiratory rate of 18, 97% on air, alert and warm, with a repeat echo describing an 8 mm residual effusion and no chamber collapse. That is a real response. It does not tell you that the procedure was straightforward — you were not there and this lesson infers no procedure skill from an outcome. It does not tell you the effusion was the only thing wrong with her. And it does not tell you this is over, because the fluid that filled the pericardium in ten days can fill it again. What you are recording is somebody else\'s reported care and its authored result.' };
  }
  if (patient.etiologyAtTick === null) {
    return { id: 'parallel', focus: 'monitor', progress: 0.5, action: 'review-pericardial-tamponade-etiology',
      narration: 'Two lanes now, in either order: why the fluid is there, and what happens if it comes back. The engine accepts them either way round and refuses the handoff until both have landed. One is the cause — which everybody in the room has already decided is her cancer, and which nobody has established, because the cytology and the microbiology are pending and the alternatives include one that is curable. The other is the watching — her perfusion, her breathing, her rhythm, the catheter and what comes out of it. Neither is more urgent than the other right now, which is exactly why both are easy to leave to somebody else.' };
  }
  if (patient.surveillanceAtTick === null) {
    return { id: 'surveillance', focus: 'actions', progress: 0.72, action: 'review-pericardial-tamponade-surveillance',
      narration: 'She has a catheter in her pericardium. Say what you are watching and what would change the plan. Serial perfusion, respiratory status and rhythm; the catheter, its output and its trend; repeat imaging; and the specific triggers — returning breathlessness, falling pressure, a rising rate, cool peripheries, a rising JVP, a falling or suddenly rising output, a new arrhythmia. Recurrence is the expected thing to watch for rather than a remote one. Two cautions are worth stating: you do not touch, flush, reposition or remove the catheter in this lesson, and no single output volume, effusion size or quiet interval is a threshold that decides anything.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-pericardial-tamponade-reassessment',
    narration: 'Hand off pending results, the triggers, and two named owners. The later report is 90/min, 114/70, a respiratory rate of 18, 97% on air, alert and warm, with 55 mL of additional reported catheter output and a 9 mm residual effusion without chamber collapse — no new arrhythmia, no respiratory deterioration, and the fluid studies still pending. A quiet couple of hours with a drain in place is not durable resolution, and the residual effusion going from 8 mm to 9 mm is a number to keep watching rather than a result to react to. What goes across is the pending cytology and microbiology, the recurrence and deterioration triggers, and named Cardiology and oncology ownership, because a patient whose cause is unknown and whose cancer is active needs both. Nothing here examines her, acquires or interprets an ECG, monitor, image, catheter, output or specimen, diagnoses an etiology, selects or delivers fluid, medication, drainage, surgery or another treatment, manipulates or removes a catheter, manages a complication, determines disposition or prognosis, or predicts outcome.' };
}
