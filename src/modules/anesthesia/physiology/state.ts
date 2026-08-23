/**
 * The canonical patient state vector (engine/physiology → Canonical Patient State Vector).
 *
 * Every field carries its clinical unit in its name and a hard physiological
 * bound. A value outside its bound is clamped and logged as an engine warning
 * rather than rendered, so an implausible number never reaches a learner as
 * though it were physiology.
 */

/** One state field: its unit, its hard bounds, and how it is displayed. */
export interface FieldSpec {
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  /** Decimal places the value may be shown to. Precision never exceeds the model. */
  readonly precision: number;
  readonly label: string;
}

export const FIELDS = {
  heartRateBpm: { unit: 'bpm', min: 0, max: 300, precision: 0, label: 'Heart rate' },
  systolicMmHg: { unit: 'mmHg', min: 0, max: 300, precision: 0, label: 'Systolic pressure' },
  diastolicMmHg: { unit: 'mmHg', min: 0, max: 200, precision: 0, label: 'Diastolic pressure' },
  meanArterialMmHg: { unit: 'mmHg', min: 0, max: 220, precision: 0, label: 'Mean arterial pressure' },
  cardiacOutputLPerMin: { unit: 'L/min', min: 0, max: 20, precision: 1, label: 'Cardiac output' },
  strokeVolumeMl: { unit: 'mL', min: 0, max: 200, precision: 0, label: 'Stroke volume' },
  svrDynSCm5: { unit: 'dyn·s·cm⁻⁵', min: 100, max: 4000, precision: 0, label: 'Systemic vascular resistance' },
  bloodVolumeMl: { unit: 'mL', min: 500, max: 9000, precision: 0, label: 'Circulating blood volume' },
  hemoglobinGPerDl: { unit: 'g/dL', min: 1, max: 22, precision: 1, label: 'Haemoglobin' },
  spo2Percent: { unit: '%', min: 0, max: 100, precision: 0, label: 'Oxygen saturation' },
  pao2MmHg: { unit: 'mmHg', min: 0, max: 700, precision: 0, label: 'Arterial oxygen tension' },
  paco2MmHg: { unit: 'mmHg', min: 5, max: 200, precision: 0, label: 'Arterial carbon dioxide tension' },
  etco2MmHg: { unit: 'mmHg', min: 0, max: 120, precision: 0, label: 'End-tidal carbon dioxide' },
  respiratoryRateBpm: { unit: '/min', min: 0, max: 60, precision: 0, label: 'Respiratory rate' },
  tidalVolumeMl: { unit: 'mL', min: 0, max: 1500, precision: 0, label: 'Tidal volume' },
  coreTemperatureC: { unit: '°C', min: 25, max: 43, precision: 1, label: 'Core temperature' },
  depthIndex: { unit: '', min: 0, max: 100, precision: 0, label: 'Predicted depth index' },
  trainOfFourRatio: { unit: '', min: 0, max: 1, precision: 2, label: 'Train-of-four ratio' },
  trainOfFourCount: { unit: 'twitches', min: 0, max: 4, precision: 0, label: 'Train-of-four count' },
  endTidalSevofluranePercent: { unit: 'vol %', min: 0, max: 8, precision: 1, label: 'End-tidal sevoflurane' },
  macFraction: { unit: 'MAC', min: 0, max: 5, precision: 2, label: 'Age-adjusted MAC fraction' },
  fio2: { unit: '', min: 0.21, max: 1, precision: 2, label: 'Inspired oxygen fraction' },
  /**
   * End-tidal oxygen fraction. This, not the inspired fraction, is what says
   * whether preoxygenation actually worked: a leaking mask delivers an inspired
   * fraction of 1.0 to the circuit and an end-tidal fraction of 0.4 to the
   * patient. Denitrogenation is judged at 0.9.
   */
  endTidalO2Fraction: { unit: '', min: 0, max: 1, precision: 2, label: 'End-tidal oxygen fraction' },
  perfusionIndex: { unit: '', min: 0, max: 1, precision: 2, label: 'Peripheral perfusion index' },
} as const satisfies Record<string, FieldSpec>;

export type StateField = keyof typeof FIELDS;

/** The state vector. Numbers only, so it clones cheaply across the worker boundary. */
export type PatientState = { readonly [K in StateField]: number };

/** A mutable working copy used inside a solver step. */
export type MutableState = { -readonly [K in StateField]: number };

export interface ClampWarning {
  readonly field: StateField;
  readonly attempted: number;
  readonly clampedTo: number;
  readonly message: string;
}

/**
 * Clamp every field to its hard bound, reporting anything that had to be clamped.
 * The engine emits these as warnings; the interface never renders an out-of-bound
 * value.
 */
export function clampState(state: MutableState): ClampWarning[] {
  const warnings: ClampWarning[] = [];
  for (const key of Object.keys(FIELDS) as StateField[]) {
    const spec = FIELDS[key];
    const value = state[key];
    if (!Number.isFinite(value)) {
      warnings.push({
        field: key, attempted: value, clampedTo: spec.min,
        message: `${spec.label} was not a finite number; clamped to ${spec.min} ${spec.unit}`,
      });
      state[key] = spec.min;
      continue;
    }
    if (value < spec.min || value > spec.max) {
      const clamped = Math.min(Math.max(value, spec.min), spec.max);
      warnings.push({
        field: key, attempted: value, clampedTo: clamped,
        message: `${spec.label} reached ${value.toFixed(2)} ${spec.unit}, outside its physiological `
          + `bound of ${spec.min}–${spec.max}; clamped to ${clamped}`,
      });
      state[key] = clamped;
    }
  }
  return warnings;
}

/** Round a value to the precision its field supports. Precision never exceeds the model. */
export function formatValue(field: StateField, value: number): string {
  return value.toFixed(FIELDS[field].precision);
}
