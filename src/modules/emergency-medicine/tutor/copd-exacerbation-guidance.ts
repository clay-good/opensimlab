import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CopdExacerbationProgress } from '../copd-exacerbation';

export const COPD_EXACERBATION_TUTOR_VERSION = '0.1.0';

export interface CopdExacerbationPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is generosity with oxygen. This is the patient in
 * whom oxygen is a drug with a ceiling, and the same fact reaches into a place
 * nobody expects: how the nebuliser is driven. Air, not oxygen — because the
 * gas carrying the bronchodilator is itself a dose.
 *
 * The four initial treatments are unordered, so that claim lives in the beat
 * for the state where none of them has been recorded, the only one every path
 * passes through.
 *
 * It is silent on the unassisted setting, silent once the reassessment is
 * recorded, and silent for any scenario version it was not written against.
 */
export function copdExacerbationInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: CopdExacerbationProgress },
): CopdExacerbationPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.severityReviewedAtTick === null) return prompt('copd-severity', true,
    'Read the gas before anything else. It is what makes this patient different.',
    'Increased dyspnoea, short-phrase speech, respiratory rate 28, heart rate 104, accessory-muscle use, diffuse wheeze, more sputum and more purulent sputum, SpO₂ 90% on room air. Then the number that reorganises everything: pH 7.36 with a PaCO₂ of 52 and a PaO₂ of 58. He is hypercapnic and he is compensating — the pH is nearly normal because the kidneys have had time, which tells you this is chronic and not an hour old. The authored review also records no focal consolidation, no oedema, no pneumothorax, no abrupt pleuritic onset, no new unilateral leg finding. This screen performs no examination, no sampling, no imaging and no microbiology; the findings are given, and none of them proves the diagnosis.');

  const untreated = patient.controlledOxygenAtTick === null
    && patient.bronchodilatorBundleAtTick === null
    && patient.corticosteroidIntentAtTick === null
    && patient.antibioticIntentAtTick === null;
  if (untreated) return prompt('copd-initial', true,
    'Four treatments are open at once — and in this patient two of them are the same decision about oxygen.',
    'They are unordered on purpose: none of the four waits on another. What ties two of them together is the PaCO₂ of 52. Oxygen here is a drug with a ceiling, and the recorded target is 88 to 92% — not because more oxygen is unavailable but because generous oxygen in a chronic retainer blunts hypoxic vasoconstriction, worsens dead-space ventilation and pushes the carbon dioxide up until the compensated pH stops being compensated. The part people miss is that the bronchodilator carries the same risk in through a different door: a nebuliser driven by wall oxygen is an oxygen delivery device that nobody wrote a target for, which is why the control here says air-driven. The gas carrying the drug is itself a dose. The corticosteroid course and the antibiotic indication are the other two, and neither depends on either of these. Device technique, individualised dosing, repeat dosing and toxicity are outside this vignette.');

  if (patient.controlledOxygenAtTick === null) return prompt('copd-oxygen', true,
    'Oxygen is still unrecorded, and the target has a ceiling that matters more here than almost anywhere.',
    'SpO₂ 90% on room air with a PaCO₂ of 52: he needs some oxygen and he does not need much. The recorded target is 88 to 92%, together with a plan for serial blood gases — the gas rather than the saturation is what will tell you whether the carbon dioxide is climbing, because a saturation that looks better and a pH that is falling can happen at the same time. That combination is the one to be afraid of. Device, flow, titration technique, and the concentration actually delivered are not simulated.');

  if (patient.bronchodilatorBundleAtTick === null) return prompt('copd-bronchodilator', true,
    'Give the inhaled bundle — driven by air, and notice why the control says so.',
    'A short-acting beta₂-agonist with a short-acting anticholinergic, as a fixed intent. The word doing the work in the label is air-driven: a nebuliser run off wall oxygen at 6 to 8 litres a minute delivers a high inspired oxygen concentration for the whole treatment, to the one patient in the department who has a documented ceiling. Air-driven nebulisation, or a pressurised inhaler with a spacer, keeps the bronchodilator decision separate from the oxygen decision — and if he needs oxygen during the treatment it goes on by nasal cannula underneath, titrated to the same target. Agent, dose, preparation, technique, lung delivery, repeat dosing, toxicity, and individual response are not simulated.');

  if (patient.corticosteroidIntentAtTick === null) return prompt('copd-corticosteroid', true,
    'Record the short course — short being the point.',
    'A 40 mg prednisone-equivalent daily systemic corticosteroid intent for five days. Five, not ten and not tapering: the evidence for a longer course in an exacerbation is that it does not help and the harms accumulate, and the habit of tapering something given for five days is a habit rather than a pharmacological requirement. It shortens recovery and reduces relapse; it does not do anything in the next hour. Agent, route, contraindications, the delayed pharmacology, and any prescription are outside this vignette.');

  if (patient.antibioticIntentAtTick === null) return prompt('copd-antibiotic', true,
    'Say out loud what the antibiotic is for. That is the whole step.',
    'The authored indication is increased sputum purulence — that is why an antibiotic intent belongs in this record, and it is the reason the control is named after the indication rather than after a drug. Not every exacerbation earns one: the change in colour and volume is the signal that gets used, and reaching for an antibiotic because the diagnosis is "COPD exacerbation" is how a population of patients gets treated for something a subset has. Agent selection, allergies, cultures, resistance, route, dose, duration and any prescription are not simulated here.');

  return prompt('copd-reassess', true,
    'Let a moment pass, then re-read the gas — and ask the question the gas exists to answer.',
    'Symptoms, work of breathing, saturation and the repeat blood gas. The reassessment is also where ventilatory support gets considered, and the number that decides it is the pH rather than the carbon dioxide: a PaCO₂ of 52 with a pH of 7.36 is compensated hypercapnia and not an indication, while the same carbon dioxide with a falling pH is a different patient with a different answer. That is the comparison this step exists to make, which is why it is gated behind a further engine tick. What the bounded monitor shows next is authored rather than modelled, so read it as a prompt to look rather than as proof. Device technique, non-invasive ventilation setup, repeat dosing, disposition, maintenance planning, prevention and outcome remain outside this initial-response vignette.');
}
