/**
 * The completion record is a claim about this exact content, and about a refusal that cuts both ways.
 *
 * This lab argues against treating toward a number in a setting where the treatment is routine,
 * which is one careless sentence away from reading as advice not to treat. The boundary
 * narrative carries that limit and is asserted here, along with the sources' own weaknesses.
 */
import { describe, expect, it } from 'vitest';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { RENAL_PHOSPHATE_TARGET as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/phosphate-target-a-surrogate-that-moved-the-wrong-way';
import { RENAL_PHOSPHATE_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/phosphate-target-fixtures';
import { renalPhosphateTargetCompletionEvidence as evidence } from '../../src/modules/renal-electrolyte/phosphate-target-completion';

const VERSION = '0.1.0-alpha.48';

describe('Requirement: the phosphate-target completion record binds to this exact content', () => {
  it('reports every requirement, with the two that need people still missing', () => {
    const rows = evidence(SCENARIO, VERSION, 'renal-electrolyte');
    expect(rows).toHaveLength(9);
    expect(rows.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    for (const row of rows) expect(row.evidence.join(' ').length).toBeGreaterThan(60);
  });

  it('describes the progression as a record that changes and a surrogate that does not', () => {
    const progression = evidence(SCENARIO, VERSION, 'renal-electrolyte')
      .find(({ id }) => id === 'meaningful-progression')!.evidence.join(' ');
    expect(progression).toContain('holds the phosphate at 1.62');
    expect(progression).toContain('What the review changes is the record');
  });

  it('says nothing about a scenario, module, or capability version it was not written for', () => {
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')).not.toEqual([]);
    expect(evidence(SCENARIO, VERSION, 'cardiology')).toEqual([]);
    expect(evidence(SCENARIO, '0.1.0-alpha.47', 'renal-electrolyte')).toEqual([]);
    expect(evidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 69 } },
      VERSION, 'renal-electrolyte')).toEqual([]);
  });

  it('binds the fixture seed it names', () => {
    expect(FIXTURES.seed).toBe(5059);
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')
      .find(({ id }) => id === 'deterministic-seed-policy')!.evidence.join(' ')).toContain('5059');
  });

  it('publishes the scenario as an incomplete preview through the shared audit', () => {
    const audit = auditClinicalScenario(SCENARIO, VERSION, 'renal-electrolyte', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('keeps the scenario’s own declarations intact', () => {
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.debrief.rubric).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(SCENARIO.metadata.clinicalReview.sources).toHaveLength(3);
    expect(SCENARIO.metadata.limitations).toHaveLength(3);
  });

  it('carries the half of each source that undercuts the taught step', () => {
    const sources = SCENARIO.metadata.clinicalReview.sources.join(' ');
    expect(sources).toContain('not that binders are harmful');
    expect(sources).toContain('predates later agents and trials');
    expect(sources).toContain('demonstrates no outcome from education');
  });

  it('states in the narrative that refusing the number is not a decision against the treatment', () => {
    const boundary = SCENARIO.timeline.find(({ target }) => target === 'renal-phosphate-boundary')!.message;
    expect(boundary).toContain('selects no binder, no dose, no diet, no target, and no education programme');
    expect(boundary).toContain('It is not evidence that binders are harmful');
    expect(boundary).toContain('does not establish that his phosphate is harmless');
    expect(boundary).toContain('refusing to treat toward a number supplies no other plan');
    expect(boundary).toContain('The phosphate does not change across this rehearsal');
  });
});
