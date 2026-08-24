import type { Source } from '@platform/docs/sources';

export interface AssetLicenseRecord {
  readonly match: string;
  readonly kind: 'font' | 'generated-image';
  readonly origin: 'modified-third-party' | 'original-generated';
  readonly source: string;
  readonly author: string;
  readonly license: 'MIT' | 'OFL-1.1';
  readonly licenseFile?: string;
  readonly sha256?: string;
  readonly modification: string;
  readonly redistribution: string;
}

export const ASSET_LICENSE_MANIFEST = {
  schemaVersion: 1,
  records: [
    {
      match: 'fonts/open-sim-lab-inter-latin.woff2', kind: 'font',
      origin: 'modified-third-party', source: 'https://github.com/rsms/inter/releases/tag/v4.1',
      author: 'Rasmus Andersson and the Inter contributors', license: 'OFL-1.1',
      licenseFile: 'fonts/inter-OFL.txt',
      sha256: '7dfb5ab2e136df8836db217661ed52d35dadfad389866e8291e9e3cb9dbac556',
      modification: 'Latin subset; weight limited to 400–700; optical size fixed at 14; renamed Open Sim Lab Inter.',
      redistribution: 'Redistributed under SIL Open Font License 1.1 with the upstream license text.',
    },
    {
      match: 'fonts/jetbrains-mono-latin.woff2', kind: 'font',
      origin: 'modified-third-party', source: 'https://github.com/JetBrains/JetBrainsMono/releases/tag/v2.304',
      author: 'JetBrains and the JetBrains Mono contributors', license: 'OFL-1.1',
      licenseFile: 'fonts/jetbrains-mono-OFL.txt',
      sha256: '26f4a0765a0e74540276a94e0e817892f27f39b4ed63e4926ccdc74caddb3bc3',
      modification: 'Latin subset; variable weight limited to 400–600.',
      redistribution: 'Redistributed under SIL Open Font License 1.1 with the upstream license text.',
    },
    {
      match: 'icon-*.svg', kind: 'generated-image', origin: 'original-generated',
      source: 'scripts/build-og.ts#iconSvg', author: 'Open Sim Lab contributors', license: 'MIT',
      modification: 'Generated deterministically from repository design tokens and waveform geometry.',
      redistribution: 'Original project output distributed under the repository MIT license.',
    },
    {
      match: 'og/*.svg', kind: 'generated-image', origin: 'original-generated',
      source: 'scripts/build-og.ts#ogImage', author: 'Open Sim Lab contributors', license: 'MIT',
      modification: 'Generated deterministically from route metadata, design tokens, and the original hero trace.',
      redistribution: 'Original project output distributed under the repository MIT license.',
    },
  ] satisfies readonly AssetLicenseRecord[],
} as const;

export function assetMatches(pattern: string, path: string): boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`).test(path);
}

export function buildEvidenceSourceManifest(sources: readonly Source[]) {
  return {
    schemaVersion: 1,
    sourceCount: sources.length,
    sources: sources.map((source) => ({
      ...source,
      ...(source.pmid ? { publicLocator: `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/` } : {}),
    })),
  } as const;
}
