import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent } from '@platform/kernel/protocol';
import { PERICARDIAL_TAMPONADE as SCENARIO } from '../../src/modules/cardiology/scenarios/pericardial-tamponade';
import { CARDIAC_TAMPONADE as EM_TAMPONADE } from '../../src/modules/emergency-medicine/scenarios/cardiac-tamponade';
import { POST_INFARCTION_CARDIOGENIC_SHOCK_ESCALATION as POST_INFARCTION_SHOCK } from '../../src/modules/cardiology/scenarios/post-infarction-cardiogenic-shock-escalation';

const ACTIONS = {
  trajectory: 'reconcile-pericardial-tamponade-trajectory',
  drainage: 'review-pericardial-tamponade-drainage-response',
  etiology: 'review-pericardial-tamponade-etiology',
  surveillance: 'review-pericardial-tamponade-surveillance',
  handoff: 'handoff-pericardial-tamponade-reassessment',
} as const;

function apply(subject: AnesthesiaEngine, action: string, type = 'pericardial-tamponade-response') {
  subject.apply({ tick: subject.tick, type, payload: { action } });
}

describe('cardiology post-drainage pericardial-tamponade reassessment', () => {
  it('is a valid, authored post-drainage contract distinct from untreated trauma tamponade and shock', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.timeline.some((event) =>
      event.type === 'narrative' && event.target === 'pericardial-tamponade-reassessment')).toBe(true);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toMatch(/reported (?:pericardial )?drainage|drainage was reported/i);
    expect(narrative).toMatch(/after an experienced team performed reported urgent.*pericardiocentesis/i);
    expect(narrative).toMatch(/controls do not.*select or deliver.*drainage/i);
    expect(SCENARIO.metadata.objectives.map((objective) => objective.statement))
      .not.toEqual(EM_TAMPONADE.metadata.objectives.map((objective) => objective.statement));
    expect(SCENARIO.metadata.objectives.map((objective) => objective.statement))
      .not.toEqual(POST_INFARCTION_SHOCK.metadata.objectives.map((objective) => objective.statement));
  });

  it.each([
    [ACTIONS.etiology, ACTIONS.surveillance],
    [ACTIONS.surveillance, ACTIONS.etiology],
  ])('accepts parallel etiology/surveillance in either order and requires a later-tick handoff',
    (firstLane, secondLane) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 131, practiceRegion: 'US' });
      const onset = subject.step();
      apply(subject, ACTIONS.trajectory);
      apply(subject, ACTIONS.drainage);
      apply(subject, firstLane);
      apply(subject, secondLane);
      apply(subject, ACTIONS.handoff);
      const premature = subject.step();
      expect(premature.equipment.resuscitation.pericardialTamponadeAssessment).toMatchObject({
        trajectoryAtTick: expect.any(Number), drainageResponseAtTick: expect.any(Number),
        etiologyAtTick: expect.any(Number), surveillanceAtTick: expect.any(Number), handoffAtTick: null,
      });
      expect(premature.events.some((event) =>
        event.eventId.startsWith('pericardial-tamponade-handoff-time-refused-'))).toBe(true);

      apply(subject, ACTIONS.handoff);
      const completed = subject.step();
      const assessment = completed.equipment.resuscitation.pericardialTamponadeAssessment;
      expect(assessment?.handoffAtTick).toBeGreaterThan(
        Math.max(assessment?.etiologyAtTick ?? 0, assessment?.surveillanceAtTick ?? 0),
      );
      const accepted = [...premature.events, ...completed.events].filter((event) =>
        /^pericardial-tamponade-(?:trajectory-reconciled|drainage-response-reviewed|etiology-reviewed|surveillance-reviewed|handoff-recorded)-\d+$/.test(event.eventId));
      expect(accepted).toHaveLength(5);
      const forbiddenClaims = accepted.flatMap((event) => Object.entries(event.data ?? {}))
        .filter(([key]) => /(?:treatmentDelivered|imageAcquired|procedurePerformed|catheterManipulated)ByLearner/.test(key));
      expect(forbiddenClaims.length).toBeGreaterThan(0);
      expect(forbiddenClaims.every(([, value]) => value === false)).toBe(true);
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [],
        [...onset.events, ...premature.events, ...completed.events]).map((finding) => finding.outcome))
        .toEqual(['met', 'met', 'met', 'met', 'met']);
    });

  it('requires exact accepted evidence and rejects a same-tick forged handoff', () => {
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const exact = [event('pericardial-tamponade-trajectory-reconciled-10', 10),
      event('pericardial-tamponade-drainage-response-reviewed-20', 20),
      event('pericardial-tamponade-etiology-reviewed-30', 30),
      event('pericardial-tamponade-surveillance-reviewed-30', 30),
      event('pericardial-tamponade-handoff-recorded-40', 40)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], exact).map((finding) => finding.outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const sameTick = [...exact.slice(0, -1), event('pericardial-tamponade-handoff-recorded-30', 30)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], sameTick).at(-1)?.outcome).toBe('not-met');
    const crossScenario = [event('tamponade-context-reviewed-10', 10),
      event('tamponade-pocus-reviewed-20', 20), event('post-infarction-shock-trajectory-reconciled-30', 30),
      event('post-infarction-shock-handoff-recorded-40', 40)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], crossScenario)
      .every((finding) => finding.outcome === 'not-met')).toBe(true);
  });

  it('refuses hostile and foreign action families without changing state or claiming a procedure', () => {
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 132, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 132, practiceRegion: 'US' });
    hostile.step(); control.step();
    apply(hostile, 'perform-pericardiocentesis');
    apply(hostile, 'acquire-pocus-images');
    apply(hostile, 'advance-pericardial-catheter');
    apply(hostile, 'record-definitive-control-intent', 'cardiac-tamponade-assessment');
    apply(hostile, 'reconcile-post-infarction-shock-trajectory', 'post-infarction-shock-response');
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation.pericardialTamponadeAssessment)
      .toEqual(untouched.equipment.resuscitation.pericardialTamponadeAssessment);
    expect(refused.equipment.resuscitation.pericardialTamponadeAssessment).toMatchObject({
      trajectoryAtTick: null, drainageResponseAtTick: null, etiologyAtTick: null,
      surveillanceAtTick: null, handoffAtTick: null, treatmentDeliveredByLearner: false,
      imageAcquiredByLearner: false, procedurePerformedByLearner: false,
      catheterManipulatedByLearner: false,
    });
    expect(refused.events.filter((event) => event.eventId.includes('refused')).length).toBeGreaterThanOrEqual(5);
    expect(refused.events).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ data: expect.objectContaining({ procedurePerformedByLearner: true }) }),
      expect.objectContaining({ data: expect.objectContaining({ catheterManipulatedByLearner: true }) }),
      expect.objectContaining({ data: expect.objectContaining({ imageAcquiredByLearner: true }) }),
      expect.objectContaining({ data: expect.objectContaining({ treatmentDeliveredByLearner: true }) }),
    ]));

    const emergency = new AnesthesiaEngine({ scenario: EM_TAMPONADE, seed: 133, practiceRegion: 'US' });
    emergency.step(); apply(emergency, ACTIONS.trajectory); const emergencyResult = emergency.step();
    expect(emergencyResult.equipment.resuscitation.pericardialTamponadeAssessment).toBeUndefined();
    expect(emergencyResult.equipment.resuscitation.cardiacTamponadeAssessment?.contextReviewedAtTick).toBeNull();
    const shock = new AnesthesiaEngine({ scenario: POST_INFARCTION_SHOCK, seed: 134, practiceRegion: 'US' });
    shock.step(); apply(shock, ACTIONS.trajectory); const shockResult = shock.step();
    expect(shockResult.equipment.resuscitation.pericardialTamponadeAssessment).toBeUndefined();
    expect(shockResult.equipment.resuscitation.postInfarctionShockAssessment?.trajectoryAtTick).toBeNull();
  });
});
