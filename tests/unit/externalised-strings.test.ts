/**
 * interface-translation-first-wave → the hard-coded-string test, applied to the
 * surfaces externalised so far. A surface joins EXTERNALISED when its strings
 * move into the catalog; from then on, a literal string in its markup fails.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const EXTERNALISED: readonly { readonly path: string; readonly region?: readonly [string, string] }[] = [
  { path: 'src/platform/ui/SiteBar.tsx', region: ['return (', '\n}\n'] },
  { path: 'src/routes/DocumentRoute.tsx', region: ['export function DocumentRoute', '\n}\n'] },
  { path: 'src/modules/anesthesia/ui/RapidCyclePanel.tsx' },
  { path: 'src/modules/anesthesia/ui/PausePointPanel.tsx' },
  { path: 'src/modules/anesthesia/ui/SessionPreferences.tsx', region: ['export function SessionPreferences', '\n}\n'] },
  { path: 'src/modules/anesthesia/ui/SpacedReturnSuggestion.tsx', region: ['return (', '\n}\n'] },
  { path: 'src/modules/anesthesia/ui/NcjmmCoverageList.tsx' },
  { path: 'src/routes/FacilitatorGuideRoute.tsx' },
  { path: 'src/platform/i18n/TranslationStatusBody.tsx' },
  { path: 'src/modules/anesthesia/ui/VerificationQueueBody.tsx' },
  { path: 'src/modules/anesthesia/ui/GoalRecommendation.tsx', region: ['return (', '\n}\n'] },
];

/** Text between a closing `>` and the next `<` that is not only whitespace or an expression. */
function literalText(source: string): string[] {
  // Template literals and arrows are code, not markup; drop them so `=>` is not read as a tag end.
  const markup = source.replace(/`[^`]*`/g, '``').replace(/=>/g, ' ');
  return [...markup.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)]
    .map((match) => match[1]!.trim()).filter((text) => text.length > 0 && !/^[=&|?:]/.test(text));
}

describe('externalised surfaces carry no hard-coded interface text', () => {
  it.each(EXTERNALISED)('$path', ({ path, region }) => {
    let source = readFileSync(path, 'utf8');
    if (region) {
      const start = source.indexOf(region[0]);
      source = source.slice(start, source.indexOf(region[1], start) + region[1].length);
    }
    expect(literalText(source)).toEqual([]);
    expect(source).not.toMatch(/label: '[A-Z]/);
  });
});

describe('the check itself', () => {
  it('catches literal text in markup and ignores expressions and template literals', () => {
    expect(literalText('const briefing = `/${route}/scenario/${id}`;\nconst f = (x) => x;')).toEqual([]);
    expect(literalText('<a href="/">Back to the front page</a>')).toEqual(['Back to the front page']);
    expect(literalText("<a href=\"/\">{t('documents.footer.home')}</a>")).toEqual([]);
  });
});
