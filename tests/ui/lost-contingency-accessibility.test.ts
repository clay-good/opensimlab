import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { LostContingency, LOST_CONTINGENCY_OUTPUT_TICKS as OUTPUT,
  LOST_CONTINGENCY_CONFIRMATION_TICKS as CONFIRM } from '../../src/modules/medical-surgical-nursing/lost-contingency';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 440, respiratoryRateBpm: 17, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: LostContingency, tick: number) => stateSummary(
  { systolicMmHg: 118, diastolicMmHg: 70, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    lostContingency: model.snapshot(tick) },
);
const ready = (model: LostContingency) => {
  model.apply('record-what-was-said', 0);
  model.apply('check-the-notes', 1);
  model.apply('record-the-gap-as-a-transmission-gap', 2);
  model.apply('reconstruct-the-contingency', 3);
  return model;
};

describe('Handover-loss screen-reader summary', () => {
  it('never announces one count without the other', () => {
    const summary = summarize(new LostContingency(), 0);
    expect(summary).toContain('Said at handover: 3 elements. Written in the notes: 4.');
    expect(summary).toContain('in the notes and was not said');
  });

  it('says the spoken account has not been captured until it has', () => {
    expect(summarize(new LostContingency(), 0)).toContain('It is the only evidence that something was not said');
    const model = new LostContingency();
    model.apply('record-what-was-said', 0);
    expect(summarize(model, 1)).toContain('Handover recorded:');
  });

  it('withholds the reconstruction until it exists, then quotes it', () => {
    expect(summarize(new LostContingency(), 0)).toContain('still held only in the notes');
    const summary = summarize(ready(new LostContingency()), 4);
    expect(summary).toContain('Reconstructed in the surgical team’s words');
    expect(summary).toContain('call the surgical registrar');
  });

  it('announces the output as above the threshold rather than as a trigger', () => {
    expect(summarize(new LostContingency(), 0)).not.toContain('last hourly urine output');
    const model = new LostContingency();
    model.advance(OUTPUT + 10);
    const summary = summarize(model, OUTPUT + 10);
    expect(summary).toContain('above the plan’s threshold of 34 millilitres');
    expect(summary).toContain('Nothing is triggered');
  });

  it('does not announce a confirmation the learner has not looked at', () => {
    const model = ready(new LostContingency());
    model.apply('confirm-the-plan-with-the-team', 4);
    model.advance(4 + CONFIRM + 20);
    expect(summarize(model, 4 + CONFIRM + 20)).not.toContain('has confirmed the plan stands');
    model.apply('reassess', 4 + CONFIRM + 21);
    expect(summarize(model, 4 + CONFIRM + 22)).toContain('has confirmed the plan stands');
  });

  it('states the evidence limits and names no drug or fluid', () => {
    const summary = summarize(new LostContingency(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('has not been shown to reduce harm');
    expect(summary).toContain('rather than nursing handover');
    const lowered = summary.toLowerCase();
    for (const term of ['morphine', 'hartmann', 'furosemide']) expect(lowered).not.toContain(term);
  });
});
