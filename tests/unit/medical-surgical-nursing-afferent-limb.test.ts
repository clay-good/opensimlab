import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { AFFERENT_LIMB_A_THRESHOLD_MET_AND_A_CALL_NOT_MADE as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/afferent-limb-a-threshold-met-and-a-call-not-made';
import { AFFERENT_LIMB_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/afferent-limb-fixtures';
import { AfferentLimb, AFFERENT_LIMB_CRITERIA as CRITERIA,
  AFFERENT_LIMB_PRESSURE_TICKS as PRESSURE, AFFERENT_LIMB_ARRIVAL_TICKS as ARRIVAL,
  AFFERENT_LIMB_TAKEOVER_TICKS as STOP,
  AFFERENT_LIMB_ACTIONS, type AfferentLimbAction } from '../../src/modules/medical-surgical-nursing/afferent-limb';

type Choices = readonly (readonly [number, AfferentLimbAction])[];

function drive(actions: Choices, until: number) {
  const model = new AfferentLimb();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Nursing escalation threshold contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'medical-surgical-nursing', 'ward', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The threshold is met before anything happens: this is not a recognition lesson.
  it('starts with the criteria already met, and keeps them met', () => {
    expect(CRITERIA.filter((entry) => entry.met)).toHaveLength(3);
    for (const until of [10, PRESSURE + 10, STOP - 10]) {
      const run = drive([[0, 'check-criteria']], until);
      expect(run.snapshot.metCriteriaCount).toBe(3);
      expect(run.snapshot.policyThreshold).toBe(1);
      expect(run.snapshot.criteriaRecord!.metCount).toBe(3);
    }
  });

  it('never requires permission, and refuses to seek it', () => {
    const run = drive([[0, 'ask-permission-to-call']], 10);
    expect(run.ids).toContain('permission-refused');
    expect(run.snapshot.permissionSought).toBe(true);
    expect(run.snapshot.choiceFeedback).toContain('The criteria are the authorisation');
    // Seeking permission must not become a precondition for calling.
    const called = drive([[0, 'ask-permission-to-call'], [1, 'call-the-response-team']], 10);
    expect(called.ids).toContain('team-called');
    expect(called.snapshot.calledAtTick).toBe(1);
  });

  it('keeps the response team reachable however unsupportive the ward is', () => {
    const run = drive([[0, 'check-availability']], 10);
    const view = run.snapshot.availabilityRecord!;
    expect(view.responseTeamReachable).toBe(true);
    expect(view.coveringDoctorAvailable).toBe(false);
    expect(view.chargeNurseSupportive).toBe(false);
    expect(run.snapshot.choiceFeedback).toContain('reachable regardless of the rest');
  });

  it('raises the pressure without changing the patient', () => {
    const run = drive([[0, 'record-the-met-criteria']], PRESSURE + 10);
    expect(run.ids).toContain('pressure-applied');
    expect(run.snapshot.pressureApplied).toBe(true);
    expect(run.snapshot.metCriteriaCount).toBe(3);
    // Pressure only accrues while no call has been made.
    const calledEarly = drive([[0, 'call-the-response-team']], PRESSURE + 10);
    expect(calledEarly.ids).not.toContain('pressure-applied');
  });

  it('sends nobody to an uncalled patient', () => {
    const idle = drive([[0, 'record-the-met-criteria']], ARRIVAL + 60000);
    expect(idle.ids).not.toContain('team-arrived');
    expect(idle.snapshot.teamArrived).toBe(false);
    const called = drive([[0, 'call-the-response-team']], ARRIVAL + 10);
    expect(called.ids).toContain('team-arrived');
  });

  it('refuses a concern stated before there is anyone to state it to', () => {
    const early = drive([[0, 'state-the-concern-explicitly']], 10);
    expect(early.ids).toContain('statement-refused');
    expect(early.snapshot.concernStatedAtTick).toBeNull();
    expect(early.snapshot.choiceFeedback).toContain('not a concern stated to a person');
  });

  it('refuses the three social substitutions with sourced reasons', () => {
    const doctor = drive([[0, 'call-the-doctor-first']], 10);
    expect(doctor.ids).toContain('doctor-first-refused');
    expect(doctor.snapshot.choiceFeedback).toContain('three quarters of missed activations');
    const round = drive([[0, 'wait-for-the-ward-round']], 10);
    expect(round.ids).toContain('round-refused');
    const documented = drive([[0, 'document-and-wait']], 10);
    expect(documented.ids).toContain('documentation-refused');
    expect(documented.snapshot.choiceFeedback).toContain('Documentation is not escalation');
  });

  it('states the system findings without claiming they are causal', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('observational findings about systems');
    expect(text).toContain('none of them establishes that a given delay causes a given death');
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    // Reassessing before the team arrives and handing off after it does is genuinely stale:
    // the arrival changes what a full assessment would report.
    const stale: Choices = [[0, 'record-the-met-criteria'], [1, 'record-the-obstacles'],
      [2, 'call-the-response-team'], [3, 'state-the-concern-explicitly'],
      [4, 'review-boundaries'], [5, 'monitor'], [6, 'reassess'],
      [ARRIVAL + 20, 'handoff']];
    expect(drive(stale, ARRIVAL + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 6030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.arrivalObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 6040);
    expect(recovered.snapshot.permissionSought).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'record-the-met-criteria'], [5000, 'record-the-met-criteria']], 5010);
    expect(twice.ids.filter((id) => id === 'criteria-recorded')).toHaveLength(1);
    expect(twice.snapshot.criteriaRecordedAtTick).toBe(0);
  });

  it('bounds an abandoned run with a takeover that claims no harm', () => {
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('pressure-applied');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.teamArrived).toBe(false);
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and sibling lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'oxygen', doseMg: 1 } });
    engine.apply({ tick: 0, type: 'paired-reading-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'afferent-limb-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'afferent-limb-response', payload: { action: 'start-treatment' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('afferent-limb-generic-action-refused');
    expect(ids).toContain('afferent-limb-action-refused');
    expect(frame.equipment.resuscitation.afferentLimb!.monitoringAtTick).toBeNull();
  });

  it('names no agent, dose, or treatment after ANY action', () => {
    const forbidden = ['noradrenaline', 'antibiotic', 'litres per minute', 'mg/kg', 'milligram'];
    for (const action of AFFERENT_LIMB_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'afferent-limb-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.afferentLimb!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(AFFERENT_LIMB_ACTIONS).size).toBe(AFFERENT_LIMB_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
