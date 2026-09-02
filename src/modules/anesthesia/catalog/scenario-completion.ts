import type { Scenario } from '@anesthesia/scenarios/types';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { adrenalCompletionEvidence, hypoglycemiaCompletionEvidence } from '../../endocrine-metabolic/completion';
import { thyroidCompletionEvidence } from '../../endocrine-metabolic/thyroid-completion';
import { myxedemaCompletionEvidence } from '../../endocrine-metabolic/myxedema-completion';
import { hypercalcemiaCompletionEvidence } from '../../endocrine-metabolic/hypercalcemia-completion';
import { hypocalcemiaCompletionEvidence } from '../../endocrine-metabolic/hypocalcemia-completion';
import { hyponatremiaCorrectionCompletionEvidence } from '../../endocrine-metabolic/hyponatremia-correction-completion';
import { avpDeficiencyCompletionEvidence } from '../../endocrine-metabolic/avp-deficiency-completion';
import { refeedingCompletionEvidence } from '../../endocrine-metabolic/refeeding-completion';
import { perioperativeDiabetesCompletionEvidence } from '../../endocrine-metabolic/perioperative-diabetes-completion';
import { dkaResolutionCompletionEvidence } from '../../endocrine-metabolic/dka-resolution-completion';
import { hhsOsmolalityCompletionEvidence } from '../../endocrine-metabolic/hhs-osmolality-completion';
import { nicuHandoffCompletionEvidence } from '../../neonatology/delivery-room-to-nicu-handoff-completion';
import { thermoregulationCompletionEvidence } from '../../neonatology/thermoregulation-failure-completion';
import { neonatalSepsisCompletionEvidence } from '../../neonatology/neonatal-sepsis-completion';
import { neonatalHypoglycemiaCompletionEvidence } from '../../neonatology/neonatal-hypoglycemia-completion';
import { pretermRespiratoryDistressCompletionEvidence } from '../../neonatology/preterm-respiratory-distress-completion';
import { meconiumTransitionCompletionEvidence } from '../../neonatology/meconium-stained-transition-completion';
import { neonatalBradycardiaCompletionEvidence } from '../../neonatology/neonatal-bradycardia-completion';
import { ineffectiveVentilationCompletionEvidence } from '../../neonatology/ineffective-ventilation-correction-completion';
import { neonatalApneaCompletionEvidence } from '../../neonatology/neonatal-apnea-completion';
import { termTransitionCompletionEvidence } from '../../neonatology/term-newborn-transition-completion';
import { tensionPneumothoraxCompletionEvidence } from '../../neonatology/neonatal-tension-pneumothorax-completion';
import { methemoglobinemiaCompletionEvidence } from '../../toxicology/methemoglobinemia-saturation-gap-completion';
import { carbonMonoxideCompletionEvidence } from '../../toxicology/carbon-monoxide-reassuring-monitor-completion';
import { acetaminophenCompletionEvidence } from '../../toxicology/acetaminophen-clock-and-nomogram-completion';
import { salicylateCompletionEvidence } from '../../toxicology/salicylate-falling-number-completion';
import { tricyclicCompletionEvidence } from '../../toxicology/tricyclic-sodium-channel-cardiotoxicity-completion';
import { betaBlockerCompletionEvidence } from '../../toxicology/beta-blocker-cardiogenic-shock-completion';
import { calciumChannelBlockerCompletionEvidence } from '../../toxicology/calcium-channel-blocker-shock-completion';
import { digoxinCompletionEvidence } from '../../toxicology/digoxin-rhythm-potassium-completion';
import { cholinergicCompletionEvidence } from '../../toxicology/cholinergic-pesticide-respiratory-failure-completion';
import { anticholinergicCompletionEvidence } from '../../toxicology/anticholinergic-hyperthermia-delirium-completion';
import { serotoninCompletionEvidence } from '../../toxicology/serotonin-toxicity-hyperthermia-clonus-completion';
import { sympathomimeticCompletionEvidence } from '../../toxicology/sympathomimetic-hyperadrenergic-hyperthermia-completion';
import { methanolCompletionEvidence } from '../../toxicology/methanol-visual-acidosis-gaps-completion';
import { delayedLastCompletionEvidence } from '../../toxicology/delayed-local-anesthetic-cns-cardiac-toxicity-completion';
import { opioidXylazineCompletionEvidence } from '../../toxicology/opioid-xylazine-persistent-sedation-completion';
import { minorStrokeCompletionEvidence } from '../../neurology/minor-nondisabling-acute-ischemic-stroke-completion';
import { basilarLvoCompletionEvidence } from '../../neurology/basilar-artery-occlusion-escalation-completion';
import { cerebellarIchCompletionEvidence } from '../../neurology/spontaneous-cerebellar-intracerebral-hemorrhage-completion';
import { asahCompletionEvidence } from '../../neurology/aneurysmal-subarachnoid-hemorrhage-deterioration-completion';
import { focalMotorStatusCompletionEvidence } from '../../neurology/focal-motor-status-epilepticus-escalation-completion';
import { ncseCompletionEvidence } from '../../neurology/nonconvulsive-status-epilepticus-recognition-completion';
import { myastheniaCompletionEvidence } from '../../neurology/myasthenic-crisis-escalation-completion';
import { gbsCompletionEvidence } from '../../neurology/guillain-barre-respiratory-decline-completion';
import { meningitisCompletionEvidence } from '../../neurology/acute-bacterial-meningitis-first-hour-completion';
import { encephalitisCompletionEvidence } from '../../neurology/suspected-herpes-simplex-encephalitis-completion';
import { raisedIcpCompletionEvidence } from '../../neurology/raised-intracranial-pressure-visual-threat-completion';
import { herniationCompletionEvidence } from '../../neurology/acute-transtentorial-herniation-pattern-completion';
import { msccCompletionEvidence } from '../../neurology/metastatic-spinal-cord-compression-completion';
import { deliriumCompletionEvidence } from '../../neurology/acute-delirium-reversible-causes-completion';
import { dysreflexiaCompletionEvidence } from '../../neurology/autonomic-dysreflexia-authored-trigger-completion';
import { atonyCompletionEvidence } from '../../obstetrics/postpartum-hemorrhage-uterine-atony-completion';
import { maternalSepsisCompletionEvidence } from '../../obstetrics/maternal-sepsis-postpartum-deterioration-completion';
import { concealedAbruptionCompletionEvidence } from '../../obstetrics/concealed-placental-abruption-hemorrhage-completion';
import { postpartumPreeclampsiaCompletionEvidence } from '../../obstetrics/postpartum-severe-preeclampsia-warning-signs-completion';
import { eclampsiaCompletionEvidence } from '../../obstetrics/eclampsia-first-seizure-response-completion';
import { afeCompletionEvidence } from '../../obstetrics/suspected-amniotic-fluid-embolism-pattern-completion';
import { maternalArrestCompletionEvidence } from '../../obstetrics/maternal-cardiac-arrest-coordinated-response-completion';
import { shoulderDystociaCompletionEvidence } from '../../obstetrics/shoulder-dystocia-cognitive-sequence-completion';
import { cordProlapseCompletionEvidence } from '../../obstetrics/umbilical-cord-prolapse-urgent-birth-coordination-completion';
import { uterineRuptureCompletionEvidence } from '../../obstetrics/suspected-uterine-rupture-recognition-completion';
import { magnesiumToxicityCompletionEvidence } from '../../obstetrics/magnesium-sulfate-toxicity-recognition-completion';
import { highNeuraxialCompletionEvidence } from '../../obstetrics/high-neuraxial-block-obstetric-coordination-completion';
import { failedIntubationCompletionEvidence } from '../../obstetrics/failed-obstetric-intubation-oxygenation-first-completion';
import { renalHyperkalemiaCompletionEvidence } from '../../renal-electrolyte/hyperkalemia-completion';
import { renalHypokalemiaCompletionEvidence } from '../../renal-electrolyte/hypokalemia-completion';
import { renalHyponatremiaCompletionEvidence } from '../../renal-electrolyte/hyponatremia-completion';
import { renalHypernatremiaCompletionEvidence } from '../../renal-electrolyte/hypernatremia-completion';
import { renalHypocalcemiaCompletionEvidence } from '../../renal-electrolyte/hypocalcemia-completion';
import { renalHypermagnesemiaCompletionEvidence } from '../../renal-electrolyte/hypermagnesemia-completion';
import { meningococcalSepsisCompletionEvidence } from '../../infectious-disease/meningococcal-sepsis-completion';
import { obstructedKidneyCompletionEvidence } from '../../infectious-disease/obstructed-kidney-completion';
import { febrileNeutropeniaCompletionEvidence } from '../../infectious-disease/febrile-neutropenia-completion';
import { necrotizingInfectionCompletionEvidence } from '../../infectious-disease/necrotizing-infection-completion';
import { endocarditisHeartFailureCompletionEvidence } from '../../infectious-disease/endocarditis-heart-failure-completion';
import { severePneumoniaCompletionEvidence } from '../../infectious-disease/severe-pneumonia-completion';
import { toxicShockCompletionEvidence } from '../../infectious-disease/toxic-shock-completion';
import { possibleSepsisCompletionEvidence } from '../../infectious-disease/possible-sepsis-completion';
import { septicShockLabelCompletionEvidence } from '../../infectious-disease/septic-shock-label-completion';
import { meningitisImagingCompletionEvidence } from '../../infectious-disease/meningitis-imaging-completion';
import { lowScoreCompletionEvidence } from '../../medical-surgical-nursing/low-score-completion';
import { delayedImmuneEventCompletionEvidence } from '../../oncology/delayed-immune-event-completion';
import { incidentalClotCompletionEvidence } from '../../oncology/incidental-clot-completion';
import { normalTestToxicityCompletionEvidence } from '../../oncology/normal-test-toxicity-completion';
import { prognosisQuestionCompletionEvidence } from '../../oncology/prognosis-question-completion';
import { laboratoryTlsCompletionEvidence } from '../../oncology/laboratory-tls-completion';
import { rareEarlyMyocarditisCompletionEvidence } from '../../oncology/rare-early-myocarditis-completion';
import { loweringTheCountCompletionEvidence } from '../../oncology/lowering-the-count-completion';
import { inheritedUrgencyCompletionEvidence } from '../../oncology/inherited-urgency-completion';
import { trialRuleCompletionEvidence } from '../../oncology/trial-rule-completion';
import { silentInteractionCompletionEvidence } from '../../oncology/silent-interaction-completion';
import { easyLabelCompletionEvidence } from '../../oncology/easy-label-completion';
import { countedRateCompletionEvidence } from '../../medical-surgical-nursing/counted-rate-completion';
import { pairedReadingCompletionEvidence } from '../../medical-surgical-nursing/paired-reading-completion';
import { afferentLimbCompletionEvidence } from '../../medical-surgical-nursing/afferent-limb-completion';
import { quietPatientCompletionEvidence } from '../../medical-surgical-nursing/quiet-patient-completion';
import { proxyScaleCompletionEvidence } from '../../medical-surgical-nursing/proxy-scale-completion';
import { lastKnownWellCompletionEvidence } from '../../medical-surgical-nursing/last-known-well-completion';
import { oxygenTargetScaleCompletionEvidence } from '../../medical-surgical-nursing/oxygen-target-scale-completion';
import { lostContingencyCompletionEvidence } from '../../medical-surgical-nursing/lost-contingency-completion';
import {
  COMPLETION_SCHEMA_VERSION,
  type CompletionRequirementAudit,
  type CompletionRequirementId,
  type CompletionStatus,
  type FidelityClass,
  type ScenarioEnvironment,
  type ScenarioCompletionAudit,
  type ScenarioCompletionCatalog,
} from '@platform/catalog/scenario-completion';

