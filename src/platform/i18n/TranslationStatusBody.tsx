import { KeyFigure } from '@platform/ui';
import { MODULES } from '@platform/modules/registry';
import { coverage, pseudoLocale, type SourceMessage } from '@platform/i18n/catalog';
import { LOCALE_CATALOGS, t } from '@platform/i18n/messages';
import { EN_MESSAGES } from '@platform/i18n/all-messages';

/**
 * Which language a reader is reading, stated. Counts come from the catalogs
 * themselves, so this page cannot claim a translation that does not exist.
 */
export function TranslationStatusBody() {
  const interfaceKeys = Object.values(EN_MESSAGES as Readonly<Record<string, SourceMessage>>)
    .filter((message) => message.class !== 'clinical').length;
  const reports = LOCALE_CATALOGS.map((catalog) => ({ catalog, report: coverage(EN_MESSAGES, catalog) }));
  const offered = reports.filter(({ report }) => report.offerable);
  const pseudo = coverage(EN_MESSAGES, pseudoLocale(EN_MESSAGES, 'en-XA'));
  return (
    <>
      <div className="figures">
        <KeyFigure value={offered.length} label={t('translation.offered')} tone="warning" />
        <KeyFigure value={interfaceKeys} label={t('translation.strings')} />
      </div>
      <p>{t('translation.intro')}</p>
      <h2>{t('translation.languages')}</h2>
      {reports.length === 0 ? (
        <p>{t('translation.none')}</p>
      ) : (
        <ul>
          {reports.map(({ catalog, report }) => (
            <li key={catalog.locale}>
              <code>{catalog.locale}</code>{': '}
              {t('translation.row', {
                translated: report.translated, total: report.total,
                stale: report.stale.length > 0 ? t('translation.row-stale', { count: report.stale.length }) : '',
                offered: t(report.offerable ? 'translation.row-offered' : 'translation.row-not-offered'),
                translators: catalog.translators.join(', '),
              })}
            </li>
          ))}
        </ul>
      )}
      <p className="field__hint">{t('translation.pseudo', { total: pseudo.total })}</p>
      <h2>{t('translation.clinical-heading')}</h2>
      <p>{t('translation.clinical', { modules: MODULES.filter((module) => module.status === 'available').length })}</p>
      <p>{t('translation.clinical-by-module')}</p>
      <ul>
        {MODULES.filter((module) => module.status === 'available').map((module) => (
          <li key={module.id}>
            <strong>{module.displayName}</strong>
            {' — '}
            {t('translation.clinical-module-state')}
          </li>
        ))}
      </ul>
    </>
  );
}
