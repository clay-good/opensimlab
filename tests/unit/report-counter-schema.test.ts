import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The worker and the schema are two files that have to agree about one small vocabulary, and
 * nothing else checks that they do. They stopped agreeing: the worker wrote a counter row with
 * scope='scenario' into a column whose CHECK allowed only 'global' and 'reporter'. Because the
 * four writes run in one db.batch, and a batch is atomic in D1, the constraint violation rolled
 * back the report INSERT with it. Every submission that passed Turnstile was discarded, the
 * failure was swallowed into a 503, and observability is off, so nothing anywhere said so.
 *
 * Every unit test passed throughout, because they all mock the database. This one reads the
 * migrations instead.
 */
const migrationsDir = join(process.cwd(), 'workers/reports/migrations');
const workerSource = readFileSync(join(process.cwd(), 'workers/reports/src/index.mjs'), 'utf8');

/** Replay the migrations in order and return the CHECK vocabulary the final schema enforces. */
function allowedValues(table: string, column: string): Set<string> {
  const files = readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort();
  expect(files.length, 'migrations must exist and be ordered by filename').toBeGreaterThan(0);
  let allowed: Set<string> | null = null;
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    // A rebuild creates a shadow table and renames it over the original. Track both names.
    const names = [table, ...[...sql.matchAll(/ALTER TABLE (\w+) RENAME TO (\w+)/g)]
      .filter((match) => match[2] === table).map((match) => match[1]!)];
    for (const name of names) {
      const create = new RegExp(`CREATE TABLE ${name}\\b[\\s\\S]*?\\n\\)`, 'g');
      for (const block of sql.match(create) ?? []) {
        const check = new RegExp(`${column}[^,]*?CHECK \\(${column} IN \\(([^)]*)\\)\\)`).exec(block);
        if (check) allowed = new Set([...check[1]!.matchAll(/'([^']*)'/g)].map((match) => match[1]!));
      }
    }
  }
  expect(allowed, `no CHECK found for ${table}.${column}`).not.toBeNull();
  return allowed!;
}

describe('the report worker and the D1 schema agree about the counter vocabulary', () => {
  it('permits every scope the worker writes', () => {
    const allowed = allowedValues('report_counters', 'scope');
    // Literals bound through the incrementAccepted helper, and literals written inline in SQL.
    const written = new Set([
      ...[...workerSource.matchAll(/incrementAccepted\('([^']+)'/g)].map((match) => match[1]!),
      ...[...workerSource.matchAll(/SELECT \?, '(?:verified|accepted)', '([^']+)'/g)].map((match) => match[1]!),
    ]);
    expect(written.size, 'expected to find the scopes the worker writes').toBeGreaterThan(0);
    for (const scope of written) {
      expect(allowed, `worker writes scope='${scope}', which the schema CHECK rejects`).toContain(scope);
    }
  });

  it('permits every scope the worker reads, so no cap silently never binds', () => {
    const allowed = allowedValues('report_counters', 'scope');
    const read = new Set([...workerSource.matchAll(/scope='([^']+)'/g)].map((match) => match[1]!));
    expect(read).toContain('scenario');
    for (const scope of read) {
      expect(allowed, `worker reads scope='${scope}', which no row can ever hold`).toContain(scope);
    }
  });

  it('permits every kind the worker writes', () => {
    const allowed = allowedValues('report_counters', 'kind');
    const used = new Set([
      ...[...workerSource.matchAll(/kind='([^']+)'/g)].map((match) => match[1]!),
      ...[...workerSource.matchAll(/SELECT \?, '([^']+)', '[^']+'/g)].map((match) => match[1]!),
      ...[...workerSource.matchAll(/VALUES \(\?, '([^']+)'/g)].map((match) => match[1]!),
    ]);
    expect(used.size).toBeGreaterThan(0);
    for (const kind of used) {
      expect(allowed, `worker uses kind='${kind}', which the schema CHECK rejects`).toContain(kind);
    }
  });

  // Two people reporting the same problem is the signal, not the noise.
  it('keys deduplication on the reporter as well as the report', () => {
    const key = /const dedupe = await hexDigest\('SHA-256', `([^`]*)`\)/.exec(workerSource);
    expect(key, 'expected a dedupe key built from a template literal').not.toBeNull();
    expect(key![1]).toContain('${reporter}');
    expect(key![1]).toContain('${day}');
    // Without the reporter, two learners filing the same category on the same scenario and tick
    // with no note produce one key, and the UNIQUE constraint silently drops the corroboration.
    expect(key![1]!.indexOf('${reporter}')).toBeLessThan(key![1]!.indexOf('JSON.stringify'));
  });

  it('rebuilds rather than dropping the counters it migrates', () => {
    const rebuild = readFileSync(join(migrationsDir, '0004_scenario_counter_scope.sql'), 'utf8');
    expect(rebuild).toContain('INSERT INTO report_counters_next');
    expect(rebuild).toContain('SELECT day, kind, scope, subject, count FROM report_counters');
    expect(rebuild).toContain('RENAME TO report_counters');
  });
});
