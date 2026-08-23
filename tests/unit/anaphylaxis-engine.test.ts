import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, EPINEPHRINE_IV_BOUNDS, type Scenario } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC } from '@anesthesia/scenarios/perioperative-anaphylaxis-after-antibiotic';
import type { LearnerAction } from '@platform/kernel/protocol';

const ONSET = 100;
const scenario = {
  ...ROUTINE_INDUCTION,
  timeline: [{
    id: 'cefazolin-exposure', type: 'anaphylaxis', target: 'cefazolin', value: 0.9,
    atTick: ONSET, message: 'Cefazolin administration is complete.',
  }],
};

function engine(source: Scenario = scenario as never) {
  return new AnesthesiaEngine({ scenario: source, seed: 52, practiceRegion: 'US' });
}

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

function reachOnset(subject: AnesthesiaEngine) {
  subject.apply({ tick: 0, type: 'ventilator', payload: {
    mode: 'volume-control', delivering: true, fio2: 1,
    tidalVolumeMl: 500, respiratoryRateBpm: 12,
  } });
  const before = advance(subject, ONSET);
  const onset = subject.step();
  return { before, onset };
}

describe('perioperative anaphylaxis engine foundation', () => {
  it('couples distributive vasodilation, plasma-only leak, and bronchospasm after exposure', () => {
    const subject = engine();
    const { before, onset } = reachOnset(subject);
    expect(onset.equipment.lastExposure).toEqual({ agentId: 'cefazolin', tick: ONSET });
    expect(onset.events.some((event) => event.eventId.startsWith('exposure-cefazolin-exposure')))
      .toBe(true);

    const result = advance(subject, 900);
    expect(result.state.svrDynSCm5).toBeLessThan(before.state.svrDynSCm5);
    expect(result.state.meanArterialMmHg).toBeLessThan(before.state.meanArterialMmHg);
    expect(result.state.bloodVolumeMl).toBeLessThan(before.state.bloodVolumeMl - 300);
    // Plasma leaves but red-cell mass does not: concentration rises rather than
    // behaving like the whole-blood hemorrhage path.
    expect(result.state.hemoglobinGPerDl).toBeGreaterThan(before.state.hemoglobinGPerDl);
    expect(result.equipment.airway.bronchospasmSeverity).toBeGreaterThan(0.7);
    expect(result.waveforms.capnoAlphaDegrees).toBeGreaterThan(before.waveforms.capnoAlphaDegrees);
    expect(result.attribution.flatMap((entry) => entry.terms).some(
      (term) => term.termId === 'anaphylaxis-capillary-leak' && term.teachingModel,
    )).toBe(true);
  });

  it('requires epinephrine plus crystalloid; generic vasopressor cannot treat the coupled process', () => {
    const run = (treatment: 'none' | 'generic' | 'epinephrine' | 'complete') => {
      const subject = engine();
      reachOnset(subject);
      if (treatment === 'generic') subject.apply({
        tick: subject.tick, type: 'vasopressor', payload: { effect: 1 },
      });
      if (treatment === 'epinephrine' || treatment === 'complete') subject.apply({
        tick: subject.tick, type: 'epinephrine', payload: { route: 'iv', doseMicrograms: 50 },
      });
      if (treatment === 'complete') subject.apply({
        tick: subject.tick, type: 'fluid',
        payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 },
      });
      return advance(subject, 600);
    };
    const untreated = run('none');
    const generic = run('generic');
    const epinephrine = run('epinephrine');
    const complete = run('complete');

    expect(generic.equipment.airway.bronchospasmSeverity)
      .toBeCloseTo(untreated.equipment.airway.bronchospasmSeverity, 8);
    expect(generic.state.bloodVolumeMl).toBeCloseTo(untreated.state.bloodVolumeMl, 6);
    expect(epinephrine.equipment.airway.bronchospasmSeverity)
      .toBeLessThan(untreated.equipment.airway.bronchospasmSeverity);
    expect(epinephrine.state.meanArterialMmHg).toBeGreaterThan(untreated.state.meanArterialMmHg);
    expect(complete.state.bloodVolumeMl).toBeGreaterThan(epinephrine.state.bloodVolumeMl + 240);
    expect(complete.state.meanArterialMmHg).toBeGreaterThan(epinephrine.state.meanArterialMmHg);
    expect(complete.equipment.resuscitation).toMatchObject({
      epinephrineTotalMicrograms: 50, crystalloidTotalMl: 1000,
    });
  });

  it('runs the bundled cefazolin case on the same competent treatment trajectory', () => {
    const run = (treated: boolean) => {
      const subject = engine(PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC);
      subject.apply({ tick: 0, type: 'ventilator', payload: {
        mode: 'volume-control', delivering: true, fio2: 1,
        tidalVolumeMl: 480, respiratoryRateBpm: 12,
      } });
      let result = advance(subject, 1801);
      expect(result.equipment.lastExposure).toEqual({ agentId: 'cefazolin', tick: 1800 });
      if (treated) {
        subject.apply({ tick: subject.tick, type: 'epinephrine', payload: {
          route: 'iv', doseMicrograms: 50,
        } });
        subject.apply({ tick: subject.tick, type: 'fluid', payload: {
          fluidId: 'balanced-crystalloid', volumeMl: 1000,
        } });
      }
      result = advance(subject, 600);
      return result;
    };
    const untreated = run(false);
    const treated = run(true);
    expect(treated.state.meanArterialMmHg).toBeGreaterThan(untreated.state.meanArterialMmHg);
    expect(treated.state.bloodVolumeMl).toBeGreaterThan(untreated.state.bloodVolumeMl + 240);
    expect(treated.equipment.airway.bronchospasmSeverity)
      .toBeLessThan(untreated.equipment.airway.bronchospasmSeverity);
  });

  it('accepts only source-banded titrated IV epinephrine boluses', () => {
    expect(EPINEPHRINE_IV_BOUNDS).toEqual({ minMicrograms: 10, maxMicrograms: 50 });
    for (const payload of [
      { route: 'im', doseMicrograms: 50 },
      { route: 'iv', doseMicrograms: 9 },
      { route: 'iv', doseMicrograms: 51 },
      { route: 'iv', doseMicrograms: Number.NaN },
      { route: 'iv', doseMicrograms: Number.POSITIVE_INFINITY },
    ]) {
      const subject = engine();
      subject.apply({ tick: 0, type: 'epinephrine', payload });
      const result = subject.step();
      expect(result.equipment.resuscitation.epinephrineTotalMicrograms).toBe(0);
      expect(result.events.some((event) => event.eventId.startsWith('bad-epinephrine'))).toBe(true);
      expect(Object.values(result.state).every(Number.isFinite)).toBe(true);
    }

    const accepted = engine();
    accepted.apply({ tick: 0, type: 'epinephrine', payload: {
      route: 'iv', doseMicrograms: 50,
    } });
    const acceptedEvent = accepted.step().events.find(
      (event) => event.eventId.startsWith('epinephrine-iv'),
    );
    expect(acceptedEvent?.data?.teachingModel).toBe(true);
    expect(acceptedEvent?.message).toContain('teaching effect');
  });

  it('enforces a documented stocked-drug allergy only after actual positive administration', () => {
    const allergic = {
      ...ROUTINE_INDUCTION,
      patient: { ...ROUTINE_INDUCTION.patient, allergies: ['Propofol — documented anaphylaxis'] },
      timeline: [],
    };
    const subject = engine(allergic);
    subject.apply({ tick: 0, type: 'bolus', payload: {
      drugId: 'propofol', amount: 20, unit: 'mg',
    } });
    const result = subject.step();
    expect(result.equipment.lastExposure?.agentId).toBe('propofol');
    const reaction = result.events.find((event) => event.eventId.startsWith('documented-allergy'));
    expect(reaction?.message).toContain('propofol');
    expect(reaction?.message).toContain('Propofol — documented anaphylaxis');
    expect(reaction?.data).toMatchObject({
      agentId: 'propofol', documentedAllergy: 'Propofol — documented anaphylaxis',
    });

    const intoleranceOnly = engine({
      ...allergic,
      patient: { ...allergic.patient, allergies: ['Propofol nausea'] },
    } as never);
    intoleranceOnly.apply({ tick: 0, type: 'bolus', payload: {
      drugId: 'propofol', amount: 20, unit: 'mg',
    } });
    expect(intoleranceOnly.step().equipment.lastExposure).toBeNull();

    const zero = engine(allergic);
    zero.apply({ tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: 0, unit: 'mg' } });
    expect(zero.step().equipment.lastExposure).toBeNull();
    const refused = engine(allergic);
    refused.apply({ tick: 0, type: 'bolus', payload: {
      drugId: 'propofol', amount: 500, unit: 'mg',
    } });
    expect(refused.step().equipment.lastExposure).toBeNull();
  });

  it('rejects hostile exposure events without changing or poisoning the patient', () => {
    for (const event of [
      { id: 'bad', type: 'anaphylaxis', target: 'latex', value: 0.9, atTick: 0 },
      { id: 'bad', type: 'anaphylaxis', target: 'cefazolin', value: -1, atTick: 0 },
      { id: 'bad', type: 'anaphylaxis', target: 'cefazolin', value: Number.NaN, atTick: 0 },
      { id: 'bad', type: 'anaphylaxis', target: 'cefazolin', value: Infinity, atTick: 0 },
    ]) {
      const hostile = { ...ROUTINE_INDUCTION, timeline: [event] };
      expect(validateScenario(hostile)).not.toEqual([]);
      const result = engine(hostile as never).step();
      expect(result.equipment.lastExposure).toBeNull();
      expect(result.equipment.airway.bronchospasmSeverity).toBe(0);
      expect(Object.values(result.state).every(Number.isFinite)).toBe(true);
      expect(result.events.some((entry) => entry.eventId.startsWith('incomplete-event-bad'))).toBe(true);
    }
  });

  it('replays exposure, epinephrine, and crystalloid deterministically', () => {
    const actions: LearnerAction[] = [
      { tick: ONSET + 10, type: 'epinephrine', payload: { route: 'iv', doseMicrograms: 50 } },
      { tick: ONSET + 20, type: 'fluid', payload: {
        fluidId: 'balanced-crystalloid', volumeMl: 1000,
      } },
    ];
    const options = { scenario: scenario as never, seed: 52, practiceRegion: 'US', ticks: 800 };
    expect(replay(actions, options)).toEqual(replay(actions, options));
  });
});
