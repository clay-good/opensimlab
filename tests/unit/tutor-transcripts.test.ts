import { describe, expect, it } from 'vitest';
import { replay } from '@anesthesia/debrief/replay-engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { TUTOR_RULES, type GuidanceInput, type TutorRule } from '@anesthesia/tutor/guidance';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { hashStateTrace } from '@platform/transcript/hash';
import type { LearnerAction } from '@platform/kernel/protocol';

const at = (seconds: number) => seconds * TICKS_PER_SECOND;

interface TutorTranscriptFixture {
  readonly kind: 'expert' | 'common-error' | 'recovery';
  readonly actions: readonly LearnerAction[];
}

const FIXTURES: readonly TutorTranscriptFixture[] = [
  {
    kind: 'expert',
    actions: [
      { tick: at(5), type: 'ventilator', payload: { fio2: 1 } },
      { tick: at(240), type: 'bolus', payload: { drugId: 'propofol', amount: 130, unit: 'mg' } },
      { tick: at(255), type: 'ventilator', payload: { fio2: 1, delivering: true, mode: 'volume-control' } },
    ],
  },
  {
    kind: 'common-error',
    actions: [
      { tick: at(140), type: 'bolus', payload: { drugId: 'propofol', amount: 200, unit: 'mg' } },
      { tick: at(145), type: 'bolus', payload: { drugId: 'remifentanil', amount: 150, unit: 'µg' } },
    ],
  },
  {
    kind: 'recovery',
    actions: [
      { tick: at(120), type: 'ventilator', payload: { fio2: 1 } },
      { tick: at(180), type: 'bolus', payload: { drugId: 'propofol', amount: 150, unit: 'mg' } },
      { tick: at(185), type: 'bolus', payload: { drugId: 'remifentanil', amount: 100, unit: 'µg' } },
      { tick: at(220), type: 'ventilator', payload: { fio2: 1, delivering: true, mode: 'volume-control' } },
      { tick: at(225), type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 } },
      { tick: at(230), type: 'vasopressor', payload: { effect: 1 } },
    ],
  },
];

const OPTIONS = { scenario: ROUTINE_INDUCTION, seed: 20260824, practiceRegion: 'US', ticks: at(420) };

function inputsFor(fixture: TutorTranscriptFixture): GuidanceInput[] {
  return replay(fixture.actions, OPTIONS).map((sample) => ({
    tick: sample.tick,
    state: sample.state,
    actions: fixture.actions.filter((action) => action.tick < sample.tick),
    ventilating: (sample.state.respiratoryRateBpm ?? 0) > 0,
    alarmCount: 0,
  }));
}

function applicableInputs(rule: TutorRule, inputs: readonly GuidanceInput[]): GuidanceInput[] {
  return inputs.filter((input) => (
    input.tick >= rule.afterSeconds * TICKS_PER_SECOND && rule.applies(input)
  ));
}

function sampleAt(inputs: readonly GuidanceInput[], seconds: number): GuidanceInput {
  return inputs.reduce((nearest, input) => (
    Math.abs(input.tick - at(seconds)) < Math.abs(nearest.tick - at(seconds)) ? input : nearest
  ));
}

