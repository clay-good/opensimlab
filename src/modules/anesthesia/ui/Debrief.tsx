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
  readonly moduleId?: string;
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
        moduleId={props.moduleId}
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
            hardestThing: hardestThing(episodes, props.moduleId),
            patientHarmed: episodes.length > 0,
            patientDied: false,
            ...(props.moduleId === 'emergency-medicine'
              ? { activityContext: `assessing ${sentenceCaseTitle(props.scenario.metadata.title)} in the emergency department` }
              : props.moduleId === 'cardiology'
                ? { activityContext: `reassessing ${sentenceCaseTitle(props.scenario.metadata.title)} in cardiology` }
              : {}),
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

function hardestThing(episodes: readonly Episode[], moduleId?: string): string {
  if (episodes.length === 0) return moduleId === 'emergency-medicine'
    ? 'working through uncertainty without skipping reassessment'
    : moduleId === 'cardiology'
      ? 'reading the full trajectory without letting one result close the case'
    : 'keeping a normal patient normal, which is harder than it looks';
  return episodes[0]!.label.toLowerCase();
}

function sentenceCaseTitle(title: string): string {
  const [first = '', ...rest] = title.split(' ');
  return [first === first.toUpperCase() ? first : first.toLowerCase(), ...rest].join(' ');
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
    'prepare-pediatric-inhalational-circuit': 'preoxygenation-and-safe-apnea-time',
    'follow-pediatric-end-tidal-wash-in': 'depth-monitoring-and-its-limits',
    'settle-pediatric-volatile-depth': 'depth-monitoring-and-its-limits',
    'prepare-obstetric-oxygen-reserve': 'preoxygenation-and-safe-apnea-time',
    'protect-obstetric-apnea-margin': 'preoxygenation-and-safe-apnea-time',
    'confirm-obstetric-ventilation': 'capnogram-morphology',
    'confirm-persistent-severe-hypertension': 'vasodilation-versus-hypovolemia',
    'treat-severe-pregnancy-hypertension': 'vasodilation-versus-hypovolemia',
    'start-preeclampsia-seizure-prophylaxis': 'vasodilation-versus-hypovolemia',
    'reassess-preeclampsia-response': 'vasodilation-versus-hypovolemia',
    'assess-pneumothorax-pattern': 'capnogram-morphology',
    'escalate-pneumothorax-pattern': 'vasodilation-versus-hypovolemia',
    'support-pneumothorax-oxygenation': 'capnogram-morphology',
    'decompress-pneumothorax': 'vasodilation-versus-hypovolemia',
    'reassess-pneumothorax-recovery': 'vasodilation-versus-hypovolemia',
    'review-aspiration-risk-cues': 'aspiration-risk-is-more-than-fasting-time',
    'classify-elevated-aspiration-risk': 'aspiration-risk-is-more-than-fasting-time',
    'choose-shared-elective-plan': 'aspiration-risk-is-more-than-fasting-time',
    'avoid-blanket-glp1-rule': 'aspiration-risk-is-more-than-fasting-time',
    'review-emergence-quantitative-monitor': 'train-of-four-and-residual-blockade',
    'recognize-emergence-residual-blockade': 'train-of-four-and-residual-blockade',
    'defer-extubation-during-residual-blockade': 'train-of-four-and-residual-blockade',
    'separate-recovery-from-extubation-readiness': 'train-of-four-and-residual-blockade',
    'support-delayed-emergence-patient': 'preoxygenation-and-safe-apnea-time',
    'reconcile-delayed-emergence-exposures': 'train-of-four-and-residual-blockade',
    'check-delayed-emergence-metabolic-causes': 'capnogram-morphology',
    'find-delayed-emergence-lateralizing-sign': 'depth-monitoring-and-its-limits',
    'escalate-delayed-emergence-neurologic-pattern': 'depth-monitoring-and-its-limits',
    'confirm-extubation-quantitative-recovery': 'train-of-four-and-residual-blockade',
    'assess-awake-airway-protection': 'depth-monitoring-and-its-limits',
    'assess-extubation-gas-exchange': 'capnogram-morphology',
    'plan-extubation-risk-and-rescue': 'airway-assessment-predicts-poorly',
    'integrate-awake-extubation-readiness': 'train-of-four-and-residual-blockade',
    'recognize-post-extubation-obstruction': 'capnogram-morphology',
    'support-post-extubation-airway': 'preoxygenation-and-safe-apnea-time',
    'confirm-post-extubation-recovery': 'capnogram-morphology',
    'recognize-opioid-ventilatory-impairment': 'capnogram-morphology',
    'support-opioid-impaired-ventilation': 'preoxygenation-and-safe-apnea-time',
    'prevent-further-opioid-harm': 'hypnotic-opioid-synergy',
    'escalate-opioid-reversal': 'hypnotic-opioid-synergy',
    'reassess-opioid-ventilatory-recovery': 'capnogram-morphology',
    'recognize-perioperative-hypothermia': 'depth-monitoring-and-its-limits',
    'start-active-surface-warming': 'vasodilation-versus-hypovolemia',
    'warm-bulk-perioperative-fluids': 'vasodilation-versus-hypovolemia',
    'reassess-perioperative-rewarming': 'depth-monitoring-and-its-limits',
    'confirm-perioperative-hyperglycemia': 'depth-monitoring-and-its-limits',
    'use-bounded-insulin-protocol': 'vasodilation-versus-hypovolemia',
    'reassess-perioperative-glucose': 'depth-monitoring-and-its-limits',
    'review-cied-device-record': 'depth-monitoring-and-its-limits',
    'review-cied-procedure-risk': 'depth-monitoring-and-its-limits',
    'choose-coordinated-cied-plan': 'depth-monitoring-and-its-limits',
    'document-cied-backup-and-restoration': 'depth-monitoring-and-its-limits',
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
        && ['ventricular-fibrillation', 'asystole', 'pea'].includes(event.target ?? ''))?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the scripted cardiac arrest.',
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
      'confirm-persistent-severe-hypertension', 'treat-severe-pregnancy-hypertension',
      'start-preeclampsia-seizure-prophylaxis', 'reassess-preeclampsia-response',
    ].includes(objective.id)) {
      const firstPressure = log.find((entry) =>
        entry.eventId.startsWith('preeclampsia-blood-pressure-'));
      const labetalol = log.find((entry) => entry.eventId.startsWith('labetalol-iv-'));
      const magnesium = log.find((entry) => entry.eventId.startsWith('magnesium-sulfate-iv-'));

      if (objective.id === 'confirm-persistent-severe-hypertension') {
        if (!firstPressure) return {
          ...base, outcome: 'not-met', finding: 'No accepted repeat blood pressure was recorded.',
        } satisfies ObjectiveFinding;
        const systolic = Number(firstPressure.data?.systolicMmHg ?? 0);
        const diastolic = Number(firstPressure.data?.diastolicMmHg ?? 0);
        const severe = systolic >= 160 || diastolic >= 110;
        return {
          ...base, outcome: severe ? 'met' : 'not-met',
          finding: `The first accepted repeat was ${systolic.toFixed(0)}/${diastolic.toFixed(0)} mmHg${severe ? ', confirming the declared severe-range pattern.' : ', which did not reproduce a severe-range value in this run.'}`,
          atTick: firstPressure.tick,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'treat-severe-pregnancy-hypertension') {
        const ordered = firstPressure && labetalol && labetalol.tick >= firstPressure.tick;
        const delayMinutes = firstPressure && labetalol
          ? (labetalol.tick - firstPressure.tick) / TICKS_PER_SECOND / 60 : null;
        return {
          ...base,
          outcome: ordered && delayMinutes !== null && delayMinutes <= 60 ? 'met' : 'not-met',
          finding: !labetalol
            ? 'No accepted labetalol action was recorded.'
            : !ordered
              ? 'Labetalol was accepted before an accepted confirming pressure.'
              : `Labetalol 20 mg IV was accepted ${delayMinutes!.toFixed(1)} minutes after confirmation, inside the 60-minute emergency-treatment window. The response is a bounded trajectory, not individual pharmacokinetics.`,
          atTick: labetalol?.tick,
        } satisfies ObjectiveFinding;
      }

      if (objective.id === 'start-preeclampsia-seizure-prophylaxis') {
        const ordered = firstPressure && magnesium && magnesium.tick >= firstPressure.tick;
        const distinguished = magnesium?.data?.antihypertensive === false
          && magnesium.data?.indication === 'seizure-prophylaxis';
        return {
          ...base, outcome: ordered && distinguished ? 'met' : 'not-met',
          finding: !magnesium
            ? 'No accepted magnesium-sulfate loading action was recorded.'
            : ordered && distinguished
              ? 'Magnesium sulfate 4 g IV was accepted for seizure prophylaxis after confirmation. It produced no antihypertensive effect in the model.'
              : 'The recorded magnesium action did not follow an accepted confirming pressure.',
          atTick: magnesium?.tick,
        } satisfies ObjectiveFinding;
      }

      if (!labetalol) return {
        ...base, outcome: 'not-exercised',
        finding: 'No accepted antihypertensive response was available to reassess.',
      } satisfies ObjectiveFinding;
      const followUp = log.find((entry) =>
        entry.eventId.startsWith('preeclampsia-blood-pressure-') && entry.tick > labetalol.tick);
      if (!followUp) return {
        ...base, outcome: 'not-met', finding: 'No accepted follow-up pressure was recorded after labetalol.',
        atTick: labetalol.tick,
      } satisfies ObjectiveFinding;
      const systolic = Number(followUp.data?.systolicMmHg ?? 0);
      const diastolic = Number(followUp.data?.diastolicMmHg ?? 0);
      const mean = Number(followUp.data?.meanArterialMmHg ?? 0);
      const target = systolic < 160 && diastolic < 110 && mean >= 65;
      return {
        ...base, outcome: target ? 'met' : mean >= 65 ? 'partly-met' : 'not-met',
        finding: `The first accepted follow-up was ${systolic.toFixed(0)}/${diastolic.toFixed(0)} mmHg (mean ${mean.toFixed(0)}) after labetalol. ${target ? 'It was below the declared severe-range threshold without modeled hypotension.' : 'It had not yet reached the declared reassessment endpoint.'}`,
        atTick: followUp.tick,
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
      'assess-pneumothorax-pattern', 'escalate-pneumothorax-pattern',
      'support-pneumothorax-oxygenation', 'decompress-pneumothorax',
      'reassess-pneumothorax-recovery',
      'assess-obstructive-pleural-shock', 'escalate-obstructive-pleural-shock',
      'support-obstructive-pleural-oxygenation', 'decompress-obstructive-pleural-shock',
      'reassess-obstructive-pleural-recovery',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find(
        (event) => event.type === 'tension-pneumothorax',
      )?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) return {
        ...base, outcome: 'not-exercised',
        finding: 'The session ended before the modeled pleural event.',
      } satisfies ObjectiveFinding;
      const assessment = log.find((entry) => entry.eventId.startsWith('pneumothorax-assessed-'));
      const help = log.find((entry) => entry.eventId.startsWith('airway-help-requested-')
        && entry.data?.context === 'tension-pneumothorax');
      const decompression = log.find(
        (entry) => entry.eventId.startsWith('pneumothorax-decompressed-'),
      );
      if (['assess-pneumothorax-pattern', 'assess-obstructive-pleural-shock'].includes(objective.id)) {
        const delay = assessment ? (assessment.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 30 ? 'met' : delay <= 60 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'No accepted bilateral-ventilation assessment was recorded.'
            : `Bilateral ventilation was assessed ${delay.toFixed(0)} seconds after the modeled event; left air entry was markedly reduced while right air entry remained present.`,
          atTick: assessment?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      if (['escalate-pneumothorax-pattern', 'escalate-obstructive-pleural-shock'].includes(objective.id)) {
        const delay = help ? (help.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 30 ? 'met' : delay <= 60 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'No accepted help request for the combined breathing and circulation change was recorded.'
            : `Help was requested ${delay.toFixed(0)} seconds after the modeled event. Team arrival and performance are not simulated.`,
          atTick: help?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      if (['support-pneumothorax-oxygenation', 'support-obstructive-pleural-oxygenation'].includes(objective.id)) {
        const windowEnd = onset + 60 * TICKS_PER_SECOND;
        let fio2 = scenario.equipment.ventilator.fio2;
        let delivering = scenario.equipment.ventilator.delivering;
        let tidalVolumeMl = scenario.equipment.ventilator.tidalVolumeMl;
        let respiratoryRateBpm = scenario.equipment.ventilator.respiratoryRateBpm;
        let achievedAt: number | null = null;
        for (const action of actions.filter((entry) => entry.type === 'ventilator'
          && entry.tick >= onset && entry.tick <= windowEnd).sort((a, b) => a.tick - b.tick)) {
          const finite = (value: unknown, current: number, min: number, max: number) => {
            const requested = Number(value);
            return value === undefined || !Number.isFinite(requested)
              ? current : Math.min(max, Math.max(min, requested));
          };
          fio2 = finite(action.payload.fio2, fio2, 0.21, 1);
          tidalVolumeMl = finite(action.payload.tidalVolumeMl, tidalVolumeMl, 0, 1500);
          respiratoryRateBpm = finite(action.payload.respiratoryRateBpm, respiratoryRateBpm, 0, 60);
          if (typeof action.payload.delivering === 'boolean') delivering = action.payload.delivering;
          const oxygenDelivered = scenario.equipment.airwayDevice === 'facemask'
            ? fio2 >= 1 : fio2 >= 1 && delivering && tidalVolumeMl > 0 && respiratoryRateBpm > 0;
          if (achievedAt === null && oxygenDelivered) achievedAt = action.tick;
        }
        return {
          ...base, outcome: achievedAt === null ? 'not-met' : 'met',
          finding: achievedAt === null
            ? 'High-concentration oxygen was not established within 60 seconds.'
            : `High-concentration oxygen was established ${((achievedAt - onset) / TICKS_PER_SECOND).toFixed(0)} seconds after the modeled event.`,
          atTick: achievedAt ?? windowEnd,
        } satisfies ObjectiveFinding;
      }
      if (['decompress-pneumothorax', 'decompress-obstructive-pleural-shock'].includes(objective.id)) {
        const delay = decompression ? (decompression.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 60 ? 'met' : delay <= 120 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'No accepted left-chest decompression intent was recorded.'
            : `Left-chest decompression intent was accepted ${delay.toFixed(0)} seconds after the modeled event. Technique, site, equipment, and complications are not simulated.`,
          atTick: decompression?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      if (!decompression) return {
        ...base, outcome: 'not-met',
        finding: 'Recovery was not credited because no accepted decompression intent preceded it.',
        atTick: history.at(-1)?.tick ?? onset,
      } satisfies ObjectiveFinding;
      const recovered = history.find((entry) => entry.tick >= decompression.tick
        && (entry.state.spo2Percent ?? 0) >= 94
        && (entry.state.meanArterialMmHg ?? 0) >= 65);
      return {
        ...base, outcome: recovered ? 'met' : 'not-met',
        finding: recovered
          ? `Oxygen saturation recovered to ${(recovered.state.spo2Percent ?? 0).toFixed(0)}% and mean arterial pressure to ${(recovered.state.meanArterialMmHg ?? 0).toFixed(0)} mmHg after accepted decompression intent. This is a teaching trajectory, not an individual prognosis.`
          : 'Oxygen saturation and mean arterial pressure had not both reached the declared reassessment endpoint before the session ended.',
        atTick: recovered?.tick ?? history.at(-1)?.tick ?? onset,
      } satisfies ObjectiveFinding;
    }

    if ([
      'review-aspiration-risk-cues', 'classify-elevated-aspiration-risk',
      'choose-shared-elective-plan', 'avoid-blanket-glp1-rule',
    ].includes(objective.id)) {
      const review = log.find(
        (entry) => entry.eventId.startsWith('aspiration-risk-cues-reviewed-'),
      );
      const elevated = log.find(
        (entry) => entry.eventId.startsWith('aspiration-risk-classified-elevated-'),
      );
      const routine = log.find(
        (entry) => entry.eventId.startsWith('aspiration-risk-classified-routine-'),
      );
      const defer = log.find(
        (entry) => entry.eventId.startsWith('aspiration-risk-plan-defer-and-replan-'),
      );
      const proceed = log.find(
        (entry) => entry.eventId.startsWith('aspiration-risk-plan-proceed-routine-'),
      );
      if (objective.id === 'review-aspiration-risk-cues') return {
        ...base,
        outcome: review ? 'met' : 'not-met',
        finding: review
          ? 'You reviewed medication escalation, active gastrointestinal symptoms, the ordinary fasting interval, and elective urgency together.'
          : 'No accepted combined review of medication phase, symptoms, fasting, and urgency was recorded.',
        atTick: review?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      if (objective.id === 'classify-elevated-aspiration-risk') return {
        ...base,
        outcome: elevated ? 'met' : routine ? 'not-met' : 'not-met',
        finding: elevated
          ? 'You classified elevated delayed-gastric-emptying risk from the combined escalation-phase and active-symptom pattern, not from medication use alone.'
          : routine
            ? 'You classified routine fasting risk despite the declared dose escalation and active nausea and bloating.'
            : 'No accepted aspiration-risk classification was recorded.',
        atTick: elevated?.tick ?? routine?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      if (objective.id === 'choose-shared-elective-plan') return {
        ...base,
        outcome: elevated && defer ? 'met' : defer ? 'partly-met' : 'not-met',
        finding: elevated && defer
          ? 'You deferred this elective case for symptom resolution and shared replanning after recognizing elevated risk.'
          : proceed
            ? 'You chose routine same-day progression despite the declared escalation-phase and active gastrointestinal symptoms.'
            : defer
              ? 'You deferred the case, but the accepted classification did not identify the elevated patient-specific risk pattern.'
              : 'No accepted disposition was recorded.',
        atTick: defer?.tick ?? proceed?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      const patientSpecific = Boolean(review && elevated && defer);
      return {
        ...base,
        outcome: patientSpecific ? 'met' : 'not-met',
        finding: patientSpecific
          ? 'The accepted path tied deferral to this patient’s escalation phase and active symptoms without creating a blanket medication-stop or cancellation rule.'
          : 'The completed path did not demonstrate the patient-specific reasoning needed to avoid a blanket GLP-1 rule.',
        atTick: defer?.tick ?? elevated?.tick ?? review?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
    }

    if ([
      'review-emergence-quantitative-monitor', 'recognize-emergence-residual-blockade',
      'defer-extubation-during-residual-blockade', 'separate-recovery-from-extubation-readiness',
    ].includes(objective.id)) {
      const review = log.find((entry) => entry.eventId.startsWith('emergence-monitor-reviewed-'));
      const residual = log.find(
        (entry) => entry.eventId.startsWith('emergence-block-classified-residual-'),
      );
      const recovered = log.find(
        (entry) => entry.eventId.startsWith('emergence-block-classified-recovered-'),
      );
      const defer = log.find(
        (entry) => entry.eventId.startsWith('emergence-plan-defer-extubation-and-support-'),
      );
      const proceed = log.find(
        (entry) => entry.eventId.startsWith('emergence-plan-proceed-to-extubation-'),
      );
      if (objective.id === 'review-emergence-quantitative-monitor') return {
        ...base,
        outcome: review ? 'met' : 'not-met',
        finding: review
          ? `You reviewed four twitches, no detectable fade, and the quantitative ratio of ${Number(review.data?.trainOfFourRatio ?? 0).toFixed(2)} together.`
          : 'No accepted quantitative neuromuscular monitor review was recorded.',
        atTick: review?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      if (objective.id === 'recognize-emergence-residual-blockade') return {
        ...base,
        outcome: residual ? 'met' : 'not-met',
        finding: residual
          ? 'You classified residual blockade from the quantitative ratio below 0.90 despite reassuring clinical and qualitative signs.'
          : recovered
            ? 'You classified adequate recovery despite the quantitative ratio remaining below 0.90.'
            : 'No accepted neuromuscular recovery classification was recorded.',
        atTick: residual?.tick ?? recovered?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      if (objective.id === 'defer-extubation-during-residual-blockade') return {
        ...base,
        outcome: residual && defer ? 'met' : defer ? 'partly-met' : 'not-met',
        finding: residual && defer
          ? 'You deferred extubation and kept the secured airway and delivered ventilation in place after identifying residual blockade.'
          : proceed
            ? 'You chose progression toward extubation despite quantitative residual blockade.'
            : defer
              ? 'You preserved the airway and ventilation, but the accepted classification did not identify residual blockade.'
              : 'No accepted emergence airway plan was recorded.',
        atTick: defer?.tick ?? proceed?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      const bounded = Boolean(review && residual && defer
        && defer.data?.airwayRemainedIntubated === true
        && defer.data?.ventilationRemainedDelivered === true);
      return {
        ...base,
        outcome: bounded ? 'met' : 'not-met',
        finding: bounded
          ? 'The accepted path treated quantitative recovery as a necessary checkpoint while preserving the separate, broader extubation-readiness decision.'
          : 'The completed path did not preserve the distinction between quantitative recovery and full extubation readiness.',
        atTick: defer?.tick ?? residual?.tick ?? review?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
    }

    if ([
      'support-delayed-emergence-patient', 'reconcile-delayed-emergence-exposures',
      'check-delayed-emergence-metabolic-causes', 'find-delayed-emergence-lateralizing-sign',
      'escalate-delayed-emergence-neurologic-pattern',
    ].includes(objective.id)) {
      const support = log.find(
        (entry) => entry.eventId.startsWith('delayed-emergence-support-reviewed-'),
      );
      const exposure = log.find(
        (entry) => entry.eventId.startsWith('delayed-emergence-exposure-reviewed-'),
      );
      const metabolic = log.find(
        (entry) => entry.eventId.startsWith('delayed-emergence-metabolic-reviewed-'),
      );
      const neurologic = log.find(
        (entry) => entry.eventId.startsWith('delayed-emergence-neurologic-exam-'),
      );
      const urgent = log.find((entry) => entry.eventId.startsWith(
        'delayed-emergence-escalation-urgent-neurologic-evaluation-',
      ));
      const routine = log.find((entry) => entry.eventId.startsWith(
        'delayed-emergence-escalation-continue-routine-recovery-',
      ));
      if (objective.id === 'support-delayed-emergence-patient') return {
        ...base, outcome: support ? 'met' : 'not-met',
        finding: support
          ? 'You preserved the secured airway and reviewed ventilation, oxygenation, circulation, and temperature before investigating causes.'
          : 'No accepted immediate airway and physiologic support review was recorded.',
        atTick: support?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      if (objective.id === 'reconcile-delayed-emergence-exposures') return {
        ...base, outcome: exposure ? 'met' : 'not-met',
        finding: exposure
          ? 'You reconciled anesthetic, opioid, benzodiazepine, and quantitative neuromuscular-block evidence without assigning an unsupported single cause.'
          : 'No accepted anesthetic-exposure and quantitative-block review was recorded.',
        atTick: exposure?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      if (objective.id === 'check-delayed-emergence-metabolic-causes') return {
        ...base, outcome: metabolic ? 'met' : 'not-met',
        finding: metabolic
          ? 'You reviewed the fixed glucose, carbon dioxide, sodium, and temperature findings as bounded reversible categories.'
          : 'No accepted review of the bounded metabolic findings was recorded.',
        atTick: metabolic?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      if (objective.id === 'find-delayed-emergence-lateralizing-sign') return {
        ...base, outcome: neurologic ? 'met' : 'not-met',
        finding: neurologic
          ? 'You found the new asymmetric arm response and leftward gaze preference after common recorded causes did not explain the pattern.'
          : 'No accepted focused neurologic examination was recorded.',
        atTick: neurologic?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      return {
        ...base, outcome: urgent ? 'met' : 'not-met',
        finding: urgent
          ? 'You escalated the new lateralizing pattern for urgent neurologic evaluation while airway support continued.'
          : routine
            ? 'You continued routine recovery observation despite the new lateralizing examination finding.'
            : 'No accepted escalation decision was recorded.',
        atTick: urgent?.tick ?? routine?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
    }

    if ([
      'confirm-extubation-quantitative-recovery', 'assess-awake-airway-protection',
      'assess-extubation-gas-exchange', 'plan-extubation-risk-and-rescue',
      'integrate-awake-extubation-readiness',
    ].includes(objective.id)) {
      const recovery = log.find(
        (entry) => entry.eventId.startsWith('extubation-recovery-reviewed-'),
      );
      const awakeAirway = log.find(
        (entry) => entry.eventId.startsWith('extubation-awake-airway-reviewed-'),
      );
      const gasExchange = log.find(
        (entry) => entry.eventId.startsWith('extubation-gas-exchange-reviewed-'),
      );
      const airwayPlan = log.find(
        (entry) => entry.eventId.startsWith('extubation-airway-plan-reviewed-'),
      );
      const ready = log.find((entry) => entry.eventId.startsWith(
        'extubation-decision-ready-for-planned-awake-extubation-',
      ));
      const continueSupport = log.find((entry) => entry.eventId.startsWith(
        'extubation-decision-continue-support-and-reassess-',
      ));
      if (objective.id === 'confirm-extubation-quantitative-recovery') return {
        ...base, outcome: recovery ? 'met' : 'not-met',
        finding: recovery
          ? 'You confirmed a quantitative ratio above 0.90 and kept it as one checkpoint rather than the whole extubation decision.'
          : 'No accepted quantitative recovery review was recorded.',
        atTick: recovery?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      if (objective.id === 'assess-awake-airway-protection') return {
        ...base, outcome: awakeAirway ? 'met' : 'not-met',
        finding: awakeAirway
          ? 'You reviewed sustained eye opening, command following, cough, and cleared secretions together.'
          : 'No accepted awake-response and airway-protection review was recorded.',
        atTick: awakeAirway?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      if (objective.id === 'assess-extubation-gas-exchange') return {
        ...base, outcome: gasExchange ? 'met' : 'not-met',
        finding: gasExchange
          ? 'You reviewed the bounded spontaneous rate, tidal volume, end-tidal carbon dioxide, oxygen saturation, and inspired oxygen together.'
          : 'No accepted spontaneous-breathing and gas-exchange review was recorded.',
        atTick: gasExchange?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      if (objective.id === 'plan-extubation-risk-and-rescue') return {
        ...base, outcome: airwayPlan ? 'met' : 'not-met',
        finding: airwayPlan
          ? 'You checked for airway change and confirmed oxygen, monitoring, skilled help, and a reintubation plan before deciding.'
          : 'No accepted airway-risk and rescue-plan review was recorded.',
        atTick: airwayPlan?.tick ?? history.at(-1)?.tick,
      } satisfies ObjectiveFinding;
      const integrated = Boolean(recovery && awakeAirway && gasExchange && airwayPlan && ready
        && ready.data?.tubeRemovalSimulated === false
        && ready.data?.airwayRemainedIntubated === true);
      return {
        ...base, outcome: integrated ? 'met' : 'not-met',
        finding: integrated
          ? 'You integrated every declared checkpoint into readiness for a planned awake extubation without treating the browser as tube-removal practice.'
          : continueSupport
            ? 'You continued support despite every declared low-risk awake-extubation checkpoint being present.'
            : 'No complete accepted awake-extubation readiness decision was recorded.',
        atTick: ready?.tick ?? continueSupport?.tick ?? history.at(-1)?.tick,
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
      'prepare-pediatric-inhalational-circuit', 'follow-pediatric-end-tidal-wash-in',
      'settle-pediatric-volatile-depth',
    ].includes(objective.id)) {
      const initial = scenario.equipment.ventilator;
      const machineActions = actions.filter((action) => action.type === 'ventilator');
      const settingsAt = (tick: number, exclusive = false) => machineActions
        .filter((action) => exclusive ? action.tick < tick : action.tick <= tick)
        .reduce((settings, action) => {
          const finite = (field: string, fallback: number, min: number, max: number) => {
            if (action.payload[field] === undefined) return fallback;
            const value = Number(action.payload[field]);
            return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
          };
          return {
            fio2: finite('fio2', settings.fio2, 0.21, 1),
            freshGasFlowLPerMin: finite(
              'freshGasFlowLPerMin', settings.freshGasFlowLPerMin, 0.5, 15,
            ),
            sevofluranePercent: finite(
              'sevofluranePercent', settings.sevofluranePercent, 0, 8,
            ),
          };
        }, {
          fio2: initial.fio2,
          freshGasFlowLPerMin: initial.freshGasFlowLPerMin ?? 1,
          sevofluranePercent: initial.sevofluranePercent ?? 0,
        });
      const firstPositive = machineActions.find((action) => {
        const value = Number(action.payload.sevofluranePercent);
        return Number.isFinite(value) && value > 0;
      });
      const prepared = firstPositive
        ? settingsAt(firstPositive.tick, true)
        : settingsAt(history.at(-1)?.tick ?? 0);
      const preparationMet = prepared.fio2 >= 0.95
        && prepared.freshGasFlowLPerMin >= 6 && prepared.sevofluranePercent === 0;

      if (objective.id === 'prepare-pediatric-inhalational-circuit') {
        return {
          ...base,
          outcome: preparationMet ? 'met'
            : prepared.fio2 >= 0.95 || prepared.freshGasFlowLPerMin >= 6
              ? 'partly-met' : machineActions.length > 0 ? 'not-met' : 'not-exercised',
          finding: `Before positive volatile delivery, accepted settings were oxygen ${(prepared.fio2 * 100).toFixed(0)}%, fresh-gas flow ${prepared.freshGasFlowLPerMin.toFixed(1)} L/min, and sevoflurane ${prepared.sevofluranePercent.toFixed(1)}%. This records modeled machine preparation, not circuit priming or mask technique.`,
          atTick: firstPositive?.tick ?? machineActions.at(-1)?.tick,
        } satisfies ObjectiveFinding;
      }

      const enteredSevo = Number(firstPositive?.payload.sevofluranePercent);
      const validEnteredRange = firstPositive !== undefined
        && Number.isFinite(enteredSevo) && enteredSevo > 0 && enteredSevo <= 8;
      const target = firstPositive
        ? history.find((sample) => sample.tick >= firstPositive.tick
          && Number(sample.state.macFraction ?? 0) >= 0.8)
        : undefined;
      if (objective.id === 'follow-pediatric-end-tidal-wash-in') {
        const peakEndTidal = firstPositive
          ? Math.max(0, ...history.filter((sample) => sample.tick >= firstPositive.tick)
            .map((sample) => Number(sample.state.endTidalSevofluranePercent ?? 0))) : 0;
        return {
          ...base,
          outcome: !firstPositive ? 'not-exercised'
            : !validEnteredRange ? 'not-met'
              : preparationMet && target ? 'met'
                : preparationMet || target ? 'partly-met' : 'not-met',
          finding: firstPositive
            ? `The first positive vaporizer setting was ${enteredSevo.toFixed(1)}%; peak recorded end-tidal sevoflurane was ${peakEndTidal.toFixed(2)}%, and ${target ? `0.8 age-adjusted MAC was reached at ${(target.tick / TICKS_PER_SECOND).toFixed(1)} seconds` : '0.8 age-adjusted MAC was not reached'}. Machine delivery and end-tidal concentration are not interchangeable.`
            : 'No positive sevoflurane delivery was recorded, so wash-in was not exercised.',
          atTick: target?.tick ?? firstPositive?.tick,
        } satisfies ObjectiveFinding;
      }

      const reduction = target ? machineActions.find((action) => {
        if (action.tick < target.tick || action.payload.sevofluranePercent === undefined) return false;
        const value = Number(action.payload.sevofluranePercent);
        return Number.isFinite(value) && value >= 0.5 && value <= 3;
      }) : undefined;
      const window = reduction ? history.filter((sample) => sample.tick >= reduction.tick
        && sample.tick <= reduction.tick + 60 * TICKS_PER_SECOND) : [];
      const sustained = window.length > 1
        && window.at(-1)!.tick - window[0]!.tick >= 59 * TICKS_PER_SECOND
        && window.every((sample) => {
          const depth = Number(sample.state.depthIndex ?? 100);
          return depth >= 40 && depth <= 60
            && Number(sample.state.meanArterialMmHg ?? 0) >= 55
            && Number(sample.state.spo2Percent ?? 0) >= 92;
        });
      const final = window.at(-1);
      return {
        ...base,
        outcome: sustained ? 'met' : reduction ? 'partly-met'
          : target ? 'not-met' : firstPositive ? 'not-met' : 'not-exercised',
        finding: reduction
          ? `Delivery was reduced to ${Number(reduction.payload.sevofluranePercent).toFixed(1)}%. ${sustained ? 'The next 60 seconds kept' : 'The trace did not sustain 60 seconds with'} predicted depth 40–60, pressure at least 55 mmHg, and saturation at least 92%${final ? `; the last sample was depth ${Number(final.state.depthIndex).toFixed(0)}, MAP ${Number(final.state.meanArterialMmHg).toFixed(0)} mmHg, and saturation ${Number(final.state.spo2Percent).toFixed(1)}%` : ''}. These model signals do not establish consciousness or airway readiness.`
          : 'No accepted 0.5–3% reduction followed the wash-in target.',
        atTick: final?.tick ?? reduction?.tick ?? target?.tick,
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

    if ([
      'recognize-severe-adult-asthma', 'use-controlled-oxygen-in-adult-asthma',
      'give-initial-adult-asthma-treatment', 'reassess-adult-asthma-response',
    ].includes(objective.id)) {
      const supported = scenario.timeline.some(
        (event) => event.type === 'narrative' && event.target === 'adult-asthma',
      );
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The adult-asthma vignette was not active.' } satisfies ObjectiveFinding;
      const severity = log.find((event) => event.eventId.startsWith('adult-asthma-severity-reviewed-'));
      const oxygen = log.find((event) => event.eventId.startsWith('adult-asthma-oxygen-'));
      const bronchodilators = log.find((event) => event.eventId.startsWith('adult-asthma-bronchodilators-'));
      const corticosteroid = log.find((event) => event.eventId.startsWith('adult-asthma-corticosteroid-'));
      const reassessment = log.find((event) => event.eventId.startsWith('adult-asthma-reassessed-'));
      if (objective.id === 'recognize-severe-adult-asthma') return {
        ...base, outcome: severity ? 'met' : 'not-met',
        finding: severity
          ? 'Speech, work of breathing, room-air oxygenation, peak flow, and immediate alternative causes were reviewed together without treating wheeze as diagnostic proof.'
          : 'The fixed whole-patient severity and immediate-mimic review was not recorded.',
        atTick: severity?.tick ?? 0,
      } satisfies ObjectiveFinding;
      if (objective.id === 'use-controlled-oxygen-in-adult-asthma') {
        const ordered = severity && oxygen && severity.tick <= oxygen.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Controlled oxygen for room-air SpO₂ below 92% followed severity review with a fixed adult target of 92–95%, rather than an unbounded oxygen setting.'
            : 'Severity review and controlled oxygen targeting were incomplete or out of order.',
          atTick: oxygen?.tick ?? severity?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'give-initial-adult-asthma-treatment') {
        const complete = bronchodilators && corticosteroid;
        return { ...base, outcome: complete ? 'met' : 'not-met',
          finding: complete
            ? 'The fixed conservative pMDI-and-spacer bronchodilator bundle and early systemic-corticosteroid intent were both recorded without implying technique, dose calculation, or prescription.'
            : 'Initial inhaled bronchodilator and early anti-inflammatory intents were incomplete.',
          atTick: Math.max(bronchodilators?.tick ?? 0, corticosteroid?.tick ?? 0) } satisfies ObjectiveFinding;
      }
      const ordered = oxygen && bronchodilators && corticosteroid && reassessment
        && Math.max(oxygen.tick, bronchodilators.tick, corticosteroid.tick) <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Symptoms, speech, work of breathing, oxygenation, waveform response, and fixed repeat peak flow were reviewed before any automatic repeat treatment.'
          : 'Initial treatment and serial whole-patient reassessment were incomplete or out of order.',
        atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if ([
      'assess-copd-exacerbation-severity', 'use-controlled-oxygen-in-copd',
      'give-initial-copd-exacerbation-treatment', 'recognize-copd-antibiotic-indication',
      'reassess-copd-respiratory-failure',
    ].includes(objective.id)) {
      const supported = scenario.timeline.some(
        (event) => event.type === 'narrative' && event.target === 'copd-exacerbation',
      );
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The COPD-exacerbation vignette was not active.' } satisfies ObjectiveFinding;
      const severity = log.find((event) => event.eventId.startsWith('copd-exacerbation-severity-reviewed-'));
      const oxygen = log.find((event) => event.eventId.startsWith('copd-exacerbation-oxygen-'));
      const bronchodilators = log.find((event) => event.eventId.startsWith('copd-exacerbation-bronchodilators-'));
      const corticosteroid = log.find((event) => event.eventId.startsWith('copd-exacerbation-corticosteroid-'));
      const antibiotic = log.find((event) => event.eventId.startsWith('copd-exacerbation-antibiotic-'));
      const reassessment = log.find((event) => event.eventId.startsWith('copd-exacerbation-reassessed-'));
      if (objective.id === 'assess-copd-exacerbation-severity') return {
        ...base, outcome: severity ? 'met' : 'not-met',
        finding: severity
          ? 'Symptoms, signs, room-air oxygenation, purulent sputum, one authored blood gas, and immediate respiratory and cardiac mimics were reviewed together.'
          : 'The fixed whole-patient, blood-gas, and immediate-mimic review was not recorded.',
        atTick: severity?.tick ?? 0,
      } satisfies ObjectiveFinding;
      if (objective.id === 'use-controlled-oxygen-in-copd') {
        const ordered = severity && oxygen && severity.tick <= oxygen.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Controlled oxygen followed severity review with a fixed 88-92% target and retained serial blood-gas review.'
            : 'Severity review and controlled oxygen targeting were incomplete or out of order.',
          atTick: oxygen?.tick ?? severity?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'give-initial-copd-exacerbation-treatment') {
        const complete = bronchodilators && corticosteroid;
        return { ...base, outcome: complete ? 'met' : 'not-met',
          finding: complete
            ? 'The fixed air-driven short-acting bronchodilator bundle and 5-day systemic-corticosteroid intent were both recorded without implying technique or a prescription.'
            : 'Initial inhaled bronchodilator and short-course corticosteroid intents were incomplete.',
          atTick: Math.max(bronchodilators?.tick ?? 0, corticosteroid?.tick ?? 0) } satisfies ObjectiveFinding;
      }
      if (objective.id === 'recognize-copd-antibiotic-indication') return {
        ...base, outcome: antibiotic ? 'met' : 'not-met',
        finding: antibiotic
          ? 'Increased purulent sputum supported antibiotic intent without inventing agent selection, microbiology, resistance, or a prescription.'
          : 'The authored purulent-sputum antibiotic indication was not recorded.',
        atTick: antibiotic?.tick ?? 0,
      } satisfies ObjectiveFinding;
      const ordered = oxygen && bronchodilators && corticosteroid && antibiotic && reassessment
        && Math.max(oxygen.tick, bronchodilators.tick, corticosteroid.tick, antibiotic.tick)
          <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Symptoms, work of breathing, oxygenation, waveform response, and the fixed repeat blood gas were reviewed before deciding that immediate noninvasive ventilation was not selected in this improving vignette.'
          : 'Initial treatment and serial respiratory-failure reassessment were incomplete or out of order.',
        atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if ([
      'recognize-acute-pulmonary-edema-pattern', 'support-pulmonary-edema-gas-exchange',
      'treat-hypertensive-pulmonary-edema', 'reassess-pulmonary-edema-response',
    ].includes(objective.id)) {
      const supported = scenario.timeline.some((event) =>
        event.type === 'narrative' && event.target === 'acute-pulmonary-edema');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The acute-pulmonary-edema vignette was not active.' } satisfies ObjectiveFinding;
      const pattern = log.find((event) => event.eventId.startsWith('acute-pulmonary-edema-pattern-reviewed-'));
      const niv = log.find((event) => event.eventId.startsWith('acute-pulmonary-edema-niv-'));
      const diuretic = log.find((event) => event.eventId.startsWith('acute-pulmonary-edema-diuretic-'));
      const vasodilator = log.find((event) => event.eventId.startsWith('acute-pulmonary-edema-vasodilator-'));
      const reassessment = log.find((event) => event.eventId.startsWith('acute-pulmonary-edema-reassessed-'));
      if (objective.id === 'recognize-acute-pulmonary-edema-pattern') return {
        ...base, outcome: pattern ? 'met' : 'not-met',
        finding: pattern
          ? 'Respiratory distress, congestion, hypertension, perfusion, fixed focused tests, immediate mimics, and precipitants were reviewed together.'
          : 'The fixed whole-patient pattern, mimic, and precipitant review was not recorded.',
        atTick: pattern?.tick ?? 0,
      } satisfies ObjectiveFinding;
      if (objective.id === 'support-pulmonary-edema-gas-exchange') {
        const ordered = pattern && niv && pattern.tick <= niv.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Early noninvasive positive-pressure and titrated-oxygen intent followed whole-patient review without implying interface skill.'
            : 'Pattern review and early respiratory support were incomplete or out of order.',
          atTick: niv?.tick ?? pattern?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'treat-hypertensive-pulmonary-edema') {
        const complete = diuretic && vasodilator;
        return { ...base, outcome: complete ? 'met' : 'not-met',
          finding: complete
            ? 'Loop-diuretic intent addressed congestion while vasodilator intent used the safely elevated systolic pressure without inventing doses or titration.'
            : 'Decongestive and pressure-safe vasodilator intents were incomplete.',
          atTick: Math.max(diuretic?.tick ?? 0, vasodilator?.tick ?? 0) } satisfies ObjectiveFinding;
      }
      const ordered = niv && diuretic && vasodilator && reassessment
        && Math.max(niv.tick, diuretic.tick, vasodilator.tick) <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Breathing, oxygenation, blood pressure, mental status, and perfusion were reassessed after the bounded initial response.'
          : 'Initial support, treatment intents, and serial whole-patient reassessment were incomplete or out of order.',
        atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['classify-acute-pe-severity', 'support-and-anticoagulate-acute-pe',
      'recognize-pe-deterioration', 'escalate-deteriorating-pe'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'pulmonary-embolism-deterioration');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The pulmonary-embolism deterioration vignette was not active.' } satisfies ObjectiveFinding;
      const severity = log.find((event) => event.eventId.startsWith('pulmonary-embolism-severity-reviewed-'));
      const oxygen = log.find((event) => event.eventId.startsWith('pulmonary-embolism-oxygen-'));
      const anticoagulation = log.find((event) => event.eventId.startsWith('pulmonary-embolism-anticoagulation-'));
      const deterioration = log.find((event) => event.eventId.startsWith('pulmonary-embolism-deterioration-recognized-'));
      const escalation = log.find((event) => event.eventId.startsWith('pulmonary-embolism-escalation-'));
      if (objective.id === 'classify-acute-pe-severity') return {
        ...base, outcome: severity ? 'met' : 'not-met',
        finding: severity
          ? 'Confirmed clot burden, RV dysfunction, biomarkers, respiratory modifier, pressure, and perfusion were integrated as the fixed initial Category C3R pattern.'
          : 'The fixed confirmed-PE severity pattern was not reviewed.',
        atTick: severity?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'support-and-anticoagulate-acute-pe') {
        const ordered = severity && oxygen && anticoagulation
          && severity.tick <= Math.min(oxygen.tick, anticoagulation.tick);
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Titrated-oxygen and immediate therapeutic-anticoagulation intents followed severity review without inventing device, agent, or dose choices.'
            : 'Initial oxygen and anticoagulation intents were incomplete or preceded severity review.',
          atTick: Math.max(oxygen?.tick ?? 0, anticoagulation?.tick ?? 0) } satisfies ObjectiveFinding;
      }
      if (objective.id === 'recognize-pe-deterioration') {
        const ordered = oxygen && anticoagulation && deterioration
          && Math.max(oxygen.tick, anticoagulation.tick) <= deterioration.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Serial hypotension and hypoperfusion were recognized as authored progression to Category E1 cardiopulmonary failure.'
            : 'The serial cardiopulmonary deterioration was not recognized after initial treatment.',
          atTick: deterioration?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = deterioration && escalation && deterioration.tick <= escalation.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Immediate multidisciplinary PE response and urgent reperfusion-strategy intent followed recognition of Category E1 deterioration.'
          : 'Team escalation and reperfusion planning did not follow recognition of deterioration.',
        atTick: escalation?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-stemi-pattern', 'activate-stemi-reperfusion',
      'record-stemi-antithrombotic-intent', 'reassess-and-handoff-stemi'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) =>
        event.type === 'narrative' && event.target === 'stemi');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The STEMI vignette was not active.' } satisfies ObjectiveFinding;
      const pattern = log.find((event) => event.eventId.startsWith('stemi-pattern-reviewed-'));
      const pathway = log.find((event) => event.eventId.startsWith('stemi-pathway-activated-'));
      const aspirin = log.find((event) => event.eventId.startsWith('stemi-aspirin-'));
      const antithrombotics = log.find((event) => event.eventId.startsWith('stemi-antithrombotics-'));
      const reassessment = log.find((event) => event.eventId.startsWith('stemi-reassessed-'));
      if (objective.id === 'recognize-stemi-pattern') return {
        ...base, outcome: pattern ? 'met' : 'not-met',
        finding: pattern
          ? 'Symptoms, timing, fixed 12-lead ECG, hemodynamics, oxygenation, and immediate alternatives were reviewed together.'
          : 'The fixed time-critical STEMI pattern was not reviewed.',
        atTick: pattern?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'activate-stemi-reperfusion') {
        const ordered = pattern && pathway && pattern.tick <= pathway.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'The STEMI system and primary-PCI intent were activated after pattern review without waiting for biomarkers.'
            : 'Reperfusion-system activation was absent or preceded pattern review.',
          atTick: pathway?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-stemi-antithrombotic-intent') {
        const complete = pattern && aspirin && antithrombotics
          && pattern.tick <= Math.min(aspirin.tick, antithrombotics.tick);
        return { ...base, outcome: complete ? 'met' : 'not-met',
          finding: complete
            ? 'The aspirin loading range and dose-free P2Y12/anticoagulation intents followed pattern review without inventing individualized selections.'
            : 'The bounded antithrombotic sequence was incomplete or out of order.',
          atTick: Math.max(aspirin?.tick ?? 0, antithrombotics?.tick ?? 0) } satisfies ObjectiveFinding;
      }
      const ordered = pathway && aspirin && antithrombotics && reassessment
        && Math.max(pathway.tick, aspirin.tick, antithrombotics.tick) <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Symptoms, pressure, perfusion, rhythm, oxygenation, and complications were reassessed before the declared reperfusion handoff.'
          : 'Pathway preparation and serial pre-reperfusion reassessment were incomplete or out of order.',
        atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-unstable-narrow-tachycardia', 'prepare-unstable-tachycardia-response',
      'cardiovert-unstable-narrow-tachycardia',
      'reassess-after-tachycardia-cardioversion'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'unstable-narrow-complex-tachycardia');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The unstable narrow-complex tachycardia vignette was not active.' } satisfies ObjectiveFinding;
      const reviewed = log.find((event) => event.eventId.startsWith('unstable-narrow-tachycardia-reviewed-'));
      const prepared = log.find((event) => event.eventId.startsWith('unstable-narrow-tachycardia-prepared-'));
      const cardioverted = log.find((event) => event.eventId.startsWith('unstable-narrow-tachycardia-cardioverted-'));
      const reassessed = log.find((event) => event.eventId.startsWith('unstable-narrow-tachycardia-reassessed-'));
      if (objective.id === 'recognize-unstable-narrow-tachycardia') return {
        ...base, outcome: reviewed ? 'met' : 'not-met',
        finding: reviewed
          ? 'Regular narrow-complex tachycardia was integrated with hypotension, altered mentation, ischemic discomfort, and shock signs.'
          : 'The fixed rhythm and instability pattern was not reviewed.',
        atTick: reviewed?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'prepare-unstable-tachycardia-response') {
        const ordered = reviewed && prepared && reviewed.tick <= prepared.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Airway and breathing assessment, help, monitoring, access, and synchronized-pad preparation followed instability recognition without routine oxygen.'
            : 'Immediate synchronized-cardioversion preparation was absent or out of order.',
          atTick: prepared?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'cardiovert-unstable-narrow-tachycardia') {
        const ordered = prepared && cardioverted && prepared.tick <= cardioverted.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Prompt synchronized-cardioversion intent followed preparation, with sedation bounded to feasibility and no invented energy selection.'
            : 'Synchronized-cardioversion intent was absent or preceded preparation.',
          atTick: cardioverted?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = cardioverted && reassessed && cardioverted.tick <= reassessed.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Rhythm, pressure, mentation, ischemic discomfort, and perfusion were reassessed after the bounded response.'
          : 'Post-cardioversion rhythm and whole-patient reassessment was incomplete or out of order.',
        atTick: reassessed?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-unstable-bradycardia', 'support-unstable-bradycardia',
      'give-atropine-for-unstable-bradycardia', 'reassess-unstable-bradycardia']
      .includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'unstable-bradycardia');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The unstable bradycardia vignette was not active.' } satisfies ObjectiveFinding;
      const reviewed = log.find((event) => event.eventId.startsWith('unstable-bradycardia-reviewed-'));
      const support = log.find((event) => event.eventId.startsWith('unstable-bradycardia-supported-'));
      const atropine = log.find((event) => event.eventId.startsWith('unstable-bradycardia-atropine-'));
      const reassessed = log.find((event) => event.eventId.startsWith('unstable-bradycardia-reassessed-'));
      if (objective.id === 'recognize-unstable-bradycardia') return {
        ...base, outcome: reviewed ? 'met' : 'not-met',
        finding: reviewed
          ? 'Clinically inappropriate sinus bradycardia was integrated with a palpable pulse, hypotension, altered mentation, ischemic discomfort, and shock signs.'
          : 'The fixed rate, rhythm, pulse, and compromise pattern was not reviewed.',
        atTick: reviewed?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'support-unstable-bradycardia') {
        const ordered = reviewed && support && reviewed.tick <= support.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Airway, breathing, oxygen, monitoring, pulse checks, help, and vascular access followed recognition of compromise.'
            : 'Immediate bradycardia support was absent or out of order.',
          atTick: support?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'give-atropine-for-unstable-bradycardia') {
        const ordered = support && atropine && support.tick <= atropine.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'The fixed 1 mg IV atropine intent followed support without claiming medication delivery or universal response.'
            : 'Atropine intent was absent or preceded immediate support.',
          atTick: atropine?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = atropine && reassessed && atropine.tick < reassessed.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Rate, rhythm, pressure, mentation, ischemic discomfort, perfusion, and ongoing cause/escalation needs were reassessed.'
          : 'Post-atropine whole-patient reassessment was incomplete or out of order.',
        atTick: reassessed?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-convulsive-status-epilepticus', 'stabilize-convulsive-status-epilepticus',
      'give-first-line-status-benzodiazepine', 'reassess-status-after-benzodiazepine']
      .includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'status-epilepticus');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The status-epilepticus vignette was not active.' } satisfies ObjectiveFinding;
      const reviewed = log.find((event) => event.eventId.startsWith('status-epilepticus-reviewed-'));
      const stabilized = log.find((event) => event.eventId.startsWith('status-epilepticus-supported-'));
      const lorazepam = log.find((event) => /^status-epilepticus-lorazepam-\d+$/.test(event.eventId));
      const reassessed = log.find((event) => event.eventId.startsWith('status-epilepticus-reassessed-'));
      if (objective.id === 'recognize-convulsive-status-epilepticus') return {
        ...base, outcome: reviewed ? 'met' : 'not-met',
        finding: reviewed
          ? 'Generalized convulsions beyond 5 minutes without recovery were integrated with airway, breathing, circulation, and unknown glucose status.'
          : 'Seizure type, duration, absent recovery, and whole-patient status were not reviewed.',
        atTick: reviewed?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'stabilize-convulsive-status-epilepticus') {
        const ordered = reviewed && stabilized && reviewed.tick <= stabilized.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Injury protection, airway and oxygen support, suction readiness, monitoring, help, access, and glucose followed recognition in parallel.'
            : 'The bounded stabilization and glucose bundle was absent or out of order.',
          atTick: stabilized?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'give-first-line-status-benzodiazepine') {
        const ordered = stabilized && lorazepam && stabilized.tick <= lorazepam.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'The fixed 4 mg IV lorazepam action followed stabilization without claiming physical delivery, pharmacokinetics, or universal response.'
            : 'The first-line lorazepam action was absent or preceded stabilization.',
          atTick: lorazepam?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = lorazepam && reassessed && lorazepam.tick <= reassessed.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Visible seizure activity, airway, ventilation, oxygenation, and the persistent-or-recurrent seizure escalation boundary were reassessed.'
          : 'Post-benzodiazepine seizure and airway reassessment was incomplete or out of order.',
        atTick: reassessed?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-and-activate-acute-stroke', 'review-stroke-imaging-and-eligibility',
      'record-stroke-thrombolysis-intent', 'activate-stroke-thrombectomy-pathway',
      'reassess-and-handoff-acute-stroke'].includes(objective.id)) {
      const supported = scenario.timeline.some(
        (event) => event.type === 'narrative' && event.target === 'acute-ischemic-stroke',
      );
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The acute-ischemic-stroke vignette was not active.' } satisfies ObjectiveFinding;
      const reviewed = log.find((event) => event.eventId.startsWith('acute-stroke-reviewed-'));
      const activated = log.find((event) => event.eventId.startsWith('acute-stroke-system-activated-'));
      const imaging = log.find((event) => event.eventId.startsWith('acute-stroke-imaging-reviewed-'));
      const tenecteplase = log.find((event) => /^acute-stroke-tenecteplase-\d+$/.test(event.eventId));
      const thrombectomy = log.find((event) => event.eventId.startsWith('acute-stroke-thrombectomy-activated-'));
      const reassessed = log.find((event) => event.eventId.startsWith('acute-stroke-reassessed-'));
      if (objective.id === 'recognize-and-activate-acute-stroke') {
        const ordered = reviewed && activated && reviewed.tick <= activated.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'The disabling deficit, 70-minute clock, glucose, pressure, airway, and breathing findings led to immediate stroke-system activation.'
            : 'The acute-stroke presentation was not reviewed and activated in order.',
          atTick: activated?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'review-stroke-imaging-and-eligibility') {
        const ordered = activated && imaging && activated.tick <= imaging.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'The authored no-hemorrhage CT, left M1 occlusion, pressure, and contraindication screen were integrated after activation.'
            : 'The authored imaging and eligibility screen was absent or out of order.',
          atTick: imaging?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-stroke-thrombolysis-intent') {
        const ordered = imaging && tenecteplase && imaging.tick <= tenecteplase.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'The fixed 20 mg IV tenecteplase intent followed eligibility review without claiming delivery or response.'
            : 'Tenecteplase intent was absent or preceded eligibility review.',
          atTick: tenecteplase?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'activate-stroke-thrombectomy-pathway') {
        const ordered = tenecteplase && thrombectomy && tenecteplase.tick <= thrombectomy.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'The thrombectomy transfer pathway followed thrombolysis intent without waiting for a simulated response.'
            : 'The endovascular pathway was absent or out of order.',
          atTick: thrombectomy?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = thrombectomy && reassessed && thrombectomy.tick <= reassessed.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Airway, breathing, pressure, bleeding surveillance, persistent deficits, and all treatment clocks were handed off without claiming reperfusion.'
          : 'Post-treatment surveillance and thrombectomy handoff were incomplete or out of order.',
        atTick: reassessed?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-and-stabilize-deteriorating-ich', 'review-ich-imaging-and-coagulopathy',
      'record-urgent-warfarin-reversal-intent', 'record-smooth-ich-pressure-control',
      'escalate-and-handoff-deteriorating-ich'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'intracranial-hemorrhage-deterioration');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The intracranial-hemorrhage-deterioration vignette was not active.' } satisfies ObjectiveFinding;
      const reviewed = log.find((event) => event.eventId.startsWith('ich-deterioration-reviewed-'));
      const activated = log.find((event) => event.eventId.startsWith('ich-pathway-activated-'));
      const findings = log.find((event) => event.eventId.startsWith('ich-findings-reviewed-'));
      const reversal = log.find((event) => /^ich-reversal-\d+$/.test(event.eventId));
      const pressure = log.find((event) => event.eventId.startsWith('ich-pressure-control-'));
      const escalated = log.find((event) => event.eventId.startsWith('ich-escalated-'));
      if (objective.id === 'recognize-and-stabilize-deteriorating-ich') {
        const ordered = reviewed && activated && reviewed.tick <= activated.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'The serial neurologic decline, airway watch, breathing, pressure, and glucose findings led to immediate support and ICH activation.'
            : 'The deterioration pattern was not reviewed and activated in order.',
          atTick: activated?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'review-ich-imaging-and-coagulopathy') {
        const ordered = activated && findings && activated.tick <= findings.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'The authored thalamic hemorrhage, intraventricular extension, hydrocephalus, warfarin timing, and INR were integrated after activation.'
            : 'The authored CT and coagulopathy findings were absent or out of order.',
          atTick: findings?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-urgent-warfarin-reversal-intent') {
        const ordered = findings && reversal && findings.tick <= reversal.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Warfarin cessation and fixed 4-factor PCC plus IV vitamin K intent followed confirmation without claiming dosing, delivery, or response.'
            : 'Urgent agent-specific reversal intent was absent or preceded confirmation.',
          atTick: reversal?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-smooth-ich-pressure-control') {
        const ordered = reversal && pressure && reversal.tick <= pressure.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Smooth pressure control toward 140 mmHg with a 130–150 mmHg maintenance boundary followed reversal intent.'
            : 'The bounded pressure strategy was absent or out of order.',
          atTick: pressure?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = pressure && escalated && pressure.tick <= escalated.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Neurocritical and neurosurgical escalation carried the deterioration, airway, CT, coagulopathy, reversal, and pressure clocks forward.'
          : 'Urgent neurocritical escalation and serial handoff were incomplete or out of order.',
        atTick: escalated?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-moderate-dka', 'begin-dka-fluid-and-monitoring-path',
      'correct-dka-potassium-before-insulin', 'continue-insulin-with-dextrose-until-dka-resolves',
      'confirm-dka-resolution-and-transition'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'diabetic-ketoacidosis');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The diabetic-ketoacidosis vignette was not active.' } satisfies ObjectiveFinding;
      const reviewed = log.find((event) => event.eventId.startsWith('dka-reviewed-'));
      const fluids = log.find((event) => /^dka-fluids-\d+$/.test(event.eventId));
      const potassium = log.find((event) => /^dka-potassium-\d+$/.test(event.eventId));
      const insulin = log.find((event) => /^dka-insulin-\d+$/.test(event.eventId));
      const dextrose = log.find((event) => /^dka-dextrose-\d+$/.test(event.eventId));
      const transition = log.find((event) => /^dka-transition-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-moderate-dka') return {
        ...base, outcome: reviewed ? 'met' : 'not-met',
        finding: reviewed
          ? 'Hyperglycemia or diabetes, ketonemia, and acidosis were integrated with volume status, potassium, mental status, and the failed infusion set.'
          : 'The fixed DKA triad, severity, potassium, and precipitant were not reviewed.',
        atTick: reviewed?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'begin-dka-fluid-and-monitoring-path') {
        const ordered = reviewed && fluids && reviewed.tick <= fluids.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Initial isotonic-fluid and serial-monitoring intents followed recognition.'
            : 'Initial fluid and monitoring intent was absent or out of order.',
          atTick: fluids?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'correct-dka-potassium-before-insulin') {
        const ordered = fluids && potassium && fluids.tick <= potassium.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Insulin remained withheld at potassium 3.2 mmol/L until the authored replacement step reached 3.7 mmol/L.'
            : 'The potassium gate was absent or out of order.',
          atTick: potassium?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'continue-insulin-with-dextrose-until-dka-resolves') {
        const ordered = potassium && insulin && dextrose
          && potassium.tick <= insulin.tick && insulin.tick <= dextrose.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Insulin followed potassium correction, and dextrose joined continued insulin when glucose improved before ketoacidosis.'
            : 'The potassium-gated insulin and dextrose continuation sequence was incomplete or out of order.',
          atTick: dextrose?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = dextrose && transition && dextrose.tick <= transition.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered ? 'Plasma ketone plus pH or bicarbonate confirmed resolution before overlap, device replacement, education, and handoff.'
          : 'Resolution confirmation and safe transition were incomplete or out of order.',
        atTick: transition?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-severe-hyperkalemia-toxicity', 'protect-heart-in-hyperkalemia',
      'shift-potassium-and-protect-glucose', 'remove-potassium-and-control-cause',
      'reassess-hyperkalemia-and-rebound'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'hyperkalemia-with-ecg-change');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The hyperkalemia-with-ECG-change vignette was not active.' } satisfies ObjectiveFinding;
      const reviewed = log.find((event) => event.eventId.startsWith('hyperkalemia-reviewed-'));
      const calcium = log.find((event) => /^hyperkalemia-calcium-\d+$/.test(event.eventId));
      const postCalcium = log.find((event) => /^hyperkalemia-post-calcium-ecg-\d+$/.test(event.eventId));
      const insulin = log.find((event) => /^hyperkalemia-insulin-glucose-\d+$/.test(event.eventId));
      const betaAgonist = log.find((event) => /^hyperkalemia-beta-agonist-\d+$/.test(event.eventId));
      const removal = log.find((event) => /^hyperkalemia-removal-\d+$/.test(event.eventId));
      const reassessed = log.find((event) => /^hyperkalemia-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-severe-hyperkalemia-toxicity') return {
        ...base, outcome: reviewed ? 'met' : 'not-met',
        finding: reviewed ? 'Confirmed severe potassium elevation and ECG toxicity were integrated with glucose, CKD, dehydration, and medication drivers.'
          : 'The fixed severe hyperkalemia pattern and drivers were not reviewed.',
        atTick: reviewed?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'protect-heart-in-hyperkalemia') {
        const ordered = reviewed && calcium && postCalcium
          && reviewed.tick <= calcium.tick && calcium.tick < postCalcium.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Calcium-salt intent followed ECG-toxicity recognition; a separate later treating-team report showed ECG improvement without claiming learner delivery or potassium reduction.'
            : 'Myocardial-protection intent or the separate elapsed ECG response was absent or out of order.', atTick: postCalcium?.tick ?? calcium?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'shift-potassium-and-protect-glucose') {
        const ordered = calcium && insulin && betaAgonist
          && calcium.tick <= insulin.tick && calcium.tick <= betaAgonist.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Insulin-glucose with glucose surveillance and an adjunct beta-2 agonist followed myocardial-protection intent in parallel lanes.'
            : 'The bounded shifting and glucose-surveillance lanes were incomplete or preceded myocardial protection.', atTick: Math.max(insulin?.tick ?? 0, betaAgonist?.tick ?? 0) } satisfies ObjectiveFinding;
      }
      if (objective.id === 'remove-potassium-and-control-cause') {
        const ordered = calcium && removal && calcium.tick <= removal.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Contributors, renal removal, and dialysis contingency were recorded without waiting for temporary shifting to finish.'
            : 'Definitive removal and cause control were absent or preceded myocardial protection.', atTick: removal?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = postCalcium && insulin && betaAgonist && removal && reassessed
        && postCalcium.tick < reassessed.tick && insulin.tick < reassessed.tick
        && betaAgonist.tick < reassessed.tick && removal.tick < reassessed.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered ? 'ECG, potassium, glucose, kidney function, removal, and rebound risk were reassessed without claiming resolution.'
          : 'Serial reassessment and rebound surveillance were incomplete or out of order.', atTick: reassessed?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-severe-symptomatic-hyponatremia', 'stabilize-severe-hyponatremia',
      'record-hypertonic-saline-intent', 'reassess-early-sodium-and-neurologic-response',
      'prevent-hyponatremia-overcorrection'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'severe-hyponatremia-with-seizure');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The severe-hyponatremia-with-seizure vignette was not active.' } satisfies ObjectiveFinding;
      const reviewed = log.find((event) => /^hyponatremia-reviewed-\d+$/.test(event.eventId));
      const stabilized = log.find((event) => /^hyponatremia-stabilized-\d+$/.test(event.eventId));
      const hypertonic = log.find((event) => /^hyponatremia-hypertonic-\d+$/.test(event.eventId));
      const reassessed = log.find((event) => /^hyponatremia-reassessed-\d+$/.test(event.eventId));
      const guardrails = log.find((event) => /^hyponatremia-guardrails-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-severe-symptomatic-hyponatremia') return {
        ...base, outcome: reviewed ? 'met' : 'not-met',
        finding: reviewed ? 'The seizure, persistent somnolence, sodium 112 mmol/L, normal glucose, and hypotonicity were integrated as a severe symptom-led emergency.'
          : 'The fixed neurologic and hypotonic-hyponatremia pattern was not reviewed.',
        atTick: reviewed?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'stabilize-severe-hyponatremia') {
        const ordered = reviewed && stabilized && reviewed.tick <= stabilized.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Injury protection, airway and breathing support, monitoring, access, glucose review, and expert escalation followed recognition in parallel.'
            : 'The bounded stabilization and escalation bundle was absent or out of order.', atTick: stabilized?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-hypertonic-saline-intent') {
        const ordered = stabilized && hypertonic && stabilized.tick <= hypertonic.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Immediate local-protocol intermittent hypertonic-saline intent followed stabilization without waiting for full cause classification.'
            : 'Symptom-led hypertonic-saline intent was absent or out of order.', atTick: hypertonic?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'reassess-early-sodium-and-neurologic-response') {
        const ordered = hypertonic && reassessed && hypertonic.tick <= reassessed.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'The authored +5 mmol/L first-hour rise, improved alertness, and rising urine output were reviewed before rescue closure.'
            : 'The first-hour neurologic, sodium, and urine-output reassessment was absent or out of order.', atTick: reassessed?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = reassessed && guardrails && reassessed.tick <= guardrails.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered ? 'Hypertonic rescue stopped at the immediate target; correction ceilings, serial surveillance, cause control, and specialist overcorrection planning were handed off.'
          : 'The stop, correction ceiling, cause evaluation, or overcorrection safety plan was incomplete or out of order.', atTick: guardrails?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-opioid-respiratory-emergency', 'ventilate-opioid-toxicity-first',
      'record-opioid-antagonist-intent', 'reassess-opioid-breathing-response',
      'manage-recurrent-opioid-depression'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'opioid-toxicity');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The opioid-toxicity vignette was not active.' } satisfies ObjectiveFinding;
      const reviewed = log.find((event) => /^opioid-toxicity-reviewed-\d+$/.test(event.eventId));
      const ventilation = log.find((event) => /^opioid-ventilation-\d+$/.test(event.eventId));
      const antagonist = log.find((event) => /^opioid-naloxone-\d+$/.test(event.eventId));
      const initial = log.find((event) => /^opioid-initial-reassessed-\d+$/.test(event.eventId));
      const recurrence = log.find((event) => /^opioid-recurrence-reviewed-\d+$/.test(event.eventId));
      const plan = log.find((event) => /^opioid-recurrence-plan-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-opioid-respiratory-emergency') return {
        ...base, outcome: reviewed ? 'met' : 'not-met',
        finding: reviewed ? 'Depressed responsiveness and ventilation, hypoxemia, hypercapnia, pupils, exposure, pulse, glucose, and immediate mimics were integrated without claiming diagnostic proof.'
          : 'The fixed opioid respiratory-emergency pattern and immediate mimics were not reviewed.',
        atTick: reviewed?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'ventilate-opioid-toxicity-first') {
        const ordered = reviewed && ventilation && reviewed.tick <= ventilation.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Airway opening, oxygen, effective ventilation, monitoring, access, glucose review, and help followed recognition without waiting for antagonist effect.'
            : 'Immediate breathing support and escalation were absent or out of order.', atTick: ventilation?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-opioid-antagonist-intent') {
        const ordered = ventilation && antagonist && ventilation.tick <= antagonist.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Local-protocol naloxone intent followed ventilation and targeted normal spontaneous breathing rather than mandatory full arousal.'
            : 'Naloxone intent was absent, preceded ventilation, or used the wrong endpoint.', atTick: antagonist?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'reassess-opioid-breathing-response') {
        const ordered = antagonist && initial && antagonist.tick <= initial.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Respiratory rate, oxygenation, carbon dioxide, responsiveness, and pulse were reviewed after the initial rescue.'
            : 'The initial respiratory response was absent or reviewed out of order.', atTick: initial?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = initial && recurrence && plan
        && initial.tick <= recurrence.tick && recurrence.tick <= plan.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered ? 'Recurrent respiratory depression triggered renewed ventilation, repeat-antagonist intent, monitored observation, co-exposure review, and discharge safety planning.'
          : 'Recurrence recognition, renewed rescue, observation, or discharge safety was incomplete or out of order.', atTick: plan?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-exertional-heat-stroke', 'stabilize-and-prepare-heat-stroke-cooling',
      'cool-exertional-heat-stroke-rapidly', 'stop-heat-stroke-cooling-at-target',
      'monitor-heat-stroke-organ-injury'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'exertional-heat-stroke');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The exertional-heat-stroke vignette was not active.' } satisfies ObjectiveFinding;
      const reviewed = log.find((event) => /^heat-stroke-reviewed-\d+$/.test(event.eventId));
      const support = log.find((event) => /^heat-stroke-supported-\d+$/.test(event.eventId));
      const cooling = log.find((event) => /^heat-stroke-cooling-\d+$/.test(event.eventId));
      const target = log.find((event) => /^heat-stroke-target-\d+$/.test(event.eventId));
      const surveillance = log.find((event) => /^heat-stroke-surveillance-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-exertional-heat-stroke') return {
        ...base, outcome: reviewed ? 'met' : 'not-met',
        finding: reviewed ? 'Exertion, CNS dysfunction, rectal core hyperthermia, glucose, sodium, trauma, medication, and immediate mimics were integrated.'
          : 'The fixed exertional heat-stroke pattern and immediate mimics were not reviewed.',
        atTick: reviewed?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'stabilize-and-prepare-heat-stroke-cooling') {
        const ordered = reviewed && support && reviewed.tick <= support.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'ABC support, monitoring, clothing removal, cooling preparation, airway access, and transport coordination followed recognition without delaying cooling.'
            : 'Parallel support and cooling preparation were absent or out of order.', atTick: support?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'cool-exertional-heat-stroke-rapidly') {
        const ordered = support && cooling && support.tick <= cooling.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Whole-body cold-water immersion with continuous rectal core monitoring followed support and remained central to transport coordination.'
            : 'Rapid conductive cooling was absent or out of order.', atTick: cooling?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'stop-heat-stroke-cooling-at-target') {
        const ordered = cooling && target && cooling.tick <= target.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'The fixed 38.9°C panel was reviewed and active cooling stopped below 39°C to limit overshoot.'
            : 'The cooling target was absent or reviewed out of order.', atTick: target?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = target && surveillance && target.tick <= surveillance.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered ? 'Delayed neurologic, renal, hepatic, coagulation, muscle, electrolyte, glucose, urine, and temperature surveillance continued without antipyretics or dantrolene.'
          : 'The multiorgan surveillance and inappropriate-drug boundary were incomplete or out of order.', atTick: surveillance?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['activate-structured-trauma-response', 'control-catastrophic-trauma-hemorrhage',
      'assess-trauma-airway-and-breathing', 'manage-trauma-circulation',
      'complete-and-repeat-trauma-survey'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'trauma-primary-survey');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The trauma-primary-survey vignette was not active.' } satisfies ObjectiveFinding;
      const activated = log.find((event) => /^trauma-activated-\d+$/.test(event.eventId));
      const hemorrhage = log.find((event) => /^trauma-hemorrhage-controlled-\d+$/.test(event.eventId));
      const airwayBreathing = log.find((event) => /^trauma-airway-breathing-reviewed-\d+$/.test(event.eventId));
      const circulation = log.find((event) => /^trauma-circulation-\d+$/.test(event.eventId));
      const disabilityExposure = log.find((event) => /^trauma-disability-exposure-reviewed-\d+$/.test(event.eventId));
      const repeated = log.find((event) => /^trauma-repeated-\d+$/.test(event.eventId));
      if (objective.id === 'activate-structured-trauma-response') return {
        ...base, outcome: activated ? 'met' : 'not-met',
        finding: activated ? 'Mechanism, time, suspected injuries, signs, prior treatment, team activation, and a repeated <C>ABCDE plan were integrated.'
          : 'The structured trauma handoff, response activation, and survey order were not recorded.',
        atTick: activated?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'control-catastrophic-trauma-hemorrhage') {
        const ordered = activated && hemorrhage && activated.tick <= hemorrhage.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Tourniquet intent with recorded time followed failed direct pressure and preceded the remaining survey.'
            : 'Catastrophic hemorrhage control was absent or out of order.', atTick: hemorrhage?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'assess-trauma-airway-and-breathing') {
        const ordered = hemorrhage && airwayBreathing && hemorrhage.tick <= airwayBreathing.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Airway with spinal-motion precautions and bilateral breathing were reviewed after catastrophic hemorrhage control.'
            : 'The A and B review was absent or out of order.', atTick: airwayBreathing?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'manage-trauma-circulation') {
        const ordered = airwayBreathing && circulation && airwayBreathing.tick <= circulation.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Persistent shock triggered pelvic stabilization, blood-based resuscitation, early antifibrinolytic intent, minimal directing imaging, and definitive-control escalation.'
            : 'The circulation and definitive-control path was absent or out of order.', atTick: circulation?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = circulation && disabilityExposure && repeated
        && circulation.tick <= disabilityExposure.tick && disabilityExposure.tick <= repeated.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered ? 'Disability, glucose, exposure, posterior surfaces, and heat-loss prevention were followed by a complete repeated survey and trend handoff.'
          : 'D, E, heat-loss prevention, repeated <C>ABCDE, or trend handoff was incomplete or out of order.', atTick: repeated?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['assess-aortic-presentation-without-closure', 'detect-evolving-aortic-asymmetry',
      'escalate-suspected-aortic-syndrome', 'record-aortic-anti-impulse-intent',
      'image-and-hand-off-aortic-uncertainty'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'acute-aortic-syndrome');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The acute-aortic-syndrome vignette was not active.' } satisfies ObjectiveFinding;
      const initial = log.find((event) => /^aortic-initial-reviewed-\d+$/.test(event.eventId));
      const evolution = log.find((event) => /^aortic-evolution-reviewed-\d+$/.test(event.eventId));
      const escalation = log.find((event) => /^aortic-pathway-activated-\d+$/.test(event.eventId));
      const antiImpulse = log.find((event) => /^aortic-anti-impulse-\d+$/.test(event.eventId));
      const imaging = log.find((event) => /^aortic-imaging-prioritized-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^aortic-evolution-handed-off-\d+$/.test(event.eventId));
      if (objective.id === 'assess-aortic-presentation-without-closure') return {
        ...base, outcome: initial ? 'met' : 'not-met',
        finding: initial ? 'Abrupt maximal-at-onset pain was integrated with a nondiagnostic ECG and initially symmetric territories without premature closure.'
          : 'The incomplete initial aortic and competing chest-pain pattern was not reviewed.',
        atTick: initial?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'detect-evolving-aortic-asymmetry') {
        const ordered = initial && evolution && initial.tick <= evolution.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Repeat bilateral pressure, pulse, limb-perfusion, and neurologic checks revealed the authored multi-territory change.'
            : 'The evolving asymmetry was absent or reviewed before the baseline.', atTick: evolution?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'escalate-suspected-aortic-syndrome') {
        const ordered = evolution && escalation && evolution.tick <= escalation.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'The evolving discordance triggered immediate multidisciplinary aortic escalation and paused unsupported default pathways.'
            : 'Aortic escalation was absent or preceded recognition of the evolving pattern.', atTick: escalation?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-aortic-anti-impulse-intent') {
        const ordered = escalation && antiImpulse && escalation.tick <= antiImpulse.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered ? 'Monitored analgesia and rate-first anti-impulse intent used explicit heart-rate, pressure, and end-organ-perfusion guardrails.'
            : 'Perfusion-preserving anti-impulse intent was absent or out of order.', atTick: antiImpulse?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = antiImpulse && imaging && handoff
        && antiImpulse.tick <= imaging.tick && imaging.tick <= handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered ? 'Urgent definitive imaging was prioritized, then serial territories, changes, competing diagnoses, and the unavailable result were handed off.'
          : 'Definitive imaging intent, serial reassessment, or uncertainty handoff was incomplete or out of order.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['review-ards-ventilation-baseline', 'calculate-ards-predicted-body-weight',
      'record-ards-lung-protective-settings', 'reassess-ards-gas-and-mechanics',
      'escalate-moderate-severe-ards-support'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'ards-lung-protective-ventilation');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The ARDS lung-protective-ventilation vignette was not active.' } satisfies ObjectiveFinding;
      const baseline = log.find((event) => /^ards-baseline-reviewed-\d+$/.test(event.eventId));
      const pbw = log.find((event) => /^ards-pbw-calculated-\d+$/.test(event.eventId));
      const protection = log.find((event) => /^ards-protection-recorded-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^ards-protection-reassessed-\d+$/.test(event.eventId));
      const escalation = log.find((event) => /^ards-escalation-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'review-ards-ventilation-baseline') return { ...base,
        outcome: baseline ? 'met' : 'not-met', finding: baseline
          ? 'Oxygenation, gas exchange, delivered support, plateau pressure, synchrony, and circulation were integrated.'
          : 'The initial gas-exchange and mechanics panel was not reviewed.', atTick: baseline?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'calculate-ards-predicted-body-weight') {
        const ordered = baseline && pbw && baseline.tick <= pbw.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Height and sex established the 61.5 kg predicted-body-weight basis instead of actual weight.'
          : 'The predicted-body-weight basis was absent or out of order.', atTick: pbw?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-ards-lung-protective-settings') {
        const ordered = pbw && protection && pbw.tick <= protection.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'A 370 mL, about 6 mL/kg PBW intent with plateau pressure below 30 cm H₂O followed the PBW review.'
          : 'Lung-protective settings were absent or out of order.', atTick: protection?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'reassess-ards-gas-and-mechanics') {
        const ordered = protection && reassessment && protection.tick <= reassessment.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'The 30-minute plateau, oxygenation, pH, carbon dioxide, synchrony, and circulation response was reviewed together.'
          : 'The post-change whole-patient reassessment was absent or out of order.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = reassessment && escalation && reassessment.tick <= escalation.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Persistent hypoxemia triggered protocolized PEEP/FiO₂ and prolonged-prone-team intent with safety monitoring.'
        : 'Moderate-severe ARDS escalation was absent or preceded reassessment.', atTick: escalation?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['validate-hypoxemia-signal', 'support-hypoxemia-and-call-help',
      'trace-oxygen-delivery-path', 'integrate-hypoxemia-bedside-pattern',
      'escalate-and-reassess-hypoxemia'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'escalating-hypoxemia');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The escalating-hypoxemia vignette was not active.' } satisfies ObjectiveFinding;
      const signal = log.find((event) => /^hypoxemia-signal-validated-\d+$/.test(event.eventId));
      const support = log.find((event) => /^hypoxemia-support-recorded-\d+$/.test(event.eventId));
      const path = log.find((event) => /^hypoxemia-delivery-path-reviewed-\d+$/.test(event.eventId));
      const pattern = log.find((event) => /^hypoxemia-bedside-pattern-reviewed-\d+$/.test(event.eventId));
      const escalation = log.find((event) => /^hypoxemia-escalation-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'validate-hypoxemia-signal') return { ...base,
        outcome: signal ? 'met' : 'not-met', finding: signal
          ? 'Pleth quality, saturation trend, and the fixed arterial panel established a credible decline.'
          : 'The saturation decline was not corroborated.', atTick: signal?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'support-hypoxemia-and-call-help') {
        const ordered = signal && support && signal.tick <= support.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Immediate oxygen-support intent and experienced ICU plus respiratory-therapy help followed recognition.'
          : 'Immediate support and help were absent or preceded signal review.', atTick: support?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'trace-oxygen-delivery-path') {
        const ordered = support && path && support.tick <= path.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Oxygen source, circuit, capnography, tube depth, and suction path were traced outside in.'
          : 'The delivery-path check was absent or out of order.', atTick: path?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'integrate-hypoxemia-bedside-pattern') {
        const ordered = path && pattern && path.tick <= pattern.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Chest symmetry, airway pressures, capnography, and circulation narrowed immediate threats without claiming exclusion.'
          : 'The bedside pattern was absent or interpreted before the delivery path.', atTick: pattern?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = pattern && escalation && pattern.tick <= escalation.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Urgent gas and imaging intent, protocolized support, and a fixed whole-patient response followed the structured review.'
        : 'Escalation and reassessment were absent or preceded the structured review.', atTick: escalation?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['review-dyssynchrony-patient-and-graphics', 'review-dyssynchrony-drivers',
      'classify-dyssynchrony-pattern', 'record-dyssynchrony-correction-intent',
      'reassess-dyssynchrony-response'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'ventilator-dyssynchrony');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The ventilator-dyssynchrony vignette was not active.' } satisfies ObjectiveFinding;
      const graphics = log.find((event) => /^dyssynchrony-graphics-reviewed-\d+$/.test(event.eventId));
      const drivers = log.find((event) => /^dyssynchrony-drivers-reviewed-\d+$/.test(event.eventId));
      const classification = log.find((event) => /^dyssynchrony-pattern-classified-\d+$/.test(event.eventId));
      const correction = log.find((event) => /^dyssynchrony-correction-recorded-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^dyssynchrony-response-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'review-dyssynchrony-patient-and-graphics') return { ...base,
        outcome: graphics ? 'met' : 'not-met', finding: graphics
          ? 'Patient effort, pressure and flow shape, cycling, double triggers, and stacked volume were integrated.'
          : 'The patient and graphics panel was not reviewed.', atTick: graphics?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-dyssynchrony-drivers') {
        const ordered = graphics && drivers && graphics.tick <= drivers.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Pain, drive, airway, secretion, circuit, auto-PEEP, gas, and circulation drivers followed the graphics review.'
          : 'The driver review was absent or out of order.', atTick: drivers?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'classify-dyssynchrony-pattern') {
        const ordered = drivers && classification && drivers.tick <= classification.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'The bounded flow-starvation, premature-cycling, and double-triggering pattern was classified after driver review.'
          : 'The pattern was absent or classified before reversible drivers were reviewed.', atTick: classification?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-dyssynchrony-correction-intent') {
        const ordered = classification && correction && classification.tick <= correction.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Analgesia-first and respiratory-therapy adjustment intent matched flow and cycling while preserving protection.'
          : 'Cause-directed correction was absent or preceded classification.', atTick: correction?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = correction && reassessment && correction.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Comfort, effort, graphics, delivered volume, pressure, gas exchange, and circulation improved on the fixed 10-minute panel.'
        : 'Whole-patient reassessment was absent or preceded correction.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['review-auto-peep-patient-and-flow', 'measure-auto-peep',
      'classify-auto-peep-pattern', 'record-auto-peep-correction-intent',
      'reassess-auto-peep-response'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'auto-peep');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The auto-PEEP vignette was not active.' } satisfies ObjectiveFinding;
      const flow = log.find((event) => /^auto-peep-flow-reviewed-\d+$/.test(event.eventId));
      const measurement = log.find((event) => /^auto-peep-measured-\d+$/.test(event.eventId));
      const classification = log.find((event) => /^auto-peep-pattern-classified-\d+$/.test(event.eventId));
      const correction = log.find((event) => /^auto-peep-correction-recorded-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^auto-peep-response-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'review-auto-peep-patient-and-flow') return { ...base,
        outcome: flow ? 'met' : 'not-met', finding: flow
          ? 'Patient status, expiratory flow, timing, pressures, gas exchange, and circulation were integrated.'
          : 'The whole-patient expiratory-flow panel was not reviewed.', atTick: flow?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'measure-auto-peep') {
        const ordered = flow && measurement && flow.tick <= measurement.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'A valid passive hold separated set PEEP 5, total PEEP 16, and intrinsic PEEP 11 cm H₂O.'
          : 'The passive measurement was absent or preceded the flow review.', atTick: measurement?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'classify-auto-peep-pattern') {
        const ordered = measurement && classification && measurement.tick <= classification.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'The bounded dynamic-hyperinflation pattern and its trigger and hemodynamic consequences followed valid measurement.'
          : 'The pattern was absent or classified before valid measurement.', atTick: classification?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-auto-peep-correction-intent') {
        const ordered = classification && correction && classification.tick <= correction.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Obstruction treatment and more-expiratory-time intent preserved lung-protective and hemodynamic guardrails.'
          : 'Cause-directed correction was absent or preceded classification.', atTick: correction?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = correction && reassessment && correction.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Flow, intrinsic PEEP, peak pressure, triggering, gas exchange, and circulation improved on the fixed 10-minute panel.'
        : 'Whole-patient reassessment was absent or preceded correction.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['support-mucus-plugging-and-call-help', 'review-mucus-plugging-indicators',
      'record-indicated-airway-suction-intent', 'reassess-mucus-plugging-response',
      'escalate-persistent-mucus-plugging'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'mucus-plugging');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The mucus-plugging vignette was not active.' } satisfies ObjectiveFinding;
      const support = log.find((event) => /^mucus-support-recorded-\d+$/.test(event.eventId));
      const indicators = log.find((event) => /^mucus-indicators-reviewed-\d+$/.test(event.eventId));
      const suction = log.find((event) => /^mucus-suction-recorded-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^mucus-response-reassessed-\d+$/.test(event.eventId));
      const escalation = log.find((event) => /^mucus-escalation-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'support-mucus-plugging-and-call-help') return { ...base,
        outcome: support ? 'met' : 'not-met', finding: support
          ? 'Oxygen-support intent and experienced respiratory-therapy and ICU help were recorded.'
          : 'Immediate support and help were not recorded.', atTick: support?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-mucus-plugging-indicators') {
        const ordered = support && indicators && support.tick <= indicators.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Sounds, secretion, flow, pressure, tube, circuit, gas, and circulation followed support.'
          : 'The indicator review was absent or out of order.', atTick: indicators?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-indicated-airway-suction-intent') {
        const ordered = indicators && suction && indicators.tick <= suction.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Preoxygenated as-needed shallow-first suction intent avoided routine saline after indication review.'
          : 'Airway-clearance intent was absent or preceded indication review.', atTick: suction?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'reassess-mucus-plugging-response') {
        const ordered = suction && reassessment && suction.tick <= reassessment.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Secretions, flow, pressures, gas exchange, circulation, and the persistent focal finding were reassessed.'
          : 'Reassessment was absent or preceded clearance intent.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = reassessment && escalation && reassessment.tick <= escalation.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Persistent focal physiology triggered imaging and experienced airway review without routine bronchoscopy.'
        : 'Escalation was absent or preceded the persistent finding.', atTick: escalation?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['support-unplanned-extubation-and-call-help', 'assess-unplanned-extubation-tolerance',
      'classify-unplanned-extubation-failure', 'record-unplanned-extubation-airway-plan',
      'reassess-unplanned-extubation-response'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'unplanned-extubation');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The unplanned-extubation vignette was not active.' } satisfies ObjectiveFinding;
      const support = log.find((event) => /^unplanned-extubation-support-recorded-\d+$/.test(event.eventId));
      const assessment = log.find((event) => /^unplanned-extubation-tolerance-assessed-\d+$/.test(event.eventId));
      const failure = log.find((event) => /^unplanned-extubation-failure-classified-\d+$/.test(event.eventId));
      const plan = log.find((event) => /^unplanned-extubation-airway-plan-recorded-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^unplanned-extubation-response-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'support-unplanned-extubation-and-call-help') return { ...base,
        outcome: support ? 'met' : 'not-met', finding: support
          ? 'The event was announced with oxygen-support and respiratory-therapy, ICU, and airway help intent.'
          : 'Immediate support and experienced help were not recorded.', atTick: support?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'assess-unplanned-extubation-tolerance') {
        const ordered = support && assessment && support.tick <= assessment.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Airway protection, work, gas exchange, alertness, secretions, and circulation were assessed after support.'
          : 'The tolerance assessment was absent or out of order.', atTick: assessment?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'classify-unplanned-extubation-failure') {
        const ordered = assessment && failure && assessment.tick <= failure.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Convergent whole-patient failure, rather than the event alone, triggered prompt reintubation intent.'
          : 'Failure classification was absent or preceded assessment.', atTick: failure?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-unplanned-extubation-airway-plan') {
        const ordered = failure && plan && failure.tick <= plan.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Experienced-team preoxygenation and reintubation intent included preparation, backup, and no NIV delay.'
          : 'The airway plan was absent or preceded failure recognition.', atTick: plan?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = plan && reassessment && plan.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Reported capnography, bilateral ventilation, tube state, physiology, and prevention handoff closed the loop.'
        : 'Placement and whole-patient reassessment were absent or preceded the airway plan.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['review-sbt-readiness', 'start-bounded-sbt', 'recognize-sbt-failure',
      'stop-failed-sbt-and-recover', 'plan-after-failed-sbt'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'spontaneous-breathing-trial');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The spontaneous-breathing-trial vignette was not active.' } satisfies ObjectiveFinding;
      const readiness = log.find((event) => /^sbt-readiness-reviewed-\d+$/.test(event.eventId));
      const started = log.find((event) => /^sbt-started-\d+$/.test(event.eventId));
      const failure = log.find((event) => /^sbt-failure-recognized-\d+$/.test(event.eventId));
      const recovery = log.find((event) => /^sbt-recovery-reviewed-\d+$/.test(event.eventId));
      const plan = log.find((event) => /^sbt-plan-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'review-sbt-readiness') return { ...base,
        outcome: readiness ? 'met' : 'not-met', finding: readiness
          ? 'Cause, oxygenation, circulation, wakefulness, effort, cough, and secretions were reviewed without requiring RSBI.'
          : 'The standardized readiness review was absent.', atTick: readiness?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'start-bounded-sbt') {
        const ordered = readiness && started && readiness.tick <= started.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'A bounded local SBT followed readiness with FiO₂ unchanged.'
          : 'The trial was absent or preceded readiness.', atTick: started?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'recognize-sbt-failure') {
        const ordered = started && failure && started.tick <= failure.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Work, pattern, oxygenation, circulation, comfort, and trajectory established intolerance.'
          : 'Failure recognition was absent or preceded the trial.', atTick: failure?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'stop-failed-sbt-and-recover') {
        const ordered = failure && recovery && failure.tick <= recovery.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'The trial stopped, prior support returned, and whole-patient recovery was reviewed.'
          : 'Recovery was absent or preceded failure recognition.', atTick: recovery?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = recovery && plan && recovery.tick <= plan.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Reversible contributors and repeat assessment were handed off without equating SBT success with extubation readiness.'
        : 'The next-step plan was absent or preceded recovery.', atTick: plan?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['validate-post-intubation-pressure-and-call-help',
      'review-post-intubation-danger-pattern', 'classify-post-intubation-hemodynamics',
      'record-post-intubation-support-intent',
      'reassess-post-intubation-hypotension'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'post-intubation-hypotension');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The post-intubation hypotension vignette was not active.' } satisfies ObjectiveFinding;
      const pressure = log.find((event) => /^post-intubation-pressure-validated-\d+$/.test(event.eventId));
      const danger = log.find((event) => /^post-intubation-danger-reviewed-\d+$/.test(event.eventId));
      const mechanism = log.find((event) => /^post-intubation-mechanism-classified-\d+$/.test(event.eventId));
      const support = log.find((event) => /^post-intubation-support-recorded-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^post-intubation-response-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'validate-post-intubation-pressure-and-call-help') return { ...base,
        outcome: pressure ? 'met' : 'not-met', finding: pressure
          ? 'Severe pulsatile hypotension and impaired perfusion were validated while experienced help was called.'
          : 'Pressure validation, perfusion review, or help was absent.', atTick: pressure?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-post-intubation-danger-pattern') {
        const ordered = pressure && danger && pressure.tick <= danger.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Airway, ventilation, pressures, flow, rhythm, bleeding, allergy, pump, and obstruction followed validation.'
          : 'The immediate-danger review was absent or out of order.', atTick: danger?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'classify-post-intubation-hemodynamics') {
        const ordered = danger && mechanism && danger.tick <= mechanism.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'The dynamic proxy and whole-patient panel supported mixed vasodilation and preload sensitivity without diagnostic closure.'
          : 'Mechanism classification was absent or preceded the danger review.', atTick: mechanism?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-post-intubation-support-intent') {
        const ordered = mechanism && support && mechanism.tick <= support.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Concurrent norepinephrine and cautious balanced-crystalloid intent used a MAP and reassessment guardrail.'
          : 'Cause-linked support was absent or preceded classification.', atTick: support?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = support && reassessment && support.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Pressure, perfusion, dynamic response, lungs, and gas exchange improved while septic-shock work stayed open.'
        : 'Whole-patient reassessment was absent or preceded support.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-cardiogenic-shock-trajectory',
      'review-cardiogenic-shock-cause-and-phenotype', 'record-cardiogenic-shock-bridge',
      'escalate-cardiogenic-shock-cause-control',
      'reassess-cardiogenic-shock-trajectory'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'cardiogenic-shock');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The cardiogenic-shock vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => /^cardiogenic-shock-trajectory-recognized-\d+$/.test(event.eventId));
      const phenotype = log.find((event) => /^cardiogenic-shock-phenotype-reviewed-\d+$/.test(event.eventId));
      const bridge = log.find((event) => /^cardiogenic-shock-bridge-recorded-\d+$/.test(event.eventId));
      const causeControl = log.find((event) => /^cardiogenic-shock-cause-control-escalated-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^cardiogenic-shock-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-cardiogenic-shock-trajectory') return { ...base,
        outcome: recognition ? 'met' : 'not-met', finding: recognition
          ? 'Worsening brain, skin, kidney, lactate, and pressure evidence triggered multidisciplinary shock help.'
          : 'The perfusion trajectory or multidisciplinary activation was absent.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-cardiogenic-shock-cause-and-phenotype') {
        const ordered = recognition && phenotype && recognition.tick <= phenotype.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'The fixed ECG, echo, lung, rhythm, and perfusion panel supported a congested LV-predominant acute-MI phenotype without closing alternatives.'
          : 'Cause-and-phenotype review was absent or preceded shock recognition.', atTick: phenotype?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-cardiogenic-shock-bridge') {
        const ordered = phenotype && bridge && phenotype.tick <= bridge.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'A perfusion-linked norepinephrine bridge avoided primary fluid loading and universal targets.'
          : 'The bounded bridge was absent or preceded phenotype review.', atTick: bridge?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'escalate-cardiogenic-shock-cause-control') {
        const ordered = bridge && causeControl && bridge.tick <= causeControl.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Prompt culprit-vessel revascularization took priority while further support remained expert selected.'
          : 'Cause control was absent or preceded the initial bridge.', atTick: causeControl?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = causeControl && reassessment && causeControl.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Pressure and immediate perfusion improved while congestion, organ trajectory, and definitive work stayed open.'
        : 'Trajectory reassessment was absent or preceded cause control.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-mixed-shock-discordance', 'classify-mixed-shock-hemodynamics',
      'record-mixed-shock-support', 'address-mixed-shock-causes',
      'reassess-mixed-shock-trajectory'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'mixed-shock');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The mixed-shock vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => /^mixed-shock-discordance-recognized-\d+$/.test(event.eventId));
      const hemodynamics = log.find((event) => /^mixed-shock-hemodynamics-classified-\d+$/.test(event.eventId));
      const support = log.find((event) => /^mixed-shock-support-recorded-\d+$/.test(event.eventId));
      const causes = log.find((event) => /^mixed-shock-causes-addressed-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^mixed-shock-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-mixed-shock-discordance') return { ...base,
        outcome: recognition ? 'met' : 'not-met', finding: recognition
          ? 'Discordant perfusion, congestion, infection, cardiac, and treatment-context clues triggered experienced help.'
          : 'The discordant trajectory or experienced-team activation was absent.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'classify-mixed-shock-hemodynamics') {
        const ordered = recognition && hemodynamics && recognition.tick <= hemodynamics.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Output, filling pressure, tone, echo, lungs, perfusion, and treatment context supported a cardiac-vasodilatory phenotype without universal cutoffs.'
          : 'Hemodynamic classification was absent or preceded recognition.', atTick: hemodynamics?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-mixed-shock-support') {
        const ordered = hemodynamics && support && hemodynamics.tick <= support.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Tone support and expert output-support review were paired with congestion guardrails and no blind fluid loading.'
          : 'Mixed-physiology support was absent or preceded classification.', atTick: support?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'address-mixed-shock-causes') {
        const ordered = support && causes && support.tick <= causes.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Cardiac and pneumonia cause-control pathways remained active in parallel.'
          : 'Parallel cause control was absent or preceded support.', atTick: causes?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = causes && reassessment && causes.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Immediate perfusion improved while congestion, organ trajectory, and both causes stayed open.'
        : 'Whole-trajectory reassessment was absent or preceded cause control.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-rv-failure-trajectory', 'review-rv-failure-phenotype',
      'record-rv-failure-support', 'address-rv-failure-triggers',
      'reassess-rv-failure-trajectory'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'right-ventricular-failure');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The right-ventricular-failure vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => /^rv-failure-trajectory-recognized-\d+$/.test(event.eventId));
      const phenotype = log.find((event) => /^rv-failure-phenotype-reviewed-\d+$/.test(event.eventId));
      const support = log.find((event) => /^rv-failure-support-recorded-\d+$/.test(event.eventId));
      const triggers = log.find((event) => /^rv-failure-triggers-addressed-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^rv-failure-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-rv-failure-trajectory') return { ...base,
        outcome: recognition ? 'met' : 'not-met', finding: recognition
          ? 'Systemic congestion plus worsening brain, skin, kidney, lactate, and pressure evidence triggered pulmonary-hypertension, cardiac, and shock help.'
          : 'The congestion-underperfusion trajectory or experienced-team activation was absent.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-rv-failure-phenotype') {
        const ordered = recognition && phenotype && recognition.tick <= phenotype.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'The fixed RV, septal, LV, filling-pressure, and output panel supported pressure-loaded RV failure without universal cutoffs.'
          : 'RV-phenotype review was absent or preceded recognition.', atTick: phenotype?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-rv-failure-support') {
        const ordered = phenotype && support && phenotype.tick <= support.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Systemic perfusion and RV-protective support were reviewed with individualized preload and no reflex fluid or decongestion rule.'
          : 'Individualized RV support was absent or preceded phenotype review.', atTick: support?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'address-rv-failure-triggers') {
        const ordered = support && triggers && support.tick <= triggers.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Hypoxia, acidosis, infection, rhythm, ischemia, embolism, medication, airway-pressure, and specialist pulmonary-vascular pathways remained open.'
          : 'Trigger review was absent or preceded support.', atTick: triggers?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = triggers && reassessment && triggers.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Immediate perfusion and oxygenation improved while congestion, precipitant, RV, and organ trajectories stayed open.'
        : 'Whole-trajectory reassessment was absent or preceded trigger review.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-refractory-pe-shock', 'review-refractory-pe-pattern',
      'record-refractory-pe-support', 'activate-pe-ecmo-bridge',
      'reassess-pe-ecmo-trajectory'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'massive-pulmonary-embolism');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The massive-pulmonary-embolism vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => /^massive-pe-shock-recognized-\d+$/.test(event.eventId));
      const pattern = log.find((event) => /^massive-pe-pattern-reviewed-\d+$/.test(event.eventId));
      const support = log.find((event) => /^massive-pe-support-recorded-\d+$/.test(event.eventId));
      const ecmo = log.find((event) => /^massive-pe-ecmo-activated-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^massive-pe-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-refractory-pe-shock') return { ...base,
        outcome: recognition ? 'met' : 'not-met', finding: recognition
          ? 'Confirmed PE with refractory shock and ventilatory failure triggered Category E2R PERT and ECMO-capable rescue activation.'
          : 'Category E2R recognition or multidisciplinary rescue activation was absent.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-refractory-pe-pattern') {
        const ordered = recognition && pattern && recognition.tick <= pattern.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'The fixed PE, RV, ventilation, perfusion, bleeding, and alternate-cause panel supported acute obstructive RV failure.'
          : 'The rescue-context review was absent or preceded recognition.', atTick: pattern?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-refractory-pe-support') {
        const ordered = pattern && support && pattern.tick <= support.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Systemic perfusion, oxygenation, ventilatory pressure, rhythm, and anticoagulation were reviewed without blind fluid loading.'
          : 'RV-sensitive support was absent or preceded the pattern review.', atTick: support?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'activate-pe-ecmo-bridge') {
        const ordered = support && ecmo && support.tick <= ecmo.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Resource- and candidacy-dependent VA-ECMO was activated as temporary perfusion and oxygenation support, not clot treatment.'
          : 'The rescue bridge was absent or preceded support review.', atTick: ecmo?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = ecmo && reassessment && ecmo.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Immediate flow and oxygenation improved while RV failure, embolic burden, organ trajectory, and individualized adjunctive reperfusion stayed open.'
        : 'Post-bridge reassessment was absent or preceded bridge activation.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-recurrent-upper-gi-hemorrhage', 'review-upper-gi-hemorrhage-pattern',
      'record-upper-gi-hemorrhage-resuscitation', 'activate-repeat-endoscopy-pathway',
      'reassess-upper-gi-hemorrhage-trajectory'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'upper-gi-hemorrhage');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The upper-GI-hemorrhage vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => /^upper-gi-hemorrhage-recognized-\d+$/.test(event.eventId));
      const pattern = log.find((event) => /^upper-gi-hemorrhage-pattern-reviewed-\d+$/.test(event.eventId));
      const resuscitation = log.find((event) => /^upper-gi-hemorrhage-resuscitation-recorded-\d+$/.test(event.eventId));
      const hemostasis = log.find((event) => /^upper-gi-hemorrhage-hemostasis-activated-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^upper-gi-hemorrhage-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-recurrent-upper-gi-hemorrhage') return { ...base,
        outcome: recognition ? 'met' : 'not-met', finding: recognition
          ? 'Recurrent hematemesis, melena, and worsening perfusion triggered GI, hemorrhage, critical-care, and blood-bank activation.'
          : 'Recurrent hemorrhage recognition or experienced-team activation was absent.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-upper-gi-hemorrhage-pattern') {
        const ordered = recognition && pattern && recognition.tick <= pattern.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'The fixed source, perfusion, airway, medication, and alternate-source context was integrated without using hemoglobin alone.'
          : 'Whole-pattern review was absent or preceded recognition.', atTick: pattern?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-upper-gi-hemorrhage-resuscitation') {
        const ordered = pattern && resuscitation && pattern.tick <= resuscitation.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Hemodynamic, access, laboratory, blood-bank, and restrictive-transfusion review was individualized to the whole trajectory.'
          : 'Individualized resuscitation review was absent or preceded pattern review.', atTick: resuscitation?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'activate-repeat-endoscopy-pathway') {
        const ordered = resuscitation && hemostasis && resuscitation.tick <= hemostasis.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Repeat endoscopy was activated alongside resuscitation, with embolization and surgery preserved after pathway failure.'
          : 'Definitive-hemostasis escalation was absent or preceded resuscitation review.', atTick: hemostasis?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = hemostasis && reassessment && hemostasis.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Immediate perfusion improved while hemostasis, recurrent bleeding, laboratory, organ, and failure-pathway trajectories remained open.'
        : 'Post-bridge reassessment was absent or preceded hemostasis escalation.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-refractory-status-epilepticus', 'review-refractory-status-pattern',
      'activate-refractory-status-pathway', 'address-refractory-status-causes',
      'reassess-refractory-status-trajectory'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'critical-care-status-epilepticus');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The critical-care refractory-status vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => /^critical-care-status-recognized-\d+$/.test(event.eventId));
      const pattern = log.find((event) => /^critical-care-status-pattern-reviewed-\d+$/.test(event.eventId));
      const pathway = log.find((event) => /^critical-care-status-pathway-activated-\d+$/.test(event.eventId));
      const causes = log.find((event) => /^critical-care-status-causes-addressed-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^critical-care-status-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-refractory-status-epilepticus') return { ...base,
        outcome: recognition ? 'met' : 'not-met', finding: recognition
          ? 'Persistent electrographic seizures despite reported emergent and urgent therapy triggered refractory-status escalation despite stopped convulsions.'
          : 'Refractory electrographic status recognition or experienced-team activation was absent.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-refractory-status-pattern') {
        const ordered = recognition && pattern && recognition.tick <= pattern.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'The authored EEG report was integrated with airway, ventilation, perfusion, temperature, medication, and mimic context.'
          : 'Whole-pattern review was absent or preceded recognition.', atTick: pattern?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'activate-refractory-status-pathway') {
        const ordered = pattern && pathway && pattern.tick <= pathway.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Expert continuous-anesthetic and EEG pathways were activated with ventilation and hemodynamic guardrails and no universal agent or target.'
          : 'The refractory-status pathway was absent or preceded pattern review.', atTick: pathway?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'address-refractory-status-causes') {
        const ordered = pathway && causes && pathway.tick <= causes.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Metabolic, toxic, infectious, structural, vascular, immune, and medication pathways remained active during suppression.'
          : 'Cause review was absent or preceded refractory therapy activation.', atTick: causes?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = causes && reassessment && causes.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'The fixed EEG and systemic response improved briefly while durable control, recurrence, cause, sedation, organ, and recovery trajectories stayed open.'
        : 'Whole-trajectory reassessment was absent or preceded cause review.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-post-arrest-temperature-control', 'review-post-arrest-temperature-context',
      'activate-post-arrest-temperature-protocol', 'record-temperature-control-guardrails',
      'reassess-post-arrest-temperature-trajectory'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'targeted-temperature-management');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The post-arrest temperature-control vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => /^post-arrest-temperature-recognized-\d+$/.test(event.eventId));
      const context = log.find((event) => /^post-arrest-temperature-context-reviewed-\d+$/.test(event.eventId));
      const protocol = log.find((event) => /^post-arrest-temperature-protocol-activated-\d+$/.test(event.eventId));
      const guardrails = log.find((event) => /^post-arrest-temperature-guardrails-recorded-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^post-arrest-temperature-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-post-arrest-temperature-control') return { ...base,
        outcome: recognition ? 'met' : 'not-met', finding: recognition
          ? 'Absent command following after ROSC triggered deliberate protocolized temperature control without an early prognosis.'
          : 'Temperature-control eligibility or experienced-team activation was absent.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-post-arrest-temperature-context') {
        const ordered = recognition && context && recognition.tick <= context.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Neurologic, temperature, perfusion, oxygenation, ventilation, seizure, and cause findings shaped the strategy without a prognostic shortcut.'
          : 'Whole-context review was absent or preceded recognition.', atTick: context?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'activate-post-arrest-temperature-protocol') {
        const ordered = context && protocol && context.tick <= protocol.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'An individualized 32–37.5°C protocol for at least 36 hours was activated without claiming one universally superior target.'
          : 'The protocolized strategy was absent or preceded context review.', atTick: protocol?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'record-temperature-control-guardrails') {
        const ordered = protocol && guardrails && protocol.tick <= guardrails.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Core temperature, shivering, sedation, ventilation, perfusion, organ, fluid, device, and controlled-rewarming guardrails were recorded.'
          : 'Whole-patient guardrails were absent or preceded protocol activation.', atTick: guardrails?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = guardrails && reassessment && guardrails.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Temperature entered the authored range while durable control, cause, seizure, cardiac, organ, neurologic, and prognosis trajectories stayed open.'
        : 'Whole-trajectory reassessment was absent or preceded guardrail review.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-intracranial-hypertension', 'review-intracranial-hypertension-context',
      'activate-first-tier-brain-protection', 'activate-individualized-hyperosmolar-rescue',
      'reassess-intracranial-hypertension-trajectory'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'intracranial-hypertension');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The intracranial-hypertension vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => /^intracranial-hypertension-recognized-\d+$/.test(event.eventId));
      const context = log.find((event) => /^intracranial-hypertension-context-reviewed-\d+$/.test(event.eventId));
      const protection = log.find((event) => /^intracranial-hypertension-protection-activated-\d+$/.test(event.eventId));
      const rescue = log.find((event) => /^intracranial-hypertension-rescue-activated-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^intracranial-hypertension-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-intracranial-hypertension') return { ...base,
        outcome: recognition ? 'met' : 'not-met', finding: recognition
          ? 'Sustained ICP 28 mmHg with CPP 54 mmHg triggered experienced neurocritical and neurosurgical help in the fixed examination and imaging context.'
          : 'Intracranial-hypertension recognition or experienced-team activation was absent.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-intracranial-hypertension-context') {
        const ordered = recognition && context && recognition.tick <= context.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Monitor, pupils, imaging, position, synchrony, oxygenation, ventilation, perfusion, temperature, seizure, sodium, and volume findings shaped the response.'
          : 'Whole-context review was absent or preceded recognition.', atTick: context?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'activate-first-tier-brain-protection') {
        const ordered = context && protection && context.tick <= protection.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Venous drainage and systemic brain-protection intents were activated with individualized CPP and ventilation guardrails.'
          : 'First-tier brain protection was absent or preceded context review.', atTick: protection?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'activate-individualized-hyperosmolar-rescue') {
        const ordered = protection && rescue && protection.tick <= rescue.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Expert-selected hyperosmolar rescue and sodium, renal, osmolar, volume, access, and response guardrails were activated without a universal recipe.'
          : 'Individualized rescue was absent or preceded first-tier protection.', atTick: rescue?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = rescue && reassessment && rescue.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Reported ICP fell to 19 mmHg and CPP rose to 65 mmHg while durability, imaging, escalation, recovery, prognosis, and outcome stayed open.'
        : 'ICP and CPP reassessment was absent or preceded rescue review.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-aki-fluid-overload', 'review-aki-fluid-overload-context',
      'limit-fluid-and-review-diuretic-response', 'activate-individualized-kidney-support-pathway',
      'reassess-aki-fluid-overload-trajectory'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'acute-kidney-injury-with-fluid-overload');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The AKI fluid-overload vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => /^aki-fluid-overload-recognized-\d+$/.test(event.eventId));
      const context = log.find((event) => /^aki-fluid-overload-context-reviewed-\d+$/.test(event.eventId));
      const fluidPlan = log.find((event) => /^aki-fluid-overload-fluid-plan-recorded-\d+$/.test(event.eventId));
      const support = log.find((event) => /^aki-fluid-overload-support-activated-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^aki-fluid-overload-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-aki-fluid-overload') return { ...base,
        outcome: recognition ? 'met' : 'not-met', finding: recognition
          ? 'Kidney, fluid, weight, respiratory, perfusion, metabolic, and treatment trends triggered critical-care and nephrology help.'
          : 'The harmful AKI fluid-accumulation trajectory or experienced-team activation was absent.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-aki-fluid-overload-context') {
        const ordered = recognition && context && recognition.tick <= context.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Reversible causes, urgent complications, kidney capacity, treatment, recovery, goals, and preferences stayed in the whole-context review.'
          : 'Whole-context review was absent or preceded recognition.', atTick: context?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'limit-fluid-and-review-diuretic-response') {
        const ordered = context && fluidPlan && context.tick <= fluidPlan.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Nonessential accumulation was limited, necessary treatment preserved, and the poor reported diuretic response reviewed without blind escalation.'
          : 'The fluid plan was absent or preceded context review.', atTick: fluidPlan?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'activate-individualized-kidney-support-pathway') {
        const ordered = fluidPlan && support && fluidPlan.tick <= support.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Individualized kidney-support planning preserved emergency indications and patient-specific timing, access, modality, dose, removal, and goals.'
          : 'Kidney-support planning was absent or preceded the fluid plan.', atTick: support?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = support && reassessment && support.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Net balance and oxygenation improved while oliguria, solute control, hemodynamic tolerance, kidney recovery, duration, and outcome stayed open.'
        : 'Whole-trajectory reassessment was absent or preceded kidney-support planning.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-severe-acidemia', 'analyze-severe-acidemia-context',
      'protect-severe-acidemia-ventilation', 'activate-severe-acidemia-cause-plan',
      'reassess-severe-acidemia-trajectory'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'severe-acidemia');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The severe-acidemia vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => /^severe-acidemia-recognized-\d+$/.test(event.eventId));
      const analysis = log.find((event) => /^severe-acidemia-analyzed-\d+$/.test(event.eventId));
      const ventilation = log.find((event) => /^severe-acidemia-ventilation-protected-\d+$/.test(event.eventId));
      const causePlan = log.find((event) => /^severe-acidemia-cause-plan-activated-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^severe-acidemia-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-severe-acidemia') return { ...base,
        outcome: recognition ? 'met' : 'not-met', finding: recognition
          ? 'Severe pH, gas, perfusion, potassium, kidney, and cause risks triggered experienced multidisciplinary help.'
          : 'The severe mixed-acidemia trajectory or experienced-team activation was absent.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'analyze-severe-acidemia-context') {
        const ordered = recognition && analysis && recognition.tick <= analysis.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'The repeated gas, expected compensation, anion gap, perfusion, kidney, electrolyte, ventilation, and cause review identified a mixed process.'
          : 'Mixed-disorder analysis was absent or preceded recognition.', atTick: analysis?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'protect-severe-acidemia-ventilation') {
        const ordered = analysis && ventilation && analysis.tick <= ventilation.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Safe ventilatory compensation was protected without forcing normal pH or accepting injurious mechanics.'
          : 'Ventilatory-compensation planning was absent or preceded mixed-disorder analysis.', atTick: ventilation?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'activate-severe-acidemia-cause-plan') {
        const ordered = ventilation && causePlan && ventilation.tick <= causePlan.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Cause-directed shock care continued while bicarbonate and kidney support remained indication- and physiology-specific.'
          : 'The cause-directed and support plan was absent or preceded ventilation review.', atTick: causePlan?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = causePlan && reassessment && causePlan.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'pH, ventilation, perfusion, lactate, and potassium improved while metabolic acid, source control, kidney recovery, and outcome stayed open.'
        : 'Whole-trajectory reassessment was absent or preceded the cause-directed plan.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['establish-icu-handoff-readiness', 'receive-icu-handoff-content',
      'cross-check-hidden-deterioration', 'escalate-icu-handoff-deterioration',
      'synthesize-accept-and-reassess-icu-handoff'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'icu-handoff-with-hidden-deterioration');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The ICU hidden-deterioration handoff was not active.' } satisfies ObjectiveFinding;
      const ready = log.find((event) => /^icu-hidden-handoff-readiness-established-\d+$/.test(event.eventId));
      const content = log.find((event) => /^icu-hidden-handoff-content-received-\d+$/.test(event.eventId));
      const crossCheck = log.find((event) => /^icu-hidden-handoff-deterioration-cross-checked-\d+$/.test(event.eventId));
      const escalation = log.find((event) => /^icu-hidden-handoff-deterioration-escalated-\d+$/.test(event.eventId));
      const acceptance = log.find((event) => /^icu-hidden-handoff-synthesized-accepted-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'establish-icu-handoff-readiness') return { ...base,
        outcome: ready ? 'met' : 'not-met', finding: ready
          ? 'Receiver identity, shared attention, monitoring continuity, questions, and uninterrupted bedside coverage were explicit.'
          : 'Receiver readiness or bedside responsibility continuity was absent.', atTick: ready?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'receive-icu-handoff-content') {
        const ordered = ready && content && ready.tick <= content.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Illness severity, summary, support, dated data, pending work, and contingencies were received as claims requiring verification.'
          : 'Structured content was absent or preceded receiver readiness.', atTick: content?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'cross-check-hidden-deterioration') {
        const ordered = content && crossCheck && content.tick <= crossCheck.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Dated physiology, rising support, devices, infusions, records, and pending source control corrected the stable label to worsening shock.'
          : 'Bedside reconciliation was absent or preceded receipt of the outgoing content.', atTick: crossCheck?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'escalate-icu-handoff-deterioration') {
        const ordered = crossCheck && escalation && crossCheck.tick <= escalation.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Worsening shock triggered multidisciplinary and source-control escalation with priorities, triggers, contingencies, and named owners.'
          : 'Escalation and ownership were absent or preceded bedside cross-check.', atTick: escalation?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = escalation && acceptance && escalation.tick <= acceptance.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Receiver synthesis and accepted ownership followed escalation; the fixed bridge improved pressure while source control and outcome stayed open.'
        : 'Synthesis, accepted ownership, or reassessment was absent or preceded escalation.', atTick: acceptance?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-ventilator-circuit-disconnection',
      'bridge-ventilator-circuit-disconnection', 'inspect-ventilator-circuit-disconnection',
      'restore-ventilator-circuit-support', 'reassess-ventilator-circuit-response'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'ventilator-circuit-disconnection');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The ventilator circuit-disconnection lesson was not active.' } satisfies ObjectiveFinding;
      const recognized = log.find((event) => /^ventilator-disconnection-recognized-\d+$/.test(event.eventId));
      const bridged = log.find((event) => /^ventilator-disconnection-bridged-\d+$/.test(event.eventId));
      const inspected = log.find((event) => /^ventilator-disconnection-inspected-\d+$/.test(event.eventId));
      const restored = log.find((event) => /^ventilator-disconnection-restored-\d+$/.test(event.eventId));
      const reassessed = log.find((event) => /^ventilator-disconnection-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-ventilator-circuit-disconnection') return { ...base,
        outcome: recognized ? 'met' : 'not-met', finding: recognized
          ? 'Commanded settings were separated from delivered volume, pressure, capnography, pleth, saturation, and the whole patient.'
          : 'Loss of delivered ventilation was not recognized from independent patient and device signals.', atTick: recognized?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'bridge-ventilator-circuit-disconnection') {
        const ordered = recognized && bridged && recognized.tick <= bridged.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Help and alternative oxygenation and ventilation intent followed recognition without waiting for definitive troubleshooting.'
          : 'The immediate bridge was absent or preceded recognition.', atTick: bridged?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'inspect-ventilator-circuit-disconnection') {
        const ordered = bridged && inspected && bridged.tick <= inspected.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'A patient-to-source trace localized circuit discontinuity while plausible alternatives remained open.'
          : 'The source-to-patient review was absent or preceded immediate bridging.', atTick: inspected?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'restore-ventilator-circuit-support') {
        const ordered = inspected && restored && inspected.tick <= restored.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
          ? 'Circuit continuity and established support were restored in the teaching state after inspection.'
          : 'Restoration was absent or preceded the patient-to-source review.', atTick: restored?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = restored && reassessed && restored.tick <= reassessed.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered
        ? 'Exhaled volume, minute ventilation, pressure, PEEP, capnography, oxygenation, and circulation proved the fixed response.'
        : 'Whole-system reassessment was absent or preceded restoration.', atTick: reassessed?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['review-vasopressor-command-delivery-discordance',
      'trace-vasopressor-source-to-patient-path', 'classify-vasopressor-dead-space-startup-delay',
      'activate-vasopressor-startup-safety-plan', 'reassess-vasopressor-delivery-and-perfusion'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'delayed-vasopressor-delivery');
      if (!supported) return { ...base, outcome: 'not-exercised', finding: 'The delayed-vasopressor-delivery lesson was not active.' } satisfies ObjectiveFinding;
      const discordance = log.find((event) => /^vasopressor-delivery-discordance-reviewed-\d+$/.test(event.eventId));
      const path = log.find((event) => /^vasopressor-delivery-path-traced-\d+$/.test(event.eventId));
      const classified = log.find((event) => /^vasopressor-delivery-delay-classified-\d+$/.test(event.eventId));
      const protocol = log.find((event) => /^vasopressor-delivery-protocol-activated-\d+$/.test(event.eventId));
      const reassessed = log.find((event) => /^vasopressor-delivery-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'review-vasopressor-command-delivery-discordance') return { ...base, outcome: discordance ? 'met' : 'not-met', finding: discordance ? 'Pump command, line transit, patient delivery, and physiologic effect were separated.' : 'The running command was not reconciled with absent delivery and persistent shock.', atTick: discordance?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'trace-vasopressor-source-to-patient-path') { const ordered = discordance && path && discordance.tick <= path.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The fixed syringe-to-patient path and every declared delivery component were traced.' : 'The full path trace was absent or preceded recognition of discordance.', atTick: path?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'classify-vasopressor-dead-space-startup-delay') { const ordered = path && classified && path.tick <= classified.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Dead-space and startup delay were classified from the fixed record while alternatives stayed open.' : 'Classification was absent or preceded the source-to-patient trace.', atTick: classified?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'activate-vasopressor-startup-safety-plan') { const ordered = classified && protocol && classified.tick <= protocol.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The local device-specific protocol was activated with an explicit no-flush/no-bolus guardrail.' : 'The safe protocol was absent or preceded classification.', atTick: protocol?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = protocol && reassessed && protocol.tick <= reassessed.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Documented arrival and perfusion improved while shock, durability, and outcome remained open.' : 'Delivery and perfusion reassessment was absent or preceded the safety plan.', atTick: reassessed?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-pulse-oximeter-discordance', 'inspect-pleth-and-pulse-rate-coherence',
      'review-probe-motion-and-perfusion', 'corroborate-oxygenation-independently',
      'reassess-pulse-oximeter-signal'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'pulse-oximeter-motion-artifact');
      if (!supported) return { ...base, outcome: 'not-exercised', finding: 'The pulse-oximeter motion-artifact lesson was not active.' } satisfies ObjectiveFinding;
      const discordance = log.find((event) => /^pulse-ox-discordance-recognized-\d+$/.test(event.eventId));
      const pleth = log.find((event) => /^pulse-ox-pleth-inspected-\d+$/.test(event.eventId));
      const probe = log.find((event) => /^pulse-ox-probe-perfusion-reviewed-\d+$/.test(event.eventId));
      const corroborated = log.find((event) => /^pulse-ox-oxygenation-corroborated-\d+$/.test(event.eventId));
      const reassessed = log.find((event) => /^pulse-ox-signal-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-pulse-oximeter-discordance') return { ...base, outcome: discordance ? 'met' : 'not-met', finding: discordance ? 'The isolated display was separated from signal, alarm, perfusion, and patient oxygenation.' : 'The low display was not reconciled with the patient and independent signals.', atTick: discordance?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'inspect-pleth-and-pulse-rate-coherence') { const ordered = discordance && pleth && discordance.tick <= pleth.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Poor irregular pleth and pulse-rate mismatch lowered confidence without diagnosing artifact.' : 'Pleth and pulse-rate coherence review was absent or out of order.', atTick: pleth?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-probe-motion-and-perfusion') { const ordered = pleth && probe && pleth.tick <= probe.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The fixed probe, motion, temperature, and local-perfusion record was reviewed while alternatives stayed open.' : 'The probe and perfusion review was absent or preceded signal inspection.', atTick: probe?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'corroborate-oxygenation-independently') { const ordered = probe && corroborated && probe.tick <= corroborated.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Patient observations and fixed arterial oxygenation corroborated the authored state without overreading capnography.' : 'Independent oxygenation corroboration was absent or preceded the sensor-path review.', atTick: corroborated?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = corroborated && reassessed && corroborated.tick <= reassessed.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Display, pulse rate, and pleth became coherent while canonical physiology remained unchanged.' : 'Signal reassessment was absent or preceded independent corroboration.', atTick: reassessed?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['recognize-post-repositioning-ventilation-change',
      'bridge-post-repositioning-oxygenation', 'integrate-tube-depth-and-bilateral-ventilation',
      'record-experienced-tube-correction-intent',
      'reassess-tube-position-and-gas-exchange'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'endotracheal-tube-migration-after-repositioning');
      if (!supported) return { ...base, outcome: 'not-exercised', finding: 'The post-repositioning tube-migration lesson was not active.' } satisfies ObjectiveFinding;
      const recognized = log.find((event) => /^tube-migration-change-recognized-\d+$/.test(event.eventId));
      const bridged = log.find((event) => /^tube-migration-support-activated-\d+$/.test(event.eventId));
      const reviewed = log.find((event) => /^tube-migration-position-reviewed-\d+$/.test(event.eventId));
      const correction = log.find((event) => /^tube-migration-correction-recorded-\d+$/.test(event.eventId));
      const reassessed = log.find((event) => /^tube-migration-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-post-repositioning-ventilation-change') return { ...base, outcome: recognized ? 'met' : 'not-met', finding: recognized ? 'The post-turn multi-signal ventilation change was recognized without prematurely assigning one cause.' : 'The post-turn ventilation and oxygenation change was not recognized.', atTick: recognized?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'bridge-post-repositioning-oxygenation') { const ordered = recognized && bridged && recognized.tick <= bridged.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Immediate support and experienced help were recorded before final classification.' : 'Support was absent or preceded recognition of the change.', atTick: bridged?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'integrate-tube-depth-and-bilateral-ventilation') { const ordered = bridged && reviewed && bridged.tick <= reviewed.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Depth, bilateral ventilation, pressures, volume, capnography, and gas exchange supported migration while alternatives stayed open.' : 'The complete position review was absent or preceded immediate support.', atTick: reviewed?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-experienced-tube-correction-intent') { const ordered = reviewed && correction && reviewed.tick <= correction.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Experienced-airway correction intent was recorded without turning the authored depth into a universal target.' : 'Correction intent was absent or preceded the complete position review.', atTick: correction?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = correction && reassessed && correction.tick <= reassessed.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Tube position, bilateral ventilation, pressure, volume, capnography, and oxygenation proved the fixed response.' : 'Multi-signal reassessment was absent or preceded correction intent.', atTick: reassessed?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['reconcile-septic-shock-resuscitation-so-far', 'reassess-septic-shock-perfusion',
      'test-septic-shock-fluid-responsiveness',
      'individualize-septic-shock-support-and-source-control',
      'reassess-septic-shock-trajectory'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'septic-shock-resuscitation');
      if (!supported) return { ...base, outcome: 'not-exercised', finding: 'The persistent septic-shock resuscitation lesson was not active.' } satisfies ObjectiveFinding;
      const context = log.find((event) => /^septic-resuscitation-context-reconciled-\d+$/.test(event.eventId));
      const perfusion = log.find((event) => /^septic-resuscitation-perfusion-reviewed-\d+$/.test(event.eventId));
      const fluidResponse = log.find((event) => /^septic-resuscitation-fluid-response-reviewed-\d+$/.test(event.eventId));
      const plan = log.find((event) => /^septic-resuscitation-plan-recorded-\d+$/.test(event.eventId));
      const reassessed = log.find((event) => /^septic-resuscitation-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-septic-shock-resuscitation-so-far') return { ...base, outcome: context ? 'met' : 'not-met', finding: context ? 'Prior commands, reported delivery, and persistent patient response were kept separate.' : 'The prior resuscitation record was not reconciled with the current response.', atTick: context?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'reassess-septic-shock-perfusion') { const ordered = context && perfusion && context.tick <= perfusion.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Pressure was joined with brain, skin, kidney, lactate, gas exchange, and respiratory tolerance.' : 'Multi-organ perfusion review was absent or preceded context reconciliation.', atTick: perfusion?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'test-septic-shock-fluid-responsiveness') { const ordered = perfusion && fluidResponse && perfusion.tick <= fluidResponse.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The fixed dynamic and lung panels constrained further fluid without creating a universal cutoff.' : 'Fluid-responsiveness and tolerance review was absent or preceded perfusion review.', atTick: fluidResponse?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'individualize-septic-shock-support-and-source-control') { const ordered = fluidResponse && plan && fluidResponse.tick <= plan.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Individualized support review and urgent biliary source-control intent proceeded in parallel.' : 'The parallel plan was absent or preceded the dynamic and lung review.', atTick: plan?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = plan && reassessed && plan.tick <= reassessed.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The fixed response showed modest change while hypoperfusion, source, organ failure, durability, and outcome remained open.' : 'Trajectory reassessment was absent or preceded the bounded plan.', atTick: reassessed?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['verify-stable-chest-pain-trajectory', 'characterize-stable-chest-pain-pattern',
      'estimate-stable-chest-pain-clinical-likelihood',
      'record-stable-chest-pain-testing-intent',
      'safety-net-stable-chest-pain-follow-up'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'stable-chest-pain-evaluation');
      if (!supported) return { ...base, outcome: 'not-exercised', finding: 'The stable chest-pain evaluation lesson was not active.' } satisfies ObjectiveFinding;
      const stability = log.find((event) => /^stable-chest-pain-stability-verified-\d+$/.test(event.eventId));
      const pattern = log.find((event) => /^stable-chest-pain-pattern-characterized-\d+$/.test(event.eventId));
      const likelihood = log.find((event) => /^stable-chest-pain-likelihood-reviewed-\d+$/.test(event.eventId));
      const testing = log.find((event) => /^stable-chest-pain-testing-recorded-\d+$/.test(event.eventId));
      const safetyNet = log.find((event) => /^stable-chest-pain-safety-net-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'verify-stable-chest-pain-trajectory') return { ...base, outcome: stability ? 'met' : 'not-met', finding: stability ? 'The stable trajectory and acute-change triggers were deliberately separated.' : 'Stability and acute-change triggers were not reviewed.', atTick: stability?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'characterize-stable-chest-pain-pattern') { const ordered = stability && pattern && stability.tick <= pattern.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Symptoms and functional impact were characterized without “atypical” or a causal label.' : 'Symptom characterization was absent or preceded the stability screen.', atTick: pattern?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'estimate-stable-chest-pain-clinical-likelihood') { const ordered = pattern && likelihood && pattern.tick <= likelihood.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Patient, symptom, risk-factor, examination-claim, and ECG context informed likelihood without an exact score or diagnosis.' : 'Clinical-likelihood review was absent or preceded symptom characterization.', atTick: likelihood?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-stable-chest-pain-testing-intent') { const ordered = likelihood && testing && likelihood.tick <= testing.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'A shared patient-specific local testing pathway was recorded without selecting one universal modality.' : 'Testing intent was absent or preceded clinical-likelihood review.', atTick: testing?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = testing && safetyNet && testing.tick <= safetyNet.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Follow-up and explicit acute-change triggers closed the bounded evaluation without predicting outcome.' : 'Follow-up and the acute-change safety net were absent or preceded the shared pathway.', atTick: safetyNet?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['reconcile-clinic-stemi-pattern', 'screen-clinic-stemi-danger',
      'activate-clinic-stemi-transfer', 'record-clinic-stemi-bridge',
      'reassess-clinic-stemi-handoff'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'stemi-recognition-and-first-actions');
      if (!supported) return { ...base, outcome: 'not-exercised', finding: 'The clinic STEMI first-actions lesson was not active.' } satisfies ObjectiveFinding;
      const pattern = log.find((event) => /^clinic-stemi-pattern-reconciled-\d+$/.test(event.eventId));
      const danger = log.find((event) => /^clinic-stemi-danger-screened-\d+$/.test(event.eventId));
      const transfer = log.find((event) => /^clinic-stemi-transfer-activated-\d+$/.test(event.eventId));
      const bridge = log.find((event) => /^clinic-stemi-bridge-recorded-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^clinic-stemi-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-clinic-stemi-pattern') return { ...base, outcome: pattern ? 'met' : 'not-met', finding: pattern ? 'Ongoing symptoms, exact timing, the fixed diagnostic ECG report, and physiology were reconciled without live interpretation.' : 'The time-sensitive pattern was not reconciled.', atTick: pattern?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'screen-clinic-stemi-danger') { const ordered = pattern && danger && pattern.tick <= danger.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Stability, complications, alternatives, bleeding, allergy, and oxygenation were screened while escalation stayed active.' : 'The parallel danger screen was absent or preceded recognition.', atTick: danger?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'activate-clinic-stemi-transfer') { const ordered = pattern && transfer && pattern.tick <= transfer.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'EMS and the regional STEMI system were activated without biomarker delay or private transport.' : 'Regional-system activation was absent or preceded recognition.', atTick: transfer?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-clinic-stemi-bridge') { const ordered = danger && transfer && bridge && danger.tick <= bridge.tick && transfer.tick <= bridge.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Aspirin suitability, monitored transport, defibrillation readiness, access, and change triggers were recorded without selecting downstream therapy.' : 'The clinic bridge was absent or preceded activation or the danger screen.', atTick: bridge?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = bridge && handoff && bridge.tick <= handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Exact onset, ECG, physiology, allergy, medication, intervention, and change data traveled in the reassessment and handoff.' : 'Reassessment and receiving-team handoff were absent or preceded the clinic bridge.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['reconcile-nstemi-serial-trajectory', 'verify-nstemi-and-alternatives',
      'screen-nstemi-very-high-risk-features', 'classify-nstemi-invasive-strategy',
      'record-nstemi-monitoring-and-handoff'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'nstemi-risk-reassessment');
      if (!supported) return { ...base, outcome: 'not-exercised', finding: 'The NSTEMI risk-reassessment lesson was not active.' } satisfies ObjectiveFinding;
      const trajectory = log.find((event) => /^nstemi-risk-trajectory-reconciled-\d+$/.test(event.eventId));
      const verification = log.find((event) => /^nstemi-risk-verification-recorded-\d+$/.test(event.eventId));
      const danger = log.find((event) => /^nstemi-risk-danger-screened-\d+$/.test(event.eventId));
      const strategy = log.find((event) => /^nstemi-risk-strategy-recorded-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^nstemi-risk-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-nstemi-serial-trajectory') return { ...base, outcome: trajectory ? 'met' : 'not-met', finding: trajectory ? 'Symptoms, serial ECG reports, and assay-bounded troponin change were reconciled as one trajectory.' : 'The serial trajectory was not reconciled.', atTick: trajectory?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'verify-nstemi-and-alternatives') { const ordered = trajectory && verification && trajectory.tick <= verification.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The authored NSTEMI conclusion was verified while alternate myocardial injury remained open.' : 'Verification was absent or preceded serial reconciliation.', atTick: verification?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'screen-nstemi-very-high-risk-features') { const ordered = verification && danger && verification.tick <= danger.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Current very-high-risk features were re-screened rather than inferred from prior stability.' : 'The current danger screen was absent or out of order.', atTick: danger?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'classify-nstemi-invasive-strategy') { const ordered = danger && strategy && danger.tick <= strategy.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'A high-risk inpatient invasive intent integrated bleeding risk and regional pathway without a universal clock.' : 'Invasive-strategy intent was absent or preceded the current danger screen.', atTick: strategy?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = strategy && handoff && strategy.tick <= handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Monitoring, change triggers, ownership, and the next reassessment closed the bounded plan.' : 'Handoff ownership was absent or preceded strategy.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['reconcile-heart-failure-congestion-and-perfusion',
      'review-heart-failure-diuretic-response',
      'review-heart-failure-tolerance-and-precipitant',
      'record-heart-failure-transition-intent',
      'reassess-heart-failure-discharge-readiness'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'acute-decompensated-heart-failure');
      if (!supported) return { ...base, outcome: 'not-exercised', finding: 'The acute decompensated heart-failure lesson was not active.' } satisfies ObjectiveFinding;
      const status = log.find((event) => /^heart-failure-status-reconciled-\d+$/.test(event.eventId));
      const response = log.find((event) => /^heart-failure-diuretic-response-reviewed-\d+$/.test(event.eventId));
      const tolerance = log.find((event) => /^heart-failure-tolerance-reviewed-\d+$/.test(event.eventId));
      const transition = log.find((event) => /^heart-failure-transition-recorded-\d+$/.test(event.eventId));
      const readiness = log.find((event) => /^heart-failure-readiness-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-heart-failure-congestion-and-perfusion') return { ...base, outcome: status ? 'met' : 'not-met', finding: status ? 'Congestion, oxygenation, pressure, and perfusion were reconciled as one current state.' : 'Current congestion and perfusion were not reconciled.', atTick: status?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-heart-failure-diuretic-response') { const ordered = status && response && status.tick <= response.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The reported response was read across symptoms, weight, balance, output, and residual congestion without calculating treatment.' : 'Response review was absent or preceded current status.', atTick: response?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-heart-failure-tolerance-and-precipitant') { const ordered = response && tolerance && response.tick <= tolerance.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Kidney, electrolyte, hemodynamic, and precipitant context followed response review without relying on creatinine alone.' : 'Tolerance and precipitant review was absent or out of order.', atTick: tolerance?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-heart-failure-transition-intent') { const ordered = tolerance && transition && tolerance.tick <= transition.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Individualized decongestion, oral-transition, and guideline-directed-therapy review intent was recorded without prescribing.' : 'Transition intent was absent or preceded tolerance review.', atTick: transition?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = transition && readiness && transition.tick <= readiness.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Residual congestion prevented a discharge-ready declaration while ownership and follow-up stayed explicit.' : 'Readiness and ownership were absent or preceded transition intent.', atTick: readiness?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if (['reconcile-stable-regular-narrow-tachycardia', 'review-stable-regular-narrow-context',
      'record-stable-regular-narrow-vagal-intent',
      'record-stable-regular-narrow-adenosine-intent',
      'reassess-stable-regular-narrow-trajectory'].includes(objective.id)) {
      const stability = log.find((event) => /^stable-narrow-tachycardia-stability-reconciled-\d+$/.test(event.eventId));
      const context = log.find((event) => /^stable-narrow-tachycardia-context-reviewed-\d+$/.test(event.eventId));
      const vagal = log.find((event) => /^stable-narrow-tachycardia-vagal-intent-recorded-\d+$/.test(event.eventId));
      const vagalResponse = log.find((event) => /^stable-narrow-tachycardia-vagal-response-reviewed-\d+$/.test(event.eventId));
      const adenosine = log.find((event) => /^stable-narrow-tachycardia-adenosine-intent-recorded-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^stable-narrow-tachycardia-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-stable-regular-narrow-tachycardia') return { ...base, outcome: stability ? 'met' : 'not-met', finding: stability ? 'The regular narrow rhythm was reconciled with whole-patient stability without using rate alone.' : 'Rhythm and current stability were not reconciled.', atTick: stability?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-stable-regular-narrow-context') { const ordered = stability && context && stability.tick <= context.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Rhythm context, alternate mechanisms, contributors, contraindications, and readiness were reviewed.' : 'Context review was absent or preceded stability.', atTick: context?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-stable-regular-narrow-vagal-intent') { const ordered = context && vagal && vagalResponse && context.tick <= vagal.tick && vagal.tick < vagalResponse.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Coached vagal intent was followed by an elapsed, still-stable nonconversion review.' : 'Vagal intent or its elapsed response review was missing or out of order.', atTick: vagalResponse?.tick ?? vagal?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-stable-regular-narrow-adenosine-intent') { const ordered = vagalResponse && adenosine && vagalResponse.tick <= adenosine.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Protocol-bounded adenosine intent followed nonconversion and readiness review without a dose or delivery claim.' : 'Adenosine intent was absent or preceded the observed vagal response.', atTick: adenosine?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = adenosine && reassessment && adenosine.tick < reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Elapsed whole-patient reassessment preserved mechanism uncertainty, recurrence planning, triggers, and follow-up ownership.' : 'Final reassessment was absent or did not follow adenosine intent after elapsed time.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-stable-wide-complex-tachycardia', 'review-wide-complex-context',
      'prepare-wide-complex-pathway', 'review-wide-complex-medication-response',
      'record-wide-complex-cardioversion-intent', 'reassess-wide-complex-trajectory'].includes(objective.id)) {
      const stability = log.find((event) => /^stable-wide-stability-reconciled-\d+$/.test(event.eventId));
      const context = log.find((event) => /^stable-wide-context-reviewed-\d+$/.test(event.eventId));
      const readiness = log.find((event) => /^stable-wide-readiness-recorded-\d+$/.test(event.eventId));
      const medication = log.find((event) => /^stable-wide-medication-path-recorded-\d+$/.test(event.eventId));
      const nonresponse = log.find((event) => /^stable-wide-medication-nonresponse-reviewed-\d+$/.test(event.eventId));
      const cardioversion = log.find((event) => /^stable-wide-cardioversion-intent-recorded-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^stable-wide-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-stable-wide-complex-tachycardia') return { ...base, outcome: stability ? 'met' : 'not-met', finding: stability ? 'Pulse, wide rhythm, and revisable whole-patient stability were reconciled without using rate alone.' : 'Pulse and current stability were not reconciled.', atTick: stability?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-wide-complex-context') { const ordered = stability && context && stability.tick <= context.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Morphology and structural, ischemic, electrolyte, medication, and toxic context were reviewed without proving a mechanism.' : 'Wide-rhythm context was absent or preceded stability.', atTick: context?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'prepare-wide-complex-pathway') { const ordered = context && readiness && context.tick <= readiness.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Monitoring, expert help, access, pads, triggers, and cardioversion readiness were recorded.' : 'Readiness was absent or preceded context review.', atTick: readiness?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-wide-complex-medication-response') { const ordered = readiness && medication && nonresponse && readiness.tick <= medication.tick && medication.tick < nonresponse.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'One authored monitored medication path was followed by elapsed persistent WCT without false diagnostic certainty.' : 'The medication path or its elapsed response was missing or out of order.', atTick: nonresponse?.tick ?? medication?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-wide-complex-cardioversion-intent') { const ordered = nonresponse && cardioversion && nonresponse.tick <= cardioversion.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Synchronized-cardioversion intent followed the authored medication nonresponse without device or energy claims.' : 'Cardioversion intent was absent or preceded response review.', atTick: cardioversion?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = cardioversion && reassessment && cardioversion.tick < reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Elapsed reassessment preserved mechanism uncertainty, cause and recurrence work, triggers, and follow-up ownership.' : 'Final reassessment was absent or did not follow cardioversion intent after elapsed time.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-symptomatic-bradycardia-stability', 'review-symptomatic-bradycardia-context',
      'correlate-symptomatic-bradycardia-record',
      'record-symptomatic-bradycardia-pacing-evaluation',
      'handoff-symptomatic-bradycardia-plan'].includes(objective.id)) {
      const stability = log.find((event) => /^symptomatic-bradycardia-stability-reconciled-\d+$/.test(event.eventId));
      const context = log.find((event) => /^symptomatic-bradycardia-context-reviewed-\d+$/.test(event.eventId));
      const correlation = log.find((event) => /^symptomatic-bradycardia-correlation-reviewed-\d+$/.test(event.eventId));
      const pacing = log.find((event) => /^symptomatic-bradycardia-pacing-evaluation-recorded-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^symptomatic-bradycardia-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-symptomatic-bradycardia-stability') return { ...base, outcome: stability ? 'met' : 'not-met', finding: stability ? 'Rate, pulse, chronic symptoms, and current stability were reconciled without using rate alone.' : 'Current pulse and stability were not reconciled.', atTick: stability?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-symptomatic-bradycardia-context') { const ordered = stability && context && stability.tick <= context.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Medication, reversible, structural, and physiologic context remained open without a reflex medication change.' : 'Context review was absent or preceded stability.', atTick: context?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'correlate-symptomatic-bradycardia-record') { const ordered = stability && correlation && stability.tick <= correlation.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The pre-authored symptom-rhythm record was correlated without a threshold shortcut or mechanism claim.' : 'Correlation review was absent or preceded stability.', atTick: correlation?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-symptomatic-bradycardia-pacing-evaluation') { const ordered = context && correlation && pacing && context.tick <= pacing.tick && correlation.tick <= pacing.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Shared pacing-evaluation intent followed both diagnostic lanes without selecting a device or promising benefit.' : 'Pacing evaluation was absent or bypassed context or correlation review.', atTick: pacing?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = pacing && handoff && pacing.tick <= handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Symptoms, acute-change triggers, unresolved questions, owner, and follow-up remained visible while the rhythm stayed unchanged.' : 'The longitudinal handoff was absent or preceded pacing evaluation.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-complete-heart-block-stability', 'review-complete-heart-block-context',
      'activate-complete-heart-block-pathway', 'reassess-complete-heart-block-trajectory',
      'handoff-complete-heart-block-pacing-plan'].includes(objective.id)) {
      const stability = log.find((event) => /^complete-heart-block-stability-reconciled-\d+$/.test(event.eventId));
      const context = log.find((event) => /^complete-heart-block-context-reviewed-\d+$/.test(event.eventId));
      const pathway = log.find((event) => /^complete-heart-block-pathway-activated-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^complete-heart-block-trajectory-reassessed-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^complete-heart-block-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-complete-heart-block-stability') return { ...base, outcome: stability ? 'met' : 'not-met', finding: stability ? 'The fixed AV-dissociation report, ventricular escape, pulse, symptoms, and current stability were reconciled.' : 'The fixed complete block and whole-patient stability were not reconciled.', atTick: stability?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-complete-heart-block-context') { const ordered = stability && context && stability.tick <= context.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The authored initial cause panel was reviewed without claiming that every reversible cause was excluded.' : 'Cause review was absent or preceded block and stability review.', atTick: context?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'activate-complete-heart-block-pathway') { const ordered = stability && pathway && stability.tick <= pathway.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Monitored pacing-capable escalation and deterioration triggers were recorded without waiting for cause review or delivering treatment.' : 'Pacing-capable escalation was absent or preceded block and stability review.', atTick: pathway?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'reassess-complete-heart-block-trajectory') { const ordered = context && pathway && reassessment && context.tick < reassessment.tick && pathway.tick < reassessment.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Elapsed reassessment preserved persistent complete block, current perfusion, and the no-pacing/no-capture boundary.' : 'Reassessment was absent, premature, or bypassed a parallel lane.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = reassessment && handoff && reassessment.tick <= handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Permanent-pacing evaluation, shared decisions, owners, open causes, and triggers were handed off without choosing or operating a device.' : 'The definitive evaluation handoff was absent or preceded elapsed reassessment.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-torsades-pulse-and-pattern', 'record-torsades-unsynchronized-shock-intent',
      'review-torsades-post-shock-rhythm', 'review-torsades-long-qt-context',
      'record-torsades-recurrence-suppression-intent',
      'handoff-torsades-recurrence-plan'].includes(objective.id)) {
      const recognition = log.find((event) => /^torsades-recognition-recorded-\d+$/.test(event.eventId));
      const shock = log.find((event) => /^torsades-unsynchronized-shock-intent-recorded-\d+$/.test(event.eventId));
      const postShock = log.find((event) => /^torsades-post-shock-rhythm-reviewed-\d+$/.test(event.eventId));
      const context = log.find((event) => /^torsades-long-qt-context-reviewed-\d+$/.test(event.eventId));
      const recurrence = log.find((event) => /^torsades-recurrence-suppression-intent-recorded-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^torsades-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-torsades-pulse-and-pattern') return { ...base, outcome: recognition ? 'met' : 'not-met', finding: recognition ? 'Sustained polymorphic VT, pulse, compromise, and preceding long-QT context were reconciled.' : 'The pulsed polymorphic emergency was not reconciled.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'record-torsades-unsynchronized-shock-intent') { const ordered = recognition && shock && recognition.tick <= shock.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Immediate unsynchronized-shock intent followed recognition without a magnesium, QT-review, synchronization, or energy gate.' : 'Shock intent was absent, synchronized, or bypassed recognition.', atTick: shock?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-torsades-post-shock-rhythm') { const ordered = shock && postShock && shock.tick < postShock.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The elapsed authored post-team sinus report preserved long-QT recurrence risk and the no-learner-delivery boundary.' : 'Post-team review was absent or did not follow shock intent after elapsed time.', atTick: postShock?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-torsades-long-qt-context') { const ordered = postShock && context && postShock.tick <= context.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'QT-active medication, kidney, bradycardia, electrolyte, ischemic, structural, and inherited context remained open.' : 'Long-QT context review was absent or preceded the post-team report.', atTick: context?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-torsades-recurrence-suppression-intent') { const ordered = postShock && recurrence && postShock.tick <= recurrence.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Long-QT-specific magnesium, electrolyte, culprit, monitoring, and expert intent were recorded without dose or delivery claims.' : 'Recurrence-suppression intent was absent or preceded the post-team report.', atTick: recurrence?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = context && recurrence && handoff && context.tick < handoff.tick && recurrence.tick < handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Elapsed handoff kept QT risk, open causes, recurrence and pulse-loss triggers, expert contingency, and owners visible.' : 'Final handoff was absent, premature, or bypassed a prevention lane.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-hyperkalemic-conduction-trajectory',
      'review-hyperkalemic-conduction-calcium-response',
      'review-hyperkalemic-conduction-shift-surveillance',
      'review-hyperkalemic-conduction-removal-and-device-restraint',
      'review-hyperkalemic-conduction-later-panel',
      'handoff-hyperkalemic-conduction-reassessment'].includes(objective.id)) {
      const reconciled = log.find((event) => /^hyperkalemic-conduction-trajectory-reconciled-\d+$/.test(event.eventId));
      const calcium = log.find((event) => /^hyperkalemic-conduction-calcium-response-reviewed-\d+$/.test(event.eventId));
      const shift = log.find((event) => /^hyperkalemic-conduction-shift-surveillance-reviewed-\d+$/.test(event.eventId));
      const removal = log.find((event) => /^hyperkalemic-conduction-removal-device-reviewed-\d+$/.test(event.eventId));
      const panel = log.find((event) => /^hyperkalemic-conduction-later-panel-reviewed-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^hyperkalemic-conduction-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-hyperkalemic-conduction-trajectory') return { ...base, outcome: reconciled ? 'met' : 'not-met', finding: reconciled ? 'The confirmed potassium, changing conduction reports, mechanical pulse, current stability, prior-care timeline, and open alternatives were reconciled.' : 'The metabolic and conduction trajectory was not reconciled.', atTick: reconciled?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-hyperkalemic-conduction-calcium-response') { const ordered = reconciled && calcium && reconciled.tick <= calcium.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The reported calcium response was separated from potassium lowering, learner delivery, exclusive cause, and resolution.' : 'Calcium-response reasoning was absent or bypassed trajectory reconciliation.', atTick: calcium?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-hyperkalemic-conduction-shift-surveillance') { const ordered = reconciled && shift && reconciled.tick <= shift.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Reported shifting was paired with serial glucose, potassium, hypoglycemia, and rebound surveillance without selecting treatment.' : 'Shifting and glucose surveillance were absent or bypassed trajectory reconciliation.', atTick: shift?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-hyperkalemic-conduction-removal-and-device-restraint') { const ordered = reconciled && removal && reconciled.tick <= removal.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Removal, contributors, renal ownership, pacing contingency, and permanent-device restraint remained explicit while reversible toxicity was corrected.' : 'Removal ownership or device restraint was absent or bypassed trajectory reconciliation.', atTick: removal?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-hyperkalemic-conduction-later-panel') { const ordered = calcium && shift && removal && panel && calcium.tick < panel.tick && shift.tick < panel.tick && removal.tick < panel.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The elapsed later potassium, glucose, ECG, and perfusion report showed improvement without proving exclusive cause or durable resolution.' : 'The later panel was absent, premature, or bypassed a review lane.', atTick: panel?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = panel && handoff && panel.tick < handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Elapsed handoff preserved serial metabolic, conduction, removal, rebound, compromise, and ownership work without choosing a device or outcome.' : 'The final handoff was absent or did not follow the later panel after elapsed time.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-pericardial-tamponade-trajectory',
      'review-pericardial-tamponade-drainage-response',
      'review-pericardial-tamponade-etiology',
      'review-pericardial-tamponade-surveillance',
      'handoff-pericardial-tamponade-reassessment'].includes(objective.id)) {
      const trajectory = log.find((event) => /^pericardial-tamponade-trajectory-reconciled-\d+$/.test(event.eventId));
      const drainage = log.find((event) => /^pericardial-tamponade-drainage-response-reviewed-\d+$/.test(event.eventId));
      const etiology = log.find((event) => /^pericardial-tamponade-etiology-reviewed-\d+$/.test(event.eventId));
      const surveillance = log.find((event) => /^pericardial-tamponade-surveillance-reviewed-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^pericardial-tamponade-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-pericardial-tamponade-trajectory') return { ...base, outcome: trajectory ? 'met' : 'not-met', finding: trajectory ? 'The pretreatment clinical, hemodynamic, and fixed echo pattern was reconciled with the current post-drain state without using effusion size alone.' : 'The pretreatment tamponade and current circulation trajectory was not reconciled.', atTick: trajectory?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-pericardial-tamponade-drainage-response') { const ordered = trajectory && drainage && trajectory.tick <= drainage.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Reported specialist drainage, residual effusion, and current improvement were reviewed without claiming learner procedure or imaging skill, cause, or cure.' : 'Drainage-response review was absent or bypassed trajectory reconciliation.', atTick: drainage?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-pericardial-tamponade-etiology') { const ordered = drainage && etiology && drainage.tick <= etiology.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Malignant, infectious, inflammatory, renal, iatrogenic, and other causes remained open with pending-result ownership.' : 'Etiology review was absent or preceded the reported drainage response.', atTick: etiology?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-pericardial-tamponade-surveillance') { const ordered = drainage && surveillance && drainage.tick <= surveillance.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Post-drain circulation, respiratory, rhythm, catheter, echo, reaccumulation, decompression, and constrictive surveillance remained explicit without a catheter action.' : 'Recurrence surveillance was absent or preceded the reported drainage response.', atTick: surveillance?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = etiology && surveillance && handoff
        && etiology.tick < handoff.tick && surveillance.tick < handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Elapsed reassessment preserved pending cause, residual effusion, recurrence, catheter, deterioration, and named ownership without determining removal, disposition, or outcome.' : 'The final handoff was absent, premature, or bypassed a parallel review lane.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-right-ventricular-infarction',
      'review-right-ventricular-infarction-phenotype',
      'preserve-right-ventricular-infarction-reperfusion',
      'record-right-ventricular-infarction-support',
      'handoff-right-ventricular-infarction'].includes(objective.id)) {
      const reconciled = log.find((event) => /^right-ventricular-infarction-reconciled-\d+$/.test(event.eventId));
      const phenotype = log.find((event) => /^right-ventricular-infarction-phenotype-reviewed-\d+$/.test(event.eventId));
      const reperfusion = log.find((event) => /^right-ventricular-infarction-reperfusion-preserved-\d+$/.test(event.eventId));
      const support = log.find((event) => /^right-ventricular-infarction-support-recorded-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^right-ventricular-infarction-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-right-ventricular-infarction') return { ...base, outcome: reconciled ? 'met' : 'not-met', finding: reconciled ? 'The acute ischemic and hemodynamic trajectory was reconciled without using pressure, JVP, or clear lungs alone or declaring multi-organ shock.' : 'The whole-patient RV-infarction trajectory was not reconciled.', atTick: reconciled?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-right-ventricular-infarction-phenotype') { const ordered = reconciled && phenotype && reconciled.tick <= phenotype.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Fixed right-sided ECG and echo reports supported the authored acute ischemic RV phenotype without live acquisition, universal cutoffs, or closed alternatives.' : 'The fixed RV phenotype was absent or preceded whole-patient reconciliation.', atTick: phenotype?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'preserve-right-ventricular-infarction-reperfusion') { const ordered = reconciled && reperfusion && reconciled.tick <= reperfusion.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Active reperfusion and rhythm-conduction readiness continued without waiting for RV review or claiming PCI or reperfusion completion.' : 'Reperfusion readiness was absent or preceded whole-patient reconciliation.', atTick: reperfusion?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-right-ventricular-infarction-support') { const ordered = phenotype && support && phenotype.tick <= support.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Individualized RV-support guardrails avoided nitrate, reflex diuresis, blind or fixed-volume fluid, universal targets, and learner treatment.' : 'Support guardrails were absent or preceded phenotype review.', atTick: support?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = reperfusion && support && handoff
        && reperfusion.tick < handoff.tick && support.tick < handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Elapsed handoff preserved unresolved ischemia, perfusion, rhythm, conduction, mechanical, reperfusion, and treatment work without claiming resolution or outcome.' : 'The final handoff was absent, premature, or bypassed a parallel review lane.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-hypertensive-emergency-measurement-and-trajectory',
      'review-hypertensive-emergency-organ-injury',
      'review-hypertensive-emergency-phenotype-and-causes',
      'record-hypertensive-emergency-controlled-reduction-intent',
      'review-hypertensive-emergency-later-panel',
      'handoff-hypertensive-emergency-reassessment'].includes(objective.id)) {
      const measurement = log.find((event) => /^hypertensive-emergency-measurement-reconciled-\d+$/.test(event.eventId));
      const organ = log.find((event) => /^hypertensive-emergency-organ-injury-reviewed-\d+$/.test(event.eventId));
      const phenotype = log.find((event) => /^hypertensive-emergency-phenotype-causes-reviewed-\d+$/.test(event.eventId));
      const reduction = log.find((event) => /^hypertensive-emergency-reduction-intent-recorded-\d+$/.test(event.eventId));
      const later = log.find((event) => /^hypertensive-emergency-later-panel-reviewed-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^hypertensive-emergency-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-hypertensive-emergency-measurement-and-trajectory') return { ...base, outcome: measurement ? 'met' : 'not-met', finding: measurement ? 'Authored cuff conditions, bilateral repeated pressures, symptoms, access interruption, and whole-patient trajectory were reconciled without using marked pressure alone.' : 'The authored measurement conditions and whole-patient pressure trajectory were not reconciled.', atTick: measurement?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-hypertensive-emergency-organ-injury') { const ordered = measurement && organ && measurement.tick <= organ.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Fixed retinal and renal findings established acute target-organ injury in this authored case without learner examination or test acquisition.' : 'Target-organ injury review was absent or preceded measurement reconciliation.', atTick: organ?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-hypertensive-emergency-phenotype-and-causes') { const ordered = organ && phenotype && organ.tick <= phenotype.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The renal-retinal phenotype remained distinct from current pulmonary-edema, ACS, aortic, neurologic, and pregnancy snapshots while causes and change triggers stayed open.' : 'Phenotype and cause review was absent or preceded acute-organ-injury review.', atTick: phenotype?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-hypertensive-emergency-controlled-reduction-intent') { const ordered = organ && reduction && organ.tick <= reduction.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Prompt monitored syndrome-specific controlled-reduction intent avoided a drug, dose, infusion rate, universal target, rapid normalization, treatment, or outcome claim.' : 'Controlled-reduction intent was absent or preceded acute-organ-injury review.', atTick: reduction?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-hypertensive-emergency-later-panel') { const ordered = phenotype && reduction && later && phenotype.tick < later.tick && reduction.tick < later.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The elapsed 45-minute pressure, symptom, perfusion, and neurologic panel was reviewed without turning directional change into learner treatment response or resolution.' : 'The 45-minute panel was absent, premature, or bypassed a parallel lane.', atTick: later?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = later && handoff && later.tick < handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The elapsed 3-hour handoff preserved renal-retinal injury, symptoms, pressure, cause, treatment, ownership, and change-trigger work without determining disposition or outcome.' : 'The final handoff was absent or did not follow the later panel after another elapsed interval.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-pacemaker-capture-failure-pulse-and-pattern',
      'activate-pacemaker-capture-failure-rescue-pathway',
      'review-pacemaker-capture-failure-device-system',
      'review-pacemaker-capture-failure-causes',
      'review-pacemaker-capture-failure-later-panel',
      'handoff-pacemaker-capture-failure-reassessment'].includes(objective.id)) {
      const recognition = log.find((event) => /^pacemaker-capture-failure-recognized-\d+$/.test(event.eventId));
      const rescue = log.find((event) => /^pacemaker-capture-failure-rescue-activated-\d+$/.test(event.eventId));
      const deviceSystem = log.find((event) => /^pacemaker-capture-failure-device-system-reviewed-\d+$/.test(event.eventId));
      const causes = log.find((event) => /^pacemaker-capture-failure-causes-reviewed-\d+$/.test(event.eventId));
      const later = log.find((event) => /^pacemaker-capture-failure-later-panel-reviewed-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^pacemaker-capture-failure-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-pacemaker-capture-failure-pulse-and-pattern') return { ...base, outcome: recognition ? 'met' : 'not-met', finding: recognition ? 'The fixed pacing-artifact, QRS, intrinsic pulse, symptom, pressure, and perfusion pattern was reconciled as authored electrical noncapture without a learner capture test.' : 'The authored pulse and electrical-noncapture pattern was not reconciled.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'activate-pacemaker-capture-failure-rescue-pathway') { const ordered = recognition && rescue && recognition.tick <= rescue.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Pacing-capable rescue, device expertise, surveillance, backup readiness, and the pulse-loss contingency were activated without learner treatment or device operation.' : 'Rescue activation was absent or preceded recognition.', atTick: rescue?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-pacemaker-capture-failure-device-system') { const ordered = recognition && deviceSystem && recognition.tick <= deviceSystem.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The fixed battery, threshold, impedance, electrogram, and lead-system trends were reviewed without learner interrogation, programming, a universal cutoff, or a declared repair.' : 'Device-system review was absent or preceded recognition.', atTick: deviceSystem?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-pacemaker-capture-failure-causes') { const ordered = recognition && causes && recognition.tick <= causes.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Fixed metabolic, ischemic, imaging, pocket, procedure, and medication snapshots were reviewed while device and biologic causes stayed open and no magnet shortcut was selected.' : 'Cause review was absent or preceded recognition.', atTick: causes?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-pacemaker-capture-failure-later-panel') { const latestPrior = Math.max(rescue?.tick ?? Infinity, deviceSystem?.tick ?? Infinity, causes?.tick ?? Infinity); const ordered = rescue && deviceSystem && causes && later && latestPrior < later.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The strictly later experienced-team capture and perfusion report followed rescue and both review lanes without becoming learner programming, pacing, durable repair, or outcome.' : 'The later panel was absent, premature, or bypassed rescue or a review lane.', atTick: later?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = later && handoff && later.tick < handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The next-interval handoff preserved lead and generator integrity, cause, recurrence, durable strategy, ownership, and deterioration-trigger work without learner repair, disposition, or outcome.' : 'The final handoff was absent or did not follow the later panel after another elapsed interval.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-transcutaneous-pacing-electrical-and-mechanical-capture',
      'activate-transcutaneous-pacing-pulseless-response',
      'review-transcutaneous-pacing-open-causes-and-bridge',
      'handoff-transcutaneous-pacing-reassessment'].includes(objective.id)) {
      const recognition = log.find((event) => /^transcutaneous-pacing-capture-reconciled-\d+$/.test(event.eventId));
      const response = log.find((event) => /^transcutaneous-pacing-pulseless-response-activated-\d+$/.test(event.eventId));
      const causes = log.find((event) => /^transcutaneous-pacing-causes-bridge-reviewed-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^transcutaneous-pacing-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-transcutaneous-pacing-electrical-and-mechanical-capture') return { ...base, outcome: recognition ? 'met' : 'not-met', finding: recognition ? 'Authored pacing artifacts, broad QRS and T complexes, absent pulse, flat mechanical traces, and unobtainable pressure were reconciled as electrical capture without mechanical capture.' : 'The authored electrical and mechanical capture evidence was not reconciled.', atTick: recognition?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'activate-transcutaneous-pacing-pulseless-response') { const ordered = recognition && response && recognition.tick <= response.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Pulse loss opened the nonshockable arrest pathway without trusting the paced ECG or crediting learner resuscitation, pacing, drug, or shock delivery.' : 'The pulseless response was absent or preceded capture reconciliation.', atTick: response?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-transcutaneous-pacing-open-causes-and-bridge') { const ordered = response && causes && response.tick <= causes.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'PEA causes remained open and transcutaneous pacing was not treated as arrest therapy or a learner-selected bridge.' : 'Cause and bridge review was absent or preceded pulse-loss activation.', atTick: causes?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = causes && handoff && causes.tick < handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The elapsed handoff preserved active resuscitation ownership, cause evaluation, mechanical capture, circulation, any later pacing strategy, ROSC, disposition, and outcome as unresolved.' : 'The active-resuscitation handoff was absent or did not follow cause review after an elapsed tick.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-acute-severe-asthma-treatment-and-trajectory',
      'recognize-acute-severe-asthma-respiratory-failure',
      'activate-acute-severe-asthma-critical-care-escalation',
      'review-acute-severe-asthma-alternatives-and-ventilation-risks',
      'handoff-acute-severe-asthma-reassessment'].includes(objective.id)) {
      const treatment = log.find((event) => /^acute-severe-asthma-treatment-reconciled-\d+$/.test(event.eventId));
      const failure = log.find((event) => /^acute-severe-asthma-failure-recognized-\d+$/.test(event.eventId));
      const escalation = log.find((event) => /^acute-severe-asthma-escalation-activated-\d+$/.test(event.eventId));
      const risks = log.find((event) => /^acute-severe-asthma-risks-reviewed-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^acute-severe-asthma-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-acute-severe-asthma-treatment-and-trajectory') return { ...base, outcome: treatment ? 'met' : 'not-met', finding: treatment ? 'Documented prior treatment delivery and the worsening whole-patient trajectory were reconciled without treating slower breathing, less wheeze, or saturation on oxygen as recovery.' : 'The documented treatment and deterioration trajectory were not reconciled.', atTick: treatment?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'recognize-acute-severe-asthma-respiratory-failure') { const ordered = treatment && failure && treatment.tick <= failure.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Life-threatening hypercapnic ventilatory failure was recognized from mentation, speech, air movement, effort, respiratory-rate, oxygen, and blood-gas trends without forcing peak flow or using one airway cutoff.' : 'Respiratory-failure recognition was absent or preceded treatment-and-trajectory reconciliation.', atTick: failure?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'activate-acute-severe-asthma-critical-care-escalation') { const ordered = failure && escalation && failure.tick <= escalation.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Critical-care and experienced-airway help, monitoring, support preparation, and deterioration contingencies were activated before complete cause review and without learner treatment or procedure delivery.' : 'Critical-care escalation was absent or preceded respiratory-failure recognition.', atTick: escalation?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'review-acute-severe-asthma-alternatives-and-ventilation-risks') { const ordered = escalation && risks && escalation.tick <= risks.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Case-justified imaging, open alternatives, treatment-toxicity questions, air trapping, hemodynamic compromise, and barotrauma risk were reviewed without a support or ventilator recipe.' : 'Alternative-cause and ventilation-risk review was absent or delayed escalation.', atTick: risks?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = risks && handoff && risks.tick < handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The elapsed handoff preserved active respiratory failure, continuous surveillance, unresolved causes, ventilation hazards, named owners, and deterioration triggers without inventing treatment response, disposition, or outcome.' : 'The active respiratory-failure handoff was absent or did not follow risk review after an elapsed tick.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-post-infarction-shock-trajectory', 'reopen-post-infarction-shock-causes',
      'contact-post-infarction-shock-center', 'record-post-infarction-shock-bridge',
      'handoff-post-infarction-shock-trajectory'].includes(objective.id)) {
      const trajectory = log.find((event) => /^post-infarction-shock-trajectory-reconciled-\d+$/.test(event.eventId));
      const causes = log.find((event) => /^post-infarction-shock-causes-reopened-\d+$/.test(event.eventId));
      const transfer = log.find((event) => /^post-infarction-shock-center-contacted-\d+$/.test(event.eventId));
      const bridge = log.find((event) => /^post-infarction-shock-bridge-recorded-\d+$/.test(event.eventId));
      const handoff = log.find((event) => /^post-infarction-shock-handoff-recorded-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-post-infarction-shock-trajectory') return { ...base, outcome: trajectory ? 'met' : 'not-met', finding: trajectory ? 'Failure to improve was recognized from multi-organ perfusion despite the higher pressure.' : 'The post-support perfusion trajectory was not reconciled.', atTick: trajectory?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'reopen-post-infarction-shock-causes') { const ordered = trajectory && causes && trajectory.tick <= causes.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Reported care and fixed post-PCI findings were reconciled while dangerous contributors stayed open.' : 'Cause review was absent or preceded trajectory recognition.', atTick: causes?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'contact-post-infarction-shock-center') { const ordered = trajectory && transfer && trajectory.tick <= transfer.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The local shock team and regional advanced center were contacted without claiming transfer completion.' : 'Regional consultation was absent or preceded trajectory recognition.', atTick: transfer?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-post-infarction-shock-bridge') { const ordered = causes && transfer && bridge && causes.tick <= bridge.tick && transfer.tick <= bridge.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The potential-transport bridge followed both open-cause review and regional consultation without a routine device.' : 'The bridge was absent or bypassed cause review or consultation.', atTick: bridge?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = bridge && handoff && bridge.tick < handoff.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Elapsed reassessment preserved unresolved shock, owners, triggers, and open work in handoff.' : 'Handoff was absent or did not follow the bridge after elapsed time.', atTick: handoff?.tick ?? 0 } satisfies ObjectiveFinding;
    }
    if (['reconcile-af-rvr-rhythm-and-stability', 'review-af-rvr-context-and-triggers',
      'record-af-rvr-rate-control-intent', 'record-af-rvr-stroke-prevention-intent',
      'reassess-af-rvr-trajectory-and-follow-up'].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'narrative'
        && event.target === 'atrial-fibrillation-with-rapid-response');
      if (!supported) return { ...base, outcome: 'not-exercised', finding: 'The atrial-fibrillation-with-rapid-response lesson was not active.' } satisfies ObjectiveFinding;
      const stability = log.find((event) => /^af-rvr-stability-reconciled-\d+$/.test(event.eventId));
      const context = log.find((event) => /^af-rvr-context-reviewed-\d+$/.test(event.eventId));
      const rate = log.find((event) => /^af-rvr-rate-intent-recorded-\d+$/.test(event.eventId));
      const stroke = log.find((event) => /^af-rvr-stroke-prevention-recorded-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^af-rvr-trajectory-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'reconcile-af-rvr-rhythm-and-stability') return { ...base, outcome: stability ? 'met' : 'not-met', finding: stability ? 'The authored AF rhythm and current stability were reconciled without using heart rate alone.' : 'Rhythm and current stability were not reconciled.', atTick: stability?.tick ?? 0 } satisfies ObjectiveFinding;
      if (objective.id === 'review-af-rvr-context-and-triggers') { const ordered = stability && context && stability.tick <= context.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Uncertain duration, ventricular function, history, adherence, comorbidity, and contributor context were reviewed before strategy.' : 'Context review was absent or preceded stability.', atTick: context?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-af-rvr-rate-control-intent') { const ordered = context && rate && context.tick <= rate.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Patient-specific acute rate-control intent was recorded without selecting a universal target, agent, or dose.' : 'Rate-control intent was absent or preceded context review.', atTick: rate?.tick ?? 0 } satisfies ObjectiveFinding; }
      if (objective.id === 'record-af-rvr-stroke-prevention-intent') { const ordered = rate && stroke && rate.tick <= stroke.tick; return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'Stroke prevention, bleeding, preference, duration, and cardioversion context stayed separate from rate control.' : 'Stroke-prevention review was absent or preceded the rate-control lane.', atTick: stroke?.tick ?? 0 } satisfies ObjectiveFinding; }
      const ordered = stroke && reassessment && stroke.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met', finding: ordered ? 'The lower-rate response remained AF and closed with change triggers, ownership, and follow-up.' : 'Trajectory reassessment was absent or preceded stroke-prevention review.', atTick: reassessment?.tick ?? 0 } satisfies ObjectiveFinding;
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

    if (objective.id === 'prepare-obstetric-oxygen-reserve') {
      const induction = actions.find(
        (action) => action.type === 'bolus' && action.payload.drugId === 'propofol',
      );
      if (!induction) {
        return { ...base, outcome: 'not-exercised', finding: 'No propofol induction dose was recorded.' } satisfies ObjectiveFinding;
      }
      const initial = scenario.equipment.ventilator;
      const acceptedSettings = actions.filter((action) => action.type === 'ventilator'
        && action.tick < induction.tick).reduce((settings, action) => {
        const entered = (field: string, fallback: number, min: number, max: number) => {
          if (action.payload[field] === undefined) return fallback;
          const value = Number(action.payload[field]);
          return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
        };
        return {
          fio2: entered('fio2', settings.fio2, 0.21, 1),
          freshGasFlowLPerMin: entered(
            'freshGasFlowLPerMin', settings.freshGasFlowLPerMin, 0.5, 15,
          ),
        };
      }, {
        fio2: initial.fio2,
        freshGasFlowLPerMin: initial.freshGasFlowLPerMin ?? 1,
      });
      const sample = history.filter((entry) => entry.tick <= induction.tick).at(-1);
      const endTidal = sample?.state.endTidalO2Fraction ?? 0;
      const machineReady = acceptedSettings.fio2 >= 0.95
        && acceptedSettings.freshGasFlowLPerMin >= 10;
      return {
        ...base,
        outcome: machineReady && endTidal >= 0.9 ? 'met'
          : machineReady || endTidal >= 0.8 ? 'partly-met' : 'not-met',
        finding: `Before propofol, accepted settings were oxygen ${(acceptedSettings.fio2 * 100).toFixed(0)}% and fresh-gas flow ${acceptedSettings.freshGasFlowLPerMin.toFixed(1)} L/min; end-tidal oxygen was ${endTidal.toFixed(2)}. This assesses a modeled machine endpoint, not mask seal or physical preoxygenation technique.`,
        atTick: induction.tick,
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

    if (objective.id === 'protect-obstetric-apnea-margin') {
      const induction = actions.find(
        (action) => action.type === 'bolus' && action.payload.drugId === 'propofol',
      );
      if (!induction) {
        return { ...base, outcome: 'not-exercised', finding: 'No propofol induction dose was recorded.' } satisfies ObjectiveFinding;
      }
      const airway = actions.find((action) => action.type === 'laryngoscopy');
      const successful = airway ? log.find((entry) => entry.tick >= airway.tick
        && entry.eventId.startsWith('laryngoscopy-') && entry.data?.intubated === true) : undefined;
      const gasExchange = successful ? history.find((sample) => sample.tick > successful.tick
        && Number(sample.state.respiratoryRateBpm ?? 0) > 0
        && Number(sample.state.etco2MmHg ?? 0) >= 20) : undefined;
      const relevant = history.filter((sample) => sample.tick >= induction.tick
        && sample.tick <= (gasExchange?.tick ?? history.at(-1)?.tick ?? induction.tick));
      const lowest = relevant.length > 0
        ? Math.min(...relevant.map((sample) => Number(sample.state.spo2Percent ?? 100))) : 100;
      return {
        ...base,
        outcome: gasExchange && lowest >= 95 ? 'met'
          : lowest >= 92 ? 'partly-met' : 'not-met',
        finding: `${gasExchange ? 'Delivered ventilation and sustained carbon dioxide returned' : 'Sustained gas exchange was not confirmed'}; the lowest maternal saturation after induction was ${lowest.toFixed(0)}%. The term-pregnancy reserve is one calibrated teaching profile, not an individual prediction.`,
        atTick: gasExchange?.tick ?? relevant.at(-1)?.tick ?? induction.tick,
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

    if (objective.id === 'confirm-obstetric-ventilation') {
      const airway = actions.find((action) => action.type === 'laryngoscopy');
      if (!airway) {
        return { ...base, outcome: 'not-exercised', finding: 'No attempt to secure the airway was recorded.' } satisfies ObjectiveFinding;
      }
      const successful = log.find((entry) => entry.tick >= airway.tick
        && entry.eventId.startsWith('laryngoscopy-') && entry.data?.intubated === true);
      const gasExchange = successful ? history.find((sample) => sample.tick > successful.tick
        && Number(sample.state.respiratoryRateBpm ?? 0) > 0
        && Number(sample.state.etco2MmHg ?? 0) >= 20) : undefined;
      return {
        ...base,
        outcome: successful && gasExchange ? 'met' : successful ? 'partly-met' : 'not-met',
        finding: successful
          ? gasExchange
            ? `The modeled tracheal placement was followed by delivered ventilation and sustained end-tidal carbon dioxide of ${Number(gasExchange.state.etco2MmHg ?? 0).toFixed(0)} mmHg.`
            : 'The modeled tracheal placement succeeded, but subsequent delivered ventilation with sustained carbon dioxide was not confirmed.'
          : 'No successful modeled tracheal placement was recorded. Gas exchange through another route does not confirm tracheal intubation.',
        atTick: gasExchange?.tick ?? successful?.tick ?? airway.tick,
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

    if ([
      'recognize-opioid-ventilatory-impairment', 'support-opioid-impaired-ventilation',
      'prevent-further-opioid-harm', 'escalate-opioid-reversal',
      'reassess-opioid-ventilatory-recovery',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find(
        (event) => event.type === 'opioid-ventilatory-impairment',
      )?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) return {
        ...base, outcome: 'not-exercised',
        finding: 'The session ended before the scripted opioid ventilatory impairment began.',
      } satisfies ObjectiveFinding;
      const help = log.find((event) => event.tick >= onset
        && event.eventId.startsWith('airway-help-requested-'));
      if (objective.id === 'recognize-opioid-ventilatory-impairment') {
        const delay = help ? (help.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 30 ? 'met' : delay <= 60 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'No accepted help request followed the difficult-arousal and depressed-ventilation pattern.'
            : `Help was requested ${delay.toFixed(0)} seconds after the pattern began. This records escalation timing, not sedation-scale technique, communication, or team arrival.`,
          atTick: help?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      if (objective.id === 'support-opioid-impaired-ventilation') {
        const windowEnd = onset + 90 * TICKS_PER_SECOND;
        let fio2 = scenario.equipment.ventilator.fio2;
        let delivering = scenario.equipment.ventilator.delivering;
        let tidal = scenario.equipment.ventilator.tidalVolumeMl;
        let rate = scenario.equipment.ventilator.respiratoryRateBpm;
        let achievedAt: number | null = null;
        for (const action of actions.filter((entry) => entry.type === 'ventilator'
          && entry.tick >= onset && entry.tick <= windowEnd).sort((a, b) => a.tick - b.tick)) {
          if (action.payload.fio2 !== undefined) fio2 = Number(action.payload.fio2);
          if (action.payload.tidalVolumeMl !== undefined) tidal = Number(action.payload.tidalVolumeMl);
          if (action.payload.respiratoryRateBpm !== undefined) rate = Number(action.payload.respiratoryRateBpm);
          if (typeof action.payload.delivering === 'boolean') delivering = action.payload.delivering;
          if (achievedAt === null && fio2 >= 0.95 && delivering && tidal > 0 && rate > 0) {
            achievedAt = action.tick;
          }
        }
        const delay = achievedAt === null ? null : (achievedAt - onset) / TICKS_PER_SECOND;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 45 ? 'met' : delay <= 90 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'The trace did not establish active breath delivery with at least 95% oxygen during the response window.'
            : `Active breath delivery with at least 95% oxygen began ${delay.toFixed(0)} seconds after onset. This records machine controls, not mask technique or airway examination.`,
          atTick: achievedAt ?? windowEnd,
        } satisfies ObjectiveFinding;
      }
      const held = log.find((event) => event.eventId.startsWith('further-opioid-held-'));
      const naloxone = log.find((event) => event.eventId.startsWith('naloxone-titration-intent-'));
      if (objective.id === 'prevent-further-opioid-harm') return {
        ...base, outcome: held && (!naloxone || held.tick <= naloxone.tick) ? 'met' : 'not-met',
        finding: held
          ? 'Further opioid was held before accepted reversal intent. The prior exposure and pain response are fixed, unmodeled facts.'
          : 'No accepted hold on further opioid was recorded.',
        atTick: held?.tick ?? onset,
      } satisfies ObjectiveFinding;
      if (objective.id === 'escalate-opioid-reversal') return {
        ...base, outcome: naloxone ? 'met' : 'not-met',
        finding: naloxone
          ? 'Naloxone titration intent was accepted after the opioid hold. No dose, administration, analgesia, withdrawal, or recurrence is inferred.'
          : 'No accepted naloxone titration intent was recorded.',
        atTick: naloxone?.tick ?? onset,
      } satisfies ObjectiveFinding;
      if (!naloxone) return {
        ...base, outcome: 'not-met',
        finding: 'Recovery was not credited because no accepted naloxone titration intent preceded it.',
        atTick: history.at(-1)?.tick ?? onset,
      } satisfies ObjectiveFinding;
      const spontaneousCheck = actions.find((action) => action.tick >= naloxone.tick
        && action.type === 'ventilator' && action.payload.delivering === false);
      if (!spontaneousCheck) return {
        ...base, outcome: 'not-met',
        finding: 'No supported-to-spontaneous reassessment was recorded after reversal intent, so spontaneous recovery was not inferred from delivered breaths.',
        atTick: history.at(-1)?.tick ?? naloxone.tick,
      } satisfies ObjectiveFinding;
      const recovered = history.find((entry) => entry.tick >= spontaneousCheck.tick
        && (entry.state.respiratoryRateBpm ?? 0) >= 10
        && (entry.state.tidalVolumeMl ?? 0) >= 400
        && (entry.state.etco2MmHg ?? 0) > 0
        && (entry.state.spo2Percent ?? 0) >= 94);
      return {
        ...base, outcome: recovered ? 'met' : 'not-met',
        finding: recovered
          ? `Spontaneous rate recovered to ${(recovered.state.respiratoryRateBpm ?? 0).toFixed(0)}/min with tidal volume ${(recovered.state.tidalVolumeMl ?? 0).toFixed(0)} mL, end-tidal carbon dioxide ${(recovered.state.etco2MmHg ?? 0).toFixed(0)} mmHg, and oxygen saturation ${(recovered.state.spo2Percent ?? 0).toFixed(0)}%. Continued monitoring and recurrent depression remain outside this trace.`
          : 'Spontaneous rate, breath size, carbon dioxide, and oxygenation had not all reached the declared recovery endpoints before the session ended.',
        atTick: recovered?.tick ?? history.at(-1)?.tick ?? onset,
      } satisfies ObjectiveFinding;
    }

    if ([
      'recognize-perioperative-hypothermia', 'start-active-surface-warming',
      'warm-bulk-perioperative-fluids', 'reassess-perioperative-rewarming',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find(
        (event) => event.type === 'perioperative-hypothermia',
      )?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) return {
        ...base, outcome: 'not-exercised',
        finding: 'The session ended before the fixed perioperative cooling course began.',
      } satisfies ObjectiveFinding;
      const confirmed = log.find((event) => event.eventId.startsWith('core-temperature-confirmed-'));
      const warming = log.find((event) => event.eventId.startsWith('forced-air-warming-started-'));
      const warmedFluids = log.find((event) => event.eventId.startsWith('warmed-bulk-fluids-recorded-'));
      if (objective.id === 'recognize-perioperative-hypothermia') return {
        ...base, outcome: confirmed ? 'met' : 'not-met',
        finding: confirmed
          ? `Core temperature was deliberately confirmed at ${Number(confirmed.data?.temperatureC ?? history.find((entry) => entry.tick >= confirmed.tick)?.state.coreTemperatureC ?? 0).toFixed(1)}°C after the cooling trend began. Probe site and technique are not inferred.`
          : 'No accepted core-temperature confirmation followed the fixed cooling trend.',
        atTick: confirmed?.tick ?? onset,
      } satisfies ObjectiveFinding;
      if (objective.id === 'start-active-surface-warming') return {
        ...base, outcome: warming ? 'met' : 'not-met',
        finding: warming
          ? 'Active surface warming was recorded after temperature confirmation. Device settings, skin contact, and heat transfer remain outside the model.'
          : 'No accepted active surface-warming response followed temperature confirmation.',
        atTick: warming?.tick ?? onset,
      } satisfies ObjectiveFinding;
      if (objective.id === 'warm-bulk-perioperative-fluids') return {
        ...base, outcome: warmedFluids ? 'met' : 'not-met',
        finding: warmedFluids
          ? 'Warming intent was recorded for the fixed 700 mL remaining crystalloid exposure. Fluid delivery and thermal transfer are not simulated.'
          : 'No accepted bulk-fluid warming intent was recorded.',
        atTick: warmedFluids?.tick ?? onset,
      } satisfies ObjectiveFinding;
      if (!warming) return {
        ...base, outcome: 'not-met',
        finding: 'Rewarming was not credited because active surface warming was not recorded.',
        atTick: history.at(-1)?.tick ?? onset,
      } satisfies ObjectiveFinding;
      const recovered = history.find((entry) => entry.tick >= warming.tick
        && (entry.state.coreTemperatureC ?? 0) >= 36.5);
      return {
        ...base, outcome: recovered ? 'met' : 'not-met',
        finding: recovered
          ? `Core temperature reached ${(recovered.state.coreTemperatureC ?? 0).toFixed(1)}°C after active warming. This is a bounded teaching trajectory, not an individual rewarming prediction.`
          : 'Core temperature had not reached the declared 36.5°C reassessment point before the session ended.',
        atTick: recovered?.tick ?? history.at(-1)?.tick ?? onset,
      } satisfies ObjectiveFinding;
    }

    if ([
      'confirm-perioperative-hyperglycemia', 'use-bounded-insulin-protocol',
      'reassess-perioperative-glucose',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find(
        (event) => event.type === 'perioperative-hyperglycemia',
      )?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) return {
        ...base, outcome: 'not-exercised',
        finding: 'The session ended before the fixed perioperative glucose cue appeared.',
      } satisfies ObjectiveFinding;
      const confirmed = log.find(
        (event) => event.eventId.startsWith('point-of-care-glucose-confirmed-'),
      );
      const insulinIntent = log.find(
        (event) => event.eventId.startsWith('insulin-protocol-intent-recorded-'),
      );
      const repeat = log.find(
        (event) => event.eventId.startsWith('repeat-point-of-care-glucose-'),
      );
      if (objective.id === 'confirm-perioperative-hyperglycemia') return {
        ...base, outcome: confirmed ? 'met' : 'not-met',
        finding: confirmed
          ? `Point-of-care glucose was deliberately confirmed at ${Number(confirmed.data?.glucoseMgPerDl ?? 0).toFixed(0)} mg/dL. Sampling and device performance are not inferred.`
          : 'No accepted point-of-care glucose confirmation followed the elevated cue.',
        atTick: confirmed?.tick ?? onset,
      } satisfies ObjectiveFinding;
      if (objective.id === 'use-bounded-insulin-protocol') return {
        ...base, outcome: insulinIntent ? 'met' : 'not-met',
        finding: insulinIntent
          ? 'Institutional insulin-protocol intent was recorded after confirmation. No individualized dose or delivery was inferred.'
          : 'No accepted institutional insulin-protocol response followed confirmation.',
        atTick: insulinIntent?.tick ?? onset,
      } satisfies ObjectiveFinding;
      const repeatValue = Number(repeat?.data?.glucoseMgPerDl);
      const inTarget = repeat !== undefined && repeatValue >= 100 && repeatValue <= 180;
      return {
        ...base, outcome: inTarget ? 'met' : 'not-met',
        finding: inTarget
          ? `The 30-minute repeat point-of-care glucose was ${repeatValue.toFixed(0)} mg/dL, within the declared 100–180 mg/dL perioperative target. This fixed response is not an individual prediction.`
          : repeat
            ? `The repeat point-of-care glucose was ${repeatValue.toFixed(0)} mg/dL, outside the declared target.`
            : 'No accepted repeat point-of-care glucose was recorded after the response interval.',
        atTick: repeat?.tick ?? history.at(-1)?.tick ?? onset,
      } satisfies ObjectiveFinding;
    }

    if ([
      'review-cied-device-record', 'review-cied-procedure-risk',
      'choose-coordinated-cied-plan', 'document-cied-backup-and-restoration',
    ].includes(objective.id)) {
      const supported = scenario.timeline.some(
        (event) => event.type === 'narrative' && event.target === 'cied-cautery-planning',
      );
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The CIED-planning vignette was not active.' } satisfies ObjectiveFinding;
      const device = log.find((event) => event.eventId.startsWith('cied-device-record-reviewed-'));
      const procedure = log.find((event) => event.eventId.startsWith('cied-procedure-risk-reviewed-'));
      const correctPlan = log.find(
        (event) => event.eventId.startsWith('cied-plan-coordinate-asynchronous-pacing-'),
      );
      const anyPlan = log.find((event) => event.eventId.startsWith('cied-plan-'));
      const restoration = log.find(
        (event) => event.eventId.startsWith('cied-backup-restoration-documented-'),
      );
      if (objective.id === 'review-cied-device-record') return {
        ...base, outcome: device ? 'met' : 'not-met',
        finding: device
          ? 'The fixed pacemaker type, indication, pacing dependence, recent function, and documented magnet response were reviewed.'
          : 'The device record was not reviewed before the session ended.',
        atTick: device?.tick ?? 0,
      } satisfies ObjectiveFinding;
      if (objective.id === 'review-cied-procedure-risk') return {
        ...base, outcome: procedure ? 'met' : 'not-met',
        finding: procedure
          ? 'The above-umbilicus surgical site and anticipated monopolar electrosurgery were joined to the device-specific interference question.'
          : 'The procedure and electromagnetic-interference pattern was not reviewed.',
        atTick: procedure?.tick ?? 0,
      } satisfies ObjectiveFinding;
      if (objective.id === 'choose-coordinated-cied-plan') return {
        ...base, outcome: correctPlan ? 'met' : 'not-met',
        finding: correctPlan
          ? 'A coordinated asynchronous pacing plan followed both reviews without claiming universal magnet behavior.'
          : anyPlan
            ? 'A device-plan shortcut was recorded instead of the coordinated asynchronous plan supported by the fixed facts.'
            : 'No CIED plan was recorded.',
        atTick: correctPlan?.tick ?? anyPlan?.tick ?? 0,
      } satisfies ObjectiveFinding;
      return {
        ...base, outcome: restoration && correctPlan ? 'met' : 'not-met',
        finding: restoration && correctPlan
          ? 'External backup, monitoring, and explicit restoration before leaving monitored care were documented after the coordinated plan.'
          : 'Backup and post-procedure restoration were not completed after the coordinated plan.',
        atTick: restoration?.tick ?? anyPlan?.tick ?? 0,
      } satisfies ObjectiveFinding;
    }

    if ([
      'confirm-handoff-readiness', 'share-handoff-critical-content',
      'assign-handoff-risks-and-ownership', 'close-loop-and-accept-transfer',
    ].includes(objective.id)) {
      const supported = scenario.timeline.some(
        (event) => event.type === 'narrative' && event.target === 'postoperative-handoff',
      );
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The postoperative-handoff vignette was not active.' } satisfies ObjectiveFinding;
      const ready = log.find((event) => event.eventId.startsWith('handoff-receiver-ready-'));
      const course = log.find((event) => event.eventId.startsWith('handoff-patient-course-shared-'));
      const current = log.find((event) => event.eventId.startsWith('handoff-current-state-shared-'));
      const risks = log.find((event) => event.eventId.startsWith('handoff-risks-actions-ownership-shared-'));
      const readback = log.find((event) => event.eventId.startsWith('handoff-receiver-readback-'));
      const accepted = log.find((event) => event.eventId.startsWith('handoff-transfer-accepted-'));
      if (objective.id === 'confirm-handoff-readiness') return {
        ...base, outcome: ready ? 'met' : 'not-met',
        finding: ready
          ? 'Receiver identity, monitoring readiness, shared attention, and an opportunity for questions were explicitly established.'
          : 'The handoff began without an accepted receiver-readiness event.',
        atTick: ready?.tick ?? 0,
      } satisfies ObjectiveFinding;
      if (objective.id === 'share-handoff-critical-content') return {
        ...base, outcome: course && current ? 'met' : 'not-met',
        finding: course && current
          ? 'The patient and perioperative course were shared separately from the current clinical state.'
          : 'The fixed patient/course and current-state content blocks were not both completed.',
        atTick: Math.max(course?.tick ?? 0, current?.tick ?? 0),
      } satisfies ObjectiveFinding;
      if (objective.id === 'assign-handoff-risks-and-ownership') return {
        ...base, outcome: risks ? 'met' : 'not-met',
        finding: risks
          ? 'Unresolved respiratory and bleeding risks, timed reassessment, task ownership, and escalation were made explicit.'
          : 'Unresolved risks, actions, timing, and ownership were not accepted after the core content.',
        atTick: risks?.tick ?? 0,
      } satisfies ObjectiveFinding;
      const closed = readback && accepted && accepted.tick >= readback.tick;
      return {
        ...base, outcome: closed ? 'met' : 'not-met',
        finding: closed
          ? 'Receiver synthesis preceded explicit acknowledgment and acceptance of responsibility.'
          : 'Responsibility was not credited because receiver synthesis and accepted transfer were incomplete or out of order.',
        atTick: accepted?.tick ?? readback?.tick ?? 0,
      } satisfies ObjectiveFinding;
    }

    if ([
      'recognize-shock-from-perfusion', 'assess-shock-phenotype',
      'test-fluid-responsiveness', 'reassess-and-escalate-shock',
    ].includes(objective.id)) {
      const supported = scenario.timeline.some(
        (event) => event.type === 'narrative' && event.target === 'undifferentiated-shock',
      );
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The undifferentiated-shock vignette was not active.' } satisfies ObjectiveFinding;
      const perfusion = log.find((event) => event.eventId.startsWith('shock-perfusion-reviewed-'));
      const lactate = log.find((event) => event.eventId.startsWith('shock-lactate-reviewed-'));
      const echo = log.find((event) => event.eventId.startsWith('shock-echo-reviewed-'));
      const passiveLegRaise = log.find((event) => event.eventId.startsWith('shock-plr-positive-'));
      const fluid = log.find((event) => event.eventId.startsWith('shock-fluid-challenge-'));
      const reassessed = log.find((event) => event.eventId.startsWith('shock-perfusion-reassessed-'));
      const escalated = log.find((event) => event.eventId.startsWith('shock-escalation-recorded-'));
      if (objective.id === 'recognize-shock-from-perfusion') return {
        ...base, outcome: perfusion && lactate ? 'met' : 'not-met',
        finding: perfusion && lactate
          ? 'Skin, brain, kidney, pressure, and the fixed lactate were deliberately joined as tissue-perfusion evidence without assigning a cause.'
          : 'Whole-patient perfusion findings and the fixed lactate were not both reviewed.',
        atTick: Math.max(perfusion?.tick ?? 0, lactate?.tick ?? 0),
      } satisfies ObjectiveFinding;
      if (objective.id === 'assess-shock-phenotype') return {
        ...base, outcome: echo ? 'met' : 'not-met',
        finding: echo
          ? 'The fixed focused cardiac findings were reviewed after whole-patient assessment to narrow the shock phenotype without claiming a definitive diagnosis.'
          : 'Focused cardiac findings were not reviewed after the whole-patient perfusion assessment.',
        atTick: echo?.tick ?? Math.max(perfusion?.tick ?? 0, lactate?.tick ?? 0),
      } satisfies ObjectiveFinding;
      if (objective.id === 'test-fluid-responsiveness') {
        const ordered = passiveLegRaise && fluid && passiveLegRaise.tick <= fluid.tick;
        return {
          ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'A positive fixed passive-leg-raise response preceded one bounded 500 mL balanced-crystalloid challenge.'
            : 'The fixed dynamic response and bounded fluid challenge were incomplete or out of order.',
          atTick: fluid?.tick ?? passiveLegRaise?.tick ?? 0,
        } satisfies ObjectiveFinding;
      }
      const closed = reassessed && escalated && reassessed.tick <= escalated.tick;
      return {
        ...base, outcome: closed ? 'met' : 'not-met',
        finding: closed
          ? 'The same perfusion markers were reassessed before escalation of the unresolved shock workup and definitive treatment.'
          : 'Serial perfusion reassessment and escalation were incomplete or out of order.',
        atTick: escalated?.tick ?? reassessed?.tick ?? 0,
      } satisfies ObjectiveFinding;
    }

    if ([
      'recognize-probable-sepsis-with-shock',
      'pair-diagnostics-with-immediate-antimicrobial-intent',
      'give-initial-sepsis-fluid-and-reassess',
      'support-persistent-shock-and-escalate-source-control',
    ].includes(objective.id)) {
      const supported = scenario.timeline.some(
        (event) => event.type === 'narrative' && event.target === 'septic-shock',
      );
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The septic-shock vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => event.eventId.startsWith('sepsis-recognition-reviewed-'));
      const diagnostics = log.find((event) => event.eventId.startsWith('sepsis-diagnostics-recorded-'));
      const antimicrobial = log.find((event) => event.eventId.startsWith('sepsis-antimicrobial-recorded-'));
      const fluid = log.find((event) => event.eventId.startsWith('sepsis-fluid-started-'));
      const reassessed = log.find((event) => event.eventId.startsWith('sepsis-post-fluid-reviewed-'));
      const norepinephrine = log.find((event) => event.eventId.startsWith('sepsis-norepinephrine-recorded-'));
      const sourceControl = log.find((event) => event.eventId.startsWith('sepsis-source-control-recorded-'));
      if (objective.id === 'recognize-probable-sepsis-with-shock') return {
        ...base, outcome: recognition ? 'met' : 'not-met',
        finding: recognition
          ? 'Probable infection, new organ dysfunction, hypotension, and impaired perfusion were deliberately joined without relying on one test.'
          : 'The fixed infection and organ-dysfunction evidence was not reviewed together.',
        atTick: recognition?.tick ?? 0,
      } satisfies ObjectiveFinding;
      if (objective.id === 'pair-diagnostics-with-immediate-antimicrobial-intent') {
        const ordered = diagnostics && antimicrobial && diagnostics.tick <= antimicrobial.tick;
        return {
          ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Blood-culture and lactate intent preceded immediate empiric antimicrobial intent without waiting for results.'
            : 'Diagnostic and antimicrobial intents were incomplete or out of order.',
          atTick: antimicrobial?.tick ?? diagnostics?.tick ?? 0,
        } satisfies ObjectiveFinding;
      }
      if (objective.id === 'give-initial-sepsis-fluid-and-reassess') {
        const ordered = fluid && reassessed && fluid.tick <= reassessed.tick;
        return {
          ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'The fixed 30 mL/kg balanced-crystalloid course was followed by serial perfusion reassessment rather than automatic repeat fluid.'
            : 'Initial crystalloid and post-fluid reassessment were incomplete or out of order.',
          atTick: reassessed?.tick ?? fluid?.tick ?? 0,
        } satisfies ObjectiveFinding;
      }
      const closed = norepinephrine && sourceControl;
      return {
        ...base, outcome: closed ? 'met' : 'not-met',
        finding: closed
          ? 'First-line norepinephrine intent for persistent shock and urgent source-control escalation both proceeded without making one wait for the other.'
          : 'Vasopressor support and source-control escalation were incomplete or out of order.',
        atTick: sourceControl?.tick ?? norepinephrine?.tick ?? 0,
      } satisfies ObjectiveFinding;
    }

    if ([
      'recognize-traumatic-hemorrhagic-shock',
      'stabilize-and-expedite-bleeding-control',
      'activate-and-bridge-with-blood',
      'monitor-and-reassess-traumatic-bleeding',
    ].includes(objective.id)) {
      const supported = scenario.timeline.some(
        (event) => event.type === 'narrative' && event.target === 'hemorrhagic-shock',
      );
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The traumatic hemorrhagic-shock vignette was not active.' } satisfies ObjectiveFinding;
      const recognition = log.find((event) => event.eventId.startsWith('trauma-recognition-reviewed-'));
      const stabilization = log.find((event) => event.eventId.startsWith('trauma-pelvic-stabilization-recorded-'));
      const activation = log.find((event) => event.eventId.startsWith('trauma-major-hemorrhage-activated-'));
      const redCells = log.find((event) => event.eventId.startsWith('trauma-red-cells-delivered-'));
      const monitoring = log.find((event) => event.eventId.startsWith('trauma-monitoring-reviewed-'));
      const reassessment = log.find((event) => event.eventId.startsWith('trauma-perfusion-reassessed-'));
      const definitiveControl = log.find((event) => event.eventId.startsWith('trauma-definitive-control-recorded-'));
      if (objective.id === 'recognize-traumatic-hemorrhagic-shock') return {
        ...base, outcome: recognition ? 'met' : 'not-met',
        finding: recognition
          ? 'Mechanism, pelvic injury pattern, physiology, and impaired perfusion were integrated despite no visible external bleeding.'
          : 'The fixed mechanism, injury pattern, and perfusion evidence was not reviewed together.',
        atTick: recognition?.tick ?? 0,
      } satisfies ObjectiveFinding;
      if (objective.id === 'stabilize-and-expedite-bleeding-control') {
        const ordered = stabilization && definitiveControl
          && stabilization.tick <= definitiveControl.tick;
        return {
          ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Pelvic-stabilization intent preceded immediate definitive-control escalation without waiting for resuscitation to finish.'
            : 'Pelvic stabilization and definitive-control escalation were incomplete or out of order.',
          atTick: definitiveControl?.tick ?? stabilization?.tick ?? 0,
        } satisfies ObjectiveFinding;
      }
      if (objective.id === 'activate-and-bridge-with-blood') {
        const ordered = activation && redCells && activation.tick <= redCells.tick;
        return {
          ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Major-hemorrhage activation preceded the bounded 2-unit red-cell bridge while bleeding control remained definitive.'
            : 'Major-hemorrhage activation and the bounded red-cell bridge were incomplete or out of order.',
          atTick: redCells?.tick ?? activation?.tick ?? 0,
        } satisfies ObjectiveFinding;
      }
      const ordered = redCells && monitoring && reassessment
        && redCells.tick <= reassessment.tick && monitoring.tick <= reassessment.tick;
      return {
        ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Coagulation, temperature, and the canonical perfusion response were reviewed after the bounded blood bridge without implying that bleeding had stopped.'
          : 'Coagulation, temperature, blood delivery, and serial perfusion reassessment were incomplete or out of order.',
        atTick: reassessment?.tick ?? Math.max(redCells?.tick ?? 0, monitoring?.tick ?? 0),
      } satisfies ObjectiveFinding;
    }

    if ([
      'recognize-traumatic-tamponade-pattern', 'review-tamponade-focused-pocus',
      'escalate-traumatic-tamponade-control', 'reassess-traumatic-tamponade',
    ].includes(objective.id)) {
      const supported = scenario.timeline.some((event) => event.type === 'cardiac-tamponade');
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The traumatic cardiac-tamponade vignette was not active.' } satisfies ObjectiveFinding;
      const context = log.find((event) => /^tamponade-context-reviewed-\d+$/.test(event.eventId));
      const pocus = log.find((event) => /^tamponade-pocus-reviewed-\d+$/.test(event.eventId));
      const control = log.find((event) => /^tamponade-control-recorded-\d+$/.test(event.eventId));
      const reassessment = log.find((event) => /^tamponade-perfusion-reassessed-\d+$/.test(event.eventId));
      if (objective.id === 'recognize-traumatic-tamponade-pattern') return {
        ...base, outcome: context ? 'met' : 'not-met',
        finding: context
          ? 'Penetrating central-chest mechanism, bilateral breathing, impaired perfusion, narrowing pressure, and falling end-tidal carbon dioxide were integrated.'
          : 'The fixed trauma and whole-patient perfusion evidence was not reviewed together.',
        atTick: context?.tick ?? 0,
      } satisfies ObjectiveFinding;
      if (objective.id === 'review-tamponade-focused-pocus') {
        const ordered = context && pocus && context.tick <= pocus.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'The fixed pericardial-fluid and right-sided-collapse statement followed whole-patient assessment without implying image-acquisition competence.'
            : 'Whole-patient assessment and the fixed POCUS statement were incomplete or out of order.',
          atTick: pocus?.tick ?? context?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'escalate-traumatic-tamponade-control') {
        const ordered = pocus && control && pocus.tick <= control.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Immediate trauma and surgical definitive-control intent followed the fixed unstable pattern and POCUS statement.'
            : 'The fixed focused finding and definitive-control escalation were incomplete or out of order.',
          atTick: control?.tick ?? pocus?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      const ordered = control && reassessment && control.tick < reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Unresolved canonical perfusion was reassessed after accepted control intent without inventing treatment delivery or recovery.'
          : 'Definitive-control intent and serial perfusion reassessment were incomplete or out of order.',
        atTick: reassessment?.tick ?? control?.tick ?? 0 } satisfies ObjectiveFinding;
    }

    if ([
      'recognize-post-extubation-obstruction', 'support-post-extubation-airway',
      'confirm-post-extubation-recovery',
    ].includes(objective.id)) {
      const onset = scenario.timeline.find(
        (event) => event.type === 'upper-airway-obstruction',
      )?.atTick;
      if (onset === undefined || (history.at(-1)?.tick ?? 0) < onset) {
        return {
          ...base, outcome: 'not-exercised',
          finding: 'The session ended before the scripted post-extubation obstruction began.',
        } satisfies ObjectiveFinding;
      }
      const help = log.find((event) =>
        event.tick >= onset && event.eventId.startsWith('airway-help-requested-'));
      if (objective.id === 'recognize-post-extubation-obstruction') {
        const delay = help ? (help.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: delay === null ? 'not-met' : delay <= 30 ? 'met' : delay <= 60 ? 'partly-met' : 'not-met',
          finding: delay === null
            ? 'No accepted airway-help request followed the obstructed-breathing pattern.'
            : `Airway help was requested ${delay.toFixed(0)} seconds after the pattern began. The request records escalation timing, not diagnosis, communication quality, or team arrival.`,
          atTick: help?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      const maneuver = actions.find((action) => action.tick >= onset
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
      if (objective.id === 'support-post-extubation-airway') {
        const complete = Boolean(maneuver && delivered.delivering && delivered.fio2 >= 0.95);
        const delay = maneuver ? (maneuver.tick - onset) / TICKS_PER_SECOND : null;
        return {
          ...base,
          outcome: !complete ? 'not-met' : delay! <= 45 ? 'met' : delay! <= 90 ? 'partly-met' : 'not-met',
          finding: !complete
            ? 'The trace did not record a held jaw-thrust/CPAP maneuver with active breath delivery and at least 95% oxygen.'
            : `The held jaw-thrust/CPAP maneuver began ${delay!.toFixed(0)} seconds after onset with active breath delivery and at least 95% oxygen. This records controls, not physical technique.`,
          atTick: maneuver?.tick ?? onset,
        } satisfies ObjectiveFinding;
      }
      if (!maneuver || !delivered.delivering || delivered.fio2 < 0.95) return {
        ...base, outcome: 'not-met', atTick: history.at(-1)?.tick ?? onset,
        finding: 'Recovery was not credited because the declared initial airway-support bundle was incomplete.',
      } satisfies ObjectiveFinding;
      const recovered = history.find((entry) => entry.tick >= maneuver.tick
        && (entry.state.tidalVolumeMl ?? 0) >= 300
        && (entry.state.etco2MmHg ?? 0) > 0
        && (entry.state.spo2Percent ?? 0) >= 94);
      return {
        ...base, outcome: recovered ? 'met' : 'not-met',
        finding: recovered
          ? `Tidal volume recovered to ${(recovered.state.tidalVolumeMl ?? 0).toFixed(0)} mL with end-tidal carbon dioxide ${(recovered.state.etco2MmHg ?? 0).toFixed(0)} mmHg and oxygen saturation ${(recovered.state.spo2Percent ?? 0).toFixed(0)}%. This is a bounded teaching trajectory, not proof that every cause of post-extubation obstruction was excluded.`
          : 'Tidal volume, end-tidal carbon dioxide, and oxygen saturation had not all reached the declared recovery endpoints before the session ended.',
        atTick: recovered?.tick ?? history.at(-1)?.tick ?? onset,
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
      'recognize-ed-anaphylaxis-pattern', 'give-first-line-im-epinephrine',
      'support-anaphylaxis-airway-and-circulation', 'reassess-initial-anaphylaxis-response',
    ].includes(objective.id)) {
      const supported = scenario.timeline.some(
        (event) => event.type === 'narrative' && event.target === 'emergency-anaphylaxis',
      );
      if (!supported) return { ...base, outcome: 'not-exercised',
        finding: 'The emergency-department anaphylaxis vignette was not active.' } satisfies ObjectiveFinding;
      const pattern = log.find((event) => event.eventId.startsWith('emergency-anaphylaxis-pattern-reviewed-'));
      const positioned = log.find((event) => event.eventId.startsWith('emergency-anaphylaxis-positioned-'));
      const epinephrine = log.find((event) => event.eventId.startsWith('epinephrine-im-emergency-'));
      const oxygen = log.find((event) => event.eventId.startsWith('emergency-anaphylaxis-oxygen-'));
      const fluid = log.find((event) => event.eventId.startsWith('emergency-anaphylaxis-fluid-'));
      const reassessment = log.find((event) => event.eventId.startsWith('emergency-anaphylaxis-reassessed-'));
      if (objective.id === 'recognize-ed-anaphylaxis-pattern') return {
        ...base, outcome: pattern ? 'met' : 'not-met',
        finding: pattern
          ? 'The fixed airway, breathing, circulation, and exposure pattern was integrated without waiting for skin findings or claiming diagnostic certainty.'
          : 'The fixed systemic pattern was not reviewed before the response.',
        atTick: pattern?.tick ?? 0,
      } satisfies ObjectiveFinding;
      if (objective.id === 'give-first-line-im-epinephrine') {
        const ordered = positioned && epinephrine && positioned.tick <= epinephrine.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'Recumbent positioning and emergency help preceded the fixed 500-microgram intramuscular epinephrine action; no intravenous bolus pathway was used.'
            : 'Positioning, emergency help, and fixed first-line IM epinephrine were incomplete or out of order.',
          atTick: epinephrine?.tick ?? positioned?.tick ?? 0 } satisfies ObjectiveFinding;
      }
      if (objective.id === 'support-anaphylaxis-airway-and-circulation') {
        const ordered = epinephrine && oxygen && fluid
          && epinephrine.tick <= oxygen.tick && epinephrine.tick <= fluid.tick;
        return { ...base, outcome: ordered ? 'met' : 'not-met',
          finding: ordered
            ? 'High-flow oxygen and the fixed 1,500 mL isotonic-crystalloid bolus followed first-line IM epinephrine as parallel support.'
            : 'First-line epinephrine, oxygen, and early crystalloid support were incomplete or out of order.',
          atTick: Math.max(epinephrine?.tick ?? 0, oxygen?.tick ?? 0, fluid?.tick ?? 0) } satisfies ObjectiveFinding;
      }
      const ordered = oxygen && fluid && reassessment
        && oxygen.tick <= reassessment.tick && fluid.tick <= reassessment.tick;
      return { ...base, outcome: ordered ? 'met' : 'not-met',
        finding: ordered
          ? 'Airway, breathing, circulation, mental status, and the canonical monitor response were reassessed without treating recovery as diagnostic or prognostic proof.'
          : 'Initial support and serial whole-patient reassessment were incomplete or out of order.',
        atTick: reassessment?.tick ?? Math.max(oxygen?.tick ?? 0, fluid?.tick ?? 0) } satisfies ObjectiveFinding;
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
