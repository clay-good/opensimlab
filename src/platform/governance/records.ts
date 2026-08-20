/**
 * The governance records that the build gate, the governance dashboard, and the
 * structured data all read from.
 *
 * They live in the repository in machine-readable form so an institution can
 * audit the project without contacting anyone.
 */

import type { BoardMember, ReviewableItem } from './review-gate';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { DRUG_CARDS } from '@anesthesia/content/drug-cards';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { REGIONS } from '@anesthesia/region/profiles';

/**
 * The editorial board.
 *
 * IT IS EMPTY. Recruiting three credentialed clinician reviewers is task 13.1 of
 * `mvp-anesthesia-alpha`, started in parallel with the build rather than at the
 * review, and it has not completed. Until it does, every piece of clinical content
 * in this build is unsigned, the release gate refuses to publish, and no scenario
 * is described anywhere as reviewed.
 *
 * This is the honest state, published rather than hidden.
 */
export const EDITORIAL_BOARD: readonly BoardMember[] = [];

/** Every clinical content item the gate judges. */
export function reviewableItems(): ReviewableItem[] {
  const items: ReviewableItem[] = [];

  items.push({
    id: ROUTINE_INDUCTION.metadata.id,
    kind: 'scenario',
    contentVersion: ROUTINE_INDUCTION.metadata.version,
    review: ROUTINE_INDUCTION.metadata.clinicalReview,
    domains: ['adult-general-anaesthesia'],
  });

  for (const explainer of EXPLAINERS) {
    items.push({
      id: explainer.id,
      kind: 'explainer',
      contentVersion: explainer.review.contentVersion,
      review: explainer.review,
      domains: ['adult-general-anaesthesia'],
    });
  }

  for (const card of DRUG_CARDS) {
    items.push({
      id: card.drugId,
      kind: 'drug-card',
      contentVersion: card.review.contentVersion,
      review: card.review,
      domains: ['pharmacology'],
    });
  }

  for (const region of REGIONS) {
    items.push({
      id: region.id,
      kind: 'region-profile',
      contentVersion: region.version,
      review: {
        reviewer: region.clinicalReview.reviewer,
        credential: region.clinicalReview.credential,
        reviewedOn: region.clinicalReview.reviewedOn,
        reviewBy: region.clinicalReview.reviewBy,
        contentVersion: region.version,
        sources: [],
      },
      domains: ['practice-variation'],
    });
  }

  return items;
}

/**
 * Re-exported so existing consumers keep one import path. The value itself lives
 * in `status.ts`, which imports nothing, so the landing route can show it without
 * pulling a pharmacology model in behind it.
 */
export { HONEST_STATUS } from './status';
