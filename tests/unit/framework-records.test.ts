import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { DocumentRoute } from '@routes/DocumentRoute';
import { FRAMEWORKS } from '@anesthesia/curriculum/frameworks';
import {
  frameworkRecordProblems, latestReviewBy, overdueFrameworks, type FrameworkRecord,
} from '@platform/curriculum/framework-records';

const record = (overrides: Partial<FrameworkRecord> = {}): FrameworkRecord => ({
  ...FRAMEWORKS[0]!, recordedOn: '2026-08-20', reviewBy: '2028-08-20', ...overrides,
});

describe('framework records', () => {
  it('every shipped reading is dated and due for re-check within 24 months', () => {
    for (const framework of FRAMEWORKS) expect(frameworkRecordProblems(framework), framework.id).toEqual([]);
  });

  it('refuses a re-check date more than 24 months on, or not after the recording', () => {
    expect(latestReviewBy('2026-08-20')).toBe('2028-08-20');
    expect(frameworkRecordProblems(record({ reviewBy: '2028-08-21' })))
      .toEqual(['reviewBy is more than 24 months after recordedOn']);
    expect(frameworkRecordProblems(record({ reviewBy: '2026-08-20' }))).toEqual(['reviewBy is not after recordedOn']);
    expect(frameworkRecordProblems(record({ recordedOn: 'August 2026' }))).toEqual(['recordedOn is not an ISO date']);
  });

  it('lets a verbatim record carry only short names', () => {
    const long = { id: 'long', label: 'A sentence copied from the published document that runs past a name', description: 'x' };
    expect(frameworkRecordProblems(record({ fidelity: 'verbatim', domains: [long] })))
      .toEqual(['verbatim label "long" is longer than a short name; mark the record summarised']);
    expect(frameworkRecordProblems(record({ fidelity: 'summarised', domains: [long] }))).toEqual([]);
  });

  it('lists overdue readings, oldest first', () => {
    const records = [record({ id: 'b', reviewBy: '2027-01-01' }), record({ id: 'a', reviewBy: '2026-12-01' }), record({ id: 'c' })];
    expect(overdueFrameworks(records, '2027-06-01').map((entry) => entry.id)).toEqual(['a', 'b']);
  });

  it('shows every reading and its re-check date on the governance page', () => {
    const markup = renderToStaticMarkup(createElement(DocumentRoute, { path: '/governance' }));
    expect(markup).toContain('Framework readings');
    for (const framework of FRAMEWORKS) expect(markup).toContain(framework.reviewBy);
  });
});
