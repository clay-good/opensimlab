/**
 * The cockpit shell: the four regions, the keyboard layer, the live region, and
 * the overlays that open over them.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import './cockpit.css';
import { Button, Drawer, Modal, SegmentedControl, Toggle, usePrefersReducedMotion, useLocalPreference } from '@platform/ui';
import { useSession, sessionInternals } from '@platform/session/session-store';
import {
  formatElapsed, SPEED_MULTIPLIERS, TICKS_PER_SECOND, type SpeedMultiplier,
} from '@platform/clock/simulation-clock';
import { PERSISTENT_MARKER_TEXT } from '@platform/safety/not-for-clinical-use';
import { LAYOUT } from '@platform/tokens/tokens';
import { useResizableRegion } from './useResizableRegion';
import { isUnreviewed, UNREVIEWED_NOTICE } from '@platform/governance/review-gate';
import { FlagControl } from '@platform/governance/FlagControl';
import { reviewModeFrom } from '@platform/governance/review-notes';
import { APP_VERSION } from '@platform/governance/status';
import { UpdateNotice, useUpdateAvailable } from '@platform/offline/UpdateNotice';
import type { StateField } from '@anesthesia/physiology';
import type { Scenario } from '@anesthesia/engine';
import { term, type RegionProfile } from '@anesthesia/region/profiles';
import { StatusBar } from './StatusBar';
import { MonitorRegion } from './MonitorRegion';
import { AnalysisRegion } from './AnalysisRegion';
import { ActionCockpit, crisisResponseAvailability } from './ActionCockpit';
import { DemonstrationBar } from './DemonstrationBar';
import { useDemonstration } from '@anesthesia/demo/useDemonstration';
import { useHypoglycemiaDemonstration } from '../../endocrine-metabolic/demo/useHypoglycemiaDemonstration';
import { supportsHypoglycemiaDemonstration } from '../../endocrine-metabolic/demo/hypoglycemia-demonstration';
import { useAdrenalDemonstration } from '../../endocrine-metabolic/demo/useAdrenalDemonstration';
import { supportsAdrenalDemonstration } from '../../endocrine-metabolic/demo/adrenal-demonstration';
import { useThyroidDemonstration } from '../../endocrine-metabolic/demo/useThyroidDemonstration';
import { supportsThyroidDemonstration } from '../../endocrine-metabolic/demo/thyroid-demonstration';
import { useMyxedemaDemonstration } from '../../endocrine-metabolic/demo/useMyxedemaDemonstration';
import { supportsMyxedemaDemonstration } from '../../endocrine-metabolic/demo/myxedema-demonstration';
import { useHypercalcemiaDemonstration } from '../../endocrine-metabolic/demo/useHypercalcemiaDemonstration';
import { useHypocalcemiaDemonstration } from '../../endocrine-metabolic/demo/useHypocalcemiaDemonstration';
import { supportsHypocalcemiaDemonstration } from '../../endocrine-metabolic/demo/hypocalcemia-demonstration';
import { useHyponatremiaCorrectionDemonstration } from '../../endocrine-metabolic/demo/useHyponatremiaCorrectionDemonstration';
import { supportsHyponatremiaCorrectionDemonstration } from '../../endocrine-metabolic/demo/hyponatremia-correction-demonstration';
import { usePerioperativeDiabetesDemonstration } from '../../endocrine-metabolic/demo/usePerioperativeDiabetesDemonstration';
import { supportsPerioperativeDiabetesDemonstration } from '../../endocrine-metabolic/demo/perioperative-diabetes-demonstration';
import { supportsRenalHyperkalemiaDemonstration } from '../../renal-electrolyte/demo/renal-hyperkalemia-demonstration';
import { useRenalHyperkalemiaDemonstration } from '../../renal-electrolyte/demo/useRenalHyperkalemiaDemonstration';
import { supportsRenalHypokalemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypokalemia-demonstration';
import { useRenalHypokalemiaDemonstration } from '../../renal-electrolyte/demo/useRenalHypokalemiaDemonstration';
import { supportsRenalHyponatremiaDemonstration } from '../../renal-electrolyte/demo/renal-hyponatremia-demonstration';
import { supportsRenalHypernatremiaDemonstration } from '../../renal-electrolyte/demo/renal-hypernatremia-demonstration';
import { supportsRenalHypocalcemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypocalcemia-demonstration';
import { supportsRenalHypermagnesemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypermagnesemia-demonstration';
import { useRenalHyponatremiaDemonstration } from '../../renal-electrolyte/demo/useRenalHyponatremiaDemonstration';
import { useDelayedImmuneEventDemonstration } from '../../oncology/demo/useDelayedImmuneEventDemonstration';
import { useIncidentalClotDemonstration } from '../../oncology/demo/useIncidentalClotDemonstration';
import { useNormalTestToxicityDemonstration } from '../../oncology/demo/useNormalTestToxicityDemonstration';
import { usePrognosisQuestionDemonstration } from '../../oncology/demo/usePrognosisQuestionDemonstration';
import { useLaboratoryTlsDemonstration } from '../../oncology/demo/useLaboratoryTlsDemonstration';
import { useRareEarlyMyocarditisDemonstration } from '../../oncology/demo/useRareEarlyMyocarditisDemonstration';
import { useLoweringTheCountDemonstration } from '../../oncology/demo/useLoweringTheCountDemonstration';
import { useInheritedUrgencyDemonstration } from '../../oncology/demo/useInheritedUrgencyDemonstration';
import { useTrialRuleDemonstration } from '../../oncology/demo/useTrialRuleDemonstration';
import { useSilentInteractionDemonstration } from '../../oncology/demo/useSilentInteractionDemonstration';
import { useEasyLabelDemonstration } from '../../oncology/demo/useEasyLabelDemonstration';
import { useLowScoreDemonstration } from '../../medical-surgical-nursing/demo/useLowScoreDemonstration';
import { useCountedRateDemonstration } from '../../medical-surgical-nursing/demo/useCountedRateDemonstration';
import { usePairedReadingDemonstration } from '../../medical-surgical-nursing/demo/usePairedReadingDemonstration';
import { useAfferentLimbDemonstration } from '../../medical-surgical-nursing/demo/useAfferentLimbDemonstration';
import { useQuietPatientDemonstration } from '../../medical-surgical-nursing/demo/useQuietPatientDemonstration';
import { useProxyScaleDemonstration } from '../../medical-surgical-nursing/demo/useProxyScaleDemonstration';
import { useLastKnownWellDemonstration } from '../../medical-surgical-nursing/demo/useLastKnownWellDemonstration';
import { useOxygenTargetScaleDemonstration } from '../../medical-surgical-nursing/demo/useOxygenTargetScaleDemonstration';
import { useLostContingencyDemonstration } from '../../medical-surgical-nursing/demo/useLostContingencyDemonstration';
import { useMeningococcalSepsisDemonstration } from '../../infectious-disease/demo/useMeningococcalSepsisDemonstration';
import { supportsMeningococcalSepsisDemonstration } from '../../infectious-disease/demo/meningococcal-sepsis-demonstration';
import { useObstructedKidneyDemonstration } from '../../infectious-disease/demo/useObstructedKidneyDemonstration';
import { supportsObstructedKidneyDemonstration } from '../../infectious-disease/demo/obstructed-kidney-demonstration';
import { useFebrileNeutropeniaDemonstration } from '../../infectious-disease/demo/useFebrileNeutropeniaDemonstration';
import { supportsFebrileNeutropeniaDemonstration } from '../../infectious-disease/demo/febrile-neutropenia-demonstration';
import { useNecrotizingInfectionDemonstration } from '../../infectious-disease/demo/useNecrotizingInfectionDemonstration';
import { supportsNecrotizingInfectionDemonstration } from '../../infectious-disease/demo/necrotizing-infection-demonstration';
import { useEndocarditisHeartFailureDemonstration } from '../../infectious-disease/demo/useEndocarditisHeartFailureDemonstration';
import { supportsEndocarditisHeartFailureDemonstration } from '../../infectious-disease/demo/endocarditis-heart-failure-demonstration';
import { useSeverePneumoniaDemonstration } from '../../infectious-disease/demo/useSeverePneumoniaDemonstration';
import { supportsSeverePneumoniaDemonstration } from '../../infectious-disease/demo/severe-pneumonia-demonstration';
import { useToxicShockDemonstration } from '../../infectious-disease/demo/useToxicShockDemonstration';
import { supportsToxicShockDemonstration } from '../../infectious-disease/demo/toxic-shock-demonstration';
import { usePossibleSepsisDemonstration } from '../../infectious-disease/demo/usePossibleSepsisDemonstration';
import { supportsPossibleSepsisDemonstration } from '../../infectious-disease/demo/possible-sepsis-demonstration';
import { useSepticShockLabelDemonstration } from '../../infectious-disease/demo/useSepticShockLabelDemonstration';
import { supportsSepticShockLabelDemonstration } from '../../infectious-disease/demo/septic-shock-label-demonstration';
import { useMeningitisImagingDemonstration } from '../../infectious-disease/demo/useMeningitisImagingDemonstration';
import { supportsMeningitisImagingDemonstration } from '../../infectious-disease/demo/meningitis-imaging-demonstration';
import { useNicuHandoffDemonstration } from '../../neonatology/demo/useNicuHandoffDemonstration';
import { supportsNicuHandoffDemonstration } from '../../neonatology/demo/delivery-room-to-nicu-handoff-demonstration';
import { useThermoregulationDemonstration } from '../../neonatology/demo/useThermoregulationDemonstration';
import { supportsThermoregulationDemonstration } from '../../neonatology/demo/thermoregulation-failure-demonstration';
import { useNeonatalSepsisDemonstration } from '../../neonatology/demo/useNeonatalSepsisDemonstration';
import { supportsNeonatalSepsisDemonstration } from '../../neonatology/demo/neonatal-sepsis-demonstration';
import { useNeonatalHypoglycemiaDemonstration } from '../../neonatology/demo/useNeonatalHypoglycemiaDemonstration';
import { supportsNeonatalHypoglycemiaDemonstration } from '../../neonatology/demo/neonatal-hypoglycemia-demonstration';
import { usePretermRespiratoryDistressDemonstration } from '../../neonatology/demo/usePretermRespiratoryDistressDemonstration';
import { supportsPretermRespiratoryDistressDemonstration } from '../../neonatology/demo/preterm-respiratory-distress-demonstration';
import { useMeconiumTransitionDemonstration } from '../../neonatology/demo/useMeconiumTransitionDemonstration';
import { supportsMeconiumTransitionDemonstration } from '../../neonatology/demo/meconium-stained-transition-demonstration';
import { useNeonatalBradycardiaDemonstration } from '../../neonatology/demo/useNeonatalBradycardiaDemonstration';
import { supportsNeonatalBradycardiaDemonstration } from '../../neonatology/demo/neonatal-bradycardia-demonstration';
import { useIneffectiveVentilationDemonstration } from '../../neonatology/demo/useIneffectiveVentilationDemonstration';
import { supportsIneffectiveVentilationDemonstration } from '../../neonatology/demo/ineffective-ventilation-correction-demonstration';
import { useNeonatalApneaDemonstration } from '../../neonatology/demo/useNeonatalApneaDemonstration';
import { supportsNeonatalApneaDemonstration } from '../../neonatology/demo/neonatal-apnea-demonstration';
import { useTermTransitionDemonstration } from '../../neonatology/demo/useTermTransitionDemonstration';
import { supportsTermTransitionDemonstration } from '../../neonatology/demo/term-newborn-transition-demonstration';
import { useTensionPneumothoraxDemonstration } from '../../neonatology/demo/useTensionPneumothoraxDemonstration';
import { supportsTensionPneumothoraxDemonstration } from '../../neonatology/demo/neonatal-tension-pneumothorax-demonstration';
import { useMethemoglobinemiaDemonstration } from '../../toxicology/demo/useMethemoglobinemiaDemonstration';
import { supportsMethemoglobinemiaDemonstration } from '../../toxicology/demo/methemoglobinemia-saturation-gap-demonstration';
import { useCarbonMonoxideDemonstration } from '../../toxicology/demo/useCarbonMonoxideDemonstration';
import { supportsCarbonMonoxideDemonstration } from '../../toxicology/demo/carbon-monoxide-reassuring-monitor-demonstration';
import { useAcetaminophenDemonstration } from '../../toxicology/demo/useAcetaminophenDemonstration';
import { supportsAcetaminophenDemonstration } from '../../toxicology/demo/acetaminophen-clock-and-nomogram-demonstration';
import { useSalicylateDemonstration } from '../../toxicology/demo/useSalicylateDemonstration';
import { supportsSalicylateDemonstration } from '../../toxicology/demo/salicylate-falling-number-demonstration';
import { useTricyclicDemonstration } from '../../toxicology/demo/useTricyclicDemonstration';
import { supportsTricyclicDemonstration } from '../../toxicology/demo/tricyclic-sodium-channel-cardiotoxicity-demonstration';
import { useBetaBlockerDemonstration } from '../../toxicology/demo/useBetaBlockerDemonstration';
import { supportsBetaBlockerDemonstration } from '../../toxicology/demo/beta-blocker-cardiogenic-shock-demonstration';
import { useCalciumChannelBlockerDemonstration } from '../../toxicology/demo/useCalciumChannelBlockerDemonstration';
import { supportsCalciumChannelBlockerDemonstration } from '../../toxicology/demo/calcium-channel-blocker-shock-demonstration';
import { useDigoxinDemonstration } from '../../toxicology/demo/useDigoxinDemonstration';
import { supportsDigoxinDemonstration } from '../../toxicology/demo/digoxin-rhythm-potassium-demonstration';
import { useCholinergicDemonstration } from '../../toxicology/demo/useCholinergicDemonstration';
import { supportsCholinergicDemonstration } from '../../toxicology/demo/cholinergic-pesticide-respiratory-failure-demonstration';
import { useAnticholinergicDemonstration } from '../../toxicology/demo/useAnticholinergicDemonstration';
import { supportsAnticholinergicDemonstration } from '../../toxicology/demo/anticholinergic-hyperthermia-delirium-demonstration';
import { useSerotoninDemonstration } from '../../toxicology/demo/useSerotoninDemonstration';
import { supportsSerotoninDemonstration } from '../../toxicology/demo/serotonin-toxicity-hyperthermia-clonus-demonstration';
import { useSympathomimeticDemonstration } from '../../toxicology/demo/useSympathomimeticDemonstration';
import { supportsSympathomimeticDemonstration } from '../../toxicology/demo/sympathomimetic-hyperadrenergic-hyperthermia-demonstration';
import { useMethanolDemonstration } from '../../toxicology/demo/useMethanolDemonstration';
import { supportsMethanolDemonstration } from '../../toxicology/demo/methanol-visual-acidosis-gaps-demonstration';
import { useDelayedLastDemonstration } from '../../toxicology/demo/useDelayedLastDemonstration';
import { supportsDelayedLastDemonstration } from '../../toxicology/demo/delayed-local-anesthetic-cns-cardiac-toxicity-demonstration';
import { useOpioidXylazineDemonstration } from '../../toxicology/demo/useOpioidXylazineDemonstration';
import { supportsOpioidXylazineDemonstration } from '../../toxicology/demo/opioid-xylazine-persistent-sedation-demonstration';
import { useMinorStrokeDemonstration } from '../../neurology/demo/useMinorStrokeDemonstration';
import { supportsMinorStrokeDemonstration } from '../../neurology/demo/minor-nondisabling-acute-ischemic-stroke-demonstration';
import { useBasilarLvoDemonstration } from '../../neurology/demo/useBasilarLvoDemonstration';
import { supportsBasilarLvoDemonstration } from '../../neurology/demo/basilar-artery-occlusion-escalation-demonstration';
import { useCerebellarIchDemonstration } from '../../neurology/demo/useCerebellarIchDemonstration';
import { supportsCerebellarIchDemonstration } from '../../neurology/demo/spontaneous-cerebellar-intracerebral-hemorrhage-demonstration';
import { useAsahDemonstration } from '../../neurology/demo/useAsahDemonstration';
import { supportsAsahDemonstration } from '../../neurology/demo/aneurysmal-subarachnoid-hemorrhage-deterioration-demonstration';
import { useFocalMotorStatusDemonstration } from '../../neurology/demo/useFocalMotorStatusDemonstration';
import { supportsFocalMotorStatusDemonstration } from '../../neurology/demo/focal-motor-status-epilepticus-escalation-demonstration';
import { useNcseDemonstration } from '../../neurology/demo/useNcseDemonstration';
import { supportsNcseDemonstration } from '../../neurology/demo/nonconvulsive-status-epilepticus-recognition-demonstration';
import { useMyastheniaDemonstration } from '../../neurology/demo/useMyastheniaDemonstration';
import { supportsMyastheniaDemonstration } from '../../neurology/demo/myasthenic-crisis-escalation-demonstration';
import { useGbsDemonstration } from '../../neurology/demo/useGbsDemonstration';
import { supportsGbsDemonstration } from '../../neurology/demo/guillain-barre-respiratory-decline-demonstration';
import { useMeningitisDemonstration } from '../../neurology/demo/useMeningitisDemonstration';
import { supportsMeningitisDemonstration } from '../../neurology/demo/acute-bacterial-meningitis-first-hour-demonstration';
import { useEncephalitisDemonstration } from '../../neurology/demo/useEncephalitisDemonstration';
import { supportsEncephalitisDemonstration } from '../../neurology/demo/suspected-herpes-simplex-encephalitis-demonstration';
import { useRaisedIcpDemonstration } from '../../neurology/demo/useRaisedIcpDemonstration';
import { supportsRaisedIcpDemonstration } from '../../neurology/demo/raised-intracranial-pressure-visual-threat-demonstration';
import { useHerniationDemonstration } from '../../neurology/demo/useHerniationDemonstration';
import { supportsHerniationDemonstration } from '../../neurology/demo/acute-transtentorial-herniation-pattern-demonstration';
import { useMsccDemonstration } from '../../neurology/demo/useMsccDemonstration';
import { supportsMsccDemonstration } from '../../neurology/demo/metastatic-spinal-cord-compression-demonstration';
import { useDeliriumDemonstration } from '../../neurology/demo/useDeliriumDemonstration';
import { supportsDeliriumDemonstration } from '../../neurology/demo/acute-delirium-reversible-causes-demonstration';
import { useDysreflexiaDemonstration } from '../../neurology/demo/useDysreflexiaDemonstration';
import { supportsDysreflexiaDemonstration } from '../../neurology/demo/autonomic-dysreflexia-authored-trigger-demonstration';
import { useAtonyDemonstration } from '../../obstetrics/demo/useAtonyDemonstration';
import { supportsAtonyDemonstration } from '../../obstetrics/demo/postpartum-hemorrhage-uterine-atony-demonstration';
import { useMaternalSepsisDemonstration } from '../../obstetrics/demo/useMaternalSepsisDemonstration';
import { supportsMaternalSepsisDemonstration } from '../../obstetrics/demo/maternal-sepsis-postpartum-deterioration-demonstration';
import { useConcealedAbruptionDemonstration } from '../../obstetrics/demo/useConcealedAbruptionDemonstration';
import { supportsConcealedAbruptionDemonstration } from '../../obstetrics/demo/concealed-placental-abruption-hemorrhage-demonstration';
import { usePostpartumPreeclampsiaDemonstration } from '../../obstetrics/demo/usePostpartumPreeclampsiaDemonstration';
import { supportsPostpartumPreeclampsiaDemonstration } from '../../obstetrics/demo/postpartum-severe-preeclampsia-warning-signs-demonstration';
import { useEclampsiaDemonstration } from '../../obstetrics/demo/useEclampsiaDemonstration';
import { supportsEclampsiaDemonstration } from '../../obstetrics/demo/eclampsia-first-seizure-response-demonstration';
import { useAfeDemonstration } from '../../obstetrics/demo/useAfeDemonstration';
import { supportsAfeDemonstration } from '../../obstetrics/demo/suspected-amniotic-fluid-embolism-pattern-demonstration';
import { useMaternalArrestDemonstration } from '../../obstetrics/demo/useMaternalArrestDemonstration';
import { supportsMaternalArrestDemonstration } from '../../obstetrics/demo/maternal-cardiac-arrest-coordinated-response-demonstration';
import { useShoulderDystociaDemonstration } from '../../obstetrics/demo/useShoulderDystociaDemonstration';
import { supportsShoulderDystociaDemonstration } from '../../obstetrics/demo/shoulder-dystocia-cognitive-sequence-demonstration';
import { useCordProlapseDemonstration } from '../../obstetrics/demo/useCordProlapseDemonstration';
import { supportsCordProlapseDemonstration } from '../../obstetrics/demo/umbilical-cord-prolapse-urgent-birth-coordination-demonstration';
import { useUterineRuptureDemonstration } from '../../obstetrics/demo/useUterineRuptureDemonstration';
import { supportsUterineRuptureDemonstration } from '../../obstetrics/demo/suspected-uterine-rupture-recognition-demonstration';
import { useMagnesiumToxicityDemonstration } from '../../obstetrics/demo/useMagnesiumToxicityDemonstration';
import { supportsMagnesiumToxicityDemonstration } from '../../obstetrics/demo/magnesium-sulfate-toxicity-recognition-demonstration';
import { useHighNeuraxialDemonstration } from '../../obstetrics/demo/useHighNeuraxialDemonstration';
import { supportsHighNeuraxialDemonstration } from '../../obstetrics/demo/high-neuraxial-block-obstetric-coordination-demonstration';
import { useFailedIntubationDemonstration } from '../../obstetrics/demo/useFailedIntubationDemonstration';
import { supportsFailedIntubationDemonstration } from '../../obstetrics/demo/failed-obstetric-intubation-oxygenation-first-demonstration';
import { useMaternalNeonatalHandoffDemonstration } from '../../obstetrics/demo/useMaternalNeonatalHandoffDemonstration';
import { supportsMaternalNeonatalHandoffDemonstration } from '../../obstetrics/demo/maternal-to-neonatal-resuscitation-handoff-demonstration';
import { useOxytocinTachysystoleDemonstration } from '../../obstetrics/demo/useOxytocinTachysystoleDemonstration';
import { supportsOxytocinTachysystoleDemonstration } from '../../obstetrics/demo/oxytocin-associated-uterine-tachysystole-demonstration';
import { useAcuteSevereAsthmaDemonstration } from '../../respiratory-medicine/demo/useAcuteSevereAsthmaDemonstration';
import { supportsAcuteSevereAsthmaDemonstration } from '../../respiratory-medicine/demo/acute-severe-asthma-demonstration';
import { useCopdTransitionDemonstration } from '../../respiratory-medicine/demo/useCopdTransitionDemonstration';
import { supportsCopdTransitionDemonstration } from '../../respiratory-medicine/demo/copd-exacerbation-transition-reassessment-demonstration';
import { useCapHypoxemiaDemonstration } from '../../respiratory-medicine/demo/useCapHypoxemiaDemonstration';
import { supportsCapHypoxemiaDemonstration } from '../../respiratory-medicine/demo/community-acquired-pneumonia-hypoxemia-reassessment-demonstration';
import { usePostPeDyspneaDemonstration } from '../../respiratory-medicine/demo/usePostPeDyspneaDemonstration';
import { supportsPostPeDyspneaDemonstration } from '../../respiratory-medicine/demo/post-pulmonary-embolism-persistent-dyspnea-demonstration';
import { useApeSupportDemonstration } from '../../respiratory-medicine/demo/useApeSupportDemonstration';
import { supportsApeSupportDemonstration } from '../../respiratory-medicine/demo/acute-pulmonary-edema-respiratory-support-reassessment-demonstration';
import { usePostTensionPneumothoraxDemonstration } from '../../respiratory-medicine/demo/usePostTensionPneumothoraxDemonstration';
import { supportsPostTensionPneumothoraxDemonstration } from '../../respiratory-medicine/demo/spontaneous-tension-pneumothorax-post-drainage-reassessment-demonstration';
import { supportsLostContingencyDemonstration } from '../../medical-surgical-nursing/demo/lost-contingency-demonstration';
import { supportsOxygenTargetScaleDemonstration } from '../../medical-surgical-nursing/demo/oxygen-target-scale-demonstration';
import { supportsLastKnownWellDemonstration } from '../../medical-surgical-nursing/demo/last-known-well-demonstration';
import { supportsProxyScaleDemonstration } from '../../medical-surgical-nursing/demo/proxy-scale-demonstration';
import { supportsQuietPatientDemonstration } from '../../medical-surgical-nursing/demo/quiet-patient-demonstration';
import { supportsAfferentLimbDemonstration } from '../../medical-surgical-nursing/demo/afferent-limb-demonstration';
import { supportsPairedReadingDemonstration } from '../../medical-surgical-nursing/demo/paired-reading-demonstration';
import { supportsCountedRateDemonstration } from '../../medical-surgical-nursing/demo/counted-rate-demonstration';
import { supportsLowScoreDemonstration } from '../../medical-surgical-nursing/demo/low-score-demonstration';
import { useDkaResolutionDemonstration } from '../../endocrine-metabolic/demo/useDkaResolutionDemonstration';
import { supportsDkaResolutionDemonstration } from '../../endocrine-metabolic/demo/dka-resolution-demonstration';
import { useHhsOsmolalityDemonstration } from '../../endocrine-metabolic/demo/useHhsOsmolalityDemonstration';
import { supportsHhsOsmolalityDemonstration } from '../../endocrine-metabolic/demo/hhs-osmolality-demonstration';
import { supportsEasyLabelDemonstration } from '../../oncology/demo/easy-label-demonstration';
import { supportsSilentInteractionDemonstration } from '../../oncology/demo/silent-interaction-demonstration';
import { supportsTrialRuleDemonstration } from '../../oncology/demo/trial-rule-demonstration';
import { supportsInheritedUrgencyDemonstration } from '../../oncology/demo/inherited-urgency-demonstration';
import { supportsLoweringTheCountDemonstration } from '../../oncology/demo/lowering-the-count-demonstration';
import { supportsRareEarlyMyocarditisDemonstration } from '../../oncology/demo/rare-early-myocarditis-demonstration';
import { supportsLaboratoryTlsDemonstration } from '../../oncology/demo/laboratory-tls-demonstration';
import { supportsPrognosisQuestionDemonstration } from '../../oncology/demo/prognosis-question-demonstration';
import { supportsNormalTestToxicityDemonstration } from '../../oncology/demo/normal-test-toxicity-demonstration';
import { supportsIncidentalClotDemonstration } from '../../oncology/demo/incidental-clot-demonstration';
import { supportsDelayedImmuneEventDemonstration } from '../../oncology/demo/delayed-immune-event-demonstration';
import { useRenalHypernatremiaDemonstration } from '../../renal-electrolyte/demo/useRenalHypernatremiaDemonstration';
import { useRenalHypocalcemiaDemonstration } from '../../renal-electrolyte/demo/useRenalHypocalcemiaDemonstration';
import { useRenalHypermagnesemiaDemonstration } from '../../renal-electrolyte/demo/useRenalHypermagnesemiaDemonstration';
import { useRefeedingDemonstration } from '../../endocrine-metabolic/demo/useRefeedingDemonstration';
import { supportsRefeedingDemonstration } from '../../endocrine-metabolic/demo/refeeding-demonstration';
import { useAvpDeficiencyDemonstration } from '../../endocrine-metabolic/demo/useAvpDeficiencyDemonstration';
import { supportsAvpDeficiencyDemonstration } from '../../endocrine-metabolic/demo/avp-deficiency-demonstration';
import { supportsHypercalcemiaDemonstration } from '../../endocrine-metabolic/demo/hypercalcemia-demonstration';
import { WhyPanel } from './WhyPanel';
import {
  announcementsFor, arterialLineSummary, breathingCircuitSummary, mechanicalPulseFromState, stateSummary,
  waveformDescriptions, SHORTCUTS,
} from './accessibility';
import { promptFor, promptStillEligible, type Prompt } from '../tutor/guidance';
import { concentrationCsv } from './ConcentrationPanel';
import { findStacking } from '@anesthesia/debrief/analysis';
import { EXPLAINERS, getExplainer } from '@anesthesia/content/explainers';
import { getDrugCard } from '@anesthesia/content/drug-cards';
import type { DrugConcentration } from '@platform/kernel/protocol';
import type { RhythmId } from '@anesthesia/waveforms/types';
import type { SonificationEngine } from '@platform/audio/sonification';
import { ManualCrisisInjector } from './ManualCrisisInjector';
import { MaturityMarker } from '@platform/governance/MaturityMarker';
import type { ContentMaturity, MaturitySubjectKind } from '@platform/catalog/maturity';
import {
  TUTOR_INTRODUCTION_PREFERENCE, TutorIntroduction, TutorPromptCard,
} from './TutorRegion';

export interface CockpitProps {
  readonly scenario: Scenario;
  readonly region: RegionProfile;
  readonly audio: SonificationEngine;
  /** True while the scripted demonstration is driving the session. */
  readonly demonstrating?: boolean;
  /** Hand the session back to the learner, wherever the demonstration got to. */
  readonly onTakeControls?: (() => void) | undefined;
  readonly onEnd: () => void;
  readonly onReportSource?: () => void;
  readonly onSourceVisibilityChange?: (open: boolean) => void;
  readonly moduleId?: 'anesthesia' | 'emergency-medicine' | 'critical-care' | 'cardiology' | 'respiratory-medicine' | 'pediatrics' | 'neurology' | 'toxicology' | 'obstetrics' | 'neonatology' | 'endocrine-metabolic' | 'renal-electrolyte' | 'infectious-disease' | 'medical-surgical-nursing' | 'oncology';
}

