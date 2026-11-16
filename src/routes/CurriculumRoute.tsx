/**
 * The curriculum coverage view, for a program director
 * (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * Filterable by module and by framework, exportable as CSV, and honest about
 * what it does not cover: a domain no scenario touches is listed as uncovered
 * rather than dropped, because a coverage table that quietly omits its gaps is
 * worse than no table.
 *
 * Two modules carry a mapping. The module chooser comes first because a reading
 * belongs to a module: offering the ACGME's emergency medicine subcompetencies
 * while an anaesthesia lesson list was on screen would read as a claim that the
 * one maps to the other.
 */

import { useMemo, useState } from 'react';
import { Badge, Button, SegmentedControl, SiteBar } from '@platform/ui';
import { MAPPING_DISCLAIMER } from '@anesthesia/curriculum/frameworks';
import { ANESTHESIA_CURRICULUM } from '@anesthesia/curriculum/mapping';
import {
  coverageOf, curriculumCsv, unmappedIn, type CurriculumModule,
} from '@platform/curriculum/mapping';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../modules/emergency-medicine/scenarios';
import {
  EMERGENCY_MEDICINE_FRAMEWORKS, EMERGENCY_MEDICINE_SCENARIO_MAPPINGS,
} from '../modules/emergency-medicine/curriculum';
import { PEDIATRICS_SCENARIOS } from '../modules/pediatrics/scenarios';
import {
  PEDIATRICS_FRAMEWORKS, PEDIATRICS_SCENARIO_MAPPINGS,
} from '../modules/pediatrics/curriculum';
import { NEUROLOGY_SCENARIOS } from '../modules/neurology/scenarios';
import {
  NEUROLOGY_FRAMEWORKS, NEUROLOGY_SCENARIO_MAPPINGS,
} from '../modules/neurology/curriculum';
import { OBSTETRICS_SCENARIOS } from '../modules/obstetrics/scenarios';
import {
  OBSTETRICS_FRAMEWORKS, OBSTETRICS_SCENARIO_MAPPINGS,
} from '../modules/obstetrics/curriculum';
import { CARDIOLOGY_SCENARIOS } from '../modules/cardiology/scenarios';
import {
  CARDIOLOGY_FRAMEWORKS, CARDIOLOGY_SCENARIO_MAPPINGS,
} from '../modules/cardiology/curriculum';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../modules/respiratory-medicine/scenarios';
import {
  RESPIRATORY_MEDICINE_FRAMEWORKS, RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS,
} from '../modules/respiratory-medicine/curriculum';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-educator';
import { EDUCATOR_PAGES } from './educator-pages';

/** The modules that carry a mapping, in the order the chooser offers them. */
const MAPPED_MODULES: readonly CurriculumModule[] = [
  ANESTHESIA_CURRICULUM,
  {
    moduleRoute: 'emergency-medicine',
    displayName: 'Emergency medicine',
    frameworks: EMERGENCY_MEDICINE_FRAMEWORKS,
    scenarios: EMERGENCY_MEDICINE_SCENARIOS,
    mappings: EMERGENCY_MEDICINE_SCENARIO_MAPPINGS,
  },
  {
    moduleRoute: 'pediatrics',
    displayName: 'Pediatrics',
    frameworks: PEDIATRICS_FRAMEWORKS,
    scenarios: PEDIATRICS_SCENARIOS,
    mappings: PEDIATRICS_SCENARIO_MAPPINGS,
  },
  {
    moduleRoute: 'neurology',
    displayName: 'Neurology',
    frameworks: NEUROLOGY_FRAMEWORKS,
    scenarios: NEUROLOGY_SCENARIOS,
    mappings: NEUROLOGY_SCENARIO_MAPPINGS,
  },
  {
    moduleRoute: 'obstetrics',
    displayName: 'Obstetrics',
    frameworks: OBSTETRICS_FRAMEWORKS,
    scenarios: OBSTETRICS_SCENARIOS,
    mappings: OBSTETRICS_SCENARIO_MAPPINGS,
  },
  {
    moduleRoute: 'cardiology',
    displayName: 'Cardiology',
    frameworks: CARDIOLOGY_FRAMEWORKS,
    scenarios: CARDIOLOGY_SCENARIOS,
    mappings: CARDIOLOGY_SCENARIO_MAPPINGS,
  },
  {
    moduleRoute: 'respiratory-medicine',
    displayName: 'Respiratory medicine',
    frameworks: RESPIRATORY_MEDICINE_FRAMEWORKS,
    scenarios: RESPIRATORY_MEDICINE_SCENARIOS,
    mappings: RESPIRATORY_MEDICINE_SCENARIO_MAPPINGS,
  },
];

export function CurriculumRoute() {
  const [moduleRoute, setModuleRoute] = useState(MAPPED_MODULES[0]!.moduleRoute);
  const module = MAPPED_MODULES.find((entry) => entry.moduleRoute === moduleRoute)!;
  const [frameworkId, setFrameworkId] = useState(module.frameworks[0]!.id);
  const framework = module.frameworks.find((entry) => entry.id === frameworkId)
    ?? module.frameworks[0]!;
  const coverage = useMemo(
    () => coverageOf(framework, module.scenarios, module.mappings), [framework, module],
  );
  const unmapped = useMemo(() => unmappedIn(module.scenarios, module.mappings), [module]);
  const covered = coverage.filter((entry) => entry.scenarios.length > 0).length;

  const download = () => {
    const blob = new Blob([curriculumCsv(MAPPED_MODULES)], { type: 'text/csv' });
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
          label={t('curriculum.module')}
          value={moduleRoute}
          onChange={(value) => {
            setModuleRoute(value);
            setFrameworkId(MAPPED_MODULES.find((entry) => entry.moduleRoute === value)!
              .frameworks[0]!.id);
          }}
          options={MAPPED_MODULES.map((entry) => ({
            value: entry.moduleRoute,
            label: entry.displayName,
          }))}
        />

        <SegmentedControl<string>
          label={t('curriculum.framework')}
          value={framework.id}
          onChange={setFrameworkId}
          options={module.frameworks.map((entry) => ({
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
                        const mapping = module.mappings.find(
                          (entry) => entry.frameworkId === framework.id
                            && entry.domainId === domain.id
                            && entry.scenarioId === scenario.metadata.id,
                        );
                        return (
                          <li key={scenario.metadata.id}>
                            <a href={`/${module.moduleRoute}/scenario/${scenario.metadata.id}`}>
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
