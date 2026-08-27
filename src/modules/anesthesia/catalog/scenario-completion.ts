import type { Scenario } from '@anesthesia/scenarios/types';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { adrenalCompletionEvidence, hypoglycemiaCompletionEvidence } from '../../endocrine-metabolic/completion';
import { thyroidCompletionEvidence } from '../../endocrine-metabolic/thyroid-completion';
import { myxedemaCompletionEvidence } from '../../endocrine-metabolic/myxedema-completion';
import { hypercalcemiaCompletionEvidence } from '../../endocrine-metabolic/hypercalcemia-completion';
import { hypocalcemiaCompletionEvidence } from '../../endocrine-metabolic/hypocalcemia-completion';
import { hyponatremiaCorrectionCompletionEvidence } from '../../endocrine-metabolic/hyponatremia-correction-completion';
import { avpDeficiencyCompletionEvidence } from '../../endocrine-metabolic/avp-deficiency-completion';
import {
  COMPLETION_SCHEMA_VERSION,
  type CompletionRequirementAudit,
  type CompletionRequirementId,
  type CompletionStatus,
  type FidelityClass,
  type ScenarioEnvironment,
  type ScenarioCompletionAudit,
  type ScenarioCompletionCatalog,
} from '@platform/catalog/scenario-completion';

const requirement = (
  id: CompletionRequirementId,
  status: CompletionStatus,
  ...evidence: string[]
): CompletionRequirementAudit => ({ id, status, evidence });

