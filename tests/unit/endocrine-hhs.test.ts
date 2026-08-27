import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent } from '@platform/kernel/protocol';
import { DKA_RESOLUTION_TRANSITION } from '../../src/modules/endocrine-metabolic/scenarios/dka-resolution-transition';
import { HHS_OSMOLALITY_TRAJECTORY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hhs-osmolality-trajectory';

const ACTIONS = SCENARIO.metadata.objectives.map(({ id }) => id);
const make = (scenario = SCENARIO, seed = 4801, practiceRegion: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario, seed, practiceRegion });
const apply = (subject: AnesthesiaEngine, action: unknown, extras = {}) => subject.apply({ tick: subject.tick, type: 'hhs-osmolality-trajectory-response', payload: { action, ...extras } as never });

describe('Endocrine HHS trajectory contract', () => {
  it('validates the fictional panels and keeps their osmolality arithmetic coherent', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(2 * 146 + 900 / 18 + 56 / 2.8).toBe(362);
    expect(2 * 149 + 540 / 18 + 42 / 2.8).toBe(343);
    expect((900 - 540) / 4).toBe(90);
    expect((362 - 343) / 4).toBe(4.75);
  });
  it('requires serial order, elapsed reports, and active-risk handoff without a recovery claim', () => {
    const subject = make(); const events: EngineEvent[] = [...subject.step().events];
    expect(subject.equipment().resuscitation.endocrineHhsAssessment?.supportAtTick).toBeNull();
    apply(subject, ACTIONS[5]); events.push(...subject.step().events);
    expect(subject.equipment().resuscitation.endocrineHhsAssessment?.handoffAtTick).toBeNull();
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    apply(subject, ACTIONS[4]); events.push(...subject.step().events);
    expect(subject.equipment().resuscitation.endocrineHhsAssessment?.reassessmentAtTick).toBeNull();
    apply(subject, ACTIONS[4]); apply(subject, ACTIONS[5]); events.push(...subject.step().events);
    expect(subject.equipment().resuscitation.endocrineHhsAssessment?.handoffAtTick).toBeNull();
    apply(subject, ACTIONS[5]); const frame = subject.step(); events.push(...frame.events);
    expect(frame.state).toMatchObject({ heartRateBpm: 98, meanArterialMmHg: 79, respiratoryRateBpm: 20, spo2Percent: 96, coreTemperatureC: 37.6 });
    expect(frame.equipment.resuscitation.endocrineHhsAssessment).toMatchObject({ authoredHyperosmolarIllness: true, authoredQualifiedFourHourReport: true, historyTakenOrPatientExaminedByLearner: false, testObtainedCalculatedOrInterpretedByLearner: false, fluidInsulinDextroseElectrolyteOrDrugSelectedOrDeliveredByLearner: false, doseRateRouteOrAccessSelectedByLearner: false, infusionOperatedByLearner: false, nutritionPrescribedOrDeliveredByLearner: false, precipitantTreatedThrombosisOrPressureInjuryPreventedByLearner: false, diagnosisMadeByLearner: false, procedurePerformedByLearner: false, hhsResolutionProven: false, correctionSafetyBetweenReportsProven: false, durableStabilityProven: false, safetyDispositionDetermined: false, outcomePredicted: false });
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], events).map(({ outcome }) => outcome)).toEqual(Array(6).fill('met'));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], []).map(({ outcome }) => outcome)).toEqual(Array(6).fill('not-met'));
    apply(subject, ACTIONS[5]); expect(subject.step().events.some(({ eventId }) => eventId.startsWith('endocrine-hhs-active-risk-handoff-recorded-'))).toBe(false);
  });
  it('replays the same authored trajectory across seeds and practice regions', () => {
    for (const practiceRegion of ['US', 'GB'] as const) for (const seed of [1, 4802, 0xffff]) {
      const first = make(SCENARIO, seed, practiceRegion); const replay = make(SCENARIO, seed, practiceRegion);
      expect(first.step()).toEqual(replay.step());
      for (const action of ACTIONS) { apply(first, action); apply(replay, action); expect(first.step()).toEqual(replay.step()); }
      expect(first.equipment().resuscitation.endocrineHhsAssessment?.handoffAtTick).not.toBeNull();
    }
  });
  it('keeps both endocrine previews finite without inventing untreated recovery', () => {
    for (const scenario of [SCENARIO, DKA_RESOLUTION_TRANSITION]) {
      const subject = make(scenario); const initial = subject.step();
      let frame = initial;
      for (let tick = 0; tick < 18_000; tick += 1) frame = subject.step();
      for (const value of Object.values(frame.state)) if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
      expect(frame.state.heartRateBpm).toBe(initial.state.heartRateBpm);
      expect(frame.state.meanArterialMmHg).toBe(initial.state.meanArterialMmHg);
      expect(frame.equipment.resuscitation.endocrineHhsAssessment?.reassessmentAtTick ?? null).toBeNull();
      expect(frame.equipment.resuscitation.endocrineDkaResolutionAssessment?.reassessmentAtTick ?? null).toBeNull();
    }
  });
  it('refuses malformed, physical, and neighboring actions without leaking arbitrary payloads', () => {
    const hostile = make(); const control = make(); hostile.step(); control.step();
    for (const action of [null, {}, '__proto__', 'x'.repeat(10_000)]) apply(hostile, action, { patientName: 'Private Example', notes: 'private note' });
    for (const [type, payload] of [['bolus', { drugId: 'insulin', amount: 100, unit: 'units' }], ['fluid', { type: 'crystalloid', volumeMl: 1000 }], ['dka-resolution-transition-response', { action: DKA_RESOLUTION_TRANSITION.metadata.objectives[0]!.id }], ['inject-crisis', { crisisId: 'cardiac-arrest-non-shockable' }]] as const) hostile.apply({ tick: -999, type, payload: payload as never });
    const refused = hostile.step(); expect(refused.state).toEqual(control.step().state); expect(JSON.stringify(refused.events)).not.toMatch(/Private Example|private note/);
    for (const scenario of [{ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'hhs-osmolality-trajectory-lookalike' } }, { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] }]) {
      const subject = make(scenario); subject.step(); apply(subject, ACTIONS[0]); expect(subject.step().equipment.resuscitation.endocrineHhsAssessment).toBeUndefined();
    }
    const neighbor = make(DKA_RESOLUTION_TRANSITION); const neighborControl = make(DKA_RESOLUTION_TRANSITION); neighbor.step(); neighborControl.step(); apply(neighbor, ACTIONS[0]); expect(neighbor.step().equipment.resuscitation).toEqual(neighborControl.step().equipment.resuscitation);
  });
});
