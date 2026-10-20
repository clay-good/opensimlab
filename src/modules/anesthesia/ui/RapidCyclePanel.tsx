import { Button } from '@platform/ui';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-session';
import type { ScenarioRapidCycle } from '../scenarios/types';
import type { RapidCycleStatus } from '../catalog/rapid-cycle';

/**
 * One rapid cycle, as it stands. The objective and the directive are the
 * scenario's clinical content and stay in its own words; everything else is
 * interface text from the catalog.
 */
export function RapidCyclePanel({ point, cycle, status, objectiveStatement, onRetry, onFinish }: {
  readonly point: ScenarioRapidCycle;
  readonly cycle: number;
  readonly status: RapidCycleStatus;
  readonly objectiveStatement: string | undefined;
  readonly onRetry: () => void;
  readonly onFinish: () => void;
}) {
  return (
    <aside className="panel" aria-labelledby="rapid-cycle-heading" role="complementary">
      <h2 id="rapid-cycle-heading">{t('rapid-cycle.heading', { cycle, cap: point.cycleCap })}</h2>
      {status === 'waiting' && <p>{objectiveStatement}</p>}
      {status === 'landed' && (
        <>
          <p>{t('rapid-cycle.landed')}</p>
          <Button variant="primary" onClick={onFinish}>{t('rapid-cycle.back')}</Button>
        </>
      )}
      {status === 'missed' && (
        <>
          <p><strong>{point.directive}</strong></p>
          {cycle < point.cycleCap ? (
            <Button variant="primary" onClick={onRetry}>{t('rapid-cycle.retry')}</Button>
          ) : (
            <>
              <p className="field__hint">{t('rapid-cycle.last', { source: point.sourceLocator })}</p>
              <Button variant="primary" onClick={onFinish}>{t('rapid-cycle.back')}</Button>
            </>
          )}
        </>
      )}
    </aside>
  );
}
