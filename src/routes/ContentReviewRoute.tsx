/**
 * The clinical reviewer's index
 * (platform/clinical-governance → Review Is Capturable In Place).
 *
 * The single most useful thing anyone can do with this project is tell the
 * maintainer which parts are wrong, and the thing that stops people is not
 * unwillingness, it is not knowing where the work ends. So this page's job is
 * to make the review BOUNDED: here is everything, here is what you have looked
 * at, here is what is left.
 */

import { useMemo, useState } from 'react';
import { Badge, Button, SiteBar } from '@platform/ui';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { DRUG_CARDS } from '@anesthesia/content/drug-cards';
import { SCENARIOS } from '@anesthesia/scenarios';
import { LIMITATIONS } from '@platform/docs/limitations';
import { NOTE_SEVERITIES, loadNotes, notesToMarkdown, saveNotes } from '@platform/governance/review-notes';
import { APP_VERSION } from '@platform/governance/status';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-educator';

interface ReviewableRow {
  readonly key: string;
  readonly label: string;
  readonly kind: string;
  readonly href: string;
  readonly contentVersion: string;
}

/** Every clinical claim a reviewer could be asked to look at, in one list. */
function reviewableRows(): ReviewableRow[] {
  const rows: ReviewableRow[] = [];
  for (const scenario of SCENARIOS) {
    rows.push({
      key: `scenario:${scenario.metadata.id}`,
      label: scenario.metadata.title,
      kind: t('cr.kind-scenario'),
      href: `/anesthesia/scenario/${scenario.metadata.id}?review=1`,
      contentVersion: scenario.metadata.version,
    });
  }
  for (const card of DRUG_CARDS) {
    rows.push({
      key: `drug-card:${card.drugId}`,
      label: t('cr.drug-card-label', { name: card.name }),
      kind: t('cr.kind-drug-card'),
      href: `/anesthesia/scenario/${SCENARIOS[0]!.metadata.id}?review=1`,
      contentVersion: card.review.contentVersion,
    });
  }
  for (const explainer of EXPLAINERS) {
    rows.push({
      key: `explainer:${explainer.id}`,
      label: explainer.title,
      kind: t('cr.kind-explainer'),
      href: `/anesthesia/scenario/${SCENARIOS[0]!.metadata.id}?review=1`,
      contentVersion: explainer.review.contentVersion,
    });
  }
  for (const limitation of LIMITATIONS) {
    rows.push({
      key: `limitation:${limitation.id}`,
      label: limitation.simplification.slice(0, 90),
      kind: t('cr.kind-limitation'),
      href: '/limitations',
      contentVersion: APP_VERSION,
    });
  }
  return rows;
}

/** The reviewer surfaces' own destinations, appended to the shared site bar. */
const REVIEWER_PAGES: readonly { href: string; label: string }[] = [
  { href: '/content-review', get label() { return t('cr.nav-review'); } },
  { href: '/limitations', get label() { return t('sitebar.limitations'); } },
];

export function ContentReviewRoute() {
  const rows = useMemo(() => reviewableRows(), []);
  const [notes, setNotes] = useState(() => loadNotes());
  const [reviewer, setReviewer] = useState('');
  const flagged = new Set(notes.map((note) => note.itemKey));

  const download = () => {
    const markdown = notesToMarkdown(notes, {
      reviewer,
      appVersion: APP_VERSION,
      generatedOn: new Date().toISOString().slice(0, 10),
    });
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'opensimlab-review-notes.md';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    if (!confirm(t('cr.clear-confirm'))) return;
    setNotes([]);
    saveNotes([]);
  };

  return (
    <div className="document">
      <SiteBar current="/content-review" extra={REVIEWER_PAGES} />

      <main className="reading" id="main">
        <h1>{t('cr.heading')}</h1>
        <p>{t('cr.intro')}</p>
        <p className="reading__aside">
          {t('cr.private-before')} <strong>{t('cr.private-not')}</strong> {t('cr.private-after')}
        </p>
        <p>
          {t('cr.queue-before')} <a href="/verification-queue">{t('cr.queue-link')}</a>{t('cr.queue-after')}
        </p>

        <h2>{t('cr.how')}</h2>
        <ol>
          <li>{t('cr.step-open')}</li>
          <li>{t('cr.step-flag')}</li>
          <li>{t('cr.step-export')}</li>
        </ol>

        <p className="numeric">
          {t('cr.progress', { flagged: flagged.size, total: rows.length, rest: rows.length - flagged.size })}
        </p>

        <table>
          <thead>
            <tr><th>{t('cr.col-item')}</th><th>{t('cr.col-kind')}</th><th>{t('cr.col-status')}</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td><a href={row.href}>{row.label}</a></td>
                <td className="field__hint">{row.kind}</td>
                <td>
                  {flagged.has(row.key)
                    ? <Badge kind="out-of-range">{t('cr.flagged')}</Badge>
                    : <span className="field__hint">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>{t('cr.notes', { count: notes.length })}</h2>
        {notes.length === 0 ? (
          <p className="field__hint">{t('cr.notes-empty')}</p>
        ) : (
          <ul>
            {notes.map((note) => (
              <li key={note.id}>
                <Badge kind="out-of-range">
                  {NOTE_SEVERITIES.find((entry) => entry.id === note.severity)?.label}
                </Badge>{' '}
                <strong>{note.itemLabel}</strong>
                <br />
                <span className="field__hint">{note.whatIsWrong}</span>
              </li>
            ))}
          </ul>
        )}

        <label className="field">
          <span className="field__label">{t('cr.reviewer')}</span>
          <input
            className="field__input"
            value={reviewer}
            placeholder={t('cr.reviewer-placeholder')}
            onChange={(event) => setReviewer(event.target.value)}
          />
        </label>

        <div className="flag__actions">
          <Button variant="primary" onClick={download} disabled={notes.length === 0}>
            {t('cr.export')}
          </Button>
          {notes.length > 0 && <Button onClick={clear}>{t('cr.clear')}</Button>}
        </div>

        <h2>{t('cr.send-heading')}</h2>
        <p>
          {t('cr.send-before')}{' '}
          <a href="https://github.com/clay-good/opensimlab/issues" rel="noreferrer noopener">
            {t('cr.send-link')}
          </a>
          {t('cr.send-after')}
        </p>
      </main>

      <footer className="document__foot">
        <a href="/governance">{t('sitebar.governance')}</a>
        <a href="/for-educators">{t('sitebar.for-educators')}</a>
        <a href="/">{t('documents.footer.home')}</a>
      </footer>
    </div>
  );
}
