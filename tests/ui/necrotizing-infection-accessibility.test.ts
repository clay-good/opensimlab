import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { NecrotizingInfection, NECROTIZING_INFECTION_PROGRESSION_TICKS as PROGRESSION } from '../../src/modules/infectious-disease/necrotizing-infection';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 540, respiratoryRateBpm: 22, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: NecrotizingInfection, tick: number) => stateSummary(
  { systolicMmHg: 118, diastolicMmHg: 72, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    necrotizingInfection: model.snapshot(tick) },
);

describe('Necrotizing infection screen-reader summary', () => {
  it('attaches the score’s limit to the score itself', () => {
    const summary = summarize(new NecrotizingInfection(), 0);
    expect(summary).toContain('Current derived risk score: 3');
    expect(summary).toContain('excludes nothing here');
    expect(summary).toContain('Absent crepitus and absent bullae are late-sign absences, not reassurance');
  });

  it('states that exploration is the only excluding test and is not the learner’s', () => {
    const summary = summarize(new NecrotizingInfection(), 0);
    expect(summary).toContain('Exploration is the only test that can exclude this');
    expect(summary).toContain('No agent, dose, incision, extent, or theatre time is selected');
  });

  it('withholds the capnogram and oxygen setting this lesson does not supply', () => {
    expect(summarize(new NecrotizingInfection(), 0))
      .toContain('Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
  });

  it('does not read out a partial result the learner has not requested', () => {
    const summary = summarize(new NecrotizingInfection(), 0);
    expect(summary).toContain('No new laboratory-only measurement has been requested.');
    expect(summary).toContain('No new limb-only examination has been requested.');
    expect(summary).toContain('No new full assessment has been requested.');
  });

  it('frames the risen score as the lesson after the progression is observed', () => {
    const model = new NecrotizingInfection();
    model.advance(PROGRESSION + 5);
    model.apply('reassess', PROGRESSION + 6);
    const summary = summarize(model, PROGRESSION + 7);
    expect(summary).toContain('became useful only after the interval in which acting on it mattered');
    expect(summary).toContain('The diagnosis stays unconfirmed');
  });
});
