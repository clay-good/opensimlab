/**
 * The honest status this build carries (platform/sustainability → the project
 * states its real status rather than implying more maturity than it has).
 *
 * It lives in its own module, importing nothing, because the landing page shows it
 * and the landing route must not pull in a pharmacology model or a scenario to do so.
 */

export const HONEST_STATUS = {
  stage: 'alpha' as const,
  headline: 'Alpha. Not clinically reviewed.',
  detail:
    'No clinician has signed any content in this build. The pharmacology parameters are '
    + 'transcribed from the primary literature but have not had the independent second-source '
    + 'check this project requires before a model may be called published. The face-validity '
    + 'review that this development change ends at has not been run. Use it to see how the '
    + 'simulator works, not to learn clinical facts from.',
  busFactor: 1,
  fundingDisclosure: 'Unfunded. No grant, institution, company, or vendor supports this project.',
} as const;
