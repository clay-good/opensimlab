/**
 * The "preparing for" blueprint filter
 * (platform/adoption → Learners Can Filter The Catalog By Examination Blueprint).
 *
 * A learner preparing for a named examination wants one question answered:
 * which lessons here touch the categories that examination is built from. This
 * module answers it from the framework readings already recorded, and nothing
 * else: it ranks nothing, totals nothing, and predicts nothing about an
 * examination. A category no lesson touches is listed as empty rather than
 * dropped, for the same reason the curriculum coverage table keeps its gaps.
 *
 * Only readings of an EXAMINATION blueprint belong here. Accreditation
 * standards and milestone sets describe a programme or a trainee, not a paper a
 * learner sits, and offering them under "preparing for" would misdescribe both.
 * The curriculum view carries those.
 */

import type { ContentMaturity } from '@platform/catalog/maturity';
import type { FrameworkRecord } from './framework-records';
import { overdueFrameworks } from './framework-records';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { NBCRNA_NCE } from '@anesthesia/curriculum/frameworks';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import {
  NCSBN_NCJMM, NCJMM_NOT_EXERCISED_REASON, NCLEX_CLIENT_NEEDS_MAPPINGS,
  NCLEX_CLIENT_NEEDS_UNCOVERED, ncjmmMappings, type NcjmmStep,
} from '../../modules/medical-surgical-nursing/curriculum';
import { NCSBN_NCLEX_CLIENT_NEEDS } from './nclex-client-needs';
import { USMLE_CONTENT_OUTLINE } from './usmle-content-outline';
import { SCENARIO_SYSTEMS } from './usmle-systems';

/** One lesson under one blueprint category. */
export interface BlueprintLesson {
  readonly scenarioId: string;
  /** The module this lesson lives in: a blueprint may span several. */
  readonly moduleRoute: string;
  readonly title: string;
  readonly estimatedMinutes: number;
  readonly maturity: ContentMaturity;
  /** The exact content version, which the maturity marker links its record by. */
  readonly version: string;
  /** The lesson's briefing, which is where selecting it leads. */
  readonly href: string;
  /** The objectives the mapping rests on, so a reader can open the lesson and check. */
  readonly via: readonly string[];
}

export interface BlueprintCategory {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly lessons: readonly BlueprintLesson[];
  /**
   * Why a category has no lesson, where the reason is structural rather than
   * unfinished authoring. Empty when the honest answer is "nothing yet".
   */
  readonly emptyReason: string;
}

export interface Blueprint {
  readonly record: FrameworkRecord;
  /**
   * The module whose lessons this reading covers, where it covers one. The
   * USMLE systems blueprint spans fifteen, so its lessons carry their own.
   */
  readonly moduleRoute?: string;
  readonly categories: readonly BlueprintCategory[];
}

function lessonsFor(moduleRoute: string): Map<string, BlueprintLesson> {
  const lessons = new Map<string, BlueprintLesson>();
  for (const entry of FACILITATED_SCENARIOS) {
    if (entry.moduleRoute !== moduleRoute) continue;
    const { metadata } = entry.scenario;
    lessons.set(metadata.id, {
      scenarioId: metadata.id,
      title: metadata.title,
      estimatedMinutes: metadata.estimatedMinutes,
      maturity: metadata.maturity,
      version: metadata.version,
      href: `/${moduleRoute}/scenario/${metadata.id}`,
      moduleRoute,
      via: [],
    });
  }
  return lessons;
}

/** The anaesthesia lessons under the certifying examination's content areas. */
function nbcrnaBlueprint(): Blueprint {
  const lessons = lessonsFor('anesthesia');
  return {
    record: NBCRNA_NCE,
    moduleRoute: 'anesthesia',
    categories: NBCRNA_NCE.domains.map((domain) => ({
      id: domain.id,
      label: domain.label,
      description: domain.description,
      emptyReason: '',
      lessons: SCENARIO_MAPPINGS
        .filter((mapping) => mapping.frameworkId === NBCRNA_NCE.id && mapping.domainId === domain.id)
        .flatMap((mapping) => {
          const lesson = lessons.get(mapping.scenarioId);
          return lesson ? [{ ...lesson, via: mapping.objectiveIds }] : [];
        }),
    })),
  };
}

/**
 * The nursing lessons under the clinical judgment model's six steps. The
 * mapping is the verb convention the nursing module states, so this surface and
 * the nursing debrief cannot read differently from each other.
 */
function ncjmmBlueprint(): Blueprint {
  const lessons = lessonsFor('medical-surgical-nursing');
  const scenarios = FACILITATED_SCENARIOS
    .filter((entry) => entry.moduleRoute === 'medical-surgical-nursing')
    .map((entry) => entry.scenario);
  const mappings = ncjmmMappings(scenarios);
  return {
    record: NCSBN_NCJMM,
    moduleRoute: 'medical-surgical-nursing',
    categories: NCSBN_NCJMM.domains.map((domain) => {
      const step = domain.id as NcjmmStep;
      const byScenario = new Map<string, string[]>();
      for (const mapping of mappings) {
        if (!mapping.steps.includes(step)) continue;
        const via = byScenario.get(mapping.scenarioId) ?? [];
        via.push(mapping.objectiveId);
        byScenario.set(mapping.scenarioId, via);
      }
      return {
        id: domain.id,
        label: domain.label,
        description: domain.description,
        emptyReason: byScenario.size === 0 ? NCJMM_NOT_EXERCISED_REASON[step] ?? '' : '',
        lessons: [...byScenario].flatMap(([scenarioId, via]) => {
          const lesson = lessons.get(scenarioId);
          return lesson ? [{ ...lesson, via }] : [];
        }),
      };
    }),
  };
}

