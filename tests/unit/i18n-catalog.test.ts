import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import {
  catalogProblems, coverage, formatMessage, placeholderNames, pseudoLocale, sourceHash, translate,
  type LocaleCatalog, type SourceMessage,
} from '@platform/i18n/catalog';
import { EN_MESSAGES, LOCALE_CATALOGS, t } from '@platform/i18n/messages';
import { SITE_BAR_LINKS, SiteBar } from '@platform/ui/SiteBar';
import { DocumentRoute } from '@routes/DocumentRoute';

const SOURCE: Record<string, SourceMessage> = {
  greeting: { class: 'interface', text: 'Hello, {name}' },
  count: { class: 'interface', text: '{n, plural, one {# alarm} other {# alarms}} active' },
  dose: { class: 'clinical', text: 'Give the drug slowly' },
};
const catalog = (messages: LocaleCatalog['messages'], extra: Partial<LocaleCatalog> = {}): LocaleCatalog =>
  ({ locale: 'es', translators: ['A. Translator'], provenance: 'human', messages, ...extra });

describe('message formatting', () => {
  it('fills placeholders and English plurals, and refuses to leave one unfilled', () => {
    expect(formatMessage(SOURCE.greeting!.text, { name: 'Ana' })).toBe('Hello, Ana');
    expect(formatMessage(SOURCE.count!.text, { n: 1 })).toBe('1 alarm active');
    expect(formatMessage(SOURCE.count!.text, { n: 3 })).toBe('3 alarms active');
    expect(formatMessage(SOURCE.greeting!.text, {})).toBeNull();
    expect(placeholderNames(SOURCE.count!.text)).toEqual(['n']);
  });

  it('falls back to English for a missing, stale, unfillable, or clinical translation', () => {
    const fresh = catalog({ greeting: { text: 'Hola, {name}', sourceHash: sourceHash('Hello, {name}') } });
    expect(translate(SOURCE, 'greeting', { name: 'Ana' }, fresh)).toBe('Hola, Ana');
    const stale = catalog({ greeting: { text: 'Hola, {name}', sourceHash: 'deadbeef' } });
    expect(translate(SOURCE, 'greeting', { name: 'Ana' }, stale)).toBe('Hello, Ana');
    const broken = catalog({ greeting: { text: 'Hola, {nombre}', sourceHash: sourceHash('Hello, {name}') } });
    expect(translate(SOURCE, 'greeting', { name: 'Ana' }, broken)).toBe('Hello, Ana');
    const clinical = catalog({ dose: { text: 'Administrar despacio', sourceHash: sourceHash('Give the drug slowly') } });
    expect(translate(SOURCE, 'dose', {}, clinical)).toBe('Give the drug slowly');
    expect(() => translate(SOURCE, 'greeting', {})).toThrow('missing a parameter');
  });
});

describe('catalog rules', () => {
  it('reports coverage, staleness, and offers a locale only when complete', () => {
    const partial = catalog({ greeting: { text: 'Hola, {name}', sourceHash: 'old' } });
    expect(coverage(SOURCE, partial)).toMatchObject({ total: 2, translated: 0, stale: ['greeting'], missing: ['count'], offerable: false });
    const full = catalog({
      greeting: { text: 'Hola, {name}', sourceHash: sourceHash(SOURCE.greeting!.text) },
      count: { text: '{n, plural, one {# alarma} other {# alarmas}} activas', sourceHash: sourceHash(SOURCE.count!.text) },
    });
    expect(coverage(SOURCE, full).offerable).toBe(true);
  });

  it('refuses clinical keys, unknown keys, changed placeholders, anonymous or machine catalogs', () => {
    const bad = catalog({
      dose: { text: 'x', sourceHash: 'x' }, nope: { text: 'x', sourceHash: 'x' },
      greeting: { text: 'Hola', sourceHash: 'x' },
    }, { translators: [], provenance: 'pseudo' });
    expect(catalogProblems(SOURCE, bad)).toEqual([
      'catalog is not human-translated', 'catalog names no translator',
      'clinical key "dose" in an interface catalog', 'unknown key "nope"',
      '"greeting" does not use the same placeholders as its English',
    ]);
  });

  it('every shipped catalog is clean, and none is offered yet', () => {
    for (const shipped of LOCALE_CATALOGS) expect(catalogProblems(EN_MESSAGES, shipped)).toEqual([]);
    expect(LOCALE_CATALOGS.filter((shipped) => coverage(EN_MESSAGES, shipped).offerable)).toEqual([]);
  });
});

describe('pseudo-locales', () => {
  it('lengthen every interface string by about 40% in brackets, or keep it for right-to-left', () => {
    const xa = pseudoLocale(EN_MESSAGES, 'en-XA');
    for (const [key, message] of Object.entries(EN_MESSAGES)) {
      const long = xa.messages[key]!.text;
      expect(long.startsWith('[') && long.endsWith(']')).toBe(true);
      expect(long.length).toBeGreaterThanOrEqual(Math.floor(message.text.length * 1.4));
    }
    expect(pseudoLocale(EN_MESSAGES, 'en-XB').messages['sitebar.browse']?.text).toBe('Browse');
    expect(catalogProblems(EN_MESSAGES, xa)).toContain('catalog is not human-translated');
  });

  it('renders the site bar under en-XA without a raw placeholder or a lost link', () => {
    const xa = pseudoLocale(EN_MESSAGES, 'en-XA');
    expect(t('sitebar.browse', undefined, xa)).toMatch(/^\[Browse·+\]$/);
  });
});

describe('the externalised site bar and the status page', () => {
  it('renders the same English it always did, from the catalog', () => {
    const markup = renderToStaticMarkup(createElement(SiteBar));
    expect(markup).toContain('Skip to main content');
    expect(markup).toContain('>Browse</summary>');
    expect(SITE_BAR_LINKS.find((link) => link.href === '/medical-surgical-nursing')?.label).toBe('Nursing');
    expect(SITE_BAR_LINKS).toHaveLength(22);
  });

  it('publishes /translation-status with the counts first and clinical content stated as English', () => {
    const markup = renderToStaticMarkup(createElement(DocumentRoute, { path: '/translation-status' }));
    expect(markup.indexOf('figure__value')).toBeLessThan(markup.indexOf('<p>'));
    expect(markup).toContain(`<span class="figure__value">${Object.keys(EN_MESSAGES).length}</span>`);
    expect(markup).toContain('No translation has been contributed yet');
    expect(markup).toContain('stays in English');
  });
});

describe('the active catalog', () => {
  it('switches what the site bar renders, then switches back, with no label captured at load', async () => {
    const { setActiveCatalog } = await import('@platform/i18n/messages');
    try {
      setActiveCatalog(pseudoLocale(EN_MESSAGES, 'en-XA'));
      expect(SITE_BAR_LINKS[0]?.label).toMatch(/^\[Anesthesia·+\]$/);
      expect(renderToStaticMarkup(createElement(SiteBar))).toMatch(/>\[Browse·+\]<\/summary>/);
    } finally {
      setActiveCatalog(undefined);
    }
    expect(SITE_BAR_LINKS[0]?.label).toBe('Anesthesia');
  });
});
