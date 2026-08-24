/**
 * Which scenario teaches toward which framework domain, and how complete that
 * coverage is (platform/adoption → Curriculum Mapping To Recognized Frameworks).
 *
 * Mappings are data rather than prose so a program director can filter them and
 * export them for programme documentation. An unmapped scenario is reported AS
 * unmapped rather than omitted, because a coverage claim that quietly drops what
 * it cannot account for is not a coverage claim.
 */

import { SCENARIOS } from '../scenarios';
import type { Scenario } from '../scenarios/types';
import { FRAMEWORKS, type Framework, type FrameworkDomain } from './frameworks';

/** One scenario's claim on one framework domain. */
export interface ScenarioMapping {
  readonly scenarioId: string;
  readonly frameworkId: string;
  readonly domainId: string;
  /**
   * Which of the scenario's own objectives carry this domain. Naming them keeps
   * the mapping falsifiable: a reader can open the scenario and check.
   */
  readonly objectiveIds: readonly string[];
}

export const SCENARIO_MAPPINGS: readonly ScenarioMapping[] = [
  // --- Routine induction ---------------------------------------------------
  {
    scenarioId: 'routine-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['preoxygenate', 'hysteresis', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-sciences',
    objectiveIds: ['hysteresis', 'manage-hypotension', 'blunt-incision'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['ventilate-before-desaturation'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['hysteresis', 'blunt-incision'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'coa-standards',
    domainId: 'physiology-and-pathophysiology',
    objectiveIds: ['manage-hypotension', 'preoxygenate'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'coa-standards',
    domainId: 'anesthesia-equipment-and-monitoring',
    objectiveIds: ['ventilate-before-desaturation'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-pharmacologic-management',
    objectiveIds: ['hysteresis', 'blunt-incision'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: ['preoxygenate', 'manage-hypotension'],
  },
  {
    scenarioId: 'routine-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'mk-applied-foundational-science',
    objectiveIds: ['hysteresis', 'manage-hypotension'],
  },

  // --- Rapid desaturation --------------------------------------------------
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['preoxygenate', 'limit-attempts', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['preoxygenate', 'hysteresis'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: ['limit-attempts', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['limit-attempts'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['limit-attempts', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['limit-attempts', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'rapid-desaturation',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-preanesthetic-evaluation',
    objectiveIds: ['preoxygenate'],
  },

  // --- Hypotension after induction ----------------------------------------
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['dose-for-the-patient', 'read-the-mechanism', 'manage-hypotension'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-sciences',
    objectiveIds: ['read-the-mechanism'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'coa-standards',
    domainId: 'physiology-and-pathophysiology',
    objectiveIds: ['read-the-mechanism', 'manage-hypotension'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['read-the-mechanism', 'dose-for-the-patient'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['dose-for-the-patient'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: ['dose-for-the-patient', 'read-the-mechanism'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-monitoring-and-equipment',
    objectiveIds: ['read-the-mechanism'],
  },
  {
    scenarioId: 'hypotension-after-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'mk-applied-foundational-science',
    objectiveIds: ['read-the-mechanism'],
  },

  // --- Bronchospasm --------------------------------------------------------
  //
  // This scenario shipped unmapped. It was reported as unmapped, which is the
  // machinery working, but the educators page said every scenario was mapped —
  // so a programme director reading the coverage page saw three of four
  // scenarios under a claim that it was all of them.
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-sciences',
    objectiveIds: ['read-the-capnogram', 'ventilate-before-desaturation'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['read-the-capnogram'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: [
      'ventilate-before-desaturation', 'deepen-before-reaching-for-anything-else',
      'give-first-line-bronchodilator',
    ],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: [
      'deepen-before-reaching-for-anything-else', 'manage-hypotension',
      'give-first-line-bronchodilator',
    ],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'coa-standards',
    domainId: 'anesthesia-equipment-and-monitoring',
    objectiveIds: ['read-the-capnogram'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: [
      'ventilate-before-desaturation', 'deepen-before-reaching-for-anything-else',
      'give-first-line-bronchodilator',
    ],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'coa-standards',
    domainId: 'physiology-and-pathophysiology',
    objectiveIds: ['read-the-capnogram', 'manage-hypotension'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: [
      'deepen-before-reaching-for-anything-else', 'manage-hypotension',
      'escalate-bronchospasm',
    ],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: [
      'deepen-before-reaching-for-anything-else', 'manage-hypotension',
      'give-first-line-bronchodilator',
    ],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['ventilate-before-desaturation'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-monitoring-and-equipment',
    objectiveIds: ['read-the-capnogram'],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: [
      'deepen-before-reaching-for-anything-else', 'ventilate-before-desaturation',
      'escalate-bronchospasm', 'give-first-line-bronchodilator',
    ],
  },
  {
    scenarioId: 'bronchospasm',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'mk-applied-foundational-science',
    objectiveIds: ['read-the-capnogram'],
  },

  // --- Unexpected intraoperative hemorrhage ------------------------------
  {
    scenarioId: 'unexpected-intraoperative-hemorrhage',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['recognize-hemorrhage', 'temporize-volume-loss', 'manage-hypotension'],
  },
  {
    scenarioId: 'unexpected-intraoperative-hemorrhage',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['recognize-hemorrhage', 'avoid-full-dose-induction'],
  },
  {
    scenarioId: 'unexpected-intraoperative-hemorrhage',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['recognize-hemorrhage', 'temporize-volume-loss', 'manage-hypotension'],
  },

  // --- Rapid-sequence induction ------------------------------------------
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['preoxygenate-before-induction', 'protect-the-apnea-margin'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['wait-for-intubating-block', 'secure-and-confirm', 'reverse-observed-block'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['wait-for-intubating-block', 'secure-and-confirm'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: ['protect-the-apnea-margin', 'secure-and-confirm'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['wait-for-intubating-block', 'reverse-observed-block'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['preoxygenate-before-induction', 'wait-for-intubating-block'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-preanesthetic-evaluation',
    objectiveIds: ['preoxygenate-before-induction'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-pharmacologic-management',
    objectiveIds: ['wait-for-intubating-block', 'reverse-observed-block'],
  },
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['protect-the-apnea-margin', 'secure-and-confirm'],
  },

  // --- Awareness under paralysis -----------------------------------------
  {
    scenarioId: 'awareness-under-paralysis',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['inspect-the-tiva-line', 'restore-hypnotic-delivery', 'recognize-paralysis-risk'],
  },
  {
    scenarioId: 'awareness-under-paralysis',
    frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['inspect-the-tiva-line', 'restore-hypnotic-delivery'],
  },
  {
    scenarioId: 'awareness-under-paralysis',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-sciences',
    objectiveIds: ['hypnosis-before-paralysis', 'recognize-paralysis-risk'],
  },
  {
    scenarioId: 'awareness-under-paralysis',
    frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['hypnosis-before-paralysis', 'recognize-paralysis-risk'],
  },
  {
    scenarioId: 'awareness-under-paralysis',
    frameworkId: 'coa-standards',
    domainId: 'anesthesia-equipment-and-monitoring',
    objectiveIds: ['inspect-the-tiva-line', 'restore-hypnotic-delivery'],
  },
  {
    scenarioId: 'awareness-under-paralysis',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['inspect-the-tiva-line', 'restore-hypnotic-delivery'],
  },
  {
    scenarioId: 'awareness-under-paralysis',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-pharmacologic-management',
    objectiveIds: ['hypnosis-before-paralysis', 'recognize-paralysis-risk'],
  },
  {
    scenarioId: 'awareness-under-paralysis',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-monitoring-and-equipment',
    objectiveIds: ['inspect-the-tiva-line', 'recognize-paralysis-risk'],
  },
  {
    scenarioId: 'awareness-under-paralysis',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['inspect-the-tiva-line', 'restore-hypnotic-delivery'],
  },
  {
    scenarioId: 'awareness-under-paralysis',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'mk-applied-foundational-science',
    objectiveIds: ['recognize-paralysis-risk'],
  },

  // --- Laryngospasm after airway stimulation -----------------------------
  {
    scenarioId: 'laryngospasm-after-airway-stimulation',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['apply-initial-laryngospasm-measures', 'deepen-during-laryngospasm'],
  },
  {
    scenarioId: 'laryngospasm-after-airway-stimulation',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['preoxygenate-before-laryngospasm', 'protect-oxygenation-during-laryngospasm'],
  },
  {
    scenarioId: 'laryngospasm-after-airway-stimulation',
    frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['apply-initial-laryngospasm-measures'],
  },
  {
    scenarioId: 'laryngospasm-after-airway-stimulation',
    frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: ['apply-initial-laryngospasm-measures', 'protect-oxygenation-during-laryngospasm'],
  },
  {
    scenarioId: 'laryngospasm-after-airway-stimulation',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['deepen-during-laryngospasm', 'protect-oxygenation-during-laryngospasm'],
  },
  {
    scenarioId: 'laryngospasm-after-airway-stimulation',
    frameworkId: 'coa-standards',
    domainId: 'anesthesia-equipment-and-monitoring',
    objectiveIds: ['apply-initial-laryngospasm-measures'],
  },
  {
    scenarioId: 'laryngospasm-after-airway-stimulation',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['apply-initial-laryngospasm-measures', 'protect-oxygenation-during-laryngospasm'],
  },
  {
    scenarioId: 'laryngospasm-after-airway-stimulation',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-monitoring-and-equipment',
    objectiveIds: ['preoxygenate-before-laryngospasm', 'protect-oxygenation-during-laryngospasm'],
  },
  {
    scenarioId: 'laryngospasm-after-airway-stimulation',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['apply-initial-laryngospasm-measures', 'deepen-during-laryngospasm'],
  },
  {
    scenarioId: 'laryngospasm-after-airway-stimulation',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'mk-applied-foundational-science',
    objectiveIds: ['deepen-during-laryngospasm'],
  },
  {
    scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['recognize-anaphylaxis-pattern', 'give-initial-epinephrine', 'support-anaphylaxis-circulation'],
  },
  {
    scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'nbcrna-nce',
    domainId: 'basic-sciences',
    objectiveIds: ['recognize-anaphylaxis-pattern', 'support-anaphylaxis-circulation'],
  },
  {
    scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['support-anaphylaxis-oxygenation'],
  },
  {
    scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['give-initial-epinephrine'],
  },
  {
    scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'coa-standards',
    domainId: 'physiology-and-pathophysiology',
    objectiveIds: ['recognize-anaphylaxis-pattern', 'support-anaphylaxis-circulation'],
  },
  {
    scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['recognize-anaphylaxis-pattern', 'give-initial-epinephrine'],
  },
  {
    scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-pharmacologic-management',
    objectiveIds: ['give-initial-epinephrine', 'support-anaphylaxis-circulation'],
  },
  {
    scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-monitoring-and-equipment',
    objectiveIds: ['support-anaphylaxis-oxygenation'],
  },
  {
    scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['recognize-anaphylaxis-pattern', 'give-initial-epinephrine', 'support-anaphylaxis-circulation'],
  },
  {
    scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'mk-applied-foundational-science',
    objectiveIds: ['recognize-anaphylaxis-pattern', 'support-anaphylaxis-circulation'],
  },
  {
    scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['recognize-mh-hypermetabolism', 'give-initial-dantrolene', 'reassess-mh-response'],
  },
  {
    scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'nbcrna-nce',
    domainId: 'basic-sciences',
    objectiveIds: ['recognize-mh-hypermetabolism', 'reassess-mh-response'],
  },
  {
    scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['stop-trigger-and-hyperventilate'],
  },
  {
    scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['give-initial-dantrolene'],
  },
  {
    scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'coa-standards',
    domainId: 'physiology-and-pathophysiology',
    objectiveIds: ['recognize-mh-hypermetabolism', 'reassess-mh-response'],
  },
  {
    scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['recognize-mh-hypermetabolism', 'stop-trigger-and-hyperventilate', 'give-initial-dantrolene'],
  },
  {
    scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'coa-standards',
    domainId: 'anesthesia-equipment-and-monitoring',
    objectiveIds: ['stop-trigger-and-hyperventilate', 'reassess-mh-response'],
  },
  {
    scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-pharmacologic-management',
    objectiveIds: ['give-initial-dantrolene'],
  },
  {
    scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-monitoring-and-equipment',
    objectiveIds: ['recognize-mh-hypermetabolism', 'stop-trigger-and-hyperventilate', 'reassess-mh-response'],
  },
  {
    scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['recognize-mh-hypermetabolism', 'stop-trigger-and-hyperventilate', 'give-initial-dantrolene'],
  },
  {
    scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'mk-applied-foundational-science',
    objectiveIds: ['recognize-mh-hypermetabolism', 'reassess-mh-response'],
  },

  // --- Routine pediatric intravenous induction ----------------------------
  {
    scenarioId: 'routine-pediatric-iv-induction', frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['preoxygenate-child', 'dose-pediatric-propofol', 'ventilate-child-by-weight', 'avoid-pediatric-desaturation'],
  },
  {
    scenarioId: 'routine-pediatric-iv-induction', frameworkId: 'nbcrna-nce',
    domainId: 'basic-sciences',
    objectiveIds: ['dose-pediatric-propofol', 'ventilate-child-by-weight'],
  },
  {
    scenarioId: 'routine-pediatric-iv-induction', frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['dose-pediatric-propofol'],
  },
  {
    scenarioId: 'routine-pediatric-iv-induction', frameworkId: 'coa-standards',
    domainId: 'physiology-and-pathophysiology',
    objectiveIds: ['preoxygenate-child', 'ventilate-child-by-weight', 'avoid-pediatric-desaturation'],
  },
  {
    scenarioId: 'routine-pediatric-iv-induction', frameworkId: 'coa-standards',
    domainId: 'anesthesia-equipment-and-monitoring',
    objectiveIds: ['ventilate-child-by-weight', 'avoid-pediatric-desaturation'],
  },
  {
    scenarioId: 'routine-pediatric-iv-induction', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-pharmacologic-management',
    objectiveIds: ['dose-pediatric-propofol'],
  },
  {
    scenarioId: 'routine-pediatric-iv-induction', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: ['preoxygenate-child', 'dose-pediatric-propofol', 'ventilate-child-by-weight', 'avoid-pediatric-desaturation'],
  },
  {
    scenarioId: 'routine-pediatric-iv-induction', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'mk-applied-foundational-science',
    objectiveIds: ['dose-pediatric-propofol', 'ventilate-child-by-weight'],
  },

  // --- Difficult-airway supraglottic rescue --------------------------------
  {
    scenarioId: 'difficult-airway-supraglottic-rescue', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['limit-attempts-and-call-for-help', 'place-supraglottic-rescue', 'confirm-rescue-gas-exchange'],
  },
  {
    scenarioId: 'difficult-airway-supraglottic-rescue', frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['place-supraglottic-rescue', 'confirm-rescue-gas-exchange'],
  },
  {
    scenarioId: 'difficult-airway-supraglottic-rescue', frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: ['limit-attempts-and-call-for-help', 'place-supraglottic-rescue'],
  },
  {
    scenarioId: 'difficult-airway-supraglottic-rescue', frameworkId: 'coa-standards',
    domainId: 'anesthesia-equipment-and-monitoring',
    objectiveIds: ['confirm-rescue-gas-exchange'],
  },
  {
    scenarioId: 'difficult-airway-supraglottic-rescue', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['limit-attempts-and-call-for-help', 'place-supraglottic-rescue'],
  },
  {
    scenarioId: 'difficult-airway-supraglottic-rescue', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['limit-attempts-and-call-for-help', 'place-supraglottic-rescue'],
  },
  {
    scenarioId: 'difficult-airway-supraglottic-rescue', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-monitoring-and-equipment',
    objectiveIds: ['confirm-rescue-gas-exchange'],
  },
  {
    scenarioId: 'difficult-airway-supraglottic-rescue', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['limit-attempts-and-call-for-help', 'place-supraglottic-rescue', 'confirm-rescue-gas-exchange'],
  },

  // --- Known difficult airway: repeated laryngoscopy harm -------------------
  {
    scenarioId: 'repeated-laryngoscopy-harm', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['act-on-prior-airway-record', 'limit-attempts-and-call-for-help', 'place-supraglottic-rescue'],
  },
  {
    scenarioId: 'repeated-laryngoscopy-harm', frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['prepare-rescue-oxygen-reserve', 'place-supraglottic-rescue', 'confirm-rescue-gas-exchange'],
  },
  {
    scenarioId: 'repeated-laryngoscopy-harm', frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: ['act-on-prior-airway-record', 'limit-attempts-and-call-for-help', 'place-supraglottic-rescue'],
  },
  {
    scenarioId: 'repeated-laryngoscopy-harm', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['act-on-prior-airway-record', 'limit-attempts-and-call-for-help'],
  },
  {
    scenarioId: 'repeated-laryngoscopy-harm', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['act-on-prior-airway-record', 'limit-attempts-and-call-for-help', 'place-supraglottic-rescue'],
  },
  {
    scenarioId: 'repeated-laryngoscopy-harm', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['limit-attempts-and-call-for-help', 'place-supraglottic-rescue', 'confirm-rescue-gas-exchange'],
  },

  // --- Local-anesthetic systemic toxicity ----------------------------------
  {
    scenarioId: 'local-anesthetic-systemic-toxicity', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['recognize-last-pattern', 'support-last-airway-and-seizure', 'start-last-lipid', 'use-reduced-last-epinephrine'],
  },
  {
    scenarioId: 'local-anesthetic-systemic-toxicity', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['recognize-last-pattern', 'support-last-airway-and-seizure', 'start-last-lipid'],
  },
  {
    scenarioId: 'local-anesthetic-systemic-toxicity', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['recognize-last-pattern', 'support-last-airway-and-seizure', 'start-last-lipid', 'use-reduced-last-epinephrine'],
  },
  {
    scenarioId: 'persistent-vf-cardiac-arrest', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['resume-arrest-compressions', 'give-arrest-epinephrine', 'defibrillate-persistent-vf', 'avoid-shocking-nonshockable-rhythm'],
  },
  {
    scenarioId: 'persistent-vf-cardiac-arrest', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['resume-arrest-compressions', 'give-arrest-epinephrine', 'defibrillate-persistent-vf', 'avoid-shocking-nonshockable-rhythm'],
  },
  {
    scenarioId: 'persistent-vf-cardiac-arrest', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['resume-arrest-compressions', 'give-arrest-epinephrine', 'defibrillate-persistent-vf', 'avoid-shocking-nonshockable-rhythm'],
  },
  {
    scenarioId: 'high-spinal-after-epidural-top-up', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['call-for-high-spinal-help', 'support-high-spinal-breathing', 'support-high-spinal-circulation', 'protect-high-spinal-oxygenation'],
  },
  {
    scenarioId: 'high-spinal-after-epidural-top-up', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['call-for-high-spinal-help', 'support-high-spinal-breathing', 'support-high-spinal-circulation', 'protect-high-spinal-oxygenation'],
  },
  {
    scenarioId: 'high-spinal-after-epidural-top-up', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['call-for-high-spinal-help', 'support-high-spinal-breathing', 'support-high-spinal-circulation', 'protect-high-spinal-oxygenation'],
  },
  {
    scenarioId: 'venous-air-embolism-during-line-removal', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['escalate-venous-air-pattern', 'control-venous-air-entry', 'support-venous-air-oxygenation', 'reassess-venous-air-recovery'],
  },
  {
    scenarioId: 'venous-air-embolism-during-line-removal', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['escalate-venous-air-pattern', 'control-venous-air-entry', 'support-venous-air-oxygenation', 'reassess-venous-air-recovery'],
  },
  {
    scenarioId: 'venous-air-embolism-during-line-removal', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['escalate-venous-air-pattern', 'control-venous-air-entry', 'support-venous-air-oxygenation', 'reassess-venous-air-recovery'],
  },
];

export interface DomainCoverage {
  readonly domain: FrameworkDomain;
  readonly scenarios: readonly Scenario[];
}

/** Every domain in a framework, covered or not. Uncovered domains are kept. */
export function coverageFor(framework: Framework): DomainCoverage[] {
  return framework.domains.map((domain) => ({
    domain,
    scenarios: SCENARIOS.filter((scenario) => SCENARIO_MAPPINGS.some(
      (mapping) => mapping.frameworkId === framework.id
        && mapping.domainId === domain.id
        && mapping.scenarioId === scenario.metadata.id,
    )),
  }));
}

/** Scenarios with no mapping at all, reported rather than omitted. */
export function unmappedScenarios(): Scenario[] {
  return SCENARIOS.filter(
    (scenario) => !SCENARIO_MAPPINGS.some((mapping) => mapping.scenarioId === scenario.metadata.id),
  );
}

/** Mappings naming a scenario, framework or domain that does not exist. */
export function danglingMappings(): ScenarioMapping[] {
  return SCENARIO_MAPPINGS.filter((mapping) => {
    const framework = FRAMEWORKS.find((entry) => entry.id === mapping.frameworkId);
    const scenario = SCENARIOS.find((entry) => entry.metadata.id === mapping.scenarioId);
    if (!framework || !scenario) return true;
    if (!framework.domains.some((domain) => domain.id === mapping.domainId)) return true;
    const objectiveIds = new Set(scenario.metadata.objectives.map((objective) => objective.id));
    return mapping.objectiveIds.some((id) => !objectiveIds.has(id));
  });
}

/** One CSV cell, quoted so a comma or a quote inside it cannot break the row. */
function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * The mapping as CSV, for a programme's own documentation.
 *
 * The disclaimer is the first row rather than a footnote, because a spreadsheet
 * gets pasted into documents where the surrounding page does not travel with it.
 */
export function mappingCsv(): string {
  const rows: string[] = [
    cell(`NOTE: ${'Open Sim Lab curriculum mapping. '
      + 'These mappings are Open Sim Lab\'s own reading of published framework documents. '
      + 'No accrediting or certifying body has reviewed, endorsed or recognised them. '
      + 'Time spent in this simulator does not count toward any case requirement, clinical '
      + 'hour or supervised experience.'}`),
    [
      'framework', 'framework_body', 'framework_version', 'domain', 'domain_label',
      'scenario', 'scenario_title', 'difficulty', 'estimated_minutes', 'objectives',
    ].map(cell).join(','),
  ];

  for (const framework of FRAMEWORKS) {
    for (const { domain, scenarios } of coverageFor(framework)) {
      if (scenarios.length === 0) {
        rows.push([
          framework.id, framework.body, framework.version, domain.id, domain.label,
          '', 'NO SCENARIO COVERS THIS DOMAIN', '', '', '',
        ].map(cell).join(','));
        continue;
      }
      for (const scenario of scenarios) {
        const mapping = SCENARIO_MAPPINGS.find(
          (entry) => entry.frameworkId === framework.id
            && entry.domainId === domain.id
            && entry.scenarioId === scenario.metadata.id,
        );
        rows.push([
          framework.id, framework.body, framework.version, domain.id, domain.label,
          scenario.metadata.id, scenario.metadata.title, scenario.metadata.difficulty,
          String(scenario.metadata.estimatedMinutes),
          (mapping?.objectiveIds ?? []).join('; '),
        ].map(cell).join(','));
      }
    }
  }

  for (const scenario of unmappedScenarios()) {
    rows.push([
      '', '', '', '', 'UNMAPPED',
      scenario.metadata.id, scenario.metadata.title, scenario.metadata.difficulty,
      String(scenario.metadata.estimatedMinutes), '',
    ].map(cell).join(','));
  }

  return `${rows.join('\n')}\n`;
}
