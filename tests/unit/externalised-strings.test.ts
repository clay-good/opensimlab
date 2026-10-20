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
  { path: 'src/platform/docs/CorrectionsBody.tsx' },
  { path: 'src/platform/governance/ReviewStatusBody.tsx' },
  { path: 'src/platform/docs/LimitationsBody.tsx' },
  { path: 'src/platform/docs/PrivacyBody.tsx' },
  { path: 'src/platform/governance/GovernanceBody.tsx' },
  { path: 'src/platform/docs/ValidationBody.tsx' },
  { path: 'src/modules/anesthesia/ui/StatusBar.tsx' },
  { path: 'src/modules/anesthesia/ui/TutorRegion.tsx' },
  { path: 'src/modules/anesthesia/ui/DemonstrationBar.tsx' },
  { path: 'src/modules/anesthesia/ui/Debrief.tsx', region: ['  return (\n    <>\n      <a className="skip-link"', '\n}\n'] },
  { path: 'src/modules/anesthesia/ui/GoalRecommendation.tsx', region: ['return (', '\n}\n'] },
  { path: 'src/platform/offline/UpdateNotice.tsx', region: ['  return (\n    <div className={`update-notice', '\n}\n'] },
  { path: 'src/platform/safety/not-for-clinical-use.tsx', region: ['export function NotForClinicalUseGate', '\n}\n'] },
];

/** Text between a closing `>` and the next `<` that is not only whitespace or an expression. */
function literalText(source: string): string[] {
  // Template literals and arrows are code, not markup; drop them so `=>` is not read as a tag end.
  const markup = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/`[^`]*`/g, '``').replace(/=>/g, ' ');
  return [...markup.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)]
    .map((match) => match[1]!.trim())
    // A ternary's branches and a .map call sit between tags too; they are code, not text.
    .filter((text) => text.length > 0 && !/^[=&|?:)]/.test(text) && !text.includes('.map(')
      && !text.includes(';') && !text.includes('return ('));
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
    expect(literalText('</p>\n      ) : (\n        ITEMS.map((entry) => (\n          <section>')).toEqual([]);
    expect(literalText('const n = items.filter((x) => x.count > 0);\n  return (\n    <>')).toEqual([]);
    expect(literalText('{/* links to /<module>/scenario/<id> */}<li>')).toEqual([]);
    expect(literalText('<a href="/">Back to the front page</a>')).toEqual(['Back to the front page']);
    expect(literalText("<a href=\"/\">{t('documents.footer.home')}</a>")).toEqual([]);
  });
});
