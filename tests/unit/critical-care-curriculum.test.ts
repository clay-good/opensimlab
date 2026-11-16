/**
 * framework-mapping-expansion → critical-care mapped to the ACGME's Pediatrics
 * Milestones (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * The third mapped module, held to what the first two are held to: every lesson
 * mapped, every objective placed, every mapping falsifiable against the
 * objectives it cites, and every subcompetency nothing touches named rather
 * than dropped. Paediatrics divides its subcompetencies differently from
 * emergency medicine, so the uncovered set is its own rather than a copy.
 */
import { describe, expect, it } from 'vitest';
import { CRITICAL_CARE_SCENARIOS } from '../../src/modules/critical-care/scenarios';
import {
  CRITICAL_CARE_FRAMEWORKS, CRITICAL_CARE_SCENARIO_MAPPINGS,
  CRITICAL_CARE_UNCOVERED,
} from '../../src/modules/critical-care/curriculum';
import { ACGME_INTERNAL_MEDICINE_MILESTONES } from '@platform/curriculum/acgme-internal-medicine';
import { coverageOf, danglingIn, unmappedIn } from '@platform/curriculum/mapping';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';

const FRAMEWORK = ACGME_INTERNAL_MEDICINE_MILESTONES;
const coverage = coverageOf(FRAMEWORK, CRITICAL_CARE_SCENARIOS, CRITICAL_CARE_SCENARIO_MAPPINGS);

describe('the ACGME critical-care reading', () => {
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

describe('every critical-care lesson is mapped', () => {
  it('leaves no lesson unmapped', () => {
    expect(unmappedIn(CRITICAL_CARE_SCENARIOS, CRITICAL_CARE_SCENARIO_MAPPINGS)
      .map((scenario) => scenario.metadata.id)).toEqual([]);
    expect(CRITICAL_CARE_SCENARIOS).toHaveLength(24);
  });

  it('names no framework, domain, scenario or objective that does not exist', () => {
    expect(danglingIn(CRITICAL_CARE_FRAMEWORKS, CRITICAL_CARE_SCENARIOS,
      CRITICAL_CARE_SCENARIO_MAPPINGS)).toEqual([]);
  });

  /**
   * The mapping is only falsifiable if every objective is accounted for: an
   * objective nobody placed is an objective nobody checked.
   */
  it('places every objective of every lesson at least once', () => {
    for (const scenario of CRITICAL_CARE_SCENARIOS) {
      const placed = new Set(CRITICAL_CARE_SCENARIO_MAPPINGS
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
    for (const mapping of CRITICAL_CARE_SCENARIO_MAPPINGS) {
      const key = `${mapping.scenarioId}/${mapping.domainId}`;
      expect(seen, key).not.toContain(key);
      seen.add(key);
      expect(mapping.objectiveIds.length).toBeGreaterThan(0);
    }
  });
});

describe('what an intensive care module can and cannot claim', () => {
  /** All 24 lessons are declared ICU lessons, so nothing here is the clinic. */
  it('claims inpatient management and never outpatient', () => {
    expect(CRITICAL_CARE_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'pc-4-inpatient-management')).toBe(true);
    expect(CRITICAL_CARE_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'pc-5-outpatient-management')).toBe(false);
  });

  /**
   * Every patient in this module is sedated, intubated or unresponsive. The
   * absence of patient- and family-centred communication is a fact about
   * intensive care rather than an oversight, and it is the one uncovered
   * subcompetency here that a reader would otherwise read as a gap.
   */
  it('claims no conversation with a patient or a family', () => {
    expect(CRITICAL_CARE_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'ics-1-patient-and-family-communication')).toBe(false);
    expect(CRITICAL_CARE_UNCOVERED['ics-1-patient-and-family-communication'])
      .toMatch(/sedated, intubated or unresponsive/);
  });

  /**
   * The ventilator, the pump and the oximeter are bedside devices. Digital
   * health means telehealth and patient-facing tools, and stretching it to
   * cover a device display would be the easy error in a module full of them.
   */
  it('claims no digital health for the device lessons', () => {
    expect(CRITICAL_CARE_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === 'pc-6-digital-health')).toBe(false);
  });
});

describe('what this module does not cover', () => {
  it('matches the uncovered subcompetencies to the reasons recorded for them', () => {
    const uncovered = coverage.filter((entry) => entry.scenarios.length === 0)
      .map((entry) => entry.domain.id);
    expect([...uncovered].sort()).toEqual(Object.keys(CRITICAL_CARE_UNCOVERED).sort());
    for (const reason of Object.values(CRITICAL_CARE_UNCOVERED)) {
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('keeps an uncovered subcompetency in the coverage table rather than dropping it', () => {
    expect(coverage).toHaveLength(FRAMEWORK.domains.length);
  });
});
