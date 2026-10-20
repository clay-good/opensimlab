/**
 * The informational routes: the validation report, the governance dashboard, the
 * review-status page, the corrections log, the pharmacology verification queue,
 * the limitations register, and the privacy statement.
 *
 * They are generated from the same records the build gate and the tests read, so
 * a document cannot claim something the code does not do.
 */

import { Panel, SiteBar } from '@platform/ui';
import { ReviewStatusBody } from '@platform/governance/ReviewStatusBody';
import { LimitationsBody } from '@platform/docs/LimitationsBody';
import { ValidationBody } from '@platform/docs/ValidationBody';
import { GovernanceBody } from '@platform/governance/GovernanceBody';
import { PrivacyBody } from '@platform/docs/PrivacyBody';
import { CorrectionsBody } from '@platform/docs/CorrectionsBody';
import { t } from '@platform/i18n/messages';
import { TranslationStatusBody } from '@platform/i18n/TranslationStatusBody';
import { VerificationQueueBody } from '@anesthesia/ui/VerificationQueueBody';
import { routeFor } from './routes';

/**
 * The trust documents the shared bar does not already carry.
 *
 * Validation and Governance are in the site bar for everyone, so only the two
 * that are specific to a reader working through the documents are added here.
 */
const DOCUMENT_EXTRAS: readonly { href: string; label: string }[] = [
  { href: '/review-status', get label() { return t('documents.review-status'); } },
  { href: '/corrections', get label() { return t('documents.corrections'); } },
  { href: '/privacy', get label() { return t('documents.privacy'); } },
  { href: '/content-review', get label() { return t('documents.content-review'); } },
];

export function DocumentRoute({ path }: { path: string }) {
  const metadata = routeFor(path);
  return (
    <div className="document">
      {/* The same bar every other surface carries, so navigation cannot drift
          between the trust documents and the simulator. */}
      <SiteBar current={path} extra={DOCUMENT_EXTRAS} />

      <main className="reading" id="main">
        <h1>{metadata?.heading ?? t('documents.heading-fallback')}</h1>
        {path === '/validation' && <ValidationBody />}
        {path === '/governance' && <GovernanceBody />}
        {path === '/review-status' && <ReviewStatusBody />}
        {path === '/corrections' && <CorrectionsBody />}
        {path === '/verification-queue' && <VerificationQueueBody />}
        {path === '/translation-status' && <TranslationStatusBody />}
        {path === '/limitations' && <LimitationsBody />}
        {path === '/privacy' && <PrivacyBody />}
      </main>

      <footer className="document__foot">
        <a href="/">{t('documents.footer.home')}</a>
        <a href="/about">{t('documents.footer.about')}</a>
        <a href="/anesthesia">{t('documents.footer.simulator')}</a>
      </footer>
    </div>
  );
}

export function DocumentPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <Panel title={title}>{children}</Panel>;
}
