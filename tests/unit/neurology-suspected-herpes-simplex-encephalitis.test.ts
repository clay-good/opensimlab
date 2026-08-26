import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SUSPECTED_HERPES_SIMPLEX_ENCEPHALITIS as SCENARIO } from '../../src/modules/neurology/scenarios/suspected-herpes-simplex-encephalitis';
import { ACUTE_BACTERIAL_MENINGITIS_FIRST_HOUR } from '../../src/modules/neurology/scenarios/acute-bacterial-meningitis-first-hour';

const ACTIONS = [
  'reconcile-neurology-encephalitis-clock-cognition-language-focal-seizure-and-whole-patient',
  'activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership',
  'activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay',
  'review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary',
  'review-neurology-encephalitis-strict-later-early-negative-hsv-pcr-and-clinical-trajectory',
  'handoff-neurology-encephalitis-repeat-testing-antiviral-seizure-autoimmune-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 1831) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) =>
  subject.apply({ tick: subject.tick, type: 'suspected-herpes-simplex-encephalitis-response',
    payload: { action: action as never, ...extras } as never });

describe('Neurology suspected herpes simplex encephalitis engine contract', () => {
  it('validates the exact fixture and reveals only the supplied later trajectory', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual([
      'suspected-herpes-simplex-encephalitis-reassessment',
      'suspected-herpes-simplex-encephalitis-reassessment',
      'suspected-herpes-simplex-encephalitis-reassessment-boundary',
    ]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 110, respiratoryRateBpm: 20,
      systolicMmHg: 126, diastolicMmHg: 74, meanArterialMmHg: 91,
      spo2Percent: 98, coreTemperatureC: 38.8 });
    expect(frame.equipment.resuscitation.neurologyEncephalitisAssessment).toMatchObject({
      trajectoryAtTick: null, ownershipAtTick: null, treatmentAtTick: null,
      diagnosticsAtTick: null, laterAtTick: null, handoffAtTick: null,
      encephaliticSyndromeAuthored: true, qualifiedOwnershipActive: false,
      qualifiedEarlyAntiviralPathwayActive: false, earlyNegativeHsvPcrAuthored: false,
    });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 102, respiratoryRateBpm: 19,
      systolicMmHg: 124, diastolicMmHg: 72, meanArterialMmHg: 89,
      spo2Percent: 98, coreTemperatureC: 38.5 });
    expect(frame.equipment.resuscitation.neurologyEncephalitisAssessment).toMatchObject({
      qualifiedOwnershipActive: true, qualifiedEarlyAntiviralPathwayActive: true,
      qualifiedDiagnosticsReviewed: true, earlyNegativeHsvPcrAuthored: true,
      patientHistoryTakenByLearner: false, patientExaminedByLearner: false,
      csfAcquiredByLearner: false, imagingInterpretedByLearner: false,
      eegInterpretedByLearner: false, pathogenIdentified: false,
      drugSelectedByLearner: false, medicationDeliveredByLearner: false,
      treatmentEffectProven: false, durableNeurologicStabilityProven: false,
      outcomePredicted: false,
    });
  });

  it('enforces strict order and time while refusing treatment, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 1832); const control = make(SCENARIO, 1832);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 1833); subject.step();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]);
    apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neurologyEncephalitisAssessment)
      .toMatchObject({ trajectoryAtTick: 1, ownershipAtTick: 1, treatmentAtTick: 1,
        diagnosticsAtTick: 1, laterAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 1834); const control = make(SCENARIO, 1834);
    hostile.step(); control.step();
    for (const action of ['give-acyclovir', 'perform-lp', 'interpret-mri', '__proto__'])
      apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' });
    for (const [type, payload] of [['acute-bacterial-meningitis-first-hour-response', { action: 'give-antibiotics' }],
      ['bolus', { drugId: 'acyclovir', amount: 10, unit: 'mg/kg' }],
      ['airway-device', { deviceId: 'ett' }], ['status-epilepticus-response', { action: 'give-benzodiazepine' }]] as const)
      hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state);
    expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(ACUTE_BACTERIAL_MENINGITIS_FIRST_HOUR, 1835);
    const adjacentControl = make(ACUTE_BACTERIAL_MENINGITIS_FIRST_HOUR, 1835);
    adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]);
    expect(adjacent.step().equipment.resuscitation)
      .toEqual(adjacentControl.step().equipment.resuscitation);
  });
});
