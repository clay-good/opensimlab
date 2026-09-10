import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { DeferredStep } from '../../src/modules/surgery-trauma/deferred-step';
import { DEFERRED_STEP_SLIP_TICKS as SLIP, DEFERRED_STEP_TEAM_TICKS as TEAM } from '../../src/modules/surgery-trauma/deferred-step';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 12, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: DeferredStep, tick: number) => stateSummary(
  { systolicMmHg: 124, diastolicMmHg: 74, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    deferredStep: model.snapshot(tick) },
);

describe('Deferred-step screen-reader summary', () => {
  it('announces both clocks and the step that has not happened', () => {
    const summary = summarize(new DeferredStep(), 0);
    expect(summary).toContain('47 minutes since injury and 28 since arrival');
    expect(summary).toContain('Antibiotic not given');
    expect(summary).toContain('Anybody objecting: nobody');
  });

  it('announces what the step is attached to', () => {
    const summary = summarize(new DeferredStep(), 0);
    expect(summary).toContain('orthopaedics will review her and give the antibiotics then');
    expect(summary).toContain('in theatre with another case');
  });

  it('announces that every observation is normal and will stay normal', () => {
    const summary = summarize(new DeferredStep(), 0);
    expect(summary).toContain('Every one is normal and they will stay normal');
  });

  it('reports the recording as unmade until the learner makes it', () => {
    expect(summarize(new DeferredStep(), 0)).toContain('Injury and clock recorded: no.');
    const model = new DeferredStep();
    model.apply('record-the-injury-and-the-clock', 0);
    expect(summarize(model, 1)).toContain('Injury and clock recorded: yes.');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new DeferredStep();
    model.apply('escalate-to-the-team-that-can-prescribe', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('The team that can prescribe has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('The team that can prescribe has answered');
  });

  it('announces the slipped review with the patient unchanged', () => {
    const model = new DeferredStep();
    expect(summarize(model, 0)).not.toContain('will not happen before half past five');
    model.advance(SLIP + 10);
    const summary = summarize(model, SLIP + 10);
    expect(summary).toContain('will not happen before half past five');
    expect(summary).toContain('Nothing about the patient has changed');
  });

  it('carries both thresholds and the clocks they are measured from', () => {
    const summary = summarize(new DeferredStep(), 0);
    expect(summary).toContain('66 minutes from injury');
    expect(summary).toContain('120 minutes from arrival');
    expect(summary).toContain('two different moments');
  });

  it('names no agent, dose, or route', () => {
    const summary = summarize(new DeferredStep(), 0);
    expect(summary).toContain('Current state: alert, uncomfortable but coping');
    const lowered = summary.toLowerCase();
    for (const term of ['co-amoxiclav', 'cefazolin', 'gentamicin', 'mg/kg']) expect(lowered).not.toContain(term);
  });
});
