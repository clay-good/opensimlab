import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { UnfinishedSurvey } from '../../src/modules/surgery-trauma/unfinished-survey';
import { UNFINISHED_SURVEY_WAKE_TICKS as WAKE, UNFINISHED_SURVEY_TEAM_TICKS as TEAM } from '../../src/modules/surgery-trauma/unfinished-survey';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'volume-control', tidalVolumeMl: 480, respiratoryRateBpm: 14, fio2: 0.35, delivering: true },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: UnfinishedSurvey, tick: number) => stateSummary(
  { systolicMmHg: 118, diastolicMmHg: 68, etco2MmHg: 38, fio2: 0.35 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    unfinishedSurvey: model.snapshot(tick) },
);

describe('Unfinished-survey screen-reader summary', () => {
  it('announces what the record says and what is missing from it', () => {
    const summary = summarize(new UnfinishedSurvey(), 0);
    expect(summary).toContain('14 hours ago, sedated and ventilated');
    expect(summary).toContain('4 injuries listed');
    expect(summary).toContain('Secondary survey documented as complete');
    expect(summary).toContain('Tertiary survey not documented');
  });

  it('announces why the examination was limited and the pressure on the bed', () => {
    const summary = summarize(new UnfinishedSurvey(), 0);
    expect(summary).toContain('Glasgow Coma Scale of 6 at the scene');
    expect(summary).toContain('could not report pain, move to command, or be asked where it hurt');
    expect(summary).toContain('stepped down tonight');
    expect(summary).toContain('none of them is abnormal');
  });

  it('reports the recording as unmade until the learner makes it', () => {
    expect(summarize(new UnfinishedSurvey(), 0)).toContain('Reasons the examination was limited recorded: no.');
    const model = new UnfinishedSurvey();
    model.apply('record-why-he-could-not-be-examined', 0);
    expect(summarize(model, 1)).toContain('Reasons the examination was limited recorded: yes.');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new UnfinishedSurvey();
    model.apply('escalate-to-the-trauma-team', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('The trauma team has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('The trauma team has answered');
  });

  it('announces the sedation window with everything monitored unchanged', () => {
    const model = new UnfinishedSurvey();
    model.advance(WAKE + 10);
    const summary = summarize(model, WAKE + 10);
    expect(summary).toContain('Sedation has been lightened');
    expect(summary).toContain('does not move the left arm');
    expect(summary).toContain('exactly as they were');
  });

  it('carries the half of the evidence that undercuts the step, not only the half that sells it', () => {
    const summary = summarize(new UnfinishedSurvey(), 0);
    expect(summary).toContain('41 missed injuries in 36 patients, 9 percent');
    expect(summary).toContain('without reducing missed injury');
  });

  it('marks starting observations as historical and names no agent or procedure', () => {
    const summary = summarize(new UnfinishedSurvey(), 0);
    expect(summary).toContain('These remain historical starting observations');
    expect(summary).toContain('Current state: sedated and ventilated');
    const lowered = summary.toLowerCase();
    for (const term of ['morphine', 'propofol', 'laparotomy']) expect(lowered).not.toContain(term);
  });
});
