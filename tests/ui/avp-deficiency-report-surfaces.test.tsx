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
import { HYPERNATREMIC_DEHYDRATION_AVP_DEFICIENCY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypernatremic-dehydration-avp-deficiency';
import { AVP_DEFICIENCY_VOLUME_TICKS } from '../../src/modules/endocrine-metabolic/avp-deficiency';
import { validateReportPayload } from '../../workers/reports/src/index.mjs';
import reportCatalog from '../../workers/reports/src/report-catalog.generated.json';

// Published identity, deliberately independent of the current scenario or generator.
const HISTORICAL_REPORT = {
  scenarioId: 'hypernatremic-dehydration-avp-deficiency', contentVersion: '0.1.0',
  moduleId: 'endocrine-metabolic', maturity: 'preview', practiceRegions: ['US', 'GB'],
  fidelityClass: 'state_transition', capabilityVersion: '0.1.0-alpha.48',
  releaseRef: 'sha256:d8da3bb3de1f974b964fe3655adb9e7085c9c910b970c4b4d43e12d3b7d48a24',
  defaultsHash: 'sha256:c5fd03310390a61a66a35425d37687d13e1efd51c1712ddf9e4f64e3ed201a24',
  maturityHash: 'sha256:f893af0d981ddb8b26c4f51561504b2ef69c37d5a1bfcecb821a97ffbf8591ff',
  sourceManifestHash: 'sha256:ed632283b076f9f72011170dd057f0fa5891c499d93144d36a5ce28ee11a8112',
  limitationManifestHash: 'sha256:811e3b23cdf6b73eb910b98eddbf24e7e65ac3f9958c7b5662084b8aa9f74956',
};

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

describe('exact-version AVP-deficiency reporting through shared route surfaces', () => {
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
    history.replaceState({}, '', `${path}?seed=4919&assignment=private-assignment-label`);
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4919, practiceRegion: 'US' });
    harness.actions = Array.from({ length: 24 }, (_, tick) => ({ tick,
      type: 'avp-deficiency-response', payload: { action: 'reassess' } }));
    const frames = harness.actions.map((action) => { engine.apply(action); return engine.step(); });
    const frame = frames.at(-1)!;
    const avpDeficiency = frame.equipment.resuscitation.avpDeficiency!;
    // Unexpected fields must not turn a report into a view of unrequested data.
    const privateState = { ...frame.state, sodiumMmolL: 166, urineOutputMlPerHour: 350, urineOsmolalityMosmPerKg: 999, latentBranch: 9 };
    const privateSnapshot = {
      ...avpDeficiency, choiceFeedback: 'private-value', alertness: 'private-value',
      actualSodiumMmolL: 166, actualUrineOutputMlPerHour: 999, actualUrineOsmolalityMosmPerKg: 999, branch: 'private-branch',
      observation: { ...avpDeficiency.observation!, alertness: 'private-value', hiddenSodiumMmolL: 166 },
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
        avpDeficiency: privateSnapshot } },
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

  it('submits the corrected version while preserving the immutable historical Worker identity', async () => {
    await render(); await openReport(); await selectCategory(); await click(button('Send report'));
    const payload = lastPayload();
    expect(payload.content_version).toBe('0.1.1');
    const versions = reportCatalog.scenarios.filter(({ scenarioId, moduleId }) => scenarioId === SCENARIO.metadata.id
      && moduleId === 'endocrine-metabolic');
    expect(versions.map(({ contentVersion }) => contentVersion)).toEqual(['0.1.0', '0.1.1']);
    expect(versions[0]).toEqual(HISTORICAL_REPORT);
    const { practiceRegions: currentRegions, ...currentIdentity } = versions[1]!;
    expect(currentRegions).toEqual(['US', 'GB']);
    expect(validateReportPayload(payload)).toMatchObject({ ok: true, value: currentIdentity });
    expect(currentIdentity.releaseRef).not.toBe(HISTORICAL_REPORT.releaseRef);
    const { practiceRegions, ...historicalIdentity } = HISTORICAL_REPORT;
    for (const practiceRegion of practiceRegions) {
      const historicalPayload = { ...payload, content_version: '0.1.0', practice_region: practiceRegion };
      expect(validateReportPayload(historicalPayload)).toMatchObject({ ok: true,
        value: { ...historicalIdentity, practiceRegion } });
      // Manifest evidence is server-derived: cached clients cannot replace it
      // with current hashes or submit a plausible but mismatched manifest.
      for (const [field, hash] of Object.entries({ release_ref: currentIdentity.releaseRef,
        defaults_hash: currentIdentity.defaultsHash, maturity_hash: currentIdentity.maturityHash,
        source_manifest_hash: currentIdentity.sourceManifestHash,
        limitation_manifest_hash: currentIdentity.limitationManifestHash })) {
        expect(validateReportPayload({ ...historicalPayload, [field]: hash })).toEqual({ ok: false, status: 400 });
      }
    }
    expect(validateReportPayload({ ...payload, content_version: '0.1.2' })).toEqual({ ok: false, status: 400 });
  });

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
    expect(preview).toContain('resuscitation.avpDeficiency'); expect(preview).not.toMatch(/private-|private action|private log|alertness|choiceFeedback/);
    await selectCategory(); await click(button('Send report'));
    const payload = lastPayload(); expectIdentity(payload, 'live');
    expect(payload.recent_context?.seed).toBe(4919);
    expect(payload.recent_context?.actions).toHaveLength(20);
    expect(payload.recent_context?.actions[0]?.tick).toBe(4);
    expect(payload.recent_context?.actions.every((action) => action.outcome === 'accepted' && action.payload.action === 'reassess')).toBe(true);
    expect(Object.keys(payload.recent_context!.snapshot.patient)).toHaveLength(7);
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('paco2MmHg');
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('etco2MmHg');
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('fio2');
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('sodiumMmolL');
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('urineOutputMlPerHour');
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('urineOsmolalityMosmPerKg');
    expect(payload.recent_context!.snapshot.patient).not.toHaveProperty('latentBranch');
    expect(Object.keys(payload.recent_context!.snapshot.equipment)).toHaveLength(26);
    expect(payload.recent_context!.snapshot.equipment).toMatchObject({
      'resuscitation.avpDeficiency.observation.atTick': 23,
      'resuscitation.avpDeficiency.observation.sodiumMmolL': 162,
      'resuscitation.avpDeficiency.observation.urineOutputMlPerHour': 60,
      'resuscitation.avpDeficiency.observation.urineOsmolalityMosmPerKg': 100,
      'resuscitation.avpDeficiency.observation.spo2Percent': 98,
      'resuscitation.avpDeficiency.peakObservedSodiumMmolL': 162,
    });
    expect(JSON.stringify(payload.recent_context!.snapshot.equipment))
      .not.toMatch(/actualSodium|actualUrine|hiddenSodium|branch|alertness|choiceFeedback|fio2|etco2|paco2/);
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
      { tick: 4, eventId: 'avp-deficiency-initial-reassessment-4', severity: 'warning', category: 'assessment', message: 'private log prose' },
      { tick: 6, eventId: 'avp-deficiency-action-refused-6', severity: 'warning', category: 'assessment', message: 'private log prose' },
    ] };
    const inherited = Object.assign(Object.create({ action: 'monitor' }) as Record<string, string>, { notes: 'private-value' });
    harness.actions = [
      { tick: 1, type: 'avp-deficiency-response', payload: { action: 'replace-water', notes: 'private-value' } },
      { tick: 2, type: 'avp-deficiency-response', payload: { action: 'private_value' } },
      { tick: 3, type: 'avp-deficiency-response', payload: { action: 'restore-desmopressin', patient_id: 'private_value' } },
      { tick: 4, type: 'avp-deficiency-response', payload: { action: 'reassess' } },
      { tick: 5, type: 'avp-deficiency-response', payload: inherited },
      { tick: 6, type: 'give-drug', payload: { drugId: 'propofol', dose: 50, notes: 'private-value' } },
    ];
    await render(); await openReport(); await selectCategory();
    await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await click(button('Send report'));
    const payload = lastPayload(); expectIdentity(payload, 'live');
    expect(payload.recent_context?.actions).toEqual([
      { tick: 4, type: 'avp-deficiency-response', outcome: 'accepted', payload: { action: 'reassess' } },
    ]);
    expect(JSON.stringify(payload)).not.toMatch(/private-value|private_value|patient_id|notes/);
    expect(harness.session.act).not.toHaveBeenCalled();
  });

  it('reports the exact briefing limitation surface without opting into session context', async () => {
    await render();
    await click(button('Report a problem with these limitations'));
    expect(container.querySelector<HTMLTextAreaElement>('#problem-report-note')?.maxLength).toBe(160);
    expect(container.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBe(false);
    await selectCategory(); await click(button('Send report'));
    expectIdentity(lastPayload(), 'limitation');
    expect(lastPayload().recent_context).toBeNull();
    await click(button('Done'));
    expect(harness.session.play).not.toHaveBeenCalled(); expect(harness.session.act).not.toHaveBeenCalled();
  });

  it('does not manufacture a sodium, urine, or osmolality result before a requested observation', () => {
    const equipment = harness.session.equipment!;
    const result = collectReportEquipmentContext({ ...equipment, resuscitation: {
      ...equipment.resuscitation, avpDeficiency: { ...equipment.resuscitation.avpDeficiency!, observation: null },
    } });
    expect(result['resuscitation.avpDeficiency.observation']).toBeNull();
    expect(result['resuscitation.avpDeficiency.peakObservedSodiumMmolL']).toBe(162);
    expect(result).not.toHaveProperty('resuscitation.avpDeficiency.observation.sodiumMmolL');
    expect(result).not.toHaveProperty('resuscitation.avpDeficiency.observation.urineOutputMlPerHour');
    expect(result).not.toHaveProperty('resuscitation.avpDeficiency.observation.urineOsmolalityMosmPerKg');
    expect(Object.keys(result).length).toBeLessThanOrEqual(32);
    expect(JSON.stringify(result)).not.toMatch(/actualSodium|hiddenSodium|branch|alertness|choiceFeedback|fio2|etco2|paco2/);
  });

  it('keeps actual-engine water findings historical until a new observation is requested', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4919, practiceRegion: 'US' });
    engine.apply({ tick: 0, type: 'avp-deficiency-response', payload: { action: 'restore-volume' } });
    engine.apply({ tick: 0, type: 'avp-deficiency-response', payload: { action: 'reassess' } });
    let frame = engine.step();
    for (let tick = 1; tick <= AVP_DEFICIENCY_VOLUME_TICKS; tick += 1) frame = engine.step();
    expect(frame.equipment.resuscitation.avpDeficiency?.circulationRestored).toBe(true);
    expect(collectReportEquipmentContext(frame.equipment)).toMatchObject({
      'resuscitation.avpDeficiency.observation.atTick': 0,
      'resuscitation.avpDeficiency.observation.sodiumMmolL': 162,
      'resuscitation.avpDeficiency.observation.urineOutputMlPerHour': 60,
      'resuscitation.avpDeficiency.observation.urineOsmolalityMosmPerKg': 100,
      'resuscitation.avpDeficiency.peakObservedSodiumMmolL': 162,
    });
    engine.apply({ tick: AVP_DEFICIENCY_VOLUME_TICKS + 1, type: 'avp-deficiency-response', payload: { action: 'reassess' } });
    frame = engine.step();
    expect(collectReportEquipmentContext(frame.equipment)).toMatchObject({
      'resuscitation.avpDeficiency.observation.atTick': AVP_DEFICIENCY_VOLUME_TICKS + 1,
      'resuscitation.avpDeficiency.observation.sodiumMmolL': 163,
      'resuscitation.avpDeficiency.observation.urineOutputMlPerHour': 450,
      'resuscitation.avpDeficiency.observation.urineOsmolalityMosmPerKg': 95,
      'resuscitation.avpDeficiency.peakObservedSodiumMmolL': 163,
    });
  });

  it.each([false, true])('does not attribute another paused action’s refusal to accepted same-tick requests (reversed: %s)', async (reversed) => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4919, practiceRegion: 'US' });
    const decisions = reversed ? ['reassess', 'monitor', 'normalize-now'] : ['normalize-now', 'monitor', 'reassess'];
    harness.actions = decisions.map((action) => ({ tick: 0, type: 'avp-deficiency-response', payload: { action } }));
    for (const action of harness.actions) engine.apply(action);
    const frame = engine.step();
    expect(frame.equipment.resuscitation.avpDeficiency?.monitoringAtTick).toBe(0);
    expect(frame.equipment.resuscitation.avpDeficiency?.observation?.atTick).toBe(0);
    expect(frame.events.some(({ eventId }) => eventId === 'avp-deficiency-normalization-refused-0')).toBe(true);
    harness.session = { ...harness.session, phase: 'running', transport: 'paused', tick: 1,
      state: frame.state, equipment: frame.equipment, log: frame.events };
    await render(); await openReport(); await selectCategory();
    await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await click(button('Send report'));
    const payload = lastPayload(); expectIdentity(payload, 'live');
    expect(payload.recent_context?.actions).toEqual(decisions.map((action) => ({
      tick: 0, type: 'avp-deficiency-response', payload: { action },
      outcome: action === 'normalize-now' ? 'refused' : 'accepted',
    })));
  });

  it('omits replayed outcomes when prior event frames are no longer in the session log', async () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4919, practiceRegion: 'US' });
    harness.actions = [
      { tick: 0, type: 'avp-deficiency-response', payload: { action: 'normalize-now' } },
      { tick: 1, type: 'avp-deficiency-response', payload: { action: 'monitor' } },
    ];
    // Match solver replay: rebuild prior actions and discard their state/event
    // frames, then emit only the current frame to the newly cleared session log.
    for (const action of harness.actions) { engine.apply(action); engine.step(); }
    const frame = engine.step();
    expect(frame.equipment.resuscitation.avpDeficiency?.normalizationAttempted).toBe(true);
    expect(frame.events.some(({ eventId }) => eventId.includes('normalization-refused'))).toBe(false);
    harness.session = { ...harness.session, phase: 'running', transport: 'paused', tick: frame.tick,
      rehearsalBranch: { pointId: 'avp-deficiency-first-response', decisionTick: 2, parentTicks: 24 },
      state: frame.state, equipment: frame.equipment, log: frame.events };
    await render(); await openReport(); await selectCategory();
    await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await click(button('Send report'));
    const payload = lastPayload(); expectIdentity(payload, 'live');
    expect(payload.recent_context?.actions).toEqual([]);
    expect(harness.session.play).not.toHaveBeenCalled();
  });

  it('omits pending outcomes and does not fall back to generic context while a replay snapshot is unavailable', async () => {
    harness.actions = [{ tick: 24, type: 'avp-deficiency-response', payload: { action: 'monitor' } },
      { tick: 24, type: 'give-drug', payload: { notes: 'private-value' } }];
    harness.session = { ...harness.session, phase: 'running', transport: 'paused', log: [], equipment: null };
    await render(); await openReport(); await selectCategory();
    await click(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await click(button('Send report'));
    const payload = lastPayload(); expectIdentity(payload, 'live');
    expect(payload.recent_context?.actions).toEqual([]);
    expect(payload.recent_context?.snapshot.equipment).toEqual({});
    expect(Object.keys(payload.recent_context!.snapshot.patient)).toHaveLength(7);
    expect(JSON.stringify(payload)).not.toMatch(/private-value|sodiumMmolL|urineOutputMlPerHour|urineOsmolalityMosmPerKg|latentBranch|etco2|paco2|fio2/);
    expect(harness.session.play).not.toHaveBeenCalled(); expect(harness.session.act).not.toHaveBeenCalled();
  });

  it('retains the observed peak separately from a historical partial-response result', () => {
    const equipment = harness.session.equipment!;
    const current = equipment.resuscitation.avpDeficiency!;
    const result = collectReportEquipmentContext({ ...equipment, resuscitation: {
      ...equipment.resuscitation, avpDeficiency: { ...current,
        peakObservedSodiumMmolL: 165, volumeObserved: true, responseObserved: true,
        observation: { ...current.observation!, atTick: 144002, sodiumMmolL: 164, urineOutputMlPerHour: 80,
          urineOsmolalityMosmPerKg: 500 },
      },
    } });
    expect(result).toMatchObject({
      'resuscitation.avpDeficiency.peakObservedSodiumMmolL': 165,
      'resuscitation.avpDeficiency.volumeObserved': true,
      'resuscitation.avpDeficiency.observation.atTick': 144002,
      'resuscitation.avpDeficiency.observation.sodiumMmolL': 164,
      'resuscitation.avpDeficiency.observation.urineOutputMlPerHour': 80,
      'resuscitation.avpDeficiency.observation.urineOsmolalityMosmPerKg': 500,
    });
    expect(Object.keys(result)).toHaveLength(26);
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
    expect(harness.session.rehearseFromDecisionPoint).toHaveBeenCalledWith('avp-deficiency-first-response', 1);
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
