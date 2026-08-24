/**
 * The debrief screen, structured on PEARLS.
 *
 * The learner's own account comes first and the system's analysis is not shown
 * until they have moved past the reactions phase, because self-assessment before
 * directive feedback is the framework's core sequence.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { MaturityMarker } from '@platform/governance/MaturityMarker';
import { GoalRecommendation, type GoalRecommendationProps } from './GoalRecommendation';
import type { ScenarioReplayPoint } from '@anesthesia/scenarios/types';
import {
  appendPracticeAttempt,
  loadPracticeHistory,
  objectiveChanges,
  previousScenarioAttempt,
} from '@anesthesia/catalog/practice-history';

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
  readonly onReplayDecisionPoint?: (point: ScenarioReplayPoint) => void;
  readonly nextRecommendation?: GoalRecommendationProps;
  readonly completedAt?: () => string;
}

export function applicableReplayPoint(
  scenario: Scenario,
  findings: readonly ObjectiveFinding[],
  totalTicks: number,
): ScenarioReplayPoint | undefined {
  return scenario.replayPoints?.find((point) => (
    point.atTick <= totalTicks
    && findings.some((finding) => finding.objectiveId === point.objectiveId && finding.outcome !== 'met')
  ));
}

export function analysisIssue(episodes: readonly Episode[]): string {
  return episodes[0]?.label.toLowerCase()
    ?? 'the relationship between your plan and the patient response';
}

export function Debrief(props: DebriefProps) {
  const [phase, setPhase] = useState<PearlsPhase>('reactions');
  const [account, setAccount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [priorAttempts] = useState(() => loadPracticeHistory());
  const historySaved = useRef(false);

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

  const keyIssue = analysisIssue(episodes);
  const identified = accountIdentifies(account, [
    'vasodilat', 'pressure', 'saturation', 'desaturat', 'apno', 'apne', 'stack', 'wait',
  ]);
  const tone = toneFor(identified, keyIssue);

  const marks = props.log
    .filter((entry) => entry.severity !== 'info')
    .map((entry) => ({ tick: entry.tick, severity: entry.severity, label: entry.message }));
  const totalTicks = props.history[props.history.length - 1]?.tick ?? 1;
  const previousAttempt = previousScenarioAttempt(
    priorAttempts, props.scenario.metadata.id, props.scenario.metadata.version,
  );
  const changes = objectiveChanges(previousAttempt, findings);
  const replayPoint = applicableReplayPoint(props.scenario, findings, totalTicks);

  useEffect(() => {
    if (phase !== 'summary' || historySaved.current) return;
    historySaved.current = true;
    appendPracticeAttempt({
      schemaVersion: 1,
      scenarioId: props.scenario.metadata.id,
      contentVersion: props.scenario.metadata.version,
      goalId: props.nextRecommendation?.pathId ?? null,
      completedAt: props.completedAt?.() ?? new Date().toISOString(),
      simulatedSeconds: totalTicks / TICKS_PER_SECOND,
      objectives: findings.map((finding) => ({
        objectiveId: finding.objectiveId, outcome: finding.outcome,
      })),
    });
  }, [phase, props.scenario.metadata.id, props.scenario.metadata.version,
    props.nextRecommendation?.pathId, props.completedAt, totalTicks, findings]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <main className="reading" id="main">
      <h1>Debrief</h1>
      <MaturityMarker
        status={props.scenario.metadata.maturity}
        subjectKind="scenario"
        subjectId={props.scenario.metadata.id}
        contentVersion={props.scenario.metadata.version}
      />
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
            about this session has left the device. Any comparison below uses only your own prior
            bounded attempt summary on this device.
          </p>

          <h2>Your own prior attempt</h2>
          {previousAttempt ? (
            changes.length > 0 ? (
              <ul>
                {changes.map((change) => {
                  const objective = props.scenario.metadata.objectives.find(
                    (entry) => entry.id === change.objectiveId,
                  );
                  return (
                    <li key={change.objectiveId}>
                      <strong>{objective?.statement ?? change.objectiveId}</strong>
                      <br />
                      <span className="field__hint">
                        Previously {outcomeWord(change.previous).toLowerCase()}; now{' '}
                        {outcomeWord(change.current).toLowerCase()}.
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : <p>The objective outcomes are unchanged from your last attempt at this exact content version.</p>
          ) : (
            <p>This is the first bounded attempt summary stored for this exact content version.</p>
          )}
          <p className="field__hint">
            Stored locally: scenario and content version, selected public goal, simulated duration,
            completion time, and objective outcome words. No reflection, action list, physiology
            trace, identity, or overall score is stored here.
          </p>

          <h2>Where this goes next</h2>
          {replayPoint && props.onReplayDecisionPoint && (
            <Panel>
              <strong>Rehearse one decision</strong>
              <p>{replayPoint.reason}</p>
              <Button onClick={() => props.onReplayDecisionPoint?.(replayPoint)}>
                Practice “{replayPoint.label}” from {formatElapsed(replayPoint.atTick)}
              </Button>
              <p className="field__hint">
                Your original run stays intact. The engine rebuilds its exact state through this
                point, then records your next actions as a separate rehearsal branch.
              </p>
            </Panel>
          )}
          {props.nextRecommendation && <GoalRecommendation {...props.nextRecommendation} />}
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
    </>
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
    'preoxygenate-older-adult': 'preoxygenation-and-safe-apnea-time',
    'titrate-geriatric-propofol': 'hysteresis-and-effect-site-lag',
    'protect-geriatric-perfusion': 'vasodilation-versus-hypovolemia',
    'ventilate-geriatric-induction': 'preoxygenation-and-safe-apnea-time',
    'establish-quantitative-baseline': 'train-of-four-and-residual-blockade',
    'reverse-recovering-block': 'train-of-four-and-residual-blockade',
    'confirm-quantitative-recovery': 'train-of-four-and-residual-blockade',
    'maintain-anesthesia-during-block': 'depth-monitoring-and-its-limits',
    'recognize-hemorrhage': 'vasodilation-versus-hypovolemia',
    'temporize-volume-loss': 'vasodilation-versus-hypovolemia',
    'avoid-full-dose-induction': 'hysteresis-and-effect-site-lag',
    'identify-dilutional-coagulopathy': 'vasodilation-versus-hypovolemia',
    'give-lab-guided-plasma': 'vasodilation-versus-hypovolemia',
    'reassess-coagulation-response': 'vasodilation-versus-hypovolemia',
    'dose-for-the-patient': 'hysteresis-and-effect-site-lag',
    'read-the-mechanism': 'vasodilation-versus-hypovolemia',
    'limit-attempts': 'airway-assessment-predicts-poorly',
    'read-the-capnogram': 'capnogram-morphology',
    'deepen-before-reaching-for-anything-else': 'hysteresis-and-effect-site-lag',
    'escalate-bronchospasm': 'capnogram-morphology',
    'give-first-line-bronchodilator': 'capnogram-morphology',
    'preoxygenate-before-induction': 'preoxygenation-and-safe-apnea-time',
    'wait-for-intubating-block': 'train-of-four-and-residual-blockade',
    'protect-the-apnea-margin': 'preoxygenation-and-safe-apnea-time',
    'secure-and-confirm': 'capnogram-morphology',
    'reverse-observed-block': 'train-of-four-and-residual-blockade',
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
    'act-on-prior-airway-record': 'airway-assessment-predicts-poorly',
    'limit-attempts-and-call-for-help': 'airway-assessment-predicts-poorly',
    'place-supraglottic-rescue': 'airway-assessment-predicts-poorly',
    'confirm-rescue-gas-exchange': 'capnogram-morphology',
    'recognize-last-pattern': 'vasodilation-versus-hypovolemia',
    'support-last-airway-and-seizure': 'capnogram-morphology',
    'start-last-lipid': 'vasodilation-versus-hypovolemia',
    'use-reduced-last-epinephrine': 'vasodilation-versus-hypovolemia',
    'resume-arrest-compressions': 'vasodilation-versus-hypovolemia',
    'give-arrest-epinephrine': 'vasodilation-versus-hypovolemia',
    'defibrillate-persistent-vf': 'capnogram-morphology',
    'avoid-shocking-nonshockable-rhythm': 'capnogram-morphology',
    'call-for-high-spinal-help': 'vasodilation-versus-hypovolemia',
    'support-high-spinal-breathing': 'capnogram-morphology',
    'support-high-spinal-circulation': 'vasodilation-versus-hypovolemia',
    'protect-high-spinal-oxygenation': 'preoxygenation-and-safe-apnea-time',
    'escalate-venous-air-pattern': 'capnogram-morphology',
    'control-venous-air-entry': 'capnogram-morphology',
    'support-venous-air-oxygenation': 'preoxygenation-and-safe-apnea-time',
    'reassess-venous-air-recovery': 'capnogram-morphology',
    'cross-check-capnography-loss': 'capnogram-morphology',
    'preserve-stable-ventilation': 'capnogram-morphology',
    'restore-capnography-sampling': 'capnogram-morphology',
    'verify-invasive-pressure-independently': 'vasodilation-versus-hypovolemia',
    'correct-transducer-level': 'vasodilation-versus-hypovolemia',
    'assess-arterial-dynamic-response': 'vasodilation-versus-hypovolemia',
    'recognize-inspired-carbon-dioxide': 'capnogram-morphology',
    'bridge-with-fresh-gas-flow': 'capnogram-morphology',
    'replace-exhausted-absorbent': 'capnogram-morphology',
    'maintain-bounded-depth': 'depth-monitoring-and-its-limits',
    'anticipate-surgical-stimulus': 'hypnotic-opioid-synergy',
    'reassess-when-stimulus-falls': 'vasodilation-versus-hypovolemia',
    'request-blood-bank-release': 'vasodilation-versus-hypovolemia',
    'use-released-red-cells': 'vasodilation-versus-hypovolemia',
    'reassess-red-cell-response': 'vasodilation-versus-hypovolemia',
  };

  return scenario.metadata.objectives.map((objective) => {
    const base = { objectiveId: objective.id, statement: objective.statement, concept: concepts[objective.id] };

    if ([
      'request-blood-bank-release', 'use-released-red-cells', 'reassess-red-cell-response',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find((entry) => entry.id === 'operative-hemorrhage')?.atTick;
      if (onset === undefined) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The authored operative-hemorrhage event was unavailable.',
        } satisfies ObjectiveFinding;
      }
      const release = log.find((entry) => entry.eventId.startsWith('blood-bank-release-'));
      const redCells = log.find((entry) => entry.eventId.startsWith('blood-product-packed-red-blood-cells-'));
      const refusedBeforeRelease = log.some((entry) => entry.eventId.startsWith('bad-blood-product-')
        && (release === undefined || entry.tick < release.tick));

      if (objective.id === 'request-blood-bank-release') {
        const delay = release ? (release.tick - onset) / TICKS_PER_SECOND : Infinity;
        return {
          ...base,
          outcome: delay >= 0 && delay <= 60 ? 'met' : release ? 'partly-met' : 'not-met',
          finding: release
            ? `The bounded blood-bank release was accepted ${delay.toFixed(1)} seconds after hemorrhage onset. The simulator did not collect a specimen, test compatibility, check inventory, or apply local emergency-release policy.`
            : 'No bounded blood-bank release was accepted while the modeled hemorrhage was active.',
          atTick: release?.tick,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'use-released-red-cells') {
        const ordered = release !== undefined && redCells !== undefined
          && redCells.tick > release.tick && !refusedBeforeRelease;
        return {
          ...base,
          outcome: ordered ? 'met' : release || redCells ? 'partly-met' : 'not-met',
          finding: `${redCells ? `${Number(redCells.data?.units ?? 0)} fixed red-cell unit${Number(redCells.data?.units ?? 0) === 1 ? ' was' : 's were'} accepted after release` : 'No red-cell action was accepted'}. ${refusedBeforeRelease ? 'A blood-product action was refused before release.' : 'No blood-product action was refused before release.'} This order is teaching evidence, not a compatibility workflow.`,
          atTick: redCells?.tick ?? release?.tick,
        } satisfies ObjectiveFinding;
      }

      if ((history.at(-1)?.tick ?? 0) < 3600) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the authored reassessment point.',
        } satisfies ObjectiveFinding;
      }
      const hemoglobinDelta = Number(redCells?.data?.hemoglobinDeltaGPerDl ?? 0);
      const oxygenBefore = Number(redCells?.data?.oxygenDeliveryBeforeMlPerMin ?? 0);
      const oxygenAfter = Number(redCells?.data?.oxygenDeliveryAfterMlPerMin ?? 0);
      const final = history.filter((entry) => entry.tick <= 3600).at(-1);
      const finalMap = Number(final?.state.meanArterialMmHg ?? 0);
      const modeledResponse = hemoglobinDelta > 0 && oxygenAfter > oxygenBefore;
      const recovered = finalMap >= 65;
      return {
        ...base,
        outcome: modeledResponse && recovered ? 'met' : modeledResponse || recovered ? 'partly-met' : 'not-met',
        finding: redCells
          ? `The fixed-unit event changed modeled hemoglobin by ${hemoglobinDelta.toFixed(2)} g/dL and calculated oxygen delivery from ${oxygenBefore.toFixed(0)} to ${oxygenAfter.toFixed(0)} mL/min. Final mean arterial pressure was ${finalMap.toFixed(0)} mmHg.`
          : `No accepted red-cell event was available to reassess. Final mean arterial pressure was ${finalMap.toFixed(0)} mmHg.`,
        atTick: final?.tick,
      } satisfies ObjectiveFinding;
    }

    if ([
      'maintain-bounded-depth', 'anticipate-surgical-stimulus',
      'reassess-when-stimulus-falls',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find((entry) => entry.id === 'dissection')?.atTick;
      const duration = scenario.timeline.find((entry) => entry.id === 'dissection')?.durationTicks;
      if (onset === undefined || duration === undefined) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The authored surgical-stimulus window was unavailable.',
        } satisfies ObjectiveFinding;
      }
      const offset = onset + duration;
      const acceptedInfusions = log.filter((entry) => entry.eventId.startsWith('infusion-remifentanil-'));
      const preStimulusSetting = acceptedInfusions.filter((entry) => entry.tick < onset).at(-1);
      const runningAtOnset = Number(preStimulusSetting?.data?.newRate ?? 0) > 0
        ? preStimulusSetting
        : undefined;

      if (objective.id === 'maintain-bounded-depth') {
        const window = history.filter((entry) => entry.tick >= 1200 && entry.tick <= 5400);
        if (window.length === 0) {
          return {
            ...base, outcome: 'not-exercised',
            finding: 'The session ended before the scored maintenance window began.',
          } satisfies ObjectiveFinding;
        }
        const inRange = window.filter((entry) => Number(entry.state.depthIndex) >= 40
          && Number(entry.state.depthIndex) <= 60).length;
        const fraction = inRange / window.length;
        return {
          ...base,
          outcome: fraction >= 0.8 ? 'met' : fraction >= 0.5 ? 'partly-met' : 'not-met',
          finding: `Predicted depth stayed between 40 and 60 for ${(fraction * 100).toFixed(0)}% of the recorded maintenance window. This is a drug-model trace, not measured consciousness.`,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'anticipate-surgical-stimulus') {
        if ((history.at(-1)?.tick ?? 0) < onset + 600) {
          return {
            ...base, outcome: 'not-exercised',
            finding: 'The session ended before the first minute of surgical response was available.',
          } satisfies ObjectiveFinding;
        }
        const baseline = history.filter((entry) => entry.tick < onset).at(-1);
        const response = history.filter((entry) => entry.tick >= onset && entry.tick <= onset + 600);
        const baselineHr = Number(baseline?.state.heartRateBpm ?? 0);
        const baselineMap = Number(baseline?.state.meanArterialMmHg ?? 0);
        const peakHr = Math.max(...response.map((entry) => Number(entry.state.heartRateBpm ?? 0)));
        const peakMap = Math.max(...response.map((entry) => Number(entry.state.meanArterialMmHg ?? 0)));
        const hrRise = baselineHr > 0 ? (peakHr - baselineHr) / baselineHr : Infinity;
        const mapRise = baselineMap > 0 ? (peakMap - baselineMap) / baselineMap : Infinity;
        const bounded = hrRise < 0.2 && mapRise < 0.2;
        return {
          ...base,
          outcome: runningAtOnset && bounded ? 'met' : runningAtOnset || bounded ? 'partly-met' : 'not-met',
          finding: `${runningAtOnset ? 'Accepted remifentanil infusion was running before' : 'No accepted remifentanil infusion was running before'} the stimulus. In the following minute, heart rate rose ${(hrRise * 100).toFixed(1)}% and mean arterial pressure rose ${(mapRise * 100).toFixed(1)}% from their immediate pre-stimulus values.`,
          atTick: runningAtOnset?.tick,
        } satisfies ObjectiveFinding;
      }

      if ((history.at(-1)?.tick ?? 0) < 5400) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the quiet-phase recovery could be assessed.',
        } satisfies ObjectiveFinding;
      }
      const reduced = acceptedInfusions.find((entry) => entry.tick >= offset
        && Number(entry.data?.newRate ?? 0) < Number(entry.data?.previousRate ?? 0));
      const final = history.filter((entry) => entry.tick <= 5400).at(-1);
      const finalMap = Number(final?.state.meanArterialMmHg ?? 0);
      const finalDepth = Number(final?.state.depthIndex ?? Infinity);
      const timely = reduced !== undefined && reduced.tick <= offset + 300;
      const recovered = finalMap >= 65 && finalDepth >= 40 && finalDepth <= 60;
      return {
        ...base,
        outcome: timely && recovered ? 'met' : timely || recovered ? 'partly-met' : 'not-met',
        finding: `${reduced ? `The accepted infusion reduction followed stimulus offset by ${((reduced.tick - offset) / TICKS_PER_SECOND).toFixed(0)} seconds` : 'No accepted remifentanil reduction followed stimulus offset'}. At scenario end, mean arterial pressure was ${finalMap.toFixed(0)} mmHg and predicted depth was ${finalDepth.toFixed(0)}.`,
        atTick: reduced?.tick ?? final?.tick,
      } satisfies ObjectiveFinding;
    }

    if ([
      'recognize-inspired-carbon-dioxide', 'bridge-with-fresh-gas-flow',
      'replace-exhausted-absorbent',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find((entry) => entry.type === 'equipment-failure'
        && entry.target === 'co2-absorbent-exhaustion')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the circle-system rebreathing pattern appeared.',
        } satisfies ObjectiveFinding;
      }
      const assessed = log.find((entry) => entry.tick >= onset
        && entry.eventId.startsWith('circuit-capnogram-assessed-'));
      const replaced = log.find((entry) => entry.tick >= onset
        && entry.eventId.startsWith('circuit-absorbent-replaced-'));
      const flow = actions.find((entry) => entry.tick >= onset
        && entry.type === 'ventilator'
        && Number(entry.payload.freshGasFlowLPerMin ?? 0) >= 10
        && log.some((accepted) => accepted.tick === entry.tick
          && accepted.eventId === `ventilator-${entry.tick}`));

      if (objective.id === 'recognize-inspired-carbon-dioxide') {
        const delay = assessed ? (assessed.tick - onset) / TICKS_PER_SECOND : null;
        const beforeReplacement = assessed !== undefined
          && (replaced === undefined || assessed.tick <= replaced.tick);
        return {
          ...base,
          outcome: beforeReplacement && delay !== null && delay <= 30 ? 'met'
            : beforeReplacement ? 'partly-met' : 'not-met',
          finding: assessed
            ? `Capnogram assessment was accepted ${delay?.toFixed(0)} seconds after the inspiratory baseline began to rise${beforeReplacement ? ', before absorber replacement' : ', after absorber replacement'}. This records screen interpretation, not physical inspection.`
            : 'No accepted capnogram assessment identified the raised inspiratory baseline.',
          atTick: assessed?.tick,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'bridge-with-fresh-gas-flow') {
        const delay = flow ? (flow.tick - onset) / TICKS_PER_SECOND : null;
        const beforeReplacement = flow !== undefined
          && (replaced === undefined || flow.tick <= replaced.tick);
        return {
          ...base,
          outcome: beforeReplacement && delay !== null && delay <= 60 ? 'met'
            : beforeReplacement ? 'partly-met' : 'not-met',
          finding: flow
            ? `Fresh-gas flow reached ${Number(flow.payload.freshGasFlowLPerMin).toFixed(0)} L/min ${delay?.toFixed(0)} seconds after onset${beforeReplacement ? ', before definitive correction' : ', after the absorbent was already replaced'}. The response follows a bounded teaching curve.`
            : 'No accepted fresh-gas-flow setting of at least 10 L/min was recorded after onset.',
          atTick: flow?.tick,
        } satisfies ObjectiveFinding;
      }

      const baselineEtco2 = history.filter((entry) => entry.tick < onset).at(-1)?.state.etco2MmHg;
      const recovered = replaced && baselineEtco2 !== undefined
        ? history.find((entry) => entry.tick > replaced.tick
          && Number(entry.state.etco2MmHg ?? Infinity) <= baselineEtco2 + 1)
        : undefined;
      const correctOrder = assessed !== undefined && replaced !== undefined
        && assessed.tick <= replaced.tick;
      const delay = replaced ? (replaced.tick - onset) / TICKS_PER_SECOND : null;
      return {
        ...base,
        outcome: correctOrder && delay !== null && delay <= 90 && recovered ? 'met'
          : correctOrder || recovered ? 'partly-met' : 'not-met',
        finding: !replaced
          ? 'No accepted absorbent replacement followed the rebreathing pattern.'
          : `${correctOrder ? 'Absorbent replacement followed capnogram assessment' : 'Absorbent replacement did not follow an accepted assessment'} ${delay?.toFixed(0)} seconds after onset${recovered ? '; end-tidal carbon dioxide later returned within 1 mmHg of the pre-fault value' : '; the recorded session did not confirm carbon-dioxide washout'}. Physical exchange is not assessed.`,
        atTick: recovered?.tick ?? replaced?.tick,
      } satisfies ObjectiveFinding;
    }

    if ([
      'verify-invasive-pressure-independently', 'correct-transducer-level',
      'assess-arterial-dynamic-response',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find((entry) => entry.type === 'artifact'
        && entry.target === 'arterial-transducer-misleveled')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the invasive pressure artifact appeared.',
        } satisfies ObjectiveFinding;
      }
      const cuff = log.find((entry) => entry.tick >= onset && entry.eventId.startsWith('nibp-result-'));
      const level = log.find((entry) => entry.tick >= onset && entry.eventId.startsWith('arterial-level-zero-'));
      const assessed = log.find((entry) => entry.tick >= onset
        && entry.eventId.startsWith('arterial-waveform-assessed-'));
      const restored = log.find((entry) => entry.tick >= onset
        && entry.eventId.startsWith('arterial-response-restored-'));

      if (objective.id === 'verify-invasive-pressure-independently') {
        const treatment = log.find((entry) => entry.tick >= onset
          && (entry.eventId.startsWith('bolus-') || entry.eventId.startsWith('infusion-')
            || entry.eventId.startsWith('fluid-')));
        const delay = cuff ? (cuff.tick - onset) / TICKS_PER_SECOND : null;
        const beforeTreatment = cuff !== undefined && (treatment === undefined || cuff.tick <= treatment.tick);
        return {
          ...base,
          outcome: beforeTreatment && delay !== null && delay <= 60 ? 'met'
            : cuff ? 'partly-met' : 'not-met',
          finding: cuff
            ? `The independent cuff completed ${delay?.toFixed(0)} seconds after the display changed and reported MAP ${Number(cuff.data?.meanArterialMmHg ?? 0).toFixed(0)} mmHg${beforeTreatment ? ', before any accepted fluid or drug treatment' : ', after an accepted patient-changing action'}.`
            : 'No accepted independent cuff result followed the invasive display change.',
          atTick: cuff?.tick,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'correct-transducer-level') {
        const delay = level ? (level.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay !== null && delay <= 60 ? 'met' : level ? 'partly-met' : 'not-met',
          finding: level
            ? `Level-and-zero intent removed the 20 cm hydrostatic offset ${delay?.toFixed(0)} seconds after the display changed. This records intent, not physical technique.`
            : 'No accepted level-and-zero action removed the hydrostatic offset.',
          atTick: level?.tick,
        } satisfies ObjectiveFinding;
      }

      const correctOrder = assessed !== undefined && restored !== undefined && assessed.tick <= restored.tick;
      return {
        ...base,
        outcome: correctOrder ? 'met' : assessed || restored ? 'partly-met' : 'not-met',
        finding: correctOrder
          ? 'Waveform assessment identified over-damping before accepted pressure-tubing replacement restored normal morphology. Both controls record screen intent rather than equipment skill.'
          : assessed
            ? 'Over-damped morphology was assessed, but no accepted pressure-tubing replacement restored the response.'
            : 'No accepted waveform assessment preceded dynamic-response correction.',
        atTick: restored?.tick ?? assessed?.tick,
      } satisfies ObjectiveFinding;
    }

    if ([
      'cross-check-capnography-loss', 'preserve-stable-ventilation',
      'restore-capnography-sampling',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find((entry) => entry.type === 'artifact'
        && entry.target === 'sampling-line-obstruction')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the carbon-dioxide sampling line became obstructed.',
        } satisfies ObjectiveFinding;
      }
      const crossCheck = log.find((entry) =>
        entry.eventId.startsWith('capnography-cross-check-') && entry.tick >= onset);
      const restored = log.find((entry) =>
        entry.eventId.startsWith('capnography-line-restored-') && entry.tick >= onset);
      const crossCheckDelay = crossCheck ? (crossCheck.tick - onset) / TICKS_PER_SECOND : null;
      const restoreDelay = restored ? (restored.tick - onset) / TICKS_PER_SECOND : null;

      if (objective.id === 'cross-check-capnography-loss') {
        const beforeRestore = crossCheck !== undefined
          && (restored === undefined || crossCheck.tick <= restored.tick);
        return {
          ...base,
          outcome: beforeRestore && crossCheckDelay !== null && crossCheckDelay <= 30
            ? 'met'
            : beforeRestore && crossCheckDelay !== null && crossCheckDelay <= 60
              ? 'partly-met'
              : 'not-met',
          finding: crossCheckDelay === null
            ? 'No accepted independent ventilation cross-check was recorded.'
            : `An independent ventilation cross-check was recorded ${crossCheckDelay.toFixed(0)} seconds after sampled capnography disappeared${beforeRestore ? ', before the sample path was restored' : ', after the sample path was already restored'}. This records screen intent, not a physical examination.`,
          atTick: crossCheck?.tick,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'preserve-stable-ventilation') {
        const until = restored?.tick ?? history.at(-1)?.tick ?? onset;
        const interval = history.filter((entry) => entry.tick >= onset && entry.tick <= until);
        const lowestSaturation = interval.length > 0
          ? Math.min(...interval.map((entry) => entry.state.spo2Percent ?? 0)) : 0;
        const lowestRate = interval.length > 0
          ? Math.min(...interval.map((entry) => entry.state.respiratoryRateBpm ?? 0)) : 0;
        const patientChanging = actions.find((entry) => entry.tick >= onset && entry.tick <= until
          && ['ventilator', 'laryngoscopy', 'airway-device', 'airway-maneuver'].includes(entry.type));
        const stable = lowestSaturation >= 94 && lowestRate > 0;
        return {
          ...base,
          outcome: stable && !patientChanging ? 'met' : stable ? 'partly-met' : 'not-met',
          finding: `Available screen evidence before restoration showed a lowest saturation of ${lowestSaturation.toFixed(0)}% and respiratory rate of ${lowestRate.toFixed(0)}/min. ${patientChanging ? `A patient-changing ${patientChanging.type} action was recorded before the sample path was restored.` : 'No airway instrumentation or commanded-breath change was recorded.'}`,
          atTick: patientChanging?.tick ?? restored?.tick,
        } satisfies ObjectiveFinding;
      }

      const crossCheckedFirst = crossCheck !== undefined && restored !== undefined
        && crossCheck.tick <= restored.tick;
      return {
        ...base,
        outcome: restored === undefined ? 'not-met'
          : crossCheckedFirst && restoreDelay !== null && restoreDelay <= 60 ? 'met' : 'partly-met',
        finding: restored === undefined
          ? 'No accepted sampling-line reconnection was recorded.'
          : `The sample path was restored ${restoreDelay?.toFixed(0)} seconds after signal loss${crossCheckedFirst ? ', after the independent ventilation cross-check' : ', before an accepted independent ventilation cross-check'}. The waveform restoration is a deterministic equipment action, not a troubleshooting skill assessment.`,
        atTick: restored?.tick,
      } satisfies ObjectiveFinding;
    }

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
      'call-for-high-spinal-help', 'support-high-spinal-breathing',
      'support-high-spinal-circulation', 'protect-high-spinal-oxygenation',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find((event) => event.type === 'high-spinal')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the modeled high-spinal event.',
        } satisfies ObjectiveFinding;
      }
      const windowEnd = onset + 60 * TICKS_PER_SECOND;
      const help = log.find((entry) => entry.eventId.startsWith('airway-help-requested-')
        && entry.data?.context === 'high-spinal');

      if (objective.id === 'call-for-high-spinal-help') {
        const delay = help ? (help.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 30 ? 'met' : delay <= 60 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'No accepted high-spinal help request was recorded.'
            : `Help was requested ${delay.toFixed(0)} seconds after the modeled event. Team arrival, communication, and performance are not simulated.`,
          atTick: help?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'support-high-spinal-breathing') {
        let settings = {
          fio2: scenario.equipment.ventilator.fio2,
          delivering: scenario.equipment.ventilator.delivering,
          tidalVolumeMl: scenario.equipment.ventilator.tidalVolumeMl,
          respiratoryRateBpm: scenario.equipment.ventilator.respiratoryRateBpm,
        };
        let achievedAt: number | null = settings.fio2 >= 0.95 && settings.delivering ? onset : null;
        for (const action of actions.filter((entry) => entry.type === 'ventilator'
          && entry.tick >= onset && entry.tick <= windowEnd).sort((a, b) => a.tick - b.tick)) {
          const numeric = (value: unknown, current: number, min: number, max: number) => {
            const requested = Number(value);
            return value === undefined || !Number.isFinite(requested)
              ? current : Math.min(max, Math.max(min, requested));
          };
          settings = {
            fio2: numeric(action.payload.fio2, settings.fio2, 0.21, 1),
            delivering: typeof action.payload.delivering === 'boolean'
              ? action.payload.delivering : settings.delivering,
            tidalVolumeMl: numeric(action.payload.tidalVolumeMl, settings.tidalVolumeMl, 0, 1500),
            respiratoryRateBpm: numeric(
              action.payload.respiratoryRateBpm, settings.respiratoryRateBpm, 0, 60,
            ),
          };
          if (achievedAt === null && settings.fio2 >= 0.95 && settings.delivering
            && settings.tidalVolumeMl > 0 && settings.respiratoryRateBpm > 0) {
            achievedAt = action.tick;
          }
        }
        const delay = achievedAt === null ? null : (achievedAt - onset) / TICKS_PER_SECOND;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 60 ? 'met' : 'not-met',
          finding: delay === null
            ? 'At least 95% inspired oxygen and active breath delivery were not both in effect within 60 seconds.'
            : `At least 95% inspired oxygen with active breath delivery was established ${delay.toFixed(0)} seconds after the modeled event. This assesses screen settings, not mask seal or airway skill.`,
          atTick: achievedAt ?? windowEnd,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'support-high-spinal-circulation') {
        const fluid = log.find((entry) => entry.eventId.startsWith('fluid-')
          && entry.tick >= onset && entry.tick <= windowEnd
          && Number(entry.data?.volumeMl) >= 250 && Number(entry.data?.volumeMl) <= 500);
        const ephedrine = log.find((entry) => entry.eventId.startsWith('ephedrine-iv-')
          && entry.tick >= onset && entry.tick <= windowEnd);
        return {
          ...base,
          outcome: fluid && ephedrine ? 'met' : fluid || ephedrine ? 'partly-met' : 'not-met',
          finding: `${fluid ? `${Number(fluid.data?.volumeMl).toFixed(0)} mL crystalloid was accepted within 60 seconds.` : 'No 250–500 mL crystalloid bolus was accepted within 60 seconds.'} ${ephedrine ? `${Number(ephedrine.data?.doseMg).toFixed(0)} mg IV ephedrine was accepted within 60 seconds.` : 'No listed IV ephedrine bolus was accepted within 60 seconds.'} The response is a bounded teaching calibration.`,
          atTick: Math.max(fluid?.tick ?? onset, ephedrine?.tick ?? onset),
        } satisfies ObjectiveFinding;
      }

      const postOnset = history.filter((entry) => entry.tick >= onset);
      const lowest = postOnset.length > 0
        ? Math.min(...postOnset.map((entry) => entry.state.spo2Percent ?? 100)) : null;
      return {
        ...base,
        outcome: lowest === null ? 'not-exercised'
          : lowest >= 92 ? 'met' : lowest >= 88 ? 'partly-met' : 'not-met',
        finding: lowest === null
          ? 'No post-event oxygen-saturation trace was available.'
          : `The lowest post-event oxygen saturation was ${lowest.toFixed(0)}%.`,
        atTick: postOnset.at(-1)?.tick ?? onset,
      } satisfies ObjectiveFinding;
    }

    if ([
      'escalate-venous-air-pattern', 'control-venous-air-entry',
      'support-venous-air-oxygenation', 'reassess-venous-air-recovery',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find((event) => event.type === 'venous-air-embolism')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the modeled venous-air event.',
        } satisfies ObjectiveFinding;
      }
      const help = log.find((entry) => entry.eventId.startsWith('airway-help-requested-')
        && entry.data?.context === 'venous-air-embolism');
      const sourceControl = log.find(
        (entry) => entry.eventId.startsWith('venous-air-entry-controlled-'),
      );

      if (objective.id === 'escalate-venous-air-pattern') {
        const delay = help ? (help.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 30 ? 'met' : delay <= 60 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'No accepted help request for the abrupt cardiopulmonary change was recorded.'
            : `Help was requested ${delay.toFixed(0)} seconds after the modeled event. Team arrival and performance are not simulated.`,
          atTick: help?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'control-venous-air-entry') {
        const delay = sourceControl ? (sourceControl.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 30 ? 'met' : delay <= 60 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'No accepted intent to stop further air entry was recorded.'
            : `Intent to stop further entry was accepted ${delay.toFixed(0)} seconds after the modeled event. Finding or physically controlling the source is not simulated.`,
          atTick: sourceControl?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'support-venous-air-oxygenation') {
        const windowEnd = onset + 60 * TICKS_PER_SECOND;
        let settings = {
          fio2: scenario.equipment.ventilator.fio2,
          delivering: scenario.equipment.ventilator.delivering,
          tidalVolumeMl: scenario.equipment.ventilator.tidalVolumeMl,
          respiratoryRateBpm: scenario.equipment.ventilator.respiratoryRateBpm,
        };
        let achievedAt: number | null = null;
        for (const action of actions.filter((entry) => entry.type === 'ventilator'
          && entry.tick >= onset && entry.tick <= windowEnd).sort((a, b) => a.tick - b.tick)) {
          const finite = (value: unknown, current: number, min: number, max: number) => {
            const requested = Number(value);
            return value === undefined || !Number.isFinite(requested)
              ? current : Math.min(max, Math.max(min, requested));
          };
          settings = {
            fio2: finite(action.payload.fio2, settings.fio2, 0.21, 1),
            delivering: typeof action.payload.delivering === 'boolean'
              ? action.payload.delivering : settings.delivering,
            tidalVolumeMl: finite(action.payload.tidalVolumeMl, settings.tidalVolumeMl, 0, 1500),
            respiratoryRateBpm: finite(
              action.payload.respiratoryRateBpm, settings.respiratoryRateBpm, 0, 60,
            ),
          };
          if (achievedAt === null && settings.fio2 >= 1 && settings.delivering
            && settings.tidalVolumeMl > 0 && settings.respiratoryRateBpm > 0) {
            achievedAt = action.tick;
          }
        }
        const delay = achievedAt === null ? null : (achievedAt - onset) / TICKS_PER_SECOND;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : 'met',
          finding: delay === null
            ? '100% inspired oxygen and active breath delivery were not both in effect within 60 seconds.'
            : `100% inspired oxygen with active breath delivery was established ${delay.toFixed(0)} seconds after the modeled event. This assesses screen settings, not airway or mask skill.`,
          atTick: achievedAt ?? windowEnd,
        } satisfies ObjectiveFinding;
      }

      if (!sourceControl) {
        return {
          ...base, outcome: 'not-met',
          finding: 'End-tidal carbon-dioxide recovery was not credited because no accepted source-control intent preceded it.',
          atTick: history.at(-1)?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      const recovered = history.find((entry) => entry.tick >= sourceControl.tick
        && (entry.state.etco2MmHg ?? 0) >= 28);
      return {
        ...base,
        outcome: recovered ? 'met' : 'not-met',
        finding: recovered
          ? `End-tidal carbon dioxide recovered to ${(recovered.state.etco2MmHg ?? 0).toFixed(0)} mmHg after accepted source control. This is a teaching trajectory, not diagnostic confirmation or an individual prognosis.`
          : 'End-tidal carbon dioxide had not recovered to 28 mmHg after accepted source control before the session ended.',
        atTick: recovered?.tick ?? history.at(-1)?.tick ?? onset,
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
      'prepare-rescue-oxygen-reserve', 'act-on-prior-airway-record',
      'limit-attempts-and-call-for-help',
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

      if (objective.id === 'act-on-prior-airway-record') {
        const firstAttempt = laryngoscopyStarts[0];
        if (!firstAttempt) {
          return {
            ...base, outcome: help ? 'partly-met' : 'not-exercised',
            finding: help
              ? 'Airway help was requested, but no accepted laryngoscopy attempt followed during this session.'
              : 'No accepted airway-help request or laryngoscopy attempt was recorded.',
            atTick: help?.tick,
          } satisfies ObjectiveFinding;
        }
        const usedBeforeAttempt = help !== undefined && help.tick < firstAttempt.tick;
        return {
          ...base,
          outcome: usedBeforeAttempt ? 'met' : help ? 'partly-met' : 'not-met',
          finding: help
            ? `Airway help was requested ${Math.abs((firstAttempt.tick - help.tick) / TICKS_PER_SECOND).toFixed(0)} seconds ${usedBeforeAttempt ? 'before' : 'after'} the first laryngoscopy began. The record captures escalation timing, not communication quality, team arrival, or provider skill.`
            : 'No accepted airway-help request was recorded before the first laryngoscopy began.',
          atTick: help?.tick ?? firstAttempt.tick,
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
        const helpWasEarly = help !== undefined && helpDelay! <= 30;
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
      const first = log.find((entry) => entry.eventId.startsWith('fluid-') && entry.tick >= onset);
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
      const fluidMl = log
        .filter((entry) => entry.eventId.startsWith('fluid-') && entry.tick <= controlTick)
        .reduce((sum, entry) => sum + Number(entry.data?.volumeMl ?? 0), 0);
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

    if (objective.id === 'identify-dilutional-coagulopathy') {
      const onset = scenario.timeline.find((event) => event.id === 'diffuse-oozing')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return { ...base, outcome: 'not-exercised', finding: 'The session ended before diffuse oozing was reported.' } satisfies ObjectiveFinding;
      }
      const panel = log.find((entry) => entry.tick >= onset
        && entry.eventId.startsWith('coagulation-labs-'));
      if (!panel) {
        return { ...base, outcome: 'not-met', finding: 'No accepted coagulation panel followed the diffuse-oozing cue.' } satisfies ObjectiveFinding;
      }
      const delaySeconds = (panel.tick - onset) / TICKS_PER_SECOND;
      const ratio = Number(panel.data?.prothrombinTimeRatio ?? 0);
      const fibrinogen = Number(panel.data?.fibrinogenGPerL ?? 0);
      const abnormal = ratio > 1.5;
      return {
        ...base,
        outcome: abnormal && delaySeconds <= 60 ? 'met' : abnormal ? 'partly-met' : 'not-met',
        finding: `The first accepted panel followed the cue by ${delaySeconds.toFixed(0)} seconds: `
          + `PT ratio ${ratio.toFixed(2)} × normal and fibrinogen ${fibrinogen.toFixed(1)} g/L.`,
        atTick: panel.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'give-lab-guided-plasma') {
      const abnormalPanel = log.find((entry) => entry.eventId.startsWith('coagulation-labs-')
        && Number(entry.data?.prothrombinTimeRatio ?? 0) > 1.5);
      const plasma = abnormalPanel && log.find((entry) => entry.tick >= abnormalPanel.tick
        && entry.eventId.startsWith('blood-product-fresh-frozen-plasma-'));
      if (!plasma) {
        return {
          ...base,
          outcome: 'not-met',
          finding: abnormalPanel
            ? 'No accepted plasma followed the abnormal panel while modeled bleeding was active.'
            : 'No accepted abnormal panel preceded plasma selection.',
        } satisfies ObjectiveFinding;
      }
      const units = Number(plasma.data?.units ?? 0);
      return {
        ...base,
        outcome: units === 4 ? 'met' : 'partly-met',
        finding: `${units.toFixed(0)} plasma unit${units === 1 ? '' : 's'} were accepted after the abnormal panel. `
          + `PT ratio changed from ${Number(plasma.data?.prothrombinTimeRatioBefore ?? 0).toFixed(2)} `
          + `to ${Number(plasma.data?.prothrombinTimeRatioAfter ?? 0).toFixed(2)} × normal in the instantaneous teaching model.`,
        atTick: plasma.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'reassess-coagulation-response') {
      const plasma = log.find((entry) => entry.eventId.startsWith('blood-product-fresh-frozen-plasma-'));
      if (!plasma) {
        return { ...base, outcome: 'not-exercised', finding: 'No accepted plasma response was available to reassess.' } satisfies ObjectiveFinding;
      }
      const beforeRatio = Number(plasma.data?.prothrombinTimeRatioBefore ?? 0);
      const beforeFibrinogen = Number(plasma.data?.fibrinogenBeforeGPerL ?? 0);
      const panel = log.find((entry) => entry.tick > plasma.tick
        && entry.eventId.startsWith('coagulation-labs-'));
      if (!panel) {
        return { ...base, outcome: 'not-met', finding: 'No accepted follow-up panel was obtained after plasma.' } satisfies ObjectiveFinding;
      }
      const afterRatio = Number(panel.data?.prothrombinTimeRatio ?? 0);
      const afterFibrinogen = Number(panel.data?.fibrinogenGPerL ?? 0);
      const delaySeconds = (panel.tick - plasma.tick) / TICKS_PER_SECOND;
      const improved = afterRatio < beforeRatio && afterFibrinogen > beforeFibrinogen;
      return {
        ...base,
        outcome: improved && delaySeconds <= 60 ? 'met' : improved ? 'partly-met' : 'not-met',
        finding: `The follow-up panel was obtained ${delaySeconds.toFixed(0)} seconds after plasma: `
          + `PT ratio ${afterRatio.toFixed(2)} × normal and fibrinogen ${afterFibrinogen.toFixed(1)} g/L.`,
        atTick: panel.tick,
      } satisfies ObjectiveFinding;
    }

    if ([
      'preoxygenate-older-adult', 'titrate-geriatric-propofol',
      'protect-geriatric-perfusion', 'ventilate-geriatric-induction',
    ].includes(objective.id)) {
      const first = log.find((entry) => entry.eventId.startsWith('bolus-propofol-'));
      const sessionEnd = history.at(-1)?.tick ?? 0;
      if (!first) {
        return {
          ...base,
          outcome: sessionEnd < 1200 ? 'not-exercised' : 'not-met',
          finding: sessionEnd < 1200
            ? 'The session ended before the induction practice window began.'
            : 'No accepted propofol induction dose was recorded.',
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'preoxygenate-older-adult') {
        const before = history.filter((entry) => entry.tick <= first.tick).at(-1);
        const endTidalOxygen = Number(before?.state.endTidalO2Fraction ?? 0);
        return {
          ...base,
          outcome: endTidalOxygen >= 0.85 ? 'met' : 'not-met',
          finding: `End-tidal oxygen was ${(endTidalOxygen * 100).toFixed(0)}% before the first accepted propofol dose. Inspired oxygen alone does not prove that reserve reached the patient.`,
          atTick: first.tick,
        } satisfies ObjectiveFinding;
      }

      const boluses = log.filter((entry) => entry.eventId.startsWith('bolus-propofol-'));
      if (objective.id === 'titrate-geriatric-propofol') {
        const totalMg = boluses.reduce((sum, entry) => sum + Number(entry.data?.mass ?? 0), 0);
        const perKg = totalMg / scenario.patient.weightKg;
        const largest = Math.max(...boluses.map((entry) => Number(entry.data?.mass ?? 0)));
        const shortestGap = boluses.length < 2 ? Infinity : Math.min(...boluses.slice(1)
          .map((entry, index) => entry.tick - boluses[index]!.tick));
        const inRange = perKg >= 1 && perKg <= 1.5;
        const incremental = largest <= 20 && shortestGap >= 10 * TICKS_PER_SECOND;
        return {
          ...base,
          outcome: inRange && incremental ? 'met' : inRange || incremental ? 'partly-met' : 'not-met',
          finding: `${boluses.length} accepted increment${boluses.length === 1 ? '' : 's'} totaled ${totalMg.toFixed(0)} mg (${perKg.toFixed(2)} mg/kg); the largest was ${largest.toFixed(0)} mg${Number.isFinite(shortestGap) ? ` and the shortest interval was ${(shortestGap / TICKS_PER_SECOND).toFixed(0)} seconds` : ''}. The displayed depth is a population-model trajectory, not proof of individual unconsciousness.`,
          atTick: boluses.at(-1)?.tick,
        } satisfies ObjectiveFinding;
      }

      const afterDose = history.filter((entry) => entry.tick >= first.tick);
      if (afterDose.length === 0) {
        return {
          ...base,
          outcome: 'not-exercised',
          finding: 'The session ended before a post-dose physiology sample was recorded.',
          atTick: first.tick,
        } satisfies ObjectiveFinding;
      }
      if (objective.id === 'protect-geriatric-perfusion') {
        const nadir = afterDose.reduce((lowest, entry) => Number(entry.state.meanArterialMmHg) < Number(lowest.state.meanArterialMmHg) ? entry : lowest);
        const map = Number(nadir.state.meanArterialMmHg);
        return {
          ...base,
          outcome: map >= 65 ? 'met' : 'not-met',
          finding: `Mean arterial pressure reached a nadir of ${map.toFixed(0)} mmHg after the first accepted dose in this one bounded teaching profile.`,
          atTick: nadir.tick,
        } satisfies ObjectiveFinding;
      }

      const ventilation = actions.find((action) => action.type === 'ventilator'
        && action.tick > first.tick && action.payload.delivering === true);
      const tidalVolume = Number(ventilation?.payload.tidalVolumeMl ?? 0);
      const mlPerKg = tidalVolume / scenario.patient.weightKg;
      const ageAppropriate = mlPerKg >= 6 && mlPerKg <= 8;
      const minSpo2 = afterDose.reduce((lowest, entry) => Math.min(
        lowest, Number(entry.state.spo2Percent ?? 100),
      ), 100);
      return {
        ...base,
        outcome: ventilation && ageAppropriate && minSpo2 >= 92 ? 'met'
          : ventilation || minSpo2 >= 92 ? 'partly-met' : 'not-met',
        finding: ventilation
          ? `Delivered ventilation began ${(ventilation.tick - first.tick) / TICKS_PER_SECOND} seconds after the first dose at ${mlPerKg.toFixed(1)} mL/kg; saturation remained at least ${minSpo2.toFixed(1)}%. This assesses accepted screen settings, not airway or mask skill.`
          : `No accepted delivered-ventilation setting followed propofol; saturation reached ${minSpo2.toFixed(1)}%.`,
        atTick: ventilation?.tick ?? afterDose.at(-1)?.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'dose-for-the-patient') {
      const first = log.find((entry) => entry.eventId.startsWith('bolus-propofol-'));
      if (!first) {
        return { ...base, outcome: 'not-exercised', finding: 'No accepted propofol induction dose was recorded.' } satisfies ObjectiveFinding;
      }
      const perKg = Number(first.data?.mass ?? 0) / scenario.patient.weightKg;
      const doseMet = perKg <= 1.5;
      return {
        ...base,
        outcome: doseMet && stackingCount === 0 ? 'met'
          : doseMet || stackingCount === 0 ? 'partly-met' : 'not-met',
        finding: `The first accepted propofol dose was ${perKg.toFixed(2)} mg/kg. `
          + (stackingCount === 0
            ? 'No later bolus was given while the effect site was still rising.'
            : `${stackingCount} later bolus${stackingCount === 1 ? ' was' : 'es were'} given while the effect site was still rising.`),
        atTick: first.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'limit-attempts') {
      const starts = log.filter((entry) => entry.eventId.startsWith('laryngoscopy-start-'));
      if (starts.length === 0) {
        return { ...base, outcome: 'not-exercised', finding: 'No accepted laryngoscopy attempt was recorded.' } satisfies ObjectiveFinding;
      }
      const direct = starts.filter((entry) => entry.data?.technique === 'direct');
      const completed = log.filter((entry) => /^laryngoscopy-\d+$/.test(entry.eventId));
      const intubated = completed.some((entry) => entry.data?.intubated === true);
      const changedPlan = intubated
        || starts.some((entry) => entry.data?.technique === 'video')
        || log.some((entry) => entry.eventId.startsWith('ventilator-')
          && entry.tick > (direct.at(-1)?.tick ?? Infinity));
      return {
        ...base,
        outcome: direct.length <= 2 && changedPlan ? 'met'
          : direct.length <= 2 ? 'partly-met' : 'not-met',
        finding: `${direct.length} accepted direct-laryngoscopy attempt${direct.length === 1 ? ' was' : 's were'} recorded. `
          + (changedPlan
            ? 'The record then shows a secured airway, a change of technique, or a return to assisted ventilation.'
            : 'No accepted change of technique or return to assisted ventilation followed.'),
        atTick: starts.at(-1)?.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'read-the-capnogram'
      || objective.id === 'deepen-before-reaching-for-anything-else') {
      const onset = scenario.timeline.find((event) => event.id === 'bronchospasm-onset')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return { ...base, outcome: 'not-exercised', finding: 'The session ended before bronchospasm began.' } satisfies ObjectiveFinding;
      }
      const windowEnd = onset + 120 * TICKS_PER_SECOND;
      const acceptedBolus = log.find((entry) => entry.eventId.startsWith('bolus-propofol-')
        && entry.tick >= onset && entry.tick <= windowEnd);
      const acceptedVentilatorChange = log.find((entry) => entry.eventId.startsWith('ventilator-')
        && entry.tick >= onset && entry.tick <= windowEnd);

      if (objective.id === 'read-the-capnogram') {
        const response = acceptedBolus ?? acceptedVentilatorChange;
        const sample = response
          ? history.filter((entry) => entry.tick <= response.tick).at(-1)
          : undefined;
        const etco2 = sample?.state.etco2MmHg;
        return {
          ...base,
          outcome: response && etco2 !== undefined && etco2 < 55 ? 'met'
            : response ? 'partly-met' : 'not-met',
          finding: response
            ? `The first accepted response was recorded ${((response.tick - onset) / TICKS_PER_SECOND).toFixed(0)} seconds after obstruction began, while end-tidal carbon dioxide was ${Number(etco2 ?? 0).toFixed(0)} mmHg. That timing is a behavioral proxy; it cannot prove whether the waveform, reservoir bag, or number prompted the action.`
            : 'No accepted propofol or ventilator response was recorded in the first two minutes after obstruction began.',
          atTick: response?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }

      const onsetDepth = history.filter((entry) => entry.tick <= onset).at(-1)?.state.depthIndex;
      const reachedSurgicalRange = history.find((entry) => entry.tick >= onset
        && entry.tick <= windowEnd && Number(entry.state.depthIndex ?? Infinity) <= 60);
      const promptBolus = acceptedBolus !== undefined;
      return {
        ...base,
        outcome: promptBolus || reachedSurgicalRange ? 'met' : 'not-met',
        finding: promptBolus
          ? `An accepted propofol bolus was recorded ${((acceptedBolus.tick - onset) / TICKS_PER_SECOND).toFixed(0)} seconds after obstruction began.`
          : reachedSurgicalRange
            ? `Predicted depth was already ${Number(onsetDepth ?? reachedSurgicalRange.state.depthIndex).toFixed(0)} at onset and remained at or below 60 in the first two minutes.`
            : 'No accepted propofol bolus was recorded and predicted depth did not reach 60 or below in the first two minutes.',
        atTick: acceptedBolus?.tick ?? reachedSurgicalRange?.tick ?? onset,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'escalate-bronchospasm'
      || objective.id === 'give-first-line-bronchodilator') {
      const onset = scenario.timeline.find((event) => event.id === 'bronchospasm-onset')?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return { ...base, outcome: 'not-exercised', finding: 'The session ended before bronchospasm began.' } satisfies ObjectiveFinding;
      }
      if (objective.id === 'give-first-line-bronchodilator') {
        const accepted = log.find((entry) => entry.eventId.startsWith('salbutamol-nebulized-')
          && entry.tick >= onset && entry.tick <= onset + 120 * TICKS_PER_SECOND);
        return {
          ...base,
          outcome: accepted ? 'met' : 'not-met',
          finding: accepted
            ? `A confirmed 5 mg nebulized salbutamol action was accepted ${((accepted.tick - onset) / TICKS_PER_SECOND).toFixed(0)} seconds after obstruction began. The model does not establish actual lung delivery or predict individual response.`
            : 'No confirmed 5 mg nebulized salbutamol action was accepted in the first two minutes after obstruction began.',
          atTick: accepted?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      const deadline = onset + 60 * TICKS_PER_SECOND;
      const help = log.find((entry) => entry.eventId.startsWith('airway-help-requested-')
        && entry.data?.context === 'bronchospasm' && entry.tick >= onset && entry.tick <= deadline);
      const oxygen = actions.find((action) => action.type === 'ventilator'
        && action.tick >= onset && action.tick <= deadline
        && Number(action.payload.fio2) >= 1);
      return {
        ...base,
        outcome: help && oxygen ? 'met' : help || oxygen ? 'partly-met' : 'not-met',
        finding: `${help ? 'Help was requested' : 'Help was not requested'} within 60 seconds. `
          + `${oxygen ? 'A 100% inspired-oxygen setting was recorded' : 'No 100% inspired-oxygen setting was recorded'} within 60 seconds. This assesses accepted help and screen settings, not team arrival or gas delivery.`,
        atTick: help?.tick ?? oxygen?.tick ?? onset,
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
          + 'teaching-model measurement; it does not guarantee conditions at the larynx. At '
          + 'emergence, a quantitative ratio below 0.9 is residual blockade even when qualitative fade is not detectable.',
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

    if ([
      'establish-quantitative-baseline', 'reverse-recovering-block',
      'confirm-quantitative-recovery', 'maintain-anesthesia-during-block',
    ].includes(objective.id)) {
      const rocuronium = log.find((entry) => entry.eventId.startsWith('bolus-rocuronium-'));
      if (!rocuronium) {
        return {
          ...base,
          outcome: (history.at(-1)?.tick ?? 0) < 300 ? 'not-exercised' : 'not-met',
          finding: 'No accepted rocuronium dose established the declared practice course.',
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'establish-quantitative-baseline') {
        const baseline = history.filter((sample) => sample.tick < rocuronium.tick).at(-1);
        const eventRatio = Number(rocuronium.data?.preDoseTrainOfFourRatio);
        const ratio = Number.isFinite(eventRatio)
          ? eventRatio : Number(baseline?.state.trainOfFourRatio ?? 0);
        const perKg = Number(rocuronium.data?.mass ?? 0) / scenario.patient.weightKg;
        return {
          ...base,
          outcome: ratio >= 0.9 && Math.abs(perKg - 0.6) < 0.001 ? 'met'
            : ratio >= 0.9 || Math.abs(perKg - 0.6) < 0.001 ? 'partly-met' : 'not-met',
          finding: `The last recorded pre-dose train-of-four ratio was ${ratio.toFixed(2)}; the accepted rocuronium dose was ${perKg.toFixed(2)} mg/kg.`,
          atTick: rocuronium.tick,
        } satisfies ObjectiveFinding;
      }

      const reversal = log.find((entry) => entry.category === 'drug'
        && (entry.eventId.startsWith('sugammadex-') || entry.eventId.startsWith('neostigmine-')));
      const attempted = actions.find((action) => action.type === 'neuromuscular-reversal');
      if (objective.id === 'reverse-recovering-block') {
        if (!reversal) {
          return {
            ...base,
            outcome: attempted ? 'not-met' : 'not-exercised',
            finding: attempted
              ? 'A reversal was requested, but the engine refused it because the block was still developing or the selected branch did not match the measured recovery depth.'
              : 'No neuromuscular reversal was recorded.',
            atTick: attempted?.tick,
          } satisfies ObjectiveFinding;
        }
        const agent = String(reversal.data?.agent ?? 'reversal');
        const count = Number(reversal.data?.trainOfFourCount ?? 0);
        const ratio = Number(reversal.data?.trainOfFourRatio ?? 0);
        const ptc = Number(reversal.data?.postTetanicCount ?? 0);
        const dose = reversal.data?.doseMgPerKg;
        return {
          ...base,
          outcome: reversal.data?.recoveryPhase === true ? 'met' : 'not-met',
          finding: `${agent}${dose === undefined ? '' : ` ${Number(dose).toFixed(0)} mg/kg`} was accepted during recovery at TOF count ${count}, ratio ${ratio.toFixed(2)}, and post-tetanic count ${ptc}.`,
          atTick: reversal.tick,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'confirm-quantitative-recovery') {
        if (!reversal) {
          return {
            ...base, outcome: attempted ? 'not-met' : 'not-exercised',
            finding: 'No accepted reversal was available for quantitative reassessment.',
            atTick: attempted?.tick,
          } satisfies ObjectiveFinding;
        }
        const recovery = history.find((sample) => sample.tick >= reversal.tick
          && Number(sample.state.trainOfFourRatio ?? 0) >= 0.9);
        return {
          ...base,
          outcome: recovery ? 'met' : 'not-met',
          finding: recovery
            ? `The quantitative train-of-four ratio reached ${Number(recovery.state.trainOfFourRatio).toFixed(2)} after reversal. That does not establish emergence or extubation readiness.`
            : 'The recorded trace did not confirm a train-of-four ratio of at least 0.9 after reversal.',
          atTick: recovery?.tick ?? reversal.tick,
        } satisfies ObjectiveFinding;
      }

      const afterDose = history.filter((sample) => sample.tick >= rocuronium.tick);
      if (afterDose.length === 0) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before post-dose anesthesia and ventilation could be reassessed.',
          atTick: rocuronium.tick,
        } satisfies ObjectiveFinding;
      }
      const depthInRange = afterDose.filter((sample) => {
        const depth = Number(sample.state.depthIndex ?? 100);
        return depth >= 40 && depth <= 60;
      }).length / afterDose.length;
      const minSpo2 = Math.min(...afterDose.map((sample) => Number(sample.state.spo2Percent ?? 100)));
      const stoppedVentilation = actions.some((action) => action.type === 'ventilator'
        && action.tick >= rocuronium.tick && action.payload.delivering === false);
      const met = depthInRange >= 0.8 && minSpo2 >= 92 && !stoppedVentilation;
      return {
        ...base,
        outcome: met ? 'met' : depthInRange >= 0.8 || minSpo2 >= 92 ? 'partly-met' : 'not-met',
        finding: `Predicted depth was 40–60 for ${(depthInRange * 100).toFixed(0)}% of the post-dose trace, saturation remained at least ${minSpo2.toFixed(1)}%, and delivered ventilation was ${stoppedVentilation ? 'stopped by an accepted action' : 'not stopped by an accepted action'}.`,
        atTick: afterDose.at(-1)?.tick,
      } satisfies ObjectiveFinding;
    }

    if (objective.id === 'reverse-observed-block') {
      const accepted = log.find((entry) => entry.category === 'drug'
        && (entry.eventId.startsWith('sugammadex-') || entry.eventId.startsWith('neostigmine-')));
      if (!accepted) {
        const attempted = actions.find((action) => action.type === 'neuromuscular-reversal');
        return {
          ...base,
          outcome: attempted ? 'not-met' : 'not-exercised',
          finding: attempted
            ? 'A reversal was requested, but the engine did not accept it for the observed block depth and required coadministration.'
            : 'No neuromuscular reversal was recorded.',
          atTick: attempted?.tick,
        } satisfies ObjectiveFinding;
      }
      const recovery = history.find((sample) => sample.tick >= accepted.tick
        && (sample.state.trainOfFourRatio ?? 0) >= 0.9);
      return {
        ...base,
        outcome: recovery ? 'met' : 'partly-met',
        finding: recovery
          ? `The depth-matched reversal was accepted, and the quantitative train-of-four ratio reached ${(recovery.state.trainOfFourRatio ?? 0).toFixed(2)}.`
          : 'The depth-matched reversal was accepted, but the recorded trace did not confirm a quantitative train-of-four ratio of at least 0.9.',
        atTick: recovery?.tick ?? accepted.tick,
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
const LEARNER_ACTION_CATEGORIES = new Set([
  'drug', 'ventilator', 'airway', 'fluid', 'blood-product', 'laboratory', 'rhythm',
]);

export function describedEvents(log: readonly EngineEvent[], limit = 40): EngineEvent[] {
  return log
    .filter((entry) => entry.severity !== 'info' || LEARNER_ACTION_CATEGORIES.has(entry.category))
    .slice(0, limit);
}
