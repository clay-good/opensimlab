/**
 * Debrief analysis (learning/pedagogy → Debrief Follows The PEARLS Framework,
 * Scoring Is Formative, Not Ranked).
 *
 * PEARLS — Promoting Excellence and Reflective Learning in Simulation; Eppich W,
 * Cheng A. *Simul Healthc* 2015;10:106-15, PMID 25710312 — is the established
 * blended debriefing framework this follows, through its phases in order:
 * reactions, description, analysis, and summary and application.
 *
 * Nothing here produces a composite score, a pass or fail verdict, a percentile,
 * or a ranking. Findings are specific and actionable, or they are not findings.
 */

import { TICKS_PER_SECOND, formatElapsed } from '@platform/clock/simulation-clock';
import type { Attribution, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';

export type PearlsPhase = 'reactions' | 'description' | 'analysis' | 'summary';

export const PEARLS_PHASES: readonly { id: PearlsPhase; title: string; purpose: string }[] = [
  {
    id: 'reactions',
    title: 'Reactions',
    purpose: 'Your account first. What stood out, and how did it feel?',
  },
  {
    id: 'description',
    title: 'Description',
    purpose: 'What actually happened, in order, so we are both looking at the same case.',
  },
  {
    id: 'analysis',
    title: 'Analysis',
    purpose: 'Why the patient did what it did, and what the alternatives would have produced.',
  },
  {
    id: 'summary',
    title: 'Summary and application',
    purpose: 'What you are taking away, and where it applies next.',
  },
];

export const PEARLS_CITATION =
  'Eppich W, Cheng A. Promoting Excellence and Reflective Learning in Simulation (PEARLS): '
  + 'development and rationale for a blended approach to health care simulation debriefing. '
  + 'Simul Healthc 2015;10:106-15. PMID 25710312.';

/** What software automates, and what a human facilitator still has to provide. */
export const PEARLS_DIVISION_OF_LABOUR = {
  automated: [
    'The event timeline and the objective-by-objective outcome.',
    'The physiological attribution for every major state change.',
    'Counterfactuals, computed by re-running the engine rather than asserted.',
    'Links to the underlying models and their citations.',
  ],
  requiresHuman: [
    'Judging whether a learner\'s stated reasoning was sound, as opposed to whether their actions were.',
    'Reading affect, and adjusting the conversation to the person in front of you.',
    'Team and communication behaviour, which this simulator does not model at all.',
    'Deciding when a learner needs to stop and be supported rather than taught.',
  ],
} as const;

// --- Episodes -----------------------------------------------------------------

export interface Episode {
  readonly id: string;
  readonly label: string;
  readonly startTick: number;
  readonly endTick: number;
  readonly durationSeconds: number;
  /** The extreme value reached, in the parameter's own units. */
  readonly extreme: number;
  readonly parameter: string;
  /** Ranked physiological contributors at the worst point. */
  readonly contributors: readonly { label: string; share: number; teachingModel: boolean }[];
  /** The learner action or inaction that preceded it. */
  readonly precededBy: string;
}

/** Find every interval where a parameter stayed past a threshold for long enough. */
export function findEpisodes(
  history: readonly HistorySample[],
  options: {
    readonly parameter: string;
    readonly threshold: number;
    readonly direction: 'below' | 'above';
    readonly minimumSeconds: number;
    readonly label: string;
  },
  attributionAt: (tick: number) => readonly Attribution[],
  actions: readonly LearnerAction[],
): Episode[] {
  const episodes: Episode[] = [];
  let start: HistorySample | null = null;
  let extreme = options.direction === 'below' ? Infinity : -Infinity;
  let extremeTick = 0;

  const breached = (value: number) =>
    options.direction === 'below' ? value < options.threshold : value > options.threshold;

  const close = (endTick: number) => {
    if (!start) return;
    const seconds = (endTick - start.tick) / TICKS_PER_SECOND;
    if (seconds >= options.minimumSeconds) {
      const attribution = attributionAt(extremeTick).find((entry) => entry.variable === options.parameter);
      episodes.push({
        id: `${options.parameter}-${start.tick}`,
        label: options.label,
        startTick: start.tick,
        endTick,
        durationSeconds: seconds,
        extreme,
        parameter: options.parameter,
        contributors: (attribution?.terms ?? []).slice(0, 4).map((term) => ({
          label: term.label, share: term.share, teachingModel: term.teachingModel,
        })),
        precededBy: describePrecedingAction(actions, start.tick),
      });
    }
    start = null;
    extreme = options.direction === 'below' ? Infinity : -Infinity;
  };

  for (const sample of history) {
    const value = sample.state[options.parameter];
    if (value === undefined) continue;
    if (breached(value)) {
      start ??= sample;
      if (options.direction === 'below' ? value < extreme : value > extreme) {
        extreme = value;
        extremeTick = sample.tick;
      }
    } else {
      close(sample.tick);
    }
  }
  if (start) close(history[history.length - 1]?.tick ?? 0);
  return episodes;
}

function describePrecedingAction(actions: readonly LearnerAction[], tick: number): string {
  const before = [...actions].filter((action) => action.tick <= tick).sort((a, b) => b.tick - a.tick)[0];
  if (!before) return 'Nothing was done before this began.';
  const gap = (tick - before.tick) / TICKS_PER_SECOND;
  const description = before.type === 'bolus'
    ? `${String(before.payload.drugId)} ${String(before.payload.amount)} ${String(before.payload.unit)}`
    : before.type;
  return `${description} at ${formatElapsed(before.tick)}, ${gap.toFixed(0)} s earlier.`;
}

// --- Objectives -----------------------------------------------------------------

export type ObjectiveOutcome = 'met' | 'partly-met' | 'not-met' | 'not-exercised';

export interface ObjectiveFinding {
  readonly objectiveId: string;
  readonly statement: string;
  readonly outcome: ObjectiveOutcome;
  /** Specific and actionable. Never a score. */
  readonly finding: string;
  /** The interval of the trace this refers to, so the learner can look at it. */
  readonly atTick?: number;
  /** The concept explainer that teaches the underlying idea. */
  readonly concept?: string;
}

/** Stacking: a bolus given while the effect site was still climbing from the last one. */
export interface StackingFinding {
  readonly tick: number;
  readonly drugId: string;
  readonly secondsSincePrevious: number;
  readonly timeToPeakSeconds: number;
}

export function findStacking(
  actions: readonly LearnerAction[],
  history: readonly HistorySample[],
  timeToPeakSeconds: Readonly<Record<string, number>>,
): StackingFinding[] {
  const out: StackingFinding[] = [];
  const boluses = actions.filter((action) => action.type === 'bolus');
  for (let i = 1; i < boluses.length; i += 1) {
    const previous = boluses[i - 1]!;
    const current = boluses[i]!;
    const drugId = String(current.payload.drugId);
    if (String(previous.payload.drugId) !== drugId) continue;
    const peak = timeToPeakSeconds[drugId];
    if (peak === undefined) continue;
    const gap = (current.tick - previous.tick) / TICKS_PER_SECOND;
    if (gap < peak) {
      out.push({ tick: current.tick, drugId, secondsSincePrevious: gap, timeToPeakSeconds: peak });
    }
  }
  // The record above is confirmed against the trace: the effect site really was rising.
  return out.filter((finding) => {
    const before = history.filter((sample) => sample.tick <= finding.tick).slice(-3);
    if (before.length < 2) return true;
    const series = before.map((sample) =>
      sample.concentrations.find((c) => c.drugId === finding.drugId)?.effectSite ?? 0);
    return (series[series.length - 1] ?? 0) > (series[0] ?? 0);
  });
}

// --- Counterfactuals ---------------------------------------------------------------

export interface CounterfactualRequest {
  readonly id: string;
  /** Human-readable statement of the alternative. */
  readonly claim: string;
  /** How to modify the recorded action list. */
  readonly modify: (actions: readonly LearnerAction[]) => LearnerAction[];
  /** What to measure on the counterfactual run. */
  readonly measure: (history: readonly HistorySample[]) => number;
  readonly unit: string;
}

export interface CounterfactualResult {
  readonly id: string;
  readonly claim: string;
  readonly actual: number;
  readonly counterfactual: number;
  readonly unit: string;
  /** True when the alternative genuinely improved things. */
  readonly better: boolean;
  /** The modified action list, so the run is inspectable. */
  readonly modifiedActions: readonly LearnerAction[];
}

/** Move an action earlier by `seconds`, never before tick zero. */
export function shiftEarlier(
  actions: readonly LearnerAction[],
  predicate: (action: LearnerAction) => boolean,
  seconds: number,
): LearnerAction[] {
  return actions.map((action) => (predicate(action)
    ? { ...action, tick: Math.max(action.tick - seconds * TICKS_PER_SECOND, 0) }
    : action));
}

/** Total seconds a parameter spent past a threshold, the usual counterfactual measure. */
export function secondsBeyond(
  history: readonly HistorySample[],
  parameter: string,
  threshold: number,
  direction: 'below' | 'above',
): number {
  let ticks = 0;
  let previousTick: number | null = null;
  for (const sample of history) {
    const value = sample.state[parameter];
    if (value === undefined) continue;
    const breached = direction === 'below' ? value < threshold : value > threshold;
    if (breached && previousTick !== null) ticks += sample.tick - previousTick;
    previousTick = sample.tick;
  }
  return ticks / TICKS_PER_SECOND;
}

// --- Reactions and adaptive depth ----------------------------------------------------

/**
 * Whether the learner's own account already identified the key issue.
 *
 * The framework's core sequence is self-assessment before directive feedback, and
 * a facilitator adapts: confirm and extend an accurate account, give focused
 * directive feedback on one that missed the issue. This is a keyword match, which
 * is a crude instrument, and the interface says so rather than pretending to
 * understand the learner's prose.
 */
export function accountIdentifies(account: string, keywords: readonly string[]): boolean {
  const text = account.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

export interface AnalysisTone {
  readonly mode: 'confirm-and-extend' | 'focused-directive';
  readonly opening: string;
}

export function toneFor(identified: boolean, issue: string): AnalysisTone {
  return identified
    ? {
      mode: 'confirm-and-extend',
      opening: `You named it: ${issue}. Here is what was going on underneath, and where it goes next.`,
    }
    : {
      mode: 'focused-directive',
      opening: `One thing worth looking at closely: ${issue}. Here is the specific observation.`,
    };
}

/**
 * The opening of the debrief, framed for psychological safety: what the learner
 * was trying to achieve and what made the situation difficult, BEFORE what would
 * have worked. It never evaluates the learner as a person.
 */
export function safeContainerOpening(options: {
  readonly procedure: string;
  readonly hardestThing: string;
  readonly patientHarmed: boolean;
  readonly patientDied: boolean;
  readonly activityContext?: string;
}): string {
  if (options.patientDied) {
    return 'This scenario ended in the patient\'s death. That is affecting even in simulation, and '
      + 'it is worth taking a moment before going on. The outcome reflects how this scenario was '
      + 'designed, not your worth as a clinician. The debrief is here whenever you are ready.';
  }
  const harm = options.patientHarmed
    ? ' The patient came to harm along the way, and the debrief will look at why without treating '
      + 'it as a verdict on you.'
    : '';
  return `You were ${options.activityContext ?? `anaesthetising a patient for ${options.procedure}`}. The hardest part of that was `
    + `${options.hardestThing}.${harm} Before anything else: what stood out to you?`;
}
