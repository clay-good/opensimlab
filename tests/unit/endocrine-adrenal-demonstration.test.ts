import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/adrenal-crisis-treatment-before-tests';
import { adrenalDemonstrationStep, supportsAdrenalDemonstration } from '../../src/modules/endocrine-metabolic/demo/adrenal-demonstration';
import { AdrenalCrisis, ADRENAL_TAKEOVER_TICKS } from '../../src/modules/endocrine-metabolic/adrenal-crisis';

describe('Adrenal worked example', () => {
  it.each([1, 37, 600])('follows observed state at a %i-tick cadence and replays the whole trace exactly', (cadence) => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4902, practiceRegion: 'US' });
    const actions: LearnerAction[] = []; const events: EngineEvent[] = []; const trace = createHash('sha256');
    const sample = (frame: ReturnType<AnesthesiaEngine['step']>) => JSON.stringify({ state: frame.state,
      patient: frame.equipment.resuscitation.adrenalCrisis, events: frame.events });
    let ticks = 0;
    for (; ticks < ADRENAL_TAKEOVER_TICKS; ticks += 1) {
      if (ticks % cadence === 0) {
        const step = adrenalDemonstrationStep(engine.equipment().resuscitation.adrenalCrisis);
        if (step.action) {
          const action = { tick: ticks, type: 'adrenal-crisis-response', payload: { action: step.action } };
          actions.push(action); engine.apply(action);
        }
      }
      const frame = engine.step(); events.push(...frame.events); trace.update(sample(frame));
      if (frame.equipment.resuscitation.adrenalCrisis?.ended) { ticks += 1; break; }
    }
    expect(actions.map((action) => action.payload.action)).toEqual(['hydrocortisone', 'saline', 'call-support', 'review-record', 'reassess', 'prevention', 'handoff']);
    expect(engine.equipment().resuscitation.adrenalCrisis?.ended).toBe('handoff');
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], events).map((entry) => entry.outcome)).toEqual(Array(4).fill('met'));
    expect(events.some((event) => /refused|incomplete-rescue|diagnostic-delay|takeover/.test(event.eventId))).toBe(false);
    const replay = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4902, practiceRegion: 'US' });
    const replayTrace = createHash('sha256');
    for (let tick = 0; tick < ticks; tick += 1) {
      for (const action of actions) if (action.tick === tick) replay.apply(action);
      replayTrace.update(sample(replay.step()));
    }
    expect(replayTrace.digest('hex')).toBe(trace.digest('hex'));
  }, 30_000);
  it('waits for an actual response, then requires fresh observation and prevention before handoff', () => {
    const model = new AdrenalCrisis();
    model.apply('saline', 0);
    expect(adrenalDemonstrationStep(model.snapshot(0)).action).toBe('hydrocortisone');
    model.apply('hydrocortisone', 1); model.apply('call-support', 1); model.apply('review-record', 1);
    expect(adrenalDemonstrationStep(model.snapshot(6001))).toMatchObject({ id: 'observation' });
    expect(adrenalDemonstrationStep(model.snapshot(6001)).action).toBeUndefined();
    model.advance(6001);
    expect(adrenalDemonstrationStep(model.snapshot(6001)).action).toBe('reassess');
    model.apply('reassess', 6001);
    expect(adrenalDemonstrationStep(model.snapshot(6001)).action).toBe('prevention');
    model.apply('prevention', 6002);
    expect(adrenalDemonstrationStep(model.snapshot(6002)).action).toBe('handoff');
  });
  it('does not backdate rescue when a delayed update reaches instructor takeover', () => {
    const model = new AdrenalCrisis(); model.advance(ADRENAL_TAKEOVER_TICKS);
    const step = adrenalDemonstrationStep(model.snapshot(ADRENAL_TAKEOVER_TICKS));
    expect(step).toMatchObject({ id: 'finished', finished: true });
    expect(step.action).toBeUndefined(); expect(step.narration).toContain('Instructor takeover');
  });
  it('offers only the exact supported version and waits for the first snapshot', () => {
    expect(supportsAdrenalDemonstration(SCENARIO)).toBe(true);
    for (const version of ['0.1.0', '0.1.1', '0.1.3']) expect(supportsAdrenalDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version } })).toBe(false);
    expect(supportsAdrenalDemonstration({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) })).toBe(false);
    expect(supportsAdrenalDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'routine-induction' } })).toBe(false);
    expect(adrenalDemonstrationStep()).toMatchObject({ id: 'preparing' });
    expect(adrenalDemonstrationStep().action).toBeUndefined();
  });
});
