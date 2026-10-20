import { Badge, Disclosure, KeyFigure } from '@platform/ui';
import { t } from '@platform/i18n/messages';
import { HONEST_STATUS } from './records';
import { itemKey, reviewStatusReport } from './review-status';

/**
 * What is published, under what label, item by item.
 *
 * The governance page answers who has signed what. This answers the other half:
 * which maturity status each item carries, which is the label a reader sees beside
 * it in the interface. Two of the eight preview gates report rather than block,
 * and that trade is only defensible while the gap is visible, so every count here
 * is printed with the list behind it, and every status in the vocabulary gets a
 * row even when nothing is in it.
 */
export function ReviewStatusBody() {
  const report = reviewStatusReport();
  const populated = report.groups.filter((group) => group.count > 0);
  return (
    <>
      <Badge kind="out-of-range">{HONEST_STATUS.headline}</Badge>
      <p>{t('rs.intro', { total: report.total })}</p>

      {/* The two numbers this page exists to report, before the sections that qualify them. */}
      <div className="figures">
        <KeyFigure value={`${report.signedItems} / ${report.total}`} label={t('rs.signed')} tone="warning" />
        <KeyFigure value={report.boardSize} label={t('rs.board-size')} tone="warning" />
      </div>

      <h2>{t('rs.board-heading')}</h2>
      <p>
        {t(report.boardSize === 0 ? 'rs.board-empty' : 'rs.board-signed')}{' '}
        <a href="/governance">{t('rs.governance-link')}</a>
      </p>

      <h2>{t('rs.published-heading')}</h2>
      <p className="field__hint">{t('rs.published-hint')}</p>
      <ul>
        {report.groups.map((group) => (
          <li key={group.status} className="numeric">
            <code>{group.status}</code>{': '}{t('rs.group-row', { count: group.count, label: group.label })}
          </li>
        ))}
      </ul>

      <h2>{t('rs.every-heading')}</h2>
      <p className="field__hint">{t('rs.every-hint', { total: report.total })}</p>
      {populated.map((group) => (
        <Disclosure
          key={group.status}
          className="disclosure--group"
          summary={group.label}
          meta={t('rs.items', { count: group.count })}
        >
          {[...new Set(group.items.map((item) => item.kind))].map((kind) => {
            const matching = group.items.filter((item) => item.kind === kind);
            return (
              <Disclosure key={kind} summary={kind} meta={`${matching.length}`}>
                <ul>
                  {matching.map((item) => (
                    <li key={itemKey(item)}>
                      {/* Only a scenario has a briefing page; an explainer or drug card has no
                          /<module>/scenario/<id> document, and linking one pointed at a 404. */}
                      {item.route === null || item.kind !== 'scenario'
                        ? item.title
                        : (
                          <a href={`/${item.route}/scenario/${item.id}`}>{item.title}</a>
                        )}{' '}
                      <code>{item.id}</code> <span className="numeric">{`v${item.contentVersion}`}</span>
                    </li>
                  ))}
                </ul>
              </Disclosure>
            );
          })}
        </Disclosure>
      ))}

      <h2>{t('rs.not-tell-heading')}</h2>
      <p>
        {t('rs.not-tell')}{' '}
        <a href="/limitations">{t('rs.limitations-link')}</a>
      </p>
    </>
  );
}
