import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectMaintenanceBatch, validateMaintenanceProjection } from './projection';

function fail(message: string): never {
  throw new Error(`report-maintenance: ${message}`);
}

const args = process.argv.slice(2);
if (args.length !== 2) fail('expected one trusted input path and one private output path');
const inputPath = resolve(args[0]!);
const outputPath = resolve(args[1]!);
if (inputPath === outputPath) fail('input and output paths must differ');

let input: unknown;
try { input = JSON.parse(readFileSync(inputPath, 'utf8')); }
catch { fail('input must be readable JSON'); }
if (!input || typeof input !== 'object' || Array.isArray(input)) fail('input must be an object');
const record = input as Record<string, unknown>;
const expected = ['batchId', 'generatedAt', 'windowStart', 'windowEnd', 'rows'];
if (Object.keys(record).length !== expected.length
  || Object.keys(record).some((key) => !expected.includes(key))
  || !Array.isArray(record.rows)) fail('input keys do not match the fixed export contract');

const projection = projectMaintenanceBatch(record.rows, {
  batchId: String(record.batchId), generatedAt: String(record.generatedAt),
  windowStart: String(record.windowStart), windowEnd: String(record.windowEnd),
});
const errors = validateMaintenanceProjection(projection);
if (errors.length > 0) fail(`projection failed validation (${errors.length} errors)`);
writeFileSync(outputPath, `${JSON.stringify(projection, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
chmodSync(outputPath, 0o600);
