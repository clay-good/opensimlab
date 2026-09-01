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
      kind: 'scenario',
      href: `/anesthesia/scenario/${scenario.metadata.id}?review=1`,
      contentVersion: scenario.metadata.version,
    });
  }
  for (const card of DRUG_CARDS) {
    rows.push({
      key: `drug-card:${card.drugId}`,
      label: `${card.name} drug card`,
      kind: 'drug card',
      href: `/anesthesia/scenario/${SCENARIOS[0]!.metadata.id}?review=1`,
      contentVersion: card.review.contentVersion,
    });
  }
  for (const explainer of EXPLAINERS) {
    rows.push({
      key: `explainer:${explainer.id}`,
      label: explainer.title,
      kind: 'explainer',
      href: `/anesthesia/scenario/${SCENARIOS[0]!.metadata.id}?review=1`,
      contentVersion: explainer.review.contentVersion,
    });
  }
  for (const limitation of LIMITATIONS) {
    rows.push({
      key: `limitation:${limitation.id}`,
      label: limitation.simplification.slice(0, 90),
      kind: 'limitation',
      href: '/limitations',
      contentVersion: APP_VERSION,
    });
  }
  return rows;
}

/** The reviewer surfaces' own destinations, appended to the shared site bar. */
const REVIEWER_PAGES = [
  { href: '/content-review', label: 'Review the content' },
  { href: '/limitations', label: 'Limitations' },
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
    if (!confirm('Delete every note you have recorded on this device?')) return;
    setNotes([]);
    saveNotes([]);
  };

  return (
    <div className="document">
      <SiteBar current="/content-review" extra={REVIEWER_PAGES} />

      <main className="reading" id="main">
        <h1>Review the clinical content</h1>
        <p>
          If you are a clinician and you are willing to tell us what is wrong here, this is the
          most useful thing anyone can do with this project. It is currently written from the
          published sources and checked against them automatically, and nobody with a licence has
          looked at it.
        </p>
        <p className="reading__aside">
          Nothing you write here leaves this device. You export it as one file at the end and
          decide whether to send it. Recording notes does <strong>not</strong> mark anything as
          reviewed or make you responsible for what you did not flag. Signing off content is a
          separate, named act.
        </p>

        <h2>How it works</h2>
        <ol>
          <li>Open any item below. It opens with the flag controls turned on.</li>
          <li>Where something is wrong, say so where you read it. It saves as you go.</li>
          <li>Come back here and export the file.</li>
        </ol>

        <p className="numeric">
          {flagged.size} of {rows.length} items flagged. {rows.length - flagged.size} not yet
          looked at, or looked at and found acceptable.
        </p>

        <table>
          <thead>
            <tr><th>Item</th><th>Kind</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td><a href={row.href}>{row.label}</a></td>
                <td className="field__hint">{row.kind}</td>
                <td>
                  {flagged.has(row.key)
                    ? <Badge kind="out-of-range">Flagged</Badge>
                    : <span className="field__hint">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Your notes ({notes.length})</h2>
        {notes.length === 0 ? (
          <p className="field__hint">Nothing recorded yet.</p>
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
          <span className="field__label">Your name and credential, for the file</span>
          <input
            className="field__input"
            value={reviewer}
            placeholder="Optional. It helps to know who is telling us."
            onChange={(event) => setReviewer(event.target.value)}
          />
        </label>

        <div className="flag__actions">
          <Button variant="primary" onClick={download} disabled={notes.length === 0}>
            Export the notes as a file
          </Button>
          {notes.length > 0 && <Button onClick={clear}>Delete every note</Button>}
        </div>

        <h2>Where to send it</h2>
        <p>
          Attach it to an issue on the{' '}
          <a href="https://github.com/clay-good/opensimlab/issues" rel="noreferrer noopener">
            public repository
          </a>
          , or send it to the maintainer directly. Every correction that follows is appended
          permanently to the public corrections log, naming what was wrong and who reported it,
          unless you would rather not be named.
        </p>
      </main>

      <footer className="document__foot">
        <a href="/governance">Governance</a>
        <a href="/for-educators">For educators</a>
        <a href="/">Back to the front page</a>
      </footer>
    </div>
  );
}
