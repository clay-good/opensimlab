import { useState } from 'react';
import { Button, KeyFigure } from '@platform/ui';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-documents';
import { PRIVACY_CLAIMS } from './privacy-claims';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import {
  importProgressFile,
  loadPracticeHistory,
  practiceHistoryExport,
  PRACTICE_HISTORY_KEY,
} from '@anesthesia/catalog/practice-history';
import { eraseOne } from '@platform/offline/local-data';

/**
 * The privacy statement, and the controls over the one thing it says is kept.
 *
 * Its claims are typed data each held against the test that enforces it; the
 * page's own words come from the catalog.
 */
export function PrivacyBody() {
  const [attemptCount, setAttemptCount] = useState(() => loadPracticeHistory().length);
  const [historyMessage, setHistoryMessage] = useState('');
  const [historyImport, setHistoryImport] = useState('');
  const downloadHistory = () => {
    const blob = new Blob([practiceHistoryExport(loadPracticeHistory())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'opensimlab-practice-history.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const importHistory = (mode: 'merge' | 'replace') => {
    try {
      const result = importProgressFile(historyImport, mode);
      setAttemptCount(result.history.length);
      setHistoryImport('');
      const moved = result.changes.map((change) =>
        `${change.scenarioId} ${change.objectiveId}: ${change.previous ?? t('history.none')} → ${change.current ?? t('history.none')}`);
      const counts = { added: result.added, duplicates: result.duplicates, stored: result.history.length };
      setHistoryMessage(`${t(mode === 'merge' ? 'history.merged' : 'history.replaced', counts)} `
        + (moved.length === 0 ? t('history.no-change')
          : t('history.changed', { count: moved.length, changes: moved.join('; ') })));
    } catch (error) {
      setHistoryMessage(error instanceof Error ? error.message : t('history.import-failed'));
    }
  };
  return (
    <>
      {/* The three facts a privacy page is read for. They are all in the prose
          below and always were, which is exactly the problem: a reader deciding
          whether to send their students here should not have to find them. */}
      <div className="figures">
        <KeyFigure value="0" label={t('priv.fig-accounts')} />
        <KeyFigure value={t('priv.fig-bytes-value')} label={t('priv.fig-bytes')} />
        <KeyFigure value={t('priv.fig-retention-value')} label={t('priv.fig-retention')} />
      </div>
      <p>{t('priv.intro')}</p>
      <h2>{t('priv.stored-heading')}</h2>
      <ul>
        <li>{t('priv.stored-preferences')}</li>
        <li>{t('priv.stored-acknowledgement')}</li>
        <li>{t('priv.stored-hidden')}</li>
        <li>{t('priv.stored-attempts')}</li>
        <li>{t('priv.stored-transcripts')}</li>
        <li>{t('priv.stored-offline')}</li>
      </ul>
      <p>{t('priv.offline-prepare')}</p>
      <p id="problem-reports">{t('priv.reports')}</p>

      <h2>{t('priv.leaves-heading')}</h2>
      <p>
        {t('priv.leaves-before')} <strong>{t('priv.help-label')}</strong>{t('priv.leaves-after')}
      </p>

      <h2>{t('priv.history-heading')}</h2>
      <p>
        <strong>{attemptCount}</strong> {t('priv.history-count', { count: attemptCount })} {t('priv.history-contents')}
      </p>
      <p>{t('priv.history-moves')}</p>
      <p className="field__hint">{t('priv.history-excludes')}</p>
      <label className="field" htmlFor="practice-history-import">
        <span className="field__label">{t('history.import-label')}</span>
        <textarea
          id="practice-history-import"
          aria-label={t('history.import-label')}
          className="field__input"
          rows={5}
          value={historyImport}
          onChange={(event) => setHistoryImport(event.target.value)}
          placeholder={t('history.import-placeholder')}
        />
        <span className="field__hint">{t('history.import-hint')}</span>
      </label>
      <div className="phase-nav">
        <Button onClick={downloadHistory}>{t('history.export')}</Button>
        <Button onClick={() => importHistory('merge')}>{t('history.merge')}</Button>
        <Button variant="ghost" onClick={() => {
          if (!confirm(t('history.replace-confirm'))) return;
          importHistory('replace');
        }}>{t('history.replace')}</Button>
        <Button variant="danger" onClick={() => {
          if (!confirm(t('history.erase-confirm'))) return;
          try { eraseOne(localStorage, PRACTICE_HISTORY_KEY); } catch { /* Storage may be blocked. */ }
          setAttemptCount(0);
          setHistoryMessage(t('history.erased'));
        }}>
          {t('history.erase')}
        </Button>
      </div>
      {historyMessage && <p role="status" className="field__hint">{historyMessage}</p>}

      <h2>{t('priv.host-heading')}</h2>
      <p>{t('priv.host')}</p>

      <h2>{t('priv.claims-heading')}</h2>
      <table>
        <thead><tr><th>{t('priv.claim')}</th><th>{t('priv.enforced-by')}</th></tr></thead>
        <tbody>
          {PRIVACY_CLAIMS.map((claim) => (
            <tr key={claim.claim}>
              <td>{claim.claim}</td>
              <td><code>{claim.test}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
    </>
  );
}
