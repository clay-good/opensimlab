import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPretermRespiratoryDistress,
  type PretermRespiratoryDistressAction, type PretermRespiratoryDistressProgress,
} from '../preterm-respiratory-distress';

export const PRETERM_RESPIRATORY_DISTRESS_DEMONSTRATION_VERSION = '0.1.1';

export function supportsPretermRespiratoryDistressDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.1' && supportsPretermRespiratoryDistress(scenario);
}

export interface PretermRespiratoryDistressDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PretermRespiratoryDistressAction; readonly finished?: boolean;
}

/**
 * The worked example for a support decision made by what he is doing.
 *
 * A worked example is where a number gets memorized, so this one is careful
 * about which of them travel. The branch is chosen on the spontaneous
 * breathing rather than the gestation, and the 30% oxygen start is named as
 * one qualified team's choice inside a 30% to 100% range rather than a figure
 * to carry to the next bedside. It operates no device, selects no setting,
 * suctions nothing and gives no surfactant, and it finishes on a support that
 * is working over a newborn who is still undiagnosed.
 */
export function pretermRespiratoryDistressDemonstrationStep(
  patient?: PretermRespiratoryDistressProgress,
): PretermRespiratoryDistressDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The newborn is handed on with his support working, his breathing still laboured, and nothing about his lungs named. The branch was chosen on what he was doing, and it stays the right branch only while he keeps doing it. This ends the example, not the first hours.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-preterm-respiratory-distress-newborn-respiratory-thermal-and-family-support',
      narration: 'Confirm the CPAP-capable team and the thermal plan as one requirement: a trained preterm team, CPAP-capable and airway-ready support, the shared clock, a thermal plan, transport ownership, communication, dignity, and a parent who has asked what support he needs. At 1.25 kg the warmth is not a comfort measure running alongside the respiratory care. It is part of it.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.24, action: 'reconcile-preterm-respiratory-distress-gestation-breathing-work-heart-rate-oxygenation-temperature-and-whole-dyad',
      narration: 'Separate what he is doing from what he is. Twenty-nine weeks and four days, 1.25 kg, cesarean birth for severe preeclampsia, ninety seconds elapsed — and spontaneous breathing, grunting, intercostal and subcostal retractions, heart rate 154, respiratory rate 68, preductal saturation 62%, 36.5°C under a plastic wrap and hat, no apnea and no gasping. The gestation describes him. The breathing decides this.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.4, action: 'recognize-spontaneously-breathing-preterm-respiratory-distress-suitable-for-qualified-initial-cpap',
      narration: 'Choose the branch on the breathing and say so. For a spontaneously breathing preterm infant who needs respiratory support, qualified initial CPAP is reasonable rather than routine intubation and mechanical ventilation. What puts him there is that he is breathing for himself with distress, not that he is twenty-nine weeks, and a saturation of 62% at ninety seconds is expected in transition rather than read alone.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.56, action: 'review-qualified-cpap-oxygen-thermal-monitoring-and-escalation-boundaries',
      narration: 'Take the range rather than the number, and know what leaves this branch. Preductal oximetry guides the oxygen, and 30% to 100% is a reasonable initial range under thirty-two weeks; the 30% start here is one qualified team’s choice inside that range rather than a prescription to carry elsewhere. Wrap, hat and temperature surveillance address hypothermia while avoiding hyperthermia. Apnea, gasping, a heart rate under 100 or ineffective breathing belongs to the positive-pressure branch, which is a different lesson than this one.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'review-preterm-respiratory-distress-fixed-ten-minute-qualified-report',
      narration: 'Let the authored ten minutes pass and read the qualified team’s report. The interval is a contrast rather than a required wait, and nothing here predicts how quickly a real preterm chest answers CPAP.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-preterm-respiratory-distress-breathing-oxygen-thermal-glucose-infection-family-and-outcome-risk',
    narration: 'CPAP continuing, oxygen titrated to 35%, preductal saturation 90%, heart rate 148, respiratory rate 62, 36.6°C, no observed apnea — and mild grunting and retractions persisting. The support is working and the disease is unnamed, so hand off respiratory distress syndrome, infection, air leak and congenital disease as open, and adequate ventilation as unproven.' };
}
