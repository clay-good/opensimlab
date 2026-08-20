/**
 * A reviewer's notes, held on their own device
 * (platform/clinical-governance → Review Is Capturable In Place).
 *
 * The project needs one thing more than it needs users: a clinician willing to
 * say which parts are wrong. Everything about this is shaped by removing
 * friction from that act — no account, no issue tracker, no leaving the page,
 * and no obligation at the end. Notes stay on the device until the reviewer
 * exports a file and decides to send it.
 *
 * A note is NOT a signature. Recording what is wrong and taking professional
 * responsibility for what is right are different things, and nothing here marks
 * content as reviewed. That still requires a named entry in the editorial board.
 */

export type NoteSeverity = 'unsafe' | 'wrong' | 'misleading' | 'unclear' | 'minor';

/** Ordered worst first, because that is the order a maintainer should act in. */
export const NOTE_SEVERITIES: readonly { id: NoteSeverity; label: string; hint: string }[] = [
  {
    id: 'unsafe',
    label: 'Could teach unsafe practice',
    hint: 'A learner could carry this to a real patient and cause harm.',
  },
  {
    id: 'wrong',
    label: 'Factually wrong',
    hint: 'The number, mechanism or claim is incorrect.',
  },
  {
    id: 'misleading',
    label: 'Misleading as written',
    hint: 'Defensible in isolation, but a learner would take the wrong lesson.',
  },
  {
    id: 'unclear',
    label: 'Unclear or incomplete',
    hint: 'Not wrong, but it does not say enough to be understood correctly.',
  },
  { id: 'minor', label: 'Minor or editorial', hint: 'Wording, emphasis, or a typo.' },
];

export interface ReviewNote {
  readonly id: string;
  /** The content item this is about: `drug-card:propofol`, `explainer:hysteresis…`. */
  readonly itemKey: string;
  readonly itemLabel: string;
  readonly severity: NoteSeverity;
  readonly whatIsWrong: string;
  readonly suggestedCorrection: string;
  /** Recorded so a maintainer knows which version the note was written against. */
  readonly contentVersion: string;
  readonly appVersion: string;
  /** Passed in rather than read from a clock, so the store stays testable. */
  readonly recordedOn: string;
}

const STORAGE_KEY = 'opensimlab.review-notes';

export function loadNotes(): ReviewNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Written by something outside this code path in principle, so it is checked.
    return parsed.filter((entry): entry is ReviewNote =>
      typeof entry === 'object' && entry !== null
      && typeof (entry as ReviewNote).itemKey === 'string'
      && typeof (entry as ReviewNote).whatIsWrong === 'string');
  } catch {
    return [];
  }
}

export function saveNotes(notes: readonly ReviewNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch { /* a device that refuses storage still shows the notes it has */ }
}

export function addNote(notes: readonly ReviewNote[], note: ReviewNote): ReviewNote[] {
  return [...notes.filter((entry) => entry.id !== note.id), note];
}

export function removeNote(notes: readonly ReviewNote[], id: string): ReviewNote[] {
  return notes.filter((entry) => entry.id !== id);
}

export function notesFor(notes: readonly ReviewNote[], itemKey: string): ReviewNote[] {
  return notes.filter((entry) => entry.itemKey === itemKey);
}

/**
 * The file a reviewer hands back.
 *
 * Markdown rather than JSON: the reviewer has to be able to read it before they
 * send it, and a maintainer has to be able to act on it without tooling. It
 * opens with what the file is and what it is not, because it may well arrive in
 * an inbox detached from any of the context it was written in.
 */
export function notesToMarkdown(
  notes: readonly ReviewNote[],
  meta: { reviewer: string; appVersion: string; generatedOn: string },
): string {
  const bySeverity = [...NOTE_SEVERITIES]
    .map((severity) => ({
      severity,
      entries: notes.filter((note) => note.severity === severity.id),
    }))
    .filter((group) => group.entries.length > 0);

  const lines: string[] = [
    '# Open Sim Lab — clinical review notes',
    '',
    `- **Reviewer:** ${meta.reviewer.trim() || 'not stated'}`,
    `- **Application version:** ${meta.appVersion}`,
    `- **Generated:** ${meta.generatedOn}`,
    `- **Notes:** ${notes.length}`,
    '',
    'These are notes on what appears to be wrong. **This file is not a sign-off.** Nothing in ',
    'it marks any content as clinically reviewed, and recording a note does not make the ',
    'reviewer responsible for anything they did not flag.',
    '',
  ];

  if (notes.length === 0) {
    lines.push('_No notes were recorded._', '');
    return lines.join('\n');
  }

  for (const group of bySeverity) {
    lines.push(`## ${group.severity.label} (${group.entries.length})`, '');
    for (const note of group.entries) {
      lines.push(`### ${note.itemLabel}`, '');
      lines.push(`- **Item:** \`${note.itemKey}\``);
      lines.push(`- **Content version:** ${note.contentVersion}`);
      lines.push('', '**What is wrong**', '', note.whatIsWrong.trim(), '');
      if (note.suggestedCorrection.trim()) {
        lines.push('**Suggested correction**', '', note.suggestedCorrection.trim(), '');
      }
      lines.push('---', '');
    }
  }
  return lines.join('\n');
}

/** Whether review mode is on, which is a URL choice rather than a stored one. */
export function reviewModeFrom(search: string): boolean {
  return new URLSearchParams(search).get('review') === '1';
}
