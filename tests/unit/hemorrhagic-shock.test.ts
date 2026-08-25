import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { HEMORRHAGIC_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/hemorrhagic-shock';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function engine() {
  const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 42, practiceRegion: 'US' });
  subject.step();
  return subject;
}

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'hemorrhagic-shock-assessment', payload: { action } });
  return subject.step();
}

const EXPERT_ACTIONS = [
  'review-mechanism-and-perfusion', 'record-pelvic-stabilization',
  'escalate-definitive-bleeding-control', 'activate-major-hemorrhage',
  'give-two-red-cell-units', 'review-coagulation-and-temperature', 'reassess-perfusion',
] as const;

describe('hemorrhagic shock foundation', () => {
  it('runs bleeding control in parallel with a bounded blood bridge and reassessment', () => {
    const subject = engine();
    act(subject, 'review-mechanism-and-perfusion');
    act(subject, 'record-pelvic-stabilization');
    expect(act(subject, 'escalate-definitive-bleeding-control').events.at(-1)?.eventId)
      .toMatch(/^trauma-definitive-control-recorded-/);
    act(subject, 'activate-major-hemorrhage');
    const before = subject.step().state;
    act(subject, 'give-two-red-cell-units');
    const after = act(subject, 'review-coagulation-and-temperature');
    const final = act(subject, 'reassess-perfusion');
    expect(after.state.bloodVolumeMl - before.bloodVolumeMl).toBeGreaterThan(590);
    expect(after.state.bloodVolumeMl - before.bloodVolumeMl).toBeLessThan(600);
    expect(after.state.hemoglobinGPerDl).toBeGreaterThan(before.hemoglobinGPerDl);
    expect(final.equipment.resuscitation.packedRedBloodCellUnits).toBe(2);
    expect(final.equipment.resuscitation.bloodProductTotalMl).toBe(600);
    expect(final.equipment.resuscitation.hemorrhagicShockAssessment).toMatchObject({
      mechanismAndPerfusionReviewedAtTick: expect.any(Number),
      pelvicStabilizationAtTick: expect.any(Number),
      majorHemorrhageActivatedAtTick: expect.any(Number),
      redCellsAtTick: expect.any(Number),
      coagulationAndTemperatureAtTick: expect.any(Number),
      reassessedAtTick: expect.any(Number),
      definitiveControlEscalatedAtTick: expect.any(Number),
    });
  });

  it('rejects hostile, inactive, duplicate, and premature requests', () => {
    const subject = engine();
    expect(act(subject, '__proto__').events.at(-1)?.eventId)
      .toMatch(/^hemorrhagic-shock-refused-/);
    expect(act(subject, 'give-two-red-cell-units').events.at(-1)?.eventId)
      .toMatch(/^trauma-action-order-refused-/);
    act(subject, 'review-mechanism-and-perfusion');
    expect(act(subject, 'review-mechanism-and-perfusion').events.at(-1)?.eventId)
      .toMatch(/^trauma-recognition-refused-/);
    expect(act(subject, 'reassess-perfusion').events.at(-1)?.eventId)
      .toMatch(/^trauma-reassessment-order-refused-/);
    const inactive = new AnesthesiaEngine({
      scenario: { ...SCENARIO, timeline: [] }, seed: 42, practiceRegion: 'US',
    });
    expect(act(inactive, 'review-mechanism-and-perfusion').events.some(
      (event) => event.eventId.startsWith('hemorrhagic-shock-refused-'),
    )).toBe(true);
  });

  it('allows definitive control to proceed before transfusion is complete', () => {
    const subject = engine();
    act(subject, 'review-mechanism-and-perfusion');
    act(subject, 'record-pelvic-stabilization');
    expect(act(subject, 'escalate-definitive-bleeding-control').events.at(-1)?.eventId)
      .toMatch(/^trauma-definitive-control-recorded-/);
    expect(subject.step().equipment.resuscitation.packedRedBloodCellUnits).toBe(0);
  });

  it('debriefs only accepted traumatic-hemorrhage events', () => {
    const subject = engine();
    const history = [{ tick: subject.tick, state: subject.step().state, concentrations: [] as never[] }];
    const actions: LearnerAction[] = [];
    const events: EngineEvent[] = [];
    for (const action of EXPERT_ACTIONS) {
      const learnerAction = { tick: subject.tick, type: 'hemorrhagic-shock-assessment', payload: { action } };
      actions.push(learnerAction);
      subject.apply(learnerAction);
      const result = subject.step();
      events.push(...result.events);
      history.push({ tick: result.tick, state: result.state, concentrations: [] as never[] });
    }
    const findings = objectiveFindings(SCENARIO, history, 0, 0, actions, events);
    expect(findings.map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
    expect(findings.every((finding) => finding.concept === undefined)).toBe(true);
  });
});
