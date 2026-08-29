import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { OxygenTargetScale, OXYGEN_TARGET_COLLEAGUE_TICKS as COLLEAGUE,
  OXYGEN_TARGET_REVIEW_TICKS as REVIEW } from '../../src/modules/medical-surgical-nursing/oxygen-target-scale';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 400, respiratoryRateBpm: 18, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: OxygenTargetScale, tick: number) => stateSummary(
  { systolicMmHg: 128, diastolicMmHg: 74, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    oxygenTargetScale: model.snapshot(tick) },
);

describe('Oxygen-target scoring screen-reader summary', () => {
  it('never announces the score without the scale it was computed on', () => {
    const summary = summarize(new OxygenTargetScale(), 0);
    expect(summary).toContain('scored 3 on scale 1');
    expect(summary).toContain('prescribed target range is 88 to 92% on scale 2');
    expect(summary).not.toMatch(/scored 3\.$/m);
  });

  it('withholds the recalculation until it has been done', () => {
    expect(summarize(new OxygenTargetScale(), 0))
      .toContain('has not been recalculated against the prescribed range');
    const model = new OxygenTargetScale();
    model.apply('check-the-prescription', 0);
    model.apply('check-the-chart', 1);
    model.apply('record-the-scale-mismatch', 2);
    model.apply('rescore-on-the-prescribed-scale', 3);
    const summary = summarize(model, 4);
    expect(summary).toContain('scores 0 on the prescribed scale');
    expect(summary).toContain('The measurement is unchanged');
  });

  it('announces the named harm and the limits of the correction', () => {
    const summary = summarize(new OxygenTargetScale(), 0);
    expect(summary).toContain('may prompt staff to raise the inspired oxygen');
    expect(summary).toContain('not known whether this range is the ideal one');
    expect(summary).toContain('has not been shown to detect deterioration better than the first');
  });

  it('announces the colleague offer once it has happened', () => {
    expect(summarize(new OxygenTargetScale(), 0)).not.toContain('offered to put oxygen on her');
    const model = new OxygenTargetScale();
    model.advance(COLLEAGUE + 10);
    expect(summarize(model, COLLEAGUE + 10)).toContain('offered to put oxygen on her');
  });

  it('does not announce a review the learner has not looked at', () => {
    const model = new OxygenTargetScale();
    model.apply('check-the-prescription', 0);
    model.apply('check-the-chart', 1);
    model.apply('record-the-scale-mismatch', 2);
    model.apply('rescore-on-the-prescribed-scale', 3);
    model.apply('confirm-the-scale-with-the-team', 4);
    model.advance(REVIEW + 20);
    expect(summarize(model, REVIEW + 20)).not.toContain('has confirmed the documented decision');
    model.apply('reassess', REVIEW + 21);
    expect(summarize(model, REVIEW + 22)).toContain('has confirmed the documented decision');
  });

  it('marks starting observations as historical and names no oxygen setting', () => {
    const summary = summarize(new OxygenTargetScale(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current alertness: awake, alert, speaking in full sentences');
    const lowered = summary.toLowerCase();
    for (const term of ['litres per minute', 'venturi', 'nasal cannula']) expect(lowered).not.toContain(term);
  });
});
