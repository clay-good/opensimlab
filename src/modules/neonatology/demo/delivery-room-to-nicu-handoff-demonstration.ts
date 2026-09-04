import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsNicuHandoff, type NicuHandoffAction, type NicuHandoffProgress,
} from '../delivery-room-to-nicu-handoff';

export const NICU_HANDOFF_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNicuHandoffDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNicuHandoff(scenario);
}

export interface NicuHandoffDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NicuHandoffAction; readonly finished?: boolean;
}

/**
 * The worked example for the part of a handoff that gets dropped.
 *
 * What happened is the half people rehearse. This example spends its weight on
 * the other half: the interventions that did not happen, the two results nobody
 * has yet, and the ownership boundary that runs until someone says the words
 * rather than until the NICU accepted her. It transports nobody, speaks no
 * check-back and updates no parent, and it refuses to read the receiver's
 * correct read-back as proof that understanding is shared.
 */
export function nicuHandoffDemonstrationStep(
  patient?: NicuHandoffProgress,
): NicuHandoffDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The newborn arrives with her story intact, including the parts of it that are absences, and with everything that was open still open. A handoff moves responsibility; it does not settle anything. This ends the example, not her first day.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-delivery-room-nicu-sending-receiving-transport-and-family-handoff-support',
      narration: 'Name both ends of the transfer, and the person who is not in the room: sending, receiving, transport, respiratory, monitoring, documentation, escalation, dignity, reunification — and a recovering parent who has heard that her newborn is breathing and has had no complete update. A handoff with only one named end is a story told to nobody in particular.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.24, action: 'reconcile-delivery-room-nicu-gestation-perinatal-birth-resuscitation-current-state-parent-and-whole-dyad',
      narration: 'Assemble the timeline, including the two results nobody has. Thirty-four weeks and two days, 2.1 kg, emergency cesarean for a prolonged deceleration, initial apnea at a heart rate of 76, effective face-mask ventilation from fifty seconds with visible chest movement, heart rate 118 by two minutes, spontaneous breathing by four — and now CPAP 5 with 30% oxygen, saturation 93%, 36.5°C, refill 2 seconds, glucose and cord gas still pending. Pending is a fact to hand over, not a gap to apologise for.' };
  }
  if (patient.contentAtTick === null) {
    return { id: 'content', focus: 'actions', progress: 0.4, action: 'review-delivery-room-nicu-patient-assessment-situation-safety-background-actions-timing-ownership-and-next-step-content',
      narration: 'Carry the negatives with the same weight as the events. No compressions, no epinephrine, no access, no fluid, no blood, no alternative airway. Those are the sentences that get dropped and the ones the receiving team needs most, because they set what a deterioration would mean. Patient, assessment, situation, safety concerns, background, actions, timing, ownership and next steps — with response and nonresponse both.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.56, action: 'review-qualified-delivery-room-nicu-transport-continuity-receiving-readiness-check-back-and-family-boundaries',
      narration: 'Keep continuity with the sender until someone says the words. Respiratory, thermal and monitoring continuity, equipment and route readiness, receiver questions, check-back, documentation, deterioration triggers, the parent explanation and the reunification plan. The NICU accepting her is not the transfer: the delivery-room team owns her until an explicit one, and that gap is where continuity is usually lost.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'review-delivery-room-nicu-fixed-receiver-check-back-and-ten-minute-arrival-report',
      narration: 'Let the authored ten minutes pass and read the receiver check-back and the arrival report. The interval is a contrast rather than a required wait, and nothing here says how a real newborn travels or what the first ten minutes in a real unit look like.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-delivery-room-nicu-respiratory-thermal-glucose-neurologic-infection-feeding-family-and-outcome-risk',
    narration: 'The receiver repeated it back correctly and arrival looks like departure: heart rate 140, respiratory rate 54 with persistent mild retractions, 94% on the same support, 36.4°C, refill 2 seconds, glucose 52, cord gas still pending. A correct check-back is evidence that words were repeated rather than that understanding is shared, so hand off respiratory, thermal, glucose, neurologic, infection, feeding and family risk as open.' };
}
