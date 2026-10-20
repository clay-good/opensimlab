/**
 * The About page (platform/landing → Substantive Content Lives On The Root Domain).
 *
 * The front door is one screen, so the descriptive weight lives here: what the
 * simulator teaches, who it is for, what is in the anesthesia module, where the
 * pharmacology comes from and how it is reviewed, what the project deliberately
 * does not do, and how to use it in a course.
 *
 * This is still the root domain, which is the point. `/anesthesia` never has to
 * carry marketing copy, and a stranger or a crawler still finds real writing.
 */

import './landing.css';
import { Disclosure } from '@platform/ui';
import { MODULES, RELEASE_FEED_URL } from '@platform/modules/registry';
import { MODULE_PROPOSALS } from '@platform/modules/proposals';
import { moduleProse } from '@platform/modules/module-prose';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { HONEST_STATUS } from '@platform/governance/status';
import {
  CONTENT_SECTIONS, FOOTER_LINKS, QUESTIONS, SUGGESTED_CITATION, THREE_FACTS,
} from './content';
import { t } from '@platform/i18n/messages';

export function About() {
  return (
    <div className="landing">
      <a className="skip-link" href="#main">{t('sitebar.skip')}</a>
      <main className="landing__content reading" id="main">
        <p className="landing__breadcrumb"><a href="/">{t('landing.name')}</a></p>
        <h1>{t('about.heading')}</h1>

        <ul className="landing__facts-full">
          {THREE_FACTS.map((fact) => (
            <li key={fact.text}>
              {fact.text}{' '}
              <a href={fact.href}>{fact.linkLabel}</a>
            </li>
          ))}
        </ul>

        {CONTENT_SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`${section.id}-heading`}>
            <h2 id={`${section.id}-heading`}>{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            {section.list && <ul>{section.list.map((item) => <li key={item}>{item}</li>)}</ul>}
            {section.link && <p><a href={section.link.href}>{section.link.label}</a></p>}
          </section>
        ))}

        {/* The module directory in full: the front door carries the status, this
            carries the scope, and neither carries a date. */}
        <section aria-labelledby="modules-heading">
          <h2 id="modules-heading">{t('about.modules')}</h2>
          <ul className="landing__modules-full">
            {MODULES.map((module) => (
              <li key={module.id} className="landing__module" data-status={module.status}>
                <div>
                  {module.status === 'available' ? (
                    <a className="landing__module-name" href={`/${module.route}`}>{module.displayName}</a>
                  ) : (
                    <span className="landing__module-name">{module.displayName}</span>
                  )}
                  <p className="landing__module-note">
                    {module.status === 'available' ? moduleProse(module.id).description : moduleProse(module.id).plannedScope}
                  </p>
                </div>
                <span className="badge">{t(module.status === 'available' ? 'about.available' : 'about.planned')}</span>
              </li>
            ))}
          </ul>
          <p className="landing__module-note">
            {t('about.no-dates')}{' '}
            <a href={RELEASE_FEED_URL} rel="noreferrer noopener">
              {t('about.watch-releases')}
            </a>
            {t('about.no-email')}
          </p>
        </section>

        <section aria-labelledby="proposed-heading">
          <h2 id="proposed-heading">{t('about.proposed')}</h2>
          <p className="landing__module-note">{t('about.proposed-note')}</p>
          <ul>
            {MODULE_PROPOSALS.filter((proposal) => proposal.status !== 'planned').map((proposal) => (
              <li key={proposal.id}>
                <strong>{proposal.title}</strong>{' '}
                {t('about.proposal', {
                  status: proposal.status, needs: proposal.needs, count: proposal.scenarioProposals,
                })}
              </li>
            ))}
          </ul>
        </section>

        {/* Nine questions and nine answers were eighteen stacked blocks of text
            that a reader had to walk past to reach the end of the page. The
            question is the thing worth showing; the answer is what someone asks
            for. */}
        <section aria-labelledby="questions-heading" className="landing__questions">
          <h2 id="questions-heading">{t('about.questions')}</h2>
          {QUESTIONS.map((entry) => (
            <Disclosure key={entry.question} summary={entry.question}>
              <p>{entry.answer}</p>
            </Disclosure>
          ))}
        </section>

        <p className="landing__status">{HONEST_STATUS.headline} {HONEST_STATUS.detail}</p>
      </main>

      <footer className="landing__footer">
        <ul className="landing__footer-links">
          <li><a href="/">{t('about.home')}</a></li>
          {FOOTER_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} {...(link.href.startsWith('http') ? { rel: 'noreferrer noopener' } : {})}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="landing__module-note">{SUGGESTED_CITATION}</p>
        <p className="landing__disclaimer">{NOT_FOR_CLINICAL_USE}</p>
      </footer>
    </div>
  );
}
