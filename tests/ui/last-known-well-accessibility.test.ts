import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { LastKnownWell, LAST_KNOWN_WELL_RECOLLECTION_TICKS as PRESSED,
  LAST_KNOWN_WELL_ASSESSMENT_TICKS as ASSESSMENT } from '../../src/modules/medical-surgical-nursing/last-known-well';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 440, respiratoryRateBpm: 16, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: LastKnownWell, tick: number) => stateSummary(
  { systolicMmHg: 158, diastolicMmHg: 88, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    lastKnownWell: model.snapshot(tick) },
);

describe('Unwitnessed-onset screen-reader summary', () => {
  it('announces the empty onset field as empty rather than omitting it', () => {
    const summary = summarize(new LastKnownWell(), 0);
    expect(summary).toContain('Onset time: not known.');
    expect(summary).toContain('an unwitnessed interval 7.5 hours wide');
  });

  it('names the bound as a bound only once it has been recorded', () => {
    expect(summarize(new LastKnownWell(), 0)).toContain('The chart offers a box labelled onset time.');
    const model = new LastKnownWell();
    model.apply('record-last-known-well', 0);
    expect(summarize(model, 1)).toContain('Last known well is a bound: the deficit began at some point after 22:40');
  });

  it('says an unknown onset is a reason to escalate rather than to stand down', () => {
    const summary = summarize(new LastKnownWell(), 0);
    expect(summary).toContain('reason to escalate for assessment rather than to stand down');
    expect(summary).toContain('describes a population and a pathway rather than this patient');
  });

  it('announces that pressing the recollection moved it', () => {
    expect(summarize(new LastKnownWell(), 0)).not.toContain('moved it by an hour');
    const model = new LastKnownWell();
    model.advance(PRESSED + 10);
    expect(summarize(model, PRESSED + 10)).toContain('moved it by an hour and said she would not swear to it');
  });

  it('does not announce an assessment the learner has not looked at', () => {
    const model = new LastKnownWell();
    model.apply('activate-the-stroke-pathway', 0);
    model.advance(ASSESSMENT + 20);
    expect(summarize(model, ASSESSMENT + 20)).not.toContain('The stroke team has assessed');
    model.apply('reassess', ASSESSMENT + 21);
    expect(summarize(model, ASSESSMENT + 22)).toContain('The stroke team has assessed');
  });

  it('marks starting observations as historical and names no drug', () => {
    const summary = summarize(new LastKnownWell(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current alertness: awake, new right-sided weakness');
    const lowered = summary.toLowerCase();
    for (const term of ['alteplase', 'tenecteplase', 'thrombectomy']) expect(lowered).not.toContain(term);
  });
});
