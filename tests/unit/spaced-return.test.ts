/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SCENARIOS } from '@anesthesia/scenarios';
import type { PracticeAttempt, PracticeOutcome } from '@anesthesia/catalog/practice-history';
import {
  dismissSpacedReturn, returnIntervalDays, spacedReturnDismissed, spacedReturnSuggestion,
  SPACED_RETURN_CONVENTION,
} from '@anesthesia/catalog/spaced-return';
import { SpacedReturnSuggestion } from '@anesthesia/ui/SpacedReturnSuggestion';

const [first, second, third] = SCENARIOS;
const day = (n: number) => new Date(Date.UTC(2026, 8, 1 + n, 15, 0)).toISOString();
const attempt = (scenario = first!, onDay = 0, outcome: PracticeOutcome = 'partly-met'): PracticeAttempt => ({
  schemaVersion: 1, scenarioId: scenario.metadata.id, contentVersion: scenario.metadata.version,
  goalId: null, completedAt: day(onDay), simulatedSeconds: 300,
  objectives: scenario.metadata.objectives.map((objective, index) => ({
    objectiveId: objective.id, outcome: index === 0 ? outcome : 'met',
  })),
});

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; }, clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null, key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); }, setItem: (key, value) => { values.set(key, value); },
  };
}

describe('spaced return to weak areas', () => {
  it('starts at 7 days, doubles per separate day, and caps at 56', () => {
    expect([1, 2, 3, 4, 5, 9].map(returnIntervalDays)).toEqual([7, 14, 28, 56, 56, 56]);
    expect(returnIntervalDays(0)).toBe(0);
  });

  it('suggests nothing before the interval, and the scenario once it has passed', () => {
    const history = [attempt(first, 0)];
    expect(spacedReturnSuggestion(history, SCENARIOS, new Date(day(6)))).toBeNull();
    const due = spacedReturnSuggestion(history, SCENARIOS, new Date(day(21)));
    expect(due?.scenario.metadata.id).toBe(first!.metadata.id);
    expect(due).toMatchObject({ daysSince: 21, intervalDays: 7 });
    expect(due?.practises).toEqual([first!.metadata.objectives[0]!.statement]);
    expect(due?.reason).toContain('partly met');
  });

  it('counts separate days, not attempts, toward a longer interval', () => {
    const sameDay = [attempt(first, 0), attempt(first, 0)];
    expect(spacedReturnSuggestion(sameDay, SCENARIOS, new Date(day(8)))).not.toBeNull();
    const twoDays = [attempt(first, 0), attempt(first, 1)];
    expect(spacedReturnSuggestion(twoDays, SCENARIOS, new Date(day(8)))).toBeNull();
    expect(spacedReturnSuggestion(twoDays, SCENARIOS, new Date(day(15)))?.intervalDays).toBe(14);
  });

  it('picks the weakest evidence first, then the oldest', () => {
    const history = [attempt(first, 0, 'partly-met'), attempt(second, 2, 'not-met'), attempt(third, 1, 'met')];
    expect(spacedReturnSuggestion(history, SCENARIOS, new Date(day(30)))?.scenario.metadata.id)
      .toBe(second!.metadata.id);
    const tied = [attempt(first, 3, 'partly-met'), attempt(second, 1, 'partly-met')];
    expect(spacedReturnSuggestion(tied, SCENARIOS, new Date(day(30)))?.scenario.metadata.id)
      .toBe(second!.metadata.id);
  });

  it('never suggests a scenario outside the list it is given, or one never practised', () => {
    expect(spacedReturnSuggestion([attempt(first, 0)], [second!], new Date(day(30)))).toBeNull();
    expect(spacedReturnSuggestion([], SCENARIOS, new Date(day(30)))).toBeNull();
  });

  it('respects a 7-day dismissal', () => {
    const storage = memoryStorage();
    const now = Date.parse(day(10));
    dismissSpacedReturn(now, storage);
    expect(spacedReturnDismissed(now + 6 * 86_400_000, storage)).toBe(true);
    expect(spacedReturnDismissed(now + 7 * 86_400_000 + 1, storage)).toBe(false);
  });
});

describe('the suggestion panel', () => {
  const values = new Map<string, string>();
  beforeEach(() => {
    values.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });

  it('shows one suggestion with its duration and the convention label, and hides on request', () => {
    values.set('opensimlab.practice-history', JSON.stringify([attempt(first, 0, 'not-met')]));
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const now = () => Date.parse(day(21));
    act(() => root.render(createElement(SpacedReturnSuggestion, { scenarios: SCENARIOS, basePath: '/anesthesia', now })));
    expect(container.textContent).toContain(first!.metadata.title);
    expect(container.textContent).toContain(`about ${first!.metadata.estimatedMinutes} simulated minutes`);
    expect(container.textContent).toContain(SPACED_RETURN_CONVENTION);
    expect(container.textContent).toContain('does not measure competence');
    expect(container.querySelectorAll('a')).toHaveLength(1);
    act(() => [...container.querySelectorAll('button')].find((button) =>
      button.textContent === 'Hide this suggestion for 7 days')!.click());
    expect(container.textContent).toBe('');
    act(() => root.unmount());
  });
});
