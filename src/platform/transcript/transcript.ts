/**
 * The session transcript (engine/simulation-clock → Deterministic Session Transcript,
 * platform/privacy → An exported transcript contains no identifiers).
 *
 * Versioned from the first commit, because a format without a version field
 * cannot migrate and sessions recorded during the alpha should still replay later.
 *
 * It records the scenario, the engine and content versions, the model-set
 * revision, the practice region, the seed, and the ordered learner actions —
 * and nothing else. There is no device fingerprint, no browser identifier, no
 * locale-derived identity, and no real-world clock time anywhere in it.
 */

import type { LearnerAction } from '@platform/kernel/protocol';

/** Bumped on any incompatible change to the transcript shape. */
export const TRANSCRIPT_FORMAT_VERSION = 1;

/**
 * The not-for-clinical-use statement embedded in every export
 * (platform/safety-and-scope → Exports carry the statement).
 */
export const NOT_FOR_CLINICAL_USE =
  'Open Sim Lab is an educational simulator, not for clinical use. It is not a clinical '
  + 'decision-support tool, not a dosing calculator, and is not validated for any decision affecting '
  + 'a real patient.';

/**
 * The unreviewed-content statement, carried beside the one above in every export
 * (platform/safety-and-scope → Exports carry the statement).
 *
 * The two say different things and both are needed. The statement above bounds
 * what the simulator is FOR; this one discloses that nothing in it has been
 * checked by a clinician. An exported file travels — into an inbox, a course
 * pack, a shared drive — detached from the interface that labels every item, so
 * it has to carry the disclosure itself, with the address of the page that lists
 * the status of every item rather than a summary of it.
 */
export const NOT_CLINICALLY_REVIEWED =
  'No clinician has reviewed this content. Every item in this build is published as '
  + '"Educational use only. Not clinically reviewed", the editorial board is empty and '
  + 'published as empty, and the status of every item is listed at '
  + 'https://opensimlab.com/review-status.';

export interface TranscriptVersions {
  readonly engine: string;
  readonly content: string;
  readonly modelSet: string;
  readonly scenario: string;
}

export interface Transcript {
  readonly format: 'opensimlab.transcript';
  readonly formatVersion: number;
  readonly notForClinicalUse: string;
  readonly notClinicallyReviewed: string;
  readonly moduleId: string;
  readonly scenarioId: string;
  readonly versions: TranscriptVersions;
  readonly practiceRegion: string;
  readonly seed: number;
  /** Guidance level is presentational, but recorded so a debrief is interpretable. */
  readonly guidanceLevel: 'guided' | 'coached' | 'unassisted';
  /** Ordered by tick. The complete input history; nothing else is needed to replay. */
  readonly actions: readonly LearnerAction[];
  /** Total ticks executed, so a replay knows when to stop. */
  readonly ticks: number;
  /** SHA-256 of the serialized state trace, recorded at capture time. */
  readonly stateTraceHash: string;
}

export interface TranscriptDraft {
  moduleId: string;
  scenarioId: string;
  versions: TranscriptVersions;
  practiceRegion: string;
  seed: number;
  guidanceLevel: 'guided' | 'coached' | 'unassisted';
}

/** Accumulates a transcript while a session runs. */
export class TranscriptRecorder {
  private readonly actions: LearnerAction[] = [];
  private ticks = 0;

  constructor(private readonly draft: TranscriptDraft, initialActions: readonly LearnerAction[] = []) {
    this.actions.push(...initialActions);
  }

  record(action: LearnerAction): void {
    this.actions.push(action);
  }

  setTicks(ticks: number): void {
    this.ticks = ticks;
  }

  /** Create an independent branch containing only actions before the decision tick. */
  forkAt(tick: number): TranscriptRecorder {
    return new TranscriptRecorder(this.draft, this.actions.filter((action) => action.tick < tick));
  }

  build(stateTraceHash: string): Transcript {
    return {
      format: 'opensimlab.transcript',
      formatVersion: TRANSCRIPT_FORMAT_VERSION,
      notForClinicalUse: NOT_FOR_CLINICAL_USE,
      notClinicallyReviewed: NOT_CLINICALLY_REVIEWED,
      moduleId: this.draft.moduleId,
      scenarioId: this.draft.scenarioId,
      versions: this.draft.versions,
      practiceRegion: this.draft.practiceRegion,
      seed: this.draft.seed,
      guidanceLevel: this.draft.guidanceLevel,
      actions: [...this.actions].sort((a, b) => a.tick - b.tick),
      ticks: this.ticks,
      stateTraceHash,
    };
  }
}

/** Fields a transcript is forbidden to contain, asserted by the privacy tests. */
export const FORBIDDEN_TRANSCRIPT_KEYS = [
  'userId', 'user', 'name', 'email', 'deviceId', 'device', 'userAgent', 'ip',
  'timestamp', 'createdAt', 'recordedAt', 'locale', 'timezone', 'fingerprint',
] as const;

/** Throw if a transcript carries anything identifying. Runs before every export. */
export function assertTranscriptIsAnonymous(transcript: unknown): void {
  const seen = new Set<unknown>();
  const walk = (node: unknown, path: string): void => {
    if (node === null || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if ((FORBIDDEN_TRANSCRIPT_KEYS as readonly string[]).includes(key)) {
        throw new Error(`Transcript carries a forbidden field at ${path}.${key}`);
      }
      walk(value, `${path}.${key}`);
    }
  };
  walk(transcript, '$');
}

export interface VersionComparison {
  readonly matches: boolean;
  /** Human-readable differences, empty when the versions match. */
  readonly differences: readonly string[];
}

/**
 * Compare a transcript's recorded versions with the running build.
 * A mismatch is reported, never guessed at
 * (engine/simulation-clock → Version mismatch is reported, not guessed).
 */
export function compareVersions(recorded: TranscriptVersions, current: TranscriptVersions): VersionComparison {
  const differences: string[] = [];
  for (const key of ['engine', 'content', 'modelSet', 'scenario'] as const) {
    if (recorded[key] !== current[key]) {
      differences.push(`${key}: transcript recorded ${recorded[key]}, this build is ${current[key]}`);
    }
  }
  return { matches: differences.length === 0, differences };
}
