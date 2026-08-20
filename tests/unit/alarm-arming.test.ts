/**
 * Alarms that have to earn the right to fire.
 *
 * The depth-light limit alarmed on the very first frame of every session,
 * because an awake patient reads about 93 and the limit is 60. A visitor's first
 * impression of the simulator was a warning about a patient who had been given
 * nothing, and a real depth monitor does not behave that way.
 */
import { describe, expect, it } from 'vitest';
import { AlarmEngine, DEFAULT_LIMITS } from '@platform/alarms/alarms';

const AWAKE = { depthIndex: 93, heartRateBpm: 74, spo2Percent: 97, etco2MmHg: 37 };
const SURGICAL = { ...AWAKE, depthIndex: 45 };
const LIGHTENING = { ...AWAKE, depthIndex: 72 };

const ids = (engine: AlarmEngine, state: Record<string, number>, tick: number) =>
  engine.evaluate(state, tick).active.map((alarm) => alarm.id);

describe('an alarm that arms only after the parameter has been normal once', () => {
  it('says nothing about an awake patient who has been given nothing', () => {
    const engine = new AlarmEngine();
    expect(ids(engine, AWAKE, 0)).not.toContain('depth-light');
    // And it stays quiet however long they sit there.
    expect(ids(engine, AWAKE, 6000)).not.toContain('depth-light');
  });

  it('fires once the patient has been deep and is lightening — the alarm worth having', () => {
    const engine = new AlarmEngine();
    ids(engine, AWAKE, 0);
    expect(ids(engine, SURGICAL, 100)).not.toContain('depth-light');
    expect(ids(engine, LIGHTENING, 200)).toContain('depth-light');
  });

  it('stays armed once it has armed, so a second lightening also alarms', () => {
    const engine = new AlarmEngine();
    ids(engine, SURGICAL, 0);
    expect(ids(engine, LIGHTENING, 10)).toContain('depth-light');
    expect(ids(engine, SURGICAL, 20)).not.toContain('depth-light');
    expect(ids(engine, LIGHTENING, 30)).toContain('depth-light');
  });

  it('arms nothing else: every other limit fires from a cold start', () => {
    // The guard is opt-in for a reason. Desaturation on the first frame is a
    // real emergency and must not wait for permission.
    const armed = DEFAULT_LIMITS.filter((limit) => limit.armsAfterFirstNormal);
    expect(armed.map((limit) => limit.id)).toEqual(['depth-light']);

    const engine = new AlarmEngine();
    const active = ids(engine, { ...AWAKE, spo2Percent: 78 }, 0);
    expect(active).toContain('spo2-very-low');
  });

  it('a session that never reaches surgical depth never gets the alarm', () => {
    // Sedation that stays light is not an alarm condition, it is the plan.
    const engine = new AlarmEngine();
    for (let tick = 0; tick < 500; tick += 50) {
      expect(ids(engine, { ...AWAKE, depthIndex: 80 }, tick)).not.toContain('depth-light');
    }
  });
});