export function depthConfidenceFor(
  concentrations: readonly Pick<DrugConcentration, 'drugId' | 'modelId'>[],
) {
  const propofol = concentrations.find((drug) => drug.drugId === 'propofol');
  return propofol?.modelId === 'propofol-paedfusor-2005'
    ? { label: 'Teaching model', kind: 'teaching' as const }
    : { label: 'Predicted', kind: 'default' as const };
}

export function monitorUnavailableParameters(
  equipmentInvalid: readonly string[],
  maternalArrest: boolean,
): ReadonlySet<string> {
  return new Set([
    ...equipmentInvalid,
    ...(maternalArrest ? ['meanArterialMmHg', 'spo2Percent', 'etco2MmHg'] : []),
  ]);
}

/** Download a file locally. No network request is made. */
function downloadLocal(filename: string, contents: string, type: string): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * What the tray shows before the first state message arrives. Both are module
 * constants rather than inline literals: a fresh object identity on every render
 * rebuilds the track configuration, which tears down and re-creates the sweep
 * renderer, which clears the canvas before a single trace is ever drawn.
 */
const DEFAULT_VENTILATOR = {
  mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 12,
  fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 1,
} as const;
const DEFAULT_AIRWAY = {
  intubated: false, attempts: 0, lastGrade: null, attemptInProgress: false, attemptSecondsRemaining: 0,
  patencyFraction: 1, postExtubationObstructionSeverity: 0,
  bronchospasmSeverity: 0, jawThrustCpapSecondsRemaining: 0,
  device: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
} as const;
const DEFAULT_HYPNOTIC_LINE = { connected: true, inspected: false } as const;
const DEFAULT_CAPNOGRAPHY_LINE = {
  obstructed: false, ventilationCrossChecked: false,
} as const;
const DEFAULT_ARTERIAL_LINE = {
  displayedMeanArterialMmHg: null, mislevelingCm: 0,
  dynamicResponse: 'normal', waveformAssessed: false, leveledAndZeroed: false,
  cuff: { status: 'idle', secondsRemaining: 0, meanArterialMmHg: null, measuredAtTick: null },
} as const;
const DEFAULT_BREATHING_CIRCUIT = {
  co2Absorbent: 'normal', inspiredCo2MmHg: 0,
  capnogramAssessed: false, absorbentReplaced: false,
} as const;
const DEFAULT_RESUSCITATION = {
  epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
  lastEpinephrineTick: null, crystalloidTotalMl: 0,
  hemorrhageActive: false,
  packedRedBloodCellUnits: 0, bloodProductTotalMl: 0,
  freshFrozenPlasmaUnits: 0,
  coagulationPanelReported: false,
  bloodProductsReleased: false,
  dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
  lastDantroleneTick: null, activeCooling: false,
  salbutamolTotalMg: 0, lastSalbutamolTick: null, bronchodilatorEffectFraction: 0,
  chestCompressionsActive: false,
  highSpinalFraction: 0, ephedrineTotalMg: 0, lastEphedrineTick: null,
  preeclampsiaBloodPressureChecks: 0, lastPreeclampsiaBloodPressure: null,
  labetalolTotalMg: 0, lastLabetalolTick: null, labetalolEffectFraction: 0,
  magnesiumSulfateTotalG: 0, lastMagnesiumSulfateTick: null,
  venousAirEmbolismFraction: 0, venousAirEntryControlled: false,
  venousAirEntryControlledAtTick: null,
} as const;

