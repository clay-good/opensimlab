import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isPrivateArtifact,
  staticHostFailures,
  unresolvedBuildToken,
} from '../../scripts/check-static-host.ts';

describe('static hosting artifact', () => {
  it('contains every route and public catalog file with no private build residue', () => {
    expect(staticHostFailures(join(process.cwd(), 'dist'))).toEqual([]);
  });

  it('recognizes credential and local platform state wherever it appears', () => {
    expect(isPrivateArtifact('.env')).toBe(true);
    expect(isPrivateArtifact('nested/.env.production')).toBe(true);
    expect(isPrivateArtifact('.wrangler/state/v3/d1/local.sqlite')).toBe(true);
    expect(isPrivateArtifact('keys/deploy.pem')).toBe(true);
    expect(isPrivateArtifact('cloud/credentials.json')).toBe(true);
    expect(isPrivateArtifact('catalog/evidence-sources.json')).toBe(false);
  });

  it('recognizes unresolved service-worker build tokens', () => {
    expect(unresolvedBuildToken("const cache = '__CACHE_VERSION__'"))
      .toBe('__CACHE_VERSION__');
    expect(unresolvedBuildToken('const cache = "v-123"')).toBeUndefined();
  });
});
