/**
 * `/<module>/scenario/<id>/facilitator`: the printable facilitator guide.
 *
 * Every line is generated from the scenario by `facilitatorGuide`; this file
 * only lays it out. Sections are never collapsed, because the guide is printed
 * and a closed disclosure prints as nothing.
 */
import { SiteBar } from '@platform/ui';
import { facilitatorGuide } from '@platform/facilitation/guide';
import { facilitatedScenarioFor } from '@platform/facilitation/scenario-catalog';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-educator';

export function FacilitatorGuideRoute({ path }: { path: string }) {
  const entry = facilitatedScenarioFor(path);
  if (entry === undefined) {
    return (
      <div className="document">
        <SiteBar />
        <main className="reading" id="main">
          <h1>{t('guide.missing.heading')}</h1>
          <p>{t('guide.missing.body')} <a href="/for-educators">{t('guide.missing.link')}</a></p>
        </main>
      </div>
    );
  }
  const briefing = `/${entry.moduleRoute}/scenario/${entry.scenario.metadata.id}`;
  return (
    <div className="document">
      <SiteBar />
      <main className="reading" id="main">
        <h1>{t('guide.heading', { title: entry.scenario.metadata.title })}</h1>
        <p>
          {t('guide.intro')}{' '}
          <a className="guide__screen-only" href={briefing}>{t('guide.open-briefing')}</a>
        </p>
        {facilitatorGuide(entry).map((section) => (
          <section key={section.id} className="guide__section document__group" aria-labelledby={`guide-${section.id}`}>
            <h2 id={`guide-${section.id}`}>{section.heading}</h2>
            {section.status === 'absent'
              ? <p className="guide__absent">{t('guide.not-available', { reason: section.reason })}</p>
              : (
                <ul>
                  {section.items.map((item, index) => (
                    <li key={`${section.id}-${index}`}>
                      {item.label !== undefined && <strong>{item.label}. </strong>}
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
          </section>
        ))}
        <p>{NOT_FOR_CLINICAL_USE}</p>
      </main>
      <footer className="document__foot">
        <a href={briefing}>{t('guide.back')}</a>
        <a href="/for-educators">{t('guide.educators')}</a>
      </footer>
    </div>
  );
}
