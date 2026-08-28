import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { SepticShockLabel, SEPTIC_SHOCK_LABEL_CEILING_TICKS as CEILING,
  SEPTIC_SHOCK_LABEL_TRIAL_TICKS as TRIAL } from '../../src/modules/infectious-disease/septic-shock-label';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 26, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: SepticShockLabel, tick: number) => stateSummary(
  { systolicMmHg: 84, diastolicMmHg: 48, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    septicShockLabel: model.snapshot(tick) },
);

describe('Septic shock label screen-reader summary', () => {
  it('announces each criterion with its own verdict', () => {
    const summary = summarize(new SepticShockLabel(), 0);
    expect(summary).toContain('Vasopressors needed to maintain a mean arterial pressure at or above 65: not yet decidable');
    expect(summary).toContain('That mean pressure held at target on support: not yet decidable');
    expect(summary).toContain('A serum lactate above 2 millimoles per liter after adequate fluid resuscitation: met');
  });

  it('changes only the treatment-dependent criteria once the trial completes', () => {
    const model = new SepticShockLabel();
    model.apply('record-resuscitation-intent', 0);
    model.advance(TRIAL + 10);
    const summary = summarize(model, TRIAL + 10);
    expect(summary).not.toContain('not yet decidable');
    expect(summary).toContain('this meets septic shock');
    expect(summary).toContain('the label reflects a treatment as much as a patient');
  });

  it('states that two criteria have no truth value before the trial', () => {
    expect(summarize(new SepticShockLabel(), 0))
      .toContain('Two of the three have no truth value yet');
  });

  it('announces the ceiling ahead of the criteria, and reports it passing', () => {
    const lines = summarize(new SepticShockLabel(), 600).split('\n');
    const ceiling = lines.findIndex((line) => line.includes('59 simulated minutes remain of the hour'));
    const criteria = lines.findIndex((line) => line.includes('Septic shock requires three things together'));
    expect(ceiling).toBeGreaterThanOrEqual(0);
    // The clock has to be heard before the reasoning it bounds.
    expect(ceiling).toBeLessThan(criteria);
    const passed = new SepticShockLabel();
    passed.advance(CEILING + 10);
    expect(summarize(passed, CEILING + 10))
      .toContain('The ceiling has passed, and that is reported rather than hidden');
  });

  it('reports that adequacy was left undefined and names no agent', () => {
    const summary = summarize(new SepticShockLabel(), 0);
    expect(summary).toContain('could not be explicitly specified, because they are highly user dependent');
    expect(summary).toContain('No fluid volume, rate, vasoactive agent, dose, or endpoint is selected here');
    const lowered = summary.toLowerCase();
    for (const agent of ['noradrenaline', 'norepinephrine', 'vasopressin']) expect(lowered).not.toContain(agent);
  });

  it('does not read out a result the learner has not requested', () => {
    const model = new SepticShockLabel();
    model.apply('record-resuscitation-intent', 0);
    model.advance(TRIAL + 10);
    const summary = summarize(model, TRIAL + 10);
    expect(summary).toContain('No new laboratory-only measurement has been requested.');
    expect(summary).toContain('No new full assessment has been requested.');
  });

  it('marks starting findings as historical while reading alertness live', () => {
    const summary = summarize(new SepticShockLabel(), 0);
    expect(summary).toContain('These remain historical starting findings.');
    expect(summary).toContain('Current alertness: drowsy but rousable.');
  });
});
