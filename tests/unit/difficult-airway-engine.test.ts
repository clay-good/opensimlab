import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, SGA_INSERTION_SECONDS, type Scenario } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import {
  DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE,
} from '@anesthesia/scenarios/difficult-airway-supraglottic-rescue';
import {
  RESPIRATORY_PROFILES, VirtualPatient, type PatientProfile, type ScenarioDrive,
  type VentilatorSettings,
} from '@anesthesia/physiology';
import { createRng } from '@platform/kernel/rng';
import type { LearnerAction } from '@platform/kernel/protocol';
import { replay } from '@anesthesia/debrief/replay-engine';

const COURSE_EVENT = {
  id: 'configured-airway-course',
  type: 'difficult-airway' as const,
  target: 'failed-intubation-with-marginal-mask',
  value: 0.35,
  atTick: 0,
};

function scenario(event = COURSE_EVENT): Scenario {
  return { ...ROUTINE_INDUCTION, timeline: [event] };
}

function engine(seed = 1, event = COURSE_EVENT) {
  return new AnesthesiaEngine({ scenario: scenario(event), practiceRegion: 'US', seed });
}

function finishAttempt(subject: AnesthesiaEngine) {
  let result = subject.step();
  while (result.equipment.airway.attemptInProgress) result = subject.step();
  return result;
}

describe('Requirement: configured difficult airway is deterministic but preserves sampling', () => {
  it('forces tracheal failure across techniques and seeds while retaining grade and duration', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const configured = engine(seed);
      const ordinary = new AnesthesiaEngine({
        scenario: { ...ROUTINE_INDUCTION, timeline: [] }, practiceRegion: 'US', seed,
      });
      configured.step();
      ordinary.step();
      const technique = seed % 2 === 0 ? 'video' : 'direct';
      configured.apply({ tick: configured.tick, type: 'laryngoscopy', payload: { technique } });
      ordinary.apply({ tick: ordinary.tick, type: 'laryngoscopy', payload: { technique } });
      const configuredStart = configured.step();
      const ordinaryStart = ordinary.step();
      expect(configuredStart.equipment.airway.attemptSecondsRemaining)
        .toBe(ordinaryStart.equipment.airway.attemptSecondsRemaining);
      const configuredEnd = finishAttempt(configured);
      const ordinaryEnd = finishAttempt(ordinary);
      expect(configuredEnd.equipment.airway.lastGrade).toBe(ordinaryEnd.equipment.airway.lastGrade);
      expect(configuredEnd.equipment.airway.intubated).toBe(false);
      expect(configuredEnd.events.find((entry) => entry.eventId === 'laryngoscopy-1')?.data)
        .toMatchObject({ intubated: false, teachingModel: true });
    }
  });

  it('refuses malformed, nonfinite, and out-of-range course events without enabling rescue SGA', () => {
    const hostile = [
      { ...COURSE_EVENT, target: 'mystery' },
      { ...COURSE_EVENT, value: 0 },
      { ...COURSE_EVENT, value: 1.01 },
      { ...COURSE_EVENT, value: Number.NaN },
    ];
    for (const event of hostile) {
      const subject = engine(40, event);
      const first = subject.step();
      expect(first.events.some((entry) => entry.eventId.startsWith('incomplete-event-'))).toBe(true);
      subject.apply({
        tick: subject.tick, type: 'airway-device', payload: { device: 'supraglottic-airway' },
      });
      const refused = subject.step();
      expect(refused.events.some((entry) => entry.eventId.startsWith('sga-insertion-refused-')))
        .toBe(true);
      expect(Object.values(refused.state).every(Number.isFinite)).toBe(true);
    }
  });

  it('does not reconfigure the course after a rescue airway is already placed', () => {
    const withLateDuplicate: Scenario = {
      ...ROUTINE_INDUCTION,
      timeline: [COURSE_EVENT, { ...COURSE_EVENT, id: 'late-course', atTick: 200 }],
    };
    const subject = new AnesthesiaEngine({
      scenario: withLateDuplicate, practiceRegion: 'US', seed: 41,
    });
    subject.step();
    subject.apply({
      tick: subject.tick, type: 'airway-device', payload: { device: 'supraglottic-airway' },
    });
    let result = subject.step();
    let refused = false;
    while (result.tick <= 200) {
      refused ||= result.events.some(
        (entry) => entry.eventId.startsWith('inapplicable-event-late-course-'),
      );
      result = subject.step();
    }
    expect(result.equipment.airway.device).toBe('supraglottic-airway');
    expect(refused).toBe(true);
  });
});

