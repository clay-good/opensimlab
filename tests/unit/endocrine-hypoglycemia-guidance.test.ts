import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { promptFor, promptStillEligible, unpromptedOmissions, type GuidanceInput, type GuidanceLevel } from '@anesthesia/tutor/guidance';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { requireSource } from '@platform/docs/sources';
import type { EngineEvent } from '@platform/kernel/protocol';
import { SEVERE_HYPOGLYCEMIA_RECURRENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/severe-hypoglycemia-recurrence';
import { SevereHypoglycemia } from '../../src/modules/endocrine-metabolic/severe-hypoglycemia';
import { HYPOGLYCEMIA_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/severe-hypoglycemia-fixtures';
import { HYPOGLYCEMIA_TUTOR_RULES as RULES } from '../../src/modules/endocrine-metabolic/tutor/hypoglycemia-guidance';
import { hypoglycemiaCompletionEvidence } from '../../src/modules/endocrine-metabolic/completion';

const inputFor = (model: SevereHypoglycemia, tick: number): GuidanceInput => Object.freeze({
  scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version, tick,
  state: null, actions: [], ventilating: false, alarmCount: 0,
  hypoglycemia: Object.freeze(model.snapshot(tick)),
});

function run(actions: typeof FIXTURES.expert | typeof FIXTURES.commonError | typeof FIXTURES.recovery, level: GuidanceLevel) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const digest = createHash('sha256'); const events: EngineEvent[] = []; const shown = new Map<string, number>();
  for (let tick = 0; tick <= 27012; tick += 1) {
    for (const [at, action] of actions) if (at === tick) engine.apply({ tick, type: 'severe-hypoglycemia-response', payload: { action } });
    const frame = engine.step(); events.push(...frame.events);
    digest.update(JSON.stringify(frame.state)); digest.update(JSON.stringify(frame.equipment.resuscitation.severeHypoglycemia));
    if (tick % 100 === 0) {
      const input: GuidanceInput = Object.freeze({ scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version,
        tick, state: Object.freeze(frame.state), actions: [], ventilating: false, alarmCount: 0,
        hypoglycemia: Object.freeze(frame.equipment.resuscitation.severeHypoglycemia!),
      });
      const prompt = promptFor(level, input, shown);
      if (prompt) shown.set(prompt.id, tick);
    }
  }
  return { hash: digest.digest('hex'), shown: [...shown.keys()], findings: objectiveFindings(SCENARIO, [], 0, 0, [], events), ended: engine.equipment().resuscitation.severeHypoglycemia?.ended };
}

describe('Observed-state hypoglycemia tutor', () => {
  it('supports every rule with observable model states and a registered source', () => {
    const model = new SevereHypoglycemia(); const inputs = [inputFor(model, 150)];
    model.apply('check-glucose', 150); inputs.push(inputFor(model, 150));
    model.apply('call-support', 150); model.apply('iv-rescue', 150);
    model.advance(6150); inputs.push(inputFor(model, 6150));
    model.apply('check-glucose', 6150); inputs.push(inputFor(model, 6150));
    model.advance(18150); inputs.push(inputFor(model, 18150));
    model.apply('check-glucose', 18150); inputs.push(inputFor(model, 18150)); model.apply('iv-rescue', 18150);
    model.advance(24150); inputs.push(inputFor(model, 24150));
    model.apply('check-glucose', 24150); inputs.push(inputFor(model, 24150));
    for (const rule of RULES) {
      expect(inputs.some((input) => rule.applies(input)), rule.prompt.id).toBe(true);
      expect(requireSource(rule.sourceId).year).toBe(2026);
      expect(rule.prompt.sourceHref).toBe('https://doi.org/10.2337/dc26-s006');
      expect(rule.version).toBe('0.1.0');
      expect(rule.prerequisiteObservations.length).toBeGreaterThan(0);
    }
  });
  it('keeps hidden glucose, medication, and future recurrence out of early prompts', () => {
    const model = new SevereHypoglycemia(); const input = inputFor(model, 150);
    const prompt = promptFor('guided', input, new Map());
    expect(prompt?.id).toBe('hypoglycemia-observe');
    expect(JSON.stringify(prompt)).not.toMatch(/36 mg|42 mg|112 mg|glimepiride|30.minute/);
    expect(promptFor('coached', input, new Map())).toBeNull();
    expect(promptFor('unassisted', input, new Map())).toBeNull();
    model.apply('check-glucose', 150);
    expect(promptFor('coached', inputFor(model, 150), new Map())?.id).toBe('hypoglycemia-rescue');
  });
  it('withdraws resolved prompts, respects alarms and cooldowns, and fails closed outside its version', () => {
    const model = new SevereHypoglycemia(); model.apply('check-glucose', 0); model.apply('call-support', 0);
    const input = inputFor(model, 150);
    expect(promptFor('guided', { ...input, alarmCount: 1 }, new Map())).toBeNull();
    expect(promptFor('guided', { ...input, scenarioVersion: '0.1.0' }, new Map())).toBeNull();
    expect(promptStillEligible('guided', { ...input, scenarioId: 'routine-induction' }, 'hypoglycemia-rescue')).toBe(false);
    expect(promptFor('guided', input, new Map([['hypoglycemia-rescue', 150]]))).toBeNull();
    model.apply('iv-rescue', 150);
    expect(promptStillEligible('guided', inputFor(model, 151), 'hypoglycemia-rescue')).toBe(false);
    model.apply('check-glucose', 6150);
    expect(promptFor('guided', inputFor(model, 6150), new Map([['hypoglycemia-reassess-change', 6100]]))).toBeNull();
    model.advance(27150);
    expect(promptFor('guided', inputFor(model, 27150), new Map())).toBeNull();
    expect(unpromptedOmissions(inputFor(model, 27150))).toEqual([]);
  });
  it('asks for reassessment after changed alertness without revealing an unmeasured recurrent value', () => {
    const model = new SevereHypoglycemia(); model.apply('check-glucose', 0); model.apply('call-support', 0); model.apply('iv-rescue', 0);
    model.apply('check-glucose', 6000); model.apply('review-medications', 6000); model.advance(18000);
    const prompt = promptFor('coached', inputFor(model, 18000), new Map());
    expect(prompt?.id).toBe('hypoglycemia-reassess-change');
    expect(model.snapshot(18000).glucoseMgPerDl).toBe(112);
    expect(JSON.stringify(prompt)).not.toContain('42');
    model.apply('check-glucose', 18000);
    expect(promptStillEligible('coached', inputFor(model, 18000), 'hypoglycemia-reassess-change')).toBe(false);
    expect(promptFor('coached', inputFor(model, 18000), new Map())?.id).toBe('hypoglycemia-repeat-rescue');
    model.apply('iv-rescue', 18000); model.advance(24000);
    expect(promptFor('coached', inputFor(model, 24000), new Map([['hypoglycemia-recheck', 6000]]))?.id).toBe('hypoglycemia-repeat-recheck');
  });
  it.each(['expert', 'commonError', 'recovery'] as const)('replays %s with identical whole-state hashes at every guidance level', (kind) => {
    const guided = run(FIXTURES[kind], 'guided'); const coached = run(FIXTURES[kind], 'coached'); const unassisted = run(FIXTURES[kind], 'unassisted');
    expect(guided.hash).toBe(coached.hash); expect(coached.hash).toBe(unassisted.hash);
    expect(guided.findings).toEqual(unassisted.findings); expect(unassisted.shown).toEqual([]);
    expect(guided.ended).toBe(kind === 'commonError' ? 'instructor-takeover' : 'handoff');
    if (kind === 'commonError') expect(guided.shown.length).toBeGreaterThan(coached.shown.length);
    if (kind === 'recovery') expect(guided.findings[1]!.outcome).toBe('not-met');
  });
  it('binds implemented completion evidence without declaring remaining work complete', () => {
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id)).toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(hypoglycemiaCompletionEvidence(SCENARIO, 'unknown-engine', 'endocrine-metabolic')).toEqual([]);
    expect(hypoglycemiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toEqual([]);
    expect(hypoglycemiaCompletionEvidence({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.2' } }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(hypoglycemiaCompletionEvidence({ ...SCENARIO, timeline: [] }, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
  });
});
