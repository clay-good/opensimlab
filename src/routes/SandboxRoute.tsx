/**
 * The pharmacology sandbox page (learning/knowledge-layer → The Sandbox).
 *
 * One bolus, one patient, two plots: plasma and effect site. Holding the dose
 * and varying age or weight overlays one line per value. Every choice is a list
 * built from the anaesthesia lessons, so nothing here is typed; every curve
 * names its model's envelope verdict, and an out-of-range one is drawn dimmed and
 * dashed rather than hidden. The state lives in the URL and nowhere else.
 */
import { useMemo, useState } from 'react';
import { Badge, Panel, SegmentedControl, Select } from '@platform/ui';
import { SiteBar } from '@platform/ui/SiteBar';
import { t, type MessageKey } from '@platform/i18n/messages';
import '@platform/i18n/messages-sandbox';
import { SCENARIOS } from '@anesthesia/scenarios';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { MODELS_BY_ID } from '@anesthesia/pharmacology/registry';
import { CONFIDENCE_LABEL_TEXT } from '@anesthesia/pharmacology/envelope';
import {
  absoluteDose, authoredValues, MAX_CURVES, parseSandboxQuery, SANDBOX_MINUTES, sandboxCatalogue, sandboxCurves, sandboxQuery,
  suggestedScenario, VARIED_COVARIATES, type SandboxState, type VariedCovariate,
} from '@anesthesia/sandbox/pharmacology-sandbox';
import {
  BREATHING_PATTERNS, FIO2_BASIS, parsePhysiologyQuery, PATTERN_BASIS, PHYSIOLOGY_MINUTES, physiologyQuery, PREOXYGENATION_FIO2,
  PREOXYGENATION_MINUTES, PROFILE_BASIS, PROFILE_IDS, runPhysiology, STOP_BELOW_SATURATION, type InputBasis, type PhysiologyState,
} from '@anesthesia/sandbox/physiology-sandbox';
import {
  BLOOD_LOSS_PERCENT, CIRCULATION_MINUTES, circulationQuery, parseCirculationQuery, runCirculation, VASODILATION_LEVELS,
  VASOPRESSOR_LEVELS, type CirculationInput, type CirculationState,
} from '@anesthesia/sandbox/circulation-sandbox';

const CATALOGUE = sandboxCatalogue(SCENARIOS);
const DEFAULT_STATE: SandboxState = { modelId: 'propofol-eleveld-2018', patientId: 'routine-induction', dose: 100, minutes: 10 };
/** One color per overlaid patient; an out-of-range curve gives its color up for the dimmed one. */
const CURVE_TOKENS = ['--ecg', '--arterial', '--spo2', '--capno'] as const;
const DIMMED_TOKEN = '--text-tertiary';
const TITLES = new Map(SCENARIOS.map((scenario) => [scenario.metadata.id, scenario.metadata.title]));
/** Models a learner can give: those with at least one authored absolute dose. */
/** Every dose a drug's lessons offer, absolute and per kilogram, as one list of choices. */
const doseChoices = (drugId: string) => [
  ...(CATALOGUE.doses[drugId] ?? []).map((dose) => ({ dose, perKg: false })),
  ...(CATALOGUE.perKgDoses[drugId] ?? []).map((dose) => ({ dose, perKg: true })),
];
const doseKey = (choice: { dose: number; perKg?: boolean }) => `${choice.dose}${choice.perKg ? '/kg' : ''}`;
const OFFERED_MODELS = [...MODELS_BY_ID.values()].filter((model) => doseChoices(model.drugId).length > 0);

/**
 * The reverse link: the explainer whose "show me" opens this sandbox view, and
 * the lesson that explainer demonstrates. Drawn from the explainers rather than
 * listed here, so a new explainer pointing at a view shows up on its own.
 */
