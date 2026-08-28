import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { MeningococcalSepsis, MENINGOCOCCAL_SEPSIS_RESPONSE_TICKS as RESPONSE } from '../../src/modules/infectious-disease/meningococcal-sepsis';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 28, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: MeningococcalSepsis, tick: number) => stateSummary(
  { systolicMmHg: 88, diastolicMmHg: 44, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    meningococcalSepsis: model.snapshot(tick) },
);

describe('Meningococcal sepsis screen-reader summary', () => {
  it('speaks the starting evidence and the current ownership state', () => {
    const summary = summarize(new MeningococcalSepsis(), 0);
    expect(summary).toContain('non-blanching petechiae including two lesions larger than 2 millimeters');
    expect(summary).toContain('Senior clinical decision maker: not yet called');
    expect(summary).toContain('Consultant attending in person: not yet alerted');
    expect(summary).toContain('Antimicrobial intent: not yet recorded');
    expect(summary).toContain('Recorded intent is neither a prescription nor proof');
  });

  it('withholds the capnogram and oxygen setting this lesson does not supply', () => {
    const summary = summarize(new MeningococcalSepsis(), 0);
    expect(summary).toContain('Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
    expect(summary).not.toContain('End-tidal');
  });

  it('does not read out a partial result the learner has not requested', () => {
    const summary = summarize(new MeningococcalSepsis(), 0);
    expect(summary).toContain('No new laboratory-only measurement has been requested.');
    expect(summary).toContain('No new perfusion-only examination has been requested.');
    expect(summary).toContain('No new full bedside and laboratory assessment has been requested.');
  });

  it('names the inadequate one-hour response and the missing attendance', () => {
    const model = new MeningococcalSepsis();
    model.apply('record-antimicrobial-intent', 0);
    model.apply('record-fluid-intent', 1);
    model.advance(RESPONSE + 5);
    model.apply('reassess', RESPONSE + 6);
    const summary = summarize(model, RESPONSE + 7);
    expect(summary).toContain('inadequate response an hour after recorded intent');
    expect(summary).toContain('Attendance in person has not yet happened.');
    expect(summary).toContain('rising C-reactive protein is expected with elapsed time');
  });

  it('stops naming the missing attendance once a consultant is alerted', () => {
    const model = new MeningococcalSepsis();
    model.apply('record-antimicrobial-intent', 0);
    model.apply('record-fluid-intent', 1);
    model.advance(RESPONSE + 5);
    model.apply('reassess', RESPONSE + 6);
    model.apply('escalate-consultant', RESPONSE + 7);
    const summary = summarize(model, RESPONSE + 8);
    expect(summary).toContain('Consultant attending in person: alerted');
    expect(summary).not.toContain('Attendance in person has not yet happened.');
    expect(summary).toContain('no survival or discharge readiness is established');
  });
});
