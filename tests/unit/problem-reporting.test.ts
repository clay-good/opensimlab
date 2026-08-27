import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  REPORT_CONTEXT_JSON_LIMIT, REPORT_NOTE_LIMIT, buildScenarioReportRequest,
  noteMayContainRealPatientInformation,
  type ScenarioReportContext,
} from '@platform/reporting/contracts';
import {
  handleRequest, reserveVerificationAttempt, validateReportPayload, verifyTurnstile,
} from '../../workers/reports/src/index.mjs';

const context: ScenarioReportContext = {
  scenarioId: 'routine-induction', contentVersion: '0.1.0', appVersion: '0.1.0-alpha.1',
  engineVersion: '0.1.0', moduleId: 'anesthesia', maturity: 'draft', practiceRegion: 'US',
  fidelityClass: 'closed_loop_physiology', surface: 'live', simulatedTick: 42,
  canonicalUrl: 'https://opensimlab.com/anesthesia/scenario/routine-induction',
};

const valid = () => buildScenarioReportRequest(context, 'clinical-content', 'Expected a different value.', 'token');

function recentContextWithJsonLength(target: number) {
  const recent = {
    seed: 7,
    actions: Array.from({ length: 20 }, (_, action) => ({
      tick: action,
      type: 'review-state',
      outcome: 'accepted' as const,
      payload: Object.fromEntries(Array.from({ length: 12 }, (__, field) => [
        `field-${action}-${field}`.padEnd(80, 'k'), 'v'.repeat(80),
      ])),
    })),
    snapshot: { patient: {}, equipment: {} },
  };
  let excess = JSON.stringify(recent).length - target;
  for (const action of recent.actions) {
    for (const key of Object.keys(action.payload)) {
      if (excess <= 0) break;
      const value = action.payload[key]!;
      const removed = Math.min(excess, value.length - 1);
      action.payload[key] = value.slice(0, -removed || undefined);
      excess -= removed;
    }
  }
  for (const [actionIndex, action] of recent.actions.entries()) {
    for (const [fieldIndex, key] of Object.keys(action.payload).entries()) {
      if (excess <= 0) break;
      const minimumKey = `field-${actionIndex}-${fieldIndex}`;
      const removed = Math.min(excess, key.length - minimumKey.length);
      if (removed > 0) {
        const shorterKey = key.slice(0, -removed);
        action.payload[shorterKey] = action.payload[key]!;
        delete action.payload[key];
        excess -= removed;
      }
    }
  }
  expect(excess).toBe(0);
  expect(JSON.stringify(recent)).toHaveLength(target);
  return recent;
}

