import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCerebellarIch, type CerebellarIchAction, type CerebellarIchProgress,
} from '../spontaneous-cerebellar-intracerebral-hemorrhage';

export const CEREBELLAR_ICH_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCerebellarIchDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCerebellarIch(scenario);
}

export interface CerebellarIchDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CerebellarIchAction; readonly finished?: boolean;
}

/**
 * The worked example for a patient who looks well and cannot sit up.
 *
 * Everything reassuring here is a timestamp: the intact conversation, the small
 * volume, and a first scan that reports no hydrocephalus and no brainstem
 * compression. What the scan does say is that the fourth ventricle is already
 * effaced, and in the posterior fossa the location is the risk rather than the
 * volume. So this example reads the negatives as a clock reading, escalates
 * while she still looks well, and keeps the cough as the airway warning it
 * becomes. It measures no hematoma, determines no etiology or reversal
 * eligibility, and selects no drug, dose, pressure target, airway, drain, or
 * operation.
 */
export function cerebellarIchDemonstrationStep(
  patient?: CerebellarIchProgress,
): CerebellarIchDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on already changed, with the right people called before she changed. Nothing was proven and nothing was excluded — not the cause, not further expansion, not whether her airway holds. This ends the example, not the hemorrhage.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient',
      narration: 'Say that she is fully alert and cannot sit up, and let the second half carry the weight. Seventy-five minutes ago: witnessed abrupt vertigo, vomiting, dysarthria and severe truncal ataxia, in a previously independent 67-year-old. She is awake, oriented and conversational — and she cannot sit or stand unsupported. An intact conversation is the most reassuring thing at this bedside and the least predictive; being unable to hold your own trunk up is the finding that says where the problem is.' };
  }
  if (patient.imagingAtTick === null) {
    return { id: 'imaging', focus: 'monitor', progress: 0.24, action: 'review-neurology-cerebellar-ich-imaging-location-causes-and-immediate-threats',
      narration: 'Read the scan before deciding what this is, because the syndrome does not tell you. Vertigo with ataxia is a cerebellar syndrome, and that is as far as the bedside gets you — the CT is what makes it eleven millilitres of blood rather than an infarct, and blood changes who is called and what happens next. The report also gives the fact that matters more than the volume: the fourth ventricle is already effaced. In the posterior fossa the box is small and the brainstem is next door, so a number that would be modest above the tentorium is not modest here.' };
  }
  if (patient.boundaryAtTick === null) {
    return { id: 'boundary', focus: 'actions', progress: 0.42, action: 'recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary',
      narration: 'Name the escalation boundary now, while she still looks well. The first scan reports no hydrocephalus, no brainstem compression and no herniation — read those as a clock reading rather than a reassurance, because they describe one minute and nothing else. A confined posterior-fossa hemorrhage with an effaced fourth ventricle in an alert patient is exactly the moment the boundary is meant to be named, not the moment to wait for it to declare itself.' };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.6, action: 'activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership',
      narration: 'Get neurosurgery, neurocritical care and an airway-capable owner involved before anything changes. This is the escalation that has to happen while the patient still looks like she does not need it, because in the posterior fossa the interval between looking well and being obstructed is short and one-directional. Her cough is present now and the vomiting is recurrent, so airway capability belongs alongside the surgical conversation rather than after it. Nothing about a drain, an operation or an airway is decided here — those stay with the people being called.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-neurology-cerebellar-ich-strict-later-neurologic-and-airway-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s repeat report. The interval is a contrast rather than a required wait, and nothing here says what any individual hemorrhage does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-cerebellar-ich-imaging-expansion-etiology-and-active-risk',
    narration: 'Fourteen millilitres now, with new obstructive hydrocephalus and brainstem compression, and she is drowsy after more vomiting with a weaker cough. The alertness went before the airway did, which is the order this lesson is about. Hand off the imaging trajectory, the open etiology, the antithrombotic question, the pressure, the airway and the surgical decision — and prove none of it, not the cause, not further expansion, not herniation.' };
}
