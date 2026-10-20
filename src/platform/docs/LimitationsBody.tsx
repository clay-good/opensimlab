import { Disclosure, KeyFigure } from '@platform/ui';
import { t } from '@platform/i18n/messages';
import { LIMITATIONS, LIMITATION_GROUPS } from './limitations';

/**
 * The limitations register.
 *
 * Every entry carries a one-line `headline` and three paragraphs, and this page
 * used to print all four parts of all 707 of them as a flat run of 707 `h2`s: a
 * 125,000-pixel scroll with no grouping, no summary, and no way to reach the
 * entries for one specialty. A register that cannot be navigated is a file
 * printed at a reader, and the honest effect of it was that nobody read the one
 * document on this site whose whole job is to say what the simulator gets wrong.
 *
 * The headline is the summary and the three paragraphs are the detail, which is
 * the shape the data already had. Modules group it, `The simulator itself` opens
 * first because it applies everywhere, and the count is on every group so the
 * page never reports a total without the list behind it.
 */
export function LimitationsBody() {
  return (
    <>
      <p>{t('lim.intro')}</p>
      <div className="figures">
        <KeyFigure value={LIMITATIONS.length} label={t('lim.count')} />
        <KeyFigure value={LIMITATION_GROUPS.length} label={t('lim.groups')} />
      </div>
      {LIMITATION_GROUPS.map((group, index) => (
        <Disclosure
          key={group.label}
          className="disclosure--group"
          summary={group.label}
          meta={t('lim.entries', { count: group.entries.length })}
          /* The engine-wide group is open on arrival, because it is true of every
             scenario a reader might go on to open; the specialty groups stay closed. */
          open={index === 0}
        >
          {group.entries.map((limitation) => (
            <Disclosure key={limitation.id} summary={limitation.headline}>
              <dl>
                <dt>{t('lim.simplification')}</dt>
                <dd>{limitation.simplification}</dd>
                <dt>{t('lim.misleads')}</dt>
                <dd>{limitation.whereItMisleads}</dd>
                <dt>{t('lim.correct')}</dt>
                <dd>{limitation.correctUnderstanding}</dd>
              </dl>
            </Disclosure>
          ))}
        </Disclosure>
      ))}
    </>
  );
}
