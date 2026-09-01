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
    // The count is a figure at the top of the page now rather than a sentence in
    // the middle of it, which makes it harder to miss, not easier. The assertion
    // moves with it: the value and the thing it counts, both present, and the
    // paragraph that says an empty board is a published fact rather than an
    // oversight still underneath.
    expect(markup).toContain('<span class="figure__value">0</span>');
    expect(markup).toContain('Clinicians on the editorial board');
    expect(markup).toContain('published as empty');
    // A zero reported as a shortfall rather than as a neutral statistic.
    expect(markup).toMatch(/<div class="figure" data-tone="warning">/);
  });

  it('reports how many items are signed, as a figure, before it explains it', () => {
    expect(report.signedItems).toBe(0);
    expect(markup).toContain(`<span class="figure__value">0 / ${report.total}</span>`);
    expect(markup).toContain('Items signed by a clinician');
  });

  /**
   * The 255-item roll is behind a control, and every word of it is still served.
   *
   * "No count without its list" is the rule this page exists to keep. Disclosure
   * is how a 255-row list stays keepable: it is rendered closed, so the counts
   * above it are legible, and it is rendered PRESENT, so a crawler and a reader
   * with scripting off receive the same list as everyone else.
   */
  it('keeps every item in the served markup, behind a control rather than removed', () => {
    expect(markup).toContain('class="disclosure disclosure--group"');
    for (const group of report.groups.filter((entry) => entry.count > 0)) {
      expect(markup).toContain(`${group.count} items`);
      for (const item of group.items) expect(markup).toContain(item.id);
    }
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
