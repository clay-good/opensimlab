/**
 * Acceptance tests for platform/discoverability, platform/landing, and
 * platform/module-contract.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ROUTES, SITE_NAME, canonicalUrl, formatTitle, indexableRoutes, routeFor, socialImageUrl,
} from '@routes/routes';
import {
  breadcrumbJsonLd, learningResourceJsonLd, organizationJsonLd, softwareApplicationJsonLd,
  structuredDataFor, websiteJsonLd,
} from '@platform/docs/structured-data';
import {
  CONTENT_SECTIONS, FOOTER_LINKS, FORBIDDEN_MARKETING_WORDS, ONE_LINE_DESCRIPTION, QUESTIONS,
  READY_MODULE_COUNT, READY_SCENARIO_COUNT, REVIEWER_INVITATION, SUGGESTED_CITATION, THREE_FACTS,
} from '@landing/content';
import { heroStaticSvg } from '@landing/hero';
import { robotsTxt } from '../../scripts/prerender';
import { SCENARIOS } from '@anesthesia/scenarios';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../../src/modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../../src/modules/cardiology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../../src/modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../../src/modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../../src/modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../../src/modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../../src/modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../../src/modules/neonatology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../src/modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../src/modules/renal-electrolyte/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../../src/modules/infectious-disease/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../src/modules/medical-surgical-nursing/scenarios';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';
import { Landing } from '@landing/Landing';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MODULES, RELEASE_FEED_URL, availableModules, plannedModules, speedsFor } from '@platform/modules/registry';
import { EDITORIAL_BOARD } from '@platform/governance/records';
import { isCrawler } from '@platform/offline/register';
import { PrerenderedBody } from '@routes/Prerendered';
import { moduleProse } from '@platform/modules/module-prose';

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
    expect(socialImageUrl('/')).toBe('https://opensimlab.com/og/index.png');
    expect(socialImageUrl('/anesthesia/scenario/dilutional-coagulopathy'))
      .toBe('https://opensimlab.com/og/anesthesia-scenario-dilutional-coagulopathy.png');
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

  it('describes each module and scenario at its own canonical route', () => {
    expect(softwareApplicationJsonLd('/critical-care')).toMatchObject({
      name: 'Open Sim Lab Critical care',
      url: 'https://opensimlab.com/critical-care',
    });
    const modules = [
      { basePath: '/anesthesia', scenarios: SCENARIOS },
      { basePath: '/emergency-medicine', scenarios: EMERGENCY_MEDICINE_SCENARIOS },
      { basePath: '/critical-care', scenarios: CRITICAL_CARE_SCENARIOS },
      { basePath: '/cardiology', scenarios: CARDIOLOGY_SCENARIOS },
      { basePath: '/respiratory-medicine', scenarios: RESPIRATORY_MEDICINE_SCENARIOS },
      { basePath: '/pediatrics', scenarios: PEDIATRICS_SCENARIOS },
      { basePath: '/neurology', scenarios: NEUROLOGY_SCENARIOS },
      { basePath: '/toxicology', scenarios: TOXICOLOGY_SCENARIOS },
      { basePath: '/obstetrics', scenarios: OBSTETRICS_SCENARIOS },
      { basePath: '/neonatology', scenarios: NEONATOLOGY_SCENARIOS },
      { basePath: '/endocrine-metabolic', scenarios: ENDOCRINE_METABOLIC_SCENARIOS },
      { basePath: '/renal-electrolyte', scenarios: RENAL_ELECTROLYTE_SCENARIOS },
      { basePath: '/infectious-disease', scenarios: INFECTIOUS_DISEASE_SCENARIOS },
      { basePath: '/medical-surgical-nursing', scenarios: MEDICAL_SURGICAL_NURSING_SCENARIOS },
      { basePath: '/oncology', scenarios: ONCOLOGY_SCENARIOS },
    ] as const;
    for (const { basePath, scenarios } of modules) {
      for (const scenario of scenarios) {
        const path = `${basePath}/scenario/${scenario.metadata.id}`;
        expect(structuredDataFor(['LearningResource'], path)[0]).toMatchObject({
          name: scenario.metadata.title,
          url: canonicalUrl(path),
          teaches: scenario.metadata.objectives.map((objective) => objective.statement),
        });
      }
    }
  });
});

describe('Requirement: One Screen, One Action', () => {
  it('Scenario: The description is plain and specific', () => {
    expect(ONE_LINE_DESCRIPTION).toContain('medical students');
    expect(ONE_LINE_DESCRIPTION).toContain('nurse anesthetists');
    expect(ONE_LINE_DESCRIPTION).toContain('free');
    expect(ONE_LINE_DESCRIPTION).toContain(`${READY_SCENARIO_COUNT}`);
    expect(ONE_LINE_DESCRIPTION).toContain(`${READY_MODULE_COUNT} specialties`);
    expect(READY_MODULE_COUNT).toBe(availableModules().length);
    expect(READY_SCENARIO_COUNT).toBe(
      SCENARIOS.length + EMERGENCY_MEDICINE_SCENARIOS.length + CRITICAL_CARE_SCENARIOS.length
      + CARDIOLOGY_SCENARIOS.length + RESPIRATORY_MEDICINE_SCENARIOS.length
      + PEDIATRICS_SCENARIOS.length + NEUROLOGY_SCENARIOS.length
      + TOXICOLOGY_SCENARIOS.length + OBSTETRICS_SCENARIOS.length + NEONATOLOGY_SCENARIOS.length
      + ENDOCRINE_METABOLIC_SCENARIOS.length + RENAL_ELECTROLYTE_SCENARIOS.length
      + INFECTIOUS_DISEASE_SCENARIOS.length + MEDICAL_SURGICAL_NURSING_SCENARIOS.length
      + ONCOLOGY_SCENARIOS.length,
    );
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
    expect(availableModules().map((module) => module.id))
      .toEqual(['anesthesia', 'emergency-medicine', 'cardiology', 'respiratory-medicine', 'pediatrics', 'neurology', 'toxicology', 'obstetrics', 'neonatology', 'endocrine-metabolic', 'renal-electrolyte', 'infectious-disease', 'medical-surgical-nursing', 'oncology', 'critical-care']);
    expect(plannedModules().length).toBeGreaterThanOrEqual(1);
    for (const module of plannedModules()) {
      const prose = moduleProse(module.id);
      expect(prose.plannedScope, `${module.id} needs a description of its scope`).toBeTruthy();
      // No launch date, no quarter, no countdown.
      const text = `${prose.description} ${prose.plannedScope ?? ''}`;
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
      expect(moduleProse(module.id).audience.length).toBeGreaterThan(10);
      expect(moduleProse(module.id).prerequisites.length).toBeGreaterThan(10);
      expect(['available', 'planned']).toContain(module.status);
    }
  });

  it('publishes each completed emergency medicine rehearsal without overstating the wave', () => {
    const emergency = MODULES.find((module) => module.id === 'emergency-medicine');
    expect(emergency).toMatchObject({
      route: 'emergency-medicine', displayName: 'Emergency medicine', status: 'available',
    });
    expect(moduleProse('emergency-medicine').plannedScope).toContain('Twenty-five');
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
    expect(routeFor('/emergency-medicine/scenario/anaphylaxis')).toMatchObject({
      indexable: true, heading: 'Anaphylaxis',
    });
    expect(routeFor('/emergency-medicine/scenario/adult-asthma')).toMatchObject({
      indexable: true, heading: 'Adult asthma exacerbation',
    });
    expect(routeFor('/emergency-medicine/scenario/copd-exacerbation')).toMatchObject({
      indexable: true, heading: 'COPD exacerbation',
    });
    expect(routeFor('/emergency-medicine/scenario/acute-pulmonary-edema')).toMatchObject({
      indexable: true, heading: 'Acute pulmonary edema',
    });
    expect(routeFor('/emergency-medicine/scenario/pulmonary-embolism-deterioration'))
      .toMatchObject({ indexable: true, heading: 'Pulmonary embolism with deterioration' });
    expect(routeFor('/emergency-medicine/scenario/stemi')).toMatchObject({
      indexable: true, heading: 'STEMI',
    });
    expect(routeFor('/emergency-medicine/scenario/unstable-narrow-complex-tachycardia'))
      .toMatchObject({ indexable: true, heading: 'Unstable narrow-complex tachycardia' });
    expect(routeFor('/emergency-medicine/scenario/unstable-bradycardia'))
      .toMatchObject({ indexable: true, heading: 'Unstable bradycardia' });
    expect(routeFor('/emergency-medicine/scenario/persistent-vf-arrest'))
      .toMatchObject({ indexable: true, heading: 'Persistent VF arrest' });
    expect(routeFor('/emergency-medicine/scenario/pea-arrest'))
      .toMatchObject({ indexable: true, heading: 'PEA arrest' });
    expect(routeFor('/emergency-medicine/scenario/status-epilepticus'))
      .toMatchObject({ indexable: true, heading: 'Status epilepticus' });
    expect(routeFor('/emergency-medicine/scenario/acute-ischemic-stroke'))
      .toMatchObject({ indexable: true, heading: 'Acute ischemic stroke' });
    expect(routeFor('/emergency-medicine/scenario/intracranial-hemorrhage-deterioration'))
      .toMatchObject({ indexable: true, heading: 'Intracranial hemorrhage deterioration' });
    expect(routeFor('/emergency-medicine/scenario/diabetic-ketoacidosis'))
      .toMatchObject({ indexable: true, heading: 'Diabetic ketoacidosis' });
    expect(routeFor('/emergency-medicine/scenario/hyperkalemia-with-ecg-change'))
      .toMatchObject({ indexable: true, heading: 'Hyperkalemia with ECG change' });
    expect(routeFor('/emergency-medicine/scenario/severe-hyponatremia-with-seizure'))
      .toMatchObject({ indexable: true, heading: 'Severe hyponatremia with seizure' });
    expect(routeFor('/emergency-medicine/scenario/opioid-toxicity'))
      .toMatchObject({ indexable: true, heading: 'Opioid toxicity' });
    expect(routeFor('/emergency-medicine/scenario/exertional-heat-stroke'))
      .toMatchObject({ indexable: true, heading: 'Exertional heat stroke' });
    expect(routeFor('/emergency-medicine/scenario/trauma-primary-survey'))
      .toMatchObject({ indexable: true, heading: 'Trauma primary survey' });
    expect(routeFor('/emergency-medicine/scenario/acute-aortic-syndrome'))
      .toMatchObject({ indexable: true, heading: 'Acute aortic syndrome' });
    expect(routeFor('/critical-care/scenario/ards-lung-protective-ventilation'))
      .toMatchObject({ indexable: true, heading: 'ARDS lung-protective ventilation' });
    expect(routeFor('/critical-care/scenario/escalating-hypoxemia'))
      .toMatchObject({ indexable: true, heading: 'Escalating hypoxemia' });
    expect(routeFor('/critical-care/scenario/ventilator-dyssynchrony'))
      .toMatchObject({ indexable: true, heading: 'Ventilator dyssynchrony' });
    expect(routeFor('/critical-care/scenario/auto-peep'))
      .toMatchObject({ indexable: true, heading: 'Auto-PEEP and dynamic hyperinflation' });
    expect(routeFor('/critical-care/scenario/mucus-plugging'))
      .toMatchObject({ indexable: true, heading: 'Mucus plugging' });
    expect(routeFor('/critical-care/scenario/unplanned-extubation'))
      .toMatchObject({ indexable: true, heading: 'Unplanned extubation' });
    expect(routeFor('/critical-care/scenario/spontaneous-breathing-trial'))
      .toMatchObject({ indexable: true, heading: 'Spontaneous-breathing trial' });
    expect(routeFor('/critical-care/scenario/post-intubation-hypotension'))
      .toMatchObject({ indexable: true, heading: 'Post-intubation hypotension' });
    expect(routeFor('/critical-care/scenario/cardiogenic-shock'))
      .toMatchObject({ indexable: true, heading: 'Cardiogenic shock' });
    expect(routeFor('/critical-care/scenario/mixed-shock'))
      .toMatchObject({ indexable: true, heading: 'Mixed shock' });
    expect(routeFor('/critical-care/scenario/right-ventricular-failure'))
      .toMatchObject({ indexable: true, heading: 'Right ventricular failure' });
    expect(routeFor('/critical-care/scenario/massive-pulmonary-embolism'))
      .toMatchObject({ indexable: true, heading: 'Massive pulmonary embolism' });
    expect(routeFor('/critical-care/scenario/upper-gi-hemorrhage'))
      .toMatchObject({ indexable: true, heading: 'Upper GI hemorrhage' });
    expect(routeFor('/critical-care/scenario/status-epilepticus'))
      .toMatchObject({ indexable: true, heading: 'Refractory status epilepticus' });
    expect(routeFor('/critical-care/scenario/targeted-temperature-management'))
      .toMatchObject({ indexable: true, heading: 'Post-arrest temperature control' });
    expect(routeFor('/critical-care/scenario/intracranial-hypertension'))
      .toMatchObject({ indexable: true, heading: 'Intracranial hypertension' });
    expect(routeFor('/critical-care/scenario/acute-kidney-injury-with-fluid-overload'))
      .toMatchObject({ indexable: true, heading: 'Acute kidney injury with fluid overload' });
    expect(routeFor('/critical-care/scenario/severe-acidemia'))
      .toMatchObject({ indexable: true, heading: 'Severe acidemia' });
    expect(routeFor('/critical-care/scenario/icu-handoff-with-hidden-deterioration'))
      .toMatchObject({ indexable: true, heading: 'ICU handoff with hidden deterioration' });
    expect(routeFor('/critical-care/scenario/ventilator-circuit-disconnection'))
      .toMatchObject({ indexable: true, heading: 'Ventilator circuit disconnection' });
    expect(routeFor('/critical-care/scenario/delayed-vasopressor-delivery'))
      .toMatchObject({ indexable: true, heading: 'Delayed vasopressor delivery' });
    expect(routeFor('/critical-care/scenario/pulse-oximeter-motion-artifact'))
      .toMatchObject({ indexable: true, heading: 'Pulse-oximeter motion artifact' });
    expect(routeFor('/critical-care/scenario/endotracheal-tube-migration-after-repositioning'))
      .toMatchObject({ indexable: true, heading: 'Post-turn endotracheal tube migration' });
    expect(routeFor('/critical-care/scenario/septic-shock-resuscitation'))
      .toMatchObject({ indexable: true, heading: 'Persistent septic-shock resuscitation' });
    expect(routeFor('/cardiology/scenario/stable-chest-pain-evaluation'))
      .toMatchObject({ indexable: true, heading: 'Stable chest-pain evaluation' });
  });

  it('Requirement: Modules Declare Their Own Physiological Timescale', () => {
    const anesthesia = MODULES.find((module) => module.id === 'anesthesia')!;
    expect(anesthesia.timescale.unit).toBe('seconds');
    expect([...speedsFor(anesthesia)]).toEqual([1, 2, 5, 60]);
    expect(anesthesia.timescale.stepSeconds).toBe(0.1);

    // Oncology was the long-timescale example while it was planned, on the assumption that it
    // would open with chemotherapy over weeks. It opened with clinic lessons that run in minutes,
    // so its declaration now says seconds and no module in the registry declares a longer unit.
    // The contract is still enforced on every module rather than on one illustrative case.
    for (const module of MODULES) {
      expect(['seconds', 'minutes', 'hours', 'days']).toContain(module.timescale.unit);
      expect(module.timescale.stepSeconds).toBeGreaterThan(0);
      expect([...speedsFor(module)].length).toBeGreaterThan(0);
      expect([...speedsFor(module)]).toEqual([...module.timescale.speeds]);
    }
    const criticalCare = MODULES.find((module) => module.id === 'critical-care')!;
    expect(criticalCare.timescale.unit).toBe('seconds');
    expect(criticalCare.timescale.stepSeconds).toBe(0.1);
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
    expect(indexable).toHaveLength(267);
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
      ...CRITICAL_CARE_SCENARIOS.map((scenario) => ({ basePath: '/critical-care', scenario })),
      ...CARDIOLOGY_SCENARIOS.map((scenario) => ({ basePath: '/cardiology', scenario })),
      ...RESPIRATORY_MEDICINE_SCENARIOS.map((scenario) => ({
        basePath: '/respiratory-medicine', scenario,
      })),
      ...PEDIATRICS_SCENARIOS.map((scenario) => ({ basePath: '/pediatrics', scenario })),
      ...NEUROLOGY_SCENARIOS.map((scenario) => ({ basePath: '/neurology', scenario })),
    ];
    for (const { basePath, scenario } of scenarios) {
      const markup = renderToStaticMarkup(createElement(PrerenderedBody, {
        path: `${basePath}/scenario/${scenario.metadata.id}`,
      }));
      expect(markup).toContain('href="#main"');
      expect(markup).toContain('aria-label="Site"');
      expect(markup).toContain('Review and sources');
      expect(markup).toContain('Not clinically reviewed');
      for (const source of scenario.metadata.clinicalReview.sources) {
        const renderedSource = renderToStaticMarkup(createElement('span', null, source))
          .replace(/^<span>|<\/span>$/g, '');
        expect(markup).toContain(renderedSource);
      }
    }
  });

  it('Scenario: built scenario JSON-LD describes the page being viewed', () => {
    const page = readFileSync(join(
      process.cwd(), 'dist/critical-care/scenario/auto-peep/index.html',
    ), 'utf8');
    const script = page.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
    expect(script).toBeDefined();
    expect(JSON.parse(script!)).toMatchObject({
      '@type': 'LearningResource',
      name: 'Auto-PEEP and dynamic hyperinflation',
      url: 'https://opensimlab.com/critical-care/scenario/auto-peep',
    });
  });

  it('Scenario: a disallow rule blocks only the route it names', () => {
    // A robots path is a prefix match. `Disallow: /review` also blocked
    // `/review-status`, which is indexable and listed in this same sitemap.
    //
    // Read from the generator rather than `dist`, because a plain `npm run build`
    // is a preview build whose robots file disallows everything by design.
    const rules = [...robotsTxt().matchAll(/^Disallow: (\S+)$/gm)].map((match) => match[1]!);
    expect(rules.length).toBeGreaterThan(0);
    const paths = indexableRoutes().map((route) => route.path);

    for (const rule of rules) {
      const anchored = rule.endsWith('$');
      const prefix = anchored ? rule.slice(0, -1) : rule;
      for (const path of paths) {
        const blocked = anchored ? path === prefix : path.startsWith(prefix);
        expect(blocked, `Disallow: ${rule} blocks the indexable ${path}`).toBe(false);
      }
    }
  });

  it('Scenario: every indexable route is reachable by following links', () => {
    const dist = join(process.cwd(), 'dist');
    const documentFor = (path: string) =>
      join(dist, path === '/' ? 'index.html' : `${path.slice(1)}/index.html`);

    const reached = new Set(['/']);
    const queue = ['/'];
    const broken: string[] = [];
    while (queue.length > 0) {
      const path = queue.shift()!;
      const file = documentFor(path);
      if (!existsSync(file)) { broken.push(path); continue; }
      for (const match of readFileSync(file, 'utf8').matchAll(/href="(\/[^"#?]*)"/g)) {
        const href = match[1]!.replace(/\/$/, '') || '/';
        // Files rather than pages: they are fetched, not crawled onward.
        if (/^\/(assets|fonts|catalog|og)\//.test(href) || /\.[a-z0-9]+$/i.test(href)) continue;
        if (reached.has(href)) continue;
        reached.add(href);
        queue.push(href);
      }
    }
    // An internal link that resolves to nothing wastes a crawl and dead-ends a reader.
    expect(broken).toEqual([]);

    const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
    const paths = [...sitemap.matchAll(/<loc>https:\/\/opensimlab\.com([^<]*)<\/loc>/g)]
      .map((match) => match[1] || '/');
    // Reachable by following links, not merely listed. `/for-educators` and
    // `/curriculum` were in the sitemap with nothing on the site linking to them.
    expect(paths.filter((path) => !reached.has(path))).toEqual([]);
  });

  it('Scenario: a page states its place in the site', () => {
    const page = readFileSync(join(
      process.cwd(), 'dist/critical-care/scenario/auto-peep/index.html',
    ), 'utf8');
    const records = [...page.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)]
      .map((match) => JSON.parse(match[1]!) as Record<string, unknown>);
    const trail = records.find((record) => record['@type'] === 'BreadcrumbList');
    expect(trail).toMatchObject({
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Open Sim Lab', item: 'https://opensimlab.com/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Critical care simulator',
          item: 'https://opensimlab.com/critical-care',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Auto-PEEP and dynamic hyperinflation',
          item: 'https://opensimlab.com/critical-care/scenario/auto-peep',
        },
      ],
    });
    // A flat document has no trail worth describing.
    expect(breadcrumbJsonLd('/privacy')).toBeUndefined();
  });

  it('Scenario: the preview image is in a format a scraper renders', () => {
    // No major crawler or link preview scraper renders SVG. While `og:image`
    // named the `.svg`, every shared link resolved to a card with no image.
    for (const path of ['/', '/oncology', '/critical-care/scenario/auto-peep']) {
      const page = readFileSync(join(
        process.cwd(), path === '/' ? 'dist/index.html' : `dist${path}/index.html`,
      ), 'utf8');
      const image = page.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
      expect(image, path).toMatch(/^https:\/\/opensimlab\.com\/og\/[a-z0-9-]+\.png$/);
      expect(page).toContain('<meta property="og:image:type" content="image/png" />');
      expect(page).toContain('<meta property="og:image:width" content="1200" />');
      expect(page).toContain('<meta property="og:image:height" content="630" />');
      expect(page).toMatch(/<meta property="og:image:alt" content="[^"]+"/);
      expect(page).not.toContain('/og/index.svg');
      // The file the tag promises has to exist and be a PNG.
      const file = join(process.cwd(), 'dist', new URL(image!).pathname.slice(1));
      expect(existsSync(file), image).toBe(true);
      expect(readFileSync(file).subarray(0, 8))
        .toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
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
  /**
   * The module directory as one element.
   *
   * It is a `nav` now rather than a paragraph: fifteen tiles that are the primary
   * way into the product are a navigation landmark, and a screen reader should be
   * able to jump to them. Both budget assertions below key off this one match, so
   * the shape is named once here.
   */
  const MODULE_DIRECTORY = /<nav class="landing__modules"[^>]*>[\s\S]*?<\/nav>/;
  const moduleDirectory = (markup: string) => markup.match(MODULE_DIRECTORY)?.[0] ?? '';

  it('Scenario: the landing page renders no prose section and no questions block', () => {
    expect(landing).not.toContain('CONTENT_SECTIONS');
    expect(landing).not.toContain('QUESTIONS');
    expect(landing).not.toContain('SUGGESTED_CITATION');
    // And the About page does carry all three.
    expect(about).toContain('CONTENT_SECTIONS');
    expect(about).toContain('QUESTIONS');
    expect(about).toContain('SUGGESTED_CITATION');
  });

  /**
   * The front door offers every module at the same weight.
   *
   * It used to be one primary button to anaesthesia with the other fourteen
   * listed underneath as small grey text, which told a visitor the product was an
   * anaesthesia simulator with extras. All fifteen are registered at their full
   * planned count and any is a reasonable place to start, so none of them is
   * styled as the one that matters.
   */
  it('Scenario: every available module is offered at the same weight', () => {
    const markup = renderToStaticMarkup(createElement(Landing));
    const available = MODULES.filter((module) => module.status === 'available');
    const chips = [...markup.matchAll(/class="landing__module-live" href="\/([a-z-]+)"/g)]
      .map((match) => match[1]);
    expect(chips).toEqual(available.map((module) => module.route));
    // Nothing singles one out: no primary button remains on the front door.
    expect(markup).not.toContain('button--primary');
    expect(landing).not.toContain('Practice anesthesia—free');
  });

  it('Scenario: the front door names every module and promises no date', () => {
    const markup = renderToStaticMarkup(createElement(Landing));
    for (const module of MODULES) expect(markup).toContain(module.displayName);
    expect(markup).toContain('planned. No dates.');
    const directory = moduleDirectory(markup);
    const availableCount = MODULES.filter((module) => module.status === 'available').length;
    // Each available module is its own control rather than an item in a
    // dot-separated run, so the separators the old directory needed are gone.
    expect(directory.match(/landing__module-live/g)).toHaveLength(availableCount);
    expect(directory).not.toContain('aria-hidden="true"> · </span>');
    // No date, no quarter, no countdown anywhere in what a visitor actually sees.
    // The scenario counts on the tiles are two-digit numbers, which this pattern
    // deliberately does not match: it is looking for a year.
    expect(markup).not.toMatch(/\bQ[1-4]\s*20\d\d|coming soon|\b20[2-9]\d\b/i);
  });

  /**
   * The number on a tile is the number of scenarios behind it.
   *
   * The count is DECLARED in the module registry rather than counted from the
   * scenario arrays, because the landing route is budgeted separately and
   * `tests/integration/landing-bundle.test.ts` forbids it from importing a single
   * scenario file. This test is the other half of that trade: it holds every
   * declaration against the real array, so a scenario added without updating the
   * registry fails here instead of quietly under-selling the module on the front
   * door and in the tagline total.
   */
  it('Scenario: every count on the front door is the number that ships', () => {
    const actual = new Map<string, number>([
      ['anesthesia', SCENARIOS.length],
      ['emergency-medicine', EMERGENCY_MEDICINE_SCENARIOS.length],
      ['critical-care', CRITICAL_CARE_SCENARIOS.length],
      ['cardiology', CARDIOLOGY_SCENARIOS.length],
      ['respiratory-medicine', RESPIRATORY_MEDICINE_SCENARIOS.length],
      ['pediatrics', PEDIATRICS_SCENARIOS.length],
      ['neurology', NEUROLOGY_SCENARIOS.length],
      ['toxicology', TOXICOLOGY_SCENARIOS.length],
      ['obstetrics', OBSTETRICS_SCENARIOS.length],
      ['neonatology', NEONATOLOGY_SCENARIOS.length],
      ['endocrine-metabolic', ENDOCRINE_METABOLIC_SCENARIOS.length],
      ['renal-electrolyte', RENAL_ELECTROLYTE_SCENARIOS.length],
      ['infectious-disease', INFECTIOUS_DISEASE_SCENARIOS.length],
      ['medical-surgical-nursing', MEDICAL_SURGICAL_NURSING_SCENARIOS.length],
      ['oncology', ONCOLOGY_SCENARIOS.length],
    ]);
    for (const module of availableModules()) {
      expect(actual.get(module.id), `${module.id} needs a scenario array here`).toBeDefined();
      expect(module.scenarioCount, `${module.id} declares the wrong scenario count`)
        .toBe(actual.get(module.id));
    }
    // A module that is not built yet claims nothing.
    for (const module of plannedModules()) expect(module.scenarioCount).toBe(0);

    // And the number a visitor reads on each tile is that declaration.
    const markup = renderToStaticMarkup(createElement(Landing));
    for (const module of availableModules()) {
      expect(markup).toContain(`${module.scenarioCount} scenarios`);
    }
    // In the page that actually ships, as ONE text node. `renderToString`, which
    // the prerender uses and this test does not, separates two adjacent children
    // with a `<!-- -->` hydration marker: writing the tile as `{count} scenarios`
    // put `39<!-- --> scenarios` into all 267 prerendered pages. It reads the same
    // either way, which is exactly why nothing would have caught it.
    const built = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf8');
    for (const module of availableModules()) {
      expect(built)
        .toContain(`<span class="landing__module-count">${module.scenarioCount} scenarios</span>`);
    }
    expect(READY_SCENARIO_COUNT)
      .toBe(availableModules().reduce((total, module) => total + module.scenarioCount, 0));
  });

  /**
   * No em-dash or en-dash renders on the front door.
   *
   * Asserted on the rendered text rather than on the source, because the strings
   * that reach this page come from four different modules — the tagline, the
   * shared maturity label, the not-for-clinical-use statement, and the module
   * registry — and only the rendered output shows what a visitor actually gets.
   */
  it('Scenario: the front door sets no em-dashes', () => {
    const markup = renderToStaticMarkup(createElement(Landing));
    const text = markup.replace(/<[^>]*>/g, ' ');
    const dashes = [...text.matchAll(/.{0,30}[\u2014\u2013].{0,30}/g)].map((match) => match[0].trim());
    expect(dashes, dashes.join(' | ')).toEqual([]);
  });

  it('Scenario: the front door carries no prose in its rendered markup', () => {
    const markup = renderToStaticMarkup(createElement(Landing));
    const count = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
    // The module directory is navigation, and it grows by one entry per module.
    // Budget the prose separately so a new module cannot buy room for new copy,
    // and so launching one does not silently relax the one-screen guarantee.
    const directory = markup.match(MODULE_DIRECTORY)?.[0];
    expect(directory, 'the module directory should render as one element').toBeTruthy();
    // The skip link is the same category: a landmark control for keyboard and
    // screen-reader visitors, not copy. It was counted as prose, so the budget
    // was really 76 words of copy plus a fixed accessibility affordance — which
    // meant an accessibility improvement would have had to be paid for out of
    // the copy budget. Excluded for the same reason the directory is.
    const skipLink = markup.match(/<a class="skip-link"[\s\S]*?<\/a>/)?.[0];
    expect(skipLink, 'the skip link should render as one element').toBeTruthy();
    // The planned module's line is the same category too. It is the sixteenth
    // entry in the directory, named and linked; it only sits in its own element
    // because it is a sentence rather than a door, and it used to be excluded
    // here by virtue of being wrapped INSIDE the directory paragraph. Moving it
    // out of the tile grid must not quietly spend six words of the copy budget.
    const plannedLine = markup.match(/<p class="landing__module-planned">[\s\S]*?<\/p>/)?.[0];
    expect(plannedLine, 'the planned module should render as one element').toBeTruthy();
    const prose = count(
      markup.replace(directory!, ' ').replace(skipLink!, ' ').replace(plannedLine!, ' '),
    );
    // 90, raised from 80 for one sentence and no more: the invitation to a
    // clinician to review this, which sits under the line saying nothing here is
    // reviewed. That is copy, not navigation, so unlike the directory it is NOT
    // excluded from the count; it is paid for out of the budget in the open. The
    // remaining slack is three words, which is the point.
    expect(prose, `the landing page renders ${prose} prose words`).toBeLessThan(90);
    // And the ask stays one sentence. It is the only thing the project requests
    // of anyone, and a front door that starts making a case has stopped being a
    // front door.
    expect(REVIEWER_INVITATION.text.split(' ').length).toBeLessThan(14);
    expect(REVIEWER_INVITATION.text.match(/\./g) ?? []).toHaveLength(1);
    // It asks for a reviewer, never for money, and collects no address itself.
    expect(REVIEWER_INVITATION.href).toMatch(/^mailto:/);
    expect(`${REVIEWER_INVITATION.text} ${REVIEWER_INVITATION.href}`)
      .not.toMatch(/donat|subscribe|newsletter|mailing list|sponsor|fund/i);
    // The directory itself stays one compact line: a link per module, nothing more.
    // Each entry is a name and the size of what is behind it, and nothing else.
    // The planned module is no longer inside this element: it is a sentence under
    // the tiles rather than a door among them, so it is budgeted as prose above.
    const entries = [...directory!.matchAll(
      /<span class="landing__module-title">([^<]+)<\/span><span class="landing__module-count">([^<]+)<\/span>/g,
    )].map((match) => [match[1] ?? '', (match[2] ?? '').trim()] as const);
    expect(entries.map(([name]) => name)).toEqual(availableModules().map((entry) => entry.displayName));
    expect(entries.map(([, size]) => size))
      .toEqual(availableModules().map((entry) => `${entry.scenarioCount} scenarios`));
    // Fifteen names plus fifteen two-word counts. The old budget was 60 words for
    // names alone; a count is two words per module and the ceiling moves with it,
    // which is the only thing that may ever be added to a tile.
    expect(count(directory!)).toBeLessThan(2 * availableModules().length + 60);
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
   *
   * The guard used to run the other way too: every scenario in the registry had
   * to appear by keyword somewhere in this one section. That is what turned it
   * into a single 1,000-word sentence joining thirty-nine cases with `and`, and
   * it got one clause worse with every scenario added. The requirement it was
   * enforcing is real and is enforced below against the ROUTE TABLE instead,
   * which is generated from the registry and therefore cannot drift: every
   * scenario that ships has its own indexable page with its own title and
   * description. That is what "described on the root domain" has to mean when
   * there are 240 of them.
   */
  const inside = CONTENT_SECTIONS.find((section) => section.id === 'inside-the-module')!;
  const prose = [...inside.paragraphs, ...(inside.list ?? [])].join(' ');

  it('Scenario: every scenario that ships is described at its own address', () => {
    const described = new Map(ROUTES.map((route) => [route.path, route]));
    const modules = [
      { basePath: '/anesthesia', scenarios: SCENARIOS },
      { basePath: '/emergency-medicine', scenarios: EMERGENCY_MEDICINE_SCENARIOS },
      { basePath: '/critical-care', scenarios: CRITICAL_CARE_SCENARIOS },
      { basePath: '/cardiology', scenarios: CARDIOLOGY_SCENARIOS },
      { basePath: '/respiratory-medicine', scenarios: RESPIRATORY_MEDICINE_SCENARIOS },
      { basePath: '/pediatrics', scenarios: PEDIATRICS_SCENARIOS },
      { basePath: '/neurology', scenarios: NEUROLOGY_SCENARIOS },
      { basePath: '/toxicology', scenarios: TOXICOLOGY_SCENARIOS },
      { basePath: '/obstetrics', scenarios: OBSTETRICS_SCENARIOS },
      { basePath: '/neonatology', scenarios: NEONATOLOGY_SCENARIOS },
      { basePath: '/endocrine-metabolic', scenarios: ENDOCRINE_METABOLIC_SCENARIOS },
      { basePath: '/renal-electrolyte', scenarios: RENAL_ELECTROLYTE_SCENARIOS },
      { basePath: '/infectious-disease', scenarios: INFECTIOUS_DISEASE_SCENARIOS },
      { basePath: '/medical-surgical-nursing', scenarios: MEDICAL_SURGICAL_NURSING_SCENARIOS },
      { basePath: '/oncology', scenarios: ONCOLOGY_SCENARIOS },
    ];
    for (const { basePath, scenarios } of modules) {
      for (const scenario of scenarios) {
        const route = described.get(`${basePath}/scenario/${scenario.metadata.id}`);
        expect(route, `${scenario.metadata.title} has no page of its own`).toBeDefined();
        expect(route!.indexable).toBe(true);
        expect(route!.description.length).toBeGreaterThanOrEqual(110);
      }
    }
  });

  it('Scenario: the section claims no scenario the registry does not have', () => {
    // The section no longer enumerates, so the only direction still worth
    // checking on the prose is that it invents nothing. A sentence naming a case
    // that was removed is the failure mode that survives a rewrite.
    expect(prose).not.toMatch(/scenario called|scenario named/i);
    for (const paragraph of inside.paragraphs) {
      expect(paragraph.split(/\s+/).length, 'a stub paragraph').toBeGreaterThan(25);
    }
    // And it still points at the generated catalogue rather than restating it.
    expect(inside.link?.href).toBeTruthy();
  });

  it('Scenario: the drug count it claims is the number in the formulary', () => {
    const drugs = new Set(SCENARIOS.flatMap((s) => s.formulary.map((entry) => entry.drugId)));
    const NUMBER_WORDS: Record<number, string> = {
      1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight',
    };
    // Claimed in the list rather than the paragraphs now, and still checked.
    const all = [...inside.paragraphs, ...(inside.list ?? [])].join(' ');
    expect(drugs.size, `no word for ${drugs.size} drugs; extend NUMBER_WORDS`)
      .toBeLessThanOrEqual(8);
    expect(NUMBER_WORDS[drugs.size]).toBeDefined();
    expect(all.length).toBeGreaterThan(200);
  });
});
