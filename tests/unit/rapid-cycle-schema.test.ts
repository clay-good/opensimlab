import { describe, expect, it } from 'vitest';
import { isRecognitionObjective, validateScenario } from '@anesthesia/scenarios/schema';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import type { Scenario, ScenarioRapidCycle } from '@anesthesia/scenarios/types';

const objective = ROUTINE_INDUCTION.metadata.objectives.find((entry) => !isRecognitionObjective(entry.id))!;
const point = (overrides: Partial<ScenarioRapidCycle> = {}): ScenarioRapidCycle => ({
  id: 'ventilate-in-time', objectiveId: objective.id, atTick: 600, windowTicks: 300, actionType: 'ventilator',
  directive: 'Start ventilation before the saturation falls, not after.',
  sourceLocator: 'Scenario source 1, airway management section', cycleCap: 4, ...overrides,
});
const withPoints = (rapidCycle: readonly ScenarioRapidCycle[]): Scenario => ({ ...ROUTINE_INDUCTION, rapidCycle });
const rules = (candidate: ScenarioRapidCycle) => validateScenario(withPoints([candidate])).map((error) => error.rule);

describe('rapid-cycle decision points', () => {
  it('accepts a timed protocol objective with a directive, a source, and a cap of 3 to 6', () => {
    expect(validateScenario(withPoints([point()]))).toEqual([]);
    expect(validateScenario(withPoints([point({ cycleCap: 3 }), point({ id: 'second', cycleCap: 6 })]))).toEqual([]);
  });

  it('refuses a recognition objective, because telling a learner what to notice is cue leakage', () => {
    const recognition = { id: 'recognize-the-falling-saturation', statement: 'Recognize the falling saturation early.', measure: 'The fall was named before the alarm.' };
    const scenario: Scenario = { ...ROUTINE_INDUCTION,
      metadata: { ...ROUTINE_INDUCTION.metadata, objectives: [...ROUTINE_INDUCTION.metadata.objectives, recognition] },
      debrief: { rubric: [...ROUTINE_INDUCTION.debrief.rubric, { id: 'r', objectiveId: recognition.id, question: 'What did you notice first?' }] },
      rapidCycle: [point({ objectiveId: recognition.id })] };
    expect(validateScenario(scenario).map((error) => error.rule)).toContain('recognition');
  });

  it.each([
    ['an undeclared objective', point({ objectiveId: 'not-an-objective' }), 'reference'],
    ['a directive over 160 characters', point({ directive: `Do ${'x'.repeat(160)}.` }), 'maxLength'],
    ['a cap below 3', point({ cycleCap: 2 }), 'minimum'],
    ['a cap above 6', point({ cycleCap: 7 }), 'maximum'],
  ])('refuses %s', (_, candidate, rule) => {
    expect(rules(candidate)).toContain(rule);
  });

  it('names recognition objectives by their verb', () => {
    expect(isRecognitionObjective('recognize-post-repositioning-ventilation-change')).toBe(true);
    expect(isRecognitionObjective('recognise-the-pattern')).toBe(true);
    expect(isRecognitionObjective('early-recognition-of-shock')).toBe(true);
    expect(isRecognitionObjective('defibrillate-without-delay')).toBe(false);
  });
});
