import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { OXYTOCIN_ASSOCIATED_UTERINE_TACHYSYSTOLE } from '../../src/modules/obstetrics/scenarios/oxytocin-associated-uterine-tachysystole';
import { TERM_NEWBORN_TRANSITION as SCENARIO } from '../../src/modules/neonatology/scenarios/term-newborn-transition';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 4301) => new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'term-newborn-transition-response', payload: { action, ...extras } as never });

describe('Neonatology term-newborn-transition contract', () => {
  it('validates, follows the fixed transition, and keeps every learner care and outcome claim false', () => {
    expect(validateScenario(SCENARIO)).toEqual([]); const subject = make(); let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 142, meanArterialMmHg: 46, respiratoryRateBpm: 42, spo2Percent: 95, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.neonatologyTermTransitionAssessment).toMatchObject({ supportAtTick: null, authoredStableTermTransition: true, authoredQualifiedOneHourReport: false });
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); frame = subject.step(); }
    apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.equipment.resuscitation.neonatologyTermTransitionAssessment).toMatchObject({ authoredQualifiedOneHourReport: true, newbornExaminedOrScoredByLearner: false, monitoringOrTestsInterpretedByLearner: false, diagnosisMadeByLearner: false, cordCarePerformedByLearner: false, skinToSkinOrPositionPerformedByLearner: false, dryingOrWarmingPerformedByLearner: false, suctionOrStimulationPerformedByLearner: false, oxygenVentilationOrAirwayCareDeliveredByLearner: false, compressionsAccessFluidGlucoseOrDrugDeliveredByLearner: false, feedingPerformedByLearner: false, resuscitationPerformedByLearner: false, transportOrProcedurePerformedByLearner: false, durableSafetyProven: false, glucoseStabilityProven: false, feedingSuccessProven: false, dischargeReadinessDetermined: false, newbornOutcomePredicted: false, parentOutcomePredicted: false, outcomePredicted: false });
  });

  it('requires serial order and elapsed checkpoints', () => {
    const subject = make(SCENARIO, 4310); subject.step(); apply(subject, ACTIONS[1]);
    expect(subject.step().equipment.resuscitation.neonatologyTermTransitionAssessment?.contextAtTick).toBeNull();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]);
    expect(subject.step().equipment.resuscitation.neonatologyTermTransitionAssessment?.reassessmentAtTick).toBeNull();
    apply(subject, ACTIONS[4]);
    expect(subject.step().equipment.resuscitation.neonatologyTermTransitionAssessment?.reassessmentAtTick).not.toBeNull();
    apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.neonatologyTermTransitionAssessment?.handoffAtTick).not.toBeNull();
  });

  it('fails closed for hostile, physical, malformed, and neighboring actions', () => {
    const hostile = make(SCENARIO, 4320); const control = make(SCENARIO, 4320); hostile.step(); control.step();
    for (const action of [null, {}, '__proto__', 'x'.repeat(10_000)]) apply(hostile, action, { newbornName: 'Baby Example', notes: 'private note' });
    for (const [type, payload] of [['ventilator', { fio2: 1 }], ['bolus', { drugId: 'epinephrine', amount: 0.03, unit: 'mg' }], ['oxytocin-associated-uterine-tachysystole-response', { action: ACTIONS[0] }], ['inject-crisis', { crisisId: 'neonatal-apnea' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Baby Example|private note/);
    const malformed = [{ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'term-newborn-transition-lookalike' } }, { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] }];
    for (const scenario of malformed) { const subject = make(scenario, 4321); subject.step(); apply(subject, ACTIONS[0]); expect(subject.step().equipment.resuscitation.neonatologyTermTransitionAssessment).toBeUndefined(); }
    const neighbor = make(OXYTOCIN_ASSOCIATED_UTERINE_TACHYSYSTOLE, 4322); const neighborControl = make(OXYTOCIN_ASSOCIATED_UTERINE_TACHYSYSTOLE, 4322); neighbor.step(); neighborControl.step(); apply(neighbor, ACTIONS[0]); expect(neighbor.step().equipment.resuscitation).toEqual(neighborControl.step().equipment.resuscitation);
  });
});
