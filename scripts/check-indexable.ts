/**
 * Refuse to deploy an artifact that still carries the preview build's noindex
 * signals. The deployment scripts run this after an explicitly indexable build,
 * so indexing cannot be disabled by a forgotten environment flag.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexableRoutes } from '../src/routes/routes.ts';

export function indexabilityProblems(dist: string): string[] {
  const problems: string[] = [];
  const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
  const headers = readFileSync(join(dist, '_headers'), 'utf8');

  if (!/^Allow: \/$/m.test(robots)) problems.push('robots.txt does not allow crawling');
  if (/^Disallow: \/$/m.test(robots)) problems.push('robots.txt disallows the entire site');
  if (!/^Sitemap: https:\/\/opensimlab\.com\/sitemap\.xml$/m.test(robots)) {
    problems.push('robots.txt does not name the production sitemap');
  }
  if (/X-Robots-Tag:\s*noindex/i.test(headers)) {
    problems.push('_headers applies noindex to the site');
  }

  for (const route of indexableRoutes()) {
    const target = route.path === '/'
      ? join(dist, 'index.html')
      : join(dist, route.path.slice(1), 'index.html');
    const html = readFileSync(target, 'utf8');
    if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) {
      problems.push(`${route.path} contains a noindex meta tag`);
    }
  }
  return problems;
}

function main(): void {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const problems = indexabilityProblems(join(root, 'dist'));
  if (problems.length > 0) {
    process.stderr.write(`indexable build refused:\n- ${problems.join('\n- ')}\n`);
    process.exit(1);
  }
  process.stdout.write(`indexable build verified: ${indexableRoutes().length} routes may be crawled.\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
