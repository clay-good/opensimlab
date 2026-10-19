/**
 * Requirement: Every Release Is Citable As The Version A Check Refers To.
 *
 * The repository's citation file and the about panel's suggested citation name
 * the same work, and the panel names the exact running build. No persistent
 * identifier is claimed, because none has been issued.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SUGGESTED_CITATION, suggestedCitation } from '@landing/content';
import { APP_VERSION } from '@platform/governance/status';

const cff = readFileSync('CITATION.cff', 'utf8');
const field = (key: string) => new RegExp(`^${key}: "?([^"\\n]+)"?$`, 'm').exec(cff)?.[1];
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { license: string };

describe('CITATION.cff', () => {
  it('carries the fields the citation-file format requires', () => {
    expect(field('cff-version')).toBe('1.2.0');
    expect(cff).toMatch(/^message: /m);
    expect(field('type')).toBe('software');
    expect(cff).toMatch(/^authors:\n {2}- family-names: Good\n {4}given-names: Clay$/m);
    expect(cff).not.toMatch(/\t/);
  });

  it('agrees with the package, the repository, and the site', () => {
    expect(field('license')).toBe(pkg.license);
    expect(field('repository-code')).toBe('https://github.com/clay-good/opensimlab');
    expect(field('url')).toBe('https://opensimlab.com');
  });

  it('claims no persistent identifier, because none has been issued', () => {
    expect(cff).not.toMatch(/^(doi|identifiers):/m);
    expect(cff).toContain('No archived persistent');
  });
});

describe('the suggested citation', () => {
  it('names the same title and author as the citation file', () => {
    expect(SUGGESTED_CITATION).toContain(field('title'));
    expect(SUGGESTED_CITATION).toMatch(/^Good C\. /);
  });

  it('names the exact running build and its year', () => {
    const citation = suggestedCitation('2026-10-19+c3083ca41b');
    expect(citation).toContain('release 2026-10-19+c3083ca41b');
    expect(citation).toContain('(2026)');
    expect(citation).toContain('https://opensimlab.com');
    expect(citation).toContain('No archived persistent identifier has been issued yet.');
  });

  it('says a source checkout is unreleased rather than inventing a version', () => {
    expect(APP_VERSION).toBe('unreleased');
    expect(SUGGESTED_CITATION).toContain('an unreleased source build');
    expect(SUGGESTED_CITATION).not.toMatch(/\(\d{4}\)/);
  });
});
