import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_RESPIRATORY_DISTRESS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-respiratory-distress';

describe('Pediatrics module user-facing foundation', () => {
  it('renders a calm index with seven child-focused scenarios and shared navigation', () => {
    const markup = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(markup).toContain('<h1>Pediatrics simulator</h1>');
    expect(markup).toContain('href="/pediatrics" aria-current="page"');
    expect(markup).toContain('href="/pediatrics/scenario/pediatric-respiratory-distress"');
    expect(markup).toContain('Pediatric respiratory distress');
    expect(markup).toContain('href="/pediatrics/scenario/bronchiolitis"');
    expect(markup).toContain('Bronchiolitis');
    expect(markup).toContain('href="/pediatrics/scenario/croup"');
    expect(markup).toContain('Croup with stridor at rest');
    expect(markup).toContain('href="/pediatrics/scenario/pediatric-status-asthmaticus"');
    expect(markup).toContain('Pediatric status asthmaticus after initial care');
    expect(markup).toContain('href="/pediatrics/scenario/pediatric-sepsis"');
    expect(markup).toContain('Pediatric sepsis without shock');
    expect(markup).toContain('href="/pediatrics/scenario/pediatric-septic-shock"');
    expect(markup).toContain('Pediatric septic shock');
    expect(markup).toContain(
      'href="/pediatrics/scenario/pediatric-dehydration-with-hypovolemia"');
    expect(markup).toContain('Pediatric dehydration with hypovolemia');
  });

  it('briefs the bounded child without perioperative ASA language or treatment claims', () => {
    const markup = renderToStaticMarkup(createElement(Prebrief, {
      scenario: SCENARIO, region: UNITED_STATES, environment: 'pediatrics',
      onStart: () => {}, guidance: 'guided', onGuidance: () => {},
    }));
    expect(markup).toContain('6-year-old girl, 20 kg');
    expect(markup).toContain('follow the whole-child trajectory at your own pace');
    expect(markup).toContain('not diagnosis, dosing, device use, or procedures');
    expect(markup).not.toContain('ASA 3');
  });

  it('prerenders the exact scenario with sources, limitations, and child wording', () => {
    const markup = renderToStaticMarkup(createElement(PrerenderedBody, {
      path: '/pediatrics/scenario/pediatric-respiratory-distress',
    }));
    expect(markup).toContain('<h1>Pediatric respiratory distress</h1>');
    expect(markup).toContain('6-year-old girl');
    expect(markup).toContain('Review and sources');
    expect(markup).toContain('Not clinically reviewed');
    expect(markup).toContain('not a dosing calculator');
  });
});
