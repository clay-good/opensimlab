/**
 * deliberate-practice-loop → "no sum, mean, score, or distance figure is
 * exported by the overlay module".
 *
 * The overlay draws a learner's run beside an expert's. The failure mode is not
 * a bug: it is the slow, reasonable-looking addition of one number that says
 * how close they were, which is a ranking whatever it is called. This test is
 * the thing that makes that addition visible in a diff.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as overlay from '@anesthesia/debrief/expert-overlay';

const source = readFileSync('src/modules/anesthesia/debrief/expert-overlay.ts', 'utf8');
/** Comments explain the rule; the code is what has to follow it. */
const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

describe('Requirement: the expert overlay computes no figure that ranks a run', () => {
  it('exports nothing whose name is a score, a total, or a distance', () => {
    for (const name of Object.keys(overlay)) {
      expect(name, `${name} is exported by the overlay module`)
        .not.toMatch(/score|total|sum|mean|average|distance|closeness|accuracy|percent|rank|grade/i);
    }
  });

  /**
   * The one arithmetic the overlay is allowed is the difference between two
   * moments, which names one behaviour and one consequence. Anything that
   * reduces a run to a figure - a sum, an average, a percentage - is not.
   */
  it('performs no aggregation in its own code', () => {
    expect(code).not.toMatch(/\.reduce\(/);
    expect(code).not.toMatch(/Math\.(?:hypot|abs)\s*\(\s*learner/);
    expect(code).not.toMatch(/\/\s*(?:length|count)\b/);
    expect(code).not.toMatch(/\b(?:score|total|average|percentage)\b/i);
  });

  /**
   * A difference in seconds is a moment compared with a moment. It is reported
   * only where both runs met the objective, and the field's own name says what
   * it is rather than implying a verdict.
   */
  it('reports a difference between two moments and nothing else numeric', () => {
    const numericFields = [...source.matchAll(/readonly (\w+): number(?: \| null)?;/g)]
      .map((match) => match[1]);
    // Three moments and one difference between two of them. Nothing else here
    // is a number, which is what keeps the overlay from having a verdict.
    expect([...new Set(numericFields)].sort())
      .toEqual(['differenceSeconds', 'expertTick', 'learnerTick', 'tick', 'ticksPerSecond']);
  });
});
