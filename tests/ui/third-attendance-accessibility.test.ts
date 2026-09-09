import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { ThirdAttendance } from '../../src/modules/surgery-trauma/third-attendance';
import { THIRD_ATTENDANCE_COLLEAGUE_TICKS as COLLEAGUE, THIRD_ATTENDANCE_TEAM_TICKS as TEAM } from '../../src/modules/surgery-trauma/third-attendance';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 12, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: ThirdAttendance, tick: number) => stateSummary(
  { systolicMmHg: 118, diastolicMmHg: 70, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    thirdAttendance: model.snapshot(tick) },
);

describe('Third-attendance screen-reader summary', () => {
  it('announces the three attendances and what each found', () => {
    const summary = summarize(new ThirdAttendance(), 0);
    expect(summary).toContain('3 attendances in 5 days');
    expect(summary).toContain('generalised abdominal pain, vomited once, discharged');
    expect(summary).toContain('recorded as settling with a soft abdomen');
    expect(summary).toContain('neither clinician did anything wrong');
  });

  it('announces that the observations were the same on both previous visits', () => {
    const summary = summarize(new ThirdAttendance(), 0);
    expect(summary).toContain('very nearly the same on both previous visits');
    expect(summary).toContain('not performed at any visit');
  });

  it('reports the recording as unmade until the learner makes it', () => {
    expect(summarize(new ThirdAttendance(), 0)).toContain('Attendances and findings recorded: no.');
    const model = new ThirdAttendance();
    model.apply('record-the-attendances-and-what-each-found', 0);
    expect(summarize(model, 1)).toContain('Attendances and findings recorded: yes.');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new ThirdAttendance();
    model.apply('escalate-to-the-surgical-team', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('The surgical team has answered');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('The surgical team has answered');
  });

  it('announces the colleague with nothing about the patient changed', () => {
    const model = new ThirdAttendance();
    expect(summarize(model, 0)).not.toContain('has passed the door');
    model.advance(COLLEAGUE + 10);
    const summary = summarize(model, COLLEAGUE + 10);
    expect(summary).toContain('has passed the door');
    expect(summary).toContain('Nothing about the patient has changed');
  });

  it('carries the source that argues against the instinct the case produces', () => {
    const summary = summarize(new ThirdAttendance(), 0);
    expect(summary).toContain('6.0 percent');
    expect(summary).toContain('returning is not itself a verdict on anybody');
  });

  it('names no agent, dose, score, or operation', () => {
    const summary = summarize(new ThirdAttendance(), 0);
    expect(summary).toContain('Current state: alert, apologetic about being back');
    const lowered = summary.toLowerCase();
    for (const term of ['morphine', 'paracetamol', 'alvarado', 'appendicectomy']) expect(lowered).not.toContain(term);
  });
});
