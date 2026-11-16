/**
 * framework-mapping-expansion → respiratory-medicine mapped to the ACGME's Pediatrics
 * Milestones (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * The third mapped module, held to what the first two are held to: every lesson
 * mapped, every objective placed, every mapping falsifiable against the
 * objectives it cites, and every subcompetency nothing touches named rather
 * than dropped. Paediatrics divides its subcompetencies differently from
 * emergency medicine, so the uncovered set is its own rather than a copy.
 */
import { describe, expect, it } from 'vitest';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../../src/modules/respiratory-medicine/scenarios';
import {
  RESPIRATORY_MEDICINE_FRAMEWORKS, RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS,
  RESPIRATORY_MEDICINE_UNCOVERED,
} from '../../src/modules/respiratory-medicine/curriculum';
import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import { coverageOf, danglingIn, unmappedIn } from '@platform/curriculum/mapping';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';

const FRAMEWORK = ACGME_INTERNAL_MEDICINE_MILESTONES;
const coverage = coverageOf(FRAMEWORK, RESPIRATORY_MEDICINE_SCENARIOS, RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS);

describe('the ACGME respiratory-medicine reading', () => {
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

describe('every respiratory-medicine lesson is mapped', () => {
  it('leaves no lesson unmapped', () => {
    expect(unmappedIn(RESPIRATORY_MEDICINE_SCENARIOS, RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS)
      .map((scenario) => scenario.metadata.id)).toEqual([]);
    expect(RESPIRATORY_MEDICINE_SCENARIOS).toHaveLength(15);
  });

  it('names no framework, domain, scenario or objective that does not exist', () => {
    expect(danglingIn(RESPIRATORY_MEDICINE_FRAMEWORKS, RESPIRATORY_MEDICINE_SCENARIOS,
      RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS)).toEqual([]);
  });

  /**
   * The mapping is only falsifiable if every objective is accounted for: an
   * objective nobody placed is an objective nobody checked.
   */
  it('places every objective of every lesson at least once', () => {
    for (const scenario of RESPIRATORY_MEDICINE_SCENARIOS) {
      const placed = new Set(RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS
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
    for (const mapping of RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS) {
      const key = `${mapping.scenarioId}/${mapping.domainId}`;
      expect(seen, key).not.toContain(key);
      seen.add(key);
      expect(mapping.objectiveIds.length).toBeGreaterThan(0);
    }
  });
});

describe('the setting is read from the lesson, not from the module', () => {
  /**
   * All fifteen lessons are declared ICU lessons, so a lesson that directs care
   * directs it inpatient and none may claim outpatient - the opposite answer to
   * cardiology's, from the same reading.
   *
   * Eight of the fifteen direct no care at all. They reconcile, review,
   * coordinate and hand over, which is what a module of reassessment lessons
   * does, and giving them a management subcompetency anyway would claim the
   * learner changed something they never changed. They are named here so that
   * if one later gains a management objective, this list is what notices.
   */
  const DIRECTS_NO_CARE = [
    'acute-severe-asthma', 'copd-exacerbation-transition-reassessment',
    'post-pulmonary-embolism-persistent-dyspnea',
    'acute-pulmonary-edema-respiratory-support-reassessment',
    'spontaneous-tension-pneumothorax-post-drainage-reassessment',
    'chronic-opioid-related-hypoventilation-reassessment',
    'neuromuscular-respiratory-failure-reassessment', 'obesity-hypoventilation-reassessment',
  ];

  it('maps a lesson that directs care to inpatient, and no lesson to outpatient', () => {
    for (const scenario of RESPIRATORY_MEDICINE_SCENARIOS) {
      const claimed = RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS
        .filter((mapping) => mapping.scenarioId === scenario.metadata.id)
        .map((mapping) => mapping.domainId);
      expect(claimed, scenario.metadata.id).not.toContain('pc-5-outpatient-management');
      expect(claimed.includes('pc-4-inpatient-management'), scenario.metadata.id)
        .toBe(!DIRECTS_NO_CARE.includes(scenario.metadata.id));
    }
  });

  /**
   * Five lessons coordinate something that happens after this admission -
   * rehabilitation, a referral, a prescriber's plan, goals of care. Those are
   * navigation and a conversation with the patient, not outpatient management,
   * which would claim the learner delivered the care.
   */
  it('treats an onward plan as navigation and a conversation, not as outpatient care', () => {
    const coordinated = RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS
      .flatMap((mapping) => mapping.objectiveIds.map((id) => ({ id, domainId: mapping.domainId })))
      .filter((entry) => entry.id.startsWith('coordinate-'));
    expect(coordinated.length).toBeGreaterThan(0);
    const domains = new Set(coordinated.map((entry) => entry.domainId));
    expect([...domains].sort())
      .toEqual(['ics-1-patient-and-family-communication', 'sbp-2-system-navigation']);
  });
});

describe('what this module does not cover', () => {
  it('matches the uncovered subcompetencies to the reasons recorded for them', () => {
    const uncovered = coverage.filter((entry) => entry.scenarios.length === 0)
      .map((entry) => entry.domain.id);
    expect([...uncovered].sort()).toEqual(Object.keys(RESPIRATORY_MEDICINE_UNCOVERED).sort());
    for (const reason of Object.values(RESPIRATORY_MEDICINE_UNCOVERED)) {
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('keeps an uncovered subcompetency in the coverage table rather than dropping it', () => {
    expect(coverage).toHaveLength(FRAMEWORK.domains.length);
  });
});
