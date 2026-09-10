/**
 * The catalogue is 256 because a change document says it should be, not because it happens to be.
 *
 * This test exists because the opposite went unnoticed. The catalogue was described as complete
 * at 250 labs with "every module at its full planned count", and it was not: renal and
 * electrolyte had stopped at slice 6 of the 12 its production wave declares, and the registry's
 * `scenarioCount` had been brought down to 6 so the counts would audit. Every other guard in
 * this suite passed, because every other guard checks the registry against the scenario array --
 * and both had been moved together.
 *
 * So this one checks the registry against something that cannot be edited to make a test pass:
 * the per-module totals `openspec/changes/build-multidomain-practice-catalog` ratifies. Lowering
 * a declared count to match what has been written fails here, and says so.
 */
import { describe, expect, it } from 'vitest';
import { availableModules } from '@platform/modules/registry';

/**
 * The production waves in `build-multidomain-practice-catalog/tasks.md`, module by module.
 * Wave A anesthesia; B emergency and critical care; C cardiology and respiratory; D pediatrics,
 * obstetrics and neonatal; E neurology, endocrine and renal; F infectious disease and
 * toxicology; G oncology, surgery and trauma, and nursing. Section 0 ratifies the total.
 */
const RATIFIED: Readonly<Record<string, number>> = {
  anesthesia: 39,
  'emergency-medicine': 25,
  'critical-care': 24,
  cardiology: 17,
  'respiratory-medicine': 15,
  pediatrics: 16,
  obstetrics: 15,
  neonatology: 11,
  neurology: 15,
  'endocrine-metabolic': 12,
  'renal-electrolyte': 12,
  'infectious-disease': 10,
  toxicology: 15,
  oncology: 11,
  'surgery-trauma': 10,
  'medical-surgical-nursing': 9,
};
const RATIFIED_TOTAL = 256;

describe('Requirement: every module ships the count its production wave ratified', () => {
  it('declares the ratified total, and nothing else', () => {
    expect(Object.values(RATIFIED).reduce((sum, count) => sum + count, 0)).toBe(RATIFIED_TOTAL);
  });

  it('registers every ratified module and no unratified one', () => {
    expect(availableModules().map((module) => module.id).sort())
      .toEqual(Object.keys(RATIFIED).sort());
  });

  it('matches every module’s declared count to its wave', () => {
    const short = availableModules()
      .filter((module) => module.scenarioCount !== RATIFIED[module.id])
      .map((module) => `${module.id}: declares ${module.scenarioCount}, wave ratified ${RATIFIED[module.id]}`);
    expect(short, 'a declared count that disagrees with its production wave — if the labs are '
      + 'genuinely unwritten, the count is not the thing to change').toEqual([]);
  });

  it('adds up to the ratified catalogue size', () => {
    const total = availableModules().reduce((sum, module) => sum + (module.scenarioCount ?? 0), 0);
    expect(total).toBe(RATIFIED_TOTAL);
  });
});