describe('Requirement: Tutor claims are true in deterministic transcripts', () => {
  const fixtures = new Map(FIXTURES.map((fixture) => [fixture.kind, inputsFor(fixture)]));

  it('replays every authored fixture deterministically', async () => {
    for (const fixture of FIXTURES) {
      const first = replay(fixture.actions, OPTIONS);
      const second = replay(fixture.actions, OPTIONS);
      expect(await hashStateTrace(first.map((sample) => sample.state)), fixture.kind)
        .toBe(await hashStateTrace(second.map((sample) => sample.state)));
    }
  });

  it('grounds every rule in at least one expert, common-error, or recovery trace', () => {
    for (const rule of TUTOR_RULES) {
      const supportingFixtures = [...fixtures.entries()]
        .filter(([, inputs]) => applicableInputs(rule, inputs).length > 0)
        .map(([kind]) => kind);
      expect(supportingFixtures.length, `${rule.prompt.id} has no deterministic supporting trace`)
        .toBeGreaterThan(0);
    }
  });

  it('keeps the expert path free of low-oxygen prompts and explains the observed oxygen action', () => {
    const expert = fixtures.get('expert')!;
    for (const rule of TUTOR_RULES.filter((candidate) => candidate.triggerId === 'pre-induction-low-fio2')) {
      expect(applicableInputs(rule, expert), rule.prompt.id).toHaveLength(0);
    }
    const explanation = TUTOR_RULES.find((rule) => rule.prompt.id === 'preoxygenate-explain')!;
    expect(applicableInputs(explanation, expert).length).toBeGreaterThan(0);

    const early = sampleAt(expert, 5).state?.endTidalO2Fraction ?? 0;
    const prepared = sampleAt(expert, 180).state?.endTidalO2Fraction ?? 0;
    expect(prepared).toBeGreaterThan(early);
    expect(prepared).toBeGreaterThan(0.85);
  });

  it('shows every common-error trigger only when its named observation is present', () => {
    const rushed = fixtures.get('common-error')!;
    for (const rule of TUTOR_RULES.filter((candidate) => candidate.prompt.id !== 'preoxygenate-explain')) {
      const matches = applicableInputs(rule, rushed);
      expect(matches.length, rule.prompt.id).toBeGreaterThan(0);
      for (const input of matches) {
        if (rule.triggerId === 'pre-induction-low-fio2') expect(input.state?.fio2).toBeLessThan(0.8);
        if (rule.triggerId === 'apnea-after-bolus') expect(input.state?.respiratoryRateBpm).toBe(0);
        if (rule.triggerId === 'map-below-60') expect(input.state?.meanArterialMmHg).toBeLessThan(60);
        if (rule.triggerId === 'recent-bolus') {
          const lastBolus = input.actions.filter((action) => action.type === 'bolus').at(-1)!;
          expect(input.tick - lastBolus.tick).toBeLessThan(at(100));
        }
      }
    }
  });

  it('turns every recovery-path observation off after an observable correction', () => {
    const recovery = fixtures.get('recovery')!;
    const resolvedTriggers = new Set<string>();
    for (const rule of TUTOR_RULES) {
      const firstMatch = recovery.findIndex((input) => (
        input.tick >= rule.afterSeconds * TICKS_PER_SECOND && rule.applies(input)
      ));
      if (firstMatch < 0) continue;
      expect(
        recovery.slice(firstMatch + 1).some((input) => !rule.applies(input)),
        `${rule.prompt.id} never resolves after recovery`,
      ).toBe(true);
      resolvedTriggers.add(rule.triggerId);
    }
    expect(resolvedTriggers).toEqual(new Set([
      'pre-induction-low-fio2', 'preoxygenation-established', 'recent-bolus',
      'apnea-after-bolus', 'map-below-60',
    ]));
  });

  it('shows the effect site still rising during the authored wait window', () => {
    const rushed = FIXTURES.find((fixture) => fixture.kind === 'common-error')!;
    const history = replay(rushed.actions, OPTIONS);
    const concentrationAt = (seconds: number) => history.reduce((nearest, sample) => (
      Math.abs(sample.tick - at(seconds)) < Math.abs(nearest.tick - at(seconds)) ? sample : nearest
    )).concentrations.find((entry) => entry.drugId === 'propofol')?.effectSite ?? 0;
    expect(concentrationAt(170)).toBeGreaterThan(concentrationAt(145));
  });

  it('shows saturation falling faster after it crosses 90% in the unventilated error trace', () => {
    const rushed = fixtures.get('common-error')!;
    const firstBelow = (threshold: number) => rushed.find((input) => (
      (input.state?.spo2Percent ?? 100) < threshold
    ))?.tick;
    const below98 = firstBelow(98);
    const below90 = firstBelow(90);
    const below80 = firstBelow(80);
    expect(below98).toBeDefined();
    expect(below90).toBeDefined();
    expect(below80).toBeDefined();
    expect(below80! - below90!).toBeLessThan(below90! - below98!);
  });
});
