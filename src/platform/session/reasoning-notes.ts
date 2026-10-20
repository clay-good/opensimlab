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
