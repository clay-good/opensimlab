/** Acceptance tests for learning/pedagogy's guidance requirements. */
import { describe, expect, it } from 'vitest';
import { PROMPTS, promptFor, unpromptedOmissions, type GuidanceInput } from '@anesthesia/ui/guidance';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { replay } from '@anesthesia/debrief/replay';
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
    expect(prompt?.id).toBe('preoxygenate');
    expect(prompt?.suggestion.length).toBeGreaterThan(20);
    expect(prompt?.because.length).toBeGreaterThan(40);
    expect(prompt?.concept).toBe('preoxygenation-and-safe-apnea-time');
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

  it('does not repeat the same prompt inside its cooldown', () => {
    const shown = new Map([['preoxygenate', 700]]);
    expect(promptFor('guided', base, shown)).toBeNull();
    expect(promptFor('guided', { ...base, tick: 700 + 91 * TICKS_PER_SECOND }, shown)?.id).toBe('preoxygenate');
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
});
