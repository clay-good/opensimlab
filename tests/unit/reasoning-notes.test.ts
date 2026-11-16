import { readFileSync } from 'node:fs';
import { describe, expect, it, beforeEach } from 'vitest';
import {
  REASONING_NOTE_LIMIT, SESSION_WITH_NOTES_KIND, actionAtNote, normalizeReasoningNote,
  sessionWithNotes, useReasoningNotes,
} from '@platform/session/reasoning-notes';

describe('reasoning notes', () => {
  beforeEach(() => useReasoningNotes.getState().clear());

  it('keeps trimmed notes up to 280 characters, attached to their moment, in time order', () => {
    expect(useReasoningNotes.getState().add('  MAP falling, so fluid before pressor  ', 900)).toBe(true);
    expect(useReasoningNotes.getState().add('Checked the line first', 300)).toBe(true);
    expect(useReasoningNotes.getState().notes).toEqual([
      { tick: 300, text: 'Checked the line first' }, { tick: 900, text: 'MAP falling, so fluid before pressor' },
    ]);
  });

  it('refuses an empty note or one over the limit, and changes nothing', () => {
    expect(useReasoningNotes.getState().add('   ', 10)).toBe(false);
    expect(useReasoningNotes.getState().add('x'.repeat(REASONING_NOTE_LIMIT + 1), 10)).toBe(false);
    expect(normalizeReasoningNote('x'.repeat(REASONING_NOTE_LIMIT))).toHaveLength(REASONING_NOTE_LIMIT);
    expect(useReasoningNotes.getState().notes).toEqual([]);
  });

  it('pairs a note with the latest action at or before it', () => {
    const actions = [{ tick: 100, type: 'bolus' }, { tick: 500, type: 'fluid' }, { tick: 950, type: 'ventilator' }];
    expect(actionAtNote({ tick: 900, text: 'x' }, actions)?.type).toBe('fluid');
    expect(actionAtNote({ tick: 50, text: 'x' }, actions)).toBeUndefined();
  });

  it('cannot reach the transcript or a problem report', () => {
    const transcript = readFileSync('src/platform/transcript/transcript.ts', 'utf8');
    expect(transcript).not.toMatch(/reasoning-notes|reasoningNotes/);
    for (const path of ['src/platform/reporting/contracts.ts', 'src/platform/reporting/ScenarioProblemReport.tsx']) {
      expect(readFileSync(path, 'utf8')).not.toMatch(/reasoning-notes|reasoningNotes|useReasoningNotes/);
    }
    const route = readFileSync('src/routes/AnesthesiaRoute.tsx', 'utf8');
    const collector = route.slice(route.indexOf('function collectReportRecentContext'));
    expect(collector.slice(0, collector.indexOf('\n}\n'))).not.toMatch(/reasoning|useReasoningNotes/i);
  });
});

describe('attribution for a moment', () => {
  it('reads the first attributed sample at or after the moment, within a minute, and never borrows another', async () => {
    const { attributionAfter } = await import('@platform/session/session-store');
    const term = (label: string) => [{ variable: 'map', terms: [{ termId: label, label, contribution: -5, share: 1, teachingModel: false }] }];
    const history = [
      { tick: 0, state: {}, concentrations: [], attribution: term('baseline') },
      { tick: 100, state: {}, concentrations: [], attribution: [] },
      { tick: 200, state: {}, concentrations: [], attribution: term('propofol vasodilation') },
      { tick: 2000, state: {}, concentrations: [], attribution: term('much later') },
    ];
    expect(attributionAfter(history, 50)?.[0]?.terms[0]?.label).toBe('propofol vasodilation');
    expect(attributionAfter(history, 1000)).toBeNull();
  });
});

/**
 * deliberate-practice-loop → notes are excluded from the summary export and
 * included in the full export only after preview.
 */
describe('the one file notes may leave the device in', () => {
  const transcript = { scenarioId: 'routine-induction', hash: 'abc', actions: [] };
  const notes = [{ tick: 900, text: 'MAP falling, so fluid before pressor' }, { tick: 300, text: 'Checked the line' }];

  it('wraps the transcript rather than extending it, in time order', () => {
    const file = sessionWithNotes(transcript, notes);
    expect(file.kind).toBe(SESSION_WITH_NOTES_KIND);
    // The transcript inside is the same object the plain export writes, which is
    // what keeps that file replayable and this one additional.
    expect(file.transcript).toBe(transcript);
    expect(JSON.stringify(file.transcript)).toBe(JSON.stringify(transcript));
    expect(file.reasoningNotes.map((note) => note.tick)).toEqual([300, 900]);
  });

  it('adds nothing to the transcript itself', () => {
    const before = JSON.stringify(transcript);
    sessionWithNotes(transcript, notes);
    expect(JSON.stringify(transcript)).toBe(before);
    expect(Object.keys(transcript)).not.toContain('reasoningNotes');
  });

  /**
   * The debrief offers the control only when notes exist, and only behind a
   * preview that prints every word of every note. Nothing can tell whether a
   * learner typed a real name into one, so showing them the file before it
   * exists is the only honest control there is.
   */
  it('is written from the debrief only after a preview that shows every note', () => {
    const debrief = readFileSync('src/modules/anesthesia/ui/Debrief.tsx', 'utf8');
    expect(debrief).toMatch(/props\.reasoningNotes\?\.length \?\? 0\) > 0 && props\.onExportWithNotes/);
    expect(debrief).toContain("t('debrief.export-notes-warning')");
    // The confirm closes the preview and then writes; the cancel writes nothing.
    expect(debrief).toMatch(/setNotesPreviewOpen\(false\); props\.onExportWithNotes\?\.\(\)/);
    const route = readFileSync('src/routes/AnesthesiaRoute.tsx', 'utf8');
    expect(route).toMatch(/session-with-notes\.json/);
    // And the plain transcript export still writes a transcript and nothing else.
    const plain = route.slice(route.indexOf('const exportTranscript ='));
    expect(plain.slice(0, plain.indexOf('}, [session]);'))).not.toMatch(/reasoningNotes|sessionWithNotes/);
  });
});
