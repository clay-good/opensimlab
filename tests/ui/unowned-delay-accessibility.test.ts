import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { UnownedDelay } from '../../src/modules/surgery-trauma/unowned-delay';
import { UNOWNED_DELAY_LIST_TICKS as LIST, UNOWNED_DELAY_TEAM_TICKS as TEAM } from '../../src/modules/surgery-trauma/unowned-delay';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 400, respiratoryRateBpm: 12, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: UnownedDelay, tick: number) => stateSummary(
  { systolicMmHg: 132, diastolicMmHg: 70, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    unownedDelay: model.snapshot(tick) },
);

describe('Unowned-delay screen-reader summary', () => {
  it('announces the total in hours, cancellations and fasted hours', () => {
    const summary = summarize(new UnownedDelay(), 0);
    expect(summary).toContain('admitted 42 hours ago and not yet operated');
    expect(summary).toContain('2 cancellations');
    expect(summary).toContain('13 hours fasted');
  });

  it('announces the unbooked investigation and the missing author', () => {
    const summary = summarize(new UnownedDelay(), 0);
    expect(summary).toContain('requested');
    expect(summary).toContain('not booked');
    expect(summary).toContain('not named in the record');
    expect(summary).toContain('none documented');
  });

  it('announces that the observations are the admission observations', () => {
    const summary = summarize(new UnownedDelay(), 0);
    expect(summary).toContain('These are the same numbers as on admission');
  });

  it('reports the recording as unmade until the learner makes it', () => {
    expect(summarize(new UnownedDelay(), 0)).toContain('Fracture and clock recorded: no.');
    const model = new UnownedDelay();
    model.apply('record-the-fracture-and-the-clock', 0);
    expect(summarize(model, 1)).toContain('Fracture and clock recorded: yes.');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new UnownedDelay();
    model.apply('escalate-to-the-team-that-owns-the-list', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('The team that owns the list has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('The team that owns the list has answered');
  });

  it('announces the lost evening with everything monitored unchanged', () => {
    const model = new UnownedDelay();
    expect(summarize(model, 0)).not.toContain('this evening is gone');
    model.advance(LIST + 10);
    const summary = summarize(model, LIST + 10);
    expect(summary).toContain('this evening is gone');
    expect(summary).toContain('exactly what it was on admission');
  });

  it('carries the randomised result alongside the observational signal', () => {
    const summary = summarize(new UnownedDelay(), 0);
    expect(summary).toContain('42,230');
    expect(summary).toContain('no significant difference in mortality or major complications');
  });
});
