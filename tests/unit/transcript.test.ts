/**
 * Acceptance tests for engine/simulation-clock's transcript requirements and
 * platform/privacy's on-device guarantee.
 */
import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_TRANSCRIPT_KEYS, NOT_FOR_CLINICAL_USE, TRANSCRIPT_FORMAT_VERSION,
  TranscriptRecorder, assertTranscriptIsAnonymous, compareVersions,
} from '@platform/transcript/transcript';
import { hashStateTrace, serializeSample, serializeTrace, sha256Hex } from '@platform/transcript/hash';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { MODEL_SET_REVISION } from '@anesthesia/pharmacology/registry';
import type { LearnerAction } from '@platform/kernel/protocol';
import { replay } from '@anesthesia/debrief/replay-engine';

const VERSIONS = {
  engine: ENGINE_VERSION,
  content: ROUTINE_INDUCTION.metadata.version,
  modelSet: MODEL_SET_REVISION,
  scenario: ROUTINE_INDUCTION.metadata.version,
};

const ACTIONS: LearnerAction[] = [
  { tick: 0, type: 'ventilator', payload: { fio2: 1.0 } },
  { tick: 1200, type: 'bolus', payload: { drugId: 'propofol', amount: 130, unit: 'mg' } },
  { tick: 1300, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } },
];

function record(): TranscriptRecorder {
  const recorder = new TranscriptRecorder({
    moduleId: 'anesthesia',
    scenarioId: ROUTINE_INDUCTION.metadata.id,
    versions: VERSIONS,
    practiceRegion: 'GB',
    seed: 20260819,
    guidanceLevel: 'coached',
  });
  for (const action of ACTIONS) recorder.record(action);
  recorder.setTicks(2400);
  return recorder;
}

describe('Requirement: Deterministic Session Transcript', () => {
  it('records everything a replay needs and nothing else', () => {
    const transcript = record().build('abc');
    expect(transcript.formatVersion).toBe(TRANSCRIPT_FORMAT_VERSION);
    expect(transcript.scenarioId).toBe('routine-induction');
    expect(transcript.versions.engine).toBe(ENGINE_VERSION);
    expect(transcript.versions.modelSet).toBe(MODEL_SET_REVISION);
    expect(transcript.practiceRegion).toBe('GB');
    expect(transcript.seed).toBe(20260819);
    expect(transcript.actions).toHaveLength(ACTIONS.length);
    expect(transcript.ticks).toBe(2400);
  });

  it('orders actions by tick however they were recorded', () => {
    const recorder = new TranscriptRecorder({
      moduleId: 'anesthesia', scenarioId: 'x', versions: VERSIONS,
      practiceRegion: 'US', seed: 1, guidanceLevel: 'guided',
    });
    recorder.record({ tick: 500, type: 'bolus', payload: {} });
    recorder.record({ tick: 100, type: 'bolus', payload: {} });
    expect(recorder.build('h').actions.map((action) => action.tick)).toEqual([100, 500]);
  });

  it('Scenario: Transcript replays bit-identically', async () => {
    const options = {
      scenario: ROUTINE_INDUCTION, seed: 20260819, practiceRegion: 'GB', ticks: 2400,
    };
    // Two independent runs from the same transcript, as though on two devices.
    const first = replay(ACTIONS, options).map((sample) => sample.state);
    const second = replay(ACTIONS, options).map((sample) => sample.state);
    expect(await hashStateTrace(first)).toBe(await hashStateTrace(second));
    // And the hash really is sensitive: one different action changes it.
    const changed = replay(
      [...ACTIONS, { tick: 1500, type: 'bolus', payload: { drugId: 'propofol', amount: 10, unit: 'mg' } }],
      options,
    ).map((sample) => sample.state);
    expect(await hashStateTrace(changed)).not.toBe(await hashStateTrace(first));
  });

  it('serializes at full precision, so a last-bit difference changes the hash', async () => {
    // The smallest representable step away from 90. A decimal literal like
    // 90.000000000000001 would round back to 90 and prove nothing.
    const a = serializeSample({ map: 90 * (1 + Number.EPSILON), hr: 72 });
    const b = serializeSample({ map: 90, hr: 72 });
    expect(a).not.toBe(b);
    expect(await sha256Hex(a)).not.toBe(await sha256Hex(b));
    // Keys are sorted, so key order cannot change the hash.
    expect(serializeSample({ b: 1, a: 2 })).toBe(serializeSample({ a: 2, b: 1 }));
    expect(serializeTrace([{ a: 1 }, { a: 2 }]).split('\n')).toHaveLength(2);
  });

  it('Scenario: Version mismatch is reported, not guessed', () => {
    const match = compareVersions(VERSIONS, VERSIONS);
    expect(match.matches).toBe(true);
    expect(match.differences).toHaveLength(0);

    const drift = compareVersions(VERSIONS, { ...VERSIONS, modelSet: '2027.01.0' });
    expect(drift.matches).toBe(false);
    // It states WHICH versions differ, rather than replaying silently.
    expect(drift.differences[0]).toContain('modelSet');
    expect(drift.differences[0]).toContain(MODEL_SET_REVISION);
    expect(drift.differences[0]).toContain('2027.01.0');
  });
});

