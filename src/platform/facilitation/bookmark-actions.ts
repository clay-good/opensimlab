/**
 * The engine actions behind each bookmarked lesson's reference transcripts
 * (facilitator-toolkit → jump to a bookmark).
 *
 * Fixtures come in two shapes: anaesthesia's are engine actions already, and
 * the tray-driven lessons record `[tick, control]`, which their own dispatch map
 * turns into the action the tray would send. Each lesson is a dynamic import so
 * no fixture reaches the shared cockpit chunk, and only lessons that declare a
 * bookmark are listed: `tests/unit/bookmarks.test.ts` fails when a lesson
 * declares one without an entry here, so a bookmark can never show a jump
 * control that has nothing to replay.
 */
import type { LearnerAction } from '@platform/kernel/protocol';
import type { BookmarkTranscript } from '@anesthesia/scenarios/types';

type Transcripts = Readonly<Record<BookmarkTranscript, readonly LearnerAction[]>>;

/** Resolve `[tick, control]` steps through the lesson's dispatch map. */
function dispatched<Control extends string>(
  steps: readonly (readonly [number, Control])[],
  map: Readonly<Record<Control, Omit<LearnerAction, 'tick'>>>,
): readonly LearnerAction[] {
  return steps.map(([tick, control]) => ({ tick, ...map[control] }));
}

const LOADERS: Readonly<Record<string, () => Promise<Transcripts>>> = {
  'anesthesia:persistent-vf-cardiac-arrest': async () => {
    const { PERSISTENT_VF_CARDIAC_ARREST_FIXTURES: fixture } = await import('@anesthesia/persistent-vf-cardiac-arrest-fixtures');
    return { expert: fixture.expert, 'common-error': fixture.commonError, recovery: fixture.recovery };
  },
  'emergency-medicine:persistent-vf-arrest': async () => {
    const [{ PERSISTENT_VF_FIXTURES: fixture }, { PERSISTENT_VF_DISPATCH: map }] = await Promise.all([
      import('../../modules/emergency-medicine/persistent-vf-arrest-fixtures'),
      import('../../modules/emergency-medicine/persistent-vf-arrest'),
    ]);
    return {
      expert: dispatched(fixture.expert, map),
      'common-error': dispatched(fixture.commonError, map),
      recovery: dispatched(fixture.recovery, map),
    };
  },
};

/** The lessons a bookmark can be jumped to in, as `module:scenario` keys. */
export const BOOKMARK_ACTION_KEYS: readonly string[] = Object.keys(LOADERS);

/** The named reference transcript as engine actions, or null for a lesson with no entry. */
export async function loadBookmarkActions(
  moduleId: string, scenarioId: string, transcript: BookmarkTranscript,
): Promise<readonly LearnerAction[] | null> {
  const load = LOADERS[`${moduleId}:${scenarioId}`];
  return load ? (await load())[transcript] : null;
}