/** Audit one legacy scenario without changing or embellishing its behavior. */
export function auditClinicalScenario(
  scenario: Scenario,
  capabilityVersion: string,
  moduleId: string,
  environment: ScenarioEnvironment,
  fidelityClass: FidelityClass = 'closed_loop_physiology',
): ScenarioCompletionAudit {
  const objectiveIds = new Set(scenario.metadata.objectives.map((objective) => objective.id));
  const rubricIds = new Set(scenario.debrief.rubric.map((item) => item.objectiveId));
  const objectivesObservable = scenario.metadata.objectives.length >= 2
    && scenario.metadata.objectives.length <= 5
    && [...objectiveIds].every((id) => rubricIds.has(id));
  const hasProgression = scenario.timeline.some((event) => event.type !== 'narrative');
  const scenarioErrors = validateScenario(scenario);
  const hasSources = scenario.metadata.clinicalReview.sources.length > 0;
  const hasLimitations = (scenario.metadata.limitations?.length ?? 0) > 0;

  const requirements: CompletionRequirementAudit[] = [
    requirement('identity-and-versions', 'satisfied',
      `Scenario ${scenario.metadata.id} carries stable content version ${scenario.metadata.version}.`,
      `Capability version ${capabilityVersion} is bound by this audit.`),
    requirement('bounded-fictional-patient', scenarioErrors.length === 0 ? 'satisfied' : 'missing',
      scenarioErrors.length === 0
        ? 'The declarative scenario schema validates a bounded fictional patient profile.'
        : `The declarative scenario schema reports ${scenarioErrors.length} error(s).`),
    requirement('observable-objectives', objectivesObservable ? 'satisfied' : 'missing',
      objectivesObservable
        ? `${scenario.metadata.objectives.length} objectives map to debrief rubric evidence.`
        : 'The completion contract requires 2–5 objectives and a rubric mapping for every objective.'),
    requirement('deterministic-seed-policy', 'missing',
      'The legacy scenario document does not declare a seed policy.'),
    requirement('meaningful-progression', hasProgression ? 'satisfied' : 'missing',
      hasProgression
        ? 'The timeline contains at least one non-narrative state event.'
        : 'No non-narrative state progression is declared.'),
    requirement('meaningful-actions-and-choices', 'missing',
      'Accepted actions, refused actions, and clinically distinct choices are not yet declared in a completion sidecar.'),
    requirement('shared-capability-consequences', 'satisfied',
      'The scenario executes through the shared deterministic anesthesia engine rather than a display-only script.'),
    requirement('bounded-stop-condition', 'missing',
      'The legacy scenario document does not declare a stop condition or bounded outcome space.'),
    requirement('guidance-and-demonstration', 'missing',
      'Guidance rules and an expert demonstration are not bound to this content version.'),
    requirement('debrief-and-counterfactual', 'missing',
      'A PEARLS debrief exists, but no required per-scenario counterfactual record is declared.'),
    requirement('source-provenance', hasSources ? 'satisfied' : 'missing',
      hasSources
        ? `${scenario.metadata.clinicalReview.sources.length} source citation(s) are declared.`
        : 'No authoritative source citation is declared.'),
    requirement('scenario-specific-limitations', hasLimitations ? 'satisfied' : 'missing',
      hasLimitations
        ? `${scenario.metadata.limitations?.length ?? 0} limitation record(s) are linked.`
        : 'No scenario-specific limitation record is linked.'),
    requirement('reference-transcripts', 'missing',
      'Expert, common-error, and recovery transcript fixtures are not all bound to this scenario version.'),
    requirement('inclusive-runtime-verification', 'missing',
      'Per-scenario keyboard, screen-reader, reduced-motion, color-vision, 320 px, offline, replay, and performance evidence is not complete.'),
    requirement('report-control-coverage', 'missing',
      'The shared report control is not yet implemented on briefing, live, debrief, and provenance surfaces.'),
  ];

  const exactEvidence = new Map([
    ...hypoglycemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...adrenalCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...thyroidCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...myxedemaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...hypercalcemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...hypocalcemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...hyponatremiaCorrectionCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...avpDeficiencyCompletionEvidence(scenario, capabilityVersion, moduleId),
  ].map((entry) => [entry.id, entry]));
  const auditedRequirements = requirements.map((entry) => exactEvidence.get(entry.id) ?? entry);
  return {
    scenarioId: scenario.metadata.id,
    title: scenario.metadata.title,
    moduleId,
    environment,
    estimatedMinutes: scenario.metadata.estimatedMinutes,
    difficulty: scenario.metadata.difficulty,
    prerequisites: [],
    practiceRegions: ['US', 'GB'],
    fidelityClass,
    contentVersion: scenario.metadata.version,
    capabilityVersion,
    maturity: scenario.metadata.maturity,
    complete: auditedRequirements.every((entry) => entry.status === 'satisfied'),
    requirements: auditedRequirements,
  };
}

export function auditAnesthesiaScenario(
  scenario: Scenario,
  capabilityVersion: string,
): ScenarioCompletionAudit {
  return auditClinicalScenario(
    scenario, capabilityVersion, 'anesthesia', 'operating-room', 'closed_loop_physiology',
  );
}

export function buildModuleCompletionCatalog(
  scenarios: readonly Scenario[],
  capabilityVersion: string,
  moduleId: string,
  environment: ScenarioEnvironment | ((scenario: Scenario) => ScenarioEnvironment),
  fidelityClass: FidelityClass = 'closed_loop_physiology',
): ScenarioCompletionCatalog {
  const records = scenarios.map((scenario) => auditClinicalScenario(
    scenario, capabilityVersion, moduleId,
    typeof environment === 'function' ? environment(scenario) : environment,
    fidelityClass,
  ));
  return {
    schemaVersion: COMPLETION_SCHEMA_VERSION,
    moduleId,
    capabilityVersion,
    scenarioCount: records.length,
    completeScenarioCount: records.filter((record) => record.complete).length,
    scenarios: records,
  };
}

export function buildAnesthesiaCompletionCatalog(
  scenarios: readonly Scenario[],
  capabilityVersion: string,
): ScenarioCompletionCatalog {
  return buildModuleCompletionCatalog(
    scenarios, capabilityVersion, 'anesthesia', 'operating-room', 'closed_loop_physiology',
  );
}
