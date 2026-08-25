import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { PEA_ARREST as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/pea-arrest';

describe('emergency PEA arrest', () => {
  it('validates, remains nonshockable, and scores the accepted first-cycle response', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 61, practiceRegion: 'US' });
    const first = subject.step();
    expect(first.equipment).toMatchObject({ rhythmId: 'pea', resuscitation: {
      cardiacArrestActive: true } });
    subject.apply({ tick: subject.tick, type: 'chest-compressions', payload: { active: true } });
    const compressed = subject.step();
    subject.apply({ tick: subject.tick, type: 'cardiac-arrest-epinephrine', payload: {
      route: 'iv', doseMg: 1 } });
    const medicated = subject.step();
    expect(medicated.equipment).toMatchObject({ rhythmId: 'pea', resuscitation: {
      chestCompressionsActive: true, arrestEpinephrineTotalMg: 1, roscAtTick: null } });
    const history = [{ tick: first.tick, state: first.state, concentrations: [] },
      { tick: medicated.tick, state: medicated.state, concentrations: [] }] as never;
    const log = [...first.events, ...compressed.events, ...medicated.events];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], log)
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met']);
  });
});
