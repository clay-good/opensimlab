/**
 * The English source catalog. Each surface moves its strings here as it is
 * externalised; the site bar, on every page, is the first. Clinical content
 * never appears here: it is translated only with a clinical review record.
 */
import type { LocaleCatalog, Params, SourceMessage } from './catalog';
import { translate } from './catalog';

export const EN_MESSAGES = {
  'sitebar.skip': { class: 'interface', text: 'Skip to main content' },
  'sitebar.home': { class: 'interface', text: 'Open Sim Lab' },
  'sitebar.browse': { class: 'interface', text: 'Browse' },
  'sitebar.nav-label': { class: 'interface', text: 'Site' },
  'sitebar.anesthesia': { class: 'interface', text: 'Anesthesia' },
  'sitebar.emergency-medicine': { class: 'interface', text: 'Emergency' },
  'sitebar.critical-care': { class: 'interface', text: 'Critical care' },
  'sitebar.cardiology': { class: 'interface', text: 'Cardiology' },
  'sitebar.respiratory-medicine': { class: 'interface', text: 'Respiratory medicine' },
  'sitebar.pediatrics': { class: 'interface', text: 'Pediatrics' },
  'sitebar.neurology': { class: 'interface', text: 'Neurology' },
  'sitebar.toxicology': { class: 'interface', text: 'Toxicology' },
  'sitebar.obstetrics': { class: 'interface', text: 'Obstetrics' },
  'sitebar.neonatology': { class: 'interface', text: 'Neonatology' },
  'sitebar.endocrine-metabolic': { class: 'interface', text: 'Endocrine + metabolic' },
  'sitebar.renal-electrolyte': { class: 'interface', text: 'Renal + electrolyte' },
  'sitebar.infectious-disease': { class: 'interface', text: 'Infectious disease' },
  'sitebar.medical-surgical-nursing': { class: 'interface', text: 'Nursing' },
  'sitebar.oncology': { class: 'interface', text: 'Oncology' },
  'sitebar.surgery-trauma': { class: 'interface', text: 'Surgery + trauma' },
  'sitebar.about': { class: 'interface', text: 'About' },
  'sitebar.for-educators': { class: 'interface', text: 'For educators' },
  'sitebar.curriculum': { class: 'interface', text: 'Curriculum' },
  'sitebar.validation': { class: 'interface', text: 'Validation' },
  'sitebar.governance': { class: 'interface', text: 'Governance' },
  'sitebar.limitations': { class: 'interface', text: 'Limitations' },
  'documents.review-status': { class: 'interface', text: 'Review status' },
  'documents.corrections': { class: 'interface', text: 'Corrections' },
  'documents.privacy': { class: 'interface', text: 'Privacy' },
  'documents.content-review': { class: 'interface', text: 'Review the content' },
  'documents.heading-fallback': { class: 'interface', text: 'Document' },
  'documents.footer.home': { class: 'interface', text: 'Back to the front page' },
  'documents.footer.about': { class: 'interface', text: 'About Open Sim Lab' },
  'documents.footer.simulator': { class: 'interface', text: 'Open the simulator' },
} as const satisfies Readonly<Record<string, SourceMessage>>;

export type MessageKey = keyof typeof EN_MESSAGES;

/**
 * Locale catalogs that exist. None yet: a locale is added only with named
 * translators, and offered only at full, non-stale coverage.
 */
export const LOCALE_CATALOGS: readonly LocaleCatalog[] = [];

let activeCatalog: LocaleCatalog | undefined;

/**
 * Switch the catalog `t` reads by default. Nothing in production calls this
 * yet, because no locale is offered; development uses it for the pseudo-locales.
 */
export function setActiveCatalog(catalog: LocaleCatalog | undefined): void {
  activeCatalog = catalog;
}

/** The interface string for a key, in English until a locale is offered. */
export function t(key: MessageKey, params?: Params, catalog: LocaleCatalog | undefined = activeCatalog): string {
  return translate(EN_MESSAGES, key, params, catalog);
}
