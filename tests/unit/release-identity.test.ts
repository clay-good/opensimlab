/**
 * Acceptance tests for platform/sustainability → the project states its real
 * status rather than implying more maturity than it has.
 *
 * Open Sim Lab publishes in one state. These tests hold the two halves of that:
 * the build identifies itself by date and commit rather than by a stage, and no
 * staged-release word survives in anything a reader receives.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CAPABILITY_VERSION_EXEMPTION, findMaturityLabels, packageVersionFinding, scanRepository,
} from '../../scripts/check-maturity-labels';
import { APP_VERSION, HONEST_STATUS } from '@platform/governance/status';
import { MATURITY_LABELS } from '@platform/governance/publication';

const root = process.cwd();

describe('Requirement: One Published State', () => {
  it('identifies the build without naming a maturity stage', () => {
    expect(APP_VERSION).not.toMatch(/\b(alpha|beta|rc)\b/i);
    // A test run is a source checkout, which has no injected identifier and says so.
    expect(APP_VERSION).toBe('unreleased');
  });

  it('declares a package version carrying no prerelease', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string };
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(packageVersionFinding(root)).toBeNull();
  });

  it('states the one label the corpus ships under, in the same words as the marker', () => {
    expect(HONEST_STATUS.headline).toBe(`${MATURITY_LABELS.preview}.`);
    expect(HONEST_STATUS.headline).toContain('not clinically reviewed');
    expect(HONEST_STATUS.detail).toContain('No clinician has signed');
  });
});

describe('Requirement: Staged Labels Fail The Build', () => {
  it('finds no staged label in the sources, manifests, or documentation', () => {
    expect(scanRepository(root)).toEqual([]);
  });

  it('flags a prerelease version and the release vocabulary', () => {
    const flagged = [
      'export const APP_VERSION = "0.2.0-alpha.1";',
      'this is a 1.0.0-rc.3 build',
      'available as a public beta',
      'during the beta release',
      'still in alpha',
      'Beta: not clinically reviewed.',
      'the first release candidate',
    ];
    for (const line of flagged) {
      expect(findMaturityLabels('example.md', line), line).not.toEqual([]);
    }
  });

  it('leaves the clinical vocabulary alone', () => {
    const allowed = [
      'the capnogram shows a normal alpha angle',
      'a short-acting beta2-agonist with an anticholinergic',
      'blanket beta blockade is refused and retained in the learning record',
      'beta-hydroxybutyrate 1.2 mmol/L',
      'There is no alpha, beta, or 1.0 here, and no staged content vocabulary either.',
      'distinct from beta-blocker toxicity',
    ];
    for (const line of allowed) {
      expect(findMaturityLabels('example.md', line), line).toEqual([]);
    }
  });

  it('exempts the engine capability version, and only that exact string', () => {
    expect(findMaturityLabels('e.ts', `const V = '${CAPABILITY_VERSION_EXEMPTION}';`)).toEqual([]);
    expect(findMaturityLabels('e.ts', "const V = '0.1.0-alpha.49';")).toHaveLength(1);
  });
});
