/* global AbortSignal, FormData, Response, TextDecoder, TextEncoder, URL, crypto, fetch */

import catalog from './report-catalog.generated.json' with { type: 'json' };

export const REPORT_PATH = '/api/reports';
export const CONFIG_PATH = '/api/reports/config';
export const MAX_BODY_BYTES = 32 * 1024;
export const MAX_NOTE_LENGTH = 160;
export const REPORT_RETENTION_DAYS = 30;
export const COUNTER_RETENTION_DAYS = 14;
const TURNSTILE_ACTION = 'scenario-report';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_TOKEN_LENGTH = 2048;
const MAX_CONTEXT_ACTIONS = 20;
const MAX_CONTEXT_SNAPSHOT_FIELDS = 32;
export const MAX_CONTEXT_JSON_LENGTH = 16_384;
const VERIFIED_GLOBAL_LIMIT = 400;
const VERIFIED_REPORTER_LIMIT = 5;
const ACCEPTED_GLOBAL_LIMIT = 200;
const ACCEPTED_REPORTER_LIMIT = 3;
const CATEGORIES = new Set(['clinical-content', 'patient-behavior', 'tutor-debrief', 'controls', 'accessibility', 'outdated-source', 'other']);
const SURFACES = new Set(['prebrief', 'live', 'debrief', 'source', 'limitation']);
const CATALOG = new Map(catalog.scenarios.map((entry) => [
  `${entry.moduleId}:${entry.scenarioId}@${entry.contentVersion}`, entry,
]));

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; sandbox",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

function json(status, value, extra = {}) {
  return new Response(JSON.stringify(value), { status, headers: { ...HEADERS, ...extra } });
}

function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && Object.keys(value).every((key) => keys.includes(key));
}

function safeText(value, max, allowEmpty = true) {
  return typeof value === 'string' && value.length <= max
    && (allowEmpty || value.length > 0) && ![...value].some((character) => {
      const point = character.codePointAt(0);
      return point <= 0x08 || (point >= 0x0b && point <= 0x1f)
        || (point >= 0x7f && point <= 0x9f) || point === 0x061c
        || point === 0x200e || point === 0x200f
        || (point >= 0x202a && point <= 0x202e)
        || (point >= 0x2066 && point <= 0x2069);
    });
}

function noteMayContainRealPatientInformation(note) {
  return /\b(?:(?:my|our)\s+patient|(?:this|a)\s+real\s+patient|real-life\s+patient)\b/i.test(note)
    || /\b(?:mrn|medical\s+record|patient\s+id)\s*[:#-]?\s*[a-z0-9-]{4,}\b/i.test(note)
    || /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(note)
    || /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/.test(note);
}

function safeContextRecord(value, limit, strings) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length > limit) return false;
  return Object.entries(value).every(([key, item]) => safeText(key, 80, false)
    && /^[a-zA-Z0-9_.-]+$/.test(key)
    && (item === null || typeof item === 'boolean'
      || (typeof item === 'number' && Number.isFinite(item))
      || (strings && safeText(item, 80) && /^[a-zA-Z0-9_.-]+$/.test(item))));
}

function validateRecentContext(value) {
  if (value === null) return true;
  if (JSON.stringify(value).length > MAX_CONTEXT_JSON_LENGTH) return false;
  if (!exactKeys(value, ['seed', 'actions', 'snapshot'])
    || !Number.isSafeInteger(value.seed)
    || !Array.isArray(value.actions) || value.actions.length > MAX_CONTEXT_ACTIONS
    || !exactKeys(value.snapshot, ['patient', 'equipment'])
    || !safeContextRecord(value.snapshot.patient, MAX_CONTEXT_SNAPSHOT_FIELDS, false)
    || !safeContextRecord(value.snapshot.equipment, MAX_CONTEXT_SNAPSHOT_FIELDS, true)) return false;
  return value.actions.every((action) => exactKeys(action, ['tick', 'type', 'outcome', 'payload'])
    && Number.isSafeInteger(action.tick) && action.tick >= 0
    && safeText(action.type, 80, false) && /^[a-z0-9-]+$/.test(action.type)
    && (action.outcome === 'accepted' || action.outcome === 'refused')
    && safeContextRecord(action.payload, 12, true));
}

function configured(env) {
  return env.REPORTING_ENABLED === 'true'
    && env.REPORTS_DB
    && typeof env.TURNSTILE_SITE_KEY === 'string' && env.TURNSTILE_SITE_KEY.length > 0
    && typeof env.TURNSTILE_SECRET_KEY === 'string' && env.TURNSTILE_SECRET_KEY.length > 0
    && typeof env.REPORT_HASH_SECRET === 'string' && env.REPORT_HASH_SECRET.length >= 32
    && env.REPORT_ALLOWED_ORIGIN === 'https://opensimlab.com';
}

async function readJson(request) {
  const declared = request.headers.get('Content-Length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) {
    return { error: declared && /^\d+$/.test(declared) ? 413 : 400 };
  }
  if (!request.body) return { error: 400 };
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      return { error: 413 };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return { error: 400 }; }
  try { return { value: JSON.parse(text) }; } catch { return { error: 400 }; }
}

