import { describe, expect, it } from 'vitest';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../src/modules/medical-surgical-nursing/scenarios';
import {
  NCJMM_BY_VERB, NCJMM_NOT_EXERCISED_REASON, NCSBN_NCJMM, ncjmmCoverage, ncjmmMappings,
} from '../../src/modules/medical-surgical-nursing/curriculum';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';
import { educationalAlignmentFor } from '@platform/docs/structured-data';
import { facilitatorGuide } from '@platform/facilitation/guide';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { NcjmmCoverageList } from '@anesthesia/ui/NcjmmCoverageList';

describe('NCJMM mapping for the nursing lessons', () => {
  const mappings = ncjmmMappings(MEDICAL_SURGICAL_NURSING_SCENARIOS);

  it('is a valid framework record with NCSBN\'s six step names', () => {
    expect(frameworkRecordProblems(NCSBN_NCJMM)).toEqual([]);
    expect(NCSBN_NCJMM.domains.map((step) => step.label)).toEqual(['Recognize cues', 'Analyze cues',
      'Prioritize hypotheses', 'Generate solutions', 'Take action', 'Evaluate outcomes']);
  });

  it('maps every nursing objective, each with the evidence its debrief records', () => {
    const objectives = MEDICAL_SURGICAL_NURSING_SCENARIOS.flatMap((scenario) => scenario.metadata.objectives);
    expect(mappings).toHaveLength(objectives.length);
    for (const mapping of mappings) {
      expect(mapping.steps.length).toBeGreaterThan(0);
      expect(mapping.evidence.length).toBeGreaterThan(10);
    }
  });

  it('refuses an objective whose verb the convention does not place', () => {
    const odd = { ...MEDICAL_SURGICAL_NURSING_SCENARIOS[0]!, metadata: { ...MEDICAL_SURGICAL_NURSING_SCENARIOS[0]!.metadata,
      objectives: [{ id: 'diagnose-something', statement: 'x', measure: 'y' }] } };
    expect(() => ncjmmMappings([odd])).toThrow('does not place');
  });

  it('states a reason for every step no lesson exercises, and exercises the rest', () => {
    const exercised = new Set(Object.values(NCJMM_BY_VERB).flat());
    for (const step of NCSBN_NCJMM.domains) {
      if (!exercised.has(step.id as never)) expect(NCJMM_NOT_EXERCISED_REASON[step.id as keyof typeof NCJMM_NOT_EXERCISED_REASON]).toBeTruthy();
    }
    expect(new Set(mappings.flatMap((mapping) => mapping.steps))).toEqual(exercised);
  });

  it('appears in every nursing guide and briefing, and says it is not NCSBN\'s', () => {
    for (const entry of FACILITATED_SCENARIOS.filter((candidate) => candidate.moduleRoute === 'medical-surgical-nursing')) {
      const section = facilitatorGuide(entry).find((candidate) => candidate.id === 'frameworks')!;
      if (section.status !== 'present') throw new Error('absent');
      expect(section.items.some((item) => item.text.includes('NCSBN has not reviewed or endorsed'))).toBe(true);
      expect(section.items.find((item) => item.label === 'NCJMM: Evaluate outcomes')?.text).toMatch(/^Not exercised\./);
      expect(educationalAlignmentFor('medical-surgical-nursing', entry.scenario.metadata.id).length).toBeGreaterThan(0);
    }
  });
});

describe('NCJMM coverage in the nursing debrief', () => {
  const scenario = MEDICAL_SURGICAL_NURSING_SCENARIOS[0]!;
  const findingsWith = (outcome: string, except?: { id: string; outcome: string }) =>
    scenario.metadata.objectives.map((objective) => ({
      objectiveId: objective.id, outcome: except?.id === objective.id ? except.outcome : outcome,
    }));
  const byStep = (findings: ReturnType<typeof findingsWith>) =>
    Object.fromEntries(ncjmmCoverage(scenario, findings).map((entry) => [entry.step, entry.status]));

  it('reads evidenced, exercised, or not exercised from the run\'s own outcomes', () => {
    expect(byStep(findingsWith('met'))).toMatchObject({ 'recognize-cues': 'evidenced', 'take-action': 'evidenced' });
    expect(byStep(findingsWith('partly-met'))).toMatchObject({ 'recognize-cues': 'exercised' });
    expect(byStep(findingsWith('not-exercised'))).toMatchObject({ 'recognize-cues': 'not-exercised' });
  });

  it('always shows Evaluate outcomes as not exercised, with the structural reason', () => {
    const evaluate = ncjmmCoverage(scenario, findingsWith('met')).find((entry) => entry.step === 'evaluate-outcomes')!;
    expect(evaluate).toMatchObject({ status: 'not-exercised', note: NCJMM_NOT_EXERCISED_REASON['evaluate-outcomes'] });
  });

  it('renders all six steps with no total, and says the reading is not NCSBN\'s', () => {
    const markup = renderToStaticMarkup(createElement(NcjmmCoverageList, { scenario, findings: findingsWith('met') as never }));
    for (const step of NCSBN_NCJMM.domains) expect(markup).toContain(step.label);
    expect(markup).toContain('There is no total across the steps');
    expect(markup).toContain('NCSBN has not');
    const visible = markup.replace(/<[^>]+>/g, ' ');
    expect(visible).not.toMatch(/\d+\s*(?:of|\/)\s*6|\d\s*%|\bscore\b/i);
  });
});
