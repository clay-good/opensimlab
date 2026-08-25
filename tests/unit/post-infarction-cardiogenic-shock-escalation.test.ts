import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { POST_INFARCTION_CARDIOGENIC_SHOCK_ESCALATION as SCENARIO } from '../../src/modules/cardiology/scenarios/post-infarction-cardiogenic-shock-escalation';
import { CARDIOGENIC_SHOCK as CRITICAL_CARE_SHOCK } from '../../src/modules/critical-care/scenarios/cardiogenic-shock';

describe('cardiology post-infarction cardiogenic-shock escalation', () => {
  it('is a distinct post-PCI failure-to-improve contract', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    const criticalNarrative = CRITICAL_CARE_SHOCK.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('MAP rose from 57 to 64 mmHg');
    expect(narrative).toContain('lactate rising from 4.2 to 5.1 mmol/L');
    expect(narrative).toContain('immediate post-procedure patency');
    expect(narrative).not.toContain('prioritize prompt culprit-vessel revascularization');
    expect(criticalNarrative).toContain('prioritize prompt culprit-vessel revascularization');
    expect(SCENARIO.metadata.objectives.map((objective) => objective.statement))
      .not.toEqual(CRITICAL_CARE_SHOCK.metadata.objectives.map((objective) => objective.statement));
    expect(SCENARIO.debrief.rubric.map((item) => item.question))
      .not.toEqual(CRITICAL_CARE_SHOCK.debrief.rubric.map((item) => item.question));
  });

  it('keeps cause review and regional consultation parallel, then requires elapsed reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 106, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 108, respiratoryRateBpm: 26,
      spo2Percent: 93, systolicMmHg: 84, diastolicMmHg: 54, meanArterialMmHg: 64 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'post-infarction-shock-response', payload: { action } });
    apply('reconcile-post-infarction-shock-trajectory');
    apply('contact-post-infarction-shock-center');
    apply('reopen-post-infarction-shock-causes');
    apply('record-post-infarction-shock-bridge');
    apply('handoff-post-infarction-shock-trajectory');
    const premature = subject.step();
    expect(premature.equipment.resuscitation.postInfarctionShockAssessment).toMatchObject({
      trajectoryAtTick: expect.any(Number), causesAtTick: expect.any(Number),
      transferAtTick: expect.any(Number), bridgeAtTick: expect.any(Number), handoffAtTick: null,
      pressureAloneUsed: false, routineDeviceSelected: false, treatmentDelivered: false,
    });
    expect(premature.events.some((event) => event.eventId
      .startsWith('post-infarction-shock-handoff-order-refused-'))).toBe(true);
    apply('handoff-post-infarction-shock-trajectory');
    const completed = subject.step();
    const handoff = completed.events.find((event) =>
      /^post-infarction-shock-handoff-recorded-\d+$/.test(event.eventId));
    expect(handoff?.data).toMatchObject({ shockResolved: false, ownerNamed: true });
    expect(completed.state).toMatchObject({ heartRateBpm: 104, respiratoryRateBpm: 24,
      spo2Percent: 94, systolicMmHg: 88, diastolicMmHg: 57, meanArterialMmHg: 67 });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...premature.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses shortcuts and isolates both shock action families', () => {
    const cardiology = new AnesthesiaEngine({ scenario: SCENARIO, seed: 107, practiceRegion: 'US' });
    cardiology.step();
    cardiology.apply({ tick: cardiology.tick, type: 'cardiogenic-shock-response',
      payload: { action: 'recognize-cardiogenic-shock-trajectory' } });
    cardiology.apply({ tick: cardiology.tick, type: 'post-infarction-shock-response',
      payload: { action: 'place-routine-device' } });
    const cardiologyState = cardiology.step();
    expect(cardiologyState.equipment.resuscitation.cardiogenicShockAssessment?.recognitionAtTick).toBeNull();
    expect(cardiologyState.equipment.resuscitation.postInfarctionShockAssessment?.trajectoryAtTick).toBeNull();
    expect(cardiologyState.events.filter((event) => event.eventId.includes('response-refused')).length)
      .toBeGreaterThanOrEqual(2);

    const critical = new AnesthesiaEngine({ scenario: CRITICAL_CARE_SHOCK, seed: 108, practiceRegion: 'US' });
    critical.step();
    critical.apply({ tick: critical.tick, type: 'post-infarction-shock-response',
      payload: { action: 'reconcile-post-infarction-shock-trajectory' } });
    const criticalState = critical.step();
    expect(criticalState.equipment.resuscitation.postInfarctionShockAssessment).toBeUndefined();
    expect(criticalState.equipment.resuscitation.cardiogenicShockAssessment?.recognitionAtTick).toBeNull();
    expect(criticalState.events.some((event) =>
      event.eventId.startsWith('post-infarction-shock-response-refused-'))).toBe(true);
  });
});
