/**
 * The translator's coverage tool (interface-translation-first-wave →
 * contribution path: a browser-based coverage page — file in, missing/stale
 * out, sample render; no network).
 *
 * A contributor drops a locale catalog in and sees, entirely in the browser,
 * whether it may ship (the same `catalogProblems` the build runs), how much of
 * the interface it covers, which keys are missing or stale, and a sample of its
 * strings rendered with placeholders filled, so a mistake shows before the
 * catalog is ever committed. Nothing here touches the network.
 */

import {
  catalogProblems,
  coverage,
  placeholderNames,
  translate,
  type CatalogCoverage,
  type LocaleCatalog,
  type Params,
  type SourceMessage,
  type TranslatedMessage,
} from './catalog';

export type SampleStatus = 'translated' | 'stale' | 'missing' | 'clinical';

export interface SampleRow {
  readonly key: string;
  readonly status: SampleStatus;
  /** The English source, placeholders filled with sample values. */
  readonly english: string;
  /** What the catalog yields for this key — its translation, or English fallback. */
  readonly rendered: string;
}

export interface CatalogInspection {
  readonly coverage: CatalogCoverage;
  /** Why the catalog may not ship, or empty. */
  readonly problems: readonly string[];
  readonly samples: readonly SampleRow[];
}

/** Sample values for a message's placeholders: a count for plurals, a token otherwise. */
function sampleParams(text: string): Params {
  const params: Record<string, string | number> = {};
  for (const name of placeholderNames(text)) {
    const isPlural = new RegExp(`\\{${name}\\s*,\\s*plural`).test(text);
    params[name] = isPlural ? 2 : `‹${name}›`;
  }
  return params;
}

/**
 * A representative sample for each status, so the contributor sees a translated
 * string filled, a stale one falling back, a missing one, and a clinical one
 * staying English. Translated rows with placeholders come first, because the
 * fill is the thing most worth checking by eye.
 */
function sample(
  source: Readonly<Record<string, SourceMessage>>,
  catalog: LocaleCatalog,
  cov: CatalogCoverage,
  perStatus = 4,
): SampleRow[] {
  const stale = new Set(cov.stale);
  const missing = new Set(cov.missing);
  const statusOf = (key: string): SampleStatus => {
    if (source[key]!.class === 'clinical') return 'clinical';
    if (stale.has(key)) return 'stale';
    if (missing.has(key)) return 'missing';
    return 'translated';
  };
  const byStatus: Record<SampleStatus, string[]> = {
    translated: [],
    stale: [],
    missing: [],
    clinical: [],
  };
  for (const key of Object.keys(source)) byStatus[statusOf(key)].push(key);
  byStatus.translated.sort((a, b) => placeholderNames(source[b]!.text).length - placeholderNames(source[a]!.text).length);

  const rows: SampleRow[] = [];
  for (const status of ['translated', 'stale', 'missing', 'clinical'] as const) {
    for (const key of byStatus[status].slice(0, perStatus)) {
      const params = sampleParams(source[key]!.text);
      rows.push({
        key,
        status,
        english: translate(source, key, params),
        rendered: translate(source, key, params, catalog),
      });
    }
  }
  return rows;
}

export function inspectCatalog(
  source: Readonly<Record<string, SourceMessage>>,
  catalog: LocaleCatalog,
): CatalogInspection {
  const cov = coverage(source, catalog);
  return {
    coverage: cov,
    problems: catalogProblems(source, catalog),
    samples: sample(source, catalog, cov),
  };
}

export interface ParseResult {
  readonly catalog?: LocaleCatalog;
  /** A plain-language reason the text is not a catalog, or undefined. */
  readonly error?: string;
}

function isTranslatedMessage(value: unknown): value is TranslatedMessage {
  return typeof value === 'object' && value !== null
    && typeof (value as TranslatedMessage).text === 'string'
    && typeof (value as TranslatedMessage).sourceHash === 'string';
}

/**
 * Parse pasted or uploaded text into a catalog, reporting the first structural
 * fault in plain language rather than throwing. Shipping faults (an unknown
 * key, a changed placeholder, machine provenance) are left to `catalogProblems`
 * so the page reports them together; this only refuses text that is not a
 * catalog at all.
 */
export function parseCatalog(text: string): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { error: 'The file is not valid JSON.' };
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { error: 'A catalog is a JSON object.' };
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.locale !== 'string' || candidate.locale.trim().length === 0) {
    return { error: 'The catalog needs a "locale" string, such as "es" or "pt-BR".' };
  }
  if (!Array.isArray(candidate.translators) || candidate.translators.some((name) => typeof name !== 'string')) {
    return { error: 'The catalog needs a "translators" array of names.' };
  }
  if (candidate.provenance !== 'human' && candidate.provenance !== 'pseudo') {
    return { error: 'The catalog’s "provenance" must be "human" (or "pseudo" for a test locale).' };
  }
  if (typeof candidate.messages !== 'object' || candidate.messages === null || Array.isArray(candidate.messages)) {
    return { error: 'The catalog needs a "messages" object.' };
  }
  for (const [key, message] of Object.entries(candidate.messages as Record<string, unknown>)) {
    if (!isTranslatedMessage(message)) {
      return { error: `Message "${key}" needs a "text" string and a "sourceHash" string.` };
    }
  }
  return {
    catalog: {
      locale: candidate.locale,
      translators: candidate.translators as readonly string[],
      provenance: candidate.provenance,
      messages: candidate.messages as Readonly<Record<string, TranslatedMessage>>,
    },
  };
}
