import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { buildModuleCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { TICKS_PER_SECOND, TICK_MS, MAX_CATCHUP_TICKS, SPEED_MULTIPLIERS, SimulationClock } from '@platform/clock/simulation-clock';
import { useSession } from '@platform/session/session-store';
import { REPORT_NOTE_LIMIT, REPORT_CONTEXT_ACTION_LIMIT, REPORT_CONTEXT_SNAPSHOT_LIMIT, REPORT_CONTEXT_JSON_LIMIT } from '@platform/reporting/contracts';
import type { EngineEvent } from '@platform/kernel/protocol';
import { SOURCES } from '@platform/docs/sources';
import { buildScenarioQualityCatalog, HAZARD_CATEGORIES, validateScenarioQualityRecord } from '@platform/catalog/scenario-quality';
import { AVP_DEFICIENCY_QUALITY_RECORDS as RECORDS } from '../../src/modules/endocrine-metabolic/avp-deficiency-quality';
import { HYPERNATREMIC_DEHYDRATION_AVP_DEFICIENCY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypernatremic-dehydration-avp-deficiency';
import { AVP_DEFICIENCY_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/avp-deficiency-fixtures';
import { AvpDeficiency, AVP_DEFICIENCY_ACTIONS, type AvpDeficiencyAction,
  AVP_DEFICIENCY_VOLUME_TICKS as VOLUME, AVP_DEFICIENCY_DELAY_TICKS as DELAY,
  AVP_DEFICIENCY_DESMOPRESSIN_TICKS as DESMOPRESSIN, AVP_DEFICIENCY_UNCONTROLLED_TICKS as UNCONTROLLED,
  AVP_DEFICIENCY_RESPONSE_TICKS as RESPONSE, AVP_DEFICIENCY_TAKEOVER_TICKS as TAKEOVER,
  AVP_DEFICIENCY_SESSION_TICKS as SESSION } from '../../src/modules/endocrine-metabolic/avp-deficiency';
import { AvpDeficiencyTray } from '../../src/modules/endocrine-metabolic/AvpDeficiencyTray';
import { avpDeficiencyDemonstrationStep, supportsAvpDeficiencyDemonstration } from '../../src/modules/endocrine-metabolic/demo/avp-deficiency-demonstration';
import { avpDeficiencyInlinePrompt } from '../../src/modules/endocrine-metabolic/avp-deficiency-tutor';

type Default = { id: string; category: string; value: string | number | boolean | null; sourceRefs: string[];
  rationale: string; practiceRegions: string[]; applicability: string; educationalEffect: string };
const defaults = (RECORDS.find(({ kind }) => kind === 'authored-defaults')!.record as { defaults: Default[] }).defaults;
const entry = (id: string) => defaults.find((item) => item.id === id)!;
const decoded = (id: string) => JSON.parse(String(entry(id).value));
const render = (model: AvpDeficiency, tick = 0) => renderToStaticMarkup(createElement(AvpDeficiencyTray, {
  assessment: model.snapshot(tick), scenarioVersion: '0.1.1', onAction: () => {},
}));
const completion = () => buildModuleCompletionCatalog([SCENARIO], ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition');
type Choices = readonly (readonly [number, AvpDeficiencyAction])[];

/** Real model events and debrief predicates, not an independent engine replay or review. */
function findingsFor(actions: Choices) {
  const model = new AvpDeficiency(); const events: EngineEvent[] = [];
  for (const [tick, action] of actions) {
    for (const event of model.apply(action, tick)) events.push({ tick, eventId: `avp-deficiency-${event.id}-${tick}`,
      severity: 'warning', category: 'assessment', message: event.message });
  }
  return { model, findings: objectiveFindings(SCENARIO, [], 0, 0, [], events) };
}
const labs = (model: AvpDeficiency, tick: number) => {
  model.apply('reassess', tick);
  const result = model.snapshot(tick).observation!;
  return { sodiumMmolL: result.sodiumMmolL, urineOutputMlPerHour: result.urineOutputMlPerHour,
    urineOsmolalityMosmPerKg: result.urineOsmolalityMosmPerKg };
};

describe('Literal AVP-deficiency quality evidence, not independent approval', () => {
  it('supplies exactly three valid records for this exact implemented version', () => {
    expect(RECORDS.map(({ kind }) => kind)).toEqual(['training-value', 'authored-defaults', 'scenario-hazard']);
    for (const envelope of RECORDS) {
      expect(envelope.moduleId).toBe('endocrine-metabolic');
      expect(envelope.record).toMatchObject({ schemaVersion: 1, scenarioId: SCENARIO.metadata.id, contentVersion: '0.1.1' });
      expect(validateScenarioQualityRecord(envelope.kind, envelope.record)).toEqual([]);
    }
    expect(SCENARIO.metadata.version).toBe('0.1.1');
    expect(new Set(defaults.map(({ id }) => id)).size).toBe(defaults.length);
  });

  it('does not manufacture state-space verification, completion, or clinical sign-off', () => {
    const quality = buildScenarioQualityCatalog(completion(), RECORDS);
    expect(quality.playableScenarioCount).toBe(0);
    expect(quality.scenarios[0]).toMatchObject({ playable: false, completionComplete: false });
    expect(quality.scenarios[0]!.qualityRecords.map(({ kind, status }) => [kind, status])).toEqual([
      ['training-value', 'present'], ['authored-defaults', 'present'], ['scenario-hazard', 'present'], ['state-space-verification', 'missing'],
    ]);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(JSON.stringify(RECORDS)).not.toContain('"status":"passed"');
    const current = completion();
    expect(() => buildScenarioQualityCatalog({ ...current,
      scenarios: current.scenarios.map((scenario) => ({ ...scenario, contentVersion: '0.1.2' })),
    }, RECORDS)).toThrow(/version/i);
  });

  it('binds schema compatibility and initial requests to the actual scenario and model', () => {
    const patient = SCENARIO.patient;
    expect(decoded('patient-demographics')).toEqual({ ageYears: patient.ageYears, sex: patient.sex,
      heightCm: patient.heightCm, weightKg: patient.weightKg, asaClass: patient.asaClass });
    expect(decoded('schema-baseline')).toEqual(patient.baseline);
    expect(decoded('schema-airway-respiratory')).toEqual({ difficulty: patient.airway.difficulty,
      difficultMaskVentilation: patient.airway.difficultMaskVentilation, respiratoryProfile: patient.respiratory.profile });
    expect(decoded('monitoring')).toEqual(SCENARIO.equipment.monitoring);
    expect(decoded('inactive-ventilator')).toEqual(SCENARIO.equipment.ventilator);
    expect(decoded('formulary')).toEqual(SCENARIO.formulary);
    const model = new AvpDeficiency();
    expect(decoded('initial-public-state')).toEqual(model.snapshot(0));
    expect(decoded('initial-live-vitals')).toEqual(model.vitals());
    // Test-only inspection binds latent authored defaults without exposing them in the snapshot.
    expect(Object.keys(decoded('initial-hidden-state')).sort()).toEqual(Object.keys(model).sort());
    for (const [key, value] of Object.entries(decoded('initial-hidden-state'))) {
      expect(Object.getOwnPropertyDescriptor(model, key)?.value, key).toEqual(value);
    }
    expect(decoded('declared-actions')).toEqual(AVP_DEFICIENCY_ACTIONS);
    expect(AVP_DEFICIENCY_ACTIONS).toHaveLength(10);
    model.advance(DELAY); expect(decoded('delayed-live-vitals')).toEqual(model.vitals());
    model.apply('restore-volume', DELAY); model.advance(DELAY + VOLUME);
    expect(decoded('restored-live-vitals')).toEqual(model.vitals());
  });

  it('binds all seven authored clocks, scenario timing, and fixed transcripts to implementation', () => {
    for (const [id, value] of Object.entries({ 'ticks-per-second': TICKS_PER_SECOND, 'volume-interval-ticks': VOLUME,
      'volume-delay-ticks': DELAY, 'desmopressin-interval-ticks': DESMOPRESSIN,
      'uncontrolled-loss-interval-ticks': UNCONTROLLED, 'combined-response-interval-ticks': RESPONSE,
      'missing-volume-stop-ticks': TAKEOVER, 'unfinished-session-ticks': SESSION })) {
      expect(entry(id).value, id).toBe(value);
    }
    expect([VOLUME, DELAY, DESMOPRESSIN, UNCONTROLLED, RESPONSE, TAKEOVER, SESSION])
      .toEqual([9000, 18000, 18000, 72000, 72000, 36000, 180000]);
    expect(entry('estimated-simulated-minutes').value).toBe(SCENARIO.metadata.estimatedMinutes);
    expect(entry('estimated-simulated-minutes').value).toBe((VOLUME + RESPONSE) / (60 * TICKS_PER_SECOND));
    expect(decoded('timeline-and-replay-ticks')).toEqual(Object.fromEntries([
      ...SCENARIO.timeline.map(({ id, atTick }) => [id, atTick]), ...SCENARIO.replayPoints!.map(({ id, atTick }) => [id, atTick]),
    ]));
    expect(entry('fixture-seed').value).toBe(FIXTURES.seed);
    for (const [id, key] of [['expert-fixture', 'expert'], ['common-error-fixture', 'commonError'],
      ['recovery-fixture', 'recovery'], ['no-action-fixture', 'noAction']] as const) expect(decoded(id)).toEqual(FIXTURES[key]);
    expect(FIXTURES.expert).toHaveLength(9); expect(entry('expert-fixture').rationale).toContain('Nine');
    expect(FIXTURES.recovery).toHaveLength(12); expect(entry('recovery-fixture').rationale).toContain('Twelve');
  });

  it('keeps supplied context distinct from a new diagnosis, requested urine concentration, or prescription', () => {
    const model = new AvpDeficiency(); const initial = render(model);
    const supplied = decoded('supplied-initial-findings'); const electrolytes = decoded('supplied-electrolytes');
    expect(initial).toContain(`Supplied initial sodium: ${supplied.sodiumMmolL} mmol/L`);
    expect(initial).toContain(`urine output: ${supplied.urineOutputMlPerHour} mL/hour`);
    expect(initial).toContain('distinct from diabetes mellitus');
    expect(initial).not.toContain('100 mOsm/kg');
    model.apply('review-context', 0);
    expect(render(model)).toContain(`Potassium is ${electrolytes.potassiumMmolL} mmol/L`);
    expect(render(model)).toContain(`creatinine ${electrolytes.creatinineMgDl} mg/dL`);
    expect(SCENARIO.patient.comorbidities).toContain(`Supplied potassium ${electrolytes.potassiumMmolL} mmol/L and creatinine ${electrolytes.creatinineMgDl} mg/dL`);
    expect(render(model)).toContain('Hypernatremia duration is unknown');
    expect(render(model)).toContain('No dose, route, infusion rate, or automatic redosing');
  });

  it('tests prompt, delayed, and late combined responses against independent authored contrasts', () => {
    const contrasts = decoded('authored-laboratory-contrasts');
    const initial = new AvpDeficiency(); expect(labs(initial, 0)).toEqual(contrasts.initial);
    const delayed = new AvpDeficiency(); expect(labs(delayed, DELAY)).toEqual(contrasts.delayed);
    for (const [name, volumeAt, responseAt, before, after, firstKey] of [
      ['promptResponse', 0, VOLUME, 163, 162, 'afterVolume'], ['delayedResponse', DELAY, DELAY + VOLUME, 164, 163, null],
      ['lateResponse', 0, UNCONTROLLED, 165, 164, 'uncontrolled'],
    ] as const) {
      const model = new AvpDeficiency(); model.apply('restore-volume', volumeAt);
      const first = labs(model, responseAt);
      expect(first).toEqual({ sodiumMmolL: before, urineOutputMlPerHour: 450, urineOsmolalityMosmPerKg: 95 });
      if (firstKey) expect(first).toEqual(contrasts[firstKey]);
      model.apply('replace-water', responseAt); model.apply('restore-desmopressin', responseAt);
      const later = labs(model, responseAt + RESPONSE);
      expect(later).toEqual({ sodiumMmolL: after, urineOutputMlPerHour: 80, urineOsmolalityMosmPerKg: 500 });
      expect(model.snapshot(responseAt + RESPONSE).peakObservedSodiumMmolL).toBe(before);
      expect(later).toEqual(contrasts[name]);
    }
  });

  it('distinguishes desmopressin-only and water-only effects from combined response', () => {
    const contrasts = decoded('authored-laboratory-contrasts');
    for (const action of ['replace-water', 'restore-desmopressin'] as const) {
      const model = new AvpDeficiency(); model.apply('restore-volume', 0); model.apply(action, VOLUME);
      const finding = labs(model, VOLUME + RESPONSE);
      expect(finding).toEqual(action === 'replace-water' ? contrasts.afterVolume : contrasts.afterDesmopressin);
      expect(finding.sodiumMmolL).toBe(163);
      expect(model.snapshot(VOLUME + RESPONSE)).toMatchObject({ responseObserved: false, responseDueInSeconds: null });
      expect(model.apply('handoff', VOLUME + RESPONSE).at(-1)?.id).toBe('handoff-refused');
    }
  });

  it('keeps latent rise private and the peak historical until an explicit new request', () => {
    const model = new AvpDeficiency(); model.apply('restore-volume', 0); model.apply('reassess', VOLUME);
    const previous = model.snapshot(VOLUME).observation;
    const events = model.advance(UNCONTROLLED);
    const exposed = { events, snapshot: model.snapshot(UNCONTROLLED), vitals: model.vitals(),
      prompt: avpDeficiencyInlinePrompt('guided', { scenarioVersion: '0.1.1', avpDeficiency: model.snapshot(UNCONTROLLED) }) };
    expect(exposed.snapshot).toMatchObject({ observation: previous, peakObservedSodiumMmolL: 163 });
    expect(JSON.stringify(exposed)).not.toContain('165');
    expect(render(model, UNCONTROLLED)).not.toContain('165');
    model.apply('replace-water', UNCONTROLLED); model.apply('restore-desmopressin', UNCONTROLLED);
    model.advance(UNCONTROLLED + RESPONSE);
    expect(model.snapshot(UNCONTROLLED + RESPONSE)).toMatchObject({ observation: previous, peakObservedSodiumMmolL: 163, responseObserved: false });
    labs(model, UNCONTROLLED + RESPONSE);
    expect(model.snapshot(UNCONTROLLED + RESPONSE)).toMatchObject({ peakObservedSodiumMmolL: 164, observation: { sodiumMmolL: 164 } });
    expect(render(model, UNCONTROLLED + RESPONSE)).toContain('Original sodium: 162 mmol/L');
    const untouched = new AvpDeficiency(); untouched.advance(TAKEOVER);
    expect(untouched.snapshot(TAKEOVER)).toMatchObject({ observation: null, peakObservedSodiumMmolL: 162, ended: 'instructor-takeover' });
    expect(JSON.stringify(untouched.snapshot(TAKEOVER))).not.toContain('164');
  });

  it('binds all five objective identities and reference outcomes to real events and debrief predicates', () => {
    expect(Object.keys(decoded('objective-predicates'))).toEqual(SCENARIO.metadata.objectives.map(({ id }) => id));
    expect(decoded('objective-predicates')['avp-circulation']).toBe(
      'volume restoration and either circulation or later response assessment; delay is retained, not a credit cutoff');
    const outcomes = decoded('reference-objective-outcomes');
    for (const path of ['expert', 'commonError', 'recovery', 'noAction'] as const) {
      expect(findingsFor(FIXTURES[path]).findings.map(({ outcome }) => outcome), path).toEqual(outcomes[path]);
    }
    expect(findingsFor(FIXTURES.expert).findings.every(({ outcome }) => outcome === 'met')).toBe(true);
    const recovery = findingsFor(FIXTURES.recovery);
    expect(recovery.model.snapshot(FIXTURES.recovery.at(-1)![0])).toMatchObject({ ended: 'handoff', volumeDelayed: true,
      normalizationAttempted: true, withholdingChosen: true, observation: { sodiumMmolL: 163 }, peakObservedSodiumMmolL: 164 });
    expect(recovery.findings.map(({ outcome }) => outcome)).toEqual(['met', 'met', 'not-met', 'met', 'met']);
  });

  it.each([['replace-water', 'restore-desmopressin'], ['restore-desmopressin', 'replace-water']] as const)(
    'allows %s then %s without a laboratory or administrative gate but distinguishes final-only assessment', (first, second) => {
      const actions: Choices = [[0, 'restore-volume'], [VOLUME, first], [VOLUME, second], [VOLUME, 'call-support'],
        [VOLUME, 'review-context'], [VOLUME, 'monitor'], [VOLUME + RESPONSE, 'reassess'], [VOLUME + RESPONSE, 'handoff']];
      const { model, findings } = findingsFor(actions);
      expect(model.snapshot(VOLUME + RESPONSE)).toMatchObject({ ended: 'handoff', observation: { sodiumMmolL: 162 }, peakObservedSodiumMmolL: 162 });
      expect(findings.map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'not-met', 'met']);
      const absentFresh = findingsFor(actions.filter(([, action]) => action !== 'reassess'));
      expect(absentFresh.model.snapshot(VOLUME + RESPONSE).ended).toBeNull();
      expect(absentFresh.findings.map(({ outcome }) => outcome)).toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
    });

  it('retains the authored delay without using its 0.1-second boundary as a clinical credit cutoff', () => {
    const results = [DELAY - 1, DELAY].map((volumeAt) => findingsFor([
      [volumeAt, 'restore-volume'], [volumeAt, 'call-support'], [volumeAt, 'review-context'], [volumeAt, 'monitor'],
      [volumeAt + VOLUME, 'reassess'], [volumeAt + VOLUME, 'replace-water'], [volumeAt + VOLUME, 'restore-desmopressin'],
      [volumeAt + VOLUME + RESPONSE, 'reassess'], [volumeAt + VOLUME + RESPONSE, 'handoff'],
    ]));
    for (const result of results) expect(result.findings.map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(results[0]!.model.snapshot(DELAY - 1 + VOLUME + RESPONSE).volumeDelayed).toBe(false);
    expect(results[1]!.model.snapshot(DELAY + VOLUME + RESPONSE).volumeDelayed).toBe(true);
    expect(results[0]!.findings.find(({ objectiveId }) => objectiveId === 'avp-circulation')?.atTick).toBe(DELAY - 1);
    expect(results[1]!.findings.find(({ objectiveId }) => objectiveId === 'avp-circulation')?.atTick).toBe(DELAY);
  });

  it('binds every progress landmark to the actual nine-decision selector', () => {
    const observed: Record<string, number> = { preparing: avpDeficiencyDemonstrationStep().progress };
    const model = new AvpDeficiency(); let tick = 0; let decisions = 0;
    for (let stepIndex = 0; stepIndex < 12; stepIndex += 1) {
      const step = avpDeficiencyDemonstrationStep(model.snapshot(tick)); observed[step.id] = step.progress;
      if (step.finished) break;
      if (step.action) { model.apply(step.action, tick); decisions += 1; }
      else { tick += step.id === 'volume-observation' ? VOLUME : RESPONSE; model.advance(tick); }
    }
    expect(decisions).toBe(9); expect(model.snapshot(tick).ended).toBe('handoff');
    expect(observed).toEqual(decoded('example-progress-landmarks'));
    expect(supportsAvpDeficiencyDemonstration(SCENARIO)).toBe(true);
    expect(supportsAvpDeficiencyDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.2' } })).toBe(false);
  });

  it('keeps public-state assistance and shared transport defaults explicit', () => {
    const model = new AvpDeficiency();
    const prompt = (level: 'guided' | 'coached' | 'unassisted', tick = 0, scenarioVersion = '0.1.1') => avpDeficiencyInlinePrompt(level, {
      scenarioVersion, avpDeficiency: model.snapshot(tick),
    });
    expect(prompt('unassisted')).toBeNull(); expect(prompt('guided', 0, '0.1.2')).toBeNull();
    expect(prompt('guided')?.id).toBe('avp-deficiency-volume');
    model.apply('restore-volume', 0); model.advance(VOLUME);
    expect(prompt('guided', VOLUME)?.id).toBe('avp-deficiency-water');
    model.apply('replace-water', VOLUME);
    expect(prompt('guided', VOLUME)?.id).toBe('avp-deficiency-desmopressin');
    model.apply('restore-desmopressin', VOLUME);
    for (const action of ['call-support', 'review-context', 'monitor', 'reassess']) model.apply(action, VOLUME);
    expect(prompt('guided', VOLUME)).not.toBeNull(); expect(prompt('coached', VOLUME)).toBeNull();
    expect(render(new AvpDeficiency())).not.toContain('Private tutor');
    const route = readFileSync(join(process.cwd(), 'src/routes/AnesthesiaRoute.tsx'), 'utf8');
    const store = readFileSync(join(process.cwd(), 'src/platform/session/session-store.ts'), 'utf8');
    expect(route).toContain(`const DEFAULT_SEED = ${entry('shared-url-seed-default').value};`);
    expect(route).toContain(`session.setSpeed(endocrineDemo ? ${entry('example-playback-speed').value} : 5)`);
    expect(route).toContain(`session.setSpeed(${entry('manual-restart-speed').value})`);
    expect(store).toContain(`guidance: '${entry('initial-guidance').value}'`);
    expect(entry('standalone-guidance').value).toBe('unassisted');
    expect(decoded('demonstration-eligibility')).toEqual({ contentVersion: '0.1.1', demonstrationVersion: '0.1.1' });
  });

  it('binds shared initial transport and privacy limits to executable constants and actual defaults', () => {
    const state = useSession.getState(); const clock = new SimulationClock();
    expect(decoded('shared-transport-defaults')).toEqual({ phase: state.phase, transport: state.transport,
      speed: state.speed, tick: state.tick, elapsed: state.elapsed, ready: state.ready,
      tickMs: TICK_MS, singleStepTicks: clock.singleStep(), maxCatchupTicks: MAX_CATCHUP_TICKS,
      speedMultipliers: SPEED_MULTIPLIERS });
    const report = decoded('report-defaults');
    expect(report).toEqual({ open: false, category: '', note: '', recentContext: null, noteLimit: REPORT_NOTE_LIMIT,
      actionLimit: REPORT_CONTEXT_ACTION_LIMIT, snapshotScalarLimit: REPORT_CONTEXT_SNAPSHOT_LIMIT,
      jsonCharacterLimit: REPORT_CONTEXT_JSON_LIMIT });
    const source = readFileSync(join(process.cwd(), 'src/platform/reporting/ScenarioProblemReport.tsx'), 'utf8');
    expect(source).toContain(`const [open, setOpen] = useState(${report.open});`);
    expect(source).toContain(`const [category, setCategory] = useState<ReportCategory | ''>('${report.category}');`);
    expect(source).toContain(`const [note, setNote] = useState('${report.note}');`);
    expect(source).toContain(`const [recentContext, setRecentContext] = useState<ScenarioReportRecentContext | null>(${report.recentContext});`);
  });

  it('retains all ten hazard dispositions and locatable authored sources without claiming independent approval', () => {
    const hazards = (RECORDS.find(({ kind }) => kind === 'scenario-hazard')!.record as {
      hazards: Array<{ category: string; disposition: string; evidence: string[] }>;
    }).hazards;
    expect(hazards.map(({ category }) => category)).toEqual(HAZARD_CATEGORIES);
    for (const category of ['accessibility-misunderstanding', 'regional-variation', 'unsupported-precision']) {
      expect(hazards.find((hazard) => hazard.category === category)?.disposition).toBe('limited');
    }
    for (const item of defaults) {
      expect(item.practiceRegions).toEqual(['US', 'GB']);
      expect(item.applicability).toMatch(/authored/i);
      for (const ref of item.sourceRefs) {
        if (ref.startsWith('https:')) expect(SOURCES.some((source) => `${source.locator} ${source.verifiedAgainst}`.includes(ref)
          || (ref.startsWith('https://doi.org/') && source.locator.includes(ref.slice('https://doi.org/'.length)))), ref).toBe(true);
        else expect(existsSync(join(process.cwd(), ref.split('#')[0]!)), ref).toBe(true);
      }
    }
    expect(JSON.stringify(hazards)).toMatch(/no state-space pass(?: record)? is supplied/i);
    expect(JSON.stringify(hazards)).toMatch(/verification remains? pending/);
  });
});
