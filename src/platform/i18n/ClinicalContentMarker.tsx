/**
 * The English-content marker (interface-translation-first-wave → clinical
 * content shown in English says so once per surface).
 *
 * Under a non-English interface locale, each surface that shows clinical
 * content still in English carries one inline line at its top saying so and
 * linking to `/translation-status`. It is not a disclaimer that the content is
 * wrong; it states which language the learner is reading. Under English (the
 * source), nothing renders, so a reader on English never sees it.
 *
 * It is deliberately an inline line, never a modal or toast, placed once at the
 * top of the briefing, the cockpit tutor region, the debrief, the explainer
 * drawer, and the drug-card drawer.
 */

import { activeLocale, t } from './messages';

export function ClinicalContentMarker() {
  if (activeLocale() === undefined) return null;
  return (
    <p className="clinical-marker" role="note">
      {t('clinical-marker.notice')}{' '}
      <a href="/translation-status">{t('clinical-marker.link')}</a>
    </p>
  );
}
