/** Verify that dist/ is a complete, credential-free static hosting artifact. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_CATALOG_ARTIFACTS } from '../src/platform/catalog/public-artifacts.ts';
import { ROUTES } from '../src/routes/routes.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const TEXT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt', '.webmanifest', '.xml']);
const PRIVATE_BASENAMES = new Set([
  '.dev.vars', '.env', '.env.local', '.netrc', '.npmrc',
  'credentials', 'credentials.json', 'id_ed25519', 'id_rsa', 'secrets.json', 'wrangler.toml',
]);
const PRIVATE_EXTENSIONS = new Set([
  '.db', '.dump', '.kdbx', '.key', '.p12', '.pem', '.pfx', '.sqlite', '.sqlite3',
]);
const BUILD_TOKENS = ['__CACHE_VERSION__', '__PRECACHE_MANIFEST__'] as const;

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

export function isPrivateArtifact(path: string): boolean {
  const segments = path.toLowerCase().split(/[\\/]/);
  const basename = segments.at(-1) ?? '';
  return segments.includes('.wrangler')
    || PRIVATE_BASENAMES.has(basename)
    || basename.startsWith('.env.')
    || PRIVATE_EXTENSIONS.has(extname(basename));
}

export function unresolvedBuildToken(text: string): string | undefined {
  return BUILD_TOKENS.find((token) => text.includes(token));
}

export function staticHostFailures(dist = join(root, 'dist')): string[] {
  if (!existsSync(dist)) return ['dist/ does not exist; run `npm run build` first'];

  const expected = [
    ...ROUTES.map((route) => route.path === '/'
      ? 'index.html'
      : `${route.path.replace(/^\//, '')}/index.html`),
    ...PUBLIC_CATALOG_ARTIFACTS.map((path) => path.replace(/^\//, '')),
    '404.html',
    '_headers',
    'manifest.webmanifest',
    'robots.txt',
    'sitemap.xml',
    'sw.js',
  ];
  const failures = expected
    .filter((path) => !existsSync(join(dist, path)))
    .map((path) => `missing ${path}`);

  const files = filesUnder(dist);
  if (!files.some((path) => relative(dist, path).startsWith(`assets${sep}`))) {
    failures.push('missing built assets');
  }
  if (!files.some((path) => /solver\.worker-[^/\\]+\.js$/.test(path))) {
    failures.push('missing solver worker');
  }

  for (const path of files) {
    const artifact = relative(dist, path);
    if (isPrivateArtifact(artifact)) failures.push(`private artifact ${artifact}`);
    if (TEXT_EXTENSIONS.has(extname(path))) {
      const token = unresolvedBuildToken(readFileSync(path, 'utf8'));
      if (token) failures.push(`unresolved build token ${token} in ${artifact}`);
    }
  }
  return failures;
}

function main(): void {
  const failures = staticHostFailures();
  if (failures.length > 0) {
    process.stderr.write(`static-host: FAILED\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write(
    `static-host: ${ROUTES.length} routes and ${PUBLIC_CATALOG_ARTIFACTS.length} catalog artifacts verified\n`,
  );
}

const isEntryPoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) main();
