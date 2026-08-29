import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { CountedRate, COUNTED_RATE_REVIEW_TICKS as REVIEW } from '../../src/modules/medical-surgical-nursing/counted-rate';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 28, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: CountedRate, tick: number) => stateSummary(
  { systolicMmHg: 124, diastolicMmHg: 72, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    countedRate: model.snapshot(tick) },
);

describe('Counted respiratory rate screen-reader summary', () => {
  it('announces the charted column and that nothing is counted yet', () => {
    const summary = summarize(new CountedRate(), 0);
    expect(summary).toContain('Charted respiratory rates: 18, 18, 20, 18, 18, 20');
    expect(summary).toContain('Nothing has been counted for a full minute');
  });

  it('announces both numbers together once one is counted', () => {
    const model = new CountedRate();
    model.apply('count-for-a-full-minute', 0);
    const summary = summarize(model, 1);
    expect(summary).toContain('18, 18, 20, 18, 18, 20');
    expect(summary).toContain('Counted for a full minute: 28');
  });

  it('withholds the distribution reading until the trend is reviewed', () => {
    expect(summarize(new CountedRate(), 0)).toContain('has not been reviewed yet');
    const model = new CountedRate();
    model.apply('review-the-charted-trend', 0);
    expect(summarize(model, 1)).toContain('six values drawn from a set of two');
  });

  it('states the predictor claim and refuses to overclaim on monitors', () => {
    const summary = summarize(new CountedRate(), 0);
    expect(summary).toContain('strongest routine predictor of in-hospital cardiac arrest');
    expect(summary).toContain('not established in the retrievable evidence');
  });

  it('does not announce a review the learner has not looked at', () => {
    const model = new CountedRate();
    model.apply('count-for-a-full-minute', 0);
    model.apply('escalate-on-the-counted-value', 1);
    model.advance(REVIEW + 10);
    expect(summarize(model, REVIEW + 10)).not.toContain('counted independently');
    model.apply('reassess', REVIEW + 11);
    expect(summarize(model, REVIEW + 12)).toContain('counted independently');
  });

  it('marks starting observations as historical and names no agent', () => {
    const summary = summarize(new CountedRate(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current alertness: alert and speaking in full sentences');
    const lowered = summary.toLowerCase();
    for (const agent of ['salbutamol', 'morphine', 'naloxone']) expect(lowered).not.toContain(agent);
  });
});