describe('Requirement: help and supraglottic rescue are bounded accepted actions', () => {
  it('records one accepted airway-help request and refuses bad or repeated requests', () => {
    const subject = engine();
    subject.step();
    subject.apply({ tick: subject.tick, type: 'call-for-help', payload: { context: 'airway' } });
    const accepted = subject.step();
    expect(accepted.equipment.airway.helpRequestedAtTick).toBe(1);
    expect(accepted.events.some((entry) => entry.eventId === 'airway-help-requested-1')).toBe(true);

    subject.apply({ tick: subject.tick, type: 'call-for-help', payload: { context: 'airway' } });
    subject.apply({ tick: subject.tick, type: 'call-for-help', payload: { context: 'banana' } });
    const refused = subject.step();
    expect(refused.equipment.airway.helpRequestedAtTick).toBe(1);
    expect(refused.events.filter((entry) => entry.eventId.startsWith('airway-help-refused-')))
      .toHaveLength(2);
  });

  it('places an SGA after exactly 15 seconds without silently starting ventilation', () => {
    const subject = engine();
    subject.step();
    subject.apply({ tick: subject.tick, type: 'ventilator', payload: { delivering: true } });
    subject.apply({
      tick: subject.tick, type: 'airway-device', payload: { device: 'supraglottic-airway' },
    });
    let result = subject.step();
    const startedAt = result.events.find((entry) => entry.eventId.startsWith('sga-insertion-start-'))!.tick;
    expect(result.equipment.airway.device).toBe('facemask');
    expect(result.equipment.airway.supraglotticInsertionSecondsRemaining)
      .toBe(SGA_INSERTION_SECONDS);
    expect(result.equipment.ventilator.delivering).toBe(false);
    while (result.equipment.airway.device === 'facemask') result = subject.step();
    expect(result.equipment.airway.device).toBe('supraglottic-airway');
    expect(result.equipment.airway.supraglotticInsertionSecondsRemaining).toBe(0);
    expect(result.equipment.ventilator.delivering).toBe(false);
    const completed = result.events.find((entry) => entry.eventId.startsWith('sga-insertion-complete-'));
    expect(completed).toBeDefined();
    expect(completed!.tick - startedAt).toBe(SGA_INSERTION_SECONDS * 10);
  });

  it('prevents overlapping or contradictory airway procedures', () => {
    const subject = engine();
    subject.step();
    subject.apply({ tick: subject.tick, type: 'laryngoscopy', payload: { technique: 'direct' } });
    subject.apply({
      tick: subject.tick, type: 'airway-device', payload: { device: 'supraglottic-airway' },
    });
    const overlap = subject.step();
    expect(overlap.events.some((entry) => entry.eventId.startsWith('sga-insertion-refused-')))
      .toBe(true);
    finishAttempt(subject);
    subject.apply({
      tick: subject.tick, type: 'airway-device', payload: { device: 'supraglottic-airway' },
    });
    let placed = subject.step();
    while (placed.equipment.airway.supraglotticInsertionSecondsRemaining > 0) placed = subject.step();
    subject.apply({ tick: subject.tick, type: 'laryngoscopy', payload: { technique: 'video' } });
    subject.apply({
      tick: subject.tick, type: 'airway-device', payload: { device: 'supraglottic-airway' },
    });
    const refused = subject.step();
    expect(refused.events.some((entry) => entry.eventId.startsWith('laryngoscopy-refused-')))
      .toBe(true);
    expect(refused.events.some((entry) => entry.eventId.startsWith('sga-insertion-refused-')))
      .toBe(true);
  });
});

