import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { PULMONARY_EMBOLISM_DETERIORATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/pulmonary-embolism-deterioration';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let index = 1; index < ticks; index += 1) result = subject.step();
  return result;
}
function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'pulmonary-embolism-deterioration-response', payload: { action } });
  return subject.step();
}

describe('pulmonary embolism deterioration foundation', () => {
  it('validates and presents the authored initial Category C3R anchors', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 47, practiceRegion: 'US' });
    expect(advance(subject, 100).state).toMatchObject({ heartRateBpm: 124,
      respiratoryRateBpm: 30, spo2Percent: 90, systolicMmHg: 112,
      diastolicMmHg: 70, meanArterialMmHg: 84 });
  });

  it('guards order and reveals fixed Category E1 deterioration before escalation', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 47, practiceRegion: 'US' });
    advance(subject, 100);
    expect(act(subject, '__proto__').events.at(-1)?.eventId).toMatch(/^pulmonary-embolism-refused-/);
    expect(act(subject, 'reassess-for-deterioration').events.at(-1)?.eventId)
      .toMatch(/^pulmonary-embolism-order-refused-/);
    act(subject, 'review-confirmed-pe-severity');
    act(subject, 'record-titrated-oxygen');
    const anticoagulated = act(subject, 'record-therapeutic-anticoagulation-intent');
    expect(anticoagulated.events.find((entry) =>
      entry.eventId.startsWith('pulmonary-embolism-anticoagulation-'))?.data)
      .toMatchObject({ intentOnly: true });
    const deteriorated = act(subject, 'reassess-for-deterioration');
    expect(deteriorated.state).toMatchObject({ heartRateBpm: 138,
      respiratoryRateBpm: 34, spo2Percent: 92, systolicMmHg: 78,
      diastolicMmHg: 50, meanArterialMmHg: 59 });
    const escalated = act(subject, 'activate-pert-and-record-reperfusion-intent');
    expect(escalated.events.find((entry) =>
      entry.eventId.startsWith('pulmonary-embolism-escalation-'))?.data)
      .toMatchObject({ intentOnly: true, category: 'E1' });
    expect(escalated.equipment.resuscitation.pulmonaryEmbolismAssessment).toMatchObject({
      severityReviewedAtTick: expect.any(Number), oxygenAtTick: expect.any(Number),
      anticoagulationAtTick: expect.any(Number), deteriorationAtTick: expect.any(Number),
      escalationAtTick: expect.any(Number),
    });
  });

  it('debriefs only accepted pulmonary-embolism events', () => {
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const actions: LearnerAction[] = [];
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const log = [event('pulmonary-embolism-severity-reviewed-10', 10),
      event('pulmonary-embolism-oxygen-20', 20),
      event('pulmonary-embolism-anticoagulation-30', 30),
      event('pulmonary-embolism-deterioration-recognized-40', 40),
      event('pulmonary-embolism-escalation-50', 50)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, actions, log)
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
  });
});
