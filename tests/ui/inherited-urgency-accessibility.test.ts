import { describe, expect, it } from 'vitest';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { InheritedUrgency } from '../../src/modules/oncology/inherited-urgency';
import { INHERITED_URGENCY_OFFER_TICKS as OFFER, INHERITED_URGENCY_TEAM_TICKS as TEAM } from '../../src/modules/oncology/inherited-urgency';

const common = {
  alarms: [], infusions: [],
  ventilator: { mode: 'manual', tidalVolumeMl: 520, respiratoryRateBpm: 18, fio2: 0.21, delivering: false },
  invalid: new Set(['etco2MmHg', 'fio2', 'depthIndex']),
};
const summarize = (model: InheritedUrgency, tick: number) => stateSummary(
  { systolicMmHg: 128, diastolicMmHg: 76, etco2MmHg: 38, fio2: 0.21 } as never,
  { ...common, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, crystalloidTotalMl: 0 },
    inheritedUrgency: model.snapshot(tick) },
);

describe('Superior vena caval obstruction screen-reader summary', () => {
  it('announces the grading findings rather than the swelling alone', () => {
    const summary = summarize(new InheritedUrgency(), 0);
    expect(summary).toContain('filled neck veins and chest-wall collaterals');
    expect(summary).toContain('are not present');
    expect(summary).toContain('no stridor, fully alert, blood pressure unchanged');
  });

  it('announces the offer as an offer and not as a deterioration', () => {
    const model = new InheritedUrgency();
    model.advance(OFFER + 10);
    const summary = summarize(model, OFFER + 10);
    expect(summary).toContain('A treatment slot has been offered for tonight');
    expect(summary).toContain('an offer, not a deterioration');
  });

  it('does not announce a team reply the learner has not looked at', () => {
    const model = new InheritedUrgency();
    model.apply('secure-the-diagnostic-pathway', 0);
    model.advance(TEAM + 10);
    expect(summarize(model, TEAM + 10)).not.toContain('Acute oncology has accepted him');
    model.apply('reassess', TEAM + 11);
    expect(summarize(model, TEAM + 12)).toContain('Acute oncology has accepted him');
  });

  it('reads the proportion in both directions and names no agent', () => {
    const summary = summarize(new InheritedUrgency(), 0);
    expect(summary).toContain('indication for emergent intervention');
    expect(summary).toContain('not a reason to stop looking');
    expect(summary).toContain('These remain historical starting observations');
    const lowered = summary.toLowerCase();
    for (const agent of ['dexamethasone', 'prednisolone', 'furosemide', 'heparin']) {
      expect(lowered, agent).not.toContain(agent);
    }
  });
});
