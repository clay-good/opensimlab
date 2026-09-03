import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AdultAsthmaProgress } from '../adult-asthma';

export const ADULT_ASTHMA_TUTOR_VERSION = '0.1.0';

export interface AdultAsthmaPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the verdict. Three initial treatments are open
 * at once and none waits on the others, but they act on three different clocks
 * — and the slowest of the three is the one whose entire advantage is being
 * given early. So it is the one that gets held back until the fast treatment
 * has been judged, which is the only deferral here that cannot be recovered.
 *
 * The claim the lesson turns on lives in the beat for the state where none of
 * the three has been recorded, because that is the only one every path passes
 * through.
 *
 * It is silent on the unassisted setting, silent once the reassessment is
 * recorded, and silent for any scenario version it was not written against.
 */
export function adultAsthmaInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: AdultAsthmaProgress },
): AdultAsthmaPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.severityReviewedAtTick === null) return prompt('aa-severity', true,
    'Grade this before you treat it, and use the findings that carry a number.',
    'Words only rather than sentences, a respiratory rate of 34, accessory-muscle use, SpO₂ 91% on room air, and a peak expiratory flow of 32% predicted. Speech and peak flow are the two that grade it; the wheeze does not, and a quiet chest in this picture would be worse rather than better. The authored review also records what is absent — no urticaria, no angioedema, no focal loss of air entry, no fever, no oedema — because the things that imitate a severe exacerbation are the reason a review comes before treatment rather than after it. This screen performs no examination, spirometry, blood gas, or imaging; the findings are given, and none of them proves the diagnosis.');

  const untreated = patient.controlledOxygenAtTick === null
    && patient.bronchodilatorBundleAtTick === null
    && patient.corticosteroidIntentAtTick === null;
  if (untreated) return prompt('aa-initial', true,
    'Three treatments are open at once. Record the slow one now, not after you know whether the fast one worked.',
    'They are unordered on purpose: none of the three is waiting on another. But they act on three different clocks. Oxygen changes a number immediately. The inhaled bronchodilator bundle works over minutes, and it is the one you will be able to see. The systemic corticosteroid does almost nothing in the next half hour and a great deal over the next several hours — which means "early" is not a nicety attached to it, it is the entire advantage the drug has. That is why it is the one that gets held back until the nebulised treatment has been judged, and why holding it back is the only deferral here you cannot recover later in the same visit. Start where you like; just do not make the slow one wait on a verdict. Individualised dosing, inhaler technique, repeat cycles, and any advanced treatment are outside this vignette.');

  if (patient.controlledOxygenAtTick === null) return prompt('aa-oxygen', true,
    'Oxygen is still unrecorded, and the action has a ceiling in it for a reason.',
    'SpO₂ 91% on room air is below the threshold, so oxygen is indicated — but the recorded target is a band, 92 to 95%, not a direction of travel. The reflex when a saturation reads low is to open the flowmeter and stop thinking about it, and in acute severe asthma driving the saturation to 100% buys nothing and can worsen ventilation-perfusion matching and carbon dioxide. A target you can be above is a target you can miss in both directions. Device, flow, titration technique, and the concentration actually delivered are not simulated here.');

  if (patient.corticosteroidIntentAtTick === null) return prompt('aa-corticosteroid', true,
    'Record the corticosteroid intent now. Its only lever is the clock.',
    'Systemic corticosteroid within the first hour is the recommendation for a severe exacerbation, and the reason is not that it does anything quickly — it is that the benefit arrives hours later and only if the decision was made hours earlier. Waiting to see whether the bronchodilators work does not give you better information about whether this patient needs it; a peak flow of 32% predicted already answered that. Drug, dose, route, contraindications, the pharmacology, and any discharge prescription are outside this vignette; this records an intent within a window.');

  if (patient.bronchodilatorBundleAtTick === null) return prompt('aa-bronchodilator', true,
    'Give the fixed inhaled bundle — and notice that it is a spacer, not a nebuliser.',
    'A conservative fixed bundle of six salbutamol puffs and four ipratropium puffs by pressurised inhaler and spacer. The spacer is not the budget option: at this severity a metered-dose inhaler with a spacer delivers as well as a nebuliser for a cooperative adult who is still moving air, and it costs less time to set up. The ipratropium is in the bundle because it adds to the salbutamol specifically in severe exacerbations rather than in every one. Inhaler strength, preparation, technique, lung delivery, repeat dosing, toxicity, and individual response are not simulated.');

  return prompt('aa-reassess', true,
    'Let a moment pass, then re-read the two findings that carried a number.',
    'Speech, work of breathing, oxygenation, the waveform, and the peak flow — the same measures as the first review, because the point of grading with a number is to be able to compare it to another one. What the reassessment is for is deciding whether to repeat, and the habit worth building is that a second treatment cycle follows a second look rather than a clock. The reassessment is gated behind a further engine tick because there is nothing new to see at the instant a treatment is recorded, and what the bounded monitor shows next is authored rather than modelled — read it as a prompt to look, not as proof that anything worked. Repeat cycles, magnesium, ventilatory support, disposition, discharge planning, and prevention remain outside this initial-response vignette.');
}
