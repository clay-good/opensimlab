import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { RISING_REQUIREMENT_A_NUMBER_THAT_UNDER_CALLS as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/rising-requirement-a-number-that-under-calls';
import { RISING_REQUIREMENT_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/rising-requirement-fixtures';
import { RisingRequirement } from '../../src/modules/surgery-trauma/rising-requirement';
import { RISING_REQUIREMENT_WORSENING_TICKS as WORSE, RISING_REQUIREMENT_TEAM_TICKS as TEAM, RISING_REQUIREMENT_TAKEOVER_TICKS as STOP, RISING_REQUIREMENT_ACTIONS, type RisingRequirementAction } from '../../src/modules/surgery-trauma/rising-requirement';

type Choices = readonly (readonly [number, RisingRequirementAction])[];

function drive(actions: Choices, until: number) {
  const model = new RisingRequirement();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Surgery and trauma rising-requirement contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'surgery-trauma', 'ward', 'state_transition');
    expect(audit.requirements.find((entry) => entry.id === 'guidance-and-demonstration')?.status)
      .toBe('satisfied');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // Everything a monitor shows stays normal, and the artery stays open, in every state. If
  // either drifted the lesson would collapse into an ordinary deterioration.
  it('holds the observations and the pulse normal in every state', () => {
    for (const until of [10, WORSE + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-limb-record']], until);
      expect(run.snapshot.pulsePresent).toBe(true);
      expect(run.snapshot.singlePressureMmHg).toBe(34);
      expect(run.snapshot.limbRecord!.immobilised).toBe(true);
      expect(run.model.vitals()).toEqual(new RisingRequirement().vitals());
    }
  });

  it('moves only the requirement and the clock', () => {
    const before = drive([], 10).snapshot;
    expect([before.hoursSinceInjury, before.analgesiaRequests]).toEqual([8, 3]);
    const run = drive([[0, 'record-the-injury-and-the-clock']], WORSE + 20);
    expect(run.ids).toContain('requirement-risen-again');
    expect([run.snapshot.hoursSinceInjury, run.snapshot.analgesiaRequests]).toEqual([9, 4]);
    expect(run.model.vitals()).toEqual(new RisingRequirement().vitals());
  });

  it('records the requirement as a direction rather than a complaint', () => {
    const text = drive([[0, 'record-the-rising-requirement']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('a trajectory rather than a complaint');
    expect(text).toContain('needing more every hour is not');
  });

  it('states which way each measure fails', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('13 to 19 percent');
    expect(text).toContain('97 to 98 percent');
    expect(text).toContain('94 percent');
    expect(text).toContain('none of it is a licence to wait for a number');
  });

  it('refuses the artery, the cut-off, the comfort, and the wait', () => {
    const perfusion = drive([[0, 'pulses-are-present-so-perfusion-is-fine']], 10);
    expect(perfusion.ids).toContain('perfusion-claim-refused');
    expect(perfusion.snapshot.choiceFeedback).toContain('far below the pressure that closes that vessel');
    const threshold = drive([[0, 'the-pressure-was-below-the-threshold']], 10);
    expect(threshold.ids).toContain('threshold-claim-refused');
    expect(threshold.snapshot.choiceFeedback).toContain('53 of 116');
    // The objection is to deferring the decision, not to treating his pain.
    const analgesia = drive([[0, 'increase-analgesia-and-review-in-the-morning']], 10);
    expect(analgesia.ids).toContain('analgesia-refused');
    expect(analgesia.snapshot.choiceFeedback).toContain('Comfort is not the objection');
    const wait = drive([[0, 'wait-for-a-repeat-pressure-before-calling']], 10);
    expect(wait.ids).toContain('repeat-pressure-refused');
    expect(wait.snapshot.choiceFeedback).toContain('the interval spent obtaining it is the harm');
  });

  it('never sends a surgical team that nobody called, and answers faster than the first lesson', () => {
    const idle = drive([[0, 'record-the-injury-and-the-clock']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const called = drive([[0, 'escalate-to-the-surgical-team']], TEAM + 10);
    expect(called.ids).toContain('team-responded');
    // Twenty minutes, against sixty in the negative-scan lesson: what is escalated here is
    // time-critical rather than uncertain, and the authored reply says so.
    expect(TEAM).toBe(20 * 60 * 10);
    expect(STOP).toBe(90 * 60 * 10);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-injury-and-the-clock'], [1, 'record-the-rising-requirement'],
      [2, 'record-what-one-pressure-cannot-decide'], [3, 'escalate-to-the-surgical-team'],
      [4, 'record-bounded-decompression-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [WORSE + 20, 'handoff']];
    expect(drive(stale, WORSE + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 18020);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 18030);
    expect(recovered.snapshot.thresholdClaimAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover', () => {
    expect(WORSE).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('requirement-risen-again');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 10 } });
    engine.apply({ tick: 0, type: 'negative-scan-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'rising-requirement-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'rising-requirement-response', payload: { action: 'perform-fasciotomy' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('rising-requirement-generic-action-refused');
    expect(ids).toContain('rising-requirement-action-refused');
    expect(frame.equipment.resuscitation.risingRequirement!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, or procedure after ANY action', () => {
    const forbidden = ['morphine', 'ketamine', 'fentanyl', 'oxycodone', 'fasciotomy',
      'mannitol', 'mg/kg', 'milligram'];
    for (const action of RISING_REQUIREMENT_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'rising-requirement-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.risingRequirement!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(RISING_REQUIREMENT_ACTIONS).size).toBe(RISING_REQUIREMENT_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
