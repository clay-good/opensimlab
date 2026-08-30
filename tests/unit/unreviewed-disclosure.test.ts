/**
 * Acceptance tests for platform/safety-and-scope → Exports carry the statement,
 * and platform/clinical-governance → nothing is presented as reviewed.
 *
 * Two statements, not one. The not-for-clinical-use statement bounds what the
 * simulator is for. The unreviewed statement discloses that nothing in it has been
 * checked by a clinician. An exported file travels away from the interface that
 * labels every item, so it has to carry both itself.
 */
import { describe, expect, it } from 'vitest';
import { EventLog } from '@platform/log/event-log';
import {
  NOT_CLINICALLY_REVIEWED, NOT_FOR_CLINICAL_USE, TranscriptRecorder,
} from '@platform/transcript/transcript';
import { notesToMarkdown } from '@platform/governance/review-notes';
import { importPracticeHistory, practiceHistoryExport } from '@anesthesia/catalog/practice-history';
import { concentrationCsv } from '@anesthesia/ui/ConcentrationPanel';

const VERSIONS = { engine: '1.0.0', content: '1.0.0', modelSet: '1.0.0', scenario: '1.0.0' };

/** A storage the import can write to without touching a real one. */
function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => { map.delete(key); },
    setItem: (key: string, value: string) => { map.set(key, value); },
  };
}

describe('Requirement: Every Export Discloses That Nothing Is Signed', () => {
  it('states it as a fact with the address of the per-item list', () => {
    expect(NOT_CLINICALLY_REVIEWED).toContain('No clinician has reviewed this content');
    expect(NOT_CLINICALLY_REVIEWED).toContain('the editorial board is empty');
    expect(NOT_CLINICALLY_REVIEWED).toContain('https://opensimlab.com/review-status');
    // The two statements say different things and neither substitutes for the other.
    expect(NOT_CLINICALLY_REVIEWED).not.toBe(NOT_FOR_CLINICAL_USE);
  });

  it('carries both statements in an exported transcript', () => {
    const transcript = new TranscriptRecorder({
      moduleId: 'anesthesia', scenarioId: 'routine-induction', versions: VERSIONS,
      practiceRegion: 'US', seed: 1, guidanceLevel: 'unassisted',
    }).build('hash');
    expect(transcript.notForClinicalUse).toBe(NOT_FOR_CLINICAL_USE);
    expect(transcript.notClinicallyReviewed).toBe(NOT_CLINICALLY_REVIEWED);
  });

  it('carries both statements in an exported event log, as text and as JSON', () => {
    const log = new EventLog();
    const header = { scenarioId: 'routine-induction', engineVersion: '1.0.0', modelSetRevision: '1.0.0' };
    expect(log.toText(header)).toContain(NOT_CLINICALLY_REVIEWED);
    expect(log.toText(header)).toContain(NOT_FOR_CLINICAL_USE);
    const json = JSON.parse(log.toJson(header)) as Record<string, string>;
    expect(json.notClinicallyReviewed).toBe(NOT_CLINICALLY_REVIEWED);
    expect(json.notForClinicalUse).toBe(NOT_FOR_CLINICAL_USE);
  });

  it('carries both statements in the concentration CSV and the notes file', () => {
    for (const text of [
      concentrationCsv([]),
      notesToMarkdown([], { reviewer: 'A Reviewer', appVersion: 'unreleased', generatedOn: '2026-08-30' }),
    ]) {
      expect(text).toContain(NOT_FOR_CLINICAL_USE);
      expect(text).toContain(NOT_CLINICALLY_REVIEWED);
    }
  });

  it('carries both statements in the exported practice history', () => {
    // JSON, so the statement is escaped in the text and has to be read as a value.
    const exported = JSON.parse(practiceHistoryExport([])) as Record<string, unknown>;
    expect(exported.notForClinicalUse).toBe(NOT_FOR_CLINICAL_USE);
    expect(exported.notClinicallyReviewed).toBe(NOT_CLINICALLY_REVIEWED);
    // And the file it produces is still one this build will import back.
    expect(exported.schemaVersion).toBe(1);
    expect(importPracticeHistory(practiceHistoryExport([]), fakeStorage())).toEqual([]);
  });
});
