/**
 * The non-visual channel (platform/accessibility → Screen Reader Access To Live
 * Physiology, Waveforms have a non-visual equivalent).
 *
 * Continuously changing vitals reach assistive technology through a polite live
 * region that announces on clinically meaningful change, plus an on-demand
 * full-state summary — never by announcing every tick, which would flood it.
 */

import { FIELDS, type PatientState, type StateField } from '@anesthesia/physiology';
import { getRhythm } from '@anesthesia/waveforms/rhythms';
import type { RhythmId } from '@anesthesia/waveforms/types';
import { alphaForObstruction, NORMAL_ALPHA_DEGREES } from '@anesthesia/waveforms/capnogram';
import type { EngineAlarm } from '@platform/kernel/protocol';
import { tilesFor } from './tracks';

/**
 * Thresholds that count as a clinically meaningful change. A drift of one beat
 * per minute is not announced; crossing an alarm limit is.
 */
export const ANNOUNCE_THRESHOLDS: Partial<Record<StateField, readonly number[]>> = {
  spo2Percent: [95, 92, 90, 85, 80],
  meanArterialMmHg: [65, 55, 45],
  heartRateBpm: [45, 50, 100, 120, 140],
  etco2MmHg: [20, 25, 45, 55],
  coreTemperatureC: [38, 39],
  depthIndex: [30, 40, 60, 70],
  trainOfFourRatio: [0.1, 0.9],
};

/** Which side of each threshold a value sits on, as a comparable signature. */
export function thresholdSignature(state: Readonly<Record<string, number>>): string {
  const parts: string[] = [];
  for (const [field, thresholds] of Object.entries(ANNOUNCE_THRESHOLDS)) {
    const value = state[field];
    if (value === undefined || thresholds === undefined) continue;
    parts.push(`${field}:${thresholds.map((t) => (value < t ? '<' : '>')).join('')}`);
  }
  return parts.join('|');
}

export interface Announcement {
  readonly text: string;
  readonly severity: 'info' | 'warning' | 'critical';
}

/**
 * What to announce, given the previous and current state. Returns nothing when
 * no threshold was crossed, which is most ticks.
 */
export function announcementsFor(
  previous: Readonly<Record<string, number>> | null,
  current: Readonly<Record<string, number>>,
  alarms: readonly EngineAlarm[],
): Announcement[] {
  if (!previous) return [];
  const out: Announcement[] = [];
  for (const [field, thresholds] of Object.entries(ANNOUNCE_THRESHOLDS)) {
    const before = previous[field];
    const after = current[field];
    if (before === undefined || after === undefined || thresholds === undefined) continue;
    for (const threshold of thresholds) {
      const wasBelow = before < threshold;
      const isBelow = after < threshold;
      if (wasBelow === isBelow) continue;
      const spec = FIELDS[field as StateField];
      const alarm = alarms.find((a) => a.parameter === field);
      out.push({
        text: `${spec.label} ${isBelow ? 'fell below' : 'rose above'} ${threshold} ${spec.unit}`
          + `, now ${after.toFixed(spec.precision)} ${spec.unit}`
          + (alarm ? `. ${alarm.priority === 'high' ? 'High priority' : alarm.priority === 'medium' ? 'Medium priority' : 'Low priority'} alarm.` : ''),
        severity: alarm?.priority === 'high' ? 'critical' : alarm ? 'warning' : 'info',
      });
    }
  }
  return out;
}

/**
 * The on-demand full-state summary: all current vitals, active infusions,
 * ventilator settings and active alarms, as structured text.
 */
