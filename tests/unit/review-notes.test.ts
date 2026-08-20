/**
 * Acceptance tests for platform/clinical-governance → Review Is Capturable In
 * Place.
 *
 * This is the path the project depends on more than any other: a clinician
 * telling the maintainer which parts are wrong. Everything here is about that
 * act being cheap to perform and unambiguous to receive.
 */
import { describe, expect, it } from 'vitest';
import {
  NOTE_SEVERITIES, addNote, notesFor, notesToMarkdown, removeNote, reviewModeFrom,
  type ReviewNote,
} from '@platform/governance/review-notes';

const note = (over: Partial<ReviewNote> = {}): ReviewNote => ({
  id: 'n1',
  itemKey: 'drug-card:propofol',
  itemLabel: 'Propofol drug card',
  severity: 'wrong',
  whatIsWrong: 'The maintenance range is for a healthy adult and does not say so.',
  suggestedCorrection: 'Say it assumes a healthy adult.',
  contentVersion: '0.1.0',
  appVersion: '0.1.0-alpha.1',
  recordedOn: '2026-08-20T00:00:00.000Z',
  ...over,
});

describe('Requirement: Review Is Capturable In Place', () => {
  it('Scenario: severities run worst first, because that is the order to act in', () => {
    expect(NOTE_SEVERITIES[0]!.id).toBe('unsafe');
    expect(NOTE_SEVERITIES.at(-1)!.id).toBe('minor');
    // Every severity explains itself, so a reviewer picks the right one without
    // having to guess what the project means by it.
    for (const entry of NOTE_SEVERITIES) expect(entry.hint.length).toBeGreaterThan(20);
  });

  it('Scenario: a second note on the same item replaces the first', () => {
    // A reviewer refining what they wrote should not produce two contradictory
    // notes for a maintainer to reconcile.
    const first = note();
    const revised = note({ whatIsWrong: 'Actually the onset time is the problem.' });
    const notes = addNote(addNote([], first), revised);
    expect(notes).toHaveLength(1);
    expect(notes[0]!.whatIsWrong).toContain('onset time');
  });

  it('Scenario: notes are retrievable per item and removable', () => {
    const notes = addNote(addNote([], note()), note({ id: 'n2', itemKey: 'explainer:hysteresis' }));
    expect(notesFor(notes, 'drug-card:propofol')).toHaveLength(1);
    expect(removeNote(notes, 'n1')).toHaveLength(1);
  });

  it('Scenario: the exported file is actionable and says what it is not', () => {
    const markdown = notesToMarkdown(
      [note({ severity: 'unsafe' }), note({ id: 'n2', itemKey: 'explainer:x', itemLabel: 'An explainer' })],
      { reviewer: 'A Reviewer, CRNA', appVersion: '0.1.0-alpha.1', generatedOn: '2026-08-20' },
    );
    // A maintainer can act on it: the item id, the version, and the problem.
    expect(markdown).toContain('`drug-card:propofol`');
    expect(markdown).toContain('Content version:** 0.1.0');
    expect(markdown).toContain('The maintenance range');
    expect(markdown).toContain('A Reviewer, CRNA');
    // Grouped worst first.
    expect(markdown.indexOf('Could teach unsafe practice'))
      .toBeLessThan(markdown.indexOf('Factually wrong'));
    // And a flag is explicitly NOT a signature. Recording what is wrong and
    // taking responsibility for what is right are different things.
    expect(markdown).toContain('not a sign-off');
    expect(markdown).toContain('not make the');
  });

  it('Scenario: an empty review still produces a readable file', () => {
    const markdown = notesToMarkdown([], {
      reviewer: '', appVersion: '0.1.0-alpha.1', generatedOn: '2026-08-20',
    });
    expect(markdown).toContain('No notes were recorded');
    expect(markdown).toContain('not stated');
  });

  it('Scenario: review mode is a URL choice, never a stored one', () => {
    // A learner should never be invited to argue with the content.
    expect(reviewModeFrom('?review=1')).toBe(true);
    expect(reviewModeFrom('?review=yes')).toBe(false);
    expect(reviewModeFrom('')).toBe(false);
  });
});
