import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { SessionPreferences, type SessionPreferencesProps } from '@anesthesia/ui/SessionPreferences';
import { DEFAULT_NARRATION_SETTINGS } from '@platform/audio/narration';
import { HAPTICS_UNSUPPORTED_REASON } from '@platform/audio/haptics';
import { NO_LOCAL_VOICE_REASON } from '@platform/audio/narration-voices';

const voice = { name: 'Alex', lang: 'en-US', localService: true };
const props = (overrides: Partial<SessionPreferencesProps> = {}): SessionPreferencesProps => ({
  note: { draft: '', saved: '', onDraft: () => {}, onSave: () => {} },
  classroom: { on: false, pausePoints: 0, onChange: () => {} },
  vibration: { on: false, supported: true, onChange: () => {} },
  narration: { settings: DEFAULT_NARRATION_SETTINGS, choice: { preferred: voice, others: [] }, voice, onChange: () => {} },
  ...overrides,
});
const render = (overrides?: Partial<SessionPreferencesProps>) => renderToStaticMarkup(createElement(SessionPreferences, props(overrides)));

describe('session preferences', () => {
  it('offers the note, classroom mode, vibration and narration, all off by default', () => {
    const markup = render();
    for (const text of ['Note your reasoning (optional)', 'Save note', 'Classroom mode off',
      'this scenario declares none yet', 'Alarm vibration off', 'Narration off']) expect(markup).toContain(text);
    expect(markup).not.toContain('What to read');
  });

  it('says why vibration or narration is unavailable instead of hiding it', () => {
    const markup = render({
      vibration: { on: true, supported: false, onChange: () => {} },
      narration: { settings: { ...DEFAULT_NARRATION_SETTINGS, enabled: true }, choice: { preferred: null, others: [] }, voice: null, onChange: () => {} },
    });
    expect(markup).toContain(HAPTICS_UNSUPPORTED_REASON.replace(/'/g, '&#x27;'));
    expect(markup).toContain(NO_LOCAL_VOICE_REASON.replace(/'/g, '&#x27;'));
    expect(markup).toContain('Alarm vibration off');
    expect(markup).toContain('Narration off');
  });

  it('shows the narration choices once narration is on with a voice', () => {
    const markup = render({ narration: { settings: { ...DEFAULT_NARRATION_SETTINGS, enabled: true }, choice: { preferred: voice, others: [] }, voice, onChange: () => {} } });
    for (const text of ['What to read', 'Worked-example steps', 'Tutor prompts', 'Alarm announcements',
      'State summary on request', 'I use a screen reader', 'Alex (en-US)']) expect(markup).toContain(text);
  });
});
