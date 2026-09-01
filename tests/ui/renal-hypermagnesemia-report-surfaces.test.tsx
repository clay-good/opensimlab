/**
 * @vitest-environment jsdom
 * @vitest-environment-options {"url":"https://opensimlab.com/"}
 * Real route, forms, projection, and Worker validator; session and Cockpit are mocked.
 * Requests are intercepted. No production Turnstile, Worker, or D1 is contacted.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionState } from '@platform/session/session-store';
import type { LearnerAction } from '@platform/kernel/protocol';
import type { ScenarioReportRequest } from '@platform/reporting/contracts';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { APP_VERSION } from '@platform/governance/status';
import { ACKNOWLEDGEMENT_KEY } from '@platform/safety/not-for-clinical-use';
import { collectReportEquipmentContext } from '@routes/AnesthesiaRoute';
import { RenalElectrolyteRoute } from '@routes/modules/renal-electrolyte';
import { RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypermagnesemia-antagonism-and-removal';
import { RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS, RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS } from '../../src/modules/renal-electrolyte/hypermagnesemia';
import { validateReportPayload } from '../../workers/reports/src/index.mjs';

const harness = vi.hoisted(() => ({ session: null as unknown as SessionState, actions: [] as LearnerAction[], build: vi.fn() }));
vi.mock('@platform/session/session-store', () => ({
  useSession: () => harness.session, sessionInternals: () => ({ recorder: { build: harness.build } }),
}));
vi.mock('@anesthesia/ui/Cockpit', () => ({
  Cockpit: ({ demonstrating, onReportSource, onTakeControls }: {
    demonstrating: boolean; onReportSource: () => void; onTakeControls: () => void;
  }) => <main data-testid="route-cockpit" data-demonstrating={demonstrating}>
    <button onClick={onReportSource}>Report this source</button><button onClick={onTakeControls}>Take controls</button>
  </main>,
}));
const path = `/renal-electrolyte/scenario/${SCENARIO.metadata.id}`;
const service = { sitekey: 'test-key', action: 'scenario-report', maintainer: 'Open Sim Lab maintainers',
  privacy_url: 'https://opensimlab.com/privacy#problem-reports' };

describe('Renal hypermagnesemia reports through the shared centered form and exact-version Worker validator', () => {
  let container: HTMLDivElement; let root: Root;
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (input === '/api/reports/config' && !init?.body) return Response.json(service);
    if (input === '/api/reports' && init?.method === 'POST') return new Response(null, { status: 202 });
    throw new Error('Unexpected network request in local report test');
  });
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); }, clear: () => storage.clear() });
    localStorage.setItem(ACKNOWLEDGEMENT_KEY, 'true');
    history.replaceState({}, '', `${path}?seed=4999&assignment=private-assignment-label`);
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4999, practiceRegion: 'US' });
    harness.actions = Array.from({ length: 24 }, (_, tick) => ({ tick, type: 'renal-hypermagnesemia-response', payload: { action: 'reassess' } }));
    const frames = harness.actions.map((action) => { engine.apply(action); return engine.step(); });
    const frame = frames.at(-1)!; const renalHypermagnesemia = frame.equipment.resuscitation.renalHypermagnesemia!;
    const privateState = { ...frame.state, glucoseMgDl: 999, sodiumMmolL: 999, cgmGlucoseMgDl: 999, latentBranch: 9 };
    const privateSnapshot = { ...renalHypermagnesemia, choiceFeedback: 'private-value', alertness: 'private-value',
      actualGlucoseMgDl: 999, actualMagnesiumMmolL: 999, calciumMmolL: 999, potassiumMmolL: 999, sodiumMmolL: 999, egfr: 999, qtcMs: 999, cgmGlucoseMgDl: 999, branch: 'private-branch',
      magnesiumObservation: { ...renalHypermagnesemia.magnesiumObservation!, hiddenMagnesiumMmolL: 999 },
      neuromuscularObservation: { ...renalHypermagnesemia.neuromuscularObservation!, alertness: 'private-value', hiddenQtcMs: 'private-value' },
      observation: { ...renalHypermagnesemia.observation!, alertness: 'private-value', hiddenGlucoseMgDl: 999 } };
    harness.build.mockReset().mockImplementation(() => ({ actions: harness.actions }));
    const update = (values: Partial<SessionState>) => { harness.session = { ...harness.session, ...values }; };
    harness.session = {
      phase: 'briefing', ready: true, error: null, tick: 24, elapsed: '00:00:02', transport: 'paused', speed: 1,
      catchUpNotice: false, rehearsalBranch: null, state: privateState, concentrations: [], attribution: [],
      alarms: [], waveformBlocks: [], warnings: [], history: [{ tick: 24, state: frame.state, concentrations: [] }],
      log: frames.flatMap(({ events }) => events.map((event) => ({ ...event, message: 'private log prose' }))),
      unreadLog: false, guidance: 'guided', equipment: { ...frame.equipment, resuscitation: { ...frame.equipment.resuscitation, renalHypermagnesemia: privateSnapshot } },
      begin: vi.fn(), play: vi.fn(() => update({ phase: 'running', transport: 'running' })),
      pause: vi.fn(() => update({ transport: 'paused' })), singleStep: vi.fn(),
      setSpeed: vi.fn((speed) => update({ speed })), resetSession: vi.fn(() => update({ phase: 'briefing', tick: 0, transport: 'paused' })),
      rehearseFromDecisionPoint: vi.fn((pointId, decisionTick) => update({ phase: 'running', transport: 'paused', tick: decisionTick,
        rehearsalBranch: { pointId, decisionTick, parentTicks: 24 } })),
      act: vi.fn(), frame: vi.fn(), markLogRead: vi.fn(), setGuidance: vi.fn(),
      end: vi.fn(() => update({ phase: 'ended', transport: 'paused' })), exportTranscript: vi.fn(), resumeAfterWorkerLoss: vi.fn(),
    };
    fetchMock.mockClear(); vi.stubGlobal('fetch', fetchMock);
    window.turnstile = { render: (_host, options) => { (options.callback as (token: string) => void)('local-test-token'); return 'local-widget'; },
      remove: vi.fn(), reset: vi.fn() };
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); delete window.turnstile;
    localStorage.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  });
  const render = async () => { await act(async () => { root.render(<RenalElectrolyteRoute path={path} />); }); };
  const button = (label: string) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === label)!;
  const click = async (target: HTMLElement) => { expect(target).toBeTruthy(); await act(async () => { target.click(); }); };
  const openReport = async () => {
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Help us improve this"]')!);
    expect(container.querySelector('[role="dialog"][aria-modal="true"]')).not.toBeNull();
    expect(container.querySelector<HTMLTextAreaElement>('#problem-report-note')!.maxLength).toBe(160);
    expect(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(false);
    expect(container.querySelector('.problem-report__context-preview')).toBeNull();
  };
  const selectCategory = async () => {
    const select = container.querySelector<HTMLSelectElement>('#problem-report-category')!;
    await act(async () => { select.value = 'tutor-debrief'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  };
  const typeText = async (element: HTMLTextAreaElement, value: string) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  const lastPayload = () => JSON.parse(String(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST').at(-1)![1]!.body)) as ScenarioReportRequest;
  const expectIdentity = (payload: ScenarioReportRequest, surface: ScenarioReportRequest['surface']) => {
    expect(payload).toMatchObject({ module_id: 'renal-electrolyte', scenario_id: SCENARIO.metadata.id,
      content_version: '0.1.0', app_version: APP_VERSION, engine_version: ENGINE_VERSION,
      surface, canonical_url: `https://opensimlab.com${path}`, category: 'tutor-debrief', turnstile_token: 'local-test-token' });
    expect(validateReportPayload(payload)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...payload, content_version: '0.1.1' }).ok).toBe(false);
    expect(validateReportPayload({ ...payload, source_manifest_hash: 'sha256:' + '0'.repeat(64) }).ok).toBe(false);
    expect(JSON.stringify(payload)).not.toMatch(/private-assignment-label|private-value|private log prose|private debrief account/);
  };

  it.each(['briefing', 'running', 'ended'] as const)('reports %s with no implicit context and a 160-character limit', async (phase) => {
    harness.session = { ...harness.session, phase, transport: phase === 'running' ? 'running' : 'paused' };
    await render(); expect(fetchMock).not.toHaveBeenCalled();
    if (phase === 'ended') await typeText(container.querySelector<HTMLTextAreaElement>('#reactions-account')!, 'private debrief account');
    await openReport(); await selectCategory();
    await typeText(container.querySelector<HTMLTextAreaElement>('#problem-report-note')!, 'x'.repeat(161));
    await click(button('Send report'));
    const payload = lastPayload(); expectIdentity(payload, phase === 'briefing' ? 'prebrief' : phase === 'ended' ? 'debrief' : 'live');
    expect(payload.note).toHaveLength(160); expect(payload.recent_context).toBeNull(); expect(payload.simulated_tick).toBe(24);
    expect(validateReportPayload({ ...payload, note: 'x'.repeat(161) }).ok).toBe(false);
    await click(button('Done')); expect(harness.session.pause).toHaveBeenCalledTimes(phase === 'running' ? 1 : 0);
    expect(harness.session.play).toHaveBeenCalledTimes(phase === 'running' ? 1 : 0); expect(harness.session.act).not.toHaveBeenCalled();
  });

  it('reports limitations and source surfaces without starting practice or collecting context', async () => {
    await render(); await click(button('Help us improve these limitations'));
    await selectCategory(); await click(button('Send report')); expectIdentity(lastPayload(), 'limitation');
    expect(lastPayload().recent_context).toBeNull(); await click(button('Done'));
    harness.session = { ...harness.session, phase: 'running' }; await render();
    await click(button('Report this source')); await selectCategory(); await click(button('Send report'));
    expectIdentity(lastPayload(), 'source'); expect(lastPayload().recent_context).toBeNull(); await click(button('Done'));
    expect(harness.build).not.toHaveBeenCalled(); expect(harness.session.play).not.toHaveBeenCalled();
  });

  it('returns Cancel focus to the report trigger without advancing paused practice or collecting context', async () => {
    harness.session = { ...harness.session, phase: 'running', transport: 'paused' };
    await render();
    const trigger = container.querySelector<HTMLButtonElement>('button[aria-label="Help us improve this"]')!;
    trigger.focus(); const tick = harness.session.tick;
    await openReport();
    expect(container.querySelector('[role="dialog"]')?.contains(document.activeElement)).toBe(true);
    await click(button('Cancel'));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(harness.session.tick).toBe(tick); expect(harness.session.transport).toBe('paused');
    expect(harness.session.play).not.toHaveBeenCalled(); expect(harness.session.act).not.toHaveBeenCalled();
    expect(harness.build).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('collects only explicit observed equipment fields, seven live vitals, and the last 20 proven actions after opt-in', async () => {
    await render(); await click(button('Watch a worked example')); expect(harness.session.speed).toBe(60);
    vi.mocked(harness.session.play).mockClear(); harness.build.mockClear();
    await openReport(); expect(harness.build).not.toHaveBeenCalled();
    await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!); expect(harness.build).toHaveBeenCalledOnce();
    const preview = JSON.parse(container.querySelector('.problem-report__context-preview')!.textContent!);
    await selectCategory(); await click(button('Send report')); const payload = lastPayload(); expectIdentity(payload, 'live');
    const context = payload.recent_context!; expect(context.actions).toHaveLength(20); expect(context.actions[0]?.tick).toBe(4);
    expect(context).toEqual(preview);
    expect(context.actions.every(({ outcome, payload: selected }) => outcome === 'accepted' && selected.action === 'reassess')).toBe(true);
    expect(Object.keys(context.snapshot.patient)).toHaveLength(7); expect(Object.keys(context.snapshot.equipment)).toHaveLength(31);
    expect(Object.keys(context.snapshot.equipment).sort()).toEqual([
      'supportActive', 'stopMagnesiumAtTick', 'breathingAtTick', 'calciumAtTick', 'lastCalciumAtTick',
      'calciumRequests', 'contextReviewedAtTick', 'removalAtTick', 'monitoringAtTick',
      'calciumResponseObserved', 'removalResponseObserved', 'recurrenceObserved',
      'calciumClearanceAttempted', 'routineDiuresisAttempted', 'ended',
      ...['atTick', 'magnesiumMmolL'].map((key) => `magnesiumObservation.${key}`),
      ...['atTick', 'reflexesPresent', 'severeWeakness'].map((key) => `neuromuscularObservation.${key}`),
      ...['atTick', 'magnesiumMmolL', 'reflexesPresent', 'severeWeakness', 'systolicMmHg', 'diastolicMmHg',
        'meanArterialMmHg', 'heartRateBpm', 'respiratoryRateBpm', 'spo2Percent', 'coreTemperatureC']
        .map((key) => `observation.${key}`),
    ].map((key) => `resuscitation.renalHypermagnesemia.${key}`).sort());
    expect(context.snapshot.equipment).toMatchObject({ 'resuscitation.renalHypermagnesemia.observation.atTick': 23,
      'resuscitation.renalHypermagnesemia.observation.magnesiumMmolL': 4.6,
      'resuscitation.renalHypermagnesemia.observation.reflexesPresent': false,
      'resuscitation.renalHypermagnesemia.observation.severeWeakness': true,
      'resuscitation.renalHypermagnesemia.observation.coreTemperatureC': 36.3 });
    expect(validateReportPayload({ ...payload, recent_context: { ...context, snapshot: { ...context.snapshot,
      equipment: { ...context.snapshot.equipment, extra1: 1, extra2: 2, extra3: 3 } } } }).ok).toBe(false);
    expect(JSON.stringify(context)).not.toMatch(/actualGlucose|actualMagnesium|hiddenGlucose|hiddenMagnesium|hiddenQtc|calciumMmolL|potassiumMmolL|sodiumMmolL|egfr|qtcMs|cgmGlucose|latentBranch|branch|alertness|choiceFeedback|DueInSeconds|fio2|etco2|paco2/);
    expect(context.seed).toBe(4999);
    expect([...Object.values(context.snapshot.patient), ...Object.values(context.snapshot.equipment)]).not.toContain(999);
    await click(button('Done')); expect(harness.session.transport).toBe('paused'); expect(harness.session.play).not.toHaveBeenCalled();
    await openReport(); await click(button('Cancel')); expect(harness.session.play).not.toHaveBeenCalled();
  });

  it('keeps magnesium-only, neuromuscular-only, and full findings historical through antagonism and removal', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4999, practiceRegion: 'US' });
    let frame = engine.step();
    const project = () => collectReportEquipmentContext(frame.equipment);
    const field = (name: string) => project()[`resuscitation.renalHypermagnesemia.${name}`];
    expect(Object.keys(project())).toHaveLength(18);
    expect(field('observation')).toBeNull(); expect(field('magnesiumObservation')).toBeNull();
    expect(field('neuromuscularObservation')).toBeNull();
    expect(Object.keys(project()).some((key) => /MmolL|reflexesPresent|severeWeakness/.test(key))).toBe(false);
    const choose = (action: string) => {
      engine.apply({ tick: frame.tick, type: 'renal-hypermagnesemia-response', payload: { action } });
      frame = engine.step();
    };
    const advanceTo = (target: number) => { while (frame.tick <= target) frame = engine.step(); };
    choose('reassess');
    expect(field('observation.atTick')).toBe(1);
    expect(field('observation.magnesiumMmolL')).toBe(4.6);
    expect(field('observation.reflexesPresent')).toBe(false);
    choose('support-breathing'); choose('calcium');
    const calciumAt = Number(field('calciumAtTick'));
    expect(field('observation.heartRateBpm')).toBe(44);
    expect(field('observation.respiratoryRateBpm')).toBe(8);
    choose('reassess');
    expect(field('observation.heartRateBpm')).toBe(62);
    expect(field('observation.respiratoryRateBpm')).toBe(14);
    expect(field('observation.magnesiumMmolL')).toBe(4.6);
    expect(field('observation.reflexesPresent')).toBe(false);
    expect(field('calciumResponseObserved')).toBe(true);
    const antagonized = project();
    advanceTo(calciumAt + RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS);
    expect(project()).toEqual(antagonized);
    choose('check-neuromuscular');
    expect(field('neuromuscularObservation.reflexesPresent')).toBe(false);
    expect(field('observation.heartRateBpm')).toBe(62);
    expect(field('recurrenceObserved')).toBe(false);
    choose('reassess');
    expect(field('recurrenceObserved')).toBe(true);
    expect(field('observation.magnesiumMmolL')).toBe(4.6);
    expect(field('observation.heartRateBpm')).toBe(44);
    const removalAt = frame.tick; choose('deliver-removal');
    const requested = project();
    advanceTo(removalAt + RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS);
    expect(project()).toEqual(requested);
    choose('check-magnesium');
    expect(field('magnesiumObservation.magnesiumMmolL')).toBe(2.4);
    expect(field('observation.magnesiumMmolL')).toBe(4.6);
    expect(field('neuromuscularObservation.reflexesPresent')).toBe(false);
    expect(field('removalResponseObserved')).toBe(false);
    const magnesiumAt = field('magnesiumObservation.atTick');
    choose('check-neuromuscular');
    expect(field('neuromuscularObservation.reflexesPresent')).toBe(true);
    expect(field('neuromuscularObservation.severeWeakness')).toBe(false);
    expect(field('magnesiumObservation.atTick')).toBe(magnesiumAt);
    expect(field('observation.reflexesPresent')).toBe(false);
    expect(field('removalResponseObserved')).toBe(false);
    choose('reassess');
    expect(Object.keys(project())).toHaveLength(31);
    expect(field('observation.magnesiumMmolL')).toBe(2.4);
    expect(field('observation.reflexesPresent')).toBe(true);
    expect(field('observation.severeWeakness')).toBe(false);
    expect(field('observation.respiratoryRateBpm')).toBe(14);
    expect(field('observation.atTick')).toBe(field('magnesiumObservation.atTick'));
    expect(field('observation.atTick')).toBe(field('neuromuscularObservation.atTick'));
    expect(field('removalResponseObserved')).toBe(true); expect(field('recurrenceObserved')).toBe(true);
    expect(field('contextReviewedAtTick')).toBeNull(); expect(field('monitoringAtTick')).toBeNull();
    expect(JSON.stringify(project())).not.toMatch(/alertness|choiceFeedback|DueInSeconds|phase|calciumMmolL|potassiumMmolL|egfr|qtcMs|creatinine/);
  }, 120_000);

  it.each([false, true])('attributes observation, calcium antagonism, and refused shortcuts independently at one paused tick (reversed: %s)', async (reversed) => {
    const choices = ['check-magnesium', 'calcium-means-clearance', 'calcium', 'routine-diuresis'];
    if (reversed) choices.reverse();
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4999, practiceRegion: 'US' });
    harness.actions = choices.map((action) => ({ tick: 0, type: 'renal-hypermagnesemia-response', payload: { action } }));
    for (const action of harness.actions) engine.apply(action);
    const frame = engine.step();
    harness.session = { ...harness.session, phase: 'running', tick: frame.tick, state: frame.state,
      equipment: frame.equipment, log: frame.events };
    await render(); await openReport(); await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await selectCategory(); await click(button('Send report')); const payload = lastPayload(); expectIdentity(payload, 'live');
    const expected = choices.map((action) => ({
      tick: 0, type: 'renal-hypermagnesemia-response', payload: { action },
      outcome: ['calcium-means-clearance', 'routine-diuresis'].includes(action) ? 'refused' : 'accepted',
    }));
    expect(payload.recent_context!.actions).toEqual(expected);
    expect(harness.session.act).not.toHaveBeenCalled();
  });

  it('omits pending and replay-cleared outcomes and never falls back to generic equipment while a snapshot is missing', async () => {
    harness.session = { ...harness.session, phase: 'running', log: [],
      equipment: { ...harness.session.equipment!, resuscitation: { ...harness.session.equipment!.resuscitation, renalHypermagnesemia: undefined } },
      rehearsalBranch: { pointId: 'renal-hypermagnesemia-first-response', decisionTick: 1, parentTicks: 24 } };
    await render(); await openReport(); await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await selectCategory(); await click(button('Send report')); const payload = lastPayload(); expectIdentity(payload, 'live');
    expect(payload.recent_context!.actions).toEqual([]); expect(payload.recent_context!.snapshot.equipment).toEqual({});
    expect(Object.keys(payload.recent_context!.snapshot.patient)).toHaveLength(7);
    await click(button('Done')); expect(harness.session.play).not.toHaveBeenCalled();
  });

  it('restores ordinary 1x practice after resetting an example without retaining report consent', async () => {
    await render(); await click(button('Watch a worked example')); await openReport();
    await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!); await click(button('Cancel'));
    harness.session.resetSession(); await render(); await click(button('Start the scenario')); await render();
    expect(harness.session.speed).toBe(1); expect(container.querySelector('[data-demonstrating="false"]')).not.toBeNull();
    await openReport(); expect(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(false);
  });
});
