import { describe, expect, it } from 'vitest';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import type { Scenario, ScenarioBookmark } from '@anesthesia/scenarios/types';
import { facilitatorGuide } from '@platform/facilitation/guide';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { REFERENCE_PATHS } from '@platform/facilitation/reference-paths.generated';
import { transcriptReachesBookmark } from '@platform/facilitation/bookmarks';

const bookmark = (overrides: Partial<ScenarioBookmark> = {}): ScenarioBookmark => ({
  id: 'before-induction', label: 'Monitoring on, nothing given yet', atTick: 600, transcript: 'expert', ...overrides,
});
const withBookmarks = (bookmarks: readonly ScenarioBookmark[]): Scenario => ({ ...ROUTINE_INDUCTION, bookmarks });

describe('bookmarks in the scenario format', () => {
  it('accepts a bookmark on each reference transcript', () => {
    expect(validateScenario(withBookmarks([
      bookmark(), bookmark({ id: 'error', transcript: 'common-error' }), bookmark({ id: 'recovery', transcript: 'recovery' }),
    ]))).toEqual([]);
  });

  it.each([
    ['a label over 80 characters', bookmark({ label: `A ${'x'.repeat(80)}` }), 'maxLength'],
    ['a transcript that does not exist', bookmark({ transcript: 'learner' as never }), 'enum'],
    ['a negative tick', bookmark({ atTick: -1 }), 'minimum'],
  ])('refuses %s', (_, candidate, rule) => {
    expect(validateScenario(withBookmarks([candidate])).map((error) => error.rule)).toContain(rule);
  });

  it('refuses a duplicated id', () => {
    expect(validateScenario(withBookmarks([bookmark(), bookmark()])).map((error) => error.rule)).toContain('unique');
  });

  it('lists declared bookmarks in the facilitator guide with the transcript they sit on', () => {
    const guide = facilitatorGuide({ moduleRoute: 'anesthesia', moduleName: 'Anesthesia',
      scenario: withBookmarks([bookmark(), bookmark({ id: 'error', atTick: 0, transcript: 'common-error' })]) });
    const section = guide.find((entry) => entry.id === 'bookmarks')!;
    expect(section.status).toBe('present');
    if (section.status !== 'present') return;
    expect(section.items.map((item) => item.label)).toEqual(['Tick 600', 'At start']);
    expect(section.items[1]!.text).toBe('Monitoring on, nothing given yet (on the common-error transcript)');
  });
});

describe('authored bookmarks', () => {
  const authored = FACILITATED_SCENARIOS.filter((entry) => (entry.scenario.bookmarks?.length ?? 0) > 0);

  it('exist, starting with both persistent VF lessons', () => {
    expect(authored.map((entry) => entry.scenario.metadata.id))
      .toEqual(expect.arrayContaining(['persistent-vf-cardiac-arrest', 'persistent-vf-arrest']));
  });

  // The build test the task names: a bookmark past the end of its transcript
  // would show the room a state no reference path walked through.
  it('each sit inside the reference transcript they name', () => {
    for (const entry of authored) {
      const id = entry.scenario.metadata.id;
      const paths = REFERENCE_PATHS.find((candidate) =>
        candidate.moduleId === entry.moduleRoute && candidate.scenarioId === id);
      expect(paths, id).toBeDefined();
      for (const mark of entry.scenario.bookmarks ?? []) {
        expect(transcriptReachesBookmark(mark, paths!), `${id} ${mark.id}`).toBe(true);
      }
      expect(validateScenario(entry.scenario), id).toEqual([]);
    }
  });

  it('refuses a bookmark past the end of its transcript', () => {
    const paths = REFERENCE_PATHS.find((candidate) => candidate.scenarioId === 'persistent-vf-cardiac-arrest')!;
    expect(transcriptReachesBookmark(bookmark({ atTick: 901 }), paths)).toBe(false);
    expect(transcriptReachesBookmark(bookmark({ atTick: 901, transcript: 'recovery' }), paths)).toBe(true);
  });
});
