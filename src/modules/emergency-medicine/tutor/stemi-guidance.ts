import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { StemiProgress } from '../stemi';

export const STEMI_TUTOR_VERSION = '0.1.0';

export interface StemiPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the drug tray. Three things are open at once
 * and only one of them moves the artery any closer to being open — the phone
 * call. Aspirin and a P2Y12 inhibitor are worth giving and neither is the
 * treatment.
 *
 * Because the three are unordered, that claim lives in the beat for the state
 * where none of them has been recorded.
 *
 * It is silent on the unassisted setting, silent once the handoff is recorded,
 * and silent for any scenario version it was not written against.
 */
export function stemiInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: StemiProgress },
): StemiPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.patternReviewedAtTick === null) return prompt('stemi-pattern', true,
    'Read the twelve-lead — and notice which screen you are not allowed to read it on.',
    'Forty-five minutes of ongoing central pressure to the left arm with sweating and nausea, heart rate 104, blood pressure 146/92, SpO₂ 95%, warm, no failure and no shock. The authored twelve-lead shows ST elevation in V2 to V5 with reciprocal inferior depression. The bedside lead-II monitor is not the diagnostic tracing and never was: a monitor lead is for rhythm, and people have talked themselves out of an anterior infarct on the strength of a strip that was never looking at the anterior wall. The absences matter too, and for a specific reason — no tearing pain, no pulse asymmetry, no neurologic deficit, no pericarditic pattern, no pneumothorax pattern, no recent PDE5 inhibitor. The next thing you do is give antiplatelets and an anticoagulant, and those absences are what make that safe rather than catastrophic. This screen acquires no tracing and interprets nothing real.');

  const nothingStarted = patient.pathwayActivatedAtTick === null && patient.aspirinAtTick === null
    && patient.additionalAntithromboticsAtTick === null;
  if (nothingStarted) return prompt('stemi-initial', true,
    'Three things are open at once. Only one of them opens the artery.',
    'They are unordered on purpose: activating the pathway, the aspirin load, and the P2Y12 inhibitor with parenteral anticoagulation all proceed in parallel. But they are not the same kind of act. Aspirin and a P2Y12 inhibitor stop the clot getting bigger; the anticoagulant keeps the catheter and the vessel from making a new one. None of the three reopens an occluded coronary artery — a wire does, and the only thing on this screen that brings the wire closer is the phone call. The drugs are the ones that feel like doing something, which is exactly why the call is the one that gets made third. Note also what is not being waited for: the troponin. A twelve-lead with this pattern and forty-five minutes of pain is the whole indication, and a normal early troponin in that setting means the necrosis has not had time to be measurable rather than that the artery is open. Transport, angiography, access, anatomy, technique, agent selection and dosing are outside this vignette.');

  if (patient.pathwayActivatedAtTick === null) return prompt('stemi-pathway', true,
    'The pathway is still not activated, and it is the only lane on a clock.',
    'Activate the STEMI pathway, the interventional team and the primary-PCI intent — in this declared PCI-capable setting, without waiting for a biomarker. Everything else recorded so far can be given at any moment in the next few minutes with the same effect; this one cannot, because it starts other people moving and the time from arrival to a wire is measured from when they were told. Transport logistics, angiography, access, lesion anatomy, technique, stent choice and any actual reperfusion are not simulated.');

  if (patient.aspirinAtTick === null) return prompt('stemi-aspirin', true,
    'Aspirin, loading dose, chewed rather than swallowed whole.',
    'An initial oral load of 162 to 325 mg, with the authored absence of allergy or absolute contraindication already established. It is the cheapest thing that will happen today and one of the few that has a mortality benefit measurable on its own. Chewed matters because absorption across the buccal mucosa is faster than waiting on a stomach that nausea has already slowed down, and the whole point of a loading dose is speed. Formulation, the exact number within the range, administration, absorption, bleeding and maintenance therapy are outside this vignette.');

  if (patient.additionalAntithromboticsAtTick === null) return prompt('stemi-antithrombotics', true,
    'Record the P2Y12 loading and the parenteral anticoagulation together.',
    'Both intents belong to the primary-PCI pathway rather than to the diagnosis on its own, which is why the control pairs them. The P2Y12 inhibitor adds a second, separate antiplatelet mechanism to the aspirin, and the parenteral anticoagulant is what makes it safe to put a catheter into a coronary artery. Which agent, at what dose, in a patient with which kidneys and which previous therapy, and whether the cath lab wants it before or on the table, are all real questions with local answers — and none of them is answered here. This records intents, not a prescription.');

  return prompt('stemi-handoff', true,
    'Re-read him once, then hand over with a time on it — and notice the oxygen you are not giving.',
    'Ongoing pain, heart rate 104, blood pressure 146/92, SpO₂ 95% on room air, warm, sinus rhythm, no ventricular arrhythmia, no failure, no shock, no mechanical complication. Routine oxygen stays unselected because the saturation is at or above 90%, and that is a deliberate choice rather than an omission: supplemental oxygen given to a normoxic patient with myocardial infarction has been associated with larger infarcts rather than smaller ones, so the reflex mask is a treatment with a real cost and no benefit here. What goes to the reperfusion team is time-stamped, because the interval they are judged on starts before they meet him. The procedure and the outcome remain outside this lesson.');
}
