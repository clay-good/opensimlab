import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { NormalTestToxicity } from '../../src/modules/oncology/normal-test-toxicity';
import { NORMAL_TEST_TOXICITY_NEXT_DOSE_TICKS as NEXT_DOSE, NORMAL_TEST_TOXICITY_SERVICE_TICKS as SERVICE } from '../../src/modules/oncology/normal-test-toxicity';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 490, respiratoryRateBpm: 16, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: NormalTestToxicity, tick: number) => stateSummary(
  { systolicMmHg: 112, diastolicMmHg: 68, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    normalTestToxicity: model.snapshot(tick) },
);

describe('Oral-anticancer-toxicity screen-reader summary', () => {
  it('leads with the drug status and where the supply is', () => {
    const summary = summarize(new NormalTestToxicity(), 0);
    expect(summary).toContain('The drug is not withheld');
    expect(summary).toContain('in the patient’s own bag');
    expect(summary).toContain('Cycle 1, day 9');
  });

  it('reports the drug as withheld once it is', () => {
    const model = new NormalTestToxicity();
    model.apply('withhold-the-drug-now', 0);
    expect(summarize(model, 1)).toContain('The drug is withheld');
  });

  it('announces whether the evening dose was taken, and why', () => {
    const idle = new NormalTestToxicity();
    idle.advance(NEXT_DOSE + 10);
    expect(summarize(idle, NEXT_DOSE + 10)).toContain('he took it, because nobody had told him not to');
    const stopped = new NormalTestToxicity();
    stopped.apply('withhold-the-drug-now', 0);
    stopped.advance(NEXT_DOSE + 10);
    expect(summarize(stopped, NEXT_DOSE + 10)).toContain('he did not take it');
  });

  it('withholds the cohort figures until they are recorded', () => {
    expect(summarize(new NormalTestToxicity(), 0)).toContain('has not been recorded');
    const model = new NormalTestToxicity();
    model.apply('record-what-the-normal-test-does-not-exclude', 0);
    expect(summarize(model, 1)).toContain('231 of 1018 wild-type patients');
  });

  it('does not announce a service reply the learner has not looked at', () => {
    const model = new NormalTestToxicity();
    model.apply('escalate-to-acute-oncology', 0);
    model.advance(SERVICE + 10);
    expect(summarize(model, SERVICE + 10)).not.toContain('Acute oncology has answered');
    model.apply('reassess', SERVICE + 11);
    expect(summarize(model, SERVICE + 12)).toContain('Acute oncology has answered');
  });

  it('marks starting observations as historical and names no agent', () => {
    const summary = summarize(new NormalTestToxicity(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current alertness: alert, orientated');
    const lowered = summary.toLowerCase();
    for (const agent of ['capecitabine', 'fluorouracil', 'uridine', 'ondansetron']) {
      expect(lowered, agent).not.toContain(agent);
    }
  });
});
