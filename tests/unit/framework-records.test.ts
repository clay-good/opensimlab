import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { DocumentRoute } from '@routes/DocumentRoute';
import { FRAMEWORKS } from '@anesthesia/curriculum/frameworks';
import { FRAMEWORK_READINGS } from '@platform/curriculum/readings';
import { SOURCES } from '@platform/docs/sources';
import { mappingCsv } from '@anesthesia/curriculum/mapping';
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

  /**
   * A reading names a published document to an educator, and the register is
   * where this project records what that document actually said and when
   * somebody looked. The NCSBN reading shipped without an entry and nothing
   * noticed, which is what this pairing exists to stop: the map is exhaustive
   * in both directions, so a new reading cannot ship uncited and an entry
   * cannot outlive the reading it supports.
   */
  const REGISTERED: Readonly<Record<string, string>> = {
    'nbcrna-nce': 'nbcrna-nce-content-outline',
    'coa-standards': 'coa-practice-doctorate-standards',
    'acgme-anesthesiology-milestones-2': 'acgme-anesthesiology-milestones-2',
    'aamc-core-epas': 'aamc-core-epas-toolkits',
    'ncsbn-ncjmm': 'ncsbn-nclex-rn-test-plan-2026',
    'acgme-emergency-medicine': 'acgme-emergency-medicine-milestones',
    'acgme-pediatrics': 'acgme-pediatrics-milestones',
    'acgme-neurology': 'acgme-neurology-milestones',
    'acgme-obstetrics-gynecology': 'acgme-obstetrics-gynecology-milestones',
    'acgme-internal-medicine': 'acgme-internal-medicine-milestones',
  };

  it('registers every framework reading as a source, checked no earlier than the reading', () => {
    const readings = FRAMEWORK_READINGS;
    expect(readings.map((reading) => reading.id).sort()).toEqual(Object.keys(REGISTERED).sort());
    for (const reading of readings) {
      const source = SOURCES.find((entry) => entry.id === REGISTERED[reading.id]);
      expect(source, `${reading.id} has no register entry`).toBeDefined();
      expect(source!.verifiedOn >= reading.recordedOn, `${source!.id} was checked before the reading was recorded`).toBe(true);
      expect(source!.usedFor.length).toBeGreaterThan(0);
      expect(source!.verifiedAgainst.length).toBeGreaterThan(0);
    }
  });

  /**
   * The 2026 NCLEX-RN Test Plan permits a nonprofit educational reproduction
   * and requires this credit on material that incorporates one. The six step
   * names are reproduced verbatim, so the credit travels with them.
   */
  it('carries the credit the NCSBN document requires wherever its names are reproduced', () => {
    expect(FRAMEWORK_READINGS.find((reading) => reading.id === 'ncsbn-ncjmm')!.note)
      .toContain('Portions copyrighted by the National Council of State Boards of Nursing, Inc. All rights reserved.');
  });

  it('exports every framework with its version in the mapping CSV', () => {
    const csv = mappingCsv();
    for (const framework of FRAMEWORKS) {
      expect(csv).toContain(framework.id);
      expect(csv).toContain(framework.version.includes(',') ? `"${framework.version}"` : framework.version);
    }
  });
});
