/**
 * The first-load acknowledgement says what this build is, before anything runs.
 *
 * It is the one moment every learner passes through, so it is where the
 * disclosure belongs — with a route to the evidence, so it can be checked rather
 * than taken on trust.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NotForClinicalUseGate } from '@platform/safety/not-for-clinical-use';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';

describe('Requirement: The Acknowledgement Discloses The Review State', () => {
  const markup = renderToStaticMarkup(
    <NotForClinicalUseGate open onAcknowledge={() => {}} />,
  );

  it('still carries the not-for-clinical-use statement', () => {
    expect(markup).toContain(NOT_FOR_CLINICAL_USE);
  });

  it('states plainly that no clinician has reviewed the content', () => {
    expect(markup).toContain('No clinician has reviewed this content');
    expect(markup).toContain('board is empty');
  });

  it('links to the page that lists every item and its label', () => {
    expect(markup).toContain('href="/review-status"');
  });
});
