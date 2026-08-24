import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { replay } from '@anesthesia/debrief/replay';
import type { LearnerAction } from '@platform/kernel/protocol';

function engine(seed = 91) {
  return new AnesthesiaEngine({ scenario: ROUTINE_INDUCTION, seed, practiceRegion: 'US' });
}

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

function inject(subject: AnesthesiaEngine, crisisId: string) {
  subject.apply({ tick: subject.tick, type: 'inject-crisis', payload: { crisisId } });
  return subject.step();
}

describe('manual crisis-injector foundation', () => {
  it('starts coherent 100 mL/min hemorrhage physiology rather than changing a label only', () => {
    const treated = engine();
    const control = engine();
    const baseline = treated.step();
    control.step();
    inject(treated, 'massive-hemorrhage');
    const loss = advance(treated, 1200);
    const unchanged = advance(control, 1201);
    expect(loss.state.bloodVolumeMl).toBeLessThan(unchanged.state.bloodVolumeMl - 190);
    expect(loss.state.cardiacOutputLPerMin).toBeLessThan(unchanged.state.cardiacOutputLPerMin);
    expect(loss.state.meanArterialMmHg).toBeLessThan(unchanged.state.meanArterialMmHg);
    expect(loss.state.etco2MmHg).toBeLessThan(unchanged.state.etco2MmHg);
    expect(baseline.state.bloodVolumeMl).toBeGreaterThan(loss.state.bloodVolumeMl);
  });

  it('injects the already-modeled airway, allergic, hypermetabolic, and toxicity drives', () => {
    const anaphylaxis = engine();
    let result = inject(anaphylaxis, 'anaphylaxis');
    result = advance(anaphylaxis, 20);
    expect(result.equipment.lastExposure?.agentId).toBe('manual-trigger');
    expect(result.equipment.airway.bronchospasmSeverity).toBeGreaterThan(0.5);

    const laryngospasm = engine();
    result = inject(laryngospasm, 'laryngospasm');
    expect(result.equipment.airway.patencyFraction).toBeLessThan(0.01);

    const bronchospasm = engine();
    result = inject(bronchospasm, 'bronchospasm');
    expect(result.equipment.airway.bronchospasmSeverity).toBe(0.85);

    const toxicity = engine();
    result = inject(toxicity, 'local-anesthetic-systemic-toxicity');
    expect(result.equipment.resuscitation.seizureActivityFraction).toBeGreaterThan(0.5);
    expect(result.equipment.lastExposure?.agentId).toBe('manual-local-anesthetic-exposure');

    const mh = engine();
    mh.apply({ tick: 0, type: 'ventilator', payload: {
      sevofluranePercent: 2, freshGasFlowLPerMin: 10, delivering: true,
    } });
    inject(mh, 'malignant-hyperthermia');
    result = advance(mh, 1800);
    expect(result.equipment.lastExposure?.agentId).toBe('manual-mh-susceptibility');
    expect(result.state.muscleRigidityFraction).toBeGreaterThan(0);
  });

  it('injects shockable and non-shockable arrest as distinct replayable rhythms', () => {
    const shockable = engine();
    let result = inject(shockable, 'cardiac-arrest-shockable');
    expect(result.equipment.rhythmId).toBe('ventricular-fibrillation');
    expect(result.equipment.resuscitation.cardiacArrestActive).toBe(true);

    const nonShockable = engine();
    result = inject(nonShockable, 'cardiac-arrest-non-shockable');
    expect(result.equipment.rhythmId).toBe('asystole');
    nonShockable.apply({ tick: nonShockable.tick, type: 'defibrillation', payload: {
      energyJ: 200, waveform: 'biphasic',
    } });
    expect(nonShockable.step().equipment.rhythmId).toBe('asystole');
  });

  it('disconnects actual TIVA delivery without changing the pump command', () => {
    const subject = engine();
    subject.apply({ tick: 0, type: 'infusion', payload: {
      drugId: 'propofol', rate: 100, unit: 'mg/min',
    } });
    const before = subject.step();
    const result = inject(subject, 'tiva-line-disconnection-under-paralysis');
    expect(before.equipment.hypnoticLine.connected).toBe(true);
    expect(result.equipment.hypnoticLine.connected).toBe(false);
    expect(result.equipment.drugs.find((drug) => drug.drugId === 'propofol')?.infusionRate).toBe(100);
  });

  it('logs accepted injections and rejects unknown or repeated requests without mutation', () => {
    const subject = engine();
    const first = inject(subject, 'bronchospasm');
    expect(first.events.some((event) => event.eventId.startsWith('crisis-injected-bronchospasm-')))
      .toBe(true);
    expect(first.equipment.lastInjectedCrisis?.crisisId).toBe('bronchospasm');
    expect(first.equipment.injectedCrisisIds).toEqual(['bronchospasm']);
    const repeated = inject(subject, 'bronchospasm');
    expect(repeated.events.some((event) => event.eventId.startsWith('bad-crisis-injection-')))
      .toBe(true);
    const unknown = inject(subject, 'air-embolism');
    expect(unknown.events.some((event) => event.message.includes('does not implement'))).toBe(true);
    expect(unknown.equipment.lastInjectedCrisis?.crisisId).toBe('bronchospasm');
  });

  it('replays manual injections deterministically', () => {
    const actions: LearnerAction[] = [
      { tick: 10, type: 'inject-crisis', payload: { crisisId: 'bronchospasm' } },
      { tick: 20, type: 'inject-crisis', payload: { crisisId: 'massive-hemorrhage' } },
    ];
    const options = { scenario: ROUTINE_INDUCTION, seed: 91, practiceRegion: 'US', ticks: 500 };
    expect(replay(actions, options)).toEqual(replay(actions, options));
  });
});
