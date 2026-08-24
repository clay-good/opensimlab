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
import { MODULES, RELEASE_FEED_URL } from '@platform/modules/registry';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { HONEST_STATUS } from '@platform/governance/status';
import {
  CONTENT_SECTIONS, FOOTER_LINKS, QUESTIONS, SUGGESTED_CITATION, THREE_FACTS,
} from './content';

export function About() {
  return (
    <div className="landing">
      <a className="skip-link" href="#main">Skip to main content</a>
      <main className="landing__content reading" id="main">
        <p className="landing__breadcrumb"><a href="/">Open Sim Lab</a></p>
        <h1>About Open Sim Lab</h1>

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
          <h2 id="modules-heading">Modules</h2>
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
                    {module.status === 'available' ? module.description : module.plannedScope}
                  </p>
                </div>
                <span className="badge">{module.status === 'available' ? 'Available' : 'Planned'}</span>
              </li>
            ))}
          </ul>
          <p className="landing__module-note">
            No dates are promised for planned modules.{' '}
            <a href={RELEASE_FEED_URL} rel="noreferrer noopener">
              Watch the repository releases to hear when one ships
            </a>
            . No email address is collected.
          </p>
        </section>

        <section aria-labelledby="questions-heading" className="landing__questions">
          <h2 id="questions-heading">Questions</h2>
          <dl>
            {QUESTIONS.map((entry) => (
              <div key={entry.question}>
                <dt>{entry.question}</dt>
                <dd>{entry.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="landing__status">{HONEST_STATUS.headline} {HONEST_STATUS.detail}</p>
      </main>

      <footer className="landing__footer">
        <ul className="landing__footer-links">
          <li><a href="/">Home</a></li>
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
