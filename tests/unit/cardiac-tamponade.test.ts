import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { CARDIAC_TAMPONADE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/cardiac-tamponade';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let index = 1; index < ticks; index += 1) result = subject.step();
  return result;
}
function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'cardiac-tamponade-assessment', payload: { action } });
  return subject.step();
}

describe('cardiac tamponade foundation', () => {
  it('keeps unresolved obstructive circulation active after intent-only escalation', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 42, practiceRegion: 'US' });
    const baseline = subject.step();
    const affected = advance(subject, 200);
    expect(affected.state.meanArterialMmHg).toBeLessThan(baseline.state.meanArterialMmHg * 0.65);
    expect(affected.state.cardiacOutputLPerMin).toBeLessThan(baseline.state.cardiacOutputLPerMin * 0.65);
    expect(affected.state.etco2MmHg).toBeLessThan(baseline.state.etco2MmHg);
    expect(affected.state.spo2Percent).toBeGreaterThan(90);
    act(subject, 'review-context-and-perfusion');
    const beforeIntent = act(subject, 'review-fixed-pocus');
    const intent = act(subject, 'record-definitive-control-intent');
    expect(intent.events.find((entry) => entry.eventId.startsWith('tamponade-control-recorded-'))?.data)
      .toMatchObject({ intentOnly: true, treatmentDelivered: false });
    expect(intent.equipment.resuscitation.cardiacTamponadeFraction)
      .toBeGreaterThanOrEqual(beforeIntent.equipment.resuscitation.cardiacTamponadeFraction ?? 0);
    const reassessed = act(subject, 'reassess-perfusion');
    expect(reassessed.equipment.resuscitation.cardiacTamponadeAssessment).toMatchObject({
      contextReviewedAtTick: expect.any(Number), pocusReviewedAtTick: expect.any(Number),
      definitiveControlAtTick: expect.any(Number), reassessedAtTick: expect.any(Number),
    });
    const unresolved = advance(subject, 800);
    expect(unresolved.equipment.resuscitation.cardiacTamponadeFraction).toBeGreaterThan(0.8);
    expect(unresolved.state.meanArterialMmHg).toBeLessThan(65);
  });

  it('rejects hostile, inactive, duplicate, and premature actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 42, practiceRegion: 'US' });
    subject.step(); advance(subject, 10);
    expect(act(subject, '__proto__').events.at(-1)?.eventId).toMatch(/^cardiac-tamponade-refused-/);
    expect(act(subject, 'review-fixed-pocus').events.at(-1)?.eventId).toMatch(/^tamponade-pocus-order-refused-/);
    act(subject, 'review-context-and-perfusion');
    expect(act(subject, 'review-context-and-perfusion').events.at(-1)?.eventId).toMatch(/^tamponade-context-refused-/);
    const inactive = new AnesthesiaEngine({ scenario: { ...SCENARIO, timeline: [] }, seed: 42, practiceRegion: 'US' });
    expect(act(inactive, 'review-context-and-perfusion').events.some(
      (event) => event.eventId.startsWith('cardiac-tamponade-refused-'),
    )).toBe(true);
  });

  it('debriefs only accepted tamponade events', () => {
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const actions: LearnerAction[] = [];
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const log = [event('tamponade-context-reviewed-10', 10), event('tamponade-pocus-reviewed-20', 20),
      event('tamponade-control-recorded-30', 30), event('tamponade-perfusion-reassessed-40', 40)];
    const findings = objectiveFindings(SCENARIO, history, 0, 0, actions, log);
    expect(findings.map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
    expect(findings.every((finding) => finding.concept === undefined)).toBe(true);
    const forged = objectiveFindings(SCENARIO, history, 0, 0, actions, [
      event('tamponade-context-reviewed-10', 10), event('tamponade-pocus-reviewed-20', 20),
      event('tamponade-control-recorded-30', 30), event('tamponade-perfusion-reassessed-30', 30),
    ]);
    expect(forged.at(-1)?.outcome).toBe('not-met');
  });
});
