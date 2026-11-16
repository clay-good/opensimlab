/**
 * Framework mapping, for any module
 * (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * The anaesthesia module wrote these four functions first, against its own
 * scenarios and its own frameworks. A second module mapping to a second reading
 * would have copied them, and the copy would have been the place the two
 * surfaces drifted apart - one reporting its uncovered domains and the other
 * quietly dropping them. They take their data as arguments instead, so every
 * module's coverage is computed by the same code and says the same kind of
 * thing.
 *
 * The rule those functions encode: what is not covered is reported, never
 * omitted. An unmapped scenario is listed by name, a domain no lesson touches
 * keeps its row, and a mapping that names something which does not exist is an
 * error rather than a silent no-op.
 */

import type { Scenario } from '@anesthesia/scenarios/types';
import type { FrameworkDomainRecord, FrameworkRecord } from './framework-records';

/** One scenario's claim on one framework domain. */
export interface ScenarioMapping {
  readonly scenarioId: string;
  readonly frameworkId: string;
  readonly domainId: string;
  /**
   * Which of the scenario's own objectives carry this domain. Naming them keeps
   * the mapping falsifiable: a reader can open the scenario and check.
   */
  readonly objectiveIds: readonly string[];
}

export interface DomainCoverage {
  readonly domain: FrameworkDomainRecord;
  readonly scenarios: readonly Scenario[];
}

/** One module's mapping: its lessons, its readings, and the claims between them. */
export interface CurriculumModule {
  /** The module's route segment, which is also its id on every other surface. */
  readonly moduleRoute: string;
  readonly displayName: string;
  readonly frameworks: readonly FrameworkRecord[];
  readonly scenarios: readonly Scenario[];
  readonly mappings: readonly ScenarioMapping[];
}

/** Every domain in a framework, covered or not. Uncovered domains are kept. */
export function coverageOf(
  framework: FrameworkRecord,
  scenarios: readonly Scenario[],
  mappings: readonly ScenarioMapping[],
): DomainCoverage[] {
  return framework.domains.map((domain) => ({
    domain,
    scenarios: scenarios.filter((scenario) => mappings.some(
      (mapping) => mapping.frameworkId === framework.id
        && mapping.domainId === domain.id
        && mapping.scenarioId === scenario.metadata.id,
    )),
  }));
}

/** Scenarios with no mapping at all, reported rather than omitted. */
export function unmappedIn(
  scenarios: readonly Scenario[],
  mappings: readonly ScenarioMapping[],
): Scenario[] {
  return scenarios.filter(
    (scenario) => !mappings.some((mapping) => mapping.scenarioId === scenario.metadata.id),
  );
}

/** Mappings naming a scenario, framework, domain or objective that does not exist. */
export function danglingIn(
  frameworks: readonly FrameworkRecord[],
  scenarios: readonly Scenario[],
  mappings: readonly ScenarioMapping[],
): ScenarioMapping[] {
  return mappings.filter((mapping) => {
    const framework = frameworks.find((entry) => entry.id === mapping.frameworkId);
    const scenario = scenarios.find((entry) => entry.metadata.id === mapping.scenarioId);
    if (!framework || !scenario) return true;
    if (!framework.domains.some((domain) => domain.id === mapping.domainId)) return true;
    const objectiveIds = new Set(scenario.metadata.objectives.map((objective) => objective.id));
    return mapping.objectiveIds.some((id) => !objectiveIds.has(id));
  });
}

/** One CSV cell, quoted so a comma or a quote inside it cannot break the row. */
function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export const MAPPING_CSV_NOTE = 'Open Sim Lab curriculum mapping. '
  + 'These mappings are Open Sim Lab\'s own reading of published framework documents. '
  + 'No accrediting or certifying body has reviewed, endorsed or recognised them. '
  + 'Time spent in this simulator does not count toward any case requirement, clinical '
  + 'hour or supervised experience.';

/**
 * The mapping as CSV, for a programme's own documentation.
 *
 * The disclaimer is the first row rather than a footnote, because a spreadsheet
 * gets pasted into documents where the surrounding page does not travel with it.
 * Every module in the list contributes its own rows, including its uncovered
 * domains and its unmapped lessons.
 */
export function curriculumCsv(modules: readonly CurriculumModule[]): string {
  const rows: string[] = [
    cell(`NOTE: ${MAPPING_CSV_NOTE}`),
    [
      'module', 'framework', 'framework_body', 'framework_version', 'domain', 'domain_label',
      'scenario', 'scenario_title', 'difficulty', 'estimated_minutes', 'objectives',
    ].map(cell).join(','),
  ];

  for (const module of modules) {
    for (const framework of module.frameworks) {
      for (const { domain, scenarios } of coverageOf(framework, module.scenarios, module.mappings)) {
        if (scenarios.length === 0) {
          rows.push([
            module.moduleRoute, framework.id, framework.body, framework.version, domain.id,
            domain.label, '', 'NO SCENARIO COVERS THIS DOMAIN', '', '', '',
          ].map(cell).join(','));
          continue;
        }
        for (const scenario of scenarios) {
          const objectives = module.mappings.find(
            (mapping) => mapping.frameworkId === framework.id
              && mapping.domainId === domain.id
              && mapping.scenarioId === scenario.metadata.id,
          )?.objectiveIds ?? [];
          rows.push([
            module.moduleRoute, framework.id, framework.body, framework.version, domain.id,
            domain.label, scenario.metadata.id, scenario.metadata.title,
            scenario.metadata.difficulty, String(scenario.metadata.estimatedMinutes),
            objectives.join('; '),
          ].map(cell).join(','));
        }
      }
    }
    for (const scenario of unmappedIn(module.scenarios, module.mappings)) {
      rows.push([
        module.moduleRoute, '', '', '', '', 'UNMAPPED', scenario.metadata.id,
        scenario.metadata.title, scenario.metadata.difficulty,
        String(scenario.metadata.estimatedMinutes), '',
      ].map(cell).join(','));
    }
  }
  return `${rows.join('\n')}\n`;
}