function ExplainerLink({ view }: { view: 'pharmacology' | 'physiology' | 'circulation' }) {
  const explainer = EXPLAINERS.find((candidate) => candidate.showMe.sandbox !== undefined
    && (new URLSearchParams(candidate.showMe.sandbox).get('view') ?? 'pharmacology') === view);
  if (!explainer) return null;
  return (
    <p>
      {t('sandbox.explained-in', { title: explainer.title })}{' '}
      <a href={`/anesthesia/scenario/${explainer.showMe.scenarioId}`}>
        {TITLES.get(explainer.showMe.scenarioId) ?? explainer.showMe.scenarioId}
      </a>
    </p>
  );
}

function initialState(): { state: SandboxState; problem: string | null } {
  const query = typeof location === 'undefined' ? '' : location.search;
  if (query === '' || query === '?') return { state: DEFAULT_STATE, problem: null };
  const parsed = parseSandboxQuery(CATALOGUE, query);
  return 'state' in parsed ? { state: parsed.state, problem: null } : { state: DEFAULT_STATE, problem: parsed.problem };
}

const describePatient = (covariates: { ageYears: number; sex: string; weightKg: number; heightCm: number }) =>
  t('sandbox.patient', { age: covariates.ageYears, sex: covariates.sex, weight: covariates.weightKg, height: covariates.heightCm });

interface Line {
  readonly id: string;
  readonly label: string;
  readonly colorToken: string;
  readonly dashed: boolean;
  /** [seconds, concentration] pairs. */
  readonly points: readonly (readonly [number, number])[];
}

/**
 * A static SVG plot. Not the cockpit's canvas plot: sharing that module with a
 * page outside the cockpit made the bundler split it out of the cockpit chunk,
 * which costs every lesson a little, and a still curve needs no canvas.
 */
function SandboxPlot({ lines, xMax, yMax, yMin = 0, label }: {
  lines: readonly Line[]; xMax: number; yMax: number; yMin?: number; label: string;
}) {
  const width = 600;
  const height = 180;
  const pad = { left: 8, right: 8, top: 8, bottom: 8 };
  const x = (seconds: number) => pad.left + (seconds / xMax) * (width - pad.left - pad.right);
  const y = (value: number) => height - pad.bottom - ((value - yMin) / Math.max(yMax - yMin, 1e-6)) * (height - pad.top - pad.bottom);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} style={{ width: '100%', height: 'auto' }}>
      {[0, 1, 2, 3, 4].map((row) => {
        const at = pad.top + ((height - pad.top - pad.bottom) * row) / 4;
        return <line key={row} x1={pad.left} x2={width - pad.right} y1={at} y2={at} stroke="var(--line-subtle)" strokeWidth={1} />;
      })}
      {lines.map((line) => (
        <polyline key={line.id} fill="none" stroke={`var(${line.colorToken})`} strokeWidth={2}
          strokeDasharray={line.dashed ? '6 4' : undefined}
          points={line.points.map(([seconds, value]) => `${x(seconds).toFixed(1)},${y(value).toFixed(1)}`).join(' ')} />
      ))}
    </svg>
  );
}

