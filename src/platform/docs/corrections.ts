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

/** The window a usable report is acknowledged in. Stated as a number so it is testable. */
export const ACKNOWLEDGEMENT_WORKING_DAYS = 5;

export interface TriageStep {
  readonly stage: string;
  readonly commitment: string;
}

/**
 * What happens to a report after you send it.
 *
 * The commitment and the path existed in `GOVERNANCE.md`, which is a file in a
 * repository — the same gap the corrections log had. Someone deciding whether it
 * is worth their time to tell us we are wrong is deciding it in the product, so
 * the answer belongs there.
 *
 * The second step is the one that keeps this honest. A report is DETECTION, not
 * review: no item's status changes on report volume, only after somebody
 * reproduces the problem and checks an authoritative source. Saying so means a
 * flood of reports cannot be mistaken for a signature, and one report from a
 * clinician who is right is not diluted by nine who are not.
 */
export const CORRECTIONS_TRIAGE: readonly TriageStep[] = [
  {
    stage: 'Acknowledged',
    commitment: `A usable report is acknowledged within ${ACKNOWLEDGEMENT_WORKING_DAYS} working `
      + 'days. Where public intake is unavailable — including on a static-only fork — the control '
      + 'says so rather than silently sending anywhere.',
  },
  {
    stage: 'Reproduced and source-checked',
    commitment: 'A report is detection, not review. No item\'s status changes on report volume, '
      + 'only after the problem is reproduced and checked against an authoritative source.',
  },
  {
    stage: 'Urgent, if it could teach unsafe practice',
    commitment: 'The affected content is disabled in the next build regardless of the release '
      + 'schedule, and this log records the timeline.',
  },
  {
    stage: 'Recorded',
    commitment: 'The correction is appended here permanently, with what was wrong, what a learner '
      + 'might have concluded, what changed, and which build carried the fix.',
  },
];
