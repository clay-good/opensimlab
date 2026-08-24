/** @vitest-environment jsdom */
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { SCENARIOS } from '@anesthesia/scenarios';
import { ScenarioIndex } from '@routes/AnesthesiaRoute';

afterEach(() => history.replaceState(null, '', '/'));

describe('scenario catalog', () => {
  it('prerenders every scenario and its discovery controls for search and no-script readers', () => {
    history.replaceState(null, '', '/anesthesia');
    const markup = renderToStaticMarkup(<ScenarioIndex />);
    expect(markup).toContain('Find a scenario');
    expect(markup).toContain('Patient, problem, or skill');
    expect(markup).toContain('Filtering needs JavaScript');
    expect(markup.match(/class="scenario-index__item"/g)).toHaveLength(SCENARIOS.length);
    for (const scenario of SCENARIOS) {
      expect(markup).toContain(`/anesthesia/scenario/${scenario.metadata.id}`);
    }
  });

  it('restores a shared filtered URL without hiding the way back to all scenarios', () => {
    history.replaceState(null, '', '/anesthesia?q=pediatric&difficulty=introductory');
    const markup = renderToStaticMarkup(<ScenarioIndex />);
    expect(markup).toContain('routine-pediatric-iv-induction');
    expect(markup).not.toContain('/anesthesia/scenario/routine-induction"');
    expect(markup).toContain('Clear filters');
  });

  it('turns a chosen goal into a finite, honest, non-locking plan', () => {
    history.replaceState(null, '', '/anesthesia?goal=first-lab');
    const markup = renderToStaticMarkup(<ScenarioIndex />);
    expect(markup).toContain('Your private practice path');
    expect(markup).toContain('My first simulation lab');
    expect(markup).toContain('3 scenarios · 34 minutes');
    expect(markup).toContain('Recommended because you chose');
    expect(markup).toContain('does not assess psychomotor technique');
    expect(markup).toContain('Nothing is locked');
    expect(markup).toContain('#scenario:routine-induction@0.1.0');
  });

  it('offers a calm recovery when no scenario matches', () => {
    history.replaceState(null, '', '/anesthesia?q=not-a-clinical-concept');
    const markup = renderToStaticMarkup(<ScenarioIndex />);
    expect(markup).toContain('No scenarios match yet');
    expect(markup).toContain('Show all scenarios');
    expect(markup).not.toContain('class="scenario-index"');
  });
});
