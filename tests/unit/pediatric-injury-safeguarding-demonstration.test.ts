/**
 * The worked example and observed-state tutor for a concern that is not a
 * conclusion.
 *
 * The restraint here is ethical as much as clinical: the example must raise a
 * concern accurately and diagnose nothing, accuse nobody, and decide none of
 * the things that belong to a multi-agency pathway.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-injury-safeguarding-escalation';
import { PEDIATRIC_INJURY_SAFEGUARDING_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-injury-safeguarding-fixtures';
import {
  PEDIATRIC_INJURY_SAFEGUARDING_DEMONSTRATION_VERSION, pediatricInjurySafeguardingDemonstrationStep,
  supportsPediatricInjurySafeguardingDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-injury-safeguarding-demonstration';
import { pediatricInjurySafeguardingInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-injury-safeguarding-guidance';
import type { PediatricInjurySafeguardingAction } from '../../src/modules/pediatrics/pediatric-injury-safeguarding';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricInjurySafeguardingAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricInjurySafeguardingAction) => {
  engine.apply({ tick, type: 'pediatric-injury-safeguarding-escalation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricInjurySafeguardingDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-injury-safeguarding-escalation-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Raises A Concern And Concludes Nothing', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_INJURY_SAFEGUARDING_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricInjurySafeguardingDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricInjurySafeguardingDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricInjurySafeguardingDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the one available order', () => {
    expect(beats).toEqual(['trajectory', 'concern', 'safeguarding', 'alternatives', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.concernAtTick!);
    expect(patient.concernAtTick).toBeLessThan(patient.safeguardingAtTick!);
    expect(patient.safeguardingAtTick).toBeLessThan(patient.alternativesAtTick!);
    expect(patient.alternativesAtTick).toBeLessThan(patient.laterSafetyAtTick!);
    expect(patient.laterSafetyAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('keeps the observed description separate from what it might mean', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('keep it separate from what it might mean');
    expect(trajectory).toContain('bruise age is deliberately not inferred from colour');
    expect(trajectory).toContain('Shins are where mobile toddlers bruise');
    expect(patient.bruiseDatedByLearner).toBe(false);
    expect(patient.bruiseIdentifiedByLearner).toBe(false);
  });

  it('holds the concern at exactly the width the evidence supports', () => {
    const concern = narrations[beats.indexOf('concern')]!;
    expect(concern).toContain('narrower than the one you are tempted to say');
    expect(concern).toContain('Widening it invents a finding nobody has made');
    expect(concern).toContain('is how these are missed');
    expect(patient.safeguardingConcernAuthored).toBe(true);
    expect(patient.abuseDiagnosedByLearner).toBe(false);
    expect(patient.caregiverCredibilityJudgedByLearner).toBe(false);
  });

  it('names what the learner does not do as specifically as what they do', () => {
    const safeguarding = narrations[beats.indexOf('safeguarding')]!;
    expect(safeguarding).toContain('no confronting the caregiver');
    expect(safeguarding).toContain('this lab teaches none of them as the answer');
    expect(patient.qualifiedSafeguardingOwnershipActive).toBe(true);
    expect(patient.qualifiedImmediateSafetyOwnershipActive).toBe(true);
    expect(patient.caregiverConfrontedByLearner).toBe(false);
    expect(patient.referralSubmittedByLearner).toBe(false);
  });

  it('keeps the medical alternatives open and the information narrow', () => {
    const alternatives = narrations[beats.indexOf('alternatives')]!;
    expect(alternatives).toContain('a child with a coagulopathy nobody has tested for looks exactly like this');
    expect(alternatives).toContain('need-to-know rather than confidential');
    expect(alternatives).toContain('You solicit no disclosure and collect no free text');
    expect(patient.medicalAlternativesRemainOpen).toBe(true);
    expect(patient.freeTextDisclosureCollected).toBe(false);
    expect(patient.identifyingInformationCollected).toBe(false);
  });

  it('is careful about what a settled room means', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('establishes nothing about the next one');
    expect(later).toContain('it is not discharge readiness');
    expect(patient.laterChildRemainsInQualifiedCareAuthored).toBe(true);
    expect(patient.immediateSafetyProven).toBe(false);
    expect(patient.dischargeReadinessProven).toBe(false);
  });

  it('ends by naming whose decisions these are', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('It is not you, and it is not today');
    expect(narration).toContain('nobody in this example diagnosed anything, accused anyone');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.abuseFinallyProven).toBe(false);
    expect(patient.custodyDetermined).toBe(false);
  });

  it('never diagnoses, accuses, or decides', () => {
    expect(patient.perpetratorNamedByLearner).toBe(false);
    expect(patient.caregiverSeparatedByLearner).toBe(false);
    expect(patient.childRemovedByLearner).toBe(false);
    expect(patient.jurisdictionSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is physical abuse', 'the caregiver is lying', 'call child protective services', 'she should be removed', 'the mother did', 'the father did']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Enforces The Order It Argues For', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pediatricInjurySafeguardingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['psg-trajectory', 'psg-concern', 'psg-safeguarding', 'psg-alternatives', 'psg-later', 'psg-handoff']);
  });

  it('stays on the ownership when the alternatives review is attempted first', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    advance(engine, 2, 'review-pediatric-injury-medical-alternatives-and-information-boundary');
    expect(snapshot(engine)!.alternativesAtTick).toBeNull();
    expect(snapshot(engine)!.safeguardingAtTick).toBeNull();
    const prompt = pediatricInjurySafeguardingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('psg-safeguarding');
    expect(prompt.suggestion).toContain('both owned by other people');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pediatric-injury-safeguarding-concern-without-diagnosis');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.concernAtTick).toBeNull();
    expect(pediatricInjurySafeguardingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('psg-trajectory');
  });

  it('does not move on when the later safety state is refused for time', () => {
    // The gate reads the engine's clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-injury-safeguarding-escalation-response', payload: { action: 'review-pediatric-injury-medical-alternatives-and-information-boundary' } });
    engine.apply({ tick: 3, type: 'pediatric-injury-safeguarding-escalation-response', payload: { action: 'review-pediatric-injury-later-safety-state' } });
    engine.step();
    expect(snapshot(engine)!.alternativesAtTick).not.toBeNull();
    expect(snapshot(engine)!.laterSafetyAtTick).toBeNull();
    expect(pediatricInjurySafeguardingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('psg-later');
  });

  it('never diagnoses, accuses, or names an agency', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricInjurySafeguardingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['this is physical abuse', 'the caregiver is lying', 'call child protective services', 'she should be removed']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricInjurySafeguardingInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricInjurySafeguardingInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricInjurySafeguardingInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricInjurySafeguardingInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricInjurySafeguardingInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
