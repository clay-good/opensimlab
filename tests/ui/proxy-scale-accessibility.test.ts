import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { ProxyScale, PROXY_SCALE_FAMILY_TICKS as FAMILY,
  PROXY_SCALE_REVIEW_TICKS as REVIEW } from '../../src/modules/medical-surgical-nursing/proxy-scale';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 18, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: ProxyScale, tick: number) => stateSummary(
  { systolicMmHg: 132, diastolicMmHg: 76, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    proxyScale: model.snapshot(tick) },
);

describe('Proxy pain scale screen-reader summary', () => {
  it('never announces the total without what it counts', () => {
    const summary = summarize(new ProxyScale(), 0);
    expect(summary).toContain('Behavioural total 4, the sum of 5 observed items');
    expect(summary).toContain('Self-report unavailable');
  });

  it('withholds the limits until they are stated', () => {
    expect(summarize(new ProxyScale(), 0)).toContain('reference standard for pain is self-report');
    const model = new ProxyScale();
    model.apply('attempt-self-report', 0);
    model.apply('record-the-observed-behaviours', 1);
    model.apply('record-what-the-score-is-not', 2);
    expect(summarize(model, 3)).toContain('no validated conversion to one');
  });

  it('announces the hierarchy with physiological signs at its bottom', () => {
    const summary = summarize(new ProxyScale(), 0);
    expect(summary).toContain('attempt self-report; consider whether a cause of pain is present');
    expect(summary).toContain('Pulse and blood pressure sit at the bottom as unreliable indicators');
  });

  it('says there is nobody to ask until the daughter arrives', () => {
    expect(summarize(new ProxyScale(), 0)).toContain('nobody present who knows his baseline');
    const model = new ProxyScale();
    model.advance(FAMILY + 10);
    expect(summarize(model, FAMILY + 10)).toContain('cared for him at home for four years');
  });

  it('does not announce a review the learner has not looked at', () => {
    const model = new ProxyScale();
    model.apply('record-analgesic-intent', 0);
    model.advance(REVIEW + 20);
    expect(summarize(model, REVIEW + 20)).not.toContain('further evidence rather than confirmation');
    model.apply('reassess', REVIEW + 21);
    expect(summarize(model, REVIEW + 22)).toContain('further evidence rather than confirmation');
  });

  it('marks starting observations as historical and names no analgesic', () => {
    const summary = summarize(new ProxyScale(), 0);
    expect(summary).toContain('These remain historical starting observations.');
    expect(summary).toContain('Current alertness: awake, not speaking');
    const lowered = summary.toLowerCase();
    for (const term of ['morphine', 'oxycodone']) expect(lowered).not.toContain(term);
  });
});
