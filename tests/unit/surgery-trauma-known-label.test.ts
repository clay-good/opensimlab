import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { KNOWN_LABEL_AN_EXPLANATION_THAT_EXCLUDES_NOTHING as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/known-label-an-explanation-that-excludes-nothing';
import { KNOWN_LABEL_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/known-label-fixtures';
import { KnownLabel } from '../../src/modules/surgery-trauma/known-label';
import { KNOWN_LABEL_HANDOVER_TICKS as HANDOVER, KNOWN_LABEL_TEAM_TICKS as TEAM, KNOWN_LABEL_TAKEOVER_TICKS as STOP, KNOWN_LABEL_ACTIONS, type KnownLabelAction } from '../../src/modules/surgery-trauma/known-label';

type Choices = readonly (readonly [number, KnownLabelAction])[];

function drive(actions: Choices, until: number) {
  const model = new KnownLabel();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Surgery and trauma known-label contract', () => {
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

  it('holds every observation still, before and after the shift change', () => {
    for (const until of [10, HANDOVER + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations']], until);
      expect(run.snapshot.observationRecord).toMatchObject({
        heartRateBpm: 104, systolicMmHg: 138, respiratoryRateBpm: 18, coreTemperatureC: 37.1,
      });
    }
    expect(drive([], HANDOVER + 20).model.vitals()).toEqual(new KnownLabel().vitals());
  });

  // The only authored beat changes who is in the room. Nothing about the patient moves, and
  // the examination is never achieved by the passage of time.
  it('changes only who is in the room', () => {
    const before = drive([], 10).snapshot;
    expect(before.informantPresent).toBe(true);
    expect(before.carerLeft).toBe(false);
    const run = drive([[0, 'record-the-label-and-what-it-explains']], HANDOVER + 20);
    expect(run.ids).toContain('carer-left');
    expect(run.snapshot.informantPresent).toBe(false);
    expect(run.snapshot.examinationAchieved).toBe(false);
    expect(run.snapshot.labelPresent).toBe(true);
    expect(drive([[0, 'check-behaviour-record']], TEAM + 10).snapshot.behaviourRecord!.examinationAchieved).toBe(false);
  });

  it('records the label as an explanation rather than as a finding from today', () => {
    const text = drive([[0, 'record-the-label-and-what-it-explains']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('almost certainly still true');
    expect(text).toContain('leaves nothing for anybody to be curious about');
  });

  // The account is worth less once its author has gone, and the engine says so.
  it('records the informant account as worth less once she has left', () => {
    const early = drive([[0, 'record-what-has-changed-according-to-someone-who-knows-him']], 10).snapshot.choiceFeedback!;
    expect(early).toContain('while she is still here');
    const late = drive([[HANDOVER + 10, 'record-what-has-changed-according-to-someone-who-knows-him']], HANDOVER + 20).snapshot.choiceFeedback!;
    expect(late).toContain('worth less than it would have been');
  });

  it('records what a true label cannot exclude', () => {
    const text = drive([[0, 'record-what-the-label-cannot-exclude']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('11.04');
    expect(text).toContain('98.7 percent');
    expect(text).toContain('not competing explanations');
  });

  it('keeps the source whose strongest finding backs the label', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('betting on the label is a good bet');
    expect(text).toContain('p equals 0.006');
    expect(text).toContain('being usually right is exactly how a label stops anybody looking');
  });

  it('refuses the baseline, the label, the assessment excuse, and the treatment trial', () => {
    const baseline = drive([[0, 'this-is-his-baseline-behaviour']], 10);
    expect(baseline.ids).toContain('baseline-claim-refused');
    expect(baseline.snapshot.choiceFeedback).toContain('usual is precisely the thing you do not have access to and she does');
    const label = drive([[0, 'the-notes-say-chronic-constipation']], 10);
    expect(label.ids).toContain('label-claim-refused');
    expect(label.snapshot.choiceFeedback).toContain('Nobody is disputing it');
    const assess = drive([[0, 'he-cannot-tell-us-where-it-hurts-so-we-cannot-assess-him']], 10);
    expect(assess.ids).toContain('cannot-assess-refused');
    expect(assess.snapshot.choiceFeedback).toContain('converts an adjustment nobody made into a property of the patient');
    const laxative = drive([[0, 'give-him-something-for-his-bowels-and-review']], 10);
    expect(laxative.ids).toContain('laxative-trial-refused');
    expect(laxative.snapshot.choiceFeedback).toContain('what is refused is using it as the test');
  });

  // The lesson collapses if anything ever says the constipation is absent. It is true, it
  // stays true, and the whole difficulty is that a true label still excludes nothing.
  //
  // The guards here are assertion-voice phrases rather than bare nouns, because the prose
  // repeatedly *negates* this claim — the escalation text says "no suggestion is made that the
  // constipation is absent" — and a substring guard on the noun phrase matches the denial.
  it('never asserts that the label is wrong, after any action', () => {
    for (const action of KNOWN_LABEL_ACTIONS) {
      const text = (drive([[0, action]], HANDOVER + 20).snapshot.choiceFeedback ?? '').toLowerCase();
      for (const claim of ['he is not constipated', 'he does not have constipation',
        'the label is wrong', 'the constipation has resolved', 'rule out the constipation']) {
        expect(text, `${action} carried "${claim}"`).not.toContain(claim);
      }
    }
    // And the escalation says so out loud, which is the half a negation-blind guard would miss.
    expect(drive([[0, 'escalate-to-the-surgical-team']], 10).snapshot.choiceFeedback)
      .toContain('No suggestion is made that the constipation is absent');
  });

  it('never sends a surgical team that nobody asked, and answers slowly when asked', () => {
    const idle = drive([[0, 'record-the-label-and-what-it-explains']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const asked = drive([[0, 'escalate-to-the-surgical-team']], TEAM + 10);
    expect(asked.ids).toContain('team-responded');
    // The handover must land first: waiting for the reply is never what preserves the account.
    expect(HANDOVER).toBeLessThan(TEAM);
    expect(TEAM).toBe(35 * 60 * 10);
    expect(STOP).toBe(150 * 60 * 10);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-label-and-what-it-explains'], [1, 'record-what-has-changed-according-to-someone-who-knows-him'],
      [2, 'record-what-the-label-cannot-exclude'], [3, 'escalate-to-the-surgical-team'],
      [4, 'record-bounded-adjustment-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [HANDOVER + 20, 'handoff']];
    expect(drive(stale, HANDOVER + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 21030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 21040);
    expect(recovered.snapshot.baselineClaimAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover', () => {
    expect(HANDOVER).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('carer-left');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 10 } });
    engine.apply({ tick: 0, type: 'deferred-step-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'known-label-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'known-label-response', payload: { action: 'examine-the-abdomen' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('known-label-generic-action-refused');
    expect(ids).toContain('known-label-action-refused');
    expect(frame.equipment.resuscitation.knownLabel!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, investigation, or competing diagnosis after ANY action', () => {
    const forbidden = ['morphine', 'macrogol', 'senna', 'enema', 'mg/kg', 'milligram',
      'obstruction', 'perforation', 'volvulus'];
    for (const action of KNOWN_LABEL_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'known-label-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.knownLabel!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(KNOWN_LABEL_ACTIONS).size).toBe(KNOWN_LABEL_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
