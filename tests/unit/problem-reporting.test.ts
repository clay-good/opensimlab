import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  REPORT_CONTEXT_JSON_LIMIT, REPORT_NOTE_LIMIT, buildScenarioReportRequest,
  noteMayContainRealPatientInformation,
  type ScenarioReportContext,
} from '@platform/reporting/contracts';
import {
  cleanupReports, handleRequest, reporterAllocation, reporterNetwork, reserveVerificationAttempt,
  validateReportPayload, verifyTurnstile,
} from '../../workers/reports/src/index.mjs';
import { availableModules } from '@platform/modules/registry';
import { SCENARIOS } from '@anesthesia/scenarios';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../../src/modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../../src/modules/cardiology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../../src/modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../../src/modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../../src/modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../../src/modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../../src/modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../../src/modules/neonatology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../src/modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../src/modules/renal-electrolyte/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../../src/modules/infectious-disease/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../src/modules/medical-surgical-nursing/scenarios';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';

/**
 * The module list the report catalog is built from is hand-maintained in
 * scripts/build-completion-catalog.ts. Nothing previously tied it to the module
 * registry, so a module could be routed and playable while every report from it
 * was rejected by the Worker as an unknown scenario. This table closes that.
 */
const PLAYABLE_MODULES = [
  ['anesthesia', SCENARIOS], ['emergency-medicine', EMERGENCY_MEDICINE_SCENARIOS],
  ['critical-care', CRITICAL_CARE_SCENARIOS], ['cardiology', CARDIOLOGY_SCENARIOS],
  ['respiratory-medicine', RESPIRATORY_MEDICINE_SCENARIOS], ['pediatrics', PEDIATRICS_SCENARIOS],
  ['neurology', NEUROLOGY_SCENARIOS], ['toxicology', TOXICOLOGY_SCENARIOS],
  ['obstetrics', OBSTETRICS_SCENARIOS], ['neonatology', NEONATOLOGY_SCENARIOS],
  ['endocrine-metabolic', ENDOCRINE_METABOLIC_SCENARIOS],
  ['renal-electrolyte', RENAL_ELECTROLYTE_SCENARIOS],
  ['infectious-disease', INFECTIOUS_DISEASE_SCENARIOS],
  ['medical-surgical-nursing', MEDICAL_SURGICAL_NURSING_SCENARIOS],
  ['oncology', ONCOLOGY_SCENARIOS],
] as const;

const context: ScenarioReportContext = {
  scenarioId: 'routine-induction', contentVersion: '0.1.0', appVersion: '0.1.0-alpha.1',
  engineVersion: '0.1.0', moduleId: 'anesthesia', maturity: 'draft', practiceRegion: 'US',
  fidelityClass: 'closed_loop_physiology', surface: 'live', simulatedTick: 42,
  canonicalUrl: 'https://opensimlab.com/anesthesia/scenario/routine-induction',
};

const valid = () => buildScenarioReportRequest(context, 'clinical-content', 'Expected a different value.', 'token');

