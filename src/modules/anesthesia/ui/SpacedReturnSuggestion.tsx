import { useEffect, useState } from 'react';
import type { Scenario } from '@anesthesia/scenarios/types';
import { loadPracticeHistory } from '@anesthesia/catalog/practice-history';
import {
  SPACED_RETURN_CONVENTION, dismissSpacedReturn, spacedReturnDismissed, spacedReturnSuggestion,
  type SpacedReturnSuggestion as Suggestion,
} from '@anesthesia/catalog/spaced-return';
import { Button, Panel } from '@platform/ui';

/** Module-level so the effect's dependency stays stable. */
const defaultNow = () => new Date().getTime();

/**
 * One spaced-return suggestion for this module's index, or nothing.
 *
 * Read after mount, never during render: the index is prerendered and hydrated,
 * and local practice history exists only in this browser.
 */
export function SpacedReturnSuggestion({ scenarios, basePath, now = defaultNow }: {
  readonly scenarios: readonly Scenario[];
  readonly basePath: string;
  readonly now?: () => number;
}) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  useEffect(() => {
    const at = now();
    if (spacedReturnDismissed(at)) return;
    setSuggestion(spacedReturnSuggestion(loadPracticeHistory(), scenarios, new Date(at)));
  }, [scenarios, now]);
  if (suggestion === null) return null;
  const { scenario } = suggestion;
  return (
    <Panel title="Worth coming back to">
      <p><a href={`${basePath}/scenario/${scenario.metadata.id}`}>{scenario.metadata.title}</a>
        {' '}· about {scenario.metadata.estimatedMinutes} simulated minutes</p>
      {suggestion.practises.length > 0 && (
        <ul>{suggestion.practises.map((statement) => <li key={statement}>{statement}</li>)}</ul>
      )}
      <p>{suggestion.reason}</p>
      <p className="reading__aside">
        Worked out on this device from your own practice history; nothing is sent anywhere. It does
        not measure competence. {SPACED_RETURN_CONVENTION}
      </p>
      <Button compact variant="ghost" onClick={() => {
        dismissSpacedReturn(now());
        setSuggestion(null);
      }}>
        Hide this suggestion for 7 days
      </Button>
    </Panel>
  );
}
