import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { UnspokenDoubt } from '../../src/modules/surgery-trauma/unspoken-doubt';
import { UNSPOKEN_DOUBT_KNIFE_TICKS as KNIFE, UNSPOKEN_DOUBT_TEAM_TICKS as TEAM } from '../../src/modules/surgery-trauma/unspoken-doubt';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'volume-control', tidalVolumeMl: 450, respiratoryRateBpm: 12, fio2: 0.4, delivering: true },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: UnspokenDoubt, tick: number) => stateSummary(
  { systolicMmHg: 110, diastolicMmHg: 64, etco2MmHg: 38, fio2: 0.4 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    unspokenDoubt: model.snapshot(tick) },
);

describe('Unspoken-doubt screen-reader summary', () => {
  it('announces the three sides and that nobody else has raised it', () => {
    const summary = summarize(new UnspokenDoubt(), 0);
    expect(summary).toContain('Consent form left');
    expect(summary).toContain('Skin marking left');
    expect(summary).toContain('Label on the displayed image right');
    expect(summary).toContain('Raised by anybody else: nobody');
    expect(summary).toContain('No incision made');
  });

  it('announces that nobody has done anything wrong', () => {
    const summary = summarize(new UnspokenDoubt(), 0);
    expect(summary).toContain('Everybody in the room is competent');
    expect(summary).toContain('Nobody has done anything wrong');
  });

  it('announces that the observations will not catch this', () => {
    const summary = summarize(new UnspokenDoubt(), 0);
    expect(summary).toContain('no number here was ever going to catch a label');
  });

  it('reports the statement as unmade until the learner makes it', () => {
    expect(summarize(new UnspokenDoubt(), 0)).toContain('What you noticed stated: no.');
    const model = new UnspokenDoubt();
    model.apply('state-what-you-have-noticed', 0);
    expect(summarize(model, 1)).toContain('What you noticed stated: yes.');
  });

  it('does not announce a reply the learner has not looked at', () => {
    const model = new UnspokenDoubt();
    model.apply('say-it-before-the-incision', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('The consultant stopped');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('The consultant stopped');
  });

  it('announces the request for the knife with nothing else changed', () => {
    const model = new UnspokenDoubt();
    expect(summarize(model, 0)).not.toContain('has asked for the knife');
    model.advance(KNIFE + 10);
    const summary = summarize(model, KNIFE + 10);
    expect(summary).toContain('has asked for the knife');
    expect(summary).toContain('Nothing about the patient has changed');
  });

  it('carries the review that doubts this exercise', () => {
    const summary = summarize(new UnspokenDoubt(), 0);
    expect(summary).toContain('73 percent of the variance');
    expect(summary).toContain('this rehearsal is one of those interventions');
  });

  it('names no agent, dose, or procedure', () => {
    const summary = summarize(new UnspokenDoubt(), 0);
    expect(summary).toContain('Current state: anaesthetised, ventilated, draped');
    const lowered = summary.toLowerCase();
    for (const term of ['propofol', 'morphine', 'fentanyl', 'mg/kg']) expect(lowered).not.toContain(term);
  });
});
