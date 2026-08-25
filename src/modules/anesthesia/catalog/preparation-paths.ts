import type { Scenario } from '@anesthesia/engine';

export const PREPARATION_PATH_IDS = [
  'first-lab', 'deteriorating-patient', 'airway-oxygenation', 'shock-perfusion',
  'rhythm-resuscitation', 'ventilation-respiratory-failure', 'pediatric-emergencies',
  'obstetric-emergencies', 'medication-infusion-safety', 'handoff-escalation',
] as const;
export type PreparationPathId = typeof PREPARATION_PATH_IDS[number];

export interface PreparationPathDefinition {
  readonly id: PreparationPathId;
  readonly version: string;
  readonly title: string;
  readonly description: string;
  readonly scenarioIds: readonly string[];
  readonly prerequisites: readonly string[];
  readonly targetCompetencies: readonly string[];
  readonly supportedRoles: readonly string[];
  readonly limitations: string;
}

const BROWSER_LIMIT = 'This path rehearses screen-observable decisions and physiology. It does not assess psychomotor technique, physical examination, or team performance.';

export const PREPARATION_PATHS: readonly PreparationPathDefinition[] = [
  {
    id: 'first-lab', version: '0.2.0', title: 'My first simulation lab',
    description: 'Build a calm foundation: prepare, induce, maintain, reassess, and respond to a common pressure change.',
    scenarioIds: [
      'routine-induction', 'routine-inhalational-maintenance',
      'hypotension-after-induction', 'rapid-desaturation',
    ],
    prerequisites: ['No prior simulator experience required.'],
    targetCompetencies: ['Preoxygenation', 'Induction sequencing', 'Early reassessment'],
    supportedRoles: ['Medical student', 'Resident', 'Nurse anesthesia learner'], limitations: BROWSER_LIMIT,
  },
  {
    id: 'deteriorating-patient', version: '0.2.0', title: 'Recognize a deteriorating patient',
    description: 'Practice separating signal from patient change, joining clues, escalating, and reassessing after an initial response.',
    scenarioIds: ['arterial-pressure-transducer-artifact', 'hypotension-after-induction', 'bronchospasm', 'perioperative-anaphylaxis-after-antibiotic', 'early-malignant-hyperthermia-during-volatile-anesthesia'],
    prerequisites: ['Basic monitor orientation.'],
    targetCompetencies: ['Signal verification', 'Trend recognition', 'Prioritization', 'Reassessment'],
    supportedRoles: ['Medical student', 'Resident', 'Nurse anesthesia learner'], limitations: BROWSER_LIMIT,
  },
  {
    id: 'airway-oxygenation', version: '0.2.0', title: 'Airway and oxygenation',
    description: 'Protect oxygen reserve, recognize obstruction, and change strategy before fixation causes harm.',
    scenarioIds: [
      'routine-induction', 'rapid-desaturation', 'laryngospasm-after-airway-stimulation',
      'difficult-airway-supraglottic-rescue', 'repeated-laryngoscopy-harm',
      'extubation-readiness', 'post-extubation-obstruction',
      'opioid-induced-ventilatory-impairment',
    ],
    prerequisites: ['Basic induction controls.'],
    targetCompetencies: ['Preoxygenation', 'Airway rescue', 'Oxygenation reassessment'],
    supportedRoles: ['Medical student', 'Resident', 'Nurse anesthesia learner'], limitations: BROWSER_LIMIT,
  },
  {
    id: 'shock-perfusion', version: '0.3.0', title: 'Shock and perfusion',
    description: 'Compare vasodilation, blood loss, ordered red-cell support, dilutional coagulopathy, anaphylaxis, and neuraxial cardiovascular collapse.',
    scenarioIds: ['hypotension-after-induction', 'unexpected-intraoperative-hemorrhage', 'blood-bank-handoff', 'dilutional-coagulopathy', 'perioperative-anaphylaxis-after-antibiotic', 'high-spinal-after-epidural-top-up'],
    prerequisites: ['Read heart rate and mean arterial pressure trends.'],
    targetCompetencies: ['Shock-pattern discrimination', 'Perfusion support', 'Response reassessment'],
    supportedRoles: ['Medical student', 'Resident', 'Nurse anesthesia learner'], limitations: BROWSER_LIMIT,
  },
  {
    id: 'rhythm-resuscitation', version: '0.1.0', title: 'Rhythm and resuscitation',
    description: 'Recognize a shockable arrest pattern and rehearse a bounded first response.',
    scenarioIds: ['persistent-vf-cardiac-arrest', 'local-anesthetic-systemic-toxicity'],
    prerequisites: ['Basic electrocardiogram and pulse interpretation.'],
    targetCompetencies: ['Pulseless-rhythm recognition', 'Defibrillation sequence', 'Reassessment'],
    supportedRoles: ['Medical student', 'Resident', 'Nurse anesthesia learner'], limitations: BROWSER_LIMIT,
  },
  {
    id: 'ventilation-respiratory-failure', version: '0.4.0', title: 'Ventilation and respiratory failure',
    description: 'Use saturation, capnography, and airway state together rather than chasing one number.',
    scenarioIds: [
      'capnography-sampling-line-obstruction', 'circle-system-rebreathing',
      'rapid-desaturation', 'bronchospasm',
      'laryngospasm-after-airway-stimulation', 'venous-air-embolism-during-line-removal',
      'pneumothorax-under-positive-pressure',
    ],
    prerequisites: ['Basic monitor orientation.'],
    targetCompetencies: ['Capnogram interpretation', 'Ventilation support', 'Cause-directed reassessment'],
    supportedRoles: ['Medical student', 'Resident', 'Nurse anesthesia learner'], limitations: BROWSER_LIMIT,
  },
  {
    id: 'pediatric-emergencies', version: '0.2.0', title: 'Pediatric emergencies',
    description: 'Build the pediatric foundation through intravenous and inhalational induction before the crisis catalog.',
    scenarioIds: ['routine-pediatric-iv-induction', 'routine-pediatric-inhalational-induction'],
    prerequisites: ['Basic weight-based unit recognition.'],
    targetCompetencies: ['Pediatric oxygen reserve', 'Age-bounded induction', 'End-tidal agent interpretation', 'Ventilation readiness'],
    supportedRoles: ['Medical student', 'Resident', 'Nurse anesthesia learner'], limitations: `${BROWSER_LIMIT} These cases share one healthy 6-year-old teaching profile and do not assess physical airway skill.`,
  },
  {
    id: 'obstetric-emergencies', version: '0.3.0', title: 'Obstetric emergencies',
    description: 'Confirm and treat severe pregnancy hypertension, build a general-anesthesia preparation sequence, then recognize and support rapidly ascending neuraxial block.',
    scenarioIds: ['preeclampsia-urgent-delivery', 'obstetric-general-anesthesia', 'high-spinal-after-epidural-top-up'],
    prerequisites: ['Basic neuraxial-block concepts.'],
    targetCompetencies: ['Severe-hypertension response', 'Maternal oxygen reserve', 'Induction sequencing', 'High-spinal recognition', 'Early escalation', 'Ventilatory support'],
    supportedRoles: ['Medical student', 'Resident', 'Nurse anesthesia learner'], limitations: `${BROWSER_LIMIT} These bounded cases do not model fetal status, delivery, or a complete obstetric anesthetic.`,
  },
  {
    id: 'medication-infusion-safety', version: '0.5.0', title: 'Medication and infusion safety',
    description: 'Rehearse preprocedure medication-risk recognition, age-bounded titration, effect-site delay, depth-matched reversal, changing maintenance needs, paralysis, delivery failure, and toxicity as distinct medication risks.',
    scenarioIds: [
      'aspiration-risk-recognition',
      'routine-induction', 'routine-geriatric-induction',
      'routine-inhalational-maintenance', 'rapid-sequence-induction',
      'quantitative-neuromuscular-reversal', 'emergence-with-residual-blockade',
      'awareness-under-paralysis', 'local-anesthetic-systemic-toxicity',
    ],
    prerequisites: ['Read syringe and infusion controls.'],
    targetCompetencies: ['Dose timing', 'Delivery-state inspection', 'Toxicity recognition'],
    supportedRoles: ['Medical student', 'Resident', 'Nurse anesthesia learner'], limitations: BROWSER_LIMIT,
  },
  {
    id: 'handoff-escalation', version: '0.3.0', title: 'Handoff and escalation',
    description: 'Practice recognizing when the simulated problem exceeds solo management, ordering a bounded handoff, and making help part of the response.',
    scenarioIds: ['unexpected-intraoperative-hemorrhage', 'blood-bank-handoff', 'bronchospasm', 'perioperative-anaphylaxis-after-antibiotic', 'early-malignant-hyperthermia-during-volatile-anesthesia', 'venous-air-embolism-during-line-removal', 'pneumothorax-under-positive-pressure', 'delayed-emergence-differential'],
    prerequisites: ['Basic monitor orientation.'],
    targetCompetencies: ['Early escalation', 'Structured priorities', 'Reassessment after help'],
    supportedRoles: ['Medical student', 'Resident', 'Nurse anesthesia learner'], limitations: BROWSER_LIMIT,
  },
];

