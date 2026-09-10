/**
 * The full-history audit has to survive the repository growing.
 *
 * `check-public-readiness.ts --history` reads `git rev-list --objects --all`, which prints
 * one line per object in the whole history. That output passed Node's 1 MB default buffer,
 * and the script died with an unhandled ENOBUFS carrying a megabyte of commit hashes in its
 * stack trace -- so the audit the release gate asks for could not be run at all, and the
 * failure did not look like an audit failure. These tests hold the ceiling and the message.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts', 'check-public-readiness.ts');
const source = readFileSync(script, 'utf8');

describe('Requirement: the public-readiness history audit runs on the whole history', () => {
  it('reads git output through a ceiling far above the default 1 MB buffer', () => {
    expect(source).toContain('maxBuffer: GIT_OUTPUT_CEILING_BYTES');
    const declared = /const GIT_OUTPUT_CEILING_BYTES = (\d+) \* 1024 \* 1024;/.exec(source);
    expect(declared, 'the ceiling is declared once, in megabytes').toBeTruthy();
    expect(Number(declared![1])).toBeGreaterThanOrEqual(64);
  });

  it('reports an overflow as a named git call rather than a raw ENOBUFS', () => {
    expect(source).toContain("=== 'ENOBUFS'");
    expect(source).toContain('the audit needs to read it in chunks rather than in one buffer');
  });

  it('completes the full-history audit on this repository', () => {
    const output = execFileSync('npx', ['tsx', script, '--history'], {
      cwd: process.cwd(), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    });
    expect(output).toMatch(/public-ready: reviewed \d+ history objects and \d+ contributor identity/);
    expect(output).toContain('public-ready: clean tracked tree');
  }, 300_000);
});
