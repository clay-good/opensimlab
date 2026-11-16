/**
 * framework-mapping-expansion → obstetrics mapped to the ACGME's Pediatrics
 * Milestones (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * The third mapped module, held to what the first two are held to: every lesson
 * mapped, every objective placed, every mapping falsifiable against the
 * objectives it cites, and every subcompetency nothing touches named rather
 * than dropped. Paediatrics divides its subcompetencies differently from
 * emergency medicine, so the uncovered set is its own rather than a copy.
 */
import { describe, expect, it } from 'vitest';
import { OBSTETRICS_SCENARIOS } from '../../src/modules/obstetrics/scenarios';
import {
  OBSTETRICS_FRAMEWORKS, OBSTETRICS_SCENARIO_MAPPINGS,
  OBSTETRICS_UNCOVERED,
} from '../../src/modules/obstetrics/curriculum';
import { ACGME_OBSTETRICS_GYNECOLOGY_MILESTONES } from '@platform/curriculum/acgme-obstetrics-gynecology';
import { coverageOf, danglingIn, unmappedIn } from '@platform/curriculum/mapping';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';

const FRAMEWORK = ACGME_OBSTETRICS_GYNECOLOGY_MILESTONES;
const coverage = coverageOf(FRAMEWORK, OBSTETRICS_SCENARIOS, OBSTETRICS_SCENARIO_MAPPINGS);

describe('the ACGME obstetrics reading', () => {
  it('is a well-formed reading with a re-check date', () => {
    expect(frameworkRecordProblems(FRAMEWORK)).toEqual([]);
    expect(FRAMEWORK.domains).toHaveLength(32);
    expect(new Set(FRAMEWORK.domains.map((domain) => domain.id)).size).toBe(32);
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

describe('every obstetrics lesson is mapped', () => {
  it('leaves no lesson unmapped', () => {
    expect(unmappedIn(OBSTETRICS_SCENARIOS, OBSTETRICS_SCENARIO_MAPPINGS)
      .map((scenario) => scenario.metadata.id)).toEqual([]);
    expect(OBSTETRICS_SCENARIOS).toHaveLength(15);
  });

  it('names no framework, domain, scenario or objective that does not exist', () => {
    expect(danglingIn(OBSTETRICS_FRAMEWORKS, OBSTETRICS_SCENARIOS,
      OBSTETRICS_SCENARIO_MAPPINGS)).toEqual([]);
  });

  /**
   * The mapping is only falsifiable if every objective is accounted for: an
   * objective nobody placed is an objective nobody checked.
   */
  it('places every objective of every lesson at least once', () => {
    for (const scenario of OBSTETRICS_SCENARIOS) {
      const placed = new Set(OBSTETRICS_SCENARIO_MAPPINGS
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
    for (const mapping of OBSTETRICS_SCENARIO_MAPPINGS) {
      const key = `${mapping.scenarioId}/${mapping.domainId}`;
      expect(seen, key).not.toContain(key);
      seen.add(key);
      expect(mapping.objectiveIds.length).toBeGreaterThan(0);
    }
  });
});

describe('the periods and the procedures are claimed only where they are named', () => {
  /**
   * Antepartum, intrapartum and postpartum are separate subcompetencies here,
   * so a lesson that carries the wrong one is making a claim about when the
   * emergency happened. Each lesson carries exactly one period.
   */
  it('gives every lesson exactly one period', () => {
    const periods = new Set(['pc-1-antepartum-care', 'pc-3-intrapartum-care', 'pc-4-postpartum-care']);
    for (const scenario of OBSTETRICS_SCENARIOS) {
      const claimed = OBSTETRICS_SCENARIO_MAPPINGS
        .filter((mapping) => mapping.scenarioId === scenario.metadata.id)
        .map((mapping) => mapping.domainId)
        .filter((domainId) => periods.has(domainId));
      expect(claimed, scenario.metadata.id).toHaveLength(1);
    }
  });

  /** This module is obstetric emergencies. None of the gynaecology is touched. */
  it('claims no gynaecological procedure', () => {
    const forbidden = [
      'pc-8-endoscopic-procedures', 'pc-9-laparoscopic-procedures',
      'pc-10-vulvar-vaginal-procedures', 'pc-11-open-surgical-procedures',
      'pc-12-family-planning', 'pc-13-ambulatory-gynecology', 'pc-2-first-trimester-bleeding',
    ];
    for (const domainId of forbidden) {
      expect(OBSTETRICS_SCENARIO_MAPPINGS.some((mapping) => mapping.domainId === domainId), domainId)
        .toBe(false);
    }
  });

  it('covers exactly half of the reading, and says so in the record', () => {
    const covered = coverage.filter((entry) => entry.scenarios.length > 0);
    expect(covered).toHaveLength(16);
    expect(FRAMEWORK.note).toContain('Sixteen of the thirty-two are covered by no lesson at all');
  });
});

describe('what this module does not cover', () => {
  it('matches the uncovered subcompetencies to the reasons recorded for them', () => {
    const uncovered = coverage.filter((entry) => entry.scenarios.length === 0)
      .map((entry) => entry.domain.id);
    expect([...uncovered].sort()).toEqual(Object.keys(OBSTETRICS_UNCOVERED).sort());
    for (const reason of Object.values(OBSTETRICS_UNCOVERED)) {
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('keeps an uncovered subcompetency in the coverage table rather than dropping it', () => {
    expect(coverage).toHaveLength(FRAMEWORK.domains.length);
  });
});