function PharmacologySandbox() {
  const [{ state, problem }, setView] = useState(initialState);
  const model = MODELS_BY_ID.get(state.modelId)!;
  const curves = useMemo(() => sandboxCurves(CATALOGUE, state), [state]);
  const suggestion = suggestedScenario(CATALOGUE, state);

  const update = (next: SandboxState) => {
    setView({ state: next, problem: null });
    if (typeof history !== 'undefined') history.replaceState(null, '', `${location.pathname}?${sandboxQuery(next)}`);
  };
  const chooseModel = (modelId: string) => {
    const chosen = MODELS_BY_ID.get(modelId)!;
    const choices = doseChoices(chosen.drugId);
    const kept = choices.find((choice) => doseKey(choice) === doseKey({ dose: state.dose, perKg: state.perKg === true }));
    const { perKg: _perKg, ...rest } = state;
    const next = kept ?? choices[0]!;
    update({ ...rest, modelId, dose: next.dose, ...(next.perKg ? { perKg: true as const } : {}) });
  };
  const chooseVary = (covariate: VariedCovariate | 'none') => {
    if (covariate === 'none') { const { vary: _vary, ...rest } = state; update(rest); return; }
    const values = authoredValues(CATALOGUE, covariate);
    // Start from the extremes, which is where a difference shows first.
    update({ ...state, vary: { covariate, values: [values[0]!, values.at(-1)!] } });
  };
  const toggleValue = (value: number) => {
    if (!state.vary) return;
    const chosen = state.vary.values.includes(value)
      ? state.vary.values.filter((candidate) => candidate !== value)
      : [...state.vary.values, value].sort((a, b) => a - b);
    if (chosen.length < 2 || chosen.length > MAX_CURVES) return;
    update({ ...state, vary: { covariate: state.vary.covariate, values: chosen } });
  };

  const xMax = state.minutes * 60;
  const plot = (which: 'plasma' | 'effectSite'): { series: Line[]; yMax: number } => {
    const series = curves.map((curve, index): Line => {
      const outside = curve.envelope.label === 'out-of-range';
      return {
        id: `${which}-${index}`,
        label: describePatient(curve.covariates),
        colorToken: outside ? DIMMED_TOKEN : CURVE_TOKENS[index]!,
        dashed: outside,
        points: curve.samples.flatMap((sample) => {
          const value = sample[which];
          return value === null ? [] : [[sample.minutes * 60, value] as [number, number]];
        }),
      };
    });
    const yMax = Math.max(1e-6, ...series.flatMap((line) => line.points.map(([, y]) => y))) * 1.1;
    return { series, yMax };
  };
  const plasma = plot('plasma');
  const effect = plot('effectSite');
  const hasEffectSite = effect.series.some((line) => line.points.length > 0);

  return (
    <>
        <p>{t('sandbox.intro')}</p>
        {problem && <p role="alert">{t('sandbox.link-problem', { problem })}</p>}

        <Panel title={t('sandbox.inputs')}>
          <Select label={t('sandbox.model')} value={state.modelId} onChange={(event) => chooseModel(event.target.value)}
            options={OFFERED_MODELS.map((candidate) => ({ value: candidate.id, label: `${candidate.drugName} · ${candidate.id}` }))} />
          <Select label={t('sandbox.patient-label')} value={state.patientId}
            onChange={(event) => update({ ...state, patientId: event.target.value })}
            options={CATALOGUE.patients.map((patient) => ({ value: patient.id,
              label: `${describePatient(patient.covariates)} · ${TITLES.get(patient.id) ?? patient.id}` }))} />
          <p className="field__label">{t('sandbox.dose', { unit: model.doseUnit })}</p>
          <SegmentedControl label={t('sandbox.dose', { unit: model.doseUnit })}
            value={doseKey({ dose: state.dose, perKg: state.perKg === true })}
            onChange={(key) => {
              const choice = doseChoices(model.drugId).find((candidate) => doseKey(candidate) === key)!;
              const { perKg: _perKg, ...rest } = state;
              update({ ...rest, dose: choice.dose, ...(choice.perKg ? { perKg: true as const } : {}) });
            }}
            options={doseChoices(model.drugId).map((choice) => ({ value: doseKey(choice),
              label: `${choice.dose} ${model.doseUnit}${choice.perKg ? '/kg' : ''}` }))} />
          {state.perKg && (
            <p className="field__hint" role="status">
              {t('sandbox.per-kg', { dose: state.dose, unit: model.doseUnit, amount: absoluteDose(CATALOGUE, state),
                weight: CATALOGUE.patients.find((patient) => patient.id === state.patientId)!.covariates.weightKg })}
            </p>
          )}
          <p className="field__label">{t('sandbox.minutes')}</p>
          <SegmentedControl label={t('sandbox.minutes')} value={state.minutes}
            onChange={(minutes) => update({ ...state, minutes })}
            options={SANDBOX_MINUTES.map((minutes) => ({ value: minutes, label: t('sandbox.minutes-option', { minutes }) }))} />
          <p className="field__label">{t('sandbox.vary')}</p>
          <SegmentedControl label={t('sandbox.vary')} value={state.vary?.covariate ?? 'none'} onChange={chooseVary}
            options={[{ value: 'none', label: t('sandbox.vary-none') },
              ...VARIED_COVARIATES.map((covariate) => ({ value: covariate, label: t(`sandbox.vary-${covariate}` as MessageKey) }))]} />
          {state.vary && (
            <fieldset className="field">
              <legend className="field__label">{t('sandbox.values', { max: MAX_CURVES })}</legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2) var(--space-4)' }}>
              {authoredValues(CATALOGUE, state.vary.covariate).map((value) => (
                <label key={value}>
                  <input type="checkbox" checked={state.vary!.values.includes(value)} onChange={() => toggleValue(value)}
                    disabled={!state.vary!.values.includes(value) && state.vary!.values.length >= MAX_CURVES} />
                  {' '}{value}
                </label>
              ))}
              </div>
            </fieldset>
          )}
        </Panel>

        <section aria-labelledby="sandbox-plasma">
          <h2 id="sandbox-plasma">{t('sandbox.plasma', { unit: model.concentrationUnit })}</h2>
          <SandboxPlot lines={plasma.series} xMax={xMax} yMax={plasma.yMax}
            label={t('sandbox.plot-label', { what: t('sandbox.plasma', { unit: model.concentrationUnit }), minutes: state.minutes })} />
        </section>
        {hasEffectSite ? (
          <section aria-labelledby="sandbox-effect">
            <h2 id="sandbox-effect">{t('sandbox.effect', { unit: model.concentrationUnit })}</h2>
            <SandboxPlot lines={effect.series} xMax={xMax} yMax={effect.yMax}
              label={t('sandbox.plot-label', { what: t('sandbox.effect', { unit: model.concentrationUnit }), minutes: state.minutes })} />
          </section>
        ) : <p>{t('sandbox.no-effect-site')}</p>}

        <table>
          <caption>{t('sandbox.table-caption', { dose: absoluteDose(CATALOGUE, state), unit: model.doseUnit, minutes: state.minutes })}</caption>
          <thead>
            <tr>
              <th scope="col">{t('sandbox.col-patient')}</th>
              <th scope="col">{t('sandbox.col-envelope')}</th>
              <th scope="col">{t('sandbox.col-plasma-end', { minutes: state.minutes })}</th>
              <th scope="col">{t('sandbox.col-effect-peak')}</th>
            </tr>
          </thead>
          <tbody>
            {curves.map((curve, index) => {
              const peak = curve.samples.reduce((best, sample) =>
                (sample.effectSite ?? -1) > (best.effectSite ?? -1) ? sample : best, curve.samples[0]!);
              const kind = curve.envelope.label === 'out-of-range' ? 'out-of-range'
                : curve.envelope.label === 'teaching' ? 'teaching' : 'default';
              return (
                <tr key={index}>
                  <th scope="row">
                    {/* The line's own color and dash, so the table is the plot's key. */}
                    <svg width="24" height="8" aria-hidden="true">
                      <line x1="0" x2="24" y1="4" y2="4" strokeWidth={2}
                        stroke={`var(${curve.envelope.label === 'out-of-range' ? DIMMED_TOKEN : CURVE_TOKENS[index]!})`}
                        strokeDasharray={curve.envelope.label === 'out-of-range' ? '6 4' : undefined} />
                    </svg>{' '}
                    {describePatient(curve.covariates)}
                  </th>
                  <td><Badge kind={kind}>{CONFIDENCE_LABEL_TEXT[curve.envelope.label]}</Badge> {curve.envelope.summary}</td>
                  <td className="numeric">{curve.samples.at(-1)!.plasma.toFixed(2)} {model.concentrationUnit}</td>
                  <td className="numeric">{peak.effectSite === null ? t('sandbox.none')
                    : t('sandbox.peak', { value: peak.effectSite.toFixed(2), unit: model.concentrationUnit, seconds: Math.round(peak.minutes * 60) })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p>{t('sandbox.model-source', { citation: `${model.citation.authors} (${model.citation.year})`, locator: model.citation.locator.replace(/\.$/, '') })}</p>
        {suggestion && (
          <p>
            {t('sandbox.suggest')}{' '}
            <a href={`/anesthesia/scenario/${suggestion}`}>{TITLES.get(suggestion) ?? suggestion}</a>
          </p>
        )}
    </>
  );
}

const PHYSIOLOGY_DEFAULT: PhysiologyState = { profile: 'healthy', fio2: 1, pattern: 'apnea', minutes: 10 };
const BASIS_KIND = { published: 'default', teaching: 'teaching' } as const;

function PhysiologySandbox() {
  const [{ state, problem }, setView] = useState(() => {
    const parsed = parsePhysiologyQuery(typeof location === 'undefined' ? '' : location.search);
    return 'state' in parsed ? { state: parsed.state, problem: null } : { state: PHYSIOLOGY_DEFAULT, problem: parsed.problem };
  });
  const run = useMemo(() => runPhysiology(state), [state]);
  const update = (next: PhysiologyState) => {
    setView({ state: next, problem: null });
    if (typeof history !== 'undefined') history.replaceState(null, '', `${location.pathname}?${physiologyQuery(next)}`);
  };
  const basis = (kind: InputBasis) => <Badge kind={BASIS_KIND[kind]}>{t(`sandbox.basis-${kind}` as MessageKey)}</Badge>;
  const line = (which: 'spo2Percent' | 'pao2MmHg', token: string): Line => ({
    id: which, label: which, colorToken: token, dashed: false,
    points: run.samples.map((sample) => [sample.minutes * 60, sample[which]] as const),
  });
  return (
    <>
      <p>{t('sandbox.physiology-intro', { minutes: PREOXYGENATION_MINUTES })}</p>
      {problem && <p role="alert">{t('sandbox.link-problem', { problem })}</p>}
      <Panel title={t('sandbox.physiology-inputs')}>
        <p className="field__label">{t('sandbox.profile')} {basis(PROFILE_BASIS[state.profile])}</p>
        <SegmentedControl label={t('sandbox.profile')} value={state.profile} onChange={(profile) => update({ ...state, profile })}
          options={PROFILE_IDS.map((id) => ({ value: id, label: t(`sandbox.profile-${id}` as MessageKey) }))} />
        <p className="field__label">{t('sandbox.fio2')} {basis(FIO2_BASIS)}</p>
        <SegmentedControl label={t('sandbox.fio2')} value={state.fio2} onChange={(fio2) => update({ ...state, fio2 })}
          options={PREOXYGENATION_FIO2.map((fio2) => ({ value: fio2, label: `${Math.round(fio2 * 100)}%` }))} />
        <p className="field__label">{t('sandbox.pattern')} {basis(PATTERN_BASIS[state.pattern])}</p>
        <SegmentedControl label={t('sandbox.pattern')} value={state.pattern} onChange={(pattern) => update({ ...state, pattern })}
          options={BREATHING_PATTERNS.map((pattern) => ({ value: pattern, label: t(`sandbox.pattern-${pattern}` as MessageKey) }))} />
        <p className="field__label">{t('sandbox.minutes')}</p>
        <SegmentedControl label={t('sandbox.minutes')} value={state.minutes} onChange={(minutes) => update({ ...state, minutes })}
          options={PHYSIOLOGY_MINUTES.map((minutes) => ({ value: minutes, label: t('sandbox.minutes-option', { minutes }) }))} />
      </Panel>
      <section aria-labelledby="sandbox-spo2">
        <h2 id="sandbox-spo2">{t('sandbox.spo2')}</h2>
        <SandboxPlot lines={[line('spo2Percent', '--spo2')]} xMax={state.minutes * 60} yMax={100}
          label={t('sandbox.plot-label-one', { what: t('sandbox.spo2'), minutes: state.minutes })} />
      </section>
      <section aria-labelledby="sandbox-pao2">
        <h2 id="sandbox-pao2">{t('sandbox.pao2')}</h2>
        <SandboxPlot lines={[line('pao2MmHg', '--arterial')]} xMax={state.minutes * 60}
          yMax={Math.max(...run.samples.map((sample) => sample.pao2MmHg), 1) * 1.1}
          label={t('sandbox.plot-label-one', { what: t('sandbox.pao2'), minutes: state.minutes })} />
      </section>
      <p role="status">
        {run.minutesTo90 === null
          ? t('sandbox.no-desaturation', { minutes: state.minutes })
          : t('sandbox.to-90', { minutes: run.minutesTo90.toFixed(1) })}
        {' '}{t(run.stoppedAt === null ? 'sandbox.end-values' : 'sandbox.stopped', {
          spo2: run.samples.at(-1)!.spo2Percent.toFixed(1), pao2: Math.round(run.samples.at(-1)!.pao2MmHg),
          paco2: Math.round(run.samples.at(-1)!.paco2MmHg),
          minutes: run.stoppedAt === null ? state.minutes : run.stoppedAt.toFixed(1), floor: STOP_BELOW_SATURATION })}
      </p>
      <p className="field__hint">{t('sandbox.physiology-source')}</p>
      <p>{t('sandbox.physiology-suggest')} <a href="/anesthesia/scenario/rapid-desaturation">{t('sandbox.physiology-case')}</a></p>
    </>
  );
}

const CIRCULATION_DEFAULT: CirculationState = {
  scenarioId: 'routine-induction', vasodilation: 0, bloodLossPercent: 20, vasopressor: 0, minutes: 5,
};

function CirculationSandbox() {
  const [{ state, problem }, setView] = useState(() => {
    const parsed = parseCirculationQuery(SCENARIOS, typeof location === 'undefined' ? '' : location.search);
    return 'state' in parsed ? { state: parsed.state, problem: null } : { state: CIRCULATION_DEFAULT, problem: parsed.problem };
  });
  const run = useMemo(() => runCirculation(SCENARIOS, state), [state]);
  const update = (next: CirculationState) => {
    setView({ state: next, problem: null });
    if (typeof history !== 'undefined') history.replaceState(null, '', `${location.pathname}?${circulationQuery(next)}`);
  };
  const label = (input: CirculationInput) => run.teaching[input] === undefined ? null
    : <Badge kind={run.teaching[input] ? 'teaching' : 'default'}>{t(run.teaching[input] ? 'sandbox.term-teaching' : 'sandbox.term-engine')}</Badge>;
  const levels = (values: readonly number[]) => values.map((value) => ({ value, label: `${Math.round(value * 100)}%` }));
  const first = run.samples[0]!;
  const last = run.samples.at(-1)!;
  const trace = (which: 'meanArterialMmHg' | 'heartRateBpm', token: string): Line => ({
    id: which, label: which, colorToken: token, dashed: false,
    points: run.samples.map((sample) => [sample.minutes * 60, sample[which]] as const),
  });
  // A circulation changes by tens of percent, not from zero; an axis from zero would flatten it.
  const yMax = (which: 'meanArterialMmHg' | 'heartRateBpm') => Math.max(...run.samples.map((sample) => sample[which])) * 1.1;
  const yMin = (which: 'meanArterialMmHg' | 'heartRateBpm') => Math.min(...run.samples.map((sample) => sample[which])) * 0.9;
  return (
    <>
      <p>{t('sandbox.circulation-intro')}</p>
      {problem && <p role="alert">{t('sandbox.link-problem', { problem })}</p>}
      <Panel title={t('sandbox.physiology-inputs')}>
        <Select label={t('sandbox.lesson-patient')} value={state.scenarioId}
          onChange={(event) => update({ ...state, scenarioId: event.target.value })}
          options={SCENARIOS.map((scenario) => ({ value: scenario.metadata.id, label: scenario.metadata.title }))} />
        <p className="field__label">{t('sandbox.vasodilation')} {label('vasodilation')}</p>
        <SegmentedControl label={t('sandbox.vasodilation')} value={state.vasodilation}
          onChange={(vasodilation) => update({ ...state, vasodilation })} options={levels(VASODILATION_LEVELS)} />
        <p className="field__label">{t('sandbox.blood-loss')} {label('blood-loss')}</p>
        <SegmentedControl label={t('sandbox.blood-loss')} value={state.bloodLossPercent}
          onChange={(bloodLossPercent) => update({ ...state, bloodLossPercent })}
          options={BLOOD_LOSS_PERCENT.map((value) => ({ value, label: `${value}%` }))} />
        <p className="field__label">{t('sandbox.vasopressor')} {label('vasopressor')}</p>
        <SegmentedControl label={t('sandbox.vasopressor')} value={state.vasopressor}
          onChange={(vasopressor) => update({ ...state, vasopressor })} options={levels(VASOPRESSOR_LEVELS)} />
        <p className="field__label">{t('sandbox.minutes')}</p>
        <SegmentedControl label={t('sandbox.minutes')} value={state.minutes} onChange={(minutes) => update({ ...state, minutes })}
          options={CIRCULATION_MINUTES.map((minutes) => ({ value: minutes, label: t('sandbox.minutes-option', { minutes }) }))} />
      </Panel>
      <section aria-labelledby="sandbox-map">
        <h2 id="sandbox-map">{t('sandbox.map')}</h2>
        <SandboxPlot lines={[trace('meanArterialMmHg', '--arterial')]} xMax={state.minutes * 60} yMax={yMax('meanArterialMmHg')} yMin={yMin('meanArterialMmHg')}
          label={t('sandbox.plot-label-one', { what: t('sandbox.map'), minutes: state.minutes })} />
      </section>
      <section aria-labelledby="sandbox-hr">
        <h2 id="sandbox-hr">{t('sandbox.hr')}</h2>
        <SandboxPlot lines={[trace('heartRateBpm', '--ecg')]} xMax={state.minutes * 60} yMax={yMax('heartRateBpm')} yMin={yMin('heartRateBpm')}
          label={t('sandbox.plot-label-one', { what: t('sandbox.hr'), minutes: state.minutes })} />
      </section>
      <p role="status">{t('sandbox.circulation-values', {
        minutes: state.minutes,
        map0: Math.round(first.meanArterialMmHg), map1: Math.round(last.meanArterialMmHg),
        hr0: Math.round(first.heartRateBpm), hr1: Math.round(last.heartRateBpm),
        sv0: Math.round(first.strokeVolumeMl), sv1: Math.round(last.strokeVolumeMl),
        co0: first.cardiacOutputLPerMin.toFixed(1), co1: last.cardiacOutputLPerMin.toFixed(1),
      })}</p>
      <p className="field__hint">{t('sandbox.axis-note')} {t('sandbox.circulation-source')}</p>
      <p>{t('sandbox.physiology-suggest')} <a href="/anesthesia/scenario/hypotension-after-induction">{t('sandbox.circulation-case')}</a></p>
    </>
  );
}

export function SandboxRoute() {
  const view = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('view');
  const physiology = view === 'physiology';
  const circulation = view === 'circulation';
  return (
    <div className="document">
      <SiteBar />
      <main className="reading" id="main">
        <h1>{t('sandbox.heading')}</h1>
        <p className="field__hint">{t('sandbox.boundary')}</p>
        <nav aria-label={t('sandbox.views')}>
          <a href="/anesthesia/sandbox" aria-current={physiology || circulation ? undefined : 'page'}>{t('sandbox.view-pharmacology')}</a>
          {' · '}
          <a href={`/anesthesia/sandbox?${physiologyQuery(PHYSIOLOGY_DEFAULT)}`} aria-current={physiology ? 'page' : undefined}>
            {t('sandbox.view-physiology')}
          </a>
          {' · '}
          <a href={`/anesthesia/sandbox?${circulationQuery(CIRCULATION_DEFAULT)}`} aria-current={circulation ? 'page' : undefined}>
            {t('sandbox.view-circulation')}
          </a>
        </nav>
        {physiology ? <PhysiologySandbox /> : circulation ? <CirculationSandbox /> : <PharmacologySandbox />}
        <ExplainerLink view={physiology ? 'physiology' : circulation ? 'circulation' : 'pharmacology'} />
      </main>
    </div>
  );
}
