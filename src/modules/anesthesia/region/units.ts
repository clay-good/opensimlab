/**
 * Display-layer unit conversion (platform/global-reach → Both Unit Systems, Everywhere).
 *
 * The engine operates in ONE canonical unit set. Conversion happens here, at the
 * display layer only, so replaying the same transcript under either setting gives
 * a bit-identical state trace. Units are selectable independently of region.
 */

export type UnitSystem = 'si' | 'conventional';

export interface Quantity {
  readonly value: number;
  readonly unit: string;
}

/** Conversions from the engine's canonical unit to each system. */
const CONVERSIONS: Record<string, { si: { unit: string; factor: number }; conventional: { unit: string; factor: number } }> = {
  // Haemoglobin: canonical g/dL.
  hemoglobinGPerDl: { si: { unit: 'g/L', factor: 10 }, conventional: { unit: 'g/dL', factor: 1 } },
  // Glucose: canonical mg/dL.
  glucoseMgPerDl: { si: { unit: 'mmol/L', factor: 1 / 18.016 }, conventional: { unit: 'mg/dL', factor: 1 } },
  // Temperature: canonical Celsius. Both systems use Celsius clinically; Fahrenheit
  // is offered under the conventional system because United States practice uses it.
  coreTemperatureC: { si: { unit: '°C', factor: 1 }, conventional: { unit: '°C', factor: 1 } },
  // Pressures stay in mmHg in both systems, because kPa is not used at the bedside
  // for arterial pressure anywhere this project ships a region profile for.
  meanArterialMmHg: { si: { unit: 'mmHg', factor: 1 }, conventional: { unit: 'mmHg', factor: 1 } },
  // Carbon dioxide tension: kPa under SI, mmHg conventionally.
  paco2MmHg: { si: { unit: 'kPa', factor: 0.1333224 }, conventional: { unit: 'mmHg', factor: 1 } },
  etco2MmHg: { si: { unit: 'kPa', factor: 0.1333224 }, conventional: { unit: 'mmHg', factor: 1 } },
  pao2MmHg: { si: { unit: 'kPa', factor: 0.1333224 }, conventional: { unit: 'mmHg', factor: 1 } },
};

/** Convert a canonical value for display. Never call this inside the engine. */
export function forDisplay(field: string, canonicalValue: number, system: UnitSystem): Quantity {
  const conversion = CONVERSIONS[field];
  if (!conversion) return { value: canonicalValue, unit: '' };
  const target = conversion[system];
  return { value: canonicalValue * target.factor, unit: target.unit };
}

/** Whether a field's display differs between the two systems at all. */
export function systemsDiffer(field: string): boolean {
  const conversion = CONVERSIONS[field];
  if (!conversion) return false;
  return conversion.si.unit !== conversion.conventional.unit;
}

/** Every field with a declared conversion, for the tests. */
export const CONVERTIBLE_FIELDS = Object.keys(CONVERSIONS);

/** No exported quantity is ever unitless. */
export function formatQuantity(quantity: Quantity, precision: number): string {
  return `${quantity.value.toFixed(precision)} ${quantity.unit}`.trim();
}
