import type * as FileSystem from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  changedPath: '',
  changedReads: [] as string[],
  writes: new Map<string, string>(),
  mkdir: vi.fn(),
}));

// Keep the authored registry, committed receipts and dependency verifier real.
// Simulate edits only at the file-byte boundary; never mutate repository files.
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof FileSystem>();
  return { ...actual,
    readFileSync: (...args: Parameters<typeof FileSystem.readFileSync>) => {
      const bytes = actual.readFileSync(...args);
      if (String(args[0]) !== harness.changedPath) return bytes;
      harness.changedReads.push(String(args[0]));
      return typeof bytes === 'string' ? `${bytes} ` : Buffer.concat([bytes, Buffer.from(' ')]);
    },
    mkdirSync: harness.mkdir,
    writeFileSync: (path: unknown, data: unknown) => { harness.writes.set(String(path), String(data)); },
  };
});

const dependencies = [
  'src/modules/endocrine-metabolic/hypocalcemia.ts',
  'src/platform/docs/sources.ts',
  'src/platform/governance/records.ts',
  'src/modules/endocrine-metabolic/hypocalcemia-fixtures.ts',
  'src/modules/endocrine-metabolic/hyponatremia-correction.ts',
  'src/modules/endocrine-metabolic/hyponatremia-correction-tutor.ts',
  'src/modules/endocrine-metabolic/hyponatremia-correction-reporting.ts',
  'src/modules/endocrine-metabolic/demo/useHyponatremiaCorrectionDemonstration.ts',
  'tests/integration/hyponatremia-demonstration-session.test.tsx',
  'src/modules/endocrine-metabolic/avp-deficiency.ts',
  'src/modules/endocrine-metabolic/avp-deficiency-tutor.ts',
  'src/modules/endocrine-metabolic/avp-deficiency-reporting.ts',
  'src/modules/endocrine-metabolic/avp-deficiency-fixtures.ts',
  'src/modules/endocrine-metabolic/avp-deficiency-quality.ts',
  'src/modules/endocrine-metabolic/AvpDeficiencyTray.tsx',
  'src/modules/endocrine-metabolic/demo/useAvpDeficiencyDemonstration.ts',
  'tests/integration/avp-deficiency-demonstration-session.test.tsx',
  'tests/unit/avp-deficiency-quality.test.ts',
];
const consumers = ['build', 'development gate', 'preview release', 'reviewed release'] as const;
type Consumer = typeof consumers[number];

async function consume(consumer: Consumer) {
  if (consumer === 'build') await import('../../scripts/build-completion-catalog');
  else {
    if (consumer === 'preview release') process.argv.push('--release', '--channel=preview');
    if (consumer === 'reviewed release') process.argv.push('--release', '--channel=reviewed');
    (await import('../../scripts/check-review-gate')).main();
  }
}

describe('Committed quality dependency receipts guard the actual catalog and release consumers', () => {
  let argv: string[];
  beforeEach(() => {
    vi.resetModules(); harness.changedPath = ''; harness.changedReads.length = 0;
    harness.writes.clear(); harness.mkdir.mockClear();
    argv = process.argv; process.argv = [process.execPath, 'quality-dependency-consumers.test.ts'];
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('Unexpected publication evaluation'); });
  });
  afterEach(() => { process.argv = argv; vi.restoreAllMocks(); });

  it('uses literal production receipts without refreshing them during a successful build or development check', async () => {
    const registry = await import('../../scripts/quality-records');
    const before = JSON.stringify(registry.QUALITY_DEPENDENCY_RECEIPTS);
    expect(registry.QUALITY_DEPENDENCY_RECEIPTS).toHaveLength(3);
    const covered = registry.QUALITY_DEPENDENCY_RECEIPTS.flatMap((receipt) => receipt.files.map(({ path }) => path));
    for (const path of dependencies) expect(covered).toContain(path);
    await consume('build');
    expect([...harness.writes.keys()].filter((path) => path.endsWith('-quality-audit.json'))).toHaveLength(11);
    for (const [path, content] of harness.writes) {
      if (!path.endsWith('-quality-audit.json')) continue;
      const audit = JSON.parse(content) as { playableScenarioCount: number };
      expect(audit.playableScenarioCount).toBe(0);
    }
    const buildWrites = [...harness.writes];
    await consume('development gate');
    expect([...harness.writes]).toEqual(buildWrites);
    expect(JSON.stringify(registry.QUALITY_DEPENDENCY_RECEIPTS)).toBe(before);
    expect([...harness.writes.keys()].some((path) => /quality-(?:dependencies|records)/.test(path))).toBe(false);
    expect(process.exit).not.toHaveBeenCalled();
  });

  for (const consumer of consumers) {
    it.each(dependencies)(`${consumer} refuses a same-version byte change in %s before output or writes`, async (path) => {
      const registry = await import('../../scripts/quality-records');
      const before = JSON.stringify(registry.QUALITY_DEPENDENCY_RECEIPTS);
      harness.changedPath = join(process.cwd(), path);
      await expect(consume(consumer)).rejects.toThrow(path);
      expect(harness.changedReads).toContain(harness.changedPath);
      expect(harness.writes.size).toBe(0);
      expect(harness.mkdir).not.toHaveBeenCalled();
      expect(process.stdout.write).not.toHaveBeenCalled();
      expect(process.stderr.write).not.toHaveBeenCalled();
      expect(process.exit).not.toHaveBeenCalled();
      expect(JSON.stringify(registry.QUALITY_DEPENDENCY_RECEIPTS)).toBe(before);
    });
  }
});
