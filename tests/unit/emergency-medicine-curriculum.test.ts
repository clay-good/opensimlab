/**
 * framework-mapping-expansion → emergency medicine mapped to the ACGME's EM
 * Milestones (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * Anaesthesia was the only mapped module for as long as the mapping code lived
 * inside it. These tests hold the second module to the same standard the first
 * one is held to: every lesson mapped, every mapping falsifiable against the
 * objectives it cites, and every subcompetency nothing touches named rather
 * than dropped.
 */
import { describe, expect, it } from 'vitest';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';
import {
  EMERGENCY_MEDICINE_FRAMEWORKS, EMERGENCY_MEDICINE_SCENARIO_MAPPINGS,
  EMERGENCY_MEDICINE_UNCOVERED,
} from '../../src/modules/emergency-medicine/curriculum';
import { ACGME_EMERGENCY_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-emergency-medicine';
import { coverageOf, danglingIn, unmappedIn } from '@platform/curriculum/mapping';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';

const FRAMEWORK = ACGME_EMERGENCY_MEDICINE_MILESTONES;
const coverage = coverageOf(FRAMEWORK, EMERGENCY_MEDICINE_SCENARIOS, EMERGENCY_MEDICINE_SCENARIO_MAPPINGS);

describe('the ACGME emergency medicine reading', () => {
  it('is a well-formed reading with a re-check date', () => {
    expect(frameworkRecordProblems(FRAMEWORK)).toEqual([]);
    expect(FRAMEWORK.domains).toHaveLength(22);
    expect(new Set(FRAMEWORK.domains.map((domain) => domain.id)).size).toBe(22);
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
      expect(domain.label).toMatch(/^(Patient Care|Medical Knowledge|Systems-Based Practice|Practice-Based Learning and Improvement|Professionalism|Interpersonal and Communication Skills) \d: /);
      expect(domain.description).not.toMatch(/Level [1-5]/);
    }
  });
});

describe('every emergency medicine lesson is mapped', () => {
  it('leaves no lesson unmapped', () => {
    expect(unmappedIn(EMERGENCY_MEDICINE_SCENARIOS, EMERGENCY_MEDICINE_SCENARIO_MAPPINGS)
      .map((scenario) => scenario.metadata.id)).toEqual([]);
    expect(EMERGENCY_MEDICINE_SCENARIOS).toHaveLength(25);
  });

  it('names no framework, domain, scenario or objective that does not exist', () => {
    expect(danglingIn(EMERGENCY_MEDICINE_FRAMEWORKS, EMERGENCY_MEDICINE_SCENARIOS,
      EMERGENCY_MEDICINE_SCENARIO_MAPPINGS)).toEqual([]);
  });

  /**
   * The mapping is only falsifiable if every objective is accounted for: an
   * objective nobody placed is an objective nobody checked.
   */
  it('places every objective of every lesson at least once', () => {
    for (const scenario of EMERGENCY_MEDICINE_SCENARIOS) {
      const placed = new Set(EMERGENCY_MEDICINE_SCENARIO_MAPPINGS
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
    for (const mapping of EMERGENCY_MEDICINE_SCENARIO_MAPPINGS) {
      const key = `${mapping.scenarioId}/${mapping.domainId}`;
      expect(seen, key).not.toContain(key);
      seen.add(key);
      expect(mapping.objectiveIds.length).toBeGreaterThan(0);
    }
  });
});

describe('what this module does not cover', () => {
  it('matches the uncovered subcompetencies to the reasons recorded for them', () => {
    const uncovered = coverage.filter((entry) => entry.scenarios.length === 0)
      .map((entry) => entry.domain.id);
    expect([...uncovered].sort()).toEqual(Object.keys(EMERGENCY_MEDICINE_UNCOVERED).sort());
    for (const reason of Object.values(EMERGENCY_MEDICINE_UNCOVERED)) {
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('keeps an uncovered subcompetency in the coverage table rather than dropping it', () => {
    expect(coverage).toHaveLength(FRAMEWORK.domains.length);
  });
});
