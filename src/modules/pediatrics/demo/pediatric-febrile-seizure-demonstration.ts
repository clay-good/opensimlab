import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricFebrileSeizure, type PediatricFebrileSeizureAction,
  type PediatricFebrileSeizureProgress,
} from '../pediatric-febrile-seizure';

export const PEDIATRIC_FEBRILE_SEIZURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricFebrileSeizureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricFebrileSeizure(scenario);
}

export interface PediatricFebrileSeizureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricFebrileSeizureAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a well-looking toddler after a frightening event.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes care first and the safety review
 * second, which is one valid order rather than the required one. The example
 * examines nobody, measures no temperature, times no seizure, acquires and
 * interprets no glucose, urine, blood, culture, lumbar-puncture, EEG, ECG or
 * imaging finding, diagnoses neither the seizure nor the fever source, chooses
 * no antipyretic, antimicrobial, antiseizure or rescue medicine, fluid,
 * oxygen, dose, route, access or device, and determines no disposition or
 * outcome.
 */
export function pediatricFebrileSeizureDemonstrationStep(
  patient?: PediatricFebrileSeizureProgress,
): PediatricFebrileSeizureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is playing, his caregiver has been told what to watch for and what to do if it happens again, and nobody in this room has called it simple, benign or over. That is the honest version, and it is more useful to this family than the comfortable one. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-febrile-seizure-event-recovery-and-fever',
      narration: 'Read the event, then read the child in front of you. A previously well, developmentally typical two-year-old, 12 kg, immunizations current including Hib and pneumococcal. Twelve hours of fever, rhinorrhea and slightly less drinking, then a first bilateral generalized convulsion of about three minutes, witnessed by his caregiver, which stopped on its own before this surface opened. No rescue medicine was given, and no focal onset, asymmetry or recurrence is reported. Now: sleepy and clingy, but he opens his eyes to his caregiver\'s voice, makes eye contact, cries appropriately, and moves and reaches symmetrically. Temperature 39.0°C, heart rate 150, saturation 98% on air, refill two seconds. Note what you were not given — no routine glucose, no other test — because that absence is deliberate rather than an oversight.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary',
      narration: 'Say the careful version: simple features to date. That phrase is doing real work, and both halves matter. The features are simple so far — generalized, about three minutes, one event, a child recovering in front of you — which is what makes an aggressive workup the wrong reflex here. And "to date" is not a formality: it does not settle the fever source, and it does not exclude central-nervous-system infection, serious infection, another seizure cause, deterioration or recurrence during this illness. The authored absences — no nonblanching rash, no meningism, no bulging fontanelle, no persistent focal deficit, no shock, no trauma, no known ingestion, no prior afebrile seizure, no developmental regression — are fixed snapshots of this minute. You are not diagnosing or classifying anything.' };
  }
  if (patient.careAtTick === null) {
    return { id: 'care', focus: 'actions', progress: 0.46, action: 'activate-pediatric-febrile-seizure-qualified-care-ownership',
      narration: 'Two things run together: looking after him, and keeping looking. Start with the care ownership. Experienced pediatric and nursing teams take comfort, hydration and intake context, observation, repeated whole-child and neurological reassessment, airway and recurrence contingencies, fever-source evaluation, escalation, and the conversation with his caregiver. Two things this lesson will not let you reach for: an antipyretic may be considered by that team for distress, and it does not prevent febrile seizures; routine prophylactic antiseizure medicine is not modeled here at all. You choose no drug, dose, route, fluid, device or test.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-febrile-seizure-infection-recurrence-and-alternatives',
      narration: 'He is being looked after. Now keep the dangerous things open. This is the half that reassurance closes too early. Experienced teams keep serial appearance and interaction, neurological state, meningism and focal findings, breathing, circulation, hydration, rash, the fever source, immunization and medicine context, recurrence, the triggers that would make this prolonged or focal, and infection, ingestion, trauma and metabolic alternatives. Current negative findings are snapshots and not permanent exclusions — a child who looks well at minute ten can look different at minute forty, which is the entire reason somebody keeps watching rather than deciding.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-febrile-seizure-later-response',
      narration: 'Let time pass, then check him again rather than concluding. The fixed later report has him awake and interactive, recognizing his caregiver, using age-appropriate words and play, moving and reaching symmetrically, mildly tired, with no recurrent seizure and no focal finding. Temperature 38.7°C, heart rate 126, saturation 99%, refill two seconds. That is a genuinely reassuring half-hour and it is worth saying to the family. It still does not finally prove a simple or benign event, does not establish the fever source, does not exclude central-nervous-system or serious infection, does not prove durable recovery, and does not rule out another seizure during this illness. Reassurance with boundaries is more useful to this family than reassurance without them.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-febrile-seizure-active-risk',
    narration: 'Hand off the safety net, not a verdict. What travels is the event and its description — first, generalized, about three minutes, stopped on its own, no rescue medicine — the recovery from it and the later checkpoint, the fever and its unidentified source, the immunization context, the pattern described as simple features to date rather than as a diagnosis, what stays open including CNS and serious infection, recurrence during this illness and complex features, who owns the observation and how often, and the caregiver guidance: what to watch for, what to do if it happens again, and that this is frightening to see and does not mean what people fear it means. Nothing here claims a diagnosis, a cause, an exclusion, durable recovery, freedom from recurrence, disposition, prognosis or outcome.' };
}
