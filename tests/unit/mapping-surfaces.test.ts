/**
 * framework-mapping-expansion → statements and wording on every mapping surface.
 *
 * A mapping is this project's reading of a framework, never an accreditor's.
 * Every place a mapping is shown must say so and must say simulator time is
 * not clinical time, and none may speak of passing, scoring, or readiness,
 * which would turn a reading list into a claim about a learner.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { CurriculumRoute } from '@routes/CurriculumRoute';
import { PreparingForRoute } from '@routes/PreparingForRoute';
import { BLUEPRINTS } from '@platform/curriculum/blueprints';
import { EducatorsRoute } from '@routes/EducatorsRoute';
import { FacilitatorGuideRoute } from '@routes/FacilitatorGuideRoute';
import { mappingCsv } from '@anesthesia/curriculum/mapping';
import { MAPPING_DISCLAIMER } from '@anesthesia/curriculum/frameworks';
import { facilitatorGuidePath } from '@platform/facilitation/scenario-catalog';

const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const SURFACES: readonly (readonly [string, string])[] = [
  ['curriculum page', text(renderToStaticMarkup(createElement(CurriculumRoute)))],
  // Rendered with no blueprint selected, which is every word the page can say
  // before a learner chooses; the per-blueprint view is linted by its own file.
  ['preparing-for page', text(renderToStaticMarkup(createElement(PreparingForRoute)))],
  // And each blueprint as a learner selects it, which is where the framework's
  // own note and every mapped lesson title reach the page.
  ...BLUEPRINTS.map((blueprint) => [
    `preparing-for page, ${blueprint.record.shortLabel}`,
    text(renderToStaticMarkup(createElement(PreparingForRoute,
      { query: { blueprint: blueprint.record.id, category: 'all' } }))),
  ] as const),
  ['educator page', text(renderToStaticMarkup(createElement(EducatorsRoute)))],
  ['facilitator guide', text(renderToStaticMarkup(createElement(FacilitatorGuideRoute,
    { path: facilitatorGuidePath('anesthesia', 'routine-induction') })))],
  ['mapping CSV', mappingCsv()],
];

describe('every curriculum-mapping surface', () => {
  it.each(SURFACES)('the %s says no accreditor endorsed it and that it is not clinical time', (_, body) => {
    expect(body).toMatch(/No accrediting or certifying body has reviewed, endorsed or recognised them/);
    expect(body).toMatch(/does not count toward any case requirement, clinical\s+hour or supervised\s+experience/);
  });

  // What is forbidden is a claim about the LEARNER, which is why each pattern
  // carries its own learner context. The bare words belong to the patient and
  // appear correctly on these surfaces: "extubation readiness" and "handoff
  // readiness" are states of the fictional patient, and "a low score" is a
  // nursing lesson about a deterioration score nobody acted on.
  const LEARNER_CLAIM = new RegExp([
    String.raw`\b(?:your|their|the\s+(?:learner|student)(?:'s|\u2019s)?)\s+scores?\b`,
    String.raw`\bscor(?:e|es|ed|ing)\s+(?:you|your|the\s+(?:learner|student))\b`,
    String.raw`\byou\s+scored?\b`,
    String.raw`\bpass(?:es|ed|ing)?\s+(?:the|your|an?)\s+(?:exam|examination|test|boards?)\b`,
    String.raw`\b(?:exam|examination|board|learner|student|your)\s+readiness\b`,
    String.raw`\bready\s+for\s+(?:the\s+)?(?:exam|boards?|nclex|usmle|frca|practice)\b`,
  ].join('|'), 'gi');

  /**
   * A sentence that DENIES the claim is the opposite of making it, and these
   * surfaces are required to carry such sentences: the NCSBN reading says in
   * its own note that it "says nothing about examination readiness". So a match
   * is a claim only when no negation precedes it in the same sentence. The cost
   * is that a denial followed by an assertion inside one sentence would slip
   * through; the benefit is that the gate stops forbidding the disclaimers the
   * requirement asks for.
   */
  const NEGATED = /\b(?:no|not|never|nothing|neither|nor|without)\b[^.]{0,90}$/i;

  function learnerClaims(body: string): string[] {
    return [...body.matchAll(LEARNER_CLAIM)]
      .filter((match) => !NEGATED.test(body.slice(Math.max(0, match.index - 90), match.index)))
      .map((match) => match[0]);
  }

  it.each(SURFACES)('the %s never claims a learner passes, scores, or is ready', (_, body) => {
    expect(learnerClaims(body)).toEqual([]);
  });

  it('lets a surface carry the denial the requirement asks for', () => {
    // The NCSBN reading's own note denies the claim in the very words the gate
    // forbids. If this stops being true, the negation rule above is untested.
    const ncjmm = SURFACES.find((entry) => entry[0].endsWith('NCJMM'))![1];
    expect(ncjmm).toContain('says nothing about examination readiness');
    expect(learnerClaims(ncjmm)).toEqual([]);
  });

  it('would catch the claims it exists to catch', () => {
    for (const claim of ['Your score: 8', 'helps you pass the exam', 'board readiness',
      'ready for the NCLEX', 'it scores the learner on each objective', 'you scored 8'])
      expect(learnerClaims(claim), claim).not.toEqual([]);
    for (const allowed of ['Extubation readiness', 'A low score: what the threshold does not exclude',
      'it says nothing about examination readiness', 'no part of this scores you'])
      expect(learnerClaims(allowed), allowed).toEqual([]);
  });

  it('keeps one disclaimer, so the surfaces cannot drift apart', () => {
    const surface = (name: string) => SURFACES.find((entry) => entry[0] === name)![1];
    for (const name of ['curriculum page', 'preparing-for page', 'facilitator guide']) {
      expect(surface(name), name).toContain(MAPPING_DISCLAIMER);
    }
  });
});
