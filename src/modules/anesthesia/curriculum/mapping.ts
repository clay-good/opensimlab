/**
 * Which scenario teaches toward which framework domain, and how complete that
 * coverage is (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * Mappings are data rather than prose so a program director can filter them and
 * export them for programme documentation. An unmapped scenario is reported AS
 * unmapped rather than omitted, because a coverage claim that quietly drops what
 * it cannot account for is not a coverage claim.
 */

import { SCENARIOS } from '../scenarios';
import type { Scenario } from '../scenarios/types';
import { FRAMEWORKS, type Framework, type FrameworkDomain } from './frameworks';

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

export const SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- Routine induction ---------------------------------------------------
  {
    scenarioId: 'routine-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['preoxygenate', 'hysteresis', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-sciences',
    objectiveIds: ['hysteresis', 'manage-hypotension', 'blunt-incision'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['ventilate-before-desaturation'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['hysteresis', 'blunt-incision'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'coa-standards',
    domainId: 'physiology-and-pathophysiology',
    objectiveIds: ['manage-hypotension', 'preoxygenate'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'coa-standards',
    domainId: 'anesthesia-equipment-and-monitoring',
    objectiveIds: ['ventilate-before-desaturation'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-pharmacologic-management',
    objectiveIds: ['hysteresis', 'blunt-incision'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: ['preoxygenate', 'manage-hypotension'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'mk-applied-foundational-science',
    objectiveIds: ['hysteresis', 'manage-hypotension'],
  },

  // --- Rapid desaturation --------------------------------------------------
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['preoxygenate', 'limit-attempts', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['preoxygenate', 'hysteresis'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: ['limit-attempts', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['limit-attempts'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['limit-attempts', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['limit-attempts', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-preanesthetic-evaluation',
    objectiveIds: ['preoxygenate'],
  },

  // --- Hypotension after induction ----------------------------------------
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['dose-for-the-patient', 'read-the-mechanism', 'manage-hypotension'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-sciences',
    objectiveIds: ['read-the-mechanism'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'coa-standards',
    domainId: 'physiology-and-pathophysiology',
    objectiveIds: ['read-the-mechanism', 'manage-hypotension'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['read-the-mechanism', 'dose-for-the-patient'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['dose-for-the-patient'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: ['dose-for-the-patient', 'read-the-mechanism'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-monitoring-and-equipment',
    objectiveIds: ['read-the-mechanism'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'mk-applied-foundational-science',
    objectiveIds: ['read-the-mechanism'],
  },

  // --- Bronchospasm --------------------------------------------------------
  //
  // This scenario shipped unmapped. It was reported as unmapped, which is the
  // machinery working, but the educators page said every scenario was mapped —
  // so a programme director reading the coverage page saw three of four
  // scenarios under a claim that it was all of them.
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-sciences',
    objectiveIds: ['read-the-capnogram', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['read-the-capnogram'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['ventilate-before-desaturation', 'deepen-before-reaching-for-anything-else'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['deepen-before-reaching-for-anything-else', 'manage-hypotension'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'coa-standards',
    domainId: 'anesthesia-equipment-and-monitoring',
    objectiveIds: ['read-the-capnogram'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: ['ventilate-before-desaturation', 'deepen-before-reaching-for-anything-else'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'coa-standards',
    domainId: 'physiology-and-pathophysiology',
    objectiveIds: ['read-the-capnogram', 'manage-hypotension'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['deepen-before-reaching-for-anything-else', 'manage-hypotension'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: ['deepen-before-reaching-for-anything-else', 'manage-hypotension'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['ventilate-before-desaturation'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-monitoring-and-equipment',
    objectiveIds: ['read-the-capnogram'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['deepen-before-reaching-for-anything-else', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'mk-applied-foundational-science',
    objectiveIds: ['read-the-capnogram'],
  },

  // --- Unexpected intraoperative hemorrhage ------------------------------
  {
    scenarioId: 'unexpected-intraoperative-hemorrhage',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['recognize-hemorrhage', 'temporize-volume-loss', 'manage-hypotension'],
  },
  {
    scenarioId: 'unexpected-intraoperative-hemorrhage',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['recognize-hemorrhage', 'avoid-full-dose-induction'],
  },
  {
    scenarioId: 'unexpected-intraoperative-hemorrhage',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['recognize-hemorrhage', 'temporize-volume-loss', 'manage-hypotension'],
  },

  // --- Rapid-sequence induction ------------------------------------------
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['preoxygenate-before-induction', 'protect-the-apnea-margin'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['wait-for-intubating-block', 'secure-and-confirm'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['wait-for-intubating-block', 'secure-and-confirm'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: ['protect-the-apnea-margin', 'secure-and-confirm'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['wait-for-intubating-block'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['preoxygenate-before-induction', 'wait-for-intubating-block'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-preanesthetic-evaluation',
    objectiveIds: ['preoxygenate-before-induction'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-pharmacologic-management',
    objectiveIds: ['wait-for-intubating-block'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['protect-the-apnea-margin', 'secure-and-confirm'],
  },
];

export interface DomainCoverage {
  readonly domain: FrameworkDomain;
  readonly scenarios: readonly Scenario[];
}

/** Every domain in a framework, covered or not. Uncovered domains are kept. */
export function coverageFor(framework: Framework): DomainCoverage[] {
  return framework.domains.map((domain) => ({
    domain,
    scenarios: SCENARIOS.filter((scenario) => SCENARIO_MAPPINGS.some(
      (mapping) => mapping.frameworkId === framework.id
        && mapping.domainId === domain.id
        && mapping.scenarioId === scenario.metadata.id,
    )),
  }));
}

/** Scenarios with no mapping at all, reported rather than omitted. */
export function unmappedScenarios(): Scenario[] {
  return SCENARIOS.filter(
    (scenario) => !SCENARIO_MAPPINGS.some((mapping) => mapping.scenarioId === scenario.metadata.id),
  );
}

/** Mappings naming a scenario, framework or domain that does not exist. */
export function danglingMappings(): ScenarioMapping[] {
  return SCENARIO_MAPPINGS.filter((mapping) => {
    const framework = FRAMEWORKS.find((entry) => entry.id === mapping.frameworkId);
    const scenario = SCENARIOS.find((entry) => entry.metadata.id === mapping.scenarioId);
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

/**
 * The mapping as CSV, for a programme's own documentation.
 *
 * The disclaimer is the first row rather than a footnote, because a spreadsheet
 * gets pasted into documents where the surrounding page does not travel with it.
 */
export function mappingCsv(): string {
  const rows: string[] = [
    cell(`NOTE: ${'Open Sim Lab curriculum mapping. '
      + 'These mappings are Open Sim Lab\'s own reading of published framework documents. '
      + 'No accrediting or certifying body has reviewed, endorsed or recognised them. '
      + 'Time spent in this simulator does not count toward any case requirement, clinical '
      + 'hour or supervised experience.'}`),
    [
      'framework', 'framework_body', 'framework_version', 'domain', 'domain_label',
      'scenario', 'scenario_title', 'difficulty', 'estimated_minutes', 'objectives',
    ].map(cell).join(','),
  ];

  for (const framework of FRAMEWORKS) {
    for (const { domain, scenarios } of coverageFor(framework)) {
      if (scenarios.length === 0) {
        rows.push([
          framework.id, framework.body, framework.version, domain.id, domain.label,
          '', 'NO SCENARIO COVERS THIS DOMAIN', '', '', '',
        ].map(cell).join(','));
        continue;
      }
      for (const scenario of scenarios) {
        const mapping = SCENARIO_MAPPINGS.find(
          (entry) => entry.frameworkId === framework.id
            && entry.domainId === domain.id
            && entry.scenarioId === scenario.metadata.id,
        );
        rows.push([
          framework.id, framework.body, framework.version, domain.id, domain.label,
          scenario.metadata.id, scenario.metadata.title, scenario.metadata.difficulty,
          String(scenario.metadata.estimatedMinutes),
          (mapping?.objectiveIds ?? []).join('; '),
        ].map(cell).join(','));
      }
    }
  }

  for (const scenario of unmappedScenarios()) {
    rows.push([
      '', '', '', '', 'UNMAPPED',
      scenario.metadata.id, scenario.metadata.title, scenario.metadata.difficulty,
      String(scenario.metadata.estimatedMinutes), '',
    ].map(cell).join(','));
  }

  return `${rows.join('\n')}\n`;
}
