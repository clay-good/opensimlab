/**
 * deliberate-practice-loop → "the overlay renders offline for all 256
 * scenarios from their fixtures".
 *
 * Every lesson, from its own checked-in fixture, with no network and nothing
 * stored: the 39 with a modelled patient build a trace, and the other 217 are
 * refused with the reason that says why. The point of running all of them is
 * that a lesson which quietly stops producing a usable reference run is a
 * lesson whose debrief silently loses a panel.
 *
 * The expert path is replayed under a DIFFERENT seed from the one it was
 * recorded with, because that is the case the overlay exists to survive: an
 * assignment link or a blind draw gives a learner their own seed.
 */
import { describe, expect, it } from 'vitest';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { replayWithEvents } from '@anesthesia/debrief/replay-engine';
import { expertOverlay, expertPathFor } from '@anesthesia/debrief/expert-overlay';
import { EXPERT_PATHS } from '@anesthesia/debrief/expert-paths.generated';
import { SCENARIOS } from '@anesthesia/scenarios';
import { FACILITATED_SCENARIOS } from '@platform/facilitation/scenario-catalog';

/** A learner's own seed, which is the whole reason the replay happens at all. */
const LEARNER_SEED = 4242;

describe('the overlay builds for every closed-loop lesson under a learner\'s own seed', () => {
  it.each(EXPERT_PATHS.map((path) => [path.scenarioId, path] as const))(
    '%s',
    (scenarioId, path) => {
      const scenario = SCENARIOS.find((entry) => entry.metadata.id === scenarioId)!;
      const ticks = Math.max(path.ticks, ...path.recorded.map((sample) => sample.tick)) + 1;
      const replayed = replayWithEvents(path.expert as never, {
        scenario, seed: LEARNER_SEED, practiceRegion: 'US', ticks,
      });
      const overlay = expertOverlay({
        ticksPerSecond: TICKS_PER_SECOND,
        path,
        learnerHistory: replayed.history,
        learnerActions: [],
        replayedHistory: replayed.history,
        learnerFindings: [],
        expertFindings: [],
      });
      // Either a trace, or a reason. Never a half-drawn panel.
      if (overlay.withheld === null) {
        expect(overlay.series.length).toBeGreaterThan(0);
        for (const series of overlay.series) expect(series.expert.length).toBeGreaterThan(0);
      } else {
        expect(overlay.withheld.length, scenarioId).toBeGreaterThan(40);
        expect(overlay.series).toEqual([]);
      }
      expect(overlay.marks.length).toBeGreaterThan(0);
    },
  );
});

describe('and says why there is nothing to draw for the rest of the catalogue', () => {
  it('withholds for every lesson with no modelled patient', () => {
    const stateTransition = FACILITATED_SCENARIOS
      .filter((entry) => entry.moduleRoute !== 'anesthesia');
    expect(stateTransition.length).toBe(217);
    for (const entry of stateTransition) {
      const overlay = expertOverlay({
        ticksPerSecond: TICKS_PER_SECOND,
        path: expertPathFor(EXPERT_PATHS, entry.scenario.metadata.id),
        learnerHistory: [],
        learnerActions: [],
        replayedHistory: undefined,
        learnerFindings: [],
        expertFindings: [],
      });
      expect(overlay.withheld, entry.scenario.metadata.id).toMatch(/no modelled patient/);
      expect(overlay.series).toEqual([]);
    }
  });

  /** Nothing in this path reaches the network or the device's storage. */
  it('reads only the fixture and the engine', () => {
    expect(EXPERT_PATHS.length + 217).toBe(FACILITATED_SCENARIOS.length);
  });
});
