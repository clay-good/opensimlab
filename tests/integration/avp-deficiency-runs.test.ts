import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import {
  AVP_DEFICIENCY_VOLUME_TICKS as VOLUME, AVP_DEFICIENCY_DELAY_TICKS as DELAY,
  AVP_DEFICIENCY_DESMOPRESSIN_TICKS as DESMOPRESSIN, AVP_DEFICIENCY_RESPONSE_TICKS as RESPONSE,
  AVP_DEFICIENCY_UNCONTROLLED_TICKS as UNCONTROLLED, AVP_DEFICIENCY_TAKEOVER_TICKS as TAKEOVER,
  AVP_DEFICIENCY_SESSION_TICKS as SESSION, type AvpDeficiencyAction,
} from '../../src/modules/endocrine-metabolic/avp-deficiency';
import { AVP_DEFICIENCY_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/avp-deficiency-fixtures';
import { HYPERNATREMIC_DEHYDRATION_AVP_DEFICIENCY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypernatremic-dehydration-avp-deficiency';
import { avpDeficiencyCompletionEvidence } from '../../src/modules/endocrine-metabolic/avp-deficiency-completion';
import { avpDeficiencyInlinePrompt } from '../../src/modules/endocrine-metabolic/avp-deficiency-tutor';

type Frame = ReturnType<AnesthesiaEngine['step']>;
type Choices = readonly (readonly [number, AvpDeficiencyAction])[];
const OBJECTIVES = ['avp-context', 'avp-circulation', 'avp-water-control', 'avp-reassessment', 'avp-handoff'];
const newEngine = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: AvpDeficiencyAction): LearnerAction => ({ tick, type: 'avp-deficiency-response', payload: { action } });

function run(actions: Choices, until: number, options: {
  level?: GuidanceLevel; checkpoints?: readonly number[]; region?: 'US' | 'GB'; hash?: boolean;
} = {}) {
  const engine = newEngine(options.region); const hash = createHash('sha256');
  const events: EngineEvent[] = []; const frames = new Map<number, Frame>(); const prompts = new Set<string>();
  const capture = new Set([0, until, ...actions.map(([tick]) => tick), ...(options.checkpoints ?? [])]);
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    // Bind every engine field and waveform sample, not only final sodium or vitals.
    if (options.hash) hash.update(JSON.stringify(frame));
    if (capture.has(tick)) {
      frames.set(tick, frame); const before = JSON.stringify(frame);
      const prompt = avpDeficiencyInlinePrompt(options.level ?? 'unassisted', {
        scenarioVersion: SCENARIO.metadata.version, avpDeficiency: frame.equipment.resuscitation.avpDeficiency,
      });
      if (prompt) prompts.add(prompt.id);
      expect(JSON.stringify(frame)).toBe(before);
    }
  }
  expect(next).toBe(actions.length);
  return { engine, events, frames, prompts, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.avpDeficiency! };
}
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

