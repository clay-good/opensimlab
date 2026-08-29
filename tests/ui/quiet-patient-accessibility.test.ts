import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { QuietPatient, QUIET_PATIENT_HANDOVER_TICKS as HANDOVER,
  QUIET_PATIENT_REVIEW_TICKS as REVIEW } from '../../src/modules/medical-surgical-nursing/quiet-patient';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 440, respiratoryRateBpm: 16, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: QuietPatient, tick: number) => stateSummary(
  { systolicMmHg: 126, diastolicMmHg: 74, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    quietPatient: model.snapshot(tick) },
);

describe('Delirium screening screen-reader summary', () => {
  it('announces the count of screening results and what zero means', () => {
    const summary = summarize(new QuietPatient(), 0);
    expect(summary).toContain('Screening results in the record: 0');
    expect(summary).toContain('holds no negative screen; it holds no screen');
  });

  it('reads the impressions verbatim', () => {
    const summary = summarize(new QuietPatient(), 0);
    expect(summary).toContain('Resting comfortably. No concerns.');
    expect(summary).toContain('Quiet. Declined breakfast.');
  });

  it('withholds the distinction until the impressions are reviewed', () => {
    expect(summarize(new QuietPatient(), 0)).toContain('sleeping through meals');
    const model = new QuietPatient();
    model.apply('review-the-charted-impression', 0);
    expect(summarize(model, 1)).toContain('none is a screening result');
  });

  it('states the subtype prevalence and the screening sensitivities', () => {
    const summary = summarize(new QuietPatient(), 0);
    expect(summary).toContain('most frequently missed');
    expect(summary).toContain('4AT reached 76 percent sensitivity and the CAM 40 percent');
    expect(summary).toContain('Impaired arousal is itself scoreable');
  });

  it('announces the repeated handover only while nothing is screened', () => {
    const model = new QuietPatient();
    model.advance(HANDOVER + 10);
    expect(summarize(model, HANDOVER + 10)).toContain('about to read exactly like the first three');
    const screened = new QuietPatient();
    screened.apply('screen-for-arousal', 0);
    screened.advance(HANDOVER + 10);
    expect(summarize(screened, HANDOVER + 10)).not.toContain('about to read exactly like the first three');
  });

  it('does not announce a review the learner has not looked at', () => {
    const model = new QuietPatient();
    model.apply('screen-for-arousal', 0);
    model.apply('escalate-on-the-positive-screen', 1);
    model.advance(REVIEW + 20);
    expect(summarize(model, REVIEW + 20)).not.toContain('no screening result of any kind');
    model.apply('reassess', REVIEW + 21);
    expect(summarize(model, REVIEW + 22)).toContain('no screening result of any kind');
  });

  it('marks starting observations as historical and names no antipsychotic', () => {
    const summary = summarize(new QuietPatient(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current alertness: rousable, slow to respond');
    const lowered = summary.toLowerCase();
    for (const term of ['haloperidol', 'olanzapine']) expect(lowered).not.toContain(term);
  });
});
