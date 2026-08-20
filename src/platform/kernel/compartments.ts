/**
 * The mammillary compartment solver (engine/pkpd-core → Mammillary Compartment Solver,
 * Effect-Site Compartment, Fixed-Step Deterministic Integration).
 *
 * Solves
 *
 *   dA1/dt = R(t) - (CL/V1)*A1 - SUM_k (Qk/V1)*A1 + SUM_k (Qk/Vk)*Ak
 *   dAk/dt = (Qk/V1)*A1 - (Qk/Vk)*Ak                     for k = 2..n
 *   Cp(t)  = A1(t) / V1
 *   dCe/dt = ke0 * (Cp - Ce)
 *
 * over fixed steps with the analytic matrix-exponential solution. The effect site
 * is carried INSIDE the same linear system, which makes it exact rather than a
 * first-order approximation, and it never feeds mass back into the central
 * compartment because its row contributes to no other row.
 *
 * The infusion rate is handled by the standard augmented-matrix construction: with
 *
 *   M = [ K  B ]      exp(M h) = [ exp(K h)   integral term ]
 *       [ 0  0 ]                 [    0             1       ]
 *
 * the top-right column is exactly the response to a rate held constant over the
 * step, so a constant-rate infusion is integrated with no numerical error.
 *
 * Units. Volumes in litres, clearances in litres per minute, amounts in the drug's
 * own mass unit, time in minutes. The unit is carried on the model declaration.
 */

import { expm, zeros } from './matrix';
import { NoEffectSiteForModel, UnsupportedModelStructure } from './errors';

/** Per-patient pharmacokinetic parameters, after covariate scaling. */
export interface PkParameters {
  readonly modelId: string;
  /** Central volume, litres. */
  readonly v1: number;
  /** Peripheral volumes, litres. Zero, one or two entries. */
  readonly peripheralVolumes: readonly number[];
  /** Elimination clearance, litres per minute. */
  readonly cl: number;
  /** Intercompartmental clearances, litres per minute, aligned with `peripheralVolumes`. */
  readonly intercompartmentalClearances: readonly number[];
  /** Effect-site equilibration rate constant, per minute. Absent means no effect site. */
  readonly ke0: number | null;
}

/** The fixed solver step, in minutes. 100 ms is 1/600 of a minute. */
export const STEP_MINUTES = 1 / 600;

/** Build the system matrix, with the effect site as the last row. */
function systemMatrix(parameters: PkParameters): { matrix: Float64Array; size: number; compartments: number } {
  const compartments = 1 + parameters.peripheralVolumes.length;
  if (compartments < 1 || compartments > 3) {
    throw new UnsupportedModelStructure(parameters.modelId, compartments);
  }
  const hasEffectSite = parameters.ke0 !== null;
  const size = compartments + (hasEffectSite ? 1 : 0);
  const k = zeros(size);
  const at = (row: number, col: number, value: number) => { k[row * size + col] = value; };

  const k10 = parameters.cl / parameters.v1;
  let centralOutflow = k10;
  for (let index = 0; index < parameters.peripheralVolumes.length; index += 1) {
    const q = parameters.intercompartmentalClearances[index] ?? 0;
    const v = parameters.peripheralVolumes[index] ?? 1;
    const k1n = q / parameters.v1;
    const kn1 = q / v;
    centralOutflow += k1n;
    at(0, index + 1, kn1);
    at(index + 1, 0, k1n);
    at(index + 1, index + 1, -kn1);
  }
  at(0, 0, -centralOutflow);

  if (hasEffectSite) {
    const ke0 = parameters.ke0 as number;
    // dCe/dt = ke0 * (A1/V1 - Ce). This row reads A1 but nothing reads Ce, so no
    // mass returns to the central compartment.
    at(size - 1, 0, ke0 / parameters.v1);
    at(size - 1, size - 1, -ke0);
  }
  return { matrix: k, size, compartments };
}

/**
 * A solver instance for one drug in one patient. The step transition is computed
 * once at construction and reused every tick, so a tick costs a few multiplications.
 */
export class CompartmentSolver {
  /** [A1, A2, A3, Ce] as far as the model declares. */
  private state: Float64Array;
  private readonly size: number;
  readonly compartments: number;
  private readonly transition: Float64Array;
  /** Response of each state to a unit infusion rate held over one step. */
  private readonly inputResponse: Float64Array;
  private readonly parameters: PkParameters;
  private readonly hasEffectSite: boolean;

