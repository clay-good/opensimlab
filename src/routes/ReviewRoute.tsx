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
import { EDUCATOR_PAGES } from './educator-pages';
import { t, type MessageKey } from '@platform/i18n/messages';
import '@platform/i18n/messages-educator';
import '@platform/i18n/messages-session';

const OUTCOME_LABEL: Record<string, MessageKey> = {
  met: 'debrief.outcome-met',
  'partly-met': 'debrief.outcome-partly-met',
  'not-met': 'debrief.outcome-not-met',
  'not-exercised': 'debrief.outcome-not-exercised',
};

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
          : t('review.unreadable', { file: file.name }));
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
        <h1>{t('review.heading')}</h1>
        <p>{t('review.intro')}</p>
        <p className="reading__aside">{t('review.rederived')}</p>

        <label className="review__drop">
          <span>{t('review.choose')}</span>
          <input
            type="file"
            accept="application/json,.json"
            multiple
            onChange={(event) => { void ingest(event.target.files); }}
          />
        </label>

        {errors.length > 0 && (
          <section>
            <h2>{t('review.unreadable-heading')}</h2>
            <ul>{errors.map((message) => <li key={message}>{message}</li>)}</ul>
          </section>
        )}

        {analyses.length === 0 ? (
          <p className="field__hint">{t('review.empty')}</p>
        ) : (
          <>
            <section>
              <h2>{t('review.group-heading')}</h2>
              <p className="field__hint">{t('review.group-hint', { count: analyses.length })}</p>
              <table>
                <thead>
                  <tr>
                    <th>{t('review.col-objective')}</th>
                    <th className="numeric">{t('debrief.outcome-met')}</th>
                    <th className="numeric">{t('review.col-partly')}</th>
                    <th className="numeric">{t('debrief.outcome-not-met')}</th>
                    <th className="numeric">{t('debrief.outcome-not-exercised')}</th>
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
              <h2>{t('review.each-heading')}</h2>
              {analyses.map((analysis) => (
                <article key={analysis.label} className="review__session">
                  <h3>{analysis.label}</h3>
                  <p className="field__hint">
                    {t('review.session-meta', {
                      title: analysis.scenarioTitle,
                      minutes: analysis.simulatedMinutes.toFixed(1),
                      actions: analysis.actionCount,
                      guidance: analysis.transcript.guidanceLevel,
                      engine: analysis.transcript.versions.engine,
                    })}
                  </p>
                  <ul>
                    {analysis.findings.map((finding) => (
                      <li key={finding.objectiveId}>
                        <Badge kind={finding.outcome === 'met' ? 'default' : 'out-of-range'}>
                          {OUTCOME_LABEL[finding.outcome] ? t(OUTCOME_LABEL[finding.outcome]!) : finding.outcome}
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
              {t('review.clear')}
            </Button>
          </>
        )}

        <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>

      <footer className="document__foot">
        <a href="/for-educators">{t('sitebar.for-educators')}</a>
        <a href="/curriculum">{t('sitebar.curriculum')}</a>
        <a href="/">{t('documents.footer.home')}</a>
      </footer>
    </div>
  );
}
