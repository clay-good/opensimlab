/**
 * The staged-label gate (platform/sustainability → the project states its real
 * status rather than implying more maturity than it has).
 *
 * Open Sim Lab publishes one evergreen state. There is no alpha on the way to a
 * beta on the way to a reviewed 1.0, and the release decision in
 * `openspec/changes/release-evergreen-preview/` turns on that being true in what
 * a reader sees, not only in what the README says. So the words are gated: a
 * prerelease version suffix or a staged-release phrase in package metadata,
 * shipped HTML, manifests, or documentation fails the build.
 *
 * The gate has to survive a corpus about beta blockade and alpha angles, so it
 * never flags a bare `alpha` or `beta`. It flags the two forms that can only be
 * product maturity: a semver prerelease, and a fixed list of release phrases.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The engine's capability version, which is not a maturity claim.
 *
 * It pins what the solver could do when a transcript was recorded, so a session
 * replays on the build that produced it. Roughly 250 completion contracts compare
 * it literally, and renaming it would assert a capability change that did not
 * happen. It is exempt by exact string, and only that string.
 */
export const CAPABILITY_VERSION_EXEMPTION = '0.1.0-alpha.48';

/** A semver prerelease naming a maturity stage: `1.2.3-beta`, `0.4.0-rc.2`. */
const STAGED_VERSION = /\b\d+\.\d+\.\d+-(?:alpha|beta|rc)[\w.-]*/gi;

/**
 * Staged-release vocabulary. Every alternative needs a release noun or a release
 * adjective beside the word, which is what keeps `beta blockade`, `beta-2
 * agonist`, and `a normal alpha angle` out of the results.
 */
const STAGED_PHRASE = new RegExp([
  '\\b(?:public|private|closed|open|early|limited)\\s+(?:alpha|beta)\\b',
  '\\b(?:alpha|beta|rc)[\\s-](?:release|releases|build|builds|channel|version|versions'
    + '|stage|phase|period|program|programme|testing|tester|testers)\\b',
  '\\brelease\\s+candidate\\b',
  '\\bin\\s+(?:alpha|beta)\\b(?![-\\w])',
  // The word standing alone as a status label, as in the badge this gate retired:
  // "Alpha. Not clinically reviewed."
  '\\b(?:Alpha|Beta)\\s*[.:—–]\\s',
].join('|'), 'g');

export interface MaturityFinding {
  readonly file: string;
  readonly line: number;
  readonly match: string;
  readonly reason: 'staged-version' | 'staged-phrase';
}

/** Every finding in one file's text, with the capability version filtered out. */
export function findMaturityLabels(file: string, text: string): MaturityFinding[] {
  const findings: MaturityFinding[] = [];
  const lines = text.split('\n');
  for (const [index, line] of lines.entries()) {
    for (const [pattern, reason] of [
      [STAGED_VERSION, 'staged-version'],
      [STAGED_PHRASE, 'staged-phrase'],
    ] as const) {
      pattern.lastIndex = 0;
      for (const match of line.matchAll(pattern)) {
        if (match[0] === CAPABILITY_VERSION_EXEMPTION) continue;
        findings.push({ file, line: index + 1, match: match[0], reason });
      }
    }
  }
  return findings;
}

const SCANNED_EXTENSIONS = new Set(['.md', '.html', '.json', '.webmanifest', '.ts', '.tsx']);

/**
 * The surfaces the release decision names: package metadata, shipped HTML,
 * manifests, documentation, and the source those are rendered from.
 *
 * `node_modules`, `dist/catalog`, and the OpenSpec change directories are out.
 * The catalog audits record the exempt capability version several thousand times,
 * and the change directory is literally named `mvp-anesthesia-alpha` — that is
 * project history, not a claim made to a reader.
 */
const SCANNED_ROOTS = [
  'package.json', 'index.html', 'public', 'docs', 'src', 'workers',
  'README.md', 'GOVERNANCE.md', 'MAINTENANCE.md', 'CONTRIBUTING.md',
  'CORRECTIONS.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md',
];

const SKIPPED_DIRECTORIES = new Set(['node_modules', 'catalog', 'fonts', 'og', '.git']);

function collect(root: string, path: string, out: string[]): void {
  if (!existsSync(path)) return;
  const stats = statSync(path);
  if (stats.isFile()) {
    if (SCANNED_EXTENSIONS.has(extname(path))) out.push(path);
    return;
  }
  for (const entry of readdirSync(path)) {
    if (SKIPPED_DIRECTORIES.has(entry)) continue;
    collect(root, join(path, entry), out);
  }
}

/**
 * Scan the sources, and with `includeDist` the built artifact too.
 *
 * The prerendered HTML is the surface a reader actually receives, so it is worth
 * checking — but only where it is known fresh. `npm run lint` runs before `npm run
 * build`, where a `dist/` left over from an earlier commit would fail the lint for
 * text that no longer exists. So the build asks for it, once, after prerendering.
 */
export function scanRepository(root: string, includeDist = false): MaturityFinding[] {
  const files: string[] = [];
  for (const entry of SCANNED_ROOTS) collect(root, join(root, entry), files);
  if (includeDist) collect(root, join(root, 'dist'), files);

  const findings: MaturityFinding[] = [];
  for (const file of files.sort()) {
    findings.push(...findMaturityLabels(relative(root, file), readFileSync(file, 'utf8')));
  }
  return findings;
}

/** The declared package version, which must carry no prerelease at all. */
export function packageVersionFinding(root: string): string | null {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version?: string };
  const version = manifest.version ?? '';
  return /-/.test(version) ? version : null;
}

function main(): void {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const includeDist = process.argv.includes('--dist');
  const staged = packageVersionFinding(root);
  const findings = scanRepository(root, includeDist);

  if (staged !== null) {
    process.stderr.write(
      `check-maturity-labels: FAIL — package version "${staged}" carries a prerelease stage\n`,
    );
  }
  for (const finding of findings) {
    process.stderr.write(
      `check-maturity-labels: FAIL — ${finding.file}:${finding.line} ${finding.reason} "${finding.match}"\n`,
    );
  }
  if (staged !== null || findings.length > 0) process.exit(1);

  process.stdout.write(
    `check-maturity-labels: ok — one published state, no staged labels${includeDist ? ' (dist included)' : ''}\n`,
  );
}

const isEntryPoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) main();
