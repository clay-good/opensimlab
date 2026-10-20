/**
 * The not-for-clinical-use gate and marker (platform/safety-and-scope).
 *
 * The statement is displayed and must be acknowledged once before the cockpit
 * becomes interactive, and the acknowledgement is stored locally. It gates
 * INTERACTION with the cockpit, never the delivery of the page, so a crawler or a
 * scripting-disabled browser still receives the prerendered content.
 */

import { t } from '@platform/i18n/messages';
import { Button, Modal } from '@platform/ui';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';

export const ACKNOWLEDGEMENT_KEY = 'opensimlab.acknowledged-not-for-clinical-use';

export function hasAcknowledged(): boolean {
  try {
    return localStorage.getItem(ACKNOWLEDGEMENT_KEY) === 'true';
  } catch {
    // Storage blocked: ask again rather than assuming acknowledgement.
    return false;
  }
}

export function recordAcknowledgement(): void {
  try { localStorage.setItem(ACKNOWLEDGEMENT_KEY, 'true'); } catch { /* nothing to do */ }
}

export function NotForClinicalUseGate({ open, onAcknowledge }: {
  open: boolean; onAcknowledge: () => void;
}) {
  return (
    <Modal
      open={open}
      title={t('ack.title')}
      dismissible={false}
      footer={<Button variant="primary" onClick={onAcknowledge}>{t('ack.accept')}</Button>}
    >
      <p>{NOT_FOR_CLINICAL_USE}</p>
      <p>{t('ack.predicts')}</p>
      {/* The disclosure the release turns on. Someone acknowledging this once,
          before anything is interactive, is the moment they are entitled to know
          that nothing here is signed — and to check it rather than take our word,
          which is what the link is for. */}
      <p>
        <strong>{t('ack.unreviewed-lead')}</strong> {t('ack.unreviewed')}{' '}
        <a href="/review-status">{t('ack.review-status-link')}</a>
      </p>
      <p className="field__hint">{t('ack.local')}</p>
    </Modal>
  );
}

/** The compact, always-visible marker that persists after acknowledgement. */
export const PERSISTENT_MARKER_TEXT = 'Simulator · not for clinical use';

/** The statement embedded in every export, in its content or its metadata. */
export function exportHeader(versions: {
  engineVersion: string; modelSetRevision: string; contentVersion: string;
}): string {
  return `Open Sim Lab. ${NOT_FOR_CLINICAL_USE} `
    + `Engine ${versions.engineVersion}, model set ${versions.modelSetRevision}, `
    + `content ${versions.contentVersion}.`;
}
