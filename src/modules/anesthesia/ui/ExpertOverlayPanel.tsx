/**
 * The expert overlay, drawn (learning/deliberate-practice → expert overlay).
 *
 * The learner's trace and the reference run's on one axis per parameter, each
 * run's accepted actions marked, and one line per objective saying when each of
 * them met it. There is no figure anywhere saying how close the two were:
 * `tests/arch/expert-overlay-has-no-score.test.ts` holds the module this reads
 * from to that, and this panel prints only what that module produces.
 *
 * The reference run is replayed under THIS session's seed before anything is
 * drawn, because an assignment link or a blind draw gives a learner their own
 * patient. If the replay is no longer the same patient within the measured
 * tolerance, the panel says which parameter moved and draws nothing.
 */

import { useEffect, useState } from 'react';
import { Panel } from '@platform/ui';
import { PlotCanvas, type PlotSeries } from '@platform/ui/monitor';
import { TICKS_PER_SECOND, formatElapsed } from '@platform/clock/simulation-clock';
import type { HistorySample } from '@platform/session/session-store';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { Scenario } from '@anesthesia/engine';
import type { ReplayOptions, RunReplay } from '@anesthesia/debrief/replay';
import {
  expertOverlay, expertPathFor, type ExpertOverlay, type OverlayParameter,
} from '@anesthesia/debrief/expert-overlay';
import { t } from '@platform/i18n/messages';
import { objectiveFindings } from './Debrief';

export interface ExpertOverlayPanelProps {
  readonly scenario: Scenario;
  readonly history: readonly HistorySample[];
  readonly actions: readonly LearnerAction[];
  readonly replayOptions: ReplayOptions;
  readonly runReplay?: RunReplay;
  readonly learnerFindings: readonly {
    readonly objectiveId: string; readonly statement: string;
    readonly outcome: string; readonly atTick?: number;
  }[];
}

/** The axis label each parameter is drawn under. */
const UNITS: Readonly<Record<OverlayParameter, string>> = {
  heartRateBpm: 'bpm',
  meanArterialMmHg: 'mmHg',
  spo2Percent: '%',
  etco2MmHg: 'mmHg',
};

const COLORS: Readonly<Record<OverlayParameter, string>> = {
  heartRateBpm: '--vital-hr',
  meanArterialMmHg: '--vital-bp',
  spo2Percent: '--vital-spo2',
  etco2MmHg: '--vital-etco2',
};

