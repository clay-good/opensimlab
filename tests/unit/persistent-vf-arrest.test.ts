import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { PERSISTENT_VF_ARREST as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/persistent-vf-arrest';
import type { LearnerAction } from '@platform/kernel/protocol';

function act(subject: AnesthesiaEngine, action: Omit<LearnerAction, 'tick'>) {
  subject.apply({ tick: subject.tick, ...action });
  return subject.step();
}

describe('emergency persistent VF arrest', () => {
  it('validates and starts as pulseless VF immediately', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 59, practiceRegion: 'US' });
    const result = subject.step();
    expect(result.equipment).toMatchObject({ rhythmId: 'ventricular-fibrillation',
      resuscitation: { cardiacArrestActive: true, chestCompressionsActive: false } });
    expect(result.state).toMatchObject({ cardiacOutputLPerMin: 0, etco2MmHg: 0 });
  });

  it('reuses the guarded third-cycle response and debriefs the accepted sequence', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 59, practiceRegion: 'US' });
    const first = subject.step();
    const compressed = act(subject, { type: 'chest-compressions', payload: { active: true } });
    const medicated = act(subject, {
      type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: 1 },
    });
    const rosc = act(subject, { type: 'defibrillation', payload: { energyJ: 200,
      waveform: 'biphasic' } });
    expect(rosc.equipment).toMatchObject({ rhythmId: 'sinus', resuscitation: {
      cardiacArrestActive: false, arrestEpinephrineTotalMg: 1,
      lastDefibrillationEnergyJ: 200, roscAtTick: expect.any(Number) } });
    const history = [{ tick: first.tick, state: first.state, concentrations: [] },
      { tick: rosc.tick, state: rosc.state, concentrations: [] }] as never;
    const log = [...first.events, ...compressed.events, ...medicated.events, ...rosc.events];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], log)
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
  });
});
