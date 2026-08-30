/** Acceptance tests for platform/clinical-governance and learning/knowledge-layer. */
import { describe, expect, it } from 'vitest';
import {
  OVERDUE_GRACE_DAYS, UNREVIEWED_NOTICE, UNSIGNED_MARKER, gate, isUnreviewed,
  needsCoSignature, needsPendingMarker, reportCoverage, uncoveredDomains, type ReviewableItem,
} from '@platform/governance/review-gate';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { EDITORIAL_BOARD, HONEST_STATUS, reviewableItems } from '@platform/governance/records';
import { EXPLAINERS, getExplainer, wordCount } from '@anesthesia/content/explainers';
import { DRUG_CARDS, getDrugCard } from '@anesthesia/content/drug-cards';
import { registeredPmids, requireSource } from '@platform/docs/sources';

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

describe('Requirement: Reviewed claims require exact signatures', () => {
  it('keeps unsigned content out of reviewed-only channels', () => {
    const unsigned = signed({
      review: { ...signed().review, reviewer: UNSIGNED_MARKER, credential: UNSIGNED_MARKER },
    });
    const verdict = gate(unsigned, TODAY);
    expect(verdict.status).toBe('unsigned');
    // The review record names the item and affects authority, not preview availability.
    expect('reason' in verdict && verdict.reason).toContain('test-item');
    expect('reason' in verdict && verdict.reason).toContain('reviewed-only');
  });

  it('Scenario: Re-review is triggered by change, not by calendar alone', () => {
    const drifted = signed({ contentVersion: '1.1.0' });
    const verdict = gate(drifted, TODAY);
    expect(verdict.status).toBe('version-drift');
    expect('reason' in verdict && verdict.reason).toContain('re-review');
  });

  it('passes a current, signed, sourced item', () => {
    const verdict = gate(signed(), TODAY);
    expect(verdict.status).toBe('current');
    expect(needsPendingMarker(verdict)).toBe(false);
  });

  it('refuses an item that names no sources', () => {
    const verdict = gate(signed({ review: { ...signed().review, sources: [] } }), TODAY);
    expect(verdict.status).toBe('incomplete');
  });
});

