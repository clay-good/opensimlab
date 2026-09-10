/**
 * The completion record is a claim about this exact content, and about an absence.
 *
 * What makes this lab work is what it never provides, so the boundary narrative has to say so
 * where a learner reads it, and the evidence row has to describe the absence rather than
 * claiming a progression the lesson does not have.
 */
import { describe, expect, it } from 'vitest';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { RENAL_ESTIMATED_FILTRATION as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/estimated-filtration-a-number-she-was-never-measured-by';
import { RENAL_ESTIMATE_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/estimated-filtration-fixtures';
import { renalEstimatedFiltrationCompletionEvidence as evidence } from '../../src/modules/renal-electrolyte/estimated-filtration-completion';

const VERSION = '0.1.0-alpha.48';

describe('Requirement: the estimated-filtration completion record binds to this exact content', () => {
  it('reports every requirement, with the two that need people still missing', () => {
    const rows = evidence(SCENARIO, VERSION, 'renal-electrolyte');
    expect(rows).toHaveLength(9);
    expect(rows.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    for (const row of rows) expect(row.evidence.join(' ').length).toBeGreaterThan(60);
  });

  it('describes the progression as the absence it is', () => {
    const progression = evidence(SCENARIO, VERSION, 'renal-electrolyte')
      .find(({ id }) => id === 'meaningful-progression')!.evidence.join(' ');
    expect(progression).toContain('null measured filtration rate');
    expect(progression).toContain('never resolves the disagreement');
  });

  it('says nothing about a scenario, module, or capability version it was not written for', () => {
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')).not.toEqual([]);
    expect(evidence(SCENARIO, VERSION, 'oncology')).toEqual([]);
    expect(evidence(SCENARIO, '0.1.0-alpha.47', 'renal-electrolyte')).toEqual([]);
    expect(evidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 45 } },
      VERSION, 'renal-electrolyte')).toEqual([]);
  });

  it('binds the fixture seed it names', () => {
    expect(FIXTURES.seed).toBe(5041);
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')
      .find(({ id }) => id === 'deterministic-seed-policy')!.evidence.join(' ')).toContain('5041');
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
    expect(sources).toContain('not a guarantee for an individual');
    expect(sources).toContain('only White patients were included');
    expect(sources).toContain('It does not establish that either marker is correct');
  });

  it('states the absence where a learner will read it', () => {
    const boundary = SCENARIO.timeline.find(({ target }) => target === 'renal-estimate-boundary')!.message;
    expect(boundary).toContain('selects no drug, no dose, no adjustment, no equation, and no marker');
    expect(boundary).toContain('no measured filtration rate is supplied at any point');
    expect(boundary).toContain('the discordance is not resolved');
    expect(boundary).toContain('is not attributed to any medicine here');
  });
});
