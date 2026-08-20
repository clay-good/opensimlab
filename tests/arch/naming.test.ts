/**
 * The product name is written one way and one way only.
 *
 * "Open Sim Lab" as three words. Not "Open-SimLab", not "OpenSimLab", not
 * "Open SimLab". The domain stays `opensimlab.com` and the package stays
 * `opensimlab`, because those are identifiers rather than the name.
 *
 * A name that drifts across a repository reads as carelessness in a project
 * asking a clinician to trust its numbers, so it is a build failure here.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../..', import.meta.url));

/** The forms that are wrong wherever they appear as the product's name. */
const WRONG_FORMS = [/Open-SimLab/g, /OpenSimLab/g, /Open SimLab/g, /open-simlab/g];

/** Where the lowercase identifier is legitimate: a domain, a package, a path. */
const IDENTIFIER_CONTEXT = /opensimlab\.com|opensimlab\/|"opensimlab"|\/opensimlab|opensimlab-|opensimlab@|opensimlab\./;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git', 'coverage'].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx', '.css', '.md', '.html', '.json', '.yaml', '.yml', '.js', '.webmanifest'].includes(extname(full))) {
      out.push(full);
    }
  }
  return out;
}

describe('The product name', () => {
  const files = walk(root)
    .filter((path) => !relative(root, path).startsWith('.claude'))
    .filter((path) => relative(root, path) !== 'package-lock.json')
    .map((path) => ({ path: relative(root, path), text: readFileSync(path, 'utf8') }));

  it('is written "Open Sim Lab" everywhere, and never any other way', () => {
    for (const file of files) {
      if (file.path === 'tests/arch/naming.test.ts') continue;
      for (const form of WRONG_FORMS) {
        const matches = [...file.text.matchAll(form)];
        for (const match of matches) {
          const line = file.text.slice(0, match.index).split('\n').length;
          const context = file.text.split('\n')[line - 1] ?? '';
          // The lowercase form is fine as a domain, a package name, or a path.
          if (form.source === 'open-simlab' || IDENTIFIER_CONTEXT.test(context)) continue;
          expect.fail(`${file.path}:${line} writes the name as "${match[0]}": ${context.trim().slice(0, 100)}`);
        }
      }
    }
  });

  it('really does use the name, so this test is not vacuous', () => {
    const uses = files.filter((file) => file.text.includes('Open Sim Lab'));
    expect(uses.length).toBeGreaterThan(10);
  });

  it('keeps the domain and the package identifier lowercase and unhyphenated', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name: string };
    expect(manifest.name).toBe('opensimlab');
    const webmanifest = JSON.parse(readFileSync(join(root, 'public/manifest.webmanifest'), 'utf8')) as {
      name: string; short_name: string;
    };
    expect(webmanifest.name).toBe('Open Sim Lab');
    expect(webmanifest.short_name).toBe('Open Sim Lab');
    expect(readFileSync(join(root, 'src/routes/routes.ts'), 'utf8')).toContain("SITE_ORIGIN = 'https://opensimlab.com'");
    expect(readFileSync(join(root, 'src/routes/routes.ts'), 'utf8')).toContain("SITE_NAME = 'Open Sim Lab'");
  });
});
