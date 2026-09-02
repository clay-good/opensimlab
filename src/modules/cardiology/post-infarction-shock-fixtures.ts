import type { PostInfarctionShockAction } from './post-infarction-shock';

/**
 * Reference transcripts for the post-infarction shock lesson.
 *
 * The common-error path is the delay this lesson exists to refuse: reopening
 * the causes carefully and thoroughly while nobody has phoned a centre that
 * can do more, and then reaching for the bridge. The recovery path takes the
 * unordered pair the other way round and clears the handoff time gate on the
 * second attempt.
 */
export const POST_INFARCTION_SHOCK_FIXTURES = {
  scenarioId: 'post-infarction-cardiogenic-shock-escalation', contentVersion: '0.1.0', seed: 8153,
  noAction: [],
  expert: [
    [0, 'reconcile-post-infarction-shock-trajectory'],
    [1, 'reopen-post-infarction-shock-causes'],
    [2, 'contact-post-infarction-shock-center'],
    [3, 'record-post-infarction-shock-bridge'],
    [4, 'handoff-post-infarction-shock-trajectory'],
  ],
  commonError: [
    [0, 'reconcile-post-infarction-shock-trajectory'],
    // Thinking hard while nobody has called anyone.
    [1, 'reopen-post-infarction-shock-causes'],
    [2, 'record-post-infarction-shock-bridge'],
  ],
  recovery: [
    // The bridge before there is a trajectory to bridge from.
    [0, 'record-post-infarction-shock-bridge'],
    [1, 'reconcile-post-infarction-shock-trajectory'],
    // The unordered pair, taken call-first, then completed.
    [2, 'contact-post-infarction-shock-center'],
    [3, 'record-post-infarction-shock-bridge'],
    [4, 'reopen-post-infarction-shock-causes'],
    [5, 'record-post-infarction-shock-bridge'],
    // And the handoff time gate, taken too early before it is taken correctly.
    [5, 'handoff-post-infarction-shock-trajectory'],
    [6, 'handoff-post-infarction-shock-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PostInfarctionShockAction])[];
  expert: readonly (readonly [number, PostInfarctionShockAction])[];
  commonError: readonly (readonly [number, PostInfarctionShockAction])[];
  recovery: readonly (readonly [number, PostInfarctionShockAction])[];
};
