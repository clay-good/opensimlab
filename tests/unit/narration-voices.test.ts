import { describe, expect, it, vi } from 'vitest';
import {
  NO_LOCAL_VOICE_REASON, selectVoices, voicesWhenReady, type VoiceLike,
} from '@platform/audio/narration-voices';

const voice = (name: string, lang: string, localService = true, isDefault = false): VoiceLike =>
  ({ name, lang, localService, default: isDefault });

describe('narration voice selection', () => {
  const mixed = [
    voice('Cloud Español', 'es-ES', false),
    voice('Alex', 'en-US', true, true),
    voice('Paulina', 'es-MX'),
    voice('Mónica', 'es-ES'),
    voice('Cloud English', 'en-GB', false),
  ];

  it('never offers a network voice', () => {
    const choice = selectVoices(mixed, 'es-ES');
    expect([choice.preferred, ...choice.others].every((entry) => entry?.localService)).toBe(true);
    expect(choice.others.map((entry) => entry.name)).not.toContain('Cloud English');
  });

  it('prefers the exact locale, then the language, then the platform default', () => {
    expect(selectVoices(mixed, 'es-ES').preferred?.name).toBe('Mónica');
    expect(selectVoices(mixed, 'es-AR').preferred?.lang).toMatch(/^es-/);
    expect(selectVoices(mixed, 'pt-BR').preferred?.name).toBe('Alex');
    expect(selectVoices(mixed, 'es_ES').preferred?.name).toBe('Mónica');
  });

  it('reports no voice, with the reason, when only network voices exist', () => {
    expect(selectVoices([voice('Cloud', 'en-US', false)], 'en-US')).toEqual({ preferred: null, others: [] });
    expect(NO_LOCAL_VOICE_REASON).toContain('Network voices are not used');
  });
});

describe('waiting for the voice list', () => {
  it('resolves at once when voices are already loaded', async () => {
    const source = { getVoices: () => [voice('Alex', 'en-US')], addEventListener: vi.fn(), removeEventListener: vi.fn() };
    await expect(voicesWhenReady(source)).resolves.toHaveLength(1);
    expect(source.addEventListener).not.toHaveBeenCalled();
  });

  it('waits for voiceschanged, and gives up after the timeout with what exists', async () => {
    vi.useFakeTimers();
    let listener: (() => void) | undefined;
    let voices: VoiceLike[] = [];
    const source = {
      getVoices: () => voices,
      addEventListener: (_: 'voiceschanged', handler: () => void) => { listener = handler; },
      removeEventListener: vi.fn(),
    };
    const ready = voicesWhenReady(source, 1000);
    voices = [voice('Alex', 'en-US')];
    listener?.();
    await expect(ready).resolves.toHaveLength(1);
    voices = [];
    const empty = voicesWhenReady(source, 1000);
    vi.advanceTimersByTime(1000);
    await expect(empty).resolves.toEqual([]);
    vi.useRealTimers();
  });
});
