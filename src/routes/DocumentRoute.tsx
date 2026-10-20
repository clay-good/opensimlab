/**
 * The informational routes: the validation report, the governance dashboard, the
 * review-status page, the corrections log, the pharmacology verification queue,
 * the limitations register, and the privacy statement.
 *
 * They are generated from the same records the build gate and the tests read, so
 * a document cannot claim something the code does not do.
 */

import { useState } from 'react';
import { Badge, Button, CitationLink, Disclosure, KeyFigure, Panel, SiteBar } from '@platform/ui';
import { buildValidationReport } from '@platform/docs/validation-report';
import { EDITORIAL_BOARD, HONEST_STATUS, reviewableItems } from '@platform/governance/records';
import { reportCoverage } from '@platform/governance/review-gate';
import { ReviewStatusBody } from '@platform/governance/ReviewStatusBody';
import { LimitationsBody } from '@platform/docs/LimitationsBody';
import { SOURCES, formatSource, requireSource } from '@platform/docs/sources';
import { VERIFIED_CONSTANTS, confirmedCount } from '@platform/docs/verified-constants';
import { PRIVACY_CLAIMS } from '@platform/docs/privacy-claims';
import { CorrectionsBody } from '@platform/docs/CorrectionsBody';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { APP_VERSION } from '@platform/governance/status';
import { FRAMEWORKS } from '@anesthesia/curriculum/frameworks';
import { t } from '@platform/i18n/messages';
import { TranslationStatusBody } from '@platform/i18n/TranslationStatusBody';
import { FRAMEWORK_REVIEW_MONTHS, overdueFrameworks } from '@platform/curriculum/framework-records';
import { VerificationQueueBody } from '@anesthesia/ui/VerificationQueueBody';
import { routeFor } from './routes';
import {
  importProgressFile,
  loadPracticeHistory,
  practiceHistoryExport,
  PRACTICE_HISTORY_KEY,
} from '@anesthesia/catalog/practice-history';
import { eraseOne } from '@platform/offline/local-data';

/**
 * What each gate verdict means, said once for the whole group rather than
 * repeated after every item id.
 */
const VERDICT_SUMMARY: Record<string, string> = {
  unsigned: 'No named reviewer. Clinical content cannot ship signed by nobody.',
  'version-drift': 'The content changed after it was reviewed, so the review no longer covers it.',
  overdue: 'The review has passed its re-review date.',
  incomplete: 'The review record is missing something it requires.',
  current: 'Under current review.',
};

/**
 * The trust documents the shared bar does not already carry.
 *
 * Validation and Governance are in the site bar for everyone, so only the two
 * that are specific to a reader working through the documents are added here.
 */
const DOCUMENT_EXTRAS: readonly { href: string; label: string }[] = [
  { href: '/review-status', get label() { return t('documents.review-status'); } },
  { href: '/corrections', get label() { return t('documents.corrections'); } },
  { href: '/privacy', get label() { return t('documents.privacy'); } },
  { href: '/content-review', get label() { return t('documents.content-review'); } },
];

export function DocumentRoute({ path }: { path: string }) {
  const metadata = routeFor(path);
  return (
    <div className="document">
      {/* The same bar every other surface carries, so navigation cannot drift
          between the trust documents and the simulator. */}
      <SiteBar current={path} extra={DOCUMENT_EXTRAS} />

      <main className="reading" id="main">
        <h1>{metadata?.heading ?? t('documents.heading-fallback')}</h1>
        {path === '/validation' && <ValidationBody />}
        {path === '/governance' && <GovernanceBody />}
        {path === '/review-status' && <ReviewStatusBody />}
        {path === '/corrections' && <CorrectionsBody />}
        {path === '/verification-queue' && <VerificationQueueBody />}
        {path === '/translation-status' && <TranslationStatusBody />}
        {path === '/limitations' && <LimitationsBody />}
        {path === '/privacy' && <PrivacyBody />}
      </main>

      <footer className="document__foot">
        <a href="/">{t('documents.footer.home')}</a>
        <a href="/about">{t('documents.footer.about')}</a>
        <a href="/anesthesia">{t('documents.footer.simulator')}</a>
      </footer>
    </div>
  );
}

