import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ACUTE_PULMONARY_EDEMA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-pulmonary-edema';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let index = 1; index < ticks; index += 1) result = subject.step();
  return result;
}

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'acute-pulmonary-edema-response', payload: { action } });
  return subject.step();
}

describe('acute pulmonary edema foundation', () => {
  it('validates and presents the authored respiratory-hemodynamic pattern', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 46, practiceRegion: 'US' });
    const affected = advance(subject, 100);
    expect(affected.state).toMatchObject({
      respiratoryRateBpm: 32, spo2Percent: 90,
      systolicMmHg: 188, diastolicMmHg: 112, meanArterialMmHg: 137,
    });
    expect(affected.state.cardiacOutputLPerMin).toBeGreaterThan(2);
  });

  it('enforces assessment, support, treatment intents, and serial reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 46, practiceRegion: 'US' });
    advance(subject, 100);
    expect(act(subject, '__proto__').events.at(-1)?.eventId)
      .toMatch(/^acute-pulmonary-edema-refused-/);
    expect(act(subject, 'record-niv-and-titrated-oxygen').events.at(-1)?.eventId)
      .toMatch(/^acute-pulmonary-edema-order-refused-/);
    act(subject, 'review-pattern-mimics-and-precipitants');
    const supported = act(subject, 'record-niv-and-titrated-oxygen');
    expect(supported.events.find((entry) =>
      entry.eventId.startsWith('acute-pulmonary-edema-niv-'))?.data)
      .toMatchObject({ intentOnly: true, fio2: 0.4, peepCmH2o: 8 });
    act(subject, 'record-loop-diuretic-intent');
    const vasodilated = act(subject, 'record-vasodilator-intent');
    expect(vasodilated.events.find((entry) =>
      entry.eventId.startsWith('acute-pulmonary-edema-vasodilator-'))?.data)
      .toMatchObject({ intentOnly: true, qualifyingSystolicMmHg: 188 });
    const reassessed = act(subject, 'reassess-breathing-pressure-and-perfusion');
    expect(reassessed.state).toMatchObject({
      respiratoryRateBpm: 22, spo2Percent: 96,
      systolicMmHg: 146, diastolicMmHg: 86, meanArterialMmHg: 106,
    });
    expect(reassessed.equipment.ventilator).toMatchObject({
      mode: 'pressure-control', fio2: 0.4, peep: 8, delivering: true,
    });
    expect(reassessed.equipment.resuscitation.acutePulmonaryEdemaAssessment).toMatchObject({
      patternReviewedAtTick: expect.any(Number), nivAtTick: expect.any(Number),
      diureticIntentAtTick: expect.any(Number), vasodilatorIntentAtTick: expect.any(Number),
      reassessedAtTick: expect.any(Number),
    });
  });

  it('debriefs only accepted acute-pulmonary-edema events', () => {
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const actions: LearnerAction[] = [];
    const event = (eventId: string, tick: number): EngineEvent => ({
      eventId, tick, category: 'assessment', severity: 'warning', message: eventId,
    });
    const log = [event('acute-pulmonary-edema-pattern-reviewed-10', 10),
      event('acute-pulmonary-edema-niv-20', 20),
      event('acute-pulmonary-edema-diuretic-30', 30),
      event('acute-pulmonary-edema-vasodilator-40', 40),
      event('acute-pulmonary-edema-reassessed-50', 50)];
    const findings = objectiveFindings(SCENARIO, history, 0, 0, actions, log);
    expect(findings.map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
  });
});
