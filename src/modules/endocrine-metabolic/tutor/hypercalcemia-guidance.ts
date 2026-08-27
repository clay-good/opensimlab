import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HypercalcemiaSnapshot } from '@platform/kernel/protocol';

export const HYPERCALCEMIA_SOURCE_HREF = 'https://doi.org/10.1530/EC-16-0055';
export const HYPERCALCEMIA_ES_SOURCE_HREF = 'https://doi.org/10.1210/clinem/dgac621';
export const HYPERCALCEMIA_SOURCE_ID = 'sfe-emergency-hypercalcemia-2016';
export const HYPERCALCEMIA_ES_SOURCE_ID = 'endocrine-society-hcm-2023';

/** Guidance reads accepted state; it never advances treatment or observation. */
export function hypercalcemiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly hypercalcemia?: HypercalcemiaSnapshot;
}) {
  const patient = input.hypercalcemia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because, sourceHref: HYPERCALCEMIA_ES_SOURCE_HREF };
  if (patient.fluidsAtTick === null) return prompt('hypercalcemia-volume', true,
    'Restore circulation with qualified, individualized hydration.',
    'Dehydration needs treatment, but heart failure and kidney disease make unrestricted fluid unsafe. This request includes immediate bedside volume and cardiac assessment; the separate review button is not a hydration gate.');
  if (patient.calcitoninAtTick === null) return prompt('hypercalcemia-bridge', true,
    'Start the qualified calcitonin bridge alongside urgent care.',
    'A short bridge can lower calcium sooner while longer-acting treatment takes effect. It does not replace antiresorptive treatment, and the lesson does not choose a dose.');
  if (patient.cardiorenalAssessedAtTick === null) return prompt('hypercalcemia-cardiorenal', true,
    'Review the supplied cardiac and renal risk for the treatment plan.',
    'HFpEF, CKD stage 3b, and creatinine above baseline affect fluid tolerance and antiresorptive selection. Qualified review should guide that selection without delaying hydration or calcitonin.');
  if (patient.antiresorptiveAtTick === null) return prompt('hypercalcemia-antiresorptive', true,
    'Start the qualified longer-acting antiresorptive pathway.',
    'Antiresorptive treatment reduces calcium release from bone. Its effect is not immediate; do not wait for hydration to finish before arranging it. Agent and dose selection remain outside this lesson.');
  if (!patient.supportActive) return prompt('hypercalcemia-support', true,
    'Bring qualified support and ongoing monitoring into the plan.',
    'This severe malignancy-related emergency needs shared ownership of circulation, kidney function, serial calcium, and cancer-directed care. Treatment requests alone do not complete the response.');
  if (patient.fluidDueInSeconds !== null) return prompt('hypercalcemia-observe-volume', false,
    'Monitor circulation and fluid tolerance throughout hydration.',
    'The 15-minute fluid checkpoint is an authored teaching contrast, not a prescribed reassessment interval. Never wait for it if the person worsens.');
  if (!patient.fluidResponseObserved) return prompt('hypercalcemia-check-volume', true,
    'Request a fresh assessment of circulation, calcium, and fluid tolerance.',
    'Accepted hydration is not an observed response. Better blood pressure does not establish that calcium has fallen or that more fluid is tolerated.');
  if (patient.bridgeDueInSeconds !== null) return prompt('hypercalcemia-observe-bridge', false,
    'Continue care and frequent assessment while the bridge is underway.',
    'The 4-hour checkpoint is an authored partial response, not an instruction to leave the patient unobserved. The previous calcium result remains historical; pause or take the controls whenever needed.');
  if (!patient.bridgeResponseObserved) return prompt('hypercalcemia-check-bridge', true,
    'Request a fresh calcium and bedside assessment.',
    'An earlier result cannot establish the later response. Review calcium, mental status, circulation, breathing, and fluid tolerance together.');
  return prompt('hypercalcemia-handoff', false, 'Hand off ongoing treatment, not a resolved calcium problem.',
    'Name who will review serial calcium, renal function, fluid balance, the short bridge, longer-acting treatment, and cancer care. Partial improvement is not recovery or discharge readiness.');
}
