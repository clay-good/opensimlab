/**
 * The landing page's prose (platform/landing → Substantive Content Lives Below
 * The Fold).
 *
 * Written for a human who scrolled because they wanted to know more. Every
 * paragraph would be worth reading to that person. There is no keyword filler, no
 * hidden text, no location or specialty permutation, and no claim the validation
 * report and the limitations register do not support.
 */

import { availableModules } from '@platform/modules/registry';
import { APP_VERSION } from '@platform/governance/status';
import { CORE_MESSAGES, t, type MessageKey } from '@platform/i18n/messages';

/**
 * Both counts are derived from the module registry rather than typed here.
 *
 * The front door now prints a scenario count on every module tile AND a total in
 * the one-line description. Two hand-maintained numbers that must agree is one
 * number too many: a module gaining a scenario used to leave the tagline quietly
 * under-selling the product until someone noticed. The registry declares the
 * per-module count, `tests/unit/discoverability.test.ts` holds each declaration
 * against the real scenario array, and these two totals follow from it.
 */
export const READY_MODULE_COUNT = availableModules().length;
export const READY_SCENARIO_COUNT = availableModules()
  .reduce((total, module) => total + module.scenarioCount, 0);

/**
 * Read once, when the module loads, because it is a plain string that the
 * structured data and the front door both import. Every other piece of prose
 * below is a getter, so a test locale applied after load still reaches it.
 */
export const ONE_LINE_DESCRIPTION = t('land.tagline', {
  scenarios: READY_SCENARIO_COUNT, modules: READY_MODULE_COUNT,
});

/** A catalog key built from a pattern, checked so a typo throws instead of rendering a key. */
function key(name: string): MessageKey {
  if (!(name in CORE_MESSAGES)) throw new Error(`landing copy has no catalog entry ${name}`);
  return name as MessageKey;
}

/** Exactly three facts, chosen because they answer the objections a visitor has. */
export interface SupportingFact {
  /** The full sentence, used on the About page. */
  readonly text: string;
  /** Two or three words, used as the front door's one quiet line. */
  readonly short: string;
  readonly linkLabel: string;
  readonly href: string;
}

function fact(n: number, href: string): SupportingFact {
  return {
    get text() { return t(key(`land.fact${n}.text`)); },
    get short() { return t(key(`land.fact${n}.short`)); },
    get linkLabel() { return t(key(`land.fact${n}.link`)); },
    href,
  };
}

export const THREE_FACTS: readonly SupportingFact[] = [
  fact(1, '/privacy'),
  fact(2, '/privacy'),
  fact(3, '/validation'),
];

export interface ContentSection {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly list?: readonly string[];
  readonly link?: { readonly label: string; readonly href: string };
}

/**
 * One section's prose, read from the catalog by its id: a heading, `paragraphs`
 * numbered paragraphs, `items` numbered list items, and a link when it has one.
 */
function section(
  id: string, paragraphs: number, items = 0, href?: string,
): ContentSection {
  const range = (count: number) => Array.from({ length: count }, (_, index) => index + 1);
  return {
    id,
    get heading() { return t(key(`land.${id}.heading`)); },
    get paragraphs() {
      return range(paragraphs).map((n) => t(key(`land.${id}.p${n}`), { scenarios: READY_SCENARIO_COUNT }));
    },
    ...(items > 0 ? { get list() { return range(items).map((n) => t(key(`land.${id}.li${n}`))); } } : {}),
    ...(href ? { link: { get label() { return t(key(`land.${id}.link`)); }, href } } : {}),
  };
}

/** In this order, because that is the order a stranger's questions arrive in. */
export const CONTENT_SECTIONS: readonly ContentSection[] = [
  section('what-it-teaches', 3),
  section('who-it-is-for', 2),
  section('inside-the-module', 3, 5, '/#modules'),
  section('where-the-pharmacology-comes-from', 3, 0, '/validation'),
  section('how-it-is-reviewed', 2, 0, '/governance'),
  section('what-it-does-not-do', 3, 0, '/limitations'),
  section('using-it-in-a-course', 3),
];

export interface QuestionAnswer {
  readonly question: string;
  readonly answer: string;
}

/** The questions a visitor actually asks, answered plainly. */
export const QUESTIONS: readonly QuestionAnswer[] = Array.from({ length: 9 }, (_, index) => ({
  get question() { return t(key(`land.q${index + 1}.question`)); },
  get answer() { return t(key(`land.q${index + 1}.answer`)); },
}));

/**
 * The one thing this project is asking anyone for.
 *
 * It sits under the honest-status line in the footer, because that line says
 * nothing here is clinically reviewed and this is the sentence that says what
 * would change it. It asks for a reviewer and nothing else: no donation, no
 * newsletter, no address collected in either direction. The visitor's own mail
 * client opens with a subject already written, so a clinician who is willing
 * has to compose nothing to say so.
 *
 * Short on purpose. A long appeal on a front door reads as a campaign, and the
 * people who can actually answer this need one sentence, not a case.
 */
export const REVIEWER_INVITATION = {
  /** Read as the continuation of `HONEST_STATUS.headline` directly above it. */
  get text() { return t('land.invitation'); },
  href:
    'mailto:hi@claygood.com'
    + '?subject='
    + encodeURIComponent('I am a certified US clinician who can help review Open Sim Lab'),
};

/** The footer trust block. Each link names its destination. */
export const FOOTER_LINKS: readonly { readonly label: string; readonly href: string }[] = [
  { get label() { return t('sitebar.validation'); }, href: '/validation' },
  { get label() { return t('sitebar.governance'); }, href: '/governance' },
  { get label() { return t('sitebar.limitations'); }, href: '/limitations' },
  { get label() { return t('documents.privacy'); }, href: '/privacy' },
  { get label() { return t('land.footer.license'); }, href: 'https://github.com/clay-good/opensimlab/blob/main/LICENSE' },
  { get label() { return t('land.footer.source'); }, href: 'https://github.com/clay-good/opensimlab' },
];

/**
 * The citation for the running build, from the same release identity the
 * transcript records, so a reader cites the exact version they used. The title
 * and author match `CITATION.cff`, which a test holds in step. No persistent
 * identifier is printed because none has been issued; inventing one would be
 * the one citation error a reader cannot detect.
 */
export function suggestedCitation(release: string): string {
  const year = /^\d{4}/.exec(release)?.[0];
  const version = year === undefined ? 'an unreleased source build' : `release ${release}`;
  return `Good C. Open Sim Lab: an open-source browser-native clinical simulator${year === undefined ? '' : ` (${year})`}. `
    + `Software, ${version}. https://opensimlab.com. No archived persistent identifier has been issued yet.`;
}

export const SUGGESTED_CITATION = suggestedCitation(APP_VERSION);

/** Words the one-line description is forbidden to contain. */
export const FORBIDDEN_MARKETING_WORDS = ['revolutionary', 'cutting-edge', 'AI-powered', 'platform'];
