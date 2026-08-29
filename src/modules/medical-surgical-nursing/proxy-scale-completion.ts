import type { Scenario } from '@anesthesia/scenarios/types';
import type { CompletionRequirementAudit } from '@platform/catalog/scenario-completion';
import { PROXY_SCALE_A_NUMBER_WITHOUT_A_STANDARD } from './scenarios/proxy-scale-a-number-without-a-standard';
import { PROXY_SCALE_FIXTURES } from './proxy-scale-fixtures';

export function proxyScaleCompletionEvidence(scenario: Scenario, capabilityVersion: string, moduleId: string): readonly CompletionRequirementAudit[] {
  if (moduleId !== 'medical-surgical-nursing' || capabilityVersion !== '0.1.0-alpha.48'
    || scenario.metadata.id !== PROXY_SCALE_FIXTURES.scenarioId || scenario.metadata.version !== '0.1.0'
    || PROXY_SCALE_FIXTURES.contentVersion !== '0.1.0' || PROXY_SCALE_FIXTURES.seed !== 6482
    || JSON.stringify(scenario) !== JSON.stringify(PROXY_SCALE_A_NUMBER_WITHOUT_A_STANDARD)) return [];
  return [
    { id: 'deterministic-seed-policy', status: 'satisfied', evidence: ['proxy-scale-fixtures.ts binds seed 6482 and content 0.1.0 to expert, incomplete-care, recovery, and no-action contrasts. No pain, analgesic, or physiological model is claimed; the behavioural items and their total are authored.'] },
    { id: 'meaningful-progression', status: 'satisfied', evidence: ['proxy-scale.ts runs two authored transitions. The daughter arrives for visiting at 20 minutes, making a proxy history obtainable where before there was nobody to ask. If bounded analgesic intent is recorded, the qualified team reviews 45 minutes later and records that the behavioural total is unchanged, that a total is not an intensity, and that the response to treatment is further evidence rather than confirmation. The observations stay unremarkable throughout, because a rising pulse would teach physiological confirmation, which the hierarchy places last.'] },
    { id: 'meaningful-actions-and-choices', status: 'satisfied', evidence: ['The learner attempts self-report first, records the observed behaviours with the total as their sum, states what the total is and is not in both directions, obtains the proxy history in the daughter\u2019s words, records bounded qualified-team analgesic intent with the reasoning stated, reviews the hierarchy, and schedules reassessment with the behaviours recorded alongside the total. Reading the total as an intensity, using pulse and blood pressure to confirm pain, reading a zero as comfortable, and waiting to be asked are each refused. Observing before attempting self-report and seeking a proxy before anyone is present are refused as out of order.'] },
    { id: 'bounded-stop-condition', status: 'satisfied', evidence: ['An attempted self-report, recorded behaviours, recorded limits, a proxy history, bounded analgesic intent, the boundary review, a reassessment schedule, and a current full assessment permit handoff with the intensity open. Instructor takeover bounds a run with no recorded intent at 150 minutes, or an unfinished session at eight hours.'] },
    { id: 'debrief-and-counterfactual', status: 'satisfied', evidence: ['Six event-bound objectives distinguish attempting self-report first, recognising that a total is not an intensity, stating what a low total cannot license, obtaining a proxy who knows the person, the hierarchy and its certainty, and handing the number over as what it is. Refused shortcuts remain visible, and no intensity, cause, or outcome is certified.'] },
    { id: 'reference-transcripts', status: 'satisfied', evidence: ['proxy-scale-fixtures.ts binds exact-content expert, common-error, recovery, and no-action pathways for deterministic replay through the shared engine.'] },
    { id: 'guidance-and-demonstration', status: 'missing', evidence: ['This slice ships no observed-state tutor prompt or worked example for this scenario version.'] },
    { id: 'inclusive-runtime-verification', status: 'missing', evidence: ['Local checks do not complete exact-version assistive-technology, keyboard, phone, zoom, reduced-motion, offline, and performance validation.'] },
    { id: 'report-control-coverage', status: 'missing', evidence: ['Shared report controls and local privacy tests do not establish full inclusive coverage or production Turnstile/D1 verification for this version.'] },
  ];
}