export function stateSummary(
  state: PatientState,
  options: {
    readonly alarms: readonly EngineAlarm[];
    readonly infusions: readonly { drugId: string; rate: number; unit: string }[];
    readonly ventilator: {
      mode: string;
      tidalVolumeMl: number;
      respiratoryRateBpm: number;
      fio2: number;
      delivering: boolean;
      freshGasFlowLPerMin?: number;
    };
    readonly invalid: ReadonlySet<string>;
    readonly showTrainOfFour?: boolean;
    readonly jawThrustCpapSecondsRemaining?: number;
    readonly resuscitation?: {
      readonly epinephrineEffectFraction: number;
      readonly epinephrineTotalMicrograms: number;
      readonly crystalloidTotalMl: number;
      readonly dantroleneTotalMg?: number;
      readonly dantroleneEffectFraction?: number;
      readonly activeCooling?: boolean;
      readonly cardiacArrestActive?: boolean;
      readonly chestCompressionsActive?: boolean;
      readonly chestCompressionSeconds?: number;
      readonly compressionPerfusionFraction?: number;
      readonly arrestEpinephrineTotalMg?: number;
      readonly defibrillationShockCount?: number;
      readonly lastDefibrillationEnergyJ?: number | null;
      readonly roscAtTick?: number | null;
      readonly postTetanicCount?: number;
      readonly lastNeuromuscularReversal?: {
        readonly agent: 'sugammadex' | 'neostigmine';
        readonly doseMgPerKg: number | null;
        readonly tick: number;
      } | null;
    };
    readonly epinephrineLabel?: string;
    readonly lastExposure?: { readonly agentId: string; readonly tick: number } | null;
    readonly actualBodyWeightKg?: number;
    readonly showEpinephrineSupport?: boolean;
    readonly showHypermetabolicSupport?: boolean;
    readonly showCardiacArrestSupport?: boolean;
  },
): string {
  const lines: string[] = ['Current state.'];
  for (const tile of tilesFor(options.showTrainOfFour ?? false)) {
    const spec = FIELDS[tile.field];
    if (options.invalid.has(tile.field)) {
      lines.push(`${spec.label}: not measurable. ${tile.invalidReason ?? ''}`.trim());
      continue;
    }
    lines.push(`${spec.label}: ${state[tile.field].toFixed(spec.precision)} ${spec.unit}`.trim());
    if (tile.field === 'trainOfFourRatio') {
      lines.push(`Train-of-four count: ${state.trainOfFourCount.toFixed(0)} of 4.`);
      if (state.trainOfFourCount === 4 && state.trainOfFourRatio >= 0.4
        && state.trainOfFourRatio < 0.9) {
        lines.push('Qualitative assessment: no detectable fade, but the quantitative ratio still shows residual blockade below 0.9.');
      }
      if (state.trainOfFourCount === 0 && options.resuscitation?.postTetanicCount !== undefined) {
        lines.push(`Auto-derived post-tetanic-count teaching proxy: ${options.resuscitation.postTetanicCount.toFixed(0)}.`);
      }
      const reversal = options.resuscitation?.lastNeuromuscularReversal;
      if (reversal) {
        lines.push(`Last accepted neuromuscular reversal: ${reversal.agent}`
          + (reversal.doseMgPerKg === null ? '' : ` ${reversal.doseMgPerKg} milligrams per kilogram`)
          + ' intravenous.');
      }
    }
  }
  lines.push(options.infusions.length === 0
    ? 'No infusions running.'
    : `Infusions: ${options.infusions.map((i) => `${i.drugId} at ${i.rate.toFixed(1)} ${i.unit}`).join(', ')}.`);
  lines.push(`Ventilator: ${options.ventilator.mode}, `
    + `inspired oxygen fraction ${options.ventilator.fio2.toFixed(2)}, `
    + (options.ventilator.freshGasFlowLPerMin === undefined
      ? '' : `fresh gas flow ${options.ventilator.freshGasFlowLPerMin.toFixed(1)} litres per minute, `)
    + (options.ventilator.delivering
      ? `tidal volume ${options.ventilator.tidalVolumeMl} millilitres`
        + (options.actualBodyWeightKg === undefined
          ? '' : `, ${(options.ventilator.tidalVolumeMl / options.actualBodyWeightKg).toFixed(1)} millilitres per kilogram actual body weight`)
        + ` at ${options.ventilator.respiratoryRateBpm} per minute, `
        + `delivered minute ventilation ${(
          options.ventilator.tidalVolumeMl * options.ventilator.respiratoryRateBpm / 1000
        ).toFixed(1)} litres per minute.`
      : 'not delivering breaths.'));
  if (options.actualBodyWeightKg !== undefined) {
    lines.push('The millilitres-per-kilogram value is a conversion using actual body weight, not a recommended target.');
  }
  lines.push((options.jawThrustCpapSecondsRemaining ?? 0) > 0
    ? options.ventilator.delivering
      ? 'Jaw thrust and continuous positive airway pressure are being applied.'
      : 'A jaw thrust hold is active, but the ventilator is not delivering positive pressure.'
    : 'No held airway maneuver is active.');
  if (options.resuscitation && (options.showEpinephrineSupport ?? true)) {
    const name = options.epinephrineLabel ?? 'epinephrine';
    lines.push(`Accepted crisis support: ${name} ${options.resuscitation.epinephrineTotalMicrograms.toFixed(0)} micrograms intravenous; balanced crystalloid ${options.resuscitation.crystalloidTotalMl.toFixed(0)} millilitres.`);
    if (options.resuscitation.epinephrineEffectFraction > 0) {
      lines.push(`The ${name} teaching-model effect is active.`);
    }
  }
  if (options.resuscitation && options.showHypermetabolicSupport) {
    lines.push(`Accepted dantrolene total: ${(options.resuscitation.dantroleneTotalMg ?? 0).toFixed(0)} milligrams intravenous.`);
    if ((options.resuscitation.dantroleneEffectFraction ?? 0) > 0) {
      lines.push('The dantrolene teaching-model effect is active.');
    }
    lines.push(`Active cooling is ${options.resuscitation.activeCooling ? 'on' : 'off'}.`);
    const rigidity = state.muscleRigidityFraction >= 0.75 ? 'marked'
      : state.muscleRigidityFraction >= 0.4 ? 'moderate'
        : state.muscleRigidityFraction > 0.05 ? 'mild' : 'none observed';
    lines.push(`Muscle rigidity: ${rigidity}.`);
  }
  if (options.resuscitation && options.showCardiacArrestSupport) {
    const arrest = options.resuscitation;
    lines.push(arrest.roscAtTick !== null && arrest.roscAtTick !== undefined
      ? 'Modeled return of spontaneous circulation is recorded.'
      : arrest.cardiacArrestActive ? 'Scripted cardiac arrest is active.' : 'No scripted cardiac arrest is active.');
    lines.push(`Chest compressions are ${arrest.chestCompressionsActive ? 'running' : 'stopped'}; `
      + `${(arrest.chestCompressionSeconds ?? 0).toFixed(0)} accepted seconds, `
      + `compression perfusion proxy ${(100 * (arrest.compressionPerfusionFraction ?? 0)).toFixed(0)} percent.`);
    lines.push(`Accepted arrest epinephrine: ${(arrest.arrestEpinephrineTotalMg ?? 0).toFixed(0)} milligrams. `
      + `Defibrillation shocks: ${(arrest.defibrillationShockCount ?? 0).toFixed(0)}`
      + (arrest.lastDefibrillationEnergyJ === null || arrest.lastDefibrillationEnergyJ === undefined
        ? '.' : `; last energy ${arrest.lastDefibrillationEnergyJ.toFixed(0)} joules.`));
  }
  if (options.lastExposure) {
    lines.push(`Most recent modeled trigger exposure: ${options.lastExposure.agentId}.`);
  }
  lines.push(options.alarms.length === 0
    ? 'No active alarms.'
    : `Active alarms: ${options.alarms.map((a) => `${a.priority}, ${a.message}`).join('; ')}.`);
  return lines.join(' ');
}

