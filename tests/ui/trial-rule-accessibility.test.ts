import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { TrialRule } from '../../src/modules/oncology/trial-rule';
import { TRIAL_RULE_DOCUMENT_TICKS as DOCUMENT, TRIAL_RULE_TEAM_TICKS as TEAM } from '../../src/modules/oncology/trial-rule';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 22, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: TrialRule, tick: number) => stateSummary(
  { systolicMmHg: 112, diastolicMmHg: 68, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    trialRule: model.snapshot(tick) },
);

describe('Response-assessment screen-reader summary', () => {
  it('announces the criterion with the condition it attaches', () => {
    const summary = summarize(new TrialRule(), 0);
    expect(summary).toContain('while the patient is clinically stable');
    expect(summary).toContain('she is not clinically stable');
    expect(summary).toContain('needing help to wash');
  });

  it('announces the criteria once they have arrived', () => {
    const model = new TrialRule();
    model.advance(DOCUMENT + 10);
    const summary = summarize(model, DOCUMENT + 10);
    expect(summary).toContain('govern trial data handling rather than patient management');
    expect(summary).toContain('not validated');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new TrialRule();
    model.apply('escalate-to-the-treating-team-now', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('Her treating team has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('Her treating team has answered');
  });

  it('reads both rates and names no agent', () => {
    const summary = summarize(new TrialRule(), 0);
    expect(summary).toContain('do not exceed 10 percent');
    expect(summary).toContain('between 4 and 29 percent');
    expect(summary).toContain('These remain historical starting observations');
    const lowered = summary.toLowerCase();
    for (const agent of ['pembrolizumab', 'nivolumab', 'atezolizumab', 'docetaxel']) {
      expect(lowered, agent).not.toContain(agent);
    }
  });
});
