/** Acceptance tests for platform/clinical-governance and learning/knowledge-layer. */
import { describe, expect, it } from 'vitest';
import {
  OVERDUE_GRACE_DAYS, UNSIGNED_MARKER, gate, mayShip, needsCoSignature, needsPendingMarker,
  reportCoverage, uncoveredDomains, type ReviewableItem,
} from '@platform/governance/review-gate';
import { EDITORIAL_BOARD, HONEST_STATUS, reviewableItems } from '@platform/governance/records';
import { EXPLAINERS, getExplainer, wordCount } from '@anesthesia/content/explainers';
import { DRUG_CARDS, getDrugCard } from '@anesthesia/content/drug-cards';

const TODAY = new Date('2026-08-19T00:00:00Z');

const signed = (overrides: Partial<ReviewableItem> = {}): ReviewableItem => ({
  id: 'test-item',
  kind: 'explainer',
  contentVersion: '1.0.0',
  review: {
    reviewer: 'A Clinician', credential: 'MBBS FRCA', reviewedOn: '2026-01-01',
    reviewBy: '2028-01-01', contentVersion: '1.0.0', sources: ['A source'],
  },
  ...overrides,
});

describe('Requirement: Every Clinical Assertion Is Signed', () => {
  it('Scenario: Unreviewed clinical content cannot reach production', () => {
    const unsigned = signed({
      review: { ...signed().review, reviewer: UNSIGNED_MARKER, credential: UNSIGNED_MARKER },
    });
    const verdict = gate(unsigned, TODAY);
    expect(verdict.status).toBe('unsigned');
    expect(mayShip(verdict)).toBe(false);
    // The build log names the item.
    expect('reason' in verdict && verdict.reason).toContain('test-item');
  });

  it('Scenario: Re-review is triggered by change, not by calendar alone', () => {
    const drifted = signed({ contentVersion: '1.1.0' });
    const verdict = gate(drifted, TODAY);
    expect(verdict.status).toBe('version-drift');
    expect(mayShip(verdict)).toBe(false);
    expect('reason' in verdict && verdict.reason).toContain('re-review');
  });

  it('passes a current, signed, sourced item', () => {
    const verdict = gate(signed(), TODAY);
    expect(verdict.status).toBe('current');
    expect(mayShip(verdict)).toBe(true);
    expect(needsPendingMarker(verdict)).toBe(false);
  });

  it('refuses an item that names no sources', () => {
    const verdict = gate(signed({ review: { ...signed().review, sources: [] } }), TODAY);
    expect(verdict.status).toBe('incomplete');
    expect(mayShip(verdict)).toBe(false);
  });
});

describe('Requirement: Guideline Currency Is Tracked And Surfaced', () => {
  it('Scenario: Stale content is flagged before it misleads', () => {
    // Ten days past the review-by date: still shown, but marked pending re-review.
    const slightlyOverdue = signed({ review: { ...signed().review, reviewBy: '2026-08-09' } });
    const verdict = gate(slightlyOverdue, TODAY);
    expect(verdict.status).toBe('overdue');
    expect(needsPendingMarker(verdict)).toBe(true);
    expect(mayShip(verdict)).toBe(true);

    // Beyond the grace period it is excluded.
    const longOverdue = signed({ review: { ...signed().review, reviewBy: '2026-01-01' } });
    const late = gate(longOverdue, TODAY);
    expect(late.status).toBe('overdue');
    expect('daysOverdue' in late && late.daysOverdue).toBeGreaterThan(OVERDUE_GRACE_DAYS);
    expect(mayShip(late)).toBe(false);
  });
});

describe('Requirement: Governance Is Auditable From Outside', () => {
  it('Scenario: Coverage gaps are visible rather than implied', () => {
    const report = reportCoverage(reviewableItems(), TODAY);
    // Never an aggregate without the underlying list.
    expect(report.outstanding.length).toBe(report.total - report.current);
    for (const entry of report.outstanding) {
      expect(entry.item.id.length).toBeGreaterThan(0);
      expect(entry.verdict.status).not.toBe('current');
    }
  });

  it('reports this build honestly: nothing is signed', () => {
    const report = reportCoverage(reviewableItems(), TODAY);
    expect(report.total).toBeGreaterThan(5);
    // This is the true state of the alpha and the project says so.
    expect(report.current).toBe(0);
    expect(report.percentCurrent).toBe(0);
    expect(EDITORIAL_BOARD).toHaveLength(0);
    expect(HONEST_STATUS.headline).toContain('Not clinically reviewed');
    expect(HONEST_STATUS.detail).toContain('No clinician has signed');
  });

  it('Scenario: Board coverage matches the content', () => {
    const items = reviewableItems();
    // With an empty board, every domain is uncovered, and the gate says so by name.
    const uncovered = uncoveredDomains(items, EDITORIAL_BOARD);
    expect(uncovered).toContain('adult-general-anaesthesia');
    expect(uncovered).toContain('pharmacology');

    // A board member with the right scope covers their domain.
    const covered = uncoveredDomains(items, [{
      name: 'A Clinician', credential: 'MBBS FRCA', institution: 'A Hospital',
      scope: ['adult-general-anaesthesia', 'pharmacology', 'practice-variation'],
      joined: '2026-01-01', competingInterests: 'None declared',
    }]);
    expect(covered).toHaveLength(0);
  });

  it('Scenario: Competing interests are declared, not merely absent', () => {
    const clean = {
      name: 'A', credential: 'MD', institution: 'X', scope: [], joined: '2026-01-01',
      competingInterests: 'None declared',
    };
    const conflicted = { ...clean, competingInterests: 'Advisory board, a device manufacturer' };
    expect(needsCoSignature(clean)).toBe(false);
    expect(needsCoSignature(conflicted)).toBe(true);
  });
});

