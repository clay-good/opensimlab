/**
 * Acceptance tests for platform/clinical-governance → the published corpus states
 * what is published and under what label.
 *
 * Two of the eight preview gates report rather than block. That trade is only
 * defensible while the gap is visible, so these tests hold the surface that makes
 * it visible: every item listed, every count carrying its list, the board state
 * printed, and a route from the front door to all of it.
 */
import { describe, expect, it } from 'vitest';
import { MATURITY_STATUSES } from '@platform/catalog/maturity';
import { MATURITY_LABELS } from '@platform/governance/publication';
import { EDITORIAL_BOARD } from '@platform/governance/records';
import {
  exportDisclosureBlockers, honestySurfaceBlockers, itemKey, reviewStatusItems, reviewStatusReport,
} from '@platform/governance/review-status';
import { NOT_CLINICALLY_REVIEWED, NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { ROUTES, routeFor } from '@routes/routes';

describe('Requirement: Every Item Says What It Is Published As', () => {
  it('lists every item exactly once, with a status from the vocabulary', () => {
    const items = reviewStatusItems();
    expect(items.length).toBeGreaterThan(200);
    // Keyed on the route as well as the id: emergency medicine and critical care
    // both teach a `status-epilepticus` lesson, and they are different scenarios.
    const keys = new Set(items.map(itemKey));
    expect(keys.size).toBe(items.length);
    expect(items.filter((item) => item.id === 'status-epilepticus')).toHaveLength(2);
    for (const item of items) {
      expect(MATURITY_STATUSES).toContain(item.status);
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.contentVersion).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it('reports a group for every status, including the empty ones', () => {
    const report = reviewStatusReport();
    expect(report.groups.map((group) => group.status)).toEqual([...MATURITY_STATUSES]);
    for (const group of report.groups) {
      expect(group.count).toBe(group.items.length);
      expect(group.label).toBe(MATURITY_LABELS[group.status]);
      for (const item of group.items) expect(item.status).toBe(group.status);
    }
    // Every count carries its list: no aggregate is reported without one.
    expect(report.groups.reduce((sum, group) => sum + group.count, 0)).toBe(report.total);
  });

  it('reports the board state this build actually has', () => {
    const report = reviewStatusReport();
    expect(report.boardSize).toBe(EDITORIAL_BOARD.length);
    // Nothing may count as signed while the board is empty.
    if (report.boardSize === 0) expect(report.signedItems).toBe(0);
  });

  it('publishes the surface at a findable, indexable route', () => {
    const route = routeFor('/review-status');
    expect(route).toBeDefined();
    expect(route!.indexable).toBe(true);
    expect(route!.heading).toBe('Review status');
    expect(ROUTES.filter((entry) => entry.path === '/review-status')).toHaveLength(1);
  });
});

describe('Requirement: The Release Stops Without Its Honesty Surface', () => {
  const report = reviewStatusReport();

  it('passes on this build', () => {
    expect(honestySurfaceBlockers(ROUTES, report, report.total)).toEqual([]);
  });

  it('blocks when the route is gone', () => {
    const without = ROUTES.filter((route) => route.path !== '/review-status');
    expect(honestySurfaceBlockers(without, report, report.total)[0]).toContain('is missing');
    const noCorrections = ROUTES.filter((route) => route.path !== '/corrections');
    expect(honestySurfaceBlockers(noCorrections, report, report.total)[0])
      .toContain('no permanent record of what was wrong');
  });

  it('blocks when the surface exists but nobody can find it', () => {
    const hidden = ROUTES.map((route) => (
      route.path === '/review-status' ? { ...route, indexable: false } : route
    ));
    expect(honestySurfaceBlockers(hidden, report, report.total)[0]).toContain('not indexable');
  });

  it('blocks when the surface stops covering the whole corpus', () => {
    const blockers = honestySurfaceBlockers(ROUTES, report, report.total + 1);
    expect(blockers[0]).toContain('does not cover the corpus');
  });
});

describe('Requirement: The Release Stops When An Export Drops A Statement', () => {
  const both = [NOT_FOR_CLINICAL_USE, NOT_CLINICALLY_REVIEWED];

  it('passes plain text carrying both statements', () => {
    const text = `header\n${NOT_FOR_CLINICAL_USE}\n${NOT_CLINICALLY_REVIEWED}\n`;
    expect(exportDisclosureBlockers([{ name: 'log', text }], both)).toEqual([]);
  });

  it('passes JSON, where the statements carry escaped quotes', () => {
    const text = JSON.stringify({
      notForClinicalUse: NOT_FOR_CLINICAL_USE, notClinicallyReviewed: NOT_CLINICALLY_REVIEWED,
    });
    expect(text).toContain('\\"');
    expect(exportDisclosureBlockers([{ name: 'transcript', text }], both)).toEqual([]);
  });

  it('blocks an export that carries only the older statement', () => {
    const blockers = exportDisclosureBlockers(
      [{ name: 'practice history', text: NOT_FOR_CLINICAL_USE }], both,
    );
    expect(blockers).toHaveLength(1);
    expect(blockers[0]).toContain('practice history');
  });

  it('names every export that is missing something, not just the first', () => {
    const blockers = exportDisclosureBlockers(
      [{ name: 'a', text: '' }, { name: 'b', text: '' }], both,
    );
    expect(blockers).toHaveLength(4);
  });
});
