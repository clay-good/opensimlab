/** Acceptance tests for learning/pedagogy's guidance requirements. */
import { describe, expect, it } from 'vitest';
import {
  PROMPTS, promptFor, promptStillEligible, unpromptedOmissions, type GuidanceInput,
} from '@anesthesia/tutor/guidance';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { replay } from '@anesthesia/debrief/replay-engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { hashStateTrace } from '@platform/transcript/hash';
import type { LearnerAction } from '@platform/kernel/protocol';

const NONE = new Map<string, number>();

const base: GuidanceInput = {
  tick: 700,
  state: { fio2: 0.21, meanArterialMmHg: 90, respiratoryRateBpm: 12, spo2Percent: 98 },
  actions: [],
  ventilating: true,
  alarmCount: 0,
};

describe('Requirement: Progressive Guidance Levels', () => {
  it('Scenario: Guided mode prompts the next step, and says why it matters', () => {
    const prompt = promptFor('guided', base, NONE);
    expect(prompt?.id).toBe('preoxygenate-orient');
    expect(prompt?.suggestion.length).toBeGreaterThan(20);
    expect(prompt?.because.length).toBeGreaterThan(40);
    expect(prompt?.concept).toBe('preoxygenation-and-safe-apnea-time');
    expect(prompt).toMatchObject({
      ruleVersion: '0.1.0', assistanceLevel: 'orient', maturity: 'draft',
      sourceId: 'preoxygenation-and-safe-apnea-time',
    });
  });

  it('Scenario: Unassisted mode is silent', () => {
    expect(promptFor('unassisted', base, NONE)).toBeNull();
    // And the omission is still recorded for the debrief.
    expect(unpromptedOmissions(base)).toContain('preoxygenate');
  });

  it('coached raises only what is about to hurt the patient', () => {
    expect(promptFor('coached', base, NONE)).toBeNull();
    const apnoeic: GuidanceInput = {
      ...base,
      ventilating: false,
      state: { ...base.state!, respiratoryRateBpm: 0 },
      actions: [{ tick: 600, type: 'bolus', payload: { drugId: 'propofol', amount: 130, unit: 'mg' } }],
    };
    expect(promptFor('coached', { ...apnoeic, tick: 600 + 200 * TICKS_PER_SECOND }, NONE)?.id).toBe('ventilate');
  });

  it('Scenario: Prompts never block a crisis', () => {
    expect(promptFor('guided', { ...base, alarmCount: 2 }, NONE)).toBeNull();
  });

  it('does not advise treating a pressure the monitor cannot measure', () => {
    const unavailableMap: GuidanceInput = {
      ...base,
      tick: 20 * TICKS_PER_SECOND,
      state: { ...base.state!, fio2: 1, meanArterialMmHg: 0 },
      unavailableParameters: ['meanArterialMmHg'],
    };
    expect(promptFor('guided', unavailableMap, NONE)).toBeNull();
    expect(promptStillEligible('guided', unavailableMap, 'treat-the-mechanism')).toBe(false);
  });

  it('does not repeat the same prompt inside its cooldown', () => {
    const shown = new Map([['preoxygenate-orient', 700]]);
    expect(promptFor('guided', base, shown)).toBeNull();
    expect(promptFor('guided', { ...base, tick: 700 + 31 * TICKS_PER_SECOND }, shown)?.id)
      .toBe('preoxygenate-notice');
  });

  it('keeps a displayed prompt eligible until its observable condition resolves', () => {
    expect(promptStillEligible('guided', base, 'preoxygenate-orient')).toBe(true);
    expect(promptStillEligible('guided', {
      ...base, state: { ...base.state!, fio2: 1 },
    }, 'preoxygenate-orient')).toBe(false);
    expect(promptStillEligible('guided', { ...base, alarmCount: 1 }, 'preoxygenate-orient')).toBe(false);
    expect(promptStillEligible('unassisted', base, 'preoxygenate-orient')).toBe(false);
  });

  it('escalates one preoxygenation objective through the authored ladder deterministically', () => {
    const shown = new Map<string, number>();
    let tick = 200 * TICKS_PER_SECOND;
    const levels: string[] = [];
    for (let index = 0; index < 5; index += 1) {
      const prompt = promptFor('guided', { ...base, tick }, shown)!;
      levels.push(prompt.assistanceLevel);
      shown.set(prompt.id, tick);
      tick += 31 * TICKS_PER_SECOND;
    }
    expect(levels).toEqual(['orient', 'notice', 'connect', 'prioritize', 'direct']);

    const explained = promptFor('guided', {
      ...base,
      tick,
      state: { ...base.state!, fio2: 1 },
      actions: [{ tick: tick - 10, type: 'ventilator', payload: { fio2: 1 } }],
    }, shown);
    expect(explained?.assistanceLevel).toBe('explain');
  });

  it('Scenario: Guidance level never alters the patient', async () => {
    // The same transcript replayed under each level gives an identical state
    // trace, because guidance is not an input to the engine at all.
    const actions: LearnerAction[] = [
      { tick: 0, type: 'ventilator', payload: { fio2: 1.0 } },
      { tick: 1200, type: 'bolus', payload: { drugId: 'propofol', amount: 130, unit: 'mg' } },
      { tick: 1300, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } },
    ];
    const options = { scenario: ROUTINE_INDUCTION, seed: 4242, practiceRegion: 'GB', ticks: 2400 };
    const hashes = await Promise.all(['guided', 'coached', 'unassisted'].map(async () => {
      // Guidance is evaluated on the side; it never reaches `replay`.
      const history = replay(actions, options);
      return hashStateTrace(history.map((sample) => sample.state));
    }));
    expect(new Set(hashes).size).toBe(1);
  });

  it('every prompt says what to do AND why', () => {
    for (const candidate of PROMPTS) {
      expect(candidate.prompt.suggestion.length).toBeGreaterThan(20);
      expect(candidate.prompt.because.length).toBeGreaterThan(40);
    }
    expect(new Set(PROMPTS.map((c) => c.prompt.id)).size).toBe(PROMPTS.length);
  });

  it('makes every tutor rule versioned, reviewable, and resistant to spam', () => {
    for (const rule of PROMPTS) {
      expect(rule).toMatchObject({ schemaVersion: 1, version: '0.1.0', maturity: 'draft' });
      expect(rule.cooldownSeconds).toBeGreaterThanOrEqual(30);
      expect(rule.sourceId).toBe(rule.prompt.concept);
      expect(rule.triggerId).toMatch(/^[a-z0-9-]+$/);
      expect(rule.objectiveId).toMatch(/^[a-z0-9-]+$/);
      expect(rule.applicability.length).toBeGreaterThan(20);
      expect(rule.prerequisiteObservations.length).toBeGreaterThan(0);
      expect(rule.suppressionConditions).toContain('any active alarm');
    }
    expect(new Set(PROMPTS.map((rule) => rule.assistanceLevel)))
      .toEqual(new Set(['orient', 'notice', 'connect', 'prioritize', 'direct', 'explain']));
  });
});
