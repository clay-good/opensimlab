import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { KnownLabel } from '../../src/modules/surgery-trauma/known-label';
import { KNOWN_LABEL_HANDOVER_TICKS as HANDOVER, KNOWN_LABEL_TEAM_TICKS as TEAM } from '../../src/modules/surgery-trauma/known-label';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 12, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: KnownLabel, tick: number) => stateSummary(
  { systolicMmHg: 138, diastolicMmHg: 82, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    knownLabel: model.snapshot(tick) },
);

describe('Known-label screen-reader summary', () => {
  it('announces the label, the informant, and the unachieved examination', () => {
    const summary = summarize(new KnownLabel(), 0);
    expect(summary).toContain('Chronic constipation recorded for 9 years');
    expect(summary).toContain('Informant of 6 years is present');
    expect(summary).toContain('Abdominal examination he could take part in: not achieved');
  });

  it('announces what is different about today and who says so', () => {
    const summary = summarize(new KnownLabel(), 0);
    expect(summary).toContain('usually loud, agitated and self-injurious');
    expect(summary).toContain('refused the one thing he never refuses');
    expect(summary).toContain('this is not it');
  });

  it('reports the recording as unmade until the learner makes it', () => {
    expect(summarize(new KnownLabel(), 0)).toContain('Label and what it explains recorded: no.');
    const model = new KnownLabel();
    model.apply('record-the-label-and-what-it-explains', 0);
    expect(summarize(model, 1)).toContain('Label and what it explains recorded: yes.');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new KnownLabel();
    model.apply('escalate-to-the-surgical-team', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('The surgical team has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('The surgical team has answered');
  });

  it('announces the shift change with the patient unchanged', () => {
    const model = new KnownLabel();
    expect(summarize(model, 0)).not.toContain('relief worker');
    model.advance(HANDOVER + 10);
    const summary = summarize(model, HANDOVER + 10);
    expect(summary).toContain('relief worker');
    expect(summary).toContain('Nothing about the patient has changed');
    expect(summary).toContain('Informant of 6 years has gone home');
  });

  it('carries the figure that supports the label alongside the one that warns about it', () => {
    const summary = summarize(new KnownLabel(), 0);
    expect(summary).toContain('11.04');
    expect(summary).toContain('the label is very likely correct');
    expect(summary).toContain('p equals 0.006');
  });

  it('names no agent, dose, or competing diagnosis', () => {
    const summary = summarize(new KnownLabel(), 0);
    expect(summary).toContain('Current state: awake, quiet rather than agitated');
    const lowered = summary.toLowerCase();
    for (const term of ['morphine', 'macrogol', 'senna', 'obstruction', 'perforation']) expect(lowered).not.toContain(term);
  });
});
