/**
 * The clinical review gate (platform/clinical-governance → Every Clinical
 * Assertion Is Signed; platform/safety-and-scope → Clinical Content Review Is
 * Delegated To Governance).
 *
 * ONE review judge, implemented once. It determines whether an exact content
 * version may carry a clinical-review claim. Publication availability is a
 * separate maturity decision in `publication.ts`.
 */

export interface ReviewRecord {
  readonly reviewer: string;
  readonly credential: string;
  readonly institution?: string;
  readonly competingInterests?: string;
  readonly reviewedOn: string;
  readonly reviewBy: string;
  readonly contentVersion: string;
  readonly sources: readonly string[];
}

export interface ReviewableItem {
  readonly id: string;
  readonly kind: 'scenario' | 'protocol' | 'drug-card' | 'explainer' | 'debrief-template' | 'region-profile' | 'alarm-threshold';
  readonly contentVersion: string;
  readonly review: ReviewRecord;
  /** Domains the item covers, so board coverage can be checked. */
  readonly domains?: readonly string[];
}

/** A reviewer is a placeholder until a real clinician signs. */
export const UNSIGNED_MARKER = 'UNSIGNED';

/** Reviews expire 24 months after the last review. */
export const REVIEW_INTERVAL_MONTHS = 24;
/** Days past the review date before an item is marked pending re-review in the interface. */
export const OVERDUE_GRACE_DAYS = 30;

export type GateVerdict =
  | { readonly status: 'current' }
  | { readonly status: 'unsigned'; readonly reason: string }
  | { readonly status: 'version-drift'; readonly reason: string }
  | { readonly status: 'overdue'; readonly reason: string; readonly daysOverdue: number }
  | { readonly status: 'incomplete'; readonly reason: string };

/**
 * Judge one item. `today` is passed in rather than read from a clock, so the gate
 * is deterministic and testable.
 */
export function gate(item: ReviewableItem, today: Date): GateVerdict {
  const review = item.review;

  if (review.reviewer === UNSIGNED_MARKER || review.credential === UNSIGNED_MARKER) {
    return {
      status: 'unsigned',
      reason: `${item.kind} "${item.id}" has no named reviewer and cannot enter a reviewed-only channel.`,
    };
  }
  if (review.sources.length === 0) {
    return {
      status: 'incomplete',
      reason: `${item.kind} "${item.id}" names no sources consulted.`,
    };
  }
  // A content change invalidates its review record.
  if (review.contentVersion !== item.contentVersion) {
    return {
      status: 'version-drift',
      reason: `${item.kind} "${item.id}" is at version ${item.contentVersion} but its review covers `
        + `${review.contentVersion}. A change to the text or to any numeric value invalidates the `
        + 'review, so it needs re-review before carrying a reviewed claim.',
    };
  }
  const reviewBy = new Date(review.reviewBy);
  if (Number.isNaN(reviewBy.getTime())) {
    return { status: 'incomplete', reason: `${item.kind} "${item.id}" has an unparseable review-by date.` };
  }
  if (today > reviewBy) {
    const daysOverdue = Math.floor((today.getTime() - reviewBy.getTime()) / 86_400_000);
    return {
      status: 'overdue',
      reason: `${item.kind} "${item.id}" passed its review-by date of ${review.reviewBy}.`,
      daysOverdue,
    };
  }
  return { status: 'current' };
}

/** True when the interface must mark the item as pending re-review. */
export function needsPendingMarker(verdict: GateVerdict): boolean {
  return verdict.status === 'overdue';
}

export interface GateReport {
  readonly total: number;
  readonly current: number;
  /** Every item that is not current, BY NAME. No aggregate without the list. */
  readonly outstanding: readonly { item: ReviewableItem; verdict: GateVerdict }[];
  /** Percentage of clinical content under current review. */
  readonly percentCurrent: number;
}

export function reportCoverage(items: readonly ReviewableItem[], today: Date): GateReport {
  const outstanding: { item: ReviewableItem; verdict: GateVerdict }[] = [];
  let current = 0;
  for (const item of items) {
    const verdict = gate(item, today);
    if (verdict.status === 'current') current += 1;
    else outstanding.push({ item, verdict });
  }
  return {
    total: items.length,
    current,
    outstanding,
    percentCurrent: items.length === 0 ? 100 : (current / items.length) * 100,
  };
}

export interface BoardMember {
  readonly name: string;
  readonly credential: string;
  readonly institution: string;
  /** Domains this member is qualified to review. */
  readonly scope: readonly string[];
  readonly joined: string;
  readonly competingInterests: string;
}

/**
 * Board coverage: the build fails if a content domain has no qualified reviewer.
 * Returns the domains that are uncovered.
 */
export function uncoveredDomains(
  items: readonly ReviewableItem[],
  board: readonly BoardMember[],
): string[] {
  const covered = new Set(board.flatMap((member) => member.scope));
  const needed = new Set(items.flatMap((item) => item.domains ?? []));
  return [...needed].filter((domain) => !covered.has(domain));
}

/**
 * A reviewer with a relevant financial relationship must be co-signed by a second
 * reviewer without one.
 */
export function needsCoSignature(member: BoardMember): boolean {
  const declaration = member.competingInterests.trim().toLowerCase();
  return declaration.length > 0 && declaration !== 'none declared' && declaration !== 'none';
}

/**
 * True when a content item carries no clinical signature at all.
 *
 * Distinct from `needsPendingMarker`, which is about a review that has EXPIRED.
 * This one is about a review that never happened. During the unreviewed alpha
 * that is every item, and the interface marks each of them individually rather
 * than relying on one line on the front page to cover the whole build.
 */
export function isUnreviewed(review: { reviewer: string; reviewedOn: string }): boolean {
  return review.reviewer.trim() === ''
    || review.reviewer.toUpperCase() === 'UNSIGNED'
    || review.reviewedOn === '1970-01-01';
}

/**
 * What the interface says next to a clinical claim nobody has signed.
 *
 * Deliberately specific about what is and is not being claimed: the reader is
 * being asked to treat it as a draft, and told exactly how to report an error.
 */
export const UNREVIEWED_NOTICE =
  'No clinician has reviewed this. It was written from the published sources named here and '
  + 'proofread against them automatically, which catches wrong numbers and not wrong judgement. '
  + 'If something here is wrong, saying so is the most useful thing you can do with this build.';
