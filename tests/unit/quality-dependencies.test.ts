import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { QualityRecordEnvelope } from '@platform/catalog/scenario-quality';
import {
  assertQualityDependencies, QUALITY_SHARED_DEPENDENCIES, qualityRecordsSha256,
  type QualityDependencyReceipt,
} from '../../scripts/quality-dependencies';

// These temporary files and records are synthetic checker fixtures, not review evidence.
const identity = { moduleId: 'synthetic-module', scenarioId: 'synthetic-scenario', contentVersion: '0.1.0' };
const model = 'src/modules/synthetic/model.ts';
const scenario = 'src/modules/synthetic/scenario.ts';
const replay = 'tests/unit/synthetic.test.ts';
const brief = 'docs/evidence-briefs/synthetic.md';
const evidence = 'Synthetic dependency-checker fixture only.';
const sha256 = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');

function records(): QualityRecordEnvelope[] {
  const recordIdentity = { schemaVersion: 1, scenarioId: identity.scenarioId, contentVersion: identity.contentVersion };
  return [
    { moduleId: identity.moduleId, kind: 'training-value', record: { ...recordIdentity,
      fictionalTimeEvolvingState: true, incompleteInformation: true, learnerAction: true,
      consequence: true, reassessment: true, causalDebrief: true, staticOutputSubstitute: false,
      evidence: [`${model}#check`, replay, brief, evidence] } },
    { moduleId: identity.moduleId, kind: 'authored-defaults', record: { ...recordIdentity,
      defaults: [{ id: 'synthetic-value', category: 'time-scale', value: 1,
        sourceRefs: [scenario, 'https://doi.org/10.1530/EC-16-0056'], rationale: evidence,
        practiceRegions: ['US'], applicability: evidence, educationalEffect: evidence }] } },
  ];
}

