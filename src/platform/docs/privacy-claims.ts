/**
 * The privacy statement's claims, each mapped to the test that enforces it
 * (platform/privacy → The statement matches the code).
 *
 * A release checklist item requires this mapping to be current. The architecture
 * tests read this list, so a claim without a test fails the build.
 */

export interface PrivacyClaim {
  readonly claim: string;
  /** The test that enforces it, by file and name. */
  readonly test: string;
}

export const PRIVACY_CLAIMS: readonly PrivacyClaim[] = [
  {
    claim: 'The production bundle contains no analytics, error-reporting, advertising or tracking code.',
    test: 'tests/arch/boundaries.test.ts → no third-party or telemetry dependency exists',
  },
  {
    claim: 'No script, font, style or image references a foreign origin.',
    test: 'tests/arch/boundaries.test.ts → Scenario: A third-party request fails the build',
  },
  {
    claim: 'There is no sign-in, sign-up, password or federated identity control anywhere.',
    test: 'tests/arch/boundaries.test.ts → Scenario: No credential surface exists',
  },
  {
    claim: 'An exported transcript contains no identifiers and no real-world clock time.',
    test: 'tests/unit/transcript.test.ts → Scenario: An exported transcript contains no identifiers',
  },
  {
    claim: 'No code path accepts identifiable information about a real person.',
    test: 'tests/arch/boundaries.test.ts → Scenario: Patient setup is scenario-authored only',
  },
  {
    claim: 'The simulation kernel is forward only and exposes no dose-solving entry point.',
    test: 'tests/arch/boundaries.test.ts → Scenario: The kernel module exposes no inverse entry point',
  },
  {
    claim: 'No outbound link carries a campaign, referral or identifier parameter.',
    test: 'tests/arch/boundaries.test.ts → Scenario: No tracking parameter is ever added to an outbound link',
  },
  {
    claim: 'The application depends on no external pharmacology dataset.',
    test: 'tests/arch/dependencies.test.ts → Scenario: The dependency graph is clean',
  },
];
