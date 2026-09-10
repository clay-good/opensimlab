/**
 * The completion record is a claim about this exact content, and it has to stay one.
 *
 * Every clause of the guard matters: an evidence row that survives a changed scenario, a
 * changed fixture seed, or another module's id would be asserting something about content it
 * has not seen. The two missing requirements are missing on purpose and must not drift to
 * satisfied without a person doing the work they name.
 */
import { describe, expect, it } from 'vitest';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { RENAL_HYPOMAGNESEMIA_REFRACTORY_POTASSIUM as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypomagnesemia-refractory-potassium-and-the-normal-number';
import { RENAL_HYPOMAGNESEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypomagnesemia-fixtures';
import { renalHypomagnesemiaCompletionEvidence as evidence } from '../../src/modules/renal-electrolyte/hypomagnesemia-completion';

const VERSION = '0.1.0-alpha.48';

describe('Requirement: the hypomagnesemia completion record binds to this exact content', () => {
  it('reports every requirement, with the two that need people still missing', () => {
    const rows = evidence(SCENARIO, VERSION, 'renal-electrolyte');
    expect(rows).toHaveLength(9);
    expect(rows.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    for (const row of rows) expect(row.evidence.join(' ').length).toBeGreaterThan(60);
  });

  it('says nothing about a scenario, module, or capability version it was not written for', () => {
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')).not.toEqual([]);
    expect(evidence(SCENARIO, VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(evidence(SCENARIO, '0.1.0-alpha.47', 'renal-electrolyte')).toEqual([]);
    expect(evidence({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.2.0' } },
      VERSION, 'renal-electrolyte')).toEqual([]);
    // Any edit to the scenario, however small, invalidates the claim until it is re-made.
    expect(evidence({ ...SCENARIO, patient: { ...SCENARIO.patient, ageYears: 72 } },
      VERSION, 'renal-electrolyte')).toEqual([]);
  });

  it('binds the fixture seed it names', () => {
    expect(FIXTURES.seed).toBe(5011);
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(FIXTURES.contentVersion).toBe(SCENARIO.metadata.version);
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')
      .find(({ id }) => id === 'deterministic-seed-policy')!.evidence.join(' ')).toContain('5011');
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
    for (const rubric of SCENARIO.debrief.rubric) {
      expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toContain(rubric.objectiveId);
    }
  });

  it('carries the half of each source that undercuts the taught step', () => {
    const sources = SCENARIO.metadata.clinicalReview.sources.join(' ');
    expect(sources).toContain('does not necessarily cause hypokalemia');
    expect(sources).toContain('is contested, and is not adopted');
    expect(sources).toContain('establishes no threshold');
  });
});
