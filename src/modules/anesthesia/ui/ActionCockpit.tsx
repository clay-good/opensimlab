/**
 * The Action Cockpit (design/layout → Action Cockpit Composition,
 * cockpit/action-cockpit).
 *
 * A tab strip of trays. The active infusion summary is pinned and visible
 * whichever tray is open, because a running infusion must never be hidden.
 *
 * Administering a preset dose is a two-step confirm and takes exactly two
 * interactions: select the preset, then confirm.
 */

import { useState } from 'react';
import { Badge, Button, NumericField, SegmentedControl, Slider, SteppedDial, Tabs, Toggle } from '@platform/ui';
import { lastLipidProtocolForWeight, type Scenario } from '@anesthesia/engine';
import type { FormularyEntry } from '@anesthesia/scenarios/types';
import { term, type RegionProfile } from '@anesthesia/region/profiles';
import { FLUIDS } from '@anesthesia/content/fluids';
import { BLOOD_PRODUCTS } from '@anesthesia/content/blood-products';
import { JAW_THRUST_CPAP_SECONDS } from '@anesthesia/physiology';
import type { SevereHypoglycemiaSnapshot } from '@platform/kernel/protocol';
import { type HypoglycemiaAction } from '../../endocrine-metabolic/severe-hypoglycemia';
import { type AdrenalCrisisAction } from '../../endocrine-metabolic/adrenal-crisis';
import { type ThyroidStormAction, type ThyroidStormSnapshot } from '../../endocrine-metabolic/thyroid-storm';
import { type MyxedemaAction, type MyxedemaSnapshot } from '../../endocrine-metabolic/myxedema';
import { type HypercalcemiaAction, type HypercalcemiaSnapshot } from '../../endocrine-metabolic/hypercalcemia';
import { type HypocalcemiaAction, type HypocalcemiaSnapshot } from '../../endocrine-metabolic/hypocalcemia';
import { type HyponatremiaCorrectionAction, type HyponatremiaCorrectionSnapshot } from '../../endocrine-metabolic/hyponatremia-correction';
import { type AvpDeficiencyAction, type AvpDeficiencySnapshot } from '../../endocrine-metabolic/avp-deficiency';
import { type RefeedingAction, type RefeedingSnapshot } from '../../endocrine-metabolic/refeeding';
import { type PerioperativeDiabetesAction, type PerioperativeDiabetesSnapshot } from '../../endocrine-metabolic/perioperative-diabetes';
import { type RenalHyperkalemiaAction, type RenalHyperkalemiaSnapshot } from '../../renal-electrolyte/hyperkalemia';
import { type RenalHypokalemiaAction, type RenalHypokalemiaSnapshot } from '../../renal-electrolyte/hypokalemia';
import { type RenalHyponatremiaAction, type RenalHyponatremiaSnapshot } from '../../renal-electrolyte/hyponatremia';
import { type RenalHypernatremiaAction, type RenalHypernatremiaSnapshot } from '../../renal-electrolyte/hypernatremia';
import { type RenalHypocalcemiaAction, type RenalHypocalcemiaSnapshot } from '../../renal-electrolyte/hypocalcemia';
import { type RenalHypermagnesemiaAction, type RenalHypermagnesemiaSnapshot } from '../../renal-electrolyte/hypermagnesemia';
import { type MeningococcalSepsisAction, type MeningococcalSepsisSnapshot } from '../../infectious-disease/meningococcal-sepsis';
import { type ObstructedKidneyAction, type ObstructedKidneySnapshot } from '../../infectious-disease/obstructed-kidney';
import { type FebrileNeutropeniaAction, type FebrileNeutropeniaSnapshot } from '../../infectious-disease/febrile-neutropenia';
import { type NecrotizingInfectionAction, type NecrotizingInfectionSnapshot } from '../../infectious-disease/necrotizing-infection';
import { type EndocarditisHeartFailureAction, type EndocarditisHeartFailureSnapshot } from '../../infectious-disease/endocarditis-heart-failure';
import { type SeverePneumoniaAction, type SeverePneumoniaSnapshot } from '../../infectious-disease/severe-pneumonia';
import { type ToxicShockAction, type ToxicShockSnapshot } from '../../infectious-disease/toxic-shock';
import { type PossibleSepsisAction, type PossibleSepsisSnapshot } from '../../infectious-disease/possible-sepsis';
import { type LastKnownWellAction, type LastKnownWellSnapshot } from '../../medical-surgical-nursing/last-known-well';
import { type OxygenTargetScaleAction, type OxygenTargetScaleSnapshot } from '../../medical-surgical-nursing/oxygen-target-scale';
import { type LostContingencyAction, type LostContingencySnapshot } from '../../medical-surgical-nursing/lost-contingency';
import { type DelayedImmuneEventAction } from '../../oncology/delayed-immune-event';
import type { DelayedImmuneEventSnapshot } from '@platform/kernel/protocol';
import { type IncidentalClotAction } from '../../oncology/incidental-clot';
import type { IncidentalClotSnapshot } from '@platform/kernel/protocol';
import { type NormalTestToxicityAction } from '../../oncology/normal-test-toxicity';
import type { NormalTestToxicitySnapshot } from '@platform/kernel/protocol';
import { type PrognosisQuestionAction } from '../../oncology/prognosis-question';
import type { PrognosisQuestionSnapshot } from '@platform/kernel/protocol';
import { type LaboratoryTlsAction } from '../../oncology/laboratory-tls';
import type { LaboratoryTlsSnapshot } from '@platform/kernel/protocol';
import { type RareEarlyMyocarditisAction } from '../../oncology/rare-early-myocarditis';
import type { RareEarlyMyocarditisSnapshot } from '@platform/kernel/protocol';
import { type LoweringTheCountAction } from '../../oncology/lowering-the-count';
import { type InheritedUrgencyAction } from '../../oncology/inherited-urgency';
import { type TrialRuleAction } from '../../oncology/trial-rule';
import { type SilentInteractionAction } from '../../oncology/silent-interaction';
import { type EasyLabelAction } from '../../oncology/easy-label';
import { type NegativeScanAction } from '../../surgery-trauma/negative-scan';
import { type RisingRequirementAction } from '../../surgery-trauma/rising-requirement';
import { peaArrestInlinePrompt } from '../../emergency-medicine/tutor/pea-arrest-guidance';
import { persistentVfInlinePrompt } from '../../emergency-medicine/tutor/persistent-vf-arrest-guidance';
import { severeHyponatremiaInlinePrompt } from '../../emergency-medicine/tutor/severe-hyponatremia-with-seizure-guidance';
import { obstructivePleuralShockInlinePrompt } from '../../emergency-medicine/tutor/obstructive-shock-tension-pneumothorax-guidance';
import { supportsObstructivePleuralShock, obstructivePleuralShockProgress } from '../../emergency-medicine/obstructive-shock-tension-pneumothorax';
import type { LoweringTheCountSnapshot } from '@platform/kernel/protocol';
import type { InheritedUrgencySnapshot } from '@platform/kernel/protocol';
import type { TrialRuleSnapshot } from '@platform/kernel/protocol';
import type { SilentInteractionSnapshot } from '@platform/kernel/protocol';
import type { EasyLabelSnapshot } from '@platform/kernel/protocol';
import type { NegativeScanSnapshot } from '@platform/kernel/protocol';
import type { RisingRequirementSnapshot } from '@platform/kernel/protocol';
import type { UnfinishedSurveySnapshot } from '@platform/kernel/protocol';
import type { TransientResponseSnapshot } from '@platform/kernel/protocol';
import type { QuietChestSnapshot } from '@platform/kernel/protocol';
import type { UnownedDelaySnapshot } from '@platform/kernel/protocol';
import type { ThirdAttendanceSnapshot } from '@platform/kernel/protocol';
import type { DeferredStepSnapshot } from '@platform/kernel/protocol';
import type { KnownLabelSnapshot } from '@platform/kernel/protocol';
import type { UnspokenDoubtSnapshot } from '@platform/kernel/protocol';
import { type ProxyScaleAction, type ProxyScaleSnapshot } from '../../medical-surgical-nursing/proxy-scale';
import { type QuietPatientAction, type QuietPatientSnapshot } from '../../medical-surgical-nursing/quiet-patient';
import { type AfferentLimbAction, type AfferentLimbSnapshot } from '../../medical-surgical-nursing/afferent-limb';
import { type PairedReadingAction, type PairedReadingSnapshot } from '../../medical-surgical-nursing/paired-reading';
import { type CountedRateAction, type CountedRateSnapshot } from '../../medical-surgical-nursing/counted-rate';
import { type LowScoreAction, type LowScoreSnapshot } from '../../medical-surgical-nursing/low-score';
import { type MeningitisImagingAction, type MeningitisImagingSnapshot } from '../../infectious-disease/meningitis-imaging';
import { type SepticShockLabelAction, type SepticShockLabelSnapshot } from '../../infectious-disease/septic-shock-label';
import type { AdrenalCrisisSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { LessonTray } from './lesson-tray';
import { TutorPanel, WatchingNotice } from './tutor-panel';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

export type TrayId = 'syringes' | 'infusions' | 'fluids' | 'airway' | 'monitor' | 'circuit' | 'crisis';

export interface RunningInfusion {
  readonly drugId: string;
  readonly rate: number;
  readonly unit: string;
  readonly elapsedSeconds: number;
}

export interface HypnoticLineStatus {
  readonly connected: boolean;
  readonly inspected: boolean;
}

export interface CapnographyLineStatus {
  readonly obstructed: boolean;
  readonly ventilationCrossChecked: boolean;
}

export interface ArterialLineStatus {
  readonly displayedMeanArterialMmHg: number | null;
  readonly mislevelingCm: number;
  readonly dynamicResponse: 'normal' | 'overdamped';
  readonly waveformAssessed: boolean;
  readonly leveledAndZeroed: boolean;
  readonly cuff: {
    readonly status: 'idle' | 'cycling' | 'complete';
    readonly secondsRemaining: number;
    readonly meanArterialMmHg: number | null;
    readonly measuredAtTick: number | null;
  };
}

export interface BreathingCircuitStatus {
  readonly co2Absorbent: 'normal' | 'exhausted';
  readonly inspiredCo2MmHg: number;
  readonly capnogramAssessed: boolean;
  readonly absorbentReplaced: boolean;
}

export interface ActionCockpitProps {
  readonly renalHyperkalemia?: RenalHyperkalemiaSnapshot;
  readonly renalHypokalemia?: RenalHypokalemiaSnapshot;
  readonly renalHyponatremia?: RenalHyponatremiaSnapshot;
  readonly renalHypernatremia?: RenalHypernatremiaSnapshot;
  readonly renalHypocalcemia?: RenalHypocalcemiaSnapshot;
  readonly renalHypermagnesemia?: RenalHypermagnesemiaSnapshot;
  readonly meningococcalSepsis?: MeningococcalSepsisSnapshot;
  readonly obstructedKidney?: ObstructedKidneySnapshot;
  readonly febrileNeutropenia?: FebrileNeutropeniaSnapshot;
  readonly necrotizingInfection?: NecrotizingInfectionSnapshot;
  readonly endocarditisHeartFailure?: EndocarditisHeartFailureSnapshot;
  readonly severePneumonia?: SeverePneumoniaSnapshot;
  readonly toxicShock?: ToxicShockSnapshot;
  readonly possibleSepsis?: PossibleSepsisSnapshot;
  readonly septicShockLabel?: SepticShockLabelSnapshot;
  readonly meningitisImaging?: MeningitisImagingSnapshot;
  readonly lowScore?: LowScoreSnapshot;
  readonly countedRate?: CountedRateSnapshot;
  readonly pairedReading?: PairedReadingSnapshot;
  readonly afferentLimb?: AfferentLimbSnapshot;
  readonly quietPatient?: QuietPatientSnapshot;
  readonly proxyScale?: ProxyScaleSnapshot;
  readonly lastKnownWell?: LastKnownWellSnapshot;
  readonly oxygenTargetScale?: OxygenTargetScaleSnapshot;
  readonly lostContingency?: LostContingencySnapshot;
  readonly delayedImmuneEvent?: DelayedImmuneEventSnapshot;
  readonly incidentalClot?: IncidentalClotSnapshot;
  readonly normalTestToxicity?: NormalTestToxicitySnapshot;
  readonly prognosisQuestion?: PrognosisQuestionSnapshot;
  readonly laboratoryTls?: LaboratoryTlsSnapshot;
  readonly rareEarlyMyocarditis?: RareEarlyMyocarditisSnapshot;
  readonly loweringTheCount?: LoweringTheCountSnapshot;
  readonly inheritedUrgency?: InheritedUrgencySnapshot;
  readonly trialRule?: TrialRuleSnapshot;
  readonly silentInteraction?: SilentInteractionSnapshot;
  readonly easyLabel?: EasyLabelSnapshot;
  readonly negativeScan?: NegativeScanSnapshot;
  readonly risingRequirement?: RisingRequirementSnapshot;
  readonly unfinishedSurvey?: UnfinishedSurveySnapshot;
  readonly transientResponse?: TransientResponseSnapshot;
  readonly quietChest?: QuietChestSnapshot;
  readonly unownedDelay?: UnownedDelaySnapshot;
  readonly thirdAttendance?: ThirdAttendanceSnapshot;
  readonly deferredStep?: DeferredStepSnapshot;
  readonly knownLabel?: KnownLabelSnapshot;
  readonly unspokenDoubt?: UnspokenDoubtSnapshot;
  readonly hypoglycemiaDemonstrating?: boolean;
  readonly scenario: Scenario;
  readonly region: RegionProfile;
  readonly infusions: readonly RunningInfusion[];
  readonly hypnoticLine: HypnoticLineStatus;
  readonly capnographyLine?: CapnographyLineStatus;
  readonly arterialLine?: ArterialLineStatus;
  readonly breathingCircuit?: BreathingCircuitStatus;
  readonly resuscitation: {
    readonly epinephrineEffectFraction: number;
    readonly epinephrineTotalMicrograms: number;
    readonly lastEpinephrineTick: number | null;
    readonly crystalloidTotalMl: number;
    readonly hemorrhageActive?: boolean;
    readonly packedRedBloodCellUnits?: number;
    readonly freshFrozenPlasmaUnits?: number;
    readonly coagulationPanelReported?: boolean;
    readonly bloodProductsReleased?: boolean;
    readonly bloodProductTotalMl?: number;
    readonly dantroleneTotalMg: number;
    readonly dantroleneEffectFraction: number;
    readonly lastDantroleneTick: number | null;
    readonly activeCooling: boolean;
    readonly salbutamolTotalMg?: number;
    readonly lastSalbutamolTick?: number | null;
    readonly bronchodilatorEffectFraction?: number;
    readonly localAnestheticToxicityFraction?: number;
    readonly seizureActivityFraction?: number;
    readonly seizureSuppressed?: boolean;
    readonly lipidEmulsionTotalMl?: number;
    readonly lipidEmulsionBolusRemainingMl?: number;
    readonly lipidEmulsionInfusionMlPerMin?: number;
    readonly lipidEmulsionEffectFraction?: number;
    readonly lastLipidEmulsionTick?: number | null;
    readonly cardiacArrestActive?: boolean;
    readonly chestCompressionsActive?: boolean;
    readonly chestCompressionSeconds?: number;
    readonly compressionPerfusionFraction?: number;
    readonly arrestEpinephrineTotalMg?: number;
    readonly lastArrestEpinephrineTick?: number | null;
    readonly defibrillationShockCount?: number;
    readonly lastDefibrillationEnergyJ?: number | null;
    readonly roscAtTick?: number | null;
    readonly highSpinalFraction?: number;
    readonly ephedrineTotalMg?: number;
    readonly lastEphedrineTick?: number | null;
    readonly preeclampsiaBloodPressureChecks?: number;
    readonly lastPreeclampsiaBloodPressure?: {
      readonly systolicMmHg: number;
      readonly diastolicMmHg: number;
      readonly meanArterialMmHg: number;
      readonly tick: number;
    } | null;
    readonly labetalolTotalMg?: number;
    readonly lastLabetalolTick?: number | null;
    readonly labetalolEffectFraction?: number;
    readonly magnesiumSulfateTotalG?: number;
    readonly lastMagnesiumSulfateTick?: number | null;
    readonly venousAirEmbolismFraction?: number;
    readonly venousAirEntryControlled?: boolean;
    readonly venousAirEntryControlledAtTick?: number | null;
    readonly tensionPneumothoraxFraction?: number;
    readonly pneumothoraxAssessedAtTick?: number | null;
    readonly pneumothoraxDecompressedAtTick?: number | null;
    readonly aspirationRiskAssessment?: {
      readonly cuesReviewedAtTick: number | null;
      readonly classification: 'elevated' | 'routine' | null;
      readonly classifiedAtTick: number | null;
      readonly plan: 'defer-and-replan' | 'proceed-routine' | null;
      readonly planAtTick: number | null;
    };
    readonly emergenceResidualBlockAssessment?: {
      readonly monitorReviewedAtTick: number | null;
      readonly classification: 'residual' | 'recovered' | null;
      readonly classifiedAtTick: number | null;
      readonly plan: 'defer-extubation-and-support' | 'proceed-to-extubation' | null;
      readonly planAtTick: number | null;
    };
    readonly delayedEmergenceAssessment?: {
      readonly supportReviewedAtTick: number | null;
      readonly exposureReviewedAtTick: number | null;
      readonly metabolicReviewedAtTick: number | null;
      readonly neurologicExamAtTick: number | null;
      readonly escalation: 'urgent-neurologic-evaluation' | 'continue-routine-recovery' | null;
      readonly escalatedAtTick: number | null;
    };
    readonly extubationReadinessAssessment?: {
      readonly quantitativeRecoveryReviewedAtTick: number | null;
      readonly awakeAirwayReviewedAtTick: number | null;
      readonly gasExchangeReviewedAtTick: number | null;
      readonly airwayPlanReviewedAtTick: number | null;
      readonly decision: 'ready-for-planned-awake-extubation'
        | 'continue-support-and-reassess' | null;
      readonly decidedAtTick: number | null;
    };
    readonly opioidVentilatoryResponse?: {
      readonly severity: number;
      readonly furtherOpioidHeldAtTick: number | null;
      readonly naloxoneIntentAtTick: number | null;
    };
    readonly thermalResponse?: {
      readonly targetTemperatureC: number | null;
      readonly coreTemperatureConfirmedAtTick: number | null;
      readonly forcedAirWarmingAtTick: number | null;
      readonly warmedBulkFluidsAtTick: number | null;
    };
    readonly glycemicResponse?: {
      readonly pointOfCareGlucoseMgPerDl: number | null;
      readonly pointOfCareConfirmedAtTick: number | null;
      readonly insulinProtocolIntentAtTick: number | null;
      readonly repeatEligible: boolean;
      readonly repeatPointOfCareAtTick: number | null;
      readonly repeatPointOfCareGlucoseMgPerDl: number | null;
    };
    readonly ciedPlanningAssessment?: {
      readonly deviceRecordReviewedAtTick: number | null;
      readonly procedureRiskReviewedAtTick: number | null;
      readonly plan: 'coordinate-asynchronous-pacing' | 'apply-unverified-magnet'
        | 'proceed-no-change' | null;
      readonly planAtTick: number | null;
      readonly backupAndRestorationDocumentedAtTick: number | null;
    };
    readonly postoperativeHandoffAssessment?: {
      readonly receiverReadyAtTick: number | null;
      readonly patientAndCourseAtTick: number | null;
      readonly currentStateAtTick: number | null;
      readonly risksActionsOwnershipAtTick: number | null;
      readonly receiverReadbackAtTick: number | null;
      readonly transferAcceptedAtTick: number | null;
    };
    readonly undifferentiatedShockAssessment?: {
      readonly perfusionReviewedAtTick: number | null;
      readonly lactateReviewedAtTick: number | null;
      readonly focusedEchoReviewedAtTick: number | null;
      readonly passiveLegRaiseAtTick: number | null;
      readonly fluidChallengeAtTick: number | null;
      readonly perfusionReassessedAtTick: number | null;
      readonly escalationAtTick: number | null;
    };
    readonly septicShockAssessment?: {
      readonly infectionAndOrganDysfunctionReviewedAtTick: number | null;
      readonly culturesAndLactateAtTick: number | null;
      readonly antimicrobialIntentAtTick: number | null;
      readonly initialCrystalloidAtTick: number | null;
      readonly postFluidReassessmentAtTick: number | null;
      readonly norepinephrineIntentAtTick: number | null;
      readonly sourceControlEscalationAtTick: number | null;
    };
    readonly hemorrhagicShockAssessment?: {
      readonly mechanismAndPerfusionReviewedAtTick: number | null;
      readonly pelvicStabilizationAtTick: number | null;
      readonly majorHemorrhageActivatedAtTick: number | null;
      readonly redCellsAtTick: number | null;
      readonly coagulationAndTemperatureAtTick: number | null;
      readonly reassessedAtTick: number | null;
      readonly definitiveControlEscalatedAtTick: number | null;
    };
    readonly cardiacTamponadeFraction?: number;
    readonly cardiacTamponadeAssessment?: {
      readonly contextReviewedAtTick: number | null;
      readonly pocusReviewedAtTick: number | null;
      readonly definitiveControlAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly emergencyAnaphylaxisAssessment?: {
      readonly patternReviewedAtTick: number | null;
      readonly positionedAndHelpedAtTick: number | null;
      readonly imEpinephrineAtTick: number | null;
      readonly oxygenAtTick: number | null;
      readonly crystalloidAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly adultAsthmaAssessment?: {
      readonly severityReviewedAtTick: number | null;
      readonly controlledOxygenAtTick: number | null;
      readonly bronchodilatorBundleAtTick: number | null;
      readonly corticosteroidIntentAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly copdExacerbationAssessment?: {
      readonly severityReviewedAtTick: number | null;
      readonly controlledOxygenAtTick: number | null;
      readonly bronchodilatorBundleAtTick: number | null;
      readonly corticosteroidIntentAtTick: number | null;
      readonly antibioticIntentAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly acutePulmonaryEdemaAssessment?: {
      readonly patternReviewedAtTick: number | null;
      readonly nivAtTick: number | null;
      readonly diureticIntentAtTick: number | null;
      readonly vasodilatorIntentAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly pulmonaryEmbolismAssessment?: {
      readonly severityReviewedAtTick: number | null;
      readonly oxygenAtTick: number | null;
      readonly anticoagulationAtTick: number | null;
      readonly deteriorationAtTick: number | null;
      readonly escalationAtTick: number | null;
    };
    readonly stemiAssessment?: {
      readonly patternReviewedAtTick: number | null;
      readonly pathwayActivatedAtTick: number | null;
      readonly aspirinAtTick: number | null;
      readonly additionalAntithromboticsAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly unstableNarrowTachycardiaAssessment?: {
      readonly reviewedAtTick: number | null;
      readonly preparedAtTick: number | null;
      readonly cardiovertedAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly unstableBradycardiaAssessment?: {
      readonly reviewedAtTick: number | null;
      readonly supportedAtTick: number | null;
      readonly atropineAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly statusEpilepticusAssessment?: {
      readonly reviewedAtTick: number | null;
      readonly supportedAtTick: number | null;
      readonly lorazepamAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly acuteIschemicStrokeAssessment?: {
      readonly presentationReviewedAtTick: number | null;
      readonly systemActivatedAtTick: number | null;
      readonly imagingReviewedAtTick: number | null;
      readonly tenecteplaseAtTick: number | null;
      readonly thrombectomyActivatedAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly intracranialHemorrhageAssessment?: {
      readonly deteriorationReviewedAtTick: number | null;
      readonly pathwayActivatedAtTick: number | null;
      readonly findingsReviewedAtTick: number | null;
      readonly reversalAtTick: number | null;
      readonly pressureControlAtTick: number | null;
      readonly escalatedAtTick: number | null;
    };
    readonly diabeticKetoacidosisAssessment?: {
      readonly presentationReviewedAtTick: number | null;
      readonly fluidsAtTick: number | null;
      readonly potassiumAtTick: number | null;
      readonly insulinAtTick: number | null;
      readonly dextroseAtTick: number | null;
      readonly transitionAtTick: number | null;
    };
    readonly hyperkalemiaAssessment?: {
      readonly patternReviewedAtTick: number | null;
      readonly calciumAtTick: number | null;
      readonly postCalciumEcgAtTick: number | null;
      readonly insulinGlucoseAtTick: number | null;
      readonly betaAgonistAtTick: number | null;
      readonly removalAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly hyponatremiaAssessment?: {
      readonly patternReviewedAtTick: number | null;
      readonly stabilizedAtTick: number | null;
      readonly hypertonicAtTick: number | null;
      readonly reassessedAtTick: number | null;
      readonly guardrailsAtTick: number | null;
    };
    readonly opioidToxicityAssessment?: {
      readonly patternReviewedAtTick: number | null;
      readonly ventilationAtTick: number | null;
      readonly antagonistAtTick: number | null;
      readonly initialReassessmentAtTick: number | null;
      readonly recurrenceReviewedAtTick: number | null;
      readonly recurrencePlanAtTick: number | null;
    };
    readonly heatStrokeAssessment?: {
      readonly patternReviewedAtTick: number | null;
      readonly supportAtTick: number | null;
      readonly coolingAtTick: number | null;
      readonly targetAtTick: number | null;
      readonly surveillanceAtTick: number | null;
    };
    readonly traumaPrimarySurveyAssessment?: {
      readonly activatedAtTick: number | null;
      readonly catastrophicHemorrhageAtTick: number | null;
      readonly airwayBreathingAtTick: number | null;
      readonly circulationAtTick: number | null;
      readonly disabilityExposureAtTick: number | null;
      readonly repeatedAtTick: number | null;
    };
    readonly acuteAorticSyndromeAssessment?: {
      readonly initialReviewedAtTick: number | null;
      readonly evolutionReviewedAtTick: number | null;
      readonly escalatedAtTick: number | null;
      readonly antiImpulseAtTick: number | null;
      readonly imagingAtTick: number | null;
      readonly handedOffAtTick: number | null;
    };
    readonly ardsLungProtectiveAssessment?: {
      readonly baselineAtTick: number | null;
      readonly pbwAtTick: number | null;
      readonly protectionAtTick: number | null;
      readonly reassessmentAtTick: number | null;
      readonly escalationAtTick: number | null;
    };
    readonly escalatingHypoxemiaAssessment?: {
      readonly signalAtTick: number | null;
      readonly supportAtTick: number | null;
      readonly deliveryPathAtTick: number | null;
      readonly bedsidePatternAtTick: number | null;
      readonly escalationAtTick: number | null;
    };
    readonly ventilatorDyssynchronyAssessment?: {
      readonly graphicsAtTick: number | null;
      readonly driversAtTick: number | null;
      readonly classificationAtTick: number | null;
      readonly correctionAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly autoPeepAssessment?: {
      readonly flowAtTick: number | null;
      readonly measurementAtTick: number | null;
      readonly classificationAtTick: number | null;
      readonly correctionAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly mucusPluggingAssessment?: {
      readonly supportAtTick: number | null;
      readonly indicatorsAtTick: number | null;
      readonly suctionAtTick: number | null;
      readonly reassessmentAtTick: number | null;
      readonly escalationAtTick: number | null;
    };
    readonly unplannedExtubationAssessment?: {
      readonly supportAtTick: number | null;
      readonly assessmentAtTick: number | null;
      readonly failureAtTick: number | null;
      readonly airwayPlanAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly spontaneousBreathingTrialAssessment?: {
      readonly readinessAtTick: number | null;
      readonly startedAtTick: number | null;
      readonly failureAtTick: number | null;
      readonly recoveryAtTick: number | null;
      readonly planAtTick: number | null;
    };
    readonly postIntubationHypotensionAssessment?: {
      readonly pressureAtTick: number | null;
      readonly dangerAtTick: number | null;
      readonly mechanismAtTick: number | null;
      readonly supportAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly cardiogenicShockAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly phenotypeAtTick: number | null;
      readonly bridgeAtTick: number | null;
      readonly causeControlAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly mixedShockAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly hemodynamicsAtTick: number | null;
      readonly supportAtTick: number | null;
      readonly causesAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly rightVentricularFailureAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly phenotypeAtTick: number | null;
      readonly supportAtTick: number | null;
      readonly triggersAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly massivePulmonaryEmbolismAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly patternAtTick: number | null;
      readonly supportAtTick: number | null;
      readonly ecmoAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly upperGiHemorrhageAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly patternAtTick: number | null;
      readonly resuscitationAtTick: number | null;
      readonly hemostasisAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly criticalCareStatusEpilepticusAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly patternAtTick: number | null;
      readonly pathwayAtTick: number | null;
      readonly causesAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly postArrestTemperatureAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly contextAtTick: number | null;
      readonly protocolAtTick: number | null;
      readonly guardrailsAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly intracranialHypertensionAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly contextAtTick: number | null;
      readonly protectionAtTick: number | null;
      readonly rescueAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly akiFluidOverloadAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly contextAtTick: number | null;
      readonly fluidPlanAtTick: number | null;
      readonly supportAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly severeAcidemiaAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly analysisAtTick: number | null;
      readonly ventilationAtTick: number | null;
      readonly causePlanAtTick: number | null;
      readonly reassessmentAtTick: number | null;
    };
    readonly icuHiddenDeteriorationHandoffAssessment?: {
      readonly readinessAtTick: number | null;
      readonly contentAtTick: number | null;
      readonly crossCheckAtTick: number | null;
      readonly escalationAtTick: number | null;
      readonly acceptanceAtTick: number | null;
    };
    readonly ventilatorCircuitDisconnectionAssessment?: {
      readonly recognizedAtTick: number | null;
      readonly bridgedAtTick: number | null;
      readonly inspectedAtTick: number | null;
      readonly restoredAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly delayedVasopressorDeliveryAssessment?: {
      readonly discordanceAtTick: number | null;
      readonly pathAtTick: number | null;
      readonly classifiedAtTick: number | null;
      readonly protocolAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly pulseOximeterArtifactAssessment?: {
      readonly discordanceAtTick: number | null;
      readonly plethAtTick: number | null;
      readonly probePerfusionAtTick: number | null;
      readonly corroboratedAtTick: number | null;
      readonly reassessedAtTick: number | null;
      readonly displayedSpo2Percent: number;
      readonly displayedPulseRateBpm: number;
      readonly signalQuality: 'poor' | 'good';
    };
    readonly endotrachealTubeMigrationAssessment?: {
      readonly recognizedAtTick: number | null;
      readonly supportedAtTick: number | null;
      readonly positionReviewedAtTick: number | null;
      readonly correctionAtTick: number | null;
      readonly reassessedAtTick: number | null;
    };
    readonly septicShockResuscitationAssessment?: {
      readonly contextAtTick: number | null;
      readonly perfusionAtTick: number | null;
      readonly fluidResponseAtTick: number | null;
      readonly planAtTick: number | null;
      readonly reassessedAtTick: number | null;
      readonly passiveLegRaiseStrokeVolumeChangePercent: number;
      readonly blindRepeatFluidOffered: false;
    };
    readonly stableChestPainAssessment?: {
      readonly stabilityAtTick: number | null;
      readonly patternAtTick: number | null;
      readonly likelihoodAtTick: number | null;
      readonly testingAtTick: number | null;
      readonly safetyNetAtTick: number | null;
      readonly clinicalLikelihood: 'not-very-low';
      readonly exactScoreCalculated: false;
      readonly testPerformed: false;
    };
    readonly nstemiRiskAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly verificationAtTick: number | null;
      readonly veryHighRiskAtTick: number | null;
      readonly strategyAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly ischemicRisk: 'high';
      readonly currentVeryHighRisk: false;
      readonly exactScoreCalculated: false;
      readonly procedurePerformed: false;
    };
    readonly heartFailureAssessment?: {
      readonly statusAtTick: number | null;
      readonly responseAtTick: number | null;
      readonly toleranceAtTick: number | null;
      readonly transitionAtTick: number | null;
      readonly readinessAtTick: number | null;
      readonly residualCongestion: true;
      readonly dischargeReady: false;
      readonly doseCalculated: false;
      readonly treatmentDelivered: false;
    };
    readonly afRvrAssessment?: {
      readonly stabilityAtTick: number | null;
      readonly contextAtTick: number | null;
      readonly rateIntentAtTick: number | null;
      readonly strokePreventionAtTick: number | null;
      readonly reassessmentAtTick: number | null;
      readonly hemodynamicallyStable: true;
      readonly durationCertain: false;
      readonly exactScoreCalculated: false;
      readonly treatmentDelivered: false;
    };
    readonly clinicStemiAssessment?: {
      readonly patternAtTick: number | null;
      readonly dangerAtTick: number | null;
      readonly transferAtTick: number | null;
      readonly bridgeAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly pciCapableSetting: false;
      readonly biomarkerDelayUsed: false;
      readonly downstreamTherapySelected: false;
      readonly treatmentDelivered: false;
    };
    readonly postInfarctionShockAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly causesAtTick: number | null;
      readonly transferAtTick: number | null;
      readonly bridgeAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly pressureAloneUsed: false;
      readonly routineDeviceSelected: false;
      readonly treatmentDelivered: false;
    };
    readonly stableNarrowTachycardiaAssessment?: {
      readonly stabilityAtTick: number | null;
      readonly contextAtTick: number | null;
      readonly vagalAtTick: number | null;
      readonly vagalResponseAtTick: number | null;
      readonly adenosineAtTick: number | null;
      readonly reassessmentAtTick: number | null;
      readonly hemodynamicallyStable: true;
      readonly mechanismProven: false;
      readonly treatmentDelivered: false;
    };
    readonly stableWideTachycardiaAssessment?: {
      readonly stabilityAtTick: number | null;
      readonly contextAtTick: number | null;
      readonly readinessAtTick: number | null;
      readonly medicationAtTick: number | null;
      readonly nonresponseAtTick: number | null;
      readonly cardioversionAtTick: number | null;
      readonly reassessmentAtTick: number | null;
      readonly hemodynamicallyStable: true;
      readonly mechanismProven: false;
      readonly learnerTreatmentDelivered: false;
    };
    readonly symptomaticBradycardiaAssessment?: {
      readonly stabilityAtTick: number | null;
      readonly contextAtTick: number | null;
      readonly correlationAtTick: number | null;
      readonly pacingEvaluationAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly hemodynamicallyStable: true;
      readonly mechanismProven: false;
      readonly treatmentDelivered: false;
    };
    readonly completeHeartBlockAssessment?: {
      readonly stabilityAtTick: number | null;
      readonly contextAtTick: number | null;
      readonly pathwayAtTick: number | null;
      readonly reassessmentAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly hemodynamicallyStable: true;
      readonly pacingDelivered: false;
      readonly captureAssessed: false;
    };
    readonly torsadesAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly shockIntentAtTick: number | null;
      readonly postShockAtTick: number | null;
      readonly contextAtTick: number | null;
      readonly recurrenceIntentAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly shockDeliveredByLearner: false;
      readonly treatmentDeliveredByLearner: false;
    };
    readonly hyperkalemicConductionAssessment?: {
      readonly reconciledAtTick: number | null;
      readonly calciumResponseAtTick: number | null;
      readonly shiftSurveillanceAtTick: number | null;
      readonly removalDeviceAtTick: number | null;
      readonly laterPanelAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly treatmentDeliveredByLearner: false;
      readonly pacingDelivered: false;
      readonly captureAssessed: false;
      readonly permanentDeviceSelected: false;
    };
    readonly pericardialTamponadeAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly drainageResponseAtTick: number | null;
      readonly etiologyAtTick: number | null;
      readonly surveillanceAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly treatmentDeliveredByLearner: false;
      readonly imageAcquiredByLearner: false;
      readonly procedurePerformedByLearner: false;
      readonly catheterManipulatedByLearner: false;
    };
    readonly rightVentricularInfarctionAssessment?: {
      readonly reconciledAtTick: number | null;
      readonly phenotypeAtTick: number | null;
      readonly supportAtTick: number | null;
      readonly reperfusionAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly treatmentDeliveredByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly reperfusionPerformedByLearner: false;
      readonly deviceSelected: false;
    };
    readonly hypertensiveEmergencyAssessment?: {
      readonly measurementAtTick: number | null;
      readonly organInjuryAtTick: number | null;
      readonly phenotypeAtTick: number | null;
      readonly reductionIntentAtTick: number | null;
      readonly laterPanelAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly acuteTargetOrganDamage: true;
      readonly treatmentDeliveredByLearner: false;
      readonly drugSelected: false;
      readonly doseSelected: false;
      readonly infusionRateSelected: false;
      readonly universalTargetSelected: false;
      readonly rapidNormalizationSelected: false;
      readonly testAcquiredByLearner: false;
      readonly procedurePerformed: false;
      readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly pacemakerCaptureFailureAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly rescueAtTick: number | null;
      readonly deviceSystemAtTick: number | null;
      readonly causesAtTick: number | null;
      readonly laterPanelAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly electricalCaptureFailureAuthored: true;
      readonly pacingDeliveredByLearner: false;
      readonly captureAssessedByLearner: false;
      readonly deviceInterrogatedByLearner: false;
      readonly deviceProgrammedByLearner: false;
      readonly outputSelectedByLearner: false;
      readonly leadManipulatedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly outcomePredicted: false;
    };
    readonly transcutaneousPacingCaptureAssessment?: {
      readonly recognitionAtTick: number | null;
      readonly pulselessResponseAtTick: number | null;
      readonly causesBridgeAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: false;
      readonly electricalCaptureAuthored: true;
      readonly mechanicalCaptureAbsent: true;
      readonly nonshockableArrestPathwayActivated: boolean;
      readonly pacingDeliveredByLearner: false;
      readonly captureAssessedByLearner: false;
      readonly cprDeliveredByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly procedurePerformedByLearner: false;
      readonly roscReported: false;
      readonly outcomePredicted: false;
    };
    readonly acuteSevereAsthmaAssessment?: {
      readonly treatmentAtTick: number | null;
      readonly failureAtTick: number | null;
      readonly escalationAtTick: number | null;
      readonly risksAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly respiratoryFailureAuthored: true;
      readonly medicationDeliveredByLearner: false;
      readonly oxygenDeliveredByLearner: false;
      readonly airwayProcedurePerformedByLearner: false;
      readonly ventilatorSettingSelected: false;
      readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly copdTransitionAssessment?: {
      readonly readinessAtTick: number | null;
      readonly respiratoryNeedsAtTick: number | null;
      readonly medicationAtTick: number | null;
      readonly coordinationAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly treatmentDeliveredByLearner: false;
      readonly oxygenDeliveredByLearner: false;
      readonly longTermOxygenEligibilityDetermined: false;
      readonly regimenSelected: false;
      readonly techniquePerformedByLearner: false;
      readonly rehabilitationEnrolled: false;
      readonly appointmentGuaranteed: false;
      readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly capHypoxemiaAssessment?: {
      readonly supportAtTick: number | null;
      readonly evidenceAtTick: number | null;
      readonly severityAtTick: number | null;
      readonly treatmentIntentAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly hypoxemiaAuthored: true;
      readonly pneumoniaPatternAuthored: true;
      readonly oxygenDeliveredByLearner: false;
      readonly supportDeviceSelected: false;
      readonly antimicrobialSelected: false;
      readonly testAcquiredByLearner: false;
      readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly postPeDyspneaAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly safetyAtTick: number | null;
      readonly evidenceAtTick: number | null;
      readonly referralAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly acutePeConfirmedAuthored: true;
      readonly anticoagulationDeliveredByLearner: false;
      readonly testAcquiredByLearner: false;
      readonly ctepdDiagnosed: false;
      readonly treatmentSelected: false;
      readonly procedurePerformedByLearner: false;
      readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly apeSupportAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly failureAtTick: number | null;
      readonly wholePatientAtTick: number | null;
      readonly escalationAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly pulmonaryEdemaAuthored: true;
      readonly supportAlreadyActiveAuthored: true;
      readonly oxygenDeliveredByLearner: false;
      readonly nivStartedByLearner: false;
      readonly supportSettingSelected: false;
      readonly medicationDeliveredByLearner: false;
      readonly testAcquiredByLearner: false;
      readonly airwayProcedurePerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly postTensionPneumothoraxAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly drainageResponseAtTick: number | null;
      readonly systemAtTick: number | null;
      readonly etiologyAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly priorTensionPhysiologyAuthored: true;
      readonly experiencedTeamDrainageAuthored: true;
      readonly decompressionPerformedByLearner: false;
      readonly chestDrainPlacedByLearner: false;
      readonly drainManipulatedByLearner: false;
      readonly suctionOrClampSelected: false;
      readonly deviceOrSiteSelected: false;
      readonly oxygenDeliveredByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly testAcquiredByLearner: false;
      readonly procedurePerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly dispositionDetermined: false;
      readonly recurrencePredicted: false;
      readonly outcomePredicted: false;
    };
    readonly largePleuralEffusionAssessment?: {
      readonly trajectoryAtTick: number | null; readonly intentAtTick: number | null;
      readonly responseAtTick: number | null; readonly fluidAtTick: number | null;
      readonly evaluationAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly largeUnilateralEffusionAuthored: true;
      readonly tensionPhysiologyAuthored: false; readonly hemodynamicCompromiseAuthored: false;
      readonly examinationPerformedByLearner: false; readonly imagingAcquiredByLearner: false;
      readonly ultrasoundPerformedByLearner: false; readonly pleuralFluidAcquiredByLearner: false;
      readonly fluidInterpretedByLearner: false; readonly thoracentesisPerformedByLearner: false;
      readonly deviceOrSiteSelected: false; readonly drainageVolumeSelected: false;
      readonly treatmentDeliveredByLearner: false; readonly diagnosisDetermined: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly bronchiectasisMucusPluggingAssessment?: {
      readonly trajectoryAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly clearanceIntentAtTick: number | null; readonly responseAtTick: number | null;
      readonly escalationAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneouslyBreathingAuthored: true;
      readonly artificialAirwayPresent: false; readonly focalCollapseAuthored: true;
      readonly mucusImpactionWorkingPatternAuthored: true; readonly mucusPlugEtiologyProven: false;
      readonly examinationPerformedByLearner: false; readonly imagingAcquiredByLearner: false;
      readonly sputumAssessedByLearner: false; readonly airwayClearancePerformedByLearner: false;
      readonly suctionPerformedByLearner: false; readonly bronchoscopyPerformedByLearner: false;
      readonly deviceOrTechniqueSelected: false; readonly oxygenDeliveredByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly diagnosisDetermined: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly chronicOpioidHypoventilationAssessment?: {
      readonly trajectoryAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly alternativesAtTick: number | null; readonly coordinatedPlanAtTick: number | null;
      readonly handoffAtTick: number | null; readonly initialPulsePresent: true;
      readonly chronicOpioidExposureAuthored: true; readonly spontaneouslyBreathingAuthored: true;
      readonly acuteOpioidOverdoseAuthored: false; readonly postoperativeRecoveryAuthored: false;
      readonly sleepRelatedHypoventilationPatternAuthored: true;
      readonly opioidCausalityProven: false; readonly examinationPerformedByLearner: false;
      readonly bloodGasAcquiredByLearner: false; readonly sleepStudyAcquiredByLearner: false;
      readonly sleepStudyInterpretedByLearner: false; readonly drugOrDoseSelected: false;
      readonly taperSelected: false; readonly opioidChangedByLearner: false;
      readonly naloxoneSelectedByLearner: false; readonly naloxoneDeliveredByLearner: false;
      readonly oxygenDeliveredByLearner: false; readonly supportDeviceSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly diagnosisDetermined: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly neuromuscularRespiratoryFailureAssessment?: {
      readonly trajectoryAtTick: number | null; readonly failureAtTick: number | null;
      readonly escalationAtTick: number | null; readonly reviewAtTick: number | null;
      readonly ownershipAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly establishedMotorNeuronDiseaseAuthored: true;
      readonly neuromuscularRespiratoryFailureAuthored: true;
      readonly respiratoryMeasurementsAuthored: true; readonly daytimeHypercapniaAuthored: true;
      readonly examinationPerformedByLearner: false;
      readonly respiratoryStrengthMeasuredByLearner: false;
      readonly bloodGasAcquiredByLearner: false; readonly testInterpretedByLearner: false;
      readonly imagingAcquiredByLearner: false; readonly airwayAssessedByLearner: false;
      readonly coughAssessedByLearner: false; readonly ventilationDeliveredByLearner: false;
      readonly oxygenDeliveredByLearner: false; readonly supportDeviceSelectedByLearner: false;
      readonly coughAssistDeliveredByLearner: false;
      readonly secretionProcedurePerformedByLearner: false;
      readonly airwayProcedurePerformedByLearner: false;
      readonly patientPreferenceInferred: false; readonly nutritionSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly diagnosisDetermined: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly obesityHypoventilationAssessment?: {
      readonly phenotypeAtTick: number | null; readonly awakeEvidenceAtTick: number | null;
      readonly sleepEvidenceAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly coordinatedPlanAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly obesityAuthored: true; readonly daytimeHypercapniaAuthored: true;
      readonly sleepDisorderedBreathingAuthored: true; readonly acuteRespiratoryFailureAuthored: false;
      readonly examinationPerformedByLearner: false; readonly bmiCalculatedByLearner: false;
      readonly serumBicarbonateAcquiredByLearner: false;
      readonly bloodGasAcquiredByLearner: false; readonly sleepStudyAcquiredByLearner: false;
      readonly sleepStudyScoredByLearner: false; readonly sleepStudyInterpretedByLearner: false;
      readonly testInterpretedByLearner: false; readonly otherCausesExcludedByLearner: false;
      readonly diagnosisDeterminedByLearner: false; readonly obesityCausalityProven: false;
      readonly oxygenSelectedByLearner: false; readonly supportDeviceSelectedByLearner: false;
      readonly deviceOperatedByLearner: false; readonly drugSelectedByLearner: false;
      readonly weightInterventionSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly patientPreferenceInferred: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly noninvasiveVentilationSelectionAssessment?: {
      readonly trajectoryAtTick: number | null; readonly suitabilityAtTick: number | null;
      readonly selectionAtTick: number | null; readonly responseAtTick: number | null;
      readonly failureGuardsAtTick: number | null; readonly handoffAtTick: number | null;
      readonly lastUnsupportedChoice: 'cpap' | 'high-flow' | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly copdExacerbationAuthored: true; readonly acuteHypercapnicAcidosisAuthored: true;
      readonly standardInitialTherapyAuthored: true; readonly immediateDeteriorationAuthored: false;
      readonly airwayProtectionFailureAuthored: false; readonly hemodynamicInstabilityAuthored: false;
      readonly bilevelNivSelectedByLearner: boolean; readonly patientExaminedByLearner: false;
      readonly bloodGasAcquiredByLearner: false; readonly bloodGasInterpretedByLearner: false;
      readonly imagingAcquiredByLearner: false; readonly oxygenSelectedByLearner: false;
      readonly interfaceSelectedByLearner: false; readonly pressureSelectedByLearner: false;
      readonly backupRateSelectedByLearner: false; readonly deviceOperatedByLearner: false;
      readonly ventilationDeliveredByLearner: false; readonly drugSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly intubationPerformedByLearner: false;
      readonly durableNivSuccessProven: false; readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly highFlowOxygenEscalationAssessment?: {
      readonly trajectoryAtTick: number | null; readonly suitabilityAtTick: number | null;
      readonly selectionAtTick: number | null; readonly responseAtTick: number | null;
      readonly guardsAtTick: number | null; readonly handoffAtTick: number | null;
      readonly lastUnsupportedChoice: 'conventional' | 'bilevel' | 'resolved' | 'reduced-monitoring' | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly acuteHypoxemicRespiratoryFailureAuthored: true;
      readonly acuteHypercapnicAcidosisAuthored: false;
      readonly conventionalOxygenFunctionAuthored: true;
      readonly immediateAirwayFailureAuthored: false;
      readonly highFlowTrialIntentRecorded: boolean; readonly patientExaminedByLearner: false;
      readonly bloodGasAcquiredByLearner: false; readonly bloodGasInterpretedByLearner: false;
      readonly imagingAcquiredByLearner: false; readonly deviceInspectedByLearner: false;
      readonly deviceSelectedByLearner: false; readonly cannulaSelectedByLearner: false;
      readonly flowSelectedByLearner: false; readonly fio2SelectedByLearner: false;
      readonly oxygenTargetSelectedByLearner: false; readonly deviceOperatedByLearner: false;
      readonly oxygenDeliveredByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly intubationPerformedByLearner: false; readonly durableSuccessProven: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly oxygenDeviceFailureAssessment?: {
      readonly reconciledAtTick: number | null; readonly bridgeAtTick: number | null;
      readonly pathAtTick: number | null; readonly restorationAtTick: number | null;
      readonly responseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly lastUnsupportedChoice: 'blood-gas' | 'continue-transport' | 'increase-source' | 'reseat-cannula' | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly trueHypoxemiaAuthored: true; readonly pulseSignalCoherentAuthored: true;
      readonly deliveredOxygenFailureAuthored: true; readonly ventilationFailureAuthored: false;
      readonly portableCylinderNoFlowAuthored: boolean; readonly alternateSourceIntentRecorded: boolean;
      readonly patientExaminedByLearner: false; readonly monitorInterpretedByLearner: false;
      readonly deviceInspectedByLearner: false; readonly sourceSelectedByLearner: false;
      readonly interfaceSelectedByLearner: false; readonly flowSelectedByLearner: false;
      readonly fio2SelectedByLearner: false; readonly oxygenTargetSelectedByLearner: false;
      readonly oxygenDeliveredByLearner: false; readonly deviceOperatedByLearner: false;
      readonly connectionHandledByLearner: false; readonly repairPerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly durableRestorationProven: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly acuteTracheostomyObstructionAssessment?: {
      readonly recognitionAtTick: number | null; readonly supportAtTick: number | null;
      readonly devicePathwayAtTick: number | null; readonly innerCannulaAtTick: number | null;
      readonly restorationAtTick: number | null; readonly handoffAtTick: number | null;
      readonly lastUnsupportedChoice: 'imaging' | 'unverified-ventilation' | 'force-catheter' | 'whole-tube' | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly tracheostomyPresentAuthored: true; readonly laryngectomyAuthored: false;
      readonly patentUpperAirwayAuthored: true; readonly matureStomaAuthored: true;
      readonly removableInnerCannulaAuthored: true; readonly innerCannulaObstructionAuthored: boolean;
      readonly dualRouteOxygenIntentRecorded: boolean; readonly expertDevicePathwayRecorded: boolean;
      readonly patientExaminedByLearner: false; readonly monitorInterpretedByLearner: false;
      readonly deviceInspectedByLearner: false; readonly catheterPassedByLearner: false;
      readonly suctionPerformedByLearner: false; readonly innerCannulaHandledByLearner: false;
      readonly tracheostomyTubeHandledByLearner: false; readonly cuffChangedByLearner: false;
      readonly oxygenSelectedByLearner: false; readonly oxygenDeliveredByLearner: false;
      readonly ventilationDeliveredByLearner: false; readonly intubationPerformedByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly durablePatencyProven: false; readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly pediatricRespiratoryDistressAssessment?: {
      readonly recognitionAtTick: number | null; readonly supportAtTick: number | null;
      readonly earlyResponseAtTick: number | null; readonly laterPanelAtTick: number | null;
      readonly rescueAtTick: number | null; readonly handoffAtTick: number | null;
      readonly lastUnsupportedChoice: 'history-first' | 'imaging-first' | 'single-number' | 'falling-rate' | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly hypoxemiaAuthored: true; readonly pulseSignalCoherentAuthored: true;
      readonly progressiveInadequateBreathingAuthored: true;
      readonly experiencedSupportActivated: boolean; readonly rescueReadinessActivated: boolean;
      readonly patientExaminedByLearner: false; readonly monitorInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly testAcquiredByLearner: false;
      readonly oxygenSelectedByLearner: false; readonly oxygenDeliveredByLearner: false;
      readonly deviceSelectedByLearner: false; readonly flowSelectedByLearner: false;
      readonly fio2SelectedByLearner: false; readonly oxygenTargetSelectedByLearner: false;
      readonly ventilationDeliveredByLearner: false; readonly airwayManeuverPerformedByLearner: false;
      readonly intubationPerformedByLearner: false; readonly drugDeliveredByLearner: false;
      readonly fluidDeliveredByLearner: false; readonly procedurePerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly durableRecoveryProven: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly bronchiolitisAssessment?: {
      readonly recognitionAtTick: number | null; readonly patternAtTick: number | null;
      readonly supportAtTick: number | null; readonly feedingHydrationAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly lastUnsupportedChoice: 'radiograph-first' | 'single-saturation'
        | 'routine-albuterol' | 'routine-antibiotic' | 'discharge-on-saturation' | null;
    };
    readonly croupAssessment?: {
      readonly patternAtTick: number | null; readonly severityAtTick: number | null;
      readonly treatmentIntentAtTick: number | null; readonly earlyResponseAtTick: number | null;
      readonly recurrenceAtTick: number | null; readonly handoffAtTick: number | null;
      readonly lastUnsupportedChoice: 'albuterol' | 'radiograph' | 'discharge-early'
        | 'normal-saturation' | null;
    };
    readonly pediatricStatusAsthmaticusAssessment?: {
      readonly trajectoryAtTick: number | null; readonly nonresponseAtTick: number | null;
      readonly escalationAtTick: number | null; readonly secondLineIntentAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly lastUnsupportedChoice: 'force-peak-flow' | 'radiograph-delay'
        | 'trigger-review-delay' | 'saturation-discharge' | null;
    };
    readonly pediatricSepsisAssessment?: {
      readonly patternAtTick: number | null; readonly shockBoundaryAtTick: number | null;
      readonly careAtTick: number | null; readonly sourceReviewAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly pediatricSepticShockAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly rescueAtTick: number | null; readonly sourceAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly pediatricDehydrationAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly rehydrationAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly pediatricDiabeticKetoacidosisAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly careAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly pediatricHypoglycemicSeizureAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly rescueAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly pediatricFebrileSeizureAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly careAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly pediatricStatusEpilepticusAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly secondLineAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly pediatricAnaphylaxisAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly firstLineAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly pediatricSupraventricularTachycardiaAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly careAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly pediatricBradycardicArrestAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly resuscitationAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly pediatricForeignBodyAirwayObstructionAssessment?: {
      readonly reconciledAtTick: number | null; readonly effectiveCoughAtTick: number | null;
      readonly severeResponsiveAtTick: number | null; readonly responsivePathwayAtTick: number | null;
      readonly unresponsivePathwayAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly pediatricInjurySafeguardingAssessment?: {
      readonly trajectoryAtTick: number | null; readonly concernAtTick: number | null;
      readonly safeguardingAtTick: number | null; readonly alternativesAtTick: number | null;
      readonly laterSafetyAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyMinorStrokeAssessment?: {
      readonly trajectoryAtTick: number | null; readonly threatsAtTick: number | null;
      readonly boundaryAtTick: number | null; readonly intentAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyBasilarLvoAssessment?: {
      readonly trajectoryAtTick: number | null; readonly imagingAtTick: number | null;
      readonly boundaryAtTick: number | null; readonly activationAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyCerebellarIchAssessment?: {
      readonly trajectoryAtTick: number | null; readonly imagingAtTick: number | null;
      readonly boundaryAtTick: number | null; readonly ownershipAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyAsahAssessment?: {
      readonly trajectoryAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly boundaryAtTick: number | null; readonly ownershipAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyFocalMotorStatusAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly ownershipAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyNcseAssessment?: {
      readonly trajectoryAtTick: number | null; readonly suspicionAtTick: number | null;
      readonly ownershipAtTick: number | null; readonly alternativesAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyMyasthenicCrisisAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly ownershipAtTick: number | null; readonly causesAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyGbsAssessment?: {
      readonly trajectoryAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly ownershipAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyMeningitisAssessment?: {
      readonly trajectoryAtTick: number | null; readonly ownershipAtTick: number | null;
      readonly diagnosticsAtTick: number | null; readonly treatmentAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyEncephalitisAssessment?: {
      readonly trajectoryAtTick: number | null; readonly ownershipAtTick: number | null;
      readonly treatmentAtTick: number | null; readonly diagnosticsAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyRaisedIcpAssessment?: {
      readonly trajectoryAtTick: number | null; readonly ownershipAtTick: number | null;
      readonly eyesAtTick: number | null; readonly diagnosticsAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyHerniationAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly ownershipAtTick: number | null; readonly boundaryAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyMsccAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly ownershipAtTick: number | null; readonly boundaryAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyDeliriumAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly ownershipAtTick: number | null; readonly boundaryAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neurologyAutonomicDysreflexiaAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly triggerAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyMethemoglobinemiaAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly hazardsAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyCarbonMonoxideAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly severityAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyAcetaminophenAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologySalicylateAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyTricyclicAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyBetaBlockerAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyCalciumChannelBlockerAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyDigoxinAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyCholinergicAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly safetyAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyAnticholinergicAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologySerotoninAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologySympathomimeticAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyMethanolAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyDelayedLastAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly toxicologyOpioidXylazineAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsAtonyAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsMaternalSepsisAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsConcealedAbruptionAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsPostpartumPreeclampsiaAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsEclampsiaAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsAfeAssessment?: {
      readonly supportAtTick: number | null; readonly trajectoryAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsMaternalArrestAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly modificationsAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsShoulderDystociaAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly safetyAtTick: number | null; readonly escalationAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsCordProlapseAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly bridgeAtTick: number | null; readonly birthPlanAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsUterineRuptureAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly uncertaintyAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsMagnesiumToxicityAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly uncertaintyAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsHighNeuraxialAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly uncertaintyAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsFailedIntubationAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly safetyAtTick: number | null; readonly decisionAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsMaternalNeonatalHandoffAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly safetyAtTick: number | null; readonly transferAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly obstetricsOxytocinTachysystoleAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neonatologyTermTransitionAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly careAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neonatologyApneaAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neonatologyIneffectiveVentilationAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neonatologyBradycardiaAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neonatologyMeconiumTransitionAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neonatologyPretermRespiratoryDistressAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neonatologyHypoglycemiaAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neonatologySepsisAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neonatologyThermoregulationAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neonatologyNicuHandoffAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly contentAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly neonatologyTensionPneumothoraxAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly endocrineDkaResolutionAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly endocrineHhsAssessment?: {
      readonly supportAtTick: number | null; readonly contextAtTick: number | null;
      readonly recognitionAtTick: number | null; readonly readinessAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
    };
    readonly severeHypoglycemia?: SevereHypoglycemiaSnapshot;
    readonly adrenalCrisis?: AdrenalCrisisSnapshot;
    readonly thyroidStorm?: ThyroidStormSnapshot;
    readonly myxedema?: MyxedemaSnapshot;
    readonly hypercalcemia?: HypercalcemiaSnapshot;
    readonly hypocalcemia?: HypocalcemiaSnapshot;
    readonly hyponatremiaCorrection?: HyponatremiaCorrectionSnapshot;
    readonly avpDeficiency?: AvpDeficiencySnapshot;
    readonly refeeding?: RefeedingSnapshot;
    readonly perioperativeDiabetes?: PerioperativeDiabetesSnapshot;
    readonly postTetanicCount?: number;
    readonly lastNeuromuscularReversal?: {
      readonly agent: 'sugammadex' | 'neostigmine';
      readonly doseMgPerKg: number | null;
      readonly tick: number;
    } | null;
  };
  readonly injectedCrisisIds?: readonly string[];
  readonly lastExposure: { readonly agentId: string; readonly tick: number } | null;
  readonly syringeRemaining: Readonly<Record<string, number>>;
  readonly ventilator: {
    mode: 'volume-control' | 'pressure-control' | 'manual';
    tidalVolumeMl: number;
    respiratoryRateBpm: number;
    fio2: number;
    peep: number;
    delivering: boolean;
    sevofluranePercent: number;
    freshGasFlowLPerMin: number;
  };
  readonly intubated: boolean;
  readonly airwayAttempts: number;
  readonly lastGrade: number | null;
  readonly airwayAttemptInProgress?: boolean;
  readonly airwayAttemptSecondsRemaining?: number;
  readonly jawThrustCpapSecondsRemaining: number;
  readonly airwayDevice: 'facemask' | 'supraglottic-airway' | 'tracheal-tube';
  readonly supraglotticInsertionSecondsRemaining: number;
  readonly helpRequestedAtTick: number | null;
  readonly muscleRigidityFraction: number;
  readonly bronchospasmSeverity?: number;
  readonly trainOfFourRatio?: number;
  readonly trainOfFourCount?: number;
  readonly prothrombinTimeRatio?: number;
  readonly fibrinogenGPerL?: number;
  readonly onBolus: (drugId: string, amount: number, unit: string) => void;
  readonly onInfusion: (drugId: string, rate: number, unit: string) => void;
  readonly onHypnoticLine: (action: 'inspect' | 'reconnect') => void;
  readonly onCapnographyLine?: (action: 'cross-check-ventilation' | 'reconnect') => void;
  readonly onArterialLine?: (
    action: 'assess-waveform' | 'level-zero' | 'cycle-cuff' | 'restore-dynamic-response',
  ) => void;
  readonly onBreathingCircuit?: (action: 'assess-capnogram' | 'replace-absorbent') => void;
  readonly onFluid: (fluidId: string, volumeMl: number) => void;
  readonly onBloodProduct?: (productId: string, units: number) => void;
  readonly onBloodBankRequest?: () => void;
  readonly onCoagulationLabs?: () => void;
  readonly onVentilator: (settings: Partial<ActionCockpitProps['ventilator']>) => void;
  readonly onLaryngoscopy: (technique: 'direct' | 'video') => void;
  readonly onAirwayManeuver: (maneuver: 'jaw-thrust-cpap') => void;
  readonly onCallForHelp: () => void;
  readonly onAirwayDevice: (device: 'supraglottic-airway') => void;
  readonly onEpinephrine: (doseMicrograms: number) => void;
  readonly onEphedrine?: (doseMg: number) => void;
  readonly onPreeclampsiaResponse?: (
    action: 'repeat-blood-pressure' | 'labetalol-20mg-iv' | 'magnesium-sulfate-4g-iv',
  ) => void;
  readonly onHighSpinalHelp?: () => void;
  readonly onVenousAirEmbolismHelp?: () => void;
  readonly onControlVenousAirEntry?: () => void;
  readonly onPneumothoraxHelp?: () => void;
  readonly onPneumothoraxResponse?: (
    action: 'assess-bilateral-ventilation' | 'decompress-left-chest',
  ) => void;
  readonly onEmergenceResidualBlockAssessment?: (
    action: 'review-quantitative-monitor' | 'classify-residual' | 'classify-recovered'
      | 'defer-extubation-and-support' | 'proceed-to-extubation',
  ) => void;
  readonly onOpioidVentilatoryResponse?: (
    response: 'hold-further-opioid' | 'record-naloxone-titration',
  ) => void;
  readonly onThermalResponse?: (
    response: 'confirm-core-temperature' | 'start-forced-air-warming'
      | 'record-warmed-bulk-fluids',
  ) => void;
  readonly onGlycemicResponse?: (
    response: 'confirm-point-of-care-glucose' | 'record-insulin-protocol-intent'
      | 'repeat-point-of-care-glucose',
  ) => void;
  readonly onHyponatremiaResponse?: (
    action: 'review-hyponatremia-pattern' | 'record-hyponatremia-stabilization'
      | 'record-hypertonic-saline-intent' | 'reassess-hyponatremia-first-hour'
      | 'record-hyponatremia-guardrails-and-cause-plan',
  ) => void;
  readonly onSevereHypoglycemiaResponse?: (action: HypoglycemiaAction) => void;
  readonly onAdrenalCrisisResponse?: (action: AdrenalCrisisAction) => void;
  readonly onThyroidStormResponse?: (action: ThyroidStormAction) => void;
  readonly onMyxedemaResponse?: (action: MyxedemaAction) => void;
  /**
   * This module's lesson trays, supplied by its route.
   *
   * The cockpit used to import all 48 and write out a gated block for each,
   * which measured 98.9 KB gz of the chunk every module downloads. The five
   * props a lesson tray takes are the same five for all of them, so they render
   * here without any lesson being named.
   */
  readonly lessonTrays?: readonly LessonTray[];
  readonly guidance?: GuidanceLevel;
  readonly demonstratingLessonId?: string | undefined;
  readonly onLessonAction?: (actionType: string, action: string) => void;
  readonly onLessonTutorSource?: (() => void) | undefined;
  readonly myxedemaGuidance?: GuidanceLevel;
  readonly myxedemaDemonstrating?: boolean;
  readonly onMyxedemaTutorSource?: () => void;
  readonly onHypercalcemiaResponse?: (action: HypercalcemiaAction) => void;
  readonly hypercalcemiaGuidance?: GuidanceLevel;
  readonly hypercalcemiaDemonstrating?: boolean;
  readonly onHypercalcemiaTutorSource?: () => void;
  readonly onHypocalcemiaResponse?: (action: HypocalcemiaAction) => void;
  readonly hypocalcemiaGuidance?: GuidanceLevel;
  readonly hypocalcemiaDemonstrating?: boolean;
  readonly onHypocalcemiaTutorSource?: () => void;
  readonly onHyponatremiaCorrectionResponse?: (action: HyponatremiaCorrectionAction) => void;
  readonly hyponatremiaCorrectionGuidance?: GuidanceLevel;
  readonly hyponatremiaCorrectionDemonstrating?: boolean;
  readonly onHyponatremiaCorrectionTutorSource?: () => void;
  readonly onPerioperativeDiabetesResponse?: (action: PerioperativeDiabetesAction) => void;
  readonly onRenalHyperkalemiaResponse?: (action: RenalHyperkalemiaAction) => void;
  readonly onRenalHypokalemiaResponse?: (action: RenalHypokalemiaAction) => void;
  readonly onRenalHyponatremiaResponse?: (action: RenalHyponatremiaAction) => void;
  readonly onRenalHypernatremiaResponse?: (action: RenalHypernatremiaAction) => void;
  readonly onRenalHypocalcemiaResponse?: (action: RenalHypocalcemiaAction) => void;
  readonly onRenalHypermagnesemiaResponse?: (action: RenalHypermagnesemiaAction) => void;
  readonly onMeningococcalSepsisResponse?: (action: MeningococcalSepsisAction) => void;
  readonly onObstructedKidneyResponse?: (action: ObstructedKidneyAction) => void;
  readonly onFebrileNeutropeniaResponse?: (action: FebrileNeutropeniaAction) => void;
  readonly onNecrotizingInfectionResponse?: (action: NecrotizingInfectionAction) => void;
  readonly onEndocarditisHeartFailureResponse?: (action: EndocarditisHeartFailureAction) => void;
  readonly onSeverePneumoniaResponse?: (action: SeverePneumoniaAction) => void;
  readonly onToxicShockResponse?: (action: ToxicShockAction) => void;
  readonly onPossibleSepsisResponse?: (action: PossibleSepsisAction) => void;
  readonly onSepticShockLabelResponse?: (action: SepticShockLabelAction) => void;
  readonly onMeningitisImagingResponse?: (action: MeningitisImagingAction) => void;
  readonly onLowScoreResponse?: (action: LowScoreAction) => void;
  readonly onCountedRateResponse?: (action: CountedRateAction) => void;
  readonly onPairedReadingResponse?: (action: PairedReadingAction) => void;
  readonly onAfferentLimbResponse?: (action: AfferentLimbAction) => void;
  readonly onQuietPatientResponse?: (action: QuietPatientAction) => void;
  readonly onProxyScaleResponse?: (action: ProxyScaleAction) => void;
  readonly onLastKnownWellResponse?: (action: LastKnownWellAction) => void;
  readonly onOxygenTargetScaleResponse?: (action: OxygenTargetScaleAction) => void;
  readonly onLostContingencyResponse?: (action: LostContingencyAction) => void;
  readonly onDelayedImmuneEventResponse?: (action: DelayedImmuneEventAction) => void;
  readonly onIncidentalClotResponse?: (action: IncidentalClotAction) => void;
  readonly onNormalTestToxicityResponse?: (action: NormalTestToxicityAction) => void;
  readonly onPrognosisQuestionResponse?: (action: PrognosisQuestionAction) => void;
  readonly onLaboratoryTlsResponse?: (action: LaboratoryTlsAction) => void;
  readonly onRareEarlyMyocarditisResponse?: (action: RareEarlyMyocarditisAction) => void;
  readonly onLoweringTheCountResponse?: (action: LoweringTheCountAction) => void;
  readonly onInheritedUrgencyResponse?: (action: InheritedUrgencyAction) => void;
  readonly onTrialRuleResponse?: (action: TrialRuleAction) => void;
  readonly onSilentInteractionResponse?: (action: SilentInteractionAction) => void;
  readonly onEasyLabelResponse?: (action: EasyLabelAction) => void;
  readonly onNegativeScanResponse?: (action: NegativeScanAction) => void;
  readonly negativeScanGuidance?: GuidanceLevel;
  readonly onRisingRequirementResponse?: (action: RisingRequirementAction) => void;
  readonly risingRequirementGuidance?: GuidanceLevel;
  readonly renalHyponatremiaGuidance?: GuidanceLevel;
  readonly delayedImmuneEventGuidance?: GuidanceLevel;
  readonly incidentalClotGuidance?: GuidanceLevel;
  readonly normalTestToxicityGuidance?: GuidanceLevel;
  readonly prognosisQuestionGuidance?: GuidanceLevel;
  readonly laboratoryTlsGuidance?: GuidanceLevel;
  readonly rareEarlyMyocarditisGuidance?: GuidanceLevel;
  readonly loweringTheCountGuidance?: GuidanceLevel;
  readonly inheritedUrgencyGuidance?: GuidanceLevel;
  readonly trialRuleGuidance?: GuidanceLevel;
  readonly silentInteractionGuidance?: GuidanceLevel;
  readonly easyLabelGuidance?: GuidanceLevel;
  readonly neurologyMyastheniaGuidance?: GuidanceLevel;
  readonly neurologyDysreflexiaGuidance?: GuidanceLevel;
  readonly peaArrestGuidance?: GuidanceLevel;
  readonly persistentVfGuidance?: GuidanceLevel;
  readonly exertionalHeatStrokeGuidance?: GuidanceLevel;
  readonly hyperkalemiaEcgGuidance?: GuidanceLevel;
  readonly severeHyponatremiaGuidance?: GuidanceLevel;
  readonly emergencyStemiGuidance?: GuidanceLevel;
  readonly emergencySvtGuidance?: GuidanceLevel;
  readonly obstructivePleuralShockGuidance?: GuidanceLevel;
  readonly renalHypernatremiaGuidance?: GuidanceLevel;
  readonly renalHypocalcemiaGuidance?: GuidanceLevel;
  readonly renalHypermagnesemiaGuidance?: GuidanceLevel;
  readonly renalHyponatremiaDemonstrating?: boolean;
  readonly renalHypernatremiaDemonstrating?: boolean;
  readonly renalHypocalcemiaDemonstrating?: boolean;
  readonly renalHypermagnesemiaDemonstrating?: boolean;
  readonly meningococcalSepsisGuidance?: GuidanceLevel;
  readonly meningococcalSepsisDemonstrating?: boolean;
  readonly obstructedKidneyGuidance?: GuidanceLevel;
  readonly obstructedKidneyDemonstrating?: boolean;
  readonly febrileNeutropeniaGuidance?: GuidanceLevel;
  readonly febrileNeutropeniaDemonstrating?: boolean;
  readonly necrotizingInfectionGuidance?: GuidanceLevel;
  readonly necrotizingInfectionDemonstrating?: boolean;
  readonly endocarditisHeartFailureGuidance?: GuidanceLevel;
  readonly endocarditisHeartFailureDemonstrating?: boolean;
  readonly severePneumoniaGuidance?: GuidanceLevel;
  readonly severePneumoniaDemonstrating?: boolean;
  readonly toxicShockGuidance?: GuidanceLevel;
  readonly toxicShockDemonstrating?: boolean;
  readonly possibleSepsisGuidance?: GuidanceLevel;
  readonly possibleSepsisDemonstrating?: boolean;
  readonly septicShockLabelGuidance?: GuidanceLevel;
  readonly septicShockLabelDemonstrating?: boolean;
  readonly meningitisImagingGuidance?: GuidanceLevel;
  readonly meningitisImagingDemonstrating?: boolean;
  readonly lowScoreGuidance?: GuidanceLevel;
  readonly lowScoreDemonstrating?: boolean;
  readonly countedRateGuidance?: GuidanceLevel;
  readonly countedRateDemonstrating?: boolean;
  readonly pairedReadingGuidance?: GuidanceLevel;
  readonly pairedReadingDemonstrating?: boolean;
  readonly afferentLimbGuidance?: GuidanceLevel;
  readonly afferentLimbDemonstrating?: boolean;
  readonly quietPatientGuidance?: GuidanceLevel;
  readonly quietPatientDemonstrating?: boolean;
  readonly proxyScaleGuidance?: GuidanceLevel;
  readonly proxyScaleDemonstrating?: boolean;
  readonly lastKnownWellGuidance?: GuidanceLevel;
  readonly lastKnownWellDemonstrating?: boolean;
  readonly oxygenTargetScaleGuidance?: GuidanceLevel;
  readonly oxygenTargetScaleDemonstrating?: boolean;
  readonly lostContingencyGuidance?: GuidanceLevel;
  readonly lostContingencyDemonstrating?: boolean;
  readonly delayedImmuneEventDemonstrating?: boolean;
  readonly incidentalClotDemonstrating?: boolean;
  readonly normalTestToxicityDemonstrating?: boolean;
  readonly prognosisQuestionDemonstrating?: boolean;
  readonly laboratoryTlsDemonstrating?: boolean;
  readonly rareEarlyMyocarditisDemonstrating?: boolean;
  readonly loweringTheCountDemonstrating?: boolean;
  readonly inheritedUrgencyDemonstrating?: boolean;
  readonly trialRuleDemonstrating?: boolean;
  readonly silentInteractionDemonstrating?: boolean;
  readonly easyLabelDemonstrating?: boolean;
  readonly negativeScanDemonstrating?: boolean;
  readonly risingRequirementDemonstrating?: boolean;
  readonly neurologyMyastheniaDemonstrating?: boolean;
  readonly neurologyDysreflexiaDemonstrating?: boolean;
  readonly peaArrestDemonstrating?: boolean;
  readonly persistentVfDemonstrating?: boolean;
  readonly exertionalHeatStrokeDemonstrating?: boolean;
  readonly hyperkalemiaEcgDemonstrating?: boolean;
  readonly severeHyponatremiaDemonstrating?: boolean;
  readonly emergencyStemiDemonstrating?: boolean;
  readonly emergencySvtDemonstrating?: boolean;
  readonly obstructivePleuralShockDemonstrating?: boolean;
  readonly onRenalHyponatremiaTutorSource?: () => void;
  readonly onRenalHypernatremiaTutorSource?: () => void;
  readonly onRenalHypocalcemiaTutorSource?: () => void;
  readonly onRenalHypermagnesemiaTutorSource?: () => void;
  readonly renalHypokalemiaGuidance?: GuidanceLevel;
  readonly renalHypokalemiaDemonstrating?: boolean;
  readonly onRenalHypokalemiaTutorSource?: () => void;
  readonly renalHyperkalemiaGuidance?: GuidanceLevel;
  readonly renalHyperkalemiaDemonstrating?: boolean;
  readonly onRenalHyperkalemiaTutorSource?: () => void;
  readonly perioperativeDiabetesGuidance?: GuidanceLevel;
  readonly perioperativeDiabetesDemonstrating?: boolean;
  readonly onPerioperativeDiabetesTutorSource?: () => void;
  readonly onRefeedingResponse?: (action: RefeedingAction) => void;
  readonly refeedingGuidance?: GuidanceLevel;
  readonly refeedingDemonstrating?: boolean;
  readonly onRefeedingTutorSource?: () => void;
  readonly onAvpDeficiencyResponse?: (action: AvpDeficiencyAction) => void;
  readonly avpDeficiencyGuidance?: GuidanceLevel;
  readonly avpDeficiencyDemonstrating?: boolean;
  readonly onAvpDeficiencyTutorSource?: () => void;
  readonly thyroidGuidance?: GuidanceLevel;
  readonly thyroidDemonstrating?: boolean;
  readonly onThyroidTutorSource?: () => void;
  readonly adrenalGuidance?: GuidanceLevel;
  readonly adrenalDemonstrating?: boolean;
  readonly onAdrenalTutorSource?: () => void;
  readonly onBronchospasmHelp?: () => void;
  readonly onInhaledBronchodilator?: () => void;
  readonly onDantrolene: () => void;
  readonly onActiveCooling: (active: boolean) => void;
  readonly onSeizureSuppression?: () => void;
  readonly onLipidEmulsion?: () => void;
  readonly onChestCompressions?: (active: boolean) => void;
  readonly onArrestEpinephrine?: () => void;
  readonly onDefibrillation?: (energyJ: number) => void;
  readonly onNeuromuscularReversal?: (
    agent: 'sugammadex' | 'neostigmine', doseMgPerKg?: number,
  ) => void;
  readonly onDrugCard: (drugId: string) => void;
}

/** The scenario declares which trays may offer each drug. Existing entries default to both. */
export function formularyForMode(
  formulary: readonly FormularyEntry[],
  mode: 'bolus' | 'infusion',
): FormularyEntry[] {
  return formulary.filter((drug) => drug.deliveryModes?.includes(mode) ?? true);
}

export function scenarioSupportsCoagulation(scenario: Scenario): boolean {
  return scenario.metadata.limitations?.includes('bounded-dilutional-coagulopathy') ?? false;
}

/** One source of truth for both visible rescue trays and the nonvisual state summary. */
export function crisisResponseAvailability(
  scenario: Scenario,
  injectedCrisisIds: readonly string[] = [],
  /** The module's lesson trays, so a lesson's own gate needs no import here. */
  lessonTrays: readonly LessonTray[] = [],
) {
  const injected = new Set(injectedCrisisIds);
  const moduleTray = lessonTrays.find((tray) => tray.supports(scenario));
  const hasSevereHypoglycemiaResponse = moduleTray?.id === 'SevereHypoglycemia';
  const hasAspirationRiskResponse = moduleTray?.id === 'AspirationRisk';
  const hasCiedPlanningResponse = moduleTray?.id === 'CiedPlanning';
  const hasPostoperativeHandoffResponse = moduleTray?.id === 'PostoperativeHandoff';
  const hasDelayedEmergenceResponse = moduleTray?.id === 'DelayedEmergence';
  const hasExtubationReadinessResponse = moduleTray?.id === 'ExtubationReadiness';
  const hasUndifferentiatedShockResponse = moduleTray?.id === 'UndifferentiatedShock';
  const hasSepticShockResponse = moduleTray?.id === 'SepticShock';
  const hasHemorrhagicShockResponse = moduleTray?.id === 'HemorrhagicShock';
  const hasCardiacTamponadeResponse = moduleTray?.id === 'CardiacTamponade';
  const hasStatusEpilepticusResponse = moduleTray?.id === 'StatusEpilepticus';
  const hasEndocrineDkaResolutionResponse = moduleTray?.id === 'EndocrineDkaResolution';
  const hasEndocrineHhsResponse = moduleTray?.id === 'EndocrineHhs';
  const hasObstetricsMaternalArrestResponse = moduleTray?.id === 'ObstetricsMaternalArrest';
  const hasObstetricsShoulderDystociaResponse = moduleTray?.id === 'ObstetricsShoulderDystocia';
  const hasObstetricsCordProlapseResponse = moduleTray?.id === 'ObstetricsCordProlapse';
  const hasObstetricsUterineRuptureResponse = moduleTray?.id === 'ObstetricsUterineRupture';
  const hasObstetricsMagnesiumToxicityResponse = moduleTray?.id === 'ObstetricsMagnesiumToxicity';
  const hasObstetricsHighNeuraxialResponse = moduleTray?.id === 'ObstetricsHighNeuraxial';
  const hasObstetricsFailedIntubationResponse = moduleTray?.id === 'ObstetricsFailedIntubation';
  const hasObstetricsMaternalNeonatalHandoffResponse = moduleTray?.id === 'ObstetricsMaternalNeonatalHandoff';
  const hasObstetricsOxytocinTachysystoleResponse = moduleTray?.id === 'ObstetricsOxytocinTachysystole';
  const hasNeonatologyTermTransitionResponse = moduleTray?.id === 'NeonatologyTermTransition';
  const hasNeonatologyApneaResponse = moduleTray?.id === 'NeonatologyApnea';
  const hasNeonatologyIneffectiveVentilationResponse = moduleTray?.id === 'NeonatologyIneffectiveVentilation';
  const hasNeonatologyBradycardiaResponse = moduleTray?.id === 'NeonatologyBradycardia';
  const hasNeonatologyMeconiumTransitionResponse = moduleTray?.id === 'NeonatologyMeconiumTransition';
  const hasNeonatologyPretermRespiratoryDistressResponse = moduleTray?.id === 'NeonatologyPretermRespiratoryDistress';
  const hasNeonatologyHypoglycemiaResponse = moduleTray?.id === 'NeonatologyHypoglycemia';
  const hasNeonatologySepsisResponse = moduleTray?.id === 'NeonatologySepsis';
  const hasNeonatologyThermoregulationResponse = moduleTray?.id === 'NeonatologyThermoregulation';
  const hasNeonatologyNicuHandoffResponse = moduleTray?.id === 'NeonatologyNicuHandoff';
  const hasNeonatologyTensionPneumothoraxResponse = moduleTray?.id === 'NeonatologyTensionPneumothorax';
  const hasToxicologyMethemoglobinemiaResponse = moduleTray?.id === 'ToxicologyMethemoglobinemia';
  const hasToxicologyCarbonMonoxideResponse = moduleTray?.id === 'ToxicologyCarbonMonoxide';
  const hasToxicologyAcetaminophenResponse = moduleTray?.id === 'ToxicologyAcetaminophen';
  const hasToxicologySalicylateResponse = moduleTray?.id === 'ToxicologySalicylate';
  const hasToxicologyTricyclicResponse = moduleTray?.id === 'ToxicologyTricyclic';
  const hasToxicologyBetaBlockerResponse = moduleTray?.id === 'ToxicologyBetaBlocker';
  const hasToxicologyCalciumChannelBlockerResponse = moduleTray?.id === 'ToxicologyCalciumChannelBlocker';
  const hasToxicologyDigoxinResponse = moduleTray?.id === 'ToxicologyDigoxin';
  const hasToxicologyCholinergicResponse = moduleTray?.id === 'ToxicologyCholinergic';
  const hasToxicologyAnticholinergicResponse = moduleTray?.id === 'ToxicologyAnticholinergic';
  const hasToxicologySerotoninResponse = moduleTray?.id === 'ToxicologySerotonin';
  const hasToxicologySympathomimeticResponse = moduleTray?.id === 'ToxicologySympathomimetic';
  const hasToxicologyMethanolResponse = moduleTray?.id === 'ToxicologyMethanol';
  const hasToxicologyDelayedLastResponse = moduleTray?.id === 'ToxicologyDelayedLast';
  const hasToxicologyOpioidXylazineResponse = moduleTray?.id === 'ToxicologyOpioidXylazine';
  const hasAdrenalCrisisResponse = moduleTray?.id === 'AdrenalCrisis';
  const hasThyroidStormResponse = moduleTray?.id === 'ThyroidStorm';
  const hasMyxedemaResponse = moduleTray?.id === 'Myxedema';
  const hasHypercalcemiaResponse = moduleTray?.id === 'Hypercalcemia';
  const hasHypocalcemiaResponse = moduleTray?.id === 'Hypocalcemia';
  const hasHyponatremiaCorrectionResponse = moduleTray?.id === 'HyponatremiaCorrection';
  const hasAvpDeficiencyResponse = moduleTray?.id === 'AvpDeficiency';
  const hasRefeedingResponse = moduleTray?.id === 'Refeeding';
  const hasPerioperativeDiabetesResponse = moduleTray?.id === 'PerioperativeDiabetes';
  const hasRenalHyperkalemiaResponse = moduleTray?.id === 'RenalHyperkalemia';
  const hasRenalHypokalemiaResponse = moduleTray?.id === 'RenalHypokalemia';
  const hasRenalHyponatremiaResponse = moduleTray?.id === 'RenalHyponatremia';
  const hasRenalHypernatremiaResponse = moduleTray?.id === 'RenalHypernatremia';
  const hasRenalHypocalcemiaResponse = moduleTray?.id === 'RenalHypocalcemia';
  const hasRenalHypermagnesemiaResponse = moduleTray?.id === 'RenalHypermagnesemia';
  const hasMeningococcalSepsisResponse = moduleTray?.id === 'MeningococcalSepsis';
  const hasObstructedKidneyResponse = moduleTray?.id === 'ObstructedKidney';
  const hasFebrileNeutropeniaResponse = moduleTray?.id === 'FebrileNeutropenia';
  const hasNecrotizingInfectionResponse = moduleTray?.id === 'NecrotizingInfection';
  const hasEndocarditisHeartFailureResponse = moduleTray?.id === 'EndocarditisHeartFailure';
  const hasSeverePneumoniaResponse = moduleTray?.id === 'SeverePneumonia';
  const hasToxicShockResponse = moduleTray?.id === 'ToxicShock';
  const hasPossibleSepsisResponse = moduleTray?.id === 'PossibleSepsis';
  const hasSepticShockLabelResponse = moduleTray?.id === 'SepticShockLabel';
  const hasMeningitisImagingResponse = moduleTray?.id === 'MeningitisImaging';
  const hasLowScoreResponse = moduleTray?.id === 'LowScore';
  const hasCountedRateResponse = moduleTray?.id === 'CountedRate';
  const hasPairedReadingResponse = moduleTray?.id === 'PairedReading';
  const hasAfferentLimbResponse = moduleTray?.id === 'AfferentLimb';
  const hasQuietPatientResponse = moduleTray?.id === 'QuietPatient';
  const hasProxyScaleResponse = moduleTray?.id === 'ProxyScale';
  const hasLastKnownWellResponse = moduleTray?.id === 'LastKnownWell';
  const hasOxygenTargetScaleResponse = moduleTray?.id === 'OxygenTargetScale';
  const hasLostContingencyResponse = moduleTray?.id === 'LostContingency';
  const hasDelayedImmuneEventResponse = moduleTray?.id === 'DelayedImmuneEvent';
  const hasIncidentalClotResponse = moduleTray?.id === 'IncidentalClot';
  const hasNormalTestToxicityResponse = moduleTray?.id === 'NormalTestToxicity';
  const hasPrognosisQuestionResponse = moduleTray?.id === 'PrognosisQuestion';
  const hasLaboratoryTlsResponse = moduleTray?.id === 'LaboratoryTls';
  const hasRareEarlyMyocarditisResponse = moduleTray?.id === 'RareEarlyMyocarditis';
  const hasLoweringTheCountResponse = moduleTray?.id === 'LoweringTheCount';
  const hasInheritedUrgencyResponse = moduleTray?.id === 'InheritedUrgency';
  const hasTrialRuleResponse = moduleTray?.id === 'TrialRule';
  const hasSilentInteractionResponse = moduleTray?.id === 'SilentInteraction';
  const hasEasyLabelResponse = moduleTray?.id === 'EasyLabel';
  const hasNegativeScanResponse = moduleTray?.id === 'NegativeScan';
  const hasRisingRequirementResponse = moduleTray?.id === 'RisingRequirement';
  const hasUnfinishedSurveyResponse = moduleTray?.id === 'UnfinishedSurvey';
  const hasTransientResponseResponse = moduleTray?.id === 'TransientResponse';
  const hasQuietChestResponse = moduleTray?.id === 'QuietChest';
  const hasUnownedDelayResponse = moduleTray?.id === 'UnownedDelay';
  const hasThirdAttendanceResponse = moduleTray?.id === 'ThirdAttendance';
  const hasDeferredStepResponse = moduleTray?.id === 'DeferredStep';
  const hasKnownLabelResponse = moduleTray?.id === 'KnownLabel';
  const hasUnspokenDoubtResponse = moduleTray?.id === 'UnspokenDoubt';
  const hasPediatricRespiratoryDistressResponse = moduleTray?.id === 'PediatricRespiratoryDistress';
  const hasBronchiolitisResponse = moduleTray?.id === 'Bronchiolitis';
  const hasCroupResponse = moduleTray?.id === 'Croup';
  const hasPediatricStatusAsthmaticusResponse = moduleTray?.id === 'PediatricStatusAsthmaticus';
  const hasPediatricSepsisResponse = moduleTray?.id === 'PediatricSepsis';
  const hasPediatricSepticShockResponse = moduleTray?.id === 'PediatricSepticShock';
  const hasPediatricDehydrationResponse = moduleTray?.id === 'PediatricDehydration';
  const hasPediatricDiabeticKetoacidosisResponse = moduleTray?.id === 'PediatricDiabeticKetoacidosis';
  const hasPediatricHypoglycemicSeizureResponse = moduleTray?.id === 'PediatricHypoglycemicSeizure';
  const hasPediatricFebrileSeizureResponse = moduleTray?.id === 'PediatricFebrileSeizure';
  const hasPediatricStatusEpilepticusResponse = moduleTray?.id === 'PediatricStatusEpilepticus';
  const hasPediatricAnaphylaxisResponse = moduleTray?.id === 'PediatricAnaphylaxis';
  const hasPediatricSupraventricularTachycardiaResponse = moduleTray?.id === 'PediatricSupraventricularTachycardia';
  const hasPediatricBradycardicArrestResponse = moduleTray?.id === 'PediatricBradycardicArrest';
  const hasPediatricForeignBodyAirwayObstructionResponse = moduleTray?.id === 'PediatricForeignBodyAirwayObstruction';
  const hasPediatricInjurySafeguardingResponse = moduleTray?.id === 'PediatricInjurySafeguarding';
  const hasStableChestPainResponse = moduleTray?.id === 'StableChestPain';
  const hasNstemiRiskResponse = moduleTray?.id === 'NstemiRisk';
  const hasClinicStemiResponse = moduleTray?.id === 'ClinicStemi';
  const hasHeartFailureResponse = moduleTray?.id === 'HeartFailure';
  const hasAfRvrResponse = moduleTray?.id === 'AfRvr';
  const hasPostInfarctionShockResponse = moduleTray?.id === 'PostInfarctionShock';
  const hasStableNarrowTachycardiaResponse = moduleTray?.id === 'StableNarrowTachycardia';
  const hasStableWideTachycardiaResponse = moduleTray?.id === 'StableWideTachycardia';
  const hasSymptomaticBradycardiaResponse = moduleTray?.id === 'SymptomaticBradycardia';
  const hasCompleteHeartBlockResponse = moduleTray?.id === 'CompleteHeartBlock';
  const hasTorsadesResponse = moduleTray?.id === 'Torsades';
  const hasHyperkalemicConductionResponse = moduleTray?.id === 'HyperkalemicConduction';
  const hasPericardialTamponadeResponse = moduleTray?.id === 'PericardialTamponade';
  const hasRightVentricularInfarctionResponse = moduleTray?.id === 'RightVentricularInfarction';
  const hasHypertensiveEmergencyResponse = moduleTray?.id === 'HypertensiveEmergency';
  const hasPacemakerCaptureFailureResponse = moduleTray?.id === 'PacemakerCaptureFailure';
  const hasTranscutaneousPacingCaptureResponse = moduleTray?.id === 'TranscutaneousPacingCapture';
  const hasEmergencyAnaphylaxisResponse = moduleTray?.id === 'EmergencyAnaphylaxis';
  const hasAdultAsthmaResponse = moduleTray?.id === 'AdultAsthma';
  const hasCopdExacerbationResponse = moduleTray?.id === 'CopdExacerbation';
  const hasAcutePulmonaryEdemaResponse = moduleTray?.id === 'AcutePulmonaryEdema';
  const hasPulmonaryEmbolismResponse = moduleTray?.id === 'PulmonaryEmbolism';
  const hasStemiResponse = moduleTray?.id === 'Stemi';
  const hasUnstableNarrowTachycardiaResponse = moduleTray?.id === 'UnstableNarrowTachycardia';
  const hasUnstableBradycardiaResponse = moduleTray?.id === 'UnstableBradycardia';
  const hasAcuteIschemicStrokeResponse = moduleTray?.id === 'AcuteIschemicStroke';
  const hasIntracranialHemorrhageResponse = moduleTray?.id === 'IntracranialHemorrhage';
  const hasDiabeticKetoacidosisResponse = moduleTray?.id === 'DiabeticKetoacidosis';
  const hasHyperkalemiaResponse = moduleTray?.id === 'Hyperkalemia';
  const hasOpioidToxicityResponse = moduleTray?.id === 'OpioidToxicity';
  const hasHeatStrokeResponse = moduleTray?.id === 'HeatStroke';
  const hasTraumaPrimarySurveyResponse = moduleTray?.id === 'TraumaPrimarySurvey';
  const hasAcuteAorticSyndromeResponse = moduleTray?.id === 'AcuteAorticSyndrome';
  const hasArdsLungProtectiveResponse = moduleTray?.id === 'ArdsLungProtective';
  const hasEscalatingHypoxemiaResponse = moduleTray?.id === 'EscalatingHypoxemia';
  const hasVentilatorDyssynchronyResponse = moduleTray?.id === 'VentilatorDyssynchrony';
  const hasAutoPeepResponse = moduleTray?.id === 'AutoPeep';
  const hasMucusPluggingResponse = moduleTray?.id === 'MucusPlugging';
  const hasUnplannedExtubationResponse = moduleTray?.id === 'UnplannedExtubation';
  const hasSpontaneousBreathingTrialResponse = moduleTray?.id === 'SpontaneousBreathingTrial';
  const hasPostIntubationHypotensionResponse = moduleTray?.id === 'PostIntubationHypotension';
  const hasCardiogenicShockResponse = moduleTray?.id === 'CardiogenicShock';
  const hasMixedShockResponse = moduleTray?.id === 'MixedShock';
  const hasRightVentricularFailureResponse = moduleTray?.id === 'RightVentricularFailure';
  const hasMassivePulmonaryEmbolismResponse = moduleTray?.id === 'MassivePulmonaryEmbolism';
  const hasUpperGiHemorrhageResponse = moduleTray?.id === 'UpperGiHemorrhage';
  const hasCriticalCareStatusEpilepticusResponse = moduleTray?.id === 'CriticalCareStatusEpilepticus';
  const hasPostArrestTemperatureResponse = moduleTray?.id === 'PostArrestTemperature';
  const hasIntracranialHypertensionResponse = moduleTray?.id === 'IntracranialHypertension';
  const hasAkiFluidOverloadResponse = moduleTray?.id === 'AkiFluidOverload';
  const hasSevereAcidemiaResponse = moduleTray?.id === 'SevereAcidemia';
  const hasIcuHiddenDeteriorationHandoffResponse = moduleTray?.id === 'IcuHiddenDeteriorationHandoff';
  const hasVentilatorCircuitDisconnectionResponse = moduleTray?.id === 'VentilatorCircuitDisconnection';
  const hasDelayedVasopressorDeliveryResponse = moduleTray?.id === 'DelayedVasopressorDelivery';
  const hasPulseOximeterArtifactResponse = moduleTray?.id === 'PulseOximeterArtifact';
  const hasEndotrachealTubeMigrationResponse = moduleTray?.id === 'EndotrachealTubeMigration';
  const hasSepticShockResuscitationResponse = moduleTray?.id === 'SepticShockResuscitation';
  const hasNeurologyMinorStrokeResponse = moduleTray?.id === 'NeurologyMinorStroke';
  const hasNeurologyBasilarLvoResponse = moduleTray?.id === 'NeurologyBasilarLvo';
  const hasNeurologyCerebellarIchResponse = moduleTray?.id === 'NeurologyCerebellarIch';
  const hasNeurologyAsahDeteriorationResponse = moduleTray?.id === 'NeurologyAsahDeterioration';
  const hasNeurologyFocalMotorStatusResponse = moduleTray?.id === 'NeurologyFocalMotorStatus';
  const hasNeurologyNcseResponse = moduleTray?.id === 'NeurologyNcse';
  const hasNeurologyMyasthenicCrisisResponse = moduleTray?.id === 'NeurologyMyasthenicCrisis';
  const hasNeurologyGbsResponse = moduleTray?.id === 'NeurologyGbs';
  const hasNeurologyMeningitisResponse = moduleTray?.id === 'NeurologyMeningitis';
  const hasNeurologyEncephalitisResponse = moduleTray?.id === 'NeurologyEncephalitis';
  const hasNeurologyRaisedIcpResponse = moduleTray?.id === 'NeurologyRaisedIcp';
  const hasNeurologyHerniationResponse = moduleTray?.id === 'NeurologyHerniation';
  const hasNeurologyMsccResponse = moduleTray?.id === 'NeurologyMscc';
  const hasNeurologyDeliriumResponse = moduleTray?.id === 'NeurologyDelirium';
  const hasNeurologyAutonomicDysreflexiaResponse = moduleTray?.id === 'NeurologyAutonomicDysreflexia';
  const hasAcuteSevereAsthmaResponse = moduleTray?.id === 'AcuteSevereAsthma';
  const hasAcuteTracheostomyObstructionResponse = moduleTray?.id === 'AcuteTracheostomyObstruction';
  const hasApeSupportResponse = moduleTray?.id === 'ApeSupport';
  const hasBronchiectasisMucusPluggingResponse = moduleTray?.id === 'BronchiectasisMucusPlugging';
  const hasCapHypoxemiaResponse = moduleTray?.id === 'CapHypoxemia';
  const hasChronicOpioidHypoventilationResponse = moduleTray?.id === 'ChronicOpioidHypoventilation';
  const hasCopdTransitionResponse = moduleTray?.id === 'CopdTransition';
  const hasHighFlowOxygenEscalationResponse = moduleTray?.id === 'HighFlowOxygenEscalation';
  const hasLargePleuralEffusionResponse = moduleTray?.id === 'LargePleuralEffusion';
  const hasNeuromuscularRespiratoryFailureResponse = moduleTray?.id === 'NeuromuscularRespiratoryFailure';
  const hasNoninvasiveVentilationSelectionResponse = moduleTray?.id === 'NoninvasiveVentilationSelection';
  const hasObesityHypoventilationResponse = moduleTray?.id === 'ObesityHypoventilation';
  const hasOxygenDeviceFailureResponse = moduleTray?.id === 'OxygenDeviceFailure';
  const hasPostPeDyspneaResponse = moduleTray?.id === 'PostPeDyspnea';
  const hasPostTensionPneumothoraxResponse = moduleTray?.id === 'PostTensionPneumothorax';
  const hasObstetricsAfeResponse = moduleTray?.id === 'ObstetricsAfe';
  const hasObstetricsAtonyResponse = moduleTray?.id === 'ObstetricsAtony';
  const hasObstetricsConcealedAbruptionResponse = moduleTray?.id === 'ObstetricsConcealedAbruption';
  const hasObstetricsEclampsiaResponse = moduleTray?.id === 'ObstetricsEclampsia';
  const hasObstetricsMaternalSepsisResponse = moduleTray?.id === 'ObstetricsMaternalSepsis';
  const hasObstetricsPostpartumPreeclampsiaResponse = moduleTray?.id === 'ObstetricsPostpartumPreeclampsia';
  return {
    hasAnaphylaxisResponse: injected.has('anaphylaxis')
      || scenario.timeline.some((event) => event.type === 'anaphylaxis'),
    hasHypermetabolicResponse: injected.has('malignant-hyperthermia')
      || scenario.timeline.some((event) => event.type === 'malignant-hyperthermia'),
    hasLastResponse: injected.has('local-anesthetic-systemic-toxicity')
      || scenario.timeline.some((event) => event.type === 'local-anesthetic-toxicity'),
    hasCardiacArrestResponse: !hasObstetricsMaternalArrestResponse && (injected.has('cardiac-arrest-shockable')
      || injected.has('cardiac-arrest-non-shockable')
      || scenario.timeline.some((event) => event.type === 'rhythm-change'
        && ['ventricular-fibrillation', 'asystole', 'pea'].includes(event.target ?? ''))),
    hasHighSpinalResponse: injected.has('high-spinal')
      || scenario.timeline.some((event) => event.type === 'high-spinal'),
    hasPreeclampsiaResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'persistent-severe-preeclampsia',
    ) && scenario.metadata.id === 'preeclampsia-urgent-delivery',
    hasVenousAirEmbolismResponse: injected.has('air-embolism')
      || scenario.timeline.some((event) => event.type === 'venous-air-embolism'),
    hasPneumothoraxResponse: scenario.timeline.some(
      (event) => event.type === 'tension-pneumothorax',
    ),
    hasEmergenceResidualBlockResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'emergence-residual-blockade',
    ),
    hasSevereHyponatremiaResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'severe-hyponatremia-with-seizure',
    ),
    hasObstetricsMaternalArrestResponse,
    hasObstetricsShoulderDystociaResponse,
    hasObstetricsCordProlapseResponse,
    hasObstetricsUterineRuptureResponse,
    hasObstetricsMagnesiumToxicityResponse,
    hasObstetricsHighNeuraxialResponse,
    hasObstetricsFailedIntubationResponse,
    hasObstetricsMaternalNeonatalHandoffResponse,
    hasObstetricsOxytocinTachysystoleResponse,
    hasNeonatologyTermTransitionResponse,
    hasNeonatologyApneaResponse,
    hasNeonatologyIneffectiveVentilationResponse,
    hasNeonatologyBradycardiaResponse,
    hasNeonatologyMeconiumTransitionResponse,
    hasNeonatologyPretermRespiratoryDistressResponse,
    hasNeonatologyHypoglycemiaResponse,
    hasNeonatologySepsisResponse,
    hasNeonatologyThermoregulationResponse,
    hasNeonatologyNicuHandoffResponse,
    hasNeonatologyTensionPneumothoraxResponse,
    hasEndocrineDkaResolutionResponse,
    hasEndocrineHhsResponse,
    hasObstetricsAfeResponse,
    hasObstetricsAtonyResponse,
    hasObstetricsConcealedAbruptionResponse,
    hasObstetricsEclampsiaResponse,
    hasObstetricsMaternalSepsisResponse,
    hasObstetricsPostpartumPreeclampsiaResponse,
    hasAcuteSevereAsthmaResponse,
    hasAcuteTracheostomyObstructionResponse,
    hasApeSupportResponse,
    hasBronchiectasisMucusPluggingResponse,
    hasCapHypoxemiaResponse,
    hasChronicOpioidHypoventilationResponse,
    hasCopdTransitionResponse,
    hasHighFlowOxygenEscalationResponse,
    hasLargePleuralEffusionResponse,
    hasNeuromuscularRespiratoryFailureResponse,
    hasNoninvasiveVentilationSelectionResponse,
    hasObesityHypoventilationResponse,
    hasOxygenDeviceFailureResponse,
    hasPostPeDyspneaResponse,
    hasPostTensionPneumothoraxResponse,
    hasNeurologyMinorStrokeResponse,
    hasNeurologyBasilarLvoResponse,
    hasNeurologyCerebellarIchResponse,
    hasNeurologyAsahDeteriorationResponse,
    hasNeurologyFocalMotorStatusResponse,
    hasNeurologyNcseResponse,
    hasNeurologyMyasthenicCrisisResponse,
    hasNeurologyGbsResponse,
    hasNeurologyMeningitisResponse,
    hasNeurologyEncephalitisResponse,
    hasNeurologyRaisedIcpResponse,
    hasNeurologyHerniationResponse,
    hasNeurologyMsccResponse,
    hasNeurologyDeliriumResponse,
    hasNeurologyAutonomicDysreflexiaResponse,
    hasArdsLungProtectiveResponse,
    hasEscalatingHypoxemiaResponse,
    hasVentilatorDyssynchronyResponse,
    hasAutoPeepResponse,
    hasMucusPluggingResponse,
    hasUnplannedExtubationResponse,
    hasSpontaneousBreathingTrialResponse,
    hasPostIntubationHypotensionResponse,
    hasCardiogenicShockResponse,
    hasMixedShockResponse,
    hasRightVentricularFailureResponse,
    hasMassivePulmonaryEmbolismResponse,
    hasUpperGiHemorrhageResponse,
    hasCriticalCareStatusEpilepticusResponse,
    hasPostArrestTemperatureResponse,
    hasIntracranialHypertensionResponse,
    hasAkiFluidOverloadResponse,
    hasSevereAcidemiaResponse,
    hasIcuHiddenDeteriorationHandoffResponse,
    hasVentilatorCircuitDisconnectionResponse,
    hasDelayedVasopressorDeliveryResponse,
    hasPulseOximeterArtifactResponse,
    hasEndotrachealTubeMigrationResponse,
    hasSepticShockResuscitationResponse,
    hasEmergencyAnaphylaxisResponse,
    hasAdultAsthmaResponse,
    hasCopdExacerbationResponse,
    hasAcutePulmonaryEdemaResponse,
    hasPulmonaryEmbolismResponse,
    hasStemiResponse,
    hasUnstableNarrowTachycardiaResponse,
    hasUnstableBradycardiaResponse,
    hasAcuteIschemicStrokeResponse,
    hasIntracranialHemorrhageResponse,
    hasDiabeticKetoacidosisResponse,
    hasHyperkalemiaResponse,
    hasOpioidToxicityResponse,
    hasHeatStrokeResponse,
    hasTraumaPrimarySurveyResponse,
    hasAcuteAorticSyndromeResponse,
    hasStableChestPainResponse,
    hasNstemiRiskResponse,
    hasClinicStemiResponse,
    hasHeartFailureResponse,
    hasAfRvrResponse,
    hasPostInfarctionShockResponse,
    hasStableNarrowTachycardiaResponse,
    hasStableWideTachycardiaResponse,
    hasSymptomaticBradycardiaResponse,
    hasCompleteHeartBlockResponse,
    hasTorsadesResponse,
    hasHyperkalemicConductionResponse,
    hasPericardialTamponadeResponse,
    hasRightVentricularInfarctionResponse,
    hasHypertensiveEmergencyResponse,
    hasPacemakerCaptureFailureResponse,
    hasTranscutaneousPacingCaptureResponse,
    hasPediatricRespiratoryDistressResponse,
    hasBronchiolitisResponse,
    hasCroupResponse,
    hasPediatricStatusAsthmaticusResponse,
    hasPediatricSepsisResponse,
    hasPediatricSepticShockResponse,
    hasPediatricDehydrationResponse,
    hasPediatricDiabeticKetoacidosisResponse,
    hasPediatricHypoglycemicSeizureResponse,
    hasPediatricFebrileSeizureResponse,
    hasPediatricStatusEpilepticusResponse,
    hasPediatricAnaphylaxisResponse,
    hasPediatricSupraventricularTachycardiaResponse,
    hasPediatricBradycardicArrestResponse,
    hasPediatricForeignBodyAirwayObstructionResponse,
    hasPediatricInjurySafeguardingResponse,
    hasSevereHypoglycemiaResponse,
    hasAspirationRiskResponse,
    hasCiedPlanningResponse,
    hasPostoperativeHandoffResponse,
    hasDelayedEmergenceResponse,
    hasExtubationReadinessResponse,
    hasUndifferentiatedShockResponse,
    hasSepticShockResponse,
    hasHemorrhagicShockResponse,
    hasCardiacTamponadeResponse,
    hasStatusEpilepticusResponse,
    hasToxicologyMethemoglobinemiaResponse,
    hasToxicologyCarbonMonoxideResponse,
    hasToxicologyAcetaminophenResponse,
    hasToxicologySalicylateResponse,
    hasToxicologyTricyclicResponse,
    hasToxicologyBetaBlockerResponse,
    hasToxicologyCalciumChannelBlockerResponse,
    hasToxicologyDigoxinResponse,
    hasToxicologyCholinergicResponse,
    hasToxicologyAnticholinergicResponse,
    hasToxicologySerotoninResponse,
    hasToxicologySympathomimeticResponse,
    hasToxicologyMethanolResponse,
    hasToxicologyDelayedLastResponse,
    hasToxicologyOpioidXylazineResponse,
    hasAdrenalCrisisResponse,
    hasThyroidStormResponse, hasMyxedemaResponse, hasHypercalcemiaResponse, hasHypocalcemiaResponse, hasHyponatremiaCorrectionResponse, hasAvpDeficiencyResponse, hasRefeedingResponse, hasPerioperativeDiabetesResponse, hasRenalHyperkalemiaResponse, hasRenalHypokalemiaResponse, hasRenalHyponatremiaResponse, hasRenalHypernatremiaResponse, hasRenalHypocalcemiaResponse, hasRenalHypermagnesemiaResponse, hasMeningococcalSepsisResponse, hasObstructedKidneyResponse, hasFebrileNeutropeniaResponse, hasNecrotizingInfectionResponse, hasEndocarditisHeartFailureResponse, hasSeverePneumoniaResponse, hasToxicShockResponse, hasPossibleSepsisResponse, hasSepticShockLabelResponse, hasMeningitisImagingResponse, hasLowScoreResponse, hasCountedRateResponse, hasPairedReadingResponse, hasAfferentLimbResponse, hasQuietPatientResponse, hasProxyScaleResponse, hasLastKnownWellResponse, hasOxygenTargetScaleResponse, hasLostContingencyResponse, hasDelayedImmuneEventResponse, hasIncidentalClotResponse, hasNormalTestToxicityResponse, hasPrognosisQuestionResponse, hasLaboratoryTlsResponse, hasRareEarlyMyocarditisResponse, hasLoweringTheCountResponse, hasInheritedUrgencyResponse, hasTrialRuleResponse, hasSilentInteractionResponse, hasEasyLabelResponse, hasNegativeScanResponse, hasRisingRequirementResponse, hasUnfinishedSurveyResponse, hasTransientResponseResponse, hasQuietChestResponse, hasUnownedDelayResponse, hasThirdAttendanceResponse, hasDeferredStepResponse, hasKnownLabelResponse, hasUnspokenDoubtResponse,
    hasBronchospasmResponse: injected.has('bronchospasm')
      || scenario.timeline.some((event) => event.type === 'obstruction'
        && event.id.includes('bronchospasm')),
  };
}

/**
 * Four working trays, not placeholder tabs.
 *
 * Fluids & Blood and Resuscitation were tabs containing one sentence each,
 * saying they were not in this build. Two fifths of the action cockpit's tabs
 * led nowhere, on the region a learner spends the session in and which is the
 * first thing to run out of room on a laptop.
 *
 * The honesty is kept and the clutter is not: what is not modelled is now said
 * once, in a line under the trays, where it is read rather than clicked into.
 */
const TRAYS: { id: TrayId; label: string }[] = [
  { id: 'syringes', label: 'Syringes' },
  { id: 'infusions', label: 'Infusions' },
  { id: 'fluids', label: 'Fluids' },
  { id: 'airway', label: 'Airway & Vent' },
];
const CRISIS_TRAY = { id: 'crisis', label: 'Crisis response' } as const;

/**
 * Said once, in the place a learner would go looking for the missing thing.
 *
 * The notice distinguishes the bounded scripted arrest response from hypoxic
 * arrest elsewhere, where resuscitation remains outside the model.
 */
export const NOT_IN_THIS_BUILD =
  'Packed red cells use a bounded adult-only 300 mL and 60 g hemoglobin per-unit teaching model. '
  + 'Scenarios that declare bounded dilutional coagulopathy also offer an immediate PT-ratio/fibrinogen teaching panel and fixed-unit plasma response. '
  + 'Compatibility, reactions, infusion rate, platelets, cryoprecipitate, viscoelastic testing, consumption, and a massive-transfusion protocol are not modeled. '
  + 'Crystalloid uses a fixed 25% intravascular retention teaching model. '
  + 'Cardiac-arrest resuscitation actions — compressions, arrest-dose epinephrine, and defibrillation — '
  + 'are available only in the bounded scripted arrest case; a patient with hypoxic arrest elsewhere does not recover.';

export function ActionCockpit(props: ActionCockpitProps) {
  const [tray, setTray] = useState<TrayId>(() => props.scenario.timeline.some(
    (event) => event.type === 'perioperative-hypothermia'
      || event.type === 'perioperative-hyperglycemia',
  ) ? 'fluids' : props.scenario.timeline.some(
    (event) => event.type === 'upper-airway-obstruction'
      || event.type === 'opioid-ventilatory-impairment',
  ) ? 'airway' : props.scenario.formulary.length === 0
    && props.scenario.timeline.some((event) => event.type === 'tension-pneumothorax'
      || (event.type === 'rhythm-change'
        && ['ventricular-fibrillation', 'pea'].includes(event.target ?? ''))
      || event.type === 'sepsis-pattern'
      || event.type === 'hemorrhagic-shock-pattern'
      || event.type === 'cardiac-tamponade'
      || event.type === 'status-epilepticus'
      || (event.type === 'narrative' && event.target === 'emergency-anaphylaxis')
      || (event.type === 'narrative' && event.target === 'adult-asthma')
      || (event.type === 'narrative' && event.target === 'copd-exacerbation')
      || (event.type === 'narrative' && event.target === 'acute-pulmonary-edema')
      || (event.type === 'narrative' && event.target === 'pulmonary-embolism-deterioration')
      || (event.type === 'narrative' && event.target === 'stemi')
      || (event.type === 'narrative' && event.target === 'unstable-narrow-complex-tachycardia')
      || (event.type === 'narrative' && event.target === 'unstable-bradycardia')
      || (event.type === 'narrative' && event.target === 'acute-ischemic-stroke')
      || (event.type === 'narrative' && event.target === 'intracranial-hemorrhage-deterioration')
      || (event.type === 'narrative' && event.target === 'diabetic-ketoacidosis')
      || (event.type === 'narrative' && event.target === 'hyperkalemia-with-ecg-change')
      || (event.type === 'narrative' && event.target === 'severe-hyponatremia-with-seizure')
      || (event.type === 'narrative' && event.target === 'opioid-toxicity')
      || (event.type === 'narrative' && event.target === 'exertional-heat-stroke')
      || (event.type === 'narrative' && event.target === 'trauma-primary-survey')
      || (event.type === 'narrative' && event.target === 'acute-aortic-syndrome')
      || (event.type === 'narrative' && event.target === 'ards-lung-protective-ventilation')
      || (event.type === 'narrative' && event.target === 'escalating-hypoxemia')
      || (event.type === 'narrative' && event.target === 'ventilator-dyssynchrony')
      || (event.type === 'narrative' && event.target === 'auto-peep')
      || (event.type === 'narrative' && event.target === 'mucus-plugging')
      || (event.type === 'narrative' && event.target === 'unplanned-extubation')
      || (event.type === 'narrative' && event.target === 'spontaneous-breathing-trial')
      || (event.type === 'narrative' && event.target === 'post-intubation-hypotension')
      || (event.type === 'narrative' && event.target === 'cardiogenic-shock')
      || (event.type === 'narrative' && event.target === 'mixed-shock')
      || (event.type === 'narrative' && event.target === 'right-ventricular-failure')
      || (event.type === 'narrative' && event.target === 'massive-pulmonary-embolism')
      || (event.type === 'narrative' && event.target === 'upper-gi-hemorrhage')
      || (event.type === 'narrative' && event.target === 'critical-care-status-epilepticus')
      || (event.type === 'narrative' && event.target === 'targeted-temperature-management')
      || (event.type === 'narrative' && event.target === 'intracranial-hypertension')
      || (event.type === 'narrative' && event.target === 'acute-kidney-injury-with-fluid-overload')
      || (event.type === 'narrative' && event.target === 'severe-acidemia')
      || (event.type === 'narrative' && event.target === 'icu-handoff-with-hidden-deterioration')
      || (event.type === 'narrative' && event.target === 'ventilator-circuit-disconnection')
      || (event.type === 'narrative' && event.target === 'delayed-vasopressor-delivery')
      || (event.type === 'narrative' && event.target === 'pulse-oximeter-motion-artifact')
      || (event.type === 'narrative' && event.target === 'endotracheal-tube-migration-after-repositioning')
      || (event.type === 'narrative' && event.target === 'septic-shock-resuscitation')
      || (event.type === 'narrative' && event.target === 'stable-chest-pain-evaluation')
      || (event.type === 'narrative' && event.target === 'nstemi-risk-reassessment')
      || (event.type === 'narrative' && event.target === 'stemi-recognition-and-first-actions')
      || (event.type === 'narrative' && event.target === 'acute-decompensated-heart-failure')
      || (event.type === 'narrative' && event.target === 'atrial-fibrillation-with-rapid-response')
      || (event.type === 'narrative' && event.target === 'post-infarction-cardiogenic-shock-escalation')
      || (event.type === 'narrative' && event.target === 'regular-narrow-complex-tachycardia')
      || (event.type === 'narrative' && event.target === 'wide-complex-tachycardia')
      || (event.type === 'narrative'
        && event.target === 'symptomatic-sinus-bradycardia-reassessment')
      || (event.type === 'narrative' && event.target === 'complete-heart-block')
      || (event.type === 'narrative' && event.target === 'torsades-de-pointes')
      || (event.type === 'narrative' && event.target === 'hyperkalemic-conduction-disturbance')
      || (event.type === 'narrative' && event.target === 'pericardial-tamponade-reassessment')
      || (event.type === 'narrative' && event.target === 'right-ventricular-infarction')
      || (event.type === 'narrative' && event.target === 'hypertensive-emergency-reassessment')
      || (event.type === 'narrative' && event.target === 'pacemaker-capture-failure-reassessment')
      || (event.type === 'narrative'
        && event.target === 'transcutaneous-pacing-mechanical-capture-reassessment')
      || (event.type === 'narrative' && event.target === 'acute-severe-asthma-reassessment')
      || (event.type === 'narrative'
        && event.target === 'copd-exacerbation-transition-reassessment')
      || (event.type === 'narrative'
        && event.target === 'community-acquired-pneumonia-hypoxemia-reassessment')
      || (event.type === 'narrative'
        && event.target === 'post-pulmonary-embolism-persistent-dyspnea-reassessment')
      || (event.type === 'narrative'
        && event.target === 'acute-pulmonary-edema-respiratory-support-reassessment')
      || (event.type === 'narrative'
        && event.target === 'spontaneous-tension-pneumothorax-post-drainage-reassessment')
      || (event.type === 'narrative'
        && event.target === 'large-unilateral-pleural-effusion-reassessment')
      || (event.type === 'narrative'
        && event.target === 'bronchiectasis-mucus-plugging-reassessment')
      || (event.type === 'narrative'
        && event.target === 'chronic-opioid-related-hypoventilation-reassessment')
      || (event.type === 'narrative'
        && event.target === 'neuromuscular-respiratory-failure-reassessment')
      || (event.type === 'narrative'
        && event.target === 'obesity-hypoventilation-reassessment')
      || (event.type === 'narrative'
        && event.target === 'noninvasive-ventilation-selection')
      || (event.type === 'narrative'
        && event.target === 'high-flow-nasal-oxygen-escalation')
      || (event.type === 'narrative'
        && event.target === 'oxygen-device-failure')
      || (event.type === 'narrative'
        && event.target === 'acute-tracheostomy-obstruction-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-respiratory-distress-reassessment')
      || (event.type === 'narrative' && event.target === 'bronchiolitis-reassessment')
      || (event.type === 'narrative' && event.target === 'croup-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-status-asthmaticus-reassessment')
      || (event.type === 'narrative' && event.target === 'pediatric-sepsis-reassessment')
      || (event.type === 'narrative' && event.target === 'pediatric-septic-shock-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-dehydration-with-hypovolemia-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-diabetic-ketoacidosis-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-hypoglycemic-seizure-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-febrile-seizure-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-status-epilepticus-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-anaphylaxis-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-supraventricular-tachycardia-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-bradycardic-arrest-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-foreign-body-airway-obstruction-reassessment')
      || (event.type === 'narrative'
        && event.target === 'pediatric-injury-safeguarding-escalation-reassessment')
      || (event.type === 'narrative'
        && event.target === 'minor-nondisabling-acute-ischemic-stroke-reassessment')
      || (event.type === 'narrative'
        && event.target === 'basilar-artery-occlusion-escalation-reassessment')
      || (event.type === 'narrative'
        && event.target === 'spontaneous-cerebellar-intracerebral-hemorrhage-reassessment')
      || (event.type === 'narrative'
        && event.target === 'aneurysmal-subarachnoid-hemorrhage-deterioration-reassessment')
      || (event.type === 'narrative'
        && event.target === 'focal-motor-status-epilepticus-escalation-reassessment')
      || (event.type === 'narrative'
        && event.target === 'nonconvulsive-status-epilepticus-recognition-reassessment')
      || (event.type === 'narrative'
        && event.target === 'myasthenic-crisis-escalation-reassessment')
      || (event.type === 'narrative'
        && event.target === 'guillain-barre-respiratory-decline-reassessment')
      || (event.type === 'narrative'
        && event.target === 'acute-bacterial-meningitis-first-hour-reassessment')
      || (event.type === 'narrative'
        && event.target === 'suspected-herpes-simplex-encephalitis-reassessment')
      || (event.type === 'narrative'
        && event.target === 'raised-intracranial-pressure-visual-threat-reassessment')
      || (event.type === 'narrative'
        && event.target === 'acute-transtentorial-herniation-pattern-reassessment')
      || (event.type === 'narrative'
        && event.target === 'metastatic-spinal-cord-compression-reassessment')
      || (event.type === 'narrative' && event.target === 'acute-delirium-reversible-causes-reassessment')
      || (event.type === 'narrative' && event.target === 'autonomic-dysreflexia-authored-trigger-transition')
      || (event.type === 'narrative' && event.target === 'methemoglobinemia-saturation-gap-transition')
      || (event.type === 'narrative' && event.target === 'carbon-monoxide-reassuring-monitor-transition')
      || (event.type === 'narrative' && event.target === 'acetaminophen-clock-and-nomogram-transition')
      || (event.type === 'narrative' && event.target === 'salicylate-falling-number-transition')
      || (event.type === 'narrative' && event.target === 'tricyclic-sodium-channel-cardiotoxicity-transition')
      || (event.type === 'narrative' && event.target === 'beta-blocker-cardiogenic-shock-transition')
      || (event.type === 'narrative' && event.target === 'calcium-channel-blocker-shock-transition')
      || (event.type === 'narrative' && event.target === 'digoxin-rhythm-potassium-transition')
      || (event.type === 'narrative' && event.target === 'cholinergic-pesticide-respiratory-failure-transition')
      || (event.type === 'narrative' && event.target === 'anticholinergic-hyperthermia-delirium-transition')
      || (event.type === 'narrative' && event.target === 'serotonin-toxicity-hyperthermia-clonus-transition')
      || (event.type === 'narrative' && event.target === 'sympathomimetic-hyperadrenergic-hyperthermia-transition')
      || (event.type === 'narrative' && event.target === 'methanol-visual-acidosis-gaps-transition')
      || (event.type === 'narrative' && event.target === 'delayed-local-anesthetic-cns-cardiac-toxicity-transition')
      || (event.type === 'narrative' && event.target === 'opioid-xylazine-persistent-sedation-transition')
      || (event.type === 'narrative' && event.target === 'postpartum-hemorrhage-uterine-atony-transition')
      || (event.type === 'narrative' && event.target === 'maternal-sepsis-postpartum-deterioration-transition')
      || (event.type === 'narrative' && event.target === 'concealed-placental-abruption-hemorrhage-transition')
      || (event.type === 'narrative' && event.target === 'postpartum-severe-preeclampsia-warning-signs-transition')
      || (event.type === 'narrative' && event.target === 'eclampsia-first-seizure-response-transition')
      || (event.type === 'narrative' && event.target === 'suspected-amniotic-fluid-embolism-pattern-transition')
      || (event.type === 'narrative' && event.target === 'maternal-cardiac-arrest-coordinated-response-transition')
      || (event.type === 'narrative' && event.target === 'shoulder-dystocia-cognitive-sequence-transition')
      || (event.type === 'narrative' && event.target === 'umbilical-cord-prolapse-urgent-birth-coordination-transition')
      || (event.type === 'narrative' && event.target === 'suspected-uterine-rupture-recognition-transition')
      || (event.type === 'narrative' && event.target === 'magnesium-sulfate-toxicity-recognition-transition')
      || (event.type === 'narrative' && event.target === 'high-neuraxial-block-obstetric-coordination-transition')
      || (event.type === 'narrative' && event.target === 'failed-obstetric-intubation-oxygenation-first-transition')
      || (event.type === 'narrative' && event.target === 'maternal-to-neonatal-resuscitation-handoff-transition')
      || (event.type === 'narrative' && event.target === 'oxytocin-associated-uterine-tachysystole-transition')
      || (event.type === 'narrative' && event.target === 'term-newborn-transition')
      || (event.type === 'narrative' && event.target === 'neonatal-apnea-transition')
      || (event.type === 'narrative' && event.target === 'ineffective-ventilation-correction-transition')
      || (event.type === 'narrative' && event.target === 'neonatal-bradycardia-transition')
      || (event.type === 'narrative' && event.target === 'meconium-stained-transition')
      || (event.type === 'narrative' && event.target === 'preterm-respiratory-distress')
      || (event.type === 'narrative' && event.target === 'neonatal-hypoglycemia')
      || (event.type === 'narrative' && event.target === 'neonatal-sepsis')
      || (event.type === 'narrative' && event.target === 'thermoregulation-failure')
      || (event.type === 'narrative' && event.target === 'delivery-room-to-nicu-handoff')
      || (event.type === 'narrative' && event.target === 'neonatal-tension-pneumothorax')
      || (event.type === 'narrative' && event.target === 'dka-resolution-transition')
      || (event.type === 'narrative' && event.target === 'hhs-osmolality-trajectory')
      || (event.type === 'narrative' && event.target === 'severe-hypoglycemia-recurrence')
      || (event.type === 'narrative' && event.target === 'adrenal-crisis')
      || (event.type === 'narrative' && event.target === 'thyroid-storm')
      || (event.type === 'narrative' && event.target === 'myxedema')
      || (event.type === 'narrative' && event.target === 'hypercalcemia')
      || (event.type === 'narrative' && event.target === 'hypocalcemia')
      || (event.type === 'narrative' && event.target === 'hyponatremia-correction')
      || (event.type === 'narrative' && event.target === 'avp-deficiency')
      || (event.type === 'narrative' && event.target === 'refeeding')
      || (event.type === 'narrative' && event.target === 'perioperative-diabetes')
      || (event.type === 'narrative' && event.target === 'renal-hyperkalemia')
      || (event.type === 'narrative' && event.target === 'renal-hypokalemia')
      || (event.type === 'narrative' && event.target === 'renal-hyponatremia')
      || (event.type === 'narrative' && event.target === 'renal-hypernatremia')
      || (event.type === 'narrative' && event.target === 'renal-hypocalcemia')
      || (event.type === 'narrative' && event.target === 'renal-hypermagnesemia')
      || (event.type === 'narrative' && [
        'persistent-severe-preeclampsia', 'aspiration-risk-recognition',
        'emergence-residual-blockade', 'delayed-emergence-differential',
        'extubation-readiness', 'cied-cautery-planning', 'postoperative-handoff',
        'undifferentiated-shock',
      ].includes(event.target ?? '')))
    ? 'crisis' : 'syringes');
  const {
    hasAnaphylaxisResponse, hasHypermetabolicResponse, hasLastResponse,
    hasCardiacArrestResponse, hasHighSpinalResponse, hasVenousAirEmbolismResponse,
    hasBronchospasmResponse, hasPreeclampsiaResponse, hasPneumothoraxResponse,
    hasAspirationRiskResponse, hasEmergenceResidualBlockResponse, hasDelayedEmergenceResponse,
    hasExtubationReadinessResponse, hasCiedPlanningResponse, hasPostoperativeHandoffResponse,
    hasUndifferentiatedShockResponse, hasSepticShockResponse, hasHemorrhagicShockResponse,
    hasCardiacTamponadeResponse, hasEmergencyAnaphylaxisResponse, hasAdultAsthmaResponse,
    hasCopdExacerbationResponse, hasAutoPeepResponse, hasMucusPluggingResponse,
    hasUnplannedExtubationResponse,
    hasSpontaneousBreathingTrialResponse,
    hasPostIntubationHypotensionResponse,
    hasCardiogenicShockResponse,
    hasMixedShockResponse,
    hasRightVentricularFailureResponse,
    hasMassivePulmonaryEmbolismResponse,
    hasUpperGiHemorrhageResponse,
    hasCriticalCareStatusEpilepticusResponse,
    hasPostArrestTemperatureResponse,
    hasIntracranialHypertensionResponse,
    hasAkiFluidOverloadResponse,
    hasSevereAcidemiaResponse,
    hasIcuHiddenDeteriorationHandoffResponse,
    hasVentilatorCircuitDisconnectionResponse,
    hasDelayedVasopressorDeliveryResponse,
    hasPulseOximeterArtifactResponse,
    hasEndotrachealTubeMigrationResponse,
    hasSepticShockResuscitationResponse,
    hasStableChestPainResponse,
    hasNstemiRiskResponse,
    hasClinicStemiResponse,
    hasHeartFailureResponse,
    hasAfRvrResponse,
    hasPostInfarctionShockResponse,
    hasStableNarrowTachycardiaResponse,
    hasStableWideTachycardiaResponse,
    hasSymptomaticBradycardiaResponse,
    hasCompleteHeartBlockResponse,
    hasTorsadesResponse,
    hasHyperkalemicConductionResponse,
    hasPericardialTamponadeResponse,
    hasRightVentricularInfarctionResponse,
    hasHypertensiveEmergencyResponse,
    hasPacemakerCaptureFailureResponse,
    hasTranscutaneousPacingCaptureResponse,
    hasAcuteSevereAsthmaResponse,
    hasCopdTransitionResponse, hasCapHypoxemiaResponse, hasPostPeDyspneaResponse,
    hasApeSupportResponse, hasPostTensionPneumothoraxResponse, hasLargePleuralEffusionResponse,
    hasBronchiectasisMucusPluggingResponse, hasChronicOpioidHypoventilationResponse,
    hasNeuromuscularRespiratoryFailureResponse, hasObesityHypoventilationResponse,
    hasNoninvasiveVentilationSelectionResponse, hasHighFlowOxygenEscalationResponse,
    hasOxygenDeviceFailureResponse, hasAcuteTracheostomyObstructionResponse,
    hasPediatricRespiratoryDistressResponse, hasBronchiolitisResponse, hasCroupResponse,
    hasPediatricStatusAsthmaticusResponse, hasPediatricSepsisResponse,
    hasPediatricSepticShockResponse,
    hasPediatricDehydrationResponse,
    hasPediatricDiabeticKetoacidosisResponse,
    hasPediatricHypoglycemicSeizureResponse,
    hasPediatricFebrileSeizureResponse,
    hasPediatricStatusEpilepticusResponse,
    hasPediatricAnaphylaxisResponse,
    hasPediatricSupraventricularTachycardiaResponse,
    hasPediatricBradycardicArrestResponse,
    hasPediatricForeignBodyAirwayObstructionResponse,
    hasPediatricInjurySafeguardingResponse,
    hasNeurologyMinorStrokeResponse,
    hasNeurologyBasilarLvoResponse,
    hasNeurologyCerebellarIchResponse,
    hasNeurologyAsahDeteriorationResponse,
    hasNeurologyFocalMotorStatusResponse,
    hasNeurologyNcseResponse,
    hasNeurologyMyasthenicCrisisResponse,
    hasNeurologyGbsResponse,
    hasNeurologyMeningitisResponse,
    hasNeurologyEncephalitisResponse,
    hasNeurologyRaisedIcpResponse,
    hasNeurologyHerniationResponse,
    hasNeurologyMsccResponse,
    hasNeurologyDeliriumResponse,
    hasNeurologyAutonomicDysreflexiaResponse,
    hasToxicologyMethemoglobinemiaResponse,
    hasToxicologyCarbonMonoxideResponse,
    hasToxicologyAcetaminophenResponse,
    hasToxicologySalicylateResponse,
    hasToxicologyTricyclicResponse,
    hasToxicologyBetaBlockerResponse,
    hasToxicologyCalciumChannelBlockerResponse,
    hasToxicologyDigoxinResponse,
    hasToxicologyCholinergicResponse,
    hasToxicologyAnticholinergicResponse,
    hasToxicologySerotoninResponse,
    hasToxicologySympathomimeticResponse,
    hasToxicologyMethanolResponse,
    hasToxicologyDelayedLastResponse,
    hasToxicologyOpioidXylazineResponse,
    hasObstetricsMaternalArrestResponse,
    hasObstetricsShoulderDystociaResponse,
    hasObstetricsCordProlapseResponse,
    hasObstetricsUterineRuptureResponse,
    hasObstetricsMagnesiumToxicityResponse,
    hasObstetricsHighNeuraxialResponse,
    hasObstetricsFailedIntubationResponse,
    hasObstetricsMaternalNeonatalHandoffResponse,
    hasObstetricsOxytocinTachysystoleResponse,
    hasNeonatologyTermTransitionResponse,
    hasNeonatologyApneaResponse,
    hasNeonatologyIneffectiveVentilationResponse,
    hasNeonatologyBradycardiaResponse,
    hasNeonatologyMeconiumTransitionResponse,
    hasNeonatologyPretermRespiratoryDistressResponse,
    hasNeonatologyHypoglycemiaResponse,
    hasNeonatologySepsisResponse,
    hasNeonatologyThermoregulationResponse,
    hasNeonatologyNicuHandoffResponse,
    hasNeonatologyTensionPneumothoraxResponse,
    hasEndocrineDkaResolutionResponse,
    hasEndocrineHhsResponse,
    hasObstetricsAfeResponse,
    hasObstetricsAtonyResponse,
    hasObstetricsConcealedAbruptionResponse,
    hasObstetricsEclampsiaResponse,
    hasObstetricsMaternalSepsisResponse,
    hasObstetricsPostpartumPreeclampsiaResponse,
    hasSevereHypoglycemiaResponse,
    hasAdrenalCrisisResponse,
    hasThyroidStormResponse, hasMyxedemaResponse, hasHypercalcemiaResponse, hasHypocalcemiaResponse, hasHyponatremiaCorrectionResponse, hasAvpDeficiencyResponse, hasRefeedingResponse, hasPerioperativeDiabetesResponse, hasRenalHyperkalemiaResponse, hasRenalHypokalemiaResponse, hasRenalHyponatremiaResponse, hasRenalHypernatremiaResponse, hasRenalHypocalcemiaResponse, hasRenalHypermagnesemiaResponse, hasMeningococcalSepsisResponse, hasObstructedKidneyResponse, hasFebrileNeutropeniaResponse, hasNecrotizingInfectionResponse, hasEndocarditisHeartFailureResponse, hasSeverePneumoniaResponse, hasToxicShockResponse, hasPossibleSepsisResponse, hasSepticShockLabelResponse, hasMeningitisImagingResponse, hasLowScoreResponse, hasCountedRateResponse, hasPairedReadingResponse, hasAfferentLimbResponse, hasQuietPatientResponse, hasProxyScaleResponse, hasLastKnownWellResponse, hasOxygenTargetScaleResponse, hasLostContingencyResponse, hasDelayedImmuneEventResponse, hasIncidentalClotResponse, hasNormalTestToxicityResponse, hasPrognosisQuestionResponse, hasLaboratoryTlsResponse, hasRareEarlyMyocarditisResponse, hasLoweringTheCountResponse, hasInheritedUrgencyResponse, hasTrialRuleResponse, hasSilentInteractionResponse, hasEasyLabelResponse, hasNegativeScanResponse, hasRisingRequirementResponse, hasUnfinishedSurveyResponse, hasTransientResponseResponse, hasQuietChestResponse, hasUnownedDelayResponse, hasThirdAttendanceResponse, hasDeferredStepResponse, hasKnownLabelResponse, hasUnspokenDoubtResponse,
    hasAcutePulmonaryEdemaResponse, hasPulmonaryEmbolismResponse, hasStemiResponse,
    hasUnstableNarrowTachycardiaResponse,
    hasUnstableBradycardiaResponse,
    hasStatusEpilepticusResponse,
    hasAcuteIschemicStrokeResponse,
    hasIntracranialHemorrhageResponse,
    hasDiabeticKetoacidosisResponse,
    hasHyperkalemiaResponse,
    hasSevereHyponatremiaResponse,
    hasOpioidToxicityResponse,
    hasHeatStrokeResponse,
    hasTraumaPrimarySurveyResponse,
    hasAcuteAorticSyndromeResponse,
    hasArdsLungProtectiveResponse,
    hasEscalatingHypoxemiaResponse,
    hasVentilatorDyssynchronyResponse,
  } = crisisResponseAvailability(props.scenario, props.injectedCrisisIds, props.lessonTrays ?? []);
  // The same lookup the gates above used, for the one block that renders it.
  const moduleTray = props.lessonTrays?.find((tray) => tray.supports(props.scenario));
  const hasDifficultAirwayResponse = props.scenario.timeline.some(
    (event) => event.type === 'difficult-airway',
  );
  const hasUpperAirwayObstructionResponse = props.scenario.timeline.some(
    (event) => event.type === 'upper-airway-obstruction',
  );
  const hasOpioidVentilatoryResponse = props.scenario.timeline.some(
    (event) => event.type === 'opioid-ventilatory-impairment',
  );
  const hasThermalResponse = props.scenario.timeline.some(
    (event) => event.type === 'perioperative-hypothermia',
  );
  const hasGlycemicResponse = props.scenario.timeline.some(
    (event) => event.type === 'perioperative-hyperglycemia',
  );
  const focusedPleuralEmergency = hasPneumothoraxResponse && props.scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'obstructive-shock-tension-pneumothorax',
  );
  const hasEpinephrineResponse = (hasAnaphylaxisResponse && !hasEmergencyAnaphylaxisResponse)
    || hasLastResponse;
  const hasNonMaternalCrisisResponse = hasEpinephrineResponse || hasHypermetabolicResponse
    || hasCardiacArrestResponse || hasHighSpinalResponse || hasVenousAirEmbolismResponse
    || hasPneumothoraxResponse || hasBronchospasmResponse || hasStatusEpilepticusResponse
    || hasAcuteIschemicStrokeResponse || hasIntracranialHemorrhageResponse
    || hasDiabeticKetoacidosisResponse || hasHyperkalemiaResponse
    || hasSevereHyponatremiaResponse || hasOpioidToxicityResponse || hasHeatStrokeResponse
    || hasTraumaPrimarySurveyResponse || hasAcuteAorticSyndromeResponse || hasArdsLungProtectiveResponse
    || hasEscalatingHypoxemiaResponse || hasVentilatorDyssynchronyResponse || hasAutoPeepResponse
    || hasMucusPluggingResponse || hasUnplannedExtubationResponse
    || hasSpontaneousBreathingTrialResponse || hasPostIntubationHypotensionResponse
    || hasCardiogenicShockResponse || hasMixedShockResponse || hasRightVentricularFailureResponse
    || hasMassivePulmonaryEmbolismResponse || hasUpperGiHemorrhageResponse
    || hasCriticalCareStatusEpilepticusResponse || hasPostArrestTemperatureResponse
    || hasIntracranialHypertensionResponse || hasAkiFluidOverloadResponse
    || hasSevereAcidemiaResponse || hasIcuHiddenDeteriorationHandoffResponse
    || hasVentilatorCircuitDisconnectionResponse || hasDelayedVasopressorDeliveryResponse
    || hasPulseOximeterArtifactResponse || hasEndotrachealTubeMigrationResponse
    || hasSepticShockResuscitationResponse;
  const hasAnyNonAcuteAssessment = hasStableChestPainResponse || hasNstemiRiskResponse
    || hasClinicStemiResponse
    || hasHeartFailureResponse || hasAfRvrResponse || hasPostInfarctionShockResponse
    || hasStableNarrowTachycardiaResponse || hasStableWideTachycardiaResponse
    || hasSymptomaticBradycardiaResponse || hasCompleteHeartBlockResponse || hasTorsadesResponse
    || hasHyperkalemicConductionResponse || hasPericardialTamponadeResponse
    || hasRightVentricularInfarctionResponse || hasHypertensiveEmergencyResponse
    || hasPacemakerCaptureFailureResponse || hasTranscutaneousPacingCaptureResponse
    || hasAcuteSevereAsthmaResponse || hasCopdTransitionResponse || hasCapHypoxemiaResponse
    || hasPostPeDyspneaResponse || hasApeSupportResponse || hasPostTensionPneumothoraxResponse
    || hasLargePleuralEffusionResponse || hasBronchiectasisMucusPluggingResponse
    || hasChronicOpioidHypoventilationResponse || hasNeuromuscularRespiratoryFailureResponse
    || hasObesityHypoventilationResponse || hasNoninvasiveVentilationSelectionResponse
    || hasHighFlowOxygenEscalationResponse || hasOxygenDeviceFailureResponse
    || hasAcuteTracheostomyObstructionResponse || hasPediatricRespiratoryDistressResponse
    || hasBronchiolitisResponse || hasCroupResponse || hasPediatricStatusAsthmaticusResponse
    || hasPediatricSepsisResponse || hasPediatricSepticShockResponse
    || hasPediatricDehydrationResponse || hasPediatricDiabeticKetoacidosisResponse
    || hasPediatricHypoglycemicSeizureResponse || hasPediatricFebrileSeizureResponse
    || hasPediatricStatusEpilepticusResponse || hasPediatricAnaphylaxisResponse
    || hasPediatricSupraventricularTachycardiaResponse || hasPediatricBradycardicArrestResponse
    || hasPediatricForeignBodyAirwayObstructionResponse || hasPediatricInjurySafeguardingResponse
    || hasNeurologyMinorStrokeResponse || hasNeurologyBasilarLvoResponse
    || hasNeurologyCerebellarIchResponse || hasNeurologyAsahDeteriorationResponse
    || hasNeurologyFocalMotorStatusResponse || hasNeurologyNcseResponse
    || hasNeurologyMyasthenicCrisisResponse || hasNeurologyGbsResponse
    || hasNeurologyMeningitisResponse || hasNeurologyEncephalitisResponse
    || hasNeurologyRaisedIcpResponse || hasNeurologyHerniationResponse || hasNeurologyMsccResponse
    || hasNeurologyDeliriumResponse || hasNeurologyAutonomicDysreflexiaResponse;
  const focusedArrestScenario = props.scenario.formulary.length === 0
    && props.scenario.timeline.some((event) => event.type === 'rhythm-change'
      && ['ventricular-fibrillation', 'pea'].includes(event.target ?? ''));
  const focusedPeaScenario = props.scenario.formulary.length === 0
    && props.scenario.timeline.some((event) => event.type === 'rhythm-change'
      && event.target === 'pea');
  const focusedVfScenario = props.scenario.formulary.length === 0
    && props.scenario.timeline.some((event) => event.type === 'rhythm-change'
      && event.target === 'ventricular-fibrillation');
  const hasCrisisResponse = hasNonMaternalCrisisResponse || hasPreeclampsiaResponse
    || hasAspirationRiskResponse || hasEmergenceResidualBlockResponse
    || hasDelayedEmergenceResponse || hasExtubationReadinessResponse || hasCiedPlanningResponse
    || hasPostoperativeHandoffResponse || hasUndifferentiatedShockResponse
    || hasSepticShockResponse || hasHemorrhagicShockResponse || hasCardiacTamponadeResponse
    || hasEmergencyAnaphylaxisResponse || hasAdultAsthmaResponse || hasCopdExacerbationResponse
    || hasAcutePulmonaryEdemaResponse || hasPulmonaryEmbolismResponse || hasStemiResponse
    || hasUnstableNarrowTachycardiaResponse || hasUnstableBradycardiaResponse
    || hasStatusEpilepticusResponse || hasAcuteIschemicStrokeResponse
    || hasIntracranialHemorrhageResponse || hasDiabeticKetoacidosisResponse
    || hasHyperkalemiaResponse || hasSevereHyponatremiaResponse || hasOpioidToxicityResponse
    || hasHeatStrokeResponse || hasTraumaPrimarySurveyResponse || hasAcuteAorticSyndromeResponse
    || hasArdsLungProtectiveResponse || hasEscalatingHypoxemiaResponse
    || hasVentilatorDyssynchronyResponse || hasAutoPeepResponse || hasMucusPluggingResponse
    || hasUnplannedExtubationResponse || hasSpontaneousBreathingTrialResponse
    || hasPostIntubationHypotensionResponse || hasCardiogenicShockResponse
    || hasMixedShockResponse || hasRightVentricularFailureResponse
    || hasMassivePulmonaryEmbolismResponse || hasUpperGiHemorrhageResponse
    || hasCriticalCareStatusEpilepticusResponse || hasPostArrestTemperatureResponse
    || hasIntracranialHypertensionResponse || hasAkiFluidOverloadResponse
    || hasSevereAcidemiaResponse || hasIcuHiddenDeteriorationHandoffResponse
    || hasVentilatorCircuitDisconnectionResponse || hasDelayedVasopressorDeliveryResponse
    || hasPulseOximeterArtifactResponse || hasEndotrachealTubeMigrationResponse
    || hasSepticShockResuscitationResponse || hasToxicologyMethemoglobinemiaResponse
    || hasToxicologyCarbonMonoxideResponse
    || hasToxicologyAcetaminophenResponse
    || hasToxicologySalicylateResponse
    || hasToxicologyTricyclicResponse
    || hasToxicologyBetaBlockerResponse
    || hasToxicologyCalciumChannelBlockerResponse
    || hasToxicologyDigoxinResponse
    || hasToxicologyCholinergicResponse
    || hasToxicologyAnticholinergicResponse
    || hasToxicologySerotoninResponse
    || hasToxicologySympathomimeticResponse
    || hasToxicologyMethanolResponse
    || hasToxicologyDelayedLastResponse
    || hasToxicologyOpioidXylazineResponse
    || hasObstetricsMaternalArrestResponse
    || hasObstetricsShoulderDystociaResponse
    || hasObstetricsCordProlapseResponse
    || hasObstetricsUterineRuptureResponse
    || hasObstetricsMagnesiumToxicityResponse
    || hasObstetricsHighNeuraxialResponse
    || hasObstetricsFailedIntubationResponse
    || hasObstetricsMaternalNeonatalHandoffResponse
    || hasObstetricsOxytocinTachysystoleResponse
    || hasNeonatologyTermTransitionResponse
    || hasNeonatologyApneaResponse
    || hasNeonatologyIneffectiveVentilationResponse
    || hasNeonatologyBradycardiaResponse
    || hasNeonatologyMeconiumTransitionResponse
    || hasNeonatologyPretermRespiratoryDistressResponse
    || hasNeonatologyHypoglycemiaResponse
    || hasNeonatologySepsisResponse
    || hasNeonatologyThermoregulationResponse
    || hasNeonatologyNicuHandoffResponse
    || hasNeonatologyTensionPneumothoraxResponse
    || hasEndocrineDkaResolutionResponse
    || hasEndocrineHhsResponse
    || hasSevereHypoglycemiaResponse
    || hasObstetricsAfeResponse
    || hasObstetricsAtonyResponse
    || hasObstetricsConcealedAbruptionResponse
    || hasObstetricsEclampsiaResponse
    || hasObstetricsMaternalSepsisResponse
    || hasObstetricsPostpartumPreeclampsiaResponse
    || hasAdrenalCrisisResponse
    || hasThyroidStormResponse
    || hasMyxedemaResponse
    || hasHypercalcemiaResponse
    || hasHypocalcemiaResponse
    || hasHyponatremiaCorrectionResponse
    || hasAvpDeficiencyResponse
    || hasRefeedingResponse
    || hasPerioperativeDiabetesResponse
    || hasRenalHyperkalemiaResponse
    || hasRenalHypokalemiaResponse
    || hasRenalHyponatremiaResponse
    || hasRenalHypernatremiaResponse
    || hasRenalHypocalcemiaResponse
    || hasRenalHypermagnesemiaResponse
    || hasMeningococcalSepsisResponse
    || hasObstructedKidneyResponse
    || hasFebrileNeutropeniaResponse
    || hasNecrotizingInfectionResponse
    || hasEndocarditisHeartFailureResponse
    || hasSeverePneumoniaResponse
    || hasToxicShockResponse
    || hasPossibleSepsisResponse
    || hasSepticShockLabelResponse
    || hasMeningitisImagingResponse
    || hasLowScoreResponse
    || hasCountedRateResponse
    || hasPairedReadingResponse
    || hasAfferentLimbResponse
    || hasQuietPatientResponse
    || hasProxyScaleResponse
    || hasLastKnownWellResponse
    || hasOxygenTargetScaleResponse
    || hasLostContingencyResponse
    || hasDelayedImmuneEventResponse
    || hasIncidentalClotResponse
    || hasNormalTestToxicityResponse
    || hasPrognosisQuestionResponse
    || hasLaboratoryTlsResponse
    || hasRareEarlyMyocarditisResponse
    || hasLoweringTheCountResponse
    || hasInheritedUrgencyResponse
    || hasTrialRuleResponse
    || hasSilentInteractionResponse
    || hasEasyLabelResponse
    || hasNegativeScanResponse
    || hasRisingRequirementResponse
    || hasUnfinishedSurveyResponse
    || hasTransientResponseResponse
    || hasQuietChestResponse
    || hasUnownedDelayResponse
    || hasThirdAttendanceResponse
    || hasDeferredStepResponse
    || hasKnownLabelResponse
    || hasUnspokenDoubtResponse
    || hasAnyNonAcuteAssessment;
  const responseTray = hasUnspokenDoubtResponse
    ? { id: 'crisis', label: 'State + say + hand over' } as const
    : hasKnownLabelResponse
    ? { id: 'crisis', label: 'Record + ask + hand over' } as const
    : hasDeferredStepResponse
    ? { id: 'crisis', label: 'Record + ask + hand over' } as const
    : hasThirdAttendanceResponse
    ? { id: 'crisis', label: 'Record + ask + hand over' } as const
    : hasUnownedDelayResponse
    ? { id: 'crisis', label: 'Record + ask + hand over' } as const
    : hasQuietChestResponse
    ? { id: 'crisis', label: 'Record + ask + hand over' } as const
    : hasTransientResponseResponse
    ? { id: 'crisis', label: 'Record + call + hand over' } as const
    : hasUnfinishedSurveyResponse
    ? { id: 'crisis', label: 'Record + ask + hand over' } as const
    : hasRisingRequirementResponse
    || hasNegativeScanResponse
    || hasEasyLabelResponse
    || hasSilentInteractionResponse
    || hasTrialRuleResponse
    || hasInheritedUrgencyResponse
    || hasLoweringTheCountResponse
    ? { id: 'crisis', label: 'Recognise + call + hand over' } as const
    : hasRareEarlyMyocarditisResponse
    ? { id: 'crisis', label: 'Record + watch + hand over' } as const
    : hasLaboratoryTlsResponse
    ? { id: 'crisis', label: 'Name + report + hand over' } as const
    : hasPrognosisQuestionResponse
    ? { id: 'crisis', label: 'Ask + answer + hand over' } as const
    : hasNormalTestToxicityResponse
    ? { id: 'crisis', label: 'Stop + record + hand over' } as const
    : hasIncidentalClotResponse
    ? { id: 'crisis', label: 'Record + weigh + hand over' } as const
    : hasDelayedImmuneEventResponse
    ? { id: 'crisis', label: 'Record + escalate + hand over' } as const
    : hasLostContingencyResponse
    ? { id: 'crisis', label: 'Compare + recover + say it' } as const
    : hasOxygenTargetScaleResponse
    ? { id: 'crisis', label: 'Read + rescore + hand over' } as const
    : hasLastKnownWellResponse
    ? { id: 'crisis', label: 'Bound + activate + hand over' } as const
    : hasProxyScaleResponse
    ? { id: 'crisis', label: 'Ask + observe + record' } as const
    : hasQuietPatientResponse
    ? { id: 'crisis', label: 'Review + screen + escalate' } as const
    : hasAfferentLimbResponse
    ? { id: 'crisis', label: 'Record + call + hand over' } as const
    : hasPairedReadingResponse
    ? { id: 'crisis', label: 'Record + pair + escalate' } as const
    : hasCountedRateResponse
    ? { id: 'crisis', label: 'Read + count + escalate' } as const
    : hasLowScoreResponse
    ? { id: 'crisis', label: 'Record + escalate + hand over' } as const
    : hasMeningitisImagingResponse
    ? { id: 'crisis', label: 'Record + compare + decide' } as const
    : hasSepticShockLabelResponse
    ? { id: 'crisis', label: 'Measure + activate + decide the label' } as const
    : hasPossibleSepsisResponse
    ? { id: 'crisis', label: 'Start the clock + assess + decide' } as const
    : hasToxicShockResponse
    ? { id: 'crisis', label: 'Recognize + activate + record' } as const
    : hasSeverePneumoniaResponse
    ? { id: 'crisis', label: 'Reconcile + escalate + reassess' } as const
    : hasEndocarditisHeartFailureResponse
    ? { id: 'crisis', label: 'Recognize + refer + reassess' } as const
    : hasNecrotizingInfectionResponse
    ? { id: 'crisis', label: 'Recognize + mark + escalate' } as const
    : hasFebrileNeutropeniaResponse
    ? { id: 'crisis', label: 'Recognize + activate + treat' } as const
    : hasObstructedKidneyResponse
    ? { id: 'crisis', label: 'Recognize + drain + reassess' } as const
    : hasMeningococcalSepsisResponse
    ? { id: 'crisis', label: 'Recognize + activate + reassess' } as const
    : hasRenalHypermagnesemiaResponse
    ? { id: 'crisis', label: 'Support + counter + remove' } as const
    : hasRenalHypocalcemiaResponse
    ? { id: 'crisis', label: 'Measure + treat + sustain' } as const
    : hasRenalHypernatremiaResponse
    ? { id: 'crisis', label: 'Circulation + water + access' } as const
    : hasRenalHyponatremiaResponse
    ? { id: 'crisis', label: 'Symptoms + sodium + reassessment' } as const
    : hasRenalHypokalemiaResponse
    ? { id: 'crisis', label: 'Replace + reassess + sustain' } as const
    : hasRenalHyperkalemiaResponse
    ? { id: 'crisis', label: 'Protect + shift + remove' } as const
    : hasPerioperativeDiabetesResponse
    ? { id: 'crisis', label: 'Insulin + perioperative care' } as const
    : hasRefeedingResponse
    ? { id: 'crisis', label: 'Electrolytes + nutrition' } as const
    : hasAvpDeficiencyResponse
    ? { id: 'crisis', label: 'Circulation + water balance' } as const
    : hasHyponatremiaCorrectionResponse
    ? { id: 'crisis', label: 'Correction + surveillance' } as const
    : hasHypocalcemiaResponse
    ? { id: 'crisis', label: 'Rescue + continuing care' } as const
    : hasHypercalcemiaResponse
    ? { id: 'crisis', label: 'Volume + calcium' } as const
    : hasMyxedemaResponse
    ? { id: 'crisis', label: 'Breathing + treatment' } as const
    : hasThyroidStormResponse
    ? { id: 'crisis', label: 'Treatment + circulation' } as const
    : hasAdrenalCrisisResponse
    ? { id: 'crisis', label: 'Rescue + continuity' } as const
    : hasSevereHypoglycemiaResponse
    ? { id: 'crisis', label: 'Rescue + recurrence' } as const
    : hasEndocrineHhsResponse
    ? { id: 'crisis', label: 'Osmolality + whole person' } as const
    : hasEndocrineDkaResolutionResponse
    ? { id: 'crisis', label: 'Resolution + continuity' } as const
    : hasNeonatologyTensionPneumothoraxResponse
    ? { id: 'crisis', label: 'Asymmetry + collapse' } as const
    : hasNeonatologyNicuHandoffResponse
    ? { id: 'crisis', label: 'Story + ownership' } as const
    : hasNeonatologyThermoregulationResponse
    ? { id: 'crisis', label: 'Warmth + trajectory' } as const
    : hasNeonatologySepsisResponse
    ? { id: 'crisis', label: 'Infection + trajectory' } as const
    : hasNeonatologyHypoglycemiaResponse
    ? { id: 'crisis', label: 'Glucose + trajectory' } as const
    : hasNeonatologyPretermRespiratoryDistressResponse
    ? { id: 'crisis', label: 'Breathing + warmth' } as const
    : hasNeonatologyMeconiumTransitionResponse
    ? { id: 'crisis', label: 'Transition + observation' } as const
    : hasNeonatologyBradycardiaResponse
    ? { id: 'crisis', label: 'Heart rate + response' } as const
    : hasNeonatologyIneffectiveVentilationResponse
    ? { id: 'crisis', label: 'Response + heart rate' } as const
    : hasNeonatologyApneaResponse
    ? { id: 'crisis', label: 'Breathing + heart rate' } as const
    : hasNeonatologyTermTransitionResponse
    ? { id: 'crisis', label: 'Transition + dyad' } as const
    : hasObstetricsOxytocinTachysystoleResponse
    ? { id: 'crisis', label: 'Contractions + fetus' } as const
    : hasObstetricsMaternalNeonatalHandoffResponse
    ? { id: 'crisis', label: 'Two-patient handoff' } as const
    : hasObstetricsFailedIntubationResponse
    ? { id: 'crisis', label: 'Oxygenation + decision' } as const
    : hasObstetricsHighNeuraxialResponse
    ? { id: 'crisis', label: 'Block + breathing' } as const
    : hasObstetricsMagnesiumToxicityResponse
    ? { id: 'crisis', label: 'Breathing + clearance' } as const
    : hasObstetricsUterineRuptureResponse
    ? { id: 'crisis', label: 'Pattern + surgery' } as const
    : hasObstetricsCordProlapseResponse
    ? { id: 'crisis', label: 'Protect + prepare' } as const
    : hasObstetricsShoulderDystociaResponse
    ? { id: 'crisis', label: 'Birth + sequence' } as const
    : hasObstetricsMaternalArrestResponse
    ? { id: 'crisis', label: 'Arrest + pregnancy' } as const
    : hasObstetricsAfeResponse
    ? { id: 'crisis', label: 'Breathing + circulation' } as const
    : hasObstetricsEclampsiaResponse
    ? { id: 'crisis', label: 'Seizure + pregnancy' } as const
    : hasObstetricsPostpartumPreeclampsiaResponse
    ? { id: 'crisis', label: 'Pressure + whole person' } as const
    : hasObstetricsConcealedAbruptionResponse
    ? { id: 'crisis', label: 'Hidden blood + fetus' } as const
    : hasObstetricsMaternalSepsisResponse
    ? { id: 'crisis', label: 'Infection + organs' } as const
    : hasObstetricsAtonyResponse
    ? { id: 'crisis', label: 'Bleeding + tone' } as const
    : hasToxicologyOpioidXylazineResponse
    ? { id: 'crisis', label: 'Breathing + sedation' } as const
    : hasToxicologyDelayedLastResponse
    ? { id: 'crisis', label: 'Delayed LAST' } as const
    : hasToxicologyMethanolResponse
    ? { id: 'crisis', label: 'Methanol clues' } as const
    : hasToxicologySympathomimeticResponse
    ? { id: 'crisis', label: 'Stimulant surge' } as const
    : hasToxicologySerotoninResponse
    ? { id: 'crisis', label: 'Serotonin heat' } as const
    : hasToxicologyAnticholinergicResponse
    ? { id: 'crisis', label: 'Anticholinergic heat' } as const
    : hasToxicologyCholinergicResponse
    ? { id: 'crisis', label: 'Cholinergic crisis' } as const
    : hasToxicologyDigoxinResponse
    ? { id: 'crisis', label: 'Digoxin pattern' } as const
    : hasToxicologyCalciumChannelBlockerResponse
    ? { id: 'crisis', label: 'CCB shock' } as const
    : hasToxicologyBetaBlockerResponse
    ? { id: 'crisis', label: 'Beta-blocker shock' } as const
    : hasToxicologyTricyclicResponse
    ? { id: 'crisis', label: 'Electrical toxicity' } as const
    : hasToxicologySalicylateResponse
    ? { id: 'crisis', label: 'Salicylate trajectory' } as const
    : hasToxicologyAcetaminophenResponse
    ? { id: 'crisis', label: 'Acetaminophen clock' } as const
    : hasToxicologyCarbonMonoxideResponse
    ? { id: 'crisis', label: 'Hidden carbon monoxide' } as const
    : hasToxicologyMethemoglobinemiaResponse
    ? { id: 'crisis', label: 'Dyshemoglobin pattern' } as const
    : hasNeurologyAutonomicDysreflexiaResponse
    ? { id: 'crisis', label: 'Autonomic dysreflexia' } as const
    : hasNeurologyDeliriumResponse
    ? { id: 'crisis', label: 'Acute delirium' } as const
    : hasNeurologyMsccResponse
    ? { id: 'crisis', label: 'Cord compression' } as const
    : hasNeurologyHerniationResponse
    ? { id: 'crisis', label: 'Acute brain rescue' } as const
    : hasNeurologyRaisedIcpResponse
    ? { id: 'crisis', label: 'Raised pressure + vision' } as const
    : hasNeurologyEncephalitisResponse
    ? { id: 'crisis', label: 'Encephalitis reassessment' } as const
    : hasNeurologyMeningitisResponse
    ? { id: 'crisis', label: 'Meningitis first hour' } as const
    : hasNeurologyGbsResponse
    ? { id: 'crisis', label: 'Guillain-Barré respiratory decline' } as const
    : hasNeurologyMyasthenicCrisisResponse
    ? { id: 'crisis', label: 'Myasthenic crisis escalation' } as const
    : hasNeurologyNcseResponse
    ? { id: 'crisis', label: 'Nonconvulsive status recognition' } as const
    : hasNeurologyFocalMotorStatusResponse
    ? { id: 'crisis', label: 'Focal motor status reassessment' } as const
    : hasNeurologyAsahDeteriorationResponse
    ? { id: 'crisis', label: 'aSAH deterioration reassessment' } as const
    : hasNeurologyCerebellarIchResponse
    ? { id: 'crisis', label: 'Cerebellar ICH reassessment' } as const
    : hasNeurologyBasilarLvoResponse
    ? { id: 'crisis', label: 'Basilar LVO reassessment' } as const
    : hasNeurologyMinorStrokeResponse
    ? { id: 'crisis', label: 'Minor-stroke reassessment' } as const
    : hasPediatricInjurySafeguardingResponse
    ? { id: 'crisis', label: 'Pediatric safeguarding reassessment' } as const
    : hasPediatricForeignBodyAirwayObstructionResponse
    ? { id: 'crisis', label: 'Pediatric airway-obstruction reassessment' } as const
    : hasPediatricBradycardicArrestResponse
    ? { id: 'crisis', label: 'Pediatric bradycardic-arrest reassessment' } as const
    : hasPediatricSupraventricularTachycardiaResponse
    ? { id: 'crisis', label: 'Pediatric SVT reassessment' } as const
    : hasPediatricAnaphylaxisResponse
    ? { id: 'crisis', label: 'Pediatric anaphylaxis reassessment' } as const
    : hasPediatricStatusEpilepticusResponse
    ? { id: 'crisis', label: 'Pediatric status-epilepticus reassessment' } as const
    : hasPediatricFebrileSeizureResponse
    ? { id: 'crisis', label: 'Pediatric febrile-seizure reassessment' } as const
    : hasPediatricHypoglycemicSeizureResponse
    ? { id: 'crisis', label: 'Pediatric hypoglycemia reassessment' } as const
    : hasPediatricDiabeticKetoacidosisResponse
    ? { id: 'crisis', label: 'Pediatric DKA reassessment' } as const
    : hasPediatricDehydrationResponse
    ? { id: 'crisis', label: 'Pediatric dehydration reassessment' } as const
    : hasPediatricSepticShockResponse
    ? { id: 'crisis', label: 'Pediatric septic-shock reassessment' } as const
    : hasPediatricSepsisResponse
    ? { id: 'crisis', label: 'Pediatric sepsis reassessment' } as const
    : hasPediatricStatusAsthmaticusResponse
    ? { id: 'crisis', label: 'Severe-asthma reassessment' } as const
    : hasCroupResponse
    ? { id: 'crisis', label: 'Croup reassessment' } as const
    : hasBronchiolitisResponse
    ? { id: 'crisis', label: 'Bronchiolitis reassessment' } as const
    : hasPediatricRespiratoryDistressResponse
    ? { id: 'crisis', label: 'Whole-child reassessment' } as const
    : hasAcuteTracheostomyObstructionResponse
    ? { id: 'crisis', label: 'Tracheostomy airflow' } as const
    : hasOxygenDeviceFailureResponse
    ? { id: 'crisis', label: 'Portable oxygen path' } as const
    : hasHighFlowOxygenEscalationResponse
    ? { id: 'crisis', label: 'High-flow escalation' } as const
    : hasNoninvasiveVentilationSelectionResponse
    ? { id: 'crisis', label: 'NIV selection' } as const
    : hasObesityHypoventilationResponse
    ? { id: 'crisis', label: 'Awake + sleep review' } as const
    : hasNeuromuscularRespiratoryFailureResponse
    ? { id: 'crisis', label: 'Muscle + breathing review' } as const
    : hasChronicOpioidHypoventilationResponse
    ? { id: 'crisis', label: 'Sleep + breathing review' } as const
    : hasBronchiectasisMucusPluggingResponse
    ? { id: 'crisis', label: 'Mucus + focal collapse' } as const
    : hasLargePleuralEffusionResponse
    ? { id: 'crisis', label: 'Pleural effusion review' } as const
    : hasPostTensionPneumothoraxResponse
    ? { id: 'crisis', label: 'Pleural recovery review' } as const
    : hasApeSupportResponse
    ? { id: 'crisis', label: 'Pulmonary edema reassessment' } as const
    : hasPostPeDyspneaResponse
    ? { id: 'crisis', label: 'Post-PE breathlessness' } as const
    : hasCapHypoxemiaResponse
    ? { id: 'crisis', label: 'Pneumonia + hypoxemia' } as const
    : hasCopdTransitionResponse
    ? { id: 'crisis', label: 'Recovery + readiness' } as const
    : hasAcuteSevereAsthmaResponse
    ? { id: 'crisis', label: 'Breathing-failure response' } as const
    : hasTranscutaneousPacingCaptureResponse
    ? { id: 'crisis', label: 'Electrical ≠ mechanical' } as const
    : hasPacemakerCaptureFailureResponse
    ? { id: 'crisis', label: 'Capture-failure response' } as const
    : hasHypertensiveEmergencyResponse
    ? { id: 'crisis', label: 'Pressure + organ review' } as const
    : hasRightVentricularInfarctionResponse
    ? { id: 'crisis', label: 'RV infarction review' } as const
    : hasPericardialTamponadeResponse
    ? { id: 'crisis', label: 'Tamponade reassessment' } as const
    : hasHyperkalemicConductionResponse
    ? { id: 'crisis', label: 'Potassium rhythm review' } as const
    : hasTorsadesResponse
    ? { id: 'crisis', label: 'Torsades response' } as const
    : hasCompleteHeartBlockResponse
    ? { id: 'crisis', label: 'Complete-block review' } as const
    : hasSymptomaticBradycardiaResponse
    ? { id: 'crisis', label: 'Slow-rhythm review' } as const
    : hasStableWideTachycardiaResponse
    ? { id: 'crisis', label: 'Wide-rhythm review' } as const
    : hasStableNarrowTachycardiaResponse
    ? { id: 'crisis', label: 'Stable rhythm review' } as const
    : hasPostInfarctionShockResponse
    ? { id: 'crisis', label: 'Shock escalation' } as const
    : hasClinicStemiResponse
    ? { id: 'crisis', label: 'STEMI first actions' } as const
    : hasAfRvrResponse
    ? { id: 'crisis', label: 'AF reassessment' } as const
    : hasHeartFailureResponse
    ? { id: 'crisis', label: 'Heart-failure review' } as const
    : hasNstemiRiskResponse
    ? { id: 'crisis', label: 'NSTEMI reassessment' } as const
    : hasStableChestPainResponse
    ? { id: 'crisis', label: 'Chest-pain evaluation' } as const
    : hasSepticShockResuscitationResponse
    ? { id: 'crisis', label: 'Septic resuscitation' } as const
    : hasEndotrachealTubeMigrationResponse
    ? { id: 'crisis', label: 'Tube position' } as const
    : hasPulseOximeterArtifactResponse
    ? { id: 'crisis', label: 'Pulse-ox signal' } as const
    : hasDelayedVasopressorDeliveryResponse
    ? { id: 'crisis', label: 'Vasopressor delivery' } as const
    : hasVentilatorCircuitDisconnectionResponse
    ? { id: 'crisis', label: 'Circuit disconnection' } as const
    : hasIcuHiddenDeteriorationHandoffResponse
    ? { id: 'crisis', label: 'ICU handoff' } as const
    : hasSevereAcidemiaResponse
    ? { id: 'crisis', label: 'Severe acidemia' } as const
    : hasAkiFluidOverloadResponse
    ? { id: 'crisis', label: 'AKI fluid balance' } as const
    : hasIntracranialHypertensionResponse
    ? { id: 'crisis', label: 'ICP crisis' } as const
    : hasPostArrestTemperatureResponse
    ? { id: 'crisis', label: 'Temperature control' } as const
    : hasCriticalCareStatusEpilepticusResponse
    ? { id: 'crisis', label: 'Refractory status' } as const
    : hasUpperGiHemorrhageResponse
    ? { id: 'crisis', label: 'Upper GI bleed' } as const
    : hasMassivePulmonaryEmbolismResponse
    ? { id: 'crisis', label: 'Massive PE' } as const
    : hasRightVentricularFailureResponse
    ? { id: 'crisis', label: 'RV failure' } as const
    : hasMixedShockResponse
    ? { id: 'crisis', label: 'Mixed shock' } as const
    : hasCardiogenicShockResponse
    ? { id: 'crisis', label: 'Cardiogenic shock' } as const
    : hasPostIntubationHypotensionResponse
    ? { id: 'crisis', label: 'Post-intubation pressure' } as const
    : hasSpontaneousBreathingTrialResponse
    ? { id: 'crisis', label: 'Breathing trial' } as const
    : hasUnplannedExtubationResponse
    ? { id: 'crisis', label: 'Unplanned extubation' } as const
    : hasMucusPluggingResponse
    ? { id: 'crisis', label: 'Mucus plugging' } as const
    : hasAutoPeepResponse
    ? { id: 'crisis', label: 'Auto-PEEP' } as const
    : hasVentilatorDyssynchronyResponse
    ? { id: 'crisis', label: 'Ventilator dyssynchrony' } as const
    : hasEscalatingHypoxemiaResponse
    ? { id: 'crisis', label: 'Escalating hypoxemia' } as const
    : hasArdsLungProtectiveResponse
    ? { id: 'crisis', label: 'ARDS ventilation' } as const
    : hasAcuteAorticSyndromeResponse
    ? { id: 'crisis', label: 'Acute aortic syndrome' } as const
    : hasTraumaPrimarySurveyResponse
    ? { id: 'crisis', label: 'Trauma primary survey' } as const
    : hasHeatStrokeResponse
    ? { id: 'crisis', label: 'Exertional heat stroke' } as const
    : hasOpioidToxicityResponse
    ? { id: 'crisis', label: 'Opioid toxicity' } as const
    : hasSevereHyponatremiaResponse
    ? { id: 'crisis', label: 'Severe hyponatremia' } as const
    : hasHyperkalemiaResponse
    ? { id: 'crisis', label: 'Severe hyperkalemia' } as const
    : hasDiabeticKetoacidosisResponse
    ? { id: 'crisis', label: 'DKA pathway' } as const
    : hasIntracranialHemorrhageResponse
    ? { id: 'crisis', label: 'ICH deterioration' } as const
    : hasAcuteIschemicStrokeResponse
    ? { id: 'crisis', label: 'Acute stroke' } as const
    : hasStatusEpilepticusResponse
    ? { id: 'crisis', label: 'Status epilepticus' } as const
    : focusedPeaScenario
    ? { id: 'crisis', label: 'PEA arrest' } as const
    : focusedArrestScenario
    ? { id: 'crisis', label: 'Persistent VF' } as const
    : hasUnstableBradycardiaResponse
    ? { id: 'crisis', label: 'Unstable bradycardia' } as const
    : hasUnstableNarrowTachycardiaResponse
    ? { id: 'crisis', label: 'Unstable tachycardia' } as const
    : hasStemiResponse
    ? { id: 'crisis', label: 'STEMI pathway' } as const
    : hasPulmonaryEmbolismResponse
    ? { id: 'crisis', label: 'PE deterioration' } as const
    : hasAcutePulmonaryEdemaResponse
    ? { id: 'crisis', label: 'Pulmonary edema' } as const
    : hasCopdExacerbationResponse
    ? { id: 'crisis', label: 'COPD response' } as const
    : hasAdultAsthmaResponse
    ? { id: 'crisis', label: 'Asthma response' } as const
    : hasEmergencyAnaphylaxisResponse
    ? { id: 'crisis', label: 'Anaphylaxis response' } as const
    : hasCardiacTamponadeResponse && !hasNonMaternalCrisisResponse
    ? { id: 'crisis', label: 'Tamponade response' } as const
    : focusedPleuralEmergency
    ? { id: 'crisis', label: 'Obstructive shock' } as const
    : hasHemorrhagicShockResponse && !hasNonMaternalCrisisResponse
    ? { id: 'crisis', label: 'Trauma hemorrhage' } as const
    : hasSepticShockResponse && !hasNonMaternalCrisisResponse
    ? { id: 'crisis', label: 'Sepsis response' } as const
    : hasUndifferentiatedShockResponse && !hasNonMaternalCrisisResponse
    ? { id: 'crisis', label: 'Shock assessment' } as const
    : hasPostoperativeHandoffResponse && !hasNonMaternalCrisisResponse
    ? { id: 'crisis', label: 'Handoff' } as const
    : hasCiedPlanningResponse && !hasNonMaternalCrisisResponse
    ? { id: 'crisis', label: 'Device plan' } as const
    : hasExtubationReadinessResponse && !hasNonMaternalCrisisResponse
    && !hasPreeclampsiaResponse && !hasAspirationRiskResponse
    && !hasEmergenceResidualBlockResponse && !hasDelayedEmergenceResponse
    ? { id: 'crisis', label: 'Extubation readiness' } as const
    : hasDelayedEmergenceResponse && !hasNonMaternalCrisisResponse
    && !hasPreeclampsiaResponse && !hasAspirationRiskResponse
    && !hasEmergenceResidualBlockResponse
    ? { id: 'crisis', label: 'Emergence differential' } as const
    : hasEmergenceResidualBlockResponse && !hasNonMaternalCrisisResponse
    && !hasPreeclampsiaResponse && !hasAspirationRiskResponse
    ? { id: 'crisis', label: 'Emergence check' } as const
    : hasAspirationRiskResponse && !hasNonMaternalCrisisResponse
    && !hasPreeclampsiaResponse
    ? { id: 'crisis', label: 'Aspiration check' } as const
    : hasPreeclampsiaResponse && !hasNonMaternalCrisisResponse
      ? { id: 'crisis', label: 'Maternal response' } as const : CRISIS_TRAY;
  const focusedEmergencyAssessment = props.scenario.formulary.length === 0
    && (focusedArrestScenario || focusedPleuralEmergency || hasStatusEpilepticusResponse
    || hasAcuteIschemicStrokeResponse
    || hasIntracranialHemorrhageResponse
    || hasDiabeticKetoacidosisResponse
    || hasHyperkalemiaResponse
    || hasSevereHyponatremiaResponse
    || hasOpioidToxicityResponse
    || hasHeatStrokeResponse
    || hasTraumaPrimarySurveyResponse
    || hasAcuteAorticSyndromeResponse
    || hasArdsLungProtectiveResponse
    || hasEscalatingHypoxemiaResponse
    || hasVentilatorDyssynchronyResponse
    || hasAutoPeepResponse
    || hasMucusPluggingResponse
    || hasUnplannedExtubationResponse
    || hasSpontaneousBreathingTrialResponse
    || hasPostIntubationHypotensionResponse
    || hasCardiogenicShockResponse
    || hasMixedShockResponse
    || hasRightVentricularFailureResponse
    || hasMassivePulmonaryEmbolismResponse
    || hasUpperGiHemorrhageResponse
    || hasCriticalCareStatusEpilepticusResponse
    || hasPostArrestTemperatureResponse
    || hasIntracranialHypertensionResponse
    || hasAkiFluidOverloadResponse
    || hasSevereAcidemiaResponse
    || hasIcuHiddenDeteriorationHandoffResponse
    || hasVentilatorCircuitDisconnectionResponse
    || hasDelayedVasopressorDeliveryResponse
    || hasPulseOximeterArtifactResponse
    || hasEndotrachealTubeMigrationResponse
    || hasSepticShockResuscitationResponse
    || hasStableChestPainResponse
    || hasNstemiRiskResponse
    || hasClinicStemiResponse
    || hasHeartFailureResponse
    || hasAfRvrResponse
    || hasPostInfarctionShockResponse
    || hasStableNarrowTachycardiaResponse
    || hasStableWideTachycardiaResponse
    || hasSymptomaticBradycardiaResponse
    || hasCompleteHeartBlockResponse
    || hasTorsadesResponse
    || hasHyperkalemicConductionResponse
    || hasPericardialTamponadeResponse
    || hasRightVentricularInfarctionResponse
    || hasHypertensiveEmergencyResponse
    || hasPacemakerCaptureFailureResponse
    || hasTranscutaneousPacingCaptureResponse
    || hasAcuteSevereAsthmaResponse
    || hasCopdTransitionResponse
    || hasCapHypoxemiaResponse
    || hasPostPeDyspneaResponse
    || hasApeSupportResponse
    || hasPostTensionPneumothoraxResponse
    || hasLargePleuralEffusionResponse
    || hasBronchiectasisMucusPluggingResponse
    || hasChronicOpioidHypoventilationResponse
    || hasNeuromuscularRespiratoryFailureResponse
    || hasObesityHypoventilationResponse
    || hasNoninvasiveVentilationSelectionResponse
    || hasHighFlowOxygenEscalationResponse
    || hasOxygenDeviceFailureResponse
    || hasAcuteTracheostomyObstructionResponse
    || hasPediatricRespiratoryDistressResponse
    || hasBronchiolitisResponse || hasCroupResponse || hasPediatricStatusAsthmaticusResponse
    || hasPediatricSepsisResponse || hasPediatricSepticShockResponse
    || hasPediatricDehydrationResponse || hasPediatricDiabeticKetoacidosisResponse
    || hasPediatricHypoglycemicSeizureResponse
    || hasPediatricFebrileSeizureResponse
    || hasPediatricStatusEpilepticusResponse
    || hasPediatricAnaphylaxisResponse
    || hasPediatricSupraventricularTachycardiaResponse
    || hasPediatricBradycardicArrestResponse
    || hasPediatricForeignBodyAirwayObstructionResponse
    || hasPediatricInjurySafeguardingResponse
    || hasNeurologyMinorStrokeResponse
    || hasNeurologyBasilarLvoResponse
    || hasNeurologyCerebellarIchResponse
    || hasNeurologyAsahDeteriorationResponse
    || hasNeurologyFocalMotorStatusResponse
    || hasNeurologyNcseResponse
    || hasNeurologyMyasthenicCrisisResponse
    || hasNeurologyGbsResponse
    || hasNeurologyMeningitisResponse
    || hasNeurologyEncephalitisResponse
    || hasNeurologyRaisedIcpResponse
    || hasNeurologyHerniationResponse
    || hasNeurologyMsccResponse
    || hasNeurologyDeliriumResponse
    || hasNeurologyAutonomicDysreflexiaResponse
    || hasObstetricsMaternalArrestResponse
    || hasObstetricsShoulderDystociaResponse
    || hasObstetricsCordProlapseResponse
    || hasObstetricsUterineRuptureResponse
    || hasObstetricsMagnesiumToxicityResponse
    || hasObstetricsHighNeuraxialResponse
    || hasObstetricsFailedIntubationResponse
    || hasObstetricsMaternalNeonatalHandoffResponse
    || hasObstetricsOxytocinTachysystoleResponse
    || hasNeonatologyTermTransitionResponse
    || hasNeonatologyApneaResponse
    || hasNeonatologyIneffectiveVentilationResponse
    || hasNeonatologyBradycardiaResponse
    || hasNeonatologyMeconiumTransitionResponse
    || hasNeonatologyPretermRespiratoryDistressResponse
    || hasNeonatologyHypoglycemiaResponse
    || hasNeonatologySepsisResponse
    || hasNeonatologyThermoregulationResponse
    || hasNeonatologyNicuHandoffResponse
    || hasNeonatologyTensionPneumothoraxResponse
    || hasEndocrineDkaResolutionResponse
    || hasEndocrineHhsResponse
    || hasSevereHypoglycemiaResponse
    || hasObstetricsAfeResponse
    || hasObstetricsAtonyResponse
    || hasObstetricsConcealedAbruptionResponse
    || hasObstetricsEclampsiaResponse
    || hasObstetricsMaternalSepsisResponse
    || hasObstetricsPostpartumPreeclampsiaResponse
    || hasAdrenalCrisisResponse
    || hasThyroidStormResponse
    || hasMyxedemaResponse
    || hasHypercalcemiaResponse
    || hasHypocalcemiaResponse
    || hasHyponatremiaCorrectionResponse
    || hasAvpDeficiencyResponse
    || hasRefeedingResponse
    || hasPerioperativeDiabetesResponse
    || hasRenalHyperkalemiaResponse
    || hasRenalHypokalemiaResponse
    || hasRenalHyponatremiaResponse
    || hasRenalHypernatremiaResponse
    || hasRenalHypocalcemiaResponse
    || hasRenalHypermagnesemiaResponse
    || hasMeningococcalSepsisResponse
    || hasObstructedKidneyResponse
    || hasFebrileNeutropeniaResponse
    || hasNecrotizingInfectionResponse
    || hasEndocarditisHeartFailureResponse
    || hasSeverePneumoniaResponse
    || hasToxicShockResponse
    || hasPossibleSepsisResponse
    || hasSepticShockLabelResponse
    || hasMeningitisImagingResponse
    || hasLowScoreResponse
    || hasCountedRateResponse
    || hasPairedReadingResponse
    || hasAfferentLimbResponse
    || hasQuietPatientResponse
    || hasProxyScaleResponse
    || hasLastKnownWellResponse
    || hasOxygenTargetScaleResponse
    || hasLostContingencyResponse
    || hasDelayedImmuneEventResponse
    || hasIncidentalClotResponse
    || hasNormalTestToxicityResponse
    || hasPrognosisQuestionResponse
    || hasLaboratoryTlsResponse
    || hasRareEarlyMyocarditisResponse
    || hasLoweringTheCountResponse
    || ((hasUndifferentiatedShockResponse || hasSepticShockResponse
      || hasHemorrhagicShockResponse || hasCardiacTamponadeResponse
      || hasEmergencyAnaphylaxisResponse || hasAdultAsthmaResponse
      || hasCopdExacerbationResponse || hasAcutePulmonaryEdemaResponse
      || hasPulmonaryEmbolismResponse || hasStemiResponse
      || hasUnstableNarrowTachycardiaResponse || hasUnstableBradycardiaResponse)
      && (!hasNonMaternalCrisisResponse || hasEmergencyAnaphylaxisResponse
        || hasAdultAsthmaResponse || hasCopdExacerbationResponse
        || hasAcutePulmonaryEdemaResponse || hasPulmonaryEmbolismResponse
        || hasStemiResponse || hasUnstableNarrowTachycardiaResponse
        || hasUnstableBradycardiaResponse)));
  const trays = hasCrisisResponse
    ? focusedEmergencyAssessment ? [responseTray]
      : props.scenario.formulary.length === 0 ? [responseTray, ...TRAYS] : [...TRAYS, responseTray]
    : TRAYS;
  const hasRocuronium = props.scenario.formulary.some((entry) => entry.drugId === 'rocuronium');
  const teachesNeuromuscularReversal = props.scenario.metadata.objectives.some((objective) => [
    'reverse-observed-block', 'reverse-recovering-block', 'confirm-quantitative-recovery',
  ].includes(objective.id));
  const hasArterialLineFault = props.scenario.timeline.some((event) => event.type === 'artifact'
    && ['arterial-damping', 'arterial-transducer-misleveled'].includes(event.target ?? ''));
  const hasCircuitFault = props.scenario.timeline.some((event) => event.type === 'equipment-failure'
    && event.target === 'co2-absorbent-exhaustion');
  const equipmentTrays = [
    ...(hasArterialLineFault ? [{ id: 'monitor' as const, label: 'Monitor' }] : []),
    ...(hasCircuitFault ? [{ id: 'circuit' as const, label: 'Circuit' }] : []),
  ];
  const visibleTrays = equipmentTrays.length > 0
    ? [...trays.slice(0, 3), ...equipmentTrays, ...trays.slice(3)] : trays;

  return (
    <div className="actions">
      {visibleTrays.length > 1 && (
        <Tabs
          label="Action trays"
          tabs={visibleTrays}
          active={tray}
          onSelect={(id) => setTray(id as TrayId)}
        />
      )}

      {/* Pinned: running infusions are visible regardless of the selected tray. */}
      {!focusedEmergencyAssessment && <div className="actions__pinned" role="status" aria-label="Pump settings for running infusions">
        {props.infusions.length === 0
          ? <span>No infusions running</span>
          : props.infusions.map((infusion) => (
            <span key={infusion.drugId} className="numeric">
              Pump set: {infusion.drugId} {infusion.rate.toFixed(1)} {infusion.unit} ·{' '}
              {Math.floor(infusion.elapsedSeconds / 60)}m {Math.floor(infusion.elapsedSeconds % 60)}s
            </span>
          ))}
      </div>}

      <div className="actions__tray">
        {tray === 'syringes' && (
          <>
            <SyringeTray
              formulary={props.scenario.formulary}
              remaining={props.syringeRemaining}
              weightKg={props.scenario.patient.weightKg}
              onBolus={props.onBolus}
              onDrugCard={props.onDrugCard}
              focusedTrayLabel={hasPreeclampsiaResponse ? responseTray.label : undefined}
            />
            {hasRocuronium && teachesNeuromuscularReversal && (
              <NeuromuscularReversalTray
                trainOfFourRatio={props.trainOfFourRatio ?? 1}
                trainOfFourCount={props.trainOfFourCount ?? 4}
                postTetanicCount={props.resuscitation.postTetanicCount ?? 0}
                lastReversal={props.resuscitation.lastNeuromuscularReversal ?? null}
                onReverse={props.onNeuromuscularReversal ?? (() => {})}
              />
            )}
          </>
        )}
        {tray === 'infusions' && (
          <InfusionTray
            formulary={props.scenario.formulary}
            region={props.region}
            weightKg={props.scenario.patient.weightKg}
            hypnoticLine={props.hypnoticLine}
            onInfusion={props.onInfusion}
            onHypnoticLine={props.onHypnoticLine}
          />
        )}
        {tray === 'fluids' && (
          <FluidTray
            showStandardFluids={!hasThermalResponse && !hasGlycemicResponse}
            thermalResponse={hasThermalResponse ? props.resuscitation.thermalResponse : undefined}
            glycemicResponse={hasGlycemicResponse ? props.resuscitation.glycemicResponse : undefined}
            crystalloidTotalMl={props.resuscitation.crystalloidTotalMl}
            packedRedBloodCellUnits={props.resuscitation.packedRedBloodCellUnits ?? 0}
            freshFrozenPlasmaUnits={props.resuscitation.freshFrozenPlasmaUnits ?? 0}
            bloodProductTotalMl={props.resuscitation.bloodProductTotalMl ?? 0}
            ageYears={props.scenario.patient.ageYears}
            hemorrhageAvailable={props.resuscitation.hemorrhageActive ?? false}
            coagulationAvailable={scenarioSupportsCoagulation(props.scenario)}
            coagulationPanelReported={props.resuscitation.coagulationPanelReported ?? false}
            prothrombinTimeRatio={props.prothrombinTimeRatio}
            fibrinogenGPerL={props.fibrinogenGPerL}
            bloodProductsReleased={props.resuscitation.bloodProductsReleased ?? false}
            onFluid={props.onFluid}
            onBloodProduct={props.onBloodProduct ?? (() => {})}
            onBloodBankRequest={props.onBloodBankRequest ?? (() => {})}
            onCoagulationLabs={props.onCoagulationLabs ?? (() => {})}
            onThermalResponse={props.onThermalResponse ?? (() => {})}
            onGlycemicResponse={props.onGlycemicResponse ?? (() => {})}
          />
        )}
        {tray === 'airway' && (
          <AirwayTray
            ventilator={props.ventilator}
            intubated={props.intubated}
            attempts={props.airwayAttempts}
            lastGrade={props.lastGrade}
            attemptInProgress={props.airwayAttemptInProgress ?? false}
            attemptSecondsRemaining={props.airwayAttemptSecondsRemaining ?? 0}
            jawThrustCpapSecondsRemaining={props.jawThrustCpapSecondsRemaining}
            device={props.airwayDevice}
            supraglotticInsertionSecondsRemaining={props.supraglotticInsertionSecondsRemaining}
            helpRequestedAtTick={props.helpRequestedAtTick}
            showDifficultAirwayRescue={hasDifficultAirwayResponse}
            showAirwayHelp={hasDifficultAirwayResponse || hasUpperAirwayObstructionResponse
              || hasOpioidVentilatoryResponse}
            showLaryngoscopy={!hasUpperAirwayObstructionResponse && !hasOpioidVentilatoryResponse}
            showAirwayManeuver={!hasOpioidVentilatoryResponse}
            showOpioidVentilatoryResponse={hasOpioidVentilatoryResponse}
            opioidVentilatoryResponse={props.resuscitation.opioidVentilatoryResponse}
            showCapnographyLine={props.scenario.timeline.some(
              (event) => event.type === 'artifact' && event.target === 'sampling-line-obstruction',
            )}
            capnographyLine={props.capnographyLine ?? {
              obstructed: false, ventilationCrossChecked: false,
            }}
            actualBodyWeightKg={props.scenario.patient.weightKg}
            region={props.region}
            onVentilator={props.onVentilator}
            onLaryngoscopy={props.onLaryngoscopy}
            onAirwayManeuver={props.onAirwayManeuver}
            onCallForHelp={props.onCallForHelp}
            onAirwayDevice={props.onAirwayDevice}
            onCapnographyLine={props.onCapnographyLine ?? (() => {})}
            onOpioidVentilatoryResponse={props.onOpioidVentilatoryResponse ?? (() => {})}
          />
        )}
        {tray === 'monitor' && hasArterialLineFault && (
          <ArterialLineTray
            status={props.arterialLine ?? {
              displayedMeanArterialMmHg: null, mislevelingCm: 0,
              dynamicResponse: 'normal', waveformAssessed: false, leveledAndZeroed: false,
              cuff: { status: 'idle', secondsRemaining: 0, meanArterialMmHg: null, measuredAtTick: null },
            }}
            onAction={props.onArterialLine ?? (() => {})}
          />
        )}
        {tray === 'circuit' && hasCircuitFault && (
          <BreathingCircuitTray
            status={props.breathingCircuit ?? {
              co2Absorbent: 'normal', inspiredCo2MmHg: 0,
              capnogramAssessed: false, absorbentReplaced: false,
            }}
            freshGasFlowLPerMin={props.ventilator.freshGasFlowLPerMin}
            onAction={props.onBreathingCircuit ?? (() => {})}
            onOpenVentilator={() => setTray('airway')}
          />
        )}
        {tray === 'crisis' && hasCrisisResponse && (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {hasEpinephrineResponse && (
              <EpinephrineCrisisTray
                region={props.region}
                epinephrineTotalMicrograms={props.resuscitation.epinephrineTotalMicrograms}
                lastExposure={props.lastExposure}
                lastMaximumMicrograms={hasLastResponse ? props.scenario.patient.weightKg : undefined}
                onEpinephrine={props.onEpinephrine}
              />
            )}
            {hasLastResponse && (
              <LocalAnestheticToxicityTray
                weightKg={props.scenario.patient.weightKg}
                seizureActivityFraction={props.resuscitation.seizureActivityFraction ?? 0}
                seizureSuppressed={props.resuscitation.seizureSuppressed ?? false}
                lipidEmulsionTotalMl={props.resuscitation.lipidEmulsionTotalMl ?? 0}
                lipidEmulsionInfusionMlPerMin={props.resuscitation.lipidEmulsionInfusionMlPerMin ?? 0}
                onSeizureSuppression={props.onSeizureSuppression ?? (() => {})}
                onLipidEmulsion={props.onLipidEmulsion ?? (() => {})}
              />
            )}
            {hasHypermetabolicResponse && (
              <HypermetabolicCrisisTray
                weightKg={props.scenario.patient.weightKg}
                muscleRigidityFraction={props.muscleRigidityFraction}
                dantroleneTotalMg={props.resuscitation.dantroleneTotalMg}
                dantroleneEffectFraction={props.resuscitation.dantroleneEffectFraction}
                activeCooling={props.resuscitation.activeCooling}
                onDantrolene={props.onDantrolene}
                onActiveCooling={props.onActiveCooling}
              />
            )}
            {hasCardiacArrestResponse && (
              <CardiacArrestTray
                active={props.resuscitation.cardiacArrestActive ?? false}
                compressionsActive={props.resuscitation.chestCompressionsActive ?? false}
                compressionSeconds={props.resuscitation.chestCompressionSeconds ?? 0}
                epinephrineTotalMg={props.resuscitation.arrestEpinephrineTotalMg ?? 0}
                shockCount={props.resuscitation.defibrillationShockCount ?? 0}
                lastEnergyJ={props.resuscitation.lastDefibrillationEnergyJ ?? null}
                roscAtTick={props.resuscitation.roscAtTick ?? null}
                shockable={!focusedPeaScenario}
                prompt={focusedPeaScenario && !props.peaArrestDemonstrating
                  ? peaArrestInlinePrompt(props.peaArrestGuidance ?? 'unassisted', {
                    scenarioVersion: props.scenario.metadata.version,
                    patient: props.resuscitation,
                  })
                  : focusedVfScenario && !props.persistentVfDemonstrating
                  ? persistentVfInlinePrompt(props.persistentVfGuidance ?? 'unassisted', {
                    scenarioVersion: props.scenario.metadata.version,
                    patient: props.resuscitation,
                  })
                  : null}
                demonstrating={(focusedPeaScenario && props.peaArrestDemonstrating)
                  || (focusedVfScenario && props.persistentVfDemonstrating)}
                onCompressions={props.onChestCompressions ?? (() => {})}
                onEpinephrine={props.onArrestEpinephrine ?? (() => {})}
                onDefibrillation={props.onDefibrillation ?? (() => {})}
              />
            )}
            {hasHighSpinalResponse && (
              <HighSpinalTray
                fraction={props.resuscitation.highSpinalFraction ?? 0}
                ephedrineTotalMg={props.resuscitation.ephedrineTotalMg ?? 0}
                lastEphedrineTick={props.resuscitation.lastEphedrineTick ?? null}
                helpRequested={props.helpRequestedAtTick !== null}
                onEphedrine={props.onEphedrine ?? (() => {})}
                onCallForHelp={props.onHighSpinalHelp ?? (() => {})}
              />
            )}
            {hasPreeclampsiaResponse && (
              <PreeclampsiaResponseTray
                checks={props.resuscitation.preeclampsiaBloodPressureChecks ?? 0}
                lastReading={props.resuscitation.lastPreeclampsiaBloodPressure ?? null}
                labetalolTotalMg={props.resuscitation.labetalolTotalMg ?? 0}
                labetalolEffectFraction={props.resuscitation.labetalolEffectFraction ?? 0}
                magnesiumSulfateTotalG={props.resuscitation.magnesiumSulfateTotalG ?? 0}
                onAction={props.onPreeclampsiaResponse ?? (() => {})}
              />
            )}
            {hasVenousAirEmbolismResponse && (
              <VenousAirEmbolismTray
                fraction={props.resuscitation.venousAirEmbolismFraction ?? 0}
                sourceControlled={props.resuscitation.venousAirEntryControlled ?? false}
                sourceControlledAtTick={props.resuscitation.venousAirEntryControlledAtTick ?? null}
                helpRequested={props.helpRequestedAtTick !== null}
                onCallForHelp={props.onVenousAirEmbolismHelp ?? (() => {})}
                onControlSource={props.onControlVenousAirEntry ?? (() => {})}
              />
            )}
            {hasPneumothoraxResponse && (
              <PneumothoraxResponseTray
                prompt={props.obstructivePleuralShockDemonstrating
                  || !supportsObstructivePleuralShock(props.scenario) ? null
                  : obstructivePleuralShockInlinePrompt(
                    props.obstructivePleuralShockGuidance ?? 'unassisted',
                    { scenarioVersion: props.scenario.metadata.version,
                      patient: obstructivePleuralShockProgress({
                        resuscitation: props.resuscitation, ventilator: props.ventilator,
                        airway: { helpRequestedAtTick: props.helpRequestedAtTick },
                      } as never) })}
                demonstrating={props.obstructivePleuralShockDemonstrating}
                fraction={props.resuscitation.tensionPneumothoraxFraction ?? 0}
                assessed={props.resuscitation.pneumothoraxAssessedAtTick !== null
                  && props.resuscitation.pneumothoraxAssessedAtTick !== undefined}
                decompressed={props.resuscitation.pneumothoraxDecompressedAtTick !== null
                  && props.resuscitation.pneumothoraxDecompressedAtTick !== undefined}
                helpRequested={props.helpRequestedAtTick !== null}
                focusedEmergency={focusedPleuralEmergency}
                oxygenReady={props.ventilator.fio2 >= 0.99}
                onCallForHelp={props.onPneumothoraxHelp ?? (() => {})}
                onAction={props.onPneumothoraxResponse ?? (() => {})}
                onOxygen={() => props.onVentilator({ fio2: 1 })}
              />
            )}
            {hasSevereHyponatremiaResponse && (
              <HyponatremiaTray
                scenarioVersion={props.scenario.metadata.version}
                guidance={props.severeHyponatremiaGuidance}
                demonstrating={props.severeHyponatremiaDemonstrating} assessment={props.resuscitation.hyponatremiaAssessment}
                onAction={props.onHyponatremiaResponse ?? (() => {})} />
            )}
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            {moduleTray && (
              <moduleTray.Component assessment={moduleTray.assessment(
                  // This file declares its own structural `resuscitation` shape, which is the
                  // snapshot's with a few lesson fields written out differently. A tray reads
                  // one field of it, so the cast is here rather than in all 48 registrations.
                  props.resuscitation as unknown as EquipmentSnapshot['resuscitation'],
                )}
                guidance={props.guidance}
                scenarioVersion={props.scenario.metadata.version}
                demonstrating={props.demonstratingLessonId === (moduleTray.demoId ?? moduleTray.id)}
                onOpenSource={moduleTray.opensSource ? props.onLessonTutorSource : undefined}
                onAction={(action: string) => props.onLessonAction?.(moduleTray.actionType, action)} />
            )}
            {hasEmergenceResidualBlockResponse && (
              <EmergenceResidualBlockTray
                assessment={props.resuscitation.emergenceResidualBlockAssessment}
                trainOfFourCount={props.trainOfFourCount ?? 4}
                trainOfFourRatio={props.trainOfFourRatio ?? 1}
                onAction={props.onEmergenceResidualBlockAssessment ?? (() => {})}
              />
            )}
            {hasBronchospasmResponse && (
              <BronchospasmTray
                region={props.region}
                obstructionSeverity={props.bronchospasmSeverity ?? 0}
                effectFraction={props.resuscitation.bronchodilatorEffectFraction ?? 0}
                salbutamolTotalMg={props.resuscitation.salbutamolTotalMg ?? 0}
                lastSalbutamolTick={props.resuscitation.lastSalbutamolTick ?? null}
                helpRequested={props.helpRequestedAtTick !== null}
                onCallForHelp={props.onBronchospasmHelp ?? (() => {})}
                onBronchodilator={props.onInhaledBronchodilator ?? (() => {})}
              />
            )}
          </div>
        )}
        {/* Inside the scrolling tray, not as a row of its own.
            As a fixed row it cost the tray forty pixels it does not have on a
            laptop with the demonstration strip up, and the dose buttons went
            below the fold. Here it costs nothing and is still found by anyone
            who scrolls to the end looking for the thing that is missing. */}
        {!focusedEmergencyAssessment && (tray === 'fluids' || (tray === 'crisis'
          && !hasAspirationRiskResponse && !hasEmergenceResidualBlockResponse
          && !hasDelayedEmergenceResponse && !hasExtubationReadinessResponse)) && (
          <p className="actions__not-modelled field__hint">
            {NOT_IN_THIS_BUILD}{' '}
            <a href="/limitations">The limitations register says what else.</a>
          </p>
        )}
      </div>
    </div>
  );
}




function BreathingCircuitTray({
  status, freshGasFlowLPerMin, onAction, onOpenVentilator,
}: {
  status: BreathingCircuitStatus;
  freshGasFlowLPerMin: number;
  onAction: NonNullable<ActionCockpitProps['onBreathingCircuit']>;
  onOpenVentilator: () => void;
}) {
  const failureActive = status.co2Absorbent === 'exhausted';
  return (
    <div className="tray-grid">
      <section className="card" aria-labelledby="circle-system-title">
        <h3 id="circle-system-title" className="field__label">Circle breathing system</h3>
        <Badge kind={failureActive ? 'teaching' : 'default'}>
          {failureActive ? 'Rebreathing needs correction' : 'Absorption restored'}
        </Badge>
        <p className="syringe__remaining numeric" role="status" aria-live="polite">
          Inspired CO₂ {status.inspiredCo2MmHg.toFixed(1)} mmHg
        </p>
        <p className="field__hint">
          {failureActive
            ? status.capnogramAssessed
              ? 'Assessment recorded: the inspiratory baseline remains above zero while delivered breaths continue.'
              : 'Read the inspiratory baseline, expiratory shape, breath delivery, and independent signals before choosing the circuit cause.'
            : status.absorbentReplaced
              ? 'Replacement intent is recorded. Watch the inspiratory baseline wash back toward zero.'
              : 'No modeled absorber failure is active.'}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button disabled={!failureActive || status.capnogramAssessed}
            onClick={() => onAction('assess-capnogram')}>Assess capnogram</Button>
          <Button disabled={!failureActive || !status.capnogramAssessed}
            onClick={() => onAction('replace-absorbent')}>Replace absorbent</Button>
        </div>
        <p className="field__hint">These controls record interpretation and corrective intent. They do not assess canister exchange, workstation-specific pause modes, seals, valves, or physical skill.</p>
      </section>
      <section className="card" aria-labelledby="fresh-gas-bridge-title">
        <h3 id="fresh-gas-bridge-title" className="field__label">Fresh-gas bridge</h3>
        <p className="syringe__remaining numeric" role="status">
          Fresh gas {freshGasFlowLPerMin.toFixed(1)} L/min
        </p>
        <p className="field__hint">Higher flow reduces modeled rebreathing while you prepare definitive correction. It does not repair exhausted absorbent.</p>
        <Button onClick={onOpenVentilator}>Open Airway &amp; Vent</Button>
      </section>
    </div>
  );
}

function ArterialLineTray({ status, onAction }: {
  status: ArterialLineStatus;
  onAction: NonNullable<ActionCockpitProps['onArterialLine']>;
}) {
  const faultActive = status.mislevelingCm > 0 || status.dynamicResponse === 'overdamped';
  const cuffText = status.cuff.status === 'cycling'
    ? `Cycling · ${status.cuff.secondsRemaining} simulated seconds remaining`
    : status.cuff.status === 'complete' && status.cuff.meanArterialMmHg !== null
      ? `Independent cuff MAP ${status.cuff.meanArterialMmHg.toFixed(0)} mmHg`
      : 'No independent cuff result';
  return (
    <div className="tray-grid">
      <section className="card" aria-labelledby="arterial-signal-title">
        <h3 id="arterial-signal-title" className="field__label">Invasive pressure signal</h3>
        <Badge kind={faultActive ? 'teaching' : 'default'}>
          {faultActive ? 'Signal needs verification' : 'Signal restored'}
        </Badge>
        <p className="syringe__remaining numeric" role="status" aria-live="polite">
          Displayed MAP {status.displayedMeanArterialMmHg?.toFixed(0) ?? '--'} mmHg
        </p>
        <p className="field__hint">
          {status.dynamicResponse === 'overdamped'
            ? status.waveformAssessed
              ? 'Assessment recorded: blunted upstroke and absent dicrotic notch are consistent with over-damping.'
              : 'The trace shape is available on the monitor; no morphology assessment is recorded yet.'
            : 'Dynamic response is normal in this bounded pressure system.'}
          {' '}
          {status.mislevelingCm > 0
            ? `The transducer is ${status.mislevelingCm.toFixed(0)} cm above its reference level.`
            : status.leveledAndZeroed ? 'Level-and-zero intent is recorded.' : 'No leveling fault is active.'}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button disabled={!faultActive || status.waveformAssessed}
            onClick={() => onAction('assess-waveform')}>Assess waveform</Button>
          <Button disabled={status.mislevelingCm === 0}
            onClick={() => onAction('level-zero')}>Level &amp; zero</Button>
          <Button disabled={status.dynamicResponse !== 'overdamped' || !status.waveformAssessed}
            onClick={() => onAction('restore-dynamic-response')}>Replace pressure tubing</Button>
        </div>
        <p className="field__hint">These controls record diagnostic and corrective intent. They do not assess setup, flushing, sterility, or physical skill.</p>
      </section>
      <section className="card" aria-labelledby="independent-pressure-title">
        <h3 id="independent-pressure-title" className="field__label">Independent pressure</h3>
        <p className="syringe__remaining numeric" role="status" aria-live="polite">{cuffText}</p>
        <Button disabled={status.cuff.status === 'cycling'}
          onClick={() => onAction('cycle-cuff')}>
          {status.cuff.status === 'cycling' ? 'Cuff cycling…' : 'Cycle cuff'}
        </Button>
        <p className="field__hint">The cuff result arrives after a fixed 20 simulated seconds and samples canonical pressure only when the cycle completes.</p>
      </section>
    </div>
  );
}

function BronchospasmTray({
  region, obstructionSeverity, effectFraction, salbutamolTotalMg, lastSalbutamolTick, helpRequested,
  onCallForHelp, onBronchodilator,
}: {
  region: RegionProfile;
  obstructionSeverity: number;
  effectFraction: number;
  salbutamolTotalMg: number;
  lastSalbutamolTick: number | null;
  helpRequested: boolean;
  onCallForHelp: () => void;
  onBronchodilator: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const regionalName = term(region, 'salbutamol');
  const displayName = regionalName.charAt(0).toUpperCase() + regionalName.slice(1);
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="bronchospasm-response-title">
        <div id="bronchospasm-response-title" className="syringe__name">Lower-airway response</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="field__hint">
          Call for help, deliver 100% oxygen and deepen anesthesia in Airway &amp; Vent, then exclude mechanical mimics.
        </p>
        <p className="syringe__remaining" role="status">
          {obstructionSeverity > 0.05
            ? `Modeled lower-airway obstruction ${(obstructionSeverity * 100).toFixed(0)}%`
            : 'No lower-airway obstruction observed'}
          {' · '}{helpRequested ? 'help requested' : 'help not requested'}
          {effectFraction > 0 ? ' · modeled bronchodilator effect active' : ''}
        </p>
        <Button disabled={helpRequested} onClick={onCallForHelp}>Call for help</Button>
      </section>
      <section className="syringe" aria-labelledby="bronchodilator-title">
        <div id="bronchodilator-title" className="syringe__name">{displayName}</div>
        <div className="syringe__meta">5 mg nebulized · bounded adult response</div>
        <p className="syringe__remaining" role="status">
          Accepted total: {salbutamolTotalMg.toFixed(0)} mg
          {lastSalbutamolTick === null ? '' : ' · modeled effect active'}
        </p>
        {!confirming ? (
          <Button disabled={obstructionSeverity <= 0.05 || salbutamolTotalMg + 5 > 10}
            onClick={() => setConfirming(true)}>
            Prepare {displayName} 5 mg nebulized
          </Button>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span>Give {regionalName} 5 mg nebulized?</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button variant="primary" compact onClick={() => {
                onBronchodilator();
                setConfirming(false);
              }}>Give {displayName}</Button>
              <Button variant="ghost" compact onClick={() => setConfirming(false)}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="field__hint">
          Nebulizer placement, circuit and HME delivery losses, repeat timing, advanced drugs, and individual response are not modeled.
        </p>
      </section>
    </div>
  );
}

export function NeuromuscularReversalTray({
  trainOfFourRatio, trainOfFourCount, postTetanicCount, lastReversal, onReverse,
}: {
  trainOfFourRatio: number;
  trainOfFourCount: number;
  postTetanicCount: number;
  lastReversal: {
    readonly agent: 'sugammadex' | 'neostigmine';
    readonly doseMgPerKg: number | null;
    readonly tick: number;
  } | null;
  onReverse: (agent: 'sugammadex' | 'neostigmine', doseMgPerKg?: number) => void;
}) {
  const [pending, setPending] = useState<'sugammadex-2' | 'sugammadex-4' | 'neostigmine' | null>(null);
  const recovered = trainOfFourRatio >= 0.9;
  const status = `TOF ${trainOfFourCount}/4 · ratio ${trainOfFourRatio.toFixed(2)}`
    + (trainOfFourCount === 0 ? ` · auto-derived PTC teaching proxy ${postTetanicCount}` : '');
  const give = () => {
    if (pending === 'sugammadex-2') onReverse('sugammadex', 2);
    if (pending === 'sugammadex-4') onReverse('sugammadex', 4);
    if (pending === 'neostigmine') onReverse('neostigmine');
    setPending(null);
  };
  return (
    <section className="card" aria-label="Neuromuscular reversal">
      <h3 className="panel__title">Neuromuscular reversal</h3>
      <Badge kind="teaching">Teaching model</Badge>
      <p className="syringe__remaining" role="status">{status}</p>
      {lastReversal && (
        <p className="field__hint">Last accepted: {lastReversal.agent}
          {lastReversal.doseMgPerKg === null ? '' : ` ${lastReversal.doseMgPerKg} mg/kg`} IV.</p>
      )}
      {pending === null ? (
        <div className="syringe__presets">
          <Button disabled={recovered || trainOfFourCount < 1}
            onClick={() => setPending('sugammadex-2')}>Sugammadex 2 mg/kg IV</Button>
          <Button disabled={recovered || trainOfFourCount !== 0 || postTetanicCount < 1}
            onClick={() => setPending('sugammadex-4')}>Sugammadex 4 mg/kg IV</Button>
          <Button disabled={recovered || trainOfFourCount !== 4 || trainOfFourRatio < 0.4}
            onClick={() => setPending('neostigmine')}>Neostigmine + antimuscarinic IV</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={give}>Give reversal</Button>
          <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
        </div>
      )}
      <p className="field__hint">Choose from the measured depth. Neostigmine is available only
        with an antimuscarinic during minimal block. Dose pharmacology, emergence, extubation,
        and individual recovery are not modeled. Confirm ratio ≥0.9 quantitatively.</p>
    </section>
  );
}

function CardiacArrestTray({
  active, compressionsActive, compressionSeconds, epinephrineTotalMg, shockCount, lastEnergyJ,
  roscAtTick, shockable, prompt, demonstrating = false,
  onCompressions, onEpinephrine, onDefibrillation,
}: {
  active: boolean;
  compressionsActive: boolean;
  compressionSeconds: number;
  epinephrineTotalMg: number;
  shockCount: number;
  lastEnergyJ: number | null;
  roscAtTick: number | null;
  shockable: boolean;
  /**
   * Two lessons share this tray. The tutor prompt and the watching notice are
   * computed by the caller and passed in, so a second lesson can be given a
   * tutor without this component learning which lesson it is rendering.
   */
  prompt?: { readonly suggestion: string; readonly because: string } | null;
  demonstrating?: boolean;
  onCompressions: (active: boolean) => void;
  onEpinephrine: () => void;
  onDefibrillation: (energyJ: number) => void;
}) {
  const [pending, setPending] = useState<'epinephrine' | number | null>(null);
  const energies = [120, 150, 200];
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <TutorPanel prompt={prompt} />
      <WatchingNotice demonstrating={demonstrating} />
      <div className="tray-grid">
      <section className="syringe">
        <div className="syringe__name">Chest compressions</div>
        <div className="syringe__meta">Fixed 110/min teaching action</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="syringe__remaining" role="status">
          {roscAtTick !== null ? 'ROSC recorded'
            : active ? `${compressionsActive ? 'Running' : 'Stopped'} · ${compressionSeconds.toFixed(0)} s accepted`
              : 'No scripted arrest active'}
        </p>
        <Button variant={compressionsActive ? 'ghost' : 'primary'} disabled={!active}
          aria-disabled={demonstrating}
          onClick={demonstrating ? undefined : () => onCompressions(!compressionsActive)}>
          {compressionsActive ? 'Pause compressions' : 'Start compressions'}
        </Button>
        <p className="field__hint">Depth, recoil, interruptions, fatigue, and physical skill are not modeled.</p>
      </section>
      <section className="syringe">
        <div className="syringe__name">Cardiac-arrest epinephrine</div>
        <div className="syringe__meta">1 mg IV · bounded adult action</div>
        <p className="syringe__remaining" role="status">Accepted total: {epinephrineTotalMg.toFixed(0)} mg</p>
        {pending !== 'epinephrine' ? (
          <Button disabled={!active || epinephrineTotalMg > 0} aria-disabled={demonstrating}
            onClick={demonstrating ? undefined : () => setPending('epinephrine')}>Prepare 1 mg IV</Button>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => { onEpinephrine(); setPending(null); }}>Give 1 mg IV</Button>
            <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
          </div>
        )}
        <p className="field__hint">The current AHA adult algorithm repeats epinephrine every 3–5 minutes; this bounded case accepts one dose.</p>
      </section>
      {shockable ? <section className="syringe">
        <div className="syringe__name">Biphasic defibrillation</div>
        <div className="syringe__meta">Energy-selected teaching action</div>
        <p className="syringe__remaining" role="status">
          Shocks: {shockCount}{lastEnergyJ === null ? '' : ` · last ${lastEnergyJ} J`}
        </p>
        {typeof pending !== 'number' ? (
          <div className="syringe__presets">
            {energies.map((energy) => <Button key={energy} disabled={!active}
              aria-disabled={demonstrating}
              onClick={demonstrating ? undefined : () => setPending(energy)}>{energy} J</Button>)}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => { onDefibrillation(pending); setPending(null); }}>
              Deliver {pending} J
            </Button>
            <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
          </div>
        )}
        <p className="field__hint">This declared device converts VF at 200 J under the case conditions. Other devices use manufacturer guidance. Never shock asystole or PEA.</p>
      </section> : <section className="syringe">
        <div className="syringe__name">Rhythm branch</div>
        <Badge kind="teaching">Nonshockable</Badge>
        <div className="syringe__meta">Organized electrical activity · no mechanical pulse</div>
        <p className="syringe__remaining" role="status">PEA · continue CPR + treat reversible causes</p>
        <p className="field__hint">Defibrillation is not offered for PEA. Continue the nonshockable-arrest pathway and reassess rhythm and pulse at the modeled cycle boundary.</p>
      </section>}
      </div>
    </div>
  );
}

function FluidTray({
  showStandardFluids, thermalResponse, glycemicResponse,
  crystalloidTotalMl, packedRedBloodCellUnits, freshFrozenPlasmaUnits, bloodProductTotalMl,
  ageYears, hemorrhageAvailable, coagulationAvailable, coagulationPanelReported, bloodProductsReleased,
  prothrombinTimeRatio, fibrinogenGPerL,
  onFluid, onBloodProduct, onBloodBankRequest, onCoagulationLabs, onThermalResponse,
  onGlycemicResponse,
}: {
  showStandardFluids: boolean;
  thermalResponse: ActionCockpitProps['resuscitation']['thermalResponse'];
  glycemicResponse: ActionCockpitProps['resuscitation']['glycemicResponse'];
  crystalloidTotalMl: number;
  packedRedBloodCellUnits: number;
  freshFrozenPlasmaUnits: number;
  bloodProductTotalMl: number;
  ageYears: number;
  hemorrhageAvailable: boolean;
  coagulationAvailable: boolean;
  coagulationPanelReported: boolean;
  bloodProductsReleased: boolean;
  prothrombinTimeRatio?: number;
  fibrinogenGPerL?: number;
  onFluid: (fluidId: string, volumeMl: number) => void;
  onBloodProduct: (productId: string, units: number) => void;
  onBloodBankRequest: () => void;
  onCoagulationLabs: () => void;
  onThermalResponse: NonNullable<ActionCockpitProps['onThermalResponse']>;
  onGlycemicResponse: NonNullable<ActionCockpitProps['onGlycemicResponse']>;
}) {
  const pediatric = ageYears < 18;
  const [pending, setPending] = useState<{ fluidId: string; volumeMl: number } | null>(null);
  const [pendingBlood, setPendingBlood] = useState<{ productId: string; units: number } | null>(null);
  const [pendingBloodBank, setPendingBloodBank] = useState(false);
  return (
    <div className="tray-grid">
      {thermalResponse && (
        <section className="syringe" aria-labelledby="thermal-response-title">
          <div id="thermal-response-title" className="syringe__name">Thermal care</div>
          <div className="syringe__meta">Core trend · active surface warming · bulk fluids</div>
          <p className="syringe__remaining" role="status">
            {thermalResponse.forcedAirWarmingAtTick != null
              ? 'Active surface warming recorded'
              : thermalResponse.coreTemperatureConfirmedAtTick != null
                ? 'Core temperature confirmed · warming response available'
                : thermalResponse.targetTemperatureC === null
                  ? 'No active modeled cooling course'
                  : 'Core-temperature confirmation pending'}
          </p>
          <div className="syringe__presets">
            <Button className="thermal-response__action"
              disabled={thermalResponse.targetTemperatureC === null
                || thermalResponse.coreTemperatureConfirmedAtTick != null}
              onClick={() => onThermalResponse('confirm-core-temperature')}>
              Confirm core temperature
            </Button>
            <Button className="thermal-response__action"
              disabled={thermalResponse.coreTemperatureConfirmedAtTick == null
                || thermalResponse.forcedAirWarmingAtTick != null}
              onClick={() => onThermalResponse('start-forced-air-warming')}>
              Start active surface warming
            </Button>
            <Button className="thermal-response__action"
              disabled={thermalResponse.coreTemperatureConfirmedAtTick == null
                || thermalResponse.warmedBulkFluidsAtTick != null}
              onClick={() => onThermalResponse('record-warmed-bulk-fluids')}>
              Warm remaining 700 mL crystalloid
            </Button>
          </div>
          <p className="field__hint">
            This records intent only. Device settings, probe technique, fluid delivery, heat
            transfer, complications, and individual rewarming time are not modeled.
          </p>
        </section>
      )}
      {glycemicResponse && (
        <section className="syringe" aria-labelledby="glycemic-response-title">
          <div id="glycemic-response-title" className="syringe__name">Glucose care</div>
          <div className="syringe__meta">Confirm · respond · recheck</div>
          <p className="syringe__remaining numeric" role="status">
            {glycemicResponse.repeatPointOfCareGlucoseMgPerDl != null
              ? `Repeat ${glycemicResponse.repeatPointOfCareGlucoseMgPerDl} mg/dL · ${(glycemicResponse.repeatPointOfCareGlucoseMgPerDl / 18.016).toFixed(1)} mmol/L`
              : glycemicResponse.pointOfCareGlucoseMgPerDl != null
                ? `Point-of-care cue ${glycemicResponse.pointOfCareGlucoseMgPerDl} mg/dL · ${(glycemicResponse.pointOfCareGlucoseMgPerDl / 18.016).toFixed(1)} mmol/L`
                : 'No active modeled glucose course'}
          </p>
          <div className="syringe__presets">
            <Button className="glycemic-response__action"
              disabled={glycemicResponse.pointOfCareGlucoseMgPerDl === null
                || glycemicResponse.pointOfCareConfirmedAtTick != null}
              onClick={() => onGlycemicResponse('confirm-point-of-care-glucose')}>
              Confirm point-of-care glucose
            </Button>
            <Button className="glycemic-response__action"
              disabled={glycemicResponse.pointOfCareConfirmedAtTick == null
                || glycemicResponse.insulinProtocolIntentAtTick != null}
              onClick={() => onGlycemicResponse('record-insulin-protocol-intent')}>
              Use institutional insulin protocol
            </Button>
            <Button className="glycemic-response__action"
              disabled={!glycemicResponse.repeatEligible
                || glycemicResponse.repeatPointOfCareAtTick != null}
              onClick={() => onGlycemicResponse('repeat-point-of-care-glucose')}>
              Repeat glucose at 30 min
            </Button>
          </div>
          <p className="field__hint">
            Target 100–180 mg/dL. This records protocol intent only; dose selection, delivery,
            electrolytes, ketones, nutrition, and hypoglycemia rescue are not modeled.
          </p>
        </section>
      )}
      {showStandardFluids && FLUIDS.map((fluid) => (
        <section className="syringe" key={fluid.id}>
          <div className="syringe__name">{fluid.name}</div>
          <p className="field__hint">
            Fixed teaching model: {(fluid.retainedFraction * 100).toFixed(0)}% remains intravascular.
          </p>
          <p className="syringe__remaining" role="status">
            Accepted total: {crystalloidTotalMl.toFixed(0)} mL
          </p>
          {pediatric ? (
            <p className="field__hint">
              No pediatric fluid bolus is stocked in this bounded induction case.
            </p>
          ) : pending?.fluidId === fluid.id ? (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <span className="numeric">Give {pending.volumeMl} mL?</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button
                  variant="primary"
                  compact
                  onClick={() => { onFluid(pending.fluidId, pending.volumeMl); setPending(null); }}
                >
                  Give fluid
                </Button>
                <Button
                  variant="ghost"
                  compact
                  onClick={() => setPending(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="syringe__presets">
              {fluid.presetsMl.map((volumeMl) => (
                <Button
                  key={volumeMl}
                  compact
                  onClick={() => setPending({ fluidId: fluid.id, volumeMl })}
                >
                  {volumeMl} mL
                </Button>
              ))}
            </div>
          )}
        </section>
      ))}
      {hemorrhageAvailable && !pediatric && (
        <section className="syringe">
          <div className="syringe__name">Blood bank</div>
          <p className="field__hint">
            Teaching handoff only. Compatibility testing, inventory, timing, and local emergency-release policy are not modeled.
          </p>
          <p className="syringe__remaining" role="status">
            {bloodProductsReleased ? 'Products released' : 'Products not requested'}
          </p>
          {!bloodProductsReleased && (pendingBloodBank ? (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" compact onClick={() => {
                onBloodBankRequest();
                setPendingBloodBank(false);
              }}>
                Send request
              </Button>
              <Button variant="ghost" compact onClick={() => setPendingBloodBank(false)}>Cancel</Button>
            </div>
          ) : (
            <Button compact onClick={() => setPendingBloodBank(true)}>Request products</Button>
          ))}
        </section>
      )}
      {hemorrhageAvailable && coagulationAvailable && !pediatric && (
        <section className="syringe">
          <div className="syringe__name">Coagulation panel</div>
          <p className="field__hint">Reports immediate PT-ratio and fibrinogen teaching values. Repeat after treatment to reassess.</p>
          <p className="syringe__remaining" role="status">
            {coagulationPanelReported
              ? `Current result: PT ratio ${(prothrombinTimeRatio ?? 1).toFixed(2)} × normal · fibrinogen ${(fibrinogenGPerL ?? 3).toFixed(1)} g/L`
              : 'No result requested'}
          </p>
          <Button compact onClick={onCoagulationLabs}>
            {coagulationPanelReported ? 'Repeat panel' : 'Request panel'}
          </Button>
        </section>
      )}
      {BLOOD_PRODUCTS.filter((product) => hemorrhageAvailable && bloodProductsReleased
        && (product.kind === 'red-cells' || (coagulationAvailable && coagulationPanelReported))).map((product) => (
        <section className="syringe" key={product.id}>
          <div className="syringe__name">{product.name}</div>
          <p className="field__hint">
            {product.kind === 'red-cells'
              ? `Fixed teaching model: 1 unit adds ${product.volumeMlPerUnit} mL and ${product.hemoglobinGPerUnit} g hemoglobin.`
              : `Fixed teaching model: 1 unit adds ${product.volumeMlPerUnit} mL of normal-donor plasma.`}
          </p>
          <p className="syringe__remaining" role="status">
            Accepted: {product.kind === 'red-cells' ? packedRedBloodCellUnits : freshFrozenPlasmaUnits}{' '}
            unit{(product.kind === 'red-cells' ? packedRedBloodCellUnits : freshFrozenPlasmaUnits) === 1 ? '' : 's'} ·{' '}
            all blood products {bloodProductTotalMl.toFixed(0)} mL
          </p>
          {pediatric ? (
            <p className="field__hint">
              No pediatric blood product is stocked in this bounded induction case.
            </p>
          ) : pendingBlood?.productId === product.id ? (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <span className="numeric">
                Give {pendingBlood.units} unit{pendingBlood.units === 1 ? '' : 's'}?
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button
                  variant="primary"
                  compact
                  onClick={() => {
                    onBloodProduct(pendingBlood.productId, pendingBlood.units);
                    setPendingBlood(null);
                  }}
                >
                  Give {product.kind === 'red-cells' ? 'packed red cells' : 'plasma'}
                </Button>
                <Button variant="ghost" compact onClick={() => setPendingBlood(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="syringe__presets">
              {product.presetsUnits.map((units) => (
                <Button
                  key={units}
                  compact
                  disabled={(product.kind === 'red-cells' ? packedRedBloodCellUnits : freshFrozenPlasmaUnits)
                    + units > product.maxUnitsTotal}
                  onClick={() => setPendingBlood({ productId: product.id, units })}
                >
                  {units} unit{units === 1 ? '' : 's'}
                </Button>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function HighSpinalTray({
  fraction, ephedrineTotalMg, lastEphedrineTick, helpRequested, onEphedrine, onCallForHelp,
}: {
  fraction: number;
  ephedrineTotalMg: number;
  lastEphedrineTick: number | null;
  helpRequested: boolean;
  onEphedrine: (doseMg: number) => void;
  onCallForHelp: () => void;
}) {
  const [pendingDose, setPendingDose] = useState<number | null>(null);
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="high-spinal-response-title">
        <div id="high-spinal-response-title" className="syringe__name">High spinal response</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="field__hint">
          Call for help, support breathing in Airway &amp; Vent, and give a 250–500 mL fluid bolus in Fluids.
        </p>
        <p className="syringe__remaining" role="status">
          Modeled progression {(fraction * 100).toFixed(0)}% · {helpRequested ? 'help requested' : 'help not requested'}
        </p>
        <Button disabled={helpRequested} onClick={onCallForHelp}>Call for help</Button>
      </section>
      <section className="syringe" aria-labelledby="ephedrine-title">
        <div id="ephedrine-title" className="syringe__name">Ephedrine</div>
        <div className="syringe__meta">IV bolus · bounded high-spinal response</div>
        <p className="syringe__remaining" role="status">
          Accepted total: {ephedrineTotalMg.toFixed(0)} mg
          {lastEphedrineTick === null ? '' : ' · modeled effect active'}
        </p>
        {pendingDose === null ? (
          <div className="syringe__presets">
            {[6, 12].map((doseMg) => (
              <Button
                key={doseMg}
                compact
                disabled={ephedrineTotalMg + doseMg > 30}
                onClick={() => setPendingDose(doseMg)}
              >
                {doseMg} mg
              </Button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span className="numeric">Give ephedrine {pendingDose} mg IV?</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" compact onClick={() => {
                onEphedrine(pendingDose);
                setPendingDose(null);
              }}>
                Give ephedrine
              </Button>
              <Button variant="ghost" compact onClick={() => setPendingDose(null)}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="field__hint">
          The listed dose band follows the source card; the response and 30 mg cap are bounded teaching behavior.
        </p>
      </section>
    </div>
  );
}

function PreeclampsiaResponseTray({
  checks, lastReading, labetalolTotalMg, labetalolEffectFraction,
  magnesiumSulfateTotalG, onAction,
}: {
  checks: number;
  lastReading: {
    systolicMmHg: number; diastolicMmHg: number; meanArterialMmHg: number; tick: number;
  } | null;
  labetalolTotalMg: number;
  labetalolEffectFraction: number;
  magnesiumSulfateTotalG: number;
  onAction: (action: 'repeat-blood-pressure' | 'labetalol-20mg-iv' | 'magnesium-sulfate-4g-iv') => void;
}) {
  const [pending, setPending] = useState<'labetalol-20mg-iv' | 'magnesium-sulfate-4g-iv' | null>(null);
  const confirmed = checks > 0;
  const treatmentLabel = pending === 'labetalol-20mg-iv'
    ? 'Give labetalol 20 mg IV?' : 'Start magnesium sulfate 4 g IV?';
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="maternal-response-title">
        <div id="maternal-response-title" className="syringe__name">Maternal response</div>
        <Badge kind="teaching">Focused lesson</Badge>
        <div className="syringe__meta">Confirm · treat · recheck</div>
        <p className="syringe__remaining" role="status">
          {lastReading
            ? `Last BP ${lastReading.systolicMmHg.toFixed(0)}/${lastReading.diastolicMmHg.toFixed(0)} mmHg · check ${checks}`
            : 'Persistent severe-range pressure declared · repeat not yet recorded'}
        </p>
        <Button onClick={() => onAction('repeat-blood-pressure')}>Repeat blood pressure</Button>
        <p className="field__hint">
          Recheck after treatment to observe the modeled response. The cuff result is the canonical
          simulated pressure, not a measurement-error model.
        </p>
      </section>
      <section className="syringe" aria-labelledby="maternal-medications-title">
        <div id="maternal-medications-title" className="syringe__name">Initial medications</div>
        <p className="syringe__remaining" role="status">
          Labetalol {labetalolTotalMg.toFixed(0)} mg · modeled response {(labetalolEffectFraction * 100).toFixed(0)}%
          {' · '}magnesium sulfate {magnesiumSulfateTotalG.toFixed(0)} g
        </p>
        {pending === null ? (
          <div className="syringe__presets">
            <Button compact disabled={!confirmed || labetalolTotalMg > 0}
              onClick={() => setPending('labetalol-20mg-iv')}>Labetalol 20 mg IV</Button>
            <Button compact disabled={!confirmed || magnesiumSulfateTotalG > 0}
              onClick={() => setPending('magnesium-sulfate-4g-iv')}>Magnesium sulfate 4 g IV</Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span className="numeric">{treatmentLabel}</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" compact onClick={() => {
                onAction(pending);
                setPending(null);
              }}>Confirm</Button>
              <Button variant="ghost" compact onClick={() => setPending(null)}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="field__hint">
          Labetalol follows one bounded pressure trajectory. Magnesium is seizure prophylaxis,
          not an antihypertensive; infusion timing, maintenance, levels, and toxicity are not modeled.
        </p>
      </section>
    </div>
  );
}

function VenousAirEmbolismTray({
  fraction, sourceControlled, sourceControlledAtTick, helpRequested, onCallForHelp, onControlSource,
}: {
  fraction: number;
  sourceControlled: boolean;
  sourceControlledAtTick: number | null;
  helpRequested: boolean;
  onCallForHelp: () => void;
  onControlSource: () => void;
}) {
  const [confirmingControl, setConfirmingControl] = useState(false);
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="venous-air-response-title">
        <div id="venous-air-response-title" className="syringe__name">Abrupt pulmonary-flow response</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="field__hint">
          Escalate the abrupt monitor change, deliver 100% oxygen in Airway &amp; Vent, and stop further suspected air entry.
        </p>
        <p className="syringe__remaining" role="status">
          Modeled burden {(fraction * 100).toFixed(0)}% · {helpRequested ? 'help requested' : 'help not requested'}
        </p>
        <Button disabled={helpRequested} onClick={onCallForHelp}>Call for help</Button>
      </section>
      <section className="syringe" aria-labelledby="venous-air-source-title">
        <div id="venous-air-source-title" className="syringe__name">Prevent further entry</div>
        <div className="syringe__meta">Intent action · physical source control is not simulated</div>
        <p className="syringe__remaining" role="status">
          {sourceControlled
            ? `Further modeled entry stopped${sourceControlledAtTick === null ? '' : ' · residual pattern clearing'}`
            : 'Further modeled entry continues'}
        </p>
        {!confirmingControl ? (
          <Button disabled={sourceControlled} onClick={() => setConfirmingControl(true)}>
            Stop suspected air entry
          </Button>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span>Record intent to stop further air entry?</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" compact onClick={() => {
                onControlSource();
                setConfirmingControl(false);
              }}>
                Confirm source control
              </Button>
              <Button variant="ghost" compact onClick={() => setConfirmingControl(false)}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="field__hint">
          The accepted action stops new entry only. Residual physiology clears gradually and does not predict an individual outcome.
        </p>
      </section>
    </div>
  );
}

function PneumothoraxResponseTray({
  fraction, assessed, decompressed, helpRequested, focusedEmergency, oxygenReady,
  onCallForHelp, onAction, onOxygen, prompt = null, demonstrating = false,
}: {
  /**
   * The emergency obstructive-shock lesson's tutor line, already resolved by
   * the caller. This tray is shared with the anaesthesia pneumothorax lesson,
   * which passes null, so the tray itself stays unaware of either lesson.
   */
  prompt?: { readonly suggestion: string; readonly because: string } | null;
  demonstrating?: boolean;
  fraction: number;
  assessed: boolean;
  decompressed: boolean;
  helpRequested: boolean;
  focusedEmergency: boolean;
  oxygenReady: boolean;
  onCallForHelp: () => void;
  onAction: (action: 'assess-bilateral-ventilation' | 'decompress-left-chest') => void;
  onOxygen: () => void;
}) {
  const [confirmingDecompression, setConfirmingDecompression] = useState(false);
  const active = fraction > 0.05 || decompressed;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="pleural-pattern-title">
        <div id="pleural-pattern-title" className="syringe__name">Breathing + circulation</div>
        <Badge kind="teaching">Focused crisis</Badge>
        <div className="syringe__meta">Check both sides · escalate · oxygenate</div>
        <p className="syringe__remaining" role="status">
          Modeled burden {(fraction * 100).toFixed(0)}% · {assessed ? 'bilateral check recorded' : 'bilateral check pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!active || assessed || decompressed}
            onClick={() => onAction('assess-bilateral-ventilation')}>Check bilateral ventilation</Button>
          <Button className="crisis-drug__action" disabled={!active || helpRequested}
            onClick={onCallForHelp}>Call for help</Button>
          {focusedEmergency && <Button className="crisis-drug__action"
            disabled={!active || oxygenReady} onClick={onOxygen}>
            Give high-concentration oxygen
          </Button>}
        </div>
        <p className="field__hint">
          {focusedEmergency
            ? 'Oxygen support does not relieve obstructed venous return or replace immediate pleural treatment.'
            : 'Use Airway & Vent for 100% oxygen. The pressure alarm is declared because airway pressure and compliance are not numerical engine states yet.'}
        </p>
      </section>
      <section className="syringe" aria-labelledby="pleural-decompression-title">
        <div id="pleural-decompression-title" className="syringe__name">Immediate decompression</div>
        <div className="syringe__meta">Intent action · no procedural instruction</div>
        <p className="syringe__remaining" role="status">
          {decompressed ? 'Decompression intent accepted · pattern clearing'
            : active ? 'Severe tension physiology continues' : 'Awaiting an observable change'}
        </p>
        {!confirmingDecompression ? (
          <Button className="crisis-drug__action" disabled={!active || decompressed}
            onClick={() => setConfirmingDecompression(true)}>
            Decompress left chest
          </Button>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span>Record immediate left-chest decompression intent?</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" className="crisis-drug__action" onClick={() => {
                onAction('decompress-left-chest');
                setConfirmingDecompression(false);
              }}>Confirm decompression intent</Button>
              <Button variant="ghost" className="crisis-drug__action"
                onClick={() => setConfirmingDecompression(false)}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="field__hint">
          Site selection, needle or thoracostomy technique, equipment, imaging, and complications
          stay outside this lab. Reassess the live monitor after the accepted action.
        </p>
      </section>
      </div>
    </div>
  );
}





















function HyponatremiaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['hyponatremiaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: NonNullable<ActionCockpitProps['onHyponatremiaResponse']>;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const stabilized = assessment?.stabilizedAtTick != null;
  const hypertonic = assessment?.hypertonicAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const guardrails = assessment?.guardrailsAtTick != null;
  const prompt = demonstrating ? null
    : severeHyponatremiaInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="hyponatremia-brain-title">
        <div id="hyponatremia-brain-title" className="syringe__name">Treat the brain, not the number.</div>
        <Badge kind="teaching">Seizure ended · Na 112 · deeply somnolent</Badge>
        <div className="syringe__meta">Glucose 96 · measured osmolality 238 · no ongoing convulsion</div>
        <p className="syringe__remaining" role="status">
          {hypertonic ? 'Symptom-led rescue recorded · first-hour review next'
            : stabilized ? 'Support active · hypertonic intent next'
              : reviewed ? 'Severe symptoms recognized · stabilize in parallel'
                : 'Neurologic + sodium + glucose + osmolality review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-hyponatremia-pattern') : undefined}>Review seizure + Na + exclusions</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || stabilized}
            aria-disabled={demonstrating} onClick={act ? () => act('record-hyponatremia-stabilization') : undefined}>Protect + support + monitor + call</Button>
          <Button className="crisis-drug__action" disabled={!stabilized || hypertonic}
            aria-disabled={demonstrating} onClick={act ? () => act('record-hypertonic-saline-intent') : undefined}>Record hypertonic bolus + 5 target</Button>
        </div>
        <p className="field__hint">Treat severe symptoms before the full cause is settled. Concentration, bolus volume, access, preparation, and delivery follow local protocol and are not simulated.</p>
      </section>
      <section className="syringe" aria-labelledby="hyponatremia-ceiling-title">
        <div id="hyponatremia-ceiling-title" className="syringe__name">Aim small. Guard the next 24 hours.</div>
        <div className="syringe__meta">Early relief · hard ceiling · sodium + urine surveillance</div>
        <p className="syringe__remaining" role="status">
          {guardrails ? 'Rescue stopped · ceilings + cause + overcorrection plan handed off'
            : reassessed ? 'Na 117 (+5) · more alert · urine 180 mL/h · stop and guard'
              : hypertonic ? 'First-hour neurologic + sodium review available'
                : 'Hypertonic intent pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!hypertonic || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-hyponatremia-first-hour') : undefined}>Review first-hour brain + Na + urine</Button>
          <Button className="crisis-drug__action" disabled={!reassessed || guardrails}
            aria-disabled={demonstrating} onClick={act ? () => act('record-hyponatremia-guardrails-and-cause-plan') : undefined}>Stop rescue + set ceiling + find cause</Button>
        </div>
        <p className="field__hint">This authored path stops after +5 mmol/L improvement, caps total rise at 10 mmol/L in the first 24 hours and 8 mmol/L per day after, and keeps a specialist overcorrection plan visible.</p>
      </section>
      </div>
    </div>
  );
}







































































































































function EmergenceResidualBlockTray({
  assessment, trainOfFourCount, trainOfFourRatio, onAction,
}: {
  assessment?: {
    readonly monitorReviewedAtTick: number | null;
    readonly classification: 'residual' | 'recovered' | null;
    readonly classifiedAtTick: number | null;
    readonly plan: 'defer-extubation-and-support' | 'proceed-to-extubation' | null;
    readonly planAtTick: number | null;
  };
  trainOfFourCount: number;
  trainOfFourRatio: number;
  onAction: (
    action: 'review-quantitative-monitor' | 'classify-residual' | 'classify-recovered'
      | 'defer-extubation-and-support' | 'proceed-to-extubation',
  ) => void;
}) {
  const [pendingPlan, setPendingPlan] = useState<
    'defer-extubation-and-support' | 'proceed-to-extubation' | null
  >(null);
  const reviewed = assessment?.monitorReviewedAtTick !== null
    && assessment?.monitorReviewedAtTick !== undefined;
  const classification = assessment?.classification ?? null;
  const plan = assessment?.plan ?? null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="emergence-monitor-title">
        <div id="emergence-monitor-title" className="syringe__name">Trust the quantitative signal</div>
        <Badge kind="teaching">Focused vignette</Badge>
        <div className="syringe__meta">Four twitches · clinical signs present · tube secured</div>
        <p className="syringe__remaining" role="status">
          {reviewed
            ? `TOF ${trainOfFourCount.toFixed(0)}/4 · ratio ${trainOfFourRatio.toFixed(2)} · no detectable fade`
            : 'Quantitative monitor review pending'}
        </p>
        <Button className="crisis-drug__action" disabled={reviewed}
          onClick={() => onAction('review-quantitative-monitor')}>Review quantitative monitor</Button>
        <p className="field__hint">
          A head lift, adequate tidal volume, four visible twitches, or no detectable fade cannot
          establish a quantitative ratio of at least 0.90.
        </p>
      </section>
      <section className="syringe" aria-labelledby="emergence-decision-title">
        <div id="emergence-decision-title" className="syringe__name">Classify, then protect</div>
        <div className="syringe__meta">One classification · one airway plan</div>
        <p className="syringe__remaining" role="status">
          {plan === 'defer-extubation-and-support' ? 'Extubation deferred · tube + ventilation maintained'
            : plan === 'proceed-to-extubation' ? 'Progression toward extubation recorded'
              : classification === 'residual' ? 'Residual blockade classified · plan pending'
                : classification === 'recovered' ? 'Recovery classified · plan pending'
                  : 'Classification pending'}
        </p>
        {classification === null && (
          <div className="syringe__presets">
            <Button className="crisis-drug__action" disabled={!reviewed}
              onClick={() => onAction('classify-residual')}>Residual blockade</Button>
            <Button className="crisis-drug__action" disabled={!reviewed}
              onClick={() => onAction('classify-recovered')}>Adequate recovery</Button>
          </div>
        )}
        {classification !== null && plan === null && pendingPlan === null && (
          <div className="syringe__presets">
            <Button className="crisis-drug__action"
              onClick={() => setPendingPlan('defer-extubation-and-support')}>
              Defer extubation + support
            </Button>
            <Button className="crisis-drug__action"
              onClick={() => setPendingPlan('proceed-to-extubation')}>
              Proceed toward extubation
            </Button>
          </div>
        )}
        {pendingPlan !== null && (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span>{pendingPlan === 'defer-extubation-and-support'
              ? 'Keep the tube and delivered ventilation in place?'
              : 'Record progression toward extubation?'}</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" className="crisis-drug__action" onClick={() => {
                onAction(pendingPlan);
                setPendingPlan(null);
              }}>Confirm choice</Button>
              <Button variant="ghost" className="crisis-drug__action"
                onClick={() => setPendingPlan(null)}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="field__hint">
          Reversal choice, recovery timing, consciousness, airway removal, and full extubation
          readiness remain outside this decision snapshot.
        </p>
      </section>
    </div>
  );
}



function EpinephrineCrisisTray({
  region, epinephrineTotalMicrograms, lastExposure, lastMaximumMicrograms, onEpinephrine,
}: {
  region: RegionProfile;
  epinephrineTotalMicrograms: number;
  lastExposure: { readonly agentId: string; readonly tick: number } | null;
  lastMaximumMicrograms?: number;
  onEpinephrine: (doseMicrograms: number) => void;
}) {
  const [pendingDose, setPendingDose] = useState<number | null>(null);
  const regionalName = term(region, 'epinephrine');
  const displayName = regionalName.charAt(0).toUpperCase() + regionalName.slice(1);
  const doses = (lastMaximumMicrograms === undefined ? [10, 20, 50] : [5, 10, 20, 50])
    .filter((dose) => lastMaximumMicrograms === undefined || dose <= lastMaximumMicrograms);

  return (
    <div className="tray-grid">
      <section className="syringe">
        <div className="syringe__name">{displayName}</div>
        <div className="syringe__meta">Intravenous bolus · dose in micrograms</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="field__hint">
          Pre-prepared dose action. Concentration, dilution, pump delivery, and syringe inventory
          are not modeled.
        </p>
        <p className="syringe__remaining" role="status">
          Accepted total: {epinephrineTotalMicrograms.toFixed(0)} µg IV
        </p>
        {pendingDose === null ? (
          <div className="syringe__presets">
            {doses.map((dose) => (
              <Button
                key={dose}
                className="crisis-drug__action"
                onClick={() => setPendingDose(dose)}
              >
                {dose} µg IV
              </Button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span className="numeric">Give {pendingDose} µg IV {regionalName}?</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                className="crisis-drug__action"
                onClick={() => { onEpinephrine(pendingDose); setPendingDose(null); }}
              >
                Give {displayName}
              </Button>
              <Button
                variant="ghost"
                className="crisis-drug__action"
                onClick={() => setPendingDose(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
      <section className="card">
        <h3 className="panel__title" style={{ font: 'var(--type-subtitle)' }}>Recent exposure</h3>
        <p className="field__hint">
          {lastExposure
            ? `${lastExposure.agentId} was the most recent modeled trigger exposure.`
            : 'No modeled trigger exposure has been recorded.'}
        </p>
      </section>
    </div>
  );
}

function LocalAnestheticToxicityTray({
  weightKg, seizureActivityFraction, seizureSuppressed, lipidEmulsionTotalMl,
  lipidEmulsionInfusionMlPerMin, onSeizureSuppression, onLipidEmulsion,
}: {
  weightKg: number;
  seizureActivityFraction: number;
  seizureSuppressed: boolean;
  lipidEmulsionTotalMl: number;
  lipidEmulsionInfusionMlPerMin: number;
  onSeizureSuppression: () => void;
  onLipidEmulsion: () => void;
}) {
  const [pending, setPending] = useState<'benzodiazepine' | 'lipid' | null>(null);
  const protocol = lastLipidProtocolForWeight(weightKg);
  const seizureStatus = seizureSuppressed ? 'suppressed after accepted treatment'
    : seizureActivityFraction > 0 ? 'active modeled seizure activity' : 'none observed';

  return (
    <div className="tray-grid">
      <section className="syringe">
        <div className="syringe__name">Seizure suppression</div>
        <div className="syringe__meta">IV benzodiazepine · agent-class action</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="syringe__remaining" role="status">Status: {seizureStatus}</p>
        <p className="field__hint">Drug selection, dose, kinetics, and physical administration are not modeled.</p>
        {pending !== 'benzodiazepine' ? (
          <Button className="crisis-drug__action" onClick={() => setPending('benzodiazepine')}>
            Prepare IV benzodiazepine
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="primary" className="crisis-drug__action" onClick={() => {
              onSeizureSuppression(); setPending(null);
            }}>Give benzodiazepine</Button>
            <Button variant="ghost" className="crisis-drug__action" onClick={() => setPending(null)}>Cancel</Button>
          </div>
        )}
      </section>
      <section className="syringe">
        <div className="syringe__name">20% lipid emulsion</div>
        <div className="syringe__meta">ASRA 2020 initial weight-banded protocol</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="syringe__remaining" role="status">
          Accepted total: {lipidEmulsionTotalMl.toFixed(0)} mL
          {lipidEmulsionInfusionMlPerMin > 0
            ? ` · ${lipidEmulsionInfusionMlPerMin.toFixed(1)} mL/min running` : ''}
        </p>
        <p className="field__hint">
          {weightKg.toFixed(0)} kg ({protocol.band}): {protocol.initialBolusMl.toFixed(0)} mL initial
          bolus over 3 modeled minutes, then {protocol.infusionMlPerMin.toFixed(1)} mL/min for the
          bounded 20-minute initial course. Safety ceiling{' '}
          {protocol.maxTotalMl.toFixed(0)} mL.
        </p>
        {pending !== 'lipid' ? (
          <Button className="crisis-drug__action" disabled={lipidEmulsionInfusionMlPerMin > 0}
            onClick={() => setPending('lipid')}>
            Start initial lipid protocol
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="primary" className="crisis-drug__action" onClick={() => {
              onLipidEmulsion(); setPending(null);
            }}>Start 20% lipid</Button>
            <Button variant="ghost" className="crisis-drug__action" onClick={() => setPending(null)}>Cancel</Button>
          </div>
        )}
        <p className="field__hint">
          If epinephrine is used, the modeled maximum is 1 µg/kg IV. Vasopressin, beta blockers,
          calcium-channel blockers, and further local anesthetic are not stocked here.
        </p>
      </section>
    </div>
  );
}

function HypermetabolicCrisisTray({
  weightKg, muscleRigidityFraction, dantroleneTotalMg, dantroleneEffectFraction,
  activeCooling, onDantrolene, onActiveCooling,
}: {
  weightKg: number;
  muscleRigidityFraction: number;
  dantroleneTotalMg: number;
  dantroleneEffectFraction: number;
  activeCooling: boolean;
  onDantrolene: () => void;
  onActiveCooling: (active: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const doseMg = weightKg * 2.5;
  const rigidity = muscleRigidityFraction >= 0.75 ? 'marked'
    : muscleRigidityFraction >= 0.4 ? 'moderate'
      : muscleRigidityFraction > 0.05 ? 'mild' : 'none observed';

  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="dantrolene-title">
        <div id="dantrolene-title" className="syringe__name">Dantrolene</div>
        <div className="syringe__meta">Intravenous dose · weight-based</div>
        <Badge kind="teaching">Teaching model</Badge>
        <p className="field__hint">
          Pre-prepared dose action. Reconstitution, vial inventory, laboratory treatment, and
          dose adjustment beyond the displayed weight calculation are not modeled.
        </p>
        <p className="syringe__remaining" role="status">
          Accepted total: {dantroleneTotalMg.toFixed(0)} mg IV
          {dantroleneEffectFraction > 0 ? ' · modeled effect active' : ''}
        </p>
        {!pending ? (
          <Button className="crisis-drug__action" onClick={() => setPending(true)}>
            Prepare 2.5 mg/kg IV
          </Button>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span className="numeric">Give 2.5 mg/kg IV = {doseMg.toFixed(0)} mg?</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                className="crisis-drug__action"
                onClick={() => { onDantrolene(); setPending(false); }}
              >
                Give dantrolene
              </Button>
              <Button
                variant="ghost"
                className="crisis-drug__action"
                onClick={() => setPending(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
      <section className="card" aria-labelledby="observable-signs-title">
        <h3 id="observable-signs-title" className="panel__title" style={{ font: 'var(--type-subtitle)' }}>
          Observable signs and support
        </h3>
        <p className="field__hint" role="status">Muscle rigidity: {rigidity}.</p>
        <p className="field__hint" role="status">
          Active cooling: {activeCooling ? 'on' : 'off'}.
        </p>
        <Button
          className="crisis-drug__action"
          variant={activeCooling ? 'ghost' : 'primary'}
          onClick={() => onActiveCooling(!activeCooling)}
        >
          {activeCooling ? 'Stop active cooling' : 'Start active cooling'}
        </Button>
      </section>
    </div>
  );
}

// --- Syringes ---------------------------------------------------------------

function SyringeTray({ formulary, remaining, weightKg, onBolus, onDrugCard, focusedTrayLabel }: {
  formulary: readonly FormularyEntry[];
  remaining: Readonly<Record<string, number>>;
  weightKg: number;
  onBolus: (drugId: string, amount: number, unit: string) => void;
  onDrugCard: (drugId: string) => void;
  focusedTrayLabel?: string;
}) {
  const boluses = formularyForMode(formulary, 'bolus');
  return (
    <div className="tray-grid">
      {boluses.length === 0 && (
        <section className="syringe" aria-labelledby="no-syringes-title">
          <div id="no-syringes-title" className="syringe__name">No syringes in this lesson</div>
          <p className="syringe__remaining">
            {focusedTrayLabel
              ? <>Routine anesthesia syringes are outside this focused lesson. Open {focusedTrayLabel} for the focused controls.</>
              : <>This is a device-only practice window. Use Airway &amp; Vent to prepare oxygen, fresh-gas flow, and volatile delivery.</>}
          </p>
        </section>
      )}
      {boluses.map((drug) => (
        <Syringe
          key={drug.drugId}
          drug={drug}
          remainingMl={remaining[drug.drugId] ?? drug.syringeVolumeMl}
          weightKg={weightKg}
          onBolus={onBolus}
          onDrugCard={onDrugCard}
        />
      ))}
    </div>
  );
}

function Syringe({ drug, remainingMl, weightKg, onBolus, onDrugCard }: {
  drug: FormularyEntry;
  remainingMl: number;
  weightKg: number;
  onBolus: (drugId: string, amount: number, unit: string) => void;
  onDrugCard: (drugId: string) => void;
}) {
  const [pending, setPending] = useState<{ amount: number; unit: string } | null>(null);
  const [free, setFree] = useState<number | ''>('');

  const massOf = (amount: number, unit: string) => (unit.includes('/kg') ? amount * weightKg : amount);
  const massUnit = drug.concentrationUnit.split('/')[0] ?? 'mg';

  return (
    <div className="syringe">
      <div className="syringe__name">{drug.drugId}</div>
      <div className="syringe__meta">
        {drug.concentration} {drug.concentrationUnit} ·{' '}
        <span className="syringe__remaining">{remainingMl.toFixed(1)} mL left</span>
      </div>

      {pending === null ? (
        <>
          <div className="syringe__presets">
            {drug.presets.map((preset) => (
              <Button
                key={preset.label}
                compact
                onClick={() => setPending({ amount: preset.amount, unit: preset.unit })}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <NumericField
            label="Free dose"
            unit={massUnit}
            value={free}
            min={0}
            step={1}
            onValueChange={setFree}
          />
          {free !== '' && free > 0 && (
            <Button compact onClick={() => setPending({ amount: free, unit: massUnit })}>
              Prepare {free} {massUnit}
            </Button>
          )}
          <Button variant="ghost" compact onClick={() => onDrugCard(drug.drugId)}>
            Drug card
          </Button>
        </>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {/* Weight-based dosing is shown BOTH ways before confirmation. */}
          <span className="numeric">
            {pending.amount} {pending.unit}
            {pending.unit.includes('/kg') && ` = ${massOf(pending.amount, pending.unit).toFixed(0)} ${massUnit}`}
          </span>
          {massOf(pending.amount, pending.unit) > drug.typicalDose * 10 && (
            <Badge kind="out-of-range">
              {(massOf(pending.amount, pending.unit) / drug.typicalDose).toFixed(0)}× the typical dose
            </Badge>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="primary"
              compact
              onClick={() => { onBolus(drug.drugId, pending.amount, pending.unit); setPending(null); setFree(''); }}
            >
              Give
            </Button>
            <Button variant="ghost" compact onClick={() => setPending(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Infusions ---------------------------------------------------------------

function InfusionTray({ formulary, region, weightKg, hypnoticLine, onInfusion, onHypnoticLine }: {
  formulary: readonly FormularyEntry[];
  region: RegionProfile;
  weightKg: number;
  hypnoticLine: HypnoticLineStatus;
  onInfusion: (drugId: string, rate: number, unit: string) => void;
  onHypnoticLine: (action: 'inspect' | 'reconnect') => void;
}) {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [tciOpen, setTciOpen] = useState(false);
  const hasPropofol = formulary.some((drug) => drug.drugId === 'propofol');

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div className="tray-grid">
        {formularyForMode(formulary, 'infusion').map((drug) => {
          const massUnit = drug.concentrationUnit.split('/')[0] ?? 'mg';
          const rate = rates[drug.drugId] ?? 0;
          return (
            <div className="syringe" key={drug.drugId}>
              <div className="syringe__name">{drug.drugId}</div>
              <div className="syringe__meta">Manual weight-based infusion</div>
              <SteppedDial
                label={`${drug.drugId} infusion rate`}
                value={rate}
                step={0.05}
                min={0}
                max={2}
                precision={2}
                unit={`${massUnit}/kg/min`}
                onChange={(value) => setRates((previous) => ({ ...previous, [drug.drugId]: value }))}
              />
              <span className="syringe__remaining">
                = {(rate * weightKg).toFixed(1)} {massUnit}/min
              </span>
              <Button compact onClick={() => onInfusion(drug.drugId, rate, `${massUnit}/kg/min`)}>
                Set rate
              </Button>
            </div>
          );
        })}
      </div>

      {hasPropofol && <section className="card" aria-labelledby="hypnotic-line-title">
        <h3 id="hypnotic-line-title" className="panel__title" style={{ font: 'var(--type-subtitle)' }}>
          Propofol delivery line
        </h3>
        {!hypnoticLine.inspected ? (
          <>
            <p className="field__hint">Delivery status has not been inspected.</p>
            <Button onClick={() => onHypnoticLine('inspect')}>Inspect propofol line</Button>
          </>
        ) : hypnoticLine.connected ? (
          <>
            <p className="field__hint" role="status">Connected. Delivery matches the pump setpoint.</p>
            <Button onClick={() => onHypnoticLine('inspect')}>Inspect propofol line again</Button>
          </>
        ) : (
          <>
            <p className="field__hint" role="status">
              Disconnected. The pump setpoint is not reaching the patient.
            </p>
            <Button variant="primary" onClick={() => onHypnoticLine('reconnect')}>
              Reconnect propofol line
            </Button>
          </>
        )}
      </section>}

      {/* Target-controlled infusion availability follows the practice region. */}
      {hasPropofol && <section className="card">
        <h3 className="panel__title" style={{ font: 'var(--type-subtitle)' }}>
          Target-controlled infusion
          {!region.targetControlledInfusion.routine && <> <Badge kind="out-of-range">Out of region</Badge></>}
        </h3>
        <p className="field__hint">{region.targetControlledInfusion.note}</p>
        {region.targetControlledInfusion.routine ? (
          <p className="field__hint">
            Available as a first-class control in this region, with plasma and effect-site
            targeting both offered.
          </p>
        ) : (
          <>
            <Toggle
              checked={tciOpen}
              onChange={setTciOpen}
              label="Open the out-of-region learning module anyway"
            />
            {tciOpen && (
              <p className="field__hint">
                Target-controlled infusion works fully here so you can understand it, and every
                screen carries the out-of-region label. The computed rates are a teaching
                simulation and are not a dosing recommendation for any real patient.
              </p>
            )}
          </>
        )}
      </section>}
    </div>
  );
}

// --- Airway and ventilator ---------------------------------------------------

function AirwayTray({
  ventilator, intubated, attempts, lastGrade, attemptInProgress, attemptSecondsRemaining,
  jawThrustCpapSecondsRemaining, device, supraglotticInsertionSecondsRemaining,
  helpRequestedAtTick, showDifficultAirwayRescue, showAirwayHelp, showLaryngoscopy,
  showAirwayManeuver,
  showOpioidVentilatoryResponse, opioidVentilatoryResponse,
  region, onVentilator, onLaryngoscopy,
  onAirwayManeuver, onCallForHelp, onAirwayDevice,
  showCapnographyLine, capnographyLine, onCapnographyLine,
  onOpioidVentilatoryResponse,
  actualBodyWeightKg,
}: {
  ventilator: ActionCockpitProps['ventilator'];
  intubated: boolean;
  attempts: number;
  lastGrade: number | null;
  attemptInProgress: boolean;
  attemptSecondsRemaining: number;
  jawThrustCpapSecondsRemaining: number;
  device: 'facemask' | 'supraglottic-airway' | 'tracheal-tube';
  supraglotticInsertionSecondsRemaining: number;
  helpRequestedAtTick: number | null;
  showDifficultAirwayRescue: boolean;
  showAirwayHelp: boolean;
  showLaryngoscopy: boolean;
  showAirwayManeuver: boolean;
  showOpioidVentilatoryResponse: boolean;
  opioidVentilatoryResponse: ActionCockpitProps['resuscitation']['opioidVentilatoryResponse'];
  showCapnographyLine: boolean;
  capnographyLine: CapnographyLineStatus;
  actualBodyWeightKg: number;
  region: RegionProfile;
  onVentilator: (settings: Partial<ActionCockpitProps['ventilator']>) => void;
  onLaryngoscopy: (technique: 'direct' | 'video') => void;
  onAirwayManeuver: (maneuver: 'jaw-thrust-cpap') => void;
  onCallForHelp: () => void;
  onAirwayDevice: (device: 'supraglottic-airway') => void;
  onCapnographyLine: (action: 'cross-check-ventilation' | 'reconnect') => void;
  onOpioidVentilatoryResponse: (
    response: 'hold-further-opioid' | 'record-naloxone-titration',
  ) => void;
}) {
  const [pendingCapnographyReconnect, setPendingCapnographyReconnect] = useState(false);
  const holdingAirway = jawThrustCpapSecondsRemaining > 0;
  const insertingSupraglottic = supraglotticInsertionSecondsRemaining > 0;
  const helpRequested = helpRequestedAtTick !== null;
  const supraglotticStatus = insertingSupraglottic
    ? 'Supraglottic airway insertion is in progress. Ventilation is interrupted.'
    : device === 'supraglottic-airway'
      ? 'Supraglottic airway placed. It does not deliver breaths automatically. Turn breath delivery on and confirm sustained gas exchange from the capnogram.'
      : device === 'tracheal-tube'
        ? 'The tracheal tube is in place. Supraglottic airway rescue is unavailable.'
        : 'No supraglottic airway insertion has been started.';
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <section>
        <h3 className="field__label">Ventilation</h3>
        <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <SegmentedControl
            label="Ventilation mode"
            value={ventilator.mode}
            onChange={(mode) => onVentilator({ mode })}
            options={[
              { value: 'volume-control' as const, label: 'VC', srLabel: 'Volume control' },
              { value: 'pressure-control' as const, label: 'PC', srLabel: 'Pressure control' },
              { value: 'manual' as const, label: 'MAN', srLabel: 'Manual or spontaneous' },
            ]}
          />
          <Toggle
            checked={ventilator.delivering}
            onChange={(delivering) => onVentilator({ delivering })}
            label={ventilator.delivering ? 'Delivering breaths' : 'Not delivering breaths'}
          />
          <Slider
            label="Inspired oxygen fraction"
            value={ventilator.fio2}
            min={0.21}
            max={1}
            step={0.01}
            precision={2}
            onChange={(fio2) => onVentilator({ fio2 })}
          />
          <Slider
            label="Tidal volume"
            unit="mL"
            value={ventilator.tidalVolumeMl}
            min={0}
            max={900}
            step={10}
            onChange={(tidalVolumeMl) => onVentilator({ tidalVolumeMl })}
          />
          <p className="field__hint" aria-live="off">
            {ventilator.tidalVolumeMl} mL ={' '}
            {(ventilator.tidalVolumeMl / actualBodyWeightKg).toFixed(1)} mL/kg actual body weight.
            Conversion only, not a recommended target.
          </p>
          <Slider
            label="Respiratory rate"
            unit="/min"
            value={ventilator.respiratoryRateBpm}
            min={0}
            max={30}
            step={1}
            onChange={(respiratoryRateBpm) => onVentilator({ respiratoryRateBpm })}
          />
          <Slider
            label="Positive end-expiratory pressure"
            unit="cmH₂O"
            value={ventilator.peep}
            min={0}
            max={20}
            step={1}
            onChange={(peep) => onVentilator({ peep })}
          />
          <Slider
            label="Sevoflurane vaporizer"
            unit="vol %"
            value={ventilator.sevofluranePercent}
            min={0}
            max={8}
            step={0.1}
            onChange={(sevofluranePercent) => onVentilator({ sevofluranePercent })}
          />
          <Slider
            label="Fresh gas flow"
            unit="L/min"
            value={ventilator.freshGasFlowLPerMin}
            min={0.5}
            max={15}
            step={0.5}
            precision={1}
            onChange={(freshGasFlowLPerMin) => onVentilator({ freshGasFlowLPerMin })}
          />
        </div>
        <p className="field__hint">
          The inspired oxygen fraction cannot be set below 0.21. Real anaesthesia machines carry
          the same hypoxic guard.
        </p>
      </section>

      <section>
        <h3 className="field__label">Airway</h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {showAirwayManeuver && (
            <Button
              aria-describedby="jaw-thrust-cpap-status"
              disabled={holdingAirway}
              onClick={() => onAirwayManeuver('jaw-thrust-cpap')}
            >
              Apply jaw thrust + continuous positive pressure
            </Button>
          )}
          {showLaryngoscopy && (
            <>
              <Button
                onClick={() => onLaryngoscopy('direct')}
                disabled={intubated || device !== 'facemask' || attemptInProgress || insertingSupraglottic}
              >
                Direct laryngoscopy
              </Button>
              <Button
                onClick={() => onLaryngoscopy('video')}
                disabled={intubated || device !== 'facemask' || attemptInProgress || insertingSupraglottic}
              >
                Videolaryngoscopy
              </Button>
            </>
          )}
        </div>
        {showAirwayManeuver && (
          <p id="jaw-thrust-cpap-status" className="field__hint">
            {holdingAirway
              ? ventilator.delivering
                ? `Jaw thrust and continuous positive pressure in progress: ${Math.ceil(jawThrustCpapSecondsRemaining)} simulated seconds remaining.`
                : `Jaw thrust hold in progress: ${Math.ceil(jawThrustCpapSecondsRemaining)} simulated seconds remaining. The ventilator is not delivering positive pressure.`
              : `Applies a fixed ${JAW_THRUST_CPAP_SECONDS}-second teaching-model hold, not a recommended clinical duration. Assess its effect from gas movement and the capnogram.`}
          </p>
        )}
        {showLaryngoscopy && (
          <p className="field__hint">
            {attemptInProgress
              ? `Attempt in progress: ${attemptSecondsRemaining} simulated seconds remaining. Ventilation is interrupted.`
              : intubated
              ? 'The tube is in and its position is confirmed by the capnogram.'
              : attempts === 0
                ? 'No attempt yet. Each attempt consumes time and the patient is apnoeic throughout.'
                : `${attempts} attempt${attempts === 1 ? '' : 's'} so far`
                  + (lastGrade !== null ? `, last view Cormack-Lehane grade ${lastGrade}.` : '.')
                  + ' Repeated attempts worsen the view through airway trauma.'}
          </p>
        )}
        {showAirwayHelp && (
          <section aria-labelledby="airway-rescue-title" style={{ marginBlockStart: 'var(--space-3)' }}>
            <h4 id="airway-rescue-title" className="field__label">Airway support</h4>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                className="airway-rescue__action"
                aria-describedby="airway-rescue-status"
                disabled={helpRequested}
                onClick={onCallForHelp}
              >
                Call for help
              </Button>
              {showDifficultAirwayRescue && (
                <Button
                  className="airway-rescue__action"
                  aria-describedby="airway-rescue-status airway-rescue-countdown"
                  disabled={device !== 'facemask' || attemptInProgress || insertingSupraglottic}
                  onClick={() => onAirwayDevice('supraglottic-airway')}
                >
                  Insert supraglottic airway
                </Button>
              )}
            </div>
            <p id="airway-rescue-status" className="field__hint" role="status" aria-live="polite">
              {helpRequested ? 'Help has been requested.' : 'No help request has been recorded.'}
              {showDifficultAirwayRescue ? ` ${supraglotticStatus}` : ''}
            </p>
            {showDifficultAirwayRescue && (
              <p id="airway-rescue-countdown" className="field__hint" aria-live="off">
                {insertingSupraglottic
                  ? `Insertion countdown: ${Math.ceil(supraglotticInsertionSecondsRemaining)} simulated seconds remaining.`
                  : 'Insertion takes a fixed 15 simulated seconds in this teaching model.'}
              </p>
            )}
          </section>
        )}
        {showOpioidVentilatoryResponse && (
          <section className="card" aria-labelledby="opioid-ventilatory-response-title"
            style={{ marginBlockStart: 'var(--space-3)' }}>
            <h4 id="opioid-ventilatory-response-title" className="field__label">
              Opioid ventilatory response
            </h4>
            <p className="field__hint">
              Hold further opioid, support ventilation, and record patient-specific naloxone
              titration intent. This screen supplies no naloxone dose or administration model.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                className="opioid-response__action"
                disabled={(opioidVentilatoryResponse?.severity ?? 0) <= 0.05
                  || opioidVentilatoryResponse?.furtherOpioidHeldAtTick != null}
                onClick={() => onOpioidVentilatoryResponse('hold-further-opioid')}
              >
                Hold further opioid
              </Button>
              <Button
                className="opioid-response__action"
                disabled={opioidVentilatoryResponse?.furtherOpioidHeldAtTick == null
                  || opioidVentilatoryResponse?.naloxoneIntentAtTick != null}
                onClick={() => onOpioidVentilatoryResponse('record-naloxone-titration')}
              >
                Record naloxone titration intent
              </Button>
            </div>
            <p className="field__hint" role="status">
              {opioidVentilatoryResponse?.naloxoneIntentAtTick != null
                ? 'Naloxone titration intent recorded. Continue ventilatory support and reassessment.'
                : opioidVentilatoryResponse?.furtherOpioidHeldAtTick != null
                  ? 'Further opioid held. Reversal intent is available.'
                  : (opioidVentilatoryResponse?.severity ?? 0) > 0.05
                    ? 'Ventilatory impairment active. No opioid hold recorded.'
                    : 'No active modeled opioid ventilatory impairment.'}
            </p>
          </section>
        )}
        <p className="reading__aside">
          Airway protocol: {region.airwayGuideline.name} ({region.airwayGuideline.issuingBody},{' '}
          {region.airwayGuideline.version}).
        </p>
      </section>

      {showCapnographyLine && (
        <section className="card" aria-labelledby="capnography-sample-path-title">
          <h3 id="capnography-sample-path-title" className="field__label">
            Carbon-dioxide sample path
          </h3>
          <p className="field__hint" role="status" aria-live="polite">
            {capnographyLine.obstructed
              ? 'No carbon-dioxide sample is reaching the monitor. Patient ventilation and the sampled display are separate states.'
              : 'The carbon-dioxide sample path is connected.'}
            {' '}
            {capnographyLine.ventilationCrossChecked
              ? 'Independent ventilation evidence has been cross-checked.'
              : 'No independent ventilation cross-check has been recorded.'}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button
              disabled={!capnographyLine.obstructed || capnographyLine.ventilationCrossChecked}
              onClick={() => onCapnographyLine('cross-check-ventilation')}
            >
              Cross-check ventilation
            </Button>
            {!pendingCapnographyReconnect ? (
              <Button
                disabled={!capnographyLine.obstructed}
                onClick={() => setPendingCapnographyReconnect(true)}
              >
                Reconnect sampling line
              </Button>
            ) : (
              <>
                <Button variant="primary" onClick={() => {
                  onCapnographyLine('reconnect');
                  setPendingCapnographyReconnect(false);
                }}>
                  Confirm reconnect
                </Button>
                <Button variant="ghost" onClick={() => setPendingCapnographyReconnect(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
          <p className="field__hint">
            This records screen intent only. It does not assess chest movement, bag movement,
            auscultation, circuit inspection, or technical skill.
          </p>
        </section>
      )}
    </div>
  );
}
