/**
 * framework-mapping-expansion → neurology mapped to the ACGME's Pediatrics
 * Milestones (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * The third mapped module, held to what the first two are held to: every lesson
 * mapped, every objective placed, every mapping falsifiable against the
 * objectives it cites, and every subcompetency nothing touches named rather
 * than dropped. Paediatrics divides its subcompetencies differently from
 * emergency medicine, so the uncovered set is its own rather than a copy.
 */
import { describe, expect, it } from 'vitest';
import { NEUROLOGY_SCENARIOS } from '../../src/modules/neurology/scenarios';
import {
  NEUROLOGY_FRAMEWORKS, NEUROLOGY_SCENARIO_MAPPINGS,
  NEUROLOGY_UNCOVERED,
} from '../../src/modules/neurology/curriculum';
import { ACGME_NEUROLOGY_MILESTONES } from '@platform/curriculum/acgme-neurology';
import { coverageOf, danglingIn, unmappedIn } from '@platform/curriculum/mapping';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';

const FRAMEWORK = ACGME_NEUROLOGY_MILESTONES;
const coverage = coverageOf(FRAMEWORK, NEUROLOGY_SCENARIOS, NEUROLOGY_SCENARIO_MAPPINGS);

describe('the ACGME neurology reading', () => {
  it('is a well-formed reading with a re-check date', () => {
    expect(frameworkRecordProblems(FRAMEWORK)).toEqual([]);
    expect(FRAMEWORK.domains).toHaveLength(27);
    expect(new Set(FRAMEWORK.domains.map((domain) => domain.id)).size).toBe(27);
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

describe('every neurology lesson is mapped', () => {
  it('leaves no lesson unmapped', () => {
    expect(unmappedIn(NEUROLOGY_SCENARIOS, NEUROLOGY_SCENARIO_MAPPINGS)
      .map((scenario) => scenario.metadata.id)).toEqual([]);
    expect(NEUROLOGY_SCENARIOS).toHaveLength(15);
  });

  it('names no framework, domain, scenario or objective that does not exist', () => {
    expect(danglingIn(NEUROLOGY_FRAMEWORKS, NEUROLOGY_SCENARIOS,
      NEUROLOGY_SCENARIO_MAPPINGS)).toEqual([]);
  });

  /**
   * The mapping is only falsifiable if every objective is accounted for: an
   * objective nobody placed is an objective nobody checked.
   */
  it('places every objective of every lesson at least once', () => {
    for (const scenario of NEUROLOGY_SCENARIOS) {
      const placed = new Set(NEUROLOGY_SCENARIO_MAPPINGS
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
    for (const mapping of NEUROLOGY_SCENARIO_MAPPINGS) {
      const key = `${mapping.scenarioId}/${mapping.domainId}`;
      expect(seen, key).not.toContain(key);
      seen.add(key);
      expect(mapping.objectiveIds.length).toBeGreaterThan(0);
    }
  });
});

describe('the finer divisions are used rather than flattened', () => {
  /**
   * Neurology gives imaging, EEG, nerve conduction and the lumbar puncture one
   * subcompetency each. Claiming one of them for a lesson that never names the
   * procedure would be the easy error, so each is held to the objectives that
   * do name it.
   */
  it('claims a procedure subcompetency only where an objective names the procedure', () => {
    const claims = (domainId: string) => NEUROLOGY_SCENARIO_MAPPINGS
      .filter((mapping) => mapping.domainId === domainId)
      .flatMap((mapping) => mapping.objectiveIds);
    for (const objective of claims('pc-8-neuroimaging')) {
      expect(objective, objective).toMatch(/imaging|mri|venography|ct/);
    }
    for (const objective of claims('pc-9-eeg')) expect(objective, objective).toMatch(/eeg/);
    for (const objective of claims('pc-11-lumbar-puncture')) {
      expect(objective, objective).toMatch(/lp|lumbar/);
    }
    expect(claims('pc-10-ncs-emg')).toEqual([]);
  });

  /** Every lesson here is declared a ward lesson, so none may claim the clinic. */
  it('claims inpatient management and never outpatient', () => {
    expect(NEUROLOGY_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'pc-5-inpatient-management')).toBe(true);
    expect(NEUROLOGY_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'pc-4-outpatient-management')).toBe(false);
  });
});

describe('what this module does not cover', () => {
  it('matches the uncovered subcompetencies to the reasons recorded for them', () => {
    const uncovered = coverage.filter((entry) => entry.scenarios.length === 0)
      .map((entry) => entry.domain.id);
    expect([...uncovered].sort()).toEqual(Object.keys(NEUROLOGY_UNCOVERED).sort());
    for (const reason of Object.values(NEUROLOGY_UNCOVERED)) {
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('keeps an uncovered subcompetency in the coverage table rather than dropping it', () => {
    expect(coverage).toHaveLength(FRAMEWORK.domains.length);
  });
});
