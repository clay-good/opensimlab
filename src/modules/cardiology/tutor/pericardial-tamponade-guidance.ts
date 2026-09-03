import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PericardialTamponadeProgress } from '../pericardial-tamponade';

export const PERICARDIAL_TAMPONADE_TUTOR_VERSION = '0.1.0';

export interface PericardialTamponadePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the obvious answer. A woman with active lung
 * cancer, a large effusion and serosanguineous fluid looks like malignant
 * pericardial disease, and everybody in the room will already have decided
 * that — while the cytology and the microbiology are still pending, and while
 * infection and the other epidemiology-dependent causes are still on the list.
 * The second reflex is the one improvement creates: she was drained two hours
 * ago and looks well, and a catheter is still in her chest. It is silent on the
 * unassisted setting, silent once the handoff is recorded, and silent for any
 * scenario version it was not written against.
 */
export function pericardialTamponadeInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PericardialTamponadeProgress },
): PericardialTamponadePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('pct-trajectory', true,
    'The emergency was over before you arrived. Establish what it was before you read what it is.',
    'A sixty-four-year-old woman with active lung adenocarcinoma, two hours after an experienced team performed a reported image-guided pericardiocentesis. Before: ten days of progressive dyspnea and orthopnea, 116/min, 88/64, a respiratory rate of 24, 96% on air, alert but cool at the extremities, an elevated JVP and a pulsus paradoxus of 16 mmHg — and an echo describing a 30 mm circumferential effusion with right-atrial systolic and right-ventricular early-diastolic collapse and a plethoric IVC. It was the whole picture that established tamponade in this case, clinical and imaging together. No single one of those numbers is a threshold, and a pulsus of 16 does not diagnose anything on its own.');
  if (patient.drainageResponseAtTick === null) return prompt('pct-drainage', true,
    'Say what the drainage did — and be careful about the three things it does not tell you.',
    'The prior team reports 420 mL of serosanguineous fluid and a pericardial catheter left in place, and she is now improved: 88/min, 116/72, a respiratory rate of 18, 97% on air, alert and warm, with a repeat echo describing an 8 mm residual effusion and no chamber collapse. That is a real response. It does not tell you that the procedure was straightforward — you were not there and this lesson infers no procedure skill from an outcome. It does not tell you the effusion was the only thing wrong with her. And it does not tell you this is over, because the fluid that filled the pericardium in ten days can fill it again. What you are recording is somebody else\'s reported care and its authored result.');
  if (patient.etiologyAtTick === null && patient.surveillanceAtTick === null) return prompt('pct-parallel', true,
    'Two lanes now, in either order: why the fluid is there, and what happens if it comes back.',
    'The engine accepts them either way round and refuses the handoff until both have landed. One is the cause — which everybody in the room has already decided is her cancer, and which nobody has established, because the cytology and the microbiology are pending and the alternatives include one that is curable. The other is the watching — her perfusion, her breathing, her rhythm, the catheter and what comes out of it. Neither is more urgent than the other right now, which is exactly why both are easy to leave to somebody else.');
  if (patient.etiologyAtTick === null) return prompt('pct-etiology', true,
    'Everyone has already decided this is her cancer. Write down why that is not yet established.',
    'Active lung adenocarcinoma and serosanguineous fluid raise the concern properly and substantially, and they do not prove malignant pericardial involvement — the cytology and the selected microbiology are pending, and a first cytology can be negative in disease that is really there. Infection including tuberculosis where the epidemiology supports it, inflammatory and systemic disease, renal causes, and iatrogenic contributors including her own cancer treatment all stay open, because some of them are treated completely differently and one of them is curable. The honest record is a concern with a reason and a list that is still open, not a diagnosis that happens to fit.');
  if (patient.surveillanceAtTick === null) return prompt('pct-surveillance', true,
    'She has a catheter in her pericardium. Say what you are watching and what would change the plan.',
    'Serial perfusion, respiratory status and rhythm; the catheter, its output and its trend; repeat imaging; and the specific triggers — returning breathlessness, falling pressure, a rising rate, cool peripheries, a rising JVP, a falling or suddenly rising output, a new arrhythmia. Recurrence is the expected thing to watch for rather than a remote one. Two cautions are worth stating: you do not touch, flush, reposition or remove the catheter in this lesson, and no single output volume, effusion size or quiet interval is a threshold that decides anything.');
  return prompt('pct-handoff', true,
    'Hand off pending results, the triggers, and two named owners.',
    'The later report is 90/min, 114/70, a respiratory rate of 18, 97% on air, alert and warm, with 55 mL of additional reported catheter output and a 9 mm residual effusion without chamber collapse — no new arrhythmia, no respiratory deterioration, and the fluid studies still pending. A quiet couple of hours with a drain in place is not durable resolution, and the residual effusion going from 8 mm to 9 mm is a number to keep watching rather than a result to react to. What goes across is the pending cytology and microbiology, the recurrence and deterioration triggers, and named Cardiology and oncology ownership, because a patient whose cause is unknown and whose cancer is active needs both. Nothing here examines her, acquires or interprets an ECG, monitor, image, catheter, output or specimen, diagnoses an etiology, selects or delivers fluid, medication, drainage, surgery or another treatment, manipulates or removes a catheter, manages a complication, determines disposition or prognosis, or predicts outcome.');
}
