/**
 * Presentation mode (platform/adoption → Classroom And Lecture Use).
 *
 * The requirement names three things and a distance: on a 3-metre projected
 * display, vital numerics render at no less than the equivalent of 120 px on a
 * 1080p projection, the trace stroke width doubles, and the chrome recedes.
 * Each is checked here against the thing that actually produces it, because
 * none of the three is visible to a unit test by looking at a screenshot.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SweepRenderer } from '@platform/render/sweep-renderer';

const cockpitCss = readFileSync(
  join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8',
);
const componentsCss = readFileSync(
  join(process.cwd(), 'src/platform/ui/components.css'), 'utf8',
);

/**
 * The scale is private, and stays private: nothing outside the renderer has a
 * reason to read it. The test reads it through the prototype rather than
 * widening the public surface for its own convenience.
 */
interface ScaleProbe {
  traceScale: number;
  setTraceScale(scale: number): void;
}
const probe = (): ScaleProbe =>
  Object.create(SweepRenderer.prototype) as unknown as ScaleProbe;

/** The rules that apply only while the cockpit carries the attribute. */
function presentationRules(): string {
  return cockpitCss.split('\n')
    .join('\n')
    .split(/(?=\.cockpit\[data-presentation='true'\])/)
    .filter((block) => block.startsWith(".cockpit[data-presentation='true']"))
    .join('\n');
}

describe('presentation mode', () => {
  /**
   * 120 px on a 1920 px-wide projection is 6.25vw. Expressing it that way
   * satisfies the requirement at any projection width rather than only at the
   * one the requirement happens to name, and `max()` stops it shrinking below
   * the ordinary size when the mode is left on at a desk.
   */
  it('sizes a vital numeric to at least 120 px on a 1080p projection', () => {
    const rules = presentationRules();
    expect(rules).toContain('.vital-tile__value');
    expect(rules).toMatch(/font-size:\s*max\(6\.25vw,\s*40px\)/);
    // 6.25vw is the requirement restated: at 1920 CSS px, 120 px.
    expect(1920 * 0.0625).toBe(120);
    // And the ordinary size it falls back to is the one the token sets.
    expect(componentsCss).toContain('font: var(--type-vital-l)');
  });

  it('doubles the trace stroke, and only the trace', () => {
    const renderer = probe();
    renderer.traceScale = 1;
    renderer.setTraceScale(2);
    expect(renderer.traceScale).toBe(2);
    expect(1.5 * renderer.traceScale).toBe(3);

    const source = readFileSync(
      join(process.cwd(), 'src/platform/render/sweep-renderer.ts'), 'utf8',
    );
    // The trace scales; the grid hairline does not, because the same sentence
    // of the requirement asks the chrome to recede.
    expect(source).toContain('context.lineWidth = 1.5 * this.traceScale;');
    expect(source).toContain('this.context.lineWidth = 1;');
    expect(source).not.toContain('this.context.lineWidth = 1 * this.traceScale');
  });

  it('refuses a scale outside one and two, so a trace stays a trace', () => {
    const renderer = probe();
    for (const [given, expected] of [[0, 1], [0.5, 1], [1, 1], [2, 2], [8, 2]] as const) {
      renderer.setTraceScale(given);
      expect([given, renderer.traceScale]).toEqual([given, expected]);
    }
  });

  /**
   * Receding, not disappearing. A facilitator is still driving the controls
   * they are projecting, and hiding them would take away the keyboard path
   * as well — which the room cannot see anyway.
   */
  it('lets the chrome recede without removing it', () => {
    const rules = presentationRules();
    for (const region of ['.cockpit__status', '.cockpit__actions', '.cockpit__analysis']) {
      expect(rules, region).toContain(region);
    }
    expect(rules).toMatch(/opacity:\s*0\.72/);
    expect(rules).not.toMatch(/display:\s*none/);
    expect(rules).not.toMatch(/visibility:\s*hidden/);
    // Hover and focus bring it back, so the control being used is never dim.
    expect(rules).toContain(':focus-within');
    expect(rules).toMatch(/opacity:\s*1/);
  });

  it('applies nothing at all until the cockpit carries the attribute', () => {
    // Every rule that enlarges or dims is scoped to the attribute. Checked by
    // reading each rule's own selector rather than by searching the file, which
    // cannot tell a scoped descendant from an unscoped one.
    const rules = cockpitCss.split('}')
      .map((block) => block.split('{'))
      .filter((parts) => parts.length === 2)
      .map(([selector, body]) => ({ selector: selector!.trim(), body: body! }));
    const enlargingOrDimming = rules.filter((rule) =>
      rule.body.includes('6.25vw') || rule.body.includes('1.5vw') || rule.body.includes('0.72'));
    expect(enlargingOrDimming.length).toBeGreaterThan(0);
    for (const rule of enlargingOrDimming) {
      expect(rule.selector, rule.selector).toContain("[data-presentation='true']");
    }
  });
});