// Published evidence is intentionally pinned here, not recomputed from current
// scenario source: older cached clients must retain their original report identity.
const HISTORICAL_ENDOCRINE_REPORTS = [
  {
    scenarioId: 'myxedema-coma-ventilation-and-steroid-sequence', contentVersion: '0.1.0',
    moduleId: 'endocrine-metabolic', maturity: 'preview', practiceRegions: ['US', 'GB'],
    fidelityClass: 'state_transition', capabilityVersion: '0.1.0-alpha.48',
    releaseRef: 'sha256:3279d1acdfa8e749339ef670b50733a859fd38dc52771b9def4fca8e0f31de5a',
    defaultsHash: 'sha256:30d3a73fe153c7e5b08648cb90f1a4446bb39f6318f3dbc9eeacbfc5b35a0db0',
    maturityHash: 'sha256:24db1e37a44fc5e6ab3d834812976b17e2a6c4b9b162eda7135da2d81092e1ac',
    sourceManifestHash: 'sha256:efa348e5d861e0793bc33167bf55d7829b5c87b040313fa9c6c363be63af6b13',
    limitationManifestHash: 'sha256:11918f0365bdd85369a425c3ec76ed885963697d37b4e670ac8e753325e8707d',
  },
  {
    scenarioId: 'thyroid-storm-hemodynamic-risk', contentVersion: '0.1.0',
    moduleId: 'endocrine-metabolic', maturity: 'preview', practiceRegions: ['US', 'GB'],
    fidelityClass: 'state_transition', capabilityVersion: '0.1.0-alpha.48',
    releaseRef: 'sha256:a4df094d6491f56e382d48fb455cde0d385c5f84ad641d5b80af37bb56a9258a',
    defaultsHash: 'sha256:098d300c091390b0885fed004915138ae9c9d60feac84cf7fd01592718040a8f',
    maturityHash: 'sha256:819cdb3017284e3a0c02be780fef7b2108e5a2cf8df1bfd897dcc9b509700f8a',
    sourceManifestHash: 'sha256:80c91127d1659ef35fa0975e90db3553a4a86c6494856073228a15cfa89fe2de',
    limitationManifestHash: 'sha256:e80acd3fc429c1a683378d6b57471ad0b344e9437e99c71ccd5d575595087945',
  },
];

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
  it.each(HISTORICAL_ENDOCRINE_REPORTS)('preserves published $scenarioId evidence alongside the duration-corrected version', (historical) => {
    const catalog = JSON.parse(readFileSync(
      join(process.cwd(), 'workers/reports/src/report-catalog.generated.json'), 'utf8',
    )) as { scenarios: typeof HISTORICAL_ENDOCRINE_REPORTS };
    const publicCatalog = JSON.parse(readFileSync(
      join(process.cwd(), 'public/catalog/scenario-report-catalog.json'), 'utf8',
    ));
    expect(publicCatalog).toEqual(catalog);
    const versions = catalog.scenarios.filter((record) => record.moduleId === historical.moduleId
      && record.scenarioId === historical.scenarioId);
    expect(versions.map((record) => record.contentVersion)).toEqual(['0.1.0', '0.1.1']);
    expect(versions.find((record) => record.contentVersion === '0.1.0')).toEqual(historical);
    const current = versions.find((record) => record.contentVersion === '0.1.1')!;
    expect(current).toEqual({ ...historical, contentVersion: '0.1.1',
      releaseRef: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      maturityHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/) });
    expect(current.releaseRef).not.toBe(historical.releaseRef);
    expect(current.maturityHash).not.toBe(historical.maturityHash);
    // The full-record comparison above also locks unchanged defaults, sources,
    // limitations, capability, maturity, fidelity, and practice regions.
    for (const record of [historical, current]) {
      const { practiceRegions, ...serverEvidence } = record;
      for (const practiceRegion of practiceRegions) {
        const request = { ...valid(), module_id: record.moduleId, scenario_id: record.scenarioId,
          content_version: record.contentVersion, practice_region: practiceRegion,
          canonical_url: `https://opensimlab.com/${record.moduleId}/scenario/${record.scenarioId}` };
        expect(validateReportPayload(request)).toMatchObject({ ok: true,
          value: { ...serverEvidence, practiceRegion } });
        expect(validateReportPayload({ ...request, content_version: '0.1.2' })).toEqual({ ok: false, status: 400 });
        expect(validateReportPayload({ ...request, module_id: 'anesthesia' })).toEqual({ ok: false, status: 400 });
        expect(validateReportPayload({ ...request, canonical_url: `${request.canonical_url}?version=0.1.1` }))
          .toEqual({ ok: false, status: 403 });
      }
    }
  });

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
    // 229, not 228: septic shock carries records for both 0.1.0 and 0.1.1, so a report filed
    // against the published version still resolves after a content-version bump.
    expect(catalog.scenarios).toHaveLength(249);
    expect(new Set(catalog.scenarios.map((entry) => `${entry.moduleId}:${entry.scenarioId}@${entry.contentVersion}`)).size)
      .toBe(249);
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

  it('accepts the exact infectious-disease meningococcal context and rejects module or URL drift', () => {
    const infection: ScenarioReportContext = {
      ...context, moduleId: 'infectious-disease', scenarioId: 'meningococcal-sepsis-recognition-and-escalation',
      canonicalUrl: 'https://opensimlab.com/infectious-disease/scenario/meningococcal-sepsis-recognition-and-escalation',
      fidelityClass: 'state_transition', simulatedTick: 36005,
    };
    const report = buildScenarioReportRequest(infection, 'clinical-content', 'The one-hour review may need a source check.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    // A note longer than the limit is truncated on the client and refused by the worker.
    const long = buildScenarioReportRequest(infection, 'clinical-content', 'x'.repeat(400), 'token');
    expect(long.note).toHaveLength(160);
    expect(validateReportPayload({ ...report, note: 'x'.repeat(161) })).toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, scenario_id: 'meningococcal-sepsis' })).toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, module_id: 'toxicology' })).toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${infection.canonicalUrl}?seed=5101` }))
      .toEqual({ ok: false, status: 403 });
  });

  it('accepts the exact infectious-disease obstructed-kidney context and rejects drift', () => {
    const obstruction: ScenarioReportContext = {
      ...context, moduleId: 'infectious-disease', scenarioId: 'obstructed-infected-kidney-decompression',
      canonicalUrl: 'https://opensimlab.com/infectious-disease/scenario/obstructed-infected-kidney-decompression',
      fidelityClass: 'state_transition', simulatedTick: 216005, practiceRegion: 'GB',
    };
    const report = buildScenarioReportRequest(obstruction, 'outdated-source', 'The AUA grade may need rechecking.', 'token');
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, scenario_id: 'obstructed-infected-kidney' })).toEqual({ ok: false, status: 400 });
    expect(validateReportPayload({ ...report, canonical_url: `${obstruction.canonicalUrl}#tick-216005` }))
      .toEqual({ ok: false, status: 403 });
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

  it('leaves no playable module out of the report catalog', () => {
    const catalog = JSON.parse(readFileSync(
      join(process.cwd(), 'workers/reports/src/report-catalog.generated.json'), 'utf8',
    )) as { scenarios: { moduleId: string; scenarioId: string; contentVersion: string }[] };
    // The table itself must not drift from the registry in either direction.
    expect([...PLAYABLE_MODULES.map(([id]) => id)].sort())
      .toEqual(availableModules().map((entry) => entry.id).sort());
    const covered = new Set(catalog.scenarios.map((entry) => entry.moduleId));
    for (const [moduleId] of PLAYABLE_MODULES) {
      expect(covered, `${moduleId} has no report catalog record`).toContain(moduleId);
    }
  });

  it('gives every playable scenario a current-version record the Worker will accept', () => {
    const catalog = JSON.parse(readFileSync(
      join(process.cwd(), 'workers/reports/src/report-catalog.generated.json'), 'utf8',
    )) as { scenarios: { moduleId: string; scenarioId: string; contentVersion: string }[] };
    const published = new Set(catalog.scenarios
      .map((entry) => `${entry.moduleId}:${entry.scenarioId}@${entry.contentVersion}`));
    const unreportable = PLAYABLE_MODULES.flatMap(([moduleId, scenarios]) => scenarios
      .filter((scenario) => !published.has(`${moduleId}:${scenario.metadata.id}@${scenario.metadata.version}`))
      .map((scenario) => `${moduleId}:${scenario.metadata.id}@${scenario.metadata.version}`));
    // A scenario absent here is one whose reports the Worker rejects with a 400.
    expect(unreportable).toEqual([]);
    expect(PLAYABLE_MODULES.reduce((total, [, scenarios]) => total + scenarios.length, 0))
      .toBeGreaterThanOrEqual(new Set(catalog.scenarios.map((entry) => entry.scenarioId)).size);
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
    await expect(reserveVerificationAttempt(database, '2026-08-26', 'reporter', 'alloc')).resolves.toBe(true);
    await expect(reserveVerificationAttempt(database, '2026-08-26', 'reporter', 'alloc')).resolves.toBe(false);
    expect(database.prepare.mock.calls[0]?.[0]).toContain("kind='verified'");
    expect(database.prepare.mock.calls[0]?.[0]).toContain('SUM(count)');
    // The subject leads with the allocation so its budget is a prefix sum over the same rows,
    // which is what lets one statement enforce the reporter, allocation, and global caps together.
    expect(statement.bind).toHaveBeenCalledWith(
      '2026-08-26', 'alloc:reporter',
      '2026-08-26', 400, '2026-08-26', 'alloc:%', 25,
      5,
      '2026-08-26', 400, '2026-08-26', 'alloc:%', 25,
    );
  });

  // Eighty /64s out of one routed /48, five verifications each, would have spent the whole day's
  // global budget and closed the channel for every real learner until midnight.
  it('stops one routed allocation from spending the global verification budget', () => {
    const network = (address: string) => reporterNetwork(address);
    const allocation = (address: string) => reporterAllocation(address);
    // Different /64s inside one /48 are separate reporters and one allocation.
    expect(network('2001:db8:1234:0001::5')).not.toBe(network('2001:db8:1234:0002::5'));
    expect(allocation('2001:db8:1234:0001::5')).toBe(allocation('2001:db8:1234:0002::5'));
    // A different /48 is a different allocation, so honest neighbours are unaffected.
    expect(allocation('2001:db8:9999:0001::5')).not.toBe(allocation('2001:db8:1234:0001::5'));
    // The allocation is strictly coarser than the network it contains.
    expect(network('2001:db8:1234:0001::5').startsWith(allocation('2001:db8:1234:0001::5'))).toBe(true);
    // IPv4 has no prefix to collapse, so both dimensions stay the address.
    expect(allocation('203.0.113.9')).toBe('203.0.113.9');
    expect(network('203.0.113.9')).toBe('203.0.113.9');
  });

  it('sweeps counters always and reports only once retention is switched on', async () => {
    const swept: string[] = [];
    const statement = { bind: vi.fn(function bind() { return statement; }) };
    const database = {
      prepare: vi.fn((sql: string) => { swept.push(sql); return statement; }),
      batch: vi.fn(async (statements: unknown[]) => statements.map(() => ({}))),
    };
    await cleanupReports(database, new Date('2026-08-26T00:00:00Z'), {});
    expect(swept.join(' ')).toContain('DELETE FROM report_counters');
    // The export that would have read them ships disabled, so nothing may retire them yet.
    expect(swept.join(' ')).not.toContain('DELETE FROM scenario_reports');
    swept.length = 0;
    await cleanupReports(database, new Date('2026-08-26T00:00:00Z'), { REPORT_RETENTION_ENABLED: 'true' });
    expect(swept.join(' ')).toContain('DELETE FROM scenario_reports');
    expect(swept.join(' ')).toContain('DELETE FROM report_counters');
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

describe('scenario report abuse and privacy hardening', () => {
  it('throttles by IPv6 network rather than address, so rotation buys nothing', () => {
    // A single ordinary /64 allocation hands one host 2^64 addresses. Hashing the full address
    // would make every per-reporter limit unbounded in practice.
    const first = reporterNetwork('2001:db8:1234:5678:9abc:def0:1:2');
    for (const rotated of ['2001:db8:1234:5678::1', '2001:db8:1234:5678:ffff:ffff:ffff:ffff',
      '2001:0DB8:1234:5678:0:0:0:99', '2001:db8:1234:5678:1:2:3:4%eth0']) {
      expect(reporterNetwork(rotated)).toBe(first);
    }
    // A different /64, and any IPv4 address, still count separately.
    expect(reporterNetwork('2001:db8:1234:5679::1')).not.toBe(first);
    expect(reporterNetwork('203.0.113.9')).toBe('203.0.113.9');
    expect(reporterNetwork('198.51.100.4')).not.toBe(reporterNetwork('203.0.113.9'));
  });

  // A cap or a repeat makes the INSERT OR IGNORE write nothing while the batch still succeeds.
  // Answering "in the weekly review queue" there tells the learner something untrue in the one
  // moment the feature asks them to trust it.
  it('says whether the report actually reached the queue', async () => {
    const send = async (changes: number) => {
      const statement = {
        bind: vi.fn(function bind() { return statement; }),
        first: vi.fn(async () => ({ count: 1 })),
      };
      const database = {
        prepare: vi.fn(() => statement),
        batch: vi.fn(async () => [{ meta: { changes } }, {}, {}, {}]),
      };
      vi.stubGlobal('fetch', vi.fn(async () => Response.json({
        success: true, action: 'scenario-report', hostname: 'opensimlab.com',
      })));
      const response = await handleRequest(new Request('https://opensimlab.com/api/reports', {
        method: 'POST',
        headers: {
          Origin: 'https://opensimlab.com', 'Content-Type': 'application/json',
          'CF-Connecting-IP': '2001:db8:1234:5678::9',
        },
        body: JSON.stringify(valid()),
      }), {
        REPORTING_ENABLED: 'true', REPORTS_DB: database, TURNSTILE_SITE_KEY: 'site-key',
        TURNSTILE_SECRET_KEY: 'secret', REPORT_HASH_SECRET: 'h'.repeat(32),
        REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com',
      });
      expect(response.status).toBe(202);
      return response.json();
    };
    expect(await send(1)).toEqual({ ok: true, queued: true });
    expect(await send(0)).toEqual({ ok: true, queued: false });
  });

  it('does not claim a queue place when the verification budget is already spent', async () => {
    const statement = {
      bind: vi.fn(function bind() { return statement; }),
      // No row returned means the reservation was refused.
      first: vi.fn(async () => null),
    };
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const response = await handleRequest(new Request('https://opensimlab.com/api/reports', {
      method: 'POST',
      headers: {
        Origin: 'https://opensimlab.com', 'Content-Type': 'application/json',
        'CF-Connecting-IP': '2001:db8:1234:5678::9',
      },
      body: JSON.stringify(valid()),
    }), {
      REPORTING_ENABLED: 'true', REPORTS_DB: { prepare: vi.fn(() => statement), batch: vi.fn() },
      TURNSTILE_SITE_KEY: 'site-key', TURNSTILE_SECRET_KEY: 'secret',
      REPORT_HASH_SECRET: 'h'.repeat(32), REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com',
    });
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true, queued: false });
    // And it still costs no Siteverify call.
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('caps acceptance per scenario so one subject cannot spend the global budget', async () => {
    const sql: string[] = [];
    const bound: unknown[][] = [];
    const statement = {
      bind: vi.fn((...args: unknown[]) => { bound.push(args); return statement; }),
      first: vi.fn(async () => ({ count: 1 })),
      run: vi.fn(async () => ({})),
    };
    const database = {
      prepare: vi.fn((text: string) => { sql.push(text); return statement; }),
      batch: vi.fn(async () => []),
    };
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    fetcher.mockResolvedValueOnce(Response.json({
      success: true, action: 'scenario-report', hostname: 'opensimlab.com',
    }));
    const response = await handleRequest(new Request('https://opensimlab.com/api/reports', {
      method: 'POST',
      headers: {
        Origin: 'https://opensimlab.com', 'Content-Type': 'application/json',
        'CF-Connecting-IP': '2001:db8:1234:5678::9',
      },
      body: JSON.stringify(valid()),
    }), {
      REPORTING_ENABLED: 'true', REPORTS_DB: database, TURNSTILE_SITE_KEY: 'site-key',
      TURNSTILE_SECRET_KEY: 'secret', REPORT_HASH_SECRET: 'h'.repeat(32),
      REPORT_ALLOWED_ORIGIN: 'https://opensimlab.com',
    });
    expect(response.status).toBe(202);
    const insert = sql.find((text) => text.includes('INSERT OR IGNORE INTO scenario_reports'))!;
    expect(insert).toContain("scope='scenario'");
    // The scenario counter must be incremented too, or the cap would never bind.
    expect(bound.some((args) => args.includes('scenario'))).toBe(true);
  });

  it('rejects separator-free numbers and dates identically on both sides of the boundary', () => {
    const risky = ['5551234567', 'call 555 123 4567', 'mrn 88213377',
      'dob 04/11/1958', 'born 4-11-58', 'contact a@b.co'];
    for (const note of risky) {
      expect(noteMayContainRealPatientInformation(note), note).toBe(true);
      // Parity: the worker re-validates independently, so both copies must agree.
      expect(validateReportPayload({ ...valid(), note }), note).toEqual({ ok: false, status: 400 });
    }
    const safe = ['the lactate of 2.4 seems wrong', 'ceiling shows 179 min', 'BP 118/72 reads oddly'];
    for (const note of safe) {
      expect(noteMayContainRealPatientInformation(note), note).toBe(false);
      expect(validateReportPayload({ ...valid(), note }).ok, note).toBe(true);
    }
  });
});
