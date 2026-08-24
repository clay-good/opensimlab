import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { ASSET_LICENSE_MANIFEST, assetMatches } from '@platform/catalog/provenance';

const root = process.cwd();
const publicDir = join(root, 'public');
const mediaExtensions = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.woff2', '.mp3', '.wav', '.mp4']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (mediaExtensions.has(extname(full).toLowerCase())) out.push(relative(publicDir, full));
  }
  return out;
}

const failures: string[] = [];
const assets = walk(publicDir).sort();
for (const asset of assets) {
  const records = ASSET_LICENSE_MANIFEST.records.filter((record) => assetMatches(record.match, asset));
  if (records.length !== 1) failures.push(`${asset} has ${records.length} license records; expected exactly 1`);
  const record = records[0];
  if (!record) continue;
  if ('licenseFile' in record && typeof record.licenseFile === 'string'
    && !existsSync(join(publicDir, record.licenseFile))) {
    failures.push(`${asset} references missing license file ${record.licenseFile}`);
  }
  if ('sha256' in record) {
    const actual = createHash('sha256').update(readFileSync(join(publicDir, asset))).digest('hex');
    if (actual !== record.sha256) failures.push(`${asset} hash differs from its provenance record`);
  }
}
for (const record of ASSET_LICENSE_MANIFEST.records) {
  if (!assets.some((asset) => assetMatches(record.match, asset))) failures.push(`${record.match} matches no shipped asset`);
}

if (failures.length > 0) {
  for (const failure of failures) process.stderr.write(`asset-licenses: ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`asset-licenses: ${assets.length} shipped media assets classified\n`);
}