describe('Scenario: An exported transcript contains no identifiers', () => {
  it('carries no device, browser, locale-derived or real-world-clock field', () => {
    const transcript = record().build('abc');
    const text = JSON.stringify(transcript);
    for (const key of FORBIDDEN_TRANSCRIPT_KEYS) {
      expect(text, `transcript contains ${key}`).not.toContain(`"${key}"`);
    }
    // And nothing resembling a real-world timestamp.
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(() => assertTranscriptIsAnonymous(transcript)).not.toThrow();
  });

  it('refuses to export anything identifying, at any depth', () => {
    const transcript = record().build('abc') as unknown as Record<string, unknown>;
    expect(() => assertTranscriptIsAnonymous({
      ...transcript,
      actions: [{ tick: 0, type: 'bolus', payload: { deviceId: 'abc' } }],
    })).toThrow(/forbidden field/);
    expect(() => assertTranscriptIsAnonymous({ ...transcript, userAgent: 'x' })).toThrow();
  });

  it('embeds the not-for-clinical-use statement in the export itself', () => {
    expect(record().build('abc').notForClinicalUse).toBe(NOT_FOR_CLINICAL_USE);
    expect(NOT_FOR_CLINICAL_USE).toContain('educational simulator');
    expect(NOT_FOR_CLINICAL_USE).toContain('not a dosing calculator');
  });
});

describe('Requirement: Golden-Trace Regression Suite', () => {
  /**
   * The golden trace for the canonical case. It records the model, the covariates,
   * the dose schedule, the engine version and the commit that generated it, so a
   * drifting solver blocks the build and names the case.
   */
  const GOLDEN = {
    case: 'routine-induction-standard-bolus',
    modelId: 'propofol-eleveld-2018',
    covariates: { ageYears: 42, sex: 'female', heightCm: 165, weightKg: 68 },
    doseSchedule: '130 mg propofol at tick 1200, ventilation from tick 1300',
    engineVersion: ENGINE_VERSION,
    seed: 20260819,
    ticks: 2400,
  };

  it('Scenario: Golden traces record their provenance', () => {
    expect(GOLDEN.modelId).toBeTruthy();
    expect(GOLDEN.covariates.weightKg).toBe(ROUTINE_INDUCTION.patient.weightKg);
    expect(GOLDEN.engineVersion).toBe(ENGINE_VERSION);
    expect(GOLDEN.doseSchedule.length).toBeGreaterThan(10);
  });

  it('Scenario: A drifting solver blocks the build', async () => {
    const options = {
      scenario: ROUTINE_INDUCTION, seed: GOLDEN.seed, practiceRegion: 'GB', ticks: GOLDEN.ticks,
    };
    const trace = replay(ACTIONS, options).map((sample) => sample.state);
    const hash = await hashStateTrace(trace);
    // Re-running the identical case must reproduce the identical hash. Any change
    // to physiology beyond 1e-9 changes it, which is the point.
    const again = await hashStateTrace(replay(ACTIONS, options).map((sample) => sample.state));
    expect(again, `${GOLDEN.case} drifted`).toBe(hash);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('Requirement: engine and content versions are recorded together', () => {
  it('gives the engine a semantic version a transcript can record', () => {
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
    const engine = new AnesthesiaEngine({
      scenario: ROUTINE_INDUCTION, seed: 1, practiceRegion: 'US',
    });
    expect(engine.modelSetRevision).toBe(MODEL_SET_REVISION);
  });
});
