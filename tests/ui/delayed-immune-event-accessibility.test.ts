import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { DelayedImmuneEvent } from '../../src/modules/oncology/delayed-immune-event';
import { DELAYED_IMMUNE_EVENT_COURSE_TICKS as COURSE, DELAYED_IMMUNE_EVENT_SERVICE_TICKS as SERVICE } from '../../src/modules/oncology/delayed-immune-event';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 18, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: DelayedImmuneEvent, tick: number) => stateSummary(
  { systolicMmHg: 106, diastolicMmHg: 64, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    delayedImmuneEvent: model.snapshot(tick) },
);

describe('Delayed immune-event screen-reader summary', () => {
  it('announces the exposure and the interval together', () => {
    const summary = summarize(new DelayedImmuneEvent(), 0);
    expect(summary).toContain('4 cycles of an anti-PD-1 checkpoint inhibitor');
    expect(summary).toContain('last dose 22 weeks ago');
    expect(summary).toContain('absent from the current medication list, because it stopped');
  });

  it('reports the exposure as unrecorded until the learner records it', () => {
    expect(summarize(new DelayedImmuneEvent(), 0))
      .toContain('The completed exposure has not been recorded as current history.');
    const model = new DelayedImmuneEvent();
    model.apply('record-the-completed-exposure', 0);
    expect(summarize(model, 1)).toContain('Exposure recorded at simulated');
  });

  it('does not announce a service reply the learner has not looked at', () => {
    const model = new DelayedImmuneEvent();
    model.apply('escalate-to-the-treating-service', 0);
    model.advance(SERVICE + 10);
    expect(summarize(model, SERVICE + 10)).not.toContain('The treating service has answered');
    model.apply('reassess', SERVICE + 11);
    expect(summarize(model, SERVICE + 12)).toContain('The treating service has answered');
  });

  it('announces the further stool with the observations unchanged', () => {
    const model = new DelayedImmuneEvent();
    model.advance(COURSE + 10);
    const summary = summarize(model, COURSE + 10);
    expect(summary).toContain('An eighth stool has been counted today');
    expect(summary).toContain('The observations have barely moved');
  });

  it('states that 23 cases carry no denominator', () => {
    expect(summarize(new DelayedImmuneEvent(), 0))
      .toContain('23 reported cases with no denominator');
  });

  it('marks starting observations as historical and names no agent', () => {
    const summary = summarize(new DelayedImmuneEvent(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current alertness: alert, orientated');
    const lowered = summary.toLowerCase();
    for (const agent of ['prednisolone', 'infliximab', 'vedolizumab', 'loperamide']) {
      expect(lowered).not.toContain(agent);
    }
  });
});
