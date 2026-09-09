import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { TransientResponse } from '../../src/modules/surgery-trauma/transient-response';
import { TRANSIENT_RESPONSE_FALL_TICKS as FALL, TRANSIENT_RESPONSE_TEAM_TICKS as TEAM } from '../../src/modules/surgery-trauma/transient-response';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 12, fio2: 0.4, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: TransientResponse, tick: number) => stateSummary(
  { systolicMmHg: 96, diastolicMmHg: 58, etco2MmHg: 38, fio2: 0.4 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    transientResponse: model.snapshot(tick) },
);

describe('Transient-response screen-reader summary', () => {
  it('announces the mechanism with its clock and what has already been given', () => {
    const summary = summarize(new TransientResponse(), 0);
    expect(summary).toContain('40 minutes ago');
    expect(summary).toContain('Free fluid reported on a bedside scan already performed');
    expect(summary).toContain('2 warmed boluses given before this assessment');
  });

  it('announces the response as a shrinking pattern rather than as a reading', () => {
    const summary = summarize(new TransientResponse(), 0);
    expect(summary).toContain('held it for 20 minutes');
    expect(summary).toContain('held it for 9');
    expect(summary).toContain('Each answer was smaller and arrived sooner than the one before');
  });

  it('reports the recording as unmade until the learner makes it', () => {
    expect(summarize(new TransientResponse(), 0)).toContain('Mechanism and clock recorded: no.');
    const model = new TransientResponse();
    model.apply('record-the-mechanism-and-the-clock', 0);
    expect(summarize(model, 1)).toContain('Mechanism and clock recorded: yes.');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new TransientResponse();
    model.apply('escalate-to-the-theatre-team', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('The operating team has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('The operating team has answered');
  });

  it('announces the third fall as something that happened with nothing taken away', () => {
    const model = new TransientResponse();
    expect(summarize(model, 0)).not.toContain('fallen a third time');
    model.advance(FALL + 10);
    const summary = summarize(model, FALL + 10);
    expect(summary).toContain('fallen a third time, to 84 over 50');
    expect(summary).toContain('nothing was taken away to cause it');
  });

  it('carries the half of the evidence that argues for scanning, not only the half against delay', () => {
    const summary = summarize(new TransientResponse(), 0);
    expect(summary).toContain('0.35 percent a minute');
    expect(summary).toContain('better survival across 4,621 blunt trauma patients');
    expect(summary).toContain('rather than to imaging');
  });

  it('names no agent, dose, blood product, or operation', () => {
    const summary = summarize(new TransientResponse(), 0);
    expect(summary).toContain('Current state: awake and answering');
    const lowered = summary.toLowerCase();
    for (const term of ['morphine', 'propofol', 'tranexamic', 'laparotomy']) expect(lowered).not.toContain(term);
  });
});
