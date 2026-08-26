import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ACUTE_BACTERIAL_MENINGITIS_FIRST_HOUR as SCENARIO } from '../../src/modules/neurology/scenarios/acute-bacterial-meningitis-first-hour';
import { GUILLAIN_BARRE_RESPIRATORY_DECLINE } from '../../src/modules/neurology/scenarios/guillain-barre-respiratory-decline';

const ACTIONS = [
  'reconcile-neurology-meningitis-clock-meningeal-infection-neurologic-and-whole-patient',
  'activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership',
  'review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary',
  'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay',
  'review-neurology-meningitis-strict-later-csf-clinical-and-supplied-treatment-trajectory',
  'handoff-neurology-meningitis-organism-treatment-complication-public-health-hearing-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 1826) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) =>
  subject.apply({ tick: subject.tick, type: 'acute-bacterial-meningitis-first-hour-response',
    payload: { action: action as never, ...extras } as never });

describe('Neurology acute bacterial meningitis engine contract', () => {
  it('validates the exact fixture and reveals only the supplied later CSF trajectory', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'acute-bacterial-meningitis-first-hour-reassessment',
      'acute-bacterial-meningitis-first-hour-reassessment',
      'acute-bacterial-meningitis-first-hour-reassessment-boundary',
    ]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 118, respiratoryRateBpm: 22,
      systolicMmHg: 112, diastolicMmHg: 68, meanArterialMmHg: 83,
      spo2Percent: 98, coreTemperatureC: 39.3 });
    expect(frame.equipment.resuscitation.neurologyMeningitisAssessment).toMatchObject({
      trajectoryAtTick: null, ownershipAtTick: null, diagnosticsAtTick: null,
      treatmentAtTick: null, laterAtTick: null, handoffAtTick: null,
      acuteMeningealInfectionPatternAuthored: true, initialAlertNonfocalStateAuthored: true,
      qualifiedTimeCriticalOwnershipActive: false, laterBacterialPatternCsfAuthored: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 106, respiratoryRateBpm: 20,
      systolicMmHg: 116, diastolicMmHg: 72, meanArterialMmHg: 87,
      spo2Percent: 98, coreTemperatureC: 38.8 });
    expect(frame.equipment.resuscitation.neurologyMeningitisAssessment).toMatchObject({
      qualifiedTimeCriticalOwnershipActive: true,
      qualifiedLpWithoutRoutineImagingBoundaryReviewed: true,
      qualifiedEarlyEmpiricPathwayActive: true, laterBacterialPatternCsfAuthored: true,
      qualifiedLpAuthored: true, qualifiedEmpiricTreatmentAuthored: true,
      patientExaminedByLearner: false, csfAcquiredByLearner: false,
      lumbarPuncturePerformedByLearner: false, pathogenIdentified: false,
      drugSelectedByLearner: false, medicationDeliveredByLearner: false,
      treatmentDeliveredByLearner: false, treatmentEffectProven: false,
      durableNeurologicStabilityProven: false, outcomePredicted: false,
    });
  });

  it('enforces strict order and time while refusing treatment, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 1827); const control = make(SCENARIO, 1827);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 1828); subject.step();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]);
    apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyMeningitisAssessment)
      .toMatchObject({ trajectoryAtTick: 1, ownershipAtTick: 1, diagnosticsAtTick: 1,
        treatmentAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 1829); const control = make(SCENARIO, 1829);
    hostile.step(); control.step();
    for (const action of ['give-ceftriaxone', 'give-dexamethasone', 'perform-lp', '__proto__'])
      apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' });
    for (const [type, payload] of [['septic-shock-response', { action: 'give-antibiotics' }],
      ['bolus', { drugId: 'ceftriaxone', amount: 2, unit: 'g' }],
      ['airway-device', { deviceId: 'ett' }], ['fluid', { fluidId: 'crystalloid', volumeMl: 1000 }]] as const)
      hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state);
    expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(GUILLAIN_BARRE_RESPIRATORY_DECLINE, 1830);
    const adjacentControl = make(GUILLAIN_BARRE_RESPIRATORY_DECLINE, 1830);
    adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]);
    expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});
