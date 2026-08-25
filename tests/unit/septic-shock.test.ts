import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { SEPTIC_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/septic-shock';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function engine() {
  const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 42, practiceRegion: 'US' });
  subject.step();
  return subject;
}

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'septic-shock-assessment', payload: { action } });
  return subject.step();
}

const EXPERT_ACTIONS = [
  'review-infection-and-organ-dysfunction', 'obtain-cultures-and-lactate',
  'record-immediate-antimicrobial-intent', 'begin-initial-crystalloid',
  'reassess-after-initial-fluid', 'start-norepinephrine-intent',
  'escalate-source-control',
] as const;

describe('septic shock foundation', () => {
  it('runs diagnostics and treatment in parallel, reassesses, then supports persistent shock', () => {
    const subject = engine();
    expect(act(subject, 'obtain-cultures-and-lactate').events.at(-1)?.eventId)
      .toMatch(/^sepsis-diagnostics-order-refused-/);
    act(subject, 'review-infection-and-organ-dysfunction');
    act(subject, 'obtain-cultures-and-lactate');
    act(subject, 'record-immediate-antimicrobial-intent');
    const before = subject.step().state;
    act(subject, 'begin-initial-crystalloid');
    const after = act(subject, 'reassess-after-initial-fluid');
    expect(after.state.bloodVolumeMl).toBeCloseTo(before.bloodVolumeMl + 525, 6);
    act(subject, 'start-norepinephrine-intent');
    const final = act(subject, 'escalate-source-control');
    expect(final.equipment.resuscitation.crystalloidTotalMl).toBe(2100);
    expect(final.equipment.resuscitation.septicShockAssessment).toMatchObject({
      infectionAndOrganDysfunctionReviewedAtTick: expect.any(Number),
      culturesAndLactateAtTick: expect.any(Number),
      antimicrobialIntentAtTick: expect.any(Number),
      initialCrystalloidAtTick: expect.any(Number),
      postFluidReassessmentAtTick: expect.any(Number),
      norepinephrineIntentAtTick: expect.any(Number),
      sourceControlEscalationAtTick: expect.any(Number),
    });
    expect(after.state.meanArterialMmHg).toBeLessThan(
      final.state.meanArterialMmHg,
    );
  });

  it('rejects hostile, inactive, duplicate, and premature requests', () => {
    const subject = engine();
    expect(act(subject, '__proto__').events.at(-1)?.eventId)
      .toMatch(/^septic-shock-refused-/);
    act(subject, 'review-infection-and-organ-dysfunction');
    expect(act(subject, 'review-infection-and-organ-dysfunction').events.at(-1)?.eventId)
      .toMatch(/^sepsis-recognition-refused-/);
    expect(act(subject, 'start-norepinephrine-intent').events.at(-1)?.eventId)
      .toMatch(/^sepsis-norepinephrine-order-refused-/);
    const inactive = new AnesthesiaEngine({
      scenario: { ...SCENARIO, timeline: [] }, seed: 42, practiceRegion: 'US',
    });
    expect(act(inactive, 'review-infection-and-organ-dysfunction').events.some(
      (event) => event.eventId.startsWith('septic-shock-refused-'),
    )).toBe(true);
  });

  it('starts infection, hemodynamic, and source-control tracks in parallel', () => {
    const subject = engine();
    act(subject, 'review-infection-and-organ-dysfunction');
    expect(act(subject, 'begin-initial-crystalloid').events.at(-1)?.eventId)
      .toMatch(/^sepsis-fluid-started-/);
    expect(act(subject, 'escalate-source-control').events.at(-1)?.eventId)
      .toMatch(/^sepsis-source-control-recorded-/);
    expect(act(subject, 'start-norepinephrine-intent').events.at(-1)?.eventId)
      .toMatch(/^sepsis-norepinephrine-order-refused-/);
    expect(act(subject, 'obtain-cultures-and-lactate').events.at(-1)?.eventId)
      .toMatch(/^sepsis-diagnostics-recorded-/);
  });

  it('debriefs only accepted septic-shock events', () => {
    const subject = engine();
    const history = [{ tick: subject.tick, state: subject.step().state, concentrations: [] as never[] }];
    const actions: LearnerAction[] = [];
    const events: EngineEvent[] = [];
    for (const action of EXPERT_ACTIONS) {
      const learnerAction = { tick: subject.tick, type: 'septic-shock-assessment', payload: { action } };
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
