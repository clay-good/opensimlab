import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { SeverePneumonia, SEVERE_PNEUMONIA_DETERIORATION_TICKS as DETERIORATION } from '../../src/modules/infectious-disease/severe-pneumonia';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 540, respiratoryRateBpm: 30, fio2: 0.35, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: SeverePneumonia, tick: number) => stateSummary(
  { systolicMmHg: 106, diastolicMmHg: 64, etco2MmHg: 38, fio2: 0.35 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    severePneumonia: model.snapshot(tick) },
);

describe('Severe pneumonia screen-reader summary', () => {
  it('states both instruments and what each answers', () => {
    const summary = summarize(new SeverePneumonia(), 0);
    expect(summary).toContain('Two supplied instruments disagree and both are correctly calculated');
    expect(summary).toContain('answers thirty-day death rather than level of care');
    expect(summary).toContain('about 0.69');
  });

  it('insists the saturation is read with its inspired fraction', () => {
    expect(summarize(new SeverePneumonia(), 0))
      .toContain('A saturation without its inspired fraction says very little');
  });

  it('withholds the capnogram and oxygen setting this lesson does not supply', () => {
    expect(summarize(new SeverePneumonia(), 0))
      .toContain('oxygen settings and exhaled carbon dioxide are not supplied in this lesson');
  });

  it('does not read out a partial result the learner has not requested', () => {
    const summary = summarize(new SeverePneumonia(), 0);
    expect(summary).toContain('No new laboratory-only measurement has been requested.');
    expect(summary).toContain('No new respiratory-only assessment has been requested.');
    expect(summary).toContain('No new full assessment has been requested.');
  });

  it('frames the risen score as inevitable once the deterioration is observed', () => {
    const model = new SeverePneumonia();
    model.advance(DETERIORATION + 5);
    model.apply('reassess', DETERIORATION + 6);
    const summary = summarize(model, DETERIORATION + 7);
    expect(summary).toContain('It was always going to, and it was never the instrument');
    expect(summary).toContain('real-world constraint this rehearsal does not model');
  });
});
