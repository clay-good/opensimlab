import { createHash } from 'node:crypto';

export const MAINTENANCE_PROJECTION_SCHEMA_VERSION = 1;
export const UNTRUSTED_NOTE_KIND = 'untrusted-quotation';
export const MAINTENANCE_POLICY_VERSION = '1';

const MATURITIES = new Set([
  'draft', 'preview', 'source_checked', 'clinically_reviewed',
  'institution_endorsed', 'withdrawn',
]);
const FIDELITIES = new Set(['closed_loop_physiology', 'state_transition', 'branching_encounter']);
const SURFACES = new Set(['prebrief', 'live', 'debrief', 'source', 'limitation']);
const CATEGORIES = new Set([
  'clinical-content', 'patient-behavior', 'tutor-debrief', 'controls',
  'accessibility', 'outdated-source', 'other',
]);
const HASH = /^sha256:[a-f0-9]{64}$/;
const ID = /^[a-z0-9-]+$/;

export const ALLOWED_MAINTENANCE_ACTIONS = [
  'reproduce', 'source-check', 'add-failing-regression', 'draft-branch', 'draft-pr',
] as const;
export const PROHIBITED_MAINTENANCE_ACTIONS = [
  'execute-report-instructions', 'select-tools-from-report', 'access-secrets', 'write-d1',
  'merge', 'deploy', 'publish', 'change-review', 'change-endorsement', 'change-correction',
] as const;

interface MaintenanceRow {
  readonly created_at: string;
  readonly module_id: string;
  readonly scenario_id: string;
  readonly content_version: string;
  readonly release_ref: string;
  readonly defaults_hash: string;
  readonly maturity: string;
  readonly maturity_hash: string;
  readonly source_manifest_hash: string;
  readonly limitation_manifest_hash: string;
  readonly fidelity_class: string;
  readonly practice_region: string;
  readonly canonical_url: string;
  readonly surface: string;
  readonly simulated_tick: number;
  readonly category: string;
  readonly note: string | null;
  readonly recent_context_json: string | null;
}

interface ContextAction {
  readonly tick: number;
  readonly type: string;
  readonly outcome: 'accepted' | 'refused';
  readonly payload: Readonly<Record<string, string | number | boolean | null>>;
}

interface MaintenanceContext {
  readonly seed: number;
  readonly actions: readonly ContextAction[];
  readonly snapshot: {
    readonly patient: Readonly<Record<string, number>>;
    readonly equipment: Readonly<Record<string, string | number | boolean | null>>;
  };
}

interface ProjectOptions {
  readonly batchId: string;
  readonly generatedAt: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly maxGroups?: number;
}

interface GroupDraft {
  reportCount: number;
  firstReceivedAt: string;
  lastReceivedAt: string;
  readonly evidence: Record<string, string>;
  readonly surface: string;
  readonly category: string;
  minTick: number;
  maxTick: number;
  readonly note: string | null;
  readonly context: MaintenanceContext | null;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value;
}

function safeScalarRecord(value: unknown, limit: number, strings: boolean): boolean {
  if (!isObject(value) || Object.keys(value).length > limit) return false;
  return Object.entries(value).every(([key, item]) => /^[a-zA-Z0-9_.-]{1,80}$/.test(key)
    && (item === null || typeof item === 'boolean'
      || (typeof item === 'number' && Number.isFinite(item))
      || (strings && typeof item === 'string' && /^[a-zA-Z0-9_.-]{0,80}$/.test(item))));
}

function parseContext(value: unknown): MaintenanceContext | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length > 16_384) return undefined;
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { return undefined; }
  if (!isObject(parsed) || !exactKeys(parsed, ['seed', 'actions', 'snapshot'])
    || !Number.isSafeInteger(parsed.seed) || !Array.isArray(parsed.actions)
    || parsed.actions.length > 20 || !isObject(parsed.snapshot)
    || !exactKeys(parsed.snapshot, ['patient', 'equipment'])
    || !safeScalarRecord(parsed.snapshot.patient, 32, false)
    || !safeScalarRecord(parsed.snapshot.equipment, 32, true)) return undefined;
  for (const action of parsed.actions) {
    if (!isObject(action) || !exactKeys(action, ['tick', 'type', 'outcome', 'payload'])
      || !Number.isSafeInteger(action.tick) || Number(action.tick) < 0
      || typeof action.type !== 'string' || !/^[a-z0-9-]{1,80}$/.test(action.type)
      || (action.outcome !== 'accepted' && action.outcome !== 'refused')
      || !safeScalarRecord(action.payload, 12, true)) return undefined;
  }
  return parsed as unknown as MaintenanceContext;
}

