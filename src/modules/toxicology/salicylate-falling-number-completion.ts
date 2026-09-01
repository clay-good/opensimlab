import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { SALICYLATE_FALLING_NUMBER } from './scenarios/salicylate-falling-number';
import { SALICYLATE_FIXTURES } from './salicylate-falling-number-fixtures';
import { SALICYLATE_TUTOR_VERSION } from './tutor/salicylate-falling-number-guidance';
import { SALICYLATE_DEMONSTRATION_VERSION } from './demo/salicylate-falling-number-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across several modules rather than something
 * this file may settle on its own. The shared audit keeps naming it.
 */
export function salicylateCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'toxicology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== SALICYLATE_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || SALICYLATE_FIXTURES.contentVersion !== '0.1.0'
    || SALICYLATE_FIXTURES.seed !== 5427
    || SALICYLATE_TUTOR_VERSION !== '0.1.0' || SALICYLATE_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(SALICYLATE_FALLING_NUMBER)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['salicylate-falling-number-fixtures.ts binds seed 5427 and content 0.1.0 to expert, treat-on-the-number error, recovery, and no-action paths. The presentation, the 7-hour concentration with its gas and chemistry set, and the fixed 9-hour deterioration report are authored constants; no absorption, distribution, acid-base, alkalinization, or dialysis model is claimed, and no outcome follows from any choice. tests/integration/salicylate-falling-number-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the bounded alkalinization and dialysis-preparedness intent refuses until simulated time has passed since the evidence review, and the handoff refuses until time has passed since that. What moves is the patient rather than the diagnosis, and it moves the wrong way while one of her numbers improves.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions describe the breathing as compensation rather than distress, name what the near-normal pH is made of, call nephrology and the rest of the owners before the point of decision, read the acid-base, volume, potassium and airway hazard together, record bounded alkalinization and dialysis-preparedness intent, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, acquires or calculates nothing, and selects no charcoal, fluid, bicarbonate, potassium, dose, route, access, airway technique, ventilation setting, dialysis threshold, or modality.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no confirmed diagnosis, no proven tissue concentration, no proven or failed treatment effect, no excluded ongoing absorption or pulmonary complication, no determined dialysis eligibility, safety or disposition, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that committed on the concentration alone can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['salicylate-falling-number-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 5427 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${SALICYLATE_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${SALICYLATE_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. Three findings here read backwards and both say so each time: the pH of 7.45 is two disorders cancelling rather than a patient compensating well, the respiratory rate of 30 is the compensation holding that pH up rather than the distress, and the nine-hour concentration falls from 52 to 46 mg/dL while the pH, the bicarbonate, the potassium and her mental state all go the other way — which is ominous rather than improvement, and proves nothing about where the drug went. Both name the airway as this lesson's hazard, because taking over her breathing removes the hyperventilation holding the pH up and a falling pH drives salicylate into tissue; neither turns that into never, and neither selects a technique, setting, fluid, target, potassium replacement, dialysis threshold or modality. A test asserts nothing anywhere reads the falling number as improvement or proves a tissue shift. tests/unit/salicylate-falling-number-demonstration.test.ts and tests/ui/toxicology-salicylate-falling-number.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
