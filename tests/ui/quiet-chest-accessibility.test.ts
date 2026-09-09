import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { QuietChest } from '../../src/modules/surgery-trauma/quiet-chest';
import { QUIET_CHEST_FAMILY_TICKS as FAMILY, QUIET_CHEST_TEAM_TICKS as TEAM } from '../../src/modules/surgery-trauma/quiet-chest';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 400, respiratoryRateBpm: 12, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: QuietChest, tick: number) => stateSummary(
  { systolicMmHg: 138, diastolicMmHg: 76, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    quietChest: model.snapshot(tick) },
);

describe('Quiet-chest screen-reader summary', () => {
  it('announces the fall, the count and the age together', () => {
    const summary = summarize(new QuietChest(), 0);
    expect(summary).toContain('16 hours ago, aged 81');
    expect(summary).toContain('4 left-sided rib fractures');
    expect(summary).toContain('Pneumothorax not reported');
    expect(summary).toContain('lives alone');
  });

  it('announces that every observation was taken at rest and none was earned', () => {
    const summary = summarize(new QuietChest(), 0);
    expect(summary).toContain('Every one is normal and every one was recorded while she was lying still');
    expect(summary).toContain('not been asked for or observed');
    expect(summary).toContain('like to be at home tonight');
  });

  it('reports the recording as unmade until the learner makes it', () => {
    expect(summarize(new QuietChest(), 0)).toContain('Fall and fracture count recorded: no.');
    const model = new QuietChest();
    model.apply('record-the-fall-and-what-was-broken', 0);
    expect(summarize(model, 1)).toContain('Fall and fracture count recorded: yes.');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new QuietChest();
    model.apply('escalate-to-the-admitting-team', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('The admitting team has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('The admitting team has answered');
  });

  it('announces the telephone call with everything monitored unchanged', () => {
    const model = new QuietChest();
    expect(summarize(model, 0)).not.toContain('daughter has telephoned');
    model.advance(FAMILY + 10);
    const summary = summarize(model, FAMILY + 10);
    expect(summary).toContain('daughter has telephoned');
    expect(summary).toContain('exactly as they were');
  });

  it('carries the half of the evidence that undercuts the obvious intervention', () => {
    const summary = summarize(new QuietChest(), 0);
    expect(summary).toContain('31 percent against 17');
    expect(summary).toContain('all at high risk of bias');
  });

  it('names no agent, dose, or discharge date', () => {
    const summary = summarize(new QuietChest(), 0);
    expect(summary).toContain('Current state: alert, comfortable lying still');
    const lowered = summary.toLowerCase();
    for (const term of ['morphine', 'paracetamol', 'ibuprofen', 'oxycodone']) expect(lowered).not.toContain(term);
  });
});
