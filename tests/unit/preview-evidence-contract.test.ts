/**
 * Acceptance tests for the per-kind preview evidence contract
 * (`openspec/changes/release-evergreen-preview/design.md` → the evidence table).
 *
 * The contract's whole job is to be fail-closed, so the tests that matter are the
 * ones that make each rule FAIL. A rule nobody has watched refuse is a rule you
 * are hoping about.
 */
import { describe, expect, it } from 'vitest';
import { MATURITY_SUBJECT_KINDS, maturityFor, type MaturityCatalog } from '@platform/catalog/maturity';
import {
  PREVIEW_BLOCKING_GATES, previewEvidenceFor, previewPublication,
} from '@platform/governance/publication';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { DRUG_CARDS } from '@anesthesia/content/drug-cards';
import { REGIONS } from '@anesthesia/region/profiles';

const OPTIONS = { validationReportPresent: true, faceValidityProcedureDocumented: true };

const PREVIEW_RECORD = {
  recordId: 'explanation:x@1.0.0',
  subjectKind: 'explanation' as const,
  subjectId: 'x',
  contentVersion: '1.0.0',
  status: 'preview' as const,
  evidence: ['src/x.ts#x'],
};

/** The gates a rule has to supply before an item may publish. */
function publishes(evidence: { passed: readonly string[] }): boolean {
  return previewPublication(PREVIEW_RECORD, evidence as never).status === 'publishable';
}

const COMPLETE_EXPLAINER = { reflects: 'A guideline, 2024', simplifies: 'It leaves out X.', body: 'Prose.' };
const COMPLETE_CARD = { sourceId: 'src-1', sourceTitle: 'A publication', comparedWithLabel: 'Wider than the label.' };
const COMPLETE_REGION = { guideline: 'A guideline', practiceNote: 'Described as practice.', namesUnavailable: true };

describe('Requirement: An Undefined Contract Fails Closed And Says So', () => {
  it('names the kind rather than reporting six missed gates', () => {
    const contract = previewEvidenceFor('alarm-threshold', COMPLETE_EXPLAINER, OPTIONS);
    expect(contract.contract).toBe('none');
    if (contract.contract !== 'none') throw new Error('unreachable');
    expect(contract.reason).toContain('no preview evidence rule');
    expect(contract.reason).toContain('alarm-threshold');
  });

  it('has a rule for exactly the three kinds that publish today, and none for the rest', () => {
    const ruled = MATURITY_SUBJECT_KINDS.filter(
      (kind) => previewEvidenceFor(kind, {}, OPTIONS).contract === 'rule',
    );
    expect([...ruled].sort()).toEqual(['drug-card', 'explanation', 'practice-region']);
  });
});

describe('Requirement: Each Rule Refuses What It Requires', () => {
  const cases = [
    { kind: 'explanation' as const, complete: COMPLETE_EXPLAINER, drop: ['reflects', 'simplifies'] },
    { kind: 'drug-card' as const, complete: COMPLETE_CARD, drop: ['sourceId', 'sourceTitle', 'comparedWithLabel'] },
    { kind: 'practice-region' as const, complete: COMPLETE_REGION, drop: ['guideline', 'practiceNote', 'namesUnavailable'] },
  ];

  for (const { kind, complete, drop } of cases) {
    it(`publishes a complete ${kind} and refuses each missing field`, () => {
      const whole = previewEvidenceFor(kind, complete, OPTIONS);
      if (whole.contract !== 'rule') throw new Error('expected a rule');
      expect(publishes(whole.evidence)).toBe(true);

      for (const field of drop) {
        const missing = { ...complete, [field]: undefined };
        const contract = previewEvidenceFor(kind, missing, OPTIONS);
        if (contract.contract !== 'rule') throw new Error('expected a rule');
        expect(publishes(contract.evidence), `${kind} without ${field}`).toBe(false);
      }
    });
  }

  it('refuses an explanation that instructs a reader to give a dose, in either order', () => {
    // The verb-first phrasing is the more natural English and was the one the
    // original rule missed, so both orders are held here.
    for (const body of [
      'Give 2 mg/kg of propofol to induce.',
      'Administer 0.6 mg/kg for a rapid sequence.',
      'Draw up 2 mg/kg of propofol and push it.',
    ]) {
      const contract = previewEvidenceFor('explanation', { ...COMPLETE_EXPLAINER, body }, OPTIONS);
      if (contract.contract !== 'rule') throw new Error('expected a rule');
      expect(contract.evidence.passed, body).not.toContain('safety-scope');
      expect(publishes(contract.evidence), body).toBe(false);
    }
  });

  it('leaves explanatory prose about a drug alone', () => {
    // The rule must not fire on describing what a drug does, only on telling a
    // reader to do it. An explainer corpus that cannot mention a number is useless.
    for (const body of [
      'A 2 mg/kg induction dose produces apnoea within thirty seconds in most adults.',
      'The effect-site concentration peaks later than the plasma concentration does.',
      'Giving more of it does not make the delay shorter.',
    ]) {
      const contract = previewEvidenceFor('explanation', { ...COMPLETE_EXPLAINER, body }, OPTIONS);
      if (contract.contract !== 'rule') throw new Error('expected a rule');
      expect(contract.evidence.passed, body).toContain('safety-scope');
    }
  });

  it('refuses everything when the validation report and face-validity procedure are gone', () => {
    const contract = previewEvidenceFor('explanation', COMPLETE_EXPLAINER, {
      validationReportPresent: false, faceValidityProcedureDocumented: false,
    });
    if (contract.contract !== 'rule') throw new Error('expected a rule');
    expect(publishes(contract.evidence)).toBe(false);
  });
});

