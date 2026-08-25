import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { STEMI as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/stemi';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let index = 1; index < ticks; index += 1) result = subject.step();
  return result;
}
function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'stemi-response', payload: { action } });
  return subject.step();
}

describe('STEMI foundation', () => {
  it('validates and presents the authored stable time-critical pattern', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 48, practiceRegion: 'US' });
    expect(advance(subject, 100).state).toMatchObject({ heartRateBpm: 104,
      respiratoryRateBpm: 20, spo2Percent: 95, systolicMmHg: 146,
      diastolicMmHg: 92, meanArterialMmHg: 110 });
  });

  it('guards order and records bounded reperfusion preparation before handoff', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 48, practiceRegion: 'US' });
    advance(subject, 100);
    expect(act(subject, '__proto__').events.at(-1)?.eventId).toMatch(/^stemi-refused-/);
    expect(act(subject, 'activate-stemi-pathway').events.at(-1)?.eventId)
      .toMatch(/^stemi-order-refused-/);
    act(subject, 'review-stemi-pattern');
    const pathway = act(subject, 'activate-stemi-pathway');
    expect(pathway.events.find((event) => event.eventId.startsWith('stemi-pathway-activated-'))?.data)
      .toMatchObject({ intentOnly: true, strategy: 'primary-pci' });
    const aspirin = act(subject, 'record-aspirin-load');
    expect(aspirin.events.find((event) => event.eventId.startsWith('stemi-aspirin-'))?.data)
      .toMatchObject({ intentOnly: true, loadingDoseMinimumMg: 162,
        loadingDoseMaximumMg: 325 });
    act(subject, 'record-p2y12-anticoagulation-intent');
    const reassessed = act(subject, 'reassess-and-handoff');
    expect(reassessed.state).toMatchObject({ heartRateBpm: 104, spo2Percent: 95,
      systolicMmHg: 146, diastolicMmHg: 92 });
    expect(reassessed.equipment.resuscitation.stemiAssessment).toMatchObject({
      patternReviewedAtTick: expect.any(Number), pathwayActivatedAtTick: expect.any(Number),
      aspirinAtTick: expect.any(Number), additionalAntithromboticsAtTick: expect.any(Number),
      reassessedAtTick: expect.any(Number),
    });
  });

  it('debriefs only accepted STEMI events', () => {
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const actions: LearnerAction[] = [];
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const log = [event('stemi-pattern-reviewed-10', 10),
      event('stemi-pathway-activated-20', 20), event('stemi-aspirin-30', 30),
      event('stemi-antithrombotics-40', 40), event('stemi-reassessed-50', 50)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, actions, log)
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
  });
});