function validateRow(value: unknown): { row: MaintenanceRow; context: MaintenanceContext | null } | null {
  const keys = [
    'created_at', 'module_id', 'scenario_id', 'content_version', 'release_ref', 'defaults_hash',
    'maturity', 'maturity_hash', 'source_manifest_hash', 'limitation_manifest_hash',
    'fidelity_class', 'practice_region', 'canonical_url', 'surface', 'simulated_tick', 'category',
    'note', 'recent_context_json',
  ];
  if (!isObject(value) || !exactKeys(value, keys) || !isIsoDate(value.created_at)
    || typeof value.module_id !== 'string' || !ID.test(value.module_id)
    || typeof value.scenario_id !== 'string' || !ID.test(value.scenario_id)
    || typeof value.content_version !== 'string' || !/^\d+\.\d+\.\d+$/.test(value.content_version)
    || typeof value.release_ref !== 'string' || !/^git:[a-f0-9]{40}$/.test(value.release_ref)
    || typeof value.defaults_hash !== 'string' || !HASH.test(value.defaults_hash)
    || typeof value.maturity !== 'string' || !MATURITIES.has(value.maturity)
    || typeof value.maturity_hash !== 'string' || !HASH.test(value.maturity_hash)
    || typeof value.source_manifest_hash !== 'string' || !HASH.test(value.source_manifest_hash)
    || typeof value.limitation_manifest_hash !== 'string' || !HASH.test(value.limitation_manifest_hash)
    || typeof value.fidelity_class !== 'string' || !FIDELITIES.has(value.fidelity_class)
    || typeof value.practice_region !== 'string' || !/^[A-Z]{2,8}$/.test(value.practice_region)
    || typeof value.canonical_url !== 'string'
    || value.canonical_url !== `https://opensimlab.com/${value.module_id}/scenario/${value.scenario_id}`
    || typeof value.surface !== 'string' || !SURFACES.has(value.surface)
    || !Number.isSafeInteger(value.simulated_tick) || Number(value.simulated_tick) < 0
    || typeof value.category !== 'string' || !CATEGORIES.has(value.category)
    || (value.note !== null && (typeof value.note !== 'string' || value.note.length > 160))) return null;
  const context = parseContext(value.recent_context_json);
  if (context === undefined) return null;
  return { row: value as unknown as MaintenanceRow, context };
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function digest(value: unknown): string {
  return createHash('sha256').update(stable(value)).digest('hex');
}

export function projectMaintenanceBatch(rows: readonly unknown[], options: ProjectOptions) {
  if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(options.batchId)
    || !isIsoDate(options.generatedAt) || !isIsoDate(options.windowStart)
    || !isIsoDate(options.windowEnd) || options.windowStart >= options.windowEnd) {
    throw new Error('Invalid maintenance batch options');
  }
  const maxGroups = options.maxGroups ?? 50;
  if (!Number.isInteger(maxGroups) || maxGroups < 1 || maxGroups > 200) {
    throw new Error('Invalid maintenance group cap');
  }
  const groups = new Map<string, GroupDraft>();
  let rejectedMalformedCount = 0;
  for (const value of rows) {
    const valid = validateRow(value);
    if (!valid) { rejectedMalformedCount += 1; continue; }
    const { row, context } = valid;
    const evidence = {
      moduleId: row.module_id, scenarioId: row.scenario_id, contentVersion: row.content_version,
      releaseRef: row.release_ref, defaultsHash: row.defaults_hash, maturity: row.maturity,
      maturityHash: row.maturity_hash, sourceManifestHash: row.source_manifest_hash,
      limitationManifestHash: row.limitation_manifest_hash, fidelityClass: row.fidelity_class,
      practiceRegion: row.practice_region, canonicalUrl: row.canonical_url,
    };
    const keyMaterial = {
      evidence, surface: row.surface, category: row.category,
      noteHash: digest(row.note ?? ''), contextHash: digest(context),
    };
    const groupId = `sha256:${digest(keyMaterial)}`;
    const existing = groups.get(groupId);
    if (existing) {
      existing.reportCount += 1;
      if (row.created_at < existing.firstReceivedAt) existing.firstReceivedAt = row.created_at;
      if (row.created_at > existing.lastReceivedAt) existing.lastReceivedAt = row.created_at;
      existing.minTick = Math.min(existing.minTick, row.simulated_tick);
      existing.maxTick = Math.max(existing.maxTick, row.simulated_tick);
    } else {
      groups.set(groupId, {
        reportCount: 1, firstReceivedAt: row.created_at, lastReceivedAt: row.created_at,
        evidence, surface: row.surface, category: row.category,
        minTick: row.simulated_tick, maxTick: row.simulated_tick,
        note: row.note && row.note.length > 0 ? row.note : null, context,
      });
    }
  }
  const ordered = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const included = ordered.slice(0, maxGroups);
  const overflowCount = ordered.slice(maxGroups)
    .reduce((total, [, group]) => total + group.reportCount, 0);
  return {
    schemaVersion: MAINTENANCE_PROJECTION_SCHEMA_VERSION,
    batchId: options.batchId,
    generatedAt: options.generatedAt,
    sourceWindow: { start: options.windowStart, end: options.windowEnd },
    policyVersion: MAINTENANCE_POLICY_VERSION,
    itemCount: ordered.reduce((total, [, group]) => total + group.reportCount, 0),
    overflowCount,
    rejectedMalformedCount,
    groups: included.map(([groupId, group]) => ({
      groupId,
      reportCount: group.reportCount,
      firstReceivedAt: group.firstReceivedAt,
      lastReceivedAt: group.lastReceivedAt,
      evidence: group.evidence,
      observation: {
        surface: group.surface,
        category: group.category,
        simulatedTickRange: { min: group.minTick, max: group.maxTick },
        notes: group.note ? [{ kind: UNTRUSTED_NOTE_KIND, text: group.note }] : [],
        contexts: group.context ? [group.context] : [],
      },
      workflow: {
        allowedActions: [...ALLOWED_MAINTENANCE_ACTIONS],
        prohibitedActions: [...PROHIBITED_MAINTENANCE_ACTIONS],
      },
    })),
  };
}

