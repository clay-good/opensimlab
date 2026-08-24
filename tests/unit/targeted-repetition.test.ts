import { describe, expect, it } from 'vitest';
import { applicableReplayPoint } from '@anesthesia/ui/Debrief';
import { HYPOTENSION_AFTER_INDUCTION } from '@anesthesia/scenarios/hypotension-after-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';

describe('scenario-authored targeted repetition', () => {
  it('offers the declared point only after it was reached and its objective needs work', () => {
    const point = HYPOTENSION_AFTER_INDUCTION.replayPoints![0]!;
    const finding = {
      objectiveId: point.objectiveId,
      statement: 'Read the mechanism.',
      outcome: 'not-met' as const,
      finding: 'No mechanism-specific response was recorded.',
    };
    expect(applicableReplayPoint(HYPOTENSION_AFTER_INDUCTION, [finding], point.atTick - 1))
      .toBeUndefined();
    expect(applicableReplayPoint(HYPOTENSION_AFTER_INDUCTION, [finding], point.atTick))
      .toEqual(point);
    expect(applicableReplayPoint(HYPOTENSION_AFTER_INDUCTION, [{ ...finding, outcome: 'met' }], point.atTick))
      .toBeUndefined();
  });

  it('rejects a replay point that targets an undeclared objective', () => {
    const invalid = {
      ...HYPOTENSION_AFTER_INDUCTION,
      replayPoints: [{
        ...HYPOTENSION_AFTER_INDUCTION.replayPoints![0], objectiveId: 'invented-objective',
      }],
    };
    expect(validateScenario(invalid)).toContainEqual(expect.objectContaining({
      pointer: '/replayPoints/0/objectiveId', rule: 'reference',
    }));
  });
});
