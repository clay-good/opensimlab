/**
 * Frame-time measurement and the long-task observer
 * (cockpit/patient-monitor → Frame budget is met on target hardware,
 * platform/delivery → The main thread stays free during simulation).
 *
 * The same code measures in the browser harness and in the continuous
 * integration budget gate, so what the gate enforces is what a device reports.
 */

import { percentile } from './sweep-renderer';

/** The frame budget: 16.7 ms at the 95th percentile over a 60 second run. */
export const FRAME_BUDGET_MS = 16.7;
export const FRAME_BUDGET_PERCENTILE = 95;
/** No main-thread task may exceed this while a scenario is running. */
export const LONG_TASK_BUDGET_MS = 50;
export const LONG_TASK_PERCENTILE = 95;
/** Input latency budget at 60x speed. */
export const INPUT_LATENCY_BUDGET_MS = 100;

export interface BudgetReport {
  readonly samples: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly maxMs: number;
  readonly longTasks: number;
  readonly longestTaskMs: number;
  readonly meetsFrameBudget: boolean;
  readonly meetsLongTaskBudget: boolean;
  /** Which rung of the degradation ladder the device settled on. */
  readonly quality: number;
}

/** Collects frame times and long tasks over a measurement run. */
export class FrameBudgetRecorder {
  private readonly frames: number[] = [];
  private readonly tasks: number[] = [];

  recordFrame(durationMs: number): void {
    this.frames.push(durationMs);
  }

  recordLongTask(durationMs: number): void {
    this.tasks.push(durationMs);
  }

  /** Attach a PerformanceObserver for long tasks where the browser supports it. */
  observeLongTasks(): () => void {
    if (typeof PerformanceObserver === 'undefined') return () => {};
    let observer: PerformanceObserver;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) this.recordLongTask(entry.duration);
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // Long-task observation is not available everywhere; the frame times still are.
      return () => {};
    }
    return () => observer.disconnect();
  }

  report(quality = 0): BudgetReport {
    const longest = this.tasks.length > 0 ? Math.max(...this.tasks) : 0;
    const p95 = percentile(this.frames, FRAME_BUDGET_PERCENTILE);
    return {
      samples: this.frames.length,
      p50Ms: percentile(this.frames, 50),
      p95Ms: p95,
      p99Ms: percentile(this.frames, 99),
      maxMs: this.frames.length > 0 ? Math.max(...this.frames) : 0,
      longTasks: this.tasks.length,
      longestTaskMs: longest,
      meetsFrameBudget: p95 <= FRAME_BUDGET_MS,
      meetsLongTaskBudget: percentile(this.tasks, LONG_TASK_PERCENTILE) <= LONG_TASK_BUDGET_MS,
      quality,
    };
  }

  reset(): void {
    this.frames.length = 0;
    this.tasks.length = 0;
  }
}

/**
 * The degradation ladder, in the order the change's design document declares it
 * (openspec/changes/mvp-anesthesia-alpha/design.md → Risks).
 *
 * If the budget fails, these are applied IN ORDER and where the device lands is
 * recorded. Falling off the bottom means the architecture is revised, not that
 * the budget is quietly relaxed.
 */
export const DEGRADATION_LADDER = [
  {
    rung: 1,
    id: 'reduce-trace-sample-density',
    description: 'Reduce trace sample density before rendering: draw one sample per column '
      + 'instead of the column\'s min and max.',
  },
  {
    rung: 2,
    id: 'lower-render-rate',
    description: 'Halve the render rate to 30 frames per second while the solver continues at '
      + 'the full 100 ms tick.',
  },
  {
    rung: 3,
    id: 'reduce-trace-count',
    description: 'Reduce the trace count to the three the active scenario declares primary. '
      + 'Traces are never reduced below three.',
  },
] as const;

/** A recorded measurement, committed so the result is auditable. */
export interface DeviceMeasurement {
  readonly device: string;
  readonly viewportCssPx: string;
  readonly devicePixelRatio: number;
  readonly traceCount: number;
  readonly solverRunning: boolean;
  readonly durationSeconds: number;
  readonly report: BudgetReport;
  /** Which rung of the ladder the device settled on, or 0 for none needed. */
  readonly ladderRung: number;
  readonly notes: string;
}
