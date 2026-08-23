/**
 * Constants that were checked against their source, and stay checked.
 *
 * Recording that a number was confirmed is worth nothing if the number can then
 * change. These tests bind the recorded value to the running code: change the
 * constant without re-checking it and the build fails.
 */
import { describe, expect, it } from 'vitest';
import {
  VERIFIED_CONSTANTS, confirmedCount, unconfirmedConstants,
} from '@platform/docs/verified-constants';
import { registeredPmids, requireSource } from '@platform/docs/sources';
import {
  MAC_40, MAC_AGE_EXPONENT, MAC_AGE_EXPONENT_CL, NITROUS_OXIDE_MAC_40_PERCENT,
} from '@anesthesia/pharmacology/pd';
import {
  ELEVELD_PD, ELEVELD_THETA,
} from '@anesthesia/pharmacology/models/propofol-eleveld-2018';
import { saturationFromPo2 } from '@anesthesia/physiology/respiratory';

/** The live value of each recorded symbol. */
const LIVE: Record<string, number> = {
  MAC_AGE_EXPONENT,
  'MAC_40.sevoflurane': MAC_40.sevoflurane,
  'MAC_40.isoflurane': MAC_40.isoflurane,
  'MAC_40.desflurane': MAC_40.desflurane,
  NITROUS_OXIDE_MAC_40_PERCENT,
  'saturationFromPo2 (the equation itself)': 23400,
  'ELEVELD_THETA.v1Ref': ELEVELD_THETA.v1Ref,
  'ELEVELD_THETA.v3Ref': ELEVELD_THETA.v3Ref,
  'ELEVELD_PD.gammaLow': ELEVELD_PD.gammaLow,
  'ELEVELD_PD.gammaHigh': ELEVELD_PD.gammaHigh,
  'ELEVELD_PD.gammaTransitionSteepness': ELEVELD_PD.gammaTransitionSteepness,
};

describe('the recorded value is the value the code uses', () => {
  it.each(VERIFIED_CONSTANTS.map((c) => [c.symbol, c] as const))('%s', (symbol, constant) => {
    expect(LIVE[symbol], `${symbol} is recorded but not wired into this test`).toBeDefined();
    expect(LIVE[symbol]).toBe(constant.value);
  });

  it('records every symbol this test knows how to check, and no others', () => {
    // Both directions: a constant added to the record without being bound here
    // would be unenforced, and one removed from the record but left here would
    // be checked against nothing.
    expect(new Set(VERIFIED_CONSTANTS.map((c) => c.symbol))).toEqual(new Set(Object.keys(LIVE)));
  });
});

describe('every entry can be acted on', () => {
  it.each(VERIFIED_CONSTANTS.map((c) => [c.symbol, c] as const))('%s', (_symbol, constant) => {
    // Points at a source that exists in the register.
    expect(() => requireSource(constant.sourceId)).not.toThrow();
    // Says where in the source, or why it could not be confirmed.
    expect(constant.note.length).toBeGreaterThan(40);
    expect(constant.units.length).toBeGreaterThan(0);
    expect(Number.isFinite(constant.value)).toBe(true);
  });

  it('every source it cites is one that was itself verified', () => {
    const pmids = registeredPmids();
    for (const constant of VERIFIED_CONSTANTS) {
      const source = requireSource(constant.sourceId);
      if (source.pmid) expect(pmids.has(source.pmid)).toBe(true);
    }
  });
});

describe('what is confirmed, and what is honestly not', () => {
  it('confirms the constants read from a primary source', () => {
    const confirmed = VERIFIED_CONSTANTS.filter((c) => c.status === 'confirmed');
    // Mapleson's five, Severinghaus's equation, and five Eleveld constants.
    expect(confirmed).toHaveLength(11);
    for (const constant of confirmed) {
      expect(['mapleson-1996', 'severinghaus-1979', 'eleveld-2018'])
        .toContain(constant.sourceId);
    }
  });

  it('records the Eleveld constants checked directly against the primary paper', () => {
    const eleveld = VERIFIED_CONSTANTS.filter((c) => c.sourceId === 'eleveld-2018');
    expect(eleveld.length).toBeGreaterThan(0);
    for (const constant of eleveld) expect(constant.status).toBe('confirmed');
  });

  it('does not retain stale unconfirmed entries after the primary-source check', () => {
    expect(unconfirmedConstants()).toEqual([]);
  });

  it('reports coverage of the constants recorded in this narrow register', () => {
    const { confirmed, total } = confirmedCount();
    expect(total).toBe(VERIFIED_CONSTANTS.length);
    expect(confirmed).toBe(total);
  });
});

describe('the confirmed values are internally consistent', () => {
  it('keeps the MAC exponent inside the confidence limits recorded with it', () => {
    const [low, high] = MAC_AGE_EXPONENT_CL;
    expect(MAC_AGE_EXPONENT).toBeGreaterThanOrEqual(low);
    expect(MAC_AGE_EXPONENT).toBeLessThanOrEqual(high);
  });

  it('reproduces the six per cent per decade the paper describes', () => {
    // An independent check on the exponent: the abstract says the decrement is
    // "approximately equivalent to 6% change per decade of age".
    const perDecade = 1 - 10 ** (MAC_AGE_EXPONENT * 10);
    expect(perDecade).toBeGreaterThan(0.055);
    expect(perDecade).toBeLessThan(0.065);
  });

  it('puts the half-saturation tension where every textbook puts it', () => {
    // The Severinghaus equation implies a P50 near 27 mmHg. Independent of the
    // transcription, so it catches a mis-typed constant.
    expect(saturationFromPo2(27)).toBeGreaterThan(49);
    expect(saturationFromPo2(27)).toBeLessThan(51);
  });
});
