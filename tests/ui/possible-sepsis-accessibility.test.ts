import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { PossibleSepsis, POSSIBLE_SEPSIS_CEILING_TICKS as CEILING,
  POSSIBLE_SEPSIS_SHOCK_TICKS as SHOCK,
  POSSIBLE_SEPSIS_INVESTIGATION_TICKS as RETURNS } from '../../src/modules/infectious-disease/possible-sepsis';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 460, respiratoryRateBpm: 22, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: PossibleSepsis, tick: number) => stateSummary(
  { systolicMmHg: 118, diastolicMmHg: 72, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    possibleSepsis: model.snapshot(tick) },
);

describe('Possible sepsis screen-reader summary', () => {
  it('announces the ceiling before anything else', () => {
    const model = new PossibleSepsis();
    model.apply('record-time-zero', 0);
    const [first] = summarize(model, 600).split('\n');
    expect(first).toContain('179 simulated minutes remain of the three hours from first suspicion');
  });

  it('says the clock is running even when it is not displayed', () => {
    const [first] = summarize(new PossibleSepsis(), 0).split('\n');
    expect(first).toContain('no ceiling is announced. It is running regardless');
  });

  it('announces a passed ceiling and then the collapse to the immediate path', () => {
    const passed = new PossibleSepsis();
    passed.apply('record-time-zero', 0);
    passed.advance(CEILING + 10);
    expect(summarize(passed, CEILING + 10).split('\n')[0])
      .toContain('The ceiling has passed, and that is recorded rather than hidden');
    const shocked = new PossibleSepsis();
    shocked.apply('record-time-zero', 0);
    shocked.advance(SHOCK + 10);
    expect(summarize(shocked, SHOCK + 10).split('\n')[0])
      .toContain('antimicrobial therapy is indicated within the hour');
  });

  it('does not announce that an ended run never recorded its clock', () => {
    const model = new PossibleSepsis();
    for (const [tick, action] of [[0, 'record-time-zero'], [1, 'record-uncertainty'],
      [2, 'request-time-limited-assessment'], [3, 'record-antimicrobial-intent'],
      [4, 'review-boundaries'], [5, 'monitor'], [6, 'reassess'], [7, 'handoff']] as const) {
      model.apply(action, tick);
    }
    const [first] = summarize(model, 8).split('\n');
    expect(first).not.toContain('has not been recorded');
    expect(first).toContain('The recorded time of first suspicion stands');
  });

  it('states that there is no waiting action and why', () => {
    const summary = summarize(new PossibleSepsis(), 0);
    expect(summary).toContain('There is deliberately no waiting action in this lesson');
    expect(summary).toContain('the clock does not pause while results are awaited');
  });

  it('keeps the tier with the qualified team and names no agent', () => {
    const summary = summarize(new PossibleSepsis(), 0);
    expect(summary).toContain('classified by the qualified team rather than the learner');
    expect(summary).toContain('No agent, dose, route, or combination is selected');
    const lowered = summary.toLowerCase();
    for (const agent of ['piperacillin', 'meropenem', 'vancomycin']) expect(lowered).not.toContain(agent);
  });

  it('does not read out a result the learner has not requested', () => {
    const model = new PossibleSepsis();
    model.apply('record-time-zero', 0);
    model.advance(RETURNS + 10);
    const summary = summarize(model, RETURNS + 10);
    expect(summary).not.toContain('Concern for infection persists');
    expect(summary).toContain('No new laboratory-only measurement has been requested.');
    expect(summary).toContain('No new full assessment has been requested.');
  });

  it('marks starting findings as historical while reading alertness live', () => {
    const summary = summarize(new PossibleSepsis(), 0);
    expect(summary).toContain('These remain historical starting findings.');
    expect(summary).toContain('Current alertness: alert and orientated.');
  });
});
