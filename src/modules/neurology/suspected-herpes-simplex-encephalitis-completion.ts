import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { SUSPECTED_HERPES_SIMPLEX_ENCEPHALITIS } from './scenarios/suspected-herpes-simplex-encephalitis';
import { ENCEPHALITIS_FIXTURES } from './suspected-herpes-simplex-encephalitis-fixtures';
import { ENCEPHALITIS_TUTOR_VERSION } from './tutor/suspected-herpes-simplex-encephalitis-guidance';
import { ENCEPHALITIS_DEMONSTRATION_VERSION } from './demo/suspected-herpes-simplex-encephalitis-demonstration';

/**
 * Exact-version evidence for one lesson, and no claim about any other.
 *
 * `observable-objectives` is deliberately not answered here. This scenario
 * declares six objectives against a cap of five, which is a content-design
 * decision affecting scenarios across several modules rather than something
 * this file may settle on its own. The shared audit keeps naming it.
 */
export function encephalitisCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'neurology' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== ENCEPHALITIS_FIXTURES.scenarioId
    || scenario.metadata.version !== '0.1.0' || ENCEPHALITIS_FIXTURES.contentVersion !== '0.1.0'
    || ENCEPHALITIS_FIXTURES.seed !== 6474
    || ENCEPHALITIS_TUTOR_VERSION !== '0.1.0' || ENCEPHALITIS_DEMONSTRATION_VERSION !== '0.1.0'
    || JSON.stringify(scenario) !== JSON.stringify(SUSPECTED_HERPES_SIMPLEX_ENCEPHALITIS)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['suspected-herpes-simplex-encephalitis-fixtures.ts binds seed 6474 and content 0.1.0 to expert, looked-before-treating error, recovery, and no-action paths. The presentation, the blood and CSF panel, and the fixed 4-hour MRI, EEG and PCR report are authored constants; no viral, antiviral or imaging model is claimed, and no outcome follows from any choice. tests/integration/suspected-herpes-simplex-encephalitis-runs.test.ts replays every path frame-for-frame across all three guidance levels and both practice regions.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['The lesson advances through six recorded steps on the shared simulation clock, two of them time-gated: the later report refuses until simulated time has passed since the diagnostic review, and the handoff refuses until time has passed since that. The order itself is the progression — the antiviral pathway is activated before the imaging, EEG, CSF and PCR are read, which is what makes the negative result at the end survivable.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['Six declared decisions put the fever, the new cognition and the focal seizure in one syndrome, bring neurological, infection, airway-capable and seizure ownership in immediately, start the empiric antiviral pathway ahead of every test, read the MRI, EEG, CSF, etiologic and nonconvulsive-seizure boundaries afterwards, compare a fixed later report, and hand off active risk. Order is enforced rather than suggested, and refusal names the missing step. The lesson takes no history, examines nobody, acquires no CSF, interprets no imaging or EEG, and selects no drug or dose.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['The branch ends at active-risk handoff. Later actions cannot restart an ended branch, and the ending certifies no identified pathogen, no proven treatment effect, no durable neurologic stability, no disposition, and no outcome.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['src/modules/anesthesia/ui/Debrief.tsx maps all six objectives to accepted engine events; the no-action path meets none and the expert path meets all six. Refused out-of-order attempts stay visible in the transcript after a correct recovery, which is the authored counterfactual: the same run that went to look at the MRI, EEG and CSF before committing can still reach a correct handoff.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['suspected-herpes-simplex-encephalitis-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways to seed 6474 for deterministic replay through the shared engine, including the two time-gated checkpoints.'] },
    { id: 'guidance-and-demonstration', status: 'satisfied', evidence: [`Six observed-state prompts at version ${ENCEPHALITIS_TUTOR_VERSION} read the learner's own recorded steps; unassisted is silent and coached withholds the single non-urgent beat. Worked example ${ENCEPHALITIS_DEMONSTRATION_VERSION} drives the ordinary controls through the real engine to handoff. The bacterial-meningitis lesson runs its treatment clock alongside its diagnostic clock; this one puts treatment in front, and the ending is what justifies the difference. A CSF HSV PCR drawn about eighteen hours after the neurobehavioral symptoms began comes back negative in a man whose MRI shows left mesial-temporal and insular FLAIR change with restricted diffusion and whose EEG shows left temporal lateralized periodic discharges. An early negative does not exclude this, which is precisely why the antiviral could not have waited for it — every test in front of the clinician can be normal, pending or negative in someone who has this, so treatment that waits for certainty arrives late in the one condition where late is what does the damage. Both also keep the EEG a captured window with a witnessed focal seizure already behind him, so nonconvulsive seizure stays live and would look like the drowsiness already present, and both keep autoimmune, vascular, neoplastic, toxic-metabolic, postictal and medication causes open. The ending is repeat testing rather than reassurance. A test asserts nothing anywhere interprets the MRI or EEG, names a pathogen, or picks a regimen. tests/unit/suspected-herpes-simplex-encephalitis-demonstration.test.ts and tests/ui/neurology-suspected-herpes-simplex-encephalitis.test.tsx verify observed response, silence when unassisted, stable controls while watching, and version binding.`] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Automated UI, observed-state and replay checks exist. Exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation remains pending.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['The scenario inherits the shared report control and has an exact-version Worker catalog record. Complete four-surface runtime evidence is not yet bound.'] },
  ];
}
