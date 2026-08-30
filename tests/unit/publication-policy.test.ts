import { describe, expect, it } from 'vitest';
import type { ContentMaturity, MaturityRecord } from '@platform/catalog/maturity';
import {
  MATURITY_LABELS, PREVIEW_GATES, isReviewedOnlyStatus, maturityLabelFor, previewPublication,
  scenarioPreviewEvidence,
} from '@platform/governance/publication';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import { buildAnesthesiaCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { buildScenarioQualityCatalog } from '@platform/catalog/scenario-quality';

const record = (status: ContentMaturity): MaturityRecord => ({
  recordId: `scenario:test@1.0.0`, subjectKind: 'scenario', subjectId: 'test',
  contentVersion: '1.0.0', status, evidence: ['/catalog/test.json'],
});

describe('maturity publication policy', () => {
  it('publishes complete unsigned preview without granting authority', () => {
    expect(previewPublication(record('preview'), { passed: PREVIEW_GATES }))
      .toEqual({ status: 'publishable' });
    expect(isReviewedOnlyStatus('preview')).toBe(false);
    expect(isReviewedOnlyStatus('source_checked')).toBe(false);
  });

  it('requires every named preview gate', () => {
    const verdict = previewPublication(record('preview'), {
      passed: PREVIEW_GATES.filter((gate) => gate !== 'limitations'),
    });
    expect(verdict).toEqual({
      status: 'blocked', reasons: ['missing preview gate: limitations'],
    });
  });

  it('never publishes draft or withdrawn records even when automated gates pass', () => {
    expect(previewPublication(record('draft'), { passed: PREVIEW_GATES }).status).toBe('blocked');
    expect(previewPublication(record('withdrawn'), { passed: PREVIEW_GATES }).status).toBe('blocked');
  });

  it('reserves reviewed-only claims for reviewed and endorsed status', () => {
    expect(isReviewedOnlyStatus('clinically_reviewed')).toBe(true);
    expect(isReviewedOnlyStatus('institution_endorsed')).toBe(true);
    expect(isReviewedOnlyStatus('withdrawn')).toBe(false);
  });

  it('uses plain honest labels for every status', () => {
    expect(Object.keys(MATURITY_LABELS)).toHaveLength(6);
    // One published state, carrying both facts: the scope it is for, and that
    // nothing in it is signed. Dropping the second half would leave the product
    // described only by its purpose and not by its evidence.
    expect(MATURITY_LABELS.preview).toBe('Educational use only — not clinically reviewed');
    expect(MATURITY_LABELS.preview.toLowerCase()).toContain('not clinically reviewed');
    expect(MATURITY_LABELS.source_checked).toContain('clinical behavior not reviewed');
    expect(MATURITY_LABELS.institution_endorsed.toLowerCase()).not.toContain('certified');
  });

  it('refuses a stale badge when identity or version does not match', () => {
    const preview = record('preview');
    expect(maturityLabelFor(preview, 'test', '1.0.0')).toBe(MATURITY_LABELS.preview);
    expect(maturityLabelFor(preview, 'test', '2.0.0')).toBeUndefined();
    expect(maturityLabelFor(preview, 'another-item', '1.0.0')).toBeUndefined();
  });

  it('derives preview evidence from exact-version generated audits', () => {
    const completion = buildAnesthesiaCompletionCatalog(SCENARIOS, ENGINE_VERSION);
    const quality = buildScenarioQualityCatalog(completion);
    const first = completion.scenarios[0]!;
    const firstQuality = quality.scenarios[0]!;
    const evidence = scenarioPreviewEvidence(first, firstQuality, {
      validationReportPresent: true, faceValidityProcedureDocumented: true,
    });
    expect(evidence.passed).toContain('build-integrity');
    expect(evidence.passed).toContain('sources');
    expect(evidence.passed).toContain('limitations');
    expect(evidence.passed).not.toContain('completion-contract');
    expect(evidence.passed).not.toContain('tests');

    expect(() => scenarioPreviewEvidence(first, {
      ...firstQuality, contentVersion: '99.0.0',
    }, {
      validationReportPresent: true, faceValidityProcedureDocumented: true,
    })).toThrow('Preview evidence version mismatch');
  });
});
