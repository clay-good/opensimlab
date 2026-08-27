/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { Debrief } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { PerioperativeDiabetes, PERIOPERATIVE_DIABETES_TAKEOVER_TICKS as STOP,
  PERIOPERATIVE_DIABETES_RESPONSE_TICKS as RESPONSE, type PerioperativeDiabetesAction,
  type PerioperativeDiabetesEvent } from '../../src/modules/endocrine-metabolic/perioperative-diabetes';
import { PERIOPERATIVE_DIABETES_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/perioperative-diabetes-fixtures';
import { PERIOPERATIVE_DIABETES_INSULIN_CONTINUITY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/perioperative-diabetes-insulin-continuity';

describe('Perioperative diabetes rendered debrief separates response evidence from clearance', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
  function click(label: string) {
    const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
    expect(button).toBeDefined(); act(() => button!.click());
  }
  function renderRun(choices: readonly (readonly [number, PerioperativeDiabetesAction])[], finalTick: number) {
    // Real lesson transitions and events; complete solver replay has separate integration coverage.
    const model = new PerioperativeDiabetes(); const log: EngineEvent[] = []; const history: HistorySample[] = [];
    const initial = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' }).step();
    const capture = (events: readonly PerioperativeDiabetesEvent[], tick: number) => {
      log.push(...events.map((event) => ({ tick, severity: 'info' as const, category: 'perioperative-diabetes',
        message: event.message, eventId: `perioperative-diabetes-${event.id}-${tick}` })));
      const { alertness: _alertness, ...vitals } = model.vitals();
      history.push({ tick, state: { ...initial.state, ...vitals }, concentrations: initial.concentrations });
    };
    capture([], 0);
    const actions: LearnerAction[] = choices.map(([tick, action]) => {
      capture(model.apply(action, tick), tick);
      return { tick, type: 'perioperative-diabetes-response', payload: { action } };
    });
    capture(model.advance(finalTick), finalTick);
    expect(history.every(({ state }) => state.meanArterialMmHg === 87 && state.spo2Percent === 98)).toBe(true);
    act(() => root.render(<Debrief scenario={SCENARIO} moduleId="endocrine-metabolic"
      history={history} actions={actions} log={log} attributionByTick={() => []} preoxygenationSeconds={0}
      timeToPeakSeconds={{}} replayOptions={{ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US', ticks: finalTick }}
      onOpenExplainer={() => {}} onExportTranscript={() => {}} onReplayScenario={() => {}} />));
    expect(container.textContent).not.toMatch(/anaesthetising|anesthetizing/);
    click('Skip and continue'); click('Continue to the analysis');
    expect(container.textContent).not.toContain('That is a good outcome');
    expect(container.textContent).toContain('does not establish a good outcome');
    click('Continue');
    expect(container.textContent).toContain('Handoff ends the rehearsal, not insulin need');
    expect(container.textContent).toContain('No surgery, discharge, or competence certification is implied');
    return model.snapshot(finalTick);
  }
  const outcomes = () => [...container.querySelectorAll('li > strong')].map((item) => item.textContent);

  it.each(['expert', 'recovery', 'commonError', 'noAction'] as const)('renders %s findings without claiming surgery or metabolic recovery', (path) => {
    const corrected = path === 'expert' || path === 'recovery';
    const choices = FIXTURES[path]; const finalTick = corrected ? choices.at(-1)![0] : STOP;
    const patient = renderRun(choices, finalTick);
    expect(patient.ended).toBe(corrected ? 'handoff' : 'instructor-takeover');
    expect(outcomes()).toEqual(Array(5).fill(corrected ? 'Met' : 'Not met'));
    expect(container.textContent).toContain(corrected ? 'authored response, not durable recovery' : 'fresh later full assessment is missing');
    if (path === 'recovery' || path === 'commonError') {
      expect(container.textContent).toContain('Attempted insulin omission was refused');
      expect(container.textContent).toContain('Glucose-only checks were valid partial information');
      expect(container.textContent).toContain('Attempted automatic surgical clearance was refused');
    }
    if (path === 'recovery') expect(container.textContent).toContain('Earlier observed deterioration remains part of the run');
  });

  it('does not credit a newer glucose-only result as the missing full post-insulin assessment', () => {
    const patient = renderRun([[0, 'reassess'], [1, 'restore-insulin'], [2, 'call-support'],
      [3, 'review-context'], [4, 'plan-fasting'], [5, 'monitor'], [RESPONSE + 1, 'check-glucose'],
      [RESPONSE + 2, 'handoff']], RESPONSE + 2);
    expect(patient).toMatchObject({ ended: null, responseObserved: false,
      observation: { atTick: 0, glucoseMgDl: 180, ketonesMmolL: 0.6 },
      glucoseObservation: { atTick: RESPONSE + 1, glucoseMgDl: 144 } });
    expect(outcomes()).toEqual(['Met', 'Not met', 'Met', 'Not met', 'Not met']);
    expect(container.textContent).toContain('A fresh full post-care response assessment is missing');
    expect(container.textContent).toContain('did not refresh older ketones');
  });
});
