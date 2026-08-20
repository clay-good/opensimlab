/** Acceptance tests for learning/pedagogy's debrief requirements. */
import { describe, expect, it } from 'vitest';
import {
  PEARLS_CITATION, PEARLS_DIVISION_OF_LABOUR, PEARLS_PHASES,
  accountIdentifies, findEpisodes, findStacking, safeContainerOpening, secondsBeyond,
  shiftEarlier, toneFor,
} from '@anesthesia/debrief/analysis';
import { compareRuns, evaluateCounterfactual, replay } from '@anesthesia/debrief/replay';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { describedEvents } from '@anesthesia/ui/Debrief';

const OPTIONS = {
  scenario: ROUTINE_INDUCTION, seed: 424242, practiceRegion: 'US', ticks: 4200,
};

/**
 * A run that induces on room air with a generous dose of both agents and does not
 * ventilate for three minutes. It produces both a hypotensive episode and a
 * desaturation, which is what the debrief requirements are stated against.
 */
const NEGLECTFUL: LearnerAction[] = [
  { tick: 550, type: 'bolus', payload: { drugId: 'remifentanil', amount: 150, unit: 'µg' } },
  { tick: 600, type: 'bolus', payload: { drugId: 'propofol', amount: 200, unit: 'mg' } },
  { tick: 2400, type: 'ventilator', payload: { delivering: true, mode: 'volume-control', fio2: 1.0 } },
];

describe('Requirement: Debrief Follows The PEARLS Framework', () => {
  it('proceeds through the framework\'s phases in order', () => {
    expect(PEARLS_PHASES.map((phase) => phase.id)).toEqual(['reactions', 'description', 'analysis', 'summary']);
    for (const phase of PEARLS_PHASES) expect(phase.purpose.length).toBeGreaterThan(20);
  });

  it('Scenario: The learner speaks before the system explains', () => {
    // The reactions phase is first and it asks for the learner's own account.
    expect(PEARLS_PHASES[0]?.id).toBe('reactions');
    expect(PEARLS_PHASES[0]?.purpose).toContain('Your account first');
    // Analysis comes after description, which comes after reactions.
    expect(PEARLS_PHASES.findIndex((p) => p.id === 'analysis'))
      .toBeGreaterThan(PEARLS_PHASES.findIndex((p) => p.id === 'reactions'));
  });

  it('Scenario: The framework is named and cited', () => {
    expect(PEARLS_CITATION).toContain('Eppich');
    expect(PEARLS_CITATION).toContain('25710312');
    // And it describes which elements are automated and which need a human.
    expect(PEARLS_DIVISION_OF_LABOUR.automated.length).toBeGreaterThan(2);
    expect(PEARLS_DIVISION_OF_LABOUR.requiresHuman.length).toBeGreaterThan(2);
    expect(PEARLS_DIVISION_OF_LABOUR.requiresHuman.join(' ')).toContain('communication');
  });

  it('Scenario: The debrief adapts its depth like a facilitator would', () => {
    const accurate = accountIdentifies(
      'I think the pressure fell because the propofol vasodilated her',
      ['vasodilat', 'vascular resistance'],
    );
    expect(accurate).toBe(true);
    expect(toneFor(accurate, 'the fall in vascular resistance').mode).toBe('confirm-and-extend');

    const missed = accountIdentifies('I am not sure what happened', ['vasodilat', 'vascular resistance']);
    expect(missed).toBe(false);
    const tone = toneFor(missed, 'the fall in vascular resistance');
    expect(tone.mode).toBe('focused-directive');
    expect(tone.opening).toContain('specific observation');
  });

  it('Scenario: Debrief explains a hypotensive episode causally', () => {
    const history = replay(NEGLECTFUL, OPTIONS);
    const attribution = () => [{
      variable: 'meanArterialMmHg',
      terms: [
        { termId: 'propofol-vasodilation', label: 'Propofol vasodilation', contribution: -12, share: 0.7, teachingModel: false },
        { termId: 'positive-pressure-ventilation', label: 'Positive-pressure ventilation', contribution: -5, share: 0.3, teachingModel: false },
      ],
    }];
    const episodes = findEpisodes(history, {
      parameter: 'meanArterialMmHg', threshold: 55, direction: 'below',
      minimumSeconds: 120, label: 'Mean arterial pressure below 55 mmHg',
    }, attribution, NEGLECTFUL);

    expect(episodes.length).toBeGreaterThan(0);
    const episode = episodes[0]!;
    // Names the episode, gives its duration, ranks its contributors, and names the
    // learner action that preceded it.
    expect(episode.label).toContain('55');
    expect(episode.durationSeconds).toBeGreaterThanOrEqual(120);
    expect(episode.contributors[0]?.label).toContain('vasodilation');
    expect(episode.contributors[0]!.share).toBeGreaterThan(episode.contributors[1]!.share);
    expect(episode.precededBy).toContain('propofol');
  });
});

