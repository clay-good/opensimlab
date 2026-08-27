import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { THYROID_STORM_HEMODYNAMIC_RISK as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/thyroid-storm-hemodynamic-risk';
import { supportsThyroidDemonstration, thyroidDemonstrationStep, THYROID_DEMONSTRATION_VERSION } from '../../src/modules/endocrine-metabolic/demo/thyroid-demonstration';
import {
  ThyroidStorm, THYROID_DELAY_TICKS, THYROID_IODINE_WAIT_TICKS, THYROID_RESPONSE_TICKS,
  THYROID_TAKEOVER_TICKS, THYROID_SESSION_TICKS, type ThyroidStormAction, type ThyroidStormEvent,
} from '../../src/modules/endocrine-metabolic/thyroid-storm';

const initialActions: readonly ThyroidStormAction[] = ['synthesis-blockade', 'supportive-care',
  'call-support', 'assess-circulation', 'rate-control-review'];
const expectedActions = [...initialActions, 'reassess', 'iodine', 'reassess', 'handoff'];
function prepare(model: ThyroidStorm) { for (const action of initialActions) model.apply(action, 0); }

describe('Thyroid storm observed-state worked example', () => {
  it.each([1, 37, 600])('makes nine accepted decisions at a %i-tick cadence and replays every state and event', (cadence) => {
    const model = new ThyroidStorm(); const actions: { tick: number; action: ThyroidStormAction }[] = [];
    const events: ThyroidStormEvent[] = []; const hash = createHash('sha256');
    const sample = (patient: ThyroidStorm, tick: number, emitted: ThyroidStormEvent[]) =>
      JSON.stringify({ tick, vitals: patient.vitals(), patient: patient.snapshot(tick), events: emitted });
    let lastTick = 0;
    for (let tick = 0; tick <= THYROID_SESSION_TICKS; tick += 1) {
      const emitted = model.advance(tick);
      if (tick % cadence === 0) {
        const step = thyroidDemonstrationStep(model.snapshot(tick));
        if (step.action) { actions.push({ tick, action: step.action }); emitted.push(...model.apply(step.action, tick)); }
      }
      events.push(...emitted); hash.update(sample(model, tick, emitted)); lastTick = tick;
      if (model.snapshot(tick).ended) break;
    }
    expect(actions.map((entry) => entry.action)).toEqual(expectedActions);
    expect(model.snapshot(lastTick)).toMatchObject({ ended: 'handoff', responseObserved: true,
      waitForLabsChosen: false, blanketBetaBlockadeChosen: false, earlyIodineAttempted: false,
      urgentCoverageDelayed: false, durableRecoveryProven: false });
    expect(events.some((entry) => /refused|delay|incomplete|takeover/.test(entry.id))).toBe(false);
    const iodine = actions.find((entry) => entry.action === 'iodine')!;
    const checks = actions.filter((entry) => entry.action === 'reassess');
    expect(checks).toHaveLength(2); expect(checks[0]!.tick).toBeLessThan(iodine.tick);
    expect(iodine.tick - actions[0]!.tick).toBeGreaterThanOrEqual(THYROID_IODINE_WAIT_TICKS);
    expect(checks[1]!.tick - iodine.tick).toBeGreaterThanOrEqual(THYROID_RESPONSE_TICKS);
    const replay = new ThyroidStorm(); const replayHash = createHash('sha256');
    for (let tick = 0; tick <= lastTick; tick += 1) {
      const emitted = replay.advance(tick);
      for (const entry of actions) if (entry.tick === tick) emitted.push(...replay.apply(entry.action, tick));
      replayHash.update(sample(replay, tick, emitted));
    }
    expect(replayHash.digest('hex')).toBe(hash.digest('hex'));
  });

  it('checks early once, then waits for the exact source-derived iodine boundary', () => {
    const model = new ThyroidStorm(); prepare(model);
    expect(thyroidDemonstrationStep(model.snapshot(0))).toMatchObject({ id: 'early-reassessment', action: 'reassess' });
    model.apply('reassess', 1);
    for (const tick of [1, 2, THYROID_IODINE_WAIT_TICKS - 1]) {
      const step = thyroidDemonstrationStep(model.snapshot(tick));
      expect(step.id).toBe('iodine-observation'); expect(step.action).toBeUndefined();
      expect(step.narration).toContain('source-derived'); expect(step.narration).toContain('pathways differ');
    }
    const due = thyroidDemonstrationStep(model.snapshot(THYROID_IODINE_WAIT_TICKS));
    expect(due).toMatchObject({ id: 'iodine', action: 'iodine' });
    expect(model.apply(due.action, THYROID_IODINE_WAIT_TICKS).at(-1)?.id).toBe('iodine');
  });

  it('waits for actual model progression even at a zero response timer, then requires a fresh observation', () => {
    const model = new ThyroidStorm(); prepare(model); model.apply('reassess', 1);
    model.apply('iodine', THYROID_IODINE_WAIT_TICKS);
    const responseTick = THYROID_IODINE_WAIT_TICKS + THYROID_RESPONSE_TICKS;
    for (const tick of [THYROID_IODINE_WAIT_TICKS, responseTick - 1, responseTick]) {
      const step = thyroidDemonstrationStep(model.snapshot(tick));
      expect(step.id).toBe('partial-support-observation'); expect(step.action).toBeUndefined();
      expect(step.narration).toContain('authored 2-hour');
    }
    model.advance(responseTick);
    expect(model.snapshot(responseTick).observation?.atTick).toBe(1);
    expect(thyroidDemonstrationStep(model.snapshot(responseTick))).toMatchObject({
      id: 'post-treatment-reassessment', action: 'reassess',
    });
    model.apply('reassess', responseTick);
    const handoff = thyroidDemonstrationStep(model.snapshot(responseTick));
    expect(handoff.action).toBe('handoff'); expect(handoff.narration).toContain('not discharge clearance');
    model.apply('handoff', responseTick);
    expect(thyroidDemonstrationStep(model.snapshot(responseTick))).toMatchObject({ finished: true, progress: 1 });
  });

  it('does not reveal the supplied circulation findings before the assessment is opened', () => {
    const model = new ThyroidStorm();
    for (const action of initialActions) {
      const step = thyroidDemonstrationStep(model.snapshot(0));
      if (action !== 'rate-control-review') expect(step.narration).not.toMatch(/shows congestion|poor perfusion/);
      expect(step.action).toBe(action); model.apply(action, 0);
      if (action === 'assess-circulation') {
        expect(thyroidDemonstrationStep(model.snapshot(0)).narration).toContain('opened circulation assessment');
      }
    }
  });

  it('recovers from prior mistakes and an existing observation without repeating the early reassessment', () => {
    const model = new ThyroidStorm();
    model.apply('wait-for-labs', 0); model.apply('blanket-beta-blockade', 1); model.apply('iodine', 2);
    model.apply('reassess', 3); model.advance(THYROID_DELAY_TICKS);
    const actions: ThyroidStormAction[] = [];
    for (let tick = THYROID_DELAY_TICKS + 1; tick <= THYROID_SESSION_TICKS; tick += 1) {
      model.advance(tick);
      const step = thyroidDemonstrationStep(model.snapshot(tick));
      if (step.action) { actions.push(step.action); model.apply(step.action, tick); }
      if (model.snapshot(tick).ended) break;
    }
    expect(actions).toEqual([...initialActions, 'iodine', 'reassess', 'handoff']);
    expect(model.snapshot(THYROID_SESSION_TICKS)).toMatchObject({ ended: 'handoff', waitForLabsChosen: true,
      blanketBetaBlockadeChosen: true, earlyIodineAttempted: true, urgentCoverageDelayed: true });
  });

  it.each([THYROID_TAKEOVER_TICKS, THYROID_SESSION_TICKS])('does not backdate decisions after the %i-tick stop', (tick) => {
    const model = new ThyroidStorm();
    if (tick === THYROID_SESSION_TICKS) prepare(model);
    model.advance(tick);
    const step = thyroidDemonstrationStep(model.snapshot(tick));
    expect(step).toMatchObject({ id: 'finished', finished: true, progress: 1 });
    expect(step.narration).toContain('Instructor takeover'); expect(step.action).toBeUndefined();
  });

  it('isolates the exact content version and waits without action for the first snapshot', () => {
    expect(THYROID_DEMONSTRATION_VERSION).toBe('0.1.0'); expect(supportsThyroidDemonstration(SCENARIO)).toBe(true);
    for (const version of ['0.0.9', '0.1.1']) expect(supportsThyroidDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version },
    })).toBe(false);
    expect(supportsThyroidDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'routine-induction' } })).toBe(false);
    expect(supportsThyroidDemonstration({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) })).toBe(false);
    expect(thyroidDemonstrationStep()).toMatchObject({ id: 'preparing', progress: 0 });
    expect(thyroidDemonstrationStep().action).toBeUndefined();
  });
});
