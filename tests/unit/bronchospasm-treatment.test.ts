import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { BRONCHOSPASM as SCENARIO } from '@anesthesia/scenarios/bronchospasm';
import { validateScenario } from '@anesthesia/scenarios/schema';

const ONSET = 2400;

function engine() {
  return new AnesthesiaEngine({ scenario: SCENARIO, seed: 20260824, practiceRegion: 'US' });
}

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

describe('bounded bronchospasm treatment', () => {
  it('validates and cites the current Association quick-reference response', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.clinicalReview.sources.join(' '))
      .toContain('3-4 Bronchospasm v3');
  });

  it('accepts exact nebulized salbutamol and reduces modeled obstruction', () => {
    const treated = engine();
    const untreated = engine();
    advance(treated, ONSET + 10);
    advance(untreated, ONSET + 10);
    treated.apply({ tick: treated.tick, type: 'inhaled-bronchodilator', payload: {
      agentId: 'salbutamol', route: 'nebulized', doseMg: 5,
    } });
    const accepted = treated.step();
    const treatedLater = advance(treated, 100);
    const untreatedLater = advance(untreated, 101);
    expect(accepted.equipment.resuscitation.salbutamolTotalMg).toBe(5);
    expect(accepted.events.some((entry) => entry.eventId.startsWith('salbutamol-nebulized-')))
      .toBe(true);
    expect(treatedLater.equipment.airway.bronchospasmSeverity)
      .toBeLessThan(untreatedLater.equipment.airway.bronchospasmSeverity * 0.6);
  });

  it('rejects treatment before obstruction, malformed delivery, and totals above 10 mg', () => {
    const subject = engine();
    subject.step();
    subject.apply({ tick: subject.tick, type: 'inhaled-bronchodilator', payload: {
      agentId: 'salbutamol', route: 'nebulized', doseMg: 5,
    } });
    expect(subject.step().equipment.resuscitation.salbutamolTotalMg).toBe(0);
    advance(subject, ONSET + 10);
    subject.apply({ tick: subject.tick, type: 'inhaled-bronchodilator', payload: {
      agentId: 'salbutamol', route: 'inhaled', doseMg: 5,
    } });
    expect(subject.step().equipment.resuscitation.salbutamolTotalMg).toBe(0);
    for (let dose = 0; dose < 2; dose += 1) {
      subject.apply({ tick: subject.tick, type: 'inhaled-bronchodilator', payload: {
        agentId: 'salbutamol', route: 'nebulized', doseMg: 5,
      } });
      subject.step();
    }
    subject.apply({ tick: subject.tick, type: 'inhaled-bronchodilator', payload: {
      agentId: 'salbutamol', route: 'nebulized', doseMg: 5,
    } });
    const overCap = subject.step();
    expect(overCap.equipment.resuscitation.salbutamolTotalMg).toBe(10);
    expect(overCap.events.some((entry) => entry.eventId.startsWith('bronchodilator-refused-')))
      .toBe(true);
  });

  it('replays the same response deterministically', () => {
    const run = () => {
      const subject = engine();
      advance(subject, ONSET + 10);
      subject.apply({ tick: subject.tick, type: 'call-for-help', payload: { context: 'bronchospasm' } });
      subject.apply({ tick: subject.tick, type: 'inhaled-bronchodilator', payload: {
        agentId: 'salbutamol', route: 'nebulized', doseMg: 5,
      } });
      return advance(subject, 600);
    };
    expect(run()).toEqual(run());
  });
});
