import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PACEMAKER_AND_CAUTERY_PLANNING as SCENARIO } from '@anesthesia/scenarios/pacemaker-and-cautery-planning';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function engine() {
  return new AnesthesiaEngine({ scenario: SCENARIO, seed: 41, practiceRegion: 'US' });
}

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'cied-planning-assessment', payload: { action } });
  return subject.step();
}

describe('pacemaker and cautery planning foundation', () => {
  it('requires both reviews before one plan and requires a plan before restoration', () => {
    const subject = engine();
    expect(act(subject, 'coordinate-asynchronous-pacing').events.some(
      (event) => event.eventId.startsWith('cied-plan-order-refused-'),
    )).toBe(true);
    act(subject, 'review-device-record');
    act(subject, 'review-procedure-emi');
    expect(act(subject, 'coordinate-asynchronous-pacing').equipment.resuscitation
      .ciedPlanningAssessment).toMatchObject({
        deviceRecordReviewedAtTick: 1,
        procedureRiskReviewedAtTick: 2,
        plan: 'coordinate-asynchronous-pacing',
        planAtTick: 3,
      });
    expect(act(subject, 'document-backup-and-restoration').equipment.resuscitation
      .ciedPlanningAssessment?.backupAndRestorationDocumentedAtTick).toBe(4);
  });

  it('rejects hostile, inactive, and duplicate requests', () => {
    const subject = engine();
    expect(act(subject, '__proto__').events.some(
      (event) => event.eventId.startsWith('cied-planning-refused-'),
    )).toBe(true);
    act(subject, 'review-device-record');
    expect(act(subject, 'review-device-record').events.at(-1)?.eventId)
      .toMatch(/^cied-device-review-refused-/);
    const inactive = new AnesthesiaEngine({
      scenario: { ...SCENARIO, timeline: [] }, seed: 41, practiceRegion: 'US',
    });
    expect(act(inactive, 'review-device-record').events.at(-1)?.eventId)
      .toMatch(/^cied-planning-refused-/);
  });

  it('debriefs the accepted coordinated path from engine events', () => {
    const subject = engine();
    const actions: LearnerAction[] = [];
    const events: EngineEvent[] = [];
    const history = [{ tick: 0, state: subject.step().state, concentrations: [] as never[] }];
    for (const action of [
      'review-device-record', 'review-procedure-emi', 'coordinate-asynchronous-pacing',
      'document-backup-and-restoration',
    ]) {
      const learnerAction = {
        tick: subject.tick, type: 'cied-planning-assessment', payload: { action },
      };
      actions.push(learnerAction);
      subject.apply(learnerAction);
      const result = subject.step();
      events.push(...result.events);
      history.push({ tick: result.tick, state: result.state, concentrations: [] as never[] });
    }
    expect(objectiveFindings(SCENARIO, history, 0, 0, actions, events)
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met']);
  });
});
