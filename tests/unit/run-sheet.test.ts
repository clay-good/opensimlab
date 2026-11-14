/**
 * The run sheet, over the whole catalogue.
 *
 * The sheet is for a facilitator running the lesson away from this simulator,
 * so the properties that matter are the ones that stop it claiming more than
 * the lesson does: both statements travel with it, the maturity label and the
 * content version are on it, and the two forms carry the same fields so the
 * JSON is never the fuller one.
 */
import { describe, expect, it } from 'vitest';
import {
  buildRunSheet, runSheetJson, runSheetText,
  RUN_SHEET_AUTHORED_VITALS_NOTE, RUN_SHEET_EXPECTED_ACTIONS_NOTE,
  RUN_SHEET_MODELLED_VITALS_NOTE, type RunSheet,
} from '@platform/facilitation/run-sheet';
import { REFERENCE_PATHS } from '@platform/facilitation/reference-paths.generated';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { NOT_CLINICALLY_REVIEWED, NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';

const sheets: readonly RunSheet[] = FACILITATED_SCENARIOS.map((entry) => {
  const paths = REFERENCE_PATHS.find((candidate) => candidate.moduleId === entry.moduleRoute
    && candidate.scenarioId === entry.scenario.metadata.id);
  return buildRunSheet(entry.moduleRoute, entry.scenario, paths?.expert ?? [], paths?.expertVitals);
});

describe('the run sheet', () => {
  it('is produced for every scenario in the catalogue', () => {
    expect(sheets).toHaveLength(FACILITATED_SCENARIOS.length);
    for (const sheet of sheets) {
      expect(sheet.states.length, `${sheet.scenarioId} has no states`).toBeGreaterThan(0);
      expect(sheet.objectives.length, `${sheet.scenarioId} has no objectives`).toBeGreaterThan(0);
      expect(sheet.expectedActions.length, `${sheet.scenarioId} has no expected actions`)
        .toBeGreaterThan(0);
      expect(sheet.sources.length, `${sheet.scenarioId} has no sources`).toBeGreaterThan(0);
    }
  });

  it('carries both statements, the maturity label and the version on every sheet', () => {
    for (const sheet of sheets) {
      expect(sheet.notForClinicalUse).toBe(NOT_FOR_CLINICAL_USE);
      expect(sheet.notClinicallyReviewed).toBe(NOT_CLINICALLY_REVIEWED);
      expect(sheet.maturity.length).toBeGreaterThan(0);
      expect(sheet.contentVersion).toMatch(/^\d+\.\d+\.\d+$/);
      expect(sheet.licence.length).toBeGreaterThan(0);
    }
  });

  /**
   * Both notes exist so that a number is never mistaken for a prediction, and
   * an absent number is never mistaken for "this lesson has none".
   */
  it('says on every sheet what its numbers are, or why there are none', () => {
    const modelled = sheets.filter((sheet) => sheet.vitalsNote === RUN_SHEET_MODELLED_VITALS_NOTE);
    const authored = sheets.filter((sheet) => sheet.vitalsNote === RUN_SHEET_AUTHORED_VITALS_NOTE);
    expect(modelled.length + authored.length).toBe(sheets.length);
    // Exactly the closed-loop family carries sampled numbers.
    expect(modelled.every((sheet) => sheet.moduleId === 'anesthesia')).toBe(true);
    expect(modelled).toHaveLength(39);
    expect(RUN_SHEET_MODELLED_VITALS_NOTE).toContain('not a prediction about any patient');
    expect(RUN_SHEET_AUTHORED_VITALS_NOTE).toContain('authored text');
  });

  it('gives every closed-loop state its model\'s numbers, and no others any', () => {
    for (const sheet of sheets) {
      const withVitals = sheet.states.filter((state) => state.vitals !== undefined);
      if (sheet.vitalsNote === RUN_SHEET_AUTHORED_VITALS_NOTE) {
        expect(withVitals, sheet.scenarioId).toHaveLength(0);
        continue;
      }
      expect(withVitals.length, sheet.scenarioId).toBe(sheet.states.length);
      for (const state of withVitals) {
        expect(Object.keys(state.vitals!).length, `${sheet.scenarioId} ${state.id}`)
          .toBeGreaterThan(0);
        for (const value of Object.values(state.vitals!)) expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  it('writes the same fields in both forms', () => {
    const sheet = sheets[0]!;
    const json = JSON.parse(runSheetJson(sheet)) as RunSheet;
    expect(json).toEqual(sheet);
    const text = runSheetText(sheet);
    for (const value of [sheet.title, sheet.contentVersion, sheet.maturity, sheet.licence,
      sheet.vitalsNote, sheet.notForClinicalUse, sheet.notClinicallyReviewed]) {
      expect(text).toContain(value);
    }
    for (const objective of sheet.objectives) expect(text).toContain(objective);
    for (const state of sheet.states) expect(text).toContain(state.id);
    for (const source of sheet.sources) expect(text).toContain(source);
  });

  it('calls the expert transcript a reference and not a mark scheme', () => {
    expect(runSheetText(sheets[0]!)).toContain(RUN_SHEET_EXPECTED_ACTIONS_NOTE);
    expect(RUN_SHEET_EXPECTED_ACTIONS_NOTE).toContain('not a mark scheme');
  });

  /**
   * The sheet is for a human to adapt onto whatever they are running. Emitting
   * a mannequin vendor's format would imply this is a validated scenario for
   * that device, which nothing here has established.
   */
  it('produces no vendor format', () => {
    for (const sheet of sheets) {
      const text = runSheetText(sheet).toLowerCase();
      expect(/\b(laerdal|gaumard|cae ?healthcare|simman|meti\b)/.test(text), sheet.scenarioId)
        .toBe(false);
    }
  });

  /**
   * The guard is on the prose this module owns — its headings and its two
   * notes — and not on the lesson's own text or its sources. A lesson may
   * legitimately say "pain score", and a source may legitimately be the I-PASS
   * handoff curriculum; forbidding the bare words would fail on both and teach
   * the next author to reword a citation. What may never appear is a claim
   * about the learner.
   */
  it('claims nothing about the learner in the prose it owns', () => {
    const owned = [
      RUN_SHEET_MODELLED_VITALS_NOTE, RUN_SHEET_AUTHORED_VITALS_NOTE, RUN_SHEET_EXPECTED_ACTIONS_NOTE,
      ...runSheetText(sheets[0]!).split('\n').filter((line) => /^[A-Z][A-Z ]+$/.test(line.trim())),
    ].join(' ').toLowerCase();
    expect(owned).toContain('states');
    for (const claim of ['your score', 'you passed', 'passing score', 'exam readiness',
      'learner readiness', 'competency achieved', 'prepare you', 'proficient']) {
      expect(owned, `the run sheet's own prose claims "${claim}"`).not.toContain(claim);
    }
  });

  it('times every state and every action readably', () => {
    for (const sheet of sheets) {
      for (const state of sheet.states) {
        expect(state.at, `${sheet.scenarioId} ${state.id}`)
          .toMatch(/^(At start|Tick \d+|When .+|Unscheduled)$/);
      }
      for (const action of sheet.expectedActions) {
        expect(action.at, `${sheet.scenarioId} ${action.action}`).toMatch(/^(At start|Tick \d+)$/);
      }
    }
  });
});
