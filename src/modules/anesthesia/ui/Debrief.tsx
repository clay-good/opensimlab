/**
 * The debrief screen, structured on PEARLS.
 *
 * The learner's own account comes first and the system's analysis is not shown
 * until they have moved past the reactions phase, because self-assessment before
 * directive feedback is the framework's core sequence.
 */

import { useMemo, useState } from 'react';
import { Badge, Button, CitationLink, Panel } from '@platform/ui';
import { Timeline } from '@platform/ui';
import { formatElapsed, TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { Attribution, EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import type { Scenario } from '@anesthesia/engine';
import {
  PEARLS_CITATION, PEARLS_DIVISION_OF_LABOUR, PEARLS_PHASES,
  accountIdentifies, findEpisodes, findStacking, safeContainerOpening, secondsBeyond,
  shiftEarlier, toneFor, type Episode, type ObjectiveFinding, type PearlsPhase,
} from '@anesthesia/debrief/analysis';
import { evaluateCounterfactual, type ReplayOptions } from '@anesthesia/debrief/replay';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { getFluid, MAX_FLUID_BOLUS_ML } from '@anesthesia/content/fluids';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';

export interface DebriefProps {
  readonly scenario: Scenario;
  readonly history: readonly HistorySample[];
  readonly log: readonly EngineEvent[];
  readonly actions: readonly LearnerAction[];
  readonly attributionByTick: (tick: number) => readonly Attribution[];
  readonly timeToPeakSeconds: Readonly<Record<string, number>>;
  readonly replayOptions: ReplayOptions;
  readonly preoxygenationSeconds: number;
  readonly onOpenExplainer: (id: string) => void;
  readonly onExportTranscript: () => void;
  readonly onReplayScenario: () => void;
}

export function Debrief(props: DebriefProps) {
  const [phase, setPhase] = useState<PearlsPhase>('reactions');
  const [account, setAccount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const episodes = useMemo(() => [
    ...findEpisodes(props.history, {
      parameter: 'meanArterialMmHg', threshold: 55, direction: 'below',
      minimumSeconds: 120, label: 'Mean arterial pressure below 55 mmHg',
    }, props.attributionByTick, props.actions),
    ...findEpisodes(props.history, {
      parameter: 'spo2Percent', threshold: 90, direction: 'below',
      minimumSeconds: 10, label: 'Oxygen saturation below 90%',
    }, props.attributionByTick, props.actions),
  ], [props.history, props.actions, props.attributionByTick]);

  const stacking = useMemo(
    () => findStacking(props.actions, props.history, props.timeToPeakSeconds),
    [props.actions, props.history, props.timeToPeakSeconds],
  );

  const findings = useMemo(
    () => objectiveFindings(
      props.scenario, props.history, stacking.length, props.preoxygenationSeconds, props.actions,
      props.log,
    ),
    [props.scenario, props.history, stacking.length, props.preoxygenationSeconds, props.actions, props.log],
  );

  const counterfactuals = useMemo(() => {
    if (phase !== 'analysis') return [];
    const out = [];
    const ventilated = props.actions.find((a) => a.type === 'ventilator' && a.payload.delivering === true);
    if (ventilated && secondsBeyond(props.history, 'spo2Percent', 90, 'below') > 0) {
      out.push(evaluateCounterfactual({
        id: 'ventilate-earlier',
        claim: 'Starting ventilation sixty seconds earlier would have shortened the desaturation.',
        modify: (actions) => shiftEarlier(actions, (a) => a.type === 'ventilator' && a.payload.delivering === true, 60),
        measure: (history) => secondsBeyond(history, 'spo2Percent', 90, 'below'),
        unit: 'seconds below 90%',
      }, props.history, props.actions, props.replayOptions));
    }
    return out;
  }, [phase, props.actions, props.history, props.replayOptions]);

  const keyIssue = episodes[0]?.label.toLowerCase() ?? 'how the induction went';
  const identified = accountIdentifies(account, [
    'vasodilat', 'pressure', 'saturation', 'desaturat', 'apno', 'apne', 'stack', 'wait',
  ]);
  const tone = toneFor(identified, keyIssue);

  const marks = props.log
    .filter((entry) => entry.severity !== 'info')
    .map((entry) => ({ tick: entry.tick, severity: entry.severity, label: entry.message }));
  const totalTicks = props.history[props.history.length - 1]?.tick ?? 1;

  return (
    <main className="reading" id="main">
      <h1>Debrief</h1>
      <nav className="phase-nav" aria-label="Debrief phases">
        {PEARLS_PHASES.map((entry, index) => (
          <Button
            key={entry.id}
            variant={entry.id === phase ? 'primary' : 'secondary'}
            // The analysis is not reachable until the learner has given their account.
            disabled={index > 0 && !submitted}
            onClick={() => setPhase(entry.id)}
            aria-pressed={entry.id === phase}
          >
            {index + 1}. {entry.title}
          </Button>
        ))}
      </nav>

      {phase === 'reactions' && (
        <section>
          <p>{safeContainerOpening({
            procedure: props.scenario.patient.procedure,
            hardestThing: hardestThing(episodes),
            patientHarmed: episodes.length > 0,
            patientDied: false,
          })}</p>
          <label className="field__label" htmlFor="reactions-account">Your account</label>
          <textarea
            id="reactions-account"
            className="field__input"
            style={{ minBlockSize: '8rem', paddingBlock: 'var(--space-2)' }}
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder="What stood out? What were you trying to do?"
          />
          <p className="field__hint">
            This stays on this device and is used only for this debrief. It is not scored.
          </p>
          <Button variant="primary" onClick={() => { setSubmitted(true); setPhase('description'); }}>
            {account.trim().length > 0 ? 'Continue' : 'Skip and continue'}
          </Button>
        </section>
      )}

      {phase === 'description' && (
        <section>
          <h2>What happened</h2>
          <Timeline marks={marks} totalTicks={totalTicks} />
          <ol>
            {describedEvents(props.log).map((entry) => (
              <li key={`${entry.tick}-${entry.eventId}`}>
                <span className="numeric">{formatElapsed(entry.tick)}</span> — {entry.message}
              </li>
            ))}
          </ol>
          <Button variant="primary" onClick={() => setPhase('analysis')}>Continue to the analysis</Button>
        </section>
      )}

      {phase === 'analysis' && (
        <section>
          <h2>Why the patient did that</h2>
          <p>{tone.opening}</p>
          {tone.mode === 'confirm-and-extend' && (
            <p className="reading__aside">
              This reads as a keyword match against what you wrote, which is a crude instrument.
              A human facilitator would judge your reasoning, not your wording.
            </p>
          )}

          {episodes.length === 0 ? (
            <p>Nothing crossed a threshold for long enough to count as an episode. That is a good outcome.</p>
          ) : episodes.map((episode) => (
            <Panel key={episode.id} title={episode.label}>
              <p>
                It lasted {episode.durationSeconds.toFixed(0)} seconds, from{' '}
                {formatElapsed(episode.startTick)}, reaching {episode.extreme.toFixed(0)}.
              </p>
              <p className="field__hint">Preceded by: {episode.precededBy}</p>
              <h3>Ranked contributors</h3>
              <ul>
                {episode.contributors.map((contributor) => (
                  <li key={contributor.label}>
                    {contributor.label} — {(contributor.share * 100).toFixed(0)}%
                    {contributor.teachingModel && <> <Badge kind="teaching">Teaching model</Badge></>}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}

          {stacking.length > 0 && (
            <Panel title="Dose stacking">
              <ul>
                {stacking.map((finding) => (
                  <li key={finding.tick}>
                    A {finding.drugId} bolus at {formatElapsed(finding.tick)} came{' '}
                    {finding.secondsSincePrevious.toFixed(0)} s after the previous one, while the
                    effect site was still climbing toward its peak at{' '}
                    {finding.timeToPeakSeconds.toFixed(0)} s.
                  </li>
                ))}
              </ul>
              <Button variant="ghost" onClick={() => props.onOpenExplainer('hysteresis-and-effect-site-lag')}>
                Read: hysteresis and effect-site lag
              </Button>
            </Panel>
          )}

          {counterfactuals.length > 0 && (
            <Panel title="What the alternative would have produced">
              {counterfactuals.map((result) => (
                <div key={result.id}>
                  <p>{result.claim}</p>
                  <p className="numeric">
                    Your run: {result.actual.toFixed(0)} {result.unit}. The alternative:{' '}
                    {result.counterfactual.toFixed(0)} {result.unit}.
                  </p>
                  <p className="reading__aside">
                    Computed by re-running the engine on your action list with that one change,
                    not asserted from a rule. The modified run is reproducible from the same seed.
                  </p>
                </div>
              ))}
            </Panel>
          )}

          <Button variant="primary" onClick={() => setPhase('summary')}>Continue</Button>
        </section>
      )}

      {phase === 'summary' && (
        <section>
          <h2>Objectives</h2>
          <ul>
            {findings.map((finding) => (
              <li key={finding.objectiveId}>
                <strong>{outcomeWord(finding.outcome)}</strong> — {finding.statement}
                <br />
                <span className="field__hint">{finding.finding}</span>
                {finding.concept && (
                  <>
                    <br />
                    <Button variant="ghost" compact onClick={() => props.onOpenExplainer(finding.concept!)}>
                      {EXPLAINERS.find((e) => e.id === finding.concept)?.title ?? 'Read more'}
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <p className="reading__aside">
            There is no overall score, no pass or fail, and no comparison with anyone else. Nothing
            about this session has left the device, so there is nothing to compare it against.
          </p>

          <h2>Where this goes next</h2>
          <div className="phase-nav">
            <Button onClick={props.onReplayScenario}>Run it again and compare with this attempt</Button>
            <Button onClick={props.onExportTranscript}>Export the transcript</Button>
          </div>

          <h3>About this debrief</h3>
          <p className="reading__aside">{PEARLS_CITATION}</p>
          <details>
            <summary>What is automated, and what still needs a person</summary>
            <p className="field__label">Automated</p>
            <ul>{PEARLS_DIVISION_OF_LABOUR.automated.map((item) => <li key={item}>{item}</li>)}</ul>
            <p className="field__label">Requires a human facilitator</p>
            <ul>{PEARLS_DIVISION_OF_LABOUR.requiresHuman.map((item) => <li key={item}>{item}</li>)}</ul>
          </details>
          <CitationLink href="https://pubmed.ncbi.nlm.nih.gov/25710312/">PEARLS on PubMed</CitationLink>
          <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
        </section>
      )}
    </main>
  );
}

function hardestThing(episodes: readonly Episode[]): string {
  if (episodes.length === 0) return 'keeping a normal patient normal, which is harder than it looks';
  return episodes[0]!.label.toLowerCase();
}

function outcomeWord(outcome: ObjectiveFinding['outcome']): string {
  return outcome === 'met' ? 'Met'
    : outcome === 'partly-met' ? 'Partly met'
      : outcome === 'not-met' ? 'Not met'
        : 'Not exercised';
}

/**
 * Evaluate each objective against the measure the scenario declared for it.
 * Specific and actionable, never a score.
 */
export function objectiveFindings(
  scenario: Scenario,
  history: readonly HistorySample[],
  stackingCount: number,
  preoxygenationSeconds: number,
  actions: readonly LearnerAction[] = [],
  log: readonly EngineEvent[] = [],
): ObjectiveFinding[] {
  const concepts: Record<string, string> = {
    preoxygenate: 'preoxygenation-and-safe-apnea-time',
    hysteresis: 'hysteresis-and-effect-site-lag',
    'manage-hypotension': 'vasodilation-versus-hypovolemia',
    'ventilate-before-desaturation': 'preoxygenation-and-safe-apnea-time',
    'blunt-incision': 'hypnotic-opioid-synergy',
    'recognize-hemorrhage': 'vasodilation-versus-hypovolemia',
    'temporize-volume-loss': 'vasodilation-versus-hypovolemia',
    'avoid-full-dose-induction': 'hysteresis-and-effect-site-lag',
    'read-the-mechanism': 'vasodilation-versus-hypovolemia',
    'preoxygenate-before-induction': 'preoxygenation-and-safe-apnea-time',
    'wait-for-intubating-block': 'train-of-four-and-residual-blockade',
    'protect-the-apnea-margin': 'preoxygenation-and-safe-apnea-time',
    'secure-and-confirm': 'capnogram-morphology',
    'hypnosis-before-paralysis': 'train-of-four-and-residual-blockade',
    'inspect-the-tiva-line': 'depth-monitoring-and-its-limits',
    'restore-hypnotic-delivery': 'hysteresis-and-effect-site-lag',
    'recognize-paralysis-risk': 'depth-monitoring-and-its-limits',
    'preoxygenate-before-laryngospasm': 'preoxygenation-and-safe-apnea-time',
    'apply-initial-laryngospasm-measures': 'capnogram-morphology',
    'deepen-during-laryngospasm': 'vasodilation-versus-hypovolemia',
    'protect-oxygenation-during-laryngospasm': 'preoxygenation-and-safe-apnea-time',
    'recognize-anaphylaxis-pattern': 'vasodilation-versus-hypovolemia',
    'give-initial-epinephrine': 'vasodilation-versus-hypovolemia',
    'support-anaphylaxis-circulation': 'vasodilation-versus-hypovolemia',
    'support-anaphylaxis-oxygenation': 'capnogram-morphology',
    'recognize-mh-hypermetabolism': 'malignant-hyperthermia-early-pattern',
    'stop-trigger-and-hyperventilate': 'malignant-hyperthermia-early-pattern',
    'give-initial-dantrolene': 'malignant-hyperthermia-early-pattern',
    'reassess-mh-response': 'malignant-hyperthermia-early-pattern',
    'preoxygenate-child': 'preoxygenation-and-safe-apnea-time',
    'dose-pediatric-propofol': 'hysteresis-and-effect-site-lag',
    'ventilate-child-by-weight': 'capnogram-morphology',
    'avoid-pediatric-desaturation': 'preoxygenation-and-safe-apnea-time',
    'prepare-rescue-oxygen-reserve': 'preoxygenation-and-safe-apnea-time',
    'limit-attempts-and-call-for-help': 'airway-assessment-predicts-poorly',
    'place-supraglottic-rescue': 'airway-assessment-predicts-poorly',
    'confirm-rescue-gas-exchange': 'capnogram-morphology',
    'recognize-last-pattern': 'vasodilation-versus-hypovolemia',
    'support-last-airway-and-seizure': 'capnogram-morphology',
    'start-last-lipid': 'vasodilation-versus-hypovolemia',
    'use-reduced-last-epinephrine': 'vasodilation-versus-hypovolemia',
  };

  return scenario.metadata.objectives.map((objective) => {
    const base = { objectiveId: objective.id, statement: objective.statement, concept: concepts[objective.id] };

    if ([
      'resume-arrest-compressions', 'give-arrest-epinephrine',
      'defibrillate-persistent-vf', 'avoid-shocking-nonshockable-rhythm',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find((event) => event.type === 'rhythm-change'
        && event.target === 'ventricular-fibrillation')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the scripted ventricular-fibrillation arrest.',
        } satisfies ObjectiveFinding;
      }
      const compressionStarts = log.filter((entry) => entry.eventId.startsWith('chest-compressions-start-'));
      const compressionStops = log.filter((entry) => entry.eventId.startsWith('chest-compressions-stop-'));
      const epinephrine = log.find((entry) => entry.eventId.startsWith('cardiac-arrest-epinephrine-'));
      const shocks = log.filter((entry) => entry.eventId.startsWith('defibrillation-'));
      const rosc = log.find((entry) => entry.eventId.startsWith('rosc-'));

      if (objective.id === 'resume-arrest-compressions') {
        const first = compressionStarts.find((entry) => entry.tick >= onset);
        const delay = first ? (first.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 20 ? 'met' : delay <= 40 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'No accepted chest-compression start followed the pulseless VF event.'
            : `Fixed-rate modeled compressions were accepted ${delay.toFixed(0)} seconds after VF appeared. This records screen intent, not physical CPR quality.`,
          atTick: first?.tick,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'give-arrest-epinephrine') {
        const activeAtDose = epinephrine !== undefined
          && compressionStarts.some((start) => start.tick <= epinephrine.tick
            && !compressionStops.some((stop) => stop.tick >= start.tick && stop.tick <= epinephrine.tick));
        const exact = epinephrine?.data?.doseMg === 1
          && (epinephrine.data.route === 'iv' || epinephrine.data.route === 'io');
        return {
          ...base,
          outcome: exact && activeAtDose ? 'met' : epinephrine ? 'partly-met' : 'not-met',
          finding: epinephrine
            ? `${Number(epinephrine.data?.doseMg ?? 0).toFixed(0)} mg ${String(epinephrine.data?.route ?? '').toUpperCase()} epinephrine was accepted ${activeAtDose ? 'while modeled compressions were active' : 'without active modeled compressions'}.`
            : 'No accepted cardiac-arrest epinephrine action was recorded.',
          atTick: epinephrine?.tick,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'defibrillate-persistent-vf') {
        const converting = shocks.find((entry) => entry.data?.converted === true);
        const exact = converting?.data?.energyJ === 200 && rosc !== undefined;
        return {
          ...base,
          outcome: exact ? 'met' : shocks.length > 0 ? 'partly-met' : 'not-met',
          finding: converting
            ? `${Number(converting.data?.energyJ).toFixed(0)} J biphasic defibrillation converted the bounded teaching case to an organized rhythm. This deterministic result is not an individual prediction.`
            : shocks.length > 0
              ? `${shocks.length} accepted shock${shocks.length === 1 ? '' : 's'} did not meet the declared conversion conditions.`
              : 'No accepted defibrillation was recorded after VF appeared.',
          atTick: converting?.tick ?? shocks.at(-1)?.tick,
        } satisfies ObjectiveFinding;
      }

      const nonShockable = shocks.filter((entry) =>
        entry.data?.rhythmBefore === 'asystole' || entry.data?.rhythmBefore === 'pea');
      return {
        ...base,
        outcome: nonShockable.length === 0 ? 'met' : 'not-met',
        finding: nonShockable.length === 0
          ? 'No accepted shock was delivered to asystole or pulseless electrical activity.'
          : `${nonShockable.length} accepted shock${nonShockable.length === 1 ? ' was' : 's were'} delivered to a non-shockable rhythm and did not convert it.`,
        atTick: nonShockable[0]?.tick,
      } satisfies ObjectiveFinding;
    }

    if ([
      'recognize-last-pattern', 'support-last-airway-and-seizure',
      'start-last-lipid', 'use-reduced-last-epinephrine',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find((event) => event.type === 'local-anesthetic-toxicity')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the modeled local-anesthetic exposure.',
        } satisfies ObjectiveFinding;
      }
      const windowEnd = onset + 60 * TICKS_PER_SECOND;
      const seizureTreatment = log.find((entry) => entry.eventId.startsWith('seizure-suppression-'));
      const lipid = log.find((entry) => entry.eventId.startsWith('lipid-emulsion-'));
      const epinephrine = log.find((entry) => entry.eventId.startsWith('epinephrine-iv-'));

      if (objective.id === 'recognize-last-pattern') {
        const first = [seizureTreatment, lipid, epinephrine]
          .filter((entry): entry is EngineEvent => entry !== undefined)
          .sort((a, b) => a.tick - b.tick)[0];
        const delay = first ? (first.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 60 ? 'met' : 'partly-met',
          finding: delay === null
            ? 'No accepted initial-response action followed the modeled exposure.'
            : `The first accepted response was recorded ${delay.toFixed(0)} seconds after exposure. This timing is a behavioral proxy; the scripted pattern and response do not prove a diagnosis.`,
          atTick: first?.tick,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'support-last-airway-and-seizure') {
        const settings = actions.filter((action) => action.type === 'ventilator' && action.tick <= windowEnd)
          .reduce((current, action) => ({
            fio2: action.payload.fio2 === undefined || !Number.isFinite(Number(action.payload.fio2))
              ? current.fio2 : Math.min(1, Math.max(0.21, Number(action.payload.fio2))),
            delivering: typeof action.payload.delivering === 'boolean'
              ? action.payload.delivering : current.delivering,
            tidalVolumeMl: action.payload.tidalVolumeMl === undefined
              || !Number.isFinite(Number(action.payload.tidalVolumeMl))
              ? current.tidalVolumeMl
              : Math.min(1500, Math.max(0, Number(action.payload.tidalVolumeMl))),
            respiratoryRateBpm: action.payload.respiratoryRateBpm === undefined
              || !Number.isFinite(Number(action.payload.respiratoryRateBpm))
              ? current.respiratoryRateBpm
              : Math.min(60, Math.max(0, Number(action.payload.respiratoryRateBpm))),
          }), {
            fio2: scenario.equipment.ventilator.fio2,
            delivering: scenario.equipment.ventilator.delivering,
            tidalVolumeMl: scenario.equipment.ventilator.tidalVolumeMl,
            respiratoryRateBpm: scenario.equipment.ventilator.respiratoryRateBpm,
          });
        const oxygen = settings.fio2 >= 0.95 && settings.delivering
          && settings.tidalVolumeMl > 0 && settings.respiratoryRateBpm > 0;
        const seizurePrompt = seizureTreatment !== undefined && seizureTreatment.tick <= windowEnd;
        return {
          ...base,
          outcome: oxygen && seizurePrompt ? 'met' : oxygen || seizurePrompt ? 'partly-met' : 'not-met',
          finding: `${oxygen ? 'At least 95% inspired oxygen with active breath delivery was in effect by 60 seconds.' : 'High inspired oxygen and active breath delivery were not both in effect by 60 seconds.'} ${seizurePrompt ? 'An IV benzodiazepine seizure-suppression action was accepted within 60 seconds.' : 'No IV benzodiazepine action was accepted within 60 seconds.'} This does not assess physical airway skill or drug dosing.`,
          atTick: seizureTreatment?.tick ?? windowEnd,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'start-last-lipid') {
        const prompt = lipid !== undefined && lipid.tick <= windowEnd;
        const exact = lipid?.data?.concentrationPercent === 20
          && lipid.data.initialBolusMl === 90 && lipid.data.infusionMlPerMin === 15;
        return {
          ...base,
          outcome: prompt && exact ? 'met' : lipid ? 'partly-met' : 'not-met',
          finding: lipid
            ? `The accepted 20% lipid action calculated ${Number(lipid.data?.initialBolusMl ?? 0).toFixed(0)} mL initial bolus and ${Number(lipid.data?.infusionMlPerMin ?? 0).toFixed(1)} mL/min infusion ${((lipid.tick - onset) / TICKS_PER_SECOND).toFixed(0)} seconds after exposure. The response is a bounded teaching model, not a guarantee of recovery.`
            : 'No initial 20% lipid-emulsion protocol was accepted after exposure.',
          atTick: lipid?.tick,
        } satisfies ObjectiveFinding;
      }

      if (!epinephrine) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'No accepted epinephrine action was recorded. The ASRA checklist does not require epinephrine when circulation is stable.',
        } satisfies ObjectiveFinding;
      }
      const dose = Number(epinephrine.data?.doseMicrograms ?? Infinity);
      const perKg = dose / scenario.patient.weightKg;
      return {
        ...base,
        outcome: perKg <= 1 ? 'met' : 'not-met',
        finding: `The first accepted epinephrine bolus was ${dose.toFixed(0)} micrograms IV (${perKg.toFixed(2)} micrograms/kg). The bounded LAST action refuses doses above 1 microgram/kg.`,
        atTick: epinephrine.tick,
      } satisfies ObjectiveFinding;
    }

    if ([
      'prepare-rescue-oxygen-reserve', 'limit-attempts-and-call-for-help',
      'place-supraglottic-rescue', 'confirm-rescue-gas-exchange',
    ].includes(objective.id)) {
      const acceptedPropofol = log.find((entry) => entry.eventId.startsWith('bolus-propofol-'));
      const inductionTick = acceptedPropofol?.tick ?? actions.find((action) =>
        action.type === 'bolus'
        && action.payload.drugId === 'propofol'
        && (action.payload.unit === 'mg' || action.payload.unit === 'mg/kg')
        && Number.isFinite(Number(action.payload.amount))
        && Number(action.payload.amount) > 0)?.tick;
      const laryngoscopyStarts = log.filter((entry) =>
        entry.eventId.startsWith('laryngoscopy-start-'));
      const failedAttempt = log.find((entry) =>
        /^laryngoscopy-\d+$/.test(entry.eventId) && entry.data?.intubated === false);
      const acceptedAttempts = log.filter((entry) => /^laryngoscopy-\d+$/.test(entry.eventId));
      const help = log.find((entry) => entry.eventId.startsWith('airway-help-requested-'));
      const sgaStart = log.find((entry) => entry.eventId.startsWith('sga-insertion-start-'));
      const sgaComplete = log.find((entry) => entry.eventId.startsWith('sga-insertion-complete-'));

      if (objective.id === 'prepare-rescue-oxygen-reserve') {
        if (inductionTick === undefined) {
          return {
            ...base, outcome: 'not-exercised',
            finding: 'No accepted positive propofol induction dose was recorded.',
          } satisfies ObjectiveFinding;
        }
        const sample = history.filter((entry) => entry.tick <= inductionTick).at(-1);
        const endTidal = sample?.state.endTidalO2Fraction ?? 0;
        return {
          ...base,
          outcome: endTidal >= 0.9 ? 'met' : endTidal >= 0.8 ? 'partly-met' : 'not-met',
          finding: `End-tidal oxygen fraction was ${endTidal.toFixed(2)} at the first accepted propofol dose. This is the modeled oxygen-reserve endpoint, not proof that every difficult-airway preparation step was complete.`,
          atTick: inductionTick,
        } satisfies ObjectiveFinding;
      }

      if (!failedAttempt) {
        return {
          ...base, outcome: 'not-exercised',
          finding: laryngoscopyStarts.length > 0
            ? 'The session ended before a configured failed tracheal attempt completed.'
            : 'No completed failed tracheal attempt was recorded.',
        } satisfies ObjectiveFinding;
      }
      const extraAttemptsBeforeRescue = acceptedAttempts.filter((entry) =>
        entry.tick > failedAttempt.tick && entry.tick <= (sgaComplete?.tick ?? Infinity));
      const attemptsBeforeRescue = acceptedAttempts.filter((entry) =>
        entry.tick <= (sgaComplete?.tick ?? Infinity));

      if (objective.id === 'limit-attempts-and-call-for-help') {
        const helpDelay = help ? (help.tick - failedAttempt.tick) / TICKS_PER_SECOND : null;
        const helpWasEarly = help !== undefined
          && help.tick >= (laryngoscopyStarts[0]?.tick ?? failedAttempt.tick)
          && helpDelay! <= 30;
        const attemptsLimited = extraAttemptsBeforeRescue.length === 0;
        return {
          ...base,
          outcome: helpWasEarly && attemptsLimited ? 'met'
            : helpWasEarly || attemptsLimited ? 'partly-met' : 'not-met',
          finding: `${attemptsBeforeRescue.length} completed tracheal attempt${attemptsBeforeRescue.length === 1 ? ' was' : 's were'} recorded before rescue. ${help ? `Airway help was requested ${helpDelay! < 0 ? `${Math.abs(helpDelay!).toFixed(0)} seconds before` : `${helpDelay!.toFixed(0)} seconds after`} the failed attempt completed.` : 'No accepted airway-help request was recorded.'} The request records escalation only; team arrival and performance are not modeled.`,
          atTick: help?.tick ?? failedAttempt.tick,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'place-supraglottic-rescue') {
        if (!sgaComplete || !sgaStart || sgaStart.tick < failedAttempt.tick) {
          return {
            ...base, outcome: 'not-met', atTick: failedAttempt.tick,
            finding: 'No accepted supraglottic-airway placement was completed after failed intubation.',
          } satisfies ObjectiveFinding;
        }
        return {
          ...base,
          outcome: extraAttemptsBeforeRescue.length === 0 ? 'met' : 'partly-met',
          finding: `A supraglottic airway was placed ${((sgaComplete.tick - failedAttempt.tick) / TICKS_PER_SECOND).toFixed(0)} seconds after failed intubation${extraAttemptsBeforeRescue.length === 0 ? ' without another completed tracheal attempt' : ` after ${extraAttemptsBeforeRescue.length} additional completed tracheal attempt${extraAttemptsBeforeRescue.length === 1 ? '' : 's'}`}. This records a modeled oxygenation route, not tracheal intubation or physical placement skill.`,
          atTick: sgaComplete.tick,
        } satisfies ObjectiveFinding;
      }

      if (!sgaComplete) {
        return {
          ...base, outcome: 'not-met', atTick: failedAttempt.tick,
          finding: 'No completed supraglottic-airway placement was available for gas-exchange assessment.',
        } satisfies ObjectiveFinding;
      }
      const postPlacementDelivery = actions.find((action) =>
        action.type === 'ventilator' && action.tick >= sgaComplete.tick
        && action.payload.delivering === true);
      const ventilatorActions = actions.filter((action) => action.type === 'ventilator');
      const settingsAt = (tick: number) => ventilatorActions
        .filter((action) => action.tick <= tick)
        .reduce((settings, action) => {
          const requestedFio2 = action.payload.fio2 === undefined
            ? null : Number(action.payload.fio2);
          return {
            fio2: requestedFio2 === null || !Number.isFinite(requestedFio2)
              ? settings.fio2 : Math.min(1, Math.max(0.21, requestedFio2)),
            delivering: typeof action.payload.delivering === 'boolean'
              ? action.payload.delivering : settings.delivering,
          };
        }, {
          fio2: scenario.equipment.ventilator.fio2,
          delivering: scenario.equipment.ventilator.delivering,
        });
      const afterPlacement = history.filter((entry) => entry.tick >= sgaComplete.tick);
      const sustained = afterPlacement.some((start) => {
        const end = afterPlacement.find((entry) =>
          entry.tick >= start.tick + (30 * TICKS_PER_SECOND));
        if (!end) return false;
        return history.filter((entry) => entry.tick >= start.tick && entry.tick <= end.tick)
          .every((entry) => {
            const settings = settingsAt(entry.tick);
            const etco2 = entry.state.etco2MmHg ?? 0;
            return settings.fio2 >= 0.95 && settings.delivering && etco2 >= 25 && etco2 <= 55;
          });
      });
      const lowest = afterPlacement.length > 0
        ? Math.min(...afterPlacement.map((entry) => entry.state.spo2Percent ?? 100)) : null;
      const oxygenationProtected = lowest !== null && lowest >= 92;
      return {
        ...base,
        outcome: postPlacementDelivery && sustained && oxygenationProtected ? 'met'
          : sustained || oxygenationProtected ? 'partly-met' : 'not-met',
        finding: `${postPlacementDelivery ? 'Explicit assisted ventilation was started after placement.' : 'No explicit post-placement start of assisted ventilation was recorded.'} ${sustained ? 'At least 30 seconds of high-inspired-oxygen delivery and end-tidal carbon dioxide from 25 to 55 mmHg followed.' : 'A full 30 seconds combining high inspired oxygen, active delivery, and end-tidal carbon dioxide from 25 to 55 mmHg was not recorded.'} ${lowest === null ? 'No post-placement saturation trace was available.' : `The lowest post-placement saturation was ${lowest.toFixed(0)}%.`} This confirms modeled gas exchange through a rescue device, not tracheal placement or a complete airway plan.`,
        atTick: afterPlacement.at(-1)?.tick ?? sgaComplete.tick,
      } satisfies ObjectiveFinding;
    }

    if ([
      'preoxygenate-child', 'dose-pediatric-propofol',
      'ventilate-child-by-weight', 'avoid-pediatric-desaturation',
    ].includes(objective.id)) {
      const syringeCapacityMg = (scenario.formulary.find((entry) => entry.drugId === 'propofol')
        ?.syringeVolumeMl ?? 0) * (scenario.formulary.find((entry) => entry.drugId === 'propofol')
        ?.concentration ?? 0);
      const induction = actions.find((action) => {
        if (action.type !== 'bolus' || action.payload.drugId !== 'propofol') return false;
        const amount = Number(action.payload.amount);
        const unit = String(action.payload.unit);
        if (unit !== 'mg' && unit !== 'mg/kg') return false;
        const mass = unit === 'mg/kg'
          ? amount * scenario.patient.weightKg : amount;
        return Number.isFinite(amount) && amount > 0 && mass <= syringeCapacityMg;
      });
      if (!induction) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'No accepted positive propofol induction dose was recorded.',
        } satisfies ObjectiveFinding;
      }
      if (objective.id === 'preoxygenate-child') {
        const before = history.filter((entry) => entry.tick <= induction.tick).at(-1);
        const endTidal = before?.state.endTidalO2Fraction ?? 0;
        return {
          ...base,
          outcome: endTidal >= 0.9 ? 'met' : endTidal >= 0.8 ? 'partly-met' : 'not-met',
          finding: `End-tidal oxygen fraction was ${endTidal.toFixed(2)} when the first accepted propofol dose was given. The 0.90 endpoint measures modeled lung denitrogenation; the inspired setting alone does not.`,
          atTick: induction.tick,
        } satisfies ObjectiveFinding;
      }
      if (objective.id === 'dose-pediatric-propofol') {
        const amount = Number(induction.payload.amount);
        const enteredPerKg = induction.payload.unit === 'mg/kg';
        const perKg = enteredPerKg ? amount : amount / scenario.patient.weightKg;
        return {
          ...base,
          outcome: enteredPerKg && perKg >= 2.5 && perKg <= 3.5 ? 'met'
            : perKg >= 2 && perKg <= 4 ? 'partly-met' : 'not-met',
          finding: `The first accepted propofol dose was ${perKg.toFixed(2)} mg/kg for the ${scenario.patient.weightKg.toFixed(0)} kg child${enteredPerKg ? ', entered by weight' : ', entered as an absolute dose'}. The labeled range is a starting guide to titrate against clinical response; Paedfusor supplies pediatric kinetics, not validated pediatric depth pharmacodynamics.`,
          atTick: induction.tick,
        } satisfies ObjectiveFinding;
      }
      if (objective.id === 'ventilate-child-by-weight') {
        const initial = scenario.equipment.ventilator;
        const ventilatorActions = actions
          // Settings prepared before induction remain in force afterward. Rebuild the
          // machine from every accepted-looking control change rather than requiring
          // the learner to move the same controls again after giving propofol.
          .filter((action) => action.type === 'ventilator');
        const settingsAt = (tick: number) => ventilatorActions
          .filter((action) => action.tick <= tick)
          .reduce((settings, action) => {
            const finite = (field: string, fallback: number, min: number, max: number) => {
              if (action.payload[field] === undefined) return fallback;
              const value = Number(action.payload[field]);
              return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
            };
            return {
              tidalVolumeMl: finite('tidalVolumeMl', settings.tidalVolumeMl, 0, 1500),
              respiratoryRateBpm: finite('respiratoryRateBpm', settings.respiratoryRateBpm, 0, 60),
              delivering: typeof action.payload.delivering === 'boolean'
                ? action.payload.delivering : settings.delivering,
            };
          }, {
            tidalVolumeMl: initial.tidalVolumeMl,
            respiratoryRateBpm: initial.respiratoryRateBpm,
            delivering: initial.delivering,
          });
        const finalTick = history.at(-1)?.tick ?? induction.tick;
        const machine = settingsAt(finalTick);
        const mlPerKg = machine.tidalVolumeMl / scenario.patient.weightKg;
        const gasSamples = history.filter((entry) =>
          entry.tick >= Math.max(induction.tick, finalTick - (30 * TICKS_PER_SECOND)));
        const sustainedGas = gasSamples.length > 1
          && (gasSamples.at(-1)!.tick - gasSamples[0]!.tick) >= 30 * TICKS_PER_SECOND
          && gasSamples.every((entry) => {
            const etco2 = entry.state.etco2MmHg ?? 0;
            return etco2 >= 30 && etco2 <= 50;
          });
        const sustainedSizedDelivery = sustainedGas && gasSamples.every((entry) => {
          const settings = settingsAt(entry.tick);
          const sampleMlPerKg = settings.tidalVolumeMl / scenario.patient.weightKg;
          return settings.delivering && sampleMlPerKg >= 6 && sampleMlPerKg <= 8;
        });
        const sized = mlPerKg >= 6 && mlPerKg <= 8 && machine.delivering;
        return {
          ...base,
          outcome: sustainedSizedDelivery ? 'met'
            : sized || sustainedGas ? 'partly-met' : 'not-met',
          finding: `The final accepted settings delivered ${machine.tidalVolumeMl.toFixed(0)} mL (${mlPerKg.toFixed(1)} mL/kg) at ${machine.respiratoryRateBpm.toFixed(0)}/min. ${sustainedSizedDelivery ? 'Pediatric-sized delivered breaths and end-tidal carbon dioxide between 30 and 50 mmHg overlapped for the final 30 seconds.' : 'A full final 30 seconds combining pediatric-sized delivered breaths with end-tidal carbon dioxide between 30 and 50 mmHg was not recorded.'} These are modeled gas-exchange endpoints, not a device prescription.`,
          atTick: finalTick,
        } satisfies ObjectiveFinding;
      }
      const samples = history.filter((entry) => entry.tick >= induction.tick);
      if (samples.length === 0) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'No post-induction saturation trace was available to evaluate this objective.',
          atTick: induction.tick,
        } satisfies ObjectiveFinding;
      }
      const lowest = Math.min(...samples.map((entry) => entry.state.spo2Percent ?? 100));
      return {
        ...base,
        outcome: lowest >= 92 ? 'met' : lowest >= 88 ? 'partly-met' : 'not-met',
        finding: `The lowest saturation after induction was ${lowest.toFixed(0)}%. This is one bounded 6-year-old respiratory profile, not a prediction for children of other ages or conditions.`,
        atTick: samples.at(-1)?.tick ?? induction.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'preoxygenate') {
      // Three minutes at an END-TIDAL fraction of 0.9, which is the endpoint that
      // means the reservoir is full, rather than two minutes of a delivered
      // inspired fraction, which means only that the machine was turned on.
      const met = preoxygenationSeconds >= 180;
      return {
        ...base,
        outcome: met ? 'met' : preoxygenationSeconds > 60 ? 'partly-met' : 'not-met',
        finding: `You spent ${preoxygenationSeconds.toFixed(0)} seconds at an end-tidal oxygen `
          + `fraction of 0.9 or above before securing the airway. Three minutes of tidal breathing `
          + `to that endpoint buys a healthy adult about eight minutes of apnoea; less buys `
          + `proportionally less, and a high inspired fraction that never reaches the alveoli `
          + `buys nothing at all.`,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'hysteresis') {
      return {
        ...base,
        outcome: stackingCount === 0 ? 'met' : 'not-met',
        finding: stackingCount === 0
          ? 'No dose was given while the effect site was still climbing from the previous one.'
          : `${stackingCount} dose${stackingCount === 1 ? ' was' : 's were'} given before the previous `
            + 'one had reached its peak. That is stacking, and it is why the pressure fell as far as it did.',
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'manage-hypotension') {
      // Judged against BOTH thresholds the objective names. 65 mmHg is where the
      // intraoperative hypotension outcome literature sits; 55 is where the
      // association with kidney and myocardial injury appears at durations as
      // short as a minute, so any time below it fails the objective outright.
      const belowSixtyFive = secondsBeyond(history, 'meanArterialMmHg', 65, 'below');
      const belowFiftyFive = secondsBeyond(history, 'meanArterialMmHg', 55, 'below');
      const outcome = belowFiftyFive > 0 || belowSixtyFive >= 120
        ? 'not-met'
        : belowSixtyFive > 0 ? 'partly-met' : 'met';
      const finding = belowSixtyFive === 0
        ? 'Mean arterial pressure never fell below 65 mmHg.'
        : `Mean arterial pressure spent ${belowSixtyFive.toFixed(0)} seconds below 65 mmHg`
          + (belowFiftyFive > 0
            ? `, of which ${belowFiftyFive.toFixed(0)} seconds were below 55. Exposure below 55 is `
              + 'associated with kidney and myocardial injury at durations as short as a minute.'
            : '. Most of the outcome literature on intraoperative hypotension is organised around '
              + 'this threshold rather than a lower one.');
      return { ...base, outcome, finding } satisfies ObjectiveFinding;
    }

    if (objective.id === 'recognize-hemorrhage') {
      const onset = scenario.timeline.find((event) => event.id === 'rapid-blood-loss')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return { ...base, outcome: 'not-exercised', finding: 'The session ended before rapid blood loss began.' } satisfies ObjectiveFinding;
      }
      const first = actions.find((action) => action.type === 'fluid' && action.tick >= onset);
      const delaySeconds = first ? (first.tick - onset) / TICKS_PER_SECOND : null;
      const outcome = delaySeconds === null ? 'not-met' : delaySeconds <= 60 ? 'met' : 'partly-met';
      const finding = delaySeconds === null
        ? 'No crystalloid was given after rapid blood loss began.'
        : `Crystalloid was first given ${delaySeconds.toFixed(0)} seconds after rapid blood loss began. `
          + 'That timing is a behavioral proxy for recognition; it cannot prove what you noticed or why.';
      return { ...base, outcome, finding, atTick: first?.tick } satisfies ObjectiveFinding;
    }

    if (objective.id === 'temporize-volume-loss' || objective.id === 'read-the-mechanism') {
      const controlTick = scenario.timeline.find((event) => event.id === 'hemorrhage-controlled')?.atTick
        ?? Infinity;
      const fluidMl = actions
        .filter((action) => action.type === 'fluid' && action.tick <= controlTick)
        .reduce((sum, action) => sum + Number(action.payload.volumeMl ?? 0), 0);
      const targetMl = objective.id === 'temporize-volume-loss' ? 1000 : 250;
      return {
        ...base,
        outcome: fluidMl >= targetMl ? 'met' : fluidMl > 0 ? 'partly-met' : 'not-met',
        finding: fluidMl > 0
          ? `${fluidMl.toFixed(0)} mL of crystalloid was given. It temporarily expands circulating `
            + 'volume in this model; it is not definitive hemorrhage replacement.'
          : 'No crystalloid was given. A vasopressor can raise resistance, but it does not replace lost volume.',
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'avoid-full-dose-induction') {
      const first = actions.find(
        (action) => action.type === 'bolus' && action.payload.drugId === 'propofol',
      );
      if (!first) {
        return { ...base, outcome: 'not-exercised', finding: 'No propofol induction dose was recorded.' } satisfies ObjectiveFinding;
      }
      const entered = Number(first.payload.amount);
      const perKg = String(first.payload.unit).includes('/kg')
        ? entered
        : entered / scenario.patient.weightKg;
      return {
        ...base,
        outcome: perKg <= 0.75 ? 'met' : perKg <= 1.25 ? 'partly-met' : 'not-met',
        finding: `The first propofol dose was ${perKg.toFixed(2)} mg/kg.`,
        atTick: first.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'preoxygenate-before-induction') {
      const induction = actions.find(
        (action) => action.type === 'bolus' && action.payload.drugId === 'propofol',
      );
      if (!induction) {
        return { ...base, outcome: 'not-exercised', finding: 'No propofol induction dose was recorded.' } satisfies ObjectiveFinding;
      }
      const sample = history.filter((entry) => entry.tick <= induction.tick).at(-1);
      const endTidal = sample?.state.endTidalO2Fraction ?? 0;
      return {
        ...base,
        outcome: endTidal >= 0.9 ? 'met' : endTidal >= 0.8 ? 'partly-met' : 'not-met',
        finding: `End-tidal oxygen fraction was ${endTidal.toFixed(2)} when the first propofol dose was given. `
          + 'The modeled preoxygenation endpoint is 0.90; the inspired setting alone does not show that the lung reservoir is full.',
        atTick: induction.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'wait-for-intubating-block') {
      const hypnoticIndex = actions.findIndex(
        (action) => action.type === 'bolus' && action.payload.drugId === 'propofol',
      );
      const blockerIndex = actions.findIndex(
        (action) => action.type === 'bolus' && action.payload.drugId === 'rocuronium',
      );
      const blocker = actions.find(
        (action) => action.type === 'bolus' && action.payload.drugId === 'rocuronium',
      );
      const airway = actions.find((action) => action.type === 'laryngoscopy');
      if (!airway) {
        return { ...base, outcome: 'not-exercised', finding: 'No laryngoscopy attempt was recorded.' } satisfies ObjectiveFinding;
      }
      if (!blocker || blocker.tick > airway.tick) {
        return {
          ...base, outcome: 'not-met', atTick: airway.tick,
          finding: 'The airway was instrumented before a rocuronium dose was recorded.',
        } satisfies ObjectiveFinding;
      }
      if (hypnoticIndex < 0 || hypnoticIndex > blockerIndex) {
        return {
          ...base, outcome: 'not-met', atTick: blocker.tick,
          finding: 'Rocuronium was given before a propofol hypnotic. Neuromuscular blockade '
            + 'prevents movement and breathing; it does not produce sleep, amnesia, or analgesia.',
        } satisfies ObjectiveFinding;
      }
      const sample = history.filter((entry) => entry.tick <= airway.tick).at(-1);
      const count = sample?.state.trainOfFourCount;
      const ratio = sample?.state.trainOfFourRatio ?? 1;
      const met = count !== undefined ? count === 0 : ratio <= 0.1;
      const partial = count !== undefined ? count <= 2 : ratio <= 0.5;
      const display = count !== undefined
        ? `count ${count.toFixed(0)} and ratio ${ratio.toFixed(2)}`
        : `ratio ${ratio.toFixed(2)}`;
      return {
        ...base,
        outcome: met ? 'met' : partial ? 'partly-met' : 'not-met',
        finding: `The train-of-four showed ${display} when laryngoscopy began. This is a peripheral `
          + 'teaching-model measurement; it does not guarantee conditions at the larynx.',
        atTick: airway.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'protect-the-apnea-margin') {
      const lowest = Math.min(...history.map((sample) => sample.state.spo2Percent ?? 100));
      return {
        ...base,
        outcome: lowest >= 92 ? 'met' : lowest >= 88 ? 'partly-met' : 'not-met',
        finding: `The lowest saturation during the session was ${lowest.toFixed(0)}%. `
          + 'Below 90% the oxyhaemoglobin dissociation curve is steep, so the remaining margin disappears quickly.',
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'secure-and-confirm') {
      const airway = actions.find((action) => action.type === 'laryngoscopy');
      if (!airway) {
        return { ...base, outcome: 'not-exercised', finding: 'No attempt to secure the airway was recorded.' } satisfies ObjectiveFinding;
      }
      const gasExchange = history.find((sample) =>
        sample.tick > airway.tick
        && (sample.state.respiratoryRateBpm ?? 0) > 0
        && (sample.state.etco2MmHg ?? 0) >= 20);
      return {
        ...base,
        outcome: gasExchange ? 'met' : 'partly-met',
        finding: gasExchange
          ? `Delivered ventilation resumed with sustained end-tidal carbon dioxide of ${(gasExchange.state.etco2MmHg ?? 0).toFixed(0)} mmHg after airway instrumentation.`
          : 'Airway instrumentation was recorded, but the available trace did not show subsequent delivered ventilation with sustained carbon dioxide.',
        atTick: gasExchange?.tick ?? airway.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'hypnosis-before-paralysis') {
      const propofol = actions.find(
        (action) => action.type === 'bolus' && action.payload.drugId === 'propofol',
      );
      const rocuronium = actions.find(
        (action) => action.type === 'bolus' && action.payload.drugId === 'rocuronium',
      );
      const infusion = actions.find(
        (action) => action.type === 'infusion'
          && action.payload.drugId === 'propofol'
          && Number(action.payload.rate) > 0,
      );
      if (!propofol || !rocuronium) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'Both propofol hypnosis and rocuronium blockade were not recorded.',
        } satisfies ObjectiveFinding;
      }
      const failureTick = scenario.timeline.find(
        (event) => event.target === 'hypnotic-line-disconnection',
      )?.atTick ?? Infinity;
      const ordered = propofol.tick <= rocuronium.tick;
      const maintained = infusion !== undefined && infusion.tick < failureTick;
      return {
        ...base,
        outcome: !ordered ? 'not-met' : maintained ? 'met' : 'partly-met',
        finding: `${ordered ? 'Propofol preceded rocuronium' : 'Rocuronium was given before propofol'}; `
          + `${maintained ? 'a propofol infusion was running before the line failed.' : 'no running propofol infusion was recorded before the line failed.'} `
          + 'Neuromuscular blockade prevents movement; it does not produce hypnosis or amnesia.',
        atTick: rocuronium.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'inspect-the-tiva-line' || objective.id === 'restore-hypnotic-delivery') {
      const failureTick = scenario.timeline.find(
        (event) => event.target === 'hypnotic-line-disconnection',
      )?.atTick;
      if (failureTick === undefined || (history.at(-1)?.tick ?? 0) < failureTick) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the hypnotic line disconnected.',
        } satisfies ObjectiveFinding;
      }
      const expectedAction = objective.id === 'inspect-the-tiva-line' ? 'inspect' : 'reconnect';
      const action = actions.find((entry) =>
        entry.type === 'hypnotic-line'
        && entry.payload.action === expectedAction
        && entry.tick >= failureTick);
      const delay = action ? (action.tick - failureTick) / TICKS_PER_SECOND : null;
      const metSeconds = objective.id === 'inspect-the-tiva-line' ? 45 : 90;
      const partialSeconds = objective.id === 'inspect-the-tiva-line' ? 90 : 180;
      return {
        ...base,
        outcome: delay === null ? 'not-met'
          : delay <= metSeconds ? 'met' : delay <= partialSeconds ? 'partly-met' : 'not-met',
        finding: delay === null
          ? `The disconnected hypnotic line was not ${expectedAction === 'inspect' ? 'inspected' : 'reconnected'}.`
          : `The hypnotic line was ${expectedAction === 'inspect' ? 'inspected' : 'reconnected'} ${delay.toFixed(0)} seconds after disconnection.`,
        atTick: action?.tick ?? failureTick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'recognize-paralysis-risk') {
      const failureTick = scenario.timeline.find(
        (event) => event.target === 'hypnotic-line-disconnection',
      )?.atTick;
      if (failureTick === undefined || (history.at(-1)?.tick ?? 0) < failureTick) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the hypnotic line disconnected.',
        } satisfies ObjectiveFinding;
      }
      const risk = history.find((sample) =>
        sample.tick >= failureTick
        && (sample.state.depthIndex ?? 0) > 60
        && (sample.state.trainOfFourRatio ?? 1) <= 0.1);
      const lightest = Math.max(...history
        .filter((sample) => sample.tick >= failureTick)
        .map((sample) => sample.state.depthIndex ?? 0));
      return {
        ...base,
        outcome: risk ? 'met' : 'not-met',
        finding: risk
          ? `Predicted depth reached ${lightest.toFixed(0)} while train-of-four remained suppressed. This marks modeled awareness risk, not measured consciousness or recall.`
          : `Predicted depth peaked at ${lightest.toFixed(0)} without a recorded interval above 60 while train-of-four was suppressed.`,
        atTick: risk?.tick ?? failureTick,
      } satisfies ObjectiveFinding;
    }

    const isLaryngospasmObjective = [
      'preoxygenate-before-laryngospasm',
      'apply-initial-laryngospasm-measures',
      'deepen-during-laryngospasm',
      'protect-oxygenation-during-laryngospasm',
    ].includes(objective.id);
    const laryngospasmOnset = scenario.timeline.find(
      (event) => event.type === 'laryngospasm',
    )?.atTick;
    if (isLaryngospasmObjective && laryngospasmOnset !== undefined && actions.some(
      (action) => action.type === 'laryngoscopy' && action.tick < laryngospasmOnset,
    )) {
      return {
        ...base, outcome: 'not-exercised', atTick: laryngospasmOnset,
        finding: 'Airway instrumentation was recorded before the scripted closure. The engine refuses upper-airway closure after successful tracheal intubation, and this trace does not prove whether an earlier attempt succeeded, so this objective is not inferred.',
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'preoxygenate-before-laryngospasm') {
      const onset = scenario.timeline.find((event) => event.type === 'laryngospasm')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the scripted airway closure began.',
        } satisfies ObjectiveFinding;
      }
      const sample = history.filter((entry) => entry.tick <= onset).at(-1);
      const endTidal = sample?.state.endTidalO2Fraction ?? 0;
      return {
        ...base,
        outcome: endTidal >= 0.9 ? 'met' : endTidal >= 0.8 ? 'partly-met' : 'not-met',
        finding: `End-tidal oxygen fraction was ${endTidal.toFixed(2)} when airway closure began. `
          + 'This measures the modeled oxygen reserve, not whether every preparation step was clinically complete.',
        atTick: onset,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'apply-initial-laryngospasm-measures') {
      const onset = scenario.timeline.find((event) => event.type === 'laryngospasm')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the scripted airway closure began.',
        } satisfies ObjectiveFinding;
      }
      const maneuver = actions.find((action) =>
        action.tick >= onset
        && action.type === 'airway-maneuver'
        && action.payload.maneuver === 'jaw-thrust-cpap');
      const delivered = actions
        .filter((action) => action.type === 'ventilator' && action.tick <= (maneuver?.tick ?? Infinity))
        .reduce((settings, action) => ({
          fio2: action.payload.fio2 === undefined ? settings.fio2 : Number(action.payload.fio2),
          delivering: action.payload.delivering === undefined
            ? settings.delivering : action.payload.delivering === true,
        }), {
          fio2: scenario.equipment.ventilator.fio2,
          delivering: scenario.equipment.ventilator.delivering,
        });
      if (!maneuver || delivered.fio2 < 0.95 || !delivered.delivering) {
        return {
          ...base, outcome: 'not-met', atTick: maneuver?.tick ?? onset,
          finding: 'The trace did not record both a held jaw-thrust/CPAP maneuver and actively delivered oxygen at 95% or above. These are observable initial measures, not the complete laryngospasm algorithm.',
        } satisfies ObjectiveFinding;
      }
      const delay = (maneuver.tick - onset) / TICKS_PER_SECOND;
      return {
        ...base,
        outcome: delay <= 30 ? 'met' : delay <= 60 ? 'partly-met' : 'not-met',
        finding: `The held jaw-thrust/CPAP maneuver began ${delay.toFixed(0)} seconds after closure with at least 95% oxygen actively delivered. These are observable initial measures, not proof of physical technique. `
          + 'Suction, airway adjuncts, help, and refractory drug treatment are outside this modeled response.',
        atTick: maneuver.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'deepen-during-laryngospasm') {
      const onset = scenario.timeline.find((event) => event.type === 'laryngospasm')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the scripted airway closure began.',
        } satisfies ObjectiveFinding;
      }
      const dose = actions.find((action) =>
        action.tick >= onset
        && action.type === 'bolus'
        && action.payload.drugId === 'propofol');
      const delay = dose ? (dose.tick - onset) / TICKS_PER_SECOND : null;
      return {
        ...base,
        outcome: delay === null ? 'not-met' : delay <= 45 ? 'met' : delay <= 90 ? 'partly-met' : 'not-met',
        finding: delay === null
          ? 'No propofol deepening dose was recorded after closure.'
          : `A propofol dose was recorded ${delay.toFixed(0)} seconds after closure. This timing is an action proxy; it does not establish that the dose or complete clinical sequence was adequate.`,
        atTick: dose?.tick ?? onset,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'protect-oxygenation-during-laryngospasm') {
      const onset = scenario.timeline.find((event) => event.type === 'laryngospasm')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the scripted airway closure began.',
        } satisfies ObjectiveFinding;
      }
      const lowest = Math.min(...history
        .filter((entry) => entry.tick >= onset)
        .map((entry) => entry.state.spo2Percent ?? 100));
      return {
        ...base,
        outcome: lowest >= 92 ? 'met' : lowest >= 88 ? 'partly-met' : 'not-met',
        finding: `The lowest saturation after airway closure was ${lowest.toFixed(0)}%. `
          + 'This is an oxygenation outcome, not proof that laryngospasm was definitively treated.',
      } satisfies ObjectiveFinding;
    }

    if ([
      'recognize-anaphylaxis-pattern', 'give-initial-epinephrine',
      'support-anaphylaxis-circulation', 'support-anaphylaxis-oxygenation',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find((event) => event.type === 'anaphylaxis')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the modeled cefazolin exposure.',
        } satisfies ObjectiveFinding;
      }
      const epinephrine = actions.find((action) =>
        action.tick >= onset && action.type === 'epinephrine'
        && action.payload.route === 'iv'
        && Number.isFinite(Number(action.payload.doseMicrograms))
        && Number(action.payload.doseMicrograms) >= 10
        && Number(action.payload.doseMicrograms) <= 50);
      const epinephrineDelay = epinephrine ? (epinephrine.tick - onset) / TICKS_PER_SECOND : null;
      if (objective.id === 'recognize-anaphylaxis-pattern') {
        return {
          ...base,
          outcome: epinephrineDelay === null ? 'not-met'
            : epinephrineDelay <= 60 ? 'met' : epinephrineDelay <= 120 ? 'partly-met' : 'not-met',
          finding: epinephrineDelay === null
            ? 'No first-line epinephrine action was recorded after cefazolin exposure. The modeled hypotension and bronchospasm are observable clues, not a definitive diagnosis.'
            : `First-line epinephrine was recorded ${epinephrineDelay.toFixed(0)} seconds after cefazolin exposure. This is a behavioral response to an observable pattern, not proof of diagnosis.`,
          atTick: epinephrine?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      if (objective.id === 'give-initial-epinephrine') {
        const exactInitialDose = epinephrine?.payload.route === 'iv'
          && Number(epinephrine.payload.doseMicrograms) === 50;
        return {
          ...base,
          outcome: !epinephrine ? 'not-met'
            : exactInitialDose && epinephrineDelay! <= 60 ? 'met'
              : exactInitialDose && epinephrineDelay! <= 120 ? 'partly-met' : 'not-met',
          finding: !epinephrine
            ? 'No intravenous epinephrine dose was recorded after exposure.'
            : `${Number(epinephrine.payload.doseMicrograms).toFixed(0)} micrograms of epinephrine by ${String(epinephrine.payload.route).toUpperCase()} was recorded ${epinephrineDelay!.toFixed(0)} seconds after exposure. The modeled adult initial target is 50 micrograms IV.`,
          atTick: epinephrine?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      if (objective.id === 'support-anaphylaxis-circulation') {
        const cutoff = onset + (120 * TICKS_PER_SECOND);
        const volume = actions.filter((action) =>
          action.tick >= onset && action.tick <= cutoff
          && action.type === 'fluid'
          && getFluid(String(action.payload.fluidId))?.id === 'balanced-crystalloid'
          && Number.isFinite(Number(action.payload.volumeMl))
          && Number(action.payload.volumeMl) >= 1
          && Number(action.payload.volumeMl) <= MAX_FLUID_BOLUS_ML)
          .reduce((sum, action) => sum + Number(action.payload.volumeMl ?? 0), 0);
        return {
          ...base,
          outcome: volume >= 1000 ? 'met' : volume >= 500 ? 'partly-met' : 'not-met',
          finding: `${volume.toFixed(0)} mL of balanced crystalloid was recorded in the first 120 seconds after exposure. This scores initial volume support, not a complete or individualized resuscitation.`,
          atTick: onset,
        } satisfies ObjectiveFinding;
      }
      const cutoff = onset + (60 * TICKS_PER_SECOND);
      const delivered = actions
        .filter((action) => action.type === 'ventilator' && action.tick <= cutoff)
        .reduce((settings, action) => {
          const requestedFio2 = action.payload.fio2 === undefined
            ? null : Number(action.payload.fio2);
          return {
            fio2: requestedFio2 === null || !Number.isFinite(requestedFio2)
              ? settings.fio2 : Math.min(1, Math.max(0, requestedFio2)),
            delivering: action.payload.delivering === undefined
              ? settings.delivering : action.payload.delivering === true,
          };
        }, {
          fio2: scenario.equipment.ventilator.fio2,
          delivering: scenario.equipment.ventilator.delivering,
        });
      const lowest = Math.min(...history.filter((entry) => entry.tick >= onset)
        .map((entry) => entry.state.spo2Percent ?? 100));
      const actionsMet = delivered.fio2 >= 0.95 && delivered.delivering;
      return {
        ...base,
        outcome: actionsMet && lowest >= 92 ? 'met'
          : actionsMet || lowest >= 88 ? 'partly-met' : 'not-met',
        finding: `Delivered oxygen was ${(delivered.fio2 * 100).toFixed(0)}% with ventilation ${delivered.delivering ? 'active' : 'inactive'}; the lowest modeled saturation was ${lowest.toFixed(0)}%. This observable response does not establish a definitive diagnosis or complete treatment.`,
        atTick: onset,
      } satisfies ObjectiveFinding;
    }

    if ([
      'recognize-mh-hypermetabolism', 'stop-trigger-and-hyperventilate',
      'give-initial-dantrolene', 'reassess-mh-response',
    ].includes(objective.id)) {
      const onsetSample = history.find((entry) =>
        (entry.state.muscleRigidityFraction ?? 0) > 0.01);
      if (!onsetSample) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'No modeled rigidity developed. The latent event requires genuine end-tidal volatile exposure, so this trace does not establish that the crisis was exercised.',
        } satisfies ObjectiveFinding;
      }
      const onset = onsetSample.tick;
      const acceptedDantrolene = actions.find((action) =>
        action.tick >= onset
        && action.type === 'dantrolene'
        && action.payload.route === 'iv'
        && Number.isFinite(Number(action.payload.doseMgPerKg))
        && Number(action.payload.doseMgPerKg) === 2.5);
      const responseAction = actions.find((action) => {
        if (action.tick < onset) return false;
        if (action === acceptedDantrolene) return true;
        if (action.type !== 'ventilator') return false;
        const fio2 = Number(action.payload.fio2);
        const flow = Number(action.payload.freshGasFlowLPerMin);
        const sevo = Number(action.payload.sevofluranePercent);
        return (Number.isFinite(fio2) && Math.min(1, Math.max(0, fio2)) >= 0.95)
          || (Number.isFinite(flow) && Math.min(15, Math.max(0, flow)) >= 10)
          || (Number.isFinite(sevo) && Math.min(8, Math.max(0, sevo)) === 0);
      });
      if (objective.id === 'recognize-mh-hypermetabolism') {
        const delay = responseAction ? (responseAction.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met'
            : delay <= 60 ? 'met' : delay <= 120 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'No accepted initial-response action was recorded after modeled rigidity appeared. Rising carbon dioxide, tachycardia, and rigidity are clues, not a definitive diagnosis.'
            : `An initial-response action was recorded ${delay.toFixed(0)} seconds after modeled rigidity appeared. This is an action proxy for recognizing an observable hypermetabolic pattern, not a diagnosis.`,
          atTick: responseAction?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      if (objective.id === 'stop-trigger-and-hyperventilate') {
        const cutoff = onset + (60 * TICKS_PER_SECOND);
        const initial = scenario.equipment.ventilator;
        const machine = actions
          .filter((action) => action.type === 'ventilator' && action.tick <= cutoff)
          .reduce((settings, action) => {
            const finite = (field: string, fallback: number, min: number, max: number) => {
              if (action.payload[field] === undefined) return fallback;
              const value = Number(action.payload[field]);
              return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
            };
            return {
              fio2: finite('fio2', settings.fio2, 0, 1),
              freshGasFlowLPerMin: finite(
                'freshGasFlowLPerMin', settings.freshGasFlowLPerMin, 0.5, 15,
              ),
              tidalVolumeMl: finite('tidalVolumeMl', settings.tidalVolumeMl, 0, 1500),
              respiratoryRateBpm: finite(
                'respiratoryRateBpm', settings.respiratoryRateBpm, 0, 60,
              ),
              sevofluranePercent: finite(
                'sevofluranePercent', settings.sevofluranePercent, 0, 8,
              ),
              delivering: action.payload.delivering === undefined
                ? settings.delivering : action.payload.delivering === true,
            };
          }, {
            fio2: initial.fio2,
            freshGasFlowLPerMin: initial.freshGasFlowLPerMin ?? 1,
            tidalVolumeMl: initial.tidalVolumeMl,
            respiratoryRateBpm: initial.respiratoryRateBpm,
            sevofluranePercent: 0,
            delivering: initial.delivering,
          });
        const minuteVentilation = machine.tidalVolumeMl * machine.respiratoryRateBpm / 1000;
        const baselineMinuteVentilation = initial.tidalVolumeMl * initial.respiratoryRateBpm / 1000;
        const met = machine.sevofluranePercent === 0 && machine.fio2 >= 0.95
          && machine.freshGasFlowLPerMin >= 10 && machine.delivering
          && minuteVentilation >= baselineMinuteVentilation * 2;
        return {
          ...base, outcome: met ? 'met' : 'not-met', atTick: cutoff,
          finding: `By 60 seconds, vaporizer delivery was ${machine.sevofluranePercent.toFixed(1)}%, oxygen ${(machine.fio2 * 100).toFixed(0)}%, fresh-gas flow ${machine.freshGasFlowLPerMin.toFixed(1)} L/min, and delivered minute ventilation ${minuteVentilation.toFixed(1)} L/min. The observable initial bundle requires zero volatile, at least 95% oxygen, at least 10 L/min fresh-gas flow, and twice the ${baselineMinuteVentilation.toFixed(1)} L/min baseline minute ventilation.`,
        } satisfies ObjectiveFinding;
      }
      if (objective.id === 'give-initial-dantrolene') {
        const delay = acceptedDantrolene
          ? (acceptedDantrolene.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met'
            : delay <= 90 ? 'met' : delay <= 180 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'No accepted 2.5 mg/kg IV dantrolene dose was recorded after modeled rigidity appeared.'
            : `An accepted 2.5 mg/kg IV dantrolene dose was recorded ${delay.toFixed(0)} seconds after modeled rigidity appeared. Repetition depends on the observable response; this model does not simulate vial preparation or an individualized dose course.`,
          atTick: acceptedDantrolene?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      if (!acceptedDantrolene) {
        return {
          ...base, outcome: 'not-met', atTick: onset,
          finding: 'No accepted dantrolene dose was recorded, so a post-treatment response cannot be assessed.',
        } satisfies ObjectiveFinding;
      }
      const before = history.filter((entry) => entry.tick <= acceptedDantrolene.tick).at(-1);
      const after = history.filter((entry) =>
        entry.tick > acceptedDantrolene.tick
        && entry.tick <= acceptedDantrolene.tick + (120 * TICKS_PER_SECOND));
      const final = after.at(-1);
      const improved = Boolean(before && final && (
        (final.state.etco2MmHg ?? Infinity) < (before.state.etco2MmHg ?? -Infinity)
        || (final.state.heartRateBpm ?? Infinity) < (before.state.heartRateBpm ?? -Infinity)
        || (final.state.muscleRigidityFraction ?? Infinity)
          < (before.state.muscleRigidityFraction ?? -Infinity)
      ));
      const peakTemperature = Math.max(...history
        .filter((entry) => entry.tick >= onset)
        .map((entry) => entry.state.coreTemperatureC ?? scenario.patient.baseline.coreTemperatureC));
      return {
        ...base,
        outcome: !final ? 'partly-met' : improved ? 'met' : 'not-met',
        finding: !before || !final
          ? 'The trace ended before a full 120-second post-dantrolene reassessment window. Temperature is a late sign and is not required for early recognition.'
          : `Over the 120-second reassessment, end-tidal carbon dioxide changed from ${(before.state.etco2MmHg ?? 0).toFixed(0)} to ${(final.state.etco2MmHg ?? 0).toFixed(0)} mmHg, heart rate from ${(before.state.heartRateBpm ?? 0).toFixed(0)} to ${(final.state.heartRateBpm ?? 0).toFixed(0)} bpm, and modeled rigidity from ${(before.state.muscleRigidityFraction ?? 0).toFixed(2)} to ${(final.state.muscleRigidityFraction ?? 0).toFixed(2)}. Peak temperature was ${peakTemperature.toFixed(1)}°C. This is a bounded modeled response; temperature is late and the display does not confirm a diagnosis.`,
        atTick: final?.tick ?? acceptedDantrolene.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'ventilate-before-desaturation') {
      const lowest = Math.min(...history.map((sample) => sample.state.spo2Percent ?? 100));
      return {
        ...base,
        outcome: lowest >= 92 ? 'met' : lowest >= 88 ? 'partly-met' : 'not-met',
        finding: `The lowest saturation reached was ${lowest.toFixed(0)}%.`
          + (lowest < 92 ? ' Below 90% the dissociation curve is steep, so the next few percent go quickly.' : ''),
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'blunt-incision') {
      const incisionTick = 3600;
      const before = history.filter((s) => s.tick < incisionTick).slice(-1)[0];
      const after = history.filter((s) => s.tick >= incisionTick && s.tick < incisionTick + 600);
      if (!before || after.length === 0) {
        return { ...base, outcome: 'not-exercised', finding: 'The session ended before incision.' } satisfies ObjectiveFinding;
      }
      const peakRate = Math.max(...after.map((s) => s.state.heartRateBpm ?? 0));
      const rise = (peakRate - (before.state.heartRateBpm ?? 0)) / Math.max(before.state.heartRateBpm ?? 1, 1);
      return {
        ...base,
        outcome: rise < 0.2 ? 'met' : rise < 0.35 ? 'partly-met' : 'not-met',
        finding: `Heart rate rose ${(rise * 100).toFixed(0)}% in the minute after incision.`
          + (rise >= 0.2 ? ' More opioid before the knife would have blunted that.' : ''),
      } satisfies ObjectiveFinding;
    }

    return { ...base, outcome: 'not-exercised', finding: 'Not evaluated in this scenario.' } satisfies ObjectiveFinding;
  });
}

/**
 * The events the description phase lists.
 *
 * Everything the LEARNER did — every drug given, every ventilator change, every
 * airway attempt — plus everything that went wrong. Filtering on severity alone
 * drops the whole record of the learner's own actions, because a correctly given
 * drug is logged at `info`, and a description phase that omits what the learner
 * did is not a description of what happened.
 */
const LEARNER_ACTION_CATEGORIES = new Set(['drug', 'ventilator', 'airway', 'fluid', 'rhythm']);

export function describedEvents(log: readonly EngineEvent[], limit = 40): EngineEvent[] {
  return log
    .filter((entry) => entry.severity !== 'info' || LEARNER_ACTION_CATEGORIES.has(entry.category))
    .slice(0, limit);
}
