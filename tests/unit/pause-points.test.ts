import { describe, expect, it } from 'vitest';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import type { Scenario, ScenarioPausePoint } from '@anesthesia/scenarios/types';
import { duePausePoint } from '@platform/facilitation/pause-points';
import { facilitatorGuide } from '@platform/facilitation/guide';

/** Like authored content, an absent field is omitted rather than set to undefined. */
const point = (overrides: Partial<ScenarioPausePoint> = {}): ScenarioPausePoint => Object.fromEntries(
  Object.entries({ id: 'before-induction', atTick: 600, question: 'What would you want ready before the first drug goes in?',
    region: 'actions', ...overrides }).filter(([, value]) => value !== undefined),
) as unknown as ScenarioPausePoint;
const withPoints = (pausePoints: readonly ScenarioPausePoint[]): Scenario => ({ ...ROUTINE_INDUCTION, pausePoints });

describe('pause points in the scenario format', () => {
  it('accepts a tick or a one-comparison predicate', () => {
    expect(validateScenario(withPoints([point(), point({ id: 'falling', atTick: undefined, when: 'spo2Percent < 92' })])))
      .toEqual([]);
  });

  it.each([
    ['both a tick and a predicate', point({ when: 'spo2Percent < 92' }), 'oneOf'],
    ['neither', point({ atTick: undefined }), 'oneOf'],
    ['a predicate the grammar refuses', point({ atTick: undefined, when: 'spo2Percent < 92 && heartRateBpm > 1' }), 'predicate'],
    ['a question over 200 characters', point({ question: `Why ${'x'.repeat(200)}?` }), 'maxLength'],
    ['a region that does not exist', point({ region: 'ceiling' as never }), 'enum'],
  ])('refuses %s', (_, candidate, rule) => {
    expect(validateScenario(withPoints([candidate])).map((error) => error.rule)).toContain(rule);
  });

  it('refuses a duplicated id', () => {
    expect(validateScenario(withPoints([point(), point()])).map((error) => error.rule)).toContain('unique');
  });
});

describe('when a pause point is due', () => {
  const points = [point(), point({ id: 'falling', atTick: undefined, when: 'spo2Percent < 92' })];

  it('fires at its tick or when its predicate first holds, once each', () => {
    expect(duePausePoint(points, 599, { spo2Percent: 99 }, new Set())).toBeNull();
    expect(duePausePoint(points, 600, { spo2Percent: 99 }, new Set())?.id).toBe('before-induction');
    expect(duePausePoint(points, 900, { spo2Percent: 90 }, new Set(['before-induction']))?.id).toBe('falling');
    expect(duePausePoint(points, 900, { spo2Percent: 90 }, new Set(['before-induction', 'falling']))).toBeNull();
  });

  it('does nothing for a scenario without pause points', () => {
    expect(duePausePoint(undefined, 10_000, {}, new Set())).toBeNull();
  });

  it('lists declared pause points in the facilitator guide', () => {
    const guide = facilitatorGuide({ moduleRoute: 'anesthesia', moduleName: 'Anesthesia', scenario: withPoints(points) });
    const section = guide.find((entry) => entry.id === 'pause-points')!;
    expect(section.status).toBe('present');
    if (section.status === 'present') expect(section.items.map((item) => item.label)).toEqual(['Tick 600', 'When spo2Percent < 92']);
  });
});

describe('authored pause points', () => {
  it('validate on both persistent VF lessons, sit on their scheduled moments, and never name the rhythm', async () => {
    const { PERSISTENT_VF_CARDIAC_ARREST } = await import('@anesthesia/scenarios/persistent-vf-cardiac-arrest');
    const { PERSISTENT_VF_ARREST } = await import('../../src/modules/emergency-medicine/scenarios/persistent-vf-arrest');
    for (const scenario of [PERSISTENT_VF_CARDIAC_ARREST, PERSISTENT_VF_ARREST]) {
      expect(validateScenario(scenario)).toEqual([]);
      expect(scenario.pausePoints?.length).toBeGreaterThanOrEqual(2);
      const ticks = new Set(scenario.timeline.map((event) => event.atTick));
      for (const point of scenario.pausePoints!) {
        expect(point.atTick === 1 || ticks.has(point.atTick)).toBe(true);
        expect(point.question).not.toMatch(/fibrillation|\bVF\b|shock|epinephrine|defibrillat/i);
        expect(point.question.trim().endsWith('?')).toBe(true);
      }
    }
  });
});
