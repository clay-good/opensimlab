/**
 * interface-translation-first-wave → the browser-based coverage tool. Parsing
 * untrusted text into a catalog, and the inspection a contributor sees: the
 * same coverage and shipping checks the build runs, plus a sample render that
 * fills placeholders and falls back where it must.
 */
import { describe, expect, it } from 'vitest';
import { sourceHash, type LocaleCatalog, type SourceMessage } from '@platform/i18n/catalog';
import { inspectCatalog, parseCatalog } from '@platform/i18n/coverage-tool';
import { EN_MESSAGES } from '@platform/i18n/all-messages';

const SOURCE: Record<string, SourceMessage> = {
  greeting: { class: 'interface', text: 'Hello, {name}' },
  count: { class: 'interface', text: '{n, plural, one {# alarm} other {# alarms}} active' },
  about: { class: 'root-prose', text: 'About the project' },
  dose: { class: 'clinical', text: 'Give the drug slowly' },
};

const catalog = (messages: LocaleCatalog['messages'], extra: Partial<LocaleCatalog> = {}): LocaleCatalog =>
  ({ locale: 'es', translators: ['A. Translator'], provenance: 'human', messages, ...extra });

describe('parseCatalog', () => {
  it('reads a well-formed catalog', () => {
    const text = JSON.stringify(catalog({ greeting: { text: 'Hola, {name}', sourceHash: sourceHash('Hello, {name}') } }));
    const { catalog: parsed, error } = parseCatalog(text);
    expect(error).toBeUndefined();
    expect(parsed?.locale).toBe('es');
    expect(parsed?.messages.greeting?.text).toBe('Hola, {name}');
  });

  it('refuses text that is not a catalog, in plain language', () => {
    expect(parseCatalog('not json').error).toMatch(/not valid JSON/);
    expect(parseCatalog('[]').error).toMatch(/JSON object/);
    expect(parseCatalog('{}').error).toMatch(/locale/);
    expect(parseCatalog('{"locale":"es"}').error).toMatch(/translators/);
    expect(parseCatalog('{"locale":"es","translators":[]}').error).toMatch(/provenance/);
    expect(parseCatalog('{"locale":"es","translators":[],"provenance":"human"}').error).toMatch(/messages/);
    expect(parseCatalog('{"locale":"es","translators":[],"provenance":"human","messages":{"k":{"text":"x"}}}').error)
      .toMatch(/sourceHash/);
  });

  it('does not judge shipping faults — that is left to the inspection', () => {
    // Machine provenance and an unknown key parse cleanly; catalogProblems reports them.
    const { catalog: parsed, error } = parseCatalog(JSON.stringify({
      locale: 'es', translators: ['A. Translator'], provenance: 'human',
      messages: { unknown: { text: 'x', sourceHash: 'deadbeef' } },
    }));
    expect(error).toBeUndefined();
    expect(parsed).toBeDefined();
  });
});

describe('inspectCatalog', () => {
  it('reports coverage over translatable keys, excluding clinical', () => {
    const fresh = catalog({
      greeting: { text: 'Hola, {name}', sourceHash: sourceHash('Hello, {name}') },
      count: { text: '{n, plural, one {# alarma} other {# alarmas}} activas', sourceHash: sourceHash(SOURCE.count!.text) },
    });
    const { coverage } = inspectCatalog(SOURCE, fresh);
    expect(coverage.total).toBe(3); // greeting, count, about — not the clinical dose
    expect(coverage.translated).toBe(2);
    expect(coverage.missing).toEqual(['about']);
    expect(coverage.offerable).toBe(false);
  });

  it('marks a stale translation when its English changed', () => {
    const stale = catalog({
      greeting: { text: 'Hola, {name}', sourceHash: 'deadbeef' },
      count: { text: '…', sourceHash: sourceHash(SOURCE.count!.text) },
      about: { text: 'Sobre', sourceHash: sourceHash('About the project') },
    });
    const { coverage } = inspectCatalog(SOURCE, stale);
    expect(coverage.stale).toEqual(['greeting']);
  });

  it('runs the same shipping checks as the build', () => {
    const bad = catalog(
      { dose: { text: 'Administrar despacio', sourceHash: sourceHash('Give the drug slowly') } },
      { provenance: 'pseudo', translators: [] },
    );
    const { problems } = inspectCatalog(SOURCE, bad);
    expect(problems).toContain('catalog is not human-translated');
    expect(problems).toContain('catalog names no translator');
    expect(problems.some((p) => p.includes('clinical'))).toBe(true);
  });

  it('samples each status, filling placeholders and showing fallback', () => {
    const fresh = catalog({
      greeting: { text: 'Hola, {name}', sourceHash: sourceHash('Hello, {name}') },
    });
    const { samples } = inspectCatalog(SOURCE, fresh);
    const greeting = samples.find((row) => row.key === 'greeting');
    expect(greeting?.status).toBe('translated');
    expect(greeting?.rendered).toBe('Hola, ‹name›'); // placeholder filled with a token
    expect(greeting?.english).toBe('Hello, ‹name›');

    const about = samples.find((row) => row.key === 'about');
    expect(about?.status).toBe('missing');
    expect(about?.rendered).toBe('About the project'); // falls back to English

    const dose = samples.find((row) => row.key === 'dose');
    expect(dose?.status).toBe('clinical');
    expect(dose?.rendered).toBe('Give the drug slowly'); // clinical stays English

    const count = samples.find((row) => row.key === 'count');
    expect(count?.english).toBe('2 alarms active'); // plural picks "other" for the sample count
  });

  it('inspects the real English catalog against its own pseudo-locale without throwing', () => {
    // A pseudo catalog is fully populated, so coverage is complete but it never ships.
    const pseudo = parseCatalog(JSON.stringify({
      locale: 'en-XB', translators: [], provenance: 'pseudo',
      messages: Object.fromEntries(
        Object.entries(EN_MESSAGES)
          .filter(([, message]) => message.class !== 'clinical')
          .map(([key, message]) => [key, { text: message.text, sourceHash: sourceHash(message.text) }]),
      ),
    }));
    expect(pseudo.catalog).toBeDefined();
    const inspection = inspectCatalog(EN_MESSAGES, pseudo.catalog!);
    expect(inspection.coverage.missing).toEqual([]);
    expect(inspection.coverage.stale).toEqual([]);
    expect(inspection.problems).toContain('catalog is not human-translated');
    expect(inspection.samples.length).toBeGreaterThan(0);
  });
});
