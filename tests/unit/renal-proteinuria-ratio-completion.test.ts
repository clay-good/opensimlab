/**
 * The completion record is a claim about this exact content, and about a refusal that is not a verdict.
 *
 * This lab refuses both available labels -- progression and stability -- and refuses a treatment
 * change without endorsing the treatment. Those are the sentences that keep it from becoming
 * advice, so they are asserted in the narrative as well as in the engine.
 */
import { describe, expect, it } from 'vitest';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { RENAL_PROTEINURIA_RATIO as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not';
import { RENAL_PROTEINURIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/proteinuria-ratio-fixtures';
import { renalProteinuriaRatioCompletionEvidence as evidence } from '../../src/modules/renal-electrolyte/proteinuria-ratio-completion';

const VERSION = '0.1.0-alpha.48';

describe('Requirement: the proteinuria completion record binds to this exact content', () => {
  it('reports every requirement, with the two that need people still missing', () => {
    const rows = evidence(SCENARIO, VERSION, 'renal-electrolyte');
    expect(rows).toHaveLength(9);
    expect(rows.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    for (const row of rows) expect(row.evidence.join(' ').length).toBeGreaterThan(60);
  });

  it('describes the progression as narrowing rather than closing', () => {
    const progression = evidence(SCENARIO, VERSION, 'renal-electrolyte')
      .find(({ id }) => id === 'meaningful-progression')!.evidence.join(' ');
    expect(progression).toContain('narrows the question rather than closing it');
    expect(progression).toContain('not a timed collection');
  });

  it('says nothing about a scenario, module, or capability version it was not written for', () => {
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')).not.toEqual([]);
    expect(evidence(SCENARIO, VERSION, 'neurology')).toEqual([]);
    expect(evidence(SCENARIO, '0.1.0-alpha.47', 'renal-electrolyte')).toEqual([]);
    expect(evidence({ ...SCENARIO, patient: { ...SCENARIO.patient, ageYears: 48 } },
      VERSION, 'renal-electrolyte')).toEqual([]);
  });

  it('binds the fixture seed it names', () => {
    expect(FIXTURES.seed).toBe(5077);
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(evidence(SCENARIO, VERSION, 'renal-electrolyte')
      .find(({ id }) => id === 'deterministic-seed-policy')!.evidence.join(' ')).toContain('5077');
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
    expect(sources).toContain('not a rule that a smaller change is meaningless in an unstable one');
    expect(sources).toContain('argues for better sampling rather than against sampling');
    expect(sources).toContain('rather than establishing a general threshold');
  });

  it('refuses both labels in the narrative, not just one', () => {
    const boundary = SCENARIO.timeline.find(({ target }) => target === 'renal-proteinuria-boundary')!.message;
    expect(boundary).toContain('does not establish the change is noise and does not establish it is real');
    expect(boundary).toContain('agreement, not proof that nothing is happening');
    expect(boundary).toContain('narrows the question and does not close it');
    expect(boundary).toContain('selects no drug, no dose, and no treatment change');
  });
});
