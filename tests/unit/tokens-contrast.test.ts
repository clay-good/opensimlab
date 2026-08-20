/**
 * Acceptance tests for design/design-system.
 * These run from the first commit, so a failing token can never land.
 */
import { describe, expect, it } from 'vitest';
import {
  ALARM_FLASH_HZ, BREAKPOINTS, contrastRatio, EASE, HIT_TARGET, MIN_TARGET_GAP,
  MOTION, NEUTRAL, RADIUS, SIGNAL, SPACE, TRACE, TRACE_COLORBLIND_SAFE, TRACE_IDS, TYPE,
  parseHex,
} from '@platform/tokens/tokens';
import { deltaE, simulate, type Dichromacy } from '@platform/tokens/cvd';

const SURFACES = ['surface-0', 'surface-1', 'surface-2', 'surface-3'] as const;
const TEXTS = ['text-primary', 'text-secondary', 'text-tertiary'] as const;

describe('Scenario: Contrast minimums are met on every permitted surface', () => {
  it('gives every text token at least 4.5:1 on every permitted surface', () => {
    for (const text of TEXTS) {
      for (const surface of SURFACES) {
        const ratio = contrastRatio(NEUTRAL[text], NEUTRAL[surface]);
        expect(ratio, `${text} on ${surface} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('has --text-tertiary on --surface-3 as the tightest pair, at 4.76:1', () => {
    const tightest = contrastRatio(NEUTRAL['text-tertiary'], NEUTRAL['surface-3']);
    expect(tightest).toBeCloseTo(4.76, 2);
    // And it really is the tightest of all the permitted pairs.
    for (const text of TEXTS) {
      for (const surface of SURFACES) {
        expect(contrastRatio(NEUTRAL[text], NEUTRAL[surface])).toBeGreaterThanOrEqual(tightest - 1e-9);
      }
    }
  });
});

describe('Scenario: Every trace hue is legible on the canvas ground', () => {
  it('gives every trace line at least 4.5:1 against --void', () => {
    for (const id of TRACE_IDS) {
      const ratio = contrastRatio(TRACE[id].line, NEUTRAL.void);
      expect(ratio, `${id} is ${ratio.toFixed(2)}:1 on --void`).toBeGreaterThanOrEqual(4.5);
      // Which exceeds the 3:1 graphical minimum.
      expect(ratio).toBeGreaterThan(3);
    }
  });
});

describe('Scenario: Focus is always visible', () => {
  it('exceeds 3:1 on every surface the focus ring can appear on', () => {
    for (const surface of SURFACES) {
      expect(contrastRatio(SIGNAL.focus, NEUTRAL[surface])).toBeGreaterThan(3);
    }
    // The tightest is on --surface-3, at 7.24:1.
    expect(contrastRatio(SIGNAL.focus, NEUTRAL['surface-3'])).toBeCloseTo(7.24, 2);
  });
});

describe('Scenario: The colourblind-safe palette preserves distinguishability', () => {
  const KINDS: Dichromacy[] = ['deuteranopia', 'protanopia', 'tritanopia'];

  it('keeps every substituted hue at 4.5:1 against --void', () => {
    for (const id of TRACE_IDS) {
      const ratio = contrastRatio(TRACE_COLORBLIND_SAFE[id], NEUTRAL.void);
      expect(ratio, `${id} substitute is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps every pair mutually distinguishable under normal vision too', () => {
    for (let i = 0; i < TRACE_IDS.length; i += 1) {
      for (let j = i + 1; j < TRACE_IDS.length; j += 1) {
        const a = TRACE_IDS[i]!;
        const b = TRACE_IDS[j]!;
        expect(deltaE(parseHex(TRACE_COLORBLIND_SAFE[a]), parseHex(TRACE_COLORBLIND_SAFE[b]))).toBeGreaterThan(26);
      }
    }
  });

  it('keeps every pair mutually distinguishable under all three simulations', () => {
    // A CIE76 distance of 26 is well above the "just noticeable" threshold for
    // large coloured areas such as a trace line, and is the floor the palette was
    // selected against.
    const MINIMUM_DELTA_E = 26;
    for (const kind of KINDS) {
      for (let i = 0; i < TRACE_IDS.length; i += 1) {
        for (let j = i + 1; j < TRACE_IDS.length; j += 1) {
          const a = TRACE_IDS[i]!;
          const b = TRACE_IDS[j]!;
          const distance = deltaE(
            simulate(TRACE_COLORBLIND_SAFE[a], kind),
            simulate(TRACE_COLORBLIND_SAFE[b], kind),
          );
          expect(distance, `${a} vs ${b} under ${kind} is ${distance.toFixed(1)}`).toBeGreaterThan(MINIMUM_DELTA_E);
        }
      }
    }
  });

  it('substitutes only the trace tokens, leaving structure untouched', () => {
    expect(Object.keys(TRACE_COLORBLIND_SAFE).sort()).toEqual([...TRACE_IDS].sort());
  });
});

describe('Requirement: Spacing, Radius, And Density', () => {
  it('uses a 4 px base scale with exactly the specified steps', () => {
    expect([...SPACE]).toEqual([4, 8, 12, 16, 24, 32, 48, 64]);
    for (const value of SPACE) expect(value % 4).toBe(0);
  });

  it('defines exactly four radii', () => {
    expect(RADIUS).toEqual({ chip: 3, control: 6, panel: 10, pill: 999 });
  });
});

describe('Requirement: Motion', () => {
  it('defines exactly three durations and one easing curve, none over 280 ms', () => {
    expect(MOTION).toEqual({ micro: 120, standard: 200, deliberate: 280 });
    for (const duration of Object.values(MOTION)) expect(duration).toBeLessThanOrEqual(280);
    expect(EASE).toBe('cubic-bezier(0.2, 0, 0, 1)');
  });
});

describe('Requirement: Typography', () => {
  it('declares exactly the eight specified steps with their published metrics', () => {
    expect(Object.keys(TYPE)).toEqual([
      'vital-xl', 'vital-l', 'vital-m', 'title', 'subtitle', 'body', 'label', 'micro',
    ]);
    expect(TYPE['vital-xl']).toEqual({ sizePx: 56, lineHeight: 1.0, weight: 600, trackingEm: -0.02 });
    expect(TYPE['micro']).toEqual({ sizePx: 11, lineHeight: 1.3, weight: 500, trackingEm: 0.04 });
    expect(TYPE['label']?.uppercase).toBe(true);
  });
});

describe('Scenario: Alarm treatment matches the clinical standard', () => {
  it('uses the IEC 60601-1-8 flash rate bands', () => {
    expect(ALARM_FLASH_HZ.critical.min).toBe(1.4);
    expect(ALARM_FLASH_HZ.critical.max).toBe(2.8);
    expect(ALARM_FLASH_HZ.warning.min).toBe(0.4);
    expect(ALARM_FLASH_HZ.warning.max).toBe(0.8);
    expect(ALARM_FLASH_HZ.advisory.nominal).toBe(0);
    // The nominal rate each priority actually flashes at sits inside its band.
    for (const priority of ['critical', 'warning'] as const) {
      const band = ALARM_FLASH_HZ[priority];
      expect(band.nominal).toBeGreaterThanOrEqual(band.min);
      expect(band.nominal).toBeLessThanOrEqual(band.max);
    }
    // High priority is unambiguously faster than medium, so priority is
    // distinguishable without reading.
    expect(ALARM_FLASH_HZ.critical.min).toBeGreaterThan(ALARM_FLASH_HZ.warning.max);
  });
});

describe('Requirement: Component Inventory', () => {
  it('declares touch minimums at both densities with a gap that compensates', () => {
    expect(HIT_TARGET.comfortable).toBeGreaterThanOrEqual(44);
    expect(HIT_TARGET.compact).toBeGreaterThanOrEqual(40);
    expect(MIN_TARGET_GAP).toBeGreaterThanOrEqual(8);
  });
});

describe('Requirement: Breakpoints And Reflow', () => {
  it('defines exactly the five specified breakpoints', () => {
    expect(BREAKPOINTS).toEqual({ xs: 360, sm: 768, md: 1024, lg: 1440, xl: 1920 });
  });
});
