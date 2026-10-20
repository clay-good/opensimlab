import { describe, expect, it } from 'vitest';
import { TranscriptRecorder } from '@platform/transcript/transcript';
import { useSession } from '@platform/session/session-store';

const draft = {
  moduleId: 'anesthesia', scenarioId: 'routine-induction',
  versions: { engine: 'e', content: '1.0.0', modelSet: '1', scenario: '1.0.0' },
  practiceRegion: 'US', seed: 1, guidanceLevel: 'unassisted' as const,
};

describe('classroom pause points in the transcript', () => {
  it('adds nothing to a transcript in which no pause fired', () => {
    expect(new TranscriptRecorder(draft).build('hash')).not.toHaveProperty('facilitatorPauses');
  });

  it('records each pause once, with its tick, and never as an action', () => {
    const recorder = new TranscriptRecorder(draft);
    recorder.markPause('before-induction', 600);
    recorder.markPause('before-induction', 700);
    recorder.markPause('falling', 900);
    const transcript = recorder.build('hash');
    expect(transcript.facilitatorPauses).toEqual([{ id: 'before-induction', tick: 600 }, { id: 'falling', tick: 900 }]);
    expect(transcript.actions).toEqual([]);
    expect(transcript.stateTraceHash).toBe('hash');
  });

  it('exposes the store action that records a pause and stops the clock', () => {
    const { markPausePoint } = useSession.getState();
    expect(typeof markPausePoint).toBe('function');
    expect(() => markPausePoint('before-induction')).not.toThrow();
    expect(useSession.getState().transport).not.toBe('running');
  });
});

describe('the paused region is outlined', () => {
  it('outlines the region a pause point names, through its own attribute', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/modules/anesthesia/ui/cockpit.css', 'utf8');
    for (const region of ['monitor', 'analysis', 'actions']) {
      expect(css).toContain(`.cockpit[data-pause-focus='${region}'] .cockpit__${region}`);
    }
    expect(readFileSync('src/modules/anesthesia/ui/Cockpit.tsx', 'utf8'))
      .toContain("{...(pausePoint ? { 'data-pause-focus': pausePoint.region } : {})}");
  });
});
