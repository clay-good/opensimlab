import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { adrenalCompletionEvidence } from '../../src/modules/endocrine-metabolic/completion';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { promptFor, promptStillEligible, unpromptedOmissions } from '@anesthesia/tutor/guidance';
import type { EngineEvent } from '@platform/kernel/protocol';
import { AdrenalCrisis, supportsAdrenalCrisis, ADRENAL_DELAY_TICKS, ADRENAL_RESPONSE_TICKS, ADRENAL_TAKEOVER_TICKS } from '../../src/modules/endocrine-metabolic/adrenal-crisis';
import { ADRENAL_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/adrenal-crisis-fixtures';
import { ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/adrenal-crisis-treatment-before-tests';
import { DKA_RESOLUTION_TRANSITION } from '../../src/modules/endocrine-metabolic/scenarios/dka-resolution-transition';
import { adrenalInlinePrompt, ADRENAL_TUTOR_RULES } from '../../src/modules/endocrine-metabolic/tutor/adrenal-guidance';
import { requireSource } from '@platform/docs/sources';
import { collectReportEquipmentContext } from '@routes/AnesthesiaRoute';

describe('Adrenal crisis: time, decisions, and observed response', () => {
  it('preserves the active adrenal branch in the bounded opt-in report projection without prose or hidden record contents', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.apply({ tick: 0, type: 'adrenal-crisis-response', payload: { action: 'hydrocortisone' } });
    engine.apply({ tick: 0, type: 'adrenal-crisis-response', payload: { action: 'reassess' } });
    const equipment = engine.equipment();
    const projected = collectReportEquipmentContext({ ...equipment, resuscitation: { ...equipment.resuscitation,
      adrenalCrisis: { ...equipment.resuscitation.adrenalCrisis!, choiceFeedback: 'private-value',
        alertness: 'private-value', observation: { ...equipment.resuscitation.adrenalCrisis!.observation!, alertness: 'private-value' } },
    } });
    expect(Object.keys(projected)).toHaveLength(32);
    expect(projected).toMatchObject({
      'resuscitation.adrenalCrisis.hydrocortisoneAtTick': 0,
      'resuscitation.adrenalCrisis.salineAtTick': null,
      'resuscitation.adrenalCrisis.recordReviewed': false,
      'resuscitation.adrenalCrisis.observation.meanArterialMmHg': 55,
      'resuscitation.adrenalCrisis.responseObserved': false,
      'resuscitation.adrenalCrisis.ended': null,
    });
    expect(JSON.stringify(projected)).not.toMatch(/private-value|choiceFeedback|alertness|fludrocortisone/);
    expect(collectReportEquipmentContext(null)).toEqual({});
  });
  it('binds completion evidence only to the exact lesson and leaves unverified work pending', () => {
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(adrenalCompletionEvidence({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.0' } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(adrenalCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 67 } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(adrenalCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
  });
  it('binds the declared phenotype, four objectives, exact fixtures, and hidden record', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id); expect(FIXTURES.contentVersion).toBe(SCENARIO.metadata.version);
    expect(new AdrenalCrisis().snapshot(0)).toMatchObject({ recordReviewed: false, observation: null, hydrocortisoneAtTick: null, salineAtTick: null });
  });
  it.each(['hydrocortisone', 'saline'] as const)('allows %s first without diagnostic, history, or support prerequisites', (first) => {
    const model = new AdrenalCrisis(); const second = first === 'saline' ? 'hydrocortisone' : 'saline';
    expect(model.apply(first, 0).at(-1)?.id).toBe(first);
    expect(model.apply(second, 1).at(-1)?.id).toBe(second);
    expect(model.snapshot(1)).toMatchObject({ recordReviewed: false, supportActive: false, responseObserved: false, responseDueInSeconds: 600 });
    expect(model.apply(first, 2)).toEqual([]);
    expect(model.apply('handoff', 2).at(-1)?.id).toBe('handoff-refused');
  });
  it('advances through exact response boundaries without silently updating a past observation', () => {
    const model = new AdrenalCrisis(); model.apply('reassess', 0); model.apply('hydrocortisone', 1); model.apply('saline', 2);
    model.advance(ADRENAL_RESPONSE_TICKS + 1); expect(model.vitals().meanArterialMmHg).toBe(55);
    model.advance(ADRENAL_RESPONSE_TICKS + 2); expect(model.vitals().meanArterialMmHg).toBe(74);
    expect(model.snapshot(6002)).toMatchObject({ responseObserved: false, observation: { meanArterialMmHg: 55, atTick: 0 } });
    model.apply('reassess', 6002); expect(model.snapshot(6002)).toMatchObject({ responseObserved: true, observation: { meanArterialMmHg: 74, atTick: 6002 } });
    expect(model.advance(6003)).toEqual([]);
  });
  it('distinguishes untreated, fluid-only, and steroid-only paths and permits late correction', () => {
    const none = new AdrenalCrisis(); const fluid = new AdrenalCrisis(); const steroid = new AdrenalCrisis();
    fluid.apply('saline', 0); steroid.apply('hydrocortisone', 0);
    for (const model of [none, fluid, steroid]) {
      model.advance(ADRENAL_DELAY_TICKS - 1); expect(model.vitals().meanArterialMmHg).toBe(55);
      model.advance(ADRENAL_DELAY_TICKS);
    }
    expect([none, fluid, steroid].map((model) => model.vitals().meanArterialMmHg)).toEqual([48, 59, 48]);
    fluid.apply('hydrocortisone', 3001); fluid.advance(9001); expect(fluid.vitals().meanArterialMmHg).toBe(74);
    for (const model of [none, steroid]) {
      model.advance(ADRENAL_TAKEOVER_TICKS - 1); expect(model.snapshot(17999).ended).toBeNull();
      model.advance(ADRENAL_TAKEOVER_TICKS); expect(model.snapshot(18000).ended).toBe('instructor-takeover');
      const before = model.snapshot(18000); model.apply('saline', 18001); model.advance(36000);
      expect(model.snapshot(36000)).toEqual(before);
    }
  });
  it.each(['expert', 'commonError', 'recovery'] as const)('replays %s through the real engine with identical whole-state hashes in all guidance modes', (path) => {
    const hashes: string[] = [];
    for (const level of ['guided', 'coached', 'unassisted'] as const) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      const hash = createHash('sha256'); const events: EngineEvent[] = []; const shown = new Map<string, number>();
      const actions = FIXTURES[path].map(([tick, action]) => ({ tick, type: 'adrenal-crisis-response', payload: { action } }));
      for (let tick = 0; tick <= ADRENAL_TAKEOVER_TICKS; tick += 1) {
        for (const action of actions) if (action.tick === tick) engine.apply(action);
        const frame = engine.step(); events.push(...frame.events);
        hash.update(JSON.stringify({ state: frame.state, patient: frame.equipment.resuscitation.adrenalCrisis, events: frame.events }));
        const prompt = adrenalInlinePrompt(level, { scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version,
          adrenalCrisis: frame.equipment.resuscitation.adrenalCrisis, tick, state: frame.state,
          actions: actions.filter((action) => action.tick <= tick), ventilating: false, alarmCount: frame.alarms.length });
        if (prompt) shown.set(prompt.id, tick);
        if (tick === 0) expect(frame.state.meanArterialMmHg).toBe(55);
        if (tick === ADRENAL_TAKEOVER_TICKS) expect(frame.state.meanArterialMmHg).toBe(path === 'commonError' ? 59 : 74);
      }
      hashes.push(hash.digest('hex'));
      const patient = engine.equipment().resuscitation.adrenalCrisis!;
      expect(patient.ended).toBe(path === 'commonError' ? 'instructor-takeover' : 'handoff');
      const findings = objectiveFindings(SCENARIO, [], 0, 0, [], events);
      expect(findings.map((finding) => finding.outcome)).toEqual(path === 'expert' ? Array(4).fill('met')
        : path === 'recovery' ? ['not-met', 'met', 'met', 'met'] : Array(4).fill('not-met'));
      if (path === 'recovery') expect(findings[0]?.finding).toContain('without erasing');
      expect(findings[1]?.finding).toContain('Authored counterfactual');
      expect(patient.durableRecoveryProven).toBe(false);
      if (level === 'unassisted') expect(shown.size).toBe(0);
      else if (path !== 'expert') expect(shown.has('adrenal-treat-now')).toBe(true);
    }
    expect(new Set(hashes).size).toBe(1);
  }, 120_000);
  it('rejects unrelated, malformed, injected-dose, and forged-tick requests without reflecting private payloads', () => {
    for (const scenario of [DKA_RESOLUTION_TRANSITION, { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] }]) expect(supportsAdrenalCrisis(scenario)).toBe(false);
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1, practiceRegion: 'GB' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1, practiceRegion: 'GB' });
    for (const type of ['bolus', 'fluid', 'inject-crisis', 'severe-hypoglycemia-response']) engine.apply({ tick: 99999, type, payload: { action: 'hydrocortisone', notes: 'private-value' } });
    for (const action of [null, {}, '__proto__', 'private-value']) engine.apply({ tick: 99999, type: 'adrenal-crisis-response', payload: { action } as never });
    engine.apply({ tick: 99999, type: 'adrenal-crisis-response', payload: { action: 'hydrocortisone', dose: 999, notes: 'private-value' } });
    const frame = engine.step(); expect(frame.state).toEqual(control.step().state);
    expect(frame.equipment.resuscitation.adrenalCrisis?.hydrocortisoneAtTick).toBeNull();
    expect(JSON.stringify(frame.events)).not.toContain('private-value');
    engine.apply({ tick: 99999, type: 'adrenal-crisis-response', payload: { action: 'hydrocortisone' } });
    expect(engine.equipment().resuscitation.adrenalCrisis?.hydrocortisoneAtTick).toBe(1);
  });
  it('uses only exact-version observed-state tutoring, never unrelated induction advice', () => {
    const model = new AdrenalCrisis();
    const input = () => ({ scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version,
      adrenalCrisis: model.snapshot(0), tick: 0, state: { fio2: 0.21 }, actions: [], ventilating: false, alarmCount: 0 });
    expect(promptFor('guided', input(), new Map())?.id).toBe('adrenal-treat-now');
    expect(promptFor('coached', input(), new Map())?.id).toBe('adrenal-treat-now');
    expect(promptFor('unassisted', input(), new Map())).toBeNull();
    expect(promptFor('guided', { ...input(), alarmCount: 1 }, new Map())).toBeNull();
    expect(promptFor('guided', { ...input(), scenarioVersion: '0.1.0' }, new Map())).toBeNull();
    expect(promptStillEligible('guided', input(), 'preoxygenate')).toBe(false);
    expect(unpromptedOmissions(input())).toEqual(['adrenal-urgent-steroid']);
    model.apply('hydrocortisone', 0); expect(promptFor('coached', input(), new Map())?.id).toBe('adrenal-parallel-rescue');
    model.apply('saline', 0); model.apply('call-support', 0); expect(promptFor('guided', input(), new Map())?.id).toBe('adrenal-find-interruption');
    model.advance(6000); expect(promptFor('coached', { ...input(), tick: 6000, adrenalCrisis: model.snapshot(6000) }, new Map())?.id).toBe('adrenal-check-response');
  });
  it.each(['US', 'GB'] as const)('keeps quiet urgent tutoring available beside real crisis alarms in %s', (practiceRegion) => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion });
    const frame = engine.step(); expect(frame.alarms.length).toBeGreaterThan(0);
    const input = { scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version,
      adrenalCrisis: frame.equipment.resuscitation.adrenalCrisis, tick: frame.tick, state: frame.state,
      actions: [], ventilating: false, alarmCount: frame.alarms.length };
    expect(promptFor('guided', input, new Map())).toBeNull();
    expect(adrenalInlinePrompt('guided', input)?.id).toBe('adrenal-treat-now');
    expect(adrenalInlinePrompt('coached', input)?.id).toBe('adrenal-treat-now');
    expect(adrenalInlinePrompt('unassisted', input)).toBeNull();
    expect(adrenalInlinePrompt('guided', { ...input, scenarioId: 'routine-induction' })).toBeNull();
    expect(adrenalInlinePrompt('guided', { ...input, scenarioVersion: '0.1.0' })).toBeNull();
    expect(adrenalInlinePrompt('guided', { ...input, adrenalCrisis: { ...input.adrenalCrisis!, ended: 'handoff' } })).toBeNull();
    for (const rule of ADRENAL_TUTOR_RULES) expect(requireSource(rule.sourceId).year).toBe(2016);
  });
  it.each(['wait-for-cortisol', 'oral-only'] as const)('refuses stale %s after steroids without inventing an earlier delay', (action) => {
    const model = new AdrenalCrisis(); const events: EngineEvent[] = [];
    const apply = (tick: number, choice: string) => {
      for (const event of model.apply(choice, tick)) events.push({ tick, eventId: `adrenal-crisis-${event.id}-${tick}`, message: event.message, category: 'assessment', severity: 'warning' });
    };
    for (const [tick, choice] of FIXTURES.expert) {
      apply(tick, choice);
      if (choice === 'saline') apply(tick, action);
    }
    expect(events.some((event) => /diagnostic-delay-choice|oral-only-refused/.test(event.eventId))).toBe(false);
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], events).map((entry) => entry.outcome)).toEqual(Array(4).fill('met'));
  });
});
