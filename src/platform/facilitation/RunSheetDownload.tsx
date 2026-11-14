/**
 * The run sheet, offered from the facilitator guide.
 *
 * Both forms are built in the browser from the scenario already on the page and
 * saved with `createObjectURL`. Nothing is requested, and nothing is sent: the
 * guide is a prerendered document and this keeps it one.
 *
 * It is `guide__screen-only` because a printed guide cannot be clicked, and a
 * printed page carrying two dead buttons is worse than one carrying neither.
 * It deliberately does not carry `guide__section`: that class is a print rule
 * for the generated sections, and `tests/unit/facilitator-guide.test.ts` counts
 * it to check every section of the guide rendered. This block is neither.
 */
import type { Scenario } from '@anesthesia/scenarios/types';
import { Button } from '@platform/ui';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-educator';
import { REFERENCE_PATHS } from './reference-paths.generated';
import { buildRunSheet, runSheetJson, runSheetText } from './run-sheet';

function save(name: string, body: string, type: string): void {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RunSheetDownload({ moduleId, scenario }: {
  readonly moduleId: string;
  readonly scenario: Scenario;
}) {
  const paths = REFERENCE_PATHS.find((candidate) => candidate.moduleId === moduleId
    && candidate.scenarioId === scenario.metadata.id);
  const sheet = buildRunSheet(moduleId, scenario, paths?.expert ?? [], paths?.expertVitals);
  const stem = `opensimlab-${moduleId}-${scenario.metadata.id}-run-sheet`;
  return (
    <section className="document__group guide__screen-only" aria-labelledby="guide-run-sheet">
      <h2 id="guide-run-sheet">{t('guide.run-sheet-heading')}</h2>
      <p>{t('guide.run-sheet-intro')}</p>
      <Button onClick={() => save(`${stem}.txt`, runSheetText(sheet), 'text/plain')}>
        {t('guide.run-sheet-text')}
      </Button>
      {' '}
      <Button onClick={() => save(`${stem}.json`, runSheetJson(sheet), 'application/json')}>
        {t('guide.run-sheet-json')}
      </Button>
    </section>
  );
}
