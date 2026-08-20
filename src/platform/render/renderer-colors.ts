/**
 * Resolves the renderer's colours from the one token module, so the canvas and
 * the DOM cannot drift (design/design-system → Canvas and DOM agree).
 */
import { NEUTRAL, TRACE, TRACE_COLORBLIND_SAFE, parseHex, type TraceId } from '@platform/tokens/tokens';
import type { RendererColors } from './sweep-renderer';

/** Opacity of the sensor-artifact hatch, per the design system. */
const ARTIFACT_HATCH_OPACITY = 0.2;

function withOpacity(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function rendererColors(): RendererColors {
  return {
    background: NEUTRAL.void,
    gridColor: NEUTRAL['line-subtle'],
    artifactHatch: withOpacity(NEUTRAL['text-tertiary'], ARTIFACT_HATCH_OPACITY),
  };
}

/** The line colour for a trace, honouring the colourblind-safe modifier. */
export function traceColor(id: TraceId, colorblindSafe: boolean): string {
  return colorblindSafe ? TRACE_COLORBLIND_SAFE[id] : TRACE[id].line;
}
