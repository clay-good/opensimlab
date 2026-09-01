import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MeningitisImagingSnapshot } from '@platform/kernel/protocol';

export const MENINGITIS_IMAGING_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for five criteria sets that do not agree.
 *
 * Two say image first and three do not, on the same three features, and the
 * prompts never resolve that disagreement — resolving it would invent a
 * consensus the literature does not have. What they do instead is keep the
 * antimicrobial decision out of it: the imaging question and the treatment
 * question are separable, and every set that recommends imaging also says
 * treatment must not wait for it. The two refused exclusions each get their own
 * number rather than a general warning about tests.
 */
export function meningitisImagingInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly meningitisImaging?: MeningitisImagingSnapshot;
}) {
  const patient = input.meningitisImaging;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.featuresRecordedAtTick === null) return prompt('meningitis-imaging-features', true,
    'Record the three features as measured, and what is absent.',
    'Age 68, maintenance immunosuppression after transplantation, and a score of 14. Which criteria set fires depends entirely on these, so they belong in the record before any rule is consulted.');
  if (patient.ownersActivatedAtTick === null) return prompt('meningitis-imaging-owners', true,
    'Activate time-critical ownership on the pattern.',
    'Infection, neurology, and nursing, with cultures drawn before antimicrobials by the qualified team. None of that depends on how the imaging question resolves.');
  if (patient.antimicrobialIntentAtTick === null) return prompt('meningitis-imaging-intent', true,
    'Record antimicrobial intent now, separately from the imaging question.',
    'Every set that recommends imaging also says treatment must not wait for it. Deciding the imaging question first is what turns a disagreement between guidelines into a delay in treatment.');
  if (patient.criteriaComparedAtTick === null) return prompt('meningitis-imaging-criteria', true,
    'Compare the criteria sets against this patient, and leave them disagreeing.',
    'Two say image before puncture and three do not, on these same three features. That is a real disagreement in the literature rather than a question with a hidden right answer.');
  if (patient.boundariesReviewedAtTick === null) return prompt('meningitis-imaging-boundaries', true,
    'Review what each exclusion is worth.',
    'A normal C-reactive protein does not rule this out, and the guidance says so in as many words. A Gram stain is specific enough that a positive result informs, and roughly half sensitive, and lower after antimicrobials — so a negative one excludes nothing.');
  if (patient.monitoringAtTick === null) return prompt('meningitis-imaging-monitor', true,
    'Keep neurological observation running while this is decided.',
    'The features that would change the imaging answer are exactly the ones that can change during the wait. A conscious level from twenty minutes ago is answering a question about a different patient.');
  if (patient.localPathwayApplied && !patient.imagingResulted) {
    return prompt('meningitis-imaging-away', false,
      'Keep watching while the unit applies its own rule set.',
      'The local criteria include immunosuppression, so the scan happens. The clock has continued to run, and that is worth recording rather than resenting.');
  }
  if (!patient.imagingObserved && patient.imagingResulted) {
    return prompt('meningitis-imaging-reassess', true,
      'Take a current full assessment now the scan is reported.',
      'It changed no management, which is the common result rather than a surprise. What matters is where the conscious level is now.');
  }
  if (!patient.imagingResulted) return prompt('meningitis-imaging-observe', false,
    'Continue observing while the authored interval runs.',
    'It is a contrast rather than a real turnaround time, and the recorded intent does not need restating while it passes.');
  return prompt('meningitis-imaging-handoff', false,
    'Hand off the disagreement rather than a resolution of it.',
    'A settled rule and a diagnostic scan are not handoff gates. What travels is which features were present, which sets fire on them, that the treatment did not wait, and what the scan did and did not change.');
}
