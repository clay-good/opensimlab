/**
 * framework-mapping-expansion → neonatology mapped to the ACGME's Pediatrics
 * Milestones (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * The third mapped module, held to what the first two are held to: every lesson
 * mapped, every objective placed, every mapping falsifiable against the
 * objectives it cites, and every subcompetency nothing touches named rather
 * than dropped. Paediatrics divides its subcompetencies differently from
 * emergency medicine, so the uncovered set is its own rather than a copy.
 */
import { describe, expect, it } from 'vitest';
import { NEONATOLOGY_SCENARIOS } from '../../src/modules/neonatology/scenarios';
import {
  NEONATOLOGY_FRAMEWORKS, NEONATOLOGY_SCENARIO_MAPPINGS,
  NEONATOLOGY_UNCOVERED,
} from '../../src/modules/neonatology/curriculum';
import { ACGME_NEONATAL_PERINATAL_MILESTONES } from '@platform/curriculum/acgme-neonatal-perinatal';
import { coverageOf, danglingIn, unmappedIn } from '@platform/curriculum/mapping';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';

const FRAMEWORK = ACGME_NEONATAL_PERINATAL_MILESTONES;
const coverage = coverageOf(FRAMEWORK, NEONATOLOGY_SCENARIOS, NEONATOLOGY_SCENARIO_MAPPINGS);

describe('the ACGME neonatology reading', () => {
  it('is a well-formed reading with a re-check date', () => {
    expect(frameworkRecordProblems(FRAMEWORK)).toEqual([]);
    expect(FRAMEWORK.domains).toHaveLength(26);
    expect(new Set(FRAMEWORK.domains.map((domain) => domain.id)).size).toBe(26);
  });

  /**
   * The document says the Milestones are "designed only for use in evaluation
   * of residents in the context of their participation in ACGME-accredited
   * residency programs". A simulator is another context, so the reading has to
   * carry that sentence wherever it is shown.
   */
  it('carries the ACGME\'s own statement of what the Milestones are for', () => {
    expect(FRAMEWORK.note).toContain('designed only for use in evaluation of residents');
    expect(FRAMEWORK.note).toContain('not "designed to be relevant in any other context"');
    expect(FRAMEWORK.note).toMatch(/never evidence toward a milestone level/);
  });

  /** A level is a judgement about a resident. Recording them would invite it. */
  it('records subcompetency titles and no level descriptors', () => {
    for (const domain of FRAMEWORK.domains) {
      expect(domain.label).toMatch(/^(Patient Care|Medical Knowledge|Systems-Based Practice|Practice-Based Learning and Improvement|Professionalism|Interpersonal and Communication Skills) \d+: /);
      expect(domain.description).not.toMatch(/Level [1-5]/);
    }
  });
});

describe('every neonatology lesson is mapped', () => {
  it('leaves no lesson unmapped', () => {
    expect(unmappedIn(NEONATOLOGY_SCENARIOS, NEONATOLOGY_SCENARIO_MAPPINGS)
      .map((scenario) => scenario.metadata.id)).toEqual([]);
    expect(NEONATOLOGY_SCENARIOS).toHaveLength(11);
  });

  it('names no framework, domain, scenario or objective that does not exist', () => {
    expect(danglingIn(NEONATOLOGY_FRAMEWORKS, NEONATOLOGY_SCENARIOS,
      NEONATOLOGY_SCENARIO_MAPPINGS)).toEqual([]);
  });

  /**
   * The mapping is only falsifiable if every objective is accounted for: an
   * objective nobody placed is an objective nobody checked.
   */
  it('places every objective of every lesson at least once', () => {
    for (const scenario of NEONATOLOGY_SCENARIOS) {
      const placed = new Set(NEONATOLOGY_SCENARIO_MAPPINGS
        .filter((mapping) => mapping.scenarioId === scenario.metadata.id)
        .flatMap((mapping) => mapping.objectiveIds));
      for (const objective of scenario.metadata.objectives) {
        expect(placed, `${scenario.metadata.id} never places ${objective.id}`)
          .toContain(objective.id);
      }
    }
  });

  it('claims a lesson once per subcompetency, never twice', () => {
    const seen = new Set<string>();
    for (const mapping of NEONATOLOGY_SCENARIO_MAPPINGS) {
      const key = `${mapping.scenarioId}/${mapping.domainId}`;
      expect(seen, key).not.toContain(key);
      seen.add(key);
      expect(mapping.objectiveIds.length).toBeGreaterThan(0);
    }
  });
});

describe('what a delivery-room module claims', () => {
  /**
   * This reading separates family-centred communication from complex
   * communication around serious news. These lessons keep the parents present,
   * informed and in the plan - and never ask the learner to tell them something
   * that changes everything. Claiming the second because a handoff mentions
   * outcome risk would be the easy error, so it is held shut here.
   */
  it('claims family-centred communication and never serious news', () => {
    const domains = new Set(NEONATOLOGY_SCENARIO_MAPPINGS.map((mapping) => mapping.domainId));
    expect(domains.has('ics-1-family-centered-communication')).toBe(true);
    expect(domains.has('ics-4-complex-communication-around-serious-news')).toBe(false);
    expect(NEONATOLOGY_UNCOVERED['ics-4-complex-communication-around-serious-news'])
      .toMatch(/changes everything/);
  });

  /** A procedure subcompetency is claimed only where an objective names one. */
  it('claims procedures only from the objectives that name one', () => {
    for (const objective of NEONATOLOGY_SCENARIO_MAPPINGS
      .filter((mapping) => mapping.domainId === 'pc-6-procedures')
      .flatMap((mapping) => mapping.objectiveIds)) {
      expect(objective, objective).toMatch(/ventilation|compression|airway-clearing|cpap|suction/);
    }
  });

  /** Every lesson is a delivery-room lesson; none of them gets a baby home. */
  it('claims emergency stabilization and never discharge', () => {
    const domains = new Set(NEONATOLOGY_SCENARIO_MAPPINGS.map((mapping) => mapping.domainId));
    expect(domains.has('pc-7-emergency-stabilization')).toBe(true);
    expect(domains.has('pc-8-discharge-from-the-nicu')).toBe(false);
  });
});

describe('what this module does not cover', () => {
  it('matches the uncovered subcompetencies to the reasons recorded for them', () => {
    const uncovered = coverage.filter((entry) => entry.scenarios.length === 0)
      .map((entry) => entry.domain.id);
    expect([...uncovered].sort()).toEqual(Object.keys(NEONATOLOGY_UNCOVERED).sort());
    for (const reason of Object.values(NEONATOLOGY_UNCOVERED)) {
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('keeps an uncovered subcompetency in the coverage table rather than dropping it', () => {
    expect(coverage).toHaveLength(FRAMEWORK.domains.length);
  });
});
