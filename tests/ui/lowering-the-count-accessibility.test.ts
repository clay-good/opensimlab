import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { LoweringTheCount } from '../../src/modules/oncology/lowering-the-count';
import { LOWERING_THE_COUNT_DETERIORATION_TICKS as WORSE, LOWERING_THE_COUNT_TEAM_TICKS as TEAM } from '../../src/modules/oncology/lowering-the-count';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 530, respiratoryRateBpm: 26, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: LoweringTheCount, tick: number) => stateSummary(
  { systolicMmHg: 108, diastolicMmHg: 62, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    loweringTheCount: model.snapshot(tick) },
);

describe('Hyperleukocytosis screen-reader summary', () => {
  it('announces the count with the findings that make it an emergency', () => {
    const summary = summarize(new LoweringTheCount(), 0);
    expect(summary).toContain('240 times ten to the ninth per litre');
    expect(summary).toContain('breathless at rest and confused');
    expect(summary).toContain('a clinical designation, not a number');
  });

  it('announces the deterioration and that the count has not moved', () => {
    const model = new LoweringTheCount();
    model.advance(WORSE + 10);
    const summary = summarize(model, WORSE + 10);
    expect(summary).toContain('more breathless and harder to rouse');
    expect(summary).toContain('it is the same sample');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new LoweringTheCount();
    model.apply('escalate-to-haematology-now', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('Haematology has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('Haematology has answered');
  });

  it('reads the interval in both directions and names no agent', () => {
    const summary = summarize(new LoweringTheCount(), 0);
    expect(summary).toContain('includes benefit as well as harm');
    expect(summary).toContain('These remain historical starting observations');
    const lowered = summary.toLowerCase();
    for (const agent of ['hydroxycarbamide', 'hydroxyurea', 'cytarabine', 'rasburicase']) {
      expect(lowered, agent).not.toContain(agent);
    }
  });
});