const requirement = (
  id: CompletionRequirementId,
  status: CompletionStatus,
  ...evidence: string[]
): CompletionRequirementAudit => ({ id, status, evidence });

/** Audit one legacy scenario without changing or embellishing its behavior. */
export function auditClinicalScenario(
  scenario: Scenario,
  capabilityVersion: string,
  moduleId: string,
  environment: ScenarioEnvironment,
  fidelityClass: FidelityClass = 'closed_loop_physiology',
): ScenarioCompletionAudit {
  const objectiveIds = new Set(scenario.metadata.objectives.map((objective) => objective.id));
  const rubricIds = new Set(scenario.debrief.rubric.map((item) => item.objectiveId));
  const unmappedObjectives = [...objectiveIds].filter((id) => !rubricIds.has(id));
  const objectivesObservable = scenario.metadata.objectives.length >= 2
    && scenario.metadata.objectives.length <= 5
    && unmappedObjectives.length === 0;
  /**
   * Why this one failed, rather than what the rule says.
   *
   * The audit used to answer every failure with the rule itself — "requires 2–5
   * objectives and a rubric mapping for every objective" — which leaves a reader
   * unable to tell an unmapped objective from a scenario that simply declares
   * seven. Those need opposite fixes: one is a missing rubric row, the other is a
   * decision about how much a single debrief should try to teach. Naming the
   * actual count and the actual unmapped ids makes the audit diagnostic instead
   * of merely correct.
   */
  const objectivesReason = (): string => {
    const count = scenario.metadata.objectives.length;
    const reasons: string[] = [];
    if (count < 2) reasons.push(`declares ${count} objective(s); the contract requires at least 2`);
    if (count > 5) reasons.push(`declares ${count} objectives; the contract allows at most 5`);
    if (unmappedObjectives.length > 0) {
      reasons.push(`${unmappedObjectives.length} objective(s) have no debrief rubric row: ${unmappedObjectives.join(', ')}`);
    }
    return `This scenario ${reasons.join(', and ')}.`;
  };
  const hasProgression = scenario.timeline.some((event) => event.type !== 'narrative');
  const scenarioErrors = validateScenario(scenario);
  const hasSources = scenario.metadata.clinicalReview.sources.length > 0;
  const hasLimitations = (scenario.metadata.limitations?.length ?? 0) > 0;

  const requirements: CompletionRequirementAudit[] = [
    requirement('identity-and-versions', 'satisfied',
      `Scenario ${scenario.metadata.id} carries stable content version ${scenario.metadata.version}.`,
      `Capability version ${capabilityVersion} is bound by this audit.`),
    requirement('bounded-fictional-patient', scenarioErrors.length === 0 ? 'satisfied' : 'missing',
      scenarioErrors.length === 0
        ? 'The declarative scenario schema validates a bounded fictional patient profile.'
        : `The declarative scenario schema reports ${scenarioErrors.length} error(s).`),
    requirement('observable-objectives', objectivesObservable ? 'satisfied' : 'missing',
      objectivesObservable
        ? `${scenario.metadata.objectives.length} objectives map to debrief rubric evidence.`
        : objectivesReason()),
    requirement('deterministic-seed-policy', 'missing',
      'The legacy scenario document does not declare a seed policy.'),
    requirement('meaningful-progression', hasProgression ? 'satisfied' : 'missing',
      hasProgression
        ? 'The timeline contains at least one non-narrative state event.'
        : 'No non-narrative state progression is declared.'),
    requirement('meaningful-actions-and-choices', 'missing',
      'Accepted actions, refused actions, and clinically distinct choices are not yet declared in a completion sidecar.'),
    requirement('shared-capability-consequences', 'satisfied',
      'The scenario executes through the shared deterministic anesthesia engine rather than a display-only script.'),
    requirement('bounded-stop-condition', 'missing',
      'The legacy scenario document does not declare a stop condition or bounded outcome space.'),
    requirement('guidance-and-demonstration', 'missing',
      'Guidance rules and an expert demonstration are not bound to this content version.'),
    requirement('debrief-and-counterfactual', 'missing',
      'A PEARLS debrief exists, but no required per-scenario counterfactual record is declared.'),
    requirement('source-provenance', hasSources ? 'satisfied' : 'missing',
      hasSources
        ? `${scenario.metadata.clinicalReview.sources.length} source citation(s) are declared.`
        : 'No authoritative source citation is declared.'),
    requirement('scenario-specific-limitations', hasLimitations ? 'satisfied' : 'missing',
      hasLimitations
        ? `${scenario.metadata.limitations?.length ?? 0} limitation record(s) are linked.`
        : 'No scenario-specific limitation record is linked.'),
    requirement('reference-transcripts', 'missing',
      'Expert, common-error, and recovery transcript fixtures are not all bound to this scenario version.'),
    requirement('inclusive-runtime-verification', 'missing',
      'Per-scenario keyboard, screen-reader, reduced-motion, color-vision, 320 px, offline, replay, and performance evidence is not complete.'),
    requirement('report-control-coverage', 'missing',
      'The shared report control is not yet implemented on briefing, live, debrief, and provenance surfaces.'),
  ];

  const exactEvidence = new Map([
    ...hypoglycemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...adrenalCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...thyroidCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...myxedemaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...hypercalcemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...hypocalcemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...hyponatremiaCorrectionCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...avpDeficiencyCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...refeedingCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...perioperativeDiabetesCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...dkaResolutionCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...hhsOsmolalityCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...termTransitionCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...neonatalApneaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...ineffectiveVentilationCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...neonatalBradycardiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...meconiumTransitionCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...pretermRespiratoryDistressCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...neonatalHypoglycemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...neonatalSepsisCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...thermoregulationCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...nicuHandoffCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...tensionPneumothoraxCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...methemoglobinemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...carbonMonoxideCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...acetaminophenCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...salicylateCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...tricyclicCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...betaBlockerCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...calciumChannelBlockerCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...digoxinCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...cholinergicCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...anticholinergicCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...serotoninCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...sympathomimeticCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...methanolCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...delayedLastCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...opioidXylazineCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...minorStrokeCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...basilarLvoCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...cerebellarIchCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...asahCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...focalMotorStatusCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...ncseCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...myastheniaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...gbsCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...meningitisCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...encephalitisCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...raisedIcpCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...herniationCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...msccCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...deliriumCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...dysreflexiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...atonyCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...maternalSepsisCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...concealedAbruptionCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...postpartumPreeclampsiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...eclampsiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...afeCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...maternalArrestCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...shoulderDystociaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...cordProlapseCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...uterineRuptureCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...magnesiumToxicityCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...highNeuraxialCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...failedIntubationCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...renalHyperkalemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...renalHypokalemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...renalHyponatremiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...renalHypernatremiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...renalHypocalcemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...renalHypermagnesemiaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...meningococcalSepsisCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...obstructedKidneyCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...febrileNeutropeniaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...necrotizingInfectionCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...endocarditisHeartFailureCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...severePneumoniaCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...toxicShockCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...possibleSepsisCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...septicShockLabelCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...meningitisImagingCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...lowScoreCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...delayedImmuneEventCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...incidentalClotCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...normalTestToxicityCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...prognosisQuestionCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...laboratoryTlsCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...rareEarlyMyocarditisCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...loweringTheCountCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...inheritedUrgencyCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...trialRuleCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...silentInteractionCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...easyLabelCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...countedRateCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...pairedReadingCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...afferentLimbCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...quietPatientCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...proxyScaleCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...lastKnownWellCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...oxygenTargetScaleCompletionEvidence(scenario, capabilityVersion, moduleId),
    ...lostContingencyCompletionEvidence(scenario, capabilityVersion, moduleId),
  ].map((entry) => [entry.id, entry]));
  const auditedRequirements = requirements.map((entry) => exactEvidence.get(entry.id) ?? entry);
  return {
    scenarioId: scenario.metadata.id,
    title: scenario.metadata.title,
    moduleId,
    environment,
    estimatedMinutes: scenario.metadata.estimatedMinutes,
    difficulty: scenario.metadata.difficulty,
    prerequisites: [],
    practiceRegions: ['US', 'GB'],
    fidelityClass,
    contentVersion: scenario.metadata.version,
    capabilityVersion,
    maturity: scenario.metadata.maturity,
    complete: auditedRequirements.every((entry) => entry.status === 'satisfied'),
    requirements: auditedRequirements,
  };
}

