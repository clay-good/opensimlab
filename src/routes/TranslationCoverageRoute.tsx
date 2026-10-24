/**
 * The translator's coverage page (interface-translation-first-wave →
 * contribution path: a browser-based coverage page — file in, missing/stale
 * out, sample render; no network).
 *
 * A contributor drops a locale catalog in and sees, without an account and
 * without a request leaving the browser, whether it may ship, how much of the
 * interface it covers, which keys are still missing or stale, and a sample of
 * its strings rendered with placeholders filled. It is a development and
 * contribution surface, not a learner-facing one, so like the gallery and the
 * frame-budget harness it carries `noindex` and stays in English.
 */

import { useState } from 'react';
import '@platform/ui/components.css';
import { Badge, Button, EmptyState, Panel, SiteBar } from '@platform/ui';
import { EN_MESSAGES } from '@platform/i18n/all-messages';
import { inspectCatalog, parseCatalog, type CatalogInspection, type SampleStatus } from '@platform/i18n/coverage-tool';

const STATUS_BADGE: Record<SampleStatus, { readonly kind: 'default' | 'out-of-range' | 'teaching'; readonly label: string }> = {
  translated: { kind: 'default', label: 'translated' },
  stale: { kind: 'out-of-range', label: 'stale' },
  missing: { kind: 'out-of-range', label: 'missing' },
  clinical: { kind: 'teaching', label: 'clinical — stays English' },
};

export function TranslationCoverageRoute() {
  const [inspection, setInspection] = useState<CatalogInspection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  function examine(text: string) {
    const parsed = parseCatalog(text);
    if (parsed.error || !parsed.catalog) {
      setError(parsed.error ?? 'The file is not a catalog.');
      setInspection(null);
      setLocale(null);
      return;
    }
    setError(null);
    setLocale(parsed.catalog.locale);
    setInspection(inspectCatalog(EN_MESSAGES, parsed.catalog));
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => examine(String(reader.result ?? ''));
    reader.onerror = () => setError('The file could not be read.');
    reader.readAsText(file);
  }

  return (
    <>
      <SiteBar />
      <main className="reading" id="main" style={{ maxInlineSize: '90ch' }}>
        <h1>Translation coverage</h1>
        <p>
          Drop a locale catalog in to check it before you commit. Everything here runs in your
          browser; nothing is uploaded, and there is no account.
        </p>
        <p className="field__hint">
          A catalog is a JSON object with a <code>locale</code>, a <code>translators</code> array of
          names, a <code>provenance</code> of <code>&quot;human&quot;</code>, and a{' '}
          <code>messages</code> object mapping each key to a <code>text</code> and the{' '}
          <code>sourceHash</code> of the English it translated. The contributor path is written up in{' '}
          <code>CONTRIBUTING.md</code>.
        </p>

        <Panel title="Load a catalog">
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <label className="field__label" htmlFor="catalog-file">Catalog file</label>
            <input id="catalog-file" type="file" accept="application/json,.json" onChange={onFile} />
            <label className="field__label" htmlFor="catalog-paste">…or paste the JSON</label>
            <textarea
              id="catalog-paste"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={6}
              spellCheck={false}
              style={{ fontFamily: 'var(--font-mono, monospace)', inlineSize: '100%' }}
            />
            <div>
              <Button variant="primary" onClick={() => examine(draft)} disabled={draft.trim().length === 0}>
                Check the pasted catalog
              </Button>
            </div>
          </div>
        </Panel>

        {error && (
          <Panel title="Not a catalog">
            <p role="alert">{error}</p>
          </Panel>
        )}

        {inspection && (
          <>
            <Panel title={`Coverage — ${locale}`}>
              <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)' }}>
                <dt className="field__label">Translatable keys</dt>
                <dd className="numeric">{inspection.coverage.total}</dd>
                <dt className="field__label">Translated and fresh</dt>
                <dd className="numeric">{inspection.coverage.translated}</dd>
                <dt className="field__label">Stale</dt>
                <dd className="numeric">{inspection.coverage.stale.length}</dd>
                <dt className="field__label">Missing</dt>
                <dd className="numeric">{inspection.coverage.missing.length}</dd>
              </dl>
              <p>
                <Badge kind={inspection.coverage.offerable ? 'default' : 'out-of-range'}>
                  {inspection.coverage.offerable
                    ? 'Full, non-stale coverage'
                    : 'Not yet offerable — complete every key'}
                </Badge>
              </p>
              <p className="field__hint">
                A locale is offered in the language selector only at full, non-stale coverage, and
                only once the shipping checks below pass.
              </p>
            </Panel>

            <Panel title="Shipping checks">
              {inspection.problems.length === 0 ? (
                <p>
                  <Badge kind="default">No problems</Badge> This catalog may ship once its coverage
                  is complete.
                </p>
              ) : (
                <>
                  <p>These are the same checks the build runs. A catalog with any of them cannot ship.</p>
                  <ul>
                    {inspection.problems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>

            {inspection.coverage.stale.length > 0 && (
              <Panel title="Stale keys">
                <p className="field__hint">
                  The English changed after these were translated. Re-translate each and update its{' '}
                  <code>sourceHash</code>.
                </p>
                <ul>
                  {inspection.coverage.stale.map((key) => (
                    <li key={key}><code>{key}</code></li>
                  ))}
                </ul>
              </Panel>
            )}

            {inspection.coverage.missing.length > 0 && (
              <Panel title="Missing keys">
                <p className="field__hint">Not yet translated. Each falls back to English until it is.</p>
                <ul>
                  {inspection.coverage.missing.map((key) => (
                    <li key={key}><code>{key}</code></li>
                  ))}
                </ul>
              </Panel>
            )}

            <Panel title="Sample render">
              <p className="field__hint">
                A few keys of each kind, with sample placeholder values (
                <code>&#8249;name&#8250;</code> for text, a count for plurals), so you can see the
                fill. A missing or stale key shows the English fallback; a clinical key always does.
              </p>
              {inspection.samples.length === 0 ? (
                <EmptyState title="Nothing to sample" />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Key</th>
                      <th scope="col">Status</th>
                      <th scope="col">English</th>
                      <th scope="col">Rendered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspection.samples.map((row) => (
                      <tr key={row.key}>
                        <td><code>{row.key}</code></td>
                        <td><Badge kind={STATUS_BADGE[row.status].kind}>{STATUS_BADGE[row.status].label}</Badge></td>
                        <td>{row.english}</td>
                        <td>{row.rendered}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </>
        )}

        {!inspection && !error && (
          <EmptyState title="No catalog loaded">
            Load or paste a catalog above to see its coverage, its shipping checks, and a sample
            render.
          </EmptyState>
        )}
      </main>
      <footer className="document__foot">
        <a href="/">Home</a>
        <a href="/translation-status">Translation status</a>
      </footer>
    </>
  );
}
