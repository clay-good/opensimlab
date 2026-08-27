/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { Debrief } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { RenalHypocalcemia, RENAL_HYPOCALCEMIA_TAKEOVER_TICKS as STOP,
  RENAL_HYPOCALCEMIA_RESCUE_TICKS as RESCUE, RENAL_HYPOCALCEMIA_CONTINUING_TICKS as CONTINUING,
  RENAL_HYPOCALCEMIA_RECURRENCE_TICKS as RECURRENCE,
  type RenalHypocalcemiaAction, type RenalHypocalcemiaEvent } from '../../src/modules/renal-electrolyte/hypocalcemia';
import { RENAL_HYPOCALCEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypocalcemia-fixtures';
import { RENAL_HYPOCALCEMIA_IONIZED_CALCIUM_AND_CKD as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypocalcemia-ionized-calcium-and-ckd';

type Choices = readonly (readonly [number, RenalHypocalcemiaAction])[];
const ownership: Choices = [[0, 'call-support'], [0, 'review-context'], [0, 'monitor'],
  [0, 'coordinate-mineral-care'], [0, 'arrange-follow-up']];

describe('Renal hypocalcemia rendered debrief preserves measurement and continuing-care boundaries', () => {
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
  function renderRun(choices: Choices, finalTick: number) {
    // Actual model events feed the real rendered debrief; the companion suite replays every engine frame.
    const model = new RenalHypocalcemia(); const log: EngineEvent[] = []; const history: HistorySample[] = [];
    const initial = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' }).step();
    const capture = (events: readonly RenalHypocalcemiaEvent[], tick: number) => {
      log.push(...events.map((event) => ({ tick, severity: 'info' as const, category: 'renal-hypocalcemia',
        message: event.message, eventId: `renal-hypocalcemia-${event.id}-${tick}` })));
      const { alertness: _alertness, ...vitals } = model.vitals();
      history.push({ tick, state: { ...initial.state, ...vitals }, concentrations: initial.concentrations });
    };
    capture([], 0);
    const actions: LearnerAction[] = choices.map(([tick, action]) => {
      capture(model.apply(action, tick), tick);
      return { tick, type: 'renal-hypocalcemia-response', payload: { action } };
    });
    capture(model.advance(finalTick), finalTick);
    act(() => root.render(<Debrief scenario={SCENARIO} moduleId="renal-electrolyte"
      history={history} actions={actions} log={log} attributionByTick={() => []} preoxygenationSeconds={0}
      timeToPeakSeconds={{}} replayOptions={{ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US', ticks: finalTick }}
      onOpenExplainer={() => {}} onExportTranscript={() => {}} onReplayScenario={() => {}} />));
    click('Skip and continue'); click('Continue to the analysis');
    expect(container.textContent).not.toContain('That is a good outcome');
    click('Continue');
    expect(container.textContent).toContain('Historical total calcium, albumin, pH, magnesium, phosphate, eGFR, and QTc do not become new findings');
    expect(container.textContent).toContain('Mineral-care and follow-up acknowledgments do not cause the modeled calcium response');
    expect(container.textContent).toContain('No rapid activated-vitamin-D effect or denosumab reversal is inferred');
    expect(container.textContent).toContain('Handoff closes rehearsal, not surveillance');
    expect(container.textContent).toContain('no discharge readiness or durable recovery is certified');
    return model.snapshot(finalTick);
  }
  const outcomes = () => [...container.querySelectorAll('li > strong')].map((item) => item.textContent);

  it.each(['expert', 'recovery', 'commonError', 'noAction'] as const)('renders the %s course without certifying calcium or QT recovery', (path) => {
    const complete = path === 'expert' || path === 'recovery'; const choices = FIXTURES[path];
    const patient = renderRun(choices, complete ? choices.at(-1)![0] : STOP);
    expect(patient.ended).toBe(complete ? 'handoff' : 'instructor-takeover');
    expect(patient.durableRecoveryProven).toBe(false);
    expect(outcomes()).toEqual(Array(5).fill(complete ? 'Met' : 'Not met'));
    if (complete) expect(patient.observation).toMatchObject({ ionizedCalciumMmolL: 1.03, perioralTingling: true });
    if (path === 'recovery' || path === 'commonError') {
      expect(container.textContent).toContain('Reassurance from adjusted total calcium alone was refused');
      expect(container.textContent).toContain('The oral-only shortcut was refused');
      expect(container.textContent).toContain('The attempted stop after relief remains in history');
    }
    if (path === 'recovery') expect(container.textContent).toContain('Earlier observed recurrence remains part of the course');
  });

  it('does not combine separate partial observations into fresh full response or handoff evidence', () => {
    const patient = renderRun([...ownership, [0, 'rescue-calcium'], [0, 'continue-calcium'], [0, 'reassess'],
      [CONTINUING, 'check-ionized'], [CONTINUING + 1, 'check-symptoms'], [CONTINUING + 2, 'handoff']], CONTINUING + 2);
    expect(patient).toMatchObject({ ended: null, continuingResponseObserved: false,
      observation: { atTick: 0, ionizedCalciumMmolL: 0.86, carpopedalSpasm: true },
      ionizedObservation: { atTick: CONTINUING, ionizedCalciumMmolL: 1.03 },
      symptomObservation: { atTick: CONTINUING + 1, carpopedalSpasm: false } });
    expect(outcomes()).toEqual(['Not met', 'Met', 'Not met', 'Not met', 'Not met']);
    expect(container.textContent).toContain('Neither refreshes an older full panel');
  });

  it('hands off current recurrence without pretending newly delivered continuing care has responded', () => {
    const patient = renderRun([...ownership, [0, 'rescue-calcium'], [RESCUE, 'reassess'],
      [RECURRENCE, 'reassess'], [RECURRENCE + 1, 'continue-calcium'],
      [RECURRENCE + 2, 'reassess'], [RECURRENCE + 3, 'handoff']], RECURRENCE + 3);
    expect(patient).toMatchObject({ ended: 'handoff', recurrenceObserved: true, continuingResponseObserved: false,
      observation: { ionizedCalciumMmolL: 0.88, carpopedalSpasm: true, perioralTingling: true } });
    expect(outcomes()).toEqual(['Met', 'Met', 'Not met', 'Met', 'Met']);
    expect(container.textContent).toContain('remains incomplete or pending');
    expect(container.textContent).toContain('A treatment response may remain pending');
  });

  it('does not mistake a fresh early rescue panel for response to continuing calcium begun at that checkpoint', () => {
    const patient = renderRun([...ownership, [0, 'rescue-calcium'], [RESCUE, 'continue-calcium'],
      [RESCUE + 1, 'reassess']], RESCUE + 1);
    expect(patient).toMatchObject({ rescueResponseObserved: true, continuingResponseObserved: false,
      observation: { ionizedCalciumMmolL: 0.96, carpopedalSpasm: false, perioralTingling: true }, ended: null });
    expect(patient.continuingDueInSeconds).toBeGreaterThan(0);
    expect(outcomes()).toEqual(['Met', 'Met', 'Not met', 'Met', 'Not met']);
    expect(container.textContent).toContain('its observed response, mineral care, or longer-term surveillance remains incomplete or pending');
  });
});
