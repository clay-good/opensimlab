import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { buildModuleCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { EngineEvent } from '@platform/kernel/protocol';
import { SOURCES } from '@platform/docs/sources';
import { buildScenarioQualityCatalog, HAZARD_CATEGORIES, validateScenarioQualityRecord } from '@platform/catalog/scenario-quality';
import { HYPONATREMIA_CORRECTION_QUALITY_RECORDS as RECORDS } from '../../src/modules/endocrine-metabolic/hyponatremia-correction-quality';
import { HYPONATREMIA_AQUARESIS_AND_OVERCORRECTION as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hyponatremia-aquaresis-and-overcorrection';
import { HYPONATREMIA_CORRECTION_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/hyponatremia-correction-fixtures';
import { HyponatremiaCorrection, HYPONATREMIA_CORRECTION_ACTIONS,
  HYPONATREMIA_CORRECTION_AQUARESIS_TICKS as AQUARESIS,
  HYPONATREMIA_CORRECTION_OVERCORRECTION_TICKS as BREACH,
  HYPONATREMIA_CORRECTION_RESPONSE_TICKS as RESPONSE,
  HYPONATREMIA_CORRECTION_TAKEOVER_TICKS as TAKEOVER,
  HYPONATREMIA_CORRECTION_SESSION_TICKS as SESSION,
  type HyponatremiaCorrectionAction } from '../../src/modules/endocrine-metabolic/hyponatremia-correction';
import { HyponatremiaCorrectionTray } from '../../src/modules/endocrine-metabolic/HyponatremiaCorrectionTray';
import { hyponatremiaCorrectionDemonstrationStep, supportsHyponatremiaCorrectionDemonstration } from '../../src/modules/endocrine-metabolic/demo/hyponatremia-correction-demonstration';
import { hyponatremiaCorrectionInlinePrompt } from '../../src/modules/endocrine-metabolic/hyponatremia-correction-tutor';

type Default = { id: string; category: string; value: string | number | boolean | null; sourceRefs: string[];
  rationale: string; practiceRegions: string[]; applicability: string; educationalEffect: string };
const defaults = (RECORDS.find(({ kind }) => kind === 'authored-defaults')!.record as { defaults: Default[] }).defaults;
const entry = (id: string) => defaults.find((item) => item.id === id)!;
const decoded = (id: string) => JSON.parse(String(entry(id).value));
const render = (model: HyponatremiaCorrection, tick = 0) => renderToStaticMarkup(createElement(HyponatremiaCorrectionTray, {
  assessment: model.snapshot(tick), scenarioVersion: '0.1.0', onAction: () => {},
}));
const completion = () => buildModuleCompletionCatalog([SCENARIO], ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
type Choices = readonly (readonly [number, HyponatremiaCorrectionAction])[];

/** Exercise the real model and debrief rules, without claiming a second engine replay. */
function findingsFor(actions: Choices) {
  const model = new HyponatremiaCorrection(); const events: EngineEvent[] = [];
  for (const [tick, action] of actions) {
    for (const event of model.apply(action, tick)) events.push({ tick, eventId: `sodium-correction-${event.id}-${tick}`,
      severity: 'warning', category: 'assessment', message: event.message });
  }
  return { model, findings: objectiveFindings(SCENARIO, [], 0, 0, [], events) };
}

describe('Literal sodium-correction quality evidence, not independent approval', () => {
  it('supplies only three schema-valid records for this exact implemented content version', () => {
    expect(RECORDS.map(({ kind }) => kind)).toEqual(['training-value', 'authored-defaults', 'scenario-hazard']);
    for (const envelope of RECORDS) {
      expect(envelope.moduleId).toBe('endocrine-metabolic');
      expect(envelope.record).toMatchObject({ schemaVersion: 1, scenarioId: SCENARIO.metadata.id, contentVersion: '0.1.0' });
      expect(validateScenarioQualityRecord(envelope.kind, envelope.record)).toEqual([]);
    }
    expect(SCENARIO.metadata.version).toBe('0.1.0');
    expect(new Set(defaults.map(({ id }) => id)).size).toBe(defaults.length);
  });

  it('does not manufacture a state-space pass, complete scenario, or clinical sign-off', () => {
    const quality = buildScenarioQualityCatalog(completion(), RECORDS);
    expect(quality.playableScenarioCount).toBe(0);
    expect(quality.scenarios[0]).toMatchObject({ playable: false, completionComplete: false });
    expect(quality.scenarios[0]!.qualityRecords.map(({ kind, status }) => [kind, status])).toEqual([
      ['training-value', 'present'], ['authored-defaults', 'present'], ['scenario-hazard', 'present'], ['state-space-verification', 'missing'],
    ]);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(JSON.stringify(RECORDS)).toContain('verification remain pending');
    expect(JSON.stringify(RECORDS)).not.toContain('"status":"passed"');
    const current = completion();
    expect(() => buildScenarioQualityCatalog({ ...current,
      scenarios: current.scenarios.map((scenario) => ({ ...scenario, contentVersion: '0.1.1' })),
    }, RECORDS)).toThrow(/version/i);
  });

  it('binds every schema compatibility value and initially unselected request to actual authored state', () => {
    const patient = SCENARIO.patient;
    expect(decoded('patient-demographics')).toEqual({ ageYears: patient.ageYears, sex: patient.sex,
      heightCm: patient.heightCm, weightKg: patient.weightKg, asaClass: patient.asaClass });
    expect(decoded('schema-baseline')).toEqual(patient.baseline);
    expect(decoded('schema-airway-respiratory')).toEqual({ difficulty: patient.airway.difficulty,
      difficultMaskVentilation: patient.airway.difficultMaskVentilation, respiratoryProfile: patient.respiratory.profile });
    expect(decoded('monitoring')).toEqual(SCENARIO.equipment.monitoring);
    expect(decoded('inactive-ventilator')).toEqual(SCENARIO.equipment.ventilator);
    expect(decoded('formulary')).toEqual(SCENARIO.formulary);
    const model = new HyponatremiaCorrection();
    expect(decoded('initial-public-state')).toEqual(model.snapshot(0));
    expect(decoded('fixed-live-vitals')).toEqual(model.vitals());
    // Explicit test-only inspection binds the documented latent defaults without
    // adding those private values to a learner-facing API.
    const hidden = decoded('initial-hidden-state') as Record<string, unknown>;
    for (const [key, value] of Object.entries(hidden)) expect(Object.getOwnPropertyDescriptor(model, key)?.value, key).toEqual(value);
    expect(decoded('declared-actions')).toEqual(HYPONATREMIA_CORRECTION_ACTIONS);
  });

  it('binds all authored clocks and fixed transcript times to implemented constants', () => {
    for (const [id, value] of Object.entries({ 'ticks-per-second': TICKS_PER_SECOND, 'aquaresis-ticks': AQUARESIS,
      'uncontrolled-rise-ticks': BREACH, 'response-interval-ticks': RESPONSE,
      'missing-control-stop-ticks': TAKEOVER, 'unfinished-session-ticks': SESSION })) {
      expect(entry(id).value, id).toBe(value);
      expect(entry(id).sourceRefs.every((ref) => !ref.startsWith('https:'))).toBe(true);
    }
    expect(entry('estimated-simulated-minutes').value).toBe(SCENARIO.metadata.estimatedMinutes);
    expect(entry('estimated-simulated-minutes').value).toBe((AQUARESIS + RESPONSE) / (60 * TICKS_PER_SECOND));
    expect(decoded('timeline-and-replay-ticks')).toEqual(Object.fromEntries([
      ...SCENARIO.timeline.map(({ id, atTick }) => [id, atTick]), ...SCENARIO.replayPoints!.map(({ id, atTick }) => [id, atTick]),
    ]));
    expect(entry('fixture-seed').value).toBe(FIXTURES.seed);
    for (const [id, key] of [['expert-fixture', 'expert'], ['common-error-fixture', 'commonError'],
      ['recovery-fixture', 'recovery'], ['no-action-fixture', 'noAction']] as const) expect(decoded(id)).toEqual(FIXTURES[key]);
  });

  it('keeps the original baseline, hour-1 offset, selected high-risk plan and potassium context in the actual UI and model', () => {
    const model = new HyponatremiaCorrection(); const initial = render(model);
    expect(initial).toContain(`Original sodium: ${entry('original-sodium-mmol-l').value} mmol/L`);
    expect(initial).toContain(`Supplied post-rescue sodium: ${entry('supplied-post-rescue-sodium-mmol-l').value} mmol/L after one hour`);
    const plan = decoded('selected-high-risk-plan');
    expect(initial).toContain(`${plan.dailyGoalLowMmolL}–${plan.dailyGoalHighMmolL} mmol/L daily goal`);
    expect(initial).toContain(`no more than ${plan.maximumRiseMmolL} mmol/L in any ${plan.windowHours} hours`);
    model.apply('review-risk', 0);
    expect(render(model)).toContain(`potassium ${entry('supplied-potassium-mmol-l').value} mmol/L`);
    expect(SCENARIO.patient.comorbidities).toContain(`Supplied potassium ${entry('supplied-potassium-mmol-l').value} mmol/L`);
    model.apply('reassess', AQUARESIS);
    expect(render(model, AQUARESIS)).toContain(`(${Number(entry('correction-window-offset-minutes').value) + AQUARESIS / (60 * TICKS_PER_SECOND)} min after the original sodium)`);
    expect(model.snapshot(AQUARESIS).choiceFeedback).toContain('total rise 6 mmol/L from the original 106');
    expect(model.snapshot(AQUARESIS).choiceFeedback).toContain(`Correction-hour ${(Number(entry('correction-window-offset-minutes').value) / 60 + AQUARESIS / (60 * 60 * TICKS_PER_SECOND)).toFixed(2)}`);
    // Synthetic internal boundary values isolate the implemented comparison;
    // they are not new authored clinical branches or observed production data.
    for (const rise of [plan.maximumRiseMmolL, plan.maximumRiseMmolL + 1]) {
      const boundary = new HyponatremiaCorrection();
      Object.assign(boundary, { sodium: Number(entry('original-sodium-mmol-l').value) + rise });
      boundary.apply('reassess', 0);
      expect(boundary.snapshot(0).overcorrectionObserved).toBe(rise > plan.maximumRiseMmolL);
    }
  });

  it('checks all authored laboratory contrasts against independent model progression without publishing latent values', () => {
    const initial = new HyponatremiaCorrection(); initial.apply('reassess', 0);
    const aquaresis = new HyponatremiaCorrection(); aquaresis.apply('reassess', AQUARESIS);
    const uncontrolled = new HyponatremiaCorrection(); uncontrolled.apply('reassess', BREACH);
    const later = new HyponatremiaCorrection(); later.apply('reassess', BREACH);
    later.apply('control-water-loss', BREACH); later.apply('relower', BREACH); later.apply('reassess', BREACH + RESPONSE);
    const values = decoded('authored-laboratory-contrasts');
    for (const [phase, model, tick] of [['initial', initial, 0], ['aquaresis', aquaresis, AQUARESIS],
      ['uncontrolled', uncontrolled, BREACH], ['laterResponse', later, BREACH + RESPONSE]] as const) {
      const observation = model.snapshot(tick).observation!;
      expect({ sodiumMmolL: observation.sodiumMmolL, urineOutputMlPerHour: observation.urineOutputMlPerHour }).toEqual(values[phase]);
      expect(model.vitals()).toEqual(decoded('fixed-live-vitals'));
    }
    const untreated = new HyponatremiaCorrection(); untreated.advance(TAKEOVER);
    expect({ sodiumMmolL: Object.getOwnPropertyDescriptor(untreated, 'sodium')?.value,
      urineOutputMlPerHour: Object.getOwnPropertyDescriptor(untreated, 'urineOutput')?.value }).toEqual(values.untreatedStop);
    expect(untreated.snapshot(TAKEOVER)).toMatchObject({ observation: null, peakObservedSodiumMmolL: 111, overcorrectionObserved: false });
    expect(JSON.stringify(untreated.snapshot(TAKEOVER))).not.toContain(String(values.untreatedStop.sodiumMmolL));
    expect(later.snapshot(BREACH + RESPONSE)).toMatchObject({ peakObservedSodiumMmolL: values.uncontrolled.sodiumMmolL,
      overcorrectionObserved: true, responseObserved: true });
    expect(render(later, BREACH + RESPONSE)).toContain('Highest supplied or requested sodium: 115 mmol/L');
  });

  it('documents a public scheduled reassessment, not a private response-readiness signal', () => {
    const early = new HyponatremiaCorrection(); const late = new HyponatremiaCorrection();
    for (const model of [early, late]) model.apply('reassess', AQUARESIS);
    early.apply('control-water-loss', BREACH - 1); late.apply('control-water-loss', BREACH);
    const comparable = (model: HyponatremiaCorrection, tick: number) => ({ ...model.snapshot(tick), waterLossControlAtTick: 0 });
    expect(comparable(early, BREACH - 1)).toEqual(comparable(late, BREACH));
    expect(early.advance(BREACH - 1 + RESPONSE)).toEqual(late.advance(BREACH + RESPONSE));
    expect(comparable(early, BREACH - 1 + RESPONSE)).toEqual(comparable(late, BREACH + RESPONSE));
    expect(late.snapshot(BREACH + RESPONSE).responseDueInSeconds).toBeNull();
    expect(entry('public-reassessment-checkpoint').value).toContain('regardless of hidden response readiness');
    expect(render(late, BREACH)).toContain('does not establish a response');
    early.apply('reassess', BREACH - 1 + RESPONSE); late.apply('reassess', BREACH + RESPONSE);
    expect(early.snapshot(BREACH - 1 + RESPONSE).responseObserved).toBe(true);
    expect(late.snapshot(BREACH + RESPONSE)).toMatchObject({ responseObserved: false, overcorrectionObserved: true,
      observation: { sodiumMmolL: 115 } });
    late.apply('relower', BREACH + RESPONSE);
    expect(late.snapshot(BREACH + RESPONSE).responseDueInSeconds).toBe(RESPONSE / TICKS_PER_SECOND);
  });

  it('binds all five objective identities and reference outcomes to real model events and debrief rules', () => {
    expect(Object.keys(decoded('objective-predicates'))).toEqual(SCENARIO.metadata.objectives.map(({ id }) => id));
    const outcomes = decoded('reference-objective-outcomes');
    for (const path of ['expert', 'commonError', 'recovery', 'noAction'] as const) {
      const { findings } = findingsFor(FIXTURES[path]);
      expect(findings.map(({ outcome }) => outcome), path).toEqual(outcomes[path]);
    }
    const { model, findings } = findingsFor(FIXTURES.recovery);
    expect(model.snapshot(FIXTURES.recovery.at(-1)![0])).toMatchObject({ normalizationAttempted: true,
      symptomWaitChosen: true, peakObservedSodiumMmolL: 115, ended: 'handoff' });
    expect(findings.find(({ objectiveId }) => objectiveId === 'sodium-correction-handoff')?.finding)
      .toContain(`${decoded('continuing-surveillance-hours').join('–')}-hour`);
  });

  it('does not turn an unconfirmed response or late monitoring into earned evidence', () => {
    const noResponse: Choices = [[0, 'review-risk'], [0, 'call-support'], [0, 'monitor'],
      [AQUARESIS, 'reassess'], [BREACH, 'control-water-loss'], [BREACH + RESPONSE, 'handoff']];
    expect(findingsFor(noResponse).findings.map(({ outcome }) => outcome)).toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
    const lateMonitor: Choices = [[0, 'review-risk'], [0, 'call-support'], [AQUARESIS, 'reassess'],
      [AQUARESIS + 1, 'monitor'], [AQUARESIS + 1, 'control-water-loss'],
      [AQUARESIS + 1 + RESPONSE, 'reassess'], [AQUARESIS + 1 + RESPONSE, 'handoff']];
    expect(findingsFor(lateMonitor).findings.map(({ outcome }) => outcome)).toEqual(['met', 'not-met', 'met', 'met', 'met']);
    for (const missing of ['call-support', 'review-risk']) {
      const incomplete = FIXTURES.expert.filter(([, action]) => action !== missing);
      expect(findingsFor(incomplete).findings.map(({ outcome }) => outcome)).toEqual(['not-met', 'met', 'met', 'met', 'not-met']);
    }
  });

  it.each(['normalize-now', 'wait-for-symptoms'] as const)('retains %s independently when later care and handoff succeed', (mistake) => {
    const { findings, model } = findingsFor([[0, mistake], ...FIXTURES.expert]);
    expect(findings.map(({ outcome }) => outcome)).toEqual([
      'met', mistake === 'wait-for-symptoms' ? 'not-met' : 'met', 'not-met', 'met', 'met',
    ]);
    expect(model.snapshot(FIXTURES.expert.at(-1)![0])).toMatchObject({ ended: 'handoff',
      normalizationAttempted: mistake === 'normalize-now', symptomWaitChosen: mistake === 'wait-for-symptoms' });
  });

  it('binds progress landmarks and conditional recovery to the actual state-driven selector', () => {
    const observed: Record<string, number> = { preparing: hyponatremiaCorrectionDemonstrationStep().progress };
    const model = new HyponatremiaCorrection();
    const record = (tick: number) => { const step = hyponatremiaCorrectionDemonstrationStep(model.snapshot(tick)); observed[step.id] = step.progress; return step; };
    for (let index = 0; index < 3; index += 1) model.apply(record(0).action, 0);
    record(0); model.advance(AQUARESIS);
    model.apply(record(AQUARESIS).action, AQUARESIS); model.apply(record(AQUARESIS).action, AQUARESIS);
    record(AQUARESIS); model.advance(AQUARESIS + RESPONSE);
    model.apply(record(AQUARESIS + RESPONSE).action, AQUARESIS + RESPONSE);
    model.apply(record(AQUARESIS + RESPONSE).action, AQUARESIS + RESPONSE); record(AQUARESIS + RESPONSE);
    const late = new HyponatremiaCorrection(); late.apply('reassess', BREACH); late.apply('control-water-loss', BREACH);
    const conditional = hyponatremiaCorrectionDemonstrationStep(late.snapshot(BREACH)); observed[conditional.id] = conditional.progress;
    expect(observed).toEqual(decoded('example-progress-landmarks'));
    expect(supportsHyponatremiaCorrectionDemonstration(SCENARIO)).toBe(true);
    expect(supportsHyponatremiaCorrectionDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
  });

  it('keeps assistance thresholds and shared transport defaults explicit without claiming a new clinical threshold', () => {
    const model = new HyponatremiaCorrection();
    const prompt = (level: 'guided' | 'coached' | 'unassisted', scenarioVersion = '0.1.0') => hyponatremiaCorrectionInlinePrompt(level, {
      scenarioVersion, hyponatremiaCorrection: model.snapshot(0),
    });
    expect(prompt('unassisted')).toBeNull(); expect(prompt('guided', '0.1.1')).toBeNull();
    for (const action of ['review-risk', 'call-support', 'monitor']) model.apply(action, 0);
    expect(prompt('guided')).not.toBeNull(); expect(prompt('coached')).toBeNull();
    expect(render(new HyponatremiaCorrection())).not.toContain('Private tutor');
    const route = readFileSync(join(process.cwd(), 'src/routes/AnesthesiaRoute.tsx'), 'utf8');
    const store = readFileSync(join(process.cwd(), 'src/platform/session/session-store.ts'), 'utf8');
    expect(route).toContain(`const DEFAULT_SEED = ${entry('shared-url-seed-default').value};`);
    expect(route).toContain(`session.setSpeed(endocrineDemo ? ${entry('example-playback-speed').value} : 5)`);
    expect(route).toContain(`session.setSpeed(${entry('manual-restart-speed').value})`);
    expect(store).toContain(`guidance: '${entry('initial-guidance').value}'`);
  });

  it('provides all ten honest hazard dispositions and locatable sources without inventing inclusive or clinical approval', () => {
    const hazards = (RECORDS.find(({ kind }) => kind === 'scenario-hazard')!.record as {
      hazards: Array<{ category: string; disposition: string; evidence: string[] }>;
    }).hazards;
    expect(hazards.map(({ category }) => category)).toEqual(HAZARD_CATEGORIES);
    expect(hazards.find(({ category }) => category === 'accessibility-misunderstanding')?.disposition).toBe('limited');
    expect(hazards.find(({ category }) => category === 'regional-variation')?.disposition).toBe('limited');
    for (const item of defaults) {
      expect(item.practiceRegions).toEqual(['US', 'GB']);
      for (const ref of item.sourceRefs) {
        if (ref.startsWith('https:')) expect(SOURCES.some((source) => `${source.locator} ${source.verifiedAgainst}`.includes(ref)
          || (ref.startsWith('https://doi.org/') && source.locator.includes(ref.slice('https://doi.org/'.length)))), ref).toBe(true);
        else expect(existsSync(join(process.cwd(), ref.split('#')[0]!)), ref).toBe(true);
      }
    }
    expect(JSON.stringify(hazards)).toContain('not native browser Worker or assistive-technology certification');
    expect(JSON.stringify(hazards)).toContain('No state-space pass record is supplied');
  });
});
