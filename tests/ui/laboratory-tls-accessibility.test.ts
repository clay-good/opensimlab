import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { LaboratoryTls } from '../../src/modules/oncology/laboratory-tls';
import { LABORATORY_TLS_REPEAT_TICKS as REPEAT, LABORATORY_TLS_TEAM_TICKS as TEAM } from '../../src/modules/oncology/laboratory-tls';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 520, respiratoryRateBpm: 16, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: LaboratoryTls, tick: number) => stateSummary(
  { systolicMmHg: 126, diastolicMmHg: 74, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    laboratoryTls: model.snapshot(tick) },
);

describe('Laboratory tumour-lysis screen-reader summary', () => {
  it('announces both halves of the definition in one sentence', () => {
    const summary = summarize(new LaboratoryTls(), 0);
    expect(summary).toContain('Laboratory criteria met; clinical criteria not met');
    expect(summary).toContain('18 hours after the first cycle');
  });

  it('announces the repeat set moving while the patient does not', () => {
    const model = new LaboratoryTls();
    model.advance(REPEAT + 10);
    const summary = summarize(model, REPEAT + 10);
    expect(summary).toContain('The laboratory picture has moved and the patient has not');
    expect(summary).toContain('creatinine unchanged');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new LaboratoryTls();
    model.apply('escalate-to-the-treating-team', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('The treating team has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('The treating team has answered');
  });

  it('keeps the cited rates off this patient and names no agent', () => {
    const summary = summarize(new LaboratoryTls(), 0);
    expect(summary).toContain('None of these figures is a probability for this man');
    expect(summary).toContain('These remain historical starting observations');
    const lowered = summary.toLowerCase();
    for (const agent of ['rasburicase', 'allopurinol', 'calcium gluconate']) {
      expect(lowered, agent).not.toContain(agent);
    }
  });
});
