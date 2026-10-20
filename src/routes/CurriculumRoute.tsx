/**
 * The curriculum coverage view, for a program director
 * (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * Filterable by framework, exportable as CSV, and honest about what it does not
 * cover: a domain no scenario touches is listed as uncovered rather than
 * dropped, because a coverage table that quietly omits its gaps is worse than
 * no table.
 */

import { useMemo, useState } from 'react';
import { Badge, Button, SegmentedControl, SiteBar } from '@platform/ui';
import { FRAMEWORKS, MAPPING_DISCLAIMER } from '@anesthesia/curriculum/frameworks';
import {
  SCENARIO_MAPPINGS, coverageFor, mappingCsv, unmappedScenarios,
} from '@anesthesia/curriculum/mapping';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-educator';
import { EDUCATOR_PAGES } from './educator-pages';

export function CurriculumRoute() {
  const [frameworkId, setFrameworkId] = useState(FRAMEWORKS[0]!.id);
  const framework = FRAMEWORKS.find((entry) => entry.id === frameworkId)!;
  const coverage = useMemo(() => coverageFor(framework), [framework]);
  const unmapped = useMemo(() => unmappedScenarios(), []);
  const covered = coverage.filter((entry) => entry.scenarios.length > 0).length;

  const download = () => {
    const blob = new Blob([mappingCsv()], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'opensimlab-curriculum-mapping.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="document">
      <SiteBar current="/curriculum" extra={EDUCATOR_PAGES} />

      <main className="reading" id="main">
        <h1>{t('curriculum.heading')}</h1>
        <p className="reading__aside">{MAPPING_DISCLAIMER}</p>

        <SegmentedControl<string>
          label={t('curriculum.framework')}
          value={frameworkId}
          onChange={setFrameworkId}
          options={FRAMEWORKS.map((entry) => ({
            value: entry.id,
            label: entry.shortLabel,
            srLabel: entry.name,
          }))}
        />

        <section>
          <h2>{framework.name}</h2>
          <p className="field__hint">
            {t('curriculum.framework-meta', { body: framework.body, version: framework.version, appliesTo: framework.appliesTo })}
          </p>
          <p>
            <Badge kind={framework.fidelity === 'verbatim' ? 'default' : 'teaching'}>
              {t(framework.fidelity === 'verbatim' ? 'curriculum.transcribed' : 'curriculum.summarised')}
            </Badge>{' '}
            {framework.note}
          </p>
          <p>
            <a href={framework.url} rel="noreferrer noopener">{t('curriculum.read-framework')}</a>
          </p>
        </section>

        <p className="numeric">
          {t('curriculum.covered', { covered, total: framework.domains.length })}
        </p>

        <table>
          <thead>
            <tr>
              <th>{t('curriculum.col-domain')}</th>
              <th>{t('curriculum.col-scenarios')}</th>
              <th className="numeric">{t('curriculum.col-minutes')}</th>
            </tr>
          </thead>
          <tbody>
            {coverage.map(({ domain, scenarios }) => (
              <tr key={domain.id}>
                <td>
                  <strong>{domain.label}</strong>
                  <br />
                  <span className="field__hint">{domain.description}</span>
                </td>
                <td>
                  {scenarios.length === 0 ? (
                    <Badge kind="out-of-range">{t('curriculum.no-scenario')}</Badge>
                  ) : (
                    <ul className="curriculum__scenarios">
                      {scenarios.map((scenario) => {
                        const mapping = SCENARIO_MAPPINGS.find(
                          (entry) => entry.frameworkId === framework.id
                            && entry.domainId === domain.id
                            && entry.scenarioId === scenario.metadata.id,
                        );
                        return (
                          <li key={scenario.metadata.id}>
                            <a href={`/anesthesia/scenario/${scenario.metadata.id}`}>
                              {scenario.metadata.title}
                            </a>
                            <br />
                            <span className="field__hint">
                              {t('curriculum.via', { objectives: (mapping?.objectiveIds ?? []).join(', ') })}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </td>
                <td className="numeric">
                  {scenarios.reduce((sum, s) => sum + s.metadata.estimatedMinutes, 0) || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section>
          <h2>{t('curriculum.unmapped')}</h2>
          {unmapped.length === 0 ? (
            <p>{t('curriculum.all-mapped')}</p>
          ) : (
            <ul>
              {unmapped.map((scenario) => (
                <li key={scenario.metadata.id}>{scenario.metadata.title}</li>
              ))}
            </ul>
          )}
        </section>

        <Button variant="primary" onClick={download}>{t('curriculum.export')}</Button>

        <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>

      <footer className="document__foot">
        <a href="/for-educators">{t('sitebar.for-educators')}</a>
        <a href="/review">{t('educator.review-submissions')}</a>
        <a href="/">{t('documents.footer.home')}</a>
      </footer>
    </div>
  );
}
