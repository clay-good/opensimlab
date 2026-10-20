import { t } from '@platform/i18n/messages';
import {
  CORRECTIONS, CORRECTIONS_EMPTY_REASON, CORRECTIONS_POLICY, CORRECTIONS_TRIAGE,
} from './corrections';

/**
 * The permanent record of what was wrong.
 *
 * The whole argument for publishing an unsigned corpus is that a reader who finds
 * an error can tell us and see what happened. That argument is only as good as
 * this page being reachable from the product rather than living in a file in a
 * repository, which is not where a learner is. Its policy, triage, and entries
 * are typed data held against GOVERNANCE.md and CORRECTIONS.md; the page's own
 * words come from the catalog.
 */
export function CorrectionsBody() {
  return (
    <>
      <p>{t('corrections.intro')}</p>
      <ul>
        {CORRECTIONS_POLICY.map((rule) => <li key={rule}>{rule}</li>)}
      </ul>

      <h2>{t('corrections.entries')}</h2>
      <p className="numeric">{t('corrections.count', { count: CORRECTIONS.length })}</p>
      {CORRECTIONS.length === 0 ? (
        <p>
          {CORRECTIONS_EMPTY_REASON} <a href="/review-status">{t('corrections.see-review-status')}</a>{' '}
          <a href="/governance">{t('corrections.see-governance')}</a>
        </p>
      ) : (
        CORRECTIONS.map((entry) => (
          <section key={`${entry.released}:${entry.title}`} className="document__group">
            <h3>{`${entry.released}: ${entry.title}`}</h3>
            <dl className="document__items">
              <div><dt>{t('corrections.item')}</dt><dd><code>{entry.item}</code></dd></div>
              <div><dt>{t('corrections.was-wrong')}</dt><dd>{entry.wasWrong}</dd></div>
              <div><dt>{t('corrections.impact')}</dt><dd>{entry.educationalImpact}</dd></div>
              <div><dt>{t('corrections.reported-by')}</dt><dd>{entry.reportedBy}</dd></div>
              <div><dt>{t('corrections.what-changed')}</dt><dd>{entry.whatChanged}</dd></div>
              <div><dt>{t('corrections.released-in')}</dt><dd><code>{entry.releasedIn}</code></dd></div>
            </dl>
          </section>
        ))
      )}

      <h2>{t('corrections.how-heading')}</h2>
      <p>{t('corrections.how')}</p>
      <p>
        {t('corrections.unavailable')}{' '}
        <a href="/content-review">{t('corrections.content-review')}</a>
      </p>

      <h2>{t('corrections.next-heading')}</h2>
      <dl className="document__items">
        {CORRECTIONS_TRIAGE.map((step) => (
          <div key={step.stage}>
            <dt>{step.stage}</dt>
            <dd>{step.commitment}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
