/**
 * The dependency-graph test
 * (engine/pharmacology → The dependency graph is clean).
 *
 * No package or path reference to Hypnos or any other pharmacology dataset exists,
 * and the pharmacology modules import nothing outside this repository.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MODELS } from '@anesthesia/pharmacology/registry';

const root = fileURLToPath(new URL('../..', import.meta.url));

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git'].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx', '.json', '.yaml', '.yml'].includes(extname(full))) out.push(full);
  }
  return out;
}

describe('Scenario: The dependency graph is clean', () => {
  it('references no external pharmacology dataset, by package or by path', () => {
    const manifest = readFileSync(join(root, 'package.json'), 'utf8');
    expect(manifest.toLowerCase()).not.toContain('hypnos');

    const files = walk(join(root, 'src')).concat(walk(join(root, 'scripts')));
    for (const path of files) {
      const text = readFileSync(path, 'utf8');
      const rel = relative(root, path);
      // The provenance note and the README explain the relationship in prose; no
      // SOURCE file may reference it as a dependency.
      for (const match of text.matchAll(/(?:import|require|from)\s*\(?\s*['"]([^'"]+)['"]/g)) {
        const specifier = match[1] ?? '';
        expect(specifier.toLowerCase(), `${rel} imports ${specifier}`).not.toContain('hypnos');
        expect(specifier.toLowerCase(), `${rel} imports ${specifier}`).not.toMatch(/pkpd-?dataset|tci-?data|opentci/);
      }
    }
  });

  it('has no vendored dataset directory', () => {
    const entries = readdirSync(root);
    for (const forbidden of ['vendor', 'vendored', 'datasets', 'third_party']) {
      expect(entries, `a ${forbidden}/ directory exists`).not.toContain(forbidden);
    }
  });

  it('performs no build-time or runtime fetch of pharmacology data', () => {
    const files = walk(join(root, 'src')).concat(walk(join(root, 'scripts')));
    for (const path of files) {
      const text = readFileSync(path, 'utf8');
      const rel = relative(root, path);
      if (rel.startsWith('tests/')) continue;
      // The service worker fetches same-origin application assets only; nothing
      // anywhere fetches model parameters.
      expect(text, `${rel} fetches pharmacology data`)
        .not.toMatch(/fetch\([^)]*(model|parameter|pkpd|drug)[^)]*\)/i);
    }
  });

  it('Scenario: A model file is self-describing', () => {
    for (const model of MODELS) {
      // One typed object declaring everything the requirement lists.
      expect(model.id.length).toBeGreaterThan(3);
      expect(model.drugId.length).toBeGreaterThan(3);
      expect([1, 2, 3]).toContain(model.compartments);
      expect(typeof model.parameters).toBe('function');
      expect(model.envelope).toBeDefined();
      expect(Array.isArray(model.failureModes)).toBe(true);
      expect(model.citation.authors.length).toBeGreaterThan(3);
      expect(model.notes.length).toBeGreaterThan(40);
      expect(model.concentrationUnit.length).toBeGreaterThan(1);
      expect(model.doseUnit.length).toBeGreaterThan(0);
      expect(model.requiredCovariates.length).toBeGreaterThan(0);
    }
  });
});

describe('Requirement: Continuous Integration Works From A Clean Checkout', () => {
  it('builds generated artifacts before the full test suite reads them', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    const workflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
    const ci = manifest.scripts.ci ?? '';

    expect(ci.indexOf('npm run build')).toBeGreaterThanOrEqual(0);
    expect(ci.indexOf('npm run test')).toBeGreaterThan(ci.indexOf('npm run build'));
    expect(workflow.indexOf('- name: Build')).toBeGreaterThanOrEqual(0);
    expect(workflow.indexOf('- name: Tests')).toBeGreaterThan(workflow.indexOf('- name: Build'));
  });

  it('does not mistake the measurement instructions for a device result', () => {
    const workflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
    const frameBudgetJob = workflow.slice(workflow.indexOf('frame-budget-status:'));

    expect(frameBudgetJob).toContain("-name '*.json'");
    expect(frameBudgetJob).not.toContain('ls -A docs/measurements');
  });
});
