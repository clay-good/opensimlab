/**
 * framework-mapping-expansion → endocrine-metabolic mapped to the ACGME's Pediatrics
 * Milestones (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * The third mapped module, held to what the first two are held to: every lesson
 * mapped, every objective placed, every mapping falsifiable against the
 * objectives it cites, and every subcompetency nothing touches named rather
 * than dropped. Paediatrics divides its subcompetencies differently from
 * emergency medicine, so the uncovered set is its own rather than a copy.
 */
import { describe, expect, it } from 'vitest';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../src/modules/endocrine-metabolic/scenarios';
import {
  ENDOCRINE_METABOLIC_FRAMEWORKS, ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS,
  ENDOCRINE_METABOLIC_UNCOVERED,
} from '../../src/modules/endocrine-metabolic/curriculum';
import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import { coverageOf, danglingIn, unmappedIn } from '@platform/curriculum/mapping';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';

const FRAMEWORK = ACGME_INTERNAL_MEDICINE_MILESTONES;
const coverage = coverageOf(FRAMEWORK, ENDOCRINE_METABOLIC_SCENARIOS, ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS);

describe('the ACGME endocrine-metabolic reading', () => {
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

describe('every endocrine-metabolic lesson is mapped', () => {
  it('leaves no lesson unmapped', () => {
    expect(unmappedIn(ENDOCRINE_METABOLIC_SCENARIOS, ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS)
      .map((scenario) => scenario.metadata.id)).toEqual([]);
    expect(ENDOCRINE_METABOLIC_SCENARIOS).toHaveLength(12);
  });

  it('names no framework, domain, scenario or objective that does not exist', () => {
    expect(danglingIn(ENDOCRINE_METABOLIC_FRAMEWORKS, ENDOCRINE_METABOLIC_SCENARIOS,
      ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS)).toEqual([]);
  });

  /**
   * The mapping is only falsifiable if every objective is accounted for: an
   * objective nobody placed is an objective nobody checked.
   */
  it('places every objective of every lesson at least once', () => {
    for (const scenario of ENDOCRINE_METABOLIC_SCENARIOS) {
      const placed = new Set(ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS
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
    for (const mapping of ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS) {
      const key = `${mapping.scenarioId}/${mapping.domainId}`;
      expect(seen, key).not.toContain(key);
      seen.add(key);
      expect(mapping.objectiveIds.length).toBeGreaterThan(0);
    }
  });
});

describe('both objective shapes are placed', () => {
  /**
   * Two lessons here lead every objective with a verb and ten name each
   * objective after its role. The mapping places both shapes, and this test is
   * what keeps that true: a lesson authored in either style must be fully
   * placed, and the generator refuses an id matching neither.
   */
  it('places the verb-led lessons and the role-named ones alike', () => {
    const placed = (scenarioId: string) => new Set(ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS
      .filter((mapping) => mapping.scenarioId === scenarioId)
      .flatMap((mapping) => mapping.objectiveIds));
    for (const scenarioId of ['dka-resolution-transition', 'thyroid-storm-hemodynamic-risk']) {
      const scenario = ENDOCRINE_METABOLIC_SCENARIOS.find((entry) => entry.metadata.id === scenarioId)!;
      const ids = placed(scenarioId);
      for (const objective of scenario.metadata.objectives) {
        expect(ids, `${scenarioId}/${objective.id}`).toContain(objective.id);
      }
    }
  });

  /**
   * Every lesson in this module has an objective that refuses to read improved
   * alertness, a single value or elapsed time as recovery. That is the module's
   * whole argument, so every lesson carries patient safety.
   */
  it('gives every lesson a looking-again objective under patient safety', () => {
    for (const scenario of ENDOCRINE_METABOLIC_SCENARIOS) {
      const domains = ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS
        .filter((mapping) => mapping.scenarioId === scenario.metadata.id)
        .map((mapping) => mapping.domainId);
      expect(domains, scenario.metadata.id).toContain('sbp-1-patient-safety-and-quality-improvement');
    }
  });

  it('claims inpatient management and never the clinic', () => {
    const domains = new Set(ENDOCRINE_METABOLIC_SCENARIO_MAPPINGS.map((mapping) => mapping.domainId));
    expect(domains.has('pc-4-inpatient-management')).toBe(true);
    expect(domains.has('pc-5-outpatient-management')).toBe(false);
  });
});

describe('what this module does not cover', () => {
  it('matches the uncovered subcompetencies to the reasons recorded for them', () => {
    const uncovered = coverage.filter((entry) => entry.scenarios.length === 0)
      .map((entry) => entry.domain.id);
    expect([...uncovered].sort()).toEqual(Object.keys(ENDOCRINE_METABOLIC_UNCOVERED).sort());
    for (const reason of Object.values(ENDOCRINE_METABOLIC_UNCOVERED)) {
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('keeps an uncovered subcompetency in the coverage table rather than dropping it', () => {
    expect(coverage).toHaveLength(FRAMEWORK.domains.length);
  });
});
