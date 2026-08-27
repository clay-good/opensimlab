/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { Debrief } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { RenalHypermagnesemia, RENAL_HYPERMAGNESEMIA_TAKEOVER_TICKS as STOP,
  RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS as CALCIUM, RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS as REMOVAL,
  type RenalHypermagnesemiaAction, type RenalHypermagnesemiaEvent } from '../../src/modules/renal-electrolyte/hypermagnesemia';
import { RENAL_HYPERMAGNESEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypermagnesemia-fixtures';
import { RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypermagnesemia-antagonism-and-removal';

type Choices = readonly (readonly [number, RenalHypermagnesemiaAction])[];
const ownership: Choices = [[0, 'stop-magnesium'], [0, 'call-support'], [0, 'review-context'], [0, 'monitor']];

describe('Renal hypermagnesemia rendered debrief distinguishes antagonism from removal', () => {
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
    // Actual model events feed the rendered debrief; the engine suite independently checks every frame.
    const model = new RenalHypermagnesemia(); const log: EngineEvent[] = []; const history: HistorySample[] = [];
    const initial = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' }).step();
    const capture = (events: readonly RenalHypermagnesemiaEvent[], tick: number) => {
      log.push(...events.map((event) => ({ tick, severity: 'info' as const, category: 'renal-hypermagnesemia',
        message: event.message, eventId: `renal-hypermagnesemia-${event.id}-${tick}` })));
      const { alertness: _alertness, ...vitals } = model.vitals();
      history.push({ tick, state: { ...initial.state, ...vitals }, concentrations: initial.concentrations });
    };
    capture([], 0);
    const actions: LearnerAction[] = choices.map(([tick, action]) => {
      capture(model.apply(action, tick), tick);
      return { tick, type: 'renal-hypermagnesemia-response', payload: { action } };
    });
    capture(model.advance(finalTick), finalTick);
    act(() => root.render(<Debrief scenario={SCENARIO} moduleId="renal-electrolyte"
      history={history} actions={actions} log={log} attributionByTick={() => []} preoxygenationSeconds={0}
      timeToPeakSeconds={{}} replayOptions={{ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US', ticks: finalTick }}
      onOpenExplainer={() => {}} onExportTranscript={() => {}} onReplayScenario={() => {}} />));
    click('Skip and continue'); click('Continue to the analysis');
    expect(container.textContent).not.toContain('That is a good outcome');
    click('Continue');
    expect(container.textContent).toContain('Supported respiratory rate and saturation are not proof of spontaneous breathing recovery');
    expect(container.textContent).toContain('the authored interval is not a redosing schedule');
    expect(container.textContent).toContain('Stopping intake does not instantly remove absorbed magnesium');
    expect(container.textContent).toContain('Historical potassium, calcium, sodium, glucose, and kidney context do not become new measurements');
    expect(container.textContent).toContain('Handoff ends rehearsal, not respiratory support, surveillance, or clinical risk');
    expect(container.textContent).toContain('no discharge clearance is supplied');
    return model.snapshot(finalTick);
  }
  const outcomes = () => [...container.querySelectorAll('li > strong')].map((item) => item.textContent);

  it.each(['expert', 'recovery', 'commonError', 'noAction'] as const)('renders the %s course without claiming clearance or autonomous breathing', (path) => {
    const complete = path === 'expert' || path === 'recovery'; const choices = FIXTURES[path];
    const patient = renderRun(choices, complete ? choices.at(-1)![0] : STOP);
    expect(patient.ended).toBe(complete ? 'handoff' : 'instructor-takeover');
    expect(patient.durableRecoveryProven).toBe(false);
    expect(outcomes()).toEqual(Array(5).fill(complete ? 'Met' : 'Not met'));
    if (complete) {
      expect(patient.observation).toMatchObject({ magnesiumMmolL: 2.4, reflexesPresent: true,
        respiratoryRateBpm: 14, spo2Percent: 96, alertness: 'awake with residual weakness' });
      expect(container.textContent).toContain('Observed recurrent clinical toxicity remains in the history; it is not a measured magnesium rebound');
    }
    if (path === 'recovery' || path === 'commonError') {
      expect(container.textContent).toContain('Routine forced diuresis was refused');
      expect(container.textContent).toContain('The claim that calcium established magnesium clearance was refused');
    }
  });

  it('does not merge separate partial observations into a current full removal response or handoff', () => {
    const patient = renderRun([...ownership, [0, 'support-breathing'], [0, 'calcium'], [0, 'deliver-removal'], [0, 'reassess'],
      [REMOVAL, 'check-magnesium'], [REMOVAL + 1, 'check-neuromuscular'], [REMOVAL + 2, 'handoff']], REMOVAL + 2);
    expect(patient).toMatchObject({ ended: null, removalResponseObserved: false,
      observation: { atTick: 0, magnesiumMmolL: 4.6, reflexesPresent: false },
      magnesiumObservation: { atTick: REMOVAL, magnesiumMmolL: 2.4 },
      neuromuscularObservation: { atTick: REMOVAL + 1, reflexesPresent: true, severeWeakness: false } });
    expect(outcomes()).toEqual(['Met', 'Met', 'Not met', 'Met', 'Not met']);
    expect(container.textContent).toContain('preserve the full panel’s age');
  });

  it('hands off current recurrence while the newly delivered removal response and objective remain pending', () => {
    const patient = renderRun([...ownership, [0, 'support-breathing'], [0, 'calcium'], [0, 'reassess'],
      [CALCIUM, 'reassess'], [CALCIUM + 1, 'deliver-removal'],
      [CALCIUM + 2, 'reassess'], [CALCIUM + 3, 'handoff']], CALCIUM + 3);
    expect(patient).toMatchObject({ ended: 'handoff', recurrenceObserved: true, removalResponseObserved: false,
      observation: { magnesiumMmolL: 4.6, reflexesPresent: false, severeWeakness: true } });
    expect(outcomes()).toEqual(['Met', 'Met', 'Not met', 'Met', 'Met']);
    expect(container.textContent).toContain('incomplete or pending');
    expect(container.textContent).toContain('Removal may still be pending');
  });

  it('credits actual removal-first response and supported breathing without imposing late calcium', () => {
    const patient = renderRun([...ownership, [0, 'deliver-removal'], [REMOVAL, 'reassess'],
      [REMOVAL + 1, 'support-breathing'], [REMOVAL + 2, 'reassess'], [REMOVAL + 3, 'handoff']], REMOVAL + 3);
    expect(patient).toMatchObject({ calciumAtTick: null, calciumRequests: 0, removalResponseObserved: true,
      calciumResponseObserved: false, recurrenceObserved: false, ended: 'handoff',
      observation: { magnesiumMmolL: 2.4, respiratoryRateBpm: 14, spo2Percent: 96, severeWeakness: false } });
    expect(outcomes()).toEqual(Array(5).fill('Met'));
    expect(container.textContent).toContain('No calcium request was recorded; an observed removal response does not require unnecessary late calcium');
  });
});