describe('scenario report contract', () => {
  it('publishes an exact-version server catalog for every current playable scenario', () => {
    const catalog = JSON.parse(readFileSync(
      join(process.cwd(), 'workers/reports/src/report-catalog.generated.json'), 'utf8',
    )) as { schemaVersion: number; evidenceAlgorithm: string; scenarios: {
      moduleId: string; scenarioId: string; contentVersion: string; capabilityVersion: string;
      releaseRef: string; defaultsHash: string; maturityHash: string;
      sourceManifestHash: string; limitationManifestHash: string;
    }[] };
    expect(catalog.schemaVersion).toBe(2);
    expect(catalog.evidenceAlgorithm).toBe('scenario-evidence-v1');
    expect(catalog.scenarios).toHaveLength(201);
    expect(new Set(catalog.scenarios.map((entry) => `${entry.moduleId}:${entry.scenarioId}@${entry.contentVersion}`)).size)
      .toBe(201);
    for (const contentVersion of ['0.1.0', '0.1.1', '0.1.2']) {
      expect(catalog.scenarios).toContainEqual(expect.objectContaining({
        moduleId: 'endocrine-metabolic', scenarioId: 'adrenal-crisis-treatment-before-tests', contentVersion,
      }));
    }
    for (const contentVersion of ['0.1.2', '0.1.3']) {
      expect(catalog.scenarios).toContainEqual(expect.objectContaining({
        moduleId: 'endocrine-metabolic', scenarioId: 'severe-hypoglycemia-recurrence', contentVersion,
      }));
    }
    for (const entry of catalog.scenarios) {
      expect(entry.capabilityVersion).toMatch(/^0\.1\.0-alpha\./);
      for (const hash of [entry.releaseRef, entry.defaultsHash, entry.maturityHash,
        entry.sourceManifestHash, entry.limitationManifestHash]) {
        expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
      }
    }
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'methemoglobinemia-saturation-gap',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'carbon-monoxide-reassuring-monitor',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'acetaminophen-clock-and-nomogram',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'salicylate-falling-number',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'tricyclic-sodium-channel-cardiotoxicity',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'beta-blocker-cardiogenic-shock',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'calcium-channel-blocker-shock',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'digoxin-rhythm-potassium',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'cholinergic-pesticide-respiratory-failure',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'anticholinergic-hyperthermia-delirium',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'serotonin-toxicity-hyperthermia-clonus',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'sympathomimetic-hyperadrenergic-hyperthermia',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'methanol-visual-acidosis-gaps',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'delayed-local-anesthetic-cns-cardiac-toxicity',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'toxicology', scenarioId: 'opioid-xylazine-persistent-sedation',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'obstetrics', scenarioId: 'postpartum-hemorrhage-uterine-atony',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'obstetrics', scenarioId: 'maternal-sepsis-postpartum-deterioration',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'obstetrics', scenarioId: 'concealed-placental-abruption-hemorrhage',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'obstetrics', scenarioId: 'postpartum-severe-preeclampsia-warning-signs',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'obstetrics', scenarioId: 'eclampsia-first-seizure-response',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'obstetrics', scenarioId: 'suspected-amniotic-fluid-embolism-pattern',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'neurology', scenarioId: 'basilar-artery-occlusion-escalation',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'neurology', scenarioId: 'minor-nondisabling-acute-ischemic-stroke',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'neurology', scenarioId: 'focal-motor-status-epilepticus-escalation',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'neurology', scenarioId: 'nonconvulsive-status-epilepticus-recognition',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'neurology', scenarioId: 'myasthenic-crisis-escalation',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'neurology', scenarioId: 'guillain-barre-respiratory-decline',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'neurology', scenarioId: 'acute-bacterial-meningitis-first-hour',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'neurology', scenarioId: 'acute-transtentorial-herniation-pattern',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'neurology', scenarioId: 'metastatic-spinal-cord-compression',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'neurology', scenarioId: 'acute-delirium-reversible-causes',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-respiratory-distress',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'bronchiolitis', contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'croup', contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-status-asthmaticus',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-sepsis', contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-septic-shock', contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-dehydration-with-hypovolemia',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-diabetic-ketoacidosis',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-hypoglycemic-seizure',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-febrile-seizure',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-status-epilepticus',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-anaphylaxis', contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-supraventricular-tachycardia',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-bradycardic-arrest',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-foreign-body-airway-obstruction',
      contentVersion: '0.1.0',
    }));
    expect(catalog.scenarios).toContainEqual(expect.objectContaining({
      moduleId: 'pediatrics', scenarioId: 'pediatric-injury-safeguarding-escalation',
      contentVersion: '0.1.0',
    }));
  });

  it('accepts the exact neurology context and rejects module or URL drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology',
      scenarioId: 'minor-nondisabling-acute-ischemic-stroke',
      canonicalUrl:
        'https://opensimlab.com/neurology/scenario/minor-nondisabling-acute-ischemic-stroke',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      neurology, 'clinical-content', 'The function wording may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, module_id: 'emergency-medicine' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}#review` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact basilar LVO context without prefilled clinical narrative', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology', scenarioId: 'basilar-artery-occlusion-escalation',
      canonicalUrl: 'https://opensimlab.com/neurology/scenario/basilar-artery-occlusion-escalation',
      fidelityClass: 'state_transition', simulatedTick: 18,
    };
    const report = buildScenarioReportRequest(neurology, 'clinical-content', '', 'token');
    expect(report.note).toBe('');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, module_id: 'emergency-medicine' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}?tick=18` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}#handoff` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('normalizes and bounds the optional note to exactly 160 characters', () => {
    const report = buildScenarioReportRequest(context, 'other', `  ${'x'.repeat(200)}  `, 'token');
    expect(REPORT_NOTE_LIMIT).toBe(160);
    expect(report.note).toHaveLength(160);
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, note: 'x'.repeat(161) })).toEqual({ ok: false, status: 400 });
  });

  it('stops likely real-patient and contact information on both sides of the boundary', () => {
    for (const note of [
      'This is about my patient today.', 'MRN: AB123456', 'reply@example.com', '312-555-0199',
    ]) {
      expect(noteMayContainRealPatientInformation(note)).toBe(true);
      expect(validateReportPayload({ ...valid(), note })).toEqual({ ok: false, status: 400 });
    }
    expect(noteMayContainRealPatientInformation('The simulated pressure response seems delayed.')).toBe(false);
  });

  it('accepts only bounded opt-in structured context', () => {
    const recent_context = {
      seed: 7,
      actions: [{ tick: 12, type: 'review-state', outcome: 'accepted', payload: { selected: true } }],
      snapshot: { patient: { heartRateBpm: 88 }, equipment: { 'airway.device': 'facemask' } },
    };
    expect(validateReportPayload({ ...valid(), recent_context })).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...valid(), recent_context: {
      ...recent_context, actions: Array.from({ length: 21 }, () => recent_context.actions[0]),
    } })).toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...valid(), recent_context: {
      ...recent_context, snapshot: { ...recent_context.snapshot, patient: { note: 'free prose' } },
    } })).toEqual({ ok: false, status: 400 });
    const { recent_context: _context, ...olderInstalledClient } = valid();
    expect(validateReportPayload(olderInstalledClient)).toMatchObject({
      ok: true, value: { recentContext: null },
    });
  });

  it('aligns the request and D1 context boundary before Turnstile or quota work', async () => {
    const maximum = recentContextWithJsonLength(REPORT_CONTEXT_JSON_LIMIT);
    expect(validateReportPayload({ ...valid(), recent_context: maximum })).toMatchObject({ ok: true });
    expect(buildScenarioReportRequest(context, 'other', '', 'token', maximum).recent_context)
      .toBe(maximum);

    const oversized = recentContextWithJsonLength(REPORT_CONTEXT_JSON_LIMIT + 1);
    expect(validateReportPayload({ ...valid(), recent_context: oversized }))
      .toEqual({ ok: false, status: 400 });
    expect(buildScenarioReportRequest(context, 'other', '', 'token', oversized).recent_context)
      .toBeNull();

    const prepare = vi.fn();
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    let response = await handleRequest(new Request('https://opensimlab.com/api/reports', {
      method: 'POST',
      headers: {
        Origin: 'https://opensimlab.com', 'Content-Type': 'application/json',
        'CF-Connecting-IP': '192.0.2.1',
      },
      body: JSON.stringify({ ...valid(), recent_context: oversized }),
    }), {
      REPORTING_ENABLED: 'true', REPORTS_DB: { prepare }, TURNSTILE_SITE_KEY: 'site-key',
      TURNSTILE_SECRET_KEY: 'secret', REPORT_HASH_SECRET: 'h'.repeat(32),
      REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com',
    });
    expect(response.status).toBe(400);
    expect(prepare).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();

    const bindings: unknown[][] = [];
    const statement = {
      bind: vi.fn((...values: unknown[]) => { bindings.push(values); return statement; }),
      first: vi.fn(async () => ({ count: 1 })),
    };
    const database = {
      prepare: vi.fn(() => statement),
      batch: vi.fn(async () => []),
    };
    fetcher.mockResolvedValueOnce(Response.json({
      success: true, action: 'scenario-report', hostname: 'opensimlab.com',
    }));
    response = await handleRequest(new Request('https://opensimlab.com/api/reports', {
      method: 'POST',
      headers: {
        Origin: 'https://opensimlab.com', 'Content-Type': 'application/json',
        'CF-Connecting-IP': '192.0.2.1',
      },
      body: JSON.stringify({ ...valid(), recent_context: maximum }),
    }), {
      REPORTING_ENABLED: 'true', REPORTS_DB: database, TURNSTILE_SITE_KEY: 'site-key',
      TURNSTILE_SECRET_KEY: 'secret', REPORT_HASH_SECRET: 'h'.repeat(32),
      REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com',
    });
    expect(response.status).toBe(202);
    expect(database.batch).toHaveBeenCalledOnce();
    expect(bindings.flat()).toContain(JSON.stringify(maximum));
    const accepted = validateReportPayload({ ...valid(), recent_context: maximum });
    expect(accepted).toMatchObject({
      ok: true,
      value: {
        capabilityVersion: expect.stringMatching(/^0\.1\.0-alpha\./),
        releaseRef: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        defaultsHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        maturityHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        sourceManifestHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        limitationManifestHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      },
    });
    const evidence = (accepted as { value: Record<string, unknown> }).value;
    for (const field of ['capabilityVersion', 'releaseRef', 'defaultsHash', 'maturityHash',
      'sourceManifestHash', 'limitationManifestHash']) {
      expect(bindings.flat()).toContain(evidence[field]);
    }
    vi.unstubAllGlobals();
  });

  it('accepts the exact pediatric dehydration context and rejects module or URL drift', () => {
    const pediatric: ScenarioReportContext = {
      ...context, moduleId: 'pediatrics', scenarioId: 'pediatric-dehydration-with-hypovolemia',
      canonicalUrl:
        'https://opensimlab.com/pediatrics/scenario/pediatric-dehydration-with-hypovolemia',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      pediatric, 'clinical-content', 'The urine history may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, module_id: 'emergency-medicine' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact pediatric DKA context and rejects module or URL drift', () => {
    const pediatric: ScenarioReportContext = {
      ...context, moduleId: 'pediatrics', scenarioId: 'pediatric-diabetic-ketoacidosis',
      canonicalUrl: 'https://opensimlab.com/pediatrics/scenario/pediatric-diabetic-ketoacidosis',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      pediatric, 'clinical-content', 'The neurological wording may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, module_id: 'emergency-medicine' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact pediatric hypoglycemic-seizure context and rejects drift', () => {
    const pediatric: ScenarioReportContext = {
      ...context, moduleId: 'pediatrics', scenarioId: 'pediatric-hypoglycemic-seizure',
      canonicalUrl: 'https://opensimlab.com/pediatrics/scenario/pediatric-hypoglycemic-seizure',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      pediatric, 'clinical-content', 'The glucose trajectory may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, module_id: 'emergency-medicine' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact pediatric febrile-seizure context and rejects drift', () => {
    const pediatric: ScenarioReportContext = {
      ...context, moduleId: 'pediatrics', scenarioId: 'pediatric-febrile-seizure',
      canonicalUrl: 'https://opensimlab.com/pediatrics/scenario/pediatric-febrile-seizure',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      pediatric, 'clinical-content', 'The infection-boundary wording may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, module_id: 'emergency-medicine' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact pediatric status-epilepticus context and rejects drift', () => {
    const pediatric: ScenarioReportContext = {
      ...context, moduleId: 'pediatrics', scenarioId: 'pediatric-status-epilepticus',
      canonicalUrl: 'https://opensimlab.com/pediatrics/scenario/pediatric-status-epilepticus',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      pediatric, 'clinical-content', 'The refractory-boundary wording may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, module_id: 'emergency-medicine' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact pediatric anaphylaxis context and rejects identity or URL drift', () => {
    const pediatric: ScenarioReportContext = {
      ...context, moduleId: 'pediatrics', scenarioId: 'pediatric-anaphylaxis',
      canonicalUrl: 'https://opensimlab.com/pediatrics/scenario/pediatric-anaphylaxis',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      pediatric, 'clinical-content', 'The airway-risk wording may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, module_id: 'emergency-medicine' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, scenario_id: 'anaphylaxis' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact pediatric SVT context and rejects identity or URL drift', () => {
    const pediatric: ScenarioReportContext = {
      ...context, moduleId: 'pediatrics',
      scenarioId: 'pediatric-supraventricular-tachycardia',
      canonicalUrl:
        'https://opensimlab.com/pediatrics/scenario/pediatric-supraventricular-tachycardia',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      pediatric, 'clinical-content', 'The perfusion-risk wording may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, module_id: 'cardiology' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, scenario_id: 'regular-narrow-complex-tachycardia' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact pediatric bradycardic-arrest context and rejects drift', () => {
    const pediatric: ScenarioReportContext = {
      ...context, moduleId: 'pediatrics', scenarioId: 'pediatric-bradycardic-arrest',
      canonicalUrl: 'https://opensimlab.com/pediatrics/scenario/pediatric-bradycardic-arrest',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      pediatric, 'clinical-content', 'The pulse-loss boundary may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, module_id: 'emergency-medicine' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, scenario_id: 'unstable-bradycardia' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact pediatric FBAO context and rejects identity or learner-state URL drift', () => {
    const pediatric: ScenarioReportContext = {
      ...context, moduleId: 'pediatrics',
      scenarioId: 'pediatric-foreign-body-airway-obstruction',
      canonicalUrl:
        'https://opensimlab.com/pediatrics/scenario/pediatric-foreign-body-airway-obstruction',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      pediatric, 'clinical-content', 'The pulse-status boundary may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, module_id: 'emergency-medicine' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, scenario_id: 'acute-tracheostomy-obstruction' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the safeguarding scenario context without prefilled clinical narrative', () => {
    const pediatric: ScenarioReportContext = {
      ...context, moduleId: 'pediatrics',
      scenarioId: 'pediatric-injury-safeguarding-escalation',
      canonicalUrl:
        'https://opensimlab.com/pediatrics/scenario/pediatric-injury-safeguarding-escalation',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(pediatric, 'clinical-content', '', 'token');
    expect(report.note).toBe('');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'pediatric-bradycardic-arrest' }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${pediatric.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact Neurology focal-motor-status context and rejects drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology',
      scenarioId: 'focal-motor-status-epilepticus-escalation',
      canonicalUrl:
        'https://opensimlab.com/neurology/scenario/focal-motor-status-epilepticus-escalation',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      neurology, 'clinical-content', 'The visible motor trajectory may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'focal-motor-status' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact Neurology nonconvulsive-status context and rejects drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology',
      scenarioId: 'nonconvulsive-status-epilepticus-recognition',
      canonicalUrl:
        'https://opensimlab.com/neurology/scenario/nonconvulsive-status-epilepticus-recognition',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      neurology, 'clinical-content', 'The EEG boundary may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'nonconvulsive-status' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact Neurology myasthenic-crisis context and rejects drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology', scenarioId: 'myasthenic-crisis-escalation',
      canonicalUrl: 'https://opensimlab.com/neurology/scenario/myasthenic-crisis-escalation',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      neurology, 'clinical-content', 'The respiratory trajectory may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'myasthenic-crisis' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact Neurology Guillain-Barré context and rejects drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology', scenarioId: 'guillain-barre-respiratory-decline',
      canonicalUrl: 'https://opensimlab.com/neurology/scenario/guillain-barre-respiratory-decline',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      neurology, 'clinical-content', 'The autonomic range may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'guillain-barre' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact Neurology bacterial-meningitis context and rejects drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology', scenarioId: 'acute-bacterial-meningitis-first-hour',
      canonicalUrl: 'https://opensimlab.com/neurology/scenario/acute-bacterial-meningitis-first-hour',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      neurology, 'clinical-content', 'The CSF pattern may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'bacterial-meningitis' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact Neurology encephalitis context and rejects drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology', scenarioId: 'suspected-herpes-simplex-encephalitis',
      canonicalUrl: 'https://opensimlab.com/neurology/scenario/suspected-herpes-simplex-encephalitis',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      neurology, 'clinical-content', 'The early PCR boundary may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'hsv-encephalitis' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact Neurology raised-pressure context and rejects drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology', scenarioId: 'raised-intracranial-pressure-visual-threat',
      canonicalUrl: 'https://opensimlab.com/neurology/scenario/raised-intracranial-pressure-visual-threat',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      neurology, 'clinical-content', 'The visual field boundary may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'raised-icp' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}?tick=12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact Neurology herniation context and rejects drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology', scenarioId: 'acute-transtentorial-herniation-pattern',
      canonicalUrl: 'https://opensimlab.com/neurology/scenario/acute-transtentorial-herniation-pattern',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      neurology, 'clinical-content', 'The herniation boundary may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'acute-herniation' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact Neurology cord-compression context and rejects drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology', scenarioId: 'metastatic-spinal-cord-compression',
      canonicalUrl: 'https://opensimlab.com/neurology/scenario/metastatic-spinal-cord-compression',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(
      neurology, 'clinical-content', 'The cord-compression boundary may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'spinal-cord-compression' }))
      .toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}#tick-12` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact Neurology delirium context and rejects drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology', scenarioId: 'acute-delirium-reversible-causes',
      canonicalUrl: 'https://opensimlab.com/neurology/scenario/acute-delirium-reversible-causes',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(neurology, 'clinical-content', 'The delirium contributor boundary may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'delirium' })).toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}#tick-12` })).toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact Neurology autonomic-dysreflexia context and rejects drift', () => {
    const neurology: ScenarioReportContext = {
      ...context, moduleId: 'neurology', scenarioId: 'autonomic-dysreflexia-authored-trigger',
      canonicalUrl: 'https://opensimlab.com/neurology/scenario/autonomic-dysreflexia-authored-trigger',
      fidelityClass: 'state_transition', simulatedTick: 12,
    };
    const report = buildScenarioReportRequest(neurology, 'clinical-content', 'The pressure transition may need review.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'autonomic-dysreflexia' })).toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${neurology.canonicalUrl}#tick-12` })).toEqual({ ok: false, status: 403 });
  });

  it('rejects unknown fields, stale versions, learner-state URLs, unsafe text, and token overflow', () => {
    expect(validateReportPayload({ ...valid(), identity: 'student' })).toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...valid(), content_version: '9.9.9' })).toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...valid(), canonical_url: `${context.canonicalUrl}?seed=4` }))
      .toEqual({ ok: false, status: 403 });
    expect(validateReportPayload({ ...valid(), note: 'unsafe\u202Etext' })).toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...valid(), turnstile_token: 'x'.repeat(2049) }))
      .toEqual({ ok: false, status: 400 });
  });

  it('has only the two exact API routes and fails closed when disabled', async () => {
    expect((await handleRequest(new Request('https://opensimlab.com/api/reports/'), {})).status).toBe(404);
    expect((await handleRequest(new Request('https://opensimlab.com/api/reports?x=1'), {})).status).toBe(404);
    const response = await handleRequest(new Request('https://opensimlab.com/api/reports/config'), {});
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('names the responsible maintainer and same-origin privacy notice from server config', async () => {
    const response = await handleRequest(new Request('https://opensimlab.com/api/reports/config'), {
      REPORTING_ENABLED: 'true', REPORTS_DB: {}, TURNSTILE_SITE_KEY: 'site-key',
      TURNSTILE_SECRET_KEY: 'secret', REPORT_HASH_SECRET: 'h'.repeat(32),
      REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com',
      REPORT_MAINTAINER_NAME: 'Open Sim Lab maintainers',
      REPORT_PRIVACY_URL: 'https://opensimlab.com/privacy#problem-reports',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sitekey: 'site-key', action: 'scenario-report', maintainer: 'Open Sim Lab maintainers',
      privacy_url: 'https://opensimlab.com/privacy#problem-reports',
    });
    const crossOrigin = await handleRequest(new Request('https://opensimlab.com/api/reports/config'), {
      REPORTING_ENABLED: 'true', REPORTS_DB: {}, TURNSTILE_SITE_KEY: 'site-key',
      TURNSTILE_SECRET_KEY: 'secret', REPORT_HASH_SECRET: 'h'.repeat(32),
      REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com', REPORT_PRIVACY_URL: 'https://example.com/privacy',
    });
    expect(crossOrigin.status).toBe(503);
    const selfHosted = await handleRequest(new Request('https://training.example/api/reports/config'), {
      REPORTING_ENABLED: 'true', REPORTS_DB: {}, TURNSTILE_SITE_KEY: 'fork-key',
      TURNSTILE_SECRET_KEY: 'secret', REPORT_HASH_SECRET: 'h'.repeat(32),
      REPORT_ALLOWED_ORIGIN: 'https://training.example',
      REPORT_MAINTAINER_NAME: 'Example simulation team', REPORT_PRIVACY_URL: '/privacy#reports',
    });
    expect(await selfHosted.json()).toMatchObject({
      maintainer: 'Example simulation team',
      privacy_url: 'https://training.example/privacy#reports',
    });
  });

  it('keeps the report Worker isolated from assets and public preview routes', () => {
    const wrangler = readFileSync(join(process.cwd(), 'workers/reports/wrangler.toml'), 'utf8');
    expect(wrangler).toContain('workers_dev = false');
    expect(wrangler).toContain('preview_urls = false');
    expect(wrangler).not.toContain('[assets]');
    expect(wrangler.match(/pattern = /g)).toHaveLength(2);
  });

  it('migrates immutable server-derived evidence without fabricating legacy rows', () => {
    const migration = readFileSync(join(
      process.cwd(), 'workers/reports/migrations/0003_report_evidence.sql',
    ), 'utf8');
    for (const column of ['capability_version', 'release_ref', 'defaults_hash', 'maturity_hash',
      'source_manifest_hash', 'limitation_manifest_hash']) {
      expect(migration).toContain(`ADD COLUMN ${column} TEXT`);
    }
    expect(migration).not.toContain('DEFAULT');
  });

  it('keeps report configuration out of the offline cache and available to the kill switch', () => {
    const serviceWorker = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8');
    const bypass = serviceWorker.indexOf("url.pathname.startsWith('/api/')");
    const interception = serviceWorker.indexOf('event.respondWith');
    expect(bypass).toBeGreaterThan(0);
    expect(bypass).toBeLessThan(interception);
  });

  it('inherits one shared correction door across every scenario surface', () => {
    const route = readFileSync(join(process.cwd(), 'src/routes/AnesthesiaRoute.tsx'), 'utf8');
    const prebrief = readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/Prebrief.tsx'), 'utf8');
    const cockpit = readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/Cockpit.tsx'), 'utf8');
    expect(route.match(/<ScenarioProblemReport/g)).toHaveLength(1);
    expect(route).toContain("requestReport('limitation')");
    expect(route).toContain("requestReport('source')");
    expect(prebrief).toContain('Report a problem with these limitations');
    expect(cockpit.match(/Report a problem with this source/g)).toHaveLength(2);
    expect(route).toContain("sourceOpen ? 'source'");
    expect(cockpit).toContain('onSourceVisibilityChange?.(explainerId !== null || drugCardId !== null)');
  });

  it('requires Turnstile success, the scenario-report action, and the production hostname', async () => {
    const fetcher = vi.fn(async () => Response.json({
      success: true, action: 'scenario-report', hostname: 'opensimlab.com',
    }));
    await expect(verifyTurnstile(
      { turnstileToken: 'token' }, '192.0.2.1', {
        TURNSTILE_SECRET_KEY: 'secret', REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com',
      }, fetcher,
    )).resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' }),
    );
    const wrongAction = vi.fn(async () => Response.json({
      success: true, action: 'other', hostname: 'opensimlab.com',
    }));
    await expect(verifyTurnstile(
      { turnstileToken: 'token' }, '192.0.2.1', {
        TURNSTILE_SECRET_KEY: 'secret', REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com',
      }, wrongAction,
    )).resolves.toBe(false);

    for (const unavailable of [
      vi.fn(async () => { throw new Error('network unavailable'); }),
      vi.fn(async () => new Response('unavailable', { status: 503 })),
      vi.fn(async () => new Response('{', { status: 200 })),
      vi.fn(async () => Response.json({ success: false })),
      vi.fn(async () => Response.json({
        success: true, action: 'scenario-report', hostname: 'preview.opensimlab.com',
      })),
    ]) {
      await expect(verifyTurnstile(
        { turnstileToken: 'token' }, '192.0.2.1', {
          TURNSTILE_SECRET_KEY: 'secret', REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com',
        }, unavailable,
      )).resolves.toBe(false);
    }
  });

  it('atomically reserves every Siteverify attempt before contacting Turnstile', async () => {
    const first = vi.fn()
      .mockResolvedValueOnce({ count: 5 })
      .mockResolvedValueOnce(null);
    const statement = {
      bind: vi.fn(function bind() { return statement; }),
      first,
    };
    const database = { prepare: vi.fn((_sql: string) => statement) };
    await expect(reserveVerificationAttempt(database, '2026-08-26', 'reporter')).resolves.toBe(true);
    await expect(reserveVerificationAttempt(database, '2026-08-26', 'reporter')).resolves.toBe(false);
    expect(database.prepare.mock.calls[0]?.[0]).toContain("kind='verified'");
    expect(database.prepare.mock.calls[0]?.[0]).toContain('SUM(count)');
    expect(statement.bind).toHaveBeenCalledWith(
      '2026-08-26', 'reporter', '2026-08-26', 400, 5, '2026-08-26', 400,
    );
  });

  it('spends an attempt on a failed token and skips Siteverify after quota', async () => {
    const request = () => new Request('https://opensimlab.com/api/reports', {
      method: 'POST',
      headers: {
        Origin: 'https://opensimlab.com', 'Content-Type': 'application/json',
        'CF-Connecting-IP': '192.0.2.1',
      },
      body: JSON.stringify(valid()),
    });
    const first = vi.fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce(null);
    const statement = {
      bind: vi.fn(function bind() { return statement; }),
      first,
    };
    const database = { prepare: vi.fn(() => statement) };
    const fetcher = vi.fn(async () => Response.json({ success: false }));
    vi.stubGlobal('fetch', fetcher);
    const env = {
      REPORTING_ENABLED: 'true', REPORTS_DB: database, TURNSTILE_SITE_KEY: 'site-key',
      TURNSTILE_SECRET_KEY: 'secret', REPORT_HASH_SECRET: 'h'.repeat(32),
      REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com',
    };
    expect((await handleRequest(request(), env)).status).toBe(400);
    expect((await handleRequest(request(), env)).status).toBe(202);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(first.mock.invocationCallOrder[0]).toBeLessThan(fetcher.mock.invocationCallOrder[0]!);
    vi.unstubAllGlobals();
  });

  it('returns only generic unavailability when D1 lookup or persistence fails', async () => {
    const request = () => new Request('https://opensimlab.com/api/reports', {
      method: 'POST',
      headers: {
        Origin: 'https://opensimlab.com', 'Content-Type': 'application/json',
        'CF-Connecting-IP': '192.0.2.1',
      },
      body: JSON.stringify(valid()),
    });
    const baseEnv = {
      REPORTING_ENABLED: 'true', TURNSTILE_SITE_KEY: 'site-key', TURNSTILE_SECRET_KEY: 'secret',
      REPORT_HASH_SECRET: 'h'.repeat(32), REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com',
    };
    const failedLookup = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({ first: vi.fn(async () => { throw new Error('D1 unavailable'); }) })),
      })),
    };
    let response = await handleRequest(request(), { ...baseEnv, REPORTS_DB: failedLookup });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false });

    const fetcher = vi.fn(async () => Response.json({
      success: true, action: 'scenario-report', hostname: 'opensimlab.com',
    }));
    vi.stubGlobal('fetch', fetcher);
    const statement = {
      bind: vi.fn(function bind() { return statement; }),
      first: vi.fn(async () => ({ count: 1 })),
    };
    const failedPersistence = {
      prepare: vi.fn(() => statement),
      batch: vi.fn(async () => { throw new Error('D1 exhausted'); }),
    };
    response = await handleRequest(request(), { ...baseEnv, REPORTS_DB: failedPersistence });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false });
    expect(fetcher).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
