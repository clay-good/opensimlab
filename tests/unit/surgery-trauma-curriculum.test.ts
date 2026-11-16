/**
 * framework-mapping-expansion → surgery-trauma mapped to the ACGME's Pediatrics
 * Milestones (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * The third mapped module, held to what the first two are held to: every lesson
 * mapped, every objective placed, every mapping falsifiable against the
 * objectives it cites, and every subcompetency nothing touches named rather
 * than dropped. Paediatrics divides its subcompetencies differently from
 * emergency medicine, so the uncovered set is its own rather than a copy.
 */
import { describe, expect, it } from 'vitest';
import { SURGERY_TRAUMA_SCENARIOS } from '../../src/modules/surgery-trauma/scenarios';
import {
  SURGERY_TRAUMA_FRAMEWORKS, SURGERY_TRAUMA_SCENARIO_MAPPINGS,
  SURGERY_TRAUMA_UNCOVERED,
} from '../../src/modules/surgery-trauma/curriculum';
import { ACGME_SURGERY_MILESTONES } from '@platform/curriculum/acgme-surgery';
import { coverageOf, danglingIn, unmappedIn } from '@platform/curriculum/mapping';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';

const FRAMEWORK = ACGME_SURGERY_MILESTONES;
const coverage = coverageOf(FRAMEWORK, SURGERY_TRAUMA_SCENARIOS, SURGERY_TRAUMA_SCENARIO_MAPPINGS);

describe('the ACGME surgery-trauma reading', () => {
  it('is a well-formed reading with a re-check date', () => {
    expect(frameworkRecordProblems(FRAMEWORK)).toEqual([]);
    expect(FRAMEWORK.domains).toHaveLength(18);
    expect(new Set(FRAMEWORK.domains.map((domain) => domain.id)).size).toBe(18);
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

describe('every surgery-trauma lesson is mapped', () => {
  it('leaves no lesson unmapped', () => {
    expect(unmappedIn(SURGERY_TRAUMA_SCENARIOS, SURGERY_TRAUMA_SCENARIO_MAPPINGS)
      .map((scenario) => scenario.metadata.id)).toEqual([]);
    expect(SURGERY_TRAUMA_SCENARIOS).toHaveLength(10);
  });

  it('names no framework, domain, scenario or objective that does not exist', () => {
    expect(danglingIn(SURGERY_TRAUMA_FRAMEWORKS, SURGERY_TRAUMA_SCENARIOS,
      SURGERY_TRAUMA_SCENARIO_MAPPINGS)).toEqual([]);
  });

  /**
   * The mapping is only falsifiable if every objective is accounted for: an
   * objective nobody placed is an objective nobody checked.
   */
  it('places every objective of every lesson at least once', () => {
    for (const scenario of SURGERY_TRAUMA_SCENARIOS) {
      const placed = new Set(SURGERY_TRAUMA_SCENARIO_MAPPINGS
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
    for (const mapping of SURGERY_TRAUMA_SCENARIO_MAPPINGS) {
      const key = `${mapping.scenarioId}/${mapping.domainId}`;
      expect(seen, key).not.toContain(key);
      seen.add(key);
      expect(mapping.objectiveIds.length).toBeGreaterThan(0);
    }
  });
});

describe('a surgical document read by a module about surgical decisions', () => {
  /**
   * Three subcompetencies are about operating. A screen-based lesson performs
   * no operation and handles no tissue, so two of them are shut here, and the
   * record's own note says why rather than leaving it to the coverage table.
   */
  it('claims nothing intra-operative', () => {
    const domains = new Set(SURGERY_TRAUMA_SCENARIO_MAPPINGS.map((mapping) => mapping.domainId));
    expect(domains.has('pc-2-performance-of-procedures')).toBe(false);
    expect(domains.has('pc-3-technical-skills')).toBe(false);
    expect(FRAMEWORK.note).toContain('no screen-based lesson performs a procedure');
  });

  /**
   * Every lesson here has a literature objective, which makes this module and
   * the renal one the only two in the catalogue that reach evidence-based and
   * informed practice - and this one reaches it from all ten lessons.
   */
  it('reaches evidence-based practice from every lesson', () => {
    for (const scenario of SURGERY_TRAUMA_SCENARIOS) {
      const domains = SURGERY_TRAUMA_SCENARIO_MAPPINGS
        .filter((mapping) => mapping.scenarioId === scenario.metadata.id)
        .map((mapping) => mapping.domainId);
      expect(domains, scenario.metadata.id).toContain('pbli-1-evidence-based-practice');
    }
  });

  /**
   * One objective in the catalogue is about saying a doubt out loud, and it
   * carries the subcompetency that is actually about that rather than being
   * filed under team communication alone.
   */
  it('files saying the doubt out loud under self-awareness and help-seeking', () => {
    const objectives = SURGERY_TRAUMA_SCENARIO_MAPPINGS
      .filter((mapping) => mapping.domainId === 'prof-4-self-awareness-and-help-seeking')
      .flatMap((mapping) => mapping.objectiveIds);
    expect(objectives).toEqual(['activate-surgery-trauma-unspoken-doubt-say-it-in-the-room']);
  });
});

describe('what this module does not cover', () => {
  it('matches the uncovered subcompetencies to the reasons recorded for them', () => {
    const uncovered = coverage.filter((entry) => entry.scenarios.length === 0)
      .map((entry) => entry.domain.id);
    expect([...uncovered].sort()).toEqual(Object.keys(SURGERY_TRAUMA_UNCOVERED).sort());
    for (const reason of Object.values(SURGERY_TRAUMA_UNCOVERED)) {
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('keeps an uncovered subcompetency in the coverage table rather than dropping it', () => {
    expect(coverage).toHaveLength(FRAMEWORK.domains.length);
  });
});
