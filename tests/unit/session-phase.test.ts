/**
 * The phase a session is in, and what is allowed to change it.
 *
 * The solver's ready message used to set the phase to 'briefing'
 * unconditionally. A ready that arrived after the learner had already started
 * dropped a running session back to the briefing screen with the clock stopped.
 * It surfaced as the front door's "watch a 90-second demonstration" link
 * appearing to do nothing: the demonstration DID start, and a late ready
 * message put it straight back.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { useSession } from '@platform/session/session-store';

/** The store, reset to a known phase without standing a worker up. */
const setPhase = (phase: 'idle' | 'briefing' | 'running' | 'ended') => {
  useSession.setState({ phase, ready: false });
};

/**
 * What `onReady` does, expressed exactly as the store expresses it. The store
 * builds the callback inside `begin()`, which needs a worker, so the rule itself
 * is what is asserted here.
 */
const onReady = () => useSession.setState((state) => ({
  ready: true,
  error: null,
  phase: state.phase === 'idle' ? 'briefing' : state.phase,
}));

describe('the solver becoming ready', () => {
  it('moves an untouched session to the briefing', () => {
    setPhase('idle');
    onReady();
    expect(useSession.getState().phase).toBe('briefing');
    expect(useSession.getState().ready).toBe(true);
  });

  it('leaves a session that is already at the briefing alone', () => {
    setPhase('briefing');
    onReady();
    expect(useSession.getState().phase).toBe('briefing');
  });

  it('does NOT drag a running session back to the briefing', () => {
    // The bug, in one assertion.
    setPhase('running');
    onReady();
    expect(useSession.getState().phase).toBe('running');
    expect(useSession.getState().ready).toBe(true);
  });

  it('does not resurrect a session that has ended', () => {
    setPhase('ended');
    onReady();
    expect(useSession.getState().phase).toBe('ended');
  });

  it('marks the solver ready whatever the phase', () => {
    for (const phase of ['idle', 'briefing', 'running', 'ended'] as const) {
      setPhase(phase);
      onReady();
      expect(useSession.getState().ready, phase).toBe(true);
    }
  });

  it('is what the store actually does, not a copy that drifted', () => {
    // Source assertion, because the callback is built inside `begin()` and
    // cannot be reached without standing a worker up. If the store stops
    // guarding the phase, this fails rather than the rule above quietly
    // becoming fiction.
    const store = readFileSync(join(process.cwd(), 'src/platform/session/session-store.ts'), 'utf8');
    const ready = store.slice(store.indexOf('onReady:'), store.indexOf('onState:'));
    expect(ready).toContain("state.phase === 'idle' ? 'briefing' : state.phase");
    expect(ready).not.toMatch(/onReady:\s*\(\)\s*=>\s*set\(\{[^}]*phase: 'briefing'/);
  });
});
