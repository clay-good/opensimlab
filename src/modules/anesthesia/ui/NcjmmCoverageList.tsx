import type { Scenario } from '@anesthesia/scenarios/types';
import type { ObjectiveFinding } from '@anesthesia/debrief/analysis';
import { NCSBN_NCJMM, ncjmmCoverage, type NcjmmCoverageStatus } from '../../medical-surgical-nursing/curriculum';

const WORDS: Readonly<Record<NcjmmCoverageStatus, string>> = {
  evidenced: 'Evidenced', exercised: 'Exercised, not yet evidenced', 'not-exercised': 'Not exercised',
};

/** The nursing debrief's view of this run against the NCSBN clinical judgment steps. No composite. */
export function NcjmmCoverageList({ scenario, findings }: {
  readonly scenario: Scenario;
  readonly findings: readonly ObjectiveFinding[];
}) {
  return (
    <section aria-labelledby="ncjmm-heading">
      <h3 id="ncjmm-heading">Clinical judgment steps in this run</h3>
      <ul>
        {ncjmmCoverage(scenario, findings).map((entry) => (
          <li key={entry.step}>
            <strong>{entry.label}</strong>: {WORDS[entry.status]}.{entry.note && <> {entry.note}</>}
          </li>
        ))}
      </ul>
      <p className="reading__aside">
        Step names from the NCSBN Clinical Judgment Measurement Model as listed in the{' '}
        <a href={NCSBN_NCJMM.url} rel="noreferrer noopener">2026 NCLEX-RN Test Plan</a>. Which
        objective counts toward which step is this project&apos;s reading, which NCSBN has not
        reviewed or endorsed. There is no total across the steps, and nothing here predicts how
        anyone would do on an examination.
      </p>
    </section>
  );
}
