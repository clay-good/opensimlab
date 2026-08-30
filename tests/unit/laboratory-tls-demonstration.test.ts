/**
 * The worked example and observed-state tutor for a syndrome he does not have yet.
 *
 * Both failures this lesson teaches are the same move pointing opposite ways:
 * settling a two-part answer into one part. Filing it as numbers in a well patient
 * and calling it tumour lysis syndrome are each a dropped qualifier, so the tests
 * hold the example to carrying both halves the whole way.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { LABORATORY_TLS_A_SYNDROME_HE_DOES_NOT_HAVE_YET as SCENARIO } from '../../src/modules/oncology/scenarios/laboratory-tls-a-syndrome-he-does-not-have-yet';
import { LABORATORY_TLS_FIXTURES as FIXTURES } from '../../src/modules/oncology/laboratory-tls-fixtures';
import {
  LABORATORY_TLS_DEMONSTRATION_VERSION, laboratoryTlsDemonstrationStep,
  supportsLaboratoryTlsDemonstration,
} from '../../src/modules/oncology/demo/laboratory-tls-demonstration';
import { laboratoryTlsInlinePrompt } from '../../src/modules/oncology/laboratory-tls-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.laboratoryTls;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = laboratoryTlsDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'laboratory-tls-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Keeps Both Halves Of The Answer', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(LABORATORY_TLS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsLaboratoryTlsDemonstration(SCENARIO)).toBe(true);
    expect(supportsLaboratoryTlsDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('records which definition is met before anything else', () => {
    expect(beats[0]).toBe('definition');
    for (const later of ['crossing', 'risk', 'escalate', 'intent', 'boundaries']) {
      expect(beats.indexOf('definition'), later).toBeLessThan(beats.indexOf(later));
    }
  });

  it('reaches handoff with the laboratory definition met and the clinical one not', () => {
    expect(patient.ended).toBe('handoff');
    expect(patient.laboratoryCriteriaMet).toBe(true);
    expect(patient.clinicalCriteriaMet).toBe(false);
  });

  it('takes neither the dismissal nor the overcall, which are the same dropped qualifier', () => {
    expect(patient.dismissalAttempted).toBe(false);
    expect(patient.overcallAttempted).toBe(false);
    expect(patient.waitForNextSetAttempted).toBe(false);
    expect(patient.standDownAttempted).toBe(false);
  });

  it('never narrates the bare name without its qualifier', () => {
    // "tumour lysis syndrome" unqualified is the overcall this lesson refuses.
    for (const narration of narrations) {
      const lower = narration.toLowerCase();
      if (lower.includes('tumour lysis syndrome')) {
        expect(lower, narration).toContain('calling it tumour lysis syndrome');
      }
    }
    expect(narrations.at(-1)).toContain('label qualified');
  });
});

describe('Requirement: The Tutor Refuses To Resolve The Gap', () => {
  it('opens on which definition is met', () => {
    const engine = create(); engine.step();
    const prompt = laboratoryTlsInlinePrompt('guided', {
      scenarioVersion: '0.1.0', laboratoryTls: snapshot(engine),
    })!;
    expect(prompt.id).toBe('laboratory-tls-definition');
    expect(prompt.because).toContain('qualifier is the finding');
  });

  it('treats the gap between bloods and patient as the presentation, not a contradiction', () => {
    const engine = create();
    for (const action of ['record-which-definition-is-met', 'record-what-crossed-and-when',
      'record-the-crossing-risk', 'escalate-to-the-treating-team',
      'record-bounded-monitoring-and-treatment-intent', 'review-boundaries', 'reassess'] as const) {
      engine.apply({ tick: 0, type: 'laboratory-tls-response', payload: { action } });
    }
    engine.step();
    const prompt = laboratoryTlsInlinePrompt('guided', {
      scenarioVersion: '0.1.0', laboratoryTls: snapshot(engine),
    })!;
    expect(prompt.id).toBe('laboratory-tls-observe');
    expect(prompt.because).toContain('rather than a contradiction');
  });

  it('is silent when unassisted and bound to the exact content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(laboratoryTlsInlinePrompt('unassisted', { scenarioVersion: '0.1.0', laboratoryTls: patient })).toBeNull();
    expect(laboratoryTlsInlinePrompt('guided', { scenarioVersion: '0.1.1', laboratoryTls: patient })).toBeNull();
  });
});
