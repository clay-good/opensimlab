import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { PrognosisQuestion, PROGNOSIS_QUESTION_REPEAT_TICKS as REPEAT,
  PROGNOSIS_QUESTION_READBACK_TICKS as READBACK } from '../../src/modules/oncology/prognosis-question';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 470, respiratoryRateBpm: 16, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: PrognosisQuestion, tick: number) => stateSummary(
  { systolicMmHg: 124, diastolicMmHg: 72, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    prognosisQuestion: model.snapshot(tick) },
);

describe('Prognosis-conversation screen-reader summary', () => {
  it('leads with the question and says the monitor cannot answer it', () => {
    const summary = summarize(new PrognosisQuestion(), 0);
    expect(summary).toContain('how long have I got');
    expect(summary).toContain('will not answer it however often they are taken');
  });

  it('announces his reason once he has given it', () => {
    const model = new PrognosisQuestion();
    model.advance(REPEAT + 10);
    expect(summarize(model, REPEAT + 10)).toContain('getting married in four months');
  });

  it('reads back the best case alone when the direction was never stated', () => {
    const model = new PrognosisQuestion();
    model.apply('ask-what-he-wants-to-know', 0);
    model.apply('answer-with-scenarios-not-a-number', 1);
    model.advance(READBACK + 10);
    model.apply('reassess', READBACK + 11);
    expect(summarize(model, READBACK + 12)).toContain('as the best case, on its own');
  });

  it('reads back all three scenarios when the direction was stated', () => {
    const model = new PrognosisQuestion();
    model.apply('ask-what-he-wants-to-know', 0);
    model.apply('answer-with-scenarios-not-a-number', 1);
    model.apply('state-the-direction-of-the-error', 2);
    model.advance(READBACK + 10);
    model.apply('reassess', READBACK + 11);
    const summary = summarize(model, READBACK + 12);
    expect(summary).toContain('repeated all three scenarios');
    expect(summary).toContain('doctors tend to guess long');
  });

  it('does not announce a readback the learner has not heard back', () => {
    const model = new PrognosisQuestion();
    model.apply('ask-what-he-wants-to-know', 0);
    model.apply('answer-with-scenarios-not-a-number', 1);
    model.advance(READBACK + 10);
    expect(summarize(model, READBACK + 10)).not.toContain('In the corridor');
  });

  it('keeps every cited figure off this patient and names no agent', () => {
    const summary = summarize(new PrognosisQuestion(), 0);
    expect(summary).toContain('None of these figures is this man');
    expect(summary).toContain('These remain historical starting observations');
    const lowered = summary.toLowerCase();
    for (const agent of ['morphine', 'oxycodone', 'midazolam']) expect(lowered, agent).not.toContain(agent);
  });
});
