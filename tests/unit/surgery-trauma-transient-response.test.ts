import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { TRANSIENT_RESPONSE_A_PATIENT_WHO_WILL_NOT_STAY_UP as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/transient-response-a-patient-who-will-not-stay-up';
import { TRANSIENT_RESPONSE_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/transient-response-fixtures';
import { TransientResponse } from '../../src/modules/surgery-trauma/transient-response';
import { TRANSIENT_RESPONSE_FALL_TICKS as FALL, TRANSIENT_RESPONSE_TEAM_TICKS as TEAM, TRANSIENT_RESPONSE_TAKEOVER_TICKS as STOP, TRANSIENT_RESPONSE_ACTIONS, type TransientResponseAction } from '../../src/modules/surgery-trauma/transient-response';

type Choices = readonly (readonly [number, TransientResponseAction])[];

function drive(actions: Choices, until: number) {
  const model = new TransientResponse();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Surgery and trauma transient-response contract', () => {
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

  // This is the only lesson in the module whose monitored numbers move, and they move in the
  // reassuring direction first. If the fall arrived without a prior recovery there would be
  // nothing to misread, and the lesson would be about a patient who is obviously dying.
  it('moves its observations, and moves them the reassuring way first', () => {
    const before = drive([[0, 'check-observations']], 10).snapshot;
    expect(before.observationRecord).toMatchObject({ heartRateBpm: 112, systolicMmHg: 96, diastolicMmHg: 58 });
    expect(before.minutesSinceInjury).toBe(40);
    expect(before.fallen).toBe(false);
    expect(before.firstResponseHeldMinutes).toBeGreaterThan(before.secondResponseHeldMinutes);
    const after = drive([[FALL + 10, 'check-observations']], FALL + 20);
    expect(after.ids).toContain('pressure-fallen-again');
    expect(after.snapshot.observationRecord).toMatchObject({ heartRateBpm: 124, systolicMmHg: 84 });
    expect(after.snapshot.minutesSinceInjury).toBe(45);
  });

  // Nothing is ever added to the picture to justify the call. The pattern that was already on
  // the chart at tick zero is the whole of the evidence the learner ever gets.
  it('never adds a finding and never gives a third bolus', () => {
    const run = drive([], STOP - 10);
    expect(run.snapshot.bolusCount).toBe(2);
    expect(run.snapshot.freeFluidReported).toBe(true);
    expect(drive([[0, 'check-response-record']], TEAM + 10).snapshot.responseRecord!.bolusCount).toBe(2);
  });

  it('records the response as a shape rather than a reading', () => {
    const text = drive([[0, 'record-the-shape-of-the-response']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('as a shape rather than a reading');
    expect(text).toContain('each answer was smaller and arrived sooner than the last');
  });

  it('keeps the half of the evidence that argues for imaging', () => {
    const text = drive([[0, 'record-what-a-picture-cannot-do']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('4,621');
    expect(text).toContain('is not the enemy');
    expect(text).toContain('cannot do is stop bleeding');
  });

  it('reads the hazard ratio rather than the paper’s own summary sentence', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('0.35 percent a minute');
    expect(text).toContain('1.89');
    expect(text).toContain('describes 1.89 as almost threefold');
    expect(text).toContain('All three are retrospective');
  });

  it('refuses the return, the scanner, the third bolus, and the cross-match', () => {
    const stable = drive([[0, 'he-came-back-up-so-he-is-stable']], 10);
    expect(stable.ids).toContain('stability-claim-refused');
    expect(stable.snapshot.choiceFeedback).toContain('a statement about the volume you added');
    // The objection is to the interval and the room, never to imaging trauma patients.
    const scan = drive([[0, 'send-him-for-a-scan-before-calling']], 10);
    expect(scan.ids).toContain('scan-first-refused');
    expect(scan.snapshot.choiceFeedback).toContain('worth having in general');
    const litre = drive([[0, 'give-another-litre-and-see']], 10);
    expect(litre.ids).toContain('another-litre-refused');
    expect(litre.snapshot.choiceFeedback).toContain('nobody is objecting to the ones already given');
    const blood = drive([[0, 'wait-for-the-cross-matched-blood-before-calling']], 10);
    expect(blood.ids).toContain('wait-for-blood-refused');
    expect(blood.snapshot.choiceFeedback).toContain('at the same time as the call');
  });

  it('never sends a team that nobody called, and answers faster than any other lesson here', () => {
    const idle = drive([[0, 'record-the-mechanism-and-the-clock']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const called = drive([[0, 'escalate-to-the-theatre-team']], TEAM + 10);
    expect(called.ids).toContain('team-responded');
    // Eight minutes against the module's twenty, twenty-five and sixty, and a takeover at
    // forty-five against ninety and a hundred and eighty: here the harm is measured in minutes.
    expect(TEAM).toBe(8 * 60 * 10);
    expect(STOP).toBe(45 * 60 * 10);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-mechanism-and-the-clock'], [1, 'record-the-shape-of-the-response'],
      [2, 'record-what-a-picture-cannot-do'], [3, 'escalate-to-the-theatre-team'],
      [4, 'record-bounded-operative-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [FALL + 20, 'handoff']];
    expect(drive(stale, FALL + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 4830);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 4840);
    expect(recovered.snapshot.stabilityClaimAttempted).toBe(true);
    expect(recovered.snapshot.scanFirstAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover', () => {
    expect(FALL).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('pressure-fallen-again');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 10 } });
    engine.apply({ tick: 0, type: 'unfinished-survey-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'transient-response-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'transient-response-response', payload: { action: 'order-a-scan' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('transient-response-generic-action-refused');
    expect(ids).toContain('transient-response-action-refused');
    expect(frame.equipment.resuscitation.transientResponse!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent, dose, product, or operation after ANY action', () => {
    const forbidden = ['morphine', 'propofol', 'fentanyl', 'tranexamic', 'laparotomy',
      'thoracotomy', 'mg/kg', 'milligram', 'units of'];
    for (const action of TRANSIENT_RESPONSE_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'transient-response-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.transientResponse!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  // The lesson works only while nobody knows what is bleeding. Naming an injury would answer
  // the question the learner is meant to act without an answer to.
  it('never names an injury and never predicts what an operation would find', () => {
    for (const action of TRANSIENT_RESPONSE_ACTIONS) {
      const run = drive([[0, action]], FALL + 20);
      const text = (run.snapshot.choiceFeedback ?? '').toLowerCase();
      expect(text, action).not.toContain('splenic');
      expect(text, action).not.toContain('ruptured spleen');
      expect(text, action).not.toContain('liver laceration');
      expect(text, action).not.toContain('will find');
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(TRANSIENT_RESPONSE_ACTIONS).size).toBe(TRANSIENT_RESPONSE_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
