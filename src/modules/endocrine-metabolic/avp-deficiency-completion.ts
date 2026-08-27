import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { HYPERNATREMIC_DEHYDRATION_AVP_DEFICIENCY } from './scenarios/hypernatremic-dehydration-avp-deficiency';
import { AVP_DEFICIENCY_FIXTURES } from './avp-deficiency-fixtures';
import { AVP_DEFICIENCY_DEMONSTRATION_VERSION } from './demo/avp-deficiency-demonstration';

export function avpDeficiencyCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'endocrine-metabolic' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== AVP_DEFICIENCY_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.1'
    || AVP_DEFICIENCY_FIXTURES.contentVersion !== '0.1.1'
    || JSON.stringify(scenario) !== JSON.stringify(HYPERNATREMIC_DEHYDRATION_AVP_DEFICIENCY)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['Fixed authored circulation, sodium, and urine findings bind exact-version expert, common-error, recovery, and no-action fixtures to seed 4919. No calculated fluid deficit, prescribing kinetics, or probabilistic injury outcome is modeled.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['Volume restoration can reveal large dilute urine losses in known AVP deficiency. Water replacement and restoration of prescribed desmopressin address different problems; neither a better blood pressure nor lower urine output proves sodium normalization. Unrequested laboratory and urine findings remain private.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Ten dose-free choices cover urgent support, context review, volume restoration, monitoring, requested reassessment, water replacement, desmopressin restoration, handoff, and retained normalization or blanket-withholding mistakes. Volume restoration has no administrative gate; qualified water and desmopressin requests become independently available after circulation is restored.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['Continuing-care handoff or instructor takeover ends the rehearsal. Authored response and stop clocks are teaching boundaries, not safe waiting intervals, predicted drug effects, or proof of durable recovery.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Event-bound objectives distinguish circulation, qualified water-balance care, surveillance, historical observations, and continuing-care handoff. Earlier mistakes remain available after later correction.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['avp-deficiency-fixtures.ts binds expert, commonError, recovery, and noAction to content 0.1.1 and seed 4919. Whole-state replay must remain identical without inferring that improving findings establish recovery.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Observed-state tutoring supports Guided, Coached, and Unassisted. Worked example ${AVP_DEFICIENCY_DEMONSTRATION_VERSION} pauses before each decision and requires explicit historical observations; reporting is not permission to resume accelerated practice.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Engineering model, replay, and nonvisual checks do not establish full exact-version screen-reader, keyboard, reduced-motion, color-vision, phone, zoom, offline, and performance evidence.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The shared private report path still requires complete inclusive coverage and production Turnstile/D1 evidence for this exact version. Local context and modal tests are not production verification.'] },
  ];
}
