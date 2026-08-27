/**
 * Theater Dark — the single source of truth for every design value
 * (design/design-system → Tokens Are The Single Source Of Truth).
 *
 * This module is the ONLY place a colour, size, spacing value, radius, or
 * duration is written down. `scripts/build-tokens.ts` emits the CSS custom
 * properties from it, and canvas rendering imports the same constants, so the
 * DOM and the canvas cannot drift apart.
 *
 * There is exactly one theme. Accessibility adjustments are modifiers that
 * override a small set of these tokens on the root element; they are not
 * alternative themes.
 */

/** The neutral ramp. All interface chrome is drawn from these and nothing else. */
export const NEUTRAL = {
  void: '#06080B',
  'surface-0': '#0B0F14',
  'surface-1': '#11161D',
  'surface-2': '#171E27',
  'surface-3': '#1F2833',
  'surface-input': '#0E141B',
  'line-subtle': '#1C242E',
  line: '#27313D',
  'line-strong': '#384453',
  'text-primary': '#E9EEF5',
  'text-secondary': '#A3B1C2',
  'text-tertiary': '#8593A4',
  'text-on-accent': '#06080B',
} as const;

/**
 * The modal scrim: `--void` at 72%. It belongs to the neutral ramp rather than
 * being a decorative colour, and it is declared here so no component writes an
 * rgba() literal of its own.
 */
export const SCRIM_OPACITY = 0.72;

/** The five physiological trace hues. A sixth SHALL NOT be introduced. */
export const TRACE = {
  ecg: { line: '#3DDC84', dim: '#1B5C39', fill: 'rgba(61,220,132,0.14)' },
  arterial: { line: '#FF5C5C', dim: '#6B2020', fill: 'rgba(255,92,92,0.14)' },
  capno: { line: '#FFD426', dim: '#6B5A10', fill: 'rgba(255,212,38,0.14)' },
  spo2: { line: '#22D3EE', dim: '#0E5766', fill: 'rgba(34,211,238,0.14)' },
  neuro: { line: '#B388FF', dim: '#4A3673', fill: 'rgba(179,136,255,0.14)' },
} as const;

export type TraceId = keyof typeof TRACE;
export const TRACE_IDS = Object.keys(TRACE) as TraceId[];

/**
 * The colourblind-safe trace palette.
 *
 * Chosen by searching, for each of the five signals, the colours within 55 degrees
 * of that signal's own hue that clear 4.6:1 against `--void`, and taking the set
 * whose worst pairwise CIE76 distance under deuteranopia, protanopia, tritanopia
 * AND normal vision is at least 26, while staying as close to the original hues as
 * that allows. The result keeps the learned associations — the trace a learner
 * knows as green is still green — while separating every pair by lightness where
 * a dichromatic observer cannot separate it by hue.
 *
 * `tests/unit/tokens-contrast.test.ts` asserts both properties, so this palette
 * cannot silently regress.
 */
export const TRACE_COLORBLIND_SAFE: Record<TraceId, string> = {
  ecg: '#B3EFC9',
  arterial: '#E17070',
  capno: '#EED263',
  spo2: '#2ECEFA',
  neuro: '#7C70E1',
};

/** Alarm severity and the single focus accent. No other saturated colour exists. */
export const SIGNAL = {
  'alarm-critical': '#FF3B3B',
  'alarm-critical-text': '#FF8080',
  'alarm-critical-bg': 'rgba(255,59,59,0.12)',
  'alarm-warning': '#FFB020',
  'alarm-warning-bg': 'rgba(255,176,32,0.12)',
  'alarm-advisory': '#A3B1C2',
  'alarm-advisory-bg': 'rgba(163,177,194,0.10)',
  focus: '#7FB8FF',
} as const;

/**
 * IEC 60601-1-8 alarm flash rates. High priority flashes at 1.4-2.8 Hz and medium
 * at 0.4-0.8 Hz; low priority is a steady indication.
 */
export const ALARM_FLASH_HZ = {
  high: { min: 1.4, max: 2.8, nominal: 2.0 },
  medium: { min: 0.4, max: 0.8, nominal: 0.6 },
  low: { min: 0, max: 0, nominal: 0 },
} as const;

export interface TypeStyle {
  readonly sizePx: number;
  readonly lineHeight: number;
  readonly weight: number;
  readonly trackingEm: number;
  readonly uppercase?: boolean;
}

