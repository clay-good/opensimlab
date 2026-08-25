import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING as SCENARIO } from '../../src/modules/critical-care/scenarios/endotracheal-tube-migration-after-repositioning';

const ACTIONS = ['recognize-post-repositioning-ventilation-change',
  'bridge-post-repositioning-oxygenation', 'integrate-tube-depth-and-bilateral-ventilation',
  'record-experienced-tube-correction-intent', 'reassess-tube-position-and-gas-exchange'];

describe('critical-care endotracheal-tube migration after repositioning', () => {
  it('validates movement, capnography, alternatives, and physical-skill boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('The diagnosis is not announced');
    expect(narrative).toContain('Exact depth is a case fact, not a recommendation');
    expect(narrative).toContain('does not move a tube');
    const ordinary = new AnesthesiaEngine({ scenario: ROUTINE_INDUCTION,
      seed: 134, practiceRegion: 'US' }).step();
    expect(ordinary.equipment.trachealTubePosition).toBeUndefined();
  });

  it('orders recognition, support, position review, correction intent, and proof', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 133, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 104, meanArterialMmHg: 75,
      respiratoryRateBpm: 18, spo2Percent: 89, etco2MmHg: 45, coreTemperatureC: 37.6 });
    expect(onset.equipment.trachealTubePosition).toMatchObject({ depthCm: 25,
      position: 'right-mainstem', leftVentilation: 'markedly-reduced', rightVentilation: 'present',
      exhaledTidalVolumeMl: 310, peakPressureCmH2O: 36, continuousCapnography: true });
    for (const action of ACTIONS) subject.apply({ tick: subject.tick,
      type: 'endotracheal-tube-migration-response', payload: { action } });
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 94, meanArterialMmHg: 77,
      respiratoryRateBpm: 18, spo2Percent: 96, etco2MmHg: 39, coreTemperatureC: 37.6 });
    expect(completed.equipment.trachealTubePosition).toMatchObject({ depthCm: 22,
      position: 'tracheal', leftVentilation: 'present', rightVentilation: 'present',
      exhaledTidalVolumeMl: 410, peakPressureCmH2O: 27, continuousCapnography: true });
    expect(completed.equipment.resuscitation.endotrachealTubeMigrationAssessment).toMatchObject({
      recognizedAtTick: expect.any(Number), supportedAtTick: expect.any(Number),
      positionReviewedAtTick: expect.any(Number), correctionAtTick: expect.any(Number),
      reassessedAtTick: expect.any(Number) });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature correction, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 135, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'endotracheal-tube-migration-response', payload: { action } });
    apply('record-experienced-tube-correction-intent'); apply('withdraw-to-22-cm');
    apply(ACTIONS[0]!); apply(ACTIONS[0]!);
    const refused = subject.step();
    expect(refused.equipment.resuscitation.endotrachealTubeMigrationAssessment).toMatchObject({
      recognizedAtTick: expect.any(Number), supportedAtTick: null,
      positionReviewedAtTick: null, correctionAtTick: null, reassessedAtTick: null });
    expect(refused.events.some((e) => e.eventId.startsWith('tube-migration-recognition-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('tube-migration-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('tube-migration-recognition-refused-'))).toBe(true);
  });
});
