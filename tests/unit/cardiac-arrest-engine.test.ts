import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, type Scenario } from '@anesthesia/engine';
import { PERSISTENT_VF_CARDIAC_ARREST } from '@anesthesia/scenarios/persistent-vf-cardiac-arrest';
import { replay } from '@anesthesia/debrief/replay-engine';
import type { LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

function engine(scenario: Scenario = PERSISTENT_VF_CARDIAC_ARREST) {
  return new AnesthesiaEngine({ scenario, seed: 2025, practiceRegion: 'US' });
}

describe('bounded adult shockable cardiac arrest', () => {
  it('makes scripted VF pulseless and compressions produce bounded temporary perfusion', () => {
    const subject = engine();
    const arrest = advance(subject, 301);
    expect(arrest.equipment.rhythmId).toBe('ventricular-fibrillation');
    expect(arrest.equipment.resuscitation.cardiacArrestActive).toBe(true);
    expect(arrest.state.cardiacOutputLPerMin).toBe(0);
    expect(arrest.state.etco2MmHg).toBe(0);
    expect(arrest.equipment.invalidParameters).toEqual(expect.arrayContaining([
      'heartRateBpm', 'meanArterialMmHg', 'spo2Percent',
    ]));

    subject.apply({ tick: subject.tick, type: 'chest-compressions', payload: { active: true } });
    const cpr = advance(subject, 100);
    expect(cpr.state.cardiacOutputLPerMin).toBe(1.2);
    expect(cpr.state.etco2MmHg).toBe(18);
    expect(cpr.equipment.resuscitation).toMatchObject({
      chestCompressionsActive: true,
      chestCompressionSeconds: 10,
      compressionPerfusionFraction: 0.25,
    });
  });

  it('converts only after accepted compressions, 1 mg IV/IO epinephrine, and 200 J', () => {
    const subject = engine();
    advance(subject, 301);
    subject.apply({ tick: subject.tick, type: 'defibrillation', payload: { energyJ: 200, waveform: 'biphasic' } });
    expect(subject.step().equipment.rhythmId).toBe('ventricular-fibrillation');
    subject.apply({ tick: subject.tick, type: 'chest-compressions', payload: { active: true } });
    subject.step();
    subject.apply({ tick: subject.tick, type: 'cardiac-arrest-epinephrine', payload: {
      route: 'iv', doseMg: 1,
    } });
    subject.apply({ tick: subject.tick, type: 'cardiac-arrest-epinephrine', payload: {
      route: 'iv', doseMg: 1,
    } });
    subject.apply({ tick: subject.tick, type: 'defibrillation', payload: { energyJ: 150, waveform: 'biphasic' } });
    const wrongEnergy = subject.step();
    expect(wrongEnergy.equipment.rhythmId).toBe('ventricular-fibrillation');
    expect(wrongEnergy.equipment.resuscitation.arrestEpinephrineTotalMg).toBe(1);
    expect(wrongEnergy.events.some((event) => event.eventId.startsWith('bad-arrest-epinephrine'))).toBe(true);
    subject.apply({ tick: subject.tick, type: 'defibrillation', payload: { energyJ: 200, waveform: 'biphasic' } });
    const rosc = subject.step();
    expect(rosc.equipment.rhythmId).toBe('sinus');
    expect(rosc.equipment.resuscitation).toMatchObject({
      cardiacArrestActive: false,
      chestCompressionsActive: false,
      arrestEpinephrineTotalMg: 1,
      defibrillationShockCount: 3,
      lastDefibrillationEnergyJ: 200,
    });
    expect(rosc.equipment.resuscitation.roscAtTick).not.toBeNull();
    expect(rosc.events.some((event) => event.eventId.startsWith('rosc-'))).toBe(true);
  });

  it('requires recent preceding CPR and permits an explicit clearance pause', () => {
    const subject = engine();
    advance(subject, 301);
    subject.apply({ tick: subject.tick, type: 'chest-compressions', payload: { active: true } });
    subject.apply({ tick: subject.tick, type: 'cardiac-arrest-epinephrine', payload: {
      route: 'iv', doseMg: 1,
    } });
    subject.step();
    subject.apply({ tick: subject.tick, type: 'chest-compressions', payload: { active: false } });
    advance(subject, 101);
    subject.apply({ tick: subject.tick, type: 'defibrillation', payload: {
      energyJ: 200, waveform: 'biphasic',
    } });
    expect(subject.step().equipment.rhythmId).toBe('ventricular-fibrillation');
    subject.apply({ tick: subject.tick, type: 'chest-compressions', payload: { active: true } });
    subject.apply({ tick: subject.tick, type: 'chest-compressions', payload: { active: false } });
    subject.apply({ tick: subject.tick, type: 'defibrillation', payload: {
      energyJ: 200, waveform: 'biphasic',
    } });
    expect(subject.step().equipment.rhythmId).toBe('sinus');
  });

  it('never converts asystole after a shock', () => {
    const asystole: Scenario = {
      ...PERSISTENT_VF_CARDIAC_ARREST,
      timeline: [{ id: 'non-shockable', type: 'rhythm-change', target: 'asystole', atTick: 0 }],
    };
    const subject = engine(asystole);
    subject.step();
    subject.apply({ tick: subject.tick, type: 'chest-compressions', payload: { active: true } });
    subject.apply({ tick: subject.tick, type: 'cardiac-arrest-epinephrine', payload: {
      route: 'io', doseMg: 1,
    } });
    subject.apply({ tick: subject.tick, type: 'defibrillation', payload: { energyJ: 200, waveform: 'biphasic' } });
    const result = subject.step();
    expect(result.equipment.rhythmId).toBe('asystole');
    expect(result.equipment.resuscitation.roscAtTick).toBeNull();
    expect(result.events.find((event) => event.eventId.startsWith('defibrillation-'))?.message)
      .toContain('non-shockable rhythm did not convert');
  });

  it('rejects hostile actions without mutating arrest treatment', () => {
    const subject = engine();
    advance(subject, 301);
    for (const action of [
      { type: 'cardiac-arrest-epinephrine', payload: { route: 'im', doseMg: 1 } },
      { type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: Number.NaN } },
      { type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: -1 } },
      { type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: 0.5 } },
      { type: 'defibrillation', payload: { energyJ: Number.NaN, waveform: 'biphasic' } },
      { type: 'defibrillation', payload: { energyJ: -200, waveform: 'biphasic' } },
      { type: 'defibrillation', payload: { energyJ: 200, waveform: 'monophasic' } },
      { type: 'chest-compressions', payload: { active: 'yes' } },
    ]) subject.apply({ tick: subject.tick, ...action } as never);
    const result = subject.step();
    expect(result.equipment.resuscitation).toMatchObject({
      chestCompressionsActive: false,
      arrestEpinephrineTotalMg: 0,
      defibrillationShockCount: 0,
    });
    expect(result.events.filter((event) => event.eventId.startsWith('bad-')).length).toBe(8);
  });

  it('replays accepted cardiac-arrest actions deterministically', () => {
    const actions: LearnerAction[] = [
      { tick: 301, type: 'chest-compressions', payload: { active: true } },
      { tick: 302, type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: 1 } },
      { tick: 303, type: 'defibrillation', payload: { energyJ: 200, waveform: 'biphasic' } },
    ];
    const options = {
      scenario: PERSISTENT_VF_CARDIAC_ARREST, seed: 2025, practiceRegion: 'US', ticks: 330,
    };
    expect(replay(actions, options)).toEqual(replay(actions, options));
  });
});
