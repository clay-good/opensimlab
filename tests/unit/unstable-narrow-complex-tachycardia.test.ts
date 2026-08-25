import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { UNSTABLE_NARROW_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/unstable-narrow-complex-tachycardia';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let index = 1; index < ticks; index += 1) result = subject.step();
  return result;
}
function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'unstable-narrow-tachycardia-response', payload: { action } });
  return subject.step();
}

describe('unstable narrow-complex tachycardia foundation', () => {
  it('validates and presents the authored unstable rhythm anchors', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 49, practiceRegion: 'US' });
    expect(advance(subject, 100).state).toMatchObject({ heartRateBpm: 188,
      respiratoryRateBpm: 24, spo2Percent: 94, systolicMmHg: 76,
      diastolicMmHg: 48, meanArterialMmHg: 57 });
  });

  it('guards order and applies the bounded synchronized response', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 49, practiceRegion: 'US' });
    advance(subject, 100);
    expect(subject.equipment().rhythmId).toBe('svt');
    expect(act(subject, '__proto__').events.at(-1)?.eventId)
      .toMatch(/^unstable-narrow-tachycardia-refused-/);
    expect(act(subject, 'record-synchronized-cardioversion-intent').events.at(-1)?.eventId)
      .toMatch(/^unstable-narrow-tachycardia-order-refused-/);
    act(subject, 'review-rhythm-and-instability');
    const prepared = act(subject, 'prepare-synchronized-cardioversion');
    expect(prepared.events.find((event) =>
      event.eventId.startsWith('unstable-narrow-tachycardia-prepared-'))?.data)
      .toMatchObject({ intentOnly: true, routineOxygenSelected: false });
    const cardioverted = act(subject, 'record-synchronized-cardioversion-intent');
    expect(cardioverted.equipment.rhythmId).toBe('sinus');
    expect(cardioverted.state).toMatchObject({ heartRateBpm: 92, respiratoryRateBpm: 18,
      spo2Percent: 95, systolicMmHg: 118, diastolicMmHg: 72, meanArterialMmHg: 87 });
    expect(cardioverted.events.find((event) =>
      event.eventId.startsWith('unstable-narrow-tachycardia-cardioverted-'))?.data)
      .toMatchObject({ intentOnly: true, synchronized: true, sedationOnlyIfFeasible: true });
    const reassessed = act(subject, 'reassess-rhythm-and-perfusion');
    expect(reassessed.equipment.resuscitation.unstableNarrowTachycardiaAssessment)
      .toMatchObject({ reviewedAtTick: expect.any(Number), preparedAtTick: expect.any(Number),
        cardiovertedAtTick: expect.any(Number), reassessedAtTick: expect.any(Number) });
  });

  it('debriefs only accepted unstable-tachycardia events', () => {
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const actions: LearnerAction[] = [];
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const log = [event('unstable-narrow-tachycardia-reviewed-10', 10),
      event('unstable-narrow-tachycardia-prepared-20', 20),
      event('unstable-narrow-tachycardia-cardioverted-30', 30),
      event('unstable-narrow-tachycardia-reassessed-40', 40)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, actions, log)
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
  });
});
