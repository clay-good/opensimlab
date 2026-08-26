import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { CARBON_MONOXIDE_REASSURING_MONITOR as SCENARIO } from '../../src/modules/toxicology/scenarios/carbon-monoxide-reassuring-monitor';
import { METHEMOGLOBINEMIA_SATURATION_GAP } from '../../src/modules/toxicology/scenarios/methemoglobinemia-saturation-gap';

const ACTIONS = [
  'reconcile-toxicology-carbon-monoxide-shared-exposure-clock-syncope-symptoms-pulse-ox-and-whole-patient',
  'recognize-toxicology-carbon-monoxide-pattern-despite-reassuring-pulse-ox-without-single-value-closure',
  'activate-toxicology-carbon-monoxide-source-safety-qualified-oxygen-monitoring-poison-center-and-emergency-ownership',
  'review-toxicology-carbon-monoxide-supplied-cooximetry-neurologic-cardiac-and-severity-boundary',
  'record-toxicology-carbon-monoxide-selected-patient-hyperbaric-consultation-and-strict-reassessment',
  'handoff-toxicology-carbon-monoxide-delayed-neurologic-cardiac-exposure-followup-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2066) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'carbon-monoxide-reassuring-monitor-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology carbon-monoxide contract', () => {
  it('validates the fixture and preserves the reassuring conventional pulse ox', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['carbon-monoxide-reassuring-monitor-transition', 'carbon-monoxide-reassuring-monitor-transition', 'carbon-monoxide-reassuring-monitor-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 112, systolicMmHg: 118, diastolicMmHg: 74, meanArterialMmHg: 89, respiratoryRateBpm: 24, coreTemperatureC: 36.8 });
    expect(frame.state.spo2Percent).toBeCloseTo(99, 0);
    expect(frame.equipment.resuscitation.toxicologyCarbonMonoxideAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, severityAtTick: null, reassessmentAtTick: null, handoffAtTick: null, exposurePatternAuthored: true, carbonMonoxidePatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 92, respiratoryRateBpm: 18 });
    expect(frame.state.spo2Percent).toBeCloseTo(100, 0);
    expect(frame.equipment.resuscitation.toxicologyCarbonMonoxideAssessment).toMatchObject({ carbonMonoxidePatternRecognized: true, qualifiedSupportActive: true, cooximetryAndSeverityReviewed: true, qualifiedHyperbaricConsultationRecorded: true, responseStateAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, monitoringAcquiredByLearner: false, bloodSampleAcquiredByLearner: false, diagnosisMadeByLearner: false, oxygenSelectedByLearner: false, drugSelectedByLearner: false, routeSelectedByLearner: false, treatmentDeliveredByLearner: false, hyperbaricTreatmentSelectedByLearner: false, hyperbaricEligibilityDetermined: false, transportSelectedByLearner: false, treatmentEffectProven: false, durableNeurologicRecoveryProven: false, delayedNeurologicComplicationsExcluded: false, cardiacComplicationsExcluded: false, coexposureExcluded: false, outcomePredicted: false });
  });

  it('enforces order and elapsed gates while refusing treatment, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 2067); const control = make(SCENARIO, 2067); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 2068); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyCarbonMonoxideAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, severityAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2069); const control = make(SCENARIO, 2069); hostile.step(); control.step(); for (const action of ['set-oxygen-100-percent', 'select-hyperbaric-treatment', 'transfer-to-chamber', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['ventilator', { fio2: 1 }], ['bolus', { drugId: 'oxygen', amount: 100, unit: '%' }], ['methemoglobinemia-saturation-gap-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(METHEMOGLOBINEMIA_SATURATION_GAP, 2070); const adjacentControl = make(METHEMOGLOBINEMIA_SATURATION_GAP, 2070); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});
