/**
 * The concept explainer contract, shared by every module
 * (knowledge-layer → the minimum knowledge set).
 *
 * These types used to live inside the anesthesia module, which is why every
 * surface that reads an explainer — the cockpit's Learn tab, the governance
 * records, the review-status page, the reviewer's index — read anesthesia's ten
 * and nothing else, in every module. The contract lives here so a second module
 * can declare its own set without the platform importing that module.
 *
 * Nothing in this file names a drug, a module, or a specialty.
 */

import type { ContentMaturity } from '@platform/catalog/maturity';

export interface Diagram {
  /**
   * Which figure the explainer carries, as a name rather than an asset: the
   * caption is what is read today, and a module that needs a drawn figure adds
   * its kind here beside its renderer. No image file is fetched.
   */
  readonly kind:
    | 'hysteresis' | 'apnea-curve' | 'synergy-surface' | 'capnogram-phases'
    | 'perfusion-versus-pressure' | 'obstructive-filling' | 'membrane-stabilisation'
    | 'compensation-curve' | 'compression-fraction' | 'oxygen-delivery';
  readonly caption: string;
}

export interface ClinicalReview {
  readonly reviewer: string;
  readonly credential: string;
  readonly reviewedOn: string;
  readonly reviewBy: string;
  readonly contentVersion: string;
  readonly sources: readonly string[];
}

export interface Explainer {
  readonly id: string;
  readonly maturity: ContentMaturity;
  readonly title: string;
  /** Under 250 words. The word count is asserted in the tests. */
  readonly body: string;
  readonly diagram: Diagram;
  /** The scenario or sandbox state that demonstrates it live. */
  readonly showMe: {
    readonly scenarioId: string;
    readonly atTick?: number;
    /**
     * A sandbox state, as the URL query that opens it, showing the idea with
     * no case around it. A string rather than a typed state so a content
     * module, which the cockpit loads, does not pull in the sandbox; the test
     * that every "show me" resolves parses it.
     */
    readonly sandbox?: string;
  };
  /** The guideline or source this reflects, with its year. */
  readonly reflects: string;
  /**
   * Where this explanation simplifies, in the reader's own words.
   *
   * Every explainer is under 250 words about something that is not simple, so
   * each one leaves something out, and which thing it leaves out is the part a
   * learner is most likely to over-apply. The publication gate requires this
   * field for the same reason it requires scenario limitations: an explanation
   * that does not say where it stops reads as though it does not stop.
   */
  readonly simplifies: string;
  readonly review: ClinicalReview;
}

/**
 * The review record every explainer carries until a clinician signs it.
 *
 * Shared rather than copied per module so `isUnreviewed` has one shape to
 * detect and a module cannot invent a half-signed one.
 */
export const UNSIGNED_REVIEW: ClinicalReview = {
  reviewer: 'UNSIGNED',
  credential: 'UNSIGNED',
  reviewedOn: '1970-01-01',
  reviewBy: '1970-01-01',
  contentVersion: '0.1.0',
  sources: [],
};

/** Word count, so the under-250-word rule is checkable. */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** The explainer an id names within one module's set. */
export function findExplainer(
  explainers: readonly Explainer[],
  id: string,
): Explainer | undefined {
  return explainers.find((candidate) => candidate.id === id);
}
