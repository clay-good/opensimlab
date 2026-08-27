import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SEVERE_HYPOGLYCEMIA_RECURRENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/severe-hypoglycemia-recurrence';
import { hypoglycemiaDemonstrationStep, supportsHypoglycemiaDemonstration } from '../../src/modules/endocrine-metabolic/demo/hypoglycemia-demonstration';
import { SevereHypoglycemia } from '../../src/modules/endocrine-metabolic/severe-hypoglycemia';

describe('Hypoglycemia worked example', () => {
  it.each([1, 37, 600])('waits for actual responses at a %i-tick display cadence and replays exactly', (cadence) => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4901, practiceRegion: 'US' });
    const actions: LearnerAction[] = []; const events: EngineEvent[] = []; const trace = createHash('sha256');
    let ticks = 0;
    for (; ticks < 36000; ticks += 1) {
      if (ticks % cadence === 0) {
        const step = hypoglycemiaDemonstrationStep(engine.equipment().resuscitation.severeHypoglycemia);
        if (step.action) {
          const action = { tick: ticks, type: 'severe-hypoglycemia-response', payload: { action: step.action } };
          actions.push(action); engine.apply(action);
        }
      }
      const frame = engine.step(); events.push(...frame.events); trace.update(JSON.stringify(frame.state));
      if (frame.equipment.resuscitation.severeHypoglycemia?.ended) { ticks += 1; break; }
    }
    expect(actions.map((action) => action.payload.action)).toEqual(['check-glucose', 'call-support', 'iv-rescue', 'check-glucose', 'review-medications', 'continue-monitoring', 'check-glucose', 'iv-rescue', 'check-glucose', 'handoff']);
    expect(engine.equipment().resuscitation.severeHypoglycemia?.ended).toBe('handoff');
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], events).map((entry) => entry.outcome)).toEqual(Array(5).fill('met'));
    expect(events.some((event) => /refused|unsafe-oral|takeover/.test(event.eventId))).toBe(false);
    const replay = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4901, practiceRegion: 'US' });
    const replayTrace = createHash('sha256');
    for (let tick = 0; tick < ticks; tick += 1) {
      for (const action of actions) if (action.tick === tick) replay.apply(action);
      replayTrace.update(JSON.stringify(replay.step().state));
    }
    expect(replayTrace.digest('hex')).toBe(trace.digest('hex'));
  }, 30_000);
  it('does not invent a missed first recheck or send actions after takeover', () => {
    const model = new SevereHypoglycemia();
    model.apply('check-glucose', 0); model.apply('call-support', 0); model.apply('iv-rescue', 0);
    model.advance(18000);
    expect(hypoglycemiaDemonstrationStep(model.snapshot(18000))).toMatchObject({ id: 'missed-checkpoint', finished: true });
    expect(hypoglycemiaDemonstrationStep(model.snapshot(18000)).action).toBeUndefined();
    model.advance(27000);
    expect(hypoglycemiaDemonstrationStep(model.snapshot(27000))).toMatchObject({ id: 'finished', finished: true });
  });
  it('offers the example only for the exact supported lesson version', () => {
    expect(supportsHypoglycemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsHypoglycemiaDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(supportsHypoglycemiaDemonstration({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) })).toBe(false);
    expect(hypoglycemiaDemonstrationStep().action).toBeUndefined();
  });
});
