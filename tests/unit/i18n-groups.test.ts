/**
 * interface-translation-first-wave → the catalog is split so the front door
 * downloads only its own words.
 *
 * Every surface's strings in one module put the whole catalog on the landing
 * route, which went over its 150 KB budget as surfaces were externalised. The
 * core stays in `messages.ts`; each other group registers itself when imported.
 * That only works if a file using a group's key imports the group, because `t`
 * throws on a key nothing has registered, and the throw would surface on the
 * route that forgot, in production, not in a test that happened to import the
 * group some other way. This holds the import in the file itself.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { EN_MESSAGES, MESSAGE_GROUPS } from '@platform/i18n/all-messages';

const sourceFiles = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
  .split('\n')
  .filter((path) => /\.tsx?$/.test(path) && !path.startsWith('src/platform/i18n/'));

describe('the split catalog', () => {
  it('defines every key exactly once across the core and the groups', () => {
    const sizes = Object.values(MESSAGE_GROUPS).map((group) => Object.keys(group).length);
    expect(sizes.reduce((sum, size) => sum + size, 0)).toBe(Object.keys(EN_MESSAGES).length);
  });

  it('keeps each namespace in one group, so a namespace names its module', () => {
    const owner = new Map<string, string>();
    for (const [module, group] of Object.entries(MESSAGE_GROUPS)) {
      for (const key of Object.keys(group)) {
        const namespace = key.split('.')[0]!;
        expect(owner.get(namespace) ?? module, `${namespace} is split across groups`).toBe(module);
        owner.set(namespace, module);
      }
    }
  });

  it.each(sourceFiles)('%s imports every group whose keys it uses', (path) => {
    const source = readFileSync(path, 'utf8');
    const literals = new Set([...source.matchAll(/'([a-z0-9-]+\.[a-z0-9.-]+)'/g)].map((match) => match[1]!));
    const templated = new Set([...source.matchAll(/`([a-z0-9-]+)\.\$\{/g)].map((match) => match[1]!));
    for (const [module, group] of Object.entries(MESSAGE_GROUPS)) {
      if (module === 'core') continue;
      const keys = Object.keys(group);
      const namespaces = new Set(keys.map((key) => key.split('.')[0]!));
      const uses = keys.some((key) => literals.has(key)) || [...templated].some((name) => namespaces.has(name));
      if (uses) expect(source, `${path} uses ${module} keys without importing it`).toContain(`@platform/i18n/${module}'`);
    }
  });
});
