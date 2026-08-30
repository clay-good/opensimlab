/**
 * The honest status this build carries (platform/sustainability → the project
 * states its real status rather than implying more maturity than it has).
 *
 * It lives in its own module, importing nothing, because the landing page shows it
 * and the landing route must not pull in a pharmacology model or a scenario to do so.
 */

/**
 * The identifier this build reports — a reviewer's notes, an exported transcript,
 * a bug report. It is a build date and the commit it was built from, injected by
 * `vite.config.ts`, and deliberately not a staged version number.
 *
 * It used to be a staged prerelease number, which claimed a maturity ladder this
 * project does not have: no first stage on the way to a second on the way to a
 * reviewed 1.0.
 * There is one evergreen corpus that is corrected continuously, and the only
 * question a reader ever needs answered is which build they are looking at. A date
 * and a commit answer exactly that and promise nothing else.
 *
 * A source checkout run through `vite dev` or `vitest` has no injected value and
 * reports `unreleased`, which is the truth about a build nobody published.
 */
declare const __RELEASE_ID__: string;

export const APP_VERSION: string = typeof __RELEASE_ID__ === 'string' ? __RELEASE_ID__ : 'unreleased';

export const HONEST_STATUS = {
  // The same words as `MATURITY_LABELS.preview` in `./publication.ts`, which is
  // the source of truth for the label; a test asserts the two stay identical.
  // They are duplicated rather than imported so that the landing route keeps
  // pulling in nothing but this module.
  headline: 'Educational use only — not clinically reviewed.',
  detail:
    'No clinician has signed any content in this build. The pharmacology parameters are '
    + 'transcribed from the primary literature but have not had the independent second-source '
    + 'check this project requires before a model may be called published. The face-validity '
    + 'review has not been run. Use it to see how the simulator works, not to learn clinical '
    + 'facts from.',
  busFactor: 1,
  fundingDisclosure: 'Unfunded. No grant, institution, company, or vendor supports this project.',
} as const;