describe('Requirement: marginal mask and SGA have real gas-delivery effects', () => {
  const profile: PatientProfile = {
    hemodynamics: {
      baselineHeartRateBpm: 72, baselineMapMmHg: 90, baselineStrokeVolumeMl: 70,
      arterialStiffness: 1, fixedStrokeVolume: false, baroreflexGain: 1,
      bloodVolumeMl: 5_000, hemoglobinGPerDl: 14,
    },
    respiratory: RESPIRATORY_PROFILES.healthy,
    airway: { difficulty: 0, difficultMaskVentilation: false },
    coreTemperatureC: 36.6, ageYears: 35,
  };
  const ventilator: VentilatorSettings = {
    mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12,
    fio2: 1, freshGasFlowLPerMin: 1, peep: 0, delivering: true, sevofluranePercent: 0,
  };
  const quiet: ScenarioDrive = {
    surgicalStimulus: 0, obstructionFraction: 0, bloodLossMl: 0, crystalloidMl: 0,
  };
  const drugs = { propofolCe: 0, remifentanilCe: 0, vasopressorEffect: 0 };

  it('reduces actual delivered tidal volume with an honest signed attribution', () => {
    const patient = new VirtualPatient(profile, createRng(80));
    const marginal = patient.tick(drugs, ventilator, { ...quiet, airwayDeliveryFraction: 0.35 });
    expect(marginal.state.tidalVolumeMl).toBe(175);
    expect(marginal.attribution.find((entry) => entry.variable === 'tidalVolumeMl')?.terms)
      .toContainEqual(expect.objectContaining({
        termId: 'marginal-mask-ventilation', contribution: -325, teachingModel: true,
      }));
    const restored = patient.tick(drugs, ventilator, { ...quiet, airwayDeliveryFraction: 1 });
    expect(restored.state.tidalVolumeMl).toBe(500);
  });

  it('makes sustained marginal ventilation measurably worse and full delivery reverses it', () => {
    const patient = new VirtualPatient(profile, createRng(82), 1);
    let marginal = patient.tick(drugs, ventilator, { ...quiet, airwayDeliveryFraction: 0.35 });
    for (let tick = 1; tick < 3 * 60 * 10; tick += 1) {
      marginal = patient.tick(drugs, ventilator, { ...quiet, airwayDeliveryFraction: 0.35 });
    }
    const marginalPaco2 = marginal.state.paco2MmHg;
    const marginalEndTidalO2 = marginal.state.endTidalO2Fraction;
    let rescued = patient.tick(drugs, ventilator, { ...quiet, airwayDeliveryFraction: 1 });
    for (let tick = 1; tick < 3 * 60 * 10; tick += 1) {
      rescued = patient.tick(drugs, ventilator, { ...quiet, airwayDeliveryFraction: 1 });
    }
    expect(marginalPaco2).toBeGreaterThan(45);
    expect(rescued.state.paco2MmHg).toBeLessThan(marginalPaco2 - 1);
    expect(rescued.state.endTidalO2Fraction).toBeGreaterThan(marginalEndTidalO2);
    expect(rescued.state.etco2MmHg).toBeGreaterThan(20);
  });

  it('restores commanded tidal volume only after SGA placement and explicit delivery', () => {
    const subject = engine(81);
    subject.step();
    subject.apply({ tick: subject.tick, type: 'laryngoscopy', payload: { technique: 'direct' } });
    subject.step();
    finishAttempt(subject);
    subject.apply({
      tick: subject.tick, type: 'ventilator',
      payload: { delivering: true, mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12, fio2: 1 },
    });
    const marginal = subject.step();
    expect(marginal.state.tidalVolumeMl).toBe(175);
    subject.apply({
      tick: subject.tick, type: 'airway-device', payload: { device: 'supraglottic-airway' },
    });
    let placed = subject.step();
    while (placed.equipment.airway.supraglotticInsertionSecondsRemaining > 0) placed = subject.step();
    expect(placed.equipment.airway.device).toBe('supraglottic-airway');
    expect(placed.equipment.ventilator.delivering).toBe(false);
    subject.apply({ tick: subject.tick, type: 'ventilator', payload: { delivering: true } });
    placed = subject.step();
    expect(placed.equipment.ventilator.delivering).toBe(true);
    expect(placed.state.tidalVolumeMl).toBe(500);
  });
});

