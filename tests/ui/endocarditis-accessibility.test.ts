import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { EndocarditisHeartFailure, ENDOCARDITIS_DECOMPENSATION_TICKS as DECOMP } from '../../src/modules/infectious-disease/endocarditis-heart-failure';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 520, respiratoryRateBpm: 26, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: EndocarditisHeartFailure, tick: number) => stateSummary(
  { systolicMmHg: 104, diastolicMmHg: 62, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    endocarditisHeartFailure: model.snapshot(tick) },
);

describe('Endocarditis screen-reader summary', () => {
  it('separates the infection from the valve', () => {
    const summary = summarize(new EndocarditisHeartFailure(), 0);
    expect(summary).toContain('describes the infection rather than the valve');
    expect(summary).toContain('falling numbers cannot reassure here');
  });

  it('states the acute-regurgitation examination boundary', () => {
    expect(summarize(new EndocarditisHeartFailure(), 0))
      .toContain('normal or narrow pulse pressure');
  });

  it('withholds the capnogram and oxygen setting this lesson does not supply', () => {
    expect(summarize(new EndocarditisHeartFailure(), 0))
      .toContain('oxygen settings and exhaled carbon dioxide are not supplied in this lesson');
  });

  it('does not read out a partial result the learner has not requested', () => {
    const summary = summarize(new EndocarditisHeartFailure(), 0);
    expect(summary).toContain('No new laboratory-only measurement has been requested.');
    expect(summary).toContain('No new perfusion-only examination has been requested.');
    expect(summary).toContain('No new full assessment has been requested.');
  });

  it('names the divergence once the decompensation is observed', () => {
    const model = new EndocarditisHeartFailure();
    model.advance(DECOMP + 5);
    model.apply('reassess', DECOMP + 6);
    const summary = summarize(model, DECOMP + 7);
    expect(summary).toContain('fallen further while the patient has become very much worse');
    expect(summary).toContain('Neither operability, transfer acceptance, nor survival is established');
  });
});
