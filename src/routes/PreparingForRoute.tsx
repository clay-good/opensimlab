/**
 * The "preparing for" blueprint filter
 * (platform/adoption → Learners Can Filter The Catalog By Examination Blueprint).
 *
 * A learner picks the examination they are preparing for and reads the lessons
 * this project maps to each of its categories. It is a finding aid and nothing
 * more: there is no total, no rank, no progress, and no claim about how anyone
 * will do on a paper. A category nothing touches says so, because a learner
 * planning their week needs the gaps more than the hits.
 */

import { useEffect, useMemo, useState } from 'react';
import { Badge, SegmentedControl, Select, SiteBar } from '@platform/ui';
import { MaturityMarker } from '@platform/governance/MaturityMarker';
import { MAPPING_DISCLAIMER } from '@anesthesia/curriculum/frameworks';
import {
  BLUEPRINTS, blueprintQueryString, blueprintSelection,
  getBlueprint, overdueBlueprints, readBlueprintQuery, type BlueprintQuery,
} from '@platform/curriculum/blueprints';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { APP_VERSION } from '@platform/governance/status';
import { frameworkToday } from '@platform/curriculum/framework-records';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-educator';

export interface PreparingForRouteProps {
  /** A selection to render as given, for prerendering and tests; the URL otherwise. */
  readonly query?: BlueprintQuery;
}

export function PreparingForRoute({ query: initial }: PreparingForRouteProps) {
  const [query, setQuery] = useState<BlueprintQuery>(
    () => initial ?? readBlueprintQuery(typeof location === 'undefined' ? '' : location.search),
  );

  // The selection lives in the URL so a learner can keep or share the view they
  // built. Only recorded identifiers ever reach it, and reading it back accepts
  // only those, so nothing a visitor types into the address bar reaches a surface.
  useEffect(() => {
    if (typeof history === 'undefined') return;
    history.replaceState(null, '', `${location.pathname}${blueprintQueryString(query)}`);
  }, [query]);

  const blueprint = query.blueprint === 'none' ? undefined : getBlueprint(query.blueprint);
  const categories = useMemo(() => blueprintSelection(query), [query]);
  const overdue = useMemo(
    () => new Set(overdueBlueprints(frameworkToday(APP_VERSION)).map((record) => record.id)),
    [],
  );

  return (
    <div className="document">
      <SiteBar current="/preparing-for" />

      <main className="reading" id="main">
        <h1>{t('blueprint.heading')}</h1>
        <p>{t('blueprint.intro')}</p>
        <p className="reading__aside">{MAPPING_DISCLAIMER}</p>

        <SegmentedControl<string>
          label={t('blueprint.choose')}
          value={query.blueprint}
          onChange={(value) => setQuery({ blueprint: value, category: 'all' })}
          options={[
            { value: 'none', label: t('blueprint.none') },
            ...BLUEPRINTS.map((entry) => ({
              value: entry.record.id,
              label: entry.record.shortLabel,
              srLabel: entry.record.name,
            })),
          ]}
        />

        {blueprint === undefined ? (
          <p>{t('blueprint.pick-prompt')}</p>
        ) : (
          <>
            <section>
              <h2>{blueprint.record.name}</h2>
              <p className="field__hint">
                {t('blueprint.meta', {
                  body: blueprint.record.body,
                  version: blueprint.record.version,
                  appliesTo: blueprint.record.appliesTo,
                })}
              </p>
              <p>
                <Badge kind={blueprint.record.fidelity === 'verbatim' ? 'default' : 'teaching'}>
                  {t(blueprint.record.fidelity === 'verbatim'
                    ? 'curriculum.transcribed' : 'curriculum.summarised')}
                </Badge>{' '}
                {blueprint.record.note}
              </p>
              <p className="field__hint">
                {t('blueprint.recorded', {
                  recordedOn: blueprint.record.recordedOn, reviewBy: blueprint.record.reviewBy,
                })}
              </p>
              {overdue.has(blueprint.record.id) && (
                <p><Badge kind="out-of-range">{t('blueprint.overdue')}</Badge></p>
              )}
              <p>
                <a href={blueprint.record.url} rel="noreferrer noopener">{t('blueprint.read')}</a>
              </p>
            </section>

            <Select
              label={t('blueprint.category')}
              value={query.category}
              onChange={(event) => setQuery({ ...query, category: event.target.value })}
              options={[
                { value: 'all', label: t('blueprint.all-categories') },
                ...blueprint.categories.map((category) => ({
                  value: category.id, label: category.label,
                })),
              ]}
            />

            {categories.map((category) => (
              <section key={category.id}>
                <h3>{category.label}</h3>
                <p className="field__hint">{category.description}</p>
                {category.lessons.length === 0 ? (
                  <p>
                    {t('blueprint.empty')}
                    {category.emptyReason ? ` ${category.emptyReason}` : ''}
                  </p>
                ) : (
                  <ul className="curriculum__scenarios">
                    {category.lessons.map((lesson) => (
                      <li key={`${lesson.moduleRoute}/${lesson.scenarioId}`}>
                        <a href={lesson.href}>{lesson.title}</a>{' '}
                        <MaturityMarker
                          status={lesson.maturity}
                          subjectKind="scenario"
                          subjectId={lesson.scenarioId}
                          contentVersion={lesson.version}
                          moduleId={lesson.moduleRoute}
                          compact
                        />
                        <br />
                        <span className="field__hint">
                          {t('blueprint.lesson-meta', { minutes: lesson.estimatedMinutes })}
                          {' · '}
                          {t('curriculum.via', { objectives: lesson.via.join(', ') })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </>
        )}

        <p className="reading__aside">{t('blueprint.not-a-claim')}</p>
        <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>

      <footer className="document__foot">
        <a href="/curriculum">{t('blueprint.curriculum-link')}</a>
        <a href="/">{t('documents.footer.home')}</a>
      </footer>
    </div>
  );
}
