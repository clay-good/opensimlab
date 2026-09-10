import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalRhabdomyolysisSnapshot } from '@platform/kernel/protocol';
import { supportsRenalRhabdomyolysis, RENAL_RHABDOMYOLYSIS_SERIAL_TICKS,
  type RenalRhabdomyolysisAction } from '../rhabdomyolysis';

export const RENAL_RHABDOMYOLYSIS_DEMONSTRATION_VERSION = '0.1.0';
export const RENAL_RHABDOMYOLYSIS_DEMONSTRATION_EARLY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export function supportsRenalRhabdomyolysisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRenalRhabdomyolysis(scenario);
}
export interface RenalRhabdomyolysisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RenalRhabdomyolysisAction; readonly finished?: boolean;
}
export function renalRhabdomyolysisDemonstrationStep(patient?: RenalRhabdomyolysisSnapshot): RenalRhabdomyolysisDemonstrationStep {
  if (!patient) return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  if (patient.ended) return { id: 'finished', narration: patient.ended === 'handoff'
    ? 'The fluid ownership, the repeated examination, and the open question of when he leaves are handed off. This ends the example, not the care, and it names no peak and no prognosis.'
    : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.', focus: 'actions', progress: 1, finished: true };
  if (patient.compartmentExaminedAtTick === null) return { id: 'compartment', narration: 'Examine the thighs and shoulders before doing anything with the number. A compartment syndrome is the one thing here that is time-critical, it is found at the bedside, and no creatine kinase value rules it in or out.', focus: 'actions', progress: 0.05, action: 'examine-compartments' };
  if (patient.causeReviewedAtTick === null) return { id: 'cause', narration: 'Establish the cause, because in the cohort behind this lesson the observed risk tracked the cause: about 3% for exercise, over 40% for compartment syndrome, nearly 60% after cardiac arrest. That is a distribution in a retrospective cohort, not a prediction about him.', focus: 'actions', progress: 0.14, action: 'review-cause' };
  if (patient.fluidsArrangedAtTick === null) return { id: 'fluids', narration: 'Arrange qualified individualized fluid resuscitation and record who owns it. Fluid is the part with support behind it; the team choosing it owns the volume, the rate, the product, and the targets, and this example chooses none of them.', focus: 'actions', progress: 0.24, action: 'arrange-fluids' };
  if (patient.numberReviewedAtTick === null) return { id: 'number', narration: 'Now take the number apart. It is one variable among eight in the risk model, and in a separate series higher creatinine went with lower creatine kinase while twenty-nine of thirty patients were still discharged only once the value fell.', focus: 'actions', progress: 0.34, action: 'review-number' };
  if (patient.additionsReviewedAtTick === null) return { id: 'additions', narration: 'Review the two familiar additions. Neither bicarbonate nor mannitol improved renal failure or dialysis need across twelve studies — in a review that rated its own evidence very low. That is not proof they are useless; it is a reason not to add them out of habit.', focus: 'actions', progress: 0.43, action: 'review-additions' };
  if (!patient.supportActive) return { id: 'support', narration: 'Share the fluid decision, the repeat examination, and surveillance with acute-care, renal, surgical, and nursing teams.', focus: 'actions', progress: 0.52, action: 'call-support' };
  if (patient.monitoringAtTick === null) return { id: 'monitor', narration: 'Arrange serial creatine kinase, creatinine, potassium, urine output, and a repeated compartment examination. The examination is the part no laboratory can supply.', focus: 'actions', progress: 0.60, action: 'monitor' };
  if (patient.serialDueInSeconds !== null) {
    const earlyRemaining = (RENAL_RHABDOMYOLYSIS_SERIAL_TICKS - RENAL_RHABDOMYOLYSIS_DEMONSTRATION_EARLY_TICKS) / TICKS_PER_SECOND;
    if (patient.serialDueInSeconds > earlyRemaining) return { id: `early-observation-${patient.fluidsArrangedAtTick}`, narration: 'Continue through this authored five-minute observation contrast. It is not a clinical wait, and the clock reveals no new result.', focus: 'monitor', progress: 0.66 };
    if (!patient.observation) return { id: `early-reassessment-${patient.fluidsArrangedAtTick}`, narration: 'Take a full assessment now, so there is something to compare the serial results against.', focus: 'actions', progress: 0.72, action: 'reassess' };
    return { id: `serial-observation-${patient.fluidsArrangedAtTick}`, narration: 'Continue surveillance while the serial results come back. The authored interval is not a clinical wait, and the earlier result stays historical.', focus: 'monitor', progress: 0.80 };
  }
  const requiredTick = Math.max(patient.fluidsArrangedAtTick! + RENAL_RHABDOMYOLYSIS_SERIAL_TICKS, patient.compartmentExaminedAtTick);
  if (!patient.observation || patient.observation.atTick < requiredTick) return {
    id: `serial-reassessment-${requiredTick}`, narration: 'Request the creatine kinase, the kidney findings, and the examination together, and watch what moved. The number is higher. The creatinine and the urine output are exactly where they were.',
    focus: 'actions', progress: 0.90, action: 'reassess' };
  return { id: 'handoff', narration: 'Hand over the fluid ownership, the examination that has to be repeated, and the decision about when he leaves. A creatine kinase that is still climbing is not a reason to keep him, and one that falls is not a reason to let him go.', focus: 'actions', progress: 0.96, action: 'handoff' };
}
