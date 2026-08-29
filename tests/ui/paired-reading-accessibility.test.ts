import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { PairedReading, PAIRED_READING_GAS_TICKS as GAS,
  PAIRED_READING_REVIEW_TICKS as REVIEW } from '../../src/modules/medical-surgical-nursing/paired-reading';

// The review is only announced after the learner reassesses, which this file also verifies.

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 460, respiratoryRateBpm: 24, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: PairedReading, tick: number) => stateSummary(
  { systolicMmHg: 132, diastolicMmHg: 78, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    pairedReading: model.snapshot(tick) },
);

describe('Paired oximetry reading screen-reader summary', () => {
  it('announces the reading and that the sample has not returned', () => {
    const summary = summarize(new PairedReading(), 0);
    expect(summary).toContain('Oximeter reading 94 percent on air');
    expect(summary).toContain('has not returned');
  });

  it('announces both values once the sample returns', () => {
    const model = new PairedReading();
    model.advance(GAS + 10);
    const summary = summarize(model, GAS + 10);
    expect(summary).toContain('Arterial saturation from the same minute: 86 percent');
  });

  it('withholds the mechanism until the gap is characterised', () => {
    const model = new PairedReading();
    model.advance(GAS + 10);
    expect(summarize(model, GAS + 10)).toContain('None of them explains a reading that is too high');
    model.apply('record-the-paired-values', GAS + 11);
    model.apply('record-what-the-gap-is-not', GAS + 12);
    expect(summarize(model, GAS + 13)).toContain('skin pigmentation changes that absorbance');
  });

  it('states that the bias is optical and that the guidance changed nothing in service', () => {
    const summary = summarize(new PairedReading(), 0);
    expect(summary).toContain('optical rather than a perfusion artifact');
    expect(summary).toContain('does not recall or recalibrate devices already in service');
  });

  it('does not announce a result the learner has not looked at', () => {
    const model = new PairedReading();
    model.advance(GAS + 10);
    expect(summarize(model, GAS + 10)).not.toContain('Both numbers are from the same minute');
    model.apply('reassess', GAS + 11);
    expect(summarize(model, GAS + 12)).toContain('Both numbers are from the same minute');
  });

  it('does not announce the review until the learner reassesses after it', () => {
    const model = new PairedReading();
    model.advance(GAS + 10);
    model.apply('escalate-on-the-arterial-value', GAS + 11);
    model.advance(GAS + REVIEW + 20);
    expect(summarize(model, GAS + REVIEW + 20)).not.toContain('no fault is found');
    model.apply('reassess', GAS + REVIEW + 21);
    const summary = summarize(model, GAS + REVIEW + 22);
    expect(summary).toContain('correctly by its own calibration');
    expect(summary).toContain('no fault is found');
  });

  it('marks starting observations as historical and names no oxygen setting', () => {
    const summary = summarize(new PairedReading(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current alertness: alert and speaking in full sentences');
    const lowered = summary.toLowerCase();
    for (const term of ['litres per minute', 'venturi']) expect(lowered).not.toContain(term);
  });
});
