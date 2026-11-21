import { describe, expect, it } from 'vitest';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import type { Scenario, ScenarioBookmark } from '@anesthesia/scenarios/types';
import { facilitatorGuide } from '@platform/facilitation/guide';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';
import { REFERENCE_PATHS } from '@platform/facilitation/reference-paths.generated';
import { transcriptReachesBookmark } from '@platform/facilitation/bookmarks';
import { BOOKMARK_ACTION_KEYS, loadBookmarkActions } from '@platform/facilitation/bookmark-actions';
import { AnesthesiaEngine } from '@anesthesia/engine';

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
    ['a tick before the first one a run can hand over at', bookmark({ atTick: 0 }), 'minimum'],
  ])('refuses %s', (_, candidate, rule) => {
    expect(validateScenario(withBookmarks([candidate])).map((error) => error.rule)).toContain(rule);
  });

  it('refuses a duplicated id', () => {
    expect(validateScenario(withBookmarks([bookmark(), bookmark()])).map((error) => error.rule)).toContain('unique');
  });

  it('lists declared bookmarks in the facilitator guide with the transcript they sit on', () => {
    const guide = facilitatorGuide({ moduleRoute: 'anesthesia', moduleName: 'Anesthesia',
      scenario: withBookmarks([bookmark(), bookmark({ id: 'error', atTick: 1, transcript: 'common-error' })]) });
    const section = guide.find((entry) => entry.id === 'bookmarks')!;
    expect(section.status).toBe('present');
    if (section.status !== 'present') return;
    expect(section.items.map((item) => item.label)).toEqual(['Tick 600', 'Tick 1']);
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

  it('can each be jumped to: the lesson has an entry that loads its reference runs as engine actions', async () => {
    const keys = authored.map((entry) => `${entry.moduleRoute}:${entry.scenario.metadata.id}`);
    expect([...BOOKMARK_ACTION_KEYS].sort()).toEqual([...keys].sort());
    for (const entry of authored) {
      for (const mark of entry.scenario.bookmarks ?? []) {
        const actions = await loadBookmarkActions(entry.moduleRoute, entry.scenario.metadata.id, mark.transcript);
        const paths = REFERENCE_PATHS.find((candidate) => candidate.scenarioId === entry.scenario.metadata.id)!;
        const named = mark.transcript === 'expert' ? paths.expert : mark.transcript === 'common-error' ? paths.commonError : paths.recovery;
        // The loader and the guide read the same fixture: same ticks, same order.
        expect(actions?.map((action) => action.tick), `${entry.scenario.metadata.id} ${mark.id}`)
          .toEqual(named.map((step) => step.tick));
      }
    }
    expect(await loadBookmarkActions('anesthesia', 'no-such-lesson', 'expert')).toBeNull();
  });

  /**
   * The design's budget is a replay to a bookmark under 2 seconds on the
   * reference device. That device has never been measured (mvp-anesthesia-alpha
   * 2.1), so this holds the replay to the budget on whatever runs the suite and
   * records nothing about the phone.
   */
  it('replays every action before each bookmark inside the 2-second budget', async () => {
    for (const entry of authored) {
      for (const mark of entry.scenario.bookmarks ?? []) {
        const actions = (await loadBookmarkActions(entry.moduleRoute, entry.scenario.metadata.id, mark.transcript))!;
        const engine = new AnesthesiaEngine({ scenario: entry.scenario, seed: 1, practiceRegion: 'US' });
        const before = actions.filter((action) => action.tick < mark.atTick);
        const started = performance.now();
        let next = 0;
        for (let tick = 0; tick < mark.atTick; tick += 1) {
          while (next < before.length && before[next]!.tick <= tick) { engine.apply(before[next]!); next += 1; }
          engine.step();
        }
        const elapsed = performance.now() - started;
        expect(next, `${entry.scenario.metadata.id} ${mark.id}`).toBe(before.length);
        expect(elapsed, `${entry.scenario.metadata.id} ${mark.id}`).toBeLessThan(2000);
      }
    }
  });
});
