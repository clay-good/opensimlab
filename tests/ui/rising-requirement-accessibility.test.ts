import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { RisingRequirement } from '../../src/modules/surgery-trauma/rising-requirement';
import { RISING_REQUIREMENT_WORSENING_TICKS as WORSE, RISING_REQUIREMENT_TEAM_TICKS as TEAM } from '../../src/modules/surgery-trauma/rising-requirement';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 18, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: RisingRequirement, tick: number) => stateSummary(
  { systolicMmHg: 128, diastolicMmHg: 74, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    risingRequirement: model.snapshot(tick) },
);

describe('Rising-requirement screen-reader summary', () => {
  it('announces the clock and the requirement together', () => {
    const summary = summarize(new RisingRequirement(), 0);
    expect(summary).toContain('8 hours ago, in a below-knee cast');
    expect(summary).toContain('3 escalating requests');
    expect(summary).toContain('Pain on passive extension present');
  });

  it('announces the reassuring findings without letting them reassure', () => {
    const summary = summarize(new RisingRequirement(), 0);
    expect(summary).toContain('dorsalis pedis is easily felt');
    expect(summary).toContain('none of them is abnormal');
    expect(summary).toContain('the pressure was not diagnostic');
  });

  it('reports the clock as unrecorded until the learner records it', () => {
    expect(summarize(new RisingRequirement(), 0)).toContain('Injury and clock recorded: no.');
    const model = new RisingRequirement();
    model.apply('record-the-injury-and-the-clock', 0);
    expect(summarize(model, 1)).toContain('Injury and clock recorded: yes.');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new RisingRequirement();
    model.apply('escalate-to-the-surgical-team', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('The surgical team has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('The surgical team has answered');
  });

  it('announces the fourth request with everything else unchanged', () => {
    const model = new RisingRequirement();
    model.advance(WORSE + 10);
    const summary = summarize(model, WORSE + 10);
    expect(summary).toContain('asked a fourth time');
    expect(summary).toContain('exactly as they were');
  });

  it('carries both directions of failure, not just the one that licenses acting', () => {
    const summary = summarize(new RisingRequirement(), 0);
    expect(summary).toContain('sensitivity of 13 to 19 percent');
    expect(summary).toContain('over-calls');
  });

  it('marks starting observations as historical and names no agent or procedure', () => {
    const summary = summarize(new RisingRequirement(), 0);
    expect(summary).toContain('These remain historical starting observations');
    expect(summary).toContain('Current state: alert, apologetic');
    const lowered = summary.toLowerCase();
    for (const term of ['morphine', 'fentanyl', 'fasciotomy']) expect(lowered).not.toContain(term);
  });
});
