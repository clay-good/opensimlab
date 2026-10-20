import type { Scenario } from '@anesthesia/scenarios/types';
import type { ObjectiveFinding } from '@anesthesia/debrief/analysis';
import { NCSBN_NCJMM, ncjmmCoverage, type NcjmmCoverageStatus } from '../../medical-surgical-nursing/curriculum';
import { t, type MessageKey } from '@platform/i18n/messages';

const WORDS: Readonly<Record<NcjmmCoverageStatus, MessageKey>> = {
  evidenced: 'ncjmm.evidenced', exercised: 'ncjmm.exercised', 'not-exercised': 'ncjmm.not-exercised',
};

/** The nursing debrief's view of this run against the NCSBN clinical judgment steps. No composite. */
export function NcjmmCoverageList({ scenario, findings }: {
  readonly scenario: Scenario;
  readonly findings: readonly ObjectiveFinding[];
}) {
  return (
    <section aria-labelledby="ncjmm-heading">
      <h3 id="ncjmm-heading">{t('ncjmm.heading')}</h3>
      <ul>
        {ncjmmCoverage(scenario, findings).map((entry) => (
          <li key={entry.step}>
            <strong>{entry.label}</strong>: {t(WORDS[entry.status])}.{entry.note && <> {entry.note}</>}
          </li>
        ))}
      </ul>
      <p className="reading__aside">
        {t('ncjmm.source-lead')}{' '}
        <a href={NCSBN_NCJMM.url} rel="noreferrer noopener">{t('ncjmm.source-link')}</a>. {t('ncjmm.disclaimer')}
      </p>
    </section>
  );
}
