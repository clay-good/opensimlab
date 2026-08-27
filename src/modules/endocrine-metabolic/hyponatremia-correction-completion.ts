import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { HYPONATREMIA_AQUARESIS_AND_OVERCORRECTION } from './scenarios/hyponatremia-aquaresis-and-overcorrection';
import { HYPONATREMIA_CORRECTION_FIXTURES } from './hyponatremia-correction-fixtures';
import { HYPONATREMIA_CORRECTION_DEMONSTRATION_VERSION } from './demo/hyponatremia-correction-demonstration';

export function hyponatremiaCorrectionCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== HYPONATREMIA_CORRECTION_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || HYPONATREMIA_CORRECTION_FIXTURES.contentVersion !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(HYPONATREMIA_AQUARESIS_AND_OVERCORRECTION)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Fixed authored sodium and urine-output transitions with reference seed 4907 bind exact-version real-engine fixtures. No probabilistic ODS outcome is modeled.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['Emerging aquaresis can progress to excessive correction after hypertonic saline has stopped. Early control prevents a further authored rise; late control does not relower sodium. Latent laboratory values never appear as live measurements.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Nine dose-free choices cover support, risk and cause review, monitoring, requested assessment, water-loss control, conditional relowering, handoff, and retained normalization or symptom-wait mistakes. Qualified response requests do not await administrative acknowledgment.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Continuing-care handoff or instructor takeover ends the rehearsal. Untreated 120-minute and unfinished 240-minute stops are teaching bounds, not safe delays or predicted injury.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Five event-bound objectives cover the original correction window, surveillance, response, historical observations with retained peak, and handoff. Earlier mistakes remain visible after later correction.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['hyponatremia-correction-fixtures.ts binds expert, commonError, recovery, and noAction to content 0.1.0 and seed 4907. Recovery observes a rise of 9 from the original baseline before qualified combined response.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state tutoring supports Guided, Coached, and Unassisted. Worked example ${HYPONATREMIA_CORRECTION_DEMONSTRATION_VERSION} pauses before each decision and requires explicit later reassessment without implying a safe waiting interval.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Engineering model, replay, and nonvisual checks do not establish full exact-version screen-reader, keyboard, reduced-motion, color-vision, phone, zoom, offline, and performance evidence.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The shared private report path still requires complete inclusive coverage and production Turnstile/D1 evidence for this exact version. Local context and modal tests are not production verification.'] },
  ];
}
