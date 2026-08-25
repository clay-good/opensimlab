import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { VENTILATOR_CIRCUIT_DISCONNECTION as SCENARIO } from '../../src/modules/critical-care/scenarios/ventilator-circuit-disconnection';

describe('critical-care ventilator circuit disconnection', () => {
  it('validates delivered-versus-commanded and device-generalization boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('exhaled tidal volume and minute ventilation are 0');
    expect(narrative).toContain('not transferable across devices or patients');
    expect(narrative).toContain('not simulated');
  });

  it('orders recognition, bridge support, inspection, restoration, and proof', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 126, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 108, meanArterialMmHg: 76,
      respiratoryRateBpm: 20, spo2Percent: 88, etco2MmHg: 0, coreTemperatureC: 38 });
    expect(onset.equipment.ventilator).toMatchObject({ delivering: false, tidalVolumeMl: 420,
      respiratoryRateBpm: 20, fio2: 0.45 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'ventilator-circuit-disconnection-response', payload: { action } });
    for (const action of ['recognize-ventilator-circuit-disconnection',
      'bridge-ventilator-circuit-disconnection', 'inspect-ventilator-circuit-disconnection',
      'restore-ventilator-circuit-support', 'reassess-ventilator-circuit-response']) apply(action);
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 98, meanArterialMmHg: 77,
      respiratoryRateBpm: 20, spo2Percent: 94, etco2MmHg: 36, coreTemperatureC: 38 });
    expect(completed.equipment.resuscitation.ventilatorCircuitDisconnectionAssessment).toMatchObject({
      recognizedAtTick: expect.any(Number), bridgedAtTick: expect.any(Number),
      inspectedAtTick: expect.any(Number), restoredAtTick: expect.any(Number),
      reassessedAtTick: expect.any(Number) });
    expect(completed.events.find((e) => /^ventilator-disconnection-reassessed-\d+$/.test(e.eventId))?.data)
      .toMatchObject({ deliveredVentilationRestored: true, physicalReconnectionPerformed: false,
        outcomeProven: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature restoration, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 127, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'ventilator-circuit-disconnection-response', payload: { action } });
    apply('restore-ventilator-circuit-support'); apply('silence-alarm');
    apply('recognize-ventilator-circuit-disconnection');
    apply('recognize-ventilator-circuit-disconnection');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.ventilatorCircuitDisconnectionAssessment).toMatchObject({
      recognizedAtTick: expect.any(Number), bridgedAtTick: null, inspectedAtTick: null,
      restoredAtTick: null, reassessedAtTick: null });
    expect(refused.events.some((e) => e.eventId.startsWith('ventilator-disconnection-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('ventilator-disconnection-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('ventilator-disconnection-recognition-refused-'))).toBe(true);
  });
});
