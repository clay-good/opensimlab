import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ARTIFACT_SCHEMA_VERSION = 1;
const ALGORITHM = 'aes-256-gcm';
const MAX_PLAINTEXT_BYTES = 24 * 1024 * 1024;
const MAX_CIPHERTEXT_CHARACTERS = 32 * 1024 * 1024;

function artifactKey(encoded: string | undefined): Buffer {
  if (!encoded || !/^[A-Za-z0-9+/]{43}=$/.test(encoded)) {
    throw new Error('artifact key must be one base64-encoded 32-byte key');
  }
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32 || key.toString('base64') !== encoded) {
    throw new Error('artifact key must be canonical base64');
  }
  return key;
}

export function encryptPrivateArtifact(plaintext: Buffer, encodedKey: string) {
  if (plaintext.length > MAX_PLAINTEXT_BYTES) throw new Error('private artifact is too large');
  const nonce = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, artifactKey(encodedKey), nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    schemaVersion: ARTIFACT_SCHEMA_VERSION, algorithm: ALGORITHM,
    nonce: nonce.toString('base64'), tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

export function decryptPrivateArtifact(value: unknown, encodedKey: string): Buffer {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid artifact');
  const record = value as Record<string, unknown>;
  const keys = ['schemaVersion', 'algorithm', 'nonce', 'tag', 'ciphertext'];
  if (Object.keys(record).length !== keys.length || Object.keys(record).some((key) => !keys.includes(key))
    || record.schemaVersion !== ARTIFACT_SCHEMA_VERSION || record.algorithm !== ALGORITHM
    || typeof record.nonce !== 'string' || typeof record.tag !== 'string'
    || typeof record.ciphertext !== 'string' || record.ciphertext.length > MAX_CIPHERTEXT_CHARACTERS
    || !/^[A-Za-z0-9+/]*={0,2}$/.test(record.ciphertext)) throw new Error('invalid artifact');
  const nonce = Buffer.from(record.nonce, 'base64');
  const tag = Buffer.from(record.tag, 'base64');
  if (nonce.length !== 12 || tag.length !== 16) throw new Error('invalid artifact');
  const ciphertext = Buffer.from(record.ciphertext, 'base64');
  if (ciphertext.length > MAX_PLAINTEXT_BYTES
    || ciphertext.toString('base64') !== record.ciphertext) throw new Error('invalid artifact');
  const decipher = createDecipheriv(ALGORITHM, artifactKey(encodedKey), nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function fail(message: string): never {
  throw new Error(`report-maintenance: ${message}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [operation, source, target] = process.argv.slice(2);
  if (!['encrypt', 'decrypt'].includes(operation ?? '') || !source || !target) {
    fail('expected encrypt|decrypt, one input path, and one output path');
  }
  const sourcePath = resolve(source);
  const targetPath = resolve(target);
  if (sourcePath === targetPath) fail('input and output paths must differ');
  const key = process.env.REPORT_MAINTENANCE_ARTIFACT_KEY;
  let output: Buffer;
  try {
    if (operation === 'encrypt') {
      output = Buffer.from(`${JSON.stringify(encryptPrivateArtifact(readFileSync(sourcePath), key!))}\n`);
    } else {
      output = decryptPrivateArtifact(JSON.parse(readFileSync(sourcePath, 'utf8')), key!);
    }
  } catch { fail('private artifact operation failed'); }
  writeFileSync(targetPath, output, { mode: 0o600 });
  chmodSync(targetPath, 0o600);
}
