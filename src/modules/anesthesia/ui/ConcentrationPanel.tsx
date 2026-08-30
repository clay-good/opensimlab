/**
 * The concentration panel (cockpit/pkpd-visualizer).
 *
 * Plots plasma against effect-site concentration for every active drug on a time
 * axis shared with the monitor and the log. Each drug gets its own vertical band
 * and its own units, so no axis ever mixes units.
 */

import { useMemo, useState } from 'react';
import { PlotCanvas, type PlotSeries } from '@platform/ui/monitor';
import { Badge, Button, EmptyState } from '@platform/ui';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { DrugConcentration } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { NOT_CLINICALLY_REVIEWED, NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { MODELS_BY_ID } from '@anesthesia/pharmacology/registry';

const DRUG_TOKENS: Record<string, string> = {
  propofol: '--neuro',
  remifentanil: '--capno',
};

const CONFIDENCE_LABEL: Record<DrugConcentration['confidence'], string> = {
  published: 'Published',
  'pending-check': 'Pending independent check',
  'out-of-range': 'Out of range',
  teaching: 'Teaching model',
};

const CONFIDENCE_KIND: Record<DrugConcentration['confidence'], 'default' | 'out-of-range' | 'teaching'> = {
  published: 'default',
  // Not yet checked is not a neutral state, so it does not get the neutral badge.
  'pending-check': 'teaching',
  'out-of-range': 'out-of-range',
  teaching: 'teaching',
};

export interface ConcentrationPanelProps {
  readonly history: readonly HistorySample[];
  readonly current: readonly DrugConcentration[];
  readonly tick: number;
  /** Time-to-peak-effect for each drug, in seconds, from the active model. */
  readonly timeToPeakSeconds: Readonly<Record<string, number>>;
  /**
   * Boluses given before the previous dose of the SAME drug peaked. Carrying the
   * drug id matters: a flat list of ticks would put the warning on every drug's
   * panel, including one the learner has not given at all.
   */
  readonly stacking: readonly { readonly tick: number; readonly drugId: string }[];
  readonly onExportCsv: () => void;
  readonly pendingCheck?: boolean;
}

export function ConcentrationPanel({
  history, current, tick, timeToPeakSeconds, stacking, onExportCsv, pendingCheck,
}: ConcentrationPanelProps) {
  const [cursorSeconds, setCursorSeconds] = useState<number | null>(null);
  const [openModelId, setOpenModelId] = useState<string | null>(null);
  const drugs = current.map((entry) => entry.drugId);

  const bands = useMemo(() => drugs.map((drugId) => {
    const plasma: [number, number][] = [];
    const effectSite: [number, number][] = [];
    for (const sample of history) {
      const entry = sample.concentrations.find((c) => c.drugId === drugId);
      if (!entry) continue;
      const seconds = sample.tick / TICKS_PER_SECOND;
      plasma.push([seconds, entry.plasma]);
      if (Number.isFinite(entry.effectSite)) effectSite.push([seconds, entry.effectSite]);
    }
    const entry = current.find((c) => c.drugId === drugId)!;
    const series: PlotSeries[] = [
      {
        id: `${drugId}-plasma`, label: 'Plasma', colorToken: DRUG_TOKENS[drugId] ?? '--text-secondary',
        points: plasma, unit: entry.unit,
      },
      {
        id: `${drugId}-effect`, label: 'Effect site', colorToken: DRUG_TOKENS[drugId] ?? '--text-secondary',
        dashed: true, points: effectSite, unit: entry.unit,
      },
    ];
    const yMax = Math.max(
      ...plasma.map(([, y]) => y), ...effectSite.map(([, y]) => y), 1,
    ) * 1.15;
    return { drugId, entry, series, yMax, plasma, effectSite };
  }), [drugs.join(','), history, current]);

  const xMax = Math.max(tick / TICKS_PER_SECOND, 60);
  const currentSeconds = tick / TICKS_PER_SECOND;

  if (bands.length === 0) {
    return <EmptyState title="No drug given yet">The plot appears with the first dose.</EmptyState>;
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      {bands.map((band) => {
        const rising = band.effectSite.length > 2
          && (band.effectSite[band.effectSite.length - 1]?.[1] ?? 0)
            > (band.effectSite[band.effectSite.length - 2]?.[1] ?? 0);
        const peakSeconds = timeToPeakSeconds[band.drugId];
        const model = MODELS_BY_ID.get(band.entry.modelId);
        const modelDetailsId = `model-details-${band.drugId}-${band.entry.modelId}`;
        return (
          <section key={band.drugId} aria-label={`${band.drugId} concentrations`}>
            <header style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <h3 className="panel__title" style={{ font: 'var(--type-subtitle)' }}>{band.drugId}</h3>
              <span className="vital-tile__unit">{band.entry.unit}</span>
              <Badge kind={CONFIDENCE_KIND[band.entry.confidence]}>
                {CONFIDENCE_LABEL[band.entry.confidence]}
              </Badge>
              <span className="field__hint model-detail__identity">Model: {band.entry.modelId}</span>
              {model && (
                <Button
                  className="model-detail__action"
                  variant="ghost"
                  aria-expanded={openModelId === band.entry.modelId}
                  aria-controls={modelDetailsId}
                  onClick={() => setOpenModelId((current) => (
                    current === band.entry.modelId ? null : band.entry.modelId
                  ))}
                >
                  Model details and source
                </Button>
              )}
              {/* The confidence badge already says "Pending independent check"
                  when that is the case, so a second badge saying it again is
                  noise. This one only fires for a model that is out of range AND
                  unchecked, where the badge above is showing the range problem. */}
              {pendingCheck && band.entry.confidence === 'out-of-range'
                && <Badge kind="teaching">Also pending independent check</Badge>}
            </header>

            {model && openModelId === band.entry.modelId && (
              <div id={modelDetailsId} className="reading__aside">
                <strong>{model.drugName}: {model.id}</strong>
                <p>{model.notes}</p>
                <p>
                  Source: {model.citation.authors}. {model.citation.title}.{' '}
                  <em>{model.citation.journal}</em> {model.citation.year}
                  {model.citation.volumePages ? `;${model.citation.volumePages}` : ''}.
                  {model.citation.pmid ? ` PMID ${model.citation.pmid}.` : ''}
                  {model.citation.doi ? ` DOI ${model.citation.doi}.` : ''}
                  {' '}Parameters: {model.citation.locator}.
                </p>
                <p>{model.citation.summary}</p>
              </div>
            )}

            <PlotCanvas series={band.series} height={140} cursorSeconds={cursorSeconds} xMax={xMax} yMax={band.yMax} />

            <div
              tabIndex={0}
              role="application"
              aria-label={`${band.drugId} concentration readout. Use the left and right arrow keys to move the cursor.`}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                const step = event.key === 'ArrowRight' ? 1 : -1;
                setCursorSeconds((previous) => {
                  const next = (previous ?? currentSeconds) + step;
                  return Math.min(Math.max(next, 0), currentSeconds);
                });
              }}
              style={{ marginBlockStart: 'var(--space-2)' }}
            >
              <ReadoutRow
                drugId={band.drugId}
                unit={band.entry.unit}
                seconds={cursorSeconds ?? currentSeconds}
                plasma={valueAt(band.plasma, cursorSeconds ?? currentSeconds)}
                effectSite={valueAt(band.effectSite, cursorSeconds ?? currentSeconds)}
              />
            </div>

            {peakSeconds !== undefined && (
              <p className="field__hint">
                Time to peak effect for this model is {peakSeconds.toFixed(0)} s after a bolus.
                {rising && ' The effect site is still rising: the last dose has not been fully expressed yet.'}
              </p>
            )}
            {(() => {
              const stacked = stacking.filter((entry) => entry.drugId === band.drugId);
              if (stacked.length === 0) return null;
              return (
                <p className="field__hint">
                  {stacked.length} {band.drugId} dose{stacked.length === 1 ? '' : 's'} given while the
                  effect site was still climbing. The debrief will raise this.
                </p>
              );
            })()}
          </section>
        );
      })}

      <Button onClick={onExportCsv}>Export this plot as a CSV file</Button>
      <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
    </div>
  );
}

