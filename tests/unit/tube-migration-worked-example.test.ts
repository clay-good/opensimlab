/**
 * The worked example and observed-state tutor for an answer that is obvious and
 * still has to wait.
 *
 * At 89%, the first minute of a migrated tube, a mucus plug and a post-turn
 * pneumothorax looks the same and is treated the same.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING as SCENARIO } from '../../src/modules/critical-care/scenarios/endotracheal-tube-migration-after-repositioning';
import { TUBE_MIGRATION_FIXTURES as FIXTURES } from '../../src/modules/critical-care/tube-migration-fixtures';
import {
  TUBE_MIGRATION_DEMONSTRATION_VERSION, tubeMigrationDemonstrationStep,
  supportsTubeMigrationDemonstration,
} from '../../src/modules/critical-care/demo/tube-migration-demonstration';
import { tubeMigrationInlinePrompt } from '../../src/modules/critical-care/tutor/tube-migration-guidance';
import type { TubeMigrationAction } from '../../src/modules/critical-care/tube-migration';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.endotrachealTubeMigrationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: TubeMigrationAction) => {
  engine.apply({ tick, type: 'endotracheal-tube-migration-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = tubeMigrationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'endotracheal-tube-migration-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Supports Before It Diagnoses', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(TUBE_MIGRATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsTubeMigrationDemonstration(SCENARIO)).toBe(true);
    expect(supportsTubeMigrationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsTubeMigrationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'endotracheal-tube-migration-after-repositioning-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognize', 'support', 'position', 'correct', 'reassess']);
    expect(patient.recognizedAtTick).toBeLessThan(patient.supportedAtTick!);
    expect(patient.supportedAtTick).toBeLessThan(patient.positionReviewedAtTick!);
    expect(patient.positionReviewedAtTick).toBeLessThan(patient.correctionAtTick!);
    expect(patient.correctionAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('reads the peak-to-plateau gap and the capnogram', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('a resistance problem rather than a stiff lung');
    expect(recognize).toContain('takes oesophageal placement off the table immediately');
  });

  it('says why support comes before the name', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('This step comes before the position panel on purpose');
    expect(support).toContain('the first minute of it looks the same and is treated the same');
  });

  it('calls the depth change persuasive rather than decisive', () => {
    const position = narrations[beats.indexOf('position')]!;
    expect(position).toContain('persuasive rather than decisive');
    expect(position).toContain('a mark is a proxy for a position');
  });

  it('refuses to make 22 cm a rule', () => {
    const correct = narrations[beats.indexOf('correct')]!;
    expect(correct).toContain('not a depth to carry to the next patient');
    expect(correct).toContain('is how a tube ends up above the cords');
  });

  it('names which findings are actually proof', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('The strongest evidence in that list is the pair');
    expect(reassess).toContain('the oxygenation improved without anyone buying it');
    expect(narration).toContain('the example still put help and oxygen in front of it');
  });

  it('never withdraws the tube, sets a depth for anyone, or confirms the migration', () => {
    // Guard the instruction voice, not the nouns: the position beat exists to keep
    // the alternatives open, so a bare noun match would fail on the lesson's point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['pull the tube back three centimetres', 'always secure at 22',
      'increase the tidal volume to', 'get a chest x-ray now', 'the migration is confirmed']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Chain', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = tubeMigrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['etm-recognize', 'etm-support', 'etm-position', 'etm-correct', 'etm-reassess']);
  });

  it('stays on the support when the position panel is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-post-repositioning-ventilation-change');
    advance(engine, 1, 'integrate-tube-depth-and-bilateral-ventilation');
    expect(snapshot(engine)!.positionReviewedAtTick).toBeNull();
    const prompt = tubeMigrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('etm-support');
    expect(prompt.suggestion).toContain('the answer can wait ninety seconds');
  });

  it('stays on the position panel when the correction is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-post-repositioning-ventilation-change');
    advance(engine, 1, 'bridge-post-repositioning-oxygenation');
    advance(engine, 2, 'record-experienced-tube-correction-intent');
    expect(snapshot(engine)!.correctionAtTick).toBeNull();
    expect(tubeMigrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('etm-position');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'bridge-post-repositioning-oxygenation');
    expect(snapshot(engine)!.supportedAtTick).toBeNull();
    expect(tubeMigrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('etm-recognize');
  });

  it('never moves the tube or sets a universal depth anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = tubeMigrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['pull the tube back three centimetres', 'always secure at 22', 'get a chest x-ray now']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(tubeMigrationInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(tubeMigrationInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(tubeMigrationInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(tubeMigrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(tubeMigrationInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
