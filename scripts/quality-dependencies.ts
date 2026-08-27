/** Build-only evidence receipts. Verification never writes or refreshes an authored receipt. */
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validateScenarioQualityRecord, type QualityRecordEnvelope } from '../src/platform/catalog/scenario-quality';

export interface QualityDependencyReceipt {
  readonly moduleId: string;
  readonly scenarioId: string;
  readonly contentVersion: string;
  readonly algorithm: 'sha256-files-v1';
  readonly recordsSha256: string;
  readonly files: readonly { readonly path: string; readonly sha256: string }[];
}

/** Conservative shared boundaries in addition to every local reference in the evidence. */
export const QUALITY_SHARED_DEPENDENCIES = [
  'src/modules/anesthesia/engine.ts',
  'src/modules/anesthesia/catalog/scenario-completion.ts',
  'src/modules/anesthesia/region/profiles.ts',
  'src/platform/catalog/scenario-quality.ts',
  'src/platform/catalog/maturity.ts',
  'src/platform/docs/sources.ts',
  'src/platform/docs/limitations.ts',
  'src/platform/governance/records.ts',
  'src/platform/governance/review-gate.ts',
  'src/platform/governance/publication.ts',
  'src/platform/governance/review-notes.ts',
  'src/platform/tokens/base.css',
  'package-lock.json',
] as const;

const digest = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const hex = /^[a-f0-9]{64}$/;
const id = /^[a-z0-9-]+$/;
const version = /^\d+\.\d+\.\d+$/;
function fail(message: string): never { throw new Error(`quality dependencies: ${message}`); }

function object(value: unknown, fields: readonly string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  const keys = Reflect.ownKeys(value);
  return keys.length === fields.length && keys.every((key) => typeof key === 'string'
    && fields.includes(key) && Object.getOwnPropertyDescriptor(value, key)?.enumerable
    && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key)!, 'value'));
}
function array(value: unknown): value is unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return false;
  const keys = Reflect.ownKeys(value).filter((key) => key !== 'length');
  return keys.length === value.length && keys.every((key, index) => key === String(index)
    && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key)!, 'value'));
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, entry]) => [key, canonical(entry)]));
  return value;
}
function validatedRecords(records: readonly QualityRecordEnvelope[]): void {
  if (!array(records)) fail('expected a dense record array');
  for (const record of records) {
    if (!object(record, ['moduleId', 'kind', 'record']) || typeof record.moduleId !== 'string'
      || !id.test(record.moduleId) || typeof record.kind !== 'string'
      || validateScenarioQualityRecord(record.kind, record.record).length) fail('invalid quality record');
  }
}

/** Order-independent across kinds, but preserves the meaning of arrays inside each payload. */
export function qualityRecordsSha256(records: readonly QualityRecordEnvelope[]): string {
  validatedRecords(records);
  return digest(JSON.stringify(records.map(canonical).map((record) => JSON.stringify(record)).sort()));
}

/** Only explicit local references are paths. URLs and narrative text are never fetched or executed. */
export function qualityReferencedFiles(records: readonly QualityRecordEnvelope[]): string[] {
  validatedRecords(records);
  const paths = new Set<string>(QUALITY_SHARED_DEPENDENCIES);
  function visit(value: unknown): void {
    if (typeof value === 'string') {
      const localText = value.replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, '');
      for (const match of localText.matchAll(/(?<![\w/.:~-])(?:\.\/)?((?:src|tests|docs)\/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+)(?=$|[\s#:,;)\]}'"`]|\.(?=\s|$))/g)) paths.add(match[1]!);
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  }
  records.forEach(visit);
  return [...paths].sort();
}

export function assertQualityDependencies(
  records: readonly QualityRecordEnvelope[], receipts: readonly QualityDependencyReceipt[], root: string,
): void {
  validatedRecords(records);
  if (!array(receipts)) fail('expected a dense receipt array');
  const groups = new Map<string, QualityRecordEnvelope[]>();
  for (const record of records) {
    const payload = record.record as { scenarioId: string; contentVersion: string };
    const key = `${record.moduleId}:${payload.scenarioId}@${payload.contentVersion}`;
    const group = groups.get(key) ?? [];
    if (group.some((entry) => entry.kind === record.kind)) fail(`${key}: duplicate quality kind ${record.kind}`);
    group.push(record); groups.set(key, group);
  }
  const seen = new Set<string>();
  const errors: string[] = [];
  const repository = realpathSync(root);
  for (const receipt of receipts) {
    if (!object(receipt, ['moduleId', 'scenarioId', 'contentVersion', 'algorithm', 'recordsSha256', 'files'])
      || typeof receipt.moduleId !== 'string' || !id.test(receipt.moduleId)
      || typeof receipt.scenarioId !== 'string' || !id.test(receipt.scenarioId)
      || typeof receipt.contentVersion !== 'string' || !version.test(receipt.contentVersion)
      || receipt.algorithm !== 'sha256-files-v1' || typeof receipt.recordsSha256 !== 'string'
      || !hex.test(receipt.recordsSha256) || !array(receipt.files) || receipt.files.length === 0) fail('invalid receipt');
    const key = `${receipt.moduleId}:${receipt.scenarioId}@${receipt.contentVersion}`;
    if (seen.has(key)) fail(`${key}: duplicate receipt`);
    seen.add(key);
    const group = groups.get(key);
    if (!group) fail(`${key}: receipt has no matching quality records`);
    if (qualityRecordsSha256(group) !== receipt.recordsSha256) errors.push(`${key}: quality record payload changed`);
    const paths = new Set<string>();
    for (const file of receipt.files) {
      if (!object(file, ['path', 'sha256']) || typeof file.path !== 'string'
        || !/^(?:src\/|tests\/|docs\/|package-lock\.json$)/.test(file.path)
        || !/^[A-Za-z0-9_./-]+$/.test(file.path) || file.path.split('/').some((part) => ['', '.', '..'].includes(part))
        || typeof file.sha256 !== 'string' || !hex.test(file.sha256)) fail(`${key}: invalid dependency file`);
      if (paths.has(file.path)) fail(`${key}: duplicate dependency ${file.path}`);
      paths.add(file.path);
      const path = join(repository, file.path);
      try {
        // Refuse symlink files and symlink ancestors, including links to another in-repo file.
        if (realpathSync(path) !== resolve(repository, file.path) || !lstatSync(path).isFile()) {
          errors.push(`${key}: dependency is not a regular in-repository file: ${file.path}`); continue;
        }
        if (digest(readFileSync(path)) !== file.sha256) errors.push(`${key}: dependency changed: ${file.path}`);
      } catch {
        errors.push(`${key}: dependency missing or unreadable: ${file.path}`);
      }
    }
    for (const path of qualityReferencedFiles(group)) {
      if (!paths.has(path)) errors.push(`${key}: receipt omits required dependency: ${path}`);
    }
  }
  for (const key of groups.keys()) if (!seen.has(key)) errors.push(`${key}: missing dependency receipt`);
  if (errors.length) fail(`stale or incomplete evidence; revalidate before replacing the receipt:\n${errors.join('\n')}`);
}
