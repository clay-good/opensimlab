import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { POSTOPERATIVE_HANDOFF as SCENARIO } from '@anesthesia/scenarios/postoperative-handoff';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function engine() {
  return new AnesthesiaEngine({ scenario: SCENARIO, seed: 42, practiceRegion: 'US' });
}

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'postoperative-handoff-assessment', payload: { action } });
  return subject.step();
}

describe('postoperative handoff foundation', () => {
  it('requires readiness, both content blocks, ownership, read-back, and acceptance in order', () => {
    const subject = engine();
    expect(act(subject, 'share-patient-and-course').events.some(
      (event) => event.eventId.startsWith('handoff-order-refused-'),
    )).toBe(true);
    act(subject, 'confirm-receiver-readiness');
    act(subject, 'share-current-state');
    expect(act(subject, 'share-risks-actions-ownership').events.at(-1)?.eventId)
      .toMatch(/^handoff-risk-order-refused-/);
    act(subject, 'share-patient-and-course');
    act(subject, 'share-risks-actions-ownership');
    expect(act(subject, 'accept-transfer').events.at(-1)?.eventId)
      .toMatch(/^handoff-acceptance-order-refused-/);
    act(subject, 'receiver-readback');
    expect(act(subject, 'accept-transfer').equipment.resuscitation.postoperativeHandoffAssessment)
      .toMatchObject({
        receiverReadyAtTick: 1, currentStateAtTick: 2, patientAndCourseAtTick: 4,
        risksActionsOwnershipAtTick: 5, receiverReadbackAtTick: 7, transferAcceptedAtTick: 8,
      });
  });

  it('rejects hostile, inactive, and duplicate requests', () => {
    const subject = engine();
    expect(act(subject, '__proto__').events.some(
      (event) => event.eventId.startsWith('postoperative-handoff-refused-'),
    )).toBe(true);
    act(subject, 'confirm-receiver-readiness');
    expect(act(subject, 'confirm-receiver-readiness').events.at(-1)?.eventId)
      .toMatch(/^handoff-readiness-refused-/);
    const inactive = new AnesthesiaEngine({ scenario: { ...SCENARIO, timeline: [] }, seed: 42, practiceRegion: 'US' });
    expect(act(inactive, 'confirm-receiver-readiness').events.at(-1)?.eventId)
      .toMatch(/^postoperative-handoff-refused-/);
  });

  it('debriefs the accepted closed-loop transfer from engine events', () => {
    const subject = engine();
    const history = [{ tick: 0, state: subject.step().state, concentrations: [] as never[] }];
    const actions: LearnerAction[] = [];
    const events: EngineEvent[] = [];
    for (const action of [
      'confirm-receiver-readiness', 'share-patient-and-course', 'share-current-state',
      'share-risks-actions-ownership', 'receiver-readback', 'accept-transfer',
    ]) {
      const learnerAction = { tick: subject.tick, type: 'postoperative-handoff-assessment', payload: { action } };
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
