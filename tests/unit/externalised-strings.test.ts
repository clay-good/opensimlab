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
  { path: 'src/modules/anesthesia/ui/AnalysisRegion.tsx' },
  { path: 'src/modules/anesthesia/ui/MonitorRegion.tsx' },
  { path: 'src/modules/anesthesia/ui/ConcentrationPanel.tsx' },
  { path: 'src/modules/anesthesia/ui/WhyPanel.tsx' },
  { path: 'src/routes/CurriculumRoute.tsx' },
  { path: 'src/routes/educator-pages.ts' },
  { path: 'src/routes/EducatorsRoute.tsx' },
  { path: 'src/routes/ReviewRoute.tsx' },
  { path: 'src/landing/Landing.tsx' },
  { path: 'src/landing/About.tsx' },
  { path: 'src/routes/PlannedModuleRoute.tsx' },
  { path: 'src/routes/ContentReviewRoute.tsx' },
  { path: 'src/routes/Prerendered.tsx' },
  { path: 'src/platform/ui/ErrorBoundary.tsx' },
  { path: 'src/platform/governance/FlagControl.tsx' },
  // The shell's markup. Its screen-reader announcements describe clinical state and stay
  // with the engine's own wording.
  { path: 'src/modules/anesthesia/ui/Cockpit.tsx' },
  // From the limitations section to the end: the per-module orientation above it is authored
  // clinical framing and stays with the scenarios.
  { path: 'src/modules/anesthesia/ui/Prebrief.tsx', region: ['      {/* Sentences from the register', '\n}\n'] },
  // Its crisis names and boundaries above the component are clinical content and stay data.
  { path: 'src/modules/anesthesia/ui/ManualCrisisInjector.tsx', region: ['export function ManualCrisisInjector', '\n}\n'] },
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
    .filter((text) => text.length > 0 && !/^[=&|?:)]/.test(text) && !/^\d+\s*(&&|\|\||\?)/.test(text)
      && !text.includes('.map(')
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
    // A comparison's `>` is not a tag end: `length > 0 && (` is code.
    expect(literalText('{existing.length > 0 && !open && (\n  <p>')).toEqual([]);
    expect(literalText('<a href="/">Back to the front page</a>')).toEqual(['Back to the front page']);
    expect(literalText("<a href=\"/\">{t('documents.footer.home')}</a>")).toEqual([]);
  });
});