export function ExpertOverlayPanel(props: ExpertOverlayPanelProps) {
  const [overlay, setOverlay] = useState<ExpertOverlay | null>(null);

  useEffect(() => {
    let cancelled = false;
    const build = async () => {
      // The 39 recorded paths are their own chunk, loaded when a debrief asks
      // for one. They are data for a panel that appears after a run, and the
      // cockpit budget is measured on what a learner downloads to start one.
      const { EXPERT_PATHS } = await import('@anesthesia/debrief/expert-paths.generated');
      if (cancelled) return;
      const path = expertPathFor(EXPERT_PATHS, props.scenario.metadata.id);
      if (path === undefined || props.runReplay === undefined) {
        setOverlay(expertOverlay({
          ticksPerSecond: TICKS_PER_SECOND,
          path,
          learnerHistory: props.history,
          learnerActions: props.actions,
          replayedHistory: undefined,
          learnerFindings: props.learnerFindings,
          expertFindings: [],
        }));
        return;
      }
      let replayed: { history: readonly HistorySample[]; events: readonly EngineEvent[] } | undefined;
      try {
        // The learner's own seed and region, never the fixture's: the two traces
        // have to be the same patient before either is worth looking at.
        replayed = await props.runReplay(path.expert as readonly LearnerAction[], {
          ...props.replayOptions,
          ticks: Math.max(props.replayOptions.ticks, path.ticks),
        });
      } catch {
        replayed = undefined;
      }
      if (cancelled) return;
      setOverlay(expertOverlay({
        ticksPerSecond: TICKS_PER_SECOND,
        path,
        learnerHistory: props.history,
        learnerActions: props.actions,
        replayedHistory: replayed?.history,
        learnerFindings: props.learnerFindings,
        expertFindings: replayed === undefined ? [] : objectiveFindings(
          props.scenario, replayed.history, 0, 0,
          path.expert as readonly LearnerAction[], replayed.events,
        ),
      }));
    };
    void build();
    return () => { cancelled = true; };
  }, [props.runReplay, props.history, props.actions, props.learnerFindings,
    props.replayOptions, props.scenario]);

  if (overlay === null) return null;

  const seconds = (tick: number) => tick / TICKS_PER_SECOND;
  const xMax = Math.max(
    1,
    ...props.history.map((sample) => seconds(sample.tick)),
    ...overlay.series.flatMap((series) => series.expert.map((sample) => seconds(sample.tick))),
  );

  return (
    <Panel title={t('overlay.title')}>
      <p className="field__hint">{t('overlay.intro')}</p>

      {overlay.withheld !== null ? (
        <p role="note">{overlay.withheld}</p>
      ) : overlay.series.map((series) => {
        const values = [
          ...series.learner.map((sample) => sample.vitals[series.parameter] ?? 0),
          ...series.expert.map((sample) => sample.vitals[series.parameter] ?? 0),
        ];
        const yMax = Math.max(1, ...values) * 1.1;
        const plot: PlotSeries[] = [
          {
            id: `${series.parameter}-learner`,
            label: t('overlay.yours'),
            colorToken: COLORS[series.parameter],
            unit: UNITS[series.parameter],
            points: series.learner.map((sample) => [seconds(sample.tick), sample.vitals[series.parameter] ?? 0] as [number, number]),
          },
          {
            id: `${series.parameter}-expert`,
            label: t('overlay.reference'),
            colorToken: COLORS[series.parameter],
            dashed: true,
            unit: UNITS[series.parameter],
            points: series.expert.map((sample) => [seconds(sample.tick), sample.vitals[series.parameter] ?? 0] as [number, number]),
          },
        ];
        return (
          <section key={series.parameter}>
            <h4>{t('overlay.parameter', { parameter: series.parameter, unit: UNITS[series.parameter] })}</h4>
            <PlotCanvas series={plot} height={120} xMax={xMax} yMax={yMax} />
          </section>
        );
      })}

      <h4>{t('overlay.marks')}</h4>
      <ul>
        {overlay.marks.map((mark) => (
          <li key={`${mark.by}-${mark.tick}-${mark.label}`}>
            <span className="numeric">{formatElapsed(mark.tick)}</span>{' — '}
            {t(mark.by === 'learner' ? 'overlay.mark-yours' : 'overlay.mark-reference', { action: mark.label })}
          </li>
        ))}
      </ul>

      {overlay.objectives.length > 0 && (
        <>
          <h4>{t('overlay.objectives')}</h4>
          <ul>
            {overlay.objectives.map((line) => (
              <li key={line.objectiveId}>
                {line.statement}
                <br />
                <span className="field__hint">
                  {line.learnerTick === null
                    ? t('overlay.objective-yours-none')
                    : t('overlay.objective-yours', { time: formatElapsed(line.learnerTick) })}
                  {' '}
                  {line.expertTick === null
                    ? t('overlay.objective-reference-none')
                    : t('overlay.objective-reference', { time: formatElapsed(line.expertTick) })}
                  {line.differenceSeconds !== null && (
                    ` ${t(line.differenceSeconds >= 0 ? 'overlay.objective-later' : 'overlay.objective-earlier', {
                      seconds: Math.abs(line.differenceSeconds),
                    })}`
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="reading__aside">{t('overlay.no-score')}</p>
    </Panel>
  );
}