function ValidationBody() {
  const report = buildValidationReport();
  const passing = report.benchmarks.filter((benchmark) => benchmark.passes).length;
  return (
    <>
      <p className="field__hint">
        Engine {report.engineVersion} · model set {report.modelSetRevision}
      </p>

      {/* The four numbers a reader came for, before the four sections that
          explain them. Two of them are zero, and a zero stated plainly at the top
          of a validation report is worth more than a page that makes someone read
          to the end to find it. */}
      <div className="figures">
        <KeyFigure
          value={`0 / ${report.varvel.length}`}
          label="Models validated against observed data"
          tone="warning"
        />
        <KeyFigure
          value={`${report.faceValidity.reviewers} / ${report.faceValidity.required}`}
          label="Clinician face-validity reviewers"
          tone="warning"
        />
        <KeyFigure value={`${passing} / ${report.benchmarks.length}`} label="Physiological benchmarks passing" />
        <KeyFigure value={SOURCES.length} label="Sources cited, each checked" />
      </div>

      <h2>Predictive performance</h2>
      <p>
        Pharmacokinetic accuracy is quantified using the Varvel framework: bias, inaccuracy,
        intra-individual variability, and drift of error over time.
      </p>
      <table>
        <thead>
          <tr><th>Model</th><th>MDPE</th><th>MDAPE</th><th>Wobble</th><th>Divergence</th></tr>
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
        <Badge kind="out-of-range">Not validated</Badge>{' '}
        <strong>No model here has been validated against observed data.</strong> No openly
        licensed dataset of measured concentrations has been obtained, so no bias, inaccuracy,
        variability or drift figure is reported for any of them. Agreement with another model is
        not a substitute for validation, and these columns stay empty until real observed data is
        analysed.
      </p>
      <CitationLink href="https://pubmed.ncbi.nlm.nih.gov/1588504/">
        Varvel, Donoho and Shafer, J Pharmacokinet Biopharm 1992
      </CitationLink>

      <h2>Physiological benchmarks</h2>
      <table>
        <thead>
          <tr><th>Benchmark</th><th>Expected</th><th>Observed</th><th>Tolerance</th><th>Result</th></tr>
        </thead>
        <tbody>
          {report.benchmarks.map((benchmark) => (
            <tr key={benchmark.id}>
              <td>{benchmark.name}<br /><span className="field__hint">{benchmark.citation}</span></td>
              <td className="numeric">{benchmark.expected}</td>
              <td className="numeric">{benchmark.observed}</td>
              <td>{benchmark.tolerance}</td>
              <td><Badge kind={benchmark.passes ? 'default' : 'out-of-range'}>{benchmark.passes ? 'Pass' : 'FAIL'}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Expert face validity</h2>
      <p>
        {report.faceValidity.reviewers} of {report.faceValidity.required} required reviewers.{' '}
        {report.faceValidity.status}
      </p>

      <h2>What is not validated</h2>
      <ul>
        {report.unvalidated.map((entry) => (
          <li key={entry.item}><strong>{entry.item}.</strong> {entry.reason}</li>
        ))}
      </ul>

      <h2>Reproducing these numbers</h2>
      <p>{report.reproduce}</p>

      <h2>Which numbers have actually been checked</h2>
      <p>
        {confirmedCount().confirmed} of {confirmedCount().total} recorded constants have been read
        from their source&apos;s own text. This is a narrow sampled register, not an exhaustive
        transcription check or the independent verification required for publication. Every
        parameter still awaiting that verification is on{' '}
        <a href="/verification-queue">the verification queue</a>, with how to check it.
      </p>
      <table>
        <thead>
          <tr><th>Constant</th><th className="numeric">Value</th><th>Source</th><th>Checked</th></tr>
        </thead>
        <tbody>
          {VERIFIED_CONSTANTS.map((constant) => (
            <tr key={constant.symbol}>
              <td><code>{constant.symbol}</code><br /><span className="field__hint">{constant.note}</span></td>
              <td className="numeric">{constant.value} {constant.units}</td>
              <td>{requireSource(constant.sourceId).publication} {requireSource(constant.sourceId).year}</td>
              <td>
                <Badge kind={constant.status === 'confirmed' ? 'default' : 'out-of-range'}>
                  {constant.status === 'confirmed' ? 'Read in primary source' : 'Not checked'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Every source, and what was taken from it</h2>
      <p>
        Each entry names what this simulator actually takes from that paper, so you can check the
        specific claim rather than the general topic. Every citation was confirmed field by field
        against the source&apos;s own record: an audit found the age-related MAC relation
        attributed to the wrong paper of the same authors, which is exactly the kind of error a
        citation nobody checks will carry indefinitely.
      </p>
      <p className="field__hint">
        A test refuses the build if any citation appears in the code without an entry here.
        Nothing below is hidden; it is filed by author so a bibliography of this size can be
        walked rather than scrolled.
      </p>
      {sourcesByInitial().map((group) => (
        <Disclosure
          key={group.initial}
          className="disclosure--group"
          summary={group.initial}
          meta={`${group.sources.length} ${group.sources.length === 1 ? 'source' : 'sources'}`}
        >
          {group.sources.map((source) => (
            <Disclosure key={source.id} summary={formatSource(source)}>
              <p>{source.usedFor}</p>
              {source.pmid && (
                <CitationLink href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`}>
                  Look this up on PubMed
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

function GovernanceBody() {
  const items = reviewableItems();
  const coverage = reportCoverage(items, new Date('2026-08-19T00:00:00Z'));
  return (
    <>
      <Badge kind="out-of-range">{HONEST_STATUS.headline}</Badge>
      <p>{HONEST_STATUS.detail}</p>

      <h2>The editorial board</h2>
      {EDITORIAL_BOARD.length === 0 ? (
        <p>
          The board is empty. Recruiting at least three credentialed clinician reviewers is in
          progress and has not completed. Until it does, nothing in this build is signed, no
          scenario is described as reviewed, and the release gate refuses to publish.
        </p>
      ) : (
        <ul>
          {EDITORIAL_BOARD.map((member) => (
            <li key={member.name}>
              <strong>{member.name}</strong>, {member.credential}, {member.institution}. Reviews:{' '}
              {member.scope.join(', ')}. Joined {member.joined}. Competing interests:{' '}
              {member.competingInterests}.
            </li>
          ))}
        </ul>
      )}

      <p>
        This page is about signatures. What each item is actually published as, meaning the
        maturity status the interface labels it with, is on <a href="/review-status">the
        review-status page</a>, item by item.
      </p>

      <h2>Review coverage</h2>
      <div className="figures">
        <KeyFigure
          value={`${coverage.percentCurrent.toFixed(0)}%`}
          label={`Of ${coverage.total} items under current review`}
          tone={coverage.percentCurrent > 0 ? 'neutral' : 'warning'}
        />
        <KeyFigure
          value={coverage.outstanding.length}
          label="Items outstanding, every one named below"
          tone="warning"
        />
      </div>
      <p className="field__hint">
        Every outstanding item is named below. No aggregate figure is reported without its list.
      </p>
      {/* Grouped by VERDICT, then by kind.
          Every one of these items is outstanding for the same reason, and the
          reason string carries the item's own id inside it, so grouping on the
          sentence grouped nothing, and printing it once per item, fourteen
          times, buried the only thing the list is for: which items they are. */}
      {[...new Set(coverage.outstanding.map((entry) => entry.verdict.status))].map((status) => {
        const matching = coverage.outstanding.filter((entry) => entry.verdict.status === status);
        const kinds = [...new Set(matching.map((entry) => entry.item.kind))];
        return (
          <Disclosure
            key={status}
            className="disclosure--group"
            summary={VERDICT_SUMMARY[status] ?? status}
            meta={`${matching.length} items`}
          >
            <dl className="document__items">
              {kinds.map((kind) => (
                <div key={kind}>
                  <dt><code>{kind}</code></dt>
                  <dd>
                    {matching
                      .filter((entry) => entry.item.kind === kind)
                      .map((entry) => entry.item.id)
                      .join(', ')}
                  </dd>
                </div>
              ))}
            </dl>
          </Disclosure>
        );
      })}

      <FrameworkReadings />

      <h2>Language</h2>
      <p>
        The interface and every scenario are in English. Clinical content is translated only with
        its own clinical review, which does not exist yet in English;{' '}
        <a href="/translation-status">the translation status page</a> shows what is translated and why.
      </p>

      <h2>Reporting a clinical error</h2>
      <p>
        Every content item carries a control that opens a public issue with the item id, the
        content version and the application version pre-filled. Reports are acknowledged within
        five working days and every correction is appended permanently to the corrections log.
      </p>
      <p>
        <a href="https://github.com/clay-good/opensimlab/issues/new" rel="noreferrer noopener">
          Open a clinical issue on the public repository
        </a>
      </p>
    </>
  );
}


/**
 * Framework readings go stale the way clinical reviews do, so they are listed
 * here beside them. Dated by the build, which the prerendered page and the
 * client share, so the list cannot change between the two.
 */
function FrameworkReadings() {
  const today = /^\d{4}-\d{2}-\d{2}/.exec(APP_VERSION)?.[0] ?? new Date().toISOString().slice(0, 10);
  const overdue = new Set(overdueFrameworks(FRAMEWORKS, today).map((framework) => framework.id));
  return (
    <>
      <h2>Framework readings</h2>
      <p>
        Curriculum mappings rest on this project&apos;s reading of each framework document. Every
        reading is re-checked against its source at least every {FRAMEWORK_REVIEW_MONTHS} months.{' '}
        <span className="numeric">{overdue.size}</span> of {FRAMEWORKS.length} are past their
        re-check date.
      </p>
      <ul>
        {FRAMEWORKS.map((framework) => (
          <li key={framework.id}>
            {framework.name} ({framework.body}): recorded {framework.recordedOn}, re-check by{' '}
            {framework.reviewBy}{overdue.has(framework.id) ? ' — overdue' : ''}.
          </li>
        ))}
      </ul>
    </>
  );
}




function PrivacyBody() {
  const [attemptCount, setAttemptCount] = useState(() => loadPracticeHistory().length);
  const [historyMessage, setHistoryMessage] = useState('');
  const [historyImport, setHistoryImport] = useState('');
  const downloadHistory = () => {
    const blob = new Blob([practiceHistoryExport(loadPracticeHistory())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'opensimlab-practice-history.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const importHistory = (mode: 'merge' | 'replace') => {
    try {
      const result = importProgressFile(historyImport, mode);
      setAttemptCount(result.history.length);
      setHistoryImport('');
      const moved = result.changes.map((change) =>
        `${change.scenarioId} ${change.objectiveId}: ${change.previous ?? t('history.none')} → ${change.current ?? t('history.none')}`);
      const counts = { added: result.added, duplicates: result.duplicates, stored: result.history.length };
      setHistoryMessage(`${t(mode === 'merge' ? 'history.merged' : 'history.replaced', counts)} `
        + (moved.length === 0 ? t('history.no-change')
          : t('history.changed', { count: moved.length, changes: moved.join('; ') })));
    } catch (error) {
      setHistoryMessage(error instanceof Error ? error.message : t('history.import-failed'));
    }
  };
  return (
    <>
      {/* The three facts a privacy page is read for. They are all in the prose
          below and always were, which is exactly the problem: a reader deciding
          whether to send their students here should not have to find them. */}
      <div className="figures">
        <KeyFigure value="0" label="Accounts, trackers, and analytics" />
        <KeyFigure value="0 bytes" label="Practice data that leaves your device" />
        <KeyFigure value="30 days" label="Maximum retention, and only for a report you choose to send" />
      </div>
      <p>
        Practicing in Open Sim Lab is unobservable. There is no login, account, analytics, learner
        telemetry, or remote practice history. The one deliberate exception is an anonymous
        problem report: nothing is sent unless you open its dialog, review the bounded fields, and
        choose to send it.
      </p>
      <h2>What is stored, and where</h2>
      <ul>
        <li>Your preferences, in this browser&apos;s local storage on this device.</li>
        <li>Your acknowledgement of the not-for-clinical-use statement, in the same place.</li>
        <li>The expiry of any goal-path or return suggestion you hide for 7 days.</li>
        <li>Your newest 50 bounded practice-attempt summaries, in the same place.</li>
        <li>Session transcripts, if you save them, in the same place.</li>
        <li>Offline application files in this browser&apos;s cache, plus local browser-client IDs
          mapped to release hashes so an update in one tab does not break another. These are not
          learner identifiers, contain no practice content, and are never transmitted. Closed-client
          records are removed after the browser confirms those clients have closed; a later update
          removes unused releases. Keeping older tabs open can retain more than one release on
          this device. Clearing this site&apos;s browser
          data removes the offline files and these records.</li>
      </ul>
      <p>To prepare for offline practice, let the offline download finish, then reload once while
        online. Browser storage eviction or clearing site data requires another download.</p>
      <p id="problem-reports">
        A problem report you deliberately send is kept in a private correction queue for at most
        30 days. Abuse-prevention counters are kept for at most 14 days. The client does not attach
        your account, email, cookies, browser identity, or device time. The optional note is text you
        supply, so please do not put sensitive information in it. Raw network addresses are not stored.
      </p>

      <h2>What leaves the device</h2>
      <p>
        Your simulation, tutor, debrief writing, and practice history do not leave. If you open
        <strong> Help us improve this</strong>, Cloudflare Turnstile loads for abuse prevention. If you
        then send, the previewed scenario/version, public practice context, category, and optional
        160-character note go to the isolated correction service. Recent simulated actions and a
        bounded patient/equipment snapshot are included only if you turn that option on and review
        the exact fields. Canceling sends no report.
      </p>

      <h2>Your private practice history</h2>
      <p>
        <strong>{attemptCount}</strong> bounded {attemptCount === 1 ? 'attempt summary is' : 'attempt summaries are'} stored on this device.
        Each contains only the scenario and content version, selected public goal, simulated
        duration, completion time, and objective outcome words.
      </p>
      <p>
        Progress never syncs. Exporting this file and importing it on another device is the only
        way it moves, and the exported file keeps each attempt&apos;s calendar day, not its time.
      </p>
      <p className="field__hint">
        No reflection, action list, physiology trace, patient data, identity, or overall score is
        included. The newest 50 summaries are kept; older ones fall away locally.
      </p>
      <label className="field" htmlFor="practice-history-import">
        <span className="field__label">{t('history.import-label')}</span>
        <textarea
          id="practice-history-import"
          aria-label={t('history.import-label')}
          className="field__input"
          rows={5}
          value={historyImport}
          onChange={(event) => setHistoryImport(event.target.value)}
          placeholder={t('history.import-placeholder')}
        />
        <span className="field__hint">{t('history.import-hint')}</span>
      </label>
      <div className="phase-nav">
        <Button onClick={downloadHistory}>{t('history.export')}</Button>
        <Button onClick={() => importHistory('merge')}>{t('history.merge')}</Button>
        <Button variant="ghost" onClick={() => {
          if (!confirm(t('history.replace-confirm'))) return;
          importHistory('replace');
        }}>{t('history.replace')}</Button>
        <Button variant="danger" onClick={() => {
          if (!confirm(t('history.erase-confirm'))) return;
          try { eraseOne(localStorage, PRACTICE_HISTORY_KEY); } catch { /* Storage may be blocked. */ }
          setAttemptCount(0);
          setHistoryMessage(t('history.erased'));
        }}>
          {t('history.erase')}
        </Button>
      </div>
      {historyMessage && <p role="status" className="field__hint">{historyMessage}</p>}

      <h2>What the host necessarily sees</h2>
      <p>
        The static host serving these files sees requests for those files and the network address
        they came from, as any web server does. It retains no per-request identity and stores no
        state about you. After the first load, ordinary practice makes no application API request;
        only the problem-report flow makes the declared requests above.
      </p>

      <h2>Each claim, and the test that enforces it</h2>
      <table>
        <thead><tr><th>Claim</th><th>Enforced by</th></tr></thead>
        <tbody>
          {PRIVACY_CLAIMS.map((claim) => (
            <tr key={claim.claim}>
              <td>{claim.claim}</td>
              <td><code>{claim.test}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
    </>
  );
}

export function DocumentPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <Panel title={title}>{children}</Panel>;
}
