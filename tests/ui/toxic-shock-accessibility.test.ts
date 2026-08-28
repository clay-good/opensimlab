import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { ToxicShock, TOXIC_SHOCK_DETERIORATION_TICKS as DETERIORATION } from '../../src/modules/infectious-disease/toxic-shock';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 440, respiratoryRateBpm: 26, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: ToxicShock, tick: number) => stateSummary(
  { systolicMmHg: 88, diastolicMmHg: 44, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    toxicShock: model.snapshot(tick) },
);

describe('Toxic shock screen-reader summary', () => {
  it('gives both reasons the definitions stay open', () => {
    const summary = summarize(new ToxicShock(), 0);
    expect(summary).toContain('not for the same reason');
    expect(summary).toContain('requires desquamation one to two weeks after the rash');
    expect(summary).toContain('requires isolation of the organism, which has not grown');
  });

  it('explains the mutually exclusive culture requirement', () => {
    expect(summarize(new ToxicShock(), 0))
      .toContain('one requires negative cultures and the other requires an isolate');
  });

  it('states what a surveillance definition is for', () => {
    const summary = summarize(new ToxicShock(), 0);
    expect(summary).toContain('count cases consistently across populations rather than deciding treatment');
    expect(summary).toContain('A criteria count is not a probability');
  });

  it('does not read out a partial result the learner has not requested', () => {
    const summary = summarize(new ToxicShock(), 0);
    expect(summary).toContain('No new laboratory-only measurement has been requested.');
    expect(summary).toContain('No new perfusion-only examination has been requested.');
    expect(summary).toContain('No new full assessment has been requested.');
  });

  it('says accumulating criteria close nothing once the deterioration is observed', () => {
    const model = new ToxicShock();
    model.advance(DETERIORATION + 5);
    model.apply('reassess', DETERIORATION + 6);
    const summary = summarize(model, DETERIORATION + 7);
    expect(summary).toContain('Neither has closed, and the reasons are unchanged');
    expect(summary).toContain('handed over open');
  });
});
