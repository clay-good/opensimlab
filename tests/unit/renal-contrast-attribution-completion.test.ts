/**
 * The completion record is a claim about this exact content, and about what it refuses to say.
 *
 * The two missing requirements are missing on purpose. The scenario's own declarations matter
 * more here than in most labs: this is a lesson about a contested causal claim, so the sources
 * must carry their own limits, and the boundary narrative must keep the lesson away from any
 * decision about whether contrast should be given to anyone.
 */
import { describe, expect, it } from 'vitest';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { RENAL_CONTRAST_ATTRIBUTION_LABEL as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/contrast-attribution-a-label-that-stopped-the-search';
import { RENAL_CONTRAST_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/contrast-attribution-fixtures';
import { renalContrastAttributionCompletionEvidence as evidence } from '../../src/modules/renal-electrolyte/contrast-attribution-completion';

const VERSION = '0.1.0-alpha.48';

describe('Requirement: the contrast-attribution completion record binds to this exact content', () => {
  it('reports every requirement, with the two that need people still missing', () => {
    const rows = evidence(SCENARIO, VERSION, 'renal-electrolyte');
    expect(rows).toHaveLength(9);
    expect(rows.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    for (const row of rows) expect(row.evidence.join(' ').length).toBeGreaterThan(60);
  });

  it('says nothing about a scenario, module, or capability version it was not written for', () => {
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')).not.toEqual([]);
    expect(evidence(SCENARIO, VERSION, 'infectious-disease')).toEqual([]);
    expect(evidence(SCENARIO, '0.1.0-alpha.47', 'renal-electrolyte')).toEqual([]);
    expect(evidence({ ...SCENARIO, patient: { ...SCENARIO.patient, ageYears: 67 } },
      VERSION, 'renal-electrolyte')).toEqual([]);
  });

  it('binds the fixture seed it names', () => {
    expect(FIXTURES.seed).toBe(5023);
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')
      .find(({ id }) => id === 'deterministic-seed-policy')!.evidence.join(' ')).toContain('5023');
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
    expect(sources).toContain('does not claim contrast-induced injury never occurs');
    expect(sources).toContain('rather than removing it');
    expect(sources).toContain('Non-inferiority is not equivalence');
  });

  it('keeps the lesson away from any decision about giving contrast', () => {
    const boundary = SCENARIO.timeline.find(({ target }) => target === 'renal-contrast-boundary')!.message;
    expect(boundary).toContain('does not replace it with a different cause');
    expect(boundary).toContain('decides whether contrast should be given to anyone');
    expect(boundary).toContain('sets a threshold or an eGFR cutoff');
    // The authored trend is inert, and the narrative has to say so where a learner will read it.
    expect(boundary).toContain('The creatinine keeps rising across this rehearsal whatever is done');
  });
});
