import type { Scenario } from '@anesthesia/scenarios/types';
import { supportsHypoglycemiaDemonstration } from '../../endocrine-metabolic/demo/hypoglycemia-demonstration';
import { supportsAdrenalDemonstration } from '../../endocrine-metabolic/demo/adrenal-demonstration';
import { supportsThyroidDemonstration } from '../../endocrine-metabolic/demo/thyroid-demonstration';
import { supportsMyxedemaDemonstration } from '../../endocrine-metabolic/demo/myxedema-demonstration';
import { supportsHypercalcemiaDemonstration } from '../../endocrine-metabolic/demo/hypercalcemia-demonstration';
import { supportsHypocalcemiaDemonstration } from '../../endocrine-metabolic/demo/hypocalcemia-demonstration';
import { supportsHyponatremiaCorrectionDemonstration } from '../../endocrine-metabolic/demo/hyponatremia-correction-demonstration';
import { supportsAvpDeficiencyDemonstration } from '../../endocrine-metabolic/demo/avp-deficiency-demonstration';
import { supportsRefeedingDemonstration } from '../../endocrine-metabolic/demo/refeeding-demonstration';
import { supportsPerioperativeDiabetesDemonstration } from '../../endocrine-metabolic/demo/perioperative-diabetes-demonstration';
import { supportsDkaResolutionDemonstration } from '../../endocrine-metabolic/demo/dka-resolution-demonstration';
import { supportsHhsOsmolalityDemonstration } from '../../endocrine-metabolic/demo/hhs-osmolality-demonstration';
import { supportsRenalHyperkalemiaDemonstration } from '../../renal-electrolyte/demo/renal-hyperkalemia-demonstration';
import { supportsRenalHypokalemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypokalemia-demonstration';
import { supportsRenalHyponatremiaDemonstration } from '../../renal-electrolyte/demo/renal-hyponatremia-demonstration';
import { supportsRenalHypernatremiaDemonstration } from '../../renal-electrolyte/demo/renal-hypernatremia-demonstration';
import { supportsRenalHypocalcemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypocalcemia-demonstration';
import { supportsRenalHypermagnesemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypermagnesemia-demonstration';
import { supportsDelayedImmuneEventDemonstration } from '../../oncology/demo/delayed-immune-event-demonstration';
import { supportsIncidentalClotDemonstration } from '../../oncology/demo/incidental-clot-demonstration';
import { supportsNormalTestToxicityDemonstration } from '../../oncology/demo/normal-test-toxicity-demonstration';
import { supportsPrognosisQuestionDemonstration } from '../../oncology/demo/prognosis-question-demonstration';
import { supportsLaboratoryTlsDemonstration } from '../../oncology/demo/laboratory-tls-demonstration';
import { supportsRareEarlyMyocarditisDemonstration } from '../../oncology/demo/rare-early-myocarditis-demonstration';
import { supportsLoweringTheCountDemonstration } from '../../oncology/demo/lowering-the-count-demonstration';
import { supportsInheritedUrgencyDemonstration } from '../../oncology/demo/inherited-urgency-demonstration';
import { supportsTrialRuleDemonstration } from '../../oncology/demo/trial-rule-demonstration';
import { supportsSilentInteractionDemonstration } from '../../oncology/demo/silent-interaction-demonstration';
import { supportsEasyLabelDemonstration } from '../../oncology/demo/easy-label-demonstration';
import { supportsLowScoreDemonstration } from '../../medical-surgical-nursing/demo/low-score-demonstration';
import { supportsCountedRateDemonstration } from '../../medical-surgical-nursing/demo/counted-rate-demonstration';
import { supportsPairedReadingDemonstration } from '../../medical-surgical-nursing/demo/paired-reading-demonstration';
import { supportsAfferentLimbDemonstration } from '../../medical-surgical-nursing/demo/afferent-limb-demonstration';
import { supportsQuietPatientDemonstration } from '../../medical-surgical-nursing/demo/quiet-patient-demonstration';
import { supportsProxyScaleDemonstration } from '../../medical-surgical-nursing/demo/proxy-scale-demonstration';
import { supportsLastKnownWellDemonstration } from '../../medical-surgical-nursing/demo/last-known-well-demonstration';
import { supportsOxygenTargetScaleDemonstration } from '../../medical-surgical-nursing/demo/oxygen-target-scale-demonstration';
import { supportsLostContingencyDemonstration } from '../../medical-surgical-nursing/demo/lost-contingency-demonstration';
import { supportsMeningococcalSepsisDemonstration } from '../../infectious-disease/demo/meningococcal-sepsis-demonstration';
import { supportsObstructedKidneyDemonstration } from '../../infectious-disease/demo/obstructed-kidney-demonstration';
import { supportsFebrileNeutropeniaDemonstration } from '../../infectious-disease/demo/febrile-neutropenia-demonstration';
import { supportsNecrotizingInfectionDemonstration } from '../../infectious-disease/demo/necrotizing-infection-demonstration';
import { supportsEndocarditisHeartFailureDemonstration } from '../../infectious-disease/demo/endocarditis-heart-failure-demonstration';
import { supportsSeverePneumoniaDemonstration } from '../../infectious-disease/demo/severe-pneumonia-demonstration';
import { supportsToxicShockDemonstration } from '../../infectious-disease/demo/toxic-shock-demonstration';
import { supportsPossibleSepsisDemonstration } from '../../infectious-disease/demo/possible-sepsis-demonstration';
import { supportsSepticShockLabelDemonstration } from '../../infectious-disease/demo/septic-shock-label-demonstration';
import { supportsMeningitisImagingDemonstration } from '../../infectious-disease/demo/meningitis-imaging-demonstration';
import { supportsNicuHandoffDemonstration } from '../../neonatology/demo/delivery-room-to-nicu-handoff-demonstration';
import { supportsThermoregulationDemonstration } from '../../neonatology/demo/thermoregulation-failure-demonstration';
import { supportsNeonatalSepsisDemonstration } from '../../neonatology/demo/neonatal-sepsis-demonstration';
import { supportsNeonatalHypoglycemiaDemonstration } from '../../neonatology/demo/neonatal-hypoglycemia-demonstration';
import { supportsPretermRespiratoryDistressDemonstration } from '../../neonatology/demo/preterm-respiratory-distress-demonstration';
import { supportsMeconiumTransitionDemonstration } from '../../neonatology/demo/meconium-stained-transition-demonstration';
import { supportsNeonatalBradycardiaDemonstration } from '../../neonatology/demo/neonatal-bradycardia-demonstration';
import { supportsIneffectiveVentilationDemonstration } from '../../neonatology/demo/ineffective-ventilation-correction-demonstration';
import { supportsNeonatalApneaDemonstration } from '../../neonatology/demo/neonatal-apnea-demonstration';
import { supportsTermTransitionDemonstration } from '../../neonatology/demo/term-newborn-transition-demonstration';
import { supportsTensionPneumothoraxDemonstration } from '../../neonatology/demo/neonatal-tension-pneumothorax-demonstration';
import { supportsMethemoglobinemiaDemonstration } from '../../toxicology/demo/methemoglobinemia-saturation-gap-demonstration';
import { supportsCarbonMonoxideDemonstration } from '../../toxicology/demo/carbon-monoxide-reassuring-monitor-demonstration';
import { supportsAcetaminophenDemonstration } from '../../toxicology/demo/acetaminophen-clock-and-nomogram-demonstration';
import { supportsSalicylateDemonstration } from '../../toxicology/demo/salicylate-falling-number-demonstration';
import { supportsTricyclicDemonstration } from '../../toxicology/demo/tricyclic-sodium-channel-cardiotoxicity-demonstration';
import { supportsBetaBlockerDemonstration } from '../../toxicology/demo/beta-blocker-cardiogenic-shock-demonstration';
import { supportsCalciumChannelBlockerDemonstration } from '../../toxicology/demo/calcium-channel-blocker-shock-demonstration';
import { supportsDigoxinDemonstration } from '../../toxicology/demo/digoxin-rhythm-potassium-demonstration';
import { supportsCholinergicDemonstration } from '../../toxicology/demo/cholinergic-pesticide-respiratory-failure-demonstration';
import { supportsAnticholinergicDemonstration } from '../../toxicology/demo/anticholinergic-hyperthermia-delirium-demonstration';
import { supportsSerotoninDemonstration } from '../../toxicology/demo/serotonin-toxicity-hyperthermia-clonus-demonstration';
import { supportsSympathomimeticDemonstration } from '../../toxicology/demo/sympathomimetic-hyperadrenergic-hyperthermia-demonstration';
import { supportsMethanolDemonstration } from '../../toxicology/demo/methanol-visual-acidosis-gaps-demonstration';
import { supportsDelayedLastDemonstration } from '../../toxicology/demo/delayed-local-anesthetic-cns-cardiac-toxicity-demonstration';
import { supportsOpioidXylazineDemonstration } from '../../toxicology/demo/opioid-xylazine-persistent-sedation-demonstration';
import { supportsMinorStrokeDemonstration } from '../../neurology/demo/minor-nondisabling-acute-ischemic-stroke-demonstration';
import { supportsBasilarLvoDemonstration } from '../../neurology/demo/basilar-artery-occlusion-escalation-demonstration';
import { supportsCerebellarIchDemonstration } from '../../neurology/demo/spontaneous-cerebellar-intracerebral-hemorrhage-demonstration';
import { supportsAsahDemonstration } from '../../neurology/demo/aneurysmal-subarachnoid-hemorrhage-deterioration-demonstration';
import { supportsFocalMotorStatusDemonstration } from '../../neurology/demo/focal-motor-status-epilepticus-escalation-demonstration';
import { supportsNcseDemonstration } from '../../neurology/demo/nonconvulsive-status-epilepticus-recognition-demonstration';
import { supportsMyastheniaDemonstration } from '../../neurology/demo/myasthenic-crisis-escalation-demonstration';
import { supportsGbsDemonstration } from '../../neurology/demo/guillain-barre-respiratory-decline-demonstration';
import { supportsMeningitisDemonstration } from '../../neurology/demo/acute-bacterial-meningitis-first-hour-demonstration';
import { supportsEncephalitisDemonstration } from '../../neurology/demo/suspected-herpes-simplex-encephalitis-demonstration';
import { supportsRaisedIcpDemonstration } from '../../neurology/demo/raised-intracranial-pressure-visual-threat-demonstration';
import { supportsHerniationDemonstration } from '../../neurology/demo/acute-transtentorial-herniation-pattern-demonstration';
import { supportsMsccDemonstration } from '../../neurology/demo/metastatic-spinal-cord-compression-demonstration';
import { supportsDeliriumDemonstration } from '../../neurology/demo/acute-delirium-reversible-causes-demonstration';
import { supportsDysreflexiaDemonstration } from '../../neurology/demo/autonomic-dysreflexia-authored-trigger-demonstration';
import { supportsAtonyDemonstration } from '../../obstetrics/demo/postpartum-hemorrhage-uterine-atony-demonstration';
import { supportsMaternalSepsisDemonstration } from '../../obstetrics/demo/maternal-sepsis-postpartum-deterioration-demonstration';
import { supportsConcealedAbruptionDemonstration } from '../../obstetrics/demo/concealed-placental-abruption-hemorrhage-demonstration';
import { supportsPostpartumPreeclampsiaDemonstration } from '../../obstetrics/demo/postpartum-severe-preeclampsia-warning-signs-demonstration';
import { supportsEclampsiaDemonstration } from '../../obstetrics/demo/eclampsia-first-seizure-response-demonstration';
import { supportsAfeDemonstration } from '../../obstetrics/demo/suspected-amniotic-fluid-embolism-pattern-demonstration';
import { supportsMaternalArrestDemonstration } from '../../obstetrics/demo/maternal-cardiac-arrest-coordinated-response-demonstration';
import { supportsShoulderDystociaDemonstration } from '../../obstetrics/demo/shoulder-dystocia-cognitive-sequence-demonstration';
import { supportsCordProlapseDemonstration } from '../../obstetrics/demo/umbilical-cord-prolapse-urgent-birth-coordination-demonstration';
import { supportsUterineRuptureDemonstration } from '../../obstetrics/demo/suspected-uterine-rupture-recognition-demonstration';
import { supportsMagnesiumToxicityDemonstration } from '../../obstetrics/demo/magnesium-sulfate-toxicity-recognition-demonstration';
import { supportsHighNeuraxialDemonstration } from '../../obstetrics/demo/high-neuraxial-block-obstetric-coordination-demonstration';
import { supportsFailedIntubationDemonstration } from '../../obstetrics/demo/failed-obstetric-intubation-oxygenation-first-demonstration';
import { supportsMaternalNeonatalHandoffDemonstration } from '../../obstetrics/demo/maternal-to-neonatal-resuscitation-handoff-demonstration';
import { supportsOxytocinTachysystoleDemonstration } from '../../obstetrics/demo/oxytocin-associated-uterine-tachysystole-demonstration';
import { supportsAcuteSevereAsthmaDemonstration } from '../../respiratory-medicine/demo/acute-severe-asthma-demonstration';
import { supportsCopdTransitionDemonstration } from '../../respiratory-medicine/demo/copd-exacerbation-transition-reassessment-demonstration';
import { supportsCapHypoxemiaDemonstration } from '../../respiratory-medicine/demo/community-acquired-pneumonia-hypoxemia-reassessment-demonstration';
import { supportsPostPeDyspneaDemonstration } from '../../respiratory-medicine/demo/post-pulmonary-embolism-persistent-dyspnea-demonstration';
import { supportsApeSupportDemonstration } from '../../respiratory-medicine/demo/acute-pulmonary-edema-respiratory-support-reassessment-demonstration';
import { supportsPostTensionPneumothoraxDemonstration } from '../../respiratory-medicine/demo/spontaneous-tension-pneumothorax-post-drainage-reassessment-demonstration';
import { supportsLargePleuralEffusionDemonstration } from '../../respiratory-medicine/demo/large-unilateral-pleural-effusion-reassessment-demonstration';
import { supportsBronchiectasisMucusPluggingDemonstration } from '../../respiratory-medicine/demo/bronchiectasis-mucus-plugging-reassessment-demonstration';
import { supportsChronicOpioidHypoventilationDemonstration } from '../../respiratory-medicine/demo/chronic-opioid-related-hypoventilation-reassessment-demonstration';
import { supportsNeuromuscularRespiratoryFailureDemonstration } from '../../respiratory-medicine/demo/neuromuscular-respiratory-failure-reassessment-demonstration';
import { supportsObesityHypoventilationDemonstration } from '../../respiratory-medicine/demo/obesity-hypoventilation-reassessment-demonstration';
import { supportsNoninvasiveVentilationSelectionDemonstration } from '../../respiratory-medicine/demo/noninvasive-ventilation-selection-demonstration';
import { supportsHighFlowOxygenEscalationDemonstration } from '../../respiratory-medicine/demo/high-flow-nasal-oxygen-escalation-demonstration';
import { supportsOxygenDeviceFailureDemonstration } from '../../respiratory-medicine/demo/oxygen-device-failure-demonstration';
import { supportsAcuteTracheostomyObstructionDemonstration } from '../../respiratory-medicine/demo/acute-tracheostomy-obstruction-demonstration';
import { supportsPediatricRespiratoryDistressDemonstration } from '../../pediatrics/demo/pediatric-respiratory-distress-demonstration';
import { supportsBronchiolitisDemonstration } from '../../pediatrics/demo/bronchiolitis-demonstration';
import { supportsCroupDemonstration } from '../../pediatrics/demo/croup-demonstration';
import { supportsPediatricStatusAsthmaticusDemonstration } from '../../pediatrics/demo/pediatric-status-asthmaticus-demonstration';
import { supportsPediatricSepsisDemonstration } from '../../pediatrics/demo/pediatric-sepsis-demonstration';
import { supportsPediatricSepticShockDemonstration } from '../../pediatrics/demo/pediatric-septic-shock-demonstration';
import { supportsPediatricDehydrationDemonstration } from '../../pediatrics/demo/pediatric-dehydration-demonstration';
import { supportsPediatricDkaDemonstration } from '../../pediatrics/demo/pediatric-dka-demonstration';
import { supportsPediatricHypoglycemicSeizureDemonstration } from '../../pediatrics/demo/pediatric-hypoglycemic-seizure-demonstration';
import { supportsPediatricFebrileSeizureDemonstration } from '../../pediatrics/demo/pediatric-febrile-seizure-demonstration';
import { supportsPediatricStatusEpilepticusDemonstration } from '../../pediatrics/demo/pediatric-status-epilepticus-demonstration';
import { supportsPediatricAnaphylaxisDemonstration } from '../../pediatrics/demo/pediatric-anaphylaxis-demonstration';
import { supportsPediatricSvtDemonstration } from '../../pediatrics/demo/pediatric-svt-demonstration';
import { supportsPediatricBradycardicArrestDemonstration } from '../../pediatrics/demo/pediatric-bradycardic-arrest-demonstration';
import { supportsPediatricFbaoDemonstration } from '../../pediatrics/demo/pediatric-fbao-demonstration';
import { supportsPediatricInjurySafeguardingDemonstration } from '../../pediatrics/demo/pediatric-injury-safeguarding-demonstration';
import { supportsStableChestPainDemonstration } from '../../cardiology/demo/stable-chest-pain-demonstration';
import { supportsClinicStemiDemonstration } from '../../cardiology/demo/clinic-stemi-demonstration';
import { supportsNstemiRiskDemonstration } from '../../cardiology/demo/nstemi-risk-demonstration';
import { supportsHeartFailureDemonstration } from '../../cardiology/demo/heart-failure-demonstration';
import { supportsAfRvrDemonstration } from '../../cardiology/demo/af-rvr-demonstration';
import { supportsPostInfarctionShockDemonstration } from '../../cardiology/demo/post-infarction-shock-demonstration';
import { supportsStableNarrowTachycardiaDemonstration } from '../../cardiology/demo/stable-narrow-tachycardia-demonstration';
import { supportsStableWideTachycardiaDemonstration } from '../../cardiology/demo/stable-wide-tachycardia-demonstration';
import { supportsSymptomaticBradycardiaDemonstration } from '../../cardiology/demo/symptomatic-bradycardia-demonstration';
import { supportsCompleteHeartBlockDemonstration } from '../../cardiology/demo/complete-heart-block-demonstration';
import { supportsTorsadesDemonstration } from '../../cardiology/demo/torsades-demonstration';
import { supportsHyperkalemicConductionDemonstration } from '../../cardiology/demo/hyperkalemic-conduction-demonstration';
import { supportsPericardialTamponadeDemonstration } from '../../cardiology/demo/pericardial-tamponade-demonstration';
import { supportsRightVentricularInfarctionDemonstration } from '../../cardiology/demo/right-ventricular-infarction-demonstration';
import { supportsHypertensiveEmergencyDemonstration } from '../../cardiology/demo/hypertensive-emergency-demonstration';

/**
 * Which lessons have a worked example, asked in one place.
 *
 * This list used to be written out as a long `||` chain at four sites: the
 * briefing's two labels, the route's watch control, and the route's `?demo=1`
 * entry. A lesson added to three of the four is built, tested, and unreachable,
 * which is what happened to all eleven oncology examples. The completion audit
 * knew about them and nothing offered them.
 *
 * `tests/unit/worked-example-offer.test.ts` holds the two halves together: a
 * scenario whose audit claims `guidance-and-demonstration` must appear here,
 * and a scenario that appears here must have made that claim.
 */
const WORKED_EXAMPLES: Readonly<Record<string, readonly ((scenario: Scenario) => boolean)[]>> = {
  'endocrine-metabolic': [
        supportsHypoglycemiaDemonstration,
    supportsAdrenalDemonstration,
    supportsThyroidDemonstration,
    supportsMyxedemaDemonstration,
    supportsHypercalcemiaDemonstration,
    supportsHypocalcemiaDemonstration,
    supportsHyponatremiaCorrectionDemonstration,
    supportsAvpDeficiencyDemonstration,
    supportsRefeedingDemonstration,
    supportsPerioperativeDiabetesDemonstration,
    supportsDkaResolutionDemonstration,
    supportsHhsOsmolalityDemonstration,
  ],
  'renal-electrolyte': [
        supportsRenalHyperkalemiaDemonstration,
    supportsRenalHypokalemiaDemonstration,
    supportsRenalHyponatremiaDemonstration,
    supportsRenalHypernatremiaDemonstration,
    supportsRenalHypocalcemiaDemonstration,
    supportsRenalHypermagnesemiaDemonstration,
  ],
  oncology: [
        supportsDelayedImmuneEventDemonstration,
    supportsIncidentalClotDemonstration,
    supportsNormalTestToxicityDemonstration,
    supportsPrognosisQuestionDemonstration,
    supportsLaboratoryTlsDemonstration,
    supportsRareEarlyMyocarditisDemonstration,
    supportsLoweringTheCountDemonstration,
    supportsInheritedUrgencyDemonstration,
    supportsTrialRuleDemonstration,
    supportsSilentInteractionDemonstration,
    supportsEasyLabelDemonstration,
  ],
  'medical-surgical-nursing': [
    supportsLowScoreDemonstration,
    supportsCountedRateDemonstration,
    supportsPairedReadingDemonstration,
    supportsAfferentLimbDemonstration,
    supportsQuietPatientDemonstration,
    supportsProxyScaleDemonstration,
    supportsLastKnownWellDemonstration,
    supportsOxygenTargetScaleDemonstration,
    supportsLostContingencyDemonstration,
  ],
  'infectious-disease': [
    supportsMeningococcalSepsisDemonstration,
    supportsObstructedKidneyDemonstration,
    supportsFebrileNeutropeniaDemonstration,
    supportsNecrotizingInfectionDemonstration,
    supportsEndocarditisHeartFailureDemonstration,
    supportsSeverePneumoniaDemonstration,
    supportsToxicShockDemonstration,
    supportsPossibleSepsisDemonstration,
    supportsSepticShockLabelDemonstration,
    supportsMeningitisImagingDemonstration,
  ],
  neonatology: [
    supportsTermTransitionDemonstration,
    supportsNeonatalApneaDemonstration,
    supportsIneffectiveVentilationDemonstration,
    supportsNeonatalBradycardiaDemonstration,
    supportsMeconiumTransitionDemonstration,
    supportsPretermRespiratoryDistressDemonstration,
    supportsNeonatalHypoglycemiaDemonstration,
    supportsNeonatalSepsisDemonstration,
    supportsThermoregulationDemonstration,
    supportsNicuHandoffDemonstration,
    supportsTensionPneumothoraxDemonstration,
  ],
  toxicology: [
    supportsMethemoglobinemiaDemonstration,
    supportsCarbonMonoxideDemonstration,
    supportsAcetaminophenDemonstration,
    supportsSalicylateDemonstration,
    supportsTricyclicDemonstration,
    supportsBetaBlockerDemonstration,
    supportsCalciumChannelBlockerDemonstration,
    supportsDigoxinDemonstration,
    supportsCholinergicDemonstration,
    supportsAnticholinergicDemonstration,
    supportsSerotoninDemonstration,
    supportsSympathomimeticDemonstration,
    supportsMethanolDemonstration,
    supportsDelayedLastDemonstration,
    supportsOpioidXylazineDemonstration,
  ],
  neurology: [
    supportsMinorStrokeDemonstration,
    supportsBasilarLvoDemonstration,
    supportsCerebellarIchDemonstration,
    supportsAsahDemonstration,
    supportsFocalMotorStatusDemonstration,
    supportsNcseDemonstration,
    supportsMyastheniaDemonstration,
    supportsGbsDemonstration,
    supportsMeningitisDemonstration,
    supportsEncephalitisDemonstration,
    supportsRaisedIcpDemonstration,
    supportsHerniationDemonstration,
    supportsMsccDemonstration,
    supportsDeliriumDemonstration,
    supportsDysreflexiaDemonstration,
  ],
  obstetrics: [
    supportsAtonyDemonstration,
    supportsMaternalSepsisDemonstration,
    supportsConcealedAbruptionDemonstration,
    supportsPostpartumPreeclampsiaDemonstration,
    supportsEclampsiaDemonstration,
    supportsAfeDemonstration,
    supportsMaternalArrestDemonstration,
    supportsShoulderDystociaDemonstration,
    supportsCordProlapseDemonstration,
    supportsUterineRuptureDemonstration,
    supportsMagnesiumToxicityDemonstration,
    supportsHighNeuraxialDemonstration,
    supportsFailedIntubationDemonstration,
    supportsMaternalNeonatalHandoffDemonstration,
    supportsOxytocinTachysystoleDemonstration,
  ],
  'respiratory-medicine': [
    supportsAcuteSevereAsthmaDemonstration,
    supportsCopdTransitionDemonstration,
    supportsCapHypoxemiaDemonstration,
    supportsPostPeDyspneaDemonstration,
    supportsApeSupportDemonstration,
    supportsPostTensionPneumothoraxDemonstration,
    supportsLargePleuralEffusionDemonstration,
    supportsBronchiectasisMucusPluggingDemonstration,
    supportsChronicOpioidHypoventilationDemonstration,
    supportsNeuromuscularRespiratoryFailureDemonstration,
    supportsObesityHypoventilationDemonstration,
    supportsNoninvasiveVentilationSelectionDemonstration,
    supportsHighFlowOxygenEscalationDemonstration,
    supportsOxygenDeviceFailureDemonstration,
    supportsAcuteTracheostomyObstructionDemonstration,
  ],
  pediatrics: [
    supportsPediatricRespiratoryDistressDemonstration,
    supportsBronchiolitisDemonstration,
    supportsCroupDemonstration,
    supportsPediatricStatusAsthmaticusDemonstration,
    supportsPediatricSepsisDemonstration,
    supportsPediatricSepticShockDemonstration,
    supportsPediatricDehydrationDemonstration,
    supportsPediatricDkaDemonstration,
    supportsPediatricHypoglycemicSeizureDemonstration,
    supportsPediatricFebrileSeizureDemonstration,
    supportsPediatricStatusEpilepticusDemonstration,
    supportsPediatricAnaphylaxisDemonstration,
    supportsPediatricSvtDemonstration,
    supportsPediatricBradycardicArrestDemonstration,
    supportsPediatricFbaoDemonstration,
    supportsPediatricInjurySafeguardingDemonstration,
  ],
  cardiology: [
    supportsStableChestPainDemonstration,
    supportsClinicStemiDemonstration,
    supportsNstemiRiskDemonstration,
    supportsHeartFailureDemonstration,
    supportsAfRvrDemonstration,
    supportsPostInfarctionShockDemonstration,
    supportsStableNarrowTachycardiaDemonstration,
    supportsStableWideTachycardiaDemonstration,
    supportsSymptomaticBradycardiaDemonstration,
    supportsCompleteHeartBlockDemonstration,
    supportsTorsadesDemonstration,
    supportsHyperkalemicConductionDemonstration,
    supportsPericardialTamponadeDemonstration,
    supportsRightVentricularInfarctionDemonstration,
    supportsHypertensiveEmergencyDemonstration,
  ],
};

/** True when this exact scenario version has a worked example to offer. */
export function offersWorkedExample(scenario: Scenario, moduleId: string): boolean {
  return (WORKED_EXAMPLES[moduleId] ?? []).some((supported) => supported(scenario));
}

/** The module ids that ship at least one worked example, for tests and copy. */
export const WORKED_EXAMPLE_MODULE_IDS = Object.keys(WORKED_EXAMPLES);
