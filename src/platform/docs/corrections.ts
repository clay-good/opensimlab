/**
 * The corrections log, as data (platform/clinical-governance → confirmed errors
 * are recorded permanently and publicly).
 *
 * This project asks readers to accept an unsigned corpus on one condition: that
 * when they tell us something is wrong, the answer is visible and permanent. That
 * promise is worth exactly as much as the log is reachable, and the log lived only
 * in `CORRECTIONS.md` — a file in a repository, which is not where a learner is.
 *
 * So the entries are typed here and rendered at `/corrections`, and a test asserts
 * this list and the file agree on how many entries exist. Appending to one without
 * the other fails the build, which is the only way two copies of a permanent record
 * stay one record.
 */

export interface CorrectionEntry {
  /** ISO date the correction was released. */
  readonly released: string;
  readonly title: string;
  /** The content id and kind the correction applies to. */
  readonly item: string;
  readonly wasWrong: string;
  /** What a learner might have wrongly concluded. */
  readonly educationalImpact: string;
  /** A name, or `anonymous` where the reporter asked for that. */
  readonly reportedBy: string;
  readonly whatChanged: string;
  /** The build identifier that carried the fix. */
  readonly releasedIn: string;
}

/**
 * IT IS EMPTY, and the reason matters.
 *
 * An empty corrections log reads as "nothing has been wrong". That is not what
 * this one means. It means nobody qualified has looked yet: the editorial board is
 * empty, no clinical review has taken place, and a log can only record what
 * somebody found. Publishing the emptiness with its reason attached is the honest
 * version; publishing the count alone would be a boast we have not earned.
 */
export const CORRECTIONS: readonly CorrectionEntry[] = [];

export const CORRECTIONS_EMPTY_REASON =
  'No corrections have been recorded yet, because no clinical review has yet taken place. This '
  + 'log is not empty because the content is right; it is empty because nobody qualified has '
  + 'looked at it.';

/** What this log promises, which is what makes an unsigned corpus defensible. */
export const CORRECTIONS_POLICY: readonly string[] = [
  'Entries are appended. Nothing here is ever deleted or rewritten, including entries that are '
  + 'embarrassing.',
  'Each entry states what was wrong, the potential educational impact, who reported it, what '
  + 'changed, and which build carried the fix.',
  'An error that could teach an unsafe practice is triaged as urgent, and the affected content is '
  + 'disabled in the next build regardless of the release schedule.',
];