describe('quality dependency receipts bind evidence to exact local bytes', () => {
  let root: string; let input: QualityRecordEnvelope[]; let receipt: QualityDependencyReceipt;
  function write(path: string, value = `Synthetic file: ${path}\n`) {
    mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), value);
  }
  function check(receipts: readonly QualityDependencyReceipt[] = [receipt], values = input) {
    return () => assertQualityDependencies(values, receipts, root);
  }
  function snapshot() {
    return readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => [join(entry.parentPath, entry.name), sha256(readFileSync(join(entry.parentPath, entry.name)))])
      .sort(([a], [b]) => a!.localeCompare(b!));
  }
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'opensimlab-quality-dependencies-'));
    input = records();
    const paths = [...new Set([...QUALITY_SHARED_DEPENDENCIES, model, scenario, replay, brief])];
    for (const path of paths) write(path);
    receipt = { ...identity, algorithm: 'sha256-files-v1', recordsSha256: qualityRecordsSha256(input),
      files: paths.map((path) => ({ path, sha256: sha256(readFileSync(join(root, path))) })) };
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  it('accepts an exact receipt without changing records, receipts, or files', () => {
    const before = { input: JSON.stringify(input), receipt: JSON.stringify(receipt), files: snapshot() };
    expect(check()).not.toThrow();
    expect({ input: JSON.stringify(input), receipt: JSON.stringify(receipt), files: snapshot() }).toEqual(before);
  });

  it('canonicalizes object keys and envelope order, but not evidence-array order', () => {
    const reordered = [...input].reverse().map((entry) => ({
      record: Object.fromEntries(Object.entries(entry.record as Record<string, unknown>).reverse()),
      kind: entry.kind, moduleId: entry.moduleId,
    }));
    expect(qualityRecordsSha256(reordered)).toBe(receipt.recordsSha256);
    expect(check([{ ...receipt, files: [...receipt.files].reverse() }], reordered)).not.toThrow();
    const changed = structuredClone(input);
    const body = changed[0]!.record as { evidence: string[] }; body.evidence.reverse();
    expect(qualityRecordsSha256(changed)).not.toBe(receipt.recordsSha256);
    expect(check([receipt], changed)).toThrow();
  });

  it('ignores changes to files outside the declared dependency set', () => {
    write('docs/unrelated.md', 'Unrelated change.'); expect(check()).not.toThrow();
  });

  it('does not mistake external URL paths for local evidence dependencies', () => {
    const changed = structuredClone(input); const body = changed[0]!.record as { evidence: string[] };
    body.evidence.push('https://example.invalid/src/model.ts',
      'https://example.invalid/tests/unit/example.test.ts', 'https://example.invalid/docs/evidence.md',
      'https://example.invalid/?file=src/model.ts', 'https://example.invalid/#docs/evidence.md');
    expect(check([{ ...receipt, recordsSha256: qualityRecordsSha256(changed) }], changed)).not.toThrow();
  });

  it('normalizes explicit dot-relative local references before checking coverage', () => {
    const changed = structuredClone(input); const body = changed[0]!.record as { evidence: string[] };
    body.evidence = [`./${model}#check`, `See \`${replay}\`.`, `(${brief}).`];
    const updated = { ...receipt, recordsSha256: qualityRecordsSha256(changed) };
    expect(check([updated], changed)).not.toThrow();
    expect(check([{ ...updated, files: updated.files.filter((file) => file.path !== model) }], changed))
      .toThrow(`receipt omits required dependency: ${model}`);
  });

  it.each(['src/modules/synthetic/new.js', 'tests/unit/new.test.mjs', 'docs/new.md.backup'])('requires the complete local filename %s', (path) => {
    const changed = structuredClone(input); const body = changed[0]!.record as { evidence: string[] };
    body.evidence.push(`${path}: verification evidence.`);
    const updated = { ...receipt, recordsSha256: qualityRecordsSha256(changed) };
    expect(check([updated], changed)).toThrow(`receipt omits required dependency: ${path}`);
    write(path);
    expect(check([{ ...updated, files: [...updated.files, { path, sha256: sha256(readFileSync(join(root, path))) }] }], changed))
      .not.toThrow();
  });

  it.each(['moduleId', 'scenarioId', 'contentVersion', 'kind', 'body'] as const)('binds the record %s into the payload digest', (field) => {
    const changed = structuredClone(input); const first = changed[0]!;
    const body = first.record as Record<string, unknown>;
    if (field === 'moduleId') changed[0] = { ...first, moduleId: 'different-module' };
    else if (field === 'kind') changed[0] = { ...first, kind: 'scenario-hazard' };
    else if (field === 'body') body.evidence = [...body.evidence as string[], 'Changed synthetic claim.'];
    else body[field] = field === 'scenarioId' ? 'different-scenario' : '0.1.1';
    if (field === 'kind') expect(() => qualityRecordsSha256(changed)).toThrow('invalid quality record');
    else expect(qualityRecordsSha256(changed)).not.toBe(receipt.recordsSha256);
    expect(check([receipt], changed)).toThrow();
  });

  it.each([model, scenario, replay, brief, ...QUALITY_SHARED_DEPENDENCIES])('rejects changed dependency bytes: %s', (path) => {
    write(path, 'Changed after the receipt was authored.'); expect(check()).toThrow();
  });

  it('rejects a missing referenced file', () => {
    rmSync(join(root, model)); expect(check()).toThrow();
  });

  it.each([model, replay, brief, ...QUALITY_SHARED_DEPENDENCIES])('rejects omitted dependency coverage: %s', (path) => {
    expect(check([{ ...receipt, files: receipt.files.filter((file) => file.path !== path) }])).toThrow();
  });

  it('rejects duplicate file paths even when the hashes agree', () => {
    expect(check([{ ...receipt, files: [...receipt.files, receipt.files[0]!] }])).toThrow();
  });

  it('rejects an empty file receipt', () => {
    expect(check([{ ...receipt, files: [] }])).toThrow();
  });

  it.each(['/tmp/outside.ts', '../outside.ts', 'src/../outside.ts', './src/model.ts',
    'src//model.ts', 'src\\model.ts', 'src/model.ts#fragment', 'src/model.ts?query', ''])('rejects noncanonical file path %j', (path) => {
    expect(check([{ ...receipt, files: [...receipt.files, { path, sha256: sha256('unused') }] }])).toThrow('invalid dependency file');
  });

  it('rejects a symlink file even when it resolves to matching bytes inside the root', () => {
    const value = readFileSync(join(root, model)); write('src/real-model.ts', value.toString());
    rmSync(join(root, model)); symlinkSync(join(root, 'src/real-model.ts'), join(root, model));
    expect(check()).toThrow('dependency is not a regular in-repository file');
  });

  it('rejects a symlink ancestor even when the target is inside the root', () => {
    write('src/real-directory/source.ts');
    symlinkSync(join(root, 'src/real-directory'), join(root, 'src/linked-directory'));
    const path = 'src/linked-directory/source.ts';
    expect(check([{ ...receipt, files: [...receipt.files,
      { path, sha256: sha256(readFileSync(join(root, path))) }] }])).toThrow('dependency is not a regular in-repository file');
  });

  it('rejects a directory in place of a regular file', () => {
    rmSync(join(root, model)); mkdirSync(join(root, model)); expect(check()).toThrow();
  });

  it('rejects an unsupported digest algorithm', () => {
    expect(check([{ ...receipt, algorithm: 'sha256' } as unknown as QualityDependencyReceipt])).toThrow();
  });

  it.each(['', 'abc', 'A'.repeat(64), 'g'.repeat(64), '0'.repeat(63)])('rejects malformed file and record hashes: %j', (hash) => {
    expect(check([{ ...receipt, recordsSha256: hash }])).toThrow();
    expect(check([{ ...receipt, files: receipt.files.map((file, index) => index === 0 ? { ...file, sha256: hash } : file) }])).toThrow();
  });

  it('requires a receipt for every supplied scenario group', () => {
    expect(check([])).toThrow();
    const second = input.map((entry) => ({ ...entry, record: { ...entry.record as Record<string, unknown>, scenarioId: 'second-scenario' } }));
    expect(check([receipt], [...input, ...second])).toThrow();
  });

  it('rejects orphan and duplicate receipts', () => {
    expect(check([receipt], [])).toThrow();
    expect(check([receipt, receipt])).toThrow();
    expect(check([receipt, { ...receipt, scenarioId: 'unregistered-scenario' }])).toThrow();
  });

  it('rejects a stale content version even with the current payload digest', () => {
    expect(check([{ ...receipt, contentVersion: '0.0.9' }])).toThrow();
  });

  it.each([null, {}, { extra: true }])('rejects malformed receipt shape: %j', (value) => {
    const invalid = value && 'extra' in value ? { ...receipt, ...value } : value;
    expect(check([invalid as unknown as QualityDependencyReceipt])).toThrow();
  });

  it('does not repair stale receipts or rewrite changed files on failure', () => {
    write(model, 'Changed model must remain changed.');
    const before = { receipt: JSON.stringify(receipt), files: snapshot() };
    expect(check()).toThrow();
    expect({ receipt: JSON.stringify(receipt), files: snapshot() }).toEqual(before);
  });
});
