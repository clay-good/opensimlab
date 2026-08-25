/**
 * The page a program director reads before deciding whether to put this in front
 * of their students (platform/adoption).
 *
 * It answers the questions an institution actually asks, in the order they ask
 * them, and it is careful about the two claims that would be easiest to overstate
 * and worst to get wrong: what has been clinically reviewed, and whether any of
 * this counts toward a requirement. Both answers are currently "no".
 */

import { useState } from 'react';
import { Button, SiteBar } from '@platform/ui';
import { SCENARIOS, scenariosByDifficulty } from '@anesthesia/scenarios';
import { SITE_ORIGIN } from './routes';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { MAPPING_DISCLAIMER } from '@anesthesia/curriculum/frameworks';

/** Builds the link an instructor hands out. Nothing here contacts anything. */
function AssignmentBuilder() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0]!.metadata.id);
  const [guidance, setGuidance] = useState('coached');
  const [label, setLabel] = useState('');
  const [seed, setSeed] = useState('20260819');
  const [copied, setCopied] = useState(false);

  const params = new URLSearchParams();
  params.set('guidance', guidance);
  if (seed.trim()) params.set('seed', seed.trim());
  if (label.trim()) params.set('assignment', label.trim());
  const url = `${SITE_ORIGIN}/anesthesia/scenario/${scenarioId}?${params.toString()}`;

  return (
    <section className="educators__builder">
      <h3>Build an assignment link</h3>
      <p className="field__hint">
        Everyone who opens it gets the same scenario, the same guidance level and the same
        patient. No accounts, and nothing tells you who opened it — if you need to know who did
        the work, ask them to export the session and hand it in.
      </p>

      <label className="field">
        <span className="field__label">Scenario</span>
        <select className="select" value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
          {scenariosByDifficulty().map((scenario) => (
            <option key={scenario.metadata.id} value={scenario.metadata.id}>
              {scenario.metadata.title}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Guidance</span>
        <select className="select" value={guidance} onChange={(e) => setGuidance(e.target.value)}>
          <option value="guided">Guided — prompt them</option>
          <option value="coached">Coached — prompt rarely</option>
          <option value="unassisted">Unassisted — say nothing</option>
        </select>
      </label>

      <label className="field">
        <span className="field__label">Assignment name, shown in the briefing</span>
        <input
          className="field__input"
          value={label}
          placeholder="Week 3 — induction"
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="field__label">Patient seed</span>
        <input
          className="field__input numeric"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
        />
        <span className="field__hint">
          The same seed gives the same patient and the same random draws, so a cohort can be
          compared against itself.
        </span>
      </label>

      <p className="educators__link"><code>{url}</code></p>
      <Button
        variant="primary"
        onClick={() => {
          void navigator.clipboard?.writeText(url);
          setCopied(true);
        }}
      >
        {copied ? 'Copied' : 'Copy the link'}
      </Button>
    </section>
  );
}

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

export function EducatorsRoute() {
  return (
    <div className="document">
      <SiteBar current="/for-educators" extra={EDUCATOR_PAGES} />

      <main className="reading" id="main">
        <h1>For educators</h1>
        <p>
          Open Sim Lab is a free, browser-based anesthesia simulator with no accounts, learner
          telemetry, or remote practice history. An optional anonymous problem report sends only
          the fields it previews. This page is what a program needs to decide whether to use it.
        </p>

        <h2>Read this part first</h2>
        <p>
          <strong>No clinician has reviewed the clinical content in this build.</strong> The
          pharmacology is transcribed from the primary literature and machine-checked against it,
          the physiology is checked against published benchmarks, and neither has been signed off
          by a credentialed reviewer. The editorial board is empty and the governance page lists
          every outstanding item by name.
        </p>
        <p>
          <strong>Time spent here is not clinical time.</strong> It does not count toward any case
          requirement, clinical hour, or supervised experience for any accrediting or certifying
          body, and nothing it produces should be presented as though it did. No accrediting body
          has recognised it for any purpose.
        </p>
        <p>
          It supplements, and does not substitute for, mannequin-based simulation and supervised
          clinical practice. It teaches decision-making, pharmacology and pattern recognition. It
          teaches nothing about your hands.
        </p>

        <h2>What it is good for</h2>
        <ul>
          <li>
            The night before a first day in theatre: seeing what a drug does to a patient over
            the two minutes after it is given, rather than reading that it does.
          </li>
          <li>
            Pre-work before mannequin simulation, so scarce sim-centre time is spent on what a
            screen cannot teach.
          </li>
          <li>
            A shared reference case in a lecture: the same patient, on the projector, that
            everyone can then run themselves.
          </li>
          <li>
            Deliberate repetition of the decisions that are rare in clinic and consequential when
            they happen.
          </li>
        </ul>

        <h2>Assigning it to a cohort</h2>
        <AssignmentBuilder />

        <h2>Seeing what your students did</h2>
        <p>
          There is no learner dashboard because practice stays on the device. A
          learner exports their session as a file and hands it to you; you open it on the{' '}
          <a href="/review">review page</a>, which replays the engine over their recorded actions
          and shows you what happened and where the group is weak.
        </p>
        <p>
          This is a deliberate trade. A simulator a student can be watched in is one they perform
          in rather than learn in, and the confidentiality simulation standards ask for is easier
          to guarantee when the data was never collected. The cost is that you cannot know who
          opened a link.
        </p>

        <h2>Curriculum documentation</h2>
        <p>
          Every scenario is mapped to published framework domains and the mapping exports as CSV
          for your own documentation. {MAPPING_DISCLAIMER}
        </p>
        <p><a href="/curriculum">Open the curriculum coverage view</a></p>

        <h2>Running it on your own infrastructure</h2>
        <p>
          The build output is static files. Copy them to any web server, including one inside your
          network with no route to the internet, and everything works — install, offline use and
          every bundled scenario. There is no licence to buy, no procurement, no integration, and
          no dependency on this project staying online.
        </p>
        <p>
          The code is MIT licensed and the educational content is openly licensed per scenario, so
          you can adopt it, adapt it, fork it and add your own local protocols. If you do, the
          clinical review requirement is preserved in your fork, so your local content is signed
          too.
        </p>

        <h2>What we would want from you</h2>
        <p>
          The thing this project needs is not users. It is a clinician willing to say which parts
          are wrong. If you or a colleague would look at one scenario and tell us what a student
          would learn from it that they should not, that is worth more than any number of sessions
          run.
        </p>

        <h2>If you are willing to check it</h2>
        <p>
          There is a surface built for exactly this. It lists every clinical claim in the build,
          lets you say what is wrong at the point where you read it, and exports your notes as one
          file. It takes no account and nothing you write leaves your device.
        </p>
        <p><a href="/content-review">Open the clinical review view</a></p>

        <h2>The documents</h2>
        <ul>
          <li><a href="/validation">Validation report</a> — every benchmark, with what is not validated stated explicitly</li>
          <li><a href="/governance">Clinical governance</a> — who has reviewed what, and every outstanding item</li>
          <li><a href="/limitations">Limitations register</a> — what this deliberately does not model</li>
          <li><a href="/privacy">Privacy</a> — what is stored, which is only on the learner&rsquo;s own device</li>
        </ul>

        <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>

      <footer className="document__foot">
        <a href="/curriculum">Curriculum</a>
        <a href="/review">Review submissions</a>
        <a href="/">Back to the front page</a>
      </footer>
    </div>
  );
}
