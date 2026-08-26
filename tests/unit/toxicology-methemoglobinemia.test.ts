import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { METHEMOGLOBINEMIA_SATURATION_GAP as SCENARIO } from '../../src/modules/toxicology/scenarios/methemoglobinemia-saturation-gap';
import { AUTONOMIC_DYSREFLEXIA_AUTHORED_TRIGGER } from '../../src/modules/neurology/scenarios/autonomic-dysreflexia-authored-trigger';

const ACTIONS = [
  'reconcile-toxicology-methemoglobinemia-exposure-cyanosis-symptoms-pulse-ox-arterial-oxygen-and-whole-patient',
  'recognize-toxicology-methemoglobinemia-dyshemoglobin-pattern-without-single-number-or-diagnostic-closure',
  'activate-toxicology-methemoglobinemia-support-monitoring-source-control-poison-center-and-critical-care-ownership',
  'review-toxicology-methemoglobinemia-supplied-cooximetry-and-methylene-blue-hazard-boundary',
  'record-toxicology-methemoglobinemia-bounded-qualified-team-antidote-intent-and-strict-reassessment',
  'handoff-toxicology-methemoglobinemia-exposure-rebound-hemolysis-serotonin-rescue-and-active-risk',
] as const;
const make = (scenario = SCENARIO, seed = 2061) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick, type: 'methemoglobinemia-saturation-gap-response', payload: { action: action as never, ...extras } as never });

describe('Toxicology methemoglobinemia contract', () => {
  it('validates the fixture and exposes only fixed discordance and response states', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.timeline.map(({ target }) => target)).toEqual(['methemoglobinemia-saturation-gap-transition', 'methemoglobinemia-saturation-gap-transition', 'methemoglobinemia-saturation-gap-transition-boundary']);
    const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 122, systolicMmHg: 112, diastolicMmHg: 68, meanArterialMmHg: 83, respiratoryRateBpm: 26, coreTemperatureC: 36.9 });
    expect(frame.state.spo2Percent).toBeCloseTo(85, 0);
    expect(frame.equipment.resuscitation.toxicologyMethemoglobinemiaAssessment).toMatchObject({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, hazardsAtTick: null, reassessmentAtTick: null, handoffAtTick: null, discordanceAuthored: true, dyshemoglobinPatternRecognized: false });
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 98, respiratoryRateBpm: 20 });
    expect(frame.state.spo2Percent).toBeCloseTo(90, 0);
    expect(frame.equipment.resuscitation.toxicologyMethemoglobinemiaAssessment).toMatchObject({ dyshemoglobinPatternRecognized: true, qualifiedSupportActive: true, cooximetryAndHazardsReviewed: true, qualifiedAntidoteIntentRecorded: true, responseStateAuthored: true, patientHistoryTakenByLearner: false, patientExaminedByLearner: false, monitoringAcquiredByLearner: false, bloodSampleAcquiredByLearner: false, saturationGapCalculatedByLearner: false, diagnosisMadeByLearner: false, oxygenSelectedByLearner: false, drugSelectedByLearner: false, doseSelectedByLearner: false, routeSelectedByLearner: false, treatmentDeliveredByLearner: false, rescuePerformedByLearner: false, treatmentEffectProven: false, reboundExcluded: false, hemolysisExcluded: false, serotoninSyndromeExcluded: false, outcomePredicted: false });
  });

  it('enforces order and elapsed gates while refusing doses, PII, and adjacent shortcuts', () => {
    for (const [prepare, attempted] of [[[], ACTIONS[1]], [[], ACTIONS[4]], [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]], [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]]] as const) {
      const subject = make(SCENARIO, 2062); const control = make(SCENARIO, 2062); subject.step(); control.step(); for (const item of prepare) { apply(subject, item); apply(control, item); } subject.step(); control.step(); apply(subject, attempted); expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    }
    const subject = make(SCENARIO, 2063); subject.step(); for (const action of ACTIONS.slice(0, 4)) apply(subject, action); apply(subject, ACTIONS[4]); subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); subject.step(); apply(subject, ACTIONS[5]); expect(subject.step().equipment.resuscitation.toxicologyMethemoglobinemiaAssessment).toMatchObject({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, hazardsAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 });
    const hostile = make(SCENARIO, 2064); const control = make(SCENARIO, 2064); hostile.step(); control.step(); for (const action of ['give-methylene-blue-2mg-kg', 'perform-exchange-transfusion', 'start-hyperbaric-oxygen', '__proto__']) apply(hostile, action, { patientName: 'Patient Example', notes: 'private note' }); for (const [type, payload] of [['bolus', { drugId: 'methylene-blue', amount: 136, unit: 'mg' }], ['infusion', { drugId: 'methylene-blue', rate: 1 }], ['autonomic-dysreflexia-authored-trigger-response', { action: 'review' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never }); const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Patient Example|private note/);
    const adjacent = make(AUTONOMIC_DYSREFLEXIA_AUTHORED_TRIGGER, 2065); const adjacentControl = make(AUTONOMIC_DYSREFLEXIA_AUTHORED_TRIGGER, 2065); adjacent.step(); adjacentControl.step(); apply(adjacent, ACTIONS[0]); expect(adjacent.step().equipment.resuscitation).toEqual(adjacentControl.step().equipment.resuscitation);
  });
});
