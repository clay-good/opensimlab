/**
 * The nursing lessons mapped to the NCSBN Clinical Judgment Measurement Model
 * (framework-mapping-expansion → NCJMM mapping for nursing).
 *
 * The six step names are NCSBN's own short names, taken from the 2026 NCLEX-RN
 * Test Plan; every description below is this project's wording, because the
 * document's text is copyrighted. The mapping is this project's reading, not
 * NCSBN's, and NCSBN has not reviewed or endorsed it.
 *
 * Every nursing objective begins with one of six verbs, and each verb names the
 * kind of judgment the objective records. The mapping is made at that level and
 * stated as a convention, so it is falsifiable: open the lesson, read the
 * objective, and check the verb against the step.
 */
import type { FrameworkRecord } from '@platform/curriculum/framework-records';
import type { ScenarioMapping } from '@platform/curriculum/mapping';
import { NCSBN_NCLEX_CLIENT_NEEDS } from '@platform/curriculum/nclex-client-needs';
import type { Scenario } from '@anesthesia/scenarios/types';

export const NCSBN_NCJMM: FrameworkRecord = {
  id: 'ncsbn-ncjmm',
  name: 'Clinical Judgment Measurement Model, layer 3',
  shortLabel: 'NCJMM',
  body: 'National Council of State Boards of Nursing',
  version: 'As stated in the NCLEX-RN Test Plan effective April 2026',
  url: 'https://www.nclex.com/files/2026_RN_Test%20Plan_English-F.pdf',
  appliesTo: 'Prelicensure registered nursing students and the programs that prepare them',
  fidelity: 'verbatim',
  note: 'Step names as listed under "Clinical Judgment" in the 2026 NCLEX-RN Test Plan (PDF page 8). '
    + 'Descriptions are this project\'s summary. Mapping these lessons to the model is this project\'s '
    + 'reading; NCSBN has not reviewed or endorsed it, and it says nothing about examination readiness. '
    + 'Portions copyrighted by the National Council of State Boards of Nursing, Inc. All rights reserved.',
  recordedOn: '2026-10-19',
  reviewBy: '2028-10-19',
  domains: [
    { id: 'recognize-cues', label: 'Recognize cues', description: 'Pick out the information that matters from what is available.' },
    { id: 'analyze-cues', label: 'Analyze cues', description: 'Connect that information to what is happening to this patient.' },
    { id: 'prioritize-hypotheses', label: 'Prioritize hypotheses', description: 'Weigh competing explanations by urgency, likelihood, and risk.' },
    { id: 'generate-solutions', label: 'Generate solutions', description: 'Decide what outcome is wanted and what would reach it.' },
    { id: 'take-action', label: 'Take action', description: 'Carry out what addresses the highest priority.' },
    { id: 'evaluate-outcomes', label: 'Evaluate outcomes', description: 'Compare what happened with what was expected.' },
  ],
};

export type NcjmmStep = 'recognize-cues' | 'analyze-cues' | 'prioritize-hypotheses'
  | 'generate-solutions' | 'take-action' | 'evaluate-outcomes';

/** The convention: an objective's leading verb names the judgment it records. */
export const NCJMM_BY_VERB: Readonly<Record<string, readonly NcjmmStep[]>> = {
  reconcile: ['recognize-cues'],
  recognize: ['analyze-cues'],
  record: ['analyze-cues'],
  review: ['prioritize-hypotheses'],
  activate: ['generate-solutions', 'take-action'],
  handoff: ['take-action'],
};

/**
 * Why a step is not exercised, stated rather than left as a gap. These lessons
 * end before any outcome exists, by design: each stops at the decision.
 */
export const NCJMM_NOT_EXERCISED_REASON: Readonly<Partial<Record<NcjmmStep, string>>> = {
  'evaluate-outcomes': 'No nursing lesson runs long enough to compare an outcome with an expectation; '
    + 'each ends at the decision, and none predicts what happens next.',
};

export interface NcjmmMapping {
  readonly scenarioId: string;
  readonly objectiveId: string;
  readonly steps: readonly NcjmmStep[];
  /** What the debrief records for this objective: the evidence the mapping rests on. */
  readonly evidence: string;
}

/** Every nursing objective's mapping, or an error naming an objective the convention cannot place. */
export function ncjmmMappings(scenarios: readonly Scenario[]): NcjmmMapping[] {
  return scenarios.flatMap((scenario) => scenario.metadata.objectives.map((objective) => {
    const verb = objective.id.split('-')[0] ?? '';
    const steps = NCJMM_BY_VERB[verb];
    if (steps === undefined) throw new Error(`${scenario.metadata.id}:${objective.id} begins with "${verb}", which the NCJMM convention does not place`);
    return { scenarioId: scenario.metadata.id, objectiveId: objective.id, steps, evidence: objective.measure };
  }));
}

