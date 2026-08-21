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

/**
 * The educator surfaces' own destinations, appended to the shared site bar.
 *
 * These three pages used to carry three separate hand-written copies of the
 * same bar, and the reviewer page a fourth. Four bars is four things to keep in
 * step, and they had already drifted: none of them offered the validation report
 * or the governance page, which are the two pages an educator evaluating this
 * most wants.
 */
const EDUCATOR_PAGES = [
  { href: '/for-educators', label: 'For educators' },
  { href: '/curriculum', label: 'Curriculum' },
  { href: '/review', label: 'Review submissions' },
];

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
        <h1>Curriculum coverage</h1>
        <p className="reading__aside">{MAPPING_DISCLAIMER}</p>

        <SegmentedControl<string>
          label="Framework"
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
            {framework.body} · {framework.version} · applies to {framework.appliesTo}
          </p>
          <p>
            <Badge kind={framework.fidelity === 'verbatim' ? 'default' : 'teaching'}>
              {framework.fidelity === 'verbatim' ? 'Transcribed' : 'Summarised'}
            </Badge>{' '}
            {framework.note}
          </p>
          <p>
            <a href={framework.url} rel="noreferrer noopener">Read the framework itself</a>
          </p>
        </section>

        <p className="numeric">
          {covered} of {framework.domains.length} domains have at least one scenario.
        </p>

        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Scenarios</th>
              <th className="numeric">Minutes</th>
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
                    <Badge kind="out-of-range">No scenario yet</Badge>
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
                              via {(mapping?.objectiveIds ?? []).join(', ')}
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
          <h2>Unmapped scenarios</h2>
          {unmapped.length === 0 ? (
            <p>Every bundled scenario carries at least one framework mapping.</p>
          ) : (
            <ul>
              {unmapped.map((scenario) => (
                <li key={scenario.metadata.id}>{scenario.metadata.title}</li>
              ))}
            </ul>
          )}
        </section>

        <Button variant="primary" onClick={download}>Export the mapping as CSV</Button>

        <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>

      <footer className="document__foot">
        <a href="/for-educators">For educators</a>
        <a href="/review">Review submissions</a>
        <a href="/">Back to the front page</a>
      </footer>
    </div>
  );
}
