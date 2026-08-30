import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { EasyLabel } from '../../src/modules/oncology/easy-label';
import { EASY_LABEL_HISTORY_TICKS as HISTORY, EASY_LABEL_TEAM_TICKS as TEAM } from '../../src/modules/oncology/easy-label';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 520, respiratoryRateBpm: 18, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: EasyLabel, tick: number) => stateSummary(
  { systolicMmHg: 118, diastolicMmHg: 72, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    easyLabel: model.snapshot(tick) },
);

describe('Diagnosis-of-exclusion screen-reader summary', () => {
  it('announces the label together with what it still requires', () => {
    const summary = summarize(new EasyLabel(), 0);
    expect(summary).toContain('a diagnosis of exclusion');
    expect(summary).toContain('are not excluded');
    expect(summary).toContain('No microbiological studies have been reported');
  });

  it('announces the surfaced history and that nothing about him changed', () => {
    const model = new EasyLabel();
    model.advance(HISTORY + 10);
    const summary = summarize(model, HISTORY + 10);
    expect(summary).toContain('a course of antibiotics three weeks ago');
    expect(summary).toContain('Nothing about him has changed');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new EasyLabel();
    model.apply('escalate-so-both-can-start-together', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('gastroenterology have answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('gastroenterology have answered');
  });

  it('gives both boundaries and names no agent', () => {
    const summary = summarize(new EasyLabel(), 0);
    expect(summary).toContain('grade 2 or above, so delay is not free');
    expect(summary).toContain('microbiological studies should be performed first');
    expect(summary).toContain('These remain historical starting observations');
    const lowered = summary.toLowerCase();
    for (const agent of ['prednisolone', 'methylprednisolone', 'infliximab', 'vedolizumab']) {
      expect(lowered, agent).not.toContain(agent);
    }
  });
});