export type NcjmmCoverageStatus = 'evidenced' | 'exercised' | 'not-exercised';

export interface NcjmmCoverage {
  readonly step: NcjmmStep;
  readonly label: string;
  readonly status: NcjmmCoverageStatus;
  /** Why it was not exercised: the learner's run, or a step no lesson reaches. */
  readonly note: string;
}

/**
 * This session's evidence for each step, from its own objective outcomes.
 * Evidenced: an objective carrying the step was met. Exercised: one was
 * attempted but not met. Not exercised: nothing carrying it happened. There is
 * deliberately no total, ratio, or rank across the six.
 */
export function ncjmmCoverage(
  scenario: Scenario,
  findings: readonly { readonly objectiveId: string; readonly outcome: string }[],
): NcjmmCoverage[] {
  const outcome = new Map(findings.map((finding) => [finding.objectiveId, finding.outcome]));
  const mappings = ncjmmMappings([scenario]);
  return NCSBN_NCJMM.domains.map((domain) => {
    const step = domain.id as NcjmmStep;
    const outcomes = mappings.filter((mapping) => mapping.steps.includes(step))
      .map((mapping) => outcome.get(mapping.objectiveId) ?? 'not-exercised');
    const status: NcjmmCoverageStatus = outcomes.includes('met') ? 'evidenced'
      : outcomes.some((value) => value === 'partly-met' || value === 'not-met') ? 'exercised'
        : 'not-exercised';
    const note = outcomes.length === 0
      ? NCJMM_NOT_EXERCISED_REASON[step] ?? 'This lesson has no objective for this step.'
      : status === 'not-exercised' ? 'The objectives for this step were not reached in this run.' : '';
    return { step, label: domain.label, status, note };
  });
}

/**
 * The same test plan's other half: the Client Needs categories every item on
 * the examination is assigned to (framework-mapping-expansion → scenario
 * mappings).
 *
 * The clinical judgment mapping above is DERIVED from each objective's leading
 * verb. This one is authored, because a lesson's Client Needs category is
 * about its SUBJECT and no verb can tell you that: a deterioration score and a
 * delirium screen are the same six verbs and different categories.
 *
 * The convention, stated so it can be checked:
 *
 * - An objective that escalates, records or hands on → Management of Care.
 *   That is what those three do in this module: they decide who owns a
 *   decision, what is written down and what travels to the next shift.
 * - An objective that reads the evidence - reconcile, recognise, review the
 *   boundaries - takes the lesson's own subject category: the deterioration
 *   score and the counted rate are Reduction of Risk Potential, the delirium
 *   screen is Psychosocial Integrity, the pain scale is Basic Care and
 *   Comfort, the stroke clock and the oxygen target are Physiological
 *   Adaptation.
 *
 * Three of the eight are covered by nothing, and the reasons are below. The
 * one worth naming: no lesson in this module gives a medicine, so
 * Pharmacological and Parenteral Therapies - the largest single subcategory on
 * the examination - is untouched here. A student reading the coverage should
 * see that first.
 */
export const NCLEX_CLIENT_NEEDS_UNCOVERED: Readonly<Record<string, string>> = {
  'safety-and-infection-prevention-and-control': 'No lesson here turns on the environment, the equipment or an organism.',
  'health-promotion-and-maintenance': 'Every lesson is one shift; none is about prevention or health over time.',
  'pharmacological-and-parenteral-therapies': 'No lesson in this module gives a medicine or runs an infusion. This is the largest single subcategory on the examination and nothing here touches it.',
};

const FRAMEWORK_ID = NCSBN_NCLEX_CLIENT_NEEDS.id;

