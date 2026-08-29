import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { MeningitisImaging, MENINGITIS_IMAGING_CEILING_TICKS as CEILING,
  MENINGITIS_IMAGING_RESULT_TICKS as RESULT } from '../../src/modules/infectious-disease/meningitis-imaging';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 20, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: MeningitisImaging, tick: number) => stateSummary(
  { systolicMmHg: 128, diastolicMmHg: 74, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    meningitisImaging: model.snapshot(tick) },
);

describe('Meningitis imaging screen-reader summary', () => {
  it('withholds the comparison until it is asked for, and says so', () => {
    const summary = summarize(new MeningitisImaging(), 0);
    expect(summary).toContain('The published criteria sets have not been compared yet');
    expect(summary).not.toContain('Two say image, three do not');
  });

  it('announces every set and which way it falls', () => {
    const model = new MeningitisImaging();
    model.apply('compare-criteria-sets', 0);
    const summary = summarize(model, 1);
    for (const set of ['Swedish national criteria', 'NICE NG240', 'ESCMID', 'IDSA', 'WHO']) {
      expect(summary).toContain(set);
    }
    expect(summary).toContain('Two say image, three do not, and the patient did not change between those readings');
  });

  it('reads the absences alongside the presences', () => {
    const summary = summarize(new MeningitisImaging(), 0);
    expect(summary).toContain('Absent: focal deficit, seizure, papilloedema');
    expect(summary).toContain('the absences matter as much as the presences');
  });

  it('announces the recorded fact ahead of a sticky ceiling flag', () => {
    const model = new MeningitisImaging();
    model.advance(CEILING + 10);
    model.apply('record-antimicrobial-intent', CEILING + 20);
    const summary = summarize(model, CEILING + 30);
    expect(summary).toContain('after the hour had passed');
    expect(summary).not.toContain('no antimicrobial intent recorded');
  });

  it('reports the one-hour target as a margin without excusing it', () => {
    const summary = summarize(new MeningitisImaging(), 0);
    expect(summary).toContain('graded very low to low quality');
    expect(summary).toContain('system-design margin rather than a validated deadline');
  });

  it('does not read out a scan the learner has not looked at', () => {
    const model = new MeningitisImaging();
    model.apply('record-antimicrobial-intent', 0);
    model.advance(RESULT + 10);
    expect(summarize(model, RESULT + 10)).not.toContain('It changed no management');
    model.apply('reassess', RESULT + 11);
    expect(summarize(model, RESULT + 12)).toContain('It changed no management');
  });

  it('marks starting findings as historical and names no agent', () => {
    const summary = summarize(new MeningitisImaging(), 0);
    expect(summary).toContain('These remain historical starting findings.');
    expect(summary).toContain('Current alertness: confused but obeying commands');
    const lowered = summary.toLowerCase();
    for (const agent of ['ceftriaxone', 'vancomycin', 'dexamethasone']) expect(lowered).not.toContain(agent);
  });
});
