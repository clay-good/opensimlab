import { Badge, CitationLink, Disclosure, KeyFigure } from '@platform/ui';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-documents';
import { buildValidationReport } from './validation-report';
import { SOURCES, formatSource, requireSource } from './sources';
import { VERIFIED_CONSTANTS, confirmedCount } from './verified-constants';

/**
 * The validation report: what has been measured against what, and what has not.
 *
 * Every figure, row, and reason is generated from the report the build gate
 * reads; the page's own words come from the catalog.
 */
export function ValidationBody() {
  const report = buildValidationReport();
  const passing = report.benchmarks.filter((benchmark) => benchmark.passes).length;
  return (
    <>
      <p className="field__hint">
        {t('val.versions', { engine: report.engineVersion, models: report.modelSetRevision })}
      </p>

      {/* The four numbers a reader came for, before the four sections that
          explain them. Two of them are zero, and a zero stated plainly at the top
          of a validation report is worth more than a page that makes someone read
          to the end to find it. */}
      <div className="figures">
        <KeyFigure
          value={`0 / ${report.varvel.length}`}
          label={t('val.fig-models')}
          tone="warning"
        />
        <KeyFigure
          value={`${report.faceValidity.reviewers} / ${report.faceValidity.required}`}
          label={t('val.fig-reviewers')}
          tone="warning"
        />
        <KeyFigure value={`${passing} / ${report.benchmarks.length}`} label={t('val.fig-benchmarks')} />
        <KeyFigure value={SOURCES.length} label={t('val.fig-sources')} />
      </div>

      <h2>{t('val.predictive-heading')}</h2>
      <p>{t('val.predictive')}</p>
      <table>
        <thead>
          <tr>
            <th>{t('val.col-model')}</th><th>{t('val.col-mdpe')}</th><th>{t('val.col-mdape')}</th>
            <th>{t('val.col-wobble')}</th><th>{t('val.col-divergence')}</th>
          </tr>
        </thead>
        <tbody>
          {report.varvel.map((entry) => (
            <tr key={entry.modelId}>
              <td>{entry.modelId}</td>
              <td className="numeric">{entry.mdpe ?? '—'}</td>
              <td className="numeric">{entry.mdape ?? '—'}</td>
              <td className="numeric">{entry.wobble ?? '—'}</td>
              <td className="numeric">{entry.divergence ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* The reason is identical for every row, so it is stated once. Repeating
          the same paragraph four times inside a table makes the table
          unreadable and says nothing the first one did not. */}
      <p className="document__note">
        <Badge kind="out-of-range">{t('val.not-validated')}</Badge>{' '}
        <strong>{t('val.note-lead')}</strong> {t('val.note')}
      </p>
      <CitationLink href="https://pubmed.ncbi.nlm.nih.gov/1588504/">
        {t('val.varvel-citation')}
      </CitationLink>

      <h2>{t('val.benchmarks-heading')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('val.col-benchmark')}</th><th>{t('val.col-expected')}</th><th>{t('val.col-observed')}</th>
            <th>{t('val.col-tolerance')}</th><th>{t('val.col-result')}</th>
          </tr>
        </thead>
        <tbody>
          {report.benchmarks.map((benchmark) => (
            <tr key={benchmark.id}>
              <td>{benchmark.name}<br /><span className="field__hint">{benchmark.citation}</span></td>
              <td className="numeric">{benchmark.expected}</td>
              <td className="numeric">{benchmark.observed}</td>
              <td>{benchmark.tolerance}</td>
              <td>
                <Badge kind={benchmark.passes ? 'default' : 'out-of-range'}>
                  {t(benchmark.passes ? 'val.pass' : 'val.fail')}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>{t('val.face-heading')}</h2>
      <p>
        {t('val.face', { reviewers: report.faceValidity.reviewers, required: report.faceValidity.required })}{' '}
        {report.faceValidity.status}
      </p>

      <h2>{t('val.unvalidated-heading')}</h2>
      <ul>
        {report.unvalidated.map((entry) => (
          <li key={entry.item}><strong>{entry.item}.</strong> {entry.reason}</li>
        ))}
      </ul>

      <h2>{t('val.reproduce-heading')}</h2>
      <p>{report.reproduce}</p>

      <h2>{t('val.checked-heading')}</h2>
      <p>
        {t('val.checked', { confirmed: confirmedCount().confirmed, total: confirmedCount().total })}{' '}
        <a href="/verification-queue">{t('val.checked-link')}</a>{t('val.checked-after')}
      </p>
      <table>
        <thead>
          <tr>
            <th>{t('val.col-constant')}</th><th className="numeric">{t('val.col-value')}</th>
            <th>{t('val.col-source')}</th><th>{t('val.col-checked')}</th>
          </tr>
        </thead>
        <tbody>
          {VERIFIED_CONSTANTS.map((constant) => (
            <tr key={constant.symbol}>
              <td><code>{constant.symbol}</code><br /><span className="field__hint">{constant.note}</span></td>
              <td className="numeric">{constant.value} {constant.units}</td>
              <td>{requireSource(constant.sourceId).publication} {requireSource(constant.sourceId).year}</td>
              <td>
                <Badge kind={constant.status === 'confirmed' ? 'default' : 'out-of-range'}>
                  {t(constant.status === 'confirmed' ? 'val.read-in-source' : 'val.not-checked')}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>{t('val.sources-heading')}</h2>
      <p>{t('val.sources')}</p>
      <p className="field__hint">{t('val.sources-hint')}</p>
      {sourcesByInitial().map((group) => (
        <Disclosure
          key={group.initial}
          className="disclosure--group"
          summary={group.initial}
          meta={t('val.source-count', { count: group.sources.length })}
        >
          {group.sources.map((source) => (
            <Disclosure key={source.id} summary={formatSource(source)}>
              <p>{source.usedFor}</p>
              {source.pmid && (
                <CitationLink href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`}>
                  {t('val.pubmed')}
                </CitationLink>
              )}
            </Disclosure>
          ))}
        </Disclosure>
      ))}
    </>
  );
}

/**
 * The bibliography, filed by the first author's surname.
 *
 * 397 sources rendered as a flat list of three-element blocks was most of an
 * 84,000-pixel page, and a reader who wanted one paper had no way to reach it.
 * The citation is the summary and what this project took from the paper is the
 * detail behind it, which is the same shape the limitations register uses.
 */
function sourcesByInitial(): { initial: string; sources: readonly (typeof SOURCES)[number][] }[] {
  const groups = new Map<string, (typeof SOURCES)[number][]>();
  for (const source of [...SOURCES].sort((a, b) => a.authors.localeCompare(b.authors))) {
    // The field is `Surname A, Surname B, et al`, so the first character is the
    // first author's initial letter. A non-letter is filed under `#` rather than
    // silently creating a group named after a bracket.
    const first = source.authors.trim().charAt(0).toUpperCase();
    const initial = /[A-Z]/.test(first) ? first : '#';
    const bucket = groups.get(initial) ?? [];
    bucket.push(source);
    groups.set(initial, bucket);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([initial, sources]) => ({ initial, sources }));
}