function ReadoutRow({ drugId, unit, seconds, plasma, effectSite }: {
  drugId: string; unit: string; seconds: number; plasma: number | null; effectSite: number | null;
}) {
  return (
    <p className="field__hint numeric" aria-live="off">
      {drugId} at {seconds.toFixed(0)} s: plasma{' '}
      {plasma === null ? '--' : plasma.toFixed(2)} {unit}, effect site{' '}
      {effectSite === null ? '--' : effectSite.toFixed(2)} {unit}
    </p>
  );
}

function valueAt(points: readonly [number, number][], seconds: number): number | null {
  if (points.length === 0) return null;
  let best = points[0]!;
  for (const point of points) {
    if (Math.abs(point[0] - seconds) < Math.abs(best[0] - seconds)) best = point;
  }
  return best[1];
}

/**
 * The CSV export: time, drug, model id, confidence label, plasma and effect-site
 * concentration, with units in the header. Written locally, with no network request.
 */
export function concentrationCsv(history: readonly HistorySample[]): string {
  const lines = [
    `# ${NOT_FOR_CLINICAL_USE}`,
    `# ${NOT_CLINICALLY_REVIEWED}`,
    'time_s,drug,model_id,confidence,plasma,effect_site,unit',
  ];
  for (const sample of history) {
    for (const entry of sample.concentrations) {
      lines.push([
        (sample.tick / TICKS_PER_SECOND).toFixed(1),
        entry.drugId,
        entry.modelId,
        entry.confidence,
        entry.plasma.toFixed(4),
        Number.isFinite(entry.effectSite) ? entry.effectSite.toFixed(4) : '',
        entry.unit,
      ].join(','));
    }
  }
  return lines.join('\n');
}
