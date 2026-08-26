import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  REPORT_NOTE_LIMIT, buildScenarioReportRequest, type ScenarioReportContext,
} from '@platform/reporting/contracts';
import {
  handleRequest, validateReportPayload, verifyTurnstile,
} from '../../workers/reports/src/index.mjs';

const context: ScenarioReportContext = {
  scenarioId: 'routine-induction', contentVersion: '0.1.0', appVersion: '0.1.0-alpha.1',
  engineVersion: '0.1.0', moduleId: 'anesthesia', maturity: 'draft', practiceRegion: 'US',
  fidelityClass: 'closed_loop_physiology', surface: 'live', simulatedTick: 42,
  canonicalUrl: 'https://opensimlab.com/anesthesia/scenario/routine-induction',
};

const valid = () => buildScenarioReportRequest(context, 'clinical-content', 'Expected a different value.', 'token');

describe('scenario report contract', () => {
  it('publishes an exact-version server catalog for every current playable scenario', () => {
    const catalog = JSON.parse(readFileSync(
      join(process.cwd(), 'workers/reports/src/report-catalog.generated.json'), 'utf8',
    )) as { scenarios: { moduleId: string; scenarioId: string; contentVersion: string }[] };
    expect(catalog.scenarios).toHaveLength(147);
    expect(new Set(catalog.scenarios.map((entry) => `${entry.moduleId}:${entry.scenarioId}@${entry.contentVersion}`)).size)
      .toBe(147);
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

  it('keeps the report Worker isolated from assets and public preview routes', () => {
    const wrangler = readFileSync(join(process.cwd(), 'workers/reports/wrangler.toml'), 'utf8');
    expect(wrangler).toContain('workers_dev = false');
    expect(wrangler).toContain('preview_urls = false');
    expect(wrangler).not.toContain('[assets]');
    expect(wrangler.match(/pattern = /g)).toHaveLength(2);
  });

  it('keeps report configuration out of the offline cache and available to the kill switch', () => {
    const serviceWorker = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8');
    const bypass = serviceWorker.indexOf("url.pathname.startsWith('/api/')");
    const interception = serviceWorker.indexOf('event.respondWith');
    expect(bypass).toBeGreaterThan(0);
    expect(bypass).toBeLessThan(interception);
  });

  it('requires Turnstile success, the scenario-report action, and the production hostname', async () => {
    const fetcher = vi.fn(async () => Response.json({
      success: true, action: 'scenario-report', hostname: 'opensimlab.com',
    }));
    await expect(verifyTurnstile(
      { turnstileToken: 'token' }, '192.0.2.1', { TURNSTILE_SECRET_KEY: 'secret' }, fetcher,
    )).resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' }),
    );
    const wrongAction = vi.fn(async () => Response.json({
      success: true, action: 'other', hostname: 'opensimlab.com',
    }));
    await expect(verifyTurnstile(
      { turnstileToken: 'token' }, '192.0.2.1', { TURNSTILE_SECRET_KEY: 'secret' }, wrongAction,
    )).resolves.toBe(false);
  });
});
