import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { UNSTABLE_BRADYCARDIA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/unstable-bradycardia';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let index = 1; index < ticks; index += 1) result = subject.step();
  return result;
}
function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'unstable-bradycardia-response', payload: { action } });
  return subject.step();
}

describe('unstable bradycardia foundation', () => {
  it('validates and presents the authored bradycardia anchors', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 53, practiceRegion: 'US' });
    expect(advance(subject, 100).state).toMatchObject({ heartRateBpm: 38,
      respiratoryRateBpm: 20, spo2Percent: 91, systolicMmHg: 78,
      diastolicMmHg: 46, meanArterialMmHg: 57 });
    expect(subject.equipment().rhythmId).toBe('sinus-bradycardia');
  });

  it('guards order and applies the bounded atropine response', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 53, practiceRegion: 'US' });
    advance(subject, 100);
    expect(act(subject, '__proto__').events.at(-1)?.eventId)
      .toMatch(/^unstable-bradycardia-refused-/);
    expect(act(subject, 'record-atropine-intent').events.at(-1)?.eventId)
      .toMatch(/^unstable-bradycardia-order-refused-/);
    act(subject, 'review-bradycardia-and-compromise');
    const support = act(subject, 'record-bradycardia-support');
    expect(support.events.find((event) => event.eventId.startsWith('unstable-bradycardia-supported-'))?.data)
      .toMatchObject({ intentOnly: true, oxygenSelected: true,
        positivePressureVentilationSelected: false });
    const atropine = act(subject, 'record-atropine-intent');
    expect(atropine.equipment.rhythmId).toBe('sinus');
    expect(atropine.state).toMatchObject({ heartRateBpm: 68, respiratoryRateBpm: 18,
      spo2Percent: 96, systolicMmHg: 112, diastolicMmHg: 70, meanArterialMmHg: 84 });
    expect(atropine.events.find((event) => event.eventId.startsWith('unstable-bradycardia-atropine-'))?.data)
      .toMatchObject({ intentOnly: true, doseMg: 1, route: 'iv' });
    const reassessed = act(subject, 'reassess-bradycardia-response');
    expect(reassessed.equipment.resuscitation.unstableBradycardiaAssessment)
      .toMatchObject({ reviewedAtTick: expect.any(Number), supportedAtTick: expect.any(Number),
        atropineAtTick: expect.any(Number), reassessedAtTick: expect.any(Number) });
  });

  it('debriefs only accepted unstable-bradycardia events', () => {
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const actions: LearnerAction[] = [];
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const log = [event('unstable-bradycardia-reviewed-10', 10),
      event('unstable-bradycardia-supported-20', 20),
      event('unstable-bradycardia-atropine-30', 30),
      event('unstable-bradycardia-reassessed-40', 40)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, actions, log)
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
  });

  it('does not credit reassessment forged at the atropine tick', () => {
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const log = [event('unstable-bradycardia-reviewed-10', 10),
      event('unstable-bradycardia-supported-20', 20),
      event('unstable-bradycardia-atropine-30', 30),
      event('unstable-bradycardia-reassessed-forged', 30)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], log).at(-1)?.outcome).toBe('not-met');
  });
});
