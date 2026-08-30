/**
 * The completion audit has to say why an item failed, not restate the rule.
 *
 * `observable-objectives` answered every failure with "requires 2–5 objectives and
 * a rubric mapping for every objective", which leaves a reader unable to tell an
 * unmapped objective from a scenario that simply declares six. Those need opposite
 * fixes — one is a missing rubric row, the other is a decision about how much a
 * single debrief should try to teach — so the audit names the actual cause.
 */
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import type { Scenario } from '@anesthesia/scenarios/types';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';

const BASE = ONCOLOGY_SCENARIOS[0]!;

function audit(scenario: Scenario) {
  const record = auditClinicalScenario(scenario, ENGINE_VERSION, 'oncology', 'ward');
  return record.requirements.find((entry) => entry.id === 'observable-objectives')!;
}

/** The same scenario with only its objective list and rubric changed. */
function withObjectives(count: number, mappedCount = count): Scenario {
  const objectives = BASE.metadata.objectives.slice(0, count);
  return {
    ...BASE,
    metadata: { ...BASE.metadata, objectives },
    debrief: {
      ...BASE.debrief,
      rubric: BASE.debrief.rubric.filter((item) => objectives
        .slice(0, mappedCount).some((objective) => objective.id === item.objectiveId)),
    },
  };
}

describe('Requirement: The Audit Names The Cause, Not The Rule', () => {
  it('reports the actual count when a scenario declares too many objectives', () => {
    const entry = audit(withObjectives(7));
    expect(entry.status).toBe('missing');
    expect(entry.evidence[0]).toContain('declares 7 objectives');
    expect(entry.evidence[0]).toContain('at most 5');
    // The count is the only problem, so an unmapped-objective reason must not appear.
    expect(entry.evidence[0]).not.toContain('rubric row');
  });

  it('reports the actual count when a scenario declares too few', () => {
    const entry = audit(withObjectives(1));
    expect(entry.evidence[0]).toContain('declares 1 objective(s)');
    expect(entry.evidence[0]).toContain('at least 2');
  });

  it('names the unmapped objectives by id rather than the rule', () => {
    const scenario = withObjectives(4, 2);
    const unmapped = scenario.metadata.objectives.slice(2).map((objective) => objective.id);
    const entry = audit(scenario);
    expect(entry.evidence[0]).toContain('no debrief rubric row');
    for (const id of unmapped) expect(entry.evidence[0]).toContain(id);
    expect(entry.evidence[0]).not.toContain('at most 5');
  });

  it('reports both causes when both are true', () => {
    const entry = audit(withObjectives(7, 5));
    expect(entry.evidence[0]).toContain('declares 7 objectives');
    expect(entry.evidence[0]).toContain('no debrief rubric row');
  });

  it('says what passed when the contract is met', () => {
    const entry = audit(withObjectives(4));
    expect(entry.status).toBe('satisfied');
    expect(entry.evidence[0]).toContain('4 objectives map to debrief rubric evidence');
  });
});

describe('Requirement: Every Shipped Failure Has A Named Cause', () => {
  it('fails no oncology scenario for an unmapped objective', () => {
    // The shipped gap is entirely the objective cap. Not one scenario is missing a
    // rubric row, which is what makes this a content-design decision rather than a
    // defect: 6-8 objectives against a contract that allows 5.
    for (const scenario of ONCOLOGY_SCENARIOS) {
      const entry = audit(scenario);
      expect(entry.evidence[0], scenario.metadata.id).not.toContain('rubric row');
    }
  });
});