describe('Requirement: Guideline Currency Is Tracked And Surfaced', () => {
  it('Scenario: Stale content is flagged before it misleads', () => {
    // Ten days past the review-by date: still shown, but marked pending re-review.
    const slightlyOverdue = signed({ review: { ...signed().review, reviewBy: '2026-08-09' } });
    const verdict = gate(slightlyOverdue, TODAY);
    expect(verdict.status).toBe('overdue');
    expect(needsPendingMarker(verdict)).toBe(true);

    // Beyond the grace period the maturity transition can deterministically fall back.
    const longOverdue = signed({ review: { ...signed().review, reviewBy: '2026-01-01' } });
    const late = gate(longOverdue, TODAY);
    expect(late.status).toBe('overdue');
    expect('daysOverdue' in late && late.daysOverdue).toBeGreaterThan(OVERDUE_GRACE_DAYS);
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
    // This is the true state of the published corpus and the project says so.
    expect(report.current).toBe(0);
    expect(report.percentCurrent).toBe(0);
    expect(EDITORIAL_BOARD).toHaveLength(0);
    expect(HONEST_STATUS.headline).toContain('not clinically reviewed');
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
      scope: ['adult-general-anaesthesia', 'emergency-medicine', 'critical-care',
        'cardiology', 'respiratory-medicine', 'pediatrics', 'neurology', 'toxicology', 'obstetrics', 'neonatology', 'endocrine-metabolic', 'renal-electrolyte', 'infectious-disease', 'medical-surgical-nursing', 'oncology', 'pharmacology',
        'practice-variation'],
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

describe('Requirement: Unreviewed Content Is Marked Where It Is Used', () => {
  // The alpha channel ships content no clinician has signed. That is only
  // defensible if a reader meets the disclosure at the claim, not once on the
  // front page. These tests are the condition the channel depends on.
  it('Scenario: every unsigned item is detected as unsigned', () => {
    for (const card of DRUG_CARDS) expect(isUnreviewed(card.review), card.drugId).toBe(true);
    for (const explainer of EXPLAINERS) expect(isUnreviewed(explainer.review), explainer.id).toBe(true);
    expect(isUnreviewed(ROUTINE_INDUCTION.metadata.clinicalReview)).toBe(true);
  });

  it('Scenario: a signed item is not marked', () => {
    expect(isUnreviewed({ reviewer: 'A Clinician', reviewedOn: '2026-08-01' })).toBe(false);
  });

  it('Scenario: the notice says what was and was not checked, and how to report', () => {
    expect(UNREVIEWED_NOTICE).toContain('No clinician has reviewed this');
    // It must not overclaim the automated proofread as a review.
    expect(UNREVIEWED_NOTICE).toContain('not wrong judgement');
    expect(UNREVIEWED_NOTICE.toLowerCase()).toContain('wrong');
  });

  it('Scenario: the marker is rendered at the point of use', () => {
    const cockpit = readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/Cockpit.tsx'), 'utf8');
    const prebrief = readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/Prebrief.tsx'), 'utf8');
    // The drug card drawer, the explainer drawer and the scenario briefing.
    expect((cockpit.match(/<UnreviewedMarker/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(prebrief).toContain('has not been clinically reviewed');
  });
});

describe('Requirement: Dosing A Learner Reads Can Be Checked', () => {
  /**
   * The doses on the drug cards had no source at all, while every model
   * parameter in the project had one — so the most directly consequential text
   * in the application was the only clinical content a reader could not check.
   */
  it('Scenario: every card names where its dosing was checked', () => {
    for (const card of DRUG_CARDS) {
      expect(card.dosing, card.drugId).toBeDefined();
      expect(() => requireSource(card.dosing.sourceId)).not.toThrow();
    }
  });

  it('Scenario: a card that differs from its label says so, and does not reconcile it', () => {
    // Teaching ranges and licensed ranges genuinely differ. Which one a learner
    // should be shown is a clinician's call, so the difference is surfaced
    // rather than quietly resolved by whoever edited the file last.
    const propofol = getDrugCard('propofol')!;
    expect(propofol.dosing.comparedWithLabel).toContain('2–2.5 mg/kg');
    expect(propofol.dosing.comparedWithLabel).toContain('teaching range');
    expect(propofol.dosing.comparedWithLabel).toContain('clinician');
  });

  it('Scenario: remifentanil carries the label figures it was checked against', () => {
    const remifentanil = getDrugCard('remifentanil')!;
    // The label's induction dose and its maintenance ceiling, both of which
    // differ from the range this card teaches.
    expect(remifentanil.dosing.comparedWithLabel).toContain('1 µg/kg over 30 to 60 seconds');
    expect(remifentanil.dosing.comparedWithLabel).toContain('0.05–2 µg/kg/min');
    expect(remifentanil.dosing.comparedWithLabel).toContain('clinician');
  });

  it('Scenario: no card claims a check that was not done', () => {
    // The phrasing that marked an unchecked card is gone because both are now
    // checked. If a third card is added unchecked, it says so in these words
    // and this test is what stops the phrase being quietly dropped instead.
    const unchecked = DRUG_CARDS.filter((card) => /NOT yet checked/.test(card.dosing.comparedWithLabel));
    for (const card of unchecked) {
      expect(card.dosing.comparedWithLabel, card.drugId).toContain('reviewer should look at');
    }
  });

  it('Scenario: the label sources say which country they are', () => {
    // Licensed dosing differs by country and the practice-region profiles
    // already know that. A label cited without its jurisdiction is a trap.
    for (const card of DRUG_CARDS) {
      const source = requireSource(card.dosing.sourceId);
      expect(source.usedFor.length + source.verifiedAgainst.length).toBeGreaterThan(80);
      expect(source.authors).toContain('United States');
    }
  });

  it('Scenario: the dosing source does not imply the card is clinically reviewed', () => {
    // A citation is not a signature. Every card is still unsigned.
    for (const card of DRUG_CARDS) expect(isUnreviewed(card.review), card.drugId).toBe(true);
  });
});

describe('Requirement: A Claim About Evidence Names The Evidence', () => {
  /**
   * The explainers' provenance lines were mostly gestures — "standard
   * cardiovascular physiology", "the awareness trial literature". For a
   * qualitative explanation that is honest enough. For a claim about what large
   * trials found, it is not: the one explainer whose entire point is that a
   * number deserves scepticism was itself making an unfalsifiable claim.
   */
  const claimsAboutTrials = (explainer: { body: string }) =>
    /\btrials?\b|\bstudies\b|\bevidence\b/i.test(explainer.body);

  it('Scenario: an explainer citing trials names them with an identifier', () => {
    for (const explainer of EXPLAINERS) {
      if (!claimsAboutTrials(explainer)) continue;
      expect(explainer.reflects, `${explainer.id} claims trial evidence without naming it`)
        .toMatch(/PMID \d{5,8}/);
    }
  });

  it('Scenario: every PMID an explainer cites is in the source register', () => {
    const registered = registeredPmids();
    for (const explainer of EXPLAINERS) {
      for (const match of explainer.reflects.matchAll(/PMID (\d{5,8})/g)) {
        expect(registered.has(match[1]!), `${explainer.id} cites unregistered PMID ${match[1]}`)
          .toBe(true);
      }
    }
  });

  it('Scenario: the depth explainer names both awareness trials', () => {
    // B-Unaware and BAG-RECALL. Either alone understates the evidence, and
    // BAG-RECALL is the larger and the one in a high-risk population.
    const depth = getExplainer('depth-monitoring-and-its-limits');
    expect(depth.reflects).toContain('18337600');
    expect(depth.reflects).toContain('21848460');
    expect(requireSource('avidan-2008').usedFor).toContain('B-Unaware');
    expect(requireSource('avidan-2011').usedFor).toContain('BAG-RECALL');
  });
});
