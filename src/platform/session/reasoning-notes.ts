/**
 * Reasoning notes (deliberate-practice-loop → Reasoning Notes Are Captured In
 * The Moment And Never Scored).
 *
 * A learner may write down why, at the moment they act or pause. Notes live in
 * their own store beside the session, never in the transcript, so the
 * transcript and its hash are unchanged and nothing that replays, reports, or
 * tutors can reach them. They are never scored, parsed, or sent anywhere.
 */
import { create } from 'zustand';

export const REASONING_NOTE_LIMIT = 280;

export interface ReasoningNote {
  readonly tick: number;
  readonly text: string;
}

/** Trimmed text within the limit, or null for nothing worth keeping. */
export function normalizeReasoningNote(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > REASONING_NOTE_LIMIT) return null;
  return trimmed;
}

interface ReasoningNotesState {
  readonly notes: readonly ReasoningNote[];
  /** Attach a note to this simulated moment; false when the text is empty or too long. */
  readonly add: (text: string, tick: number) => boolean;
  readonly clear: () => void;
}

export const useReasoningNotes = create<ReasoningNotesState>((set) => ({
  notes: [],
  add(text, tick) {
    const note = normalizeReasoningNote(text);
    if (note === null) return false;
    set((state) => ({ notes: [...state.notes, { tick, text: note }].sort((a, b) => a.tick - b.tick) }));
    return true;
  },
  clear() { set({ notes: [] }); },
}));

/** The action the note was written beside: the latest at or before its moment. */
export function actionAtNote<A extends { readonly tick: number }>(note: ReasoningNote, actions: readonly A[]): A | undefined {
  return [...actions].filter((action) => action.tick <= note.tick).sort((a, b) => b.tick - a.tick)[0];
}

/**
 * The one file a learner's notes may leave the device in, and its shape.
 *
 * Notes are not in the transcript and cannot be: the transcript's hash is what
 * makes a session replayable, and `tests/unit/reasoning-notes.test.ts` holds
 * that nothing a learner wrote reaches it, the reporting package, or the report
 * context. So the export that carries them WRAPS the transcript rather than
 * extending it. The transcript object inside is the same object the plain
 * export writes, byte for byte, which is what keeps that file the one an
 * instructor opens and this one additional.
 *
 * It is written only after the learner has read, in a preview, every word that
 * would be in it. Notes are free text they wrote in the moment, and a learner
 * may have typed a real name into one; nothing here can detect that, so the
 * only honest control is showing them the file before it exists.
 */
export const SESSION_WITH_NOTES_KIND = 'opensimlab.session-with-reasoning-notes.v1';

export interface SessionWithNotes<T> {
  readonly kind: typeof SESSION_WITH_NOTES_KIND;
  /** Exactly the transcript the plain export writes, unchanged. */
  readonly transcript: T;
  readonly reasoningNotes: readonly ReasoningNote[];
}

export function sessionWithNotes<T>(
  transcript: T, notes: readonly ReasoningNote[],
): SessionWithNotes<T> {
  return {
    kind: SESSION_WITH_NOTES_KIND,
    transcript,
    reasoningNotes: [...notes].sort((a, b) => a.tick - b.tick),
  };
}
