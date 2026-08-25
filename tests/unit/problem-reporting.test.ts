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
    expect(catalog.scenarios).toHaveLength(101);
    expect(new Set(catalog.scenarios.map((entry) => `${entry.moduleId}:${entry.scenarioId}@${entry.contentVersion}`)).size)
      .toBe(101);
  });

  it('normalizes and bounds the optional note to exactly 160 characters', () => {
    const report = buildScenarioReportRequest(context, 'other', `  ${'x'.repeat(200)}  `, 'token');
    expect(REPORT_NOTE_LIMIT).toBe(160);
    expect(report.note).toHaveLength(160);
    expect(validateReportPayload(report)).toMatchObject({ ok: true });
    expect(validateReportPayload({ ...report, note: 'x'.repeat(161) })).toEqual({ ok: false, status: 400 });
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