/** Whether current patient state can produce arterial and pleth mechanical pulses. */
export function mechanicalPulseFromState(
  state: Readonly<Record<string, number>> | null,
): boolean {
  return (state?.heartRateBpm ?? 0) > 0
    && (state?.strokeVolumeMl ?? 0) > 0
    && (state?.cardiacOutputLPerMin ?? 0) > 0;
}

/**
 * A text description of the current waveform morphology, so a screen reader user
 * reaching a trace gets its shape rather than an empty canvas.
 */
export function waveformDescriptions(options: {
  readonly rhythm: RhythmId;
  readonly bronchospasmSeverity: number;
  readonly airwayPatencyFraction: number;
  readonly perfusionIndex: number;
  readonly artifacts: ReadonlySet<string>;
  readonly ventilating: boolean;
  readonly mechanicalPulse: boolean;
}): { signal: string; label: string; description: string }[] {
  const rhythm = getRhythm(options.rhythm);
  const alpha = alphaForObstruction(options.bronchospasmSeverity);
  const capnoShape = !options.ventilating || options.airwayPatencyFraction <= 0.05
    ? 'No waveform: no gas is moving.'
    : alpha > NORMAL_ALPHA_DEGREES + 15
      ? `Shark-fin shape: the expiratory upstroke is sloped and the plateau rises, giving an alpha angle of about ${alpha.toFixed(0)} degrees.`
      : `Normal rectangular shape with a flat alveolar plateau, alpha angle about ${alpha.toFixed(0)} degrees.`;

  const plethShape = !options.mechanicalPulse
    ? 'Non-pulsatile: no mechanical pulse is reaching the probe.'
    : options.artifacts.has('probe-displacement')
      ? 'Non-pulsatile: the probe is displaced.'
      : options.perfusionIndex < 0.35
        ? 'Small, low-amplitude pulses. Signal quality is poor and the saturation reading is unreliable.'
        : 'Regular pulses with a clear upstroke and a dicrotic shoulder.';

  const arterialShape = !options.mechanicalPulse
    ? 'Flat: no pulsatile pressure.'
    : options.artifacts.has('arterial-damping')
      ? 'Damped: the dicrotic notch is lost and the trace is narrow. This is a monitoring problem, not a pressure change.'
      : 'Sharp upstroke, a dicrotic notch on the downslope, and a diastolic runoff.';

  return [
    {
      signal: 'ecg', label: 'Electrocardiogram, lead two',
      description: options.artifacts.has('electrocautery')
        ? `${rhythm.morphologyDescription} The trace is obscured by electrocautery interference, so the displayed heart rate is unreliable.`
        : rhythm.morphologyDescription,
    },
    { signal: 'arterial', label: 'Arterial pressure', description: arterialShape },
    { signal: 'capno', label: 'Capnography', description: capnoShape },
    { signal: 'pleth', label: 'Plethysmogram', description: plethShape },
  ];
}

