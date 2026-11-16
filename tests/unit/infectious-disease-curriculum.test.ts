/**
 * framework-mapping-expansion → infectious-disease mapped to the ACGME's Pediatrics
 * Milestones (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * The third mapped module, held to what the first two are held to: every lesson
 * mapped, every objective placed, every mapping falsifiable against the
 * objectives it cites, and every subcompetency nothing touches named rather
 * than dropped. Paediatrics divides its subcompetencies differently from
 * emergency medicine, so the uncovered set is its own rather than a copy.
 */
import { describe, expect, it } from 'vitest';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../../src/modules/infectious-disease/scenarios';
import {
  INFECTIOUS_DISEASE_FRAMEWORKS, INFECTIOUS_DISEASE_SCENARIO_MAPPINGS,
  INFECTIOUS_DISEASE_UNCOVERED,
} from '../../src/modules/infectious-disease/curriculum';
import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import { coverageOf, danglingIn, unmappedIn } from '@platform/curriculum/mapping';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';

const FRAMEWORK = ACGME_INTERNAL_MEDICINE_MILESTONES;
const coverage = coverageOf(FRAMEWORK, INFECTIOUS_DISEASE_SCENARIOS, INFECTIOUS_DISEASE_SCENARIO_MAPPINGS);

describe('the ACGME infectious-disease reading', () => {
  it('is a well-formed reading with a re-check date', () => {
    expect(frameworkRecordProblems(FRAMEWORK)).toEqual([]);
    expect(FRAMEWORK.domains).toHaveLength(21);
    expect(new Set(FRAMEWORK.domains.map((domain) => domain.id)).size).toBe(21);
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

describe('every infectious-disease lesson is mapped', () => {
  it('leaves no lesson unmapped', () => {
    expect(unmappedIn(INFECTIOUS_DISEASE_SCENARIOS, INFECTIOUS_DISEASE_SCENARIO_MAPPINGS)
      .map((scenario) => scenario.metadata.id)).toEqual([]);
    expect(INFECTIOUS_DISEASE_SCENARIOS).toHaveLength(10);
  });

  it('names no framework, domain, scenario or objective that does not exist', () => {
    expect(danglingIn(INFECTIOUS_DISEASE_FRAMEWORKS, INFECTIOUS_DISEASE_SCENARIOS,
      INFECTIOUS_DISEASE_SCENARIO_MAPPINGS)).toEqual([]);
  });

  /**
   * The mapping is only falsifiable if every objective is accounted for: an
   * objective nobody placed is an objective nobody checked.
   */
  it('places every objective of every lesson at least once', () => {
    for (const scenario of INFECTIOUS_DISEASE_SCENARIOS) {
      const placed = new Set(INFECTIOUS_DISEASE_SCENARIO_MAPPINGS
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
    for (const mapping of INFECTIOUS_DISEASE_SCENARIO_MAPPINGS) {
      const key = `${mapping.scenarioId}/${mapping.domainId}`;
      expect(seen, key).not.toContain(key);
      seen.add(key);
      expect(mapping.objectiveIds.length).toBeGreaterThan(0);
    }
  });
});

describe('what an emergency-department module claims about setting', () => {
  /**
   * The reading divides management into inpatient and outpatient and has no
   * third setting. All ten lessons are declared emergency-department lessons,
   * which is not clinic care, and the inpatient subcompetency's own descriptors
   * speak of acuity and of patients requiring critical care. Inpatient is the
   * honest of the two, and the uncovered reason says so rather than letting the
   * choice read as an accident.
   */
  it('resolves the emergency department to inpatient, and records why', () => {
    expect(INFECTIOUS_DISEASE_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'pc-4-inpatient-management')).toBe(true);
    expect(INFECTIOUS_DISEASE_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'pc-5-outpatient-management')).toBe(false);
    expect(INFECTIOUS_DISEASE_UNCOVERED['pc-5-outpatient-management'])
      .toMatch(/no third setting/);
  });
});

describe('what this module does not cover', () => {
  it('matches the uncovered subcompetencies to the reasons recorded for them', () => {
    const uncovered = coverage.filter((entry) => entry.scenarios.length === 0)
      .map((entry) => entry.domain.id);
    expect([...uncovered].sort()).toEqual(Object.keys(INFECTIOUS_DISEASE_UNCOVERED).sort());
    for (const reason of Object.values(INFECTIOUS_DISEASE_UNCOVERED)) {
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('keeps an uncovered subcompetency in the coverage table rather than dropping it', () => {
    expect(coverage).toHaveLength(FRAMEWORK.domains.length);
  });
});
