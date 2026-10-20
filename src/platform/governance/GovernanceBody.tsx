import { Badge, Disclosure, KeyFigure } from '@platform/ui';
import { t, type MessageKey } from '@platform/i18n/messages';
import { EDITORIAL_BOARD, HONEST_STATUS, reviewableItems } from './records';
import { reportCoverage } from './review-gate';
import { APP_VERSION } from './status';
import { FRAMEWORKS } from '@anesthesia/curriculum/frameworks';
import { FRAMEWORK_REVIEW_MONTHS, overdueFrameworks } from '@platform/curriculum/framework-records';

/**
 * What each gate verdict means, said once for the whole group rather than
 * repeated after every item id.
 */
const VERDICT_SUMMARY: Readonly<Record<string, MessageKey>> = {
  unsigned: 'gov.verdict-unsigned',
  'version-drift': 'gov.verdict-version-drift',
  overdue: 'gov.verdict-overdue',
  incomplete: 'gov.verdict-incomplete',
  current: 'gov.verdict-current',
};

/**
 * The governance dashboard: who signs, what is under review, and how an error
 * is reported. The board, the coverage, and the framework readings are typed
 * records; the page's own words come from the catalog.
 */
export function GovernanceBody() {
  const items = reviewableItems();
  const coverage = reportCoverage(items, new Date('2026-08-19T00:00:00Z'));
  return (
    <>
      <Badge kind="out-of-range">{HONEST_STATUS.headline}</Badge>
      <p>{HONEST_STATUS.detail}</p>

      <h2>{t('gov.board-heading')}</h2>
      {EDITORIAL_BOARD.length === 0 ? (
        <p>{t('gov.board-empty')}</p>
      ) : (
        <ul>
          {EDITORIAL_BOARD.map((member) => (
            <li key={member.name}>
              <strong>{member.name}</strong>{t('gov.member', {
                credential: member.credential,
                institution: member.institution,
                scope: member.scope.join(', '),
                joined: member.joined,
                interests: member.competingInterests,
              })}
            </li>
          ))}
        </ul>
      )}

      <p>
        {t('gov.signatures-before')} <a href="/review-status">{t('gov.signatures-link')}</a>{t('gov.signatures-after')}
      </p>

      <h2>{t('gov.coverage-heading')}</h2>
      <div className="figures">
        <KeyFigure
          value={`${coverage.percentCurrent.toFixed(0)}%`}
          label={t('gov.coverage-current', { total: coverage.total })}
          tone={coverage.percentCurrent > 0 ? 'neutral' : 'warning'}
        />
        <KeyFigure
          value={coverage.outstanding.length}
          label={t('gov.coverage-outstanding')}
          tone="warning"
        />
      </div>
      <p className="field__hint">{t('gov.coverage-hint')}</p>
      {/* Grouped by VERDICT, then by kind.
          Every one of these items is outstanding for the same reason, and the
          reason string carries the item's own id inside it, so grouping on the
          sentence grouped nothing, and printing it once per item, fourteen
          times, buried the only thing the list is for: which items they are. */}
      {[...new Set(coverage.outstanding.map((entry) => entry.verdict.status))].map((status) => {
        const matching = coverage.outstanding.filter((entry) => entry.verdict.status === status);
        const kinds = [...new Set(matching.map((entry) => entry.item.kind))];
        const summary = VERDICT_SUMMARY[status];
        return (
          <Disclosure
            key={status}
            className="disclosure--group"
            summary={summary ? t(summary) : status}
            meta={t('gov.items', { count: matching.length })}
          >
            <dl className="document__items">
              {kinds.map((kind) => (
                <div key={kind}>
                  <dt><code>{kind}</code></dt>
                  <dd>
                    {matching
                      .filter((entry) => entry.item.kind === kind)
                      .map((entry) => entry.item.id)
                      .join(', ')}
                  </dd>
                </div>
              ))}
            </dl>
          </Disclosure>
        );
      })}

      <FrameworkReadings />

      <h2>{t('gov.language-heading')}</h2>
      <p>
        {t('gov.language-before')}{' '}
        <a href="/translation-status">{t('gov.language-link')}</a>{t('gov.language-after')}
      </p>

      <h2>{t('gov.report-heading')}</h2>
      <p>{t('gov.report')}</p>
      <p>
        <a href="https://github.com/clay-good/opensimlab/issues/new" rel="noreferrer noopener">
          {t('gov.report-link')}
        </a>
      </p>
    </>
  );
}

/**
 * Framework readings go stale the way clinical reviews do, so they are listed
 * here beside them. Dated by the build, which the prerendered page and the
 * client share, so the list cannot change between the two.
 */
function FrameworkReadings() {
  const today = /^\d{4}-\d{2}-\d{2}/.exec(APP_VERSION)?.[0] ?? new Date().toISOString().slice(0, 10);
  const overdue = new Set(overdueFrameworks(FRAMEWORKS, today).map((framework) => framework.id));
  return (
    <>
      <h2>{t('gov.fw-heading')}</h2>
      <p>
        {t('gov.fw-intro', { months: FRAMEWORK_REVIEW_MONTHS })}{' '}
        <span className="numeric">{overdue.size}</span> {t('gov.fw-overdue', { total: FRAMEWORKS.length })}
      </p>
      <ul>
        {FRAMEWORKS.map((framework) => (
          <li key={framework.id}>
            {t(overdue.has(framework.id) ? 'gov.fw-item-overdue' : 'gov.fw-item', {
              name: framework.name,
              body: framework.body,
              recorded: framework.recordedOn,
              reviewBy: framework.reviewBy,
            })}
          </li>
        ))}
      </ul>
    </>
  );
}
