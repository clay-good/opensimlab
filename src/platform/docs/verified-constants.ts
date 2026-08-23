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
 * WHAT COULD NOT BE CONFIRMED IS RECORDED TOO, WITH WHY. The Eleveld publisher
 * PDF is openly available from the University of Groningen, and its official S4
 * attachment contains the final PD NONMEM stream. Five sampled constants below
 * were checked directly against those primary materials. They still await the
 * independent second-person, second-source check required by governance.
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

  {
    symbol: 'ELEVELD_THETA.v1Ref',
    value: 6.28,
    units: 'litres',
    sourceId: 'eleveld-2018',
    status: 'confirmed',
    note: 'Eleveld et al. 2018, Table 2, θ1: V1ref = 6.28 L (99% CI 5.97–6.80). '
      + 'Read from the publisher PDF hosted by the University of Groningen on 2026-08-23.',
  },
  {
    symbol: 'ELEVELD_THETA.v3Ref',
    value: 273,
    units: 'litres',
    sourceId: 'eleveld-2018',
    status: 'confirmed',
    note: 'Eleveld et al. 2018, Table 2, θ3: V3ref = 273 L (99% CI 243–306); the printed '
      + 'equation scales V3 by Al-Sallami fat-free mass. Read from the publisher PDF hosted by '
      + 'the University of Groningen on 2026-08-23.',
  },
  {
    symbol: 'ELEVELD_PD.gammaLow',
    value: 1.89,
    units: 'Hill slope below Ce50',
    sourceId: 'eleveld-2018',
    status: 'confirmed',
    note: 'Supplementary Digital Content S4 final PD $ERROR: below Ce50 the logistic weight '
      + 'approaches zero, selecting GAM1 = exp(θ9) = 1.89.',
  },
  {
    symbol: 'ELEVELD_PD.gammaHigh',
    value: 1.47,
    units: 'Hill slope above Ce50',
    sourceId: 'eleveld-2018',
    status: 'confirmed',
    note: 'Supplementary Digital Content S4 final PD $ERROR: above Ce50 the logistic weight '
      + 'approaches one, selecting GAM = exp(θ4) = 1.47.',
  },
  {
    symbol: 'ELEVELD_PD.gammaTransitionSteepness',
    value: 30,
    units: 'per µg/mL around Ce50',
    sourceId: 'eleveld-2018',
    status: 'confirmed',
    note: 'Supplementary Digital Content S4 final PD $ERROR declares '
      + 'WGAM = 1 / (1 + exp(-30 * (CPLA - E50))).',
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
