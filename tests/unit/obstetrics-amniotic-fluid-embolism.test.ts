import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { POSTPARTUM_HEMORRHAGE_UTERINE_ATONY } from '../../src/modules/obstetrics/scenarios/postpartum-hemorrhage-uterine-atony';
import { SUSPECTED_AMNIOTIC_FLUID_EMBOLISM_PATTERN as SCENARIO } from '../../src/modules/obstetrics/scenarios/suspected-amniotic-fluid-embolism-pattern';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 3301) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'suspected-amniotic-fluid-embolism-pattern-response', payload: { action, ...extras } as never });

describe('Obstetrics suspected amniotic fluid embolism contract', () => {
  it('validates, activates help first, and exposes only fixed pulse-present reports', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 132, systolicMmHg: 74, diastolicMmHg: 42, meanArterialMmHg: 53, respiratoryRateBpm: 34, spo2Percent: 78, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.obstetricsAfeAssessment).toMatchObject({ supportAtTick: null, pulsePresentCardiorespiratoryCollapsePrecedingCoagulopathyPatternAuthored: true, qualifiedSupportActive: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action); frame = subject.step();
    expect(frame.equipment.resuscitation.obstetricsAfeAssessment).toMatchObject({ qualifiedSupportActive: true, suspectedAfePatternRecognizedWithoutClosure: true, cardiopulmonaryHemorrhageCoagulationAndDifferentialEvidenceReviewed: true, reassessmentAtTick: null });
    apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 124, systolicMmHg: 86, diastolicMmHg: 50, meanArterialMmHg: 62, respiratoryRateBpm: 28, spo2Percent: 94, coreTemperatureC: 36.7 });
    expect(frame.equipment.resuscitation.obstetricsAfeAssessment).toMatchObject({ fixedLaterPersistentShockRespiratoryCompromiseAndProgressiveCoagulopathyReportReviewed: true, pulseAssessedByLearner: false, patientExaminedByLearner: false, bloodLossMeasuredByLearner: false, uterusOrGenitalTractAssessedByLearner: false, monitoringInterpretedByLearner: false, laboratoryAcquiredByLearner: false, laboratoryInterpretedByLearner: false, dicScoreCalculatedByLearner: false, imagingOrEchoAcquiredByLearner: false, imagingOrEchoInterpretedByLearner: false, diagnosisMadeByLearner: false, alternativeExcludedByLearner: false, oxygenOrVentilationSelectedByLearner: false, airwaySelectedByLearner: false, fluidOrVasoactiveSelectedByLearner: false, bloodOrCoagulationProductSelectedByLearner: false, drugDoseRouteOrTargetSelectedByLearner: false, cprOrDefibrillationPerformedByLearner: false, ecmoSelectedByLearner: false, deliveryOrProcedureSelectedByLearner: false, treatmentDeliveredByLearner: false, cardiacArrestOccurred: false, treatmentEffectProven: false, respiratoryRecoveryProven: false, hemodynamicRecoveryProven: false, bleedingControlProven: false, coagulopathyControlProven: false, maternalOutcomePredicted: false, newbornOutcomePredicted: false, outcomePredicted: false });
    expect(frame.equipment.resuscitation).toMatchObject({ crystalloidTotalMl: 0, epinephrineTotalMicrograms: 0, packedRedBloodCellUnits: 0, freshFrozenPlasmaUnits: 0, chestCompressionsActive: false, arrestEpinephrineTotalMg: 0, defibrillationShockCount: 0 });
  });

  it('requires activation first, accepts the three review lanes in any order, and enforces elapsed reports', () => {
    for (const order of [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]) {
      const subject = make(SCENARIO, 3310 + order.join('').length); subject.step(); apply(subject, ACTIONS[1]);
      expect(subject.step().equipment.resuscitation.obstetricsAfeAssessment?.trajectoryAtTick).toBeNull();
      apply(subject, ACTIONS[0]); for (const index of order) apply(subject, ACTIONS[index]); subject.step(); apply(subject, ACTIONS[4]);
      expect(subject.step().equipment.resuscitation.obstetricsAfeAssessment?.reassessmentAtTick).not.toBeNull();
      apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsAfeAssessment?.handoffAtTick).not.toBeNull();
    }
  });

  it('fails closed for hostile payloads, adjacent actions, missing identity, and neighboring scenarios', () => {
    const hostile = make(SCENARIO, 3320); const control = make(SCENARIO, 3320); hostile.step(); control.step();
    for (const action of [null, 7, {}, [], '__proto__', 'x'.repeat(10_000)]) apply(hostile, action, { patientName: 'Patient Example', phone: '555-0100', notes: 'private note' });
    for (const [type, payload] of [['fluid', { type: 'crystalloid', volumeMl: 2_000 }], ['bolus', { drugId: 'epinephrine', amount: 1, unit: 'mg' }], ['ventilator', { fio2: 1 }], ['airway-maneuver', { maneuver: 'jaw-thrust' }], ['laryngoscopy', {}], ['hemorrhagic-shock-response', { action: 'request-blood' }], ['massive-pulmonary-embolism-response', { action: 'thrombolysis' }], ['emergency-anaphylaxis-response', { action: 'epinephrine' }], ['chest-compressions', { active: true }], ['defibrillation', { energyJ: 200 }]] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|555-0100|private note/);
    const missing = { ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'suspected-amniotic-fluid-embolism-pattern-transition-boundary') }; const missingSubject = make(missing, 3321); missingSubject.step(); apply(missingSubject, ACTIONS[0]); expect(missingSubject.step().equipment.resuscitation.obstetricsAfeAssessment).toBeUndefined();
    const adjacent = make(POSTPARTUM_HEMORRHAGE_UTERINE_ATONY, 3322); const adjacentControl = make(POSTPARTUM_HEMORRHAGE_UTERINE_ATONY, 3322); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});
