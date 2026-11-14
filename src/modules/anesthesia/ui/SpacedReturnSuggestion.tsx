import { useEffect, useState } from 'react';
import { loadPracticeHistory } from '@anesthesia/catalog/practice-history';
import {
  dismissSpacedReturn, spacedReturnDismissed, spacedReturnSuggestion,
  type SpacedReturnSuggestion as Suggestion,
} from '@anesthesia/catalog/spaced-return';
import { MODULES } from '@platform/modules/registry';
import { Button, Panel } from '@platform/ui';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-session';

/** Module-level so the effect's dependency stays stable. */
const defaultNow = () => new Date().getTime();

/** The catalogue view the suggestion needs, fetched only when there is practice to rank. */
const loadReturnIndex = () => import('@platform/catalog/return-index.generated');

/**
 * One spaced-return suggestion, or nothing.
 *
 * The suggestion is one for the whole catalogue, not one per module: it ranks
 * every lesson this device has practised, so the module page a learner happens
 * to be standing on cannot decide what they most need to come back to.
 *
 * Everything happens after mount, never during render. Every module index is
 * prerendered and hydrated, local practice history exists only in this browser,
 * and the catalogue view is a separate chunk that a visitor with no practice
 * history never downloads.
 */
export function SpacedReturnSuggestion({ now = defaultNow }: {
  readonly now?: () => number;
}) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  useEffect(() => {
    const at = now();
    if (spacedReturnDismissed(at)) return;
    const history = loadPracticeHistory();
    if (history.length === 0) return;
    let cancelled = false;
    void loadReturnIndex()
      .then(({ RETURN_INDEX }) => {
        if (!cancelled) setSuggestion(spacedReturnSuggestion(history, RETURN_INDEX, new Date(at)));
      })
      // A chunk that will not load leaves the panel out rather than showing a
      // suggestion it cannot name.
      .catch(() => { if (!cancelled) setSuggestion(null); });
    return () => { cancelled = true; };
  }, [now]);
  if (suggestion === null) return null;
  const module = MODULES.find((entry) => entry.id === suggestion.moduleId);
  if (module === undefined) return null;
  return (
    <Panel title={t('spaced.title')}>
      <p><a href={`/${module.route}/scenario/${suggestion.scenarioId}`}>{suggestion.title}</a>
        {' · '}{module.displayName}
        {' · '}{t('spaced.duration', { minutes: suggestion.estimatedMinutes })}</p>
      {suggestion.practises.length > 0 && (
        <ul>{suggestion.practises.map((statement) => <li key={statement}>{statement}</li>)}</ul>
      )}
      <p>{suggestion.reason}</p>
      <p className="reading__aside">{t('spaced.local')} {t('spaced.convention')}</p>
      <Button compact variant="ghost" onClick={() => {
        dismissSpacedReturn(now());
        setSuggestion(null);
      }}>
        {t('spaced.hide')}
      </Button>
    </Panel>
  );
}
