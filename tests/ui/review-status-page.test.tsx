/**
 * The review-status page renders the whole corpus, and the front door reaches it.
 *
 * The counts are the easy part; the requirement is that no count appears without
 * the list behind it, so these assertions check the items, not the totals.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { DocumentRoute } from '@routes/DocumentRoute';
import { Landing } from '@landing/Landing';
import { HONEST_STATUS } from '@platform/governance/status';
import { MATURITY_STATUSES } from '@platform/catalog/maturity';
import { reviewStatusReport } from '@platform/governance/review-status';

describe('Requirement: The Published Corpus Is Inspectable', () => {
  const markup = renderToStaticMarkup(createElement(DocumentRoute, { path: '/review-status' }));
  const report = reviewStatusReport();

  it('names every status in the vocabulary, including the empty ones', () => {
    for (const status of MATURITY_STATUSES) expect(markup).toContain(`<code>${status}</code>`);
  });

  it('prints every item, not just the totals', () => {
    for (const group of report.groups) {
      for (const item of group.items) expect(markup).toContain(`<code>${item.id}</code>`);
    }
    expect(markup).toContain(`${report.total} clinical content items`);
  });

  it('states the board is empty rather than omitting it', () => {
    expect(report.boardSize).toBe(0);
    expect(markup).toContain('0 clinicians on the editorial board');
    expect(markup).toContain('published as empty');
  });

  it('says plainly which gates report rather than block', () => {
    expect(markup).toContain('do not block');
    expect(markup).toContain('href="/limitations"');
    expect(markup).toContain('href="/governance"');
  });

  it('is reachable from the front door, through the claim it evidences', () => {
    const landing = renderToStaticMarkup(createElement(Landing));
    expect(landing).toContain('href="/review-status"');
    expect(landing).toContain(HONEST_STATUS.headline);
  });
});
