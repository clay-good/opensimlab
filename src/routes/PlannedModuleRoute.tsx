/**
 * A planned module's route (platform/delivery → An unbuilt module route is honest).
 *
 * States that the module is planned, describes what it will cover, and links to
 * the module that exists. It is prerendered and indexable, and promises no date.
 */

import { SiteBar } from '@platform/ui';
import { moduleProse } from '@platform/modules/module-prose';
import { RELEASE_FEED_URL, type ModuleDeclaration } from '@platform/modules/registry';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-documents';

export function PlannedModuleRoute({ module }: { module: ModuleDeclaration }) {
  return (
    <>
      <SiteBar />
    <main className="reading" id="main">
      <h1>{t('planned.heading', { module: module.displayName })}</h1>
      <p>{t('planned.intro')}</p>

      <h2>{t('planned.cover')}</h2>
      <p>{moduleProse(module.id).plannedScope}</p>

      <h2>{t('planned.audience')}</h2>
      <p>{moduleProse(module.id).audience}</p>
      <p className="field__hint">{t('planned.prerequisites', { prerequisites: moduleProse(module.id).prerequisites })}</p>

      <h2>{t('planned.when')}</h2>
      <p>
        {t('planned.no-date')}{' '}
        <a href={RELEASE_FEED_URL} rel="noreferrer noopener">
          {t('planned.watch')}
        </a>
        {t('about.no-email')}
      </p>

      <h2>{t('planned.today-heading')}</h2>
      <p>{t('planned.today')}</p>
      <a className="button button--primary" href="/anesthesia">
        {t('planned.open')}
      </a>
      <p><a href="/">{t('planned.back')}</a></p>
    </main>
    </>
  );
}
