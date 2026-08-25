import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const required = [
  'CONTRIBUTING.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md', 'GOVERNANCE.md', 'CORRECTIONS.md',
  'docs/reviewer-guide.md', 'docs/scenario-author-guide.md', 'docs/evidence-brief.md',
  'docs/organizational-endorsement.md',
] as const;

describe('public contribution and governance documentation', () => {
  it('publishes every required guide with an honest current-state marker', () => {
    for (const path of required) {
      expect(existsSync(join(root, path)), path).toBe(true);
      expect(readFileSync(join(root, path), 'utf8').length, path).toBeGreaterThan(400);
    }
    expect(readFileSync(join(root, 'GOVERNANCE.md'), 'utf8')).toContain('Every playable scenario inherits');
    expect(readFileSync(join(root, 'CORRECTIONS.md'), 'utf8')).toContain('Every playable scenario has');
    expect(readFileSync(join(root, 'docs/organizational-endorsement.md'), 'utf8'))
      .toContain('No organization is currently recorded or endorsed.');
  });

  it('distinguishes the implemented reporter from unavailable public repository intake', () => {
    const governance = readFileSync(join(root, 'GOVERNANCE.md'), 'utf8');
    const corrections = readFileSync(join(root, 'CORRECTIONS.md'), 'utf8');
    expect(governance).toContain('isolated Worker');
    expect(corrections).not.toContain('[public repository]');
    expect(`${governance}\n${corrections}`).toContain('repository remains private');
  });

  it('keeps every local Markdown link in the documentation set resolvable', () => {
    for (const path of required) {
      const text = readFileSync(join(root, path), 'utf8');
      for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const target = (match[1] ?? '').split('#')[0] ?? '';
        if (!target || /^(?:https?:|\/)/.test(target)) continue;
        const resolved = normalize(join(root, dirname(path), target));
        expect(existsSync(resolved), `${path} links to missing ${target}`).toBe(true);
      }
    }
  });

  it('keeps evidence, review, endorsement, and correction as distinct acts', () => {
    expect(readFileSync(join(root, 'CONTRIBUTING.md'), 'utf8'))
      .toMatch(/not source verification or\s+clinical review/);
    expect(readFileSync(join(root, 'docs/reviewer-guide.md'), 'utf8')).toContain('A flag is not a signature.');
    expect(readFileSync(join(root, 'docs/organizational-endorsement.md'), 'utf8')).toContain('clinically reviewed');
    expect(readFileSync(join(root, 'CORRECTIONS.md'), 'utf8')).toContain('permanent, public record');
  });
});
