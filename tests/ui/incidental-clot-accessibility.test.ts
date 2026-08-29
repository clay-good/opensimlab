import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { IncidentalClot, INCIDENTAL_CLOT_QUESTION_TICKS as QUESTION,
  INCIDENTAL_CLOT_SERVICE_TICKS as SERVICE } from '../../src/modules/oncology/incidental-clot';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 15, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: IncidentalClot, tick: number) => stateSummary(
  { systolicMmHg: 128, diastolicMmHg: 74, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    incidentalClot: model.snapshot(tick) },
);

describe('Incidental-clot screen-reader summary', () => {
  it('announces the strength and the certainty together', () => {
    const summary = summarize(new IncidentalClot(), 0);
    expect(summary).toContain('The recommendation here is conditional');
    expect(summary).toContain('very low certainty in the evidence of effects');
    expect(summary).toContain('4 days unacknowledged');
  });

  it('withholds the paired figures until they are recorded together', () => {
    expect(summarize(new IncidentalClot(), 0)).toContain('either figure alone is a different lesson');
    const model = new IncidentalClot();
    model.apply('record-the-benefit-and-the-harm-together', 0);
    const summary = summarize(model, 1);
    expect(summary).toContain('89 fewer deaths');
    expect(summary).toContain('128 more major bleeds');
  });

  it('does not announce a service reply the learner has not looked at', () => {
    const model = new IncidentalClot();
    model.apply('escalate-to-the-treating-service', 0);
    model.advance(SERVICE + 10);
    expect(summarize(model, SERVICE + 10)).not.toContain('The treating service has answered');
    model.apply('reassess', SERVICE + 11);
    expect(summarize(model, SERVICE + 12)).toContain('The treating service has answered');
  });

  it('announces the patient’s own question and that he is not refusing', () => {
    const model = new IncidentalClot();
    model.advance(QUESTION + 10);
    const summary = summarize(model, QUESTION + 10);
    expect(summary).toContain('the bleeding frightened him more than anything else has');
    expect(summary).toContain('He is not refusing anything');
  });

  it('marks starting observations as historical and names no anticoagulant', () => {
    const summary = summarize(new IncidentalClot(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current alertness: alert, orientated');
    const lowered = summary.toLowerCase();
    for (const agent of ['enoxaparin', 'apixaban', 'rivaroxaban', 'warfarin', 'heparin']) {
      expect(lowered, agent).not.toContain(agent);
    }
  });
});
