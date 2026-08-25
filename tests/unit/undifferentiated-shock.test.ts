import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { UNDIFFERENTIATED_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/undifferentiated-shock';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function engine() {
  const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 42, practiceRegion: 'US' });
  subject.step();
  return subject;
}

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'undifferentiated-shock-assessment', payload: { action } });
  return subject.step();
}

describe('undifferentiated shock foundation', () => {
  it('requires whole-patient assessment, dynamic response, targeted fluid, reassessment, and escalation in order', () => {
    const subject = engine();
    expect(act(subject, 'review-focused-echo').events.at(-1)?.eventId)
      .toMatch(/^shock-echo-order-refused-/);
    act(subject, 'review-perfusion');
    act(subject, 'review-lactate');
    act(subject, 'review-focused-echo');
    act(subject, 'perform-passive-leg-raise');
    const before = subject.step().state;
    act(subject, 'give-targeted-fluid-challenge');
    const after = act(subject, 'reassess-perfusion');
    expect(after.state.bloodVolumeMl).toBeCloseTo(before.bloodVolumeMl + 125, 6);
    const final = act(subject, 'escalate-after-reassessment');
    expect(final.equipment.resuscitation.crystalloidTotalMl).toBe(500);
    expect(final.equipment.resuscitation.undifferentiatedShockAssessment).toMatchObject({
      perfusionReviewedAtTick: 2, lactateReviewedAtTick: 3, focusedEchoReviewedAtTick: 4,
      passiveLegRaiseAtTick: 5, fluidChallengeAtTick: 7,
      perfusionReassessedAtTick: 8, escalationAtTick: 9,
    });
    const duplicate = act(subject, 'give-targeted-fluid-challenge');
    expect(duplicate.events.at(-1)?.eventId).toMatch(/^shock-fluid-refused-/);
    expect(duplicate.equipment.resuscitation.crystalloidTotalMl).toBe(500);
  });

  it('rejects hostile, inactive, duplicate, and premature requests', () => {
    const subject = engine();
    expect(act(subject, '__proto__').events.at(-1)?.eventId)
      .toMatch(/^undifferentiated-shock-refused-/);
    act(subject, 'review-perfusion');
    expect(act(subject, 'review-perfusion').events.at(-1)?.eventId)
      .toMatch(/^shock-perfusion-refused-/);
    expect(act(subject, 'give-targeted-fluid-challenge').events.at(-1)?.eventId)
      .toMatch(/^shock-fluid-order-refused-/);
    const inactive = new AnesthesiaEngine({
      scenario: { ...SCENARIO, timeline: [] }, seed: 42, practiceRegion: 'US',
    });
    expect(act(inactive, 'review-perfusion').events.some(
      (event) => event.eventId.startsWith('undifferentiated-shock-refused-'),
    )).toBe(true);
  });

  it('debriefs the bounded shock assessment from accepted engine events', () => {
    const subject = engine();
    const history = [{ tick: subject.tick, state: subject.step().state, concentrations: [] as never[] }];
    const actions: LearnerAction[] = [];
    const events: EngineEvent[] = [];
    for (const action of [
      'review-perfusion', 'review-lactate', 'review-focused-echo',
      'perform-passive-leg-raise', 'give-targeted-fluid-challenge',
      'reassess-perfusion', 'escalate-after-reassessment',
    ]) {
      const learnerAction = {
        tick: subject.tick, type: 'undifferentiated-shock-assessment', payload: { action },
      };
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
