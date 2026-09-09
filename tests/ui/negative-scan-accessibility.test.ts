import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { NegativeScan } from '../../src/modules/surgery-trauma/negative-scan';
import { NEGATIVE_SCAN_ROUND_TICKS as ROUND, NEGATIVE_SCAN_TEAM_TICKS as TEAM } from '../../src/modules/surgery-trauma/negative-scan';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 22, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: NegativeScan, tick: number) => stateSummary(
  { systolicMmHg: 110, diastolicMmHg: 68, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    negativeScan: model.snapshot(tick) },
);

describe('Negative-scan screen-reader summary', () => {
  it('announces the operation, the day, and the duration together', () => {
    const summary = summarize(new NegativeScan(), 0);
    expect(summary).toContain('Day 5 after a sigmoid resection with a primary colorectal anastomosis');
    expect(summary).toContain('Heart rate above 100 for 36 hours');
    expect(summary).toContain('No flatus passed');
  });

  it('quotes the scan report rather than summarising it as negative', () => {
    expect(summarize(new NegativeScan(), 0))
      .toContain('says no evidence of an anastomotic leak');
  });

  it('reports the course as unrecorded until the learner records it', () => {
    expect(summarize(new NegativeScan(), 0)).toContain('Operative course recorded: no.');
    const model = new NegativeScan();
    model.apply('record-the-operative-course', 0);
    expect(summarize(model, 1)).toContain('Operative course recorded: yes.');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new NegativeScan();
    model.apply('escalate-to-the-operating-team', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('The operating team has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('The operating team has answered');
  });

  it('announces the repeat round as unchanged rather than as deterioration', () => {
    const model = new NegativeScan();
    model.advance(ROUND + 10);
    const summary = summarize(model, ROUND + 10);
    expect(summary).toContain('The observations have been repeated and are unchanged');
    expect(summary).toContain('has still passed no flatus');
  });

  it('carries both sides of the evidence, not just the one that licenses acting', () => {
    const summary = summarize(new NegativeScan(), 0);
    expect(summary).toContain('positive predictive value between 4 and 11 percent');
    expect(summary).toContain('cannot exclude a leak either');
  });

  it('marks starting observations as historical and names no agent or operation', () => {
    const summary = summarize(new NegativeScan(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current state: alert, uncomfortable');
    const lowered = summary.toLowerCase();
    for (const term of ['piperacillin', 'metronidazole', 'laparotomy', 'hartmann']) {
      expect(lowered).not.toContain(term);
    }
  });
});
