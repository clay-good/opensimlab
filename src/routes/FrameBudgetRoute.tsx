/**
 * The frame-budget harness (mvp-anesthesia-alpha tasks 2.2 to 2.5).
 *
 * Renders five simultaneous traces with a sweep and an erase bar, optionally with
 * the solver running in its worker, and measures the 95th-percentile frame time
 * over a 60-second run. It is the same measurement the continuous integration
 * budget gate enforces, so what the gate checks is what a device reports.
 *
 * This page exists to be opened ON THE REFERENCE DEVICE — a mid-range 2020
 * Android handset, physical hardware, not an emulator — and the result committed.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Panel, SegmentedControl, Toggle } from '@platform/ui';
import { WaveformCanvas } from '@platform/ui/monitor';
import {
  DEGRADATION_LADDER, FRAME_BUDGET_MS, FRAME_BUDGET_PERCENTILE, FrameBudgetRecorder,
  LONG_TASK_BUDGET_MS, type BudgetReport,
} from '@platform/render/frame-budget';
import type { QualityLevel } from '@platform/render/sweep-renderer';
import { WaveformEngine, restingDrive } from '@anesthesia/waveforms';
import { trackConfigs, TRACKS } from '@anesthesia/ui/tracks';
import { NEUTRAL, TRACE } from '@platform/tokens/tokens';
import { SAMPLE_RATE_HZ, SIGNAL_RANGE } from '@anesthesia/waveforms/types';

const MEASUREMENT_SECONDS = 60;

export function FrameBudgetRoute() {
  const [running, setRunning] = useState(false);
  const [solverRunning, setSolverRunning] = useState(true);
  const [quality, setQuality] = useState<QualityLevel>(0);
  const [report, setReport] = useState<BudgetReport | null>(null);
  const [remaining, setRemaining] = useState(MEASUREMENT_SECONDS);
  const [blocks, setBlocks] = useState<{ trackId: string; samples: Float32Array }[]>([]);

  const recorder = useRef(new FrameBudgetRecorder());
  const engine = useRef(new WaveformEngine({ seed: 1, tickSeconds: 0.1 }));

  /**
   * Five traces. The four the module renders plus a fifth, so the measurement
   * matches the specification's "five simultaneous traces" rather than four.
   */
  const tracks = useMemo(() => {
    const base = trackConfigs(false, new Set());
    return [
      ...base,
      {
        id: 'depth', color: TRACE.neuro.line, sampleRateHz: SAMPLE_RATE_HZ.pleth,
        min: SIGNAL_RANGE.pleth.min, max: SIGNAL_RANGE.pleth.max, dash: [8, 4],
      },
    ];
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const stopObserver = recorder.current.observeLongTasks();
    // The solver's tick, driven at the real 100 ms rate.
    const tick = setInterval(() => {
      if (!solverRunning) return;
      const frame = engine.current.tick(restingDrive());
      setBlocks([
        { trackId: 'ecg', samples: frame.ecg.samples },
        { trackId: 'arterial', samples: frame.arterial.samples },
        { trackId: 'capno', samples: frame.capno.samples },
        { trackId: 'pleth', samples: frame.pleth.samples },
        { trackId: 'depth', samples: frame.pleth.samples },
      ]);
    }, 100);

    const countdown = setInterval(() => setRemaining((value) => Math.max(value - 1, 0)), 1000);
    const finish = setTimeout(() => {
      setRunning(false);
      setReport(recorder.current.report(quality));
    }, MEASUREMENT_SECONDS * 1000);

    return () => {
      clearInterval(tick);
      clearInterval(countdown);
      clearTimeout(finish);
      stopObserver();
    };
  }, [running, solverRunning, quality]);

  const start = useCallback(() => {
    recorder.current.reset();
    setReport(null);
    setRemaining(MEASUREMENT_SECONDS);
    setRunning(true);
  }, []);

  const onFrame = useCallback((ms: number) => recorder.current.recordFrame(ms), []);

  return (
    <main className="reading" id="main" style={{ maxInlineSize: '90ch' }}>
      <h1>Frame budget harness</h1>
      <p>
        Five simultaneous traces with a sweep and an erase bar, measured over{' '}
        {MEASUREMENT_SECONDS} seconds. The budget is a 95th-percentile frame time under{' '}
        {FRAME_BUDGET_MS} ms, with no main-thread task over {LONG_TASK_BUDGET_MS} ms.
      </p>
      <p className="field__hint">
        Open this on the reference device — a mid-range 2020 Android handset, physical hardware,
        not an emulator — and commit the result to <code>docs/measurements/</code>.
      </p>

      <Panel title="Run">
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <Toggle
            checked={solverRunning}
            onChange={setSolverRunning}
            label="Run the solver alongside rendering"
          />
          <SegmentedControl<QualityLevel>
            label="Degradation ladder rung"
            value={quality}
            onChange={setQuality}
            options={[
              { value: 0, label: 'Full', srLabel: 'Full quality' },
              { value: 1, label: 'Rung 1', srLabel: 'Rung one: reduced sample density' },
              { value: 2, label: 'Rung 2', srLabel: 'Rung two: further reduced density and half frame rate' },
            ]}
          />
          <div>
            <Button variant="primary" onClick={start} disabled={running}>
              {running ? `Measuring… ${remaining}s` : 'Start a 60-second measurement'}
            </Button>
          </div>
        </div>
      </Panel>

      <div style={{ background: NEUTRAL.void, borderRadius: 'var(--radius-panel)' }}>
        <WaveformCanvas
          tracks={tracks}
          blocks={blocks}
          reducedMotion={false}
          height={360}
          onFrame={onFrame}
          quality={quality}
        />
      </div>
      <p className="field__hint">
        Traces: {TRACKS.map((track) => track.label).join(', ')}, plus a fifth for the measurement.
      </p>

      {report && (
        <Panel title="Result">
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)' }}>
            <dt className="field__label">Samples</dt><dd className="numeric">{report.samples}</dd>
            <dt className="field__label">Median</dt><dd className="numeric">{report.p50Ms.toFixed(2)} ms</dd>
            <dt className="field__label">{FRAME_BUDGET_PERCENTILE}th percentile</dt>
            <dd className="numeric">{report.p95Ms.toFixed(2)} ms</dd>
            <dt className="field__label">99th percentile</dt><dd className="numeric">{report.p99Ms.toFixed(2)} ms</dd>
            <dt className="field__label">Worst frame</dt><dd className="numeric">{report.maxMs.toFixed(2)} ms</dd>
            <dt className="field__label">Long tasks</dt>
            <dd className="numeric">{report.longTasks} (worst {report.longestTaskMs.toFixed(0)} ms)</dd>
          </dl>
          <Badge kind={report.meetsFrameBudget ? 'default' : 'out-of-range'}>
            {report.meetsFrameBudget ? 'Frame budget met' : 'Frame budget MISSED'}
          </Badge>{' '}
          <Badge kind={report.meetsLongTaskBudget ? 'default' : 'out-of-range'}>
            {report.meetsLongTaskBudget ? 'Long-task budget met' : 'Long-task budget MISSED'}
          </Badge>
          <pre className="field__hint" style={{ overflowX: 'auto' }}>
            {JSON.stringify({
              devicePixelRatio: window.devicePixelRatio,
              viewport: `${window.innerWidth}x${window.innerHeight}`,
              userAgentPlatform: navigator.platform,
              solverRunning,
              quality,
              report,
            }, null, 2)}
          </pre>
        </Panel>
      )}

      <Panel title="If the budget fails">
        <p>
          Apply these in order and record where the device lands. If it fails at the bottom of the
          ladder, the architecture is revised rather than the budget quietly relaxed.
        </p>
        <ol>
          {DEGRADATION_LADDER.map((rung) => (
            <li key={rung.id}><strong>Rung {rung.rung}.</strong> {rung.description}</li>
          ))}
        </ol>
      </Panel>
    </main>
  );
}
