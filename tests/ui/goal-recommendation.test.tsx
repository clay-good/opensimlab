/** @vitest-environment jsdom */
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { GoalRecommendation } from '@anesthesia/ui/GoalRecommendation';
import {
  dismissRecommendation,
  recommendationDismissed,
  RECOMMENDATION_DISMISSAL_MS,
} from '@anesthesia/catalog/recommendation-state';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  });
});

describe('private goal recommendation', () => {
  it('shows one explainable, maturity-linked next scenario without a competence claim', () => {
    const markup = renderToStaticMarkup(
      <GoalRecommendation
        pathId="first-lab"
        pathTitle="My first simulation lab"
        scenario={ROUTINE_INDUCTION}
        reason="Next in the selected path."
        now={() => 1_000}
      />,
    );
    expect(markup).toContain('A good next rehearsal');
    expect(markup).toContain('/anesthesia/scenario/routine-induction?goal=first-lab');
    expect(markup).toContain('#scenario:routine-induction@0.1.0');
    expect(markup).toContain('does not measure competence');
    expect(markup).toContain('Hide this suggestion for 7 days');
  });

  it('stores only a bounded local expiry and restores the suggestion after 7 days', () => {
    const now = 10_000;
    expect(dismissRecommendation('first-lab', now)).toBe(now + RECOMMENDATION_DISMISSAL_MS);
    expect(recommendationDismissed('first-lab', now + RECOMMENDATION_DISMISSAL_MS - 1)).toBe(true);
    expect(recommendationDismissed('first-lab', now + RECOMMENDATION_DISMISSAL_MS)).toBe(false);
    expect(Object.keys(JSON.parse(localStorage.getItem('opensimlab.recommendation-dismissals')!)))
      .toEqual(['first-lab']);
  });

  it('renders nothing while this path is locally dismissed', () => {
    dismissRecommendation('first-lab', 1_000);
    const markup = renderToStaticMarkup(
      <GoalRecommendation
        pathId="first-lab"
        pathTitle="My first simulation lab"
        scenario={ROUTINE_INDUCTION}
        reason="Next in the selected path."
        now={() => 2_000}
      />,
    );
    expect(markup).toBe('');
  });
});
