/**
 * @vitest-environment jsdom
 *
 * The pharmacology sandbox page as a learner opens it
 * (learning/knowledge-layer → The Sandbox). Rendered from the address, because
 * the state lives in the URL and a shared link has to open exactly what it says.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { SandboxRoute } from '@routes/SandboxRoute';
import { SCENARIOS } from '@anesthesia/scenarios';
import { authoredValues, sandboxCatalogue, sandboxQuery } from '@anesthesia/sandbox/pharmacology-sandbox';

const catalogue = sandboxCatalogue(SCENARIOS);

function page(search: string): string {
  window.history.replaceState(null, '', `/anesthesia/sandbox${search}`);
  return renderToStaticMarkup(createElement(SandboxRoute));
}
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/\s+/g, ' ');

describe('the pharmacology sandbox page', () => {
  it('opens on a default bolus with both plots, the values in a table, the model\'s source and a case to go to', () => {
    const markup = page('');
    const body = text(markup);
    expect(body).toContain('Pharmacology sandbox');
    expect((markup.match(/<svg[^>]*role="img"/g) ?? []).length).toBe(2);
    expect(markup).toContain('<table>');
    expect(body).toContain('Model: Eleveld');
    expect(markup).toContain('href="/anesthesia/scenario/routine-induction"');
    // Every input is a choice from the lessons; nothing here is typed.
    expect(markup).not.toMatch(/type="(number|text)"/);
    expect(markup).not.toContain('<textarea');
  });

  it('Scenario: A learner can isolate one variable', () => {
    const ages = authoredValues(catalogue, 'ageYears');
    const values = [ages[0]!, 45, ages.at(-1)!];
    const markup = page(`?${sandboxQuery({ modelId: 'propofol-schnider-1998', patientId: 'routine-induction', dose: 100, minutes: 10,
      vary: { covariate: 'ageYears', values } })}`);
    // One polyline per age on each plot, and one table row per age.
    expect((markup.match(/<polyline/g) ?? []).length).toBe(values.length * 2);
    expect((markup.match(/<tr>/g) ?? []).length).toBe(values.length + 1);
    // The child is outside Schnider's adult envelope: drawn, dimmed and dashed, and labelled.
    expect(markup).toContain('stroke-dasharray="6 4"');
    expect(markup).toContain('var(--text-tertiary)');
    expect(text(markup)).toContain('Out of range');
  });

  it('refuses a link it cannot honour and says so, rather than drawing a guess', () => {
    const body = text(page('?model=propofol-eleveld-2018&patient=routine-induction&dose=999&minutes=10'));
    expect(body).toContain('That link could not be opened');
    expect(body).toContain('999 mg is not a dose any lesson');
  });
});
