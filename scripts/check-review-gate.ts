/**
 * The release build's clinical review gate
 * (platform/clinical-governance → Unreviewed clinical content cannot reach
 * production; platform/delivery → A green test suite is not sufficient to release).
 *
 * It runs in two modes:
 *
 *   default   report every outstanding item by name and exit 0, so a development
 *             build still runs and the interface degrades gracefully around the
 *             content it must exclude.
 *   --release refuse to publish, naming the outstanding gate.
 *   --alpha   with --release: publish anyway, as a declared UNREVIEWED ALPHA.
 *
 * The alpha channel exists because there is a real deadlock: nobody reviews a
 * simulator they cannot use, and the gate will not ship a simulator nobody has
 * reviewed. It resolves the deadlock in the only honest direction — ship, and be
 * unmissable about what has not been checked — rather than by quietly lowering
 * the bar. It refuses unless every unreviewed item is marked as such in the
 * interface, and it names every item it is shipping unreviewed.
 */
import { fileURLToPath } from 'node:url';
import { EDITORIAL_BOARD, reviewableItems } from '../src/platform/governance/records.ts';
import { mayShip, reportCoverage, uncoveredDomains } from '../src/platform/governance/review-gate.ts';
import { buildValidationReport } from '../src/platform/docs/validation-report.ts';

/** Passed in rather than read from a clock, so the gate is reproducible. */
const today = new Date(process.env.SOURCE_DATE ?? '2026-08-19T00:00:00Z');

function main(): void {
  const release = process.argv.includes('--release');
  const alpha = process.argv.includes('--alpha');
  const items = reviewableItems();
  const coverage = reportCoverage(items, today);
  const excluded = coverage.outstanding.filter((entry) => !mayShip(entry.verdict));
  const uncovered = uncoveredDomains(items, EDITORIAL_BOARD);
  const validation = buildValidationReport();

  process.stdout.write(
    `review gate: ${coverage.current} of ${coverage.total} items under current review `
    + `(${coverage.percentCurrent.toFixed(0)}%)\n`,
  );

  // Never an aggregate without the list.
  for (const entry of coverage.outstanding) {
    const shipping = mayShip(entry.verdict) ? 'marked pending re-review' : 'EXCLUDED from the build';
    process.stdout.write(`  ${entry.item.kind} "${entry.item.id}": ${shipping}\n`);
    process.stdout.write(`      ${'reason' in entry.verdict ? entry.verdict.reason : entry.verdict.status}\n`);
  }
  for (const domain of uncovered) {
    process.stdout.write(`  domain "${domain}" has no qualified reviewer on the board\n`);
  }

  if (!release) {
    if (excluded.length > 0) {
      process.stdout.write(
        `\nreview gate: ${excluded.length} item(s) would be excluded from a release build. `
        + 'The surfaces that would show them degrade gracefully. This is a development build, '
        + 'so it continues.\n',
      );
    }
    return;
  }

  const blocking: string[] = [];
  if (excluded.length > 0 && !alpha) {
    blocking.push(`${excluded.length} content item(s) without a current clinical review`);
  }
  if (uncovered.length > 0 && !alpha) {
    blocking.push(`${uncovered.length} content domain(s) with no qualified reviewer`);
  }
  if (validation.faceValidity.reviewers < validation.faceValidity.required && !alpha) {
    blocking.push(
      `the face-validity review is incomplete: ${validation.faceValidity.reviewers} of `
      + `${validation.faceValidity.required} reviewers`,
    );
  }
  const failedBenchmarks = validation.benchmarks.filter((benchmark) => !benchmark.passes);
  if (failedBenchmarks.length > 0) {
    blocking.push(`${failedBenchmarks.length} physiological benchmark(s) outside tolerance`);
  }

  // A physiological benchmark outside tolerance blocks even an alpha. The alpha
  // channel is a statement about what has not been REVIEWED, never a statement
  // that a number the project can check itself is allowed to be wrong.
  if (alpha && blocking.length === 0) {
    process.stdout.write(
      `\nUNREVIEWED ALPHA. Publishing ${excluded.length} content item(s) that no clinician has `
      + 'signed, listed above by name. Each is marked "Not clinically reviewed" at the point of '
      + 'use in the interface, the front page says so, and the governance page lists every '
      + 'outstanding item.\n'
      + 'This is a deliberate, declared exception and it expires the moment a reviewer signs.\n',
    );
    return;
  }

  if (blocking.length > 0) {
    process.stderr.write('\nrelease REFUSED. Outstanding gates:\n');
    for (const gateName of blocking) process.stderr.write(`  - ${gateName}\n`);
    process.stderr.write(
      '\nA green test suite is not sufficient to release. These are the gates that are not green.\n',
    );
    process.exit(1);
  }
  process.stdout.write('review gate: every gate is green; a release may be published.\n');
}

const isEntryPoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) main();
