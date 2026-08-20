/**
 * Dense small-matrix routines for the compartment solver.
 *
 * The matrix exponential is computed by scaling and squaring with a Pade
 * approximant. It is used instead of an eigendecomposition because it is general
 * in the compartment count, has no branch on whether the eigenvalues are distinct,
 * and is a fixed sequence of floating point operations — which is what
 * bit-identical replay across devices requires.
 */

export type Matrix = Float64Array;

export function zeros(n: number): Matrix {
  return new Float64Array(n * n);
}

export function identity(n: number): Matrix {
  const m = zeros(n);
  for (let i = 0; i < n; i += 1) m[i * n + i] = 1;
  return m;
}

export function multiply(a: Matrix, b: Matrix, n: number): Matrix {
  const out = zeros(n);
  for (let i = 0; i < n; i += 1) {
    for (let k = 0; k < n; k += 1) {
      const aik = a[i * n + k] ?? 0;
      if (aik === 0) continue;
      for (let j = 0; j < n; j += 1) {
        out[i * n + j] = (out[i * n + j] ?? 0) + aik * (b[k * n + j] ?? 0);
      }
    }
  }
  return out;
}

export function addScaled(a: Matrix, b: Matrix, scale: number): Matrix {
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i += 1) out[i] = (a[i] ?? 0) + scale * (b[i] ?? 0);
  return out;
}

export function scale(a: Matrix, factor: number): Matrix {
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i += 1) out[i] = (a[i] ?? 0) * factor;
  return out;
}

/** Largest absolute row sum, the induced infinity norm. */
export function normInf(a: Matrix, n: number): number {
  let worst = 0;
  for (let i = 0; i < n; i += 1) {
    let sum = 0;
    for (let j = 0; j < n; j += 1) sum += Math.abs(a[i * n + j] ?? 0);
    if (sum > worst) worst = sum;
  }
  return worst;
}

/** Solve `a x = b` for square `a` by Gaussian elimination with partial pivoting. */
export function solve(a: Matrix, b: Matrix, n: number): Matrix {
  const m = Float64Array.from(a);
  const rhs = Float64Array.from(b);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(m[row * n + col] ?? 0) > Math.abs(m[pivot * n + col] ?? 0)) pivot = row;
    }
    if (pivot !== col) {
      for (let j = 0; j < n; j += 1) {
        const t = m[col * n + j] ?? 0; m[col * n + j] = m[pivot * n + j] ?? 0; m[pivot * n + j] = t;
        const r = rhs[col * n + j] ?? 0; rhs[col * n + j] = rhs[pivot * n + j] ?? 0; rhs[pivot * n + j] = r;
      }
    }
    const diagonal = m[col * n + col] ?? 0;
    if (diagonal === 0) throw new Error('Singular matrix in compartment solver');
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = (m[row * n + col] ?? 0) / diagonal;
      if (factor === 0) continue;
      for (let j = 0; j < n; j += 1) {
        m[row * n + j] = (m[row * n + j] ?? 0) - factor * (m[col * n + j] ?? 0);
        rhs[row * n + j] = (rhs[row * n + j] ?? 0) - factor * (rhs[col * n + j] ?? 0);
      }
    }
  }
  const out = zeros(n);
  for (let row = 0; row < n; row += 1) {
    const diagonal = m[row * n + row] ?? 1;
    for (let j = 0; j < n; j += 1) out[row * n + j] = (rhs[row * n + j] ?? 0) / diagonal;
  }
  return out;
}

/** Order of the Pade approximant. Six is accurate to machine precision after scaling. */
const PADE_ORDER = 6;

/** exp(A) by scaling and squaring with a Pade approximant. */
export function expm(a: Matrix, n: number): Matrix {
  const norm = normInf(a, n);
  // Scale so the norm is below 0.5, where the Pade approximant is at its best.
  const squarings = norm === 0 ? 0 : Math.max(0, Math.ceil(Math.log2(norm / 0.5)));
  const scaled = scale(a, Math.pow(2, -squarings));

  // Pade coefficients c_k = (2p-k)! p! / ((2p)! k! (p-k)!) for p = PADE_ORDER.
  const p = PADE_ORDER;
  const coefficients: number[] = [1];
  for (let k = 1; k <= p; k += 1) {
    const previous = coefficients[k - 1] ?? 1;
    coefficients.push((previous * (p - k + 1)) / (k * (2 * p - k + 1)));
  }

  let numerator = scale(identity(n), coefficients[0] ?? 1);
  let denominator = scale(identity(n), coefficients[0] ?? 1);
  let power = identity(n);
  for (let k = 1; k <= p; k += 1) {
    power = multiply(power, scaled, n);
    const c = coefficients[k] ?? 0;
    numerator = addScaled(numerator, power, c);
    denominator = addScaled(denominator, power, k % 2 === 0 ? c : -c);
  }

  let result = solve(denominator, numerator, n);
  for (let i = 0; i < squarings; i += 1) result = multiply(result, result, n);
  return result;
}
