/**
 * spoken-narration-and-haptic-cues → determinism and privacy.
 *
 * Narration and vibration present text and alarms the engine already produced.
 * If nothing that computes or records a session can reach them, turning them on
 * or off cannot change a trace or a transcript, so this is checked as structure
 * rather than by replaying every scenario twice.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../..', import.meta.url));
const files = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
};
const read = (path: string) => readFileSync(path, 'utf8');
const CHANNELS = /from ['"][^'"]*audio\/(?:narration|narration-voices|haptics|sonification)['"]/;

describe('presentation channels cannot change a session', () => {
  const computing = [
    ...files(join(root, 'src/platform/kernel')),
    ...files(join(root, 'src/platform/transcript')),
    ...files(join(root, 'src/platform/log')),
    ...files(join(root, 'src/modules/anesthesia/physiology')),
    join(root, 'src/modules/anesthesia/engine.ts'),
  ];

  it.each(computing.map((path) => relative(root, path)))('%s does not import speech, vibration, or sound', (path) => {
    expect(read(join(root, path))).not.toMatch(CHANNELS);
  });

  it.each(['narration', 'narration-voices', 'haptics'])('%s reads nothing from the engine and sends nothing anywhere', (name) => {
    const source = read(join(root, `src/platform/audio/${name}.ts`));
    expect(source).not.toMatch(/from ['"][^'"]*(?:kernel|engine|transcript|reporting)/);
    expect(source).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket/);
  });
});
