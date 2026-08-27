import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { buildModuleCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { SOURCES } from '@platform/docs/sources';
import { buildScenarioQualityCatalog, HAZARD_CATEGORIES, validateScenarioQualityRecord } from '@platform/catalog/scenario-quality';
import { HYPOCALCEMIA_QUALITY_RECORDS as RECORDS } from '../../src/modules/endocrine-metabolic/hypocalcemia-quality';
import { HYPOCALCEMIC_TETANY_RESCUE_AND_RECURRENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypocalcemic-tetany-rescue-and-recurrence';
import { HYPOCALCEMIA_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/hypocalcemia-fixtures';
import { Hypocalcemia, HYPOCALCEMIA_ACTIONS, HYPOCALCEMIA_DELAY_TICKS, HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS,
  HYPOCALCEMIA_RECURRENCE_TICKS, HYPOCALCEMIA_RESPONSE_TICKS, HYPOCALCEMIA_TAKEOVER_TICKS,
  HYPOCALCEMIA_SESSION_TICKS, type HypocalcemiaAction } from '../../src/modules/endocrine-metabolic/hypocalcemia';
import { HypocalcemiaTray } from '../../src/modules/endocrine-metabolic/HypocalcemiaTray';
import { hypocalcemiaDemonstrationStep } from '../../src/modules/endocrine-metabolic/demo/hypocalcemia-demonstration';
import { hypocalcemiaInlinePrompt } from '../../src/modules/endocrine-metabolic/tutor/hypocalcemia-guidance';

type Default = { id: string; category: string; value: string | number | boolean | null; sourceRefs: string[];
  rationale: string; practiceRegions: string[]; applicability: string; educationalEffect: string };
const defaults = (RECORDS.find((entry) => entry.kind === 'authored-defaults')!.record as { defaults: Default[] }).defaults;
const entry = (id: string) => defaults.find((item) => item.id === id)!;
const decoded = (id: string) => JSON.parse(String(entry(id).value));
const completion = () => buildModuleCompletionCatalog([SCENARIO], ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
const complete = (model: Hypocalcemia) => {
  for (const action of decoded('complete-care-elements') as HypocalcemiaAction[]) model.apply(action, 0);
};

describe('authored hypocalcemia quality evidence, not human approval', () => {
  it('supplies exactly three valid records explicitly bound to the implemented version', () => {
    expect(RECORDS.map(({ kind }) => kind)).toEqual(['training-value', 'authored-defaults', 'scenario-hazard']);
    for (const envelope of RECORDS) {
      expect(envelope.moduleId).toBe('endocrine-metabolic');
      expect(envelope.record).toMatchObject({ schemaVersion: 1, scenarioId: 'hypocalcemic-tetany-rescue-and-recurrence', contentVersion: '0.1.0' });
      expect(validateScenarioQualityRecord(envelope.kind, envelope.record)).toEqual([]);
    }
    expect(SCENARIO.metadata.version).toBe('0.1.0');
  });

  it('keeps state-space, incomplete completion and clinical authority visibly unearned', () => {
    const quality = buildScenarioQualityCatalog(completion(), RECORDS);
    expect(quality.playableScenarioCount).toBe(0);
    expect(quality.scenarios[0]).toMatchObject({ playable: false, completionComplete: false });
    expect(quality.scenarios[0]!.qualityRecords.map(({ kind, status }) => [kind, status])).toEqual([
      ['training-value', 'present'], ['authored-defaults', 'present'], ['scenario-hazard', 'present'], ['state-space-verification', 'missing'],
    ]);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(JSON.stringify(RECORDS)).toContain('full screen-reader');
    expect(JSON.stringify(RECORDS)).toContain('remain pending');
    expect(JSON.stringify(RECORDS)).not.toContain('"status":"passed"');
  });

  it('rejects these records when content advances instead of carrying evidence forward', () => {
    const current = completion();
    const changed = { ...current, scenarios: current.scenarios.map((scenario) => ({ ...scenario, contentVersion: '0.1.1' })) };
    expect(() => buildScenarioQualityCatalog(changed, RECORDS)).toThrow(/version/i);
  });

  it('declares each authored clock using the actual model constants, not a golden snapshot', () => {
    const clocks: Record<string, number> = {
      'ticks-per-second': TICKS_PER_SECOND, 'urgent-delay-ticks': HYPOCALCEMIA_DELAY_TICKS,
      'calcium-response-ticks': HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS, 'recurrence-ticks': HYPOCALCEMIA_RECURRENCE_TICKS,
      'later-response-ticks': HYPOCALCEMIA_RESPONSE_TICKS, 'no-rescue-takeover-ticks': HYPOCALCEMIA_TAKEOVER_TICKS,
      'unfinished-session-ticks': HYPOCALCEMIA_SESSION_TICKS,
    };
    for (const [id, value] of Object.entries(clocks)) {
      expect(entry(id).value).toBe(value);
      expect(entry(id).sourceRefs.every((ref) => !ref.startsWith('https:'))).toBe(true);
    }
    expect(entry('estimated-simulated-minutes').value).toBe(SCENARIO.metadata.estimatedMinutes);
  });

  it('covers scenario numerical defaults, inactive equipment and initially unselected care', () => {
    const patient = SCENARIO.patient;
    expect(decoded('patient-demographics')).toEqual({ ageYears: patient.ageYears, sex: patient.sex,
      heightCm: patient.heightCm, weightKg: patient.weightKg, asaClass: patient.asaClass });
    expect(decoded('schema-baseline')).toEqual(patient.baseline);
    expect(decoded('schema-airway-respiratory')).toEqual({ difficulty: patient.airway.difficulty,
      difficultMaskVentilation: patient.airway.difficultMaskVentilation, respiratoryProfile: patient.respiratory.profile });
    expect(decoded('monitoring')).toEqual(SCENARIO.equipment.monitoring);
    expect(decoded('inactive-ventilator')).toEqual(SCENARIO.equipment.ventilator);
    expect(decoded('formulary')).toEqual(SCENARIO.formulary);
    expect(decoded('declared-actions')).toEqual(HYPOCALCEMIA_ACTIONS);
    const { symptoms: _symptoms, ...initial } = new Hypocalcemia().snapshot(0);
    expect(decoded('initial-model-state')).toEqual(initial);
    expect(decoded('timeline-and-replay-ticks')).toEqual(Object.fromEntries([
      ...SCENARIO.timeline.map(({ id, atTick }) => [id, atTick]), ...SCENARIO.replayPoints!.map(({ id, atTick }) => [id, atTick]),
    ]));
  });

  it('checks every response magnitude against actual independent model progression', () => {
    const initial = new Hypocalcemia(); const delayed = new Hypocalcemia(); delayed.advance(HYPOCALCEMIA_DELAY_TICKS);
    const relief = new Hypocalcemia(); relief.apply('calcium-rescue', 0); relief.advance(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS);
    const recurrence = new Hypocalcemia(); recurrence.apply('calcium-rescue', 0); recurrence.advance(HYPOCALCEMIA_RECURRENCE_TICKS);
    const later = new Hypocalcemia(); complete(later); later.advance(HYPOCALCEMIA_RESPONSE_TICKS);
    for (const [phase, model] of [['initial', initial], ['delay', delayed], ['relief', relief], ['recurrence', recurrence], ['later', later]] as const) {
      const { symptoms: _symptoms, ...vitals } = model.vitals();
      expect(vitals).toEqual({ ...decoded('fixed-vital-values'), ...decoded(`${phase}-response-values`) });
    }
  });

  it('binds the cause-panel and fixed QTc record to visible supplied content without premature reveal', () => {
    const model = new Hypocalcemia();
    const render = () => renderToStaticMarkup(createElement(HypocalcemiaTray, {
      assessment: model.snapshot(0), scenarioVersion: '0.1.0', onAction: () => {},
    }));
    expect(render()).toContain(`Supplied QTc: ${entry('supplied-qtc-ms').value} ms`);
    expect(render()).not.toContain('magnesium 0.45');
    model.apply('review-cause', 0); const panel = decoded('supplied-cause-panel'); const text = render();
    expect(text).toContain(`magnesium ${panel.magnesiumMmolL} mmol/L`);
    expect(text).toContain(`(PTH) ${panel.pthPgMl} pg/mL (assay reference ${panel.pthReferenceLow}–${panel.pthReferenceHigh})`);
    expect(text).toContain(`phosphate ${panel.phosphateMgDl} mg/dL (reference ${panel.phosphateReferenceLow}–${panel.phosphateReferenceHigh})`);
    expect(text).toContain(`creatinine ${panel.creatinineMgDl} mg/dL`);
  });

  it('records exact reference seed and transcript timing without inventing stochastic verification', () => {
    expect(entry('fixture-seed').value).toBe(FIXTURES.seed);
    for (const [id, key] of [['expert-fixture', 'expert'], ['common-error-fixture', 'commonError'],
      ['recovery-fixture', 'recovery'], ['no-action-fixture', 'noAction']] as const) expect(decoded(id)).toEqual(FIXTURES[key]);
    expect(entry('fixture-seed').rationale).toContain('no seeded clinical variation');
  });

  it('covers actual example progress and guidance states without treating progress as a score', () => {
    const observed: Record<string, number> = { preparing: hypocalcemiaDemonstrationStep().progress };
    const model = new Hypocalcemia();
    const record = (tick: number) => { const step = hypocalcemiaDemonstrationStep(model.snapshot(tick)); observed[step.id] = step.progress; return step; };
    for (let index = 0; index < 6; index += 1) model.apply(record(0).action, 0);
    record(0);
    expect(hypocalcemiaInlinePrompt('coached', { scenarioVersion: '0.1.0', hypocalcemia: model.snapshot(0) })).toBeNull();
    expect(hypocalcemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', hypocalcemia: model.snapshot(0) })).not.toBeNull();
    expect(hypocalcemiaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', hypocalcemia: new Hypocalcemia().snapshot(0) })).toBeNull();
    model.advance(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS); model.apply(record(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS).action, HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS);
    record(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS);
    model.advance(HYPOCALCEMIA_RESPONSE_TICKS); model.apply(record(HYPOCALCEMIA_RESPONSE_TICKS).action, HYPOCALCEMIA_RESPONSE_TICKS);
    model.apply(record(HYPOCALCEMIA_RESPONSE_TICKS).action, HYPOCALCEMIA_RESPONSE_TICKS); record(HYPOCALCEMIA_RESPONSE_TICKS);
    expect(observed).toEqual(decoded('example-progress-landmarks'));
  });

  it('has all ten hazard dispositions and traceable source references without a state-space pass', () => {
    const hazards = (RECORDS[2]!.record as { hazards: Array<{ category: string; evidence: string[] }> }).hazards;
    expect(hazards.map(({ category }) => category)).toEqual(HAZARD_CATEGORIES);
    expect(new Set(defaults.map(({ id }) => id)).size).toBe(defaults.length);
    for (const item of defaults) {
      expect(item.practiceRegions).toEqual(['US', 'GB']);
      for (const ref of item.sourceRefs) {
        if (ref.startsWith('https://doi.org/')) expect(SOURCES.some(({ locator }) => locator.includes(ref.slice('https://doi.org/'.length)))).toBe(true);
        else expect(existsSync(join(process.cwd(), ref.split('#')[0]!)), ref).toBe(true);
      }
    }
  });
});