export function validateReportPayload(value, allowedOrigin = 'https://opensimlab.com') {
  const legacyKeys = ['module_id', 'scenario_id', 'content_version', 'app_version', 'engine_version', 'practice_region', 'surface', 'simulated_tick', 'canonical_url', 'category', 'note', 'turnstile_token'];
  const keys = [...legacyKeys.slice(0, -1), 'recent_context', 'turnstile_token'];
  if (!exactKeys(value, keys) && !exactKeys(value, legacyKeys)) return { ok: false, status: 400 };
  if (!safeText(value.module_id, 100, false) || !/^[a-z0-9-]+$/.test(value.module_id)
    || !safeText(value.scenario_id, 100, false) || !/^[a-z0-9-]+$/.test(value.scenario_id)
    || !safeText(value.content_version, 40, false)
    || !safeText(value.app_version, 40, false)
    || !safeText(value.engine_version, 80, false)) return { ok: false, status: 400 };
  const record = CATALOG.get(`${value.module_id}:${value.scenario_id}@${value.content_version}`);
  if (!record || !record.practiceRegions.includes(value.practice_region)) return { ok: false, status: 400 };
  if (!SURFACES.has(value.surface) || !CATEGORIES.has(value.category)
    || !Number.isSafeInteger(value.simulated_tick) || value.simulated_tick < 0
    || !safeText(value.note, MAX_NOTE_LENGTH) || noteMayContainRealPatientInformation(value.note)
    || !validateRecentContext(value.recent_context ?? null)
    || !safeText(value.turnstile_token, MAX_TOKEN_LENGTH, false)) return { ok: false, status: 400 };
  let canonical;
  try { canonical = new URL(value.canonical_url); } catch { return { ok: false, status: 400 }; }
  const expected = `${allowedOrigin}/${record.moduleId}/scenario/${record.scenarioId}`;
  if (canonical.href !== expected || canonical.username || canonical.password || canonical.search || canonical.hash) {
    return { ok: false, status: 403 };
  }
  return { ok: true, value: {
    scenarioId: record.scenarioId, contentVersion: record.contentVersion,
    moduleId: record.moduleId, maturity: record.maturity, fidelityClass: record.fidelityClass,
    practiceRegion: value.practice_region, surface: value.surface,
    simulatedTick: value.simulated_tick, category: value.category, note: value.note.trim(),
    canonicalUrl: expected, appVersion: value.app_version, engineVersion: value.engine_version,
    recentContext: value.recent_context ?? null,
    turnstileToken: value.turnstile_token,
  } };
}

export async function verifyTurnstile(report, remoteIp, env, fetcher = fetch) {
  const form = new FormData();
  form.set('secret', env.TURNSTILE_SECRET_KEY);
  form.set('response', report.turnstileToken);
  form.set('remoteip', remoteIp);
  form.set('idempotency_key', crypto.randomUUID());
  let response;
  try {
    response = await fetcher(TURNSTILE_VERIFY_URL, {
      method: 'POST', body: form, signal: AbortSignal.timeout(5000),
    });
  } catch { return false; }
  if (!response.ok) return false;
  let result;
  try { result = await response.json(); } catch { return false; }
  return result.success === true && result.action === TURNSTILE_ACTION && result.hostname === 'opensimlab.com';
}

async function hexDigest(algorithm, value, key) {
  const encoder = new TextEncoder();
  const bytes = key
    ? await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), encoder.encode(value))
    : await crypto.subtle.digest(algorithm, encoder.encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function configuredLimit(value, fallback, ceiling) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, ceiling) : fallback;
}

