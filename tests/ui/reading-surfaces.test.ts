/**
 * The prose surfaces — validation, governance, limitations, privacy, curriculum.
 *
 * These are the pages a sceptical professor reads before deciding whether to
 * trust any of the rest of it, and several of them are mostly tables. A table
 * wide enough to push the document sideways turns the page into something you
 * have to fight on a phone.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const baseCss = readFileSync(join(process.cwd(), 'src/platform/tokens/base.css'), 'utf8');
const cockpitCss = readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8');
const componentsCss = readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8');

describe('Requirement: Wide Content Scrolls Inside Itself', () => {
  it('applies to every table on a reading surface, not only a direct child', () => {
    // This was `.reading > table`. The curriculum page nests its table one level
    // down inside a section, so that one table sized to its content, widened the
    // document, and scrolled the whole page sideways on a phone — which is the
    // exact failure the rule exists to prevent.
    expect(baseCss).toContain('.reading table { display: block; overflow-x: auto; }');
    expect(baseCss).not.toContain('.reading > table {');
  });

  it('keeps the numeric column narrow so prose gets the width', () => {
    expect(baseCss).toContain('.reading td.numeric, .reading th.numeric');
  });
});

describe('the routes that render a table', () => {
  const routeSource = (file: string) =>
    readFileSync(join(process.cwd(), 'src/routes', file), 'utf8');

  it('none of them wraps a table in its own scroller, so the rule is the only mechanism', () => {
    // If one of these grew a bespoke wrapper, the shared rule would stop being
    // the thing under test and a regression in it would go unnoticed here.
    for (const file of ['CurriculumRoute.tsx', 'DocumentRoute.tsx']) {
      const source = routeSource(file);
      if (!source.includes('<table>')) continue;
      expect(source, file).not.toContain('table-scroll');
    }
  });

  it('puts every table inside a .reading surface, which is what carries the rule', () => {
    for (const file of ['CurriculumRoute.tsx', 'DocumentRoute.tsx']) {
      const source = routeSource(file);
      if (!source.includes('<table>')) continue;
      expect(source, `${file} renders a table outside a reading surface`)
        .toContain('className="reading"');
    }
  });
});


describe('Requirement: A Prose Page Is As Wide As The Window', () => {
  it('bounds the document column, so no descendant can widen the page', () => {
    // An implicit grid column is `auto`, which floors at its widest child's
    // min-content. On the educator and review pages that floor came out at 396px
    // against a 375px phone, and the whole document scrolled sideways.
    const document = baseCss.slice(baseCss.indexOf('.document {'), baseCss.indexOf('.document__bar'));
    expect(document).toContain('grid-template-columns: minmax(0, 1fr);');
  });

  it('bounds the reading column for the same reason', () => {
    const reading = cockpitCss.slice(cockpitCss.indexOf('.reading {'), cockpitCss.indexOf('.reading > p'));
    expect(reading).toContain('grid-template-columns: minmax(0, 1fr);');
  });
});

describe('Requirement: A Field In Prose Reads As A Field', () => {
  it('puts the label on its own line above its control', () => {
    // `<label>` is inline. The debrief's `Your account` label sat on the same
    // line as the textarea after it, which pushed the field into the right half
    // of the column and left the label overlapping the hint below.
    expect(componentsCss).toContain('.field__label { display: block; }');
  });

  it('gives a textarea the width of its column rather than its `cols` attribute', () => {
    const textarea = componentsCss.slice(componentsCss.indexOf('textarea.field__input {'));
    expect(textarea.slice(0, 120)).toContain('inline-size: 100%');
  });
});

describe('Requirement: A Prose Page Primary Action Is Easy To Tap', () => {
  it('keeps the primary link at the comfortable touch-target minimum', () => {
    expect(componentsCss).toMatch(/\.button--primary \{[^}]*min-block-size: 44px/s);
  });
});
