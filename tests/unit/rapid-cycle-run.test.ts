import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario, isRecognitionObjective } from '@anesthesia/scenarios/schema';
import { offeredRapidCycle, rapidCycleStatus } from '@anesthesia/catalog/rapid-cycle';
import { PERSISTENT_VF_CARDIAC_ARREST as SCENARIO } from '@anesthesia/scenarios/persistent-vf-cardiac-arrest';

const point = SCENARIO.rapidCycle![0]!;

describe('the persistent VF rapid-cycle point', () => {
  it('is valid, serves a timed protocol step, and opens at the scheduled VF event', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(isRecognitionObjective(point.objectiveId)).toBe(false);
    const vf = SCENARIO.timeline.find((event) => event.type === 'rhythm-change' && event.target === 'ventricular-fibrillation');
    expect(point.atTick).toBe(vf?.atTick);
    expect(point.windowTicks).toBe(200);
    expect(point.directive.length).toBeLessThanOrEqual(160);
  });

  it('restores the same state at the decision tick every time, so each cycle starts identically', () => {
    const run = () => {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4242, practiceRegion: 'US' });
      let frame = engine.step();
      while (frame.tick < point.atTick) frame = engine.step();
      return frame.state;
    };
    expect(run()).toEqual(run());
  });
});

describe('a rapid cycle in progress', () => {
  const compressions = (tick: number) => ({ tick, type: 'chest-compressions' });

  it('lands when the expected action is accepted inside the window', () => {
    expect(rapidCycleStatus(point, [compressions(450)], 460)).toBe('landed');
    expect(rapidCycleStatus(point, [compressions(500)], 600)).toBe('landed');
  });

  it('waits until the window closes, then reports a miss', () => {
    expect(rapidCycleStatus(point, [], 499)).toBe('waiting');
    expect(rapidCycleStatus(point, [compressions(501)], 520)).toBe('missed');
    expect(rapidCycleStatus(point, [{ tick: 350, type: 'bolus' }], 520)).toBe('missed');
    expect(rapidCycleStatus(point, [compressions(250)], 520)).toBe('missed');
  });

  it('is offered only with guidance, and only for an objective not yet met', () => {
    const unmet = new Set([point.objectiveId]);
    expect(offeredRapidCycle(SCENARIO.rapidCycle, unmet, 'coached')).toBe(point);
    expect(offeredRapidCycle(SCENARIO.rapidCycle, unmet, 'unassisted')).toBeUndefined();
    expect(offeredRapidCycle(SCENARIO.rapidCycle, new Set(), 'guided')).toBeUndefined();
  });
});
