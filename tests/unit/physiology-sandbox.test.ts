import { describe, expect, it } from 'vitest';
import { RESPIRATORY_PROFILES, timeToDesaturationMinutes } from '@anesthesia/physiology/respiratory';
import {
  PATTERN_BASIS, PROFILE_BASIS, PROFILE_IDS, physiologyStateProblem, runPhysiology,
} from '@anesthesia/sandbox/physiology-sandbox';

describe('the physiology sandbox', () => {
  /**
   * The task's own check: the sandbox's healthy-adult apnoea state, replayed
   * through the Benumof, Dagg and Benumof 1997 benchmark (PMID 9357902), with
   * the tolerance the physiology test and the validation report declare.
   */
  it('reproduces the Benumof apnoea benchmark from its healthy-adult apnoea state', () => {
    const BENCHMARK = { healthy: 8, 'moderately-ill': 5, obese: 2.7 } as const;
    for (const [profile, expected] of Object.entries(BENCHMARK)) {
      const run = runPhysiology({ profile: profile as keyof typeof BENCHMARK, fio2: 1, pattern: 'apnea', minutes: 10 });
      expect(run.minutesTo90, profile).not.toBeNull();
      expect(Math.abs(run.minutesTo90! - expected) / expected, profile).toBeLessThanOrEqual(0.2);
      // And it is the same model, not a second one that happens to agree.
      expect(run.minutesTo90).toBeCloseTo(timeToDesaturationMinutes(RESPIRATORY_PROFILES[profile as keyof typeof BENCHMARK], { preoxygenated: true }), 6);
    }
  });

  it('labels as published only what a published result holds', () => {
    expect(PROFILE_IDS.filter((id) => PROFILE_BASIS[id] === 'published').sort()).toEqual(['healthy', 'moderately-ill', 'obese']);
    expect(PATTERN_BASIS.apnea).toBe('published');
    expect(PATTERN_BASIS.spontaneous).toBe('teaching');
  });

  it('isolates one variable: room air before apnoea shortens the time to 90%', () => {
    const preoxygenated = runPhysiology({ profile: 'healthy', fio2: 1, pattern: 'apnea', minutes: 10 }).minutesTo90!;
    const roomAir = runPhysiology({ profile: 'healthy', fio2: 0.21, pattern: 'apnea', minutes: 10 }).minutesTo90!;
    expect(roomAir).toBeLessThan(preoxygenated / 3);
  });

  it('holds saturation while the profile breathes, and lets carbon dioxide rise on half the tidal volume', () => {
    const breathing = runPhysiology({ profile: 'healthy', fio2: 0.21, pattern: 'spontaneous', minutes: 10 });
    expect(breathing.minutesTo90).toBeNull();
    expect(Math.min(...breathing.samples.map((sample) => sample.spo2Percent))).toBeGreaterThan(94);
    const shallow = runPhysiology({ profile: 'healthy', fio2: 0.21, pattern: 'half-tidal-volume', minutes: 10 });
    expect(shallow.samples.at(-1)!.paco2MmHg).toBeGreaterThan(breathing.samples.at(-1)!.paco2MmHg + 5);
  });

  it('refuses a value it does not offer', () => {
    expect(physiologyStateProblem({ profile: 'healthy', fio2: 0.5, pattern: 'apnea', minutes: 10 })).toMatch(/not an offered/);
    expect(physiologyStateProblem({ profile: 'athlete' as never, fio2: 1, pattern: 'apnea', minutes: 10 })).toMatch(/No respiratory profile/);
  });
});

describe('a physiology state as a link', () => {
  it('round-trips, carries only its inputs, and refuses what it cannot honour', async () => {
    const { parsePhysiologyQuery, physiologyQuery } = await import('@anesthesia/sandbox/physiology-sandbox');
    const state = { profile: 'obese', fio2: 0.6, pattern: 'half-tidal-volume', minutes: 20 } as const;
    expect(parsePhysiologyQuery(physiologyQuery(state))).toEqual({ state });
    expect([...new URLSearchParams(physiologyQuery(state)).keys()].sort()).toEqual(['fio2', 'minutes', 'pattern', 'profile', 'view']);
    expect(parsePhysiologyQuery(`${physiologyQuery(state)}&seed=1`)).toHaveProperty('problem');
    expect(parsePhysiologyQuery(physiologyQuery(state).replace('fio2=0.6', 'fio2=0.5'))).toHaveProperty('problem');
  });
});

describe('where a run stops', () => {
  it('stops below 50% saturation rather than drawing a course to zero', async () => {
    const { STOP_BELOW_SATURATION } = await import('@anesthesia/sandbox/physiology-sandbox');
    const run = runPhysiology({ profile: 'obese', fio2: 1, pattern: 'apnea', minutes: 10 });
    expect(run.stoppedAt).not.toBeNull();
    expect(Math.min(...run.samples.map((sample) => sample.spo2Percent))).toBeGreaterThan(STOP_BELOW_SATURATION - 5);
    expect(runPhysiology({ profile: 'healthy', fio2: 1, pattern: 'spontaneous', minutes: 10 }).stoppedAt).toBeNull();
  });
});