describe('Known AVP deficiency through the real engine and causal debrief', () => {
  it('binds exact content and capability without promoting pending inclusive or production evidence', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(OBJECTIVES);
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.1', maturity: 'preview', estimatedMinutes: 135 });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES).toMatchObject({ scenarioId: SCENARIO.metadata.id, contentVersion: '0.1.1', seed: 4919 });
    const minute = 60 * TICKS_PER_SECOND;
    expect([VOLUME, DELAY, DESMOPRESSIN, UNCONTROLLED, RESPONSE, TAKEOVER, SESSION])
      .toEqual([15, 30, 30, 120, 120, 60, 300].map((minutes) => minutes * minute));
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(avpDeficiencyCompletionEvidence(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic')).toHaveLength(9);
    for (const scenario of [{ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.2' } },
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 999 } }]) {
      expect(avpDeficiencyCompletionEvidence(scenario, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    }
    expect(avpDeficiencyCompletionEvidence(SCENARIO, `${ENGINE_VERSION}-changed`, 'endocrine-metabolic')).toEqual([]);
    expect(avpDeficiencyCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    const frame = newEngine().step();
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining(['etco2MmHg', 'fio2']));
    expect(frame.equipment.resuscitation.avpDeficiency).toMatchObject({ observation: null, peakObservedSodiumMmolL: 162 });
    expect(frame.state).toMatchObject({ systolicMmHg: 90, diastolicMmHg: 54, meanArterialMmHg: 66,
      heartRateBpm: 112, respiratoryRateBpm: 20, spo2Percent: 98, coreTemperatureC: 37.1 });
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every complete %s frame identically across all three guidance levels', (path) => {
    const actions: Choices = FIXTURES[path]; const corrected = path === 'expert' || path === 'recovery';
    const until = corrected ? actions.at(-1)![0] + 1 : TAKEOVER + 1;
    const guided = run(actions, until, { level: 'guided', hash: true });
    for (const level of ['coached', 'unassisted'] as const) {
      const other = run(actions, until, { level, hash: true });
      expect(other.hash).toBe(guided.hash); expect(other.patient).toEqual(guided.patient);
      if (level === 'unassisted') expect(other.prompts.size).toBe(0);
      else expect(other.prompts.size).toBeGreaterThan(0);
    }
    expect(guided.prompts.size).toBeGreaterThan(0);
    expect(guided.patient).toMatchObject({ ended: corrected ? 'handoff' : 'instructor-takeover',
      responseObserved: corrected, peakObservedSodiumMmolL: path === 'noAction' ? 162 : path === 'expert' ? 163 : 164,
      volumeDelayed: path !== 'expert', normalizationAttempted: path === 'commonError' || path === 'recovery',
      withholdingChosen: path === 'commonError' || path === 'recovery', durableRecoveryProven: false });
    if (corrected) expect(guided.patient.observation).toMatchObject({ sodiumMmolL: path === 'expert' ? 162 : 163,
      urineOutputMlPerHour: 80, urineOsmolalityMosmPerKg: 500 });
    if (path === 'noAction') expect(guided.patient.observation).toBeNull();
    expect(findings(guided.events).map(({ objectiveId }) => objectiveId)).toEqual(OBJECTIVES);
    expect(findings(guided.events).map(({ outcome }) => outcome)).toEqual(path === 'expert' ? Array(5).fill('met')
      : path === 'recovery' ? ['met', 'met', 'not-met', 'met', 'met'] : Array(5).fill('not-met'));
    const ended = guided.patient;
    guided.engine.apply(choice(999999, 'reassess')); guided.engine.step();
    expect(guided.engine.equipment().resuscitation.avpDeficiency).toEqual(ended);
  }, 180_000);

  it('changes visible circulation without leaking new sodium, urine output, or osmolality', () => {
    const result = run([[0, 'restore-volume'], [0, 'reassess'], [UNCONTROLLED + 1, 'reassess']], UNCONTROLLED + 1,
      { level: 'guided', checkpoints: [VOLUME - 1, VOLUME, UNCONTROLLED] });
    expect(result.frames.get(VOLUME - 1)!.equipment.resuscitation.avpDeficiency?.circulationRestored).toBe(false);
    for (const tick of [VOLUME, UNCONTROLLED]) {
      const frame = result.frames.get(tick)!;
      expect(frame.state).toMatchObject({ systolicMmHg: 110, diastolicMmHg: 68, meanArterialMmHg: 82, heartRateBpm: 92 });
      expect(frame.equipment.resuscitation.avpDeficiency).toMatchObject({ circulationRestored: true,
        volumeObserved: false, diluteLossesObserved: false, peakObservedSodiumMmolL: 162,
        observation: { atTick: 0, sodiumMmolL: 162, urineOutputMlPerHour: 60, urineOsmolalityMosmPerKg: 100 } });
      expect(frame.state).not.toHaveProperty('sodiumMmolL');
      expect(frame.state).not.toHaveProperty('urineOutputMlPerHour');
      expect(frame.state).not.toHaveProperty('urineOsmolalityMosmPerKg');
    }
    expect(result.events.filter(({ tick }) => tick > 0 && tick <= UNCONTROLLED).map(({ message }) => message).join(' '))
      .not.toMatch(/\b163\b|\b165\b|\b450\b|\b95\b/);
    expect(result.patient).toMatchObject({ peakObservedSodiumMmolL: 165, volumeObserved: true, diluteLossesObserved: true,
      observation: { sodiumMmolL: 165, urineOutputMlPerHour: 450, urineOsmolalityMosmPerKg: 95 } });
  }, 60_000);

  it.each([['replace-water', 'restore-desmopressin'], ['restore-desmopressin', 'replace-water']] as const)(
    'allows %s then %s at restored circulation without an observation or administrative gate', (first, second) => {
      const result = run([[0, 'restore-volume'], [VOLUME - 1, first], [VOLUME - 1, second],
        [VOLUME, first], [VOLUME, second], [VOLUME + RESPONSE, 'handoff'],
        [VOLUME + RESPONSE, 'reassess'], [VOLUME + RESPONSE, 'call-support'],
        [VOLUME + RESPONSE, 'review-context'], [VOLUME + RESPONSE, 'monitor'], [VOLUME + RESPONSE, 'handoff']],
      VOLUME + RESPONSE, { checkpoints: [VOLUME + DESMOPRESSIN, VOLUME + RESPONSE - 1] });
      expect(result.frames.get(VOLUME - 1)!.equipment.resuscitation.avpDeficiency)
        .toMatchObject({ waterAtTick: null, desmopressinAtTick: null });
      expect(result.frames.get(VOLUME)!.equipment.resuscitation.avpDeficiency)
        .toMatchObject({ waterAtTick: VOLUME, desmopressinAtTick: VOLUME, supportActive: false,
          contextReviewedAtTick: null, monitoringAtTick: null, observation: null });
      for (const tick of [VOLUME + DESMOPRESSIN, VOLUME + RESPONSE - 1]) {
        expect(result.frames.get(tick)!.equipment.resuscitation.avpDeficiency)
          .toMatchObject({ observation: null, responseObserved: false, peakObservedSodiumMmolL: 162 });
      }
      expect(result.events.some(({ eventId }) => eventId === `avp-deficiency-handoff-refused-${VOLUME + RESPONSE}`)).toBe(true);
      expect(result.patient).toMatchObject({ ended: 'handoff', responseObserved: true, diluteLossesObserved: false,
        observation: { sodiumMmolL: 162, urineOutputMlPerHour: 80, urineOsmolalityMosmPerKg: 500 } });
      // Missing an early teaching observation loses that objective, never blocks appropriate late handoff.
      expect(findings(result.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'not-met', 'met']);
    }, 60_000);

  it('does not mistake a desmopressin-only urine response for water-deficit correction', () => {
    const at = VOLUME + DESMOPRESSIN;
    const result = run([[0, 'restore-volume'], [VOLUME, 'reassess'], [VOLUME, 'restore-desmopressin'],
      [at + 1, 'reassess'], [VOLUME + RESPONSE, 'handoff']], VOLUME + RESPONSE,
    { checkpoints: [at - 1, at] });
    for (const tick of [at - 1, at]) expect(result.frames.get(tick)!.equipment.resuscitation.avpDeficiency)
      .toMatchObject({ observation: { atTick: VOLUME, sodiumMmolL: 163, urineOutputMlPerHour: 450, urineOsmolalityMosmPerKg: 95 },
        responseObserved: false, peakObservedSodiumMmolL: 163 });
    expect(result.patient).toMatchObject({ ended: null, waterAtTick: null, responseObserved: false,
      observation: { sodiumMmolL: 163, urineOutputMlPerHour: 80, urineOsmolalityMosmPerKg: 500 } });
    expect(findings(result.events).find(({ objectiveId }) => objectiveId === 'avp-water-control')?.outcome).toBe('not-met');
  }, 60_000);

  it('bounds incomplete post-volume care at 300 minutes without inventing a latest result', () => {
    const result = run([[0, 'restore-volume'], [VOLUME, 'reassess']], SESSION,
      { checkpoints: [TAKEOVER, SESSION - 1] });
    for (const tick of [TAKEOVER, SESSION - 1]) expect(result.frames.get(tick)!.equipment.resuscitation.avpDeficiency?.ended).toBeNull();
    expect(result.patient).toMatchObject({ ended: 'instructor-takeover', responseObserved: false, peakObservedSodiumMmolL: 163,
      observation: { atTick: VOLUME, sodiumMmolL: 163, urineOutputMlPerHour: 450, urineOsmolalityMosmPerKg: 95 } });
    expect(findings(result.events).find(({ objectiveId }) => objectiveId === 'avp-handoff')?.outcome).toBe('not-met');
  }, 90_000);

  it('uses the same declared GB pathway without claiming a completed regional matrix', () => {
    const result = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0], { region: 'GB' });
    expect(result.patient).toMatchObject({ ended: 'handoff', peakObservedSodiumMmolL: 163,
      observation: { sodiumMmolL: 162 }, durableRecoveryProven: false });
    expect(findings(result.events).map(({ outcome }) => outcome)).toEqual(Array(5).fill('met'));
  }, 60_000);

  it('rejects generic and malformed actions without trusting timestamps or echoing payloads', () => {
    const engine = newEngine(); const control = newEngine();
    for (const [type, payload] of [['bolus', { drugId: 'propofol', amount: 999, unit: 'mg' }],
      ['fluid-bolus', { amountMl: 999 }], ['ventilator', { fio2: 1 }], ['laryngoscopy', {}],
      ['hyponatremia-correction-response', { action: 'relower' }]] as const) {
      engine.apply({ tick: 999999, type, payload } as LearnerAction);
    }
    for (const payload of [null, [], {}, { action: null }, { action: '__proto__' },
      { action: 'private-value' }, { action: 'restore-volume', dose: 999 }, { action: 'monitor', notes: 'private-value' }]) {
      engine.apply({ tick: 999999, type: 'avp-deficiency-response', payload } as LearnerAction);
    }
    const frame = engine.step(); expect(frame.state).toEqual(control.step().state);
    expect(frame.equipment.resuscitation.avpDeficiency).toMatchObject({ volumeAtTick: null, waterAtTick: null,
      desmopressinAtTick: null, monitoringAtTick: null, observation: null });
    expect(JSON.stringify(frame.events)).not.toContain('private-value');
    engine.apply(choice(999999, 'restore-volume')); engine.apply(choice(-100, 'monitor'));
    expect(engine.equipment().resuscitation.avpDeficiency).toMatchObject({ volumeAtTick: 1, monitoringAtTick: 1 });
  });

  it('retains delay evidence without making a one-tick teaching boundary decide circulation credit', () => {
    for (const start of [DELAY - 1, DELAY]) {
      const first = start + VOLUME; const later = first + RESPONSE;
      const result = run([[0, 'call-support'], [0, 'review-context'], [0, 'monitor'],
        [start, 'restore-volume'], [first, 'reassess'], [first, 'replace-water'],
        [first, 'restore-desmopressin'], [later, 'reassess'], [later, 'handoff']], later);
      expect(result.patient).toMatchObject({ ended: 'handoff', volumeDelayed: start === DELAY });
      const circulation = findings(result.events).find(({ objectiveId }) => objectiveId === 'avp-circulation')!;
      expect(circulation.outcome).toBe('met');
      expect(circulation.finding).toContain(start === DELAY ? '1,800.0 simulated seconds' : '1,799.9 simulated seconds');
      expect(circulation.finding.includes('that delay remains')).toBe(start === DELAY);
    }
  });
});
