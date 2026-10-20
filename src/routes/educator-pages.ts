import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-educator';

/**
 * The educator surfaces' own destinations, appended to the shared site bar.
 *
 * These three pages used to carry three separate hand-written copies of the
 * same bar, and the reviewer page a fourth. Four bars is four things to keep in
 * step, and they had already drifted: none of them offered the validation report
 * or the governance page, which are the two pages an educator evaluating this
 * most wants. The list itself was then still copied into each page; it lives
 * here once, and its labels come from the catalog.
 */
export const EDUCATOR_PAGES: readonly { href: string; label: string }[] = [
  { href: '/for-educators', get label() { return t('sitebar.for-educators'); } },
  { href: '/curriculum', get label() { return t('sitebar.curriculum'); } },
  { href: '/review', get label() { return t('educator.review-submissions'); } },
];
