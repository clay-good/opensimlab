/**
 * The trace and tile configuration for the anaesthesia monitor.
 *
 * Trace colours come from the five design-system tokens and are never redefined
 * locally. Colour is never the only channel: each trace carries a persistent text
 * label and a distinct line style.
 */

import { SIGNAL_RANGE, type SignalId } from '@anesthesia/waveforms/types';
import { SAMPLE_RATE_HZ } from '@anesthesia/waveforms/types';
import type { TrackConfig } from '@platform/render/sweep-renderer';
import { TRACE, TRACE_COLORBLIND_SAFE, type TraceId } from '@platform/tokens/tokens';
import { FIELDS, type StateField } from '@anesthesia/physiology';

export interface TrackDefinition {
  readonly signal: SignalId;
  readonly traceId: TraceId;
  readonly label: string;
  /** Distinct line style so the traces differ without colour. */
  readonly dash: readonly number[] | undefined;
  /** Whether this trace is one of the three the scenario declares primary. */
  readonly primary: boolean;
}

export const TRACKS: readonly TrackDefinition[] = [
  { signal: 'ecg', traceId: 'ecg', label: 'ECG II', dash: undefined, primary: true },
  { signal: 'arterial', traceId: 'arterial', label: 'ART', dash: undefined, primary: false },
  { signal: 'capno', traceId: 'capno', label: 'CO₂', dash: [6, 3], primary: true },
  // The plethysmogram carries the pulse oximetry hue, which is `--spo2`.
  { signal: 'pleth', traceId: 'spo2', label: 'PLETH', dash: [2, 2], primary: true },
];

export function trackConfigs(
  colorblindSafe: boolean,
  artifacts: ReadonlySet<string>,
  limitToPrimary = false,
): TrackConfig[] {
  return TRACKS
    .filter((track) => !limitToPrimary || track.primary)
    .map((track) => ({
      id: track.signal,
      color: colorblindSafe ? TRACE_COLORBLIND_SAFE[track.traceId] : TRACE[track.traceId].line,
      sampleRateHz: SAMPLE_RATE_HZ[track.signal],
      min: SIGNAL_RANGE[track.signal].min,
      max: SIGNAL_RANGE[track.signal].max,
      ...(track.dash ? { dash: track.dash } : {}),
      artifact: artifacts.has(track.signal),
    }));
}

/**
 * The tile column. The parameter set is chosen so a learner practises with what
 * the ASA Standards for Basic Anesthetic Monitoring require to be continually
 * evaluated: oxygenation, ventilation, circulation and temperature.
 */
export interface TileDefinition {
  readonly field: StateField;
  readonly name: string;
  readonly traceToken: string;
  readonly lowLimit?: number;
  readonly highLimit?: number;
  /** Which ASA category this parameter satisfies. */
  readonly asaCategory: 'oxygenation' | 'ventilation' | 'circulation' | 'temperature' | 'other';
  /** Why the value could be unmeasurable. */
  readonly invalidReason?: string;
}

export const TILES: readonly TileDefinition[] = [
  { field: 'heartRateBpm', name: 'HR', traceToken: '--ecg', lowLimit: 45, highLimit: 120, asaCategory: 'circulation', invalidReason: 'No organized rhythm' },
  { field: 'meanArterialMmHg', name: 'MAP', traceToken: '--arterial', lowLimit: 55, asaCategory: 'circulation', invalidReason: 'No pulsatile flow' },
  { field: 'etco2MmHg', name: 'EtCO₂', traceToken: '--capno', lowLimit: 20, highLimit: 55, asaCategory: 'ventilation' },
  { field: 'spo2Percent', name: 'SpO₂', traceToken: '--spo2', lowLimit: 90, asaCategory: 'oxygenation', invalidReason: 'Probe not reading' },
  { field: 'depthIndex', name: 'Depth', traceToken: '--neuro', lowLimit: 30, highLimit: 60, asaCategory: 'other' },
  { field: 'coreTemperatureC', name: 'Temp', traceToken: '--arterial', asaCategory: 'temperature' },
  { field: 'fio2', name: 'FiO₂', traceToken: '--spo2', asaCategory: 'oxygenation' },
];

/** The explainer that maps each parameter to the standard's four categories. */
export const ASA_MONITORING_EXPLAINER = {
  standard: 'ASA Standards for Basic Anesthetic Monitoring',
  revisionYear: 2020,
  categories: {
    oxygenation: 'Inspired oxygen concentration and blood oxygenation, evaluated continually.',
    ventilation: 'Adequacy of ventilation, evaluated continually, with end-tidal carbon dioxide '
      + 'confirming correct placement of a tracheal tube.',
    circulation: 'Continuous electrocardiogram, plus arterial pressure and heart rate at least '
      + 'every five minutes.',
    temperature: 'Temperature monitored when clinically significant changes are intended, '
      + 'anticipated, or suspected.',
  },
  /** The maximum non-invasive pressure interval the standard specifies. */
  nibpIntervalMaxMinutes: 5,
} as const;

export function tileUnit(field: StateField): string { return FIELDS[field].unit; }
export function tilePrecision(field: StateField): number { return FIELDS[field].precision; }
export function tileLabel(field: StateField): string { return FIELDS[field].label; }
