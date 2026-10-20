/**
 * Rules every training-framework record follows, whichever module maps to it
 * (framework-mapping-expansion → registry).
 *
 * A framework reading goes stale: bodies revise outlines, milestones, and test
 * plans. Each record therefore carries the date the reading was recorded and a
 * re-check date no more than 24 months later, and a record past it is listed
 * on the governance page beside overdue clinical reviews.
 */

export interface FrameworkDomainRecord {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface FrameworkRecord {
  readonly id: string;
  readonly name: string;
  readonly shortLabel: string;
  readonly body: string;
  readonly version: string;
  readonly url: string;
  readonly appliesTo: string;
  /**
   * `verbatim` permits only the body's short names; anything longer is this
   * project's summary and must be marked `summarised`.
   */
  readonly fidelity: 'verbatim' | 'summarised';
  readonly note: string;
  /** ISO date this reading was recorded in the repository. */
  readonly recordedOn: string;
  /** ISO date by which the reading must be re-checked against the source; at most 24 months on. */
  readonly reviewBy: string;
  readonly domains: readonly FrameworkDomainRecord[];
}

export const FRAMEWORK_REVIEW_MONTHS = 24;
/** A verbatim label is a short name; a sentence is a transcription of the body's prose. */
export const VERBATIM_LABEL_MAX_CHARACTERS = 60;

/** The latest re-check date a reading recorded on this day may carry. */
export function latestReviewBy(recordedOn: string): string {
  const limit = new Date(`${recordedOn}T00:00:00Z`);
  limit.setUTCMonth(limit.getUTCMonth() + FRAMEWORK_REVIEW_MONTHS);
  return limit.toISOString().slice(0, 10);
}

/** What is wrong with a record, or nothing. */
export function frameworkRecordProblems(record: FrameworkRecord): string[] {
  const problems: string[] = [];
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(record.recordedOn)) problems.push('recordedOn is not an ISO date');
  if (!iso.test(record.reviewBy)) problems.push('reviewBy is not an ISO date');
  if (problems.length === 0) {
    if (record.reviewBy <= record.recordedOn) problems.push('reviewBy is not after recordedOn');
    if (record.reviewBy > latestReviewBy(record.recordedOn)) {
      problems.push(`reviewBy is more than ${FRAMEWORK_REVIEW_MONTHS} months after recordedOn`);
    }
  }
  if (record.fidelity === 'verbatim') {
    for (const domain of record.domains) {
      if (domain.label.length > VERBATIM_LABEL_MAX_CHARACTERS) {
        problems.push(`verbatim label "${domain.id}" is longer than a short name; mark the record summarised`);
      }
    }
  }
  return problems;
}

/** Records whose re-check date has passed, oldest first. */
export function overdueFrameworks<T extends FrameworkRecord>(records: readonly T[], today: string): T[] {
  return records.filter((record) => record.reviewBy < today)
    .sort((a, b) => a.reviewBy.localeCompare(b.reviewBy));
}
