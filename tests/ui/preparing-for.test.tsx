/**
 * @vitest-environment jsdom
 *
 * The "preparing for" page as a learner reads it
 * (platform/adoption → Learners Can Filter The Catalog By Examination Blueprint).
 *
 * Rendered from the address, because the selection lives in the URL: these
 * tests open the page the way a shared link opens it and read what comes back.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { PreparingForRoute } from '@routes/PreparingForRoute';
import { BLUEPRINTS, getBlueprint } from '@platform/curriculum/blueprints';

function page(search: string): string {
  window.history.replaceState(null, '', `/preparing-for${search}`);
  return renderToStaticMarkup(createElement(PreparingForRoute));
}

const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x2019;/g, '’')
  .replace(/\s+/g, ' ');

describe('the preparing-for page', () => {
  it('offers every blueprint and asks for a choice before showing categories', () => {
    const body = text(page(''));
    for (const blueprint of BLUEPRINTS) expect(body).toContain(blueprint.record.shortLabel);
    expect(body).toContain('Choose a blueprint above');
  });

  it('Scenario: A student finds the labs that touch a blueprint category', () => {
    const markup = page('?preparing-for=ncsbn-ncjmm&category=recognize-cues');
    const body = text(markup);
    const category = getBlueprint('ncsbn-ncjmm')!.categories
      .find((entry) => entry.id === 'recognize-cues')!;
    expect(body).toContain(category.label);
    for (const lesson of category.lessons) {
      expect(body).toContain(lesson.title);
      expect(markup).toContain(`href="${lesson.href}"`);
      expect(body).toContain(`About ${lesson.estimatedMinutes} simulated minutes`);
    }
    // One category only. The others stay in the chooser, which is how a learner
    // changes the selection, but none of them is a heading on the page.
    expect(markup.match(/<h3>/g)).toHaveLength(1);
    expect(markup).toContain(`<h3>${category.label}</h3>`);
  });

  it('Scenario: The blueprint version is visible', () => {
    const body = text(page('?preparing-for=ncsbn-ncjmm'));
    const record = getBlueprint('ncsbn-ncjmm')!.record;
    expect(body).toContain(record.body);
    expect(body).toContain(record.version);
    expect(body).toContain(record.recordedOn);
    expect(body).toContain(record.reviewBy);
  });

  it('keeps an empty category visible with its reason', () => {
    const body = text(page('?preparing-for=ncsbn-ncjmm&category=evaluate-outcomes'));
    expect(body).toContain('Evaluate outcomes');
    expect(body).toContain('No lesson here is mapped to this category.');
    expect(body).toContain('ends at the decision');
  });

  it('ignores an address naming something it never recorded', () => {
    const body = text(page('?preparing-for=usmle-step-2&category=anything'));
    expect(body).toContain('Choose a blueprint above');
  });
});
