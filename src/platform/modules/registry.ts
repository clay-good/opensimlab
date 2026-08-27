/**
 * The module registry (platform/module-contract).
 *
 * A specialty module declares its route segment, display name, description,
 * audience and status. The landing page's module directory renders from these
 * declarations rather than from a hand-maintained list, and a new module mounts
 * by registration alone.
 *
 * The platform contains no specialty-specific logic. Nothing in this file names a
 * drug, an index, or a ventilator.
 */

export type ModuleStatus = 'available' | 'planned';

export interface TimescaleDeclaration {
  /** The unit the module's clock is displayed in. */
  readonly unit: 'seconds' | 'minutes' | 'hours' | 'days';
  /** Solver step size in seconds, set from the declaration rather than fixed. */
  readonly stepSeconds: number;
  /** Speed multipliers appropriate to this timescale. */
  readonly speeds: readonly number[];
}

export interface ModuleDeclaration {
  readonly id: string;
  /** The route segment, without a leading slash. */
  readonly route: string;
  readonly displayName: string;
  /** One sentence: what it teaches. */
  readonly description: string;
  /** Who it is for. */
  readonly audience: string;
  /** What a learner should already know. */
  readonly prerequisites: string;
  readonly status: ModuleStatus;
  /** What a planned module will cover. No date is ever promised. */
  readonly plannedScope?: string;
  readonly timescale: TimescaleDeclaration;
}

