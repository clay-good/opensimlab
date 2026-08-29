import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { RareEarlyMyocarditis } from '../../src/modules/oncology/rare-early-myocarditis';
import { RARE_EARLY_MYOCARDITIS_RHYTHM_TICKS as RHYTHM, RARE_EARLY_MYOCARDITIS_TEAM_TICKS as TEAMS } from '../../src/modules/oncology/rare-early-myocarditis';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 18, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: RareEarlyMyocarditis, tick: number) => stateSummary(
  { systolicMmHg: 118, diastolicMmHg: 70, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    rareEarlyMyocarditis: model.snapshot(tick) },
);

describe('Checkpoint-myocarditis screen-reader summary', () => {
  it('announces the interval and whether he is monitored', () => {
    const summary = summarize(new RareEarlyMyocarditis(), 0);
    expect(summary).toContain('4 weeks and 2 cycles into combination checkpoint therapy');
    expect(summary).toContain('not on a monitor');
  });

  it('says plainly that nothing is watching the conduction when nothing is', () => {
    expect(summarize(new RareEarlyMyocarditis(), 0))
      .toContain('Nothing is watching his conduction');
  });

  it('announces the conduction change once monitoring has been arranged', () => {
    const model = new RareEarlyMyocarditis();
    model.apply('arrange-continuous-rhythm-monitoring', 0);
    model.advance(RHYTHM + 10);
    const summary = summarize(model, RHYTHM + 10);
    expect(summary).toContain('intermittent Mobitz type one');
    expect(summary).not.toContain('Nothing is watching his conduction');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new RareEarlyMyocarditis();
    model.apply('escalate-to-both-teams', 0);
    model.advance(TEAMS + 10);
    expect(summarize(model, TEAMS + 10)).not.toContain('Both teams have answered');
    model.apply('reassess', TEAMS + 11);
    expect(summarize(model, TEAMS + 12)).toContain('Both teams have answered');
  });

  it('keeps the two numbers apart and names no agent', () => {
    const summary = summarize(new RareEarlyMyocarditis(), 0);
    expect(summary).toContain('answer different questions');
    expect(summary).toContain('None of them is a probability for this man');
    const lowered = summary.toLowerCase();
    for (const agent of ['methylprednisolone', 'infliximab', 'abatacept']) {
      expect(lowered, agent).not.toContain(agent);
    }
  });
});
