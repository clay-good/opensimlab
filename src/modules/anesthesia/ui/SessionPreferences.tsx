/**
 * The session menu's own preferences: a reasoning note, classroom mode,
 * alarm vibration, and narration. All interface text comes from the catalog.
 */
import { Button, Toggle } from '@platform/ui';
import { t, type MessageKey } from '@platform/i18n/messages';
import { HAPTICS_UNSUPPORTED_REASON } from '@platform/audio/haptics';
import { NARRATION_RATES, type NarrationSettings, type NarrationSource } from '@platform/audio/narration';
import { NO_LOCAL_VOICE_REASON, type VoiceChoice, type VoiceLike } from '@platform/audio/narration-voices';
import { REASONING_NOTE_LIMIT } from '@platform/session/reasoning-notes';

const SOURCES: readonly NarrationSource[] = ['beat', 'tutor', 'alarm', 'summary'];

export interface SessionPreferencesProps {
  readonly note: { readonly draft: string; readonly saved: string; readonly onDraft: (text: string) => void; readonly onSave: () => void };
  readonly classroom: { readonly on: boolean; readonly pausePoints: number; readonly onChange: (next: boolean) => void };
  readonly vibration: { readonly on: boolean; readonly supported: boolean; readonly onChange: (next: boolean) => void };
  readonly narration: {
    readonly settings: NarrationSettings;
    readonly choice: VoiceChoice;
    readonly voice: VoiceLike | null;
    readonly onChange: (next: NarrationSettings) => void;
  };
}

export function SessionPreferences({ note, classroom, vibration, narration }: SessionPreferencesProps) {
  const voiceAvailable = narration.choice.preferred !== null;
  const narrating = narration.settings.enabled && voiceAvailable;
  const set = (patch: Partial<NarrationSettings>) => narration.onChange({ ...narration.settings, ...patch });
  return (
    <>
      <div className="overflow-menu__sound">
        <label className="field" htmlFor="reasoning-note">
          <span className="field__label">{t('prefs.note.label')}</span>
          <textarea id="reasoning-note" className="field__input" rows={2} maxLength={REASONING_NOTE_LIMIT}
            value={note.draft} onChange={(event) => note.onDraft(event.target.value)} />
          <span className="field__hint">{t('prefs.note.hint')}</span>
        </label>
        <Button compact disabled={note.draft.trim().length === 0} onClick={note.onSave}>{t('prefs.note.save')}</Button>
        {note.saved && <p className="field__hint" role="status">{note.saved}</p>}
      </div>
      <div className="overflow-menu__sound">
        <Toggle checked={classroom.on} describedBy="classroom-hint" onChange={classroom.onChange}
          label={t(classroom.on ? 'prefs.classroom.on' : 'prefs.classroom.off')} />
        <p className="field__hint" id="classroom-hint">
          {t(classroom.pausePoints > 0 ? 'prefs.classroom.hint' : 'prefs.classroom.hint-none')}
        </p>
      </div>
      <div className="overflow-menu__sound">
        <Toggle checked={vibration.on && vibration.supported} disabled={!vibration.supported} describedBy="haptics-hint"
          onChange={vibration.onChange}
          label={t(vibration.on && vibration.supported ? 'prefs.vibration.on' : 'prefs.vibration.off')} />
        <p className="field__hint" id="haptics-hint">
          {vibration.supported ? t('prefs.vibration.hint') : HAPTICS_UNSUPPORTED_REASON}
        </p>
      </div>
      <div className="overflow-menu__sound">
        <Toggle checked={narrating} disabled={!voiceAvailable} describedBy="narration-hint"
          onChange={(next: boolean) => set({ enabled: next })}
          label={t(narrating ? 'prefs.narration.on' : 'prefs.narration.off')} />
        <p className="field__hint" id="narration-hint">
          {voiceAvailable ? t('prefs.narration.hint') : NO_LOCAL_VOICE_REASON}
        </p>
        {narrating && (
          <fieldset className="field">
            <legend className="field__label">{t('prefs.narration.sources')}</legend>
            {SOURCES.map((source) => (
              <label key={source} className="field__hint">
                <input type="checkbox" checked={narration.settings.sources[source]}
                  onChange={(event) => set({ sources: { ...narration.settings.sources, [source]: event.target.checked } })} />{' '}
                {t(`prefs.narration.${source}` as MessageKey)}
              </label>
            ))}
            <label className="field__hint">
              <input type="checkbox" checked={narration.settings.screenReader}
                onChange={(event) => set({ screenReader: event.target.checked })} />{' '}
              {t('prefs.narration.screen-reader')}
            </label>
            <label className="field__hint">
              {t('prefs.narration.speed')}{' '}
              <select value={narration.settings.rate} onChange={(event) => set({ rate: Number(event.target.value) })}>
                {NARRATION_RATES.map((rate) => <option key={rate} value={rate}>{`${rate}×`}</option>)}
              </select>
            </label>
            <label className="field__hint">
              {t('prefs.narration.voice')}{' '}
              <select value={narration.voice?.name ?? ''} onChange={(event) => set({ voiceName: event.target.value || null })}>
                {[narration.choice.preferred, ...narration.choice.others].filter((voice): voice is VoiceLike => voice !== null)
                  .map((voice) => <option key={voice.name} value={voice.name}>{`${voice.name} (${voice.lang})`}</option>)}
              </select>
            </label>
          </fieldset>
        )}
      </div>
    </>
  );
}