describe('Requirement: difficult-airway rescue replay', () => {
  it('runs the bundled competent rescue and beats repeated-attempt fixation', () => {
    const prepare = () => {
      const subject = new AnesthesiaEngine({
        scenario: DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE, practiceRegion: 'US', seed: 91,
      });
      subject.step();
      subject.apply({
        tick: subject.tick, type: 'ventilator',
        payload: { delivering: true, mode: 'volume-control', tidalVolumeMl: 480, respiratoryRateBpm: 12, fio2: 1 },
      });
      for (let tick = 0; tick < 3 * 60 * 10; tick += 1) subject.step();
      subject.apply({
        tick: subject.tick, type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' },
      });
      subject.apply({
        tick: subject.tick, type: 'bolus', payload: { drugId: 'rocuronium', amount: 1, unit: 'mg/kg' },
      });
      for (let tick = 0; tick < 90 * 10; tick += 1) subject.step();
      subject.apply({ tick: subject.tick, type: 'laryngoscopy', payload: { technique: 'direct' } });
      subject.step();
      const failed = finishAttempt(subject);
      expect(failed.equipment.airway.intubated).toBe(false);
      return subject;
    };

    const competent = prepare();
    competent.apply({
      tick: competent.tick, type: 'call-for-help', payload: { context: 'airway' },
    });
    competent.apply({
      tick: competent.tick, type: 'airway-device', payload: { device: 'supraglottic-airway' },
    });
    let competentResult = competent.step();
    let competentNadir = competentResult.state.spo2Percent;
    while (competentResult.equipment.airway.device === 'facemask') {
      competentResult = competent.step();
      competentNadir = Math.min(competentNadir, competentResult.state.spo2Percent);
    }
    competent.apply({
      tick: competent.tick, type: 'ventilator',
      payload: { delivering: true, mode: 'volume-control', tidalVolumeMl: 480, respiratoryRateBpm: 12, fio2: 1 },
    });
    for (let tick = 0; tick < 30 * 10; tick += 1) {
      competentResult = competent.step();
      competentNadir = Math.min(competentNadir, competentResult.state.spo2Percent);
    }

    const fixated = prepare();
    fixated.apply({ tick: fixated.tick, type: 'laryngoscopy', payload: { technique: 'direct' } });
    let fixatedResult = fixated.step();
    let fixatedNadir = fixatedResult.state.spo2Percent;
    while (fixatedResult.equipment.airway.attemptInProgress) {
      fixatedResult = fixated.step();
      fixatedNadir = Math.min(fixatedNadir, fixatedResult.state.spo2Percent);
    }
    for (let tick = 0; tick < 30 * 10; tick += 1) {
      fixatedResult = fixated.step();
      fixatedNadir = Math.min(fixatedNadir, fixatedResult.state.spo2Percent);
    }

    expect(competentResult.equipment.airway).toMatchObject({
      device: 'supraglottic-airway', helpRequestedAtTick: expect.any(Number),
    });
    expect(competentResult.state.etco2MmHg).toBeGreaterThanOrEqual(25);
    expect(competentResult.state.etco2MmHg).toBeLessThanOrEqual(55);
    expect(competentNadir).toBeGreaterThanOrEqual(92);
    expect(fixatedResult.equipment.airway.attempts).toBe(2);
    expect(fixatedNadir).toBeLessThan(competentNadir);
  });

  it('replays help, failed intubation, and SGA placement deterministically', () => {
    const actions: LearnerAction[] = [
      { tick: 1, type: 'call-for-help', payload: { context: 'airway' } },
      { tick: 2, type: 'laryngoscopy', payload: { technique: 'direct' } },
      { tick: 500, type: 'airway-device', payload: { device: 'supraglottic-airway' } },
      { tick: 660, type: 'ventilator', payload: { delivering: true, mode: 'volume-control', fio2: 1 } },
    ];
    const options = { scenario: scenario(), practiceRegion: 'US', seed: 90, ticks: 900 };
    expect(replay(actions, options)).toEqual(replay(actions, options));
  });
});
