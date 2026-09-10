import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { UNSPOKEN_DOUBT_AN_INTERVAL_NOBODY_ELSE_CAN_SEE as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/unspoken-doubt-an-interval-nobody-else-can-see';
import { UNSPOKEN_DOUBT_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/unspoken-doubt-fixtures';
import { UnspokenDoubt } from '../../src/modules/surgery-trauma/unspoken-doubt';
import { UNSPOKEN_DOUBT_KNIFE_TICKS as KNIFE, UNSPOKEN_DOUBT_TEAM_TICKS as TEAM, UNSPOKEN_DOUBT_TAKEOVER_TICKS as STOP, UNSPOKEN_DOUBT_ACTIONS, type UnspokenDoubtAction } from '../../src/modules/surgery-trauma/unspoken-doubt';

type Choices = readonly (readonly [number, UnspokenDoubtAction])[];

function drive(actions: Choices, until: number) {
  const model = new UnspokenDoubt();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Surgery and trauma unspoken-doubt contract', () => {
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

  it('holds every observation still, before and after the knife is asked for', () => {
    for (const until of [10, KNIFE + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations']], until);
      expect(run.snapshot.observationRecord).toMatchObject({
        heartRateBpm: 78, systolicMmHg: 110, respiratoryRateBpm: 12, spo2Percent: 99,
      });
    }
    expect(drive([], KNIFE + 20).model.vitals()).toEqual(new UnspokenDoubt().vitals());
  });

  // Nothing is ever cut, nobody else ever raises it, and the discrepancy is never resolved.
  // If any of those changed the learner would be acting on knowledge rather than on doubt.
  it('never resolves the discrepancy, never cuts, and nobody else ever raises it', () => {
    for (const until of [10, KNIFE + 10, TEAM + 10, STOP - 10]) {
      const snapshot = drive([[0, 'check-checklist-record']], until).snapshot;
      expect(snapshot.consentSide).toBe('left');
      expect(snapshot.markedSide).toBe('left');
      expect(snapshot.imageLabelSide).toBe('right');
      expect(snapshot.raisedByAnyoneElse).toBe(false);
      expect(snapshot.incisionMade).toBe(false);
    }
  });

  it('states the observation without asserting an error', () => {
    const text = drive([[0, 'state-what-you-have-noticed']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('an observation about a discrepancy');
    expect(text).toContain('not a claim that anybody has made a mistake');
  });

  it('states the ways of being wrong as the thing that makes the interruption easy', () => {
    const text = drive([[0, 'state-what-would-make-you-wrong']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('All of those are likely');
    expect(text).toContain('saying it first is what makes the interruption easy');
  });

  it('states the asymmetry as the calculation that settles it', () => {
    const text = drive([[0, 'state-the-cost-of-each-mistake']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('about ninety seconds');
    expect(text).toContain('the other side of a person');
    expect(text).toContain('what makes the decision small');
  });

  // The module's habit, applied to itself: the review that doubts this exercise is carried.
  it('keeps the review that doubts exercises like this one', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('73 percent of the variance');
    expect(text).toContain('education alone changes deeply rooted speaking-up behaviour');
    expect(text).toContain('That last one is about exercises like this one, and it is included rather than left out');
  });

  it('refuses the senior, the self-doubt, the afterwards, and the quiet word', () => {
    const senior = drive([[0, 'wait-until-someone-more-senior-notices']], 10);
    expect(senior.ids).toContain('wait-for-senior-refused');
    expect(senior.snapshot.choiceFeedback).toContain('seniority is not a queue for observations');
    const self = drive([[0, 'you-are-probably-misreading-it']], 10);
    expect(self.ids).toContain('self-doubt-refused');
    expect(self.snapshot.choiceFeedback).toContain('a reason to check rather than a reason to be quiet');
    const after = drive([[0, 'mention-it-afterwards']], 10);
    expect(after.ids).toContain('afterwards-refused');
    expect(after.snapshot.choiceFeedback).toContain('turns a ninety-second re-check into an incident report');
    const quiet = drive([[0, 'ask-a-colleague-quietly-first']], 10);
    expect(quiet.ids).toContain('quiet-ask-refused');
    expect(quiet.snapshot.choiceFeedback).toContain('costs the interval twice');
  });

  // The room's generosity is the finding, and it only happens if the learner speaks.
  it('never answers a learner who has not spoken, and stops without complaint when they do', () => {
    const silent = drive([[0, 'state-what-you-have-noticed']], TEAM + 6000);
    expect(silent.ids).not.toContain('team-responded');
    const spoke = drive([[0, 'say-it-before-the-incision']], TEAM + 10);
    expect(spoke.ids).toContain('team-responded');
    expect(spoke.snapshot.choiceFeedback ?? '').not.toContain('annoyed');
    // The shortest intervals in the module: the whole lesson lives inside a minute. The knife
    // must come before any reply could, or a learner who speaks at once never sees the interval
    // being spent — which is the beat the lesson is built around.
    expect(KNIFE).toBe(25 * 10);
    expect(TEAM).toBe(40 * 10);
    expect(KNIFE).toBeLessThan(TEAM);
    expect(STOP).toBe(10 * 60 * 10);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'state-what-you-have-noticed'], [1, 'state-what-would-make-you-wrong'],
      [2, 'state-the-cost-of-each-mistake'], [3, 'say-it-before-the-incision'],
      [4, 'record-bounded-team-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [KNIFE + 20, 'handoff']];
    expect(drive(stale, KNIFE + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 1030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 1040);
    expect(recovered.snapshot.waitForSeniorAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  // Takeover is bound to silence rather than to escalation, because in this lesson the
  // escalation IS the speaking, and a run in which nothing was said is the failure state.
  it('bounds a run in which nothing was said with takeover', () => {
    expect(KNIFE).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('knife-requested');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
    // Having spoken lifts the short takeover and gives the session an hour.
    const spoke = drive([[0, 'say-it-before-the-incision']], STOP + 10);
    expect(spoke.ids).not.toContain('instructor-takeover');
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 10 } });
    engine.apply({ tick: 0, type: 'known-label-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'unspoken-doubt-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'unspoken-doubt-response', payload: { action: 'stop-the-operation' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('unspoken-doubt-generic-action-refused');
    expect(ids).toContain('unspoken-doubt-action-refused');
    expect(frame.equipment.resuscitation.unspokenDoubt!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, or procedure after ANY action', () => {
    const forbidden = ['propofol', 'morphine', 'fentanyl', 'mg/kg', 'milligram', 'scalpel blade'];
    for (const action of UNSPOKEN_DOUBT_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'unspoken-doubt-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.unspokenDoubt!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  // Assertion-voice guards: the prose repeatedly says nobody has done anything wrong, so a
  // guard on the bare noun would match the denial.
  it('never asserts an error and never says the side is wrong', () => {
    for (const action of UNSPOKEN_DOUBT_ACTIONS) {
      const text = (drive([[0, action]], KNIFE + 20).snapshot.choiceFeedback ?? '').toLowerCase();
      for (const claim of ['the wrong side', 'they are about to operate on the wrong',
        'somebody has made an error', 'the consultant is wrong']) {
        expect(text, `${action} carried "${claim}"`).not.toContain(claim);
      }
    }
    expect(drive([[0, 'state-what-you-have-noticed']], 10).snapshot.choiceFeedback)
      .toContain('not a claim that anybody has made a mistake');
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(UNSPOKEN_DOUBT_ACTIONS).size).toBe(UNSPOKEN_DOUBT_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
