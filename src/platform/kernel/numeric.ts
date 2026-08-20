/** Small numeric helpers shared by the solver, the physiology, and the waveforms. */

/** Clamp `value` into the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Linear interpolation; `t` is not clamped. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * First-order approach of `current` toward `target` over `dt` with time
 * constant `tau`, integrated exactly rather than by an Euler step, so the
 * result is independent of step size.
 */
export function approach(current: number, target: number, tau: number, dt: number): number {
  if (tau <= 0) return target;
  const k = 1 - Math.exp(-dt / tau);
  return current + (target - current) * k;
}

/** Wrap an angle into (-PI, PI]. */
export function wrapAngle(theta: number): number {
  let a = theta;
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a <= -Math.PI) a += 2 * Math.PI;
  return a;
}

/** Fourth-order Runge-Kutta step for an autonomous-in-`t` vector field. */
export function rk4(
  state: readonly number[],
  t: number,
  dt: number,
  derivative: (t: number, y: readonly number[]) => number[],
): number[] {
  const add = (y: readonly number[], k: readonly number[], scale: number): number[] =>
    y.map((v, i) => v + scale * (k[i] ?? 0));

  const k1 = derivative(t, state);
  const k2 = derivative(t + dt / 2, add(state, k1, dt / 2));
  const k3 = derivative(t + dt / 2, add(state, k2, dt / 2));
  const k4 = derivative(t + dt, add(state, k3, dt));
  return state.map(
    (v, i) => v + (dt / 6) * ((k1[i] ?? 0) + 2 * (k2[i] ?? 0) + 2 * (k3[i] ?? 0) + (k4[i] ?? 0)),
  );
}

/** Pearson cross-correlation of two equal-length series at a given integer lag. */
export function crossCorrelation(a: readonly number[], b: readonly number[], lag: number): number {
  const n = Math.min(a.length, b.length - lag);
  if (n <= 1) return 0;
  let sa = 0, sb = 0;
  for (let i = 0; i < n; i += 1) { sa += a[i] ?? 0; sb += b[i + lag] ?? 0; }
  const ma = sa / n, mb = sb / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i += 1) {
    const x = (a[i] ?? 0) - ma;
    const y = (b[i + lag] ?? 0) - mb;
    num += x * y; da += x * x; db += y * y;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

/** The integer lag in [0, maxLag] at which `b` best matches `a`. */
export function bestLag(a: readonly number[], b: readonly number[], maxLag: number): number {
  let best = 0;
  let bestValue = -Infinity;
  for (let lag = 0; lag <= maxLag; lag += 1) {
    const value = crossCorrelation(a, b, lag);
    if (value > bestValue) { bestValue = value; best = lag; }
  }
  return best;
}