/** The type scale. No other size appears in source. */
export const TYPE: Record<string, TypeStyle> = {
  'vital-xl': { sizePx: 56, lineHeight: 1.0, weight: 600, trackingEm: -0.02 },
  'vital-l': { sizePx: 40, lineHeight: 1.0, weight: 600, trackingEm: -0.02 },
  'vital-m': { sizePx: 28, lineHeight: 1.05, weight: 600, trackingEm: -0.01 },
  title: { sizePx: 20, lineHeight: 1.3, weight: 600, trackingEm: -0.01 },
  subtitle: { sizePx: 16, lineHeight: 1.4, weight: 500, trackingEm: 0 },
  body: { sizePx: 15, lineHeight: 1.55, weight: 400, trackingEm: 0 },
  label: { sizePx: 13, lineHeight: 1.3, weight: 500, trackingEm: 0.06, uppercase: true },
  micro: { sizePx: 11, lineHeight: 1.3, weight: 500, trackingEm: 0.04 },
};

/** The 4 px base spacing scale, exposed as --space-1 through --space-8. */
export const SPACE = [4, 8, 12, 16, 24, 32, 48, 64] as const;

/** The only four corner radii. */
export const RADIUS = { chip: 3, control: 6, panel: 10, pill: 999 } as const;

/** Exactly three durations and one easing curve. No transition exceeds 280 ms. */
export const MOTION = { micro: 120, standard: 200, deliberate: 280 } as const;
export const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

/** The five breakpoints, in CSS pixels. */
export const BREAKPOINTS = { xs: 360, sm: 768, md: 1024, lg: 1440, xl: 1920 } as const;
export type BreakpointName = keyof typeof BREAKPOINTS;

/** Control heights at each density. Both use only spacing-scale-compatible values. */
export const CONTROL_HEIGHT = { comfortable: 40, compact: 32 } as const;
/** Minimum hit target in CSS pixels at each density. */
export const HIT_TARGET = { comfortable: 44, compact: 40 } as const;
/** Minimum gap between adjacent hit targets, in CSS pixels. */
export const MIN_TARGET_GAP = 8;

/** Layout constants from design/layout. */
export const LAYOUT = {
  statusBarHeightPx: 56,
  statusBarCompactHeightPx: 48,
  /**
   * The action region's default height. It is a FLOOR and a preference, not a
   * fixed geometry: the region's real default is `clamp(minPx, viewportShare of
   * the viewport height, maxPx)`, and the learner can drag it anywhere between
   * the two bounds. A fixed 220 px left the drug tray a letterbox on a laptop
   * and wasted half a large display.
   */
  actionCockpitHeightPx: 260,
  actionCockpitMinPx: 160,
  actionCockpitMaxPx: 560,
  /** Share of viewport height the action region takes before the learner moves it. */
  actionCockpitViewportShare: 0.32,
  /** The draggable separators: a hairline to look at, a real target to grab. */
  dividerThicknessPx: 1,
  dividerHitTargetPx: 12,
  alarmRailHeightPx: 48,
  /** Analysis region share of width at md and above. */
  analysisWidthFraction: 0.42,
  monitorWidthFraction: 0.58,
  /** Bounds the draggable divider snaps back into. */
  dividerMinFraction: 0.3,
  dividerMaxFraction: 0.6,
  /** WaveformCanvas share of the Monitor region's width. */
  waveformWidthFraction: 0.72,
  vitalColumnWidthFraction: 0.28,
  /** Content is capped and centred on very wide displays. */
  maxContentWidthPx: 2200,
  /** Minimum vertical space per trace at the smallest supported viewport. */
  minTraceHeightPx: 56,
  /** Traces are never reduced below this count. */
  minTraceCount: 3,
} as const;

/**
 * The explicit sacrifice order when vertical space runs out
 * (design/layout → Sacrifice Order Is Explicit).
 */
export const SACRIFICE_ORDER = [
  'trend-sparklines',
  'alarm-limit-text',
  'analysis-region',
  'patient-summary-detail',
  'trace-count',
] as const;

// ---------------------------------------------------------------------------
// Colour mathematics, used by the contrast test and by the canvas renderer.
// ---------------------------------------------------------------------------

export interface Rgb { r: number; g: number; b: number }

/** Parse `#rrggbb` into 0-255 channels. */
export function parseHex(hex: string): Rgb {
  const value = hex.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

/** WCAG relative luminance. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const channel = (value: number): number => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two opaque colours. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