export const NCLEX_CLIENT_NEEDS_MAPPINGS: readonly ScenarioMapping[] = [
  // --- low-score-what-the-threshold-does-not-exclude ---
  { scenarioId: 'low-score-what-the-threshold-does-not-exclude', frameworkId: FRAMEWORK_ID, domainId: 'reduction-of-risk-potential', objectiveIds: ['reconcile-medical-surgical-nursing-low-score-observations-that-are-correct', 'recognize-medical-surgical-nursing-low-score-a-screen-is-not-a-rule-out', 'review-medical-surgical-nursing-low-score-boundaries-and-their-certainty'] },
  { scenarioId: 'low-score-what-the-threshold-does-not-exclude', frameworkId: FRAMEWORK_ID, domainId: 'management-of-care', objectiveIds: ['activate-medical-surgical-nursing-low-score-escalate-on-concern-not-threshold', 'record-medical-surgical-nursing-low-score-a-family-report-as-evidence', 'handoff-medical-surgical-nursing-low-score-a-concern-that-outlived-the-shift'] },
  // --- counted-rate-a-number-nobody-counted ---
  { scenarioId: 'counted-rate-a-number-nobody-counted', frameworkId: FRAMEWORK_ID, domainId: 'reduction-of-risk-potential', objectiveIds: ['reconcile-medical-surgical-nursing-counted-rate-a-trend-read-as-a-distribution', 'recognize-medical-surgical-nursing-counted-rate-the-measurement-is-the-finding', 'review-medical-surgical-nursing-counted-rate-boundaries-and-their-certainty'] },
  { scenarioId: 'counted-rate-a-number-nobody-counted', frameworkId: FRAMEWORK_ID, domainId: 'management-of-care', objectiveIds: ['record-medical-surgical-nursing-counted-rate-a-discrepancy-left-unreconciled', 'activate-medical-surgical-nursing-counted-rate-escalation-on-the-counted-value', 'handoff-medical-surgical-nursing-counted-rate-a-record-that-disagrees-with-itself'] },
  // --- paired-reading-a-number-wrong-in-one-direction ---
  { scenarioId: 'paired-reading-a-number-wrong-in-one-direction', frameworkId: FRAMEWORK_ID, domainId: 'reduction-of-risk-potential', objectiveIds: ['reconcile-medical-surgical-nursing-paired-reading-a-reading-recorded-as-a-reading', 'recognize-medical-surgical-nursing-paired-reading-error-with-a-direction', 'review-medical-surgical-nursing-paired-reading-boundaries-and-their-certainty'] },
  { scenarioId: 'paired-reading-a-number-wrong-in-one-direction', frameworkId: FRAMEWORK_ID, domainId: 'physiological-adaptation', objectiveIds: ['reconcile-medical-surgical-nursing-paired-reading-a-reading-recorded-as-a-reading', 'recognize-medical-surgical-nursing-paired-reading-error-with-a-direction', 'review-medical-surgical-nursing-paired-reading-boundaries-and-their-certainty'] },
  { scenarioId: 'paired-reading-a-number-wrong-in-one-direction', frameworkId: FRAMEWORK_ID, domainId: 'management-of-care', objectiveIds: ['record-medical-surgical-nursing-paired-reading-what-the-gap-is-not', 'activate-medical-surgical-nursing-paired-reading-escalation-on-the-arterial-value', 'handoff-medical-surgical-nursing-paired-reading-a-chart-that-reads-reassuringly'] },
  // --- afferent-limb-a-threshold-met-and-a-call-not-made ---
  { scenarioId: 'afferent-limb-a-threshold-met-and-a-call-not-made', frameworkId: FRAMEWORK_ID, domainId: 'reduction-of-risk-potential', objectiveIds: ['reconcile-medical-surgical-nursing-afferent-limb-criteria-already-met', 'recognize-medical-surgical-nursing-afferent-limb-obstacles-that-are-not-clinical', 'review-medical-surgical-nursing-afferent-limb-boundaries-and-their-certainty'] },
  { scenarioId: 'afferent-limb-a-threshold-met-and-a-call-not-made', frameworkId: FRAMEWORK_ID, domainId: 'management-of-care', objectiveIds: ['activate-medical-surgical-nursing-afferent-limb-a-call-on-the-threshold', 'record-medical-surgical-nursing-afferent-limb-a-concern-stated-to-a-person', 'handoff-medical-surgical-nursing-afferent-limb-a-call-made-on-a-threshold'] },
  // --- quiet-patient-a-screen-that-was-never-done ---
  { scenarioId: 'quiet-patient-a-screen-that-was-never-done', frameworkId: FRAMEWORK_ID, domainId: 'psychosocial-integrity', objectiveIds: ['reconcile-medical-surgical-nursing-quiet-patient-impressions-are-not-results', 'recognize-medical-surgical-nursing-quiet-patient-the-screen-is-what-changed', 'review-medical-surgical-nursing-quiet-patient-boundaries-and-their-certainty'] },
  { scenarioId: 'quiet-patient-a-screen-that-was-never-done', frameworkId: FRAMEWORK_ID, domainId: 'management-of-care', objectiveIds: ['record-medical-surgical-nursing-quiet-patient-a-result-recorded-as-a-result', 'activate-medical-surgical-nursing-quiet-patient-escalation-on-a-positive-screen', 'handoff-medical-surgical-nursing-quiet-patient-a-record-with-a-specific-gap'] },
  // --- proxy-scale-a-number-without-a-standard ---
  { scenarioId: 'proxy-scale-a-number-without-a-standard', frameworkId: FRAMEWORK_ID, domainId: 'basic-care-and-comfort', objectiveIds: ['reconcile-medical-surgical-nursing-proxy-scale-an-attempt-that-came-first', 'recognize-medical-surgical-nursing-proxy-scale-a-total-is-not-an-intensity', 'review-medical-surgical-nursing-proxy-scale-boundaries-and-their-certainty'] },
  { scenarioId: 'proxy-scale-a-number-without-a-standard', frameworkId: FRAMEWORK_ID, domainId: 'management-of-care', objectiveIds: ['record-medical-surgical-nursing-proxy-scale-what-a-low-total-cannot-license', 'activate-medical-surgical-nursing-proxy-scale-a-proxy-who-knows-the-person', 'handoff-medical-surgical-nursing-proxy-scale-a-number-handed-over-as-what-it-is'] },
  // --- last-known-well-a-time-nobody-can-supply ---
  { scenarioId: 'last-known-well-a-time-nobody-can-supply', frameworkId: FRAMEWORK_ID, domainId: 'physiological-adaptation', objectiveIds: ['reconcile-medical-surgical-nursing-last-known-well-a-bound-and-not-an-onset', 'recognize-medical-surgical-nursing-last-known-well-an-uncertain-account-kept-uncertain', 'review-medical-surgical-nursing-last-known-well-boundaries-and-their-certainty'] },
  { scenarioId: 'last-known-well-a-time-nobody-can-supply', frameworkId: FRAMEWORK_ID, domainId: 'management-of-care', objectiveIds: ['activate-medical-surgical-nursing-last-known-well-on-the-deficit-not-the-clock', 'record-medical-surgical-nursing-last-known-well-what-the-unknown-changes', 'handoff-medical-surgical-nursing-last-known-well-an-empty-field-handed-over-empty'] },
  // --- oxygen-target-scale-a-score-that-should-be-lower ---
  { scenarioId: 'oxygen-target-scale-a-score-that-should-be-lower', frameworkId: FRAMEWORK_ID, domainId: 'physiological-adaptation', objectiveIds: ['reconcile-medical-surgical-nursing-oxygen-target-scale-two-documents-before-one-verdict', 'recognize-medical-surgical-nursing-oxygen-target-scale-a-number-compared-with-the-wrong-range', 'review-medical-surgical-nursing-oxygen-target-scale-boundaries-and-their-certainty'] },
  { scenarioId: 'oxygen-target-scale-a-score-that-should-be-lower', frameworkId: FRAMEWORK_ID, domainId: 'reduction-of-risk-potential', objectiveIds: ['reconcile-medical-surgical-nursing-oxygen-target-scale-two-documents-before-one-verdict', 'recognize-medical-surgical-nursing-oxygen-target-scale-a-number-compared-with-the-wrong-range', 'review-medical-surgical-nursing-oxygen-target-scale-boundaries-and-their-certainty'] },
  { scenarioId: 'oxygen-target-scale-a-score-that-should-be-lower', frameworkId: FRAMEWORK_ID, domainId: 'management-of-care', objectiveIds: ['record-medical-surgical-nursing-oxygen-target-scale-what-a-corrected-score-does-not-supply', 'activate-medical-surgical-nursing-oxygen-target-scale-a-decision-that-is-not-the-wards-to-make', 'handoff-medical-surgical-nursing-oxygen-target-scale-a-corrected-score-handed-over-as-corrected'] },
  // --- lost-contingency-a-plan-that-was-not-said ---
  { scenarioId: 'lost-contingency-a-plan-that-was-not-said', frameworkId: FRAMEWORK_ID, domainId: 'management-of-care', objectiveIds: ['reconcile-medical-surgical-nursing-lost-contingency-what-was-said-against-what-is-written', 'recognize-medical-surgical-nursing-lost-contingency-a-gap-the-handover-created', 'record-medical-surgical-nursing-lost-contingency-reconstructed-not-authored', 'activate-medical-surgical-nursing-lost-contingency-a-plan-returned-to-its-owner', 'review-medical-surgical-nursing-lost-contingency-boundaries-and-their-certainty', 'handoff-medical-surgical-nursing-lost-contingency-said-out-loud-before-it-is-needed'] },
];
