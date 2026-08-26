import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { MATERNAL_SEPSIS_POSTPARTUM_DETERIORATION as SCENARIO } from '../../src/modules/obstetrics/scenarios/maternal-sepsis-postpartum-deterioration';
import { SEPTIC_SHOCK } from '../../src/modules/emergency-medicine/scenarios/septic-shock';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 2901) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'maternal-sepsis-postpartum-deterioration-response', payload: { action, ...extras } as never });

describe('Obstetrics maternal-sepsis contract', () => {
  it('validates and exposes only the authored strict report', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 132, systolicMmHg: 88, diastolicMmHg: 52, meanArterialMmHg: 64, respiratoryRateBpm: 28, spo2Percent: 96, coreTemperatureC: 39.1 });
    expect(frame.equipment.resuscitation.obstetricsMaternalSepsisAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, postpartumInfectionOrganDysfunctionPatternAuthored: true, maternalSepsisEmergencyRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action); subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 122, systolicMmHg: 94, diastolicMmHg: 58, meanArterialMmHg: 70, respiratoryRateBpm: 24, spo2Percent: 98, coreTemperatureC: 39 });
    expect(frame.equipment.resuscitation.obstetricsMaternalSepsisAssessment).toMatchObject({ maternalSepsisEmergencyRecognized: true, qualifiedSupportActive: true, infectiousNoninfectiousPerfusionOrganAndSourceEvidenceReviewed: true, qualifiedImmediateCareAndSourceControlIntentRecorded: true, patientExaminedByLearner: false, sepsisScoreCalculatedByLearner: false, cultureAcquiredByLearner: false, diagnosisMadeByLearner: false, antimicrobialSelectedByLearner: false, fluidSelectedByLearner: false, vasopressorSelectedByLearner: false, sourceControlSelectedByLearner: false, treatmentDeliveredByLearner: false, treatmentEffectProven: false, organRecoveryProven: false, sourceControlProven: false, maternalOutcomePredicted: false, newbornOutcomePredicted: false, outcomePredicted: false });
  });

  it('enforces order, time, hostile-input refusal, and adjacent-sepsis isolation', () => {
    const subject = make(); subject.step(); apply(subject, ACTIONS[3]); expect(subject.step().equipment.resuscitation.obstetricsMaternalSepsisAssessment?.evidenceAtTick).toBeNull();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); expect(subject.step().equipment.resuscitation.obstetricsMaternalSepsisAssessment?.reassessmentAtTick).toBeNull(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsMaternalSepsisAssessment?.handoffAtTick).toBeNull(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.obstetricsMaternalSepsisAssessment?.handoffAtTick).not.toBeNull();
    const hostile = make(SCENARIO, 2902); const control = make(SCENARIO, 2902); hostile.step(); control.step(); apply(hostile, '__proto__', { patientName: 'Patient Example' }); hostile.apply({ tick: -1, type: 'septic-shock-response', payload: { action: 'give-antibiotics' } as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toContain('Patient Example');
    const adjacent = make(SEPTIC_SHOCK, 2903); const adjacentControl = make(SEPTIC_SHOCK, 2903); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});
