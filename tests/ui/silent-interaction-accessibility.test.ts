import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { SilentInteraction } from '../../src/modules/oncology/silent-interaction';
import { SILENT_INTERACTION_PHARMACY_TICKS as PHARMACY, SILENT_INTERACTION_TEAM_TICKS as TEAM } from '../../src/modules/oncology/silent-interaction';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 460, respiratoryRateBpm: 16, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: SilentInteraction, tick: number) => stateSummary(
  { systolicMmHg: 124, diastolicMmHg: 78, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    silentInteraction: model.snapshot(tick) },
);

describe('Medicines-reconciliation screen-reader summary', () => {
  it('announces the absence rather than reading out normal values alone', () => {
    const summary = summarize(new SilentInteraction(), 0);
    expect(summary).toContain('no abnormal finding of any kind');
    expect(summary).toContain('The medicines lists are the only place anything is wrong');
  });

  it('announces the pharmacy list once it has arrived', () => {
    const model = new SilentInteraction();
    model.advance(PHARMACY + 10);
    expect(summarize(model, PHARMACY + 10)).toContain('holds six, including one she buys herself');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new SilentInteraction();
    model.apply('escalate-to-the-treating-team-now', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('Her treating team has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('Her treating team has answered');
  });

  it('gives the direction of harm and the estimates, and names no agent', () => {
    const summary = summarize(new SilentInteraction(), 0);
    expect(summary).toContain('less treatment rather than more toxicity');
    expect(summary).toContain('1.42 to 1.76');
    expect(summary).toContain('These remain historical starting observations');
    const lowered = summary.toLowerCase();
    for (const agent of ['omeprazole', 'lansoprazole', 'gefitinib', 'erlotinib']) {
      expect(lowered, agent).not.toContain(agent);
    }
  });
});
