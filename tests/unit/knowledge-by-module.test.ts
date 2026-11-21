import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { knowledgeByModule, reviewStatusItems } from '@platform/governance/review-status';
import { ReviewStatusBody } from '@platform/governance/ReviewStatusBody';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { DRUG_CARDS } from '@anesthesia/content/drug-cards';
import { availableModules } from '@platform/modules/registry';

describe('knowledge items on the review-status page, by module', () => {
  it('lists every available module, including the ones with none yet', () => {
    const rows = knowledgeByModule();
    expect(rows.map((row) => row.route).sort()).toEqual(availableModules().map((module) => module.route).sort());
    const anesthesia = rows.find((row) => row.route === 'anesthesia')!;
    expect(anesthesia.explainers).toBe(EXPLAINERS.length);
    expect(anesthesia.cards).toBe(DRUG_CARDS.length);
    expect(anesthesia.maturities.reduce((sum, entry) => sum + entry.count, 0)).toBe(EXPLAINERS.length + DRUG_CARDS.length);
  });

  it('counts only knowledge items, never scenarios or rules', () => {
    const knowledge = reviewStatusItems().filter((item) => item.kind === 'explainer' || item.kind === 'drug-card').length;
    expect(knowledgeByModule().reduce((sum, row) => sum + row.explainers + row.cards, 0)).toBe(knowledge);
  });

  it('renders a row per module, with "None yet" where a module has none', () => {
    const markup = renderToStaticMarkup(createElement(ReviewStatusBody));
    expect(markup).toContain('Explainers and intervention cards, by module');
    const empty = knowledgeByModule().filter((row) => row.maturities.length === 0).length;
    expect((markup.match(/None yet/g) ?? []).length).toBe(empty);
  });
});
