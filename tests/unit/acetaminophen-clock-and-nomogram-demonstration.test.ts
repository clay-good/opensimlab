/**
 * The worked example and observed-state tutor for the one ingestion the
 * nomogram was actually built for.
 *
 * That is the difficulty rather than the relief: a tool that answers cleanly
 * teaches nothing about when it applies. Both the tutor and the example ask the
 * applicability question before reading where the point lands, keep the
 * reported tablet count and the six-hour-old liver panel out of the reasoning,
 * and refuse the stop that the 22-hour numbers appear to offer.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACETAMINOPHEN_CLOCK_AND_NOMOGRAM as SCENARIO } from '../../src/modules/toxicology/scenarios/acetaminophen-clock-and-nomogram';
import { ACETAMINOPHEN_FIXTURES as FIXTURES } from '../../src/modules/toxicology/acetaminophen-clock-and-nomogram-fixtures';
import {
  ACETAMINOPHEN_DEMONSTRATION_VERSION, acetaminophenDemonstrationStep,
  supportsAcetaminophenDemonstration,
} from '../../src/modules/toxicology/demo/acetaminophen-clock-and-nomogram-demonstration';
import { acetaminophenInlinePrompt } from '../../src/modules/toxicology/tutor/acetaminophen-clock-and-nomogram-guidance';
import type { AcetaminophenAction } from '../../src/modules/toxicology/acetaminophen-clock-and-nomogram';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyAcetaminophenAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AcetaminophenAction) => {
  engine.apply({ tick, type: 'acetaminophen-clock-and-nomogram-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = acetaminophenDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'acetaminophen-clock-and-nomogram-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Asks Whether The Tool Applies', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ACETAMINOPHEN_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAcetaminophenDemonstration(SCENARIO)).toBe(true);
    expect(supportsAcetaminophenDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAcetaminophenDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognize', 'support', 'evidence', 'report', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('names the four conditions before it reads where the point lands', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('single acute ingestion');
    expect(recognize).toContain('at least four hours after');
    expect(recognize).toContain('extended-release');
    expect(beats.indexOf('recognize')).toBeLessThan(beats.indexOf('evidence'));
  });

  it('keeps the tablet count out of the treatment reasoning', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('a story rather than a measurement');
    expect(opening).toContain('not a treatment guide');
  });

  it('reads the normal baseline liver panel as a baseline rather than an absence', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('a baseline rather than an absence');
    expect(evidence).toContain('nothing here has excluded a coingestion');
  });

  it('treats her safety as part of the care rather than as something after it', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('not a task for after the toxicology is settled');
  });

  it('confirms nothing, attributes nothing, and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.nomogramPlottedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.delayedAbsorptionExcluded).toBe(false);
    expect(patient.liverInjuryExcluded).toBe(false);
    expect(patient.coingestionExcluded).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['her liver is fine', 'she can be discharged', 'the course is complete', 'no liver injury']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('refuses the stop the 22-hour numbers appear to offer', () => {
    expect(patient.stoppingDeterminedByLearner).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(narrations[beats.indexOf('handoff')]).toContain('automatic 20- or 21-hour stop');
    expect(narration).toContain('Nothing was excluded');
  });

  it('selects no charcoal, product, dose, or route anywhere', () => {
    expect(patient.decontaminationSelectedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['150 mg/kg', 'give activated charcoal', 'start the 21-hour protocol', 'oral acetylcysteine']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Tests The Tool Before It Uses It', () => {
  it('opens on the product and the clock, without the tablet count', () => {
    const engine = create(); engine.step();
    const prompt = acetaminophenInlinePrompt('guided', {
      scenarioVersion: '0.1.0', acetaminophen: snapshot(engine),
    })!;
    expect(prompt.id).toBe('acetaminophen-trajectory');
    expect(prompt.because).toContain('a story rather than a measurement');
  });

  it('asks the applicability question before the plot', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = acetaminophenInlinePrompt('guided', {
      scenarioVersion: '0.1.0', acetaminophen: snapshot(engine),
    })!;
    expect(prompt.id).toBe('acetaminophen-recognize');
    expect(prompt.because).toContain('at least four hours after');
    expect(prompt.because).toContain('a different qualified evaluation');
  });

  it('counts the person among the owners', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = acetaminophenInlinePrompt('guided', {
      scenarioVersion: '0.1.0', acetaminophen: snapshot(engine),
    })!;
    expect(prompt.id).toBe('acetaminophen-support');
    expect(prompt.because).toContain('not a task to be done after the toxicology is settled');
  });

  it('refuses the two findings that look like good news', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = acetaminophenInlinePrompt('guided', {
      scenarioVersion: '0.1.0', acetaminophen: snapshot(engine),
    })!;
    expect(prompt.id).toBe('acetaminophen-evidence');
    expect(prompt.because).toContain('a baseline rather than an absence');
    expect(prompt.because).toContain('coingestion has not been excluded');
  });

  it('never plots, doses, stops, or clears her', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = acetaminophenInlinePrompt('guided', {
        scenarioVersion: '0.1.0', acetaminophen: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['150 mg/kg', 'stop the infusion', 'she can be discharged', 'no liver injury']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(acetaminophenInlinePrompt('guided', { scenarioVersion: '0.1.0', acetaminophen: patient })!.id)
      .toBe('acetaminophen-observe');
    expect(acetaminophenInlinePrompt('coached', { scenarioVersion: '0.1.0', acetaminophen: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(acetaminophenInlinePrompt('unassisted', { scenarioVersion: '0.1.0', acetaminophen: patient })).toBeNull();
    expect(acetaminophenInlinePrompt('guided', { scenarioVersion: '0.1.1', acetaminophen: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(acetaminophenInlinePrompt('guided', { scenarioVersion: '0.1.0', acetaminophen: snapshot(engine) })).toBeNull();
  });
});