/**
 * The keyboard shortcuts, documented and reachable without leaving the cockpit
 * (platform/accessibility → Complete Keyboard Operation).
 */
export interface Shortcut {
  readonly keys: string;
  readonly action: string;
  /** True for the time-critical actions the requirement singles out. */
  readonly timeCritical: boolean;
}

export const SHORTCUTS: readonly Shortcut[] = [
  { keys: 'Space', action: 'Play or pause the simulation', timeCritical: true },
  { keys: '.', action: 'Advance one simulated second', timeCritical: false },
  { keys: 'S', action: 'Read the full state summary aloud', timeCritical: true },
  { keys: 'W', action: 'Read the waveform descriptions', timeCritical: false },
  { keys: 'A', action: 'Silence the highest-priority active alarm', timeCritical: true },
  { keys: '1 – 4', action: 'Switch the Analysis tab', timeCritical: false },
  { keys: 'G', action: 'Give the focused syringe\'s first preset dose', timeCritical: true },
  { keys: 'V', action: 'Start or stop ventilating', timeCritical: true },
  { keys: 'L', action: 'Perform laryngoscopy', timeCritical: true },
  { keys: 'C', action: 'Start or stop modeled chest compressions', timeCritical: true },
  { keys: 'E', action: 'Give 1 mg IV epinephrine in the scripted arrest case', timeCritical: true },
  { keys: 'D', action: 'Deliver the declared 200 J biphasic shock in the scripted arrest case', timeCritical: true },
  { keys: '?', action: 'Open this shortcut reference', timeCritical: false },
];
