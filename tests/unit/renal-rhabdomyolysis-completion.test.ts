/**
 * The completion record is a claim about this exact content, and about the limits it keeps.
 *
 * This lab quotes cohort percentages and argues about two familiar treatments, so its sources
 * have to carry their own weaknesses and its boundary narrative has to keep the numbers from
 * reading as a prognosis or a protocol. Both are asserted here rather than left to review.
 */
import { describe, expect, it } from 'vitest';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { RENAL_RHABDOMYOLYSIS_NUMBER as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/rhabdomyolysis-a-number-that-does-not-carry-the-risk';
import { RENAL_RHABDOMYOLYSIS_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/rhabdomyolysis-fixtures';
import { renalRhabdomyolysisCompletionEvidence as evidence } from '../../src/modules/renal-electrolyte/rhabdomyolysis-completion';

const VERSION = '0.1.0-alpha.48';

describe('Requirement: the rhabdomyolysis completion record binds to this exact content', () => {
  it('reports every requirement, with the two that need people still missing', () => {
    const rows = evidence(SCENARIO, VERSION, 'renal-electrolyte');
    expect(rows).toHaveLength(9);
    expect(rows.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    for (const row of rows) expect(row.evidence.join(' ').length).toBeGreaterThan(60);
  });

  it('says nothing about a scenario, module, or capability version it was not written for', () => {
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')).not.toEqual([]);
    expect(evidence(SCENARIO, VERSION, 'critical-care')).toEqual([]);
    expect(evidence(SCENARIO, '0.1.0-alpha.47', 'renal-electrolyte')).toEqual([]);
    expect(evidence({ ...SCENARIO, patient: { ...SCENARIO.patient, ageYears: 25 } },
      VERSION, 'renal-electrolyte')).toEqual([]);
  });

  it('binds the fixture seed it names', () => {
    expect(FIXTURES.seed).toBe(5037);
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')
      .find(({ id }) => id === 'deterministic-seed-policy')!.evidence.join(' ')).toContain('5037');
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
    expect(sources).toContain('not a prediction for an individual');
    expect(sources).toContain('Absence of demonstrated benefit is not demonstrated absence of benefit');
    expect(sources).toContain('generalises to almost nobody');
  });

  it('keeps the cohort percentages from becoming a prognosis or a protocol', () => {
    const boundary = SCENARIO.timeline.find(({ target }) => target === 'renal-rhabdomyolysis-boundary')!.message;
    expect(boundary).toContain('not a prognosis for this fictional patient');
    expect(boundary).toContain('no score, threshold, cutoff, dialysis criterion, or discharge criterion is taught here');
    expect(boundary).toContain('not a reason to withhold fluid');
    expect(boundary).toContain('No volume, rate, product, or alkalinization target is selected');
  });
});
