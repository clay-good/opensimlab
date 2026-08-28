import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { ENDOCARDITIS_MECHANICAL_FAILURE_ON_A_SURGICAL_CLOCK as SCENARIO } from '../../src/modules/infectious-disease/scenarios/endocarditis-mechanical-failure-on-a-surgical-clock';
import { ENDOCARDITIS_HEART_FAILURE_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/endocarditis-heart-failure-fixtures';
import { EndocarditisHeartFailure, ENDOCARDITIS_DECOMPENSATION_TICKS as DECOMP,
  ENDOCARDITIS_TAKEOVER_TICKS as STOP, ENDOCARDITIS_ACTIONS,
  type EndocarditisHeartFailureAction } from '../../src/modules/infectious-disease/endocarditis-heart-failure';

type Choices = readonly (readonly [number, EndocarditisHeartFailureAction])[];

function drive(actions: Choices, until: number) {
  const model = new EndocarditisHeartFailure();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Infectious disease endocarditis contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'infectious-disease', 'emergency-department', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  it('drives the infection and the valve in opposite directions', () => {
    const before = drive([[0, 'reassess']], 10).snapshot.observation!;
    const after = drive([[DECOMP + 5, 'reassess']], DECOMP + 20).snapshot.observation!;
    // The infection is responding throughout: the marker falls and cultures stay clear.
    expect(after.crpMgL).toBeLessThan(before.crpMgL);
    expect(before.culturesClearing).toBe(true);
    expect(after.culturesClearing).toBe(true);
    // The patient is much worse at the same time. That divergence is the lesson.
    expect(after.spo2Percent).toBeLessThan(before.spo2Percent);
    expect(after.respiratoryRateBpm).toBeGreaterThan(before.respiratoryRateBpm);
    expect(after.lactateMmolL).toBeGreaterThan(before.lactateMmolL);
  });

  it('narrows the pulse pressure rather than widening it', () => {
    const before = drive([[0, 'check-perfusion']], 10).snapshot.perfusionObservation!;
    const after = drive([[DECOMP + 5, 'check-perfusion']], DECOMP + 20).snapshot.perfusionObservation!;
    expect(before.pulsePressureMmHg).toBe(42);
    // Acute severe regurgitation gives the ventricle no time to dilate.
    expect(after.pulsePressureMmHg).toBe(18);
    expect(after.pulsePressureMmHg).toBeLessThan(before.pulsePressureMmHg);
  });

  it('decompensates whatever the learner records', () => {
    const idle = drive([], DECOMP + 10);
    const active = drive([[0, 'recognize-mechanical-failure'], [1, 'call-endocarditis-team'],
      [2, 'record-surgical-referral-intent']], DECOMP + 10);
    expect(idle.ids).toContain('acute-decompensation');
    expect(active.ids).toContain('acute-decompensation');
    expect(idle.model.vitals()).toEqual(active.model.vitals());
    expect(idle.snapshot.referralBeforeDecompensation).toBe(false);
    expect(active.snapshot.referralBeforeDecompensation).toBe(true);
  });

  it('refuses all four reassurance and deferral shortcuts', () => {
    const result = drive(FIXTURES.recovery, DECOMP + 40);
    expect(result.ids).toContain('marker-reassurance-refused');
    expect(result.ids).toContain('deferral-refused');
    expect(result.snapshot.markerReassuranceAttempted).toBe(true);
    expect(result.snapshot.ended).toBe('handoff');
    const errors = drive([[0, 'wide-pulse-pressure-expected'], [1, 'vegetation-size-alone-decides']], 20);
    expect(errors.ids).toContain('pulse-pressure-error-refused');
    expect(errors.ids).toContain('vegetation-only-refused');
  });

  it('states the acute-regurgitation and timing limits explicitly', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('narrow pulse pressure');
    expect(text).toContain('not a standalone surgical trigger');
    expect(text).toContain('consensus operationalizations of urgency rather than thresholds validated by randomised trial');
  });

  it('gates handoff on the full bounded record', () => {
    const partial: Choices = [[0, 'recognize-mechanical-failure'], [1, 'call-endocarditis-team'],
      [2, 'review-boundaries'], [3, 'monitor'], [4, 'reassess'], [5, 'handoff']];
    expect(drive(partial, 20).ids).toContain('handoff-refused');
    const complete: Choices = [...partial.slice(0, 2), [2, 'record-surgical-referral-intent'],
      [3, 'review-boundaries'], [4, 'monitor'], [5, 'reassess'], [6, 'handoff']];
    const done = drive(complete, 20);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover after the decompensation', () => {
    expect(STOP).toBeGreaterThan(DECOMP);
    const result = drive([], STOP + 10);
    expect(result.ids).toContain('acute-decompensation');
    expect(result.ids).toContain('instructor-takeover');
  });

  it('refuses generic actions, malformed payloads, and adjacent-lesson shortcuts', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'furosemide', doseMg: 40 } });
    engine.apply({ tick: 0, type: 'necrotizing-infection-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'endocarditis-heart-failure-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'endocarditis-heart-failure-response', payload: { action: 'replace-the-valve' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('endocarditis-heart-failure-generic-action-refused');
    expect(ids).toContain('endocarditis-heart-failure-action-refused');
    expect(frame.equipment.resuscitation.endocarditisHeartFailure!.surgicalReferralAtTick).toBeNull();
  });

  it('names no drug and exposes no operative control', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 0, type: 'endocarditis-heart-failure-response', payload: { action: 'record-surgical-referral-intent' } });
    const snapshot = engine.step().equipment.resuscitation.endocarditisHeartFailure!;
    expect(snapshot.surgicalReferralAtTick).not.toBeNull();
    expect(snapshot.doseModelAvailable).toBe(false);
    const serialized = JSON.stringify(snapshot).toLowerCase();
    for (const forbidden of ['furosemide', 'flucloxacillin', 'vancomycin', 'noradrenaline', 'mg/kg']) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(snapshot.choiceFeedback).toContain('Nothing here selects an operation, a prosthesis, a theatre time, or an anaesthetic plan');
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(ENDOCARDITIS_ACTIONS).size).toBe(ENDOCARDITIS_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
