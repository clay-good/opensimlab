/** @vitest-environment jsdom */
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { SCENARIOS } from '@anesthesia/scenarios';
import { ScenarioIndex } from '@routes/AnesthesiaRoute';
import { OncologyRoute } from '@routes/modules/oncology';

afterEach(() => history.replaceState(null, '', '/'));

/**
 * Anaesthesia's index is the same index every other module has.
 *
 * It used to carry a `Find a scenario` panel that no other module had: a
 * preparation-path picker, a search box, and difficulty, duration and maturity
 * selects, with URL state behind them. The selects overflowed their container so
 * it looked broken; every filter but one was a no-op because all 255 items in
 * this build carry the same maturity; and it made anaesthesia the module with
 * the special catalogue, so a visitor arriving at anaesthesia and then at
 * oncology met two different products.
 *
 * These tests used to assert that panel existed. They now assert it does not,
 * and that the two indexes agree, which is the property that was actually
 * wanted: a learner should not have to relearn the page per specialty.
 */
describe('scenario catalog', () => {
  it('prerenders every scenario for search and no-script readers', () => {
    history.replaceState(null, '', '/anesthesia');
    const markup = renderToStaticMarkup(<ScenarioIndex />);
    expect(markup.match(/class="scenario-index__item"/g)).toHaveLength(SCENARIOS.length);
    for (const scenario of SCENARIOS) {
      expect(markup).toContain(`/anesthesia/scenario/${scenario.metadata.id}`);
      expect(markup).toContain(scenario.metadata.title);
    }
  });

  it('carries no filter panel, so every module index reads the same', () => {
    history.replaceState(null, '', '/anesthesia');
    const markup = renderToStaticMarkup(<ScenarioIndex />);
    for (const removed of [
      'Find a scenario', 'Patient, problem, or skill', 'Clear filters',
      'catalog-controls', 'Any difficulty', 'Any duration', 'Any maturity',
      'Filtering needs JavaScript',
    ]) {
      expect(markup, `${removed} is back on the anaesthesia index`).not.toContain(removed);
    }
  });

  it('shows the whole list whatever query string it is given', () => {
    // The filter state used to live in the URL, so a stale shared link could
    // hide most of the catalogue. Nothing is hidden from anyone now.
    history.replaceState(null, '', '/anesthesia?q=not-a-clinical-concept&difficulty=advanced');
    const markup = renderToStaticMarkup(<ScenarioIndex />);
    expect(markup.match(/class="scenario-index__item"/g)).toHaveLength(SCENARIOS.length);
    expect(markup).not.toContain('No scenarios match yet');
  });

  it('renders the same structure as a peer module', () => {
    history.replaceState(null, '', '/anesthesia');
    const anesthesia = renderToStaticMarkup(<ScenarioIndex />);
    history.replaceState(null, '', '/oncology');
    const oncology = renderToStaticMarkup(<OncologyRoute path="/oncology" />);
    for (const shared of [
      'class="reading"', 'catalog-path__eyebrow', 'class="scenario-index"',
      'class="scenario-index__item"', 'class="scenario-index__title"',
      'class="scenario-index__patient"', 'class="scenario-index__teaches"',
    ]) {
      expect(anesthesia, `anaesthesia is missing ${shared}`).toContain(shared);
      expect(oncology, `oncology is missing ${shared}`).toContain(shared);
    }
  });
});
