import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHypokalemiaSnapshot } from '@platform/kernel/protocol';
import { RENAL_HYPOKALEMIA_RECURRENCE_TICKS, RENAL_HYPOKALEMIA_RESPONSE_TICKS } from './hypokalemia';

export const RENAL_HYPOKALEMIA_SOURCE_HREF = 'https://sps.nhs.uk/articles/hypokalaemia/';
export const RENAL_HYPOKALEMIA_MAGNESIUM_SOURCE_HREF = 'https://sps.nhs.uk/articles/treating-acute-hypomagnesaemia-in-adults/';

/** Compare public treatment and observation times; historical response credit alone is insufficient after recurrence. */
export function renalHypokalemiaResponseWasObserved(patient: RenalHypokalemiaSnapshot): boolean {
  if (!patient.responseObserved || patient.potassiumAtTick === null || patient.magnesiumAtTick === null || !patient.observation) return false;
  const laterLossCare = patient.lossManagementAtTick !== null
    && patient.lossManagementAtTick >= patient.potassiumAtTick + RENAL_HYPOKALEMIA_RECURRENCE_TICKS
    ? patient.lossManagementAtTick : 0;
  return patient.observation.atTick >= Math.max(patient.potassiumAtTick, patient.magnesiumAtTick, laterLossCare)
    + RENAL_HYPOKALEMIA_RESPONSE_TICKS;
}

export function renalHypokalemiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalHypokalemia?: RenalHypokalemiaSnapshot;
}) {
  const patient = input.renalHypokalemia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because, sourceHref: RENAL_HYPOKALEMIA_SOURCE_HREF };
  if (patient.potassiumAtTick === null) return prompt('renal-hypokalemia-potassium', true,
    'Arrange qualified potassium replacement for the supplied depletion.',
    'Potassium and magnesium care can proceed independently. Neither waits for the other, administrative review, or a new laboratory click. No dose, route, or rate is prescribed here.');
  if (patient.magnesiumAtTick === null) return prompt('renal-hypokalemia-magnesium', true,
    'Address the supplied magnesium depletion alongside potassium care.',
    'A partial potassium improvement does not replace magnesium treatment or establish a complete response. This is not a magnesium-first treatment gate.');
  if (!patient.supportActive) return prompt('renal-hypokalemia-support', true,
    'Coordinate qualified acute-care, nursing, and pharmacy support.',
    'Share treatment and continuing assessment responsibilities while urgent replacement proceeds. A support acknowledgment is not a treatment prerequisite.');
  if (patient.contextReviewedAtTick === null) return prompt('renal-hypokalemia-context', true,
    'Review diarrhea, medication exposure, electrolyte findings, and kidney context.',
    'The supplied creatinine is historical. Review contributors and treatment suitability without inferring an evolving clearance model or one exclusive cause.');
  if (patient.lossManagementAtTick === null) return prompt('renal-hypokalemia-losses', true,
    'Deliver individualized care for ongoing losses and contributors.',
    'Replacement of ongoing losses and contributor management are active care, not just a plan. This request does not instantly stop diarrhea.');
  if (patient.monitoringAtTick === null) return prompt('renal-hypokalemia-monitor', true,
    'Arrange serial potassium, magnesium, ECG, and bedside assessment.',
    'A potassium-only or ECG-only check gives useful partial information but leaves older full findings historical. Continued surveillance remains necessary.');
  if (!patient.potassiumResponseObserved && !patient.magnesiumResponseObserved && !patient.responseObserved
    && !patient.recurrenceObserved && patient.responseDueInSeconds !== null) {
    return patient.potassiumDueInSeconds !== null || patient.magnesiumDueInSeconds !== null
      ? prompt('renal-hypokalemia-observe-partial', false, 'Continue replacement and close reassessment.',
        'The 30-minute contrasts are authored, not required clinical waits. New results require explicit assessment; earlier observations remain historical.')
      : prompt('renal-hypokalemia-reassess-partial', true, 'Request potassium, magnesium, ECG, and bedside findings together.',
        'The partial response must be observed rather than inferred from a treatment request or a newer potassium-only result.');
  }
  if (patient.responseDueInSeconds !== null) return prompt('renal-hypokalemia-observe-response', false,
    'Continue replacement, ongoing-loss care, and repeated assessment.',
    'The combined-response checkpoint is authored, not predicted kinetics or permission to stop monitoring. Reassess sooner whenever clinical findings require it.');
  if (!renalHypokalemiaResponseWasObserved(patient)) return prompt('renal-hypokalemia-reassess-response', true,
    'Request fresh full findings before continuing-care handoff.',
    'Earlier response credit is historical after recurrent depletion. New potassium-only or ECG-only checks do not refresh magnesium or the full bedside assessment.');
  return prompt('renal-hypokalemia-handoff', false, 'Hand off replacement, ongoing losses, and explicit follow-up ownership.',
    'Keep any recurrent depletion and refused shortcuts in the learning record. Handoff does not prove normalization, discharge readiness, or durable safety.');
}
