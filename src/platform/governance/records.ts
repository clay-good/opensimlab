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
import { SCENARIOS } from '@anesthesia/scenarios';
import { REGIONS } from '@anesthesia/region/profiles';
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
import type { MaturitySubjectInput } from '@platform/catalog/maturity';

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

  // Every scenario in the registry, so a new one cannot ship unjudged.
  for (const scenario of SCENARIOS) {
    items.push({
      id: scenario.metadata.id,
      kind: 'scenario',
      contentVersion: scenario.metadata.version,
      review: scenario.metadata.clinicalReview,
      domains: ['adult-general-anaesthesia'],
    });
  }

  for (const scenario of EMERGENCY_MEDICINE_SCENARIOS) {
    items.push({
      id: scenario.metadata.id,
      kind: 'scenario',
      contentVersion: scenario.metadata.version,
      review: scenario.metadata.clinicalReview,
      domains: ['emergency-medicine'],
    });
  }

  for (const scenario of CRITICAL_CARE_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['critical-care'] });
  }

  for (const scenario of CARDIOLOGY_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['cardiology'] });
  }

  for (const scenario of RESPIRATORY_MEDICINE_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['respiratory-medicine'] });
  }

  for (const scenario of PEDIATRICS_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['pediatrics'] });
  }

  for (const scenario of NEUROLOGY_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['neurology'] });
  }

  for (const scenario of TOXICOLOGY_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['toxicology'] });
  }

  for (const scenario of OBSTETRICS_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['obstetrics'] });
  }

  for (const scenario of NEONATOLOGY_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['neonatology'] });
  }

  for (const scenario of ENDOCRINE_METABOLIC_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['endocrine-metabolic'] });
  }

  for (const scenario of RENAL_ELECTROLYTE_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['renal-electrolyte'] });
  }

  for (const scenario of INFECTIOUS_DISEASE_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['infectious-disease'] });
  }
  for (const scenario of MEDICAL_SURGICAL_NURSING_SCENARIOS) {
    items.push({ id: scenario.metadata.id, kind: 'scenario',
      contentVersion: scenario.metadata.version, review: scenario.metadata.clinicalReview,
      domains: ['medical-surgical-nursing'] });
  }

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

/** Non-scenario content included in the same exact-version maturity catalog. */
export function additionalMaturitySubjects(): MaturitySubjectInput[] {
  return [
    ...EXPLAINERS.map((explainer): MaturitySubjectInput => ({
      subjectKind: 'explanation', subjectId: explainer.id,
      contentVersion: explainer.review.contentVersion, status: explainer.maturity,
      evidence: [`src/modules/anesthesia/content/explainers.ts#${explainer.id}`],
    })),
    ...DRUG_CARDS.map((card): MaturitySubjectInput => ({
      subjectKind: 'drug-card', subjectId: card.drugId,
      contentVersion: card.review.contentVersion, status: card.maturity,
      evidence: [
        `src/modules/anesthesia/content/drug-cards.ts#${card.drugId}`,
        `/catalog/evidence-sources.json#${card.dosing.sourceId}`,
      ],
    })),
    ...REGIONS.map((region): MaturitySubjectInput => ({
      subjectKind: 'practice-region', subjectId: region.id,
      contentVersion: region.version, status: region.maturity,
      evidence: [`src/modules/anesthesia/region/profiles.ts#${region.id}`],
    })),
  ];
}

/**
 * Re-exported so existing consumers keep one import path. The value itself lives
 * in `status.ts`, which imports nothing, so the landing route can show it without
 * pulling a pharmacology model in behind it.
 */
export { HONEST_STATUS } from './status';
