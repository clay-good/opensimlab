/**
 * The not-found page's content, once. The prerendered 404 document and the
 * client view both render this list, so the two can no longer drift; they had
 * (the client listed review status and corrections, the static page did not).
 */
import { t, type MessageKey } from '@platform/i18n/messages';

export const NOT_FOUND_DESTINATIONS: readonly { readonly href: string; readonly key: string }[] = [
  { href: '/anesthesia', key: 'anesthesia' },
  { href: '/about', key: 'about' },
  { href: '/validation', key: 'validation' },
  { href: '/governance', key: 'governance' },
  { href: '/review-status', key: 'review-status' },
  { href: '/corrections', key: 'corrections' },
  { href: '/limitations', key: 'limitations' },
  { href: '/privacy', key: 'privacy' },
];

export const notFoundLink = (key: string) => t(`not-found.${key}.link` as MessageKey);
export const notFoundWhy = (key: string) => t(`not-found.${key}.why` as MessageKey);

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The static 404 body for the prerender step, from the same strings. */
export function notFoundHtml(): string {
  return '<div id="root"><div class="document">'
    + `<header class="document__bar"><a class="document__home" href="/">${escape(t('sitebar.home'))}</a></header>`
    + '<main class="reading" id="main">'
    + `<h1>${escape(t('not-found.heading'))}</h1>`
    + `<p>${escape(t('not-found.body'))}</p>`
    + `<h2>${escape(t('not-found.where'))}</h2>`
    + '<ul>'
    + NOT_FOUND_DESTINATIONS.map(({ href, key }) =>
      `<li><a href="${href}">${escape(notFoundLink(key))}</a> — ${escape(notFoundWhy(key))}</li>`).join('')
    + '</ul>'
    + '</main>'
    + `<footer class="document__foot"><a href="/">${escape(t('documents.footer.home'))}</a>`
    + `<a href="/anesthesia">${escape(t('documents.footer.simulator'))}</a></footer>`
    + '</div></div>';
}