export function validateMaintenanceProjection(value: unknown): string[] {
  const errors: string[] = [];
  const topKeys = [
    'schemaVersion', 'batchId', 'generatedAt', 'sourceWindow', 'policyVersion', 'itemCount',
    'overflowCount', 'rejectedMalformedCount', 'groups',
  ];
  if (!isObject(value) || !exactKeys(value, topKeys)) return ['/: expected exact projection object'];
  if (value.schemaVersion !== 1) errors.push('/schemaVersion: expected 1');
  if (typeof value.batchId !== 'string' || !/^[a-zA-Z0-9_.-]{1,100}$/.test(value.batchId)) {
    errors.push('/batchId: expected bounded identifier');
  }
  if (!isIsoDate(value.generatedAt)) errors.push('/generatedAt: expected ISO instant');
  if (!isObject(value.sourceWindow) || !exactKeys(value.sourceWindow, ['start', 'end'])
    || !isIsoDate(value.sourceWindow.start) || !isIsoDate(value.sourceWindow.end)
    || value.sourceWindow.start >= value.sourceWindow.end) {
    errors.push('/sourceWindow: expected exact bounded interval');
  }
  if (value.policyVersion !== MAINTENANCE_POLICY_VERSION) errors.push('/policyVersion: unsupported');
  for (const key of ['itemCount', 'overflowCount', 'rejectedMalformedCount'] as const) {
    if (!Number.isSafeInteger(value[key]) || Number(value[key]) < 0) errors.push(`/${key}: expected nonnegative integer`);
  }
  if (!Array.isArray(value.groups)) return [...errors, '/groups: expected array'];
  const serialized = JSON.stringify(value);
  for (const forbidden of ['reporter_hash', 'dedupe_key', 'turnstile_token', 'resolution_note']) {
    if (serialized.includes(forbidden)) errors.push(`/: forbidden field ${forbidden}`);
  }
  value.groups.forEach((group, index) => {
    if (!isObject(group) || !exactKeys(group, [
      'groupId', 'reportCount', 'firstReceivedAt', 'lastReceivedAt', 'evidence', 'observation', 'workflow',
    ])) { errors.push(`/groups/${index}: expected exact group object`); return; }
    if (typeof group.groupId !== 'string' || !HASH.test(group.groupId)
      || !Number.isSafeInteger(group.reportCount) || Number(group.reportCount) < 1
      || !isIsoDate(group.firstReceivedAt) || !isIsoDate(group.lastReceivedAt)
      || String(group.firstReceivedAt) > String(group.lastReceivedAt)) {
      errors.push(`/groups/${index}: invalid identity, count, or interval`);
    }
    const evidenceKeys = [
      'moduleId', 'scenarioId', 'contentVersion', 'releaseRef', 'defaultsHash', 'maturity',
      'maturityHash', 'sourceManifestHash', 'limitationManifestHash', 'fidelityClass',
      'practiceRegion', 'canonicalUrl',
    ];
    if (!isObject(group.evidence) || !exactKeys(group.evidence, evidenceKeys)
      || typeof group.evidence.moduleId !== 'string' || !ID.test(group.evidence.moduleId)
      || typeof group.evidence.scenarioId !== 'string' || !ID.test(group.evidence.scenarioId)
      || typeof group.evidence.contentVersion !== 'string'
      || !/^\d+\.\d+\.\d+$/.test(group.evidence.contentVersion)
      || typeof group.evidence.releaseRef !== 'string'
      || !/^git:[a-f0-9]{40}$/.test(group.evidence.releaseRef)
      || typeof group.evidence.defaultsHash !== 'string' || !HASH.test(group.evidence.defaultsHash)
      || typeof group.evidence.maturity !== 'string' || !MATURITIES.has(group.evidence.maturity)
      || typeof group.evidence.maturityHash !== 'string' || !HASH.test(group.evidence.maturityHash)
      || typeof group.evidence.sourceManifestHash !== 'string'
      || !HASH.test(group.evidence.sourceManifestHash)
      || typeof group.evidence.limitationManifestHash !== 'string'
      || !HASH.test(group.evidence.limitationManifestHash)
      || typeof group.evidence.fidelityClass !== 'string'
      || !FIDELITIES.has(group.evidence.fidelityClass)
      || typeof group.evidence.practiceRegion !== 'string'
      || !/^[A-Z]{2,8}$/.test(group.evidence.practiceRegion)
      || group.evidence.canonicalUrl
        !== `https://opensimlab.com/${group.evidence.moduleId}/scenario/${group.evidence.scenarioId}`) {
      errors.push(`/groups/${index}/evidence: expected exact immutable evidence`);
    }
    if (!isObject(group.observation) || !exactKeys(group.observation, [
      'surface', 'category', 'simulatedTickRange', 'notes', 'contexts',
    ])) {
      errors.push(`/groups/${index}/observation: expected exact object`);
    } else {
      if (typeof group.observation.surface !== 'string' || !SURFACES.has(group.observation.surface)
        || typeof group.observation.category !== 'string' || !CATEGORIES.has(group.observation.category)
        || !isObject(group.observation.simulatedTickRange)
        || !exactKeys(group.observation.simulatedTickRange, ['min', 'max'])
        || !Number.isSafeInteger(group.observation.simulatedTickRange.min)
        || !Number.isSafeInteger(group.observation.simulatedTickRange.max)
        || Number(group.observation.simulatedTickRange.min) < 0
        || Number(group.observation.simulatedTickRange.min) > Number(group.observation.simulatedTickRange.max)) {
        errors.push(`/groups/${index}/observation: invalid surface, category, or tick range`);
      }
      if (!Array.isArray(group.observation.contexts) || group.observation.contexts.length > 1
        || group.observation.contexts.some((context) => parseContext(JSON.stringify(context)) === undefined)) {
        errors.push(`/groups/${index}/observation/contexts: expected bounded structured context`);
      }
    }
    if (!isObject(group.workflow) || !exactKeys(group.workflow, ['allowedActions', 'prohibitedActions'])
      || stable(group.workflow.allowedActions) !== stable(ALLOWED_MAINTENANCE_ACTIONS)
      || stable(group.workflow.prohibitedActions) !== stable(PROHIBITED_MAINTENANCE_ACTIONS)) {
      errors.push(`/groups/${index}/workflow: fixed policy changed`);
    }
    if (isObject(group.observation) && (!Array.isArray(group.observation.notes)
      || group.observation.notes.length > 1
      || group.observation.notes.some((note) => !isObject(note)
        || !exactKeys(note, ['kind', 'text']) || note.kind !== UNTRUSTED_NOTE_KIND
        || typeof note.text !== 'string' || note.text.length > 160))) {
      errors.push(`/groups/${index}/observation/notes: expected bounded untrusted quotations`);
    }
  });
  return errors;
}
