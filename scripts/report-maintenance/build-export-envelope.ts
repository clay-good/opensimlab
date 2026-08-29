import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function rowsOf(result: unknown): unknown[] {
  if (!result || typeof result !== 'object' || Array.isArray(result)
    || (result as Record<string, unknown>).success !== true
    || !Array.isArray((result as Record<string, unknown>).results)) {
    throw new Error('D1 query did not return a successful row set');
  }
  return (result as { results: unknown[] }).results;
}

export function buildExportEnvelope(value: unknown, now = new Date()) {
  // Two statements: the eligible-row count, then the capped rows. The count is what makes the cap
  // honest — the row query returns the oldest rows first, so once the backlog exceeds the cap the
  // newest reports fall off the end, and without a total nothing distinguishes that from a
  // complete batch.
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error('expected the count result and the row result');
  }
  const countRows = rowsOf(value[0]);
  if (countRows.length !== 1 || !countRows[0] || typeof countRows[0] !== 'object') {
    throw new Error('count query did not return one row');
  }
  const eligibleRows = (countRows[0] as Record<string, unknown>).eligible_rows;
  if (!Number.isSafeInteger(eligibleRows) || Number(eligibleRows) < 0) {
    throw new Error('count query did not return a row total');
  }
  const rows = rowsOf(value[1]);
  if (rows.length > Number(eligibleRows)) {
    throw new Error('row result is larger than the eligible total');
  }
  const windowEnd = now.toISOString();
  const windowStart = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  // Where the batch actually stops, so a reviewer knows what the next one resumes from.
  const created = rows.map((row) => (row as Record<string, unknown>).created_at)
    .filter((value): value is string => typeof value === 'string');
  return {
    batchId: `${windowEnd.slice(0, 10)}.daily`, generatedAt: windowEnd,
    windowStart, windowEnd,
    eligibleRows: Number(eligibleRows),
    returnedRows: rows.length,
    truncated: rows.length < Number(eligibleRows),
    coveredThrough: created.length > 0 ? created.reduce((a, b) => (a > b ? a : b)) : null,
    rows,
  };
}

function fail(message: string): never {
  throw new Error(`report-maintenance: ${message}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length !== 2) fail('expected one Wrangler JSON path and one private output path');
  const inputPath = resolve(args[0]!);
  const outputPath = resolve(args[1]!);
  if (inputPath === outputPath) fail('input and output paths must differ');
  let input: unknown;
  try { input = JSON.parse(readFileSync(inputPath, 'utf8')); }
  catch { fail('Wrangler output must be readable JSON'); }
  let envelope: ReturnType<typeof buildExportEnvelope>;
  try { envelope = buildExportEnvelope(input); }
  catch { fail('Wrangler output does not match the fixed D1 result contract'); }
  writeFileSync(outputPath, `${JSON.stringify(envelope)}\n`, { encoding: 'utf8', mode: 0o600 });
  chmodSync(outputPath, 0o600);
}