export function Cockpit({
  scenario, region, audio, demonstrating = false, onTakeControls, onEnd, onReportSource,
  onSourceVisibilityChange,
  moduleId = 'anesthesia',
}: CockpitProps) {
  const session = useSession();
  const reducedMotion = usePrefersReducedMotion();
  // The demonstration performs the same actions through the same path a learner
  // does, so what it shows is the engine and not a recording of it.
  const hypoglycemiaDemoSupported = supportsHypoglycemiaDemonstration(scenario);
  const adrenalDemoSupported = supportsAdrenalDemonstration(scenario);
  const thyroidDemoSupported = supportsThyroidDemonstration(scenario);
  const myxedemaDemoSupported = supportsMyxedemaDemonstration(scenario);
  const hypercalcemiaDemoSupported = supportsHypercalcemiaDemonstration(scenario);
  const hypocalcemiaDemoSupported = supportsHypocalcemiaDemonstration(scenario);
  const hyponatremiaCorrectionDemoSupported = supportsHyponatremiaCorrectionDemonstration(scenario);
  const avpDeficiencyDemoSupported = supportsAvpDeficiencyDemonstration(scenario);
  const refeedingDemoSupported = supportsRefeedingDemonstration(scenario);
  const perioperativeDiabetesDemoSupported = supportsPerioperativeDiabetesDemonstration(scenario);
  const renalHyperkalemiaDemoSupported = supportsRenalHyperkalemiaDemonstration(scenario);
  const renalHypokalemiaDemoSupported = supportsRenalHypokalemiaDemonstration(scenario);
  const renalHyponatremiaDemoSupported = supportsRenalHyponatremiaDemonstration(scenario);
  const delayedImmuneEventDemoSupported = supportsDelayedImmuneEventDemonstration(scenario);
  const incidentalClotDemoSupported = supportsIncidentalClotDemonstration(scenario);
  const normalTestToxicityDemoSupported = supportsNormalTestToxicityDemonstration(scenario);
  const prognosisQuestionDemoSupported = supportsPrognosisQuestionDemonstration(scenario);
  const laboratoryTlsDemoSupported = supportsLaboratoryTlsDemonstration(scenario);
  const rareEarlyMyocarditisDemoSupported = supportsRareEarlyMyocarditisDemonstration(scenario);
  const loweringTheCountDemoSupported = supportsLoweringTheCountDemonstration(scenario);
  const inheritedUrgencyDemoSupported = supportsInheritedUrgencyDemonstration(scenario);
  const trialRuleDemoSupported = supportsTrialRuleDemonstration(scenario);
  const silentInteractionDemoSupported = supportsSilentInteractionDemonstration(scenario);
  const easyLabelDemoSupported = supportsEasyLabelDemonstration(scenario);
  const lowScoreDemoSupported = supportsLowScoreDemonstration(scenario);
  const countedRateDemoSupported = supportsCountedRateDemonstration(scenario);
  const pairedReadingDemoSupported = supportsPairedReadingDemonstration(scenario);
  const afferentLimbDemoSupported = supportsAfferentLimbDemonstration(scenario);
  const quietPatientDemoSupported = supportsQuietPatientDemonstration(scenario);
  const proxyScaleDemoSupported = supportsProxyScaleDemonstration(scenario);
  const lastKnownWellDemoSupported = supportsLastKnownWellDemonstration(scenario);
  const oxygenTargetScaleDemoSupported = supportsOxygenTargetScaleDemonstration(scenario);
  const lostContingencyDemoSupported = supportsLostContingencyDemonstration(scenario);
  const meningococcalSepsisDemoSupported = supportsMeningococcalSepsisDemonstration(scenario);
  const obstructedKidneyDemoSupported = supportsObstructedKidneyDemonstration(scenario);
  const febrileNeutropeniaDemoSupported = supportsFebrileNeutropeniaDemonstration(scenario);
  const necrotizingInfectionDemoSupported = supportsNecrotizingInfectionDemonstration(scenario);
  const endocarditisHeartFailureDemoSupported = supportsEndocarditisHeartFailureDemonstration(scenario);
  const severePneumoniaDemoSupported = supportsSeverePneumoniaDemonstration(scenario);
  const toxicShockDemoSupported = supportsToxicShockDemonstration(scenario);
  const possibleSepsisDemoSupported = supportsPossibleSepsisDemonstration(scenario);
  const septicShockLabelDemoSupported = supportsSepticShockLabelDemonstration(scenario);
  const meningitisImagingDemoSupported = supportsMeningitisImagingDemonstration(scenario);
  const nicuHandoffDemoSupported = supportsNicuHandoffDemonstration(scenario);
  const thermoregulationDemoSupported = supportsThermoregulationDemonstration(scenario);
  const neonatalSepsisDemoSupported = supportsNeonatalSepsisDemonstration(scenario);
  const neonatalHypoglycemiaDemoSupported = supportsNeonatalHypoglycemiaDemonstration(scenario);
  const pretermRespiratoryDemoSupported = supportsPretermRespiratoryDistressDemonstration(scenario);
  const meconiumTransitionDemoSupported = supportsMeconiumTransitionDemonstration(scenario);
  const neonatalBradycardiaDemoSupported = supportsNeonatalBradycardiaDemonstration(scenario);
  const ineffectiveVentilationDemoSupported = supportsIneffectiveVentilationDemonstration(scenario);
  const neonatalApneaDemoSupported = supportsNeonatalApneaDemonstration(scenario);
  const termTransitionDemoSupported = supportsTermTransitionDemonstration(scenario);
  const tensionPneumothoraxDemoSupported = supportsTensionPneumothoraxDemonstration(scenario);
  const methemoglobinemiaDemoSupported = supportsMethemoglobinemiaDemonstration(scenario);
  const carbonMonoxideDemoSupported = supportsCarbonMonoxideDemonstration(scenario);
  const acetaminophenDemoSupported = supportsAcetaminophenDemonstration(scenario);
  const salicylateDemoSupported = supportsSalicylateDemonstration(scenario);
  const tricyclicDemoSupported = supportsTricyclicDemonstration(scenario);
  const betaBlockerDemoSupported = supportsBetaBlockerDemonstration(scenario);
  const calciumChannelBlockerDemoSupported = supportsCalciumChannelBlockerDemonstration(scenario);
  const digoxinDemoSupported = supportsDigoxinDemonstration(scenario);
  const cholinergicDemoSupported = supportsCholinergicDemonstration(scenario);
  const anticholinergicDemoSupported = supportsAnticholinergicDemonstration(scenario);
  const serotoninDemoSupported = supportsSerotoninDemonstration(scenario);
  const sympathomimeticDemoSupported = supportsSympathomimeticDemonstration(scenario);
  const methanolDemoSupported = supportsMethanolDemonstration(scenario);
  const delayedLastDemoSupported = supportsDelayedLastDemonstration(scenario);
  const opioidXylazineDemoSupported = supportsOpioidXylazineDemonstration(scenario);
  const minorStrokeDemoSupported = supportsMinorStrokeDemonstration(scenario);
  const basilarLvoDemoSupported = supportsBasilarLvoDemonstration(scenario);
  const cerebellarIchDemoSupported = supportsCerebellarIchDemonstration(scenario);
  const asahDemoSupported = supportsAsahDemonstration(scenario);
  const focalMotorStatusDemoSupported = supportsFocalMotorStatusDemonstration(scenario);
  const ncseDemoSupported = supportsNcseDemonstration(scenario);
  const myastheniaDemoSupported = supportsMyastheniaDemonstration(scenario);
  const gbsDemoSupported = supportsGbsDemonstration(scenario);
  const meningitisDemoSupported = supportsMeningitisDemonstration(scenario);
  const encephalitisDemoSupported = supportsEncephalitisDemonstration(scenario);
  const raisedIcpDemoSupported = supportsRaisedIcpDemonstration(scenario);
  const herniationDemoSupported = supportsHerniationDemonstration(scenario);
  const msccDemoSupported = supportsMsccDemonstration(scenario);
  const deliriumDemoSupported = supportsDeliriumDemonstration(scenario);
  const dysreflexiaDemoSupported = supportsDysreflexiaDemonstration(scenario);
  const atonyDemoSupported = supportsAtonyDemonstration(scenario);
  const maternalSepsisDemoSupported = supportsMaternalSepsisDemonstration(scenario);
  const concealedAbruptionDemoSupported = supportsConcealedAbruptionDemonstration(scenario);
  const postpartumPreeclampsiaDemoSupported = supportsPostpartumPreeclampsiaDemonstration(scenario);
  const eclampsiaDemoSupported = supportsEclampsiaDemonstration(scenario);
  const afeDemoSupported = supportsAfeDemonstration(scenario);
  const maternalArrestDemoSupported = supportsMaternalArrestDemonstration(scenario);
  const shoulderDystociaDemoSupported = supportsShoulderDystociaDemonstration(scenario);
  const cordProlapseDemoSupported = supportsCordProlapseDemonstration(scenario);
  const uterineRuptureDemoSupported = supportsUterineRuptureDemonstration(scenario);
  const magnesiumToxicityDemoSupported = supportsMagnesiumToxicityDemonstration(scenario);
  const highNeuraxialDemoSupported = supportsHighNeuraxialDemonstration(scenario);
  const failedIntubationDemoSupported = supportsFailedIntubationDemonstration(scenario);
  const maternalNeonatalHandoffDemoSupported = supportsMaternalNeonatalHandoffDemonstration(scenario);
  const oxytocinTachysystoleDemoSupported = supportsOxytocinTachysystoleDemonstration(scenario);
  const acuteSevereAsthmaDemoSupported = supportsAcuteSevereAsthmaDemonstration(scenario);
  const copdTransitionDemoSupported = supportsCopdTransitionDemonstration(scenario);
  const capHypoxemiaDemoSupported = supportsCapHypoxemiaDemonstration(scenario);
  const postPeDyspneaDemoSupported = supportsPostPeDyspneaDemonstration(scenario);
  const apeSupportDemoSupported = supportsApeSupportDemonstration(scenario);
  const postTensionPneumothoraxDemoSupported = supportsPostTensionPneumothoraxDemonstration(scenario);
  const dkaResolutionDemoSupported = supportsDkaResolutionDemonstration(scenario);
  const hhsOsmolalityDemoSupported = supportsHhsOsmolalityDemonstration(scenario);
  const renalHypernatremiaDemoSupported = supportsRenalHypernatremiaDemonstration(scenario);
  const renalHypocalcemiaDemoSupported = supportsRenalHypocalcemiaDemonstration(scenario);
  const renalHypermagnesemiaDemoSupported = supportsRenalHypermagnesemiaDemonstration(scenario);

  /**
   * The two facts the rest of this component keeps asking about, named once.
   *
   * These were fourteen and eighteen flags spelled out inline at five sites, so
   * every scenario shipping its own tutor and example had to be added to all five
   * by hand. That is a machine's job done by a person, and it has already gone
   * wrong twice in this file: once inserting the same clause into a chain twice,
   * once matching a fourth site that a previous edit had created. `tsc` accepts a
   * repeated `&& !x && !x` without complaint, so the typechecker is no help here.
   *
   * The sets are unchanged. `observedStateDemoSupported` is exactly the fourteen
   * that four of the sites already shared, and `scenarioDemoSupported` adds the
   * four older lessons that only the induction-demonstration guard excluded.
   */
  const observedStateDemoSupported = hypercalcemiaDemoSupported || hypocalcemiaDemoSupported || hyponatremiaCorrectionDemoSupported || avpDeficiencyDemoSupported || refeedingDemoSupported || perioperativeDiabetesDemoSupported || renalHyperkalemiaDemoSupported || renalHypokalemiaDemoSupported || renalHyponatremiaDemoSupported || renalHypernatremiaDemoSupported || renalHypocalcemiaDemoSupported || renalHypermagnesemiaDemoSupported || delayedImmuneEventDemoSupported || incidentalClotDemoSupported
    || normalTestToxicityDemoSupported || prognosisQuestionDemoSupported
    || laboratoryTlsDemoSupported || rareEarlyMyocarditisDemoSupported
    || loweringTheCountDemoSupported || inheritedUrgencyDemoSupported
    || trialRuleDemoSupported || silentInteractionDemoSupported || easyLabelDemoSupported
    || dkaResolutionDemoSupported || hhsOsmolalityDemoSupported || lowScoreDemoSupported || countedRateDemoSupported || pairedReadingDemoSupported || afferentLimbDemoSupported || quietPatientDemoSupported || proxyScaleDemoSupported || lastKnownWellDemoSupported || oxygenTargetScaleDemoSupported || lostContingencyDemoSupported
    || meningococcalSepsisDemoSupported || obstructedKidneyDemoSupported
    || febrileNeutropeniaDemoSupported
    || necrotizingInfectionDemoSupported
    || endocarditisHeartFailureDemoSupported
    || severePneumoniaDemoSupported
    || toxicShockDemoSupported
    || possibleSepsisDemoSupported
    || septicShockLabelDemoSupported
    || meningitisImagingDemoSupported
    || tensionPneumothoraxDemoSupported
    || methemoglobinemiaDemoSupported
    || carbonMonoxideDemoSupported
    || acetaminophenDemoSupported
    || salicylateDemoSupported
    || tricyclicDemoSupported
    || betaBlockerDemoSupported
    || calciumChannelBlockerDemoSupported
    || digoxinDemoSupported
    || cholinergicDemoSupported
    || anticholinergicDemoSupported
    || serotoninDemoSupported
    || sympathomimeticDemoSupported
    || methanolDemoSupported
    || delayedLastDemoSupported
    || opioidXylazineDemoSupported
    || minorStrokeDemoSupported
    || basilarLvoDemoSupported
    || cerebellarIchDemoSupported
    || asahDemoSupported
    || focalMotorStatusDemoSupported
    || ncseDemoSupported
    || myastheniaDemoSupported
    || gbsDemoSupported
    || meningitisDemoSupported
    || encephalitisDemoSupported
    || raisedIcpDemoSupported
    || herniationDemoSupported
    || msccDemoSupported
    || deliriumDemoSupported
    || dysreflexiaDemoSupported
    || atonyDemoSupported
    || maternalSepsisDemoSupported
    || concealedAbruptionDemoSupported
    || postpartumPreeclampsiaDemoSupported
    || eclampsiaDemoSupported
    || afeDemoSupported
    || maternalArrestDemoSupported
    || shoulderDystociaDemoSupported
    || cordProlapseDemoSupported
    || uterineRuptureDemoSupported
    || magnesiumToxicityDemoSupported
    || highNeuraxialDemoSupported
    || failedIntubationDemoSupported
    || maternalNeonatalHandoffDemoSupported
    || oxytocinTachysystoleDemoSupported
    || acuteSevereAsthmaDemoSupported
    || copdTransitionDemoSupported
    || capHypoxemiaDemoSupported
    || postPeDyspneaDemoSupported
    || apeSupportDemoSupported
    || postTensionPneumothoraxDemoSupported
    || termTransitionDemoSupported
    || neonatalApneaDemoSupported
    || ineffectiveVentilationDemoSupported
    || neonatalBradycardiaDemoSupported
    || meconiumTransitionDemoSupported
    || pretermRespiratoryDemoSupported
    || neonatalHypoglycemiaDemoSupported
    || neonatalSepsisDemoSupported
    || thermoregulationDemoSupported
    || nicuHandoffDemoSupported;
  const scenarioDemoSupported = hypoglycemiaDemoSupported || adrenalDemoSupported
    || thyroidDemoSupported || myxedemaDemoSupported || observedStateDemoSupported;
  const inductionDemonstration = useDemonstration({
    active: demonstrating && !scenarioDemoSupported,
    tick: session.tick,
    act: session.act,
    onFinished: () => onTakeControls?.(),
  });
  const hypoglycemiaDemonstration = useHypoglycemiaDemonstration({
    active: demonstrating && hypoglycemiaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.severeHypoglycemia,
    pause: session.pause, play: session.play,
    act: session.act, onFinished: () => onTakeControls?.(),
  });
  const adrenalDemonstration = useAdrenalDemonstration({
    active: demonstrating && adrenalDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.adrenalCrisis,
    pause: session.pause, play: session.play,
    act: session.act, onFinished: () => onTakeControls?.(),
  });
  const thyroidDemonstration = useThyroidDemonstration({
    active: demonstrating && thyroidDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.thyroidStorm,
    pause: session.pause, play: session.play,
    act: session.act, onFinished: () => onTakeControls?.(),
  });
  const myxedemaDemonstration = useMyxedemaDemonstration({
    active: demonstrating && myxedemaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.myxedema,
    pause: session.pause, play: session.play,
    act: session.act, onFinished: () => onTakeControls?.(),
  });
  const hypercalcemiaDemonstration = useHypercalcemiaDemonstration({
    active: demonstrating && hypercalcemiaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.hypercalcemia,
    pause: session.pause, play: session.play,
    act: session.act, onFinished: () => onTakeControls?.(),
  });
  const hypocalcemiaDemonstration = useHypocalcemiaDemonstration({
    active: demonstrating && hypocalcemiaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.hypocalcemia,
    pause: session.pause, play: session.play,
    act: session.act, onFinished: () => onTakeControls?.(),
  });
  const hyponatremiaCorrectionDemonstration = useHyponatremiaCorrectionDemonstration({
    active: demonstrating && hyponatremiaCorrectionDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.hyponatremiaCorrection,
    pause: session.pause, play: session.play,
    act: session.act, onFinished: () => onTakeControls?.(),
  });
  const avpDeficiencyDemonstration = useAvpDeficiencyDemonstration({
    active: demonstrating && avpDeficiencyDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.avpDeficiency,
    pause: session.pause, play: session.play,
    act: session.act, onFinished: () => onTakeControls?.(),
  });
  const refeedingDemonstration = useRefeedingDemonstration({
    active: demonstrating && refeedingDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.refeeding,
    pause: session.pause, play: session.play,
    act: session.act, onFinished: () => onTakeControls?.(),
  });
  const perioperativeDiabetesDemonstration = usePerioperativeDiabetesDemonstration({
    active: demonstrating && perioperativeDiabetesDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.perioperativeDiabetes,
    pause: session.pause, play: session.play,
    act: session.act, onFinished: () => onTakeControls?.(),
  });
  const renalHyperkalemiaDemonstration = useRenalHyperkalemiaDemonstration({
    active: demonstrating && renalHyperkalemiaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.renalHyperkalemia,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const renalHypokalemiaDemonstration = useRenalHypokalemiaDemonstration({
    active: demonstrating && renalHypokalemiaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.renalHypokalemia,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const renalHyponatremiaDemonstration = useRenalHyponatremiaDemonstration({
    active: demonstrating && renalHyponatremiaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.renalHyponatremia,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const nicuHandoffDemonstration = useNicuHandoffDemonstration({
    active: demonstrating && nicuHandoffDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neonatologyNicuHandoffAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const thermoregulationDemonstration = useThermoregulationDemonstration({
    active: demonstrating && thermoregulationDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neonatologyThermoregulationAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const neonatalSepsisDemonstration = useNeonatalSepsisDemonstration({
    active: demonstrating && neonatalSepsisDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neonatologySepsisAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const neonatalHypoglycemiaDemonstration = useNeonatalHypoglycemiaDemonstration({
    active: demonstrating && neonatalHypoglycemiaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neonatologyHypoglycemiaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const pretermRespiratoryDemonstration = usePretermRespiratoryDistressDemonstration({
    active: demonstrating && pretermRespiratoryDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neonatologyPretermRespiratoryDistressAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const meconiumTransitionDemonstration = useMeconiumTransitionDemonstration({
    active: demonstrating && meconiumTransitionDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neonatologyMeconiumTransitionAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const neonatalBradycardiaDemonstration = useNeonatalBradycardiaDemonstration({
    active: demonstrating && neonatalBradycardiaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neonatologyBradycardiaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const ineffectiveVentilationDemonstration = useIneffectiveVentilationDemonstration({
    active: demonstrating && ineffectiveVentilationDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neonatologyIneffectiveVentilationAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const neonatalApneaDemonstration = useNeonatalApneaDemonstration({
    active: demonstrating && neonatalApneaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neonatologyApneaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const termTransitionDemonstration = useTermTransitionDemonstration({
    active: demonstrating && termTransitionDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neonatologyTermTransitionAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const postTensionPneumothoraxDemonstration = usePostTensionPneumothoraxDemonstration({
    active: demonstrating && postTensionPneumothoraxDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.postTensionPneumothoraxAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const apeSupportDemonstration = useApeSupportDemonstration({
    active: demonstrating && apeSupportDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.apeSupportAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const postPeDyspneaDemonstration = usePostPeDyspneaDemonstration({
    active: demonstrating && postPeDyspneaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.postPeDyspneaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const capHypoxemiaDemonstration = useCapHypoxemiaDemonstration({
    active: demonstrating && capHypoxemiaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.capHypoxemiaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const copdTransitionDemonstration = useCopdTransitionDemonstration({
    active: demonstrating && copdTransitionDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.copdTransitionAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const acuteSevereAsthmaDemonstration = useAcuteSevereAsthmaDemonstration({
    active: demonstrating && acuteSevereAsthmaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.acuteSevereAsthmaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const oxytocinTachysystoleDemonstration = useOxytocinTachysystoleDemonstration({
    active: demonstrating && oxytocinTachysystoleDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsOxytocinTachysystoleAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const maternalNeonatalHandoffDemonstration = useMaternalNeonatalHandoffDemonstration({
    active: demonstrating && maternalNeonatalHandoffDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsMaternalNeonatalHandoffAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const failedIntubationDemonstration = useFailedIntubationDemonstration({
    active: demonstrating && failedIntubationDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsFailedIntubationAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const highNeuraxialDemonstration = useHighNeuraxialDemonstration({
    active: demonstrating && highNeuraxialDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsHighNeuraxialAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const magnesiumToxicityDemonstration = useMagnesiumToxicityDemonstration({
    active: demonstrating && magnesiumToxicityDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsMagnesiumToxicityAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const uterineRuptureDemonstration = useUterineRuptureDemonstration({
    active: demonstrating && uterineRuptureDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsUterineRuptureAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const cordProlapseDemonstration = useCordProlapseDemonstration({
    active: demonstrating && cordProlapseDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsCordProlapseAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const shoulderDystociaDemonstration = useShoulderDystociaDemonstration({
    active: demonstrating && shoulderDystociaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsShoulderDystociaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const maternalArrestDemonstration = useMaternalArrestDemonstration({
    active: demonstrating && maternalArrestDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsMaternalArrestAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const afeDemonstration = useAfeDemonstration({
    active: demonstrating && afeDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsAfeAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const eclampsiaDemonstration = useEclampsiaDemonstration({
    active: demonstrating && eclampsiaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsEclampsiaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const postpartumPreeclampsiaDemonstration = usePostpartumPreeclampsiaDemonstration({
    active: demonstrating && postpartumPreeclampsiaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsPostpartumPreeclampsiaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const concealedAbruptionDemonstration = useConcealedAbruptionDemonstration({
    active: demonstrating && concealedAbruptionDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsConcealedAbruptionAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const maternalSepsisDemonstration = useMaternalSepsisDemonstration({
    active: demonstrating && maternalSepsisDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsMaternalSepsisAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const atonyDemonstration = useAtonyDemonstration({
    active: demonstrating && atonyDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.obstetricsAtonyAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const dysreflexiaDemonstration = useDysreflexiaDemonstration({
    active: demonstrating && dysreflexiaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyAutonomicDysreflexiaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const deliriumDemonstration = useDeliriumDemonstration({
    active: demonstrating && deliriumDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyDeliriumAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const msccDemonstration = useMsccDemonstration({
    active: demonstrating && msccDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyMsccAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const herniationDemonstration = useHerniationDemonstration({
    active: demonstrating && herniationDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyHerniationAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const raisedIcpDemonstration = useRaisedIcpDemonstration({
    active: demonstrating && raisedIcpDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyRaisedIcpAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const encephalitisDemonstration = useEncephalitisDemonstration({
    active: demonstrating && encephalitisDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyEncephalitisAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const meningitisDemonstration = useMeningitisDemonstration({
    active: demonstrating && meningitisDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyMeningitisAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const gbsDemonstration = useGbsDemonstration({
    active: demonstrating && gbsDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyGbsAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const myastheniaDemonstration = useMyastheniaDemonstration({
    active: demonstrating && myastheniaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyMyasthenicCrisisAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const ncseDemonstration = useNcseDemonstration({
    active: demonstrating && ncseDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyNcseAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const focalMotorStatusDemonstration = useFocalMotorStatusDemonstration({
    active: demonstrating && focalMotorStatusDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyFocalMotorStatusAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const asahDemonstration = useAsahDemonstration({
    active: demonstrating && asahDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyAsahAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const cerebellarIchDemonstration = useCerebellarIchDemonstration({
    active: demonstrating && cerebellarIchDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyCerebellarIchAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const basilarLvoDemonstration = useBasilarLvoDemonstration({
    active: demonstrating && basilarLvoDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyBasilarLvoAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const minorStrokeDemonstration = useMinorStrokeDemonstration({
    active: demonstrating && minorStrokeDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neurologyMinorStrokeAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const opioidXylazineDemonstration = useOpioidXylazineDemonstration({
    active: demonstrating && opioidXylazineDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyOpioidXylazineAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const delayedLastDemonstration = useDelayedLastDemonstration({
    active: demonstrating && delayedLastDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyDelayedLastAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const methanolDemonstration = useMethanolDemonstration({
    active: demonstrating && methanolDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyMethanolAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const sympathomimeticDemonstration = useSympathomimeticDemonstration({
    active: demonstrating && sympathomimeticDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologySympathomimeticAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const serotoninDemonstration = useSerotoninDemonstration({
    active: demonstrating && serotoninDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologySerotoninAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const anticholinergicDemonstration = useAnticholinergicDemonstration({
    active: demonstrating && anticholinergicDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyAnticholinergicAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const cholinergicDemonstration = useCholinergicDemonstration({
    active: demonstrating && cholinergicDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyCholinergicAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const digoxinDemonstration = useDigoxinDemonstration({
    active: demonstrating && digoxinDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyDigoxinAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const calciumChannelBlockerDemonstration = useCalciumChannelBlockerDemonstration({
    active: demonstrating && calciumChannelBlockerDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyCalciumChannelBlockerAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const betaBlockerDemonstration = useBetaBlockerDemonstration({
    active: demonstrating && betaBlockerDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyBetaBlockerAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const tricyclicDemonstration = useTricyclicDemonstration({
    active: demonstrating && tricyclicDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyTricyclicAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const salicylateDemonstration = useSalicylateDemonstration({
    active: demonstrating && salicylateDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologySalicylateAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const acetaminophenDemonstration = useAcetaminophenDemonstration({
    active: demonstrating && acetaminophenDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyAcetaminophenAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const carbonMonoxideDemonstration = useCarbonMonoxideDemonstration({
    active: demonstrating && carbonMonoxideDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyCarbonMonoxideAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const methemoglobinemiaDemonstration = useMethemoglobinemiaDemonstration({
    active: demonstrating && methemoglobinemiaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.toxicologyMethemoglobinemiaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const tensionPneumothoraxDemonstration = useTensionPneumothoraxDemonstration({
    active: demonstrating && tensionPneumothoraxDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.neonatologyTensionPneumothoraxAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const meningitisImagingDemonstration = useMeningitisImagingDemonstration({
    active: demonstrating && meningitisImagingDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.meningitisImaging,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const septicShockLabelDemonstration = useSepticShockLabelDemonstration({
    active: demonstrating && septicShockLabelDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.septicShockLabel,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const possibleSepsisDemonstration = usePossibleSepsisDemonstration({
    active: demonstrating && possibleSepsisDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.possibleSepsis,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const toxicShockDemonstration = useToxicShockDemonstration({
    active: demonstrating && toxicShockDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.toxicShock,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const severePneumoniaDemonstration = useSeverePneumoniaDemonstration({
    active: demonstrating && severePneumoniaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.severePneumonia,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const endocarditisHeartFailureDemonstration = useEndocarditisHeartFailureDemonstration({
    active: demonstrating && endocarditisHeartFailureDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.endocarditisHeartFailure,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const necrotizingInfectionDemonstration = useNecrotizingInfectionDemonstration({
    active: demonstrating && necrotizingInfectionDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.necrotizingInfection,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const febrileNeutropeniaDemonstration = useFebrileNeutropeniaDemonstration({
    active: demonstrating && febrileNeutropeniaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.febrileNeutropenia,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const obstructedKidneyDemonstration = useObstructedKidneyDemonstration({
    active: demonstrating && obstructedKidneyDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.obstructedKidney,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const meningococcalSepsisDemonstration = useMeningococcalSepsisDemonstration({
    active: demonstrating && meningococcalSepsisDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.meningococcalSepsis,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const lostContingencyDemonstration = useLostContingencyDemonstration({
    active: demonstrating && lostContingencyDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.lostContingency,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const oxygenTargetScaleDemonstration = useOxygenTargetScaleDemonstration({
    active: demonstrating && oxygenTargetScaleDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.oxygenTargetScale,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const lastKnownWellDemonstration = useLastKnownWellDemonstration({
    active: demonstrating && lastKnownWellDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.lastKnownWell,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const proxyScaleDemonstration = useProxyScaleDemonstration({
    active: demonstrating && proxyScaleDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.proxyScale,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const quietPatientDemonstration = useQuietPatientDemonstration({
    active: demonstrating && quietPatientDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.quietPatient,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const afferentLimbDemonstration = useAfferentLimbDemonstration({
    active: demonstrating && afferentLimbDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.afferentLimb,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const pairedReadingDemonstration = usePairedReadingDemonstration({
    active: demonstrating && pairedReadingDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.pairedReading,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const countedRateDemonstration = useCountedRateDemonstration({
    active: demonstrating && countedRateDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.countedRate,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const lowScoreDemonstration = useLowScoreDemonstration({
    active: demonstrating && lowScoreDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.lowScore,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const hhsOsmolalityDemonstration = useHhsOsmolalityDemonstration({
    active: demonstrating && hhsOsmolalityDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.endocrineHhsAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const dkaResolutionDemonstration = useDkaResolutionDemonstration({
    active: demonstrating && dkaResolutionDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.endocrineDkaResolutionAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const easyLabelDemonstration = useEasyLabelDemonstration({
    active: demonstrating && easyLabelDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.easyLabel,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const silentInteractionDemonstration = useSilentInteractionDemonstration({
    active: demonstrating && silentInteractionDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.silentInteraction,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const trialRuleDemonstration = useTrialRuleDemonstration({
    active: demonstrating && trialRuleDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.trialRule,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const inheritedUrgencyDemonstration = useInheritedUrgencyDemonstration({
    active: demonstrating && inheritedUrgencyDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.inheritedUrgency,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const loweringTheCountDemonstration = useLoweringTheCountDemonstration({
    active: demonstrating && loweringTheCountDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.loweringTheCount,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const rareEarlyMyocarditisDemonstration = useRareEarlyMyocarditisDemonstration({
    active: demonstrating && rareEarlyMyocarditisDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.rareEarlyMyocarditis,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const laboratoryTlsDemonstration = useLaboratoryTlsDemonstration({
    active: demonstrating && laboratoryTlsDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.laboratoryTls,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const prognosisQuestionDemonstration = usePrognosisQuestionDemonstration({
    active: demonstrating && prognosisQuestionDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.prognosisQuestion,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const normalTestToxicityDemonstration = useNormalTestToxicityDemonstration({
    active: demonstrating && normalTestToxicityDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.normalTestToxicity,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const incidentalClotDemonstration = useIncidentalClotDemonstration({
    active: demonstrating && incidentalClotDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.incidentalClot,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const delayedImmuneEventDemonstration = useDelayedImmuneEventDemonstration({
    active: demonstrating && delayedImmuneEventDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.delayedImmuneEvent,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const renalHypernatremiaDemonstration = useRenalHypernatremiaDemonstration({
    active: demonstrating && renalHypernatremiaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.renalHypernatremia,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const renalHypocalcemiaDemonstration = useRenalHypocalcemiaDemonstration({
    active: demonstrating && renalHypocalcemiaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.renalHypocalcemia,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const renalHypermagnesemiaDemonstration = useRenalHypermagnesemiaDemonstration({
    active: demonstrating && renalHypermagnesemiaDemoSupported,
    running: session.transport === 'running', patient: session.equipment?.resuscitation.renalHypermagnesemia,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const demonstration = nicuHandoffDemoSupported ? nicuHandoffDemonstration
    : thermoregulationDemoSupported ? thermoregulationDemonstration
    : neonatalSepsisDemoSupported ? neonatalSepsisDemonstration
    : neonatalHypoglycemiaDemoSupported ? neonatalHypoglycemiaDemonstration
    : pretermRespiratoryDemoSupported ? pretermRespiratoryDemonstration
    : meconiumTransitionDemoSupported ? meconiumTransitionDemonstration
    : neonatalBradycardiaDemoSupported ? neonatalBradycardiaDemonstration
    : ineffectiveVentilationDemoSupported ? ineffectiveVentilationDemonstration
    : neonatalApneaDemoSupported ? neonatalApneaDemonstration
    : termTransitionDemoSupported ? termTransitionDemonstration
    : postTensionPneumothoraxDemoSupported ? postTensionPneumothoraxDemonstration
    : apeSupportDemoSupported ? apeSupportDemonstration
    : postPeDyspneaDemoSupported ? postPeDyspneaDemonstration
    : capHypoxemiaDemoSupported ? capHypoxemiaDemonstration
    : copdTransitionDemoSupported ? copdTransitionDemonstration
    : acuteSevereAsthmaDemoSupported ? acuteSevereAsthmaDemonstration
    : oxytocinTachysystoleDemoSupported ? oxytocinTachysystoleDemonstration
    : maternalNeonatalHandoffDemoSupported ? maternalNeonatalHandoffDemonstration
    : failedIntubationDemoSupported ? failedIntubationDemonstration
    : highNeuraxialDemoSupported ? highNeuraxialDemonstration
    : magnesiumToxicityDemoSupported ? magnesiumToxicityDemonstration
    : uterineRuptureDemoSupported ? uterineRuptureDemonstration
    : cordProlapseDemoSupported ? cordProlapseDemonstration
    : shoulderDystociaDemoSupported ? shoulderDystociaDemonstration
    : maternalArrestDemoSupported ? maternalArrestDemonstration
    : afeDemoSupported ? afeDemonstration
    : eclampsiaDemoSupported ? eclampsiaDemonstration
    : postpartumPreeclampsiaDemoSupported ? postpartumPreeclampsiaDemonstration
    : concealedAbruptionDemoSupported ? concealedAbruptionDemonstration
    : maternalSepsisDemoSupported ? maternalSepsisDemonstration
    : atonyDemoSupported ? atonyDemonstration
    : dysreflexiaDemoSupported ? dysreflexiaDemonstration
    : deliriumDemoSupported ? deliriumDemonstration
    : msccDemoSupported ? msccDemonstration
    : herniationDemoSupported ? herniationDemonstration
    : raisedIcpDemoSupported ? raisedIcpDemonstration
    : encephalitisDemoSupported ? encephalitisDemonstration
    : meningitisDemoSupported ? meningitisDemonstration
    : gbsDemoSupported ? gbsDemonstration
    : myastheniaDemoSupported ? myastheniaDemonstration
    : ncseDemoSupported ? ncseDemonstration
    : focalMotorStatusDemoSupported ? focalMotorStatusDemonstration
    : asahDemoSupported ? asahDemonstration
    : cerebellarIchDemoSupported ? cerebellarIchDemonstration
    : basilarLvoDemoSupported ? basilarLvoDemonstration
    : minorStrokeDemoSupported ? minorStrokeDemonstration
    : opioidXylazineDemoSupported ? opioidXylazineDemonstration
    : delayedLastDemoSupported ? delayedLastDemonstration
    : methanolDemoSupported ? methanolDemonstration
    : sympathomimeticDemoSupported ? sympathomimeticDemonstration
    : serotoninDemoSupported ? serotoninDemonstration
    : anticholinergicDemoSupported ? anticholinergicDemonstration
    : cholinergicDemoSupported ? cholinergicDemonstration
    : digoxinDemoSupported ? digoxinDemonstration
    : calciumChannelBlockerDemoSupported ? calciumChannelBlockerDemonstration
    : betaBlockerDemoSupported ? betaBlockerDemonstration
    : tricyclicDemoSupported ? tricyclicDemonstration
    : salicylateDemoSupported ? salicylateDemonstration
    : acetaminophenDemoSupported ? acetaminophenDemonstration
    : carbonMonoxideDemoSupported ? carbonMonoxideDemonstration
    : methemoglobinemiaDemoSupported ? methemoglobinemiaDemonstration
    : tensionPneumothoraxDemoSupported ? tensionPneumothoraxDemonstration
    : meningitisImagingDemoSupported ? meningitisImagingDemonstration
    : septicShockLabelDemoSupported ? septicShockLabelDemonstration
    : possibleSepsisDemoSupported ? possibleSepsisDemonstration
    : toxicShockDemoSupported ? toxicShockDemonstration
    : severePneumoniaDemoSupported ? severePneumoniaDemonstration
    : endocarditisHeartFailureDemoSupported ? endocarditisHeartFailureDemonstration
    : necrotizingInfectionDemoSupported ? necrotizingInfectionDemonstration
    : febrileNeutropeniaDemoSupported ? febrileNeutropeniaDemonstration
    : obstructedKidneyDemoSupported ? obstructedKidneyDemonstration
    : meningococcalSepsisDemoSupported ? meningococcalSepsisDemonstration
    : lostContingencyDemoSupported ? lostContingencyDemonstration
    : oxygenTargetScaleDemoSupported ? oxygenTargetScaleDemonstration
    : lastKnownWellDemoSupported ? lastKnownWellDemonstration
    : proxyScaleDemoSupported ? proxyScaleDemonstration
    : quietPatientDemoSupported ? quietPatientDemonstration
    : afferentLimbDemoSupported ? afferentLimbDemonstration
    : pairedReadingDemoSupported ? pairedReadingDemonstration
    : countedRateDemoSupported ? countedRateDemonstration
    : lowScoreDemoSupported ? lowScoreDemonstration
    : hhsOsmolalityDemoSupported ? hhsOsmolalityDemonstration
    : dkaResolutionDemoSupported ? dkaResolutionDemonstration
    : easyLabelDemoSupported ? easyLabelDemonstration
    : silentInteractionDemoSupported ? silentInteractionDemonstration
    : trialRuleDemoSupported ? trialRuleDemonstration
    : inheritedUrgencyDemoSupported ? inheritedUrgencyDemonstration
    : loweringTheCountDemoSupported ? loweringTheCountDemonstration
    : rareEarlyMyocarditisDemoSupported ? rareEarlyMyocarditisDemonstration
    : laboratoryTlsDemoSupported ? laboratoryTlsDemonstration
    : prognosisQuestionDemoSupported ? prognosisQuestionDemonstration
    : normalTestToxicityDemoSupported ? normalTestToxicityDemonstration
    : incidentalClotDemoSupported ? incidentalClotDemonstration
    : delayedImmuneEventDemoSupported ? delayedImmuneEventDemonstration
    : renalHypermagnesemiaDemoSupported ? renalHypermagnesemiaDemonstration
    : renalHypocalcemiaDemoSupported ? renalHypocalcemiaDemonstration
    : renalHypernatremiaDemoSupported ? renalHypernatremiaDemonstration
    : renalHyponatremiaDemoSupported ? renalHyponatremiaDemonstration
    : renalHypokalemiaDemoSupported ? renalHypokalemiaDemonstration
    : renalHyperkalemiaDemoSupported ? renalHyperkalemiaDemonstration
    : perioperativeDiabetesDemoSupported ? perioperativeDiabetesDemonstration
    : refeedingDemoSupported ? refeedingDemonstration
    : avpDeficiencyDemoSupported ? avpDeficiencyDemonstration
    : hyponatremiaCorrectionDemoSupported ? hyponatremiaCorrectionDemonstration
    : hypocalcemiaDemoSupported ? hypocalcemiaDemonstration
    : hypercalcemiaDemoSupported ? hypercalcemiaDemonstration
    : myxedemaDemoSupported ? myxedemaDemonstration
    : thyroidDemoSupported ? thyroidDemonstration : adrenalDemoSupported ? adrenalDemonstration
    : hypoglycemiaDemoSupported ? hypoglycemiaDemonstration : inductionDemonstration;
  const [colorblindSafe] = useLocalPreference('colorblind-safe', false);
  const [whyField, setWhyField] = useState<StateField | null>(null);
  const [explainerId, setExplainerId] = useState<string | null>(null);
  const [drugCardId, setDrugCardId] = useState<string | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const updateAvailable = useUpdateAvailable();
  const [branchNoticeOpen, setBranchNoticeOpen] = useState(false);
  const [crisisInjectorOpen, setCrisisInjectorOpen] = useState(false);
  useEffect(() => {
    onSourceVisibilityChange?.(explainerId !== null || drugCardId !== null);
    return () => onSourceVisibilityChange?.(false);
  }, [drugCardId, explainerId, onSourceVisibilityChange]);
  // Sound is OFF until the learner asks for it, and nothing asks them.
  //
  // The pulse tone is genuinely useful — its pitch falls with saturation, which
  // is how a clinician tracks saturation while looking at the patient, and it
  // is the strongest channel a low-vision learner has here. But an unsolicited
  // box on arrival is an interruption, and "nothing interrupts arrival" is a
  // rule this project holds elsewhere. It lives in the overflow menu instead.
  const [soundOn, setSoundOn] = useLocalPreference('sound-on', false);
  const [announcement, setAnnouncement] = useState('');
  const [criticalAnnouncement, setCriticalAnnouncement] = useState('');
  const [selectedTick, setSelectedTick] = useState<number | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [promptWhyOpen, setPromptWhyOpen] = useState(false);
  const [tutorCollapsed, setTutorCollapsed] = useState(false);
  const [tutorIntroductionDismissed, setTutorIntroductionDismissed] = useLocalPreference(
    TUTOR_INTRODUCTION_PREFERENCE, false,
  );
  const [tutorIntroductionOpen, setTutorIntroductionOpen] = useState(
    () => !tutorIntroductionDismissed && session.guidance !== 'unassisted',
  );
  const promptsShown = useRef(new Map<string, number>());
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  // Review mode is a URL choice, not a stored one: a learner should never be
  // invited to argue with the content, and a reviewer should never hunt for the
  // way to.
  const reviewMode = useMemo(
    () => reviewModeFrom(typeof location === 'undefined' ? '' : location.search),
    [],
  );

  const previousState = useRef<Readonly<Record<string, number>> | null>(null);
  const lastFrame = useRef<number>(0);
  const cockpitRef = useRef<HTMLDivElement>(null);

  /** Read the region's real size, so a drag starts from where the region IS. */
  const measureRegion = useCallback((selector: string, axis: 'height' | 'width') => () => {
    const element = cockpitRef.current?.querySelector(selector);
    const rect = element?.getBoundingClientRect();
    return axis === 'height' ? (rect?.height ?? LAYOUT.actionCockpitHeightPx) : (rect?.width ?? 480);
  }, []);

  const actionHeight = useResizableRegion({
    storageKey: 'opensimlab.action-height',
    label: 'Height of the action region',
    axis: 'row',
    min: LAYOUT.actionCockpitMinPx,
    max: LAYOUT.actionCockpitMaxPx,
    // Dragging the handle UP makes the region taller.
    invert: true,
    measure: measureRegion('.cockpit__actions', 'height'),
  });

  const analysisWidth = useResizableRegion({
    storageKey: 'opensimlab.analysis-width',
    label: 'Width of the analysis region',
    axis: 'column',
    min: 280,
    max: 900,
    measure: measureRegion('.cockpit__analysis', 'width'),
  });

  // Everything below reads the engine's report of what the equipment is doing.
  // Nothing here remembers what the learner asked for: a refused setting, an
  // empty syringe and a failed intubation all have to be visible as such.
  const equipment = session.equipment;
  const ventilator = equipment?.ventilator ?? DEFAULT_VENTILATOR;
  const airway = equipment?.airway ?? DEFAULT_AIRWAY;
  const hypnoticLine = equipment?.hypnoticLine ?? DEFAULT_HYPNOTIC_LINE;
  const capnographyLine = equipment?.capnographyLine ?? DEFAULT_CAPNOGRAPHY_LINE;
  const arterialLine = equipment?.arterialLine ?? DEFAULT_ARTERIAL_LINE;
  const breathingCircuit = equipment?.breathingCircuit ?? DEFAULT_BREATHING_CIRCUIT;
  const hasArterialLine = scenario.equipment.monitoring.includes('arterial-line');
  const hasCircuitScenario = scenario.timeline.some((event) => event.type === 'equipment-failure'
    && event.target === 'co2-absorbent-exhaustion');
  const resuscitation = equipment?.resuscitation ?? DEFAULT_RESUSCITATION;
  const lastExposure = equipment?.lastExposure ?? null;
  const injectedCrises = equipment?.injectedCrisisIds ?? [];
  const {
    hasAnaphylaxisResponse, hasHypermetabolicResponse, hasCardiacArrestResponse,
    hasHighSpinalResponse,
    hasVenousAirEmbolismResponse,
    hasBronchospasmResponse,
    hasObstetricsMaternalArrestResponse,
  } = crisisResponseAvailability(scenario, injectedCrises);
  const rhythm = (equipment?.rhythmId ?? 'sinus') as RhythmId;
  const invalidParameters = useMemo(
    () => monitorUnavailableParameters(
      equipment?.invalidParameters ?? [], hasObstetricsMaternalArrestResponse,
    ),
    [equipment?.invalidParameters, hasObstetricsMaternalArrestResponse],
  );
  const monitorAlarms = useMemo(
    () => session.alarms.filter((alarm) => !invalidParameters.has(alarm.parameter)),
    [invalidParameters, session.alarms],
  );
  const artifactParameters = useMemo(
    () => new Set(equipment?.artifactParameters ?? []),
    [equipment?.artifactParameters],
  );
  const waveformArtifacts = useMemo(
    () => new Set(equipment?.waveformArtifacts ?? []),
    [equipment?.waveformArtifacts],
  );
  const displayedState = useMemo(() => {
    if (!session.state) return session.state;
    const pulseOx = equipment?.resuscitation.pulseOximeterArtifactAssessment;
    return {
      ...session.state,
      ...(hasArterialLine && arterialLine.displayedMeanArterialMmHg !== null
        ? { meanArterialMmHg: arterialLine.displayedMeanArterialMmHg } : {}),
      ...(pulseOx ? { spo2Percent: pulseOx.displayedSpo2Percent } : {}),
    };
  }, [hasArterialLine, session.state, arterialLine.displayedMeanArterialMmHg,
    equipment?.resuscitation.pulseOximeterArtifactAssessment]);
  const infusions = useMemo(
    () => (equipment?.drugs ?? [])
      .filter((drug) => drug.infusionRate > 0)
      .map((drug) => ({
        drugId: drug.drugId,
        rate: drug.infusionRate,
        unit: drug.infusionUnit,
        elapsedSeconds: drug.infusionSinceTick === null
          ? 0
          : Math.max(0, (session.tick - drug.infusionSinceTick) / TICKS_PER_SECOND),
      })),
    [equipment?.drugs, session.tick],
  );
  const syringeRemaining = useMemo(
    () => Object.fromEntries((equipment?.drugs ?? []).map((drug) => [drug.drugId, drug.syringeRemainingMl])),
    [equipment?.drugs],
  );
  const neuromuscularConfidence = useMemo(() => {
    const confidence = session.concentrations.find((drug) => drug.drugId === 'rocuronium')?.confidence;
    if (!confidence) return undefined;
    return confidence === 'teaching'
      ? { label: 'Teaching model', kind: 'teaching' as const }
      : confidence === 'out-of-range'
        ? { label: 'Out of range', kind: 'out-of-range' as const }
        : { label: confidence === 'published' ? 'Published' : 'Pending check', kind: 'default' as const };
  }, [session.concentrations]);
  const depthModelConfidence = useMemo(() => {
    return depthConfidenceFor(session.concentrations);
  }, [session.concentrations]);

  // The animation loop turns wall-clock time into ticks. The clock, not the frame
  // rate, decides how many, so the trajectory is identical at any frame rate.
  useEffect(() => {
    let handle = 0;
    const loop = (time: number) => {
      const elapsed = lastFrame.current === 0 ? 16.7 : time - lastFrame.current;
      lastFrame.current = time;
      session.frame(elapsed);
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(handle);
    // The store's actions are stable identities, so only mount matters here.
  }, []);

  // Announce only on a clinically meaningful change, never on every tick.
  useEffect(() => {
    if (!session.state) return;
    const announcements = announcementsFor(previousState.current, session.state, session.alarms,
      equipment?.resuscitation.myxedema || equipment?.resuscitation.hypercalcemia || equipment?.resuscitation.hypocalcemia || equipment?.resuscitation.hyponatremiaCorrection || equipment?.resuscitation.avpDeficiency || equipment?.resuscitation.refeeding || equipment?.resuscitation.perioperativeDiabetes || equipment?.resuscitation.renalHyperkalemia || equipment?.resuscitation.renalHypokalemia || equipment?.resuscitation.renalHyponatremia || equipment?.resuscitation.renalHypernatremia || equipment?.resuscitation.renalHypocalcemia || equipment?.resuscitation.renalHypermagnesemia || equipment?.resuscitation.meningococcalSepsis || equipment?.resuscitation.obstructedKidney || equipment?.resuscitation.febrileNeutropenia || equipment?.resuscitation.necrotizingInfection || equipment?.resuscitation.endocarditisHeartFailure || equipment?.resuscitation.severePneumonia || equipment?.resuscitation.toxicShock || equipment?.resuscitation.possibleSepsis || equipment?.resuscitation.septicShockLabel || equipment?.resuscitation.meningitisImaging || equipment?.resuscitation.lowScore || equipment?.resuscitation.countedRate || equipment?.resuscitation.pairedReading || equipment?.resuscitation.afferentLimb || equipment?.resuscitation.quietPatient || equipment?.resuscitation.proxyScale || equipment?.resuscitation.lastKnownWell || equipment?.resuscitation.oxygenTargetScale || equipment?.resuscitation.lostContingency || equipment?.resuscitation.delayedImmuneEvent || equipment?.resuscitation.incidentalClot || equipment?.resuscitation.normalTestToxicity || equipment?.resuscitation.prognosisQuestion || equipment?.resuscitation.laboratoryTls || equipment?.resuscitation.rareEarlyMyocarditis || equipment?.resuscitation.loweringTheCount || equipment?.resuscitation.inheritedUrgency || equipment?.resuscitation.trialRule || equipment?.resuscitation.silentInteraction || equipment?.resuscitation.easyLabel ? invalidParameters : undefined);
    previousState.current = session.state;
    if (announcements.length === 0) return;
    const critical = announcements.filter((entry) => entry.severity === 'critical');
    if (critical.length > 0) setCriticalAnnouncement(critical.map((entry) => entry.text).join('. '));
    else setAnnouncement(announcements.map((entry) => entry.text).join('. '));
  }, [session.state, session.alarms, equipment?.resuscitation.myxedema, equipment?.resuscitation.hypercalcemia, equipment?.resuscitation.hypocalcemia, equipment?.resuscitation.hyponatremiaCorrection, equipment?.resuscitation.avpDeficiency, equipment?.resuscitation.refeeding, equipment?.resuscitation.perioperativeDiabetes, equipment?.resuscitation.renalHyperkalemia, equipment?.resuscitation.renalHypokalemia, equipment?.resuscitation.renalHyponatremia, equipment?.resuscitation.renalHypernatremia, equipment?.resuscitation.renalHypocalcemia, equipment?.resuscitation.renalHypermagnesemia, equipment?.resuscitation.meningococcalSepsis, equipment?.resuscitation.obstructedKidney, equipment?.resuscitation.febrileNeutropenia, equipment?.resuscitation.necrotizingInfection, equipment?.resuscitation.endocarditisHeartFailure, equipment?.resuscitation.severePneumonia, equipment?.resuscitation.toxicShock, equipment?.resuscitation.possibleSepsis, equipment?.resuscitation.septicShockLabel, equipment?.resuscitation.meningitisImaging, equipment?.resuscitation.lowScore, equipment?.resuscitation.countedRate, equipment?.resuscitation.pairedReading, equipment?.resuscitation.afferentLimb, equipment?.resuscitation.quietPatient, equipment?.resuscitation.proxyScale, equipment?.resuscitation.lastKnownWell, equipment?.resuscitation.oxygenTargetScale, equipment?.resuscitation.lostContingency, equipment?.resuscitation.delayedImmuneEvent, equipment?.resuscitation.incidentalClot, equipment?.resuscitation.normalTestToxicity, equipment?.resuscitation.prognosisQuestion, equipment?.resuscitation.laboratoryTls, equipment?.resuscitation.rareEarlyMyocarditis, equipment?.resuscitation.loweringTheCount, equipment?.resuscitation.inheritedUrgency, equipment?.resuscitation.trialRule, equipment?.resuscitation.silentInteraction, equipment?.resuscitation.easyLabel, invalidParameters]);

  // The pulse tone sounds once per beat, at the pitch saturation implies.
  useEffect(() => {
    if (!session.state) return;
    const pulses = session.waveformBlocks.length;
    if (pulses === 0) return;
    if (soundOn) audio.pulse(session.state.spo2Percent ?? 100);
  }, [session.tick, audio, session.state, session.waveformBlocks.length]);

  useEffect(() => {
    // The highest-priority alarm that is NOT silenced.
    //
    // This took `session.alarms[0]` and sounded it regardless. A silenced alarm
    // stays in `active` by design, carrying a countdown, so pressing Silence (or
    // the `a` hotkey) changed the chip text and nothing else: the tone kept
    // playing for the full two minutes. The learner's only mitigation control
    // did nothing to the thing they were trying to mitigate.
    const highest = session.alarms.find((alarm) => alarm.silencedUntilTick === null
      || alarm.silencedUntilTick <= session.tick);
    if (soundOn && highest) audio.alarm(highest.priority);
  }, [session.alarms, session.tick, audio, soundOn]);

  // Guidance is presentational. It reads state the engine produced anyway and
  // never feeds anything back, which is what makes the trajectory identical at
  // every guidance level.
  useEffect(() => {
    if (tutorIntroductionOpen || demonstrating || scenario.metadata.id === 'adrenal-crisis-treatment-before-tests'
      || scenario.metadata.id === 'thyroid-storm-hemodynamic-risk'
      || scenario.metadata.id === 'myxedema-coma-ventilation-and-steroid-sequence'
      || scenario.metadata.id === 'hypercalcemic-crisis-volume-and-bridge'
      || scenario.metadata.id === 'hypernatremic-dehydration-avp-deficiency'
      || scenario.metadata.id === 'refeeding-electrolyte-shift'
      || scenario.metadata.id === 'perioperative-diabetes-insulin-continuity'
      || scenario.metadata.id === 'hyperkalemia-cardioprotection-and-rebound'
      || scenario.metadata.id === 'hypokalemia-magnesium-and-ongoing-losses'
      || scenario.metadata.id === 'hyponatremia-symptoms-and-reassessment'
      || scenario.metadata.id === 'hypernatremia-water-access-and-losses'
      || scenario.metadata.id === 'hypocalcemia-ionized-calcium-and-ckd'
      || scenario.metadata.id === 'hypermagnesemia-antagonism-and-removal') return;
    const input = {
      scenarioId: scenario.metadata.id,
      scenarioVersion: scenario.metadata.version,
      hypoglycemia: session.equipment?.resuscitation.severeHypoglycemia,
      adrenalCrisis: session.equipment?.resuscitation.adrenalCrisis,
      tick: session.tick,
      state: session.state,
      actions: sessionInternals().recorder?.build('pending').actions ?? [],
      ventilating: ventilator.delivering,
      alarmCount: session.alarms.length,
      unavailableParameters: [...invalidParameters],
    };
    if (prompt) {
      if (!promptStillEligible(session.guidance, input, prompt.id)) {
        setPrompt(null);
        setPromptWhyOpen(false);
      }
      return;
    }
    const next = promptFor(session.guidance, input, promptsShown.current);
    if (next) {
      promptsShown.current.set(next.id, session.tick);
      setPromptWhyOpen(false);
      setTutorCollapsed(false);
      setPrompt(next);
    }
  }, [session.tick, session.guidance, session.state, session.alarms.length, prompt,
    tutorIntroductionOpen, invalidParameters, demonstrating]);

  const speak = useCallback((text: string) => setAnnouncement(text), []);

  const readSummary = useCallback(() => {
    if (!displayedState) return;
    speak(stateSummary(displayedState as never, {
      alarms: session.alarms,
      infusions,
      ventilator,
      invalid: invalidParameters,
      myxedema: equipment?.resuscitation.myxedema,
      hypercalcemia: equipment?.resuscitation.hypercalcemia,
      hypocalcemia: equipment?.resuscitation.hypocalcemia,
      hyponatremiaCorrection: equipment?.resuscitation.hyponatremiaCorrection,
      avpDeficiency: equipment?.resuscitation.avpDeficiency,
      refeeding: equipment?.resuscitation.refeeding,
      perioperativeDiabetes: equipment?.resuscitation.perioperativeDiabetes,
      renalHyperkalemia: equipment?.resuscitation.renalHyperkalemia,
      renalHypokalemia: equipment?.resuscitation.renalHypokalemia,
      renalHyponatremia: equipment?.resuscitation.renalHyponatremia,
      renalHypernatremia: equipment?.resuscitation.renalHypernatremia,
      renalHypocalcemia: equipment?.resuscitation.renalHypocalcemia,
      renalHypermagnesemia: equipment?.resuscitation.renalHypermagnesemia,
      meningococcalSepsis: equipment?.resuscitation.meningococcalSepsis,
      obstructedKidney: equipment?.resuscitation.obstructedKidney,
      febrileNeutropenia: equipment?.resuscitation.febrileNeutropenia,
      necrotizingInfection: equipment?.resuscitation.necrotizingInfection,
      endocarditisHeartFailure: equipment?.resuscitation.endocarditisHeartFailure,
      severePneumonia: equipment?.resuscitation.severePneumonia,
      toxicShock: equipment?.resuscitation.toxicShock,
      possibleSepsis: equipment?.resuscitation.possibleSepsis,
      septicShockLabel: equipment?.resuscitation.septicShockLabel,
      meningitisImaging: equipment?.resuscitation.meningitisImaging,
      lowScore: equipment?.resuscitation.lowScore,
      countedRate: equipment?.resuscitation.countedRate,
      pairedReading: equipment?.resuscitation.pairedReading,
      afferentLimb: equipment?.resuscitation.afferentLimb,
      quietPatient: equipment?.resuscitation.quietPatient,
      proxyScale: equipment?.resuscitation.proxyScale,
      lastKnownWell: equipment?.resuscitation.lastKnownWell,
      oxygenTargetScale: equipment?.resuscitation.oxygenTargetScale,
      lostContingency: equipment?.resuscitation.lostContingency,
      delayedImmuneEvent: equipment?.resuscitation.delayedImmuneEvent,
      incidentalClot: equipment?.resuscitation.incidentalClot,
      normalTestToxicity: equipment?.resuscitation.normalTestToxicity,
      prognosisQuestion: equipment?.resuscitation.prognosisQuestion,
      laboratoryTls: equipment?.resuscitation.laboratoryTls,
      rareEarlyMyocarditis: equipment?.resuscitation.rareEarlyMyocarditis,
      loweringTheCount: equipment?.resuscitation.loweringTheCount,
      inheritedUrgency: equipment?.resuscitation.inheritedUrgency,
      trialRule: equipment?.resuscitation.trialRule,
      silentInteraction: equipment?.resuscitation.silentInteraction,
      easyLabel: equipment?.resuscitation.easyLabel,
      showTrainOfFour: scenario.equipment.monitoring.includes('train-of-four'),
      jawThrustCpapSecondsRemaining: airway.jawThrustCpapSecondsRemaining,
      capnographyLine,
      resuscitation,
      epinephrineLabel: term(region, 'epinephrine'),
      lastExposure,
      actualBodyWeightKg: scenario.patient.weightKg,
      showEpinephrineSupport: hasAnaphylaxisResponse,
      showHypermetabolicSupport: hasHypermetabolicResponse,
      showCardiacArrestSupport: hasCardiacArrestResponse,
      showHighSpinalSupport: hasHighSpinalResponse,
      showVenousAirEmbolismSupport: hasVenousAirEmbolismResponse,
      showBronchospasmSupport: hasBronchospasmResponse,
      bronchodilatorLabel: term(region, 'salbutamol'),
    })
      + (hasArterialLine ? ` ${arterialLineSummary(arterialLine)}` : '')
      + (hasCircuitScenario ? ` ${breathingCircuitSummary(breathingCircuit)}` : ''));
  }, [
    displayedState, session.alarms, speak, infusions, ventilator, invalidParameters,
    scenario.equipment.monitoring, scenario.patient.weightKg, airway.jawThrustCpapSecondsRemaining,
    resuscitation, region, lastExposure, hasAnaphylaxisResponse, hasHypermetabolicResponse,
    hasCardiacArrestResponse, hasHighSpinalResponse, hasVenousAirEmbolismResponse,
    hasBronchospasmResponse, capnographyLine, hasArterialLine, equipment?.resuscitation.myxedema, equipment?.resuscitation.hypercalcemia, equipment?.resuscitation.hypocalcemia, equipment?.resuscitation.hyponatremiaCorrection, equipment?.resuscitation.avpDeficiency, equipment?.resuscitation.refeeding, equipment?.resuscitation.perioperativeDiabetes, equipment?.resuscitation.renalHyperkalemia, equipment?.resuscitation.renalHypokalemia, equipment?.resuscitation.renalHyponatremia, equipment?.resuscitation.renalHypernatremia, equipment?.resuscitation.renalHypocalcemia, equipment?.resuscitation.renalHypermagnesemia, equipment?.resuscitation.meningococcalSepsis, equipment?.resuscitation.obstructedKidney, equipment?.resuscitation.febrileNeutropenia, equipment?.resuscitation.necrotizingInfection, equipment?.resuscitation.endocarditisHeartFailure, equipment?.resuscitation.severePneumonia, equipment?.resuscitation.toxicShock, equipment?.resuscitation.possibleSepsis, equipment?.resuscitation.septicShockLabel, equipment?.resuscitation.meningitisImaging, equipment?.resuscitation.lowScore, equipment?.resuscitation.countedRate, equipment?.resuscitation.pairedReading, equipment?.resuscitation.afferentLimb, equipment?.resuscitation.quietPatient, equipment?.resuscitation.proxyScale, equipment?.resuscitation.lastKnownWell, equipment?.resuscitation.oxygenTargetScale, equipment?.resuscitation.lostContingency, equipment?.resuscitation.delayedImmuneEvent, equipment?.resuscitation.incidentalClot, equipment?.resuscitation.normalTestToxicity, equipment?.resuscitation.prognosisQuestion, equipment?.resuscitation.laboratoryTls, equipment?.resuscitation.rareEarlyMyocarditis, equipment?.resuscitation.loweringTheCount, equipment?.resuscitation.inheritedUrgency, equipment?.resuscitation.trialRule, equipment?.resuscitation.silentInteraction, equipment?.resuscitation.easyLabel,
    arterialLine.cuff.meanArterialMmHg, hasCircuitScenario, breathingCircuit,
  ]);

  const readWaveforms = useCallback(() => {
    speak(waveformDescriptions({
      rhythm,
      bronchospasmSeverity: airway.bronchospasmSeverity,
      airwayPatencyFraction: airway.patencyFraction,
      perfusionIndex: session.state?.perfusionIndex ?? 0.8,
      artifacts: waveformArtifacts,
      capnographyUnavailable: !!equipment?.resuscitation.myxedema || !!equipment?.resuscitation.hypercalcemia || !!equipment?.resuscitation.hypocalcemia || !!equipment?.resuscitation.hyponatremiaCorrection || !!equipment?.resuscitation.avpDeficiency || !!equipment?.resuscitation.refeeding || !!equipment?.resuscitation.perioperativeDiabetes || !!equipment?.resuscitation.renalHyperkalemia || !!equipment?.resuscitation.renalHypokalemia || !!equipment?.resuscitation.renalHyponatremia || !!equipment?.resuscitation.renalHypernatremia || !!equipment?.resuscitation.renalHypocalcemia || !!equipment?.resuscitation.renalHypermagnesemia || !!equipment?.resuscitation.meningococcalSepsis || !!equipment?.resuscitation.obstructedKidney || !!equipment?.resuscitation.febrileNeutropenia || !!equipment?.resuscitation.necrotizingInfection || !!equipment?.resuscitation.endocarditisHeartFailure || !!equipment?.resuscitation.severePneumonia || !!equipment?.resuscitation.toxicShock || !!equipment?.resuscitation.possibleSepsis || !!equipment?.resuscitation.septicShockLabel || !!equipment?.resuscitation.meningitisImaging || !!equipment?.resuscitation.lowScore || !!equipment?.resuscitation.countedRate || !!equipment?.resuscitation.pairedReading || !!equipment?.resuscitation.afferentLimb || !!equipment?.resuscitation.quietPatient || !!equipment?.resuscitation.proxyScale || !!equipment?.resuscitation.lastKnownWell || !!equipment?.resuscitation.oxygenTargetScale || !!equipment?.resuscitation.lostContingency || !!equipment?.resuscitation.delayedImmuneEvent || !!equipment?.resuscitation.incidentalClot || !!equipment?.resuscitation.normalTestToxicity || !!equipment?.resuscitation.prognosisQuestion || !!equipment?.resuscitation.laboratoryTls || !!equipment?.resuscitation.rareEarlyMyocarditis || !!equipment?.resuscitation.loweringTheCount || !!equipment?.resuscitation.inheritedUrgency || !!equipment?.resuscitation.trialRule || !!equipment?.resuscitation.silentInteraction || !!equipment?.resuscitation.easyLabel,
      capnographySampleObstructed: capnographyLine.obstructed,
      tracheostomyPatencyFraction: equipment?.tracheostomy?.patencyFraction,
      arterialDamped: arterialLine.dynamicResponse === 'overdamped',
      inspiredCo2MmHg: breathingCircuit.inspiredCo2MmHg,
      ventilating: (session.state?.respiratoryRateBpm ?? 0) > 0,
      mechanicalPulse: mechanicalPulseFromState(session.state),
    }).map((entry) => `${entry.label}: ${entry.description}`).join(' '));
  }, [session.state, speak, rhythm, waveformArtifacts, airway, capnographyLine.obstructed,
    arterialLine.dynamicResponse, breathingCircuit.inspiredCo2MmHg, ventilator.delivering,
    equipment?.tracheostomy?.patencyFraction, equipment?.resuscitation.myxedema, equipment?.resuscitation.hypercalcemia, equipment?.resuscitation.hypocalcemia, equipment?.resuscitation.hyponatremiaCorrection, equipment?.resuscitation.avpDeficiency, equipment?.resuscitation.refeeding, equipment?.resuscitation.perioperativeDiabetes, equipment?.resuscitation.renalHyperkalemia, equipment?.resuscitation.renalHypokalemia, equipment?.resuscitation.renalHyponatremia, equipment?.resuscitation.renalHypernatremia, equipment?.resuscitation.renalHypocalcemia, equipment?.resuscitation.renalHypermagnesemia, equipment?.resuscitation.meningococcalSepsis, equipment?.resuscitation.obstructedKidney, equipment?.resuscitation.febrileNeutropenia, equipment?.resuscitation.necrotizingInfection, equipment?.resuscitation.endocarditisHeartFailure, equipment?.resuscitation.severePneumonia, equipment?.resuscitation.toxicShock, equipment?.resuscitation.possibleSepsis, equipment?.resuscitation.septicShockLabel, equipment?.resuscitation.meningitisImaging, equipment?.resuscitation.lowScore, equipment?.resuscitation.countedRate, equipment?.resuscitation.pairedReading, equipment?.resuscitation.afferentLimb, equipment?.resuscitation.quietPatient, equipment?.resuscitation.proxyScale, equipment?.resuscitation.lastKnownWell, equipment?.resuscitation.oxygenTargetScale, equipment?.resuscitation.lostContingency, equipment?.resuscitation.delayedImmuneEvent, equipment?.resuscitation.incidentalClot, equipment?.resuscitation.normalTestToxicity, equipment?.resuscitation.prognosisQuestion, equipment?.resuscitation.laboratoryTls, equipment?.resuscitation.rareEarlyMyocarditis, equipment?.resuscitation.loweringTheCount, equipment?.resuscitation.inheritedUrgency, equipment?.resuscitation.trialRule, equipment?.resuscitation.silentInteraction, equipment?.resuscitation.easyLabel]);

  useEffect(() => {
    if (arterialLine.mislevelingCm > 0 || arterialLine.dynamicResponse === 'overdamped') {
      setAnnouncement('The invasive pressure display changed while canonical circulation remained stable. '
        + `${arterialLine.mislevelingCm > 0 ? `The transducer is ${arterialLine.mislevelingCm} centimeters above its reference level. ` : ''}`
        + `${arterialLine.dynamicResponse === 'overdamped' ? 'The arterial waveform is over-damped.' : ''}`);
    }
  }, [arterialLine.mislevelingCm, arterialLine.dynamicResponse]);

  useEffect(() => {
    if (arterialLine.cuff.status === 'complete'
      && arterialLine.cuff.meanArterialMmHg !== null) {
      setAnnouncement(`Independent cuff mean arterial pressure ${arterialLine.cuff.meanArterialMmHg.toFixed(0)} millimeters of mercury.`);
    }
  }, [arterialLine.cuff.status, arterialLine.cuff.meanArterialMmHg]);

  useEffect(() => {
    if (breathingCircuit.co2Absorbent === 'exhausted') {
      setAnnouncement('The capnogram inspiratory baseline is rising above zero while delivered breaths continue. Assess the breathing system.');
    } else if (breathingCircuit.absorbentReplaced) {
      setAnnouncement('Carbon-dioxide absorbent replacement intent accepted. Confirm the inspiratory baseline washes back toward zero.');
    }
  }, [breathingCircuit.co2Absorbent, breathingCircuit.absorbentReplaced]);

  // The keyboard layer. Every shortcut is documented in SHORTCUTS and reachable
  // from the reference without leaving the cockpit.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target instanceof Element ? event.target : null;
      // Native activation, text editing, dialogs, and narration own their keys.
      // Closest also protects nested labels and icons within those controls.
      if (target?.closest('.demo-bar, button, a[href], input, textarea, select, summary, dialog, '
        + '[role="button"], [role="link"], [role="textbox"], [role="combobox"], [role="spinbutton"], '
        + '[role="dialog"], [role="alertdialog"], [contenteditable]:not([contenteditable="false"])')) return;
      switch (event.key) {
        case ' ':
          event.preventDefault();
          if (session.transport === 'running') session.pause(); else session.play();
          break;
        case '.': session.singleStep(); break;
        case 's': case 'S': readSummary(); break;
        case 'w': case 'W': readWaveforms(); break;
        case 'a': case 'A': {
          const highest = session.alarms[0];
          if (highest) session.act({ type: 'silence-alarm', payload: { alarmId: highest.alarmId } });
          break;
        }
        case 'v': case 'V':
          if (moduleId !== 'anesthesia') break;
          session.act({ type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } });
          break;
        case 'l': case 'L':
          if (moduleId !== 'anesthesia') break;
          session.act({ type: 'laryngoscopy', payload: { technique: 'direct' } });
          break;
        case 'c': case 'C':
          if (moduleId !== 'anesthesia') break;
          session.act({ type: 'chest-compressions', payload: {
            active: !(resuscitation.chestCompressionsActive ?? false),
          } });
          break;
        case 'e': case 'E':
          if (moduleId !== 'anesthesia') break;
          session.act({ type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: 1 } });
          break;
        case 'd': case 'D':
          if (moduleId !== 'anesthesia') break;
          session.act({ type: 'defibrillation', payload: { energyJ: 200, waveform: 'biphasic' } });
          break;
        case '?': setShortcutsOpen(true); break;
        default: break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [session, readSummary, readWaveforms, resuscitation.chestCompressionsActive, moduleId]);

  const timeToPeak = useMemo(() => ({ propofol: 100, remifentanil: 90 }), []);

  /**
   * Boluses stacked before the previous one reached its peak, computed live from
   * the recorded actions. The debrief says this afterwards; the plot says it
   * while there is still time to act on it, which is where it teaches.
   */
  const stacking = useMemo(
    () => findStacking(
      sessionInternals().recorder?.build('pending').actions ?? [],
      session.history,
      timeToPeak,
    ),
    [session.history, timeToPeak],
  );

  const classes = [
    'cockpit',
    analysisOpen ? 'cockpit--analysis-open' : '',
    actionsOpen ? 'cockpit--actions-open' : '',
  ].filter(Boolean).join(' ');

  // The learner's own geometry, remembered on this device. Both default to a
  // share of the viewport rather than a pixel count, so a laptop and a lecture
  // display each get a sensible layout without anyone touching anything.
  const style = {
    ...(actionHeight.size !== null ? { '--action-cockpit-height': `${actionHeight.size}px` } : {}),
    ...(analysisWidth.size !== null ? { '--analysis-fraction': `${analysisWidth.size}px` } : {}),
  } as CSSProperties;
  const resetScenario = () => {
    if (confirm('Reset the scenario? The clock returns to zero, the patient returns to baseline, the log is cleared, and any running infusion stops.')) {
      session.resetSession();
    }
  };
  const rehearsalPoint = scenario.replayPoints?.find(
    (point) => point.id === session.rehearsalBranch?.pointId,
  );
  useEffect(() => {
    setBranchNoticeOpen(session.rehearsalBranch !== null);
  }, [session.rehearsalBranch?.pointId]);

  return (
    <div
      className={classes}
      style={style}
      ref={cockpitRef}
      {...(demonstration.beat ? { 'data-demo-focus': demonstration.beat.focus } : {})}
    >
      <a className="skip-link" href="#monitor-region">Skip to the monitor</a>

      <DemonstrationBar
        beat={demonstration.beat}
        progress={demonstration.progress}
        onAdvance={demonstration.onAdvance}
        awaitingAdvance={demonstration.awaitingAdvance}
        onTakeControls={() => {
          // The clicked strip disappears. Play/Pause stays reachable even when
          // the phone's action tray is closed; moving focus does not run it.
          cockpitRef.current?.querySelector<HTMLButtonElement>('.status-bar__transport button')?.focus({ preventScroll: true });
          onTakeControls?.();
        }}
      />

      <div className="cockpit__status">
        <StatusBar
          scenario={scenario}
          elapsed={session.elapsed}
          transport={session.transport}
          speed={session.speed}
          onPlay={session.play}
          onPause={session.pause}
          onStep={session.singleStep}
          onReset={resetScenario}
          onSpeed={(speed: SpeedMultiplier) => session.setSpeed(speed)}
          onOverflow={() => setShortcutsOpen(true)}
          moduleId={moduleId}
          updateAvailable={updateAvailable}
        />
      </div>

      {branchNoticeOpen && session.rehearsalBranch && rehearsalPoint && (
        <div className="rehearsal-branch" role="status">
          <span>
            <strong>Targeted repetition · {rehearsalPoint.label}</strong>
            <br />
            Rebuilt from your original run at {formatElapsed(session.rehearsalBranch.decisionTick)}.
            New actions form a separate branch.
          </span>
          <Button compact variant="ghost" onClick={() => setBranchNoticeOpen(false)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="cockpit__monitor" id="monitor-region">
        <MonitorRegion
          state={displayedState}
          blocks={session.waveformBlocks}
          alarms={monitorAlarms}
          tick={session.tick}
          invalidParameters={invalidParameters}
          invalidParameterReasons={hasObstetricsMaternalArrestResponse
            ? {
                meanArterialMmHg: 'Blood pressure not obtainable',
                spo2Percent: 'Pulse-derived saturation unavailable',
                etco2MmHg: 'Exhaled carbon dioxide not supplied',
              }
            : observedStateDemoSupported
              ? { etco2MmHg: 'Exhaled carbon dioxide is not supplied in this lesson',
                  fio2: 'Oxygen setting is not modeled' }
            : myxedemaDemoSupported
              ? { etco2MmHg: 'Exhaled carbon dioxide not supplied; request a bedside PaCO₂ assessment',
                  fio2: 'Oxygen setting is not modeled' }
            : scenario.metadata.id === 'pediatric-foreign-body-airway-obstruction'
              ? { meanArterialMmHg: 'Pressure not supplied' } : undefined}
          artifactParameters={artifactParameters}
          waveformArtifacts={waveformArtifacts}
          capnographySampleObstructed={capnographyLine.obstructed}
          tracheostomyPatencyFraction={equipment?.tracheostomy?.patencyFraction}
          inspiredCo2MmHg={breathingCircuit.inspiredCo2MmHg}
          arterialDamped={arterialLine.dynamicResponse === 'overdamped'}
          rhythm={rhythm}
          airwayPatencyFraction={airway.patencyFraction}
          bronchospasmSeverity={airway.bronchospasmSeverity}
          ventilating={ventilator.delivering || (airway.device !== 'tracheal-tube'
            && (session.state?.respiratoryRateBpm ?? 0) > 0
            && (session.state?.tidalVolumeMl ?? 0) > 0)}
          mechanicalPulse={mechanicalPulseFromState(session.state)}
          reducedMotion={reducedMotion}
          colorblindSafe={colorblindSafe}
          showLimits
          primaryTracesOnly={false}
          canvasHeight="fill"
          onSilence={(alarmId) => session.act({ type: 'silence-alarm', payload: { alarmId } })}
          onWhy={setWhyField}
          modelConfidence={depthModelConfidence}
          showTrainOfFour={scenario.equipment.monitoring.includes('train-of-four')}
          showDepth={moduleId === 'anesthesia'}
          {...(neuromuscularConfidence ? { neuromuscularConfidence } : {})}
        />
      </div>

      {/* The separators. Real ones: focusable, arrow-key operable, announcing
          their value, and returning to the default on Home or a double-click. */}
      <div className="divider divider--vertical" {...analysisWidth.handleProps} />
      <div className="divider divider--horizontal" {...actionHeight.handleProps} />

      <div className="cockpit__analysis">
        <AnalysisRegion
          scenario={scenario}
          moduleId={moduleId}
          initialTab={moduleId === 'respiratory-medicine' || moduleId === 'pediatrics' || moduleId === 'neurology' || moduleId === 'neonatology' || moduleId === 'endocrine-metabolic' || moduleId === 'renal-electrolyte'
            ? 'patient' : 'concentrations'}
          history={session.history}
          concentrations={session.concentrations}
          attribution={session.attribution}
          log={session.log}
          unreadLog={session.unreadLog}
          tick={session.tick}
          timeToPeakSeconds={timeToPeak}
          stacking={stacking}
          wide={typeof window !== 'undefined' && window.innerWidth >= 1920}
          onSelectTick={setSelectedTick}
          selectedTick={selectedTick}
          onExportCsv={() => downloadLocal(
            `opensimlab-${scenario.metadata.id}-concentrations.csv`,
            concentrationCsv(session.history),
            'text/csv',
          )}
          onOpenExplainer={setExplainerId}
          onMarkLogRead={session.markLogRead}
        />
      </div>

      <div className="cockpit__actions">
        <ActionCockpit
          thyroidGuidance={session.guidance}
          myxedemaGuidance={session.guidance}
          hypercalcemiaGuidance={session.guidance}
          hypocalcemiaGuidance={session.guidance}
          hyponatremiaCorrectionGuidance={session.guidance}
          avpDeficiencyGuidance={session.guidance}
          refeedingGuidance={session.guidance}
          perioperativeDiabetesGuidance={session.guidance}
          renalHyperkalemia={equipment?.resuscitation.renalHyperkalemia}
          renalHyperkalemiaGuidance={session.guidance}
          renalHypokalemia={equipment?.resuscitation.renalHypokalemia}
          renalHypokalemiaGuidance={session.guidance}
          renalHyponatremia={equipment?.resuscitation.renalHyponatremia}
          renalHypernatremia={equipment?.resuscitation.renalHypernatremia}
          renalHypocalcemia={equipment?.resuscitation.renalHypocalcemia}
          renalHypermagnesemia={equipment?.resuscitation.renalHypermagnesemia}
          meningococcalSepsis={equipment?.resuscitation.meningococcalSepsis}
          obstructedKidney={equipment?.resuscitation.obstructedKidney}
          febrileNeutropenia={equipment?.resuscitation.febrileNeutropenia}
          necrotizingInfection={equipment?.resuscitation.necrotizingInfection}
          endocarditisHeartFailure={equipment?.resuscitation.endocarditisHeartFailure}
          severePneumonia={equipment?.resuscitation.severePneumonia}
          toxicShock={equipment?.resuscitation.toxicShock}
          possibleSepsis={equipment?.resuscitation.possibleSepsis}
          septicShockLabel={equipment?.resuscitation.septicShockLabel}
          meningitisImaging={equipment?.resuscitation.meningitisImaging}
          lowScore={equipment?.resuscitation.lowScore}
          lowScoreGuidance={session.guidance}
          countedRateGuidance={session.guidance}
          pairedReadingGuidance={session.guidance}
          afferentLimbGuidance={session.guidance}
          quietPatientGuidance={session.guidance}
          proxyScaleGuidance={session.guidance}
          lastKnownWellGuidance={session.guidance}
          oxygenTargetScaleGuidance={session.guidance}
          lostContingencyGuidance={session.guidance}
          meningococcalSepsisGuidance={session.guidance}
          meningococcalSepsisDemonstrating={demonstrating && meningococcalSepsisDemoSupported}
          obstructedKidneyGuidance={session.guidance}
          obstructedKidneyDemonstrating={demonstrating && obstructedKidneyDemoSupported}
          febrileNeutropeniaGuidance={session.guidance}
          febrileNeutropeniaDemonstrating={demonstrating && febrileNeutropeniaDemoSupported}
          necrotizingInfectionGuidance={session.guidance}
          necrotizingInfectionDemonstrating={demonstrating && necrotizingInfectionDemoSupported}
          endocarditisHeartFailureGuidance={session.guidance}
          endocarditisHeartFailureDemonstrating={demonstrating && endocarditisHeartFailureDemoSupported}
          severePneumoniaGuidance={session.guidance}
          severePneumoniaDemonstrating={demonstrating && severePneumoniaDemoSupported}
          toxicShockGuidance={session.guidance}
          toxicShockDemonstrating={demonstrating && toxicShockDemoSupported}
          possibleSepsisGuidance={session.guidance}
          possibleSepsisDemonstrating={demonstrating && possibleSepsisDemoSupported}
          septicShockLabelGuidance={session.guidance}
          septicShockLabelDemonstrating={demonstrating && septicShockLabelDemoSupported}
          meningitisImagingGuidance={session.guidance}
          meningitisImagingDemonstrating={demonstrating && meningitisImagingDemoSupported}
          neonatologyNicuHandoffGuidance={session.guidance}
          neonatologyNicuHandoffDemonstrating={demonstrating && nicuHandoffDemoSupported}
          neonatologyThermoregulationGuidance={session.guidance}
          neonatologyThermoregulationDemonstrating={demonstrating && thermoregulationDemoSupported}
          neonatologySepsisGuidance={session.guidance}
          neonatologySepsisDemonstrating={demonstrating && neonatalSepsisDemoSupported}
          neonatologyHypoglycemiaGuidance={session.guidance}
          neonatologyHypoglycemiaDemonstrating={demonstrating && neonatalHypoglycemiaDemoSupported}
          neonatologyPretermRespiratoryGuidance={session.guidance}
          neonatologyPretermRespiratoryDemonstrating={demonstrating && pretermRespiratoryDemoSupported}
          neonatologyMeconiumGuidance={session.guidance}
          neonatologyMeconiumDemonstrating={demonstrating && meconiumTransitionDemoSupported}
          neonatologyBradycardiaGuidance={session.guidance}
          neonatologyBradycardiaDemonstrating={demonstrating && neonatalBradycardiaDemoSupported}
          neonatologyIneffectiveVentilationGuidance={session.guidance}
          neonatologyIneffectiveVentilationDemonstrating={demonstrating && ineffectiveVentilationDemoSupported}
          neonatologyApneaGuidance={session.guidance}
          neonatologyApneaDemonstrating={demonstrating && neonatalApneaDemoSupported}
          neonatologyTermTransitionGuidance={session.guidance}
          neonatologyTermTransitionDemonstrating={demonstrating && termTransitionDemoSupported}
          neonatologyTensionPneumothoraxGuidance={session.guidance}
          neonatologyTensionPneumothoraxDemonstrating={demonstrating && tensionPneumothoraxDemoSupported}
          toxicologyMethemoglobinemiaGuidance={session.guidance}
          toxicologyMethemoglobinemiaDemonstrating={demonstrating && methemoglobinemiaDemoSupported}
          toxicologyCarbonMonoxideGuidance={session.guidance}
          toxicologyCarbonMonoxideDemonstrating={demonstrating && carbonMonoxideDemoSupported}
          toxicologyAcetaminophenGuidance={session.guidance}
          toxicologyAcetaminophenDemonstrating={demonstrating && acetaminophenDemoSupported}
          toxicologySalicylateGuidance={session.guidance}
          toxicologySalicylateDemonstrating={demonstrating && salicylateDemoSupported}
          toxicologyTricyclicGuidance={session.guidance}
          toxicologyTricyclicDemonstrating={demonstrating && tricyclicDemoSupported}
          toxicologyBetaBlockerGuidance={session.guidance}
          toxicologyBetaBlockerDemonstrating={demonstrating && betaBlockerDemoSupported}
          toxicologyCalciumChannelBlockerGuidance={session.guidance}
          toxicologyCalciumChannelBlockerDemonstrating={demonstrating && calciumChannelBlockerDemoSupported}
          toxicologyDigoxinGuidance={session.guidance}
          toxicologyDigoxinDemonstrating={demonstrating && digoxinDemoSupported}
          toxicologyCholinergicGuidance={session.guidance}
          toxicologyCholinergicDemonstrating={demonstrating && cholinergicDemoSupported}
          toxicologyAnticholinergicGuidance={session.guidance}
          toxicologyAnticholinergicDemonstrating={demonstrating && anticholinergicDemoSupported}
          toxicologySerotoninGuidance={session.guidance}
          toxicologySerotoninDemonstrating={demonstrating && serotoninDemoSupported}
          toxicologySympathomimeticGuidance={session.guidance}
          toxicologySympathomimeticDemonstrating={demonstrating && sympathomimeticDemoSupported}
          toxicologyMethanolGuidance={session.guidance}
          toxicologyMethanolDemonstrating={demonstrating && methanolDemoSupported}
          toxicologyDelayedLastGuidance={session.guidance}
          toxicologyDelayedLastDemonstrating={demonstrating && delayedLastDemoSupported}
          toxicologyOpioidXylazineGuidance={session.guidance}
          toxicologyOpioidXylazineDemonstrating={demonstrating && opioidXylazineDemoSupported}
          neurologyMinorStrokeGuidance={session.guidance}
          neurologyMinorStrokeDemonstrating={demonstrating && minorStrokeDemoSupported}
          neurologyBasilarLvoGuidance={session.guidance}
          neurologyBasilarLvoDemonstrating={demonstrating && basilarLvoDemoSupported}
          neurologyCerebellarIchGuidance={session.guidance}
          neurologyCerebellarIchDemonstrating={demonstrating && cerebellarIchDemoSupported}
          neurologyAsahGuidance={session.guidance}
          neurologyAsahDemonstrating={demonstrating && asahDemoSupported}
          neurologyFocalMotorStatusGuidance={session.guidance}
          neurologyFocalMotorStatusDemonstrating={demonstrating && focalMotorStatusDemoSupported}
          neurologyNcseGuidance={session.guidance}
          neurologyNcseDemonstrating={demonstrating && ncseDemoSupported}
          neurologyMyastheniaGuidance={session.guidance}
          neurologyMyastheniaDemonstrating={demonstrating && myastheniaDemoSupported}
          neurologyGbsGuidance={session.guidance}
          neurologyGbsDemonstrating={demonstrating && gbsDemoSupported}
          neurologyMeningitisGuidance={session.guidance}
          neurologyMeningitisDemonstrating={demonstrating && meningitisDemoSupported}
          neurologyEncephalitisGuidance={session.guidance}
          neurologyEncephalitisDemonstrating={demonstrating && encephalitisDemoSupported}
          neurologyRaisedIcpGuidance={session.guidance}
          neurologyRaisedIcpDemonstrating={demonstrating && raisedIcpDemoSupported}
          neurologyHerniationGuidance={session.guidance}
          neurologyHerniationDemonstrating={demonstrating && herniationDemoSupported}
          neurologyMsccGuidance={session.guidance}
          neurologyMsccDemonstrating={demonstrating && msccDemoSupported}
          neurologyDeliriumGuidance={session.guidance}
          neurologyDeliriumDemonstrating={demonstrating && deliriumDemoSupported}
          neurologyDysreflexiaGuidance={session.guidance}
          neurologyDysreflexiaDemonstrating={demonstrating && dysreflexiaDemoSupported}
          obstetricsAtonyGuidance={session.guidance}
          obstetricsAtonyDemonstrating={demonstrating && atonyDemoSupported}
          obstetricsMaternalSepsisGuidance={session.guidance}
          obstetricsMaternalSepsisDemonstrating={demonstrating && maternalSepsisDemoSupported}
          obstetricsConcealedAbruptionGuidance={session.guidance}
          obstetricsConcealedAbruptionDemonstrating={demonstrating && concealedAbruptionDemoSupported}
          obstetricsPostpartumPreeclampsiaGuidance={session.guidance}
          obstetricsPostpartumPreeclampsiaDemonstrating={demonstrating && postpartumPreeclampsiaDemoSupported}
          obstetricsEclampsiaGuidance={session.guidance}
          obstetricsEclampsiaDemonstrating={demonstrating && eclampsiaDemoSupported}
          obstetricsAfeGuidance={session.guidance}
          obstetricsAfeDemonstrating={demonstrating && afeDemoSupported}
          obstetricsMaternalArrestGuidance={session.guidance}
          obstetricsMaternalArrestDemonstrating={demonstrating && maternalArrestDemoSupported}
          obstetricsShoulderDystociaGuidance={session.guidance}
          obstetricsShoulderDystociaDemonstrating={demonstrating && shoulderDystociaDemoSupported}
          obstetricsCordProlapseGuidance={session.guidance}
          obstetricsCordProlapseDemonstrating={demonstrating && cordProlapseDemoSupported}
          obstetricsUterineRuptureGuidance={session.guidance}
          obstetricsUterineRuptureDemonstrating={demonstrating && uterineRuptureDemoSupported}
          obstetricsMagnesiumToxicityGuidance={session.guidance}
          obstetricsMagnesiumToxicityDemonstrating={demonstrating && magnesiumToxicityDemoSupported}
          obstetricsHighNeuraxialGuidance={session.guidance}
          obstetricsHighNeuraxialDemonstrating={demonstrating && highNeuraxialDemoSupported}
          obstetricsFailedIntubationGuidance={session.guidance}
          obstetricsFailedIntubationDemonstrating={demonstrating && failedIntubationDemoSupported}
          obstetricsMaternalNeonatalHandoffGuidance={session.guidance}
          obstetricsMaternalNeonatalHandoffDemonstrating={demonstrating && maternalNeonatalHandoffDemoSupported}
          obstetricsOxytocinTachysystoleGuidance={session.guidance}
          obstetricsOxytocinTachysystoleDemonstrating={demonstrating && oxytocinTachysystoleDemoSupported}
          acuteSevereAsthmaGuidance={session.guidance}
          acuteSevereAsthmaDemonstrating={demonstrating && acuteSevereAsthmaDemoSupported}
          copdTransitionGuidance={session.guidance}
          copdTransitionDemonstrating={demonstrating && copdTransitionDemoSupported}
          capHypoxemiaGuidance={session.guidance}
          capHypoxemiaDemonstrating={demonstrating && capHypoxemiaDemoSupported}
          postPeDyspneaGuidance={session.guidance}
          postPeDyspneaDemonstrating={demonstrating && postPeDyspneaDemoSupported}
          apeSupportGuidance={session.guidance}
          apeSupportDemonstrating={demonstrating && apeSupportDemoSupported}
          postTensionPneumothoraxGuidance={session.guidance}
          postTensionPneumothoraxDemonstrating={demonstrating && postTensionPneumothoraxDemoSupported}
          lostContingencyDemonstrating={demonstrating && lostContingencyDemoSupported}
          oxygenTargetScaleDemonstrating={demonstrating && oxygenTargetScaleDemoSupported}
          lastKnownWellDemonstrating={demonstrating && lastKnownWellDemoSupported}
          proxyScaleDemonstrating={demonstrating && proxyScaleDemoSupported}
          quietPatientDemonstrating={demonstrating && quietPatientDemoSupported}
          afferentLimbDemonstrating={demonstrating && afferentLimbDemoSupported}
          pairedReadingDemonstrating={demonstrating && pairedReadingDemoSupported}
          countedRateDemonstrating={demonstrating && countedRateDemoSupported}
          lowScoreDemonstrating={demonstrating && lowScoreDemoSupported}
          countedRate={equipment?.resuscitation.countedRate}
          pairedReading={equipment?.resuscitation.pairedReading}
          afferentLimb={equipment?.resuscitation.afferentLimb}
          quietPatient={equipment?.resuscitation.quietPatient}
          proxyScale={equipment?.resuscitation.proxyScale}
          lastKnownWell={equipment?.resuscitation.lastKnownWell}
          oxygenTargetScale={equipment?.resuscitation.oxygenTargetScale}
          lostContingency={equipment?.resuscitation.lostContingency}
          delayedImmuneEvent={equipment?.resuscitation.delayedImmuneEvent}
          incidentalClot={equipment?.resuscitation.incidentalClot}
          normalTestToxicity={equipment?.resuscitation.normalTestToxicity}
          prognosisQuestion={equipment?.resuscitation.prognosisQuestion}
          laboratoryTls={equipment?.resuscitation.laboratoryTls}
          rareEarlyMyocarditis={equipment?.resuscitation.rareEarlyMyocarditis}
          loweringTheCount={equipment?.resuscitation.loweringTheCount}
          inheritedUrgency={equipment?.resuscitation.inheritedUrgency}
          trialRule={equipment?.resuscitation.trialRule}
          silentInteraction={equipment?.resuscitation.silentInteraction}
          easyLabel={equipment?.resuscitation.easyLabel}
          renalHyponatremiaGuidance={session.guidance}
          delayedImmuneEventGuidance={session.guidance}
          incidentalClotGuidance={session.guidance}
          normalTestToxicityGuidance={session.guidance}
          prognosisQuestionGuidance={session.guidance}
          laboratoryTlsGuidance={session.guidance}
          rareEarlyMyocarditisGuidance={session.guidance}
          loweringTheCountGuidance={session.guidance}
          inheritedUrgencyGuidance={session.guidance}
          trialRuleGuidance={session.guidance}
          silentInteractionGuidance={session.guidance}
          easyLabelGuidance={session.guidance}
          endocrineDkaResolutionGuidance={session.guidance}
          endocrineDkaResolutionDemonstrating={demonstrating && dkaResolutionDemoSupported}
          endocrineHhsGuidance={session.guidance}
          endocrineHhsDemonstrating={demonstrating && hhsOsmolalityDemoSupported}
          renalHypernatremiaGuidance={session.guidance}
          renalHypocalcemiaGuidance={session.guidance}
          renalHypermagnesemiaGuidance={session.guidance}
          renalHyponatremiaDemonstrating={demonstrating && renalHyponatremiaDemoSupported}
          renalHypernatremiaDemonstrating={demonstrating && renalHypernatremiaDemoSupported}
          renalHypocalcemiaDemonstrating={demonstrating && renalHypocalcemiaDemoSupported}
          renalHypermagnesemiaDemonstrating={demonstrating && renalHypermagnesemiaDemoSupported}
          onRenalHyponatremiaTutorSource={session.pause}
          onRenalHypernatremiaTutorSource={session.pause}
          onRenalHypocalcemiaTutorSource={session.pause}
          onRenalHypermagnesemiaTutorSource={session.pause}
          renalHypokalemiaDemonstrating={demonstrating && renalHypokalemiaDemoSupported}
          onRenalHypokalemiaTutorSource={session.pause}
          renalHyperkalemiaDemonstrating={demonstrating && renalHyperkalemiaDemoSupported}
          onRenalHyperkalemiaTutorSource={session.pause}
          perioperativeDiabetesDemonstrating={demonstrating && perioperativeDiabetesDemoSupported}
          onPerioperativeDiabetesTutorSource={session.pause}
          refeedingDemonstrating={demonstrating && refeedingDemoSupported}
          onRefeedingTutorSource={session.pause}
          avpDeficiencyDemonstrating={demonstrating && avpDeficiencyDemoSupported}
          onAvpDeficiencyTutorSource={session.pause}
          hyponatremiaCorrectionDemonstrating={demonstrating && hyponatremiaCorrectionDemoSupported}
          onHyponatremiaCorrectionTutorSource={session.pause}
          hypocalcemiaDemonstrating={demonstrating && hypocalcemiaDemoSupported}
          onHypocalcemiaTutorSource={session.pause}
          hypercalcemiaDemonstrating={demonstrating && hypercalcemiaDemoSupported}
          onHypercalcemiaTutorSource={session.pause}
          myxedemaDemonstrating={demonstrating && myxedemaDemoSupported}
          onMyxedemaTutorSource={session.pause}
          thyroidDemonstrating={demonstrating && thyroidDemoSupported}
          onThyroidTutorSource={session.pause}
          adrenalGuidance={session.guidance}
          adrenalDemonstrating={demonstrating && adrenalDemoSupported}
          onAdrenalTutorSource={session.pause}
          hypoglycemiaDemonstrating={demonstrating && hypoglycemiaDemoSupported}
          scenario={scenario}
          region={region}
          infusions={infusions}
          hypnoticLine={hypnoticLine}
          capnographyLine={capnographyLine}
          arterialLine={arterialLine}
          breathingCircuit={breathingCircuit}
          resuscitation={resuscitation}
          injectedCrisisIds={injectedCrises}
          lastExposure={lastExposure}
          syringeRemaining={syringeRemaining}
          ventilator={ventilator}
          intubated={airway.intubated}
          airwayAttempts={airway.attempts}
          lastGrade={airway.lastGrade}
          airwayAttemptInProgress={airway.attemptInProgress}
          airwayAttemptSecondsRemaining={airway.attemptSecondsRemaining}
          jawThrustCpapSecondsRemaining={airway.jawThrustCpapSecondsRemaining}
          airwayDevice={airway.device}
          supraglotticInsertionSecondsRemaining={airway.supraglotticInsertionSecondsRemaining}
          helpRequestedAtTick={airway.helpRequestedAtTick}
          muscleRigidityFraction={session.state?.muscleRigidityFraction ?? 0}
          bronchospasmSeverity={airway.bronchospasmSeverity}
          trainOfFourRatio={session.state?.trainOfFourRatio ?? 1}
          trainOfFourCount={session.state?.trainOfFourCount ?? 4}
          prothrombinTimeRatio={session.state?.prothrombinTimeRatio}
          fibrinogenGPerL={session.state?.fibrinogenGPerL}
          onBolus={(drugId, amount, unit) => session.act({ type: 'bolus', payload: { drugId, amount, unit } })}
          onInfusion={(drugId, rate, unit) => session.act({ type: 'infusion', payload: { drugId, rate, unit } })}
          onHypnoticLine={(action) => session.act({ type: 'hypnotic-line', payload: { action } })}
          onCapnographyLine={(action) => session.act({
            type: 'capnography-line', payload: { action },
          })}
          onArterialLine={(action) => session.act({
            type: 'arterial-line', payload: { action },
          })}
          onBreathingCircuit={(action) => session.act({
            type: 'breathing-circuit', payload: { action },
          })}
          onFluid={(fluidId, volumeMl) => session.act({ type: 'fluid', payload: { fluidId, volumeMl } })}
          onBloodProduct={(productId, units) => session.act({
            type: 'blood-product', payload: { productId, units },
          })}
          onBloodBankRequest={() => session.act({ type: 'blood-bank-request', payload: {} })}
          onCoagulationLabs={() => session.act({ type: 'coagulation-labs', payload: {} })}
          onVentilator={(settings) => session.act({ type: 'ventilator', payload: settings as never })}
          onLaryngoscopy={(technique) => session.act({ type: 'laryngoscopy', payload: { technique } })}
          onAirwayManeuver={(maneuver) => session.act({ type: 'airway-maneuver', payload: { maneuver } })}
          onCallForHelp={() => session.act({ type: 'call-for-help', payload: { context: 'airway' } })}
          onAirwayDevice={(device) => session.act({ type: 'airway-device', payload: { device } })}
          onEpinephrine={(doseMicrograms) => session.act({
            type: 'epinephrine', payload: { route: 'iv', doseMicrograms },
          })}
          onEphedrine={(doseMg) => session.act({
            type: 'ephedrine', payload: { route: 'iv', doseMg },
          })}
          onPreeclampsiaResponse={(action) => session.act({
            type: 'preeclampsia-response', payload: { action },
          })}
          onHighSpinalHelp={() => session.act({
            type: 'call-for-help', payload: { context: 'high-spinal' },
          })}
          onVenousAirEmbolismHelp={() => session.act({
            type: 'call-for-help', payload: { context: 'venous-air-embolism' },
          })}
          onControlVenousAirEntry={() => session.act({
            type: 'control-venous-air-entry', payload: { method: 'stop-entry' },
          })}
          onPneumothoraxHelp={() => session.act({
            type: 'call-for-help', payload: { context: 'tension-pneumothorax' },
          })}
          onPneumothoraxResponse={(action) => session.act({
            type: 'pneumothorax-response', payload: { action },
          })}
          onAspirationRiskAssessment={(action) => session.act({
            type: 'aspiration-risk-assessment', payload: { action },
          })}
          onEmergenceResidualBlockAssessment={(action) => session.act({
            type: 'emergence-residual-block-assessment', payload: { action },
          })}
          onDelayedEmergenceAssessment={(action) => session.act({
            type: 'delayed-emergence-assessment', payload: { action },
          })}
          onExtubationReadinessAssessment={(action) => session.act({
            type: 'extubation-readiness-assessment', payload: { action },
          })}
          onOpioidVentilatoryResponse={(response) => session.act({
            type: 'opioid-ventilatory-response', payload: { response },
          })}
          onThermalResponse={(response) => session.act({
            type: 'thermal-response', payload: { response },
          })}
          onGlycemicResponse={(response) => session.act({
            type: 'glycemic-response', payload: { response },
          })}
          onCiedPlanningAssessment={(action) => session.act({
            type: 'cied-planning-assessment', payload: { action },
          })}
          onPostoperativeHandoffAssessment={(action) => session.act({
            type: 'postoperative-handoff-assessment', payload: { action },
          })}
          onUndifferentiatedShockAssessment={(action) => session.act({
            type: 'undifferentiated-shock-assessment', payload: { action },
          })}
          onSepticShockAssessment={(action) => session.act({
            type: 'septic-shock-assessment', payload: { action },
          })}
          onHemorrhagicShockAssessment={(action) => session.act({
            type: 'hemorrhagic-shock-assessment', payload: { action },
          })}
          onCardiacTamponadeAssessment={(action) => session.act({
            type: 'cardiac-tamponade-assessment', payload: { action },
          })}
          onEmergencyAnaphylaxisResponse={(action) => session.act({
            type: 'emergency-anaphylaxis-response', payload: { action },
          })}
          onAdultAsthmaResponse={(action) => session.act({
            type: 'adult-asthma-response', payload: { action },
          })}
          onCopdExacerbationResponse={(action) => session.act({
            type: 'copd-exacerbation-response', payload: { action },
          })}
          onAcutePulmonaryEdemaResponse={(action) => session.act({
            type: 'acute-pulmonary-edema-response', payload: { action },
          })}
          onPulmonaryEmbolismResponse={(action) => session.act({
            type: 'pulmonary-embolism-deterioration-response', payload: { action },
          })}
          onStemiResponse={(action) => session.act({
            type: 'stemi-response', payload: { action },
          })}
          onUnstableNarrowTachycardiaResponse={(action) => session.act({
            type: 'unstable-narrow-tachycardia-response', payload: { action },
          })}
          onUnstableBradycardiaResponse={(action) => session.act({
            type: 'unstable-bradycardia-response', payload: { action },
          })}
          onStatusEpilepticusResponse={(action) => session.act({
            type: 'status-epilepticus-response', payload: { action },
          })}
          onAcuteIschemicStrokeResponse={(action) => session.act({
            type: 'acute-ischemic-stroke-response', payload: { action },
          })}
          onIntracranialHemorrhageResponse={(action) => session.act({
            type: 'intracranial-hemorrhage-response', payload: { action },
          })}
          onDiabeticKetoacidosisResponse={(action) => session.act({
            type: 'diabetic-ketoacidosis-response', payload: { action },
          })}
          onHyperkalemiaResponse={(action) => session.act({
            type: 'hyperkalemia-response', payload: { action },
          })}
          onHyponatremiaResponse={(action) => session.act({
            type: 'hyponatremia-response', payload: { action },
          })}
          onOpioidToxicityResponse={(action) => session.act({
            type: 'opioid-toxicity-response', payload: { action },
          })}
          onHeatStrokeResponse={(action) => session.act({
            type: 'heat-stroke-response', payload: { action },
          })}
          onTraumaPrimarySurveyResponse={(action) => session.act({
            type: 'trauma-primary-survey-response', payload: { action },
          })}
          onAcuteAorticSyndromeResponse={(action) => session.act({
            type: 'acute-aortic-syndrome-response', payload: { action },
          })}
          onArdsLungProtectiveResponse={(action) => session.act({
            type: 'ards-lung-protective-response', payload: { action },
          })}
          onEscalatingHypoxemiaResponse={(action) => session.act({
            type: 'escalating-hypoxemia-response', payload: { action },
          })}
          onVentilatorDyssynchronyResponse={(action) => session.act({
            type: 'ventilator-dyssynchrony-response', payload: { action },
          })}
          onAutoPeepResponse={(action) => session.act({
            type: 'auto-peep-response', payload: { action },
          })}
          onMucusPluggingResponse={(action) => session.act({
            type: 'mucus-plugging-response', payload: { action },
          })}
          onUnplannedExtubationResponse={(action) => session.act({
            type: 'unplanned-extubation-response', payload: { action },
          })}
          onSpontaneousBreathingTrialResponse={(action) => session.act({
            type: 'spontaneous-breathing-trial-response', payload: { action },
          })}
          onPostIntubationHypotensionResponse={(action) => session.act({
            type: 'post-intubation-hypotension-response', payload: { action },
          })}
          onCardiogenicShockResponse={(action) => session.act({
            type: 'cardiogenic-shock-response', payload: { action },
          })}
          onMixedShockResponse={(action) => session.act({
            type: 'mixed-shock-response', payload: { action },
          })}
          onRightVentricularFailureResponse={(action) => session.act({
            type: 'right-ventricular-failure-response', payload: { action },
          })}
          onMassivePulmonaryEmbolismResponse={(action) => session.act({
            type: 'massive-pulmonary-embolism-response', payload: { action },
          })}
          onUpperGiHemorrhageResponse={(action) => session.act({
            type: 'upper-gi-hemorrhage-response', payload: { action },
          })}
          onCriticalCareStatusEpilepticusResponse={(action) => session.act({
            type: 'critical-care-status-epilepticus-response', payload: { action },
          })}
          onPostArrestTemperatureResponse={(action) => session.act({
            type: 'targeted-temperature-management-response', payload: { action },
          })}
          onIntracranialHypertensionResponse={(action) => session.act({
            type: 'intracranial-hypertension-response', payload: { action },
          })}
          onAkiFluidOverloadResponse={(action) => session.act({
            type: 'aki-fluid-overload-response', payload: { action },
          })}
          onSevereAcidemiaResponse={(action) => session.act({
            type: 'severe-acidemia-response', payload: { action },
          })}
          onIcuHiddenDeteriorationHandoffResponse={(action) => session.act({
            type: 'icu-hidden-deterioration-handoff-response', payload: { action },
          })}
          onVentilatorCircuitDisconnectionResponse={(action) => session.act({
            type: 'ventilator-circuit-disconnection-response', payload: { action },
          })}
          onDelayedVasopressorDeliveryResponse={(action) => session.act({
            type: 'delayed-vasopressor-delivery-response', payload: { action },
          })}
          onPulseOximeterArtifactResponse={(action) => session.act({
            type: 'pulse-oximeter-artifact-response', payload: { action },
          })}
          onEndotrachealTubeMigrationResponse={(action) => session.act({
            type: 'endotracheal-tube-migration-response', payload: { action },
          })}
          onSepticShockResuscitationResponse={(action) => session.act({
            type: 'septic-shock-resuscitation-response', payload: { action },
          })}
          onStableChestPainResponse={(action) => session.act({
            type: 'stable-chest-pain-response', payload: { action },
          })}
          onNstemiRiskResponse={(action) => session.act({
            type: 'nstemi-risk-response', payload: { action },
          })}
          onClinicStemiResponse={(action) => session.act({
            type: 'clinic-stemi-response', payload: { action },
          })}
          onHeartFailureResponse={(action) => session.act({
            type: 'heart-failure-response', payload: { action },
          })}
          onAfRvrResponse={(action) => session.act({
            type: 'af-rvr-response', payload: { action },
          })}
          onPostInfarctionShockResponse={(action) => session.act({
            type: 'post-infarction-shock-response', payload: { action },
          })}
          onStableNarrowTachycardiaResponse={(action) => session.act({
            type: 'stable-narrow-tachycardia-response', payload: { action },
          })}
          onStableWideTachycardiaResponse={(action) => session.act({
            type: 'stable-wide-tachycardia-response', payload: { action },
          })}
          onSymptomaticBradycardiaResponse={(action) => session.act({
            type: 'symptomatic-bradycardia-response', payload: { action },
          })}
          onCompleteHeartBlockResponse={(action) => session.act({
            type: 'complete-heart-block-response', payload: { action },
          })}
          onTorsadesResponse={(action) => session.act({
            type: 'torsades-response', payload: { action },
          })}
          onHyperkalemicConductionResponse={(action) => session.act({
            type: 'hyperkalemic-conduction-response', payload: { action },
          })}
          onPericardialTamponadeResponse={(action) => session.act({
            type: 'pericardial-tamponade-response', payload: { action },
          })}
          onRightVentricularInfarctionResponse={(action) => session.act({
            type: 'right-ventricular-infarction-response', payload: { action },
          })}
          onHypertensiveEmergencyResponse={(action) => session.act({
            type: 'hypertensive-emergency-response', payload: { action },
          })}
          onPacemakerCaptureFailureResponse={(action) => session.act({
            type: 'pacemaker-capture-failure-response', payload: { action },
          })}
          onTranscutaneousPacingCaptureResponse={(action) => session.act({
            type: 'transcutaneous-pacing-capture-response', payload: { action },
          })}
          onAcuteSevereAsthmaResponse={(action) => session.act({
            type: 'acute-severe-asthma-response', payload: { action },
          })}
          onCopdTransitionResponse={(action) => session.act({
            type: 'copd-exacerbation-transition-response', payload: { action },
          })}
          onCapHypoxemiaResponse={(action) => session.act({
            type: 'community-acquired-pneumonia-hypoxemia-response', payload: { action },
          })}
          onPostPeDyspneaResponse={(action) => session.act({
            type: 'post-pulmonary-embolism-persistent-dyspnea-response', payload: { action },
          })}
          onApeSupportResponse={(action) => session.act({
            type: 'acute-pulmonary-edema-respiratory-support-response', payload: { action },
          })}
          onPostTensionPneumothoraxResponse={(action) => session.act({
            type: 'spontaneous-tension-pneumothorax-post-drainage-response', payload: { action },
          })}
          onLargePleuralEffusionResponse={(action) => session.act({
            type: 'large-unilateral-pleural-effusion-response', payload: { action },
          })}
          onBronchiectasisMucusPluggingResponse={(action) => session.act({
            type: 'bronchiectasis-mucus-plugging-response', payload: { action },
          })}
          onChronicOpioidHypoventilationResponse={(action) => session.act({
            type: 'chronic-opioid-related-hypoventilation-response', payload: { action },
          })}
          onNeuromuscularRespiratoryFailureResponse={(action) => session.act({
            type: 'neuromuscular-respiratory-failure-response', payload: { action },
          })}
          onObesityHypoventilationResponse={(action) => session.act({
            type: 'obesity-hypoventilation-response', payload: { action },
          })}
          onNoninvasiveVentilationSelectionResponse={(action) => session.act({
            type: 'noninvasive-ventilation-selection-response', payload: { action },
          })}
          onHighFlowOxygenEscalationResponse={(action) => session.act({
            type: 'high-flow-nasal-oxygen-escalation-response', payload: { action },
          })}
          onOxygenDeviceFailureResponse={(action) => session.act({
            type: 'oxygen-device-failure-response', payload: { action },
          })}
          onAcuteTracheostomyObstructionResponse={(action) => session.act({
            type: 'acute-tracheostomy-obstruction-response', payload: { action },
          })}
          onPediatricRespiratoryDistressResponse={(action) => session.act({
            type: 'pediatric-respiratory-distress-response', payload: { action },
          })}
          onBronchiolitisResponse={(action) => session.act({
            type: 'bronchiolitis-response', payload: { action },
          })}
          onCroupResponse={(action) => session.act({
            type: 'croup-response', payload: { action },
          })}
          onPediatricStatusAsthmaticusResponse={(action) => session.act({
            type: 'pediatric-status-asthmaticus-response', payload: { action },
          })}
          onPediatricSepsisResponse={(action) => session.act({
            type: 'pediatric-sepsis-response', payload: { action },
          })}
          onPediatricSepticShockResponse={(action) => session.act({
            type: 'pediatric-septic-shock-response', payload: { action },
          })}
          onPediatricDehydrationResponse={(action) => session.act({
            type: 'pediatric-dehydration-response', payload: { action },
          })}
          onPediatricDiabeticKetoacidosisResponse={(action) => session.act({
            type: 'pediatric-diabetic-ketoacidosis-response', payload: { action },
          })}
          onPediatricHypoglycemicSeizureResponse={(action) => session.act({
            type: 'pediatric-hypoglycemic-seizure-response', payload: { action },
          })}
          onPediatricFebrileSeizureResponse={(action) => session.act({
            type: 'pediatric-febrile-seizure-response', payload: { action },
          })}
          onPediatricStatusEpilepticusResponse={(action) => session.act({
            type: 'pediatric-status-epilepticus-response', payload: { action },
          })}
          onPediatricAnaphylaxisResponse={(action) => session.act({
            type: 'pediatric-anaphylaxis-response', payload: { action },
          })}
          onPediatricSupraventricularTachycardiaResponse={(action) => session.act({
            type: 'pediatric-supraventricular-tachycardia-response', payload: { action },
          })}
          onPediatricBradycardicArrestResponse={(action) => session.act({
            type: 'pediatric-bradycardic-arrest-response', payload: { action },
          })}
          onPediatricForeignBodyAirwayObstructionResponse={(action) => session.act({
            type: 'pediatric-foreign-body-airway-obstruction-response', payload: { action },
          })}
          onPediatricInjurySafeguardingResponse={(action) => session.act({
            type: 'pediatric-injury-safeguarding-escalation-response', payload: { action },
          })}
          onNeurologyMinorStrokeResponse={(action) => session.act({
            type: 'minor-nondisabling-acute-ischemic-stroke-response', payload: { action },
          })}
          onNeurologyBasilarLvoResponse={(action) => session.act({
            type: 'basilar-artery-occlusion-escalation-response', payload: { action },
          })}
          onNeurologyCerebellarIchResponse={(action) => session.act({
            type: 'spontaneous-cerebellar-intracerebral-hemorrhage-response', payload: { action },
          })}
          onNeurologyAsahDeteriorationResponse={(action) => session.act({
            type: 'aneurysmal-subarachnoid-hemorrhage-deterioration-response', payload: { action },
          })}
          onNeurologyFocalMotorStatusResponse={(action) => session.act({
            type: 'focal-motor-status-epilepticus-escalation-response', payload: { action },
          })}
          onNeurologyNcseResponse={(action) => session.act({
            type: 'nonconvulsive-status-epilepticus-recognition-response', payload: { action },
          })}
          onNeurologyMyasthenicCrisisResponse={(action) => session.act({
            type: 'myasthenic-crisis-escalation-response', payload: { action },
          })}
          onNeurologyGbsResponse={(action) => session.act({
            type: 'guillain-barre-respiratory-decline-response', payload: { action },
          })}
          onNeurologyMeningitisResponse={(action) => session.act({
            type: 'acute-bacterial-meningitis-first-hour-response', payload: { action },
          })}
          onNeurologyEncephalitisResponse={(action) => session.act({
            type: 'suspected-herpes-simplex-encephalitis-response', payload: { action },
          })}
          onNeurologyRaisedIcpResponse={(action) => session.act({
            type: 'raised-intracranial-pressure-visual-threat-response', payload: { action },
          })}
          onNeurologyHerniationResponse={(action) => session.act({
            type: 'acute-transtentorial-herniation-pattern-response', payload: { action },
          })}
          onNeurologyMsccResponse={(action) => session.act({
            type: 'metastatic-spinal-cord-compression-response', payload: { action },
          })}
          onNeurologyDeliriumResponse={(action) => session.act({
            type: 'acute-delirium-reversible-causes-response', payload: { action },
          })}
          onNeurologyAutonomicDysreflexiaResponse={(action) => session.act({
            type: 'autonomic-dysreflexia-authored-trigger-response', payload: { action },
          })}
          onToxicologyMethemoglobinemiaResponse={(action) => session.act({
            type: 'methemoglobinemia-saturation-gap-response', payload: { action },
          })}
          onToxicologyCarbonMonoxideResponse={(action) => session.act({
            type: 'carbon-monoxide-reassuring-monitor-response', payload: { action },
          })}
          onToxicologyAcetaminophenResponse={(action) => session.act({
            type: 'acetaminophen-clock-and-nomogram-response', payload: { action },
          })}
          onToxicologySalicylateResponse={(action) => session.act({
            type: 'salicylate-falling-number-response', payload: { action },
          })}
          onToxicologyTricyclicResponse={(action) => session.act({
            type: 'tricyclic-sodium-channel-cardiotoxicity-response', payload: { action },
          })}
          onToxicologyBetaBlockerResponse={(action) => session.act({
            type: 'beta-blocker-cardiogenic-shock-response', payload: { action },
          })}
          onToxicologyCalciumChannelBlockerResponse={(action) => session.act({
            type: 'calcium-channel-blocker-shock-response', payload: { action },
          })}
          onToxicologyDigoxinResponse={(action) => session.act({
            type: 'digoxin-rhythm-potassium-response', payload: { action },
          })}
          onToxicologyCholinergicResponse={(action) => session.act({
            type: 'cholinergic-pesticide-respiratory-failure-response', payload: { action },
          })}
          onToxicologyAnticholinergicResponse={(action) => session.act({
            type: 'anticholinergic-hyperthermia-delirium-response', payload: { action },
          })}
          onToxicologySerotoninResponse={(action) => session.act({
            type: 'serotonin-toxicity-hyperthermia-clonus-response', payload: { action },
          })}
          onToxicologySympathomimeticResponse={(action) => session.act({
            type: 'sympathomimetic-hyperadrenergic-hyperthermia-response', payload: { action },
          })}
          onToxicologyMethanolResponse={(action) => session.act({
            type: 'methanol-visual-acidosis-gaps-response', payload: { action },
          })}
          onToxicologyDelayedLastResponse={(action) => session.act({
            type: 'delayed-local-anesthetic-cns-cardiac-toxicity-response', payload: { action },
          })}
          onToxicologyOpioidXylazineResponse={(action) => session.act({
            type: 'opioid-xylazine-persistent-sedation-response', payload: { action },
          })}
          onObstetricsAtonyResponse={(action) => session.act({
            type: 'postpartum-hemorrhage-uterine-atony-response', payload: { action },
          })}
          onObstetricsMaternalSepsisResponse={(action) => session.act({
            type: 'maternal-sepsis-postpartum-deterioration-response', payload: { action },
          })}
          onObstetricsConcealedAbruptionResponse={(action) => session.act({
            type: 'concealed-placental-abruption-hemorrhage-response', payload: { action },
          })}
          onObstetricsPostpartumPreeclampsiaResponse={(action) => session.act({
            type: 'postpartum-severe-preeclampsia-warning-signs-response', payload: { action },
          })}
          onObstetricsEclampsiaResponse={(action) => session.act({
            type: 'eclampsia-first-seizure-response', payload: { action },
          })}
          onObstetricsAfeResponse={(action) => session.act({
            type: 'suspected-amniotic-fluid-embolism-pattern-response', payload: { action },
          })}
          onObstetricsMaternalArrestResponse={(action) => session.act({
            type: 'maternal-cardiac-arrest-response', payload: { action },
          })}
          onObstetricsShoulderDystociaResponse={(action) => session.act({
            type: 'shoulder-dystocia-cognitive-sequence-response', payload: { action },
          })}
          onObstetricsCordProlapseResponse={(action) => session.act({
            type: 'umbilical-cord-prolapse-urgent-birth-coordination-response', payload: { action },
          })}
          onObstetricsUterineRuptureResponse={(action) => session.act({
            type: 'suspected-uterine-rupture-recognition-response', payload: { action },
          })}
          onObstetricsMagnesiumToxicityResponse={(action) => session.act({
            type: 'magnesium-sulfate-toxicity-recognition-response', payload: { action },
          })}
          onObstetricsHighNeuraxialResponse={(action) => session.act({
            type: 'high-neuraxial-block-obstetric-coordination-response', payload: { action },
          })}
          onObstetricsFailedIntubationResponse={(action) => session.act({
            type: 'failed-obstetric-intubation-oxygenation-first-response', payload: { action },
          })}
          onObstetricsMaternalNeonatalHandoffResponse={(action) => session.act({
            type: 'maternal-to-neonatal-resuscitation-handoff-response', payload: { action },
          })}
          onObstetricsOxytocinTachysystoleResponse={(action) => session.act({
            type: 'oxytocin-associated-uterine-tachysystole-response', payload: { action },
          })}
          onNeonatologyTermTransitionResponse={(action) => session.act({
            type: 'term-newborn-transition-response', payload: { action },
          })}
          onNeonatologyApneaResponse={(action) => session.act({
            type: 'neonatal-apnea-response', payload: { action },
          })}
          onNeonatologyIneffectiveVentilationResponse={(action) => session.act({
            type: 'ineffective-ventilation-correction-response', payload: { action },
          })}
          onNeonatologyBradycardiaResponse={(action) => session.act({
            type: 'neonatal-bradycardia-response', payload: { action },
          })}
          onNeonatologyMeconiumTransitionResponse={(action) => session.act({
            type: 'meconium-stained-transition-response', payload: { action },
          })}
          onNeonatologyPretermRespiratoryDistressResponse={(action) => session.act({
            type: 'preterm-respiratory-distress-response', payload: { action },
          })}
          onNeonatologyHypoglycemiaResponse={(action) => session.act({
            type: 'neonatal-hypoglycemia-response', payload: { action },
          })}
          onNeonatologySepsisResponse={(action) => session.act({
            type: 'neonatal-sepsis-response', payload: { action },
          })}
          onNeonatologyThermoregulationResponse={(action) => session.act({
            type: 'neonatal-thermoregulation-response', payload: { action },
          })}
          onNeonatologyNicuHandoffResponse={(action) => session.act({
            type: 'delivery-room-to-nicu-handoff-response', payload: { action },
          })}
          onNeonatologyTensionPneumothoraxResponse={(action) => session.act({
            type: 'neonatal-tension-pneumothorax-response', payload: { action },
          })}
          onEndocrineDkaResolutionResponse={(action) => session.act({
            type: 'dka-resolution-transition-response', payload: { action },
          })}
          onEndocrineHhsResponse={(action) => session.act({
            type: 'hhs-osmolality-trajectory-response', payload: { action },
          })}
          onSevereHypoglycemiaResponse={(action) => session.act({
            type: 'severe-hypoglycemia-response', payload: { action },
          })}
          onAdrenalCrisisResponse={(action) => session.act({
            type: 'adrenal-crisis-response', payload: { action },
          })}
          onThyroidStormResponse={(action) => session.act({
            type: 'thyroid-storm-response', payload: { action },
          })}
          onMyxedemaResponse={(action) => session.act({
            type: 'myxedema-response', payload: { action },
          })}
          onHypercalcemiaResponse={(action) => session.act({
            type: 'hypercalcemia-response', payload: { action },
          })}
          onHyponatremiaCorrectionResponse={(action) => session.act({
            type: 'hyponatremia-correction-response', payload: { action },
          })}
          onRenalHyponatremiaResponse={(action) => session.act({
            type: 'renal-hyponatremia-response', payload: { action },
          })}
          onRenalHypernatremiaResponse={(action) => session.act({
            type: 'renal-hypernatremia-response', payload: { action },
          })}
          onRenalHypocalcemiaResponse={(action) => session.act({
            type: 'renal-hypocalcemia-response', payload: { action },
          })}
          onRenalHypermagnesemiaResponse={(action) => session.act({
            type: 'renal-hypermagnesemia-response', payload: { action },
          })}
          onMeningococcalSepsisResponse={(action) => session.act({
            type: 'meningococcal-sepsis-response', payload: { action },
          })}
          onObstructedKidneyResponse={(action) => session.act({
            type: 'obstructed-kidney-response', payload: { action },
          })}
          onFebrileNeutropeniaResponse={(action) => session.act({
            type: 'febrile-neutropenia-response', payload: { action },
          })}
          onNecrotizingInfectionResponse={(action) => session.act({
            type: 'necrotizing-infection-response', payload: { action },
          })}
          onEndocarditisHeartFailureResponse={(action) => session.act({
            type: 'endocarditis-heart-failure-response', payload: { action },
          })}
          onSeverePneumoniaResponse={(action) => session.act({
            type: 'severe-pneumonia-response', payload: { action },
          })}
          onToxicShockResponse={(action) => session.act({
            type: 'toxic-shock-response', payload: { action },
          })}
          onPossibleSepsisResponse={(action) => session.act({
            type: 'possible-sepsis-response', payload: { action },
          })}
          onSepticShockLabelResponse={(action) => session.act({
            type: 'septic-shock-label-response', payload: { action },
          })}
          onMeningitisImagingResponse={(action) => session.act({
            type: 'meningitis-imaging-response', payload: { action },
          })}
          onLowScoreResponse={(action) => session.act({
            type: 'low-score-response', payload: { action },
          })}
          onCountedRateResponse={(action) => session.act({
            type: 'counted-rate-response', payload: { action },
          })}
          onPairedReadingResponse={(action) => session.act({
            type: 'paired-reading-response', payload: { action },
          })}
          onAfferentLimbResponse={(action) => session.act({
            type: 'afferent-limb-response', payload: { action },
          })}
          onQuietPatientResponse={(action) => session.act({
            type: 'quiet-patient-response', payload: { action },
          })}
          onProxyScaleResponse={(action) => session.act({
            type: 'proxy-scale-response', payload: { action },
          })}
          onLostContingencyResponse={(action) => session.act({
            type: 'lost-contingency-response', payload: { action },
          })}
          onDelayedImmuneEventResponse={(action) => session.act({
            type: 'delayed-immune-event-response', payload: { action },
          })}
          onIncidentalClotResponse={(action) => session.act({
            type: 'incidental-clot-response', payload: { action },
          })}
          onNormalTestToxicityResponse={(action) => session.act({
            type: 'normal-test-toxicity-response', payload: { action },
          })}
          onPrognosisQuestionResponse={(action) => session.act({
            type: 'prognosis-question-response', payload: { action },
          })}
          onLaboratoryTlsResponse={(action) => session.act({
            type: 'laboratory-tls-response', payload: { action },
          })}
          onRareEarlyMyocarditisResponse={(action) => session.act({
            type: 'rare-early-myocarditis-response', payload: { action },
          })}
          onLoweringTheCountResponse={(action) => session.act({
            type: 'lowering-the-count-response', payload: { action },
          })}
          onInheritedUrgencyResponse={(action) => session.act({
            type: 'inherited-urgency-response', payload: { action },
          })}
          onTrialRuleResponse={(action) => session.act({
            type: 'trial-rule-response', payload: { action },
          })}
          onSilentInteractionResponse={(action) => session.act({
            type: 'silent-interaction-response', payload: { action },
          })}
          onEasyLabelResponse={(action) => session.act({
            type: 'easy-label-response', payload: { action },
          })}
          onOxygenTargetScaleResponse={(action) => session.act({
            type: 'oxygen-target-scale-response', payload: { action },
          })}
          onLastKnownWellResponse={(action) => session.act({
            type: 'last-known-well-response', payload: { action },
          })}
          onRenalHypokalemiaResponse={(action) => session.act({
            type: 'renal-hypokalemia-response', payload: { action },
          })}
          onRenalHyperkalemiaResponse={(action) => session.act({
            type: 'renal-hyperkalemia-response', payload: { action },
          })}
          onPerioperativeDiabetesResponse={(action) => session.act({
            type: 'perioperative-diabetes-response', payload: { action },
          })}
          onRefeedingResponse={(action) => session.act({
            type: 'refeeding-response', payload: { action },
          })}
          onAvpDeficiencyResponse={(action) => session.act({
            type: 'avp-deficiency-response', payload: { action },
          })}
          onHypocalcemiaResponse={(action) => session.act({
            type: 'hypocalcemia-response', payload: { action },
          })}
          onBronchospasmHelp={() => session.act({
            type: 'call-for-help', payload: { context: 'bronchospasm' },
          })}
          onInhaledBronchodilator={() => session.act({
            type: 'inhaled-bronchodilator', payload: {
              agentId: 'salbutamol', route: 'nebulized', doseMg: 5,
            },
          })}
          onDantrolene={() => session.act({
            type: 'dantrolene', payload: { route: 'iv', doseMgPerKg: 2.5 },
          })}
          onActiveCooling={(active) => session.act({ type: 'active-cooling', payload: { active } })}
          onSeizureSuppression={() => session.act({
            type: 'seizure-suppression', payload: { route: 'iv', medicationClass: 'benzodiazepine' },
          })}
          onLipidEmulsion={() => session.act({
            type: 'lipid-emulsion', payload: {
              route: 'iv', protocol: 'initial', concentrationPercent: 20,
            },
          })}
          onChestCompressions={(active) => session.act({
            type: 'chest-compressions', payload: { active },
          })}
          onArrestEpinephrine={() => session.act({
            type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: 1 },
          })}
          onDefibrillation={(energyJ) => session.act({
            type: 'defibrillation', payload: { energyJ, waveform: 'biphasic' },
          })}
          onNeuromuscularReversal={(agent, doseMgPerKg) => session.act({
            type: 'neuromuscular-reversal', payload: {
              agent, route: 'iv', ...(doseMgPerKg === undefined ? {} : { doseMgPerKg }),
              ...(agent === 'neostigmine' ? { antimuscarinic: true } : {}),
            },
          })}
          onDrugCard={setDrugCardId}
        />
      </div>

      {/* Small screens: the Analysis region and the Action Cockpit open as overlays. */}
      <div className="mobile-actions">
        <Button onClick={() => setAnalysisOpen((open) => !open)}>
          {moduleId === 'emergency-medicine' ? 'Review' : 'Analysis'}
        </Button>
        <Button variant="primary" onClick={() => setActionsOpen((open) => !open)}>Actions</Button>
      </div>

      {/* Guidance. Non-blocking, dismissible, and never shown during an alarm. */}
      {!demonstrating && scenario.metadata.id !== 'adrenal-crisis-treatment-before-tests' && scenario.metadata.id !== 'thyroid-storm-hemodynamic-risk' && scenario.metadata.id !== 'myxedema-coma-ventilation-and-steroid-sequence' && !observedStateDemoSupported && tutorIntroductionOpen && session.alarms.length === 0 ? (
        <TutorIntroduction onDismissPermanently={() => {
          setTutorIntroductionDismissed(true);
          setTutorIntroductionOpen(false);
        }} />
      ) : !demonstrating && scenario.metadata.id !== 'adrenal-crisis-treatment-before-tests' && scenario.metadata.id !== 'thyroid-storm-hemodynamic-risk' && scenario.metadata.id !== 'myxedema-coma-ventilation-and-steroid-sequence' && !observedStateDemoSupported && !tutorIntroductionOpen && prompt ? (
        <TutorPromptCard
          prompt={prompt}
          collapsed={tutorCollapsed}
          whyOpen={promptWhyOpen}
          onToggleCollapsed={() => setTutorCollapsed((collapsed) => !collapsed)}
          onToggleWhy={() => setPromptWhyOpen((open) => !open)}
          onDismiss={() => {
            setPrompt(null);
            setPromptWhyOpen(false);
            setTutorCollapsed(false);
          }}
          onOpenSource={() => {
            session.pause();
            setExplainerId(prompt.concept!);
          }}
        />
      ) : null}

      {/* The live regions. Polite for ordinary change, assertive for critical. */}
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">{announcement}</div>
      <div className="visually-hidden" role="alert">{criticalAnnouncement}</div>
      <span className="visually-hidden">{PERSISTENT_MARKER_TEXT}</span>

      <WhyPanel
        open={whyField !== null}
        field={whyField}
        value={whyField && session.state && !((equipment?.resuscitation.myxedema || equipment?.resuscitation.hypercalcemia || equipment?.resuscitation.hypocalcemia || equipment?.resuscitation.hyponatremiaCorrection || equipment?.resuscitation.avpDeficiency || equipment?.resuscitation.refeeding || equipment?.resuscitation.perioperativeDiabetes || equipment?.resuscitation.renalHyperkalemia || equipment?.resuscitation.renalHypokalemia || equipment?.resuscitation.renalHyponatremia || equipment?.resuscitation.renalHypernatremia || equipment?.resuscitation.renalHypocalcemia || equipment?.resuscitation.renalHypermagnesemia) && invalidParameters.has(whyField))
          ? session.state[whyField] ?? null : null}
        authoredExplanation={equipment?.resuscitation.renalHypermagnesemia
          ? 'These are authored breathing, circulation, and magnesium teaching states, not predicted drug or removal kinetics. Magnesium-only and neuromuscular-only checks retain separate historical timestamps and do not refresh the full assessment. Calcium temporarily counters toxicity without removing magnesium. An improved supported respiratory rate is not independent breathing. No ECG interval, new renal clearance, or durable recovery is inferred. Exhaled carbon dioxide and oxygen settings are not supplied.'
          : equipment?.resuscitation.renalHypocalcemia
          ? 'These are authored calcium and symptom teaching states, not predicted drug or mineral kinetics. Ionized-calcium-only and symptom-only checks retain separate historical timestamps and do not refresh the full assessment. The supplied adjusted total estimate does not override measured ionized calcium. The historical QTc is not measured by this waveform. Relief does not establish durable control; continuing care and longer-term follow-up remain necessary. Exhaled carbon dioxide and oxygen settings are not supplied.'
          : equipment?.resuscitation.renalHypernatremia
          ? 'These are authored circulation and water-balance teaching states, not predicted sodium or fluid kinetics. Sodium-only and fluid-balance-only checks retain separate historical timestamps and do not refresh the full assessment. Better circulation does not establish sodium correction. Access assistance is distinct from water replacement; ongoing-loss care does not instantly stop diarrhea. No new urine concentration or renal clearance is inferred. Exhaled carbon dioxide and oxygen settings are not supplied.'
          : equipment?.resuscitation.renalHyponatremia
          ? 'These are authored teaching states, not predicted sodium kinetics or neurologic recovery. Sodium-only and neurologic-only checks are separate requested historical observations and do not refresh the full paired assessment. The original sodium of 118 remains the correction baseline. A sodium rise does not establish symptom resolution or a clinical stopping rule. Expert treatment review and cause evaluation continue. Exhaled carbon dioxide and oxygen settings are not supplied.'
          : equipment?.resuscitation.renalHypokalemia
          ? 'These are authored teaching states, not predicted potassium or magnesium kinetics. Potassium-only and ECG-only checks are separate requested historical observations; neither refreshes the full magnesium and bedside assessment. The qualitative flattened-T waveform supplies no U-wave or QTc measurement. Ongoing-loss care does not instantly stop diarrhea. Improved findings do not prove durable control. Exhaled carbon dioxide and oxygen settings are not supplied.'
          : equipment?.resuscitation.renalHyperkalemia
          ? 'These are authored teaching states, not predicted potassium or treatment kinetics. Calcium cardioprotection does not lower potassium. ECG-only and glucose-only checks are separate requested historical observations and do not refresh potassium. The ECG waveform is not calibrated to QRS duration or potassium concentration. Improved findings do not prove durable control. Exhaled carbon dioxide and oxygen settings are not supplied.'
          : equipment?.resuscitation.perioperativeDiabetes
          ? 'These are authored teaching states, not predicted insulin or ketone kinetics. Blood glucose and full glucose/ketone assessments are separate requested historical observations. A glucose-only check does not refresh ketones. Improved findings do not diagnose or exclude ketoacidosis or automatically clear surgery. Exhaled carbon dioxide and oxygen settings are not supplied.'
          : equipment?.resuscitation.refeeding
          ? 'These are authored teaching states, not predicted nutrition or electrolyte kinetics. Electrolytes appear only as requested historical observations. Accepted care and improved symptoms do not establish sustained correction or feeding safety. Exhaled carbon dioxide and oxygen settings are not supplied.'
          : equipment?.resuscitation.avpDeficiency
          ? 'These are authored circulation and water-balance teaching states, not predicted physiology or treatment kinetics. Sodium, urine output, and urine osmolality appear only as requested historical observations. Improved circulation or less urine does not prove sodium normalization or recovery. The supplied sodium of 162 and highest observed sodium remain part of the history. Exhaled carbon dioxide and oxygen settings are not supplied.'
          : equipment?.resuscitation.hyponatremiaCorrection
          ? 'These are authored teaching states, not predicted sodium or drug kinetics. Sodium and urine output appear only as requested historical observations. The original correction window and observed peak are never reset; improved alertness and relowering do not prove neurologic safety. Exhaled carbon dioxide and oxygen settings are not supplied.'
          : equipment?.resuscitation.hypocalcemia
          ? 'These are authored teaching states, not predicted physiology or treatment kinetics. Exhaled carbon dioxide and oxygen settings are not supplied. Calcium is shown only as an explicitly requested historical observation. The supplied QTc is not calculated by the waveform; symptom relief does not establish sustained calcium control.'
          : equipment?.resuscitation.hypercalcemia
          ? 'These are authored teaching states, not predicted physiology or treatment kinetics. Exhaled carbon dioxide and oxygen settings are not supplied. Calcium is shown only as an explicitly requested historical observation; improved circulation does not prove calcium control.'
          : equipment?.resuscitation.myxedema
          ? 'These are authored teaching states, not predicted physiology or treatment kinetics. Exhaled carbon dioxide and oxygen settings are not supplied; arterial carbon dioxide appears only in a requested bedside assessment.'
          : undefined}
        attribution={session.attribution}
        onClose={() => setWhyField(null)}
        onOpenExplainer={setExplainerId}
        onOpenDrugCard={setDrugCardId}
      />

      <Drawer open={explainerId !== null} title={explainerId ? getExplainer(explainerId).title : ''} onClose={() => setExplainerId(null)}>
        {explainerId && (
          <div className="reading" style={{ padding: 0 }}>
            {getExplainer(explainerId).body.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <p className="reading__aside">{getExplainer(explainerId).diagram.caption}</p>
            <p className="reading__aside">Reflects: {getExplainer(explainerId).reflects}</p>
            {onReportSource && (
              <Button compact variant="ghost" onClick={onReportSource}>Help us improve this source</Button>
            )}
            <UnreviewedMarker
              status={getExplainer(explainerId).maturity}
              subjectKind="explanation"
              subjectId={getExplainer(explainerId).id}
              contentVersion={getExplainer(explainerId).review.contentVersion}
              review={getExplainer(explainerId).review}
            />
            {reviewMode && (
              <FlagControl
                itemKey={`explainer:${explainerId}`}
                itemLabel={getExplainer(explainerId).title}
                contentVersion={getExplainer(explainerId).review.contentVersion}
                appVersion={APP_VERSION}
                now={() => new Date().toISOString()}
              />
            )}
          </div>
        )}
      </Drawer>

      <Drawer open={drugCardId !== null} title={drugCardId ? (getDrugCard(drugCardId)?.name ?? '') : ''} onClose={() => setDrugCardId(null)}>
        {drugCardId && getDrugCard(drugCardId) && (
          <>
            <DrugCardBody drugId={drugCardId} reviewMode={reviewMode} />
            {onReportSource && (
              <Button compact variant="ghost" onClick={onReportSource}>Help us improve this source</Button>
            )}
          </>
        )}
      </Drawer>

      <Modal open={shortcutsOpen} title="More options" onClose={() => setShortcutsOpen(false)}
        footer={<Button onClick={() => setShortcutsOpen(false)}>Close</Button>}>
        {/* Speed, step, and reset leave the status bar under its phone sacrifice
            order. Every removal stays reachable here at every width. */}
        <div className="overflow-menu__speed">
          <SegmentedControl<SpeedMultiplier>
            label="Simulation speed"
            value={session.speed}
            onChange={(speed: SpeedMultiplier) => session.setSpeed(speed)}
            options={SPEED_MULTIPLIERS.map((multiplier) => ({
              value: multiplier,
              label: `${multiplier}×`,
              srLabel: `${multiplier} times speed`,
            }))}
          />
          <p className="field__hint">{scenario.patient.procedure}</p>
          <Button onClick={session.singleStep}>Advance one simulated second</Button>
          <Button onClick={resetScenario}>Reset the scenario</Button>
        </div>
        <UpdateNotice surface="session" />
        <div className="overflow-menu__sound">
          <Toggle
            checked={soundOn}
            onChange={(next: boolean) => {
              setSoundOn(next);
              // Web Audio needs a user gesture to start, and this click is one.
              if (next) void audio.enable();
            }}
            label={soundOn ? 'Sound on' : 'Sound off'}
          />
          <p className="field__hint">
            The pulse tone falls in pitch as saturation falls, which is how clinicians track
            saturation while looking somewhere else. Sound is never the only channel: every alarm
            and cue is also shown.
          </p>
        </div>
        {scenario.metadata.id !== 'adrenal-crisis-treatment-before-tests' && scenario.metadata.id !== 'thyroid-storm-hemodynamic-risk' && scenario.metadata.id !== 'myxedema-coma-ventilation-and-steroid-sequence' && !observedStateDemoSupported && <Button onClick={() => {
          setShortcutsOpen(false);
          setTutorIntroductionOpen(true);
        }}>
          Show private tutor introduction
        </Button>}
        <h3>Keyboard shortcuts</h3>
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)' }}>
          {SHORTCUTS.filter((shortcut) => moduleId === 'anesthesia'
            || !['G', 'V', 'L', 'C', 'E', 'D'].includes(shortcut.keys)).map((shortcut) => (
            <div key={shortcut.keys} style={{ display: 'contents' }}>
              <dt><kbd>{shortcut.keys}</kbd></dt>
              <dd>{moduleId === 'emergency-medicine'
                ? shortcut.action.replace('Analysis', 'Review') : shortcut.action}</dd>
            </div>
          ))}
        </dl>
        <Button onClick={onEnd}>End the session and open the debrief</Button>
        {moduleId === 'anesthesia' && (
          <Button onClick={() => { setShortcutsOpen(false); setCrisisInjectorOpen(true); }}>
            Open manual crisis injector
          </Button>
        )}
      </Modal>

      <Drawer open={crisisInjectorOpen} title="Manual crisis injector"
        onClose={() => setCrisisInjectorOpen(false)}>
        <ManualCrisisInjector
          injectedCrisisIds={equipment?.injectedCrisisIds ?? []}
          onInject={(crisisId) => session.act({ type: 'inject-crisis', payload: { crisisId } })}
        />
      </Drawer>

      {/* An engine error the worker reported.
          Nothing read `session.error`. The worker sends one for every
          `EngineError`, `InvalidScenario`, `NotInitialized` and
          `ProtocolMismatch`, and the store dutifully recorded it into state that
          no component consumed. The visible result was worse than a crash: the
          worker stops emitting, the traces and vitals freeze, and the main-thread
          clock keeps counting up, so the screen reads as a working simulator
          showing a stable patient. A learner would draw a clinical conclusion
          from a picture that had stopped being computed.

          Hard worker death already had a surface; this is the soft path, and it
          says the same true thing: the patient on screen is no longer live. */}
      {session.error && session.phase !== 'worker-lost' && (
        <Modal open title="The simulation stopped computing" dismissible={false}
          footer={<Button variant="primary" onClick={session.resetSession}>Start this scenario again</Button>}>
          <p>
            The physiology engine reported an error and has stopped advancing.{' '}
            <strong>The patient on screen is frozen, not stable.</strong> Nothing shown after this
            point reflects a running simulation, so please do not read a clinical conclusion from it.
          </p>
          <p className="field__hint">Reported as: {session.error.code}. {session.error.message}</p>
        </Modal>
      )}

      {session.phase === 'worker-lost' && (
        <Modal open title="The simulation engine stopped" dismissible={false}
          footer={<Button variant="primary" onClick={session.resumeAfterWorkerLoss}>Resume from the transcript</Button>}>
          <p>
            The background worker running the physiology terminated unexpectedly. The simulation is
            paused and your session transcript is intact.
          </p>
          <p>
            Resuming replays every action you took into a fresh worker, which reproduces the session
            exactly, because the engine is deterministic.
          </p>
        </Modal>
      )}

      {session.catchUpNotice && (
        <Modal open title="The simulation was paused while this tab was hidden" onClose={() => { /* the notice is dismissed by resuming */ }}
          footer={
            <>
              <Button variant="primary" onClick={session.play}>Resume</Button>
              <Button onClick={session.resetSession}>Reset</Button>
            </>
          }>
          <p>
            Browsers throttle hidden tabs, so the clock was capped rather than fast-forwarding the
            patient by however long you were away. At most five simulated seconds were caught up.
          </p>
        </Modal>
      )}
    </div>
  );
}

function DrugCardBody({ drugId, reviewMode }: { drugId: string; reviewMode: boolean }) {
  const card = getDrugCard(drugId);
  if (!card) return null;
  return (
    <div className="reading" style={{ padding: 0 }}>
      <p className="field__label">{card.drugClass}</p>
      <p>{card.mechanism}</p>
      <h3>Dosing</h3>
      <p>Induction: {card.inductionDose}</p>
      <p>Maintenance: {card.maintenanceDose}</p>
      {/* Where these figures came from, and where they differ from the label.
          A dose is the most consequential thing on this card and was the only
          clinical content in the application a reader could not check. */}
      <p className="field__hint">
        Checked against {card.dosing.sourceTitle}.{' '}
        {card.dosing.comparedWithLabel}
      </p>
      <h3>Onset and duration</h3>
      <p>{card.onset}</p>
      <p>{card.duration}</p>
      <h3>What to anticipate</h3>
      <ul>{card.adverseEffects.map((effect) => <li key={effect}>{effect}</li>)}</ul>
      <h3>Contraindications and cautions</h3>
      <ul>{card.contraindications.map((item) => <li key={item}>{item}</li>)}</ul>
      <h3>What to watch on the monitor</h3>
      <p>{card.watchFor}</p>
      <UnreviewedMarker
        status={card.maturity}
        subjectKind="drug-card"
        subjectId={card.drugId}
        contentVersion={card.review.contentVersion}
        review={card.review}
      />
      {reviewMode && (
        <FlagControl
          itemKey={`drug-card:${card.drugId}`}
          itemLabel={`${card.name} drug card`}
          contentVersion={card.review.contentVersion}
          appVersion={APP_VERSION}
          now={() => new Date().toISOString()}
        />
      )}
    </div>
  );
}

/**
 * The per-item clinical review marker.
 *
 * One line on the front page saying the whole build is unreviewed is easy to
 * scroll past, and it does not tell a reader WHICH claim in front of them nobody
 * checked. This sits at the bottom of the specific claim.
 */
export interface UnreviewedMarkerProps {
  readonly status: ContentMaturity;
  readonly subjectKind: MaturitySubjectKind;
  readonly subjectId: string;
  readonly contentVersion: string;
  readonly review: { readonly reviewer: string; readonly reviewedOn: string };
}

export function UnreviewedMarker({
  status, subjectKind, subjectId, contentVersion, review,
}: UnreviewedMarkerProps) {
  const reviewNotice = isUnreviewed(review) ? (
    <p className="reading__aside" data-unreviewed="true">
      <strong>Not clinically reviewed.</strong> {UNREVIEWED_NOTICE}
    </p>
  ) : (
      <p className="reading__aside">
        Reviewed by {review.reviewer} on {review.reviewedOn}.
      </p>
  );
  return (
    <>
      <MaturityMarker
        status={status}
        subjectKind={subjectKind}
        subjectId={subjectId}
        contentVersion={contentVersion}
      />
      {reviewNotice}
    </>
  );
}

/** Exposed for the tests: the internals a debrief needs after a session. */
export function debriefInputs() {
  const internals = sessionInternals();
  return {
    ticks: internals.clock.tick,
    ticksPerSecond: TICKS_PER_SECOND,
    explainers: EXPLAINERS.map((explainer) => explainer.id),
  };
}
