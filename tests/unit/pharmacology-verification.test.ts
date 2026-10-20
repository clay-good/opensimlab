import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DocumentRoute } from '@routes/DocumentRoute';
import { routeFor } from '@routes/routes';
import { evaluateEnvelope } from '@anesthesia/pharmacology/envelope';
import { MODELS, MODEL_SET_REVISION } from '@anesthesia/pharmacology/registry';
import { PROPOFOL_MARSH_1991 } from '@anesthesia/pharmacology/models/propofol-marsh-1991';
import { PROPOFOL_ELEVELD_2018 } from '@anesthesia/pharmacology/models/propofol-eleveld-2018';
import type { PharmacologyModel } from '@anesthesia/pharmacology/types';
import {
  checkableParameters, isTranscriptionVerified, judgeVerificationRecord, parameterStatus,
  verificationQueue, type VerificationRecord,
} from '@anesthesia/pharmacology/verification';

const check = (overrides: Partial<VerificationRecord> = {}): VerificationRecord => ({
  modelId: PROPOFOL_MARSH_1991.id, parameter: 'v1', valueChecked: 15.96, unit: 'L',
  contentVersion: MODEL_SET_REVISION, primaryLocator: PROPOFOL_MARSH_1991.transcription.primaryLocator,
  secondSource: { kind: 'open-reference-implementation', citation: 'A fictional open library',
    locator: 'models/marsh.py' },
  checker: { name: 'A. Pharmacologist', statedQualification: 'PhD, pharmacokinetics' },
  date: '2026-10-19', maintainerConfirmed: true,
  ...overrides,
});

const withChecks = (model: PharmacologyModel, checks: readonly VerificationRecord[]): PharmacologyModel =>
  ({ ...model, transcription: { ...model.transcription, checks } });

describe('Requirement: A Verification Record Names Its Checker, Source, And Version', () => {
  it('accepts a confirmed, current, different-person check of the transcribed value', () => {
    expect(judgeVerificationRecord(check(), PROPOFOL_MARSH_1991, MODEL_SET_REVISION))
      .toEqual({ accepted: true });
  });

  it.each([
    ['self-check', { checker: { name: ' open sim lab MAINTAINER ', statedQualification: 'none' } }],
    ['kind-not-accepted', { secondSource: { kind: 'corrigendum' as const, citation: 'x', locator: 'y' } }],
    ['unconfirmed', { maintainerConfirmed: false }],
    ['older-version', { contentVersion: '2026.01.1' }],
    ['discrepancy', { discrepancy: 'The second source gives 15.9 L.' }],
    ['value-mismatch', { valueChecked: 16.5 }],
    ['unknown-parameter', { parameter: 'ke0' }],
  ])('refuses a %s record and leaves the parameter unverified', (reason, overrides) => {
    const record = check(overrides);
    const verdict = judgeVerificationRecord(record, PROPOFOL_MARSH_1991, MODEL_SET_REVISION);
    expect(verdict).toMatchObject({ accepted: false, reason });
    expect(parameterStatus(withChecks(PROPOFOL_MARSH_1991, [record]), record.parameter,
      MODEL_SET_REVISION)).not.toBe('verified');
  });

  it('shows a disputed parameter as disputed and an old check as an earlier-version check', () => {
    expect(parameterStatus(withChecks(PROPOFOL_MARSH_1991, [check({ discrepancy: 'differs' })]),
      'v1', MODEL_SET_REVISION)).toBe('disputed');
    expect(parameterStatus(withChecks(PROPOFOL_MARSH_1991, [check({ contentVersion: '2026.01.1' })]),
      'v1', MODEL_SET_REVISION)).toBe('earlier-version-checked');
  });

  it('verifies a model only when every parameter is checked, and the label follows', () => {
    const adult = { ageYears: 35, weightKg: 70, heightCm: 170, sex: 'male' as const };
    const parameters = checkableParameters(PROPOFOL_MARSH_1991);
    const values = PROPOFOL_MARSH_1991.referenceIndividual!.expected;
    const partial = withChecks(PROPOFOL_MARSH_1991, [check()]);
    expect(isTranscriptionVerified(partial, MODEL_SET_REVISION)).toBe(false);
    expect(evaluateEnvelope(partial, adult).label).toBe('pending-check');
    const complete = withChecks(PROPOFOL_MARSH_1991, parameters.map((parameter) =>
      check({ parameter, valueChecked: values[parameter]! })));
    expect(isTranscriptionVerified(complete, MODEL_SET_REVISION)).toBe(true);
    expect(evaluateEnvelope(complete, adult).label).toBe('published');
  });

  it('never verifies a teaching model, which has nothing transcribed to check', () => {
    for (const model of MODELS.filter((candidate) => candidate.isTeachingModel)) {
      expect(checkableParameters(model)).toEqual([]);
      expect(isTranscriptionVerified(model, MODEL_SET_REVISION)).toBe(false);
    }
  });
});

describe('Requirement: A Public Verification Queue Lists Every Unchecked Parameter', () => {
  const queue = verificationQueue(MODELS, MODEL_SET_REVISION);
  const markup = renderToStaticMarkup(createElement(DocumentRoute, { path: '/verification-queue' }));

  it('agrees with the transcription records in source', () => {
    const unverified = MODELS.flatMap((model) => checkableParameters(model)
      .filter((parameter) => parameterStatus(model, parameter, MODEL_SET_REVISION) !== 'verified'));
    expect(queue.pending).toBe(unverified.length);
    expect(queue.pending + queue.verified)
      .toBe(MODELS.reduce((total, model) => total + checkableParameters(model).length, 0));
    expect(queue.pending).toBeGreaterThan(0);
  });

  it('leads with both counts, a zero shown as zero, and keeps the list in the served HTML', () => {
    const firstFigure = markup.indexOf('figure__value');
    expect(firstFigure).toBeGreaterThan(-1);
    expect(firstFigure).toBeLessThan(markup.indexOf('<p>'));
    expect(markup).toContain(`<span class="figure__value">${queue.verified}</span>`);
    expect(markup).toContain(`<span class="figure__value">${queue.pending}</span>`);
    expect(markup).not.toMatch(/<details[^>]* open/);
    for (const model of queue.models) {
      expect(markup).toContain(model.modelId);
      for (const entry of model.entries) expect(markup).toContain(`<code>${entry.parameter}</code>`);
    }
    expect(markup).toContain(MODEL_SET_REVISION);
  });

  it('names the corrigendum where it bites', () => {
    const eleveld = queue.models.find((model) => model.modelId === PROPOFOL_ELEVELD_2018.id)!;
    expect(eleveld.entries.find((entry) => entry.parameter === 'q2')?.corrigendumNote)
      .toMatch(/corrigendum.*1\.83/);
    expect(eleveld.entries.filter((entry) => entry.corrigendumNote !== null)).toHaveLength(1);
    expect(markup).toContain('follows the corrigendum');
  });

  it('is an indexable route that says a check is not a review', () => {
    expect(routeFor('/verification-queue')).toMatchObject({ indexable: true });
    expect(markup).toContain('A check is not');
    expect(markup).toContain('a clinical review');
  });
});

describe('the queue is offered where reviewers land', () => {
  it('links from the content-review page as the ask that needs no licence', async () => {
    const { ContentReviewRoute } = await import('@routes/ContentReviewRoute');
    const markup = renderToStaticMarkup(createElement(ContentReviewRoute));
    expect(markup).toContain('href="/verification-queue"');
    expect(markup).toContain('never as a clinical review');
  });
});