export function auditAnesthesiaScenario(
  scenario: Scenario,
  capabilityVersion: string,
): ScenarioCompletionAudit {
  return auditClinicalScenario(
    scenario, capabilityVersion, 'anesthesia', 'operating-room', 'closed_loop_physiology',
  );
}

export function buildModuleCompletionCatalog(
  scenarios: readonly Scenario[],
  capabilityVersion: string,
  moduleId: string,
  environment: ScenarioEnvironment | ((scenario: Scenario) => ScenarioEnvironment),
  fidelityClass: FidelityClass = 'closed_loop_physiology',
): ScenarioCompletionCatalog {
  const records = scenarios.map((scenario) => auditClinicalScenario(
    scenario, capabilityVersion, moduleId,
    typeof environment === 'function' ? environment(scenario) : environment,
    fidelityClass,
  ));
  return {
    schemaVersion: COMPLETION_SCHEMA_VERSION,
    moduleId,
    capabilityVersion,
    scenarioCount: records.length,
    completeScenarioCount: records.filter((record) => record.complete).length,
    scenarios: records,
  };
}

export function buildAnesthesiaCompletionCatalog(
  scenarios: readonly Scenario[],
  capabilityVersion: string,
): ScenarioCompletionCatalog {
  return buildModuleCompletionCatalog(
    scenarios, capabilityVersion, 'anesthesia', 'operating-room', 'closed_loop_physiology',
  );
}
