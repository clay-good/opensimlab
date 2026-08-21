/**
 * Constants confirmed against a primary source, and the ones that are not.
 *
 * This project's governance requires that a model parameter be checked against
 * its publication before the model may be called published. That check was
 * recorded as simply "not performed" for everything. This file records the
 * result at the level of the individual number instead, so a reviewer inherits
 * a worklist rather than an instruction to check everything.
 *
 * A constant appears here as `confirmed` only when its value was read from the
 * source's own text — not from a summary, a review, a lecture note, or memory.
 * A test asserts that the running code still uses the value recorded here, so a
 * confirmed constant cannot drift after being confirmed.
 *
 * WHAT COULD NOT BE CONFIRMED IS RECORDED TOO, WITH WHY. Eleveld 2018 is behind
 * a paywall. The one accessible secondary source that reproduces its parameter
 * table could not be read reliably — two retrievals of the same table returned
 * different clearance values, and its rows visibly mixed entries from adjacent
 * models — so nothing was confirmed from it and NOTHING WAS CHANGED on its
 * authority. Correcting a right number from an unreliable source is worse than
 * leaving it marked unchecked.
 */

export interface VerifiedConstant {
  /** Where it lives in the code, so a reviewer can find it. */
  readonly symbol: string;
  readonly value: number;
  readonly units: string;
  /** Source register id. */
  readonly sourceId: string;
  /**
   * `confirmed` means read from the source's own text. `unconfirmed` means it
   * has not been, and the note says what was tried.
   */
  readonly status: 'confirmed' | 'unconfirmed';
  /** Exactly where in the source, or exactly why it could not be confirmed. */
  readonly note: string;
}

export const VERIFIED_CONSTANTS: readonly VerifiedConstant[] = [
  {
    symbol: 'MAC_AGE_EXPONENT',
    value: -0.00269,
    units: 'per year, base 10',
    sourceId: 'mapleson-1996',
    status: 'confirmed',
    note: 'Stated in the abstract: "b = -0.00269 (95% confidence limits (CL) -0.0030, -0.0024)".',
  },
  {
    symbol: 'MAC_40.sevoflurane',
    value: 1.80,
    units: 'volumes percent',
    sourceId: 'mapleson-1996',
    status: 'confirmed',
    note: 'Listed in the abstract\'s MAC-at-40 series: "sevoflurane, 1.80%".',
  },
  {
    symbol: 'MAC_40.isoflurane',
    value: 1.17,
    units: 'volumes percent',
    sourceId: 'mapleson-1996',
    status: 'confirmed',
    note: 'Listed in the abstract\'s MAC-at-40 series: "isoflurane, 1.17%".',
  },
  {
    symbol: 'MAC_40.desflurane',
    value: 6.6,
    units: 'volumes percent',
    sourceId: 'mapleson-1996',
    status: 'confirmed',
    note: 'Listed in the abstract\'s MAC-at-40 series: "desflurane 6.6%".',
  },
  {
    symbol: 'NITROUS_OXIDE_MAC_40_PERCENT',
    value: 104,
    units: 'volumes percent',
    sourceId: 'mapleson-1996',
    status: 'confirmed',
    note: 'Listed in the abstract\'s MAC-at-40 series: "nitrous oxide, 104%". The same age '
      + 'exponent is applied to it because the paper reports the rate as the same for all '
      + 'inhaled anaesthetics and tabulates nitrous oxide alongside the volatiles.',
  },
  {
    symbol: 'saturationFromPo2 (the equation itself)',
    value: 23400,
    units: 'the constant in the numerator',
    sourceId: 'severinghaus-1979',
    status: 'confirmed',
    note: 'The abstract states the equation as "S = (((Po2(3) + 150 Po2)(-1) x 23,400) + 1)(-1)", '
      + 'which is what the code computes. The paper also states it fits the standard curve to '
      + 'within +/- 0.0055 fractional saturation.',
  },

  // --- Not confirmed, and why ------------------------------------------------
  {
    symbol: 'ELEVELD_THETA.v1Ref',
    value: 6.28,
    units: 'litres',
    sourceId: 'eleveld-2018',
    status: 'unconfirmed',
    note: 'The primary is paywalled. A secondary source rendered this as 6.25, but the same '
      + 'source could not be read reliably — two retrievals of its parameter table returned '
      + 'different clearance values and its rows mixed entries from adjacent models — so it is '
      + 'not treated as evidence either way and the value was NOT changed. Needs a reader with '
      + 'the paper in front of them.',
  },
  {
    symbol: 'ELEVELD_THETA.v3Ref',
    value: 273,
    units: 'litres',
    sourceId: 'eleveld-2018',
    status: 'unconfirmed',
    note: 'Same secondary source rendered V3 as 447 scaled by total body weight rather than 273 '
      + 'scaled by fat-free mass. Given that source\'s demonstrated unreliability this resolves '
      + 'nothing, but it is the parameter a checker should look at FIRST, because the two '
      + 'renderings differ in both the constant and the covariate.',
  },
];

/** The ones a reviewer still has to do, worst first. */
export function unconfirmedConstants(): VerifiedConstant[] {
  return VERIFIED_CONSTANTS.filter((entry) => entry.status === 'unconfirmed');
}

/** How much of what is recorded has actually been checked. */
export function confirmedCount(): { confirmed: number; total: number } {
  return {
    confirmed: VERIFIED_CONSTANTS.filter((entry) => entry.status === 'confirmed').length,
    total: VERIFIED_CONSTANTS.length,
  };
}
