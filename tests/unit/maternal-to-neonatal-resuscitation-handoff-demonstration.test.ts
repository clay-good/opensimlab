/**
 * The worked example and observed-state tutor for two patients in one room.
 *
 * A mother is still on the table and a newborn is being ventilated a few feet
 * away. The failure this refuses is the quiet one: nobody says who owns which
 * patient, and one of them stops being watched.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MATERNAL_TO_NEONATAL_RESUSCITATION_HANDOFF as SCENARIO } from '../../src/modules/obstetrics/scenarios/maternal-to-neonatal-resuscitation-handoff';
import { MATERNAL_NEONATAL_HANDOFF_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/maternal-to-neonatal-resuscitation-handoff-fixtures';
import {
  MATERNAL_NEONATAL_HANDOFF_DEMONSTRATION_VERSION, maternalNeonatalHandoffDemonstrationStep,
  supportsMaternalNeonatalHandoffDemonstration,
} from '../../src/modules/obstetrics/demo/maternal-to-neonatal-resuscitation-handoff-demonstration';
import { maternalNeonatalHandoffInlinePrompt } from '../../src/modules/obstetrics/tutor/maternal-to-neonatal-resuscitation-handoff-guidance';
import type { MaternalNeonatalHandoffAction } from '../../src/modules/obstetrics/maternal-to-neonatal-resuscitation-handoff';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsMaternalNeonatalHandoffAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MaternalNeonatalHandoffAction) => {
  engine.apply({ tick, type: 'maternal-to-neonatal-resuscitation-handoff-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = maternalNeonatalHandoffDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'maternal-to-neonatal-resuscitation-handoff-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Names The Owners First', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MATERNAL_NEONATAL_HANDOFF_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMaternalNeonatalHandoffDemonstration(SCENARIO)).toBe(true);
    expect(supportsMaternalNeonatalHandoffDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMaternalNeonatalHandoffDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'safety', 'transfer', 'reassess', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.transferAtTick!);
    expect(patient.transferAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('names who owns which patient first, and says why it goes wrong', () => {
    expect(beats[0]).toBe('support');
    const support = narrations[0]!;
    expect(support).toContain('who owns the mother and who owns the newborn');
    expect(support).toContain('it is an assumption that the other team has it');
    expect(support).toContain('rather than to whoever is nearest');
  });

  it('puts both clocks and the missing findings in one view', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('birth at 14:07');
    expect(context).toContain('Her surgery is still going on.');
    expect(context).toContain('do not exist yet');
  });

  it('reads the rising heart rate as ventilation working rather than a well newborn', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('not as a newborn who is well');
    expect(safety).toContain('the narrowest claim available');
    expect(safety).toContain('being produced continuously, by someone, right now');
  });

  it('hands over in a structure and makes the receiver say it back', () => {
    const transfer = narrations[beats.indexOf('transfer')]!;
    expect(transfer).toContain('make the receiver say it back');
    expect(transfer).toContain('in that order, once, without interruption'.replace('in that', 'in that'));
    expect(transfer).toContain('while it can still be corrected');
  });

  it('ends on two patients, neither of them finished', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('establishes newborn stability');
    expect(handoff).toContain('what the family have been told and by whom');
    expect(narration).toContain('neither of them finished');
    expect(narration).toContain('This ends the example, not the care.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.newbornStabilityProven).toBe(false);
    expect(patient.maternalRecoveryProven).toBe(false);
    expect(patient.placentalCauseDetermined).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.authoredMaternalNeonatalHandoff).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the newborn is stable', 'the baby is fine', 'she has recovered', 'the placenta explains']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('touches neither patient, resuscitates nobody, and counsels no family', () => {
    expect(patient.maternalOrNewbornExaminedByLearner).toBe(false);
    expect(patient.monitoringOrTestsInterpretedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.newbornResuscitationPerformedByLearner).toBe(false);
    expect(patient.oxygenOrVentilationDeliveredByLearner).toBe(false);
    expect(patient.airwayManagedByLearner).toBe(false);
    expect(patient.compressionsAccessFluidBloodGlucoseOrDrugDeliveredByLearner).toBe(false);
    expect(patient.maternalAnesthesiaOrSurgeryPerformedByLearner).toBe(false);
    expect(patient.newbornCareOrTransportPerformedByLearner).toBe(false);
    expect(patient.familyCounselingPerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['take over the ventilation', 'check the glucose', 'tell her that', 'move the baby to']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Names The Owners First', () => {
  it('opens by naming the owners out loud', () => {
    const engine = create(); engine.step();
    const prompt = maternalNeonatalHandoffInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalNeonatalHandoff: snapshot(engine) })!;
    expect(prompt.id).toBe('neonatal-handoff-support');
    expect(prompt.suggestion).toContain('who owns the mother and who owns the newborn');
    expect(prompt.because).toContain('it is an assumption that the other team has it');
  });

  it('puts both clocks in one view once ownership is named', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = maternalNeonatalHandoffInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalNeonatalHandoff: snapshot(engine) })!;
    expect(prompt.id).toBe('neonatal-handoff-context');
    expect(prompt.suggestion).toContain('both clocks and the whole family in one view');
    expect(prompt.because).toContain('do not exist yet');
  });

  it('keeps the claim narrow behind a rising heart rate', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = maternalNeonatalHandoffInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalNeonatalHandoff: snapshot(engine) })!;
    expect(prompt.id).toBe('neonatal-handoff-safety');
    expect(prompt.suggestion).toContain('not as a newborn who is well');
    expect(prompt.because).toContain('the narrowest claim available');
  });

  it('requires the readback rather than treating it as a formality', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = maternalNeonatalHandoffInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalNeonatalHandoff: snapshot(engine) })!;
    expect(prompt.id).toBe('neonatal-handoff-transfer');
    expect(prompt.because).toContain('The readback is not a formality');
    expect(prompt.because).toContain('while it can still be corrected');
  });

  it('never claims stability, recovery, or a placental cause', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = maternalNeonatalHandoffInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalNeonatalHandoff: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the newborn is stable', 'she has recovered', 'the placenta explains', 'the baby is fine']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(maternalNeonatalHandoffInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalNeonatalHandoff: patient })!.id).toBe('neonatal-handoff-reassess');
    expect(maternalNeonatalHandoffInlinePrompt('coached', { scenarioVersion: '0.1.0', maternalNeonatalHandoff: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(maternalNeonatalHandoffInlinePrompt('unassisted', { scenarioVersion: '0.1.0', maternalNeonatalHandoff: patient })).toBeNull();
    expect(maternalNeonatalHandoffInlinePrompt('guided', { scenarioVersion: '0.1.1', maternalNeonatalHandoff: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(maternalNeonatalHandoffInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalNeonatalHandoff: snapshot(engine) })).toBeNull();
  });
});
