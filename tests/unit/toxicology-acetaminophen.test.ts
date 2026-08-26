import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ACETAMINOPHEN_CLOCK_AND_NOMOGRAM as SCENARIO } from '../../src/modules/toxicology/scenarios/acetaminophen-clock-and-nomogram';
import { CARBON_MONOXIDE_REASSURING_MONITOR } from '../../src/modules/toxicology/scenarios/carbon-monoxide-reassuring-monitor';

const ACTIONS = [
  'reconcile-toxicology-acetaminophen-product-ingestion-window-clock-symptoms-and-whole-patient',
  'recognize-toxicology-acetaminophen-acute-timed-pattern-and-nomogram-applicability-boundary',
  'activate-toxicology-acetaminophen-poison-center-emergency-monitoring-and-nonjudgmental-safety-ownership',
  'review-toxicology-acetaminophen-supplied-timed-level-nomogram-position-liver-and-coingestion-boundary',
  'record-toxicology-acetaminophen-bounded-qualified-team-acetylcysteine-intent-and-strict-later-review',
  'handoff-toxicology-acetaminophen-serial-level-liver-failure-stopping-safety-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2071) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'acetaminophen-clock-and-nomogram-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology acetaminophen contract', () => {
  it('validates the timed fixture and keeps later evidence bounded', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['acetaminophen-clock-and-nomogram-transition', 'acetaminophen-clock-and-nomogram-transition', 'acetaminophen-clock-and-nomogram-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 92, systolicMmHg: 122, diastolicMmHg: 76, meanArterialMmHg: 91, respiratoryRateBpm: 16, coreTemperatureC: 36.8 });
    expect(frame.state.spo2Percent).toBeCloseTo(99, 0);
    expect(frame.equipment.resuscitation.toxicologyAcetaminophenAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null, timedAcuteExposureAuthored: true, nomogramApplicabilityRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 82, respiratoryRateBpm: 16 });
    expect(frame.equipment.resuscitation.toxicologyAcetaminophenAssessment).toMatchObject({ nomogramApplicabilityRecognized: true, qualifiedSupportActive: true, timedEvidenceReviewed: true, qualifiedAntidoteIntentRecorded: true, responseStateAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, monitoringAcquiredByLearner: false, bloodSampleAcquiredByLearner: false, nomogramPlottedByLearner: false, diagnosisMadeByLearner: false, decontaminationSelectedByLearner: false, drugSelectedByLearner: false, doseSelectedByLearner: false, routeSelectedByLearner: false, treatmentDeliveredByLearner: false, stoppingDeterminedByLearner: false, treatmentEffectProven: false, delayedAbsorptionExcluded: false, liverInjuryExcluded: false, coingestionExcluded: false, safetyDispositionDetermined: false, outcomePredicted: false });
  });

  it('enforces order and elapsed gates while refusing dosing, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 2072); const control = make(SCENARIO, 2072); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 2073); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyAcetaminophenAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2074); const control = make(SCENARIO, 2074); hostile.step(); control.step(); for (const action of ['select-acetylcysteine-dose', 'start-infusion', 'stop-at-21-hours', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['bolus', { drugId: 'acetylcysteine', amount: 150, unit: 'mg/kg' }], ['infusion', { drugId: 'acetylcysteine', rate: 50 }], ['carbon-monoxide-reassuring-monitor-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(CARBON_MONOXIDE_REASSURING_MONITOR, 2075); const adjacentControl = make(CARBON_MONOXIDE_REASSURING_MONITOR, 2075); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});