describe('Requirement: The Shipped Content Carries What Its Rule Reads', () => {
  it('gives every explainer an assertion-to-source record and a stated simplification', () => {
    expect(EXPLAINERS.length).toBeGreaterThanOrEqual(10);
    for (const explainer of EXPLAINERS) {
      expect(explainer.reflects.trim().length, explainer.id).toBeGreaterThan(0);
      expect(explainer.simplifies.trim().length, explainer.id).toBeGreaterThan(0);
      const contract = previewEvidenceFor('explanation', explainer, OPTIONS);
      if (contract.contract !== 'rule') throw new Error('expected a rule');
      expect(publishes(contract.evidence), explainer.id).toBe(true);
    }
  });

  it('gives every drug card a dosing source and a stated comparison with the label', () => {
    for (const card of DRUG_CARDS) {
      const contract = previewEvidenceFor('drug-card', {
        sourceId: card.dosing.sourceId,
        sourceTitle: card.dosing.sourceTitle,
        comparedWithLabel: card.dosing.comparedWithLabel,
      }, OPTIONS);
      if (contract.contract !== 'rule') throw new Error('expected a rule');
      expect(publishes(contract.evidence), card.drugId).toBe(true);
    }
  });

  it('has every blocking gate covered by at least one rule', () => {
    const contract = previewEvidenceFor('explanation', COMPLETE_EXPLAINER, OPTIONS);
    if (contract.contract !== 'rule') throw new Error('expected a rule');
    for (const gate of PREVIEW_BLOCKING_GATES) expect(contract.evidence.passed).toContain(gate);
    expect(REGIONS.length).toBeGreaterThan(0);
  });
});

/**
 * A `preview` status is a claim that the evidence passed for THIS version of THIS
 * item. Two things have to hold for that claim to mean anything: the evidence has
 * to actually pass, and the record has to be the one for the exact version being
 * published. Marking something `preview` is not what makes it publishable.
 */
describe('Requirement: Preview Is Earned Per Exact Version', () => {
  const catalog: MaturityCatalog = {
    schemaVersion: 1,
    moduleId: 'anesthesia',
    recordCount: 1,
    records: [{ ...PREVIEW_RECORD, subjectId: 'an-explainer', recordId: 'explanation:an-explainer@1.0.0' }],
  };

  it('refuses a preview record whose evidence does not pass', () => {
    const contract = previewEvidenceFor('explanation', { ...COMPLETE_EXPLAINER, reflects: undefined }, OPTIONS);
    if (contract.contract !== 'rule') throw new Error('expected a rule');
    const verdict = previewPublication(catalog.records[0]!, contract.evidence);
    expect(verdict.status).toBe('blocked');
    if (verdict.status !== 'blocked') throw new Error('unreachable');
    expect(verdict.reasons).toContain('missing preview gate: sources');
  });

  it('resolves no record for a version that was never judged', () => {
    expect(maturityFor(catalog, 'explanation', 'an-explainer', '1.0.0')).toBeDefined();
    // The content changed; the record for the old version does not carry over.
    expect(maturityFor(catalog, 'explanation', 'an-explainer', '1.0.1')).toBeUndefined();
    // Nor does another item's record, however similar the id looks.
    expect(maturityFor(catalog, 'explanation', 'an-explainer-2', '1.0.0')).toBeUndefined();
    // Nor the same id under a different kind.
    expect(maturityFor(catalog, 'drug-card', 'an-explainer', '1.0.0')).toBeUndefined();
  });

  it('keeps draft and withdrawn unpublishable however good the evidence is', () => {
    const contract = previewEvidenceFor('explanation', COMPLETE_EXPLAINER, OPTIONS);
    if (contract.contract !== 'rule') throw new Error('expected a rule');
    for (const status of ['draft', 'withdrawn'] as const) {
      const verdict = previewPublication({ ...PREVIEW_RECORD, status }, contract.evidence);
      expect(verdict.status, status).toBe('blocked');
    }
  });
});
