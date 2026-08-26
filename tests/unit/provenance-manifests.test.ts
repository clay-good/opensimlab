import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ASSET_LICENSE_MANIFEST, assetMatches, buildEvidenceSourceManifest,
} from '@platform/catalog/provenance';
import { SOURCES } from '@platform/docs/sources';

const root = process.cwd();
const publicDir = join(root, 'public');
const mediaExtensions = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.woff2', '.mp3', '.wav', '.mp4']);

function media(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) media(full, out);
    else if (mediaExtensions.has(extname(full).toLowerCase())) out.push(relative(publicDir, full));
  }
  return out;
}

describe('public provenance manifests', () => {
  it('classifies every shipped media asset exactly once', () => {
    const assets = media(publicDir);
    expect(assets).toHaveLength(186);
    for (const asset of assets) {
      expect(ASSET_LICENSE_MANIFEST.records.filter((record) => assetMatches(record.match, asset)), asset)
        .toHaveLength(1);
    }
    for (const record of ASSET_LICENSE_MANIFEST.records) {
      expect(assets.some((asset) => assetMatches(record.match, asset)), record.match).toBe(true);
    }
    expect(ASSET_LICENSE_MANIFEST.records.some((record) => assetMatches(record.match, 'new-unlicensed.png')))
      .toBe(false);
  });

  it('publishes the checked-in asset manifest without drift', () => {
    const published = JSON.parse(readFileSync(join(publicDir, 'catalog/asset-licenses.json'), 'utf8'));
    expect(published).toEqual(ASSET_LICENSE_MANIFEST);
  });

  it('publishes every authoritative evidence source once and without invented verification', () => {
    const manifest = buildEvidenceSourceManifest(SOURCES);
    const published = JSON.parse(readFileSync(join(publicDir, 'catalog/evidence-sources.json'), 'utf8'));
    expect(published).toEqual(manifest);
    expect(manifest.sourceCount).toBe(SOURCES.length);
    expect(new Set(manifest.sources.map((source) => source.id)).size).toBe(SOURCES.length);
    for (const source of manifest.sources) {
      expect(source.locator.length).toBeGreaterThan(2);
      expect(source.usedFor.length).toBeGreaterThan(20);
      expect(source.verifiedAgainst.length).toBeGreaterThan(10);
      expect(source.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (source.pmid) expect(source.publicLocator).toBe(`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`);
    }
  });
});
