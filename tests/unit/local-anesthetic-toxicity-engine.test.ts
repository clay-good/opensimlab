import { describe, expect, it } from 'vitest';
import {
  AnesthesiaEngine, LAST_LIPID_CONCENTRATION_PERCENT, lastLipidProtocolForWeight,
  type Scenario,
} from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { replay } from '@anesthesia/debrief/replay-engine';
import type { LearnerAction } from '@platform/kernel/protocol';

const ONSET = 10;

function scenario(weightKg = 60): Scenario {
  return {
    ...ROUTINE_INDUCTION,
    patient: { ...ROUTINE_INDUCTION.patient, weightKg },
    timeline: [{
      id: 'bupivacaine-exposure', type: 'local-anesthetic-toxicity',
      target: 'bupivacaine', value: 0.9, atTick: ONSET,
      message: 'Tinnitus and agitation follow the local-anesthetic injection; generalized seizure activity begins.',
    }],
  };
}

function engine(weightKg = 60) {
  return new AnesthesiaEngine({ scenario: scenario(weightKg), seed: 71, practiceRegion: 'US' });
}

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

describe('ASRA 2020 initial LAST response', () => {
  it('uses the explicit weight bands and cumulative cap', () => {
    expect(lastLipidProtocolForWeight(60)).toEqual({
      band: 'under-70-kg', initialBolusMl: 90, infusionMlPerMin: 15, maxTotalMl: 720,
    });
    expect(lastLipidProtocolForWeight(70)).toEqual({
      band: '70-kg-or-more', initialBolusMl: 100, infusionMlPerMin: 12.5, maxTotalMl: 840,
    });
    expect(lastLipidProtocolForWeight(80)).toEqual({
      band: '70-kg-or-more', initialBolusMl: 100, infusionMlPerMin: 12.5, maxTotalMl: 960,
    });
    expect(() => lastLipidProtocolForWeight(Number.NaN)).toThrow(/finite and positive/);
  });

  it('produces bounded seizure activity and cardiovascular depression without inventing arrest', () => {
    const untreated = engine();
    const before = advance(untreated, ONSET);
    const onset = untreated.step();
    expect(onset.equipment.lastExposure).toEqual({ agentId: 'bupivacaine', tick: ONSET });
    expect(onset.equipment.resuscitation.seizureActivityFraction).toBeGreaterThan(0.5);
    const later = advance(untreated, 900);
    expect(later.state.meanArterialMmHg).toBeLessThan(before.state.meanArterialMmHg);
    expect(later.state.cardiacOutputLPerMin).toBeLessThan(before.state.cardiacOutputLPerMin);
    expect(later.state.cardiacOutputLPerMin).toBeGreaterThan(0.4);
    expect(later.equipment.rhythmId).toBe('sinus');
    expect(Object.values(later.state).every(Number.isFinite)).toBe(true);
  });

  it('rejects hostile toxicity events without changing or poisoning the patient', () => {
    for (const event of [
      { id: 'bad', type: 'local-anesthetic-toxicity', target: 'lidocaine', value: 0.9, atTick: 0 },
      { id: 'bad', type: 'local-anesthetic-toxicity', target: 'bupivacaine', value: -1, atTick: 0 },
      { id: 'bad', type: 'local-anesthetic-toxicity', target: 'bupivacaine', value: Number.NaN, atTick: 0 },
      { id: 'bad', type: 'local-anesthetic-toxicity', target: 'bupivacaine', value: Infinity, atTick: 0 },
    ]) {
      const hostile = { ...ROUTINE_INDUCTION, timeline: [event] };
      expect(validateScenario(hostile)).not.toEqual([]);
      const result = new AnesthesiaEngine({
        scenario: hostile as never, seed: 71, practiceRegion: 'US',
      }).step();
      expect(result.equipment.lastExposure).toBeNull();
      expect(result.equipment.resuscitation.localAnestheticToxicityFraction).toBe(0);
      expect(result.equipment.resuscitation.seizureActivityFraction).toBe(0);
      expect(Object.values(result.state).every(Number.isFinite)).toBe(true);
      expect(result.events.some((entry) => entry.eventId.startsWith('incomplete-event-bad')))
        .toBe(true);
    }
  });

  it('suppresses modeled seizure activity and lipid reduces the cardiovascular toxicity drive', () => {
    const treated = engine();
    advance(treated, ONSET + 1);
    treated.apply({ tick: treated.tick, type: 'seizure-suppression', payload: {
      route: 'iv', medicationClass: 'benzodiazepine',
    } });
    treated.apply({ tick: treated.tick, type: 'lipid-emulsion', payload: {
      route: 'iv', protocol: 'initial', concentrationPercent: 20,
    } });
    const result = advance(treated, 300);
    expect(result.equipment.resuscitation).toMatchObject({
      seizureSuppressed: true,
      seizureActivityFraction: 0,
      lipidEmulsionInfusionMlPerMin: 15,
      lastLipidEmulsionTick: ONSET + 1,
    });
    expect(result.equipment.resuscitation.lipidEmulsionTotalMl).toBeGreaterThan(0);
    expect(result.equipment.resuscitation.lipidEmulsionBolusRemainingMl).toBeGreaterThan(0);
    expect(result.equipment.resuscitation.lipidEmulsionEffectFraction).toBeGreaterThan(0);

    const untreated = engine();
    advance(untreated, ONSET + 301);
    expect(result.equipment.resuscitation.localAnestheticToxicityFraction)
      .toBeLessThan(untreated.equipment().resuscitation.localAnestheticToxicityFraction!);
    expect(result.state.meanArterialMmHg).toBeGreaterThan(untreated.step().state.meanArterialMmHg);
  });

  it('rejects malformed or repeated lipid actions without mutating accepted treatment', () => {
    for (const payload of [
      { route: 'im', protocol: 'initial', concentrationPercent: 20 },
      { route: 'iv', protocol: 'initial', concentrationPercent: 10 },
      { route: 'iv', protocol: 'initial', concentrationPercent: Number.NaN },
      { route: 'iv', protocol: 'repeat', concentrationPercent: 20 },
    ]) {
      const subject = engine();
      advance(subject, ONSET + 1);
      subject.apply({ tick: subject.tick, type: 'lipid-emulsion', payload });
      const result = subject.step();
      expect(result.equipment.resuscitation.lipidEmulsionTotalMl).toBe(0);
      expect(result.events.some((event) => event.eventId.startsWith('bad-lipid-emulsion'))).toBe(true);
    }

    const subject = engine();
    advance(subject, ONSET + 1);
    const action = { tick: subject.tick, type: 'lipid-emulsion', payload: {
      route: 'iv', protocol: 'initial', concentrationPercent: LAST_LIPID_CONCENTRATION_PERCENT,
    } } satisfies LearnerAction;
    subject.apply(action);
    subject.step();
    subject.apply({ ...action, tick: subject.tick });
    const repeated = subject.step();
    expect(repeated.events.some((event) => event.eventId.startsWith('bad-lipid-emulsion'))).toBe(true);
  });

  it('delivers the bolus over three minutes, stops the initial infusion at 20 minutes, and preserves the ceiling', () => {
    const subject = engine();
    advance(subject, ONSET + 1);
    subject.apply({ tick: subject.tick, type: 'lipid-emulsion', payload: {
      route: 'iv', protocol: 'initial', concentrationPercent: 20,
    } });
    let result = subject.step();
    expect(result.equipment.resuscitation.lipidEmulsionTotalMl).toBeCloseTo(0.075, 6);
    expect(result.equipment.resuscitation.lipidEmulsionBolusRemainingMl).toBeCloseTo(89.95, 6);

    result = advance(subject, 1799);
    expect(result.equipment.resuscitation.lipidEmulsionBolusRemainingMl).toBeCloseTo(0, 6);
    expect(result.equipment.resuscitation.lipidEmulsionTotalMl).toBeCloseTo(135, 5);

    result = advance(subject, 10_201);
    expect(result.equipment.resuscitation.lipidEmulsionTotalMl).toBeCloseTo(390, 5);
    expect(result.equipment.resuscitation.lipidEmulsionInfusionMlPerMin).toBe(0);
    expect(result.equipment.resuscitation.lipidEmulsionTotalMl).toBeLessThan(720);
  });

  it('enforces reduced epinephrine at no more than 1 microgram/kg during LAST', () => {
    const subject = engine(40);
    advance(subject, ONSET + 1);
    subject.apply({ tick: subject.tick, type: 'epinephrine', payload: {
      route: 'iv', doseMicrograms: 41,
    } });
    expect(subject.step().events.some((event) => event.eventId.startsWith('bad-epinephrine'))).toBe(true);
    subject.apply({ tick: subject.tick, type: 'epinephrine', payload: {
      route: 'iv', doseMicrograms: 40,
    } });
    expect(subject.step().equipment.resuscitation.epinephrineTotalMicrograms).toBe(40);
    subject.apply({ tick: subject.tick, type: 'epinephrine', payload: {
      route: 'iv', doseMicrograms: 5,
    } });
    expect(subject.step().equipment.resuscitation.epinephrineTotalMicrograms).toBe(45);
    subject.apply({ tick: subject.tick, type: 'epinephrine', payload: {
      route: 'iv', doseMicrograms: 0,
    } });
    expect(subject.step().equipment.resuscitation.epinephrineTotalMicrograms).toBe(45);
  });

  it('replays seizure suppression and lipid delivery deterministically', () => {
    const actions: LearnerAction[] = [
      { tick: ONSET + 1, type: 'seizure-suppression', payload: {
        route: 'iv', medicationClass: 'benzodiazepine',
      } },
      { tick: ONSET + 2, type: 'lipid-emulsion', payload: {
        route: 'iv', protocol: 'initial', concentrationPercent: 20,
      } },
    ];
    const options = { scenario: scenario(), seed: 71, practiceRegion: 'US', ticks: 500 };
    expect(replay(actions, options)).toEqual(replay(actions, options));
  });
});
