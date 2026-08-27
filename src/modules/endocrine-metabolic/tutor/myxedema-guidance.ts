import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MyxedemaSnapshot } from '@platform/kernel/protocol';

export const MYXEDEMA_SOURCE_HREF = 'https://doi.org/10.1530/ETJ-26-0044';
export const MYXEDEMA_ATA_SOURCE_HREF = 'https://doi.org/10.1089/thy.2014.0028';
export const MYXEDEMA_SOURCE_ID = 'eta-bta-sfe-myxedema-coma-2026';

/** Quiet version-bound context; accepted patient state alone selects the next explanation. */
export function myxedemaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly myxedema?: MyxedemaSnapshot;
}) {
  const patient = input.myxedema;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.1' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because, sourceHref: MYXEDEMA_SOURCE_HREF };
  if (patient.ventilationAtTick === null) return prompt('myxedema-breathing', true,
    'Protect breathing while the team treats the suspected endocrine emergency.',
    'Slow, shallow breathing can retain carbon dioxide. Oxygen may improve saturation without fixing ventilation, so the saturation number alone cannot establish adequate breathing.');
  if (patient.hydrocortisoneAtTick === null) return prompt('myxedema-steroid-first', true,
    'Provide qualified empiric glucocorticoid coverage before thyroid hormone.',
    'Severe hypothyroidism can coexist with adrenal insufficiency. Steroid coverage protects against that unresolved risk before levothyroxine; laboratory confirmation is not a treatment gate.');
  if (patient.levothyroxineAtTick === null) return prompt('myxedema-thyroxine', true,
    'Steroid coverage is recorded. Start the qualified IV levothyroxine pathway.',
    'Levothyroxine replaces thyroid hormone. The required order is now satisfied; there is no extra timed wait, score threshold, or laboratory result to unlock treatment in this lesson.');
  if (patient.supportiveCareAtTick === null || !patient.supportActive) return prompt('myxedema-parallel-care', true,
    'Keep qualified help and supportive care alongside breathing and hormone treatment.',
    'Circulation, careful temperature management, metabolic problems, and the suspected trigger still need attention. The treatment requests do not complete the emergency response.');
  if (patient.ventilationDueInSeconds !== null) return prompt('myxedema-observe-breathing', false,
    'Continue close respiratory assessment while qualified ventilation is underway.',
    'The 5-minute ventilation checkpoint is an authored teaching contrast, not a clinical response prediction or a reason to wait if the person worsens.');
  if (!patient.respiratorySupportObserved) return prompt('myxedema-check-breathing', true,
    'Request a new bedside and blood-gas reassessment of breathing support.',
    'A ventilation request is not an observed response. Review breathing, alertness, oxygenation, and carbon dioxide together; supported values do not prove independent breathing.');
  if (patient.responseDueInSeconds !== null) return prompt('myxedema-ongoing-care', false,
    'Continue treatment and frequent assessment beyond the early breathing response.',
    'The 1-hour complete-care checkpoint is authored partial stabilization, not thyroid-hormone kinetics. The earlier observation stays historical; never wait for the checkpoint if the patient worsens.');
  if (!patient.responseObserved) return prompt('myxedema-fresh-assessment', true,
    'What does a fresh whole-person reassessment show now?',
    'An earlier respiratory observation cannot establish the later response. Review breathing, circulation, temperature, and mental status while ongoing support remains necessary.');
  return prompt('myxedema-handoff', false, 'Hand off an active illness with clear ownership.',
    'Include ventilation, steroid and thyroid-treatment timing, current observations, and unresolved trigger and metabolic risks. Partial improvement is not recovery or discharge clearance.');
}
