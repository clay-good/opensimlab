/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SCENARIOS } from '@anesthesia/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../../src/modules/cardiology/scenarios';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../../src/modules/critical-care/scenarios';
import type { PracticeAttempt, PracticeOutcome } from '@anesthesia/catalog/practice-history';
import {
  dismissSpacedReturn, returnIntervalDays, spacedReturnDismissed, spacedReturnSuggestion,
  SPACED_RETURN_CONVENTION,
} from '@anesthesia/catalog/spaced-return';
import { buildReturnIndex, type ReturnIndexEntry } from '@platform/catalog/return-index';
import { SpacedReturnSuggestion } from '@anesthesia/ui/SpacedReturnSuggestion';

// Warm the chunk the panel imports, so a test flush does not race the loader.
await import('@platform/catalog/return-index.generated');

const ANESTHESIA = buildReturnIndex([{ moduleId: 'anesthesia', scenarios: SCENARIOS }]);
const [first, second, third] = ANESTHESIA;

/** The two lessons that share a scenario id, which is why the module is recorded. */
const SHARED = buildReturnIndex([
  { moduleId: 'emergency-medicine', scenarios: EMERGENCY_MEDICINE_SCENARIOS },
  { moduleId: 'critical-care', scenarios: CRITICAL_CARE_SCENARIOS },
]).filter((entry) => entry.scenarioId === 'status-epilepticus');

const day = (n: number) => new Date(Date.UTC(2026, 8, 1 + n, 15, 0)).toISOString();

