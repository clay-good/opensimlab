import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { ObstructedKidney, OBSTRUCTED_KIDNEY_DELAY_TICKS as DELAY,
  OBSTRUCTED_KIDNEY_RESPONSE_TICKS as RESPONSE } from '../../src/modules/infectious-disease/obstructed-kidney';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 460, respiratoryRateBpm: 26, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: ObstructedKidney, tick: number) => stateSummary(
  { systolicMmHg: 104, diastolicMmHg: 58, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    obstructedKidney: model.snapshot(tick) },
);

describe('Obstructed kidney screen-reader summary', () => {
  it('speaks the premise, the obstruction, and the current ownership state', () => {
    const summary = summarize(new ObstructedKidney(), 0);
    expect(summary).toContain('supplied premise, not a learner decision');
    expect(summary).toContain('8 millimeter obstructing distal ureteric stone');
    expect(summary).toContain('Urology and interventional radiology: not yet involved');
    expect(summary).toContain('Decompression intent: not yet recorded');
  });

  it('states that neither drainage route is marked correct', () => {
    const summary = summarize(new ObstructedKidney(), 0);
    expect(summary).toContain('neither percutaneous nephrostomy nor retrograde stenting is marked correct');
    expect(summary).toContain('Recorded intent is not a placed drain');
  });

  it('withholds the capnogram and oxygen setting this lesson does not supply', () => {
    const summary = summarize(new ObstructedKidney(), 0);
    expect(summary).toContain('Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
  });

  it('does not read out a partial result the learner has not requested', () => {
    const summary = summarize(new ObstructedKidney(), 0);
    expect(summary).toContain('No new laboratory-only measurement has been requested.');
    expect(summary).toContain('No new observations-only round has been requested.');
    expect(summary).toContain('No new full assessment has been requested.');
  });

  it('names the undrained deterioration and keeps the marker caveat after drainage', () => {
    const undrained = new ObstructedKidney();
    undrained.advance(DELAY + 5);
    undrained.apply('reassess', DELAY + 6);
    expect(summarize(undrained, DELAY + 7))
      .toContain('deterioration after six authored hours of antimicrobial care with the kidney still obstructed');

    const drained = new ObstructedKidney();
    drained.apply('record-decompression-intent', 0);
    drained.advance(RESPONSE + 5);
    drained.apply('reassess', RESPONSE + 6);
    const summary = summarize(drained, RESPONSE + 7);
    expect(summary).toContain('Decompression intent: recorded');
    expect(summary).toContain('can keep rising while the patient improves, so it is not the success signal');
    expect(summary).toContain('Drainage is not cure');
  });
});
