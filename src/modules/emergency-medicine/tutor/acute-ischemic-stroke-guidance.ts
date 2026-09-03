import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AcuteIschemicStrokeProgress } from '../acute-ischemic-stroke';

export const ACUTE_ISCHEMIC_STROKE_TUTOR_VERSION = '0.1.0';

export interface AcuteIschemicStrokePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is sequence. Thrombolysis feels like the treatment
 * and thrombectomy feels like what happens if it does not work, so the transfer
 * waits for a response that takes longer to appear than the transfer takes to
 * arrange. They are parallel pathways, and the engine records the transfer as
 * its own step taken without waiting.
 *
 * It is silent on the unassisted setting, silent once the handoff is recorded,
 * and silent for any scenario version it was not written against.
 */
export function acuteIschemicStrokeInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: AcuteIschemicStrokeProgress },
): AcuteIschemicStrokePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.presentationReviewedAtTick === null) return prompt('ais-presentation', true,
    'Start the clock, and check the one thing that imitates a stroke.',
    'Witnessed sudden aphasia with right facial and right arm weakness — disabling, which is the word that decides what happens next — and last known well seventy minutes ago. Witnessed matters because it makes that time a fact rather than an estimate, and everything downstream is measured from it. The glucose of 112 is the cheap and essential one: hypoglycaemia produces focal deficits that resolve with sugar, and it is the mimic you must not miss on the way to a reperfusion pathway. Blood pressure 168/94, airway protected, breathing spontaneous. This screen performs no examination and scores no severity; it records what has been observed.');
  if (patient.systemActivatedAtTick === null) return prompt('ais-activate', true,
    'Activate everything at once. The parts of this do not queue.',
    'Stroke-system activation, monitoring, vascular access, the laboratory workflow, and the CT plus CTA in parallel — noncontrast CT and angiography as one trip rather than two, because the second answers a question the first cannot and going twice costs a scan\'s worth of time. Activation is its own recorded step for the same reason the times are: everything here is a race against the last-known-well clock, and the way that race is lost is serially, with each sensible step waiting politely for the one before it. Team performance, access, specimens, transport and image acquisition are not simulated.');
  if (patient.imagingReviewedAtTick === null) return prompt('ais-imaging', true,
    'Read what the two scans each rule in and out.',
    'Noncontrast CT shows no intracranial haemorrhage — that is the scan\'s job here, and it is a permission rather than a diagnosis, because an early ischaemic stroke often looks normal on it. The CTA shows a left M1 large-vessel occlusion, which is the finding that makes this a two-pathway problem rather than a one-drug problem. Blood pressure 168/94 and no authored contraindication. This fixed screen does not interpret images or adjudicate real eligibility; the findings are given, and what you do with them is the lesson.');
  if (patient.tenecteplaseAtTick === null) return prompt('ais-thrombolysis', true,
    'Record the thrombolysis intent, and notice the ceiling in the arithmetic.',
    'A local-protocol tenecteplase intent within 4.5 hours of a witnessed onset, and for this 80 kg patient the teaching calculation of 0.25 mg/kg gives 20 mg. The cap at 25 mg is worth knowing because it is where weight-based dosing stops being weight-based: a heavier patient does not get proportionally more, and someone reaching for the calculator alone will overshoot. Preparation, physical delivery, contraindication adjudication, pharmacology and any treatment response are not simulated here — this records an intent, not a drug going in.');
  if (patient.thrombectomyActivatedAtTick === null) return prompt('ais-thrombectomy', true,
    'Now the step people wait to take: transfer, without waiting to see if the drug worked.',
    'This is the lesson. Thrombolysis feels like the treatment and thrombectomy feels like the fallback, and that ordering costs a large-vessel occlusion its outcome — a clot in an M1 is often too big for a drug to clear, and the response you would be waiting for takes longer to declare itself than the transfer takes to arrange. So the endovascular pathway and the transfer to a thrombectomy-capable centre are activated now, in parallel, explicitly without waiting for a thrombolysis response. Transfer, procedure selection, the thrombectomy itself and any reperfusion are not simulated.');
  return prompt('ais-handoff', true,
    'Watch the things that would change the plan, and hand over the clocks.',
    'Airway still protected, breathing still spontaneous, blood pressure 168/94, no overt bleeding — that last one is what surveillance after a thrombolytic intent is actually for. The deficits are deliberately not re-scored, because re-scoring in the first minutes invites reading noise as a response and no response is being claimed. What travels with her is the set of times: last known well, activation, imaging, thrombolysis intent, transfer. The receiving team can reconstruct every decision from those and cannot reconstruct any of it from a label. Nothing here examines, delivers, transfers, performs a procedure, diagnoses, determines disposition, or predicts outcome.');
}
