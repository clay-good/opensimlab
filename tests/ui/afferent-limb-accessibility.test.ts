import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { AfferentLimb, AFFERENT_LIMB_PRESSURE_TICKS as PRESSURE,
  AFFERENT_LIMB_ARRIVAL_TICKS as ARRIVAL } from '../../src/modules/medical-surgical-nursing/afferent-limb';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 440, respiratoryRateBpm: 30, fio2: 0.28, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: AfferentLimb, tick: number) => stateSummary(
  { systolicMmHg: 88, diastolicMmHg: 54, etco2MmHg: 38, fio2: 0.28 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    afferentLimb: model.snapshot(tick) },
);

describe('Escalation threshold screen-reader summary', () => {
  it('announces the threshold state ahead of the obstacles it will be weighed against', () => {
    const lines = summarize(new AfferentLimb(), 0).split('\n');
    const threshold = lines.findIndex((line) => line.includes('3 of 5 activation criteria met'));
    const obstacles = lines.findIndex((line) => line.includes('says the team came yesterday'));
    expect(threshold).toBeGreaterThanOrEqual(0);
    expect(lines[threshold]).toContain('requiring 1');
    expect(lines[threshold]).toContain('The call has not been made');
    // The met threshold is heard before the reasons not to act on it.
    expect(threshold).toBeLessThan(obstacles);
  });

  it('states that the criteria are the authorisation', () => {
    expect(summarize(new AfferentLimb(), 0))
      .toContain('The criteria are the authorisation and no permission is required');
  });

  it('names the obstacles as non-clinical once recorded', () => {
    expect(summarize(new AfferentLimb(), 0)).toContain('says the team came yesterday');
    const model = new AfferentLimb();
    model.apply('record-the-obstacles', 0);
    expect(summarize(model, 1)).toContain('None of these is a clinical finding');
  });

  it('announces the repeated pressure only while no call has been made', () => {
    const model = new AfferentLimb();
    model.advance(PRESSURE + 10);
    expect(summarize(model, PRESSURE + 10)).toContain('has repeated the discouragement');
    const called = new AfferentLimb();
    called.apply('call-the-response-team', 0);
    called.advance(PRESSURE + 10);
    expect(summarize(called, PRESSURE + 10)).not.toContain('has repeated the discouragement');
  });

  it('does not announce an arrival the learner has not looked at', () => {
    const model = new AfferentLimb();
    model.apply('call-the-response-team', 0);
    model.advance(ARRIVAL + 10);
    expect(summarize(model, ARRIVAL + 10)).not.toContain('has taken over');
    model.apply('reassess', ARRIVAL + 11);
    expect(summarize(model, ARRIVAL + 12)).toContain('has taken over');
  });

  it('marks starting observations as historical and names no treatment', () => {
    const summary = summarize(new AfferentLimb(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current alertness: alert, anxious');
    const lowered = summary.toLowerCase();
    for (const term of ['noradrenaline', 'antibiotic']) expect(lowered).not.toContain(term);
  });
});
