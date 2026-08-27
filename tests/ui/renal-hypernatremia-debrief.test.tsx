/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { Debrief } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { RenalHypernatremia, RENAL_HYPERNATREMIA_TAKEOVER_TICKS as STOP,
  RENAL_HYPERNATREMIA_VOLUME_TICKS as VOLUME, RENAL_HYPERNATREMIA_WATER_TICKS as WATER,
  RENAL_HYPERNATREMIA_COMBINED_TICKS as COMBINED, RENAL_HYPERNATREMIA_RECURRENCE_TICKS as RECURRENCE,
  type RenalHypernatremiaAction, type RenalHypernatremiaEvent } from '../../src/modules/renal-electrolyte/hypernatremia';
import { RENAL_HYPERNATREMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypernatremia-fixtures';
import { RENAL_HYPERNATREMIA_WATER_ACCESS_AND_LOSSES as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypernatremia-water-access-and-losses';

describe('Renal hypernatremia rendered debrief separates observed response from continuity care', () => {
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
  function renderRun(choices: readonly (readonly [number, RenalHypernatremiaAction])[], finalTick: number) {
    // Actual model transitions/events; the integration suite checks every solver frame separately.
    const model = new RenalHypernatremia(); const log: EngineEvent[] = []; const history: HistorySample[] = [];
    const initial = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' }).step();
    const capture = (events: readonly RenalHypernatremiaEvent[], tick: number) => {
      log.push(...events.map((event) => ({ tick, severity: 'info' as const, category: 'renal-hypernatremia',
        message: event.message, eventId: `renal-hypernatremia-${event.id}-${tick}` })));
      const { alertness: _alertness, ...vitals } = model.vitals();
      history.push({ tick, state: { ...initial.state, ...vitals }, concentrations: initial.concentrations });
    };
    capture([], 0);
    const actions: LearnerAction[] = choices.map(([tick, action]) => {
      capture(model.apply(action, tick), tick);
      return { tick, type: 'renal-hypernatremia-response', payload: { action } };
    });
    capture(model.advance(finalTick), finalTick);
    act(() => root.render(<Debrief scenario={SCENARIO} moduleId="renal-electrolyte"
      history={history} actions={actions} log={log} attributionByTick={() => []} preoxygenationSeconds={0}
      timeToPeakSeconds={{}} replayOptions={{ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US', ticks: finalTick }}
      onOpenExplainer={() => {}} onExportTranscript={() => {}} onReplayScenario={() => {}} />));
    click('Skip and continue'); click('Continue to the analysis');
    expect(container.textContent).not.toContain('That is a good outcome');
    click('Continue');
    expect(container.textContent).toContain('Better pressure alone does not establish corrected water balance or renal recovery');
    expect(container.textContent).toContain('not a universal exclusion of renal causes');
    expect(container.textContent).toContain('does not instantly stop diarrhea');
    expect(container.textContent).toContain('not a prerequisite for biochemical response');
    expect(container.textContent).toContain('No dose, optimal correction rate, or guaranteed safety is inferred');
    expect(container.textContent).toContain('Handoff ends rehearsal, not water replacement or surveillance');
    expect(container.textContent).toContain('certifies no discharge readiness, durable recovery, or competence');
    return model.snapshot(finalTick);
  }
  const outcomes = () => [...container.querySelectorAll('li > strong')].map((item) => item.textContent);

  it.each(['expert', 'recovery', 'commonError', 'noAction'] as const)('renders the %s course without certifying sodium or renal recovery', (path) => {
    const complete = path === 'expert' || path === 'recovery'; const choices = FIXTURES[path];
    const patient = renderRun(choices, complete ? choices.at(-1)![0] : STOP);
    expect(patient.ended).toBe(complete ? 'handoff' : 'instructor-takeover');
    expect(patient.durableRecoveryProven).toBe(false);
    expect(outcomes()).toEqual(Array(5).fill(complete ? 'Met' : 'Not met'));
    if (complete) expect(patient.observation).toMatchObject({ sodiumMmolL: 162, ongoingDiarrhea: true });
    if (path === 'expert') expect(patient.waterResponseObserved).toBe(false);
    if (path === 'recovery' || path === 'commonError') {
      expect(container.textContent).toContain('Empiric desmopressin without an established indication was refused');
      expect(container.textContent).toContain('attempted blind-normalization shortcut remains visible');
    }
    if (path === 'recovery') expect(container.textContent).toContain('Earlier observed recurrence remains part of this course');
  });

  it('does not credit separate sodium and fluid-balance checks as a combined response or current handoff', () => {
    const final = VOLUME + COMBINED;
    const patient = renderRun([[0, 'restore-volume'], [0, 'call-support'], [0, 'review-context'], [0, 'monitor'],
      [0, 'assist-water-access'], [VOLUME, 'reassess'], [VOLUME, 'replace-water'], [VOLUME, 'manage-losses'],
      [final, 'check-sodium'], [final + 1, 'check-fluid-balance'], [final + 2, 'handoff']], final + 2);
    expect(patient).toMatchObject({ ended: null, combinedResponseObserved: false,
      observation: { atTick: VOLUME, sodiumMmolL: 164 }, sodiumObservation: { atTick: final, sodiumMmolL: 162 },
      fluidBalanceObservation: { atTick: final + 1, ongoingDiarrhea: true } });
    expect(outcomes()).toEqual(['Met', 'Met', 'Not met', 'Not met', 'Not met']);
    expect(container.textContent).toContain('do not refresh the older full assessment');
  });

  it('permits current recurrence handoff while loss-care response and its objective remain pending', () => {
    const recur = VOLUME + RECURRENCE;
    const patient = renderRun([[0, 'restore-volume'], [0, 'call-support'], [0, 'review-context'], [0, 'monitor'],
      [0, 'assist-water-access'], [VOLUME, 'replace-water'], [VOLUME + WATER, 'reassess'],
      [recur, 'reassess'], [recur + 1, 'manage-losses'], [recur + 2, 'reassess'], [recur + 3, 'handoff']], recur + 3);
    expect(patient).toMatchObject({ ended: 'handoff', recurrenceObserved: true, combinedResponseObserved: false,
      observation: { sodiumMmolL: 164, ongoingDiarrhea: true } });
    expect(outcomes()).toEqual(['Met', 'Met', 'Not met', 'Met', 'Met']);
    expect(container.textContent).toContain('observed combined response remains incomplete or pending');
    expect(container.textContent).toContain('A treatment response may remain pending');
  });

  it('does not let a fresh early water panel masquerade as observed response to newly delivered loss care', () => {
    const early = VOLUME + WATER;
    const patient = renderRun([[0, 'restore-volume'], [0, 'call-support'], [0, 'review-context'], [0, 'monitor'],
      [VOLUME, 'replace-water'], [early, 'manage-losses'], [early + 1, 'reassess']], early + 1);
    expect(patient).toMatchObject({ waterResponseObserved: true, combinedResponseObserved: false,
      observation: { sodiumMmolL: 163, ongoingDiarrhea: true }, waterAccessAtTick: null });
    expect(patient.combinedDueInSeconds).toBeGreaterThan(0);
    expect(outcomes()).toEqual(['Met', 'Met', 'Not met', 'Met', 'Not met']);
    expect(container.textContent).toContain('observed combined response remains incomplete or pending');
  });
});
