/**
 * Turn a submitted transcript back into findings, locally
 * (learning/curriculum → Instructor Mode Without Surveillance).
 *
 * The transcript carries the learner's inputs and nothing else. Everything an
 * instructor sees is RE-DERIVED by running the same deterministic engine over
 * those inputs — the same property that makes the debrief's counterfactuals
 * honest. Nothing is taken on trust from the file, including its own claims
 * about what happened.
 */

import type { Transcript } from '@platform/transcript/transcript';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { getScenario } from '../scenarios';
import { MAX_REPLAY_TICKS, type RunReplay } from './replay';
import { findStacking } from './analysis';
import { objectiveFindings } from '../ui/Debrief';
import type { ObjectiveFinding } from './analysis';
import { PREOXYGENATION_END_TIDAL_TARGET } from '../engine';

export interface TranscriptAnalysis {
  readonly transcript: Transcript;
  /** The file's own name, so an instructor can tell submissions apart. */
  readonly label: string;
  readonly scenarioTitle: string;
  readonly findings: readonly ObjectiveFinding[];
  readonly simulatedMinutes: number;
  readonly actionCount: number;
  /** Whether the state trace matched the hash the file was captured with. */
  readonly integrity: 'verified' | 'mismatch' | 'not-checked';
}

export class UnreadableTranscript extends Error {}

/**
 * The most actions a transcript may claim. A learner pressing a control ten
 * times a second for an hour would not reach this; a corrupt file will.
 */
export const MAX_TRANSCRIPT_ACTIONS = 50_000;

/**
 * Parse a submitted file. Everything is checked: a transcript is a file from
 * outside, and the only reason to trust any of it is that the engine reproduces
 * it.
 */
export function parseTranscript(text: string, label: string): Transcript {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new UnreadableTranscript(`${label} is not a readable file. It should be the JSON file the simulator exported.`);
  }
  const candidate = value as Partial<Transcript>;
  if (candidate?.format !== 'opensimlab.transcript') {
    throw new UnreadableTranscript(`${label} is not an Open Sim Lab transcript.`);
  }
  if (!Array.isArray(candidate.actions) || typeof candidate.ticks !== 'number') {
    throw new UnreadableTranscript(`${label} is missing the record of what the learner did.`);
  }
  if (!Number.isFinite(candidate.ticks) || candidate.ticks < 0 || candidate.ticks > MAX_REPLAY_TICKS) {
    throw new UnreadableTranscript(
      `${label} claims a session of ${String(candidate.ticks)} ticks, which is not a session this `
      + 'build will replay. The file is corrupt, or it is not from this simulator.',
    );
  }
  // A file can carry any number of actions. Replaying is bounded by the tick
  // count, but sorting and scanning a million of them is not, and an instructor
  // opening a bad submission should get a message rather than a locked tab.
  if (candidate.actions.length > MAX_TRANSCRIPT_ACTIONS) {
    throw new UnreadableTranscript(
      `${label} records ${candidate.actions.length} actions, far more than a session can contain.`,
    );
  }
  if (typeof candidate.scenarioId !== 'string' || !getScenario(candidate.scenarioId)) {
    throw new UnreadableTranscript(
      `${label} names a scenario this build does not have: ${String(candidate.scenarioId)}. `
      + 'The learner may be on a different version.',
    );
  }
  return candidate as Transcript;
}

/** Seconds spent denitrogenated before the airway was first instrumented. */
function preoxygenationSeconds(
  history: readonly { tick: number; state: Readonly<Record<string, number>> }[],
  transcript: Transcript,
): number {
  const firstAirway = transcript.actions.find((action) => action.type === 'laryngoscopy');
  const limit = firstAirway?.tick ?? Infinity;
  let ticks = 0;
  let previous: number | null = null;
  for (const sample of history) {
    if (sample.tick > limit) break;
    const fraction = sample.state.endTidalO2Fraction ?? 0;
    if (fraction >= PREOXYGENATION_END_TIDAL_TARGET && previous !== null) {
      ticks += sample.tick - previous;
    }
    previous = sample.tick;
  }
  return ticks / TICKS_PER_SECOND;
}

/**
 * The replay runs in the worker, so this is asynchronous. Nothing else about it
 * changed: every number below is still re-derived from the learner's inputs.
 */
export async function analyseTranscript(
  transcript: Transcript, label: string, runReplay: RunReplay,
): Promise<TranscriptAnalysis> {
  const scenario = getScenario(transcript.scenarioId)!;
  const history = await runReplay(transcript.actions, {
    scenario,
    seed: transcript.seed,
    practiceRegion: transcript.practiceRegion,
    ticks: transcript.ticks,
  });
  const stacking = findStacking(transcript.actions, history, { propofol: 100, remifentanil: 90 });
  const findings = objectiveFindings(
    scenario, history, stacking.length, preoxygenationSeconds(history, transcript), transcript.actions,
  );
  return {
    transcript,
    label,
    scenarioTitle: scenario.metadata.title,
    findings,
    simulatedMinutes: transcript.ticks / TICKS_PER_SECOND / 60,
    actionCount: transcript.actions.length,
    // The captured hash covers the state trace, which a replay here reproduces
    // only if the engine version matches. Comparing across versions would report
    // a false tamper, so it is reported as unchecked instead of guessed at.
    integrity: 'not-checked',
  };
}

export interface ObjectiveSummary {
  readonly objectiveId: string;
  readonly statement: string;
  readonly met: number;
  readonly partly: number;
  readonly notMet: number;
  readonly notExercised: number;
  readonly total: number;
}

/**
 * Where a cohort is strong and where it is not.
 *
 * Deliberately per OBJECTIVE and never per learner: the point of this view is to
 * tell an instructor what to teach next, not to rank the room.
 */
export function summariseCohort(analyses: readonly TranscriptAnalysis[]): ObjectiveSummary[] {
  const byObjective = new Map<string, ObjectiveSummary>();
  for (const analysis of analyses) {
    for (const finding of analysis.findings) {
      const current = byObjective.get(finding.objectiveId) ?? {
        objectiveId: finding.objectiveId,
        statement: finding.statement,
        met: 0, partly: 0, notMet: 0, notExercised: 0, total: 0,
      };
      byObjective.set(finding.objectiveId, {
        ...current,
        met: current.met + (finding.outcome === 'met' ? 1 : 0),
        partly: current.partly + (finding.outcome === 'partly-met' ? 1 : 0),
        notMet: current.notMet + (finding.outcome === 'not-met' ? 1 : 0),
        notExercised: current.notExercised + (finding.outcome === 'not-exercised' ? 1 : 0),
        total: current.total + 1,
      });
    }
  }
  // Weakest first: the objective a cohort struggled with is the one worth the
  // next teaching hour.
  return [...byObjective.values()].sort(
    (a, b) => (a.met / Math.max(a.total, 1)) - (b.met / Math.max(b.total, 1)),
  );
}
