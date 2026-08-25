import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { ASPIRATION_RISK_RECOGNITION as SCENARIO } from '@anesthesia/scenarios/aspiration-risk-recognition';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function engine() {
  return new AnesthesiaEngine({ scenario: SCENARIO, seed: 20260824, practiceRegion: 'US' });
}

function act(subject: AnesthesiaEngine, action: string) {
  subject.apply({ tick: subject.tick, type: 'aspiration-risk-assessment', payload: { action } });
  return subject.step();
}

describe('aspiration-risk recognition', () => {
  it('validates, registers, cites current guidance, and maps every objective', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIO.metadata.clinicalReview.sources.join(' ')).toContain('2024');
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    expect(new Set(mappings.flatMap((entry) => entry.objectiveIds)))
      .toEqual(new Set(SCENARIO.metadata.objectives.map((entry) => entry.id)));
  });

  it('records the expert review, classification, and elective disposition in order', () => {
    const subject = engine();
    act(subject, 'review-cues');
    act(subject, 'classify-elevated');
    const result = act(subject, 'defer-and-replan');
    expect(result.equipment.resuscitation.aspirationRiskAssessment).toMatchObject({
      classification: 'elevated', plan: 'defer-and-replan',
    });
    expect(result.events.some((entry) => entry.eventId
      .startsWith('aspiration-risk-plan-defer-and-replan-'))).toBe(true);
  });

  it('rejects out-of-order, unsupported, and duplicate actions', () => {
    const subject = engine();
    expect(act(subject, 'classify-elevated').equipment.resuscitation.aspirationRiskAssessment)
      .toMatchObject({ classification: null, plan: null });
    expect(act(subject, 'not-a-choice').events.some((entry) => entry.eventId.includes('refused')))
      .toBe(true);
    act(subject, 'review-cues');
    expect(act(subject, 'review-cues').events.some((entry) => entry.eventId.includes('refused')))
      .toBe(true);
    act(subject, 'classify-routine');
    expect(act(subject, 'classify-elevated').equipment.resuscitation.aspirationRiskAssessment)
      .toMatchObject({ classification: 'routine' });
    act(subject, 'proceed-routine');
    expect(act(subject, 'defer-and-replan').equipment.resuscitation.aspirationRiskAssessment)
      .toMatchObject({ plan: 'proceed-routine' });
  });

  it('does not change patient physiology and replays identically', () => {
    const run = () => {
      const subject = engine();
      const control = engine();
      control.step();
      control.step();
      control.step();
      const controlResult = control.step();
      subject.step();
      act(subject, 'review-cues');
      act(subject, 'classify-elevated');
      const after = act(subject, 'defer-and-replan');
      return { controlResult, after };
    };
    const first = run();
    expect(first.after.state).toEqual(first.controlResult.state);
    expect(first).toEqual(run());
  });
});

const history = [{
  tick: 1, state: { spo2Percent: 99, meanArterialMmHg: 92 }, concentrations: [],
}] as never;

function event(eventId: string, tick: number): EngineEvent {
  return { tick, eventId, category: 'assessment', severity: 'advisory', message: eventId };
}

describe('aspiration-risk debrief uses accepted decisions', () => {
  it('credits the complete patient-specific path', () => {
    const log = [
      event('aspiration-risk-cues-reviewed-1', 1),
      event('aspiration-risk-classified-elevated-2', 2),
      event('aspiration-risk-plan-defer-and-replan-3', 3),
    ];
    const findings = objectiveFindings(SCENARIO, history, 0, 0, [], log);
    for (const objective of SCENARIO.metadata.objectives) {
      expect(findings.find((entry) => entry.objectiveId === objective.id)?.outcome,
        objective.id).toBe('met');
    }
  });

  it('does not credit raw requests or the routine path', () => {
    const raw: LearnerAction[] = [
      { tick: 1, type: 'aspiration-risk-assessment', payload: { action: 'review-cues' } },
      { tick: 2, type: 'aspiration-risk-assessment', payload: { action: 'classify-elevated' } },
      { tick: 3, type: 'aspiration-risk-assessment', payload: { action: 'defer-and-replan' } },
    ];
    expect(objectiveFindings(SCENARIO, history, 0, 0, raw, [])
      .every((entry) => entry.outcome === 'not-met')).toBe(true);
    const routineLog = [
      event('aspiration-risk-cues-reviewed-1', 1),
      event('aspiration-risk-classified-routine-2', 2),
      event('aspiration-risk-plan-proceed-routine-3', 3),
    ];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], routineLog)
      .filter((entry) => entry.objectiveId !== 'review-aspiration-risk-cues')
      .every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
