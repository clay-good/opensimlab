/**
 * framework-mapping-expansion → the "preparing for" blueprint filter
 * (platform/adoption → Learners Can Filter The Catalog By Examination Blueprint).
 *
 * The filter is a finding aid, and these tests hold it to being only that: the
 * identifiers it accepts are the recorded ones, every lesson it offers is a
 * lesson that exists, and an empty category stays visible rather than being
 * dropped. The wording it must never use is held by `mapping-surfaces.test.ts`,
 * which lints this surface beside the other four.
 */
import { describe, expect, it } from 'vitest';
import {
  BLUEPRINTS, BLUEPRINT_IDS, EMPTY_BLUEPRINT_QUERY, blueprintQueryString, blueprintSelection,
  getBlueprint, overdueBlueprints, readBlueprintQuery,
} from '@platform/curriculum/blueprints';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';
import { FRAMEWORK_READINGS } from '@platform/curriculum/readings';
import { ROUTES } from '@routes/routes';

const NBCRNA = 'nbcrna-nce';
const NCJMM = 'ncsbn-ncjmm';

describe('Requirement: Learners Can Filter The Catalog By Examination Blueprint', () => {
  it('offers the examination readings and no reading of something else', () => {
    expect([...BLUEPRINT_IDS].sort()).toEqual([NBCRNA, NCJMM]);
    // Accreditation standards and milestone sets describe a programme or a
    // trainee, never a paper a learner sits. They belong on /curriculum, and
    // naming them by their real ids is what makes this a guard rather than a
    // sentence: every reading this build ships is either a blueprint or here.
    const notBlueprints = FRAMEWORK_READINGS.map((reading) => reading.id)
      .filter((id) => !BLUEPRINT_IDS.includes(id));
    expect([...notBlueprints].sort()).toEqual([
      'acgme-anesthesiology-milestones-2', 'acgme-emergency-medicine', 'acgme-internal-medicine',
      'acgme-neonatal-perinatal', 'acgme-neurology', 'acgme-obstetrics-gynecology',
      'acgme-pediatrics', 'acgme-surgery', 'aamc-core-epas', 'coa-standards',
    ].sort());
  });

  it('keeps every blueprint a well-formed framework reading', () => {
    for (const blueprint of BLUEPRINTS) {
      expect(frameworkRecordProblems(blueprint.record), blueprint.record.id).toEqual([]);
      expect(blueprint.categories.length).toBe(blueprint.record.domains.length);
    }
  });

  it('Scenario: A student finds the labs that touch a blueprint category', () => {
    const categories = blueprintSelection({ blueprint: NCJMM, category: 'recognize-cues' });
    expect(categories).toHaveLength(1);
    const [category] = categories;
    expect(category!.label).toBe('Recognize cues');
    expect(category!.lessons.length).toBeGreaterThan(0);
    for (const lesson of category!.lessons) {
      expect(lesson.estimatedMinutes).toBeGreaterThan(0);
      expect(lesson.maturity).toBeTruthy();
      expect(lesson.via.length).toBeGreaterThan(0);
      // Selecting one opens its briefing, so the address has to be a real route.
      expect(ROUTES.some((route) => route.path === lesson.href), lesson.href).toBe(true);
    }
  });

  it('keeps a category nothing touches, with the reason when there is one', () => {
    const [evaluate] = blueprintSelection({ blueprint: NCJMM, category: 'evaluate-outcomes' });
    expect(evaluate!.lessons).toEqual([]);
    expect(evaluate!.emptyReason).toMatch(/ends at the decision/);
  });

  it('groups by category, every category of the blueprint', () => {
    const all = blueprintSelection({ blueprint: NBCRNA, category: 'all' });
    expect(all.map((category) => category.id))
      .toEqual(getBlueprint(NBCRNA)!.categories.map((category) => category.id));
    expect(all.some((category) => category.lessons.length > 0)).toBe(true);
  });

  it('names a lesson once per category it is mapped to, never twice in one', () => {
    for (const blueprint of BLUEPRINTS) {
      for (const category of blueprint.categories) {
        const ids = category.lessons.map((lesson) => lesson.scenarioId);
        expect(new Set(ids).size, `${blueprint.record.id}/${category.id}`).toBe(ids.length);
      }
    }
  });
});

describe('the URL carries public values only', () => {
  it('round-trips a selection', () => {
    const query = { blueprint: NCJMM, category: 'take-action' };
    expect(blueprintQueryString(query)).toBe('?preparing-for=ncsbn-ncjmm&category=take-action');
    expect(readBlueprintQuery(blueprintQueryString(query))).toEqual(query);
  });

  it('leaves defaults out, so a shared link stays short', () => {
    expect(blueprintQueryString(EMPTY_BLUEPRINT_QUERY)).toBe('');
    expect(blueprintQueryString({ blueprint: NBCRNA, category: 'all' })).toBe('?preparing-for=nbcrna-nce');
    // A category without a blueprint is not a selection anything can render.
    expect(blueprintQueryString({ blueprint: 'none', category: 'take-action' })).toBe('');
  });

  it('accepts only identifiers it recorded itself', () => {
    expect(readBlueprintQuery('?preparing-for=usmle-step-2')).toEqual(EMPTY_BLUEPRINT_QUERY);
    expect(readBlueprintQuery('?preparing-for=<script>')).toEqual(EMPTY_BLUEPRINT_QUERY);
    // A category of another blueprint is not a category of this one.
    expect(readBlueprintQuery('?preparing-for=nbcrna-nce&category=take-action'))
      .toEqual({ blueprint: NBCRNA, category: 'all' });
    expect(readBlueprintQuery('?preparing-for=nbcrna-nce&category=../../etc/passwd'))
      .toEqual({ blueprint: NBCRNA, category: 'all' });
  });

  it('puts nothing in the URL that is not an identifier of a record', () => {
    for (const blueprint of BLUEPRINTS) {
      for (const category of blueprint.categories) {
        const search = blueprintQueryString({ blueprint: blueprint.record.id, category: category.id });
        for (const [, value] of new URLSearchParams(search)) {
          expect(value).toMatch(/^[a-z0-9-]+$/);
        }
      }
    }
  });
});

describe('Scenario: The blueprint version is visible', () => {
  it('marks a reading past its re-check date, and only then', () => {
    expect(overdueBlueprints('2020-01-01')).toEqual([]);
    const overdue = overdueBlueprints('2099-01-01').map((record) => record.id);
    expect([...overdue].sort()).toEqual([...BLUEPRINT_IDS].sort());
  });

  it('records the body and version a learner needs to recognise the document', () => {
    for (const blueprint of BLUEPRINTS) {
      expect(blueprint.record.body.length).toBeGreaterThan(0);
      expect(blueprint.record.version).toMatch(/\d{4}|outline/i);
    }
  });
});
