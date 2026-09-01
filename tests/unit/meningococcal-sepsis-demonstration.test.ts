/**
 * The worked example and observed-state tutor for a presentation that will not
 * wait for a result.
 *
 * Both refused shortcuts here are exclusions offered by a number or a history,
 * and both are refused without ever asserting the diagnosis: recognizing a
 * pattern is not confirming one, and nothing in this lesson confirms anything.
 * The example also waits for the authored review to show an inadequate response
 * before escalating for attendance, rather than performing that escalation
 * because a demonstration ought to contain it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MENINGOCOCCAL_SEPSIS_RECOGNITION_AND_ESCALATION as SCENARIO } from '../../src/modules/infectious-disease/scenarios/meningococcal-sepsis-recognition-and-escalation';
import { MENINGOCOCCAL_SEPSIS_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/meningococcal-sepsis-fixtures';
import {
  MENINGOCOCCAL_SEPSIS_DEMONSTRATION_VERSION, meningococcalSepsisDemonstrationStep,
  supportsMeningococcalSepsisDemonstration,
} from '../../src/modules/infectious-disease/demo/meningococcal-sepsis-demonstration';
import { meningococcalSepsisInlinePrompt } from '../../src/modules/infectious-disease/meningococcal-sepsis-tutor';
import type { MeningococcalSepsisAction } from '../../src/modules/infectious-disease/meningococcal-sepsis';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.meningococcalSepsis;
const advance = (engine: AnesthesiaEngine, tick: number, action: MeningococcalSepsisAction) => {
  engine.apply({ tick, type: 'meningococcal-sepsis-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 400_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = meningococcalSepsisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'meningococcal-sepsis-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Recognizes Without Diagnosing', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MENINGOCOCCAL_SEPSIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMeningococcalSepsisDemonstration(SCENARIO)).toBe(true);
    expect(supportsMeningococcalSepsisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff, and reaches the escalation only after the review', () => {
    expect(beats.slice(0, 7)).toEqual(['rash', 'senior', 'bloods', 'antimicrobial',
      'fluid', 'boundaries', 'monitor']);
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
    if (patient.consultantAtTick !== null) {
      expect(beats.indexOf('reassess')).toBeLessThan(beats.indexOf('consultant'));
    }
  });

  it('records intent without selecting an agent, dose, or route', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['ceftriaxone', 'mg/kg', 'millilitres per kilogram', 'give 2 g']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narrations[beats.indexOf('antimicrobial')]).toContain('No agent, dose, route');
  });

  it('never asserts the diagnosis or the organism', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she has meningococcal disease', 'the organism is', 'confirmed meningococc']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narrations[0]).toContain('Recognition is not a diagnosis');
    expect(narration).toContain('No organism was named');
  });

  it('takes none of the three shortcuts the scenario refuses', () => {
    expect(patient.markerExclusionAttempted).toBe(false);
    expect(patient.vaccinationExclusionAttempted).toBe(false);
    expect(patient.transferDelayAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Refuses The Exclusions', () => {
  it('opens on recording the pattern', () => {
    const engine = create(); engine.step();
    const prompt = meningococcalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', meningococcalSepsis: snapshot(engine) })!;
    expect(prompt.id).toBe('meningococcal-rash');
    expect(prompt.because).toContain('Recognition is not a diagnosis');
  });

  it('names both refused exclusions at the boundary review', () => {
    const engine = create();
    for (const action of ['recognize-rash', 'call-senior', 'request-bloods',
      'record-antimicrobial-intent', 'record-fluid-intent'] as const) {
      advance(engine, 0, action);
    }
    const prompt = meningococcalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', meningococcalSepsis: snapshot(engine) })!;
    expect(prompt.id).toBe('meningococcal-boundaries');
    expect(prompt.because).toContain('does not rule it out');
    expect(prompt.because).toContain('serogroup B');
  });

  it('never selects an agent or a dose, and never delays transfer', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = meningococcalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', meningococcalSepsis: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['ceftriaxone', 'mg/kg', 'hold the transfer', 'wait for the result']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(meningococcalSepsisInlinePrompt('unassisted', { scenarioVersion: '0.1.0', meningococcalSepsis: patient })).toBeNull();
    expect(meningococcalSepsisInlinePrompt('guided', { scenarioVersion: '0.1.1', meningococcalSepsis: patient })).toBeNull();
  });
});
