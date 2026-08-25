import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { WIDE_COMPLEX_TACHYCARDIA } from '../../src/modules/cardiology/scenarios/wide-complex-tachycardia';

const act = (engine: AnesthesiaEngine, action: string) => engine.apply({ tick: engine.tick,
  type: 'stable-wide-tachycardia-response', payload: { action } });

describe('wide-complex tachycardia', () => {
  it('keeps the authored pulsed stable monomorphic WCT contract distinct', () => {
    expect(WIDE_COMPLEX_TACHYCARDIA.timeline.some((event) => event.target === 'ventricular-tachycardia')).toBe(true);
    expect(WIDE_COMPLEX_TACHYCARDIA.timeline.map((event) => event.message).join(' ')).toContain('QRS 158 ms');
    expect(WIDE_COMPLEX_TACHYCARDIA.formulary).toEqual([]);
  });

  it('requires both elapsed response gates and updates canonical rhythm only at the end', () => {
    const engine = new AnesthesiaEngine({ scenario: WIDE_COMPLEX_TACHYCARDIA, seed: 23, practiceRegion: 'US' });
    engine.step();
    for (const action of ['reconcile-stable-wide-complex-tachycardia', 'review-wide-complex-context',
      'prepare-wide-complex-pathway', 'record-wide-complex-procainamide-pathway']) act(engine, action);
    act(engine, 'review-wide-complex-medication-nonresponse');
    expect(engine.step().equipment.resuscitation.stableWideTachycardiaAssessment?.nonresponseAtTick).toBeNull();
    act(engine, 'review-wide-complex-medication-nonresponse');
    act(engine, 'record-wide-complex-cardioversion-intent'); act(engine, 'reassess-wide-complex-trajectory');
    expect(engine.step().equipment.resuscitation.stableWideTachycardiaAssessment?.reassessmentAtTick).toBeNull();
    act(engine, 'reassess-wide-complex-trajectory');
    const state = engine.step();
    expect(state.state.heartRateBpm).toBe(84);
  });

  it('refuses narrow-family, unknown, and dangerous shortcut actions', () => {
    const engine = new AnesthesiaEngine({ scenario: WIDE_COMPLEX_TACHYCARDIA, seed: 23, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: engine.tick, type: 'stable-narrow-tachycardia-response', payload: { action: 'reconcile-stable-regular-narrow-tachycardia' } });
    for (const action of ['give-verapamil', 'give-diltiazem', 'amiodarone-plus-procainamide', 'defibrillate-unsynchronized', '__proto__']) act(engine, action);
    const state = engine.step();
    expect(state.equipment.resuscitation.stableWideTachycardiaAssessment?.stabilityAtTick).toBeNull();
    expect(state.equipment.resuscitation.stableNarrowTachycardiaAssessment).toBeUndefined();
  });
});