const attempt = (
  entry: ReturnIndexEntry = first!, onDay = 0, outcome: PracticeOutcome = 'partly-met',
): PracticeAttempt => ({
  schemaVersion: 2, moduleId: entry.moduleId, scenarioId: entry.scenarioId,
  contentVersion: '0.1.0', goalId: null, completedAt: day(onDay), simulatedSeconds: 300,
  objectives: entry.objectives.map((objective, index) => ({
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
    expect(spacedReturnSuggestion(history, ANESTHESIA, new Date(day(6)))).toBeNull();
    const due = spacedReturnSuggestion(history, ANESTHESIA, new Date(day(21)));
    expect(due).toMatchObject({
      scenarioId: first!.scenarioId, daysSince: 21, intervalDays: 7, moduleId: 'anesthesia',
      title: first!.title, estimatedMinutes: first!.estimatedMinutes,
    });
    expect(due?.practises).toEqual([first!.objectives[0]!.statement]);
    expect(due?.reason).toContain('partly met');
  });

  it('counts separate days, not attempts, toward a longer interval', () => {
    const sameDay = [attempt(first, 0), attempt(first, 0)];
    expect(spacedReturnSuggestion(sameDay, ANESTHESIA, new Date(day(8)))).not.toBeNull();
    const twoDays = [attempt(first, 0), attempt(first, 1)];
    expect(spacedReturnSuggestion(twoDays, ANESTHESIA, new Date(day(8)))).toBeNull();
    expect(spacedReturnSuggestion(twoDays, ANESTHESIA, new Date(day(15)))?.intervalDays).toBe(14);
  });

  it('picks the weakest evidence first, then the oldest', () => {
    const history = [attempt(first, 0, 'partly-met'), attempt(second, 2, 'not-met'), attempt(third, 1, 'met')];
    expect(spacedReturnSuggestion(history, ANESTHESIA, new Date(day(30)))?.scenarioId)
      .toBe(second!.scenarioId);
    const tied = [attempt(first, 3, 'partly-met'), attempt(second, 1, 'partly-met')];
    expect(spacedReturnSuggestion(tied, ANESTHESIA, new Date(day(30)))?.scenarioId)
      .toBe(second!.scenarioId);
  });

  it('never suggests a scenario outside the index it is given, or one never practised', () => {
    expect(spacedReturnSuggestion([attempt(first, 0)], [second!], new Date(day(30)))).toBeNull();
    expect(spacedReturnSuggestion([], ANESTHESIA, new Date(day(30)))).toBeNull();
  });

  describe('across every module', () => {
    const CARDIOLOGY = buildReturnIndex([{ moduleId: 'cardiology', scenarios: CARDIOLOGY_SCENARIOS }]);
    const WHOLE = [...ANESTHESIA, ...CARDIOLOGY];
    const cardiology = CARDIOLOGY[0]!;

    it('ranks a weaker lesson in another module above a stronger one here', () => {
      const history = [attempt(first, 0, 'partly-met'), attempt(cardiology, 0, 'not-met')];
      const due = spacedReturnSuggestion(history, WHOLE, new Date(day(30)));
      expect(due).toMatchObject({ moduleId: 'cardiology', scenarioId: cardiology.scenarioId });
      expect(due?.practises).toEqual([cardiology.objectives[0]!.statement]);
    });

    it('does not make a lesson due because another module shares its scenario id', () => {
      expect(SHARED).toHaveLength(2);
      const [emergency, critical] = SHARED as [ReturnIndexEntry, ReturnIndexEntry];
      expect(spacedReturnSuggestion([attempt(emergency, 0, 'not-met')], SHARED, new Date(day(30))))
        .toMatchObject({ moduleId: 'emergency-medicine' });
      expect(spacedReturnSuggestion([attempt(emergency, 0)], [critical], new Date(day(30)))).toBeNull();
    });

    it('reads a record with no module by the objectives it declares', () => {
      const [emergency] = SHARED as [ReturnIndexEntry, ReturnIndexEntry];
      const legacy = { ...attempt(emergency, 0, 'not-met'), moduleId: null };
      expect(spacedReturnSuggestion([legacy], SHARED, new Date(day(30))))
        .toMatchObject({ moduleId: 'emergency-medicine' });
    });
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
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  const render = async (now: () => number) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    // The catalogue view is a separate chunk, so the panel appears once that
    // import settles rather than during mount.
    await act(async () => { root.render(createElement(SpacedReturnSuggestion, { now })); });
    for (let flush = 0; flush < 5; flush += 1) {
      await act(async () => { await Promise.resolve(); });
    }
    return { container, root };
  };

  it('shows one suggestion with its duration and the convention label, and hides on request', async () => {
    values.set('opensimlab.practice-history', JSON.stringify([attempt(first, 0, 'not-met')]));
    const { container, root } = await render(() => Date.parse(day(21)));
    expect(container.textContent).toContain(first!.title);
    expect(container.textContent).toContain(`about ${first!.estimatedMinutes} simulated minutes`);
    expect(container.textContent).toContain(SPACED_RETURN_CONVENTION);
    expect(container.textContent).toContain('does not measure competence');
    expect(container.querySelectorAll('a')).toHaveLength(1);
    act(() => [...container.querySelectorAll('button')].find((button) =>
      button.textContent === 'Hide this suggestion for 7 days')!.click());
    expect(container.textContent).toBe('');
    act(() => root.unmount());
  });

  it('names the module and links into it when the weakest lesson is elsewhere', async () => {
    const cardiology = buildReturnIndex([{ moduleId: 'cardiology', scenarios: CARDIOLOGY_SCENARIOS }])[0]!;
    values.set('opensimlab.practice-history', JSON.stringify([
      attempt(first, 0, 'partly-met'), attempt(cardiology, 0, 'not-met'),
    ]));
    const { container, root } = await render(() => Date.parse(day(21)));
    expect(container.textContent).toContain(cardiology.title);
    expect(container.textContent).toContain('Cardiology');
    expect(container.querySelector('a')?.getAttribute('href'))
      .toBe(`/cardiology/scenario/${cardiology.scenarioId}`);
    act(() => root.unmount());
  });

  it('shows nothing when this device has no practice history', async () => {
    const { container, root } = await render(() => Date.parse(day(21)));
    expect(container.textContent).toBe('');
    act(() => root.unmount());
  });
});
