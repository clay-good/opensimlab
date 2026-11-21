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
    expect(body).toContain('Sandbox');
    expect(body).toContain('Pharmacology');
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

  it('Scenario: the physiology view shows a healthy adult desaturating on Benumof\'s clock, and labels what it rests on', () => {
    const markup = page('?view=physiology&profile=healthy&fio2=1&pattern=apnea&minutes=10');
    const body = text(markup);
    expect(body).toContain('Physiology: oxygen during apnoea');
    expect((markup.match(/<svg[^>]*role="img"/g) ?? []).length).toBe(2);
    const minutes = Number(/Saturation reached 90% after ([\d.]+) minutes/.exec(body)?.[1]);
    expect(Math.abs(minutes - 8) / 8).toBeLessThanOrEqual(0.2);
    expect(body).toContain('Held to a published result');
    expect(text(page('?view=physiology&profile=term-pregnancy&fio2=1&pattern=apnea&minutes=10'))).toContain('Teaching calibration');
    expect(markup).toContain('href="/anesthesia/scenario/rapid-desaturation"');
  });

  it('Scenario: the circulation view shows the baroreflex answering blood loss, labelled from the engine', () => {
    const markup = page('?view=circulation&lesson=routine-induction&vasodilation=0&loss=20&vasopressor=0&minutes=5');
    const body = text(markup);
    expect(body).toContain('Circulation: the baroreflex');
    expect((markup.match(/<svg[^>]*role="img"/g) ?? []).length).toBe(2);
    const match = /heart rate (\d+) to (\d+)\/min/.exec(body)!;
    expect(Number(match[2])).toBeGreaterThan(Number(match[1]));
    expect(body).toContain('Not marked as a teaching term');
    // A vasopressor on top raises the pressure past rest, and the same reflex slows the heart instead.
    const pressed = text(page('?view=circulation&lesson=routine-induction&vasodilation=0&loss=20&vasopressor=1&minutes=5'));
    expect(pressed).toContain('Teaching term');
    const slowed = /heart rate (\d+) to (\d+)\/min/.exec(pressed)!;
    expect(Number(slowed[2])).toBeLessThan(Number(slowed[1]));
    expect(markup).toContain('href="/anesthesia/scenario/hypotension-after-induction"');
  });
});
