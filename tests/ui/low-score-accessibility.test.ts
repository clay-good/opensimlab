import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { LowScore, LOW_SCORE_FAMILY_CONCERN_TICKS as CONCERN,
  LOW_SCORE_REVIEW_TICKS as REVIEW } from '../../src/modules/medical-surgical-nursing/low-score';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 18, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: LowScore, tick: number) => stateSummary(
  { systolicMmHg: 118, diastolicMmHg: 68, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    lowScore: model.snapshot(tick) },
);

describe('Low early-warning score screen-reader summary', () => {
  it('announces the score and that it is correctly calculated', () => {
    const summary = summarize(new LowScore(), 0);
    expect(summary).toContain('Aggregate early-warning score 2');
    expect(summary).toContain('is calculated correctly');
  });

  it('reads the family report and says there is no field for it', () => {
    const summary = summarize(new LowScore(), 0);
    expect(summary).toContain('she is not herself');
    expect(summary).toContain('There is no field for that on the chart');
  });

  it('withholds the sensitivity evidence until it is recorded', () => {
    expect(summarize(new LowScore(), 0)).toContain('has not been recorded yet');
    const model = new LowScore();
    model.apply('record-what-the-score-excludes', 0);
    expect(summarize(model, 1)).toContain('cannot definitively rule out sepsis');
  });

  it('does not announce a review the learner has not looked at', () => {
    const model = new LowScore();
    model.apply('escalate-on-concern', 0);
    model.advance(REVIEW + 10);
    expect(summarize(model, REVIEW + 10)).not.toContain('The review has happened');
    model.apply('reassess', REVIEW + 11);
    expect(summarize(model, REVIEW + 12)).toContain('The review has happened');
  });

  it('announces the repeated family concern with the numbers unchanged', () => {
    const model = new LowScore();
    model.advance(CONCERN + 10);
    const summary = summarize(model, CONCERN + 10);
    expect(summary).toContain('stated the concern again, more plainly');
    expect(summary).toContain('The observations and the score have not moved');
  });

  it('marks starting observations as historical and names no agent', () => {
    const summary = summarize(new LowScore(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current alertness: alert and orientated');
    const lowered = summary.toLowerCase();
    for (const agent of ['piperacillin', 'ceftriaxone', 'vancomycin']) expect(lowered).not.toContain(agent);
  });
});
