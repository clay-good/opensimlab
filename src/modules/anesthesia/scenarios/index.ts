/**
 * The scenario registry.
 *
 * Scenarios are data, validated against the published schema, and the
 * application never names one directly: the route, the briefing, the governance
 * records and the structured data all read this list. Adding a scenario means
 * adding a file and a line here, and nothing else
 * (platform/module-contract → a module supplies its own content).
 */

import type { Scenario } from './types';
import { ROUTINE_INDUCTION } from './routine-induction';
import { RAPID_DESATURATION } from './rapid-desaturation';
import { HYPOTENSION_AFTER_INDUCTION } from './hypotension-after-induction';
import { BRONCHOSPASM } from './bronchospasm';
import { UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE } from './unexpected-intraoperative-hemorrhage';
import { RAPID_SEQUENCE_INDUCTION } from './rapid-sequence-induction';
import { AWARENESS_UNDER_PARALYSIS } from './awareness-under-paralysis';
import { LARYNGOSPASM_AFTER_AIRWAY_STIMULATION } from './laryngospasm-after-airway-stimulation';
import { PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC } from './perioperative-anaphylaxis-after-antibiotic';
import { EARLY_MALIGNANT_HYPERTHERMIA_DURING_VOLATILE_ANESTHESIA } from './early-malignant-hyperthermia-during-volatile-anesthesia';
import { ROUTINE_PEDIATRIC_IV_INDUCTION } from './routine-pediatric-iv-induction';
import { DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE } from './difficult-airway-supraglottic-rescue';
import { LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY } from './local-anesthetic-systemic-toxicity';
import { PERSISTENT_VF_CARDIAC_ARREST } from './persistent-vf-cardiac-arrest';
import { HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP } from './high-spinal-after-epidural-top-up';
import { VENOUS_AIR_EMBOLISM_DURING_LINE_REMOVAL } from './venous-air-embolism-during-line-removal';
import { REPEATED_LARYNGOSCOPY_HARM } from './repeated-laryngoscopy-harm';
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION } from './capnography-sampling-line-obstruction';
import { DILUTIONAL_COAGULOPATHY } from './dilutional-coagulopathy';
import { ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT } from './arterial-pressure-transducer-artifact';
import { CIRCLE_SYSTEM_REBREATHING } from './circle-system-rebreathing';
import { ROUTINE_INHALATIONAL_MAINTENANCE } from './routine-inhalational-maintenance';
import { BLOOD_BANK_HANDOFF } from './blood-bank-handoff';
import { ROUTINE_GERIATRIC_INDUCTION } from './routine-geriatric-induction';
import { QUANTITATIVE_NEUROMUSCULAR_REVERSAL } from './quantitative-neuromuscular-reversal';
import { ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION } from './routine-pediatric-inhalational-induction';

export const SCENARIOS: readonly Scenario[] = [
  ROUTINE_INDUCTION,
  RAPID_DESATURATION,
  HYPOTENSION_AFTER_INDUCTION,
  BRONCHOSPASM,
  UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE,
  RAPID_SEQUENCE_INDUCTION,
  AWARENESS_UNDER_PARALYSIS,
  LARYNGOSPASM_AFTER_AIRWAY_STIMULATION,
  PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC,
  EARLY_MALIGNANT_HYPERTHERMIA_DURING_VOLATILE_ANESTHESIA,
  ROUTINE_PEDIATRIC_IV_INDUCTION,
  DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE,
  LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY,
  PERSISTENT_VF_CARDIAC_ARREST,
  HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP,
  VENOUS_AIR_EMBOLISM_DURING_LINE_REMOVAL,
  REPEATED_LARYNGOSCOPY_HARM,
  CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION,
  DILUTIONAL_COAGULOPATHY,
  ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT,
  CIRCLE_SYSTEM_REBREATHING,
  ROUTINE_INHALATIONAL_MAINTENANCE,
  BLOOD_BANK_HANDOFF,
  ROUTINE_GERIATRIC_INDUCTION,
  QUANTITATIVE_NEUROMUSCULAR_REVERSAL,
  ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION,
];

/** The scenario a learner meets first. */
export const DEFAULT_SCENARIO_ID = ROUTINE_INDUCTION.metadata.id;

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.metadata.id === id);
}

/** Ordered by difficulty, so the directory reads as a path rather than a pile. */
export const DIFFICULTY_ORDER: Record<Scenario['metadata']['difficulty'], number> = {
  introductory: 0,
  intermediate: 1,
  advanced: 2,
};

export function scenariosByDifficulty(): Scenario[] {
  return [...SCENARIOS].sort(
    (a, b) => DIFFICULTY_ORDER[a.metadata.difficulty] - DIFFICULTY_ORDER[b.metadata.difficulty],
  );
}