export const MODULES: readonly ModuleDeclaration[] = [
  {
    id: 'anesthesia',
    route: 'anesthesia',
    displayName: 'Anesthesia',
    description:
      'Induce and maintain general anaesthesia on a virtual patient, and watch what the drugs '
      + 'actually do to the physiology while you do it.',
    audience: 'Medical students on an anaesthesia rotation, first-year residents, and nurse anaesthetist students.',
    prerequisites: 'Basic cardiovascular and respiratory physiology. No prior anaesthesia experience.',
    status: 'available',
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'emergency-medicine',
    route: 'emergency-medicine',
    displayName: 'Emergency medicine',
    description:
      'Assess an undifferentiated emergency patient, test the next useful hypothesis, and '
      + 'reassess the response in short, focused rehearsals.',
    audience: 'Medical students, emergency medicine residents, and acute-care trainees.',
    prerequisites: 'Basic cardiovascular and respiratory physiology and initial assessment of an acutely ill adult.',
    status: 'available',
    plannedScope:
      'Twenty-five bounded emergency-department rehearsals spanning undifferentiated shock, '
      + 'respiratory failure, rhythm emergencies, neurologic deterioration, metabolic crises, '
      + 'toxicology, and trauma, beginning with assessment and reassessment of shock.',
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'cardiology',
    route: 'cardiology',
    displayName: 'Cardiology',
    description: 'Read symptom trajectories, estimate clinical likelihood before testing, and make each cardiology decision earn its place.',
    audience: 'Medical students, residents, and clinicians rehearsing structured cardiovascular assessment.',
    prerequisites: 'Basic cardiovascular physiology and familiarity with focused history-taking.',
    status: 'available',
    plannedScope:
      'Acute coronary syndromes, arrhythmia recognition and management, and the haemodynamics of '
      + 'heart failure, using the same waveform engine and the same compartment solver.',
    timescale: { unit: 'minutes', stepSeconds: 1, speeds: [1, 5, 30, 120] },
  },
  {
    id: 'respiratory-medicine',
    route: 'respiratory-medicine',
    displayName: 'Respiratory medicine',
    description: 'Practice calm reassessment of obstructive, hypoxemic, pleural, sleep-related, and neuromuscular respiratory failure.',
    audience: 'Medical students, residents, respiratory therapists, and acute-care trainees.',
    prerequisites: 'Basic respiratory physiology and familiarity with focused assessment of an acutely ill adult.',
    status: 'available',
    plannedScope:
      'Fifteen bounded respiratory-medicine rehearsals spanning obstructive disease, oxygenation, '
      + 'ventilatory failure, pleural and parenchymal disease, escalation, longitudinal reassessment, and handoff.',
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'pediatrics',
    route: 'pediatrics',
    displayName: 'Pediatrics',
    description: 'Practice calm whole-child recognition, reassessment, escalation, and handoff across pediatric emergencies.',
    audience: 'Medical students, residents, nurses, and acute-care trainees caring for children.',
    prerequisites: 'Basic pediatric assessment and respiratory and cardiovascular physiology.',
    status: 'available',
    plannedScope:
      'Sixteen bounded pediatric rehearsals spanning respiratory distress, common respiratory '
      + 'emergencies, sepsis and shock, metabolic and neurologic crises, rhythms, resuscitation, '
      + 'airway obstruction, and safeguarding escalation.',
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'neurology',
    route: 'neurology',
    displayName: 'Neurology',
    description:
      'Practice calm neurological pattern recognition, serial reassessment, escalation, and handoff across acute brain, spinal cord, neuromuscular, and autonomic emergencies.',
    audience: 'Medical students, residents, nurses, and acute-care trainees assessing neurological change.',
    prerequisites: 'Basic neurological assessment and cardiovascular and respiratory physiology.',
    status: 'available',
    plannedScope:
      'Fifteen bounded neurology rehearsals spanning acute stroke, seizures, central and peripheral '
      + 'neuromuscular decline, infection, raised pressure, spinal emergencies, delirium, and '
      + 'autonomic dysreflexia.',
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'toxicology',
    route: 'toxicology',
    displayName: 'Toxicology',
    description: 'Practice calm recognition, support, antidote boundaries, serial reassessment, and handoff across high-risk poisonings.',
    audience: 'Medical students, residents, nurses, pharmacists, and acute-care trainees assessing suspected poisoning.',
    prerequisites: 'Basic emergency assessment, respiratory and cardiovascular physiology, and medication safety.',
    status: 'available',
    plannedScope:
      'Fifteen bounded toxicology rehearsals spanning opioid, analgesic, cardiovascular, autonomic, '
      + 'metabolic, inhalational, local-anesthetic, and dyshemoglobin emergencies.',
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'obstetrics',
    route: 'obstetrics',
    displayName: 'Obstetrics',
    description: 'Practice calm recognition, coordinated response, reassessment, and handoff across delivery-room and postpartum emergencies.',
    audience: 'Medical students, residents, midwives, nurses, and acute-care trainees supporting pregnancy and birth.',
    prerequisites: 'Basic obstetric assessment and cardiovascular and respiratory physiology.',
    status: 'available',
    plannedScope:
      'Fifteen bounded obstetric rehearsals spanning postpartum hemorrhage, hypertensive and seizure '
      + 'emergencies, sepsis, collapse, delivery-room escalation, medication safety, airway risk, and maternal-newborn handoff.',
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'neonatology',
    route: 'neonatology',
    displayName: 'Neonatology',
    description: 'Practice calm newborn transition, escalation, reassessment, and handoff while keeping the parent-newborn dyad together.',
    audience: 'Medical students, residents, midwives, nurses, respiratory therapists, and acute-care trainees supporting newborns.',
    prerequisites: 'Basic newborn assessment and respiratory, cardiovascular, and thermal physiology.',
    status: 'available',
    plannedScope:
      'Eleven bounded neonatal rehearsals spanning normal transition, ventilation, bradycardia, '
      + 'respiratory distress, glucose, infection, thermal care, escalation, and handoff.',
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'endocrine-metabolic',
    route: 'endocrine-metabolic',
    displayName: 'Endocrine and metabolic medicine',
    description: 'Practice calm metabolic trajectory review, treatment boundaries, transition readiness, and recurrence-aware handoff.',
    audience: 'Medical students, residents, nurses, pharmacists, dietitians, and acute-care trainees supporting metabolic emergencies.',
    prerequisites: 'Basic glucose, electrolyte, acid-base, renal, and cardiovascular physiology.',
    status: 'available',
    plannedScope:
      'Twelve bounded endocrine and metabolic rehearsals spanning hyperglycemic crises, '
      + 'hypoglycemia, adrenal and thyroid emergencies, calcium disorders, sodium and nutrition-related shifts, and perioperative diabetes.',
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
  {
    id: 'oncology',
    route: 'oncology',
    displayName: 'Oncology',
    description: 'Planned.',
    audience: 'Medical students and residents.',
    prerequisites: 'Basic pharmacology.',
    status: 'planned',
    plannedScope:
      'Chemotherapy exposure and response over weeks rather than minutes, dose adjustment for organ '
      + 'function, and the management of common toxicities.',
    timescale: { unit: 'days', stepSeconds: 3600, speeds: [1, 24, 168] },
  },
  {
    id: 'critical-care',
    route: 'critical-care',
    displayName: 'Critical care',
    description: 'Reassess organ support over time and make each ventilator, circulation, and escalation change earn a measured response.',
    audience: 'Residents and advanced practice trainees.',
    prerequisites: 'The anaesthesia module, or equivalent familiarity with ventilation and vasoactive support.',
    status: 'available',
    plannedScope:
      'Twenty-four bounded ICU rehearsals spanning ventilation, shock, neurologic and renal support, '
      + 'device failures, longitudinal reassessment, and handoff, beginning with ARDS ventilation.',
    timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
  },
];

export function getModule(id: string): ModuleDeclaration {
  const module = MODULES.find((candidate) => candidate.id === id);
  if (!module) throw new Error(`Unknown module: ${id}`);
  return module;
}

export function availableModules(): ModuleDeclaration[] {
  return MODULES.filter((module) => module.status === 'available');
}

export function plannedModules(): ModuleDeclaration[] {
  return MODULES.filter((module) => module.status === 'planned');
}

/**
 * Where a visitor is pointed when they want to know when a planned module ships.
 * No email address is requested, because collecting one would breach the privacy
 * architecture.
 */
export const RELEASE_FEED_URL = 'https://github.com/clay-good/opensimlab/releases';

/** Speed multipliers for a module, from its own timescale declaration. */
export function speedsFor(module: ModuleDeclaration): readonly number[] {
  return module.timescale.speeds;
}
