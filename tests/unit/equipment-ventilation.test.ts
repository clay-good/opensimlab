import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import {
  boundedDeliveredFraction, followDeliveredVentilation, trachealTubeDeliveredFraction,
} from '@anesthesia/physiology/equipment-ventilation';
import type { Scenario } from '@anesthesia/scenarios/types';
import { ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING } from '../../src/modules/critical-care/scenarios/endotracheal-tube-migration-after-repositioning';
import { ACUTE_TRACHEOSTOMY_OBSTRUCTION } from '../../src/modules/respiratory-medicine/scenarios/acute-tracheostomy-obstruction';
import { NEONATAL_TENSION_PNEUMOTHORAX } from '../../src/modules/neonatology/scenarios/neonatal-tension-pneumothorax';

const COMPROMISED = { spo2Percent: 80, etco2MmHg: 0 };
const RESTORED = { spo2Percent: 96, etco2MmHg: 40 };

describe('equipment state drives delivered ventilation', () => {
  it('lands exactly on each authored anchor and moves monotonically between them', () => {
    expect(followDeliveredVentilation(COMPROMISED, RESTORED, 0)).toEqual(COMPROMISED);
    expect(followDeliveredVentilation(COMPROMISED, RESTORED, 1)).toEqual(RESTORED);
    let previous = followDeliveredVentilation(COMPROMISED, RESTORED, 0);
    for (let step = 1; step <= 20; step += 1) {
      const next = followDeliveredVentilation(COMPROMISED, RESTORED, step / 20);
      expect(next.spo2Percent).toBeGreaterThan(previous.spo2Percent);
      expect(next.etco2MmHg).toBeGreaterThan(previous.etco2MmHg);
      previous = next;
    }
  });

  it.each([[Number.NaN, 0], [Number.POSITIVE_INFINITY, 0], [Number.NEGATIVE_INFINITY, 0], [-3, 0], [7, 1]])(
    'bounds a hostile delivered fraction %s to %s inside the authored anchors', (hostile, bounded) => {
      expect(boundedDeliveredFraction(hostile)).toBe(bounded);
      const result = followDeliveredVentilation(COMPROMISED, RESTORED, hostile);
      expect(result.spo2Percent).toBeGreaterThanOrEqual(COMPROMISED.spo2Percent);
      expect(result.spo2Percent).toBeLessThanOrEqual(RESTORED.spo2Percent);
    });

  it('reads tube position from depth against the case threshold, failing toward the mainstem', () => {
    expect(trachealTubeDeliveredFraction(22, 24)).toBe(1);
    expect(trachealTubeDeliveredFraction(25, 24)).toBe(0);
    expect(trachealTubeDeliveredFraction(24, 24)).toBe(0);
    expect(trachealTubeDeliveredFraction(Number.NaN, 24)).toBe(0);
  });
});

/**
 * Assessment evidence precedes treatment: recognition, help, and review steps
 * must leave the monitor exactly where it was. Only the step that changes the
 * equipment state may move it, and then the panel and the monitor move together.
 */
const LESSONS: readonly {
  readonly scenario: Scenario;
  readonly type: string;
  readonly restoringIndex: number;
  readonly seed: number;
}[] = [
  { scenario: ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING,
    type: 'endotracheal-tube-migration-response', restoringIndex: 4, seed: 133 },
  { scenario: ACUTE_TRACHEOSTOMY_OBSTRUCTION,
    type: 'acute-tracheostomy-obstruction-response', restoringIndex: 3, seed: 811 },
  { scenario: NEONATAL_TENSION_PNEUMOTHORAX,
    type: 'neonatal-tension-pneumothorax-response', restoringIndex: 4, seed: 4621 },
];

describe.each(LESSONS)('$scenario.metadata.id monitor follows its equipment state', (
  { scenario, type, restoringIndex, seed },
) => {
  it('holds the monitor until the equipment changes, then moves it once', () => {
    const subject = new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
    const onset = subject.step();
    const vitals = (frame: typeof onset) => ({
      heartRateBpm: frame.state.heartRateBpm, spo2Percent: frame.state.spo2Percent,
      meanArterialMmHg: frame.state.meanArterialMmHg,
    });
    const actions = scenario.metadata.objectives.map(({ id }) => id).slice(0, restoringIndex + 1);
    let frame = onset;
    for (const [index, action] of actions.entries()) {
      subject.apply({ tick: subject.tick, type, payload: { action } });
      frame = subject.step();
      if (index < restoringIndex) expect(vitals(frame)).toEqual(vitals(onset));
    }
    expect(frame.state.spo2Percent).toBeGreaterThan(onset.state.spo2Percent);
    const settled = subject.step();
    expect(vitals(settled)).toEqual(vitals(frame));
  });
});

describe('the tube panel and the monitor cannot disagree', () => {
  it('reports right-mainstem mechanics only while the monitor shows the mainstem state', () => {
    const subject = new AnesthesiaEngine({ scenario: ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING,
      seed: 133, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.equipment.trachealTubePosition).toMatchObject({ depthCm: 25,
      position: 'right-mainstem', exhaledTidalVolumeMl: 310, plateauPressureCmH2O: 22 });
    expect(onset.state.spo2Percent).toBe(89);
    for (const action of ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING.metadata.objectives
      .map(({ id }) => id)) {
      subject.apply({ tick: subject.tick, type: 'endotracheal-tube-migration-response',
        payload: { action } });
    }
    const restored = subject.step();
    expect(restored.equipment.trachealTubePosition).toMatchObject({ depthCm: 22,
      position: 'tracheal', exhaledTidalVolumeMl: 410, plateauPressureCmH2O: 21 });
    expect(restored.state.spo2Percent).toBe(96);
  });
});
