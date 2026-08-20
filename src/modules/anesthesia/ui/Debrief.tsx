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
import { formatElapsed } from '@platform/clock/simulation-clock';
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
    () => objectiveFindings(props.scenario, props.history, stacking.length, props.preoxygenationSeconds),
    [props.scenario, props.history, stacking.length, props.preoxygenationSeconds],
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
): ObjectiveFinding[] {
  const concepts: Record<string, string> = {
    preoxygenate: 'preoxygenation-and-safe-apnea-time',
    hysteresis: 'hysteresis-and-effect-site-lag',
    'manage-hypotension': 'vasodilation-versus-hypovolemia',
    'ventilate-before-desaturation': 'preoxygenation-and-safe-apnea-time',
    'blunt-incision': 'hypnotic-opioid-synergy',
  };

  return scenario.metadata.objectives.map((objective) => {
    const base = { objectiveId: objective.id, statement: objective.statement, concept: concepts[objective.id] };

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
      const seconds = secondsBeyond(history, 'meanArterialMmHg', 55, 'below');
      return {
        ...base,
        outcome: seconds === 0 ? 'met' : seconds < 120 ? 'partly-met' : 'not-met',
        finding: seconds === 0
          ? 'Mean arterial pressure never fell below 55 mmHg.'
          : `Mean arterial pressure spent ${seconds.toFixed(0)} seconds below 55 mmHg.`,
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
