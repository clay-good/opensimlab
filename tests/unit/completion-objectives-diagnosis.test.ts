/**
 * The completion audit has to say why an item failed, not restate the rule.
 *
 * `observable-objectives` answered every failure with "requires 2–5 objectives and
 * a rubric mapping for every objective", which leaves a reader unable to tell an
 * unmapped objective from a scenario that simply declares too many. Those need opposite
 * fixes — one is a missing rubric row, the other is a decision about how much a
 * single debrief should try to teach — so the audit names the actual cause.
 */
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { MAX_OBJECTIVES, auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import type { Scenario } from '@anesthesia/scenarios/types';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';

const BASE = ONCOLOGY_SCENARIOS[0]!;

function audit(scenario: Scenario) {
  const record = auditClinicalScenario(scenario, ENGINE_VERSION, 'oncology', 'ward');
  return record.requirements.find((entry) => entry.id === 'observable-objectives')!;
}

/**
 * The same scenario with only its objective list and rubric changed. Beyond the
 * lesson's own objectives it repeats them under new ids, each with its rubric row,
 * so a count above the cap is still a lesson whose objectives are all mapped.
 */
function withObjectives(count: number, mappedCount = count): Scenario {
  const own = BASE.metadata.objectives;
  const objectives = Array.from({ length: count }, (_, index) => {
    const objective = own[index % own.length]!;
    return index < own.length ? objective : { ...objective, id: `${objective.id}-extra-${index}` };
  });
  const rows = objectives.map((objective, index) => {
    const row = BASE.debrief.rubric.find((item) => item.objectiveId === own[index % own.length]!.id)!;
    return { ...row, objectiveId: objective.id };
  });
  return {
    ...BASE,
    metadata: { ...BASE.metadata, objectives },
    debrief: {
      ...BASE.debrief,
      rubric: rows.slice(0, mappedCount),
    },
  };
}

describe('Requirement: The Audit Names The Cause, Not The Rule', () => {
  it('holds the cap the maintainer set: eight passes and nine does not', () => {
    expect(MAX_OBJECTIVES).toBe(8);
    expect(audit(withObjectives(8)).status).toBe('satisfied');
    expect(audit(withObjectives(9)).status).toBe('missing');
  });

  it('reports the actual count when a scenario declares too many objectives', () => {
    const entry = audit(withObjectives(9));
    expect(entry.status).toBe('missing');
    expect(entry.evidence[0]).toContain('declares 9 objectives');
    expect(entry.evidence[0]).toContain('at most 8');
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
    expect(entry.evidence[0]).not.toContain('at most 8');
  });

  it('reports both causes when both are true', () => {
    const entry = audit(withObjectives(9, 5));
    expect(entry.evidence[0]).toContain('declares 9 objectives');
    expect(entry.evidence[0]).toContain('no debrief rubric row');
  });

  it('says what passed when the contract is met', () => {
    const entry = audit(withObjectives(4));
    expect(entry.status).toBe('satisfied');
    expect(entry.evidence[0]).toContain('4 objectives map to debrief rubric evidence');
  });
});

describe('Requirement: Every Shipped Failure Has A Named Cause', () => {
  it('passes every oncology scenario now that the cap is eight', () => {
    // The shipped gap was entirely the old cap of 5: 6-8 objectives, every one with
    // a rubric row. Raising the cap was a content-design decision, not a defect fix.
    for (const scenario of ONCOLOGY_SCENARIOS) {
      const entry = audit(scenario);
      expect(entry.status, scenario.metadata.id).toBe('satisfied');
    }
  });
});