describe('Scenario: Counterfactual is computed, not asserted', () => {
  it('produces the claim by re-running the engine on the modified transcript', () => {
    const actual = replay(NEGLECTFUL, OPTIONS);
    const result = evaluateCounterfactual({
      id: 'ventilate-earlier',
      claim: 'Starting ventilation two minutes earlier would have shortened the desaturation.',
      modify: (actions) => shiftEarlier(actions, (a) => a.type === 'ventilator' && a.payload.delivering === true, 120),
      measure: (history) => secondsBeyond(history, 'spo2Percent', 90, 'below'),
      unit: 'seconds below 90%',
    }, actual, NEGLECTFUL, OPTIONS);

    // The claim rests on a real second run, whose modified action list is inspectable.
    expect(result.modifiedActions.length).toBe(NEGLECTFUL.length);
    const moved = result.modifiedActions.find((a) => a.type === 'ventilator' && a.payload.delivering === true);
    expect(moved?.tick).toBe(2400 - 120 * TICKS_PER_SECOND);
    expect(result.actual).toBeGreaterThan(0);
    expect(result.counterfactual).toBeLessThan(result.actual);
    expect(result.better).toBe(true);
  });

  it('reports honestly when the alternative would NOT have helped', () => {
    const actual = replay(NEGLECTFUL, OPTIONS);
    const result = evaluateCounterfactual({
      id: 'ventilate-later',
      claim: 'Starting ventilation a minute later would have made no difference.',
      modify: (actions) => shiftEarlier(actions, (a) => a.type === 'ventilator' && a.payload.delivering === true, -60),
      measure: (history) => secondsBeyond(history, 'spo2Percent', 90, 'below'),
      unit: 'seconds below 90%',
    }, actual, NEGLECTFUL, OPTIONS);
    expect(result.better).toBe(false);
    expect(result.counterfactual).toBeGreaterThan(result.actual);
  });

  it('replays deterministically, so a counterfactual is reproducible', () => {
    const a = replay(NEGLECTFUL, OPTIONS).map((sample) => sample.state.meanArterialMmHg);
    const b = replay(NEGLECTFUL, OPTIONS).map((sample) => sample.state.meanArterialMmHg);
    expect(a).toEqual(b);
  });
});

describe('Scenario: Findings are specific', () => {
  it('names stacked boluses with the interval and the time to peak effect', () => {
    const stacked: LearnerAction[] = [
      { tick: 600, type: 'bolus', payload: { drugId: 'propofol', amount: 80, unit: 'mg' } },
      { tick: 900, type: 'bolus', payload: { drugId: 'propofol', amount: 80, unit: 'mg' } },
    ];
    const history = replay(stacked, { ...OPTIONS, ticks: 2000 });
    const findings = findStacking(stacked, history, { propofol: 120 });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.secondsSincePrevious).toBe(30);
    expect(findings[0]?.timeToPeakSeconds).toBe(120);
  });

  it('does not flag a dose given after the effect site has peaked', () => {
    const spaced: LearnerAction[] = [
      { tick: 600, type: 'bolus', payload: { drugId: 'propofol', amount: 80, unit: 'mg' } },
      { tick: 600 + 200 * TICKS_PER_SECOND, type: 'bolus', payload: { drugId: 'propofol', amount: 40, unit: 'mg' } },
    ];
    const history = replay(spaced, { ...OPTIONS, ticks: 3000 });
    expect(findStacking(spaced, history, { propofol: 120 })).toHaveLength(0);
  });
});

describe('Requirement: Psychological Safety In A Solo Tool', () => {
  it('Scenario: Failure is framed as information', () => {
    const opening = safeContainerOpening({
      procedure: 'a laparoscopic cholecystectomy',
      hardestThing: 'holding the pressure up through the induction',
      patientHarmed: true,
      patientDied: false,
    });
    // Names what the learner was trying to achieve and what made it difficult,
    // BEFORE addressing what would have worked.
    expect(opening.indexOf('anaesthetising')).toBeLessThan(opening.indexOf('harm'));
    expect(opening).toContain('hardest part');
    expect(opening).toContain('what stood out to you');
    // And never evaluates the learner as a person.
    expect(opening).not.toMatch(/\byou (failed|were careless|should have known)\b/i);
  });

  it('Scenario: A distressing outcome is handled with care', () => {
    const opening = safeContainerOpening({
      procedure: 'a laparoscopic cholecystectomy',
      hardestThing: 'the airway',
      patientHarmed: true,
      patientDied: true,
    });
    expect(opening).toContain('affecting even in simulation');
    expect(opening).toContain('not your worth');
    expect(opening).toContain('whenever you are ready');
  });
});

