import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function buildExportEnvelope(value: unknown, now = new Date()) {
  if (!Array.isArray(value) || value.length !== 1) {
    throw new Error('expected exactly one D1 result');
  }
  const result = value[0];
  if (!result || typeof result !== 'object' || Array.isArray(result)
    || (result as Record<string, unknown>).success !== true
    || !Array.isArray((result as Record<string, unknown>).results)) {
    throw new Error('D1 query did not return a successful row set');
  }
  const windowEnd = now.toISOString();
  const windowStart = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  return {
    batchId: `${windowEnd.slice(0, 10)}.daily`, generatedAt: windowEnd,
    windowStart, windowEnd, rows: (result as { results: unknown[] }).results,
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