describe('Requirement: Concept Explainers', () => {
  it('Scenario: The core concept set is present', () => {
    const ids = EXPLAINERS.map((explainer) => explainer.id);
    for (const required of [
      'hysteresis-and-effect-site-lag',
      'preoxygenation-and-safe-apnea-time',
      'hypnotic-opioid-synergy',
      'vasodilation-versus-hypovolemia',
      'capnogram-morphology',
      'depth-monitoring-and-its-limits',
    ]) {
      expect(ids, `missing explainer ${required}`).toContain(required);
    }
  });

  it('keeps every explainer under 250 words with one diagram and a live demonstration', () => {
    for (const explainer of EXPLAINERS) {
      const words = wordCount(explainer.body);
      expect(words, `${explainer.id} is ${words} words`).toBeLessThanOrEqual(250);
      expect(words).toBeGreaterThan(60);
      expect(explainer.diagram.caption.length).toBeGreaterThan(20);
      // Scenario: An explainer earns its place by being demonstrable.
      expect(explainer.showMe.scenarioId.length).toBeGreaterThan(0);
    }
  });

  it('Scenario: Explainers teach where the evidence is weak', () => {
    const airway = getExplainer('airway-assessment-predicts-poorly');
    expect(airway.body).toContain('Mallampati');
    // States honestly that no single bedside test reliably predicts difficulty.
    expect(airway.body).toContain('No single bedside test reliably predicts');
    // And teaches the resulting behaviour.
    expect(airway.body).toContain('prepare for difficulty you did not predict');
  });

  it('Scenario: The limitations of depth monitoring are taught', () => {
    const depth = getExplainer('depth-monitoring-and-its-limits');
    expect(depth.body).toContain('ketamine');
    expect(depth.body).toContain('nitrous oxide');
    expect(depth.body).toContain('elderly');
    expect(depth.body).toContain('electromyographic');
    expect(depth.body).toContain('end-tidal agent guidance');
    // And it is a PREDICTION, never a monitor reading.
    expect(depth.body).toContain('PREDICTION');
  });

  it('Scenario: A learner can tell how current the guidance is', () => {
    for (const explainer of EXPLAINERS) {
      expect(explainer.reflects.length).toBeGreaterThan(15);
    }
  });
});

describe('Requirement: Drug Cards Teach The Drug, Not Just The Math', () => {
  it('Scenario: A card answers the question a student actually has', () => {
    const remifentanil = getDrugCard('remifentanil');
    expect(remifentanil).toBeDefined();
    expect(remifentanil!.inductionDose).toContain('µg/kg');
    expect(remifentanil!.onset).toContain('minute');
    expect(remifentanil!.duration).toContain('context-sensitive'.replace('c', 'C'));
    expect(remifentanil!.adverseEffects.join(' ')).toContain('No residual analgesia');
    expect(remifentanil!.watchFor).toContain('heart rate');
  });

  it('gives every card every required section', () => {
    for (const card of DRUG_CARDS) {
      expect(card.drugClass.length).toBeGreaterThan(5);
      expect(card.mechanism.length).toBeGreaterThan(20);
      expect(card.inductionDose.length).toBeGreaterThan(10);
      expect(card.maintenanceDose.length).toBeGreaterThan(10);
      expect(card.onset.length).toBeGreaterThan(10);
      expect(card.duration.length).toBeGreaterThan(10);
      expect(card.adverseEffects.length).toBeGreaterThan(1);
      expect(card.contraindications.length).toBeGreaterThan(0);
      expect(card.watchFor.length).toBeGreaterThan(30);
    }
  });

  it('says plainly that propofol has no analgesic effect', () => {
    expect(getDrugCard('propofol')!.mechanism).toContain('no analgesic effect');
  });
});
