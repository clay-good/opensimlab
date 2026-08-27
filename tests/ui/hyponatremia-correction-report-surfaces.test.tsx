/**
 * @vitest-environment jsdom
 * @vitest-environment-options {"url":"https://opensimlab.com/"}
 *
 * Real route, briefing, debrief, report modal, projection, and Worker validator.
 * The session and entire Cockpit (including demo scheduling) are replaced;
 * these tests establish route behavior, not real-worker demonstration timing.
 * Every request is intercepted; no Turnstile service, Worker, or D1 is called.
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
import { collectReportEquipmentContext, EndocrineMetabolicRoute } from '@routes/AnesthesiaRoute';
import { HYPONATREMIA_AQUARESIS_AND_OVERCORRECTION as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hyponatremia-aquaresis-and-overcorrection';
import { validateReportPayload } from '../../workers/reports/src/index.mjs';

const harness = vi.hoisted(() => ({ session: null as unknown as SessionState, actions: [] as LearnerAction[], build: vi.fn(),
  takeControls: undefined as (() => void) | undefined }));
vi.mock('@platform/session/session-store', () => ({
  useSession: () => harness.session,
  sessionInternals: () => ({ recorder: { build: harness.build } }),
}));
vi.mock('@anesthesia/ui/Cockpit', () => ({
  Cockpit: ({ demonstrating, onEnd, onReportSource, onTakeControls }: {
    demonstrating: boolean; onEnd: () => void; onReportSource: () => void; onTakeControls: () => void;
  }) => {
    harness.takeControls = onTakeControls;
    return <main data-testid="route-cockpit" data-demonstrating={demonstrating}>
      <button onClick={onEnd}>Finish this rehearsal</button>
      <button onClick={onReportSource}>Report this source</button>
    </main>;
  },
}));

const path = `/endocrine-metabolic/scenario/${SCENARIO.metadata.id}`;
const service = { sitekey: 'test-key', action: 'scenario-report', maintainer: 'Open Sim Lab maintainers',
  privacy_url: 'https://opensimlab.com/privacy#problem-reports' };

describe('exact-version hyponatremia correction reporting through shared route surfaces', () => {
  let container: HTMLDivElement; let root: Root;
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (input === '/api/reports/config' && !init?.body) return Response.json(service);
    if (input === '/api/reports' && init?.method === 'POST') return new Response(null, { status: 202 });
    throw new Error('Unexpected network request in local report test');
  });

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); }, clear: () => storage.clear(),
    });
    localStorage.clear(); localStorage.setItem(ACKNOWLEDGEMENT_KEY, 'true');
    history.replaceState({}, '', `${path}?seed=4907&assignment=private-assignment-label`);
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4907, practiceRegion: 'US' });
    harness.actions = Array.from({ length: 24 }, (_, tick) => ({ tick,
      type: 'hyponatremia-correction-response', payload: { action: 'reassess' } }));
    const frames = harness.actions.map((action) => { engine.apply(action); return engine.step(); });
    const frame = frames.at(-1)!;
    const hyponatremiaCorrection = frame.equipment.resuscitation.hyponatremiaCorrection!;
    // Unexpected fields must not turn a report into a view of unrequested data.
    const privateState = { ...frame.state, sodiumMmolL: 116, urineOutputMlPerHour: 350, latentBranch: 9 };
    const privateSnapshot = {
      ...hyponatremiaCorrection, choiceFeedback: 'private-value', alertness: 'private-value',
      actualSodiumMmolL: 116, branch: 'private-branch',
      observation: { ...hyponatremiaCorrection.observation!, alertness: 'private-value', hiddenSodiumMmolL: 116 },
    };
    harness.build.mockReset().mockImplementation(() => ({ actions: harness.actions }));
    const update = (values: Partial<SessionState>) => { harness.session = { ...harness.session, ...values }; };
    harness.session = {
      phase: 'briefing', ready: true, error: null, tick: 24, elapsed: '00:00:02', transport: 'paused', speed: 1,
      catchUpNotice: false, rehearsalBranch: null, state: privateState, concentrations: [], attribution: [],
      alarms: [], waveformBlocks: [], warnings: [], history: [{ tick: 24, state: frame.state, concentrations: [] }],
      log: frames.flatMap(({ events }) => events.map((event) => ({ ...event, message: `${event.eventId} private log prose` }))),
      unreadLog: false, guidance: 'guided',
      equipment: { ...frame.equipment, resuscitation: { ...frame.equipment.resuscitation,
        hyponatremiaCorrection: privateSnapshot } },
      begin: vi.fn(), play: vi.fn(() => update({ phase: 'running', transport: 'running' })),
      pause: vi.fn(() => update({ transport: 'paused' })), singleStep: vi.fn(),
      setSpeed: vi.fn((speed) => update({ speed })), resetSession: vi.fn(() => update({ phase: 'briefing', tick: 0, transport: 'paused' })),
      rehearseFromDecisionPoint: vi.fn((pointId, decisionTick) => update({ phase: 'running', transport: 'paused', tick: decisionTick,
        rehearsalBranch: { pointId, decisionTick, parentTicks: 24 } })),
      act: vi.fn(), frame: vi.fn(), markLogRead: vi.fn(), setGuidance: vi.fn(),
      end: vi.fn(() => update({ phase: 'ended', transport: 'paused' })),
      exportTranscript: vi.fn(), resumeAfterWorkerLoss: vi.fn(),
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

  const render = async () => { await act(async () => { root.render(<EndocrineMetabolicRoute path={path} />); }); };
  const button = (label: string) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === label)!;
  const click = async (target: HTMLElement) => { expect(target).toBeTruthy(); await act(async () => { target.click(); }); };
  const openReport = async () => {
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Report a problem"]')!);
    const dialog = container.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')!;
    expect(dialog).not.toBeNull(); expect(dialog.querySelector('textarea')?.maxLength).toBe(160);
    expect(dialog.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBe(false);
    expect(dialog.querySelector('.problem-report__context-preview')).toBeNull();
    return dialog;
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
    expect(payload).toMatchObject({ module_id: 'endocrine-metabolic', scenario_id: SCENARIO.metadata.id,
      content_version: SCENARIO.metadata.version, app_version: APP_VERSION, engine_version: ENGINE_VERSION,
      surface, canonical_url: `https://opensimlab.com${path}`, category: 'tutor-debrief', turnstile_token: 'local-test-token' });
    expect(validateReportPayload(payload)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...payload, content_version: '999.0.0' }).ok).toBe(false);
    expect(JSON.stringify(payload)).not.toMatch(/private-assignment-label|private-value|private action prose|private log prose|private debrief account/);
  };

  it.each(['briefing', 'running', 'ended'] as const)('offers the real shared 160-character form in %s with correct payload identity and no implicit context', async (phase) => {
    harness.session = { ...harness.session, phase, transport: phase === 'running' ? 'running' : 'paused' };
    await render(); expect(fetchMock).not.toHaveBeenCalled();
    if (phase === 'briefing') expect(container.textContent).toContain(SCENARIO.metadata.title);
    if (phase === 'ended') await typeText(container.querySelector<HTMLTextAreaElement>('#reactions-account')!, 'private debrief account');
    await openReport(); await selectCategory();
    await typeText(container.querySelector<HTMLTextAreaElement>('#problem-report-note')!, 'x'.repeat(161));
    expect(container.querySelector<HTMLTextAreaElement>('#problem-report-note')!.value).toHaveLength(160);
    await click(button('Send report'));
    const payload = lastPayload();
    expectIdentity(payload, phase === 'briefing' ? 'prebrief' : phase === 'ended' ? 'debrief' : 'live');
    expect(payload.note).toHaveLength(160); expect(payload.recent_context).toBeNull(); expect(payload.simulated_tick).toBe(24);
    expect(validateReportPayload({ ...payload, note: 'x'.repeat(161) }).ok).toBe(false);
    await click(button('Done'));
    expect(harness.session.pause).toHaveBeenCalledTimes(phase === 'running' ? 1 : 0);
    expect(harness.session.play).toHaveBeenCalledTimes(phase === 'running' ? 1 : 0);
    expect(harness.session.act).not.toHaveBeenCalled();
  });

  it('keeps a worked example paused after reporting and includes only explicitly chosen bounded context', async () => {
    await render(); await click(button('Watch a worked example'));
    expect(container.querySelector('[data-demonstrating="true"]')).not.toBeNull();
    expect(harness.session.setSpeed).toHaveBeenCalledWith(60);
    const play = harness.session.play; vi.mocked(play).mockClear();
    harness.build.mockClear();
    await openReport();
    expect(harness.session.transport).toBe('paused'); expect(harness.build).not.toHaveBeenCalled();
    await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    expect(harness.build).toHaveBeenCalledOnce();
    const preview = container.querySelector('.problem-report__context-preview')!.textContent!;
    expect(preview).toContain('resuscitation.hyponatremiaCorrection'); expect(preview).not.toMatch(/private-|private action|private log|alertness|choiceFeedback/);
    await selectCategory(); await click(button('Send report'));
    const payload = lastPayload(); expectIdentity(payload, 'live');
    expect(payload.recent_context?.seed).toBe(4907);
    expect(payload.recent_context?.actions).toHaveLength(20);
    expect(payload.recent_context?.actions[0]?.tick).toBe(4);
    expect(payload.recent_context?.actions.every((action) => action.outcome === 'accepted' && action.payload.action === 'reassess')).toBe(true);
    expect(Object.keys(payload.recent_context!.snapshot.patient)).toHaveLength(7);
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('paco2MmHg');
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('etco2MmHg');
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('fio2');
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('sodiumMmolL');
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('urineOutputMlPerHour');
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('latentBranch');
    expect(Object.keys(payload.recent_context!.snapshot.equipment)).toHaveLength(24);
    expect(payload.recent_context!.snapshot.equipment).toMatchObject({
      'resuscitation.hyponatremiaCorrection.observation.atTick': 23,
      'resuscitation.hyponatremiaCorrection.observation.sodiumMmolL': 111,
      'resuscitation.hyponatremiaCorrection.observation.urineOutputMlPerHour': 75,
      'resuscitation.hyponatremiaCorrection.observation.spo2Percent': 98,
      'resuscitation.hyponatremiaCorrection.peakObservedSodiumMmolL': 111,
    });
    expect(JSON.stringify(payload.recent_context!.snapshot.equipment))
      .not.toMatch(/actualSodium|hiddenSodium|branch|alertness|choiceFeedback|fio2|etco2|paco2/);
    expect(validateReportPayload({ ...payload, recent_context: { ...payload.recent_context!, snapshot: {
      ...payload.recent_context!.snapshot, equipment: Object.fromEntries(Array.from({ length: 33 }, (_, index) => [`field${index}`, index])),
    } } }).ok).toBe(false);
    await click(button('Done'));
    expect(play).not.toHaveBeenCalled(); expect(harness.session.transport).toBe('paused');
    expect(harness.session.act).not.toHaveBeenCalled();
    await openReport(); await click(button('Cancel'));
    expect(play).not.toHaveBeenCalled();
  });

  it('omits malformed and generic attempts without serializing private scalar-like tokens', async () => {
    harness.session = { ...harness.session, phase: 'running', transport: 'paused', log: [
      { tick: 4, eventId: 'sodium-correction-initial-reassessment-4', severity: 'warning', category: 'assessment', message: 'private log prose' },
      { tick: 6, eventId: 'hyponatremia-correction-action-refused-6', severity: 'warning', category: 'assessment', message: 'private log prose' },
    ] };
    const inherited = Object.assign(Object.create({ action: 'monitor' }) as Record<string, string>, { notes: 'private-value' });
    harness.actions = [
      { tick: 1, type: 'hyponatremia-correction-response', payload: { action: 'control-water-loss', notes: 'private-value' } },
      { tick: 2, type: 'hyponatremia-correction-response', payload: { action: 'private_value' } },
      { tick: 3, type: 'hyponatremia-correction-response', payload: { action: 'relower', patient_id: 'private_value' } },
      { tick: 4, type: 'hyponatremia-correction-response', payload: { action: 'reassess' } },
      { tick: 5, type: 'hyponatremia-correction-response', payload: inherited },
      { tick: 6, type: 'give-drug', payload: { drugId: 'propofol', dose: 50, notes: 'private-value' } },
    ];
    await render(); await openReport(); await selectCategory();
    await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await click(button('Send report'));
    const payload = lastPayload(); expectIdentity(payload, 'live');
    expect(payload.recent_context?.actions).toEqual([
      { tick: 4, type: 'hyponatremia-correction-response', outcome: 'accepted', payload: { action: 'reassess' } },
    ]);
    expect(JSON.stringify(payload)).not.toMatch(/private-value|private_value|patient_id|notes/);
    expect(harness.session.act).not.toHaveBeenCalled();
  });

  it('does not manufacture a sodium or urine result before a requested observation', () => {
    const equipment = harness.session.equipment!;
    const result = collectReportEquipmentContext({ ...equipment, resuscitation: {
      ...equipment.resuscitation, hyponatremiaCorrection: { ...equipment.resuscitation.hyponatremiaCorrection!, observation: null },
    } });
    expect(result['resuscitation.hyponatremiaCorrection.observation']).toBeNull();
    expect(result['resuscitation.hyponatremiaCorrection.peakObservedSodiumMmolL']).toBe(111);
    expect(result).not.toHaveProperty('resuscitation.hyponatremiaCorrection.observation.sodiumMmolL');
    expect(result).not.toHaveProperty('resuscitation.hyponatremiaCorrection.observation.urineOutputMlPerHour');
    expect(Object.keys(result).length).toBeLessThanOrEqual(32);
    expect(JSON.stringify(result)).not.toMatch(/actualSodium|hiddenSodium|branch|alertness|choiceFeedback|fio2|etco2|paco2/);
  });

  it.each([false, true])('does not attribute another paused action’s refusal to accepted same-tick requests (reversed: %s)', async (reversed) => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4907, practiceRegion: 'US' });
    const decisions = reversed ? ['reassess', 'monitor', 'normalize-now'] : ['normalize-now', 'monitor', 'reassess'];
    harness.actions = decisions.map((action) => ({ tick: 0, type: 'hyponatremia-correction-response', payload: { action } }));
    for (const action of harness.actions) engine.apply(action);
    const frame = engine.step();
    expect(frame.equipment.resuscitation.hyponatremiaCorrection?.monitoringAtTick).toBe(0);
    expect(frame.equipment.resuscitation.hyponatremiaCorrection?.observation?.atTick).toBe(0);
    expect(frame.events.some(({ eventId }) => eventId === 'sodium-correction-normalization-refused-0')).toBe(true);
    harness.session = { ...harness.session, phase: 'running', transport: 'paused', tick: 1,
      state: frame.state, equipment: frame.equipment, log: frame.events };
    await render(); await openReport(); await selectCategory();
    await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await click(button('Send report'));
    const payload = lastPayload(); expectIdentity(payload, 'live');
    expect(payload.recent_context?.actions).toEqual(decisions.map((action) => ({
      tick: 0, type: 'hyponatremia-correction-response', payload: { action },
      outcome: action === 'normalize-now' ? 'refused' : 'accepted',
    })));
  });

  it('omits replayed outcomes when prior event frames are no longer in the session log', async () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4907, practiceRegion: 'US' });
    harness.actions = [
      { tick: 0, type: 'hyponatremia-correction-response', payload: { action: 'normalize-now' } },
      { tick: 1, type: 'hyponatremia-correction-response', payload: { action: 'monitor' } },
    ];
    // Match solver replay: rebuild prior actions and discard their state/event
    // frames, then emit only the current frame to the newly cleared session log.
    for (const action of harness.actions) { engine.apply(action); engine.step(); }
    const frame = engine.step();
    expect(frame.equipment.resuscitation.hyponatremiaCorrection?.normalizationAttempted).toBe(true);
    expect(frame.events.some(({ eventId }) => eventId.includes('normalization-refused'))).toBe(false);
    harness.session = { ...harness.session, phase: 'running', transport: 'paused', tick: frame.tick,
      rehearsalBranch: { pointId: 'sodium-correction-first-review', decisionTick: 2, parentTicks: 24 },
      state: frame.state, equipment: frame.equipment, log: frame.events };
    await render(); await openReport(); await selectCategory();
    await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await click(button('Send report'));
    const payload = lastPayload(); expectIdentity(payload, 'live');
    expect(payload.recent_context?.actions).toEqual([]);
    expect(harness.session.play).not.toHaveBeenCalled();
  });

  it('omits pending outcomes and does not fall back to generic context while a replay snapshot is unavailable', async () => {
    harness.actions = [{ tick: 24, type: 'hyponatremia-correction-response', payload: { action: 'monitor' } },
      { tick: 24, type: 'give-drug', payload: { notes: 'private-value' } }];
    harness.session = { ...harness.session, phase: 'running', transport: 'paused', log: [], equipment: null };
    await render(); await openReport(); await selectCategory();
    await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await click(button('Send report'));
    const payload = lastPayload(); expectIdentity(payload, 'live');
    expect(payload.recent_context?.actions).toEqual([]);
    expect(payload.recent_context?.snapshot.equipment).toEqual({});
    expect(Object.keys(payload.recent_context!.snapshot.patient)).toHaveLength(7);
    expect(JSON.stringify(payload)).not.toMatch(/private-value|sodiumMmolL|urineOutputMlPerHour|latentBranch|etco2|paco2|fio2/);
    expect(harness.session.play).not.toHaveBeenCalled(); expect(harness.session.act).not.toHaveBeenCalled();
  });

  it('retains the observed peak separately from a historical partial-response result', () => {
    const equipment = harness.session.equipment!;
    const current = equipment.resuscitation.hyponatremiaCorrection!;
    const result = collectReportEquipmentContext({ ...equipment, resuscitation: {
      ...equipment.resuscitation, hyponatremiaCorrection: { ...current,
        peakObservedSodiumMmolL: 115, overcorrectionObserved: true, responseObserved: true,
        observation: { ...current.observation!, atTick: 72000, sodiumMmolL: 112, urineOutputMlPerHour: 100 },
      },
    } });
    expect(result).toMatchObject({
      'resuscitation.hyponatremiaCorrection.peakObservedSodiumMmolL': 115,
      'resuscitation.hyponatremiaCorrection.overcorrectionObserved': true,
      'resuscitation.hyponatremiaCorrection.observation.atTick': 72000,
      'resuscitation.hyponatremiaCorrection.observation.sodiumMmolL': 112,
      'resuscitation.hyponatremiaCorrection.observation.urineOutputMlPerHour': 100,
    });
    expect(Object.keys(result)).toHaveLength(24);
  });

  it.each(['Done', 'Cancel'] as const)('does not resume after %s when a pending example callback finishes behind an open report', async (dismissal) => {
    await render(); await click(button('Watch a worked example'));
    const play = harness.session.play; vi.mocked(play).mockClear();
    await openReport();
    expect(harness.session.transport).toBe('paused');
    // Simulate completion from a previously queued frame, not a click on an
    // inert background control. Resume eligibility must remain the open-time one.
    await act(async () => { harness.takeControls!(); });
    expect(container.querySelector('[data-demonstrating="false"]')).not.toBeNull();
    if (dismissal === 'Done') {
      await selectCategory(); await click(button('Send report'));
    }
    await click(button(dismissal));
    expect(play).not.toHaveBeenCalled();
    expect(harness.session.transport).toBe('paused');
    expect(harness.session.act).not.toHaveBeenCalled();
  });

  it('starts ordinary practice at 1× after resetting a 60× worked example', async () => {
    await render(); await click(button('Watch a worked example'));
    expect(container.querySelector('[data-demonstrating="true"]')).not.toBeNull();
    expect(harness.session.speed).toBe(60);
    await act(async () => { harness.session.resetSession(); });
    await render();
    expect(harness.session.phase).toBe('briefing');
    expect(harness.session.speed).toBe(60);
    vi.mocked(harness.session.setSpeed).mockClear();
    await click(button('Start the scenario')); await render();
    expect(container.querySelector('[data-demonstrating="false"]')).not.toBeNull();
    expect(harness.session.setSpeed).toHaveBeenCalledExactlyOnceWith(1);
    expect(harness.session.speed).toBe(1);
    expect(harness.session.transport).toBe('running');
    expect(harness.session.act).not.toHaveBeenCalled();
  });

  it('preserves the learner-selected speed when ordinary practice starts without an example', async () => {
    harness.session.setSpeed(5);
    vi.mocked(harness.session.setSpeed).mockClear();
    await render(); await click(button('Start the scenario')); await render();
    expect(container.querySelector('[data-demonstrating="false"]')).not.toBeNull();
    expect(harness.session.speed).toBe(5);
    expect(harness.session.setSpeed).not.toHaveBeenCalled();
    expect(harness.session.transport).toBe('running');
    expect(harness.session.act).not.toHaveBeenCalled();
  });

  it('keeps a paused replay paused and reports source or replay context without inventing a separate surface', async () => {
    harness.session = { ...harness.session, phase: 'ended' }; await render();
    await typeText(container.querySelector<HTMLTextAreaElement>('#reactions-account')!, 'private debrief account');
    await click(button('Continue'));
    await click([...container.querySelectorAll('button')].find((entry) => entry.textContent?.includes('Summary'))!);
    await click([...container.querySelectorAll('button')].find((entry) => entry.textContent?.startsWith('Practice “'))!);
    await render();
    expect(harness.session.rehearseFromDecisionPoint).toHaveBeenCalledWith('sodium-correction-first-review', 1);
    expect(harness.session.transport).toBe('paused');
    await openReport(); await selectCategory(); await click(button('Send report'));
    expectIdentity(lastPayload(), 'live'); expect(lastPayload().simulated_tick).toBe(1);
    await click(button('Done'));
    expect(harness.session.play).not.toHaveBeenCalled(); expect(harness.session.act).not.toHaveBeenCalled();
    await click(button('Report this source')); await selectCategory(); await click(button('Send report'));
    expectIdentity(lastPayload(), 'source');
    await click(button('Done')); expect(harness.session.play).not.toHaveBeenCalled();
  });
});
