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
import { EducatorsRoute } from '@routes/EducatorsRoute';
import { FacilitatorGuideRoute } from '@routes/FacilitatorGuideRoute';
import { mappingCsv } from '@anesthesia/curriculum/mapping';
import { MAPPING_DISCLAIMER } from '@anesthesia/curriculum/frameworks';
import { facilitatorGuidePath } from '@platform/facilitation/scenario-catalog';

const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const SURFACES: readonly (readonly [string, string])[] = [
  ['curriculum page', text(renderToStaticMarkup(createElement(CurriculumRoute)))],
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

  // "Extubation readiness" and "handoff readiness" are states of the fictional
  // patient and are correct; what is forbidden is a claim about the learner.
  const LEARNER_CLAIM = new RegExp([
    String.raw`\bscor(?:e|es|ed|ing)\b`,
    String.raw`\bpass(?:es|ed|ing)?\s+(?:the|your|an?)\s+(?:exam|examination|test|boards?)\b`,
    String.raw`\b(?:exam|examination|board|learner|student|your)\s+readiness\b`,
    String.raw`\bready\s+for\s+(?:the\s+)?(?:exam|boards?|nclex|usmle|frca|practice)\b`,
  ].join('|'), 'i');

  it.each(SURFACES)('the %s never claims a learner passes, scores, or is ready', (_, body) => {
    expect(body).not.toMatch(LEARNER_CLAIM);
  });

  it('would catch the claims it exists to catch', () => {
    for (const claim of ['Your score: 8', 'helps you pass the exam', 'board readiness',
      'ready for the NCLEX']) expect(claim).toMatch(LEARNER_CLAIM);
    expect('Extubation readiness').not.toMatch(LEARNER_CLAIM);
  });

  it('keeps one disclaimer, so the surfaces cannot drift apart', () => {
    expect(SURFACES[0]![1]).toContain(MAPPING_DISCLAIMER);
    expect(SURFACES[2]![1]).toContain(MAPPING_DISCLAIMER);
  });
});
