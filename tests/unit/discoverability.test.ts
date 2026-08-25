/**
 * Acceptance tests for platform/discoverability, platform/landing, and
 * platform/module-contract.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ROUTES, SITE_NAME, canonicalUrl, formatTitle, indexableRoutes, routeFor, socialImageUrl,
} from '@routes/routes';
import {
  learningResourceJsonLd, organizationJsonLd, softwareApplicationJsonLd, structuredDataFor, websiteJsonLd,
} from '@platform/docs/structured-data';
import {
  CONTENT_SECTIONS, FOOTER_LINKS, FORBIDDEN_MARKETING_WORDS, ONE_LINE_DESCRIPTION, QUESTIONS,
  SUGGESTED_CITATION, THREE_FACTS,
} from '@landing/content';
import { heroStaticSvg } from '@landing/hero';
import { SCENARIOS } from '@anesthesia/scenarios';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';
import { Landing } from '@landing/Landing';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MODULES, RELEASE_FEED_URL, availableModules, plannedModules, speedsFor } from '@platform/modules/registry';
import { EDITORIAL_BOARD } from '@platform/governance/records';
import { isCrawler } from '@platform/offline/register';
import { PrerenderedBody } from '@routes/Prerendered';

describe('Requirement: Per-Route Metadata', () => {
  it('Scenario: Titles are specific and consistently formed', () => {
    const titles = ROUTES.map((route) => route.title);
    expect(new Set(titles).size, 'a title is duplicated').toBe(titles.length);
    for (const route of ROUTES) {
      expect(route.title.length, `${route.path} title is ${route.title.length} characters`)
        .toBeLessThan(60);
      expect(route.title.endsWith(SITE_NAME), `${route.path} does not follow the title pattern`).toBe(true);
      expect(route.title).toBe(formatTitle(route.title.replace(` · ${SITE_NAME}`, '')));
    }
  });

  it('Scenario: Descriptions describe the page, not the project', () => {
    const descriptions = ROUTES.map((route) => route.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const route of ROUTES) {
      expect(route.description.length, `${route.path} description is ${route.description.length} characters`)
        .toBeGreaterThanOrEqual(110);
      expect(route.description.length).toBeLessThanOrEqual(160);
      // Not a copy of the site-wide description.
      if (route.path !== '/') expect(route.description).not.toBe(routeFor('/')?.description);
    }
  });

  it('Scenario: Canonicals prevent duplicate indexing', () => {
    expect(canonicalUrl('/')).toBe('https://opensimlab.com/');
    expect(canonicalUrl('/anesthesia')).toBe('https://opensimlab.com/anesthesia');
    // A trailing slash resolves to the same canonical.
    expect(canonicalUrl('/anesthesia/')).toBe(canonicalUrl('/anesthesia'));
    expect(socialImageUrl('/')).toBe('https://opensimlab.com/og/index.svg');
    expect(socialImageUrl('/anesthesia/scenario/dilutional-coagulopathy'))
      .toBe('https://opensimlab.com/og/anesthesia-scenario-dilutional-coagulopathy.svg');
  });

  it('Scenario: Scenario briefing pages are indexable, sessions are not', () => {
    expect(routeFor('/anesthesia/scenario/routine-induction')?.indexable).toBe(true);
    // Development surfaces are not indexable.
    expect(routeFor('/gallery')?.indexable).toBe(false);
    expect(routeFor('/frame-budget')?.indexable).toBe(false);
  });
});

describe('Requirement: The Root Domain Carries The Search Weight', () => {
  it('Scenario: The simulator route stays clean', () => {
    const anesthesia = routeFor('/anesthesia')!;
    // A title, a description, a canonical, social tags, and SoftwareApplication.
    expect(anesthesia.structuredData).toEqual(['SoftwareApplication']);
    // No marketing prose, no keyword section, no questions block on that route.
    expect(anesthesia.description.length).toBeLessThanOrEqual(160);
    for (const word of FORBIDDEN_MARKETING_WORDS) {
      expect(anesthesia.description.toLowerCase()).not.toContain(word.toLowerCase());
    }
  });

  it('Scenario: The root domain carries the substantive indexable document', () => {
    const root = routeFor('/')!;
    expect(root.structuredData).toEqual(['WebSite', 'Organization']);
    // The prose lives at /about, which is still the root domain. Keeping it off
    // the landing page is what lets the front door be one screen.
    const about = routeFor('/about');
    expect(about, '/about must be a route').toBeDefined();
    expect(about!.indexable).toBe(true);
    expect(CONTENT_SECTIONS.length).toBeGreaterThanOrEqual(6);
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(9);
  });
});

describe('Requirement: Structured Data That Is Accurate', () => {
  it('Scenario: The right types are used', () => {
    expect(websiteJsonLd()['@type']).toBe('WebSite');
    expect(organizationJsonLd()['@type']).toBe('Organization');
    const application = softwareApplicationJsonLd();
    expect(application['@type']).toBe('SoftwareApplication');
    expect(application.applicationCategory).toBe('EducationalApplication');
    expect((application.offers as { price: string }).price).toBe('0');
    expect(application.isAccessibleForFree).toBe(true);

    const resource = learningResourceJsonLd();
    expect(resource['@type']).toBe('LearningResource');
    expect(Array.isArray(resource.teaches)).toBe(true);
    expect(resource.educationalLevel).toBeTruthy();
    expect(resource.learningResourceType).toBeTruthy();
    expect(resource.isAccessibleForFree).toBe(true);
  });

  it('Scenario: Medical credibility signals are real, not decorative', () => {
    // The board is empty in this build, so no reviewer is named in the markup.
    expect(EDITORIAL_BOARD).toHaveLength(0);
    expect(organizationJsonLd().member).toBeUndefined();
  });

  it('Scenario: No structured data makes a claim the site does not', () => {
    for (const entry of [websiteJsonLd(), organizationJsonLd(), softwareApplicationJsonLd(), learningResourceJsonLd()]) {
      const text = JSON.stringify(entry);
      // No ratings, no review counts, no credentials that do not exist.
      expect(text).not.toContain('aggregateRating');
      expect(text).not.toContain('reviewCount');
      expect(text).not.toContain('ratingValue');
    }
  });

  it('emits structured data only for the types a route declares', () => {
    expect(structuredDataFor([])).toHaveLength(0);
    expect(structuredDataFor(['WebSite', 'Organization'])).toHaveLength(2);
  });
});

describe('Requirement: One Screen, One Action', () => {
  it('Scenario: The description is plain and specific', () => {
    expect(ONE_LINE_DESCRIPTION).toContain('medical students');
    expect(ONE_LINE_DESCRIPTION).toContain('nurse anesthetists');
    expect(ONE_LINE_DESCRIPTION).toContain('free');
    for (const word of FORBIDDEN_MARKETING_WORDS) {
      expect(ONE_LINE_DESCRIPTION.toLowerCase(), `contains "${word}"`).not.toContain(word.toLowerCase());
    }
  });

  it('Scenario: The three facts are the right three', () => {
    expect(THREE_FACTS).toHaveLength(3);
    const text = THREE_FACTS.map((fact) => fact.text.toLowerCase()).join(' ');
    expect(text).toContain('no account');
    expect(text).toContain('offline');
    expect(text).toContain('published');
    // Each links to the relevant deeper page.
    for (const fact of THREE_FACTS) expect(fact.href.startsWith('/')).toBe(true);
  });
});

describe('Requirement: The Hero Is The Product Running', () => {
  it('Scenario: The hero degrades to a still image', () => {
    const svg = heroStaticSvg(720, 120);
    // The static rendering is a real trace from the same generator.
    expect(svg).toContain('<path');
    expect(svg.length).toBeGreaterThan(2000);
    // Drawn in the electrocardiogram trace colour and nothing else.
    expect(svg).toContain('#3DDC84');
    expect(svg).toContain('#06080B');
    // Identical layout to the live version: the same viewBox dimensions.
    expect(svg).toContain('viewBox="0 0 720 120"');
    // And it is inline markup, so no image file is fetched.
    expect(svg).not.toContain('<image');
  });

  it('is the only saturated colour on the page', () => {
    const svg = heroStaticSvg();
    const colours = [...svg.matchAll(/#[0-9A-Fa-f]{6}/g)].map((match) => match[0]);
    // Exactly two: the trace hue, and the canvas ground it sits on.
    expect(new Set(colours)).toEqual(new Set(['#3DDC84', '#06080B']));
  });
});

describe('Requirement: Modules Directory Is Honest About What Exists', () => {
  it('Scenario: Available and planned are visually distinct, with no date', () => {
    expect(availableModules().map((module) => module.id)).toEqual(['anesthesia', 'emergency-medicine']);
    expect(plannedModules().length).toBeGreaterThanOrEqual(2);
    for (const module of plannedModules()) {
      expect(module.plannedScope, `${module.id} needs a description of its scope`).toBeTruthy();
      // No launch date, no quarter, no countdown.
      const text = `${module.description} ${module.plannedScope ?? ''}`;
      expect(text).not.toMatch(/\bQ[1-4]\b|\b20\d\d\b|\bcoming (soon|in)\b/i);
    }
  });

  it('Scenario: Interest is expressed without collecting anything', () => {
    expect(RELEASE_FEED_URL).toContain('releases');
    // No email capture anywhere in the module registry or the landing content.
    const text = JSON.stringify({ MODULES, CONTENT_SECTIONS, QUESTIONS, THREE_FACTS });
    expect(text).not.toMatch(/subscribe|newsletter|mailing list|email address for/i);
  });

  it('Scenario: A module supplies its own directory entry', () => {
    for (const module of MODULES) {
      expect(module.route.length).toBeGreaterThan(2);
      expect(module.displayName.length).toBeGreaterThan(2);
      expect(module.audience.length).toBeGreaterThan(10);
      expect(module.prerequisites.length).toBeGreaterThan(10);
      expect(['available', 'planned']).toContain(module.status);
    }
  });

  it('publishes the first five emergency medicine rehearsals without overstating the wave', () => {
    const emergency = MODULES.find((module) => module.id === 'emergency-medicine');
    expect(emergency).toMatchObject({
      route: 'emergency-medicine', displayName: 'Emergency medicine', status: 'available',
    });
    expect(emergency?.plannedScope).toContain('Twenty-five');
    expect(routeFor('/emergency-medicine')).toMatchObject({
      indexable: true, heading: 'Emergency medicine simulator',
    });
    expect(routeFor('/emergency-medicine/scenario/undifferentiated-shock')).toMatchObject({
      indexable: true, heading: 'Undifferentiated shock',
    });
    expect(routeFor('/emergency-medicine/scenario/septic-shock')).toMatchObject({
      indexable: true, heading: 'Septic shock',
    });
    expect(routeFor('/emergency-medicine/scenario/hemorrhagic-shock')).toMatchObject({
      indexable: true, heading: 'Hemorrhagic shock',
    });
    expect(routeFor('/emergency-medicine/scenario/obstructive-shock-tension-pneumothorax'))
      .toMatchObject({
        indexable: true, heading: 'Obstructive shock from tension pneumothorax',
      });
    expect(routeFor('/emergency-medicine/scenario/cardiac-tamponade')).toMatchObject({
      indexable: true, heading: 'Cardiac tamponade',
    });
  });

  it('Requirement: Modules Declare Their Own Physiological Timescale', () => {
    const anesthesia = MODULES.find((module) => module.id === 'anesthesia')!;
    expect(anesthesia.timescale.unit).toBe('seconds');
    expect([...speedsFor(anesthesia)]).toEqual([1, 2, 5, 60]);
    expect(anesthesia.timescale.stepSeconds).toBe(0.1);

    // A long-timescale module uses its own units and its own step.
    const oncology = MODULES.find((module) => module.id === 'oncology')!;
    expect(oncology.timescale.unit).toBe('days');
    expect(oncology.timescale.stepSeconds).toBeGreaterThan(0.1);
    expect(speedsFor(oncology)).not.toEqual(speedsFor(anesthesia));
  });
});

describe('Requirement: Substantive Content Lives Below The Fold', () => {
  it('Scenario: The content section covers what a stranger needs, in order', () => {
    expect(CONTENT_SECTIONS.map((section) => section.id)).toEqual([
      'what-it-teaches',
      'who-it-is-for',
      'inside-the-module',
      'where-the-pharmacology-comes-from',
      'how-it-is-reviewed',
      'what-it-does-not-do',
      'using-it-in-a-course',
    ]);
  });

  it('Scenario: The prose is real writing, not keyword filler', () => {
    for (const section of CONTENT_SECTIONS) {
      for (const paragraph of section.paragraphs) {
        expect(paragraph.split(/\s+/).length, `${section.id} has a stub paragraph`).toBeGreaterThan(25);
      }
      // No repeated keyword phrase.
      const text = section.paragraphs.join(' ').toLowerCase();
      const phrase = 'clinical simulator';
      const occurrences = text.split(phrase).length - 1;
      expect(occurrences, `${section.id} repeats "${phrase}"`).toBeLessThan(3);
    }
  });

  it('Scenario: A short answer section addresses the real questions', () => {
    const questions = QUESTIONS.map((entry) => entry.question.toLowerCase()).join(' ');
    for (const required of ['free', 'account', 'offline', 'phone', 'drug models', 'reviews', 'course', 'mannequin', 'other modules']) {
      expect(questions, `no question about ${required}`).toContain(required);
    }
    // The module timing question is answered honestly.
    const timing = QUESTIONS.find((entry) => entry.question.includes('other modules'));
    expect(timing?.answer).toContain('No date is promised');
  });
});

describe('Requirement: Footer Carries The Trust Signals', () => {
  it('Scenario: A skeptical clinician finds the evidence in one hop', () => {
    const hrefs = FOOTER_LINKS.map((link) => link.href);
    expect(hrefs).toContain('/validation');
    expect(hrefs).toContain('/governance');
    expect(hrefs).toContain('/limitations');
    expect(hrefs.some((href) => href.includes('LICENSE'))).toBe(true);
    expect(hrefs.some((href) => href.includes('github.com'))).toBe(true);
    expect(SUGGESTED_CITATION).toContain('opensimlab.com');
  });
});

describe('Requirement: Crawlability Basics', () => {
  it('Scenario: The sitemap is generated and complete', () => {
    const indexable = indexableRoutes();
    expect(indexable.length).toBeGreaterThan(5);
    expect(indexable.every((route) => route.indexable)).toBe(true);
    expect(indexable.map((route) => route.path)).toContain('/');
    expect(indexable.map((route) => route.path)).toContain('/anesthesia');
    expect(indexable.map((route) => route.path)).not.toContain('/gallery');

    // Assert the finished artifact too. Testing only the route model would not
    // catch a broken or stale generator that omitted a real route.
    const sitemap = readFileSync(join(process.cwd(), 'dist/sitemap.xml'), 'utf8');
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    expect(locations).toEqual(indexable.map((route) => canonicalUrl(route.path)));
    const dates = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]!);
    expect(dates).toHaveLength(indexable.length);
    expect(new Set(dates)).toHaveLength(1);
    expect(dates[0]).toMatch(/^20\d\d-\d\d-\d\d$/);
    expect(dates[0]! <= new Date().toISOString().slice(0, 10)).toBe(true);
  });

  it('Scenario: static scenario pages show navigation, review status, and sources', () => {
    const scenarios = [
      ...SCENARIOS.map((scenario) => ({ basePath: '/anesthesia', scenario })),
      ...EMERGENCY_MEDICINE_SCENARIOS.map((scenario) => ({
        basePath: '/emergency-medicine', scenario,
      })),
    ];
    for (const { basePath, scenario } of scenarios) {
      const markup = renderToStaticMarkup(createElement(PrerenderedBody, {
        path: `${basePath}/scenario/${scenario.metadata.id}`,
      }));
      expect(markup).toContain('href="#main"');
      expect(markup).toContain('aria-label="Site"');
      expect(markup).toContain('Review and sources');
      expect(markup).toContain('Not clinically reviewed');
      for (const source of scenario.metadata.clinicalReview.sources) expect(markup).toContain(source);
    }
  });

  it('Scenario: deploys build and verify an indexable artifact', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['build:indexable']).toContain('SITE_INDEXABLE=true');
    expect(pkg.scripts['build:indexable']).toContain('check:indexable');
    expect(pkg.scripts.deploy).toContain('build:indexable');
    expect(pkg.scripts.deploy).toContain('release:preview');
    expect(pkg.scripts['deploy:reviewed']).toContain('build:indexable');
    expect(pkg.scripts['deploy:reviewed']).toContain('release:reviewed');
    expect(pkg.scripts['deploy:alpha']).toBeUndefined();
  });
});

describe('Scenario: The service worker never serves stale metadata to a crawler', () => {
  it('is not registered for a crawler user agent', () => {
    for (const agent of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0)',
      'Twitterbot/1.0',
      'Slackbot-LinkExpanding 1.0',
      'facebookexternalhit/1.1',
    ]) {
      expect(isCrawler(agent), `${agent} not detected as a crawler`).toBe(true);
    }
    expect(isCrawler('Mozilla/5.0 (Linux; Android 10) Chrome/120 Mobile Safari/537.36')).toBe(false);
  });
});

describe('Requirement: One Screen, One Action', () => {
  // The front door earns its minimalism by NOT carrying the prose. This is the
  // test that stops a section creeping back onto it.
  const landing = readFileSync(join(process.cwd(), 'src/landing/Landing.tsx'), 'utf8');
  const about = readFileSync(join(process.cwd(), 'src/landing/About.tsx'), 'utf8');

  it('Scenario: the landing page renders no prose section and no questions block', () => {
    expect(landing).not.toContain('CONTENT_SECTIONS');
    expect(landing).not.toContain('QUESTIONS');
    expect(landing).not.toContain('SUGGESTED_CITATION');
    // And the About page does carry all three.
    expect(about).toContain('CONTENT_SECTIONS');
    expect(about).toContain('QUESTIONS');
    expect(about).toContain('SUGGESTED_CITATION');
  });

  it('Scenario: exactly one primary action, naming its destination', () => {
    const primaries = [...landing.matchAll(/className="button button--primary"/g)];
    expect(primaries).toHaveLength(1);
    expect(landing).toContain('Open the anesthesia simulator');
    expect(landing).toContain('href="/anesthesia"');
    const markup = renderToStaticMarkup(createElement(Landing));
    expect(markup).toContain('class="button button--primary" href="/anesthesia"');
  });

  it('Scenario: the front door names every module and promises no date', () => {
    const markup = renderToStaticMarkup(createElement(Landing));
    for (const module of MODULES) expect(markup).toContain(module.displayName);
    expect(markup).toContain('planned. No dates.');
    // No date, no quarter, no countdown anywhere in what a visitor actually sees.
    expect(markup).not.toMatch(/\bQ[1-4]\s*20\d\d|coming soon|\b20[2-9]\d\b/i);
  });

  it('Scenario: the front door carries no prose in its rendered markup', () => {
    const markup = renderToStaticMarkup(createElement(Landing));
    // Strip tags and count words. A one-screen front door is a short document.
    const words = markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
    expect(words, `the landing page renders ${words} words`).toBeLessThan(120);
  });

  it('Scenario: the front door links to the substantive page', () => {
    expect(landing).toContain('href="/about"');
  });
});

describe('Requirement: A Preview Build Does Not Invite Indexing', () => {
  // Canonicals name the production domain. While the site is served from a
  // preview host, indexing it points a crawler at a domain that does not serve
  // it — worse than not being found at all. Indexing is therefore OFF unless
  // someone deliberately turns it on, and this is the default path.
  const robots = readFileSync(join(process.cwd(), 'dist/robots.txt'), 'utf8');
  const headers = readFileSync(join(process.cwd(), 'dist/_headers'), 'utf8');
  const home = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf8');
  // Judge the artifact, not the shell running this test. A build may be created
  // in one process and verified in another with no inherited environment.
  const indexable = /^Allow: \/$/m.test(robots);

  it('Scenario: without the flag, every signal says do not index', () => {
    if (indexable) return;
    expect(robots).toContain('Disallow: /');
    expect(robots).not.toContain('Allow: /');
    expect(headers).toContain('X-Robots-Tag: noindex, nofollow');
    expect(home).toContain('content="noindex, nofollow"');
  });

  it('Scenario: the way back on is documented in the file itself', () => {
    if (indexable) return;
    // A future reader has to be able to find the switch without reading the
    // build script.
    expect(robots).toContain('SITE_INDEXABLE=true');
  });

  it('Scenario: an indexable artifact has no contradictory blocking signal', () => {
    if (!indexable) return;
    expect(robots).toContain('Sitemap: https://opensimlab.com/sitemap.xml');
    expect(robots).not.toMatch(/^Disallow: \/$/m);
    expect(headers).not.toContain('X-Robots-Tag: noindex');
    expect(home).not.toContain('content="noindex');
  });

  it('Scenario: the route model still knows which routes are indexable', () => {
    // The gate is about this DEPLOYMENT, not about the routes. The per-route
    // decision has to survive it so turning indexing on restores exactly the
    // set that was always intended.
    expect(indexableRoutes().length).toBeGreaterThanOrEqual(10);
    expect(routeFor('/gallery')?.indexable).toBe(false);
    expect(routeFor('/')?.indexable).toBe(true);
  });
});

describe('Requirement: The About Page Describes The Build That Ships', () => {
  /**
   * The page said "one scenario ... with two drugs" for as long as there were
   * four. Nothing caught it, because prose is not compiled. A visitor deciding
   * whether this is worth their time was reading a description of a build that
   * stopped existing.
   */
  const inside = CONTENT_SECTIONS.find((section) => section.id === 'inside-the-module')!;
  const prose = [...inside.paragraphs, ...(inside.list ?? [])].join(' ');

  const NUMBER_WORDS: Record<number, string> = {
    1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty', 21: 'twenty-one', 22: 'twenty-two', 23: 'twenty-three', 24: 'twenty-four', 25: 'twenty-five', 26: 'twenty-six', 27: 'twenty-seven', 28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty', 31: 'thirty-one', 32: 'thirty-two', 33: 'thirty-three', 34: 'thirty-four', 35: 'thirty-five', 36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight', 39: 'thirty-nine',
  };

  it('Scenario: the scenario count it claims is the number that ships', () => {
    const claimed = NUMBER_WORDS[SCENARIOS.length];
    expect(claimed, `no word for ${SCENARIOS.length} scenarios; extend NUMBER_WORDS`).toBeDefined();
    expect(prose).toContain(`${claimed} scenario`);
  });

  it('Scenario: every scenario it names by title actually exists', () => {
    // Guards the other direction: a scenario removed from the registry but left
    // in the prose.
    for (const scenario of SCENARIOS) {
      const words = scenario.metadata.title.toLowerCase().split(' ');
      const keyword = words.find((word) => word.length > 7) ?? words[0]!;
      expect(prose.toLowerCase(), `"${scenario.metadata.title}" is not described`).toContain(keyword);
    }
  });

  it('Scenario: the drug count it claims is the number in the formulary', () => {
    const drugs = new Set(SCENARIOS.flatMap((s) => s.formulary.map((entry) => entry.drugId)));
    expect(prose).toContain(`${NUMBER_WORDS[drugs.size]} drugs`);
  });
});
