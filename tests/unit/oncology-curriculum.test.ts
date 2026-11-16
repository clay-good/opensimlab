/**
 * framework-mapping-expansion → oncology mapped to the ACGME's Pediatrics
 * Milestones (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * The third mapped module, held to what the first two are held to: every lesson
 * mapped, every objective placed, every mapping falsifiable against the
 * objectives it cites, and every subcompetency nothing touches named rather
 * than dropped. Paediatrics divides its subcompetencies differently from
 * emergency medicine, so the uncovered set is its own rather than a copy.
 */
import { describe, expect, it } from 'vitest';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';
import {
  ONCOLOGY_FRAMEWORKS, ONCOLOGY_SCENARIO_MAPPINGS,
  ONCOLOGY_UNCOVERED,
} from '../../src/modules/oncology/curriculum';
import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import { coverageOf, danglingIn, unmappedIn } from '@platform/curriculum/mapping';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';

const FRAMEWORK = ACGME_INTERNAL_MEDICINE_MILESTONES;
const coverage = coverageOf(FRAMEWORK, ONCOLOGY_SCENARIOS, ONCOLOGY_SCENARIO_MAPPINGS);

describe('the ACGME oncology reading', () => {
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

describe('every oncology lesson is mapped', () => {
  it('leaves no lesson unmapped', () => {
    expect(unmappedIn(ONCOLOGY_SCENARIOS, ONCOLOGY_SCENARIO_MAPPINGS)
      .map((scenario) => scenario.metadata.id)).toEqual([]);
    expect(ONCOLOGY_SCENARIOS).toHaveLength(11);
  });

  it('names no framework, domain, scenario or objective that does not exist', () => {
    expect(danglingIn(ONCOLOGY_FRAMEWORKS, ONCOLOGY_SCENARIOS,
      ONCOLOGY_SCENARIO_MAPPINGS)).toEqual([]);
  });

  /**
   * The mapping is only falsifiable if every objective is accounted for: an
   * objective nobody placed is an objective nobody checked.
   */
  it('places every objective of every lesson at least once', () => {
    for (const scenario of ONCOLOGY_SCENARIOS) {
      const placed = new Set(ONCOLOGY_SCENARIO_MAPPINGS
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
    for (const mapping of ONCOLOGY_SCENARIO_MAPPINGS) {
      const key = `${mapping.scenarioId}/${mapping.domainId}`;
      expect(seen, key).not.toContain(key);
      seen.add(key);
      expect(mapping.objectiveIds.length).toBeGreaterThan(0);
    }
  });
});

describe('what a clinic module claims, and the two absences it records', () => {
  it('claims outpatient management and never inpatient', () => {
    expect(ONCOLOGY_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'pc-5-outpatient-management')).toBe(true);
    expect(ONCOLOGY_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'pc-4-inpatient-management')).toBe(false);
  });

  /**
   * Two absences that would read as oversights without their reasons. No
   * objective here examines the patient, and none carries a safety bound: these
   * are reasoning lessons about what a number, a scan or a label does and does
   * not settle, and the harm they teach is a conclusion drawn too early.
   */
  it('records why nothing examines the patient and nothing carries a bound', () => {
    expect(ONCOLOGY_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'pc-2-physical-examination')).toBe(false);
    expect(ONCOLOGY_UNCOVERED['pc-2-physical-examination']).toMatch(/does and does not settle/);
    expect(ONCOLOGY_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'sbp-1-patient-safety-and-quality-improvement')).toBe(false);
    expect(ONCOLOGY_UNCOVERED['sbp-1-patient-safety-and-quality-improvement']).toMatch(/drawn too early/);
  });
});

describe('what this module does not cover', () => {
  it('matches the uncovered subcompetencies to the reasons recorded for them', () => {
    const uncovered = coverage.filter((entry) => entry.scenarios.length === 0)
      .map((entry) => entry.domain.id);
    expect([...uncovered].sort()).toEqual(Object.keys(ONCOLOGY_UNCOVERED).sort());
    for (const reason of Object.values(ONCOLOGY_UNCOVERED)) {
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('keeps an uncovered subcompetency in the coverage table rather than dropping it', () => {
    expect(coverage).toHaveLength(FRAMEWORK.domains.length);
  });
});
