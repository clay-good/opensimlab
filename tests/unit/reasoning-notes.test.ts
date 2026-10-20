import { readFileSync } from 'node:fs';
import { describe, expect, it, beforeEach } from 'vitest';
import {
  REASONING_NOTE_LIMIT, actionAtNote, normalizeReasoningNote, useReasoningNotes,
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