export function preparationPath(id: PreparationPathId): PreparationPathDefinition {
  return PREPARATION_PATHS.find((path) => path.id === id)!;
}

export function pathScenarios(
  path: PreparationPathDefinition,
  scenarios: readonly Scenario[],
): Scenario[] {
  return path.scenarioIds.map((id) => {
    const scenario = scenarios.find((candidate) => candidate.metadata.id === id);
    if (!scenario) throw new Error(`Preparation path ${path.id} names unknown scenario ${id}.`);
    return scenario;
  });
}

export function pathMinutes(path: PreparationPathDefinition, scenarios: readonly Scenario[]): number {
  return pathScenarios(path, scenarios)
    .reduce((sum, scenario) => sum + scenario.metadata.estimatedMinutes, 0);
}

export function recommendNextScenario(
  path: PreparationPathDefinition,
  scenarios: readonly Scenario[],
  completedScenarioIds: ReadonlySet<string> = new Set(),
): { readonly scenario: Scenario; readonly reason: string } {
  const ordered = pathScenarios(path, scenarios);
  const scenario = ordered.find((candidate) => !completedScenarioIds.has(candidate.metadata.id)) ?? ordered[0]!;
  return { scenario, reason: `Recommended because you chose “${path.title}.”` };
}

export function recommendAfterScenario(
  path: PreparationPathDefinition,
  scenarios: readonly Scenario[],
  currentScenarioId: string,
): { readonly scenario: Scenario; readonly reason: string } {
  const ordered = pathScenarios(path, scenarios);
  const currentIndex = ordered.findIndex((scenario) => scenario.metadata.id === currentScenarioId);
  const next = currentIndex >= 0 && currentIndex < ordered.length - 1
    ? ordered[currentIndex + 1]!
    : ordered[0]!;
  const reason = currentIndex === ordered.length - 1
    ? `You reached the end of “${path.title}.” Revisit its foundation or choose any other scenario.`
    : `Next in “${path.title}” after this scenario.`;
  return { scenario: next, reason };
}
