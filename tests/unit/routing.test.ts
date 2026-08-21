/**
 * What a URL resolves to.
 *
 * A stale or mistyped scenario link used to open a DIFFERENT patient — the
 * default one — with the wrong id still in the address bar and nothing saying
 * so. An instructor who mistyped a scenario id in a cohort link would have sent
 * the whole class to the wrong case without one of them being told.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_SCENARIO_ID, SCENARIOS, getScenario } from '@anesthesia/scenarios';
import { ROUTES, canonicalUrl, routeFor } from '@routes/routes';

describe('resolving a scenario id', () => {
  it('finds every scenario the index links to', () => {
    for (const scenario of SCENARIOS) {
      expect(getScenario(scenario.metadata.id)?.metadata.id).toBe(scenario.metadata.id);
    }
  });

  it('returns nothing for an id that does not exist, rather than a substitute', () => {
    // The lookup must be honest even though the route decides what to render.
    for (const wrong of ['bronchspasm', 'routine_induction', 'ROUTINE-INDUCTION', '', '../../etc']) {
      expect(getScenario(wrong), wrong).toBeUndefined();
    }
  });

  it('has a default that actually exists', () => {
    expect(getScenario(DEFAULT_SCENARIO_ID)).toBeDefined();
  });
});

describe('the route table', () => {
  it('lists a route for every scenario, at the path the index links to', () => {
    for (const scenario of SCENARIOS) {
      const path = `/anesthesia/scenario/${scenario.metadata.id}`;
      expect(routeFor(path), path).toBeDefined();
    }
  });

  it('knows nothing about a path that is not a route', () => {
    for (const path of ['/anesthesia/scenario/nope', '/nope', '/anesthesia/scenario', '//']) {
      expect(routeFor(path), path).toBeUndefined();
    }
  });

  it('gives every route a canonical URL on the real origin', () => {
    for (const route of ROUTES) {
      const url = canonicalUrl(route.path);
      expect(url.startsWith('https://opensimlab.com'), url).toBe(true);
      // No double slash from joining an origin to a path that already has one.
      expect(url.slice('https://'.length)).not.toContain('//');
    }
  });

  it('gives every route a distinct path and a distinct title', () => {
    expect(new Set(ROUTES.map((r) => r.path)).size).toBe(ROUTES.length);
    expect(new Set(ROUTES.map((r) => r.title)).size).toBe(ROUTES.length);
  });

  it('never marks a per-learner surface indexable', () => {
    // A debrief or a running session is meaningless to a stranger and must not
    // reach an index.
    for (const route of ROUTES) {
      if (route.path.includes('/session') || route.path.includes('/debrief')) {
        expect(route.indexable, route.path).toBe(false);
      }
    }
  });
});
