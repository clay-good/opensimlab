/**
 * The informational routes: the validation report, the governance dashboard, the
 * limitations register, and the privacy statement.
 *
 * They are generated from the same records the build gate and the tests read, so
 * a document cannot claim something the code does not do.
 */

import { useState } from 'react';
import { Badge, Button, CitationLink, Panel, SiteBar } from '@platform/ui';
import { buildValidationReport } from '@platform/docs/validation-report';
import { EDITORIAL_BOARD, HONEST_STATUS, reviewableItems } from '@platform/governance/records';
import { reportCoverage } from '@platform/governance/review-gate';
import { LIMITATIONS } from '@platform/docs/limitations';
import { SOURCES, formatSource, requireSource } from '@platform/docs/sources';
import { VERIFIED_CONSTANTS, confirmedCount } from '@platform/docs/verified-constants';
import { PRIVACY_CLAIMS } from '@platform/docs/privacy-claims';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { routeFor } from './routes';
import {
  importPracticeHistory,
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
  { href: '/privacy', label: 'Privacy' },
  { href: '/content-review', label: 'Review the content' },
];

export function DocumentRoute({ path }: { path: string }) {
  const metadata = routeFor(path);
  return (
    <div className="document">
      {/* The same bar every other surface carries, so navigation cannot drift
          between the trust documents and the simulator. */}
      <SiteBar current={path} extra={DOCUMENT_EXTRAS} />

      <main className="reading" id="main">
        <h1>{metadata?.heading ?? 'Document'}</h1>
        {path === '/validation' && <ValidationBody />}
        {path === '/governance' && <GovernanceBody />}
        {path === '/limitations' && <LimitationsBody />}
        {path === '/privacy' && <PrivacyBody />}
      </main>

      <footer className="document__foot">
        <a href="/">Back to the front page</a>
        <a href="/about">About Open Sim Lab</a>
        <a href="/anesthesia">Open the simulator</a>
      </footer>
    </div>
  );
}

function ValidationBody() {
  const report = buildValidationReport();
  return (
    <>
      <p className="field__hint">
        Engine {report.engineVersion} · model set {report.modelSetRevision}
      </p>

      <h2>Predictive performance</h2>
      <p>
        Pharmacokinetic accuracy is quantified using the Varvel framework — bias, inaccuracy,
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
        transcription check or the independent verification required for publication.
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
        against the source&apos;s own record — an audit found the age-related MAC relation
        attributed to the wrong paper of the same authors, which is exactly the kind of error a
        citation nobody checks will carry indefinitely.
      </p>
      <p className="field__hint">
        A test refuses the build if any citation appears in the code without an entry here.
      </p>
      <ul>
        {SOURCES.map((source) => (
          <li key={source.id} className="document__source">
            <p><strong>{formatSource(source)}</strong></p>
            <p>{source.usedFor}</p>
            {source.pmid && (
              <CitationLink href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`}>
                Look this up on PubMed
              </CitationLink>
            )}
          </li>
        ))}
      </ul>
    </>
  );
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

      <h2>Review coverage</h2>
      <p className="numeric">
        {coverage.percentCurrent.toFixed(0)}% of {coverage.total} clinical content items are under
        current review.
      </p>
      <p className="field__hint">
        Every outstanding item is named below. No aggregate figure is reported without its list.
      </p>
      {/* Grouped by VERDICT, then by kind.
          Every one of these items is outstanding for the same reason, and the
          reason string carries the item's own id inside it — so grouping on the
          sentence grouped nothing, and printing it once per item, fourteen
          times, buried the only thing the list is for: which items they are. */}
      {[...new Set(coverage.outstanding.map((entry) => entry.verdict.status))].map((status) => {
        const matching = coverage.outstanding.filter((entry) => entry.verdict.status === status);
        const kinds = [...new Set(matching.map((entry) => entry.item.kind))];
        return (
          <section key={status} className="document__group">
            <p><strong>{VERDICT_SUMMARY[status] ?? status}</strong> — {matching.length} items.</p>
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
          </section>
        );
      })}

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

function LimitationsBody() {
  return (
    <>
      <p>
        Each entry names the specific simplification, the clinical situation where it would mislead
        you, and the correct clinical understanding. This is a register, not a disclaimer.
      </p>
      <ul>
        {LIMITATIONS.map((limitation) => (
          <li key={limitation.id}>
            {/* h2, not h3: this page's only preceding heading is the h1, and a
                jump from h1 to h3 is a heading-order violation. */}
            <h2>{limitation.simplification}</h2>
            <p><strong>Where it would mislead you:</strong> {limitation.whereItMisleads}</p>
            <p><strong>The correct understanding:</strong> {limitation.correctUnderstanding}</p>
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
  return (
    <>
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
        <li>The expiry of any goal-path suggestion you hide for 7 days.</li>
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
        <strong> Report a problem</strong>, Cloudflare Turnstile loads for abuse prevention. If you
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
      <p className="field__hint">
        No reflection, action list, physiology trace, patient data, identity, or overall score is
        included. The newest 50 summaries are kept; older ones fall away locally.
      </p>
      <label className="field" htmlFor="practice-history-import">
        <span className="field__label">Practice-history JSON to import</span>
        <textarea
          id="practice-history-import"
          aria-label="Practice-history JSON to import"
          className="field__input"
          rows={5}
          value={historyImport}
          onChange={(event) => setHistoryImport(event.target.value)}
          placeholder="Paste the contents of an Open Sim Lab practice-history export"
        />
        <span className="field__hint">Import is atomic: invalid or oversized JSON changes nothing.</span>
      </label>
      <div className="phase-nav">
        <Button onClick={downloadHistory}>Export practice history</Button>
        <Button onClick={() => {
          try {
            const history = importPracticeHistory(historyImport);
            setAttemptCount(history.length);
            setHistoryImport('');
            setHistoryMessage(`Imported. ${history.length} bounded attempt summaries are now stored.`);
          } catch (error) {
            setHistoryMessage(error instanceof Error ? error.message : 'Could not import that JSON.');
          }
        }}>Import practice history</Button>
        <Button variant="danger" onClick={() => {
          if (!confirm('Erase all private practice history from this device? This cannot be undone unless you exported it first.')) return;
          try { eraseOne(localStorage, PRACTICE_HISTORY_KEY); } catch { /* Storage may be blocked. */ }
          setAttemptCount(0);
          setHistoryMessage('Private practice history erased from this device.');
        }}>
          Erase practice history
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
