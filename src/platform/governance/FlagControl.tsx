/**
 * The control a reviewing clinician uses to say what is wrong, where they are
 * (platform/clinical-governance → Review Is Capturable In Place).
 *
 * It is deliberately unobtrusive and only appears in review mode: a learner
 * should never be invited to argue with the content, and a reviewer should never
 * have to hunt for the way to. It never leaves the page, because the moment a
 * reviewer has to open a new tab and find an issue tracker, most of them stop.
 */

import { useState } from 'react';
import { Button } from '@platform/ui';
import {
  NOTE_SEVERITIES, addNote, loadNotes, notesFor, removeNote, saveNotes,
  type NoteSeverity, type ReviewNote,
} from './review-notes';
import { t } from '@platform/i18n/messages';

export interface FlagControlProps {
  /** Stable key for the content item, e.g. `drug-card:propofol`. */
  readonly itemKey: string;
  readonly itemLabel: string;
  readonly contentVersion: string;
  readonly appVersion: string;
  /** Passed in so the component reads no clock and stays testable. */
  readonly now: () => string;
}

export function FlagControl(props: FlagControlProps) {
  const [notes, setNotes] = useState<ReviewNote[]>(() => loadNotes());
  const [open, setOpen] = useState(false);
  const existing = notesFor(notes, props.itemKey);
  const [severity, setSeverity] = useState<NoteSeverity>('wrong');
  const [whatIsWrong, setWhatIsWrong] = useState(existing[0]?.whatIsWrong ?? '');
  const [correction, setCorrection] = useState(existing[0]?.suggestedCorrection ?? '');

  const commit = (next: ReviewNote[]) => {
    setNotes(next);
    saveNotes(next);
  };

  const save = () => {
    if (!whatIsWrong.trim()) return;
    commit(addNote(notes, {
      id: existing[0]?.id ?? `${props.itemKey}:${props.now()}`,
      itemKey: props.itemKey,
      itemLabel: props.itemLabel,
      severity,
      whatIsWrong,
      suggestedCorrection: correction,
      contentVersion: props.contentVersion,
      appVersion: props.appVersion,
      recordedOn: props.now(),
    }));
    setOpen(false);
  };

  return (
    <div className="flag">
      {existing.length > 0 && !open && (
        <p className="flag__existing">
          {t('flag.existing')} <strong>{NOTE_SEVERITIES.find((s) => s.id === existing[0]!.severity)?.label}</strong>.
        </p>
      )}

      {!open ? (
        <div className="flag__actions">
          <Button compact onClick={() => setOpen(true)}>
            {t(existing.length > 0 ? 'flag.edit' : 'flag.open')}
          </Button>
          {existing.length > 0 && (
            <Button compact variant="ghost" onClick={() => commit(removeNote(notes, existing[0]!.id))}>
              {t('flag.remove')}
            </Button>
          )}
        </div>
      ) : (
        <div className="flag__form">
          <label className="field">
            <span className="field__label">{t('flag.severity')}</span>
            <select
              className="select"
              value={severity}
              onChange={(event) => setSeverity(event.target.value as NoteSeverity)}
            >
              {NOTE_SEVERITIES.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.label}</option>
              ))}
            </select>
            <span className="field__hint">
              {NOTE_SEVERITIES.find((entry) => entry.id === severity)?.hint}
            </span>
          </label>

          <label className="field">
            <span className="field__label">{t('flag.what')}</span>
            <textarea
              className="field__input"
              rows={3}
              value={whatIsWrong}
              placeholder={t('flag.what-placeholder')}
              onChange={(event) => setWhatIsWrong(event.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">{t('flag.correction')}</span>
            <textarea
              className="field__input"
              rows={2}
              value={correction}
              placeholder={t('flag.correction-placeholder')}
              onChange={(event) => setCorrection(event.target.value)}
            />
          </label>

          <div className="flag__actions">
            <Button compact variant="primary" onClick={save} disabled={!whatIsWrong.trim()}>
              {t('flag.save')}
            </Button>
            <Button compact variant="ghost" onClick={() => setOpen(false)}>{t('flag.cancel')}</Button>
          </div>
          <p className="field__hint">{t('flag.saved-locally')}</p>
        </div>
      )}
    </div>
  );
}
