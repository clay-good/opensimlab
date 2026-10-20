/**
 * Interface translation catalogs (interface-translation-first-wave →
 * infrastructure).
 *
 * English is the source catalog and the fallback. Every key carries a class,
 * and clinical content never enters an interface catalog: it stays English,
 * marked, until a clinically reviewed translation exists. A message is never
 * assembled from fragments, and a placeholder never reaches the screen raw: a
 * translation that cannot be filled falls back to English, and English that
 * cannot be filled is a programming error.
 */

export type MessageClass = 'interface' | 'educator' | 'root-prose' | 'clinical';

export interface SourceMessage {
  readonly class: MessageClass;
  readonly text: string;
}

export interface TranslatedMessage {
  readonly text: string;
  /** The source hash of the English it translated, so a changed English marks it stale. */
  readonly sourceHash: string;
}

export interface LocaleCatalog {
  readonly locale: string;
  /** Named people. A catalog with nobody behind it is refused. */
  readonly translators: readonly string[];
  /**
   * Only `human` catalogs may ship. `pseudo` marks the generated test locales;
   * a machine-seeded catalog has no value here at all, because nobody reviewed it.
   */
  readonly provenance: 'human' | 'pseudo';
  readonly messages: Readonly<Record<string, TranslatedMessage>>;
}

export type Params = Readonly<Record<string, string | number>>;

/** A short, stable hash of an English string (FNV-1a, hex). */
export function sourceHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

const PLURAL = /\{(\w+),\s*plural,\s*((?:\w+\s*\{[^{}]*\}\s*)+)\}/g;
const PLACEHOLDER = /\{(\w+)\}/g;

/** The placeholder and plural names a message uses. */
export function placeholderNames(text: string): string[] {
  const names = new Set<string>();
  for (const match of text.matchAll(PLURAL)) names.add(match[1]!);
  for (const match of text.replace(PLURAL, '').matchAll(PLACEHOLDER)) names.add(match[1]!);
  return [...names].sort();
}

/**
 * Fill a message. Plurals choose `one` for exactly 1 and `other` otherwise,
 * which is right for English, Spanish, and Portuguese; a locale that needs more
 * categories adds them before it ships. Returns null if anything is left unfilled.
 */
export function formatMessage(text: string, params: Params = {}): string | null {
  let unresolved = false;
  const pluralised = text.replace(PLURAL, (_, name: string, branches: string) => {
    const value = params[name];
    if (typeof value !== 'number') { unresolved = true; return ''; }
    const options = Object.fromEntries([...branches.matchAll(/(\w+)\s*\{([^{}]*)\}/g)].map((m) => [m[1]!, m[2]!]));
    const chosen = options[value === 1 ? 'one' : 'other'] ?? options.other;
    if (chosen === undefined) { unresolved = true; return ''; }
    return chosen.replace(/#/g, String(value));
  });
  const filled = pluralised.replace(PLACEHOLDER, (_, name: string) => {
    const value = params[name];
    if (value === undefined) { unresolved = true; return ''; }
    return String(value);
  });
  return unresolved ? null : filled;
}

/** Look a key up in a catalog, falling back to English. */
export function translate(
  source: Readonly<Record<string, SourceMessage>>,
  key: string,
  params: Params = {},
  catalog?: LocaleCatalog,
): string {
  const english = source[key];
  if (!english) throw new Error(`No English source for message "${key}"`);
  const translated = catalog?.messages[key];
  if (translated && translated.sourceHash === sourceHash(english.text) && english.class !== 'clinical') {
    const filled = formatMessage(translated.text, params);
    if (filled !== null) return filled;
  }
  const filled = formatMessage(english.text, params);
  if (filled === null) throw new Error(`Message "${key}" is missing a parameter`);
  return filled;
}

export interface CatalogCoverage {
  readonly locale: string;
  readonly total: number;
  readonly translated: number;
  readonly stale: readonly string[];
  readonly missing: readonly string[];
  /** Offered in the language selector only at full, non-stale coverage. */
  readonly offerable: boolean;
}

/** Translatable keys are every non-clinical source key. */
export function coverage(source: Readonly<Record<string, SourceMessage>>, catalog: LocaleCatalog): CatalogCoverage {
  const keys = Object.keys(source).filter((key) => source[key]!.class !== 'clinical');
  const stale = keys.filter((key) => catalog.messages[key] !== undefined
    && catalog.messages[key]!.sourceHash !== sourceHash(source[key]!.text));
  const missing = keys.filter((key) => catalog.messages[key] === undefined);
  const translated = keys.length - stale.length - missing.length;
  return { locale: catalog.locale, total: keys.length, translated, stale, missing,
    offerable: stale.length === 0 && missing.length === 0 && keys.length > 0 };
}

/** Why a catalog may not ship, or nothing. */
export function catalogProblems(source: Readonly<Record<string, SourceMessage>>, catalog: LocaleCatalog): string[] {
  const problems: string[] = [];
  if (catalog.provenance !== 'human') problems.push('catalog is not human-translated');
  if (catalog.translators.filter((name) => name.trim().length > 0).length === 0) problems.push('catalog names no translator');
  for (const [key, message] of Object.entries(catalog.messages)) {
    const english = source[key];
    if (!english) { problems.push(`unknown key "${key}"`); continue; }
    if (english.class === 'clinical') problems.push(`clinical key "${key}" in an interface catalog`);
    if (placeholderNames(message.text).join() !== placeholderNames(english.text).join()) {
      problems.push(`"${key}" does not use the same placeholders as its English`);
    }
  }
  return problems;
}

/**
 * Padding in short groups separated by spaces, because real translations grow
 * by longer words and more of them, which still wrap. One unbroken run of
 * dots cannot wrap, and made pages scroll sideways that any language would not.
 */
function padding(length: number): string {
  let out = '';
  for (let index = 0; index < length; index += 1) out += index > 0 && index % 4 === 0 ? ' ·' : '·';
  return out;
}

/**
 * Pseudo-locales for testing layout, never offered to learners. `en-XA` grows
 * every string by about 40% inside brackets so truncation shows; `en-XB` keeps
 * the text and is rendered right-to-left so mirroring bugs show.
 */
export function pseudoLocale(source: Readonly<Record<string, SourceMessage>>, locale: 'en-XA' | 'en-XB'): LocaleCatalog {
  const messages: Record<string, TranslatedMessage> = {};
  for (const [key, message] of Object.entries(source)) {
    if (message.class === 'clinical') continue;
    const text = locale === 'en-XB' ? message.text
      : `[${message.text}${padding(Math.max(1, Math.ceil(message.text.replace(PLACEHOLDER, '').length * 0.4)))}]`;
    messages[key] = { text, sourceHash: sourceHash(message.text) };
  }
  return { locale, translators: [], provenance: 'pseudo', messages };
}

export const PSEUDO_LOCALE_DIRECTION: Readonly<Record<'en-XA' | 'en-XB', 'ltr' | 'rtl'>> = { 'en-XA': 'ltr', 'en-XB': 'rtl' };
