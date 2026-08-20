/**
 * The informational routes: the validation report, the governance dashboard, the
 * limitations register, and the privacy statement.
 *
 * They are generated from the same records the build gate and the tests read, so
 * a document cannot claim something the code does not do.
 */

import { Badge, CitationLink, Panel } from '@platform/ui';
import { buildValidationReport } from '@platform/docs/validation-report';
import { EDITORIAL_BOARD, HONEST_STATUS, reviewableItems } from '@platform/governance/records';
import { reportCoverage } from '@platform/governance/review-gate';
import { LIMITATIONS } from '@platform/docs/limitations';
import { PRIVACY_CLAIMS } from '@platform/docs/privacy-claims';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { routeFor } from './routes';

export function DocumentRoute({ path }: { path: string }) {
  const metadata = routeFor(path);
  return (
    <main className="reading" id="main">
      <h1>{metadata?.heading ?? 'Document'}</h1>
      {path === '/validation' && <ValidationBody />}
      {path === '/governance' && <GovernanceBody />}
      {path === '/limitations' && <LimitationsBody />}
      {path === '/privacy' && <PrivacyBody />}
      <p><a href="/">Back to the Open Sim Lab front page</a></p>
    </main>
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
              <td colSpan={4}><Badge kind="out-of-range">Not validated</Badge> {entry.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
        The list below is every outstanding item by name. No aggregate figure is reported without it.
      </p>
      <ul>
        {coverage.outstanding.map((entry) => (
          <li key={`${entry.item.kind}-${entry.item.id}`}>
            <code>{entry.item.kind}</code> <strong>{entry.item.id}</strong> —{' '}
            {'reason' in entry.verdict ? entry.verdict.reason : entry.verdict.status}
          </li>
        ))}
      </ul>

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
  return (
    <>
      <p>
        Using Open Sim Lab is unobservable. There is no login, no account, no server, no analytics
        and no telemetry. This is a property of the architecture, not a promise: there is nothing to
        turn off, because there is nothing there.
      </p>
      <h2>What is stored, and where</h2>
      <ul>
        <li>Your preferences, in this browser&apos;s local storage on this device.</li>
        <li>Your acknowledgement of the not-for-clinical-use statement, in the same place.</li>
        <li>Session transcripts, if you save them, in the same place.</li>
      </ul>
      <p>Nothing else, and nothing anywhere else.</p>

      <h2>What leaves the device</h2>
      <p>
        Nothing, unless you deliberately export a file and send it somewhere yourself. There is no
        upload, no share link, and no cloud destination anywhere in the application.
      </p>

      <h2>What the host necessarily sees</h2>
      <p>
        The static host serving these files sees requests for those files and the network address
        they came from, as any web server does. It retains no per-request identity and stores no
        state about you. After the first load the application makes no further requests at all.
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
