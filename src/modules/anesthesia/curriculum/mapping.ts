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

  // --- Blood-bank handoff -------------------------------------------------
  {
    scenarioId: 'blood-bank-handoff', frameworkId: 'nbcrna-nce', domainId: 'advanced-principles',
    objectiveIds: [
      'request-blood-bank-release', 'use-released-red-cells', 'reassess-red-cell-response',
    ],
  },
  {
    scenarioId: 'blood-bank-handoff', frameworkId: 'coa-standards', domainId: 'clinical-decision-making',
    objectiveIds: [
      'request-blood-bank-release', 'use-released-red-cells', 'reassess-red-cell-response',
    ],
  },
  {
    scenarioId: 'blood-bank-handoff',
    frameworkId: 'acgme-anesthesiology-milestones-2', domainId: 'pc-crisis-management',
    objectiveIds: [
      'request-blood-bank-release', 'use-released-red-cells', 'reassess-red-cell-response',
    ],
  },

  // --- Dilutional coagulopathy -------------------------------------------
  {
    scenarioId: 'dilutional-coagulopathy',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: [
      'identify-dilutional-coagulopathy', 'give-lab-guided-plasma',
      'reassess-coagulation-response',
    ],
  },
  {
    scenarioId: 'dilutional-coagulopathy',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: [
      'identify-dilutional-coagulopathy', 'give-lab-guided-plasma',
      'reassess-coagulation-response',
    ],
  },
  {
    scenarioId: 'dilutional-coagulopathy',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: [
      'identify-dilutional-coagulopathy', 'give-lab-guided-plasma',
      'reassess-coagulation-response',
    ],
  },

  // --- Rapid-sequence induction ------------------------------------------
  {
    scenarioId: 'rapid-sequence-induction',
    frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['preoxygenate-before-induction', 'protect-the-apnea-margin'],
  },

  // --- Capnography sampling-line obstruction -----------------------------
  {
    scenarioId: 'capnography-sampling-line-obstruction',
    frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['cross-check-capnography-loss', 'preserve-stable-ventilation', 'restore-capnography-sampling'],
  },

  // --- Arterial-pressure transducer artifact -----------------------------
  {
    scenarioId: 'arterial-pressure-transducer-artifact',
    frameworkId: 'nbcrna-nce', domainId: 'equipment-instrumentation-technology',
    objectiveIds: [
      'verify-invasive-pressure-independently', 'correct-transducer-level',
      'assess-arterial-dynamic-response',
    ],
  },

  // --- Circle-system rebreathing ----------------------------------------
  {
    scenarioId: 'circle-system-rebreathing',
    frameworkId: 'nbcrna-nce', domainId: 'equipment-instrumentation-technology',
    objectiveIds: [
      'recognize-inspired-carbon-dioxide', 'bridge-with-fresh-gas-flow',
      'replace-exhausted-absorbent',
    ],
  },
  {
    scenarioId: 'circle-system-rebreathing',
    frameworkId: 'coa-standards', domainId: 'clinical-decision-making',
    objectiveIds: [
      'recognize-inspired-carbon-dioxide', 'bridge-with-fresh-gas-flow',
      'replace-exhausted-absorbent',
    ],
  },
  {
    scenarioId: 'circle-system-rebreathing',
    frameworkId: 'acgme-anesthesiology-milestones-2', domainId: 'pc-crisis-management',
    objectiveIds: [
      'recognize-inspired-carbon-dioxide', 'bridge-with-fresh-gas-flow',
      'replace-exhausted-absorbent',
    ],
  },

  // --- Routine inhalational maintenance ----------------------------------
  {
    scenarioId: 'routine-inhalational-maintenance',
    frameworkId: 'nbcrna-nce', domainId: 'basic-principles',
    objectiveIds: [
      'maintain-bounded-depth', 'anticipate-surgical-stimulus',
      'reassess-when-stimulus-falls',
    ],
  },
  {
    scenarioId: 'routine-inhalational-maintenance',
    frameworkId: 'coa-standards', domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: [
      'maintain-bounded-depth', 'anticipate-surgical-stimulus',
      'reassess-when-stimulus-falls',
    ],
  },
  {
    scenarioId: 'routine-inhalational-maintenance',
    frameworkId: 'coa-standards', domainId: 'clinical-decision-making',
    objectiveIds: ['anticipate-surgical-stimulus', 'reassess-when-stimulus-falls'],
  },

  // --- Routine geriatric intravenous induction ---------------------------
  {
    scenarioId: 'routine-geriatric-induction',
    frameworkId: 'nbcrna-nce', domainId: 'basic-principles',
    objectiveIds: [
      'preoxygenate-older-adult', 'titrate-geriatric-propofol',
      'protect-geriatric-perfusion', 'ventilate-geriatric-induction',
    ],
  },
  {
    scenarioId: 'routine-geriatric-induction',
    frameworkId: 'coa-standards', domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['titrate-geriatric-propofol', 'protect-geriatric-perfusion'],
  },

  // --- Quantitative neuromuscular reversal --------------------------------
  {
    scenarioId: 'quantitative-neuromuscular-reversal',
    frameworkId: 'nbcrna-nce', domainId: 'basic-principles',
    objectiveIds: [
      'establish-quantitative-baseline', 'reverse-recovering-block',
      'confirm-quantitative-recovery', 'maintain-anesthesia-during-block',
    ],
  },
  {
    scenarioId: 'quantitative-neuromuscular-reversal',
    frameworkId: 'coa-standards', domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: [
      'establish-quantitative-baseline', 'reverse-recovering-block',
      'confirm-quantitative-recovery',
    ],
  },
  {
    scenarioId: 'quantitative-neuromuscular-reversal',
    frameworkId: 'coa-standards', domainId: 'clinical-decision-making',
    objectiveIds: [
      'reverse-recovering-block', 'confirm-quantitative-recovery',
      'maintain-anesthesia-during-block',
    ],
  },
  {
    scenarioId: 'quantitative-neuromuscular-reversal',
    frameworkId: 'acgme-anesthesiology-milestones-2', domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: [
      'establish-quantitative-baseline', 'reverse-recovering-block',
      'confirm-quantitative-recovery', 'maintain-anesthesia-during-block',
    ],
  },
  {
    scenarioId: 'quantitative-neuromuscular-reversal',
    frameworkId: 'acgme-anesthesiology-milestones-2', domainId: 'pc-pharmacologic-management',
    objectiveIds: ['reverse-recovering-block', 'confirm-quantitative-recovery'],
  },

  // --- Emergence with residual neuromuscular blockade ----------------------
  {
    scenarioId: 'emergence-with-residual-blockade',
    frameworkId: 'nbcrna-nce', domainId: 'basic-principles',
    objectiveIds: [
      'review-emergence-quantitative-monitor', 'recognize-emergence-residual-blockade',
      'defer-extubation-during-residual-blockade', 'separate-recovery-from-extubation-readiness',
    ],
  },
  {
    scenarioId: 'emergence-with-residual-blockade',
    frameworkId: 'coa-standards', domainId: 'clinical-decision-making',
    objectiveIds: [
      'review-emergence-quantitative-monitor', 'recognize-emergence-residual-blockade',
      'defer-extubation-during-residual-blockade', 'separate-recovery-from-extubation-readiness',
    ],
  },
  {
    scenarioId: 'emergence-with-residual-blockade',
    frameworkId: 'acgme-anesthesiology-milestones-2', domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: [
      'review-emergence-quantitative-monitor', 'recognize-emergence-residual-blockade',
      'defer-extubation-during-residual-blockade', 'separate-recovery-from-extubation-readiness',
    ],
  },
  {
    scenarioId: 'routine-geriatric-induction',
    frameworkId: 'coa-standards', domainId: 'clinical-decision-making',
    objectiveIds: [
      'preoxygenate-older-adult', 'titrate-geriatric-propofol',
      'protect-geriatric-perfusion', 'ventilate-geriatric-induction',
    ],
  },
  {
    scenarioId: 'routine-geriatric-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2', domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: [
      'preoxygenate-older-adult', 'titrate-geriatric-propofol',
      'protect-geriatric-perfusion', 'ventilate-geriatric-induction',
    ],
  },
  {
    scenarioId: 'routine-geriatric-induction',
    frameworkId: 'acgme-anesthesiology-milestones-2', domainId: 'pc-pharmacologic-management',
    objectiveIds: ['titrate-geriatric-propofol', 'protect-geriatric-perfusion'],
  },
  {
    scenarioId: 'routine-inhalational-maintenance',
    frameworkId: 'acgme-anesthesiology-milestones-2', domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: [
      'maintain-bounded-depth', 'anticipate-surgical-stimulus',
      'reassess-when-stimulus-falls',
    ],
  },
  {
    scenarioId: 'routine-inhalational-maintenance',
    frameworkId: 'acgme-anesthesiology-milestones-2', domainId: 'pc-pharmacologic-management',
    objectiveIds: ['anticipate-surgical-stimulus', 'reassess-when-stimulus-falls'],
  },
  {
    scenarioId: 'arterial-pressure-transducer-artifact',
    frameworkId: 'coa-standards', domainId: 'clinical-decision-making',
    objectiveIds: [
      'verify-invasive-pressure-independently', 'correct-transducer-level',
      'assess-arterial-dynamic-response',
    ],
  },
  {
    scenarioId: 'arterial-pressure-transducer-artifact',
    frameworkId: 'acgme-anesthesiology-milestones-2', domainId: 'pc-crisis-management',
    objectiveIds: [
      'verify-invasive-pressure-independently', 'correct-transducer-level',
      'assess-arterial-dynamic-response',
    ],
  },
  {
    scenarioId: 'capnography-sampling-line-obstruction',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['cross-check-capnography-loss', 'preserve-stable-ventilation', 'restore-capnography-sampling'],
  },
  {
    scenarioId: 'capnography-sampling-line-obstruction',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['cross-check-capnography-loss', 'preserve-stable-ventilation', 'restore-capnography-sampling'],
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

  // --- Obstetric general anesthesia -----------------------------------
  {
    scenarioId: 'obstetric-general-anesthesia',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['prepare-obstetric-oxygen-reserve', 'wait-for-intubating-block', 'protect-obstetric-apnea-margin'],
  },
  {
    scenarioId: 'obstetric-general-anesthesia',
    frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['prepare-obstetric-oxygen-reserve', 'confirm-obstetric-ventilation'],
  },
  {
    scenarioId: 'obstetric-general-anesthesia',
    frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: ['protect-obstetric-apnea-margin', 'confirm-obstetric-ventilation'],
  },
  {
    scenarioId: 'obstetric-general-anesthesia',
    frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['prepare-obstetric-oxygen-reserve', 'wait-for-intubating-block'],
  },
  {
    scenarioId: 'obstetric-general-anesthesia',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-preanesthetic-evaluation',
    objectiveIds: ['prepare-obstetric-oxygen-reserve'],
  },
  {
    scenarioId: 'obstetric-general-anesthesia',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['wait-for-intubating-block', 'protect-obstetric-apnea-margin', 'confirm-obstetric-ventilation'],
  },
  {
    scenarioId: 'preeclampsia-urgent-delivery',
    frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: [
      'confirm-persistent-severe-hypertension', 'treat-severe-pregnancy-hypertension',
      'start-preeclampsia-seizure-prophylaxis', 'reassess-preeclampsia-response',
    ],
  },
  {
    scenarioId: 'preeclampsia-urgent-delivery',
    frameworkId: 'coa-standards',
    domainId: 'physiology-and-pathophysiology',
    objectiveIds: ['confirm-persistent-severe-hypertension', 'reassess-preeclampsia-response'],
  },
  {
    scenarioId: 'preeclampsia-urgent-delivery',
    frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['treat-severe-pregnancy-hypertension', 'start-preeclampsia-seizure-prophylaxis'],
  },
  {
    scenarioId: 'preeclampsia-urgent-delivery',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-pharmacologic-management',
    objectiveIds: [
      'treat-severe-pregnancy-hypertension', 'start-preeclampsia-seizure-prophylaxis',
      'reassess-preeclampsia-response',
    ],
  },
  {
    scenarioId: 'preeclampsia-urgent-delivery',
    frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-preanesthetic-evaluation',
    objectiveIds: ['confirm-persistent-severe-hypertension'],
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

  // --- Routine pediatric inhalational induction --------------------------
  {
    scenarioId: 'routine-pediatric-inhalational-induction', frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['prepare-pediatric-inhalational-circuit', 'follow-pediatric-end-tidal-wash-in', 'settle-pediatric-volatile-depth'],
  },
  {
    scenarioId: 'routine-pediatric-inhalational-induction', frameworkId: 'nbcrna-nce',
    domainId: 'equipment-instrumentation-technology',
    objectiveIds: ['prepare-pediatric-inhalational-circuit', 'follow-pediatric-end-tidal-wash-in'],
  },
  {
    scenarioId: 'routine-pediatric-inhalational-induction', frameworkId: 'coa-standards',
    domainId: 'pharmacology-of-anesthetic-agents',
    objectiveIds: ['follow-pediatric-end-tidal-wash-in', 'settle-pediatric-volatile-depth'],
  },
  {
    scenarioId: 'routine-pediatric-inhalational-induction', frameworkId: 'coa-standards',
    domainId: 'anesthesia-equipment-and-monitoring',
    objectiveIds: ['prepare-pediatric-inhalational-circuit', 'follow-pediatric-end-tidal-wash-in', 'settle-pediatric-volatile-depth'],
  },
  {
    scenarioId: 'routine-pediatric-inhalational-induction', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: ['prepare-pediatric-inhalational-circuit', 'follow-pediatric-end-tidal-wash-in', 'settle-pediatric-volatile-depth'],
  },
  {
    scenarioId: 'routine-pediatric-inhalational-induction', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-monitoring-and-equipment',
    objectiveIds: ['prepare-pediatric-inhalational-circuit', 'follow-pediatric-end-tidal-wash-in', 'settle-pediatric-volatile-depth'],
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
  {
    scenarioId: 'pneumothorax-under-positive-pressure', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['assess-pneumothorax-pattern', 'escalate-pneumothorax-pattern', 'support-pneumothorax-oxygenation', 'decompress-pneumothorax', 'reassess-pneumothorax-recovery'],
  },
  {
    scenarioId: 'pneumothorax-under-positive-pressure', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['assess-pneumothorax-pattern', 'escalate-pneumothorax-pattern', 'support-pneumothorax-oxygenation', 'decompress-pneumothorax', 'reassess-pneumothorax-recovery'],
  },
  {
    scenarioId: 'pneumothorax-under-positive-pressure', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['assess-pneumothorax-pattern', 'escalate-pneumothorax-pattern', 'support-pneumothorax-oxygenation', 'decompress-pneumothorax', 'reassess-pneumothorax-recovery'],
  },
  {
    scenarioId: 'aspiration-risk-recognition', frameworkId: 'nbcrna-nce',
    domainId: 'basic-principles',
    objectiveIds: ['review-aspiration-risk-cues', 'classify-elevated-aspiration-risk', 'choose-shared-elective-plan', 'avoid-blanket-glp1-rule'],
  },
  {
    scenarioId: 'aspiration-risk-recognition', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['review-aspiration-risk-cues', 'classify-elevated-aspiration-risk', 'choose-shared-elective-plan', 'avoid-blanket-glp1-rule'],
  },
  {
    scenarioId: 'aspiration-risk-recognition', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-preanesthetic-evaluation',
    objectiveIds: ['review-aspiration-risk-cues', 'classify-elevated-aspiration-risk', 'choose-shared-elective-plan', 'avoid-blanket-glp1-rule'],
  },
  {
    scenarioId: 'delayed-emergence-differential', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['support-delayed-emergence-patient', 'reconcile-delayed-emergence-exposures', 'check-delayed-emergence-metabolic-causes', 'find-delayed-emergence-lateralizing-sign', 'escalate-delayed-emergence-neurologic-pattern'],
  },
  {
    scenarioId: 'delayed-emergence-differential', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['support-delayed-emergence-patient', 'reconcile-delayed-emergence-exposures', 'check-delayed-emergence-metabolic-causes', 'find-delayed-emergence-lateralizing-sign', 'escalate-delayed-emergence-neurologic-pattern'],
  },
  {
    scenarioId: 'delayed-emergence-differential', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['support-delayed-emergence-patient', 'reconcile-delayed-emergence-exposures', 'check-delayed-emergence-metabolic-causes', 'find-delayed-emergence-lateralizing-sign', 'escalate-delayed-emergence-neurologic-pattern'],
  },
  {
    scenarioId: 'extubation-readiness', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['confirm-extubation-quantitative-recovery', 'assess-awake-airway-protection', 'assess-extubation-gas-exchange', 'plan-extubation-risk-and-rescue', 'integrate-awake-extubation-readiness'],
  },
  {
    scenarioId: 'extubation-readiness', frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: ['confirm-extubation-quantitative-recovery', 'assess-awake-airway-protection', 'assess-extubation-gas-exchange', 'plan-extubation-risk-and-rescue', 'integrate-awake-extubation-readiness'],
  },
  {
    scenarioId: 'extubation-readiness', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['confirm-extubation-quantitative-recovery', 'assess-awake-airway-protection', 'assess-extubation-gas-exchange', 'plan-extubation-risk-and-rescue', 'integrate-awake-extubation-readiness'],
  },
  {
    scenarioId: 'post-extubation-obstruction', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['recognize-post-extubation-obstruction', 'support-post-extubation-airway', 'confirm-post-extubation-recovery'],
  },
  {
    scenarioId: 'post-extubation-obstruction', frameworkId: 'coa-standards',
    domainId: 'airway-management',
    objectiveIds: ['recognize-post-extubation-obstruction', 'support-post-extubation-airway', 'confirm-post-extubation-recovery'],
  },
  {
    scenarioId: 'post-extubation-obstruction', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-airway-management',
    objectiveIds: ['recognize-post-extubation-obstruction', 'support-post-extubation-airway', 'confirm-post-extubation-recovery'],
  },
  {
    scenarioId: 'opioid-induced-ventilatory-impairment', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['recognize-opioid-ventilatory-impairment', 'support-opioid-impaired-ventilation', 'prevent-further-opioid-harm', 'escalate-opioid-reversal', 'reassess-opioid-ventilatory-recovery'],
  },
  {
    scenarioId: 'opioid-induced-ventilatory-impairment', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['recognize-opioid-ventilatory-impairment', 'support-opioid-impaired-ventilation', 'prevent-further-opioid-harm', 'escalate-opioid-reversal', 'reassess-opioid-ventilatory-recovery'],
  },
  {
    scenarioId: 'opioid-induced-ventilatory-impairment', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-crisis-management',
    objectiveIds: ['recognize-opioid-ventilatory-impairment', 'support-opioid-impaired-ventilation', 'prevent-further-opioid-harm', 'escalate-opioid-reversal', 'reassess-opioid-ventilatory-recovery'],
  },
  {
    scenarioId: 'hypothermia-and-rewarming', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['recognize-perioperative-hypothermia', 'start-active-surface-warming', 'warm-bulk-perioperative-fluids', 'reassess-perioperative-rewarming'],
  },
  {
    scenarioId: 'hypothermia-and-rewarming', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['recognize-perioperative-hypothermia', 'start-active-surface-warming', 'warm-bulk-perioperative-fluids', 'reassess-perioperative-rewarming'],
  },
  {
    scenarioId: 'hypothermia-and-rewarming', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: ['recognize-perioperative-hypothermia', 'start-active-surface-warming', 'warm-bulk-perioperative-fluids', 'reassess-perioperative-rewarming'],
  },
  {
    scenarioId: 'perioperative-hyperglycemia', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['confirm-perioperative-hyperglycemia', 'use-bounded-insulin-protocol', 'reassess-perioperative-glucose'],
  },
  {
    scenarioId: 'perioperative-hyperglycemia', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['confirm-perioperative-hyperglycemia', 'use-bounded-insulin-protocol', 'reassess-perioperative-glucose'],
  },
  {
    scenarioId: 'perioperative-hyperglycemia', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: ['confirm-perioperative-hyperglycemia', 'use-bounded-insulin-protocol', 'reassess-perioperative-glucose'],
  },
  {
    scenarioId: 'pacemaker-and-cautery-planning', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['review-cied-device-record', 'review-cied-procedure-risk', 'choose-coordinated-cied-plan', 'document-cied-backup-and-restoration'],
  },
  {
    scenarioId: 'pacemaker-and-cautery-planning', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['review-cied-device-record', 'review-cied-procedure-risk', 'choose-coordinated-cied-plan', 'document-cied-backup-and-restoration'],
  },
  {
    scenarioId: 'pacemaker-and-cautery-planning', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: ['review-cied-device-record', 'review-cied-procedure-risk', 'choose-coordinated-cied-plan', 'document-cied-backup-and-restoration'],
  },
  {
    scenarioId: 'postoperative-handoff', frameworkId: 'nbcrna-nce',
    domainId: 'advanced-principles',
    objectiveIds: ['confirm-handoff-readiness', 'share-handoff-critical-content', 'assign-handoff-risks-and-ownership', 'close-loop-and-accept-transfer'],
  },
  {
    scenarioId: 'postoperative-handoff', frameworkId: 'coa-standards',
    domainId: 'clinical-decision-making',
    objectiveIds: ['confirm-handoff-readiness', 'share-handoff-critical-content', 'assign-handoff-risks-and-ownership', 'close-loop-and-accept-transfer'],
  },
  {
    scenarioId: 'postoperative-handoff', frameworkId: 'acgme-anesthesiology-milestones-2',
    domainId: 'pc-anesthetic-plan-and-conduct',
    objectiveIds: ['confirm-handoff-readiness', 'share-handoff-critical-content', 'assign-handoff-risks-and-ownership', 'close-loop-and-accept-transfer'],
  },

  // --- AAMC Core EPAs -------------------------------------------------------
  //
  // A cross-specialty reading, so unlike the three above it maps anaesthesia
  // lessons to activities written for any entering resident. Each lesson is
  // mapped to the activities its OWN objectives exercise, which is why five of
  // the thirteen appear nowhere: this simulator takes no history, writes no
  // note, gives no oral presentation, retrieves no evidence and takes no
  // consent. The coverage report names those five rather than hiding them.
  // --- routine-induction ---
  { scenarioId: 'routine-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['hysteresis', 'blunt-incision', 'manage-hypotension'] },
  { scenarioId: 'routine-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['preoxygenate', 'ventilate-before-desaturation'] },
  // --- rapid-desaturation ---
  { scenarioId: 'rapid-desaturation', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['preoxygenate', 'ventilate-before-desaturation', 'limit-attempts'] },
  { scenarioId: 'rapid-desaturation', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['hysteresis'] },
  // --- hypotension-after-induction ---
  { scenarioId: 'hypotension-after-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-2-differential-diagnosis', objectiveIds: ['read-the-mechanism'] },
  { scenarioId: 'hypotension-after-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['dose-for-the-patient', 'manage-hypotension'] },
  { scenarioId: 'hypotension-after-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['ventilate-before-desaturation'] },
  // --- bronchospasm ---
  { scenarioId: 'bronchospasm', frameworkId: 'aamc-core-epas', domainId: 'epa-2-differential-diagnosis', objectiveIds: ['read-the-capnogram'] },
  { scenarioId: 'bronchospasm', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['escalate-bronchospasm', 'ventilate-before-desaturation'] },
  { scenarioId: 'bronchospasm', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['deepen-before-reaching-for-anything-else', 'give-first-line-bronchodilator', 'manage-hypotension'] },
  // --- unexpected-intraoperative-hemorrhage ---
  { scenarioId: 'unexpected-intraoperative-hemorrhage', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['recognize-hemorrhage'] },
  { scenarioId: 'unexpected-intraoperative-hemorrhage', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['temporize-volume-loss', 'avoid-full-dose-induction', 'manage-hypotension'] },
  // --- rapid-sequence-induction ---
  { scenarioId: 'rapid-sequence-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['preoxygenate-before-induction', 'protect-the-apnea-margin', 'secure-and-confirm'] },
  { scenarioId: 'rapid-sequence-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['wait-for-intubating-block', 'reverse-observed-block'] },
  // --- awareness-under-paralysis ---
  { scenarioId: 'awareness-under-paralysis', frameworkId: 'aamc-core-epas', domainId: 'epa-13-system-failures-and-safety', objectiveIds: ['inspect-the-tiva-line', 'restore-hypnotic-delivery'] },
  { scenarioId: 'awareness-under-paralysis', frameworkId: 'aamc-core-epas', domainId: 'epa-2-differential-diagnosis', objectiveIds: ['recognize-paralysis-risk'] },
  { scenarioId: 'awareness-under-paralysis', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['hypnosis-before-paralysis'] },
  // --- laryngospasm-after-airway-stimulation ---
  { scenarioId: 'laryngospasm-after-airway-stimulation', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['apply-initial-laryngospasm-measures'] },
  { scenarioId: 'laryngospasm-after-airway-stimulation', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['preoxygenate-before-laryngospasm', 'protect-oxygenation-during-laryngospasm'] },
  { scenarioId: 'laryngospasm-after-airway-stimulation', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['deepen-during-laryngospasm'] },
  // --- perioperative-anaphylaxis-after-antibiotic ---
  { scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['recognize-anaphylaxis-pattern'] },
  { scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['give-initial-epinephrine', 'support-anaphylaxis-circulation'] },
  { scenarioId: 'perioperative-anaphylaxis-after-antibiotic', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['support-anaphylaxis-oxygenation'] },
  // --- early-malignant-hyperthermia-during-volatile-anesthesia ---
  { scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['recognize-mh-hypermetabolism', 'stop-trigger-and-hyperventilate'] },
  { scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['give-initial-dantrolene'] },
  { scenarioId: 'early-malignant-hyperthermia-during-volatile-anesthesia', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['reassess-mh-response'] },
  // --- routine-pediatric-iv-induction ---
  { scenarioId: 'routine-pediatric-iv-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['dose-pediatric-propofol'] },
  { scenarioId: 'routine-pediatric-iv-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['preoxygenate-child', 'ventilate-child-by-weight', 'avoid-pediatric-desaturation'] },
  // --- difficult-airway-supraglottic-rescue ---
  { scenarioId: 'difficult-airway-supraglottic-rescue', frameworkId: 'aamc-core-epas', domainId: 'epa-9-interprofessional-team', objectiveIds: ['limit-attempts-and-call-for-help'] },
  { scenarioId: 'difficult-airway-supraglottic-rescue', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['prepare-rescue-oxygen-reserve', 'place-supraglottic-rescue', 'confirm-rescue-gas-exchange'] },
  // --- local-anesthetic-systemic-toxicity ---
  { scenarioId: 'local-anesthetic-systemic-toxicity', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['recognize-last-pattern'] },
  { scenarioId: 'local-anesthetic-systemic-toxicity', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['start-last-lipid', 'use-reduced-last-epinephrine'] },
  { scenarioId: 'local-anesthetic-systemic-toxicity', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['support-last-airway-and-seizure'] },
  // --- persistent-vf-cardiac-arrest ---
  { scenarioId: 'persistent-vf-cardiac-arrest', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['resume-arrest-compressions', 'defibrillate-persistent-vf'] },
  { scenarioId: 'persistent-vf-cardiac-arrest', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['give-arrest-epinephrine'] },
  { scenarioId: 'persistent-vf-cardiac-arrest', frameworkId: 'aamc-core-epas', domainId: 'epa-2-differential-diagnosis', objectiveIds: ['avoid-shocking-nonshockable-rhythm'] },
  // --- high-spinal-after-epidural-top-up ---
  { scenarioId: 'high-spinal-after-epidural-top-up', frameworkId: 'aamc-core-epas', domainId: 'epa-9-interprofessional-team', objectiveIds: ['call-for-high-spinal-help'] },
  { scenarioId: 'high-spinal-after-epidural-top-up', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['support-high-spinal-breathing'] },
  { scenarioId: 'high-spinal-after-epidural-top-up', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['support-high-spinal-circulation'] },
  { scenarioId: 'high-spinal-after-epidural-top-up', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['protect-high-spinal-oxygenation'] },
  // --- venous-air-embolism-during-line-removal ---
  { scenarioId: 'venous-air-embolism-during-line-removal', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['escalate-venous-air-pattern', 'control-venous-air-entry'] },
  { scenarioId: 'venous-air-embolism-during-line-removal', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['support-venous-air-oxygenation'] },
  { scenarioId: 'venous-air-embolism-during-line-removal', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['reassess-venous-air-recovery'] },
  // --- repeated-laryngoscopy-harm ---
  { scenarioId: 'repeated-laryngoscopy-harm', frameworkId: 'aamc-core-epas', domainId: 'epa-9-interprofessional-team', objectiveIds: ['limit-attempts-and-call-for-help'] },
  { scenarioId: 'repeated-laryngoscopy-harm', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['prepare-rescue-oxygen-reserve', 'place-supraglottic-rescue', 'confirm-rescue-gas-exchange'] },
  { scenarioId: 'repeated-laryngoscopy-harm', frameworkId: 'aamc-core-epas', domainId: 'epa-2-differential-diagnosis', objectiveIds: ['act-on-prior-airway-record'] },
  // --- capnography-sampling-line-obstruction ---
  { scenarioId: 'capnography-sampling-line-obstruction', frameworkId: 'aamc-core-epas', domainId: 'epa-13-system-failures-and-safety', objectiveIds: ['restore-capnography-sampling'] },
  { scenarioId: 'capnography-sampling-line-obstruction', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['cross-check-capnography-loss'] },
  { scenarioId: 'capnography-sampling-line-obstruction', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['preserve-stable-ventilation'] },
  // --- dilutional-coagulopathy ---
  { scenarioId: 'dilutional-coagulopathy', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['identify-dilutional-coagulopathy', 'reassess-coagulation-response'] },
  { scenarioId: 'dilutional-coagulopathy', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['give-lab-guided-plasma'] },
  // --- arterial-pressure-transducer-artifact ---
  { scenarioId: 'arterial-pressure-transducer-artifact', frameworkId: 'aamc-core-epas', domainId: 'epa-13-system-failures-and-safety', objectiveIds: ['correct-transducer-level', 'assess-arterial-dynamic-response'] },
  { scenarioId: 'arterial-pressure-transducer-artifact', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['verify-invasive-pressure-independently'] },
  // --- circle-system-rebreathing ---
  { scenarioId: 'circle-system-rebreathing', frameworkId: 'aamc-core-epas', domainId: 'epa-13-system-failures-and-safety', objectiveIds: ['bridge-with-fresh-gas-flow', 'replace-exhausted-absorbent'] },
  { scenarioId: 'circle-system-rebreathing', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['recognize-inspired-carbon-dioxide'] },
  // --- routine-inhalational-maintenance ---
  { scenarioId: 'routine-inhalational-maintenance', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['anticipate-surgical-stimulus', 'reassess-when-stimulus-falls'] },
  { scenarioId: 'routine-inhalational-maintenance', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['maintain-bounded-depth'] },
  // --- blood-bank-handoff ---
  { scenarioId: 'blood-bank-handoff', frameworkId: 'aamc-core-epas', domainId: 'epa-9-interprofessional-team', objectiveIds: ['request-blood-bank-release'] },
  { scenarioId: 'blood-bank-handoff', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['use-released-red-cells'] },
  { scenarioId: 'blood-bank-handoff', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['reassess-red-cell-response'] },
  // --- routine-geriatric-induction ---
  { scenarioId: 'routine-geriatric-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['titrate-geriatric-propofol', 'protect-geriatric-perfusion'] },
  { scenarioId: 'routine-geriatric-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['preoxygenate-older-adult', 'ventilate-geriatric-induction'] },
  // --- quantitative-neuromuscular-reversal ---
  { scenarioId: 'quantitative-neuromuscular-reversal', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['establish-quantitative-baseline', 'confirm-quantitative-recovery'] },
  { scenarioId: 'quantitative-neuromuscular-reversal', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['reverse-recovering-block'] },
  { scenarioId: 'quantitative-neuromuscular-reversal', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['maintain-anesthesia-during-block'] },
  // --- routine-pediatric-inhalational-induction ---
  { scenarioId: 'routine-pediatric-inhalational-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['prepare-pediatric-inhalational-circuit'] },
  { scenarioId: 'routine-pediatric-inhalational-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['follow-pediatric-end-tidal-wash-in'] },
  { scenarioId: 'routine-pediatric-inhalational-induction', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['settle-pediatric-volatile-depth'] },
  // --- obstetric-general-anesthesia ---
  { scenarioId: 'obstetric-general-anesthesia', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['prepare-obstetric-oxygen-reserve', 'protect-obstetric-apnea-margin', 'confirm-obstetric-ventilation'] },
  { scenarioId: 'obstetric-general-anesthesia', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['wait-for-intubating-block'] },
  // --- preeclampsia-urgent-delivery ---
  { scenarioId: 'preeclampsia-urgent-delivery', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['confirm-persistent-severe-hypertension', 'reassess-preeclampsia-response'] },
  { scenarioId: 'preeclampsia-urgent-delivery', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['treat-severe-pregnancy-hypertension', 'start-preeclampsia-seizure-prophylaxis'] },
  // --- pneumothorax-under-positive-pressure ---
  { scenarioId: 'pneumothorax-under-positive-pressure', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['assess-pneumothorax-pattern', 'decompress-pneumothorax'] },
  { scenarioId: 'pneumothorax-under-positive-pressure', frameworkId: 'aamc-core-epas', domainId: 'epa-9-interprofessional-team', objectiveIds: ['escalate-pneumothorax-pattern'] },
  { scenarioId: 'pneumothorax-under-positive-pressure', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['support-pneumothorax-oxygenation'] },
  { scenarioId: 'pneumothorax-under-positive-pressure', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['reassess-pneumothorax-recovery'] },
  // --- aspiration-risk-recognition ---
  { scenarioId: 'aspiration-risk-recognition', frameworkId: 'aamc-core-epas', domainId: 'epa-2-differential-diagnosis', objectiveIds: ['review-aspiration-risk-cues', 'classify-elevated-aspiration-risk', 'avoid-blanket-glp1-rule'] },
  { scenarioId: 'aspiration-risk-recognition', frameworkId: 'aamc-core-epas', domainId: 'epa-9-interprofessional-team', objectiveIds: ['choose-shared-elective-plan'] },
  // --- emergence-with-residual-blockade ---
  { scenarioId: 'emergence-with-residual-blockade', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['review-emergence-quantitative-monitor'] },
  { scenarioId: 'emergence-with-residual-blockade', frameworkId: 'aamc-core-epas', domainId: 'epa-2-differential-diagnosis', objectiveIds: ['recognize-emergence-residual-blockade', 'separate-recovery-from-extubation-readiness'] },
  { scenarioId: 'emergence-with-residual-blockade', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['defer-extubation-during-residual-blockade'] },
  // --- delayed-emergence-differential ---
  { scenarioId: 'delayed-emergence-differential', frameworkId: 'aamc-core-epas', domainId: 'epa-2-differential-diagnosis', objectiveIds: ['reconcile-delayed-emergence-exposures', 'find-delayed-emergence-lateralizing-sign'] },
  { scenarioId: 'delayed-emergence-differential', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['check-delayed-emergence-metabolic-causes'] },
  { scenarioId: 'delayed-emergence-differential', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['escalate-delayed-emergence-neurologic-pattern'] },
  { scenarioId: 'delayed-emergence-differential', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['support-delayed-emergence-patient'] },
  // --- extubation-readiness ---
  { scenarioId: 'extubation-readiness', frameworkId: 'aamc-core-epas', domainId: 'epa-2-differential-diagnosis', objectiveIds: ['integrate-awake-extubation-readiness', 'plan-extubation-risk-and-rescue'] },
  { scenarioId: 'extubation-readiness', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['confirm-extubation-quantitative-recovery', 'assess-extubation-gas-exchange'] },
  { scenarioId: 'extubation-readiness', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['assess-awake-airway-protection'] },
  // --- post-extubation-obstruction ---
  { scenarioId: 'post-extubation-obstruction', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['recognize-post-extubation-obstruction'] },
  { scenarioId: 'post-extubation-obstruction', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['support-post-extubation-airway'] },
  { scenarioId: 'post-extubation-obstruction', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['confirm-post-extubation-recovery'] },
  // --- opioid-induced-ventilatory-impairment ---
  { scenarioId: 'opioid-induced-ventilatory-impairment', frameworkId: 'aamc-core-epas', domainId: 'epa-10-urgent-and-emergent-care', objectiveIds: ['recognize-opioid-ventilatory-impairment'] },
  { scenarioId: 'opioid-induced-ventilatory-impairment', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['prevent-further-opioid-harm', 'escalate-opioid-reversal'] },
  { scenarioId: 'opioid-induced-ventilatory-impairment', frameworkId: 'aamc-core-epas', domainId: 'epa-12-general-procedures', objectiveIds: ['support-opioid-impaired-ventilation'] },
  { scenarioId: 'opioid-induced-ventilatory-impairment', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['reassess-opioid-ventilatory-recovery'] },
  // --- hypothermia-and-rewarming ---
  { scenarioId: 'hypothermia-and-rewarming', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['recognize-perioperative-hypothermia', 'reassess-perioperative-rewarming'] },
  { scenarioId: 'hypothermia-and-rewarming', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['start-active-surface-warming', 'warm-bulk-perioperative-fluids'] },
  // --- perioperative-hyperglycemia ---
  { scenarioId: 'perioperative-hyperglycemia', frameworkId: 'aamc-core-epas', domainId: 'epa-3-diagnostic-and-screening-tests', objectiveIds: ['confirm-perioperative-hyperglycemia', 'reassess-perioperative-glucose'] },
  { scenarioId: 'perioperative-hyperglycemia', frameworkId: 'aamc-core-epas', domainId: 'epa-4-orders-and-prescriptions', objectiveIds: ['use-bounded-insulin-protocol'] },
  // --- pacemaker-and-cautery-planning ---
  { scenarioId: 'pacemaker-and-cautery-planning', frameworkId: 'aamc-core-epas', domainId: 'epa-2-differential-diagnosis', objectiveIds: ['review-cied-device-record', 'review-cied-procedure-risk'] },
  { scenarioId: 'pacemaker-and-cautery-planning', frameworkId: 'aamc-core-epas', domainId: 'epa-9-interprofessional-team', objectiveIds: ['choose-coordinated-cied-plan'] },
  { scenarioId: 'pacemaker-and-cautery-planning', frameworkId: 'aamc-core-epas', domainId: 'epa-13-system-failures-and-safety', objectiveIds: ['document-cied-backup-and-restoration'] },
  // --- postoperative-handoff ---
  { scenarioId: 'postoperative-handoff', frameworkId: 'aamc-core-epas', domainId: 'epa-8-handover', objectiveIds: ['confirm-handoff-readiness', 'share-handoff-critical-content', 'assign-handoff-risks-and-ownership', 'close-loop-and-accept-transfer'] },
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
