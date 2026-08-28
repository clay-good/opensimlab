import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { FebrileNeutropenia, FEBRILE_NEUTROPENIA_DELAY_TICKS as DELAY,
  FEBRILE_NEUTROPENIA_RESPONSE_TICKS as RESPONSE } from '../../src/modules/infectious-disease/febrile-neutropenia';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 20, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: FebrileNeutropenia, tick: number) => stateSummary(
  { systolicMmHg: 118, diastolicMmHg: 72, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    febrileNeutropenia: model.snapshot(tick) },
);

describe('Febrile neutropenia screen-reader summary', () => {
  it('explains the blind examination rather than just listing numbers', () => {
    const summary = summarize(new FebrileNeutropenia(), 0);
    expect(summary).toContain('Without neutrophils there is no pus');
    expect(summary).toContain('not evidence against infection');
    expect(summary).toContain('day 10 after chemotherapy');
  });

  it('states that the agent is delegated, never named', () => {
    const model = new FebrileNeutropenia();
    model.apply('record-antimicrobial-intent', 0);
    const summary = summarize(model, 1);
    expect(summary).toContain('Empiric antimicrobial intent: recorded');
    expect(summary).toContain('delegates the agent to local microbiology policy');
    for (const agent of ['piperacillin', 'cefepime', 'meropenem']) {
      expect(summary.toLowerCase()).not.toContain(agent);
    }
  });

  it('withholds the capnogram and oxygen setting this lesson does not supply', () => {
    expect(summarize(new FebrileNeutropenia(), 0))
      .toContain('Oxygen settings and exhaled carbon dioxide are not supplied in this lesson.');
  });

  it('does not read out a partial result the learner has not requested', () => {
    const summary = summarize(new FebrileNeutropenia(), 0);
    expect(summary).toContain('No new laboratory-only measurement has been requested.');
    expect(summary).toContain('No new observations-only round has been requested.');
    expect(summary).toContain('No new full assessment has been requested.');
  });

  it('names the untreated deterioration and keeps the marker caveat after treatment', () => {
    const untreated = new FebrileNeutropenia();
    untreated.advance(DELAY + 5);
    untreated.apply('reassess', DELAY + 6);
    expect(summarize(untreated, DELAY + 7))
      .toContain('that combination is worsening infection');

    const treated = new FebrileNeutropenia();
    treated.apply('record-antimicrobial-intent', 0);
    treated.advance(RESPONSE + 5);
    treated.apply('reassess', RESPONSE + 6);
    const summary = summarize(treated, RESPONSE + 7);
    expect(summary).toContain('uninformative at the door and its later climb is lag catching up');
    expect(summary).toContain('remains profoundly neutropenic');
  });
});