/**
 * The nursing lessons under the Client Needs categories every NCLEX-RN item is
 * assigned to. This is the blueprint the capability names by example - a
 * learner selecting Physiological Adaptation - and unlike the clinical
 * judgment one its categories are authored per lesson rather than derived.
 */
function clientNeedsBlueprint(): Blueprint {
  const lessons = lessonsFor('medical-surgical-nursing');
  return {
    record: NCSBN_NCLEX_CLIENT_NEEDS,
    moduleRoute: 'medical-surgical-nursing',
    categories: NCSBN_NCLEX_CLIENT_NEEDS.domains.map((domain) => ({
      id: domain.id,
      label: domain.label,
      description: domain.description,
      emptyReason: NCLEX_CLIENT_NEEDS_UNCOVERED[domain.id] ?? '',
      lessons: NCLEX_CLIENT_NEEDS_MAPPINGS
        .filter((mapping) => mapping.domainId === domain.id)
        .flatMap((mapping) => {
          const lesson = lessons.get(mapping.scenarioId);
          return lesson ? [{ ...lesson, via: mapping.objectiveIds }] : [];
        }),
    })),
  };
}

/**
 * Every lesson in the fifteen physician-facing modules under the system it
 * belongs to. The only blueprint here that spans modules, because the
 * examination it belongs to does.
 */
function usmleSystemsBlueprint(): Blueprint {
  const lessons = new Map<string, BlueprintLesson>();
  for (const route of new Set(SCENARIO_SYSTEMS.map((entry) => entry.moduleRoute))) {
    for (const [id, lesson] of lessonsFor(route)) lessons.set(`${route}/${id}`, lesson);
  }
  return {
    record: USMLE_CONTENT_OUTLINE,
    categories: USMLE_CONTENT_OUTLINE.domains.map((domain) => ({
      id: domain.id,
      label: domain.label,
      description: domain.description,
      emptyReason: USMLE_SYSTEM_UNCOVERED[domain.id] ?? '',
      lessons: SCENARIO_SYSTEMS
        .filter((entry) => entry.systemId === domain.id)
        .flatMap((entry) => {
          const lesson = lessons.get(`${entry.moduleRoute}/${entry.scenarioId}`);
          // A system claim is about the whole lesson, so it cites no objective.
          return lesson ? [{ ...lesson, via: [] }] : [];
        }),
    })),
  };
}

/** Sections of the outline this catalogue has no lesson for, and why. */
export const USMLE_SYSTEM_UNCOVERED: Readonly<Record<string, string>> = {
  'female-and-transgender-reproductive-system-and-breast': 'This catalogue has no gynaecology or breast lesson; its pregnancy lessons sit under Pregnancy, Childbirth, & the Puerperium.',
  'male-and-transgender-reproductive-system': 'This catalogue has no lesson in this system at all.',
};

/**
 * Every examination blueprint a learner can select, built once. A new reading of
 * an examination outline joins by being added here; nothing else changes.
 */
export const BLUEPRINTS: readonly Blueprint[] = [
  nbcrnaBlueprint(), ncjmmBlueprint(), clientNeedsBlueprint(), usmleSystemsBlueprint(),
];

export const BLUEPRINT_IDS: readonly string[] = BLUEPRINTS.map((blueprint) => blueprint.record.id);

export function getBlueprint(id: string): Blueprint | undefined {
  return BLUEPRINTS.find((blueprint) => blueprint.record.id === id);
}

/** Readings whose re-check date has passed, which the surface marks as due. */
export function overdueBlueprints(today: string): readonly FrameworkRecord[] {
  return overdueFrameworks(BLUEPRINTS.map((blueprint) => blueprint.record), today);
}

export interface BlueprintQuery {
  /** The selected blueprint, or `none` before a learner has chosen one. */
  readonly blueprint: string;
  /** A single category, or `all` for every category of the blueprint. */
  readonly category: string;
}

export const EMPTY_BLUEPRINT_QUERY: BlueprintQuery = { blueprint: 'none', category: 'all' };

/**
 * Read only known, bounded values from an untrusted URL, the way the catalog
 * query does: an identifier that names no recorded blueprint or none of its
 * categories falls back to the default rather than reaching a surface.
 */
export function readBlueprintQuery(search: string): BlueprintQuery {
  const params = new URLSearchParams(search);
  const blueprint = BLUEPRINT_IDS.find((id) => id === params.get('preparing-for'));
  if (blueprint === undefined) return EMPTY_BLUEPRINT_QUERY;
  const categories = getBlueprint(blueprint)!.categories;
  const category = categories.find((entry) => entry.id === params.get('category'))?.id ?? 'all';
  return { blueprint, category };
}

/** Keep shared links short: defaults never appear in the URL. */
export function blueprintQueryString(query: BlueprintQuery): string {
  const params = new URLSearchParams();
  if (query.blueprint !== 'none') params.set('preparing-for', query.blueprint);
  if (query.blueprint !== 'none' && query.category !== 'all') params.set('category', query.category);
  const value = params.toString();
  return value ? `?${value}` : '';
}

/**
 * The categories a query selects, grouped as the surface shows them. An empty
 * category is kept, because a learner needs to see that nothing here touches it.
 */
export function blueprintSelection(query: BlueprintQuery): readonly BlueprintCategory[] {
  const blueprint = query.blueprint === 'none' ? undefined : getBlueprint(query.blueprint);
  if (!blueprint) return [];
  if (query.category === 'all') return blueprint.categories;
  return blueprint.categories.filter((category) => category.id === query.category);
}
