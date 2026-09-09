import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the circle-system-rebreathing lesson.
 *
 * The absorbent exhausts at tick 1,800. The capnogram assessment is wanted
 * within 30 seconds, a fresh-gas flow of at least 10 L/min within 60 and BEFORE
 * the definitive correction, and the absorbent replacement within 90.
 *
 * The error path is the temporising one. It reads the capnogram correctly, opens
 * the fresh gas to 10 L/min -- and stops there, never replacing the absorbent.
 * The bridge is real: the modelled inspired carbon dioxide falls from 8.0 to
 * 2.86 mmHg. It is also not a fix, and 2.86 is where it stays for the rest of
 * the case.
 *
 * The recovery path is that transcript with the replacement added at tick 2,600,
 * inside the 90-second window, and the inspired carbon dioxide reaches zero.
 */

const ASSESS = (tick: number): LearnerAction =>
  ({ tick, type: 'breathing-circuit', payload: { action: 'assess-capnogram' } });
const BRIDGE = (tick: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { freshGasFlowLPerMin: 10 } });
const REPLACE = (tick: number): LearnerAction =>
  ({ tick, type: 'breathing-circuit', payload: { action: 'replace-absorbent' } });

/** Recognised and bridged, and the absorbent never changed. */
const bridgedNotFixed: readonly LearnerAction[] = [ASSESS(1900), BRIDGE(2000)];

export const CIRCLE_SYSTEM_REBREATHING_FIXTURES = {
  scenarioId: 'circle-system-rebreathing', contentVersion: '0.1.0',
  seed: 5133, ticks: 5400,

  /** The rising inspiratory baseline is never read. */
  noAction: [] as readonly LearnerAction[],

  /** Assess at 10 seconds, bridge at 20, replace at 40. */
  expert: [ASSESS(1900), BRIDGE(2000), REPLACE(2200)] as readonly LearnerAction[],

  /** The bridge held indefinitely in place of the repair. */
  commonError: bridgedNotFixed,

  /** The same transcript, with the absorbent replaced inside the window. */
  recovery: [...bridgedNotFixed, REPLACE(2600)] as readonly LearnerAction[],
} as const;
