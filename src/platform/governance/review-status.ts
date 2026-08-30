/**
 * The published review status of every content item
 * (platform/clinical-governance → the project states its real status rather than
 * implying more maturity than it has).
 *
 * This is the surface that makes publishing an unsigned corpus defensible. The
 * release decision in `openspec/changes/release-evergreen-preview/` turns on the
 * gap being VISIBLE: two of the eight preview gates report rather than block, and
 * the argument for that is only good while a reader can see, by name, exactly what
 * is published and under what label.
 *
 * `/governance` answers a different question — who has signed what, which is
 * nobody. This answers what maturity status each item actually carries, which is
 * the label the interface shows beside it. The two disagreeing would be its own
 * small lie, so both are derived from the content rather than written down.
 */

import type { ContentMaturity } from '../catalog/maturity';
import { MATURITY_STATUSES } from '../catalog/maturity';
import { MATURITY_LABELS } from './publication';
import { EDITORIAL_BOARD } from './records';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { DRUG_CARDS } from '@anesthesia/content/drug-cards';
import { REGIONS } from '@anesthesia/region/profiles';
import { SCENARIOS } from '@anesthesia/scenarios';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../../modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../../modules/cardiology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../../modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../../modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../../modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../../modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../../modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../../modules/neonatology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../modules/renal-electrolyte/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../../modules/infectious-disease/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../modules/medical-surgical-nursing/scenarios';
import { ONCOLOGY_SCENARIOS } from '../../modules/oncology/scenarios';

export interface ReviewStatusItem {
  readonly kind: 'scenario' | 'explainer' | 'drug-card' | 'region-profile';
  /**
   * The content id, which is scoped to its module rather than globally unique:
   * emergency medicine and critical care both teach a `status-epilepticus`
   * lesson, and they are different scenarios at different routes. Anything
   * keying these items — a React list, a lookup, a test — must key on the route
   * as well, which is what `itemKey` is for.
   */
  readonly id: string;
  readonly title: string;
  /** The module route an item belongs to, or `null` for content shared across modules. */
  readonly route: string | null;
  readonly contentVersion: string;
  readonly status: ContentMaturity;
}

export interface ReviewStatusGroup {
  readonly status: ContentMaturity;
  readonly label: string;
  readonly count: number;
  readonly items: readonly ReviewStatusItem[];
}

export interface ReviewStatusReport {
  readonly total: number;
  /** Every status in the vocabulary, including the ones nothing is in. */
  readonly groups: readonly ReviewStatusGroup[];
  readonly boardSize: number;
  readonly signedItems: number;
}

const MODULE_SCENARIOS: readonly (readonly [string, readonly {
  metadata: { id: string; title: string; version: string; maturity: ContentMaturity };
}[]])[] = [
  ['anesthesia', SCENARIOS],
  ['emergency-medicine', EMERGENCY_MEDICINE_SCENARIOS],
  ['critical-care', CRITICAL_CARE_SCENARIOS],
  ['cardiology', CARDIOLOGY_SCENARIOS],
  ['respiratory-medicine', RESPIRATORY_MEDICINE_SCENARIOS],
  ['pediatrics', PEDIATRICS_SCENARIOS],
  ['neurology', NEUROLOGY_SCENARIOS],
  ['toxicology', TOXICOLOGY_SCENARIOS],
  ['obstetrics', OBSTETRICS_SCENARIOS],
  ['neonatology', NEONATOLOGY_SCENARIOS],
  ['endocrine-metabolic', ENDOCRINE_METABOLIC_SCENARIOS],
  ['renal-electrolyte', RENAL_ELECTROLYTE_SCENARIOS],
  ['infectious-disease', INFECTIOUS_DISEASE_SCENARIOS],
  ['medical-surgical-nursing', MEDICAL_SURGICAL_NURSING_SCENARIOS],
  ['oncology', ONCOLOGY_SCENARIOS],
];

/** The identity of one item across modules, since ids alone are not unique. */
export function itemKey(item: ReviewStatusItem): string {
  return `${item.kind}:${item.route ?? 'shared'}:${item.id}`;
}

/** Every published item with the maturity status the interface labels it with. */
export function reviewStatusItems(): ReviewStatusItem[] {
  const items: ReviewStatusItem[] = [];
  for (const [route, scenarios] of MODULE_SCENARIOS) {
    for (const scenario of scenarios) {
      items.push({
        kind: 'scenario', id: scenario.metadata.id, title: scenario.metadata.title,
        route, contentVersion: scenario.metadata.version, status: scenario.metadata.maturity,
      });
    }
  }
  for (const explainer of EXPLAINERS) {
    items.push({
      kind: 'explainer', id: explainer.id, title: explainer.title, route: 'anesthesia',
      contentVersion: explainer.review.contentVersion, status: explainer.maturity,
    });
  }
  for (const card of DRUG_CARDS) {
    items.push({
      kind: 'drug-card', id: card.drugId, title: card.name, route: 'anesthesia',
      contentVersion: card.review.contentVersion, status: card.maturity,
    });
  }
  for (const region of REGIONS) {
    items.push({
      kind: 'region-profile', id: region.id, title: region.name, route: null,
      contentVersion: region.version, status: region.maturity,
    });
  }
  return items;
}

/**
 * The counts and the lists behind them.
 *
 * Every status in the vocabulary gets a group, including the empty ones, because
 * an absent `clinically_reviewed` row reads as an oversight while a row saying
 * zero reads as the fact it is.
 */
export function reviewStatusReport(): ReviewStatusReport {
  const items = reviewStatusItems();
  const groups = MATURITY_STATUSES.map((status): ReviewStatusGroup => {
    const matching = items.filter((item) => item.status === status);
    return { status, label: MATURITY_LABELS[status], count: matching.length, items: matching };
  });
  const signed = new Set<ContentMaturity>(['clinically_reviewed', 'institution_endorsed']);
  return {
    total: items.length,
    groups,
    boardSize: EDITORIAL_BOARD.length,
    signedItems: items.filter((item) => signed.has(item.status)).length,
  };
}

/**
 * Why the release should stop, if the honesty surface is not doing its job.
 *
 * Kept here as a pure function rather than inline in the gate script so it can be
 * tested against a missing route and a short list, which is the only way to know a
 * gate blocks anything. Returns an empty array when the surface is intact.
 */
export function honestySurfaceBlockers(
  routes: readonly { readonly path: string; readonly indexable: boolean }[],
  report: ReviewStatusReport,
  maturityRecordCount: number,
): string[] {
  const blockers: string[] = [];
  const route = routes.find((candidate) => candidate.path === '/review-status');
  if (!route) {
    blockers.push('the review-status route is missing: the published corpus has no honesty surface');
  } else if (!route.indexable) {
    blockers.push('the review-status route is not indexable: an honesty surface nobody can find');
  }
  if (report.total !== maturityRecordCount) {
    blockers.push(
      `the review-status page lists ${report.total} items but the build has ${maturityRecordCount} `
      + 'maturity records: the surface does not cover the corpus',
    );
  }
  return blockers;
}