async function storeReport(db, report, reporter, env, now = new Date()) {
  const createdAt = now.toISOString();
  const day = createdAt.slice(0, 10);
  const id = crypto.randomUUID();
  const dedupe = await hexDigest('SHA-256', `${day}\0${JSON.stringify({ ...report, turnstileToken: undefined })}`);
  const acceptedGlobal = configuredLimit(env.REPORT_DAILY_LIMIT, ACCEPTED_GLOBAL_LIMIT, ACCEPTED_GLOBAL_LIMIT);
  const acceptedReporter = configuredLimit(env.REPORT_REPORTER_DAILY_LIMIT, ACCEPTED_REPORTER_LIMIT, ACCEPTED_REPORTER_LIMIT);
  const upsert = (kind, scope, subject) => db.prepare(`
    INSERT INTO report_counters (day, kind, scope, subject, count) VALUES (?, ?, ?, ?, 1)
    ON CONFLICT (day, kind, scope, subject) DO UPDATE SET count = count + 1
  `).bind(day, kind, scope, subject);
  const insert = db.prepare(`
    INSERT OR IGNORE INTO scenario_reports (
      id, created_at, scenario_id, content_version, module_id, maturity, practice_region,
      fidelity_class, surface, simulated_tick, category, note, canonical_url,
      app_version, engine_version, recent_context_json, dedupe_key
    ) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE COALESCE((SELECT count FROM report_counters WHERE day=? AND kind='verified' AND scope='global' AND subject='all'), 0) <= ?
      AND COALESCE((SELECT count FROM report_counters WHERE day=? AND kind='verified' AND scope='reporter' AND subject=?), 0) <= ?
      AND COALESCE((SELECT count FROM report_counters WHERE day=? AND kind='accepted' AND scope='global' AND subject='all'), 0) < ?
      AND COALESCE((SELECT count FROM report_counters WHERE day=? AND kind='accepted' AND scope='reporter' AND subject=?), 0) < ?
  `).bind(
    id, createdAt, report.scenarioId, report.contentVersion, report.moduleId, report.maturity,
    report.practiceRegion, report.fidelityClass, report.surface, report.simulatedTick, report.category,
    report.note || null, report.canonicalUrl, report.appVersion, report.engineVersion,
    report.recentContext ? JSON.stringify(report.recentContext) : null, `${day}:${dedupe}`,
    day, VERIFIED_GLOBAL_LIMIT, day, reporter, VERIFIED_REPORTER_LIMIT,
    day, acceptedGlobal, day, reporter, acceptedReporter,
  );
  const incrementAccepted = (scope, subject) => db.prepare(`
    INSERT INTO report_counters (day, kind, scope, subject, count)
    SELECT ?, 'accepted', ?, ?, 1 WHERE EXISTS (SELECT 1 FROM scenario_reports WHERE id = ?)
    ON CONFLICT (day, kind, scope, subject) DO UPDATE SET count = count + 1
  `).bind(day, scope, subject, id);
  await db.batch([
    upsert('verified', 'global', 'all'), upsert('verified', 'reporter', reporter), insert,
    incrementAccepted('global', 'all'), incrementAccepted('reporter', reporter),
  ]);
}

async function verifiedLimitReached(db, day, reporter) {
  const row = await db.prepare(`
    SELECT
      COALESCE((SELECT count FROM report_counters WHERE day=? AND kind='verified' AND scope='global' AND subject='all'), 0) AS global_count,
      COALESCE((SELECT count FROM report_counters WHERE day=? AND kind='verified' AND scope='reporter' AND subject=?), 0) AS reporter_count
  `).bind(day, day, reporter).first();
  return Number(row?.global_count) >= VERIFIED_GLOBAL_LIMIT
    || Number(row?.reporter_count) >= VERIFIED_REPORTER_LIMIT;
}

function cutoff(now, days) { return new Date(now.getTime() - days * 86400000).toISOString(); }

export async function cleanupReports(db, now = new Date()) {
  await db.batch([
    db.prepare('DELETE FROM scenario_reports WHERE created_at < ?').bind(cutoff(now, REPORT_RETENTION_DAYS)),
    db.prepare('DELETE FROM report_counters WHERE day < ?').bind(cutoff(now, COUNTER_RETENTION_DAYS).slice(0, 10)),
  ]);
}

async function handleConfig(request, env) {
  if (request.method !== 'GET') return json(405, { ok: false });
  if (!configured(env)) return json(503, { ok: false });
  return json(200, { sitekey: env.TURNSTILE_SITE_KEY, action: TURNSTILE_ACTION });
}

async function handleReport(request, env) {
  if (request.method !== 'POST') return json(405, { ok: false });
  if (!configured(env)) return json(503, { ok: false });
  if (request.headers.get('Origin') !== env.REPORT_ALLOWED_ORIGIN) return json(403, { ok: false });
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('Content-Type') || '')) return json(415, { ok: false });
  const encoding = request.headers.get('Content-Encoding');
  if (encoding && encoding.toLowerCase() !== 'identity') return json(415, { ok: false });
  const remoteIp = request.headers.get('CF-Connecting-IP');
  if (!remoteIp || remoteIp.length > 64) return json(403, { ok: false });
  const parsed = await readJson(request);
  if (parsed.error) return json(parsed.error, { ok: false });
  const validated = validateReportPayload(parsed.value, env.REPORT_ALLOWED_ORIGIN);
  if (!validated.ok) return json(validated.status, { ok: false });
  const day = new Date().toISOString().slice(0, 10);
  let reporter;
  try {
    reporter = await hexDigest('SHA-256', `${day}\0${remoteIp}`, env.REPORT_HASH_SECRET);
    if (await verifiedLimitReached(env.REPORTS_DB, day, reporter)) return json(202, { ok: true });
  } catch { return json(503, { ok: false }); }
  if (!await verifyTurnstile(validated.value, remoteIp, env)) return json(400, { ok: false });
  try { await storeReport(env.REPORTS_DB, validated.value, reporter, env); }
  catch { return json(503, { ok: false }); }
  return json(202, { ok: true });
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (url.search || url.hash) return json(404, { ok: false });
  if (url.pathname === CONFIG_PATH) return handleConfig(request, env);
  if (url.pathname === REPORT_PATH) return handleReport(request, env);
  return json(404, { ok: false });
}

export default {
  fetch: handleRequest,
  scheduled(_event, env, ctx) { ctx.waitUntil(cleanupReports(env.REPORTS_DB)); },
};
