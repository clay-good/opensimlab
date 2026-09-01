import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsSympathomimetic, type SympathomimeticAction, type SympathomimeticProgress,
} from '../sympathomimetic-hyperadrenergic-hyperthermia';

export const SYMPATHOMIMETIC_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSympathomimeticDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSympathomimetic(scenario);
}

export interface SympathomimeticDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SympathomimeticAction; readonly finished?: boolean;
}

/**
 * The worked example for a frightening room.
 *
 * The pressure and the rate are the surge rather than three problems to be
 * lowered separately, and the agitation is part of the toxidrome rather than a
 * behavior to be controlled. So this example names the pattern before the room
 * mobilizes, puts de-escalation, sedation and cooling in one beat because they
 * are one intervention, reads the lactate and the CK as work he is doing, and
 * ends by handing off the man rather than the improved observations. The
 * example selects no restraint, cooling method, fluid, sedative,
 * antihypertensive, product, dose, or route.
 */
export function sympathomimeticDemonstrationStep(
  patient?: SympathomimeticProgress,
): SympathomimeticDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on calmer and cooler with everything that made him dangerous to himself still ahead of him. Nothing was proven and nothing was excluded — not the cause, not his heart, not his kidneys, not the night he still has to get through. This ends the example, not the poisoning.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-sympathomimetic-exposure-clock-agitation-autonomic-temperature-and-whole-patient',
      narration: 'Say what is driving all of it rather than reading the numbers one at a time. Seventy minutes after a swallowed methamphetamine exposure: fearful hypervigilance, paranoid statements and severe motor agitation, with sweating, wide pupils, warm skin and active bowel sounds. The heart rate of 150, the 196/112 and the 40.4°C are not three problems — they are one surge, and the agitation is part of it rather than a separate behavior.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-sympathomimetic-coupled-pattern-without-screen-pupil-pressure-temperature-or-agitation-only-closure',
      narration: 'Name the pattern before the room mobilizes, and refuse the five ways it gets closed early. Exposure plus mental state plus autonomic findings are one pattern, and no toxicology screen, pupil, pressure, temperature, pulse or behavior diagnoses or grades him alone. The wet skin and the busy gut with no clonus, no hyperreflexia and no rising tone are the discriminators worth having — they sit between the serotonergic bedside and the dry, quiet anticholinergic one — and they exclude nothing on their own, with head injury, hypoglycemia, infection, withdrawal, environmental exposure and coingestion all still open.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-sympathomimetic-deescalation-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership',
      narration: 'Make the room calmer and cooler in the same beat, and give both an owner. De-escalation, sedation and rapid cooling are one intervention here rather than three: the calm is what lowers the pressure, the rate and the heat, and prolonged struggle adds to all three. Cardiac, airway, renal, monitoring, psychiatric, the poison center and compassionate safety ownership start together with it. A frightened man is not a security problem.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-sympathomimetic-supplied-mental-autonomic-cardiac-temperature-renal-ck-and-differential-boundary',
      narration: 'Read the acidosis as work he is doing, and keep the pressure attached to the surge. Lactate 5.2 with bicarbonate 18 and CK 980 is what a fighting, hot patient is putting into the blood, and a creatinine of 1.2 today says nothing about tomorrow. A QRS of 90 ms is not reassurance about what else he took. The pressure belongs to the catecholamines, so it is not a number to be attacked on its own, and this example determines him eligible for no specialist adjunct.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-sympathomimetic-bounded-qualified-deescalation-support-sedation-cooling-surveillance-airway-and-adjunct-intent-with-strict-later-review',
      narration: 'Record the de-escalation and support, the sedation, the rapid cooling, the cardiac, temperature, renal and CK surveillance, the airway preparedness, and the specialist adjunct question as intents. Let the authored interval pass and read the qualified team’s 30-minute report. The interval is a contrast rather than a required wait, and nothing here says how fast any individual pressure, rate, or temperature comes down.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-sympathomimetic-rebound-agitation-psychosis-suicidality-ischemia-arrhythmia-hyperthermia-rhabdomyolysis-coingestion-airway-and-active-risk',
    narration: '38.8°C, heart rate 112, 152/88, cooperative and no supplied chest pain or focal deficit. Hand off the man rather than the improved observations: rebound agitation, psychosis and suicidality, ischemia and arrhythmia, the CK and renal injury, coingestion, exposure completeness and his safety are all still live, and none of this proves the sedation did it.' };
}