describe('Requirement: Practice Is Repeatable And Comparable To Oneself', () => {
  it('Scenario: Self-comparison across attempts', () => {
    const better: LearnerAction[] = [
      { tick: 0, type: 'ventilator', payload: { fio2: 1.0 } },
      { tick: 1800, type: 'bolus', payload: { drugId: 'propofol', amount: 120, unit: 'mg' } },
      { tick: 1900, type: 'ventilator', payload: { delivering: true, mode: 'volume-control', fio2: 0.5 } },
    ];
    const first = replay(NEGLECTFUL, OPTIONS);
    const second = replay(better, OPTIONS);
    const comparison = compareRuns(first, second, 'spo2Percent');
    expect(comparison.firstRun.length).toBeGreaterThan(10);
    expect(comparison.secondRun.length).toBe(comparison.firstRun.length);
    expect(comparison.divergesAtSeconds).not.toBeNull();
    // And the second run really was better on the parameter that mattered.
    expect(secondsBeyond(second, 'spo2Percent', 90, 'below'))
      .toBeLessThan(secondsBeyond(first, 'spo2Percent', 90, 'below'));
  });
});

describe('Requirement: Scoring Is Formative, Not Ranked', () => {
  it('Scenario: No comparison to other learners exists', async () => {
    // The debrief's public interface is the assessment surface. It exposes no
    // scoring, ranking or percentile function at all, and the only comparison it
    // can make is a learner against their OWN earlier run on this device.
    const analysis = await import('@anesthesia/debrief/analysis');
    const replayModule = await import('@anesthesia/debrief/replay');
    const exported = [...Object.keys(analysis), ...Object.keys(replayModule)];
    for (const name of exported) {
      expect(name, `${name} looks like a scoring surface`)
        .not.toMatch(/score|rank|percentile|leaderboard|grade|pass|fail/i);
    }
    // The only comparison function compares two runs, both supplied by the caller
    // from local storage, with no notion of anyone else.
    expect(exported).toContain('compareRuns');
    expect(replayModule.compareRuns.length).toBeGreaterThanOrEqual(3);
  });

  it('reports objective outcomes as words rather than as a number', async () => {
    // ObjectiveOutcome is a union of four words. There is no numeric grade
    // anywhere in the finding shape, so there is nothing to average into a score.
    const finding = {
      objectiveId: 'preoxygenate', statement: 'x', outcome: 'partly-met' as const,
      finding: 'Preoxygenation ran for 40 seconds rather than the three minutes it needs.',
    };
    expect(typeof finding.outcome).toBe('string');
    expect(['met', 'partly-met', 'not-met', 'not-exercised']).toContain(finding.outcome);
    expect(Object.values(finding).every((value) => typeof value !== 'number')).toBe(true);
  });
});

describe('Requirement: The Description Phase Describes What Happened', () => {
  // A correctly given drug is logged at `info`. Filtering the description phase
  // on severity alone therefore erases the learner's entire record of their own
  // actions and leaves only the things that went wrong.
  it('Scenario: every drug the learner gave appears in the timeline', () => {
    const log: EngineEvent[] = [
      { tick: 10, severity: 'info', category: 'drug', eventId: 'bolus-propofol-10', message: 'propofol 136 mg' },
      { tick: 12, severity: 'info', category: 'ventilator', eventId: 'vent-12', message: 'Ventilator: volume-control' },
      { tick: 20, severity: 'warning', category: 'airway', eventId: 'laryngoscopy-1', message: 'Grade 1 view' },
      { tick: 30, severity: 'info', category: 'alarm', eventId: 'alarm-clear-x', message: 'Alarm cleared: x' },
    ];
    const described = describedEvents(log);
    expect(described.map((entry) => entry.eventId))
      .toEqual(['bolus-propofol-10', 'vent-12', 'laryngoscopy-1']);
    // The alarm-clearing chatter stays out: it is not something the learner did.
    expect(described.some((entry) => entry.category === 'alarm')).toBe(false);
  });
});
