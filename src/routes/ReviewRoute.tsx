/**
 * The instructor's review surface
 * (learning/curriculum → Instructor Mode Without Surveillance).
 *
 * A learner exports a session and hands it over; an instructor drops the files
 * here. There is no other way for an instructor to see anything, because there
 * is nowhere for a session to go on its own. That constraint is the point: a
 * simulator a student can be watched in is a simulator a student performs in
 * rather than learns in.
 *
 * Every number shown is RE-DERIVED by replaying the engine over the learner's
 * recorded inputs. Nothing is read from the file except those inputs.
 */

import { useCallback, useMemo, useState } from 'react';
import { Badge, Button, SiteBar } from '@platform/ui';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import {
  UnreadableTranscript, analyseTranscript, parseTranscript, summariseCohort,
  type TranscriptAnalysis,
} from '@anesthesia/debrief/analyse-transcript';
import { createReplayWorker, workerReplay } from '@anesthesia/debrief/replay-client';

const OUTCOME_LABEL: Record<string, string> = {
  met: 'Met',
  'partly-met': 'Partly met',
  'not-met': 'Not met',
  'not-exercised': 'Not exercised',
};

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

export function ReviewRoute() {
  const [analyses, setAnalyses] = useState<TranscriptAnalysis[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Re-derivation runs in the solver worker, which is the only place in this
  // build that constructs an engine.
  const runReplay = useMemo(() => workerReplay(createReplayWorker), []);

  const ingest = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const added: TranscriptAnalysis[] = [];
    const failed: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        added.push(await analyseTranscript(parseTranscript(text, file.name), file.name, runReplay));
      } catch (error) {
        failed.push(error instanceof UnreadableTranscript
          ? error.message
          : `${file.name} could not be read.`);
      }
    }
    setAnalyses((current) => [...current, ...added]);
    setErrors(failed);
  }, [runReplay]);

  const summary = summariseCohort(analyses);

  return (
    <div className="document">
      <SiteBar current="/review" extra={EDUCATOR_PAGES} />

      <main className="reading" id="main">
        <h1>Review submitted sessions</h1>
        <p>
          Drop the transcript files your learners exported. Everything is read and computed in
          this browser: the files are not uploaded, and this page makes no request to anything.
        </p>
        <p className="reading__aside">
          Each result below is produced by re-running the simulation engine over the learner&rsquo;s
          recorded inputs, not by reading a score out of the file. A transcript records what they
          did; what it means is derived here, the same way the learner&rsquo;s own debrief derived it.
        </p>

        <label className="review__drop">
          <span>Choose transcript files</span>
          <input
            type="file"
            accept="application/json,.json"
            multiple
            onChange={(event) => { void ingest(event.target.files); }}
          />
        </label>

        {errors.length > 0 && (
          <section>
            <h2>Files that could not be read</h2>
            <ul>{errors.map((message) => <li key={message}>{message}</li>)}</ul>
          </section>
        )}

        {analyses.length === 0 ? (
          <p className="field__hint">No sessions loaded yet.</p>
        ) : (
          <>
            <section>
              <h2>Where the group is strong, and where it is not</h2>
              <p className="field__hint">
                {analyses.length} session{analyses.length === 1 ? '' : 's'}, weakest objective
                first. There is no ranking of learners here and there will not be one: this is for
                deciding what to teach next.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Objective</th>
                    <th className="numeric">Met</th>
                    <th className="numeric">Partly</th>
                    <th className="numeric">Not met</th>
                    <th className="numeric">Not exercised</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
                    <tr key={row.objectiveId}>
                      <td>{row.statement}</td>
                      <td className="numeric">{row.met}</td>
                      <td className="numeric">{row.partly}</td>
                      <td className="numeric">{row.notMet}</td>
                      <td className="numeric">{row.notExercised}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section>
              <h2>Each session</h2>
              {analyses.map((analysis) => (
                <article key={analysis.label} className="review__session">
                  <h3>{analysis.label}</h3>
                  <p className="field__hint">
                    {analysis.scenarioTitle} · {analysis.simulatedMinutes.toFixed(1)} simulated
                    minutes · {analysis.actionCount} actions ·{' '}
                    {analysis.transcript.guidanceLevel} · engine{' '}
                    {analysis.transcript.versions.engine}
                  </p>
                  <ul>
                    {analysis.findings.map((finding) => (
                      <li key={finding.objectiveId}>
                        <Badge kind={finding.outcome === 'met' ? 'default' : 'out-of-range'}>
                          {OUTCOME_LABEL[finding.outcome] ?? finding.outcome}
                        </Badge>{' '}
                        {finding.statement}
                        <br />
                        <span className="field__hint">{finding.finding}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </section>

            <Button onClick={() => { setAnalyses([]); setErrors([]); }}>
              Clear these sessions
            </Button>
          </>
        )}

        <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>

      <footer className="document__foot">
        <a href="/for-educators">For educators</a>
        <a href="/curriculum">Curriculum</a>
        <a href="/">Back to the front page</a>
      </footer>
    </div>
  );
}