  constructor(parameters: PkParameters, stepMinutes: number = STEP_MINUTES) {
    this.parameters = parameters;
    const { matrix, size, compartments } = systemMatrix(parameters);
    this.size = size;
    this.compartments = compartments;
    this.hasEffectSite = parameters.ke0 !== null;
    this.state = new Float64Array(size);

    // Augment with the constant-input column.
    const n = size + 1;
    const augmented = zeros(n);
    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) augmented[i * n + j] = matrix[i * size + j] ?? 0;
    }
    augmented[0 * n + size] = 1; // rate enters the central compartment only

    const exponential = expm(new Float64Array(augmented.map((v) => v * stepMinutes)), n);
    this.transition = zeros(size);
    this.inputResponse = new Float64Array(size);
    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) this.transition[i * size + j] = exponential[i * n + j] ?? 0;
      this.inputResponse[i] = exponential[i * n + size] ?? 0;
    }
  }

  /** Add a bolus to the central compartment, in the drug's mass unit. */
  bolus(amount: number): void {
    this.state[0] = (this.state[0] ?? 0) + amount;
  }

  /** Advance exactly one fixed step with `rate` held constant, in mass per minute. */
  step(rate: number): void {
    const next = new Float64Array(this.size);
    for (let i = 0; i < this.size; i += 1) {
      let sum = (this.inputResponse[i] ?? 0) * rate;
      for (let j = 0; j < this.size; j += 1) {
        sum += (this.transition[i * this.size + j] ?? 0) * (this.state[j] ?? 0);
      }
      next[i] = sum;
    }
    this.state = next;
  }

  /** Plasma concentration, mass per litre. */
  get plasma(): number {
    return (this.state[0] ?? 0) / this.parameters.v1;
  }

  /**
   * Effect-site concentration. A model that publishes no effect-site rate constant
   * has no effect-site curve, and asking for one is an error rather than a
   * borrowed constant.
   */
  get effectSite(): number {
    if (!this.hasEffectSite) throw new NoEffectSiteForModel(this.parameters.modelId);
    return this.state[this.size - 1] ?? 0;
  }

  get hasEffectSiteCurve(): boolean {
    return this.hasEffectSite;
  }

  /** Amounts in each mass-carrying compartment, for the conservation property test. */
  get amounts(): number[] {
    return Array.from(this.state.slice(0, this.compartments));
  }

  /** Total drug still in the body, for the mass-conservation test. */
  get totalAmount(): number {
    return this.amounts.reduce((a, b) => a + b, 0);
  }

  reset(): void {
    this.state = new Float64Array(this.size);
  }
}

/**
 * Time to peak effect after a bolus, in minutes: the interval between the peak
 * plasma concentration (which for a bolus is at time zero) and the peak
 * effect-site concentration.
 *
 * Evaluated by advancing the same exact solution on a fine step, so it is the
 * model's own answer rather than a separate approximation.
 */
export function timeToPeakEffectMinutes(parameters: PkParameters): number {
  if (parameters.ke0 === null) throw new NoEffectSiteForModel(parameters.modelId);
  const fineStep = 1 / 6000; // 10 ms
  const solver = new CompartmentSolver(parameters, fineStep);
  solver.bolus(1);
  let best = 0;
  let bestTime = 0;
  for (let i = 1; i <= 6000 * 20; i += 1) { // up to 20 minutes
    solver.step(0);
    const value = solver.effectSite;
    if (value > best) { best = value; bestTime = i * fineStep; }
    else if (i * fineStep > 1 && value < best * 0.98) break;
  }
  return bestTime;
}

/**
 * Context-sensitive decrement time in minutes: how long effect-site concentration
 * takes to fall by `fraction` after an infusion that has run for `infusionMinutes`
 * at a rate holding the effect site at steady state
 * (cockpit/pkpd-visualizer → Context-Sensitive Decrement Time).
 */
export function contextSensitiveDecrementMinutes(
  parameters: PkParameters,
  infusionMinutes: number,
  fraction: number,
): number {
  const step = 1 / 60; // one second
  const solver = new CompartmentSolver(parameters, step);
  // Hold the effect site near 1 unit with a simple proportional controller. The
  // controller is a test and analysis instrument in the visualizer layer, never a
  // dosing recommendation, and it lives outside the forward-only kernel path.
  const steps = Math.round(infusionMinutes / step);
  for (let i = 0; i < steps; i += 1) {
    const error = 1 - solver.effectSite;
    const rate = Math.max(0, parameters.cl * 1 + error * parameters.v1 * 4);
    solver.step(rate);
  }
  const start = solver.effectSite;
  const target = start * (1 - fraction);
  for (let i = 0; i < 60 * 60 * 24; i += 1) {
    solver.step(0);
    if (solver.effectSite <= target) return i * step;
  }
  return Number.POSITIVE_INFINITY;
}
