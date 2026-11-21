/**
 * Bookmarks (facilitator-toolkit → bookmarks and scrubbing).
 *
 * A bookmark names a moment on one of the lesson's own reference transcripts.
 * Reaching it means replaying that transcript's actions before the bookmark's
 * tick, so the only thing a bookmark can get wrong is pointing past the end of
 * the transcript it names: there the room would be shown a state the lesson's
 * authors never walked through, labelled as if they had.
 */
import type { ScenarioBookmark } from '@anesthesia/scenarios/types';
import type { ReferencePaths, ReferenceStep } from './reference-paths';

/** The reference transcript a bookmark names. */
export function bookmarkTranscript(bookmark: ScenarioBookmark, paths: ReferencePaths): readonly ReferenceStep[] {
  switch (bookmark.transcript) {
    case 'expert': return paths.expert;
    case 'common-error': return paths.commonError;
    case 'recovery': return paths.recovery;
  }
}

/** Whether the named transcript is still running at the bookmark's tick. */
export function transcriptReachesBookmark(bookmark: ScenarioBookmark, paths: ReferencePaths): boolean {
  const steps = bookmarkTranscript(bookmark, paths);
  const last = steps.at(-1);
  return last !== undefined && bookmark.atTick >= 0 && bookmark.atTick <= last.tick;
}
