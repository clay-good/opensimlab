import { Disclosure, KeyFigure } from '@platform/ui';
import { t, type MessageKey } from '@platform/i18n/messages';
import { MODELS, MODEL_SET_REVISION } from '../pharmacology/registry';
import { SECOND_SOURCE_KIND_LABEL, verificationQueue } from '../pharmacology/verification';

/**
 * The queue of parameters nobody but the transcriber has checked.
 *
 * The blocker is people, and a pharmacologist with an afternoon could clear a
 * model. This page makes that task one page long: the two counts first, then
 * the procedure, then every parameter behind a disclosure. It is generated from
 * the transcription records, so its count cannot disagree with the label a
 * learner sees beside a concentration.
 */
export function VerificationQueueBody() {
  const queue = verificationQueue(MODELS, MODEL_SET_REVISION);
  return (
    <>
      <div className="figures">
        <KeyFigure value={queue.verified} label={t('queue.verified')} tone="warning" />
        <KeyFigure value={queue.pending} label={t('queue.pending')} tone="warning" />
      </div>
      <p>{t('queue.intro')}</p>

      <h2>{t('queue.how-heading')}</h2>
      <p>
        {t('queue.how', { revision: queue.revision })}{' '}
        <a href="/corrections">{t('queue.discrepancy')}</a>
      </p>

      <h2>{t('queue.every-heading')}</h2>
      {queue.models.map((model) => {
        const pending = model.entries.filter((entry) => entry.status !== 'verified').length;
        return (
          <Disclosure
            key={model.modelId}
            className="disclosure--group"
            summary={`${model.drugName} · ${model.modelId}`}
            meta={t('queue.model-meta', { pending, total: model.entries.length })}
          >
            <p>{model.citation}</p>
            <p>{t('queue.primary', { locator: model.primaryLocator })}</p>
            <p>{t('queue.accepted', { kinds: model.acceptedSecondSources.map((kind) => SECOND_SOURCE_KIND_LABEL[kind]).join('; ') })}</p>
            <ul>
              {model.entries.map((entry) => (
                <li key={entry.parameter}>
                  <code>{entry.parameter}</code>{' '}
                  <span className="numeric">{`${Number(entry.value.toPrecision(4))} ${entry.unit}`}</span>{' '}
                  {t('queue.entry', { status: t(`queue.status.${entry.status}` as MessageKey) })}
                  {entry.corrigendumNote !== null && <> {entry.corrigendumNote}</>}
                </li>
              ))}
            </ul>
          </Disclosure>
        );
      })}
    </>
  );
}
