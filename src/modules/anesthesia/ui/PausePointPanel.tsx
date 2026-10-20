import { Button } from '@platform/ui';
import { t, type MessageKey } from '@platform/i18n/messages';
import type { ScenarioPausePoint } from '../scenarios/types';

/** A classroom pause: the scenario's question, in its own words, and one way on. */
export function PausePointPanel({ point, onResume }: {
  readonly point: ScenarioPausePoint;
  readonly onResume: () => void;
}) {
  return (
    <aside className="panel" aria-labelledby="pause-point-heading" role="complementary">
      <h2 id="pause-point-heading">{t('pause-point.heading')}</h2>
      <p>{point.question}</p>
      <p className="field__hint">{t('pause-point.look', { region: t(`region.${point.region}` as MessageKey) })}</p>
      <Button variant="primary" onClick={onResume}>{t('pause-point.resume')}</Button>
    </aside>
  );
}
