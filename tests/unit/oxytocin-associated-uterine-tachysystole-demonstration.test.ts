/**
 * The worked example and observed-state tutor for a complication somebody
 * caused.
 *
 * The uterus is being driven by an infusion that is still running, and the
 * fetus is being squeezed between contractions that leave too little time in
 * between.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { OXYTOCIN_ASSOCIATED_UTERINE_TACHYSYSTOLE as SCENARIO } from '../../src/modules/obstetrics/scenarios/oxytocin-associated-uterine-tachysystole';
import { OXYTOCIN_TACHYSYSTOLE_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/oxytocin-associated-uterine-tachysystole-fixtures';
import {
  OXYTOCIN_TACHYSYSTOLE_DEMONSTRATION_VERSION, oxytocinTachysystoleDemonstrationStep,
  supportsOxytocinTachysystoleDemonstration,
} from '../../src/modules/obstetrics/demo/oxytocin-associated-uterine-tachysystole-demonstration';
import { oxytocinTachysystoleInlinePrompt } from '../../src/modules/obstetrics/tutor/oxytocin-associated-uterine-tachysystole-guidance';
import type { OxytocinTachysystoleAction } from '../../src/modules/obstetrics/oxytocin-associated-uterine-tachysystole';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsOxytocinTachysystoleAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: OxytocinTachysystoleAction) => {
  engine.apply({ tick, type: 'oxytocin-associated-uterine-tachysystole-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = oxytocinTachysystoleDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'oxytocin-associated-uterine-tachysystole-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls Before It Studies', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(OXYTOCIN_TACHYSYSTOLE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsOxytocinTachysystoleDemonstration(SCENARIO)).toBe(true);
    expect(supportsOxytocinTachysystoleDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsOxytocinTachysystoleDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'recognition', 'readiness', 'reassess', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.readinessAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('brings senior help in before studying anything, and says why', () => {
    expect(beats[0]).toBe('support');
    const support = narrations[0]!;
    expect(support).toContain('before you study anything');
    expect(support).toContain('The drug that produced this is still running');
    expect(support).toContain('an interval the fetus spends under the same contractions');
  });

  it('reads the infusion increase and the fetal change as cause and effect', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('as cause and effect');
    expect(context).toContain('leave too little time in between');
    expect(context).toContain('when the placenta refills');
  });

  it('recognizes on the trajectory rather than one trace', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('on the trajectory rather than one trace');
    expect(recognition).toContain('The finding is the change over time');
    expect(recognition).toContain('argue about any of them separately');
    expect(patient.authoredOxytocinTachysystolePattern).toBe(true);
  });

  it('makes the first correction stopping the cause, and refuses two reflexes', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('The first correction is to stop causing it');
    expect(readiness).toContain('routine oxygen for a fetal heart-rate pattern is not supported');
    expect(readiness).toContain('treating the monitor rather than the mother');
  });

  it('ends on an early recovery and a cause that could be repeated', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('A partial recovery establishes no durable fetal safety');
    expect(handoff).toContain('the oxytocin decision and who makes it');
    expect(narration).toContain('a cause that could be repeated');
    expect(narration).toContain('This ends the example, not the labour.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.fetalRecoveryProven).toBe(false);
    expect(patient.restartEligibilityDetermined).toBe(false);
    expect(patient.birthPlanDetermined).toBe(false);
    expect(patient.newbornSafetyProven).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.authoredOxytocinTachysystolePattern).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the fetus is safe', 'this is only tachysystole', 'the oxytocin can be restarted', 'she will need a caesarean']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('touches nobody, operates no infusion, and plans no birth', () => {
    expect(patient.patientExaminedOrPalpatedByLearner).toBe(false);
    expect(patient.monitoringOrTestsInterpretedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.infusionOperatedByLearner).toBe(false);
    expect(patient.positionChangedByLearner).toBe(false);
    expect(patient.oxygenOrFluidDeliveredByLearner).toBe(false);
    expect(patient.drugOrDoseSelectedByLearner).toBe(false);
    expect(patient.fetalStimulationOrAmnioinfusionPerformedByLearner).toBe(false);
    expect(patient.anesthesiaSurgeryOrDeliveryPerformedByLearner).toBe(false);
    expect(patient.newbornCarePerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['turn off the pump', 'roll her onto her left', 'give her oxygen', 'run a litre']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Calls Before It Studies', () => {
  it('opens by bringing senior help in', () => {
    const engine = create(); engine.step();
    const prompt = oxytocinTachysystoleInlinePrompt('guided', { scenarioVersion: '0.1.0', oxytocinTachysystole: snapshot(engine) })!;
    expect(prompt.id).toBe('tachysystole-support');
    expect(prompt.suggestion).toContain('before you study anything');
    expect(prompt.because).toContain('The drug that produced this is still running');
  });

  it('couples the increase to the fetal change once help is coming', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = oxytocinTachysystoleInlinePrompt('guided', { scenarioVersion: '0.1.0', oxytocinTachysystole: snapshot(engine) })!;
    expect(prompt.id).toBe('tachysystole-context');
    expect(prompt.suggestion).toContain('as cause and effect');
    expect(prompt.because).toContain('when the placenta refills');
  });

  it('recognizes on the trajectory and keeps the alternatives open', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = oxytocinTachysystoleInlinePrompt('guided', { scenarioVersion: '0.1.0', oxytocinTachysystole: snapshot(engine) })!;
    expect(prompt.id).toBe('tachysystole-recognition');
    expect(prompt.suggestion).toContain('on the trajectory rather than one trace');
    expect(prompt.because).toContain('The finding is the change over time');
  });

  it('refuses the two reflexive additions', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = oxytocinTachysystoleInlinePrompt('guided', { scenarioVersion: '0.1.0', oxytocinTachysystole: snapshot(engine) })!;
    expect(prompt.id).toBe('tachysystole-readiness');
    expect(prompt.because).toContain('routine oxygen for a fetal heart-rate pattern is not supported');
    expect(prompt.because).toContain('treating the monitor rather than the mother');
  });

  it('never claims fetal safety, restart eligibility, or a birth plan', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = oxytocinTachysystoleInlinePrompt('guided', { scenarioVersion: '0.1.0', oxytocinTachysystole: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the fetus is safe', 'the oxytocin can be restarted', 'she will need a caesarean', 'this is only tachysystole']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(oxytocinTachysystoleInlinePrompt('guided', { scenarioVersion: '0.1.0', oxytocinTachysystole: patient })!.id).toBe('tachysystole-reassess');
    expect(oxytocinTachysystoleInlinePrompt('coached', { scenarioVersion: '0.1.0', oxytocinTachysystole: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(oxytocinTachysystoleInlinePrompt('unassisted', { scenarioVersion: '0.1.0', oxytocinTachysystole: patient })).toBeNull();
    expect(oxytocinTachysystoleInlinePrompt('guided', { scenarioVersion: '0.1.1', oxytocinTachysystole: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(oxytocinTachysystoleInlinePrompt('guided', { scenarioVersion: '0.1.0', oxytocinTachysystole: snapshot(engine) })).toBeNull();
  });
});
