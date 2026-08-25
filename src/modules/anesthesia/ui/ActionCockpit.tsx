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
  readonly onAspirationRiskAssessment?: (
    action: 'review-cues' | 'classify-elevated' | 'classify-routine'
      | 'defer-and-replan' | 'proceed-routine',
  ) => void;
  readonly onEmergenceResidualBlockAssessment?: (
    action: 'review-quantitative-monitor' | 'classify-residual' | 'classify-recovered'
      | 'defer-extubation-and-support' | 'proceed-to-extubation',
  ) => void;
  readonly onDelayedEmergenceAssessment?: (
    action: 'review-support' | 'review-exposure-and-block' | 'check-metabolic-causes'
      | 'perform-focused-neurologic-exam' | 'urgent-neurologic-evaluation'
      | 'continue-routine-recovery',
  ) => void;
  readonly onExtubationReadinessAssessment?: (
    action: 'review-quantitative-recovery' | 'review-awake-airway-protection'
      | 'review-spontaneous-gas-exchange' | 'review-airway-risk-and-rescue'
      | 'ready-for-planned-awake-extubation' | 'continue-support-and-reassess',
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
  readonly onCiedPlanningAssessment?: (
    action: 'review-device-record' | 'review-procedure-emi'
      | 'coordinate-asynchronous-pacing' | 'apply-unverified-magnet'
      | 'proceed-no-change' | 'document-backup-and-restoration',
  ) => void;
  readonly onPostoperativeHandoffAssessment?: (
    action: 'confirm-receiver-readiness' | 'share-patient-and-course'
      | 'share-current-state' | 'share-risks-actions-ownership'
      | 'receiver-readback' | 'accept-transfer',
  ) => void;
  readonly onUndifferentiatedShockAssessment?: (
    action: 'review-perfusion' | 'review-lactate' | 'review-focused-echo'
      | 'perform-passive-leg-raise' | 'give-targeted-fluid-challenge'
      | 'reassess-perfusion' | 'escalate-after-reassessment',
  ) => void;
  readonly onSepticShockAssessment?: (
    action: 'review-infection-and-organ-dysfunction' | 'obtain-cultures-and-lactate'
      | 'record-immediate-antimicrobial-intent' | 'begin-initial-crystalloid'
      | 'reassess-after-initial-fluid' | 'start-norepinephrine-intent'
      | 'escalate-source-control',
  ) => void;
  readonly onHemorrhagicShockAssessment?: (
    action: 'review-mechanism-and-perfusion' | 'record-pelvic-stabilization'
      | 'activate-major-hemorrhage' | 'give-two-red-cell-units'
      | 'review-coagulation-and-temperature' | 'reassess-perfusion'
      | 'escalate-definitive-bleeding-control',
  ) => void;
  readonly onCardiacTamponadeAssessment?: (
    action: 'review-context-and-perfusion' | 'review-fixed-pocus'
      | 'record-definitive-control-intent' | 'reassess-perfusion',
  ) => void;
  readonly onEmergencyAnaphylaxisResponse?: (
    action: 'review-systemic-pattern' | 'position-and-call-for-help'
      | 'give-im-epinephrine' | 'give-high-flow-oxygen'
      | 'begin-fixed-crystalloid' | 'reassess-response',
  ) => void;
  readonly onAdultAsthmaResponse?: (
    action: 'review-severity-and-mimics' | 'record-controlled-oxygen'
      | 'give-fixed-inhaled-bronchodilators' | 'record-early-corticosteroid-intent'
      | 'reassess-after-initial-treatment',
  ) => void;
  readonly onCopdExacerbationResponse?: (
    action: 'review-severity-and-mimics' | 'record-controlled-oxygen'
      | 'give-air-driven-bronchodilators' | 'record-five-day-corticosteroid-intent'
      | 'record-antibiotic-indication' | 'reassess-and-review-ventilatory-support',
  ) => void;
  readonly onAcutePulmonaryEdemaResponse?: (
    action: 'review-pattern-mimics-and-precipitants' | 'record-niv-and-titrated-oxygen'
      | 'record-loop-diuretic-intent' | 'record-vasodilator-intent'
      | 'reassess-breathing-pressure-and-perfusion',
  ) => void;
  readonly onPulmonaryEmbolismResponse?: (
    action: 'review-confirmed-pe-severity' | 'record-titrated-oxygen'
      | 'record-therapeutic-anticoagulation-intent' | 'reassess-for-deterioration'
      | 'activate-pert-and-record-reperfusion-intent',
  ) => void;
  readonly onStemiResponse?: (
    action: 'review-stemi-pattern' | 'activate-stemi-pathway' | 'record-aspirin-load'
      | 'record-p2y12-anticoagulation-intent' | 'reassess-and-handoff',
  ) => void;
  readonly onUnstableNarrowTachycardiaResponse?: (
    action: 'review-rhythm-and-instability' | 'prepare-synchronized-cardioversion'
      | 'record-synchronized-cardioversion-intent' | 'reassess-rhythm-and-perfusion',
  ) => void;
  readonly onUnstableBradycardiaResponse?: (
    action: 'review-bradycardia-and-compromise' | 'record-bradycardia-support'
      | 'record-atropine-intent' | 'reassess-bradycardia-response',
  ) => void;
  readonly onStatusEpilepticusResponse?: (
    action: 'review-convulsive-status' | 'record-status-stabilization'
      | 'give-lorazepam-4-mg-iv' | 'reassess-after-lorazepam',
  ) => void;
  readonly onAcuteIschemicStrokeResponse?: (
    action: 'review-stroke-presentation' | 'activate-stroke-system'
      | 'review-stroke-imaging-and-eligibility' | 'record-tenecteplase-20-mg-intent'
      | 'activate-thrombectomy-transfer' | 'reassess-and-handoff-stroke',
  ) => void;
  readonly onIntracranialHemorrhageResponse?: (
    action: 'review-ich-deterioration' | 'activate-ich-pathway'
      | 'review-ich-findings-and-coagulopathy' | 'record-warfarin-reversal-intent'
      | 'record-smooth-ich-pressure-control' | 'escalate-ich-neurocritical-care',
  ) => void;
  readonly onDiabeticKetoacidosisResponse?: (
    action: 'review-dka-presentation' | 'record-dka-fluids-and-monitoring'
      | 'record-dka-potassium-replacement' | 'record-dka-insulin-intent'
      | 'add-dextrose-and-continue-insulin' | 'confirm-dka-resolution-and-transition',
  ) => void;
  readonly onHyperkalemiaResponse?: (
    action: 'review-hyperkalemia-pattern' | 'record-hyperkalemia-calcium-intent'
      | 'record-hyperkalemia-insulin-glucose' | 'record-hyperkalemia-beta-agonist'
      | 'record-hyperkalemia-removal-and-cause-control' | 'reassess-hyperkalemia',
  ) => void;
  readonly onHyponatremiaResponse?: (
    action: 'review-hyponatremia-pattern' | 'record-hyponatremia-stabilization'
      | 'record-hypertonic-saline-intent' | 'reassess-hyponatremia-first-hour'
      | 'record-hyponatremia-guardrails-and-cause-plan',
  ) => void;
  readonly onOpioidToxicityResponse?: (
    action: 'review-opioid-toxicity-pattern' | 'record-opioid-ventilation-support'
      | 'record-opioid-naloxone-intent' | 'reassess-opioid-initial-response'
      | 'review-opioid-recurrence' | 'record-opioid-recurrence-and-safety-plan',
  ) => void;
  readonly onHeatStrokeResponse?: (
    action: 'review-heat-stroke-pattern' | 'record-heat-stroke-support'
      | 'record-cold-water-immersion' | 'reassess-heat-stroke-cooling-target'
      | 'record-heat-stroke-organ-surveillance',
  ) => void;
  readonly onTraumaPrimarySurveyResponse?: (
    action: 'activate-trauma-primary-survey' | 'control-trauma-catastrophic-hemorrhage'
      | 'review-trauma-airway-and-breathing' | 'record-trauma-circulation-response'
      | 'review-trauma-disability-and-exposure' | 'repeat-trauma-primary-survey',
  ) => void;
  readonly onAcuteAorticSyndromeResponse?: (
    action: 'review-aortic-initial-pattern' | 'repeat-aortic-asymmetry-exam'
      | 'activate-aortic-pathway' | 'record-aortic-anti-impulse-intent'
      | 'prioritize-aortic-imaging' | 'repeat-and-handoff-aortic-evolution',
  ) => void;
  readonly onArdsLungProtectiveResponse?: (
    action: 'review-ards-baseline' | 'calculate-ards-pbw' | 'record-ards-protective-settings'
      | 'reassess-ards-protection' | 'record-ards-peep-prone-escalation',
  ) => void;
  readonly onEscalatingHypoxemiaResponse?: (
    action: 'validate-hypoxemia-signal' | 'support-hypoxemia-and-call-help'
      | 'trace-hypoxemia-delivery-path' | 'integrate-hypoxemia-bedside-pattern'
      | 'escalate-and-reassess-hypoxemia',
  ) => void;
  readonly onVentilatorDyssynchronyResponse?: (
    action: 'review-dyssynchrony-patient-and-graphics' | 'review-dyssynchrony-drivers'
      | 'classify-dyssynchrony-pattern' | 'record-dyssynchrony-correction-intent'
      | 'reassess-dyssynchrony-response',
  ) => void;
  readonly onAutoPeepResponse?: (
    action: 'review-auto-peep-patient-and-flow' | 'measure-auto-peep'
      | 'classify-auto-peep-pattern' | 'record-auto-peep-correction-intent'
      | 'reassess-auto-peep-response',
  ) => void;
  readonly onMucusPluggingResponse?: (
    action: 'support-mucus-plugging-and-call-help' | 'review-mucus-plugging-indicators'
      | 'record-indicated-airway-suction-intent' | 'reassess-mucus-plugging-response'
      | 'escalate-persistent-mucus-plugging',
  ) => void;
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
) {
  const injected = new Set(injectedCrisisIds);
  return {
    hasAnaphylaxisResponse: injected.has('anaphylaxis')
      || scenario.timeline.some((event) => event.type === 'anaphylaxis'),
    hasHypermetabolicResponse: injected.has('malignant-hyperthermia')
      || scenario.timeline.some((event) => event.type === 'malignant-hyperthermia'),
    hasLastResponse: injected.has('local-anesthetic-systemic-toxicity')
      || scenario.timeline.some((event) => event.type === 'local-anesthetic-toxicity'),
    hasCardiacArrestResponse: injected.has('cardiac-arrest-shockable')
      || injected.has('cardiac-arrest-non-shockable')
      || scenario.timeline.some((event) => event.type === 'rhythm-change'
        && ['ventricular-fibrillation', 'asystole', 'pea'].includes(event.target ?? '')),
    hasHighSpinalResponse: injected.has('high-spinal')
      || scenario.timeline.some((event) => event.type === 'high-spinal'),
    hasPreeclampsiaResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'persistent-severe-preeclampsia',
    ),
    hasVenousAirEmbolismResponse: injected.has('air-embolism')
      || scenario.timeline.some((event) => event.type === 'venous-air-embolism'),
    hasPneumothoraxResponse: scenario.timeline.some(
      (event) => event.type === 'tension-pneumothorax',
    ),
    hasAspirationRiskResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'aspiration-risk-recognition',
    ),
    hasEmergenceResidualBlockResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'emergence-residual-blockade',
    ),
    hasDelayedEmergenceResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'delayed-emergence-differential',
    ),
    hasExtubationReadinessResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'extubation-readiness',
    ),
    hasCiedPlanningResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'cied-cautery-planning',
    ),
    hasPostoperativeHandoffResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'postoperative-handoff',
    ),
    hasUndifferentiatedShockResponse: scenario.timeline.some(
      (event) => event.type === 'shock-pattern',
    ),
    hasSepticShockResponse: scenario.timeline.some(
      (event) => event.type === 'sepsis-pattern',
    ),
    hasHemorrhagicShockResponse: scenario.timeline.some(
      (event) => event.type === 'hemorrhagic-shock-pattern',
    ),
    hasCardiacTamponadeResponse: scenario.timeline.some(
      (event) => event.type === 'cardiac-tamponade',
    ),
    hasEmergencyAnaphylaxisResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'emergency-anaphylaxis',
    ),
    hasAdultAsthmaResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'adult-asthma',
    ),
    hasCopdExacerbationResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'copd-exacerbation',
    ),
    hasAcutePulmonaryEdemaResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'acute-pulmonary-edema',
    ),
    hasPulmonaryEmbolismResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'pulmonary-embolism-deterioration',
    ),
    hasStemiResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'stemi',
    ),
    hasUnstableNarrowTachycardiaResponse: scenario.timeline.some(
      (event) => event.type === 'narrative'
        && event.target === 'unstable-narrow-complex-tachycardia',
    ),
    hasUnstableBradycardiaResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'unstable-bradycardia',
    ),
    hasStatusEpilepticusResponse: scenario.timeline.some(
      (event) => event.type === 'status-epilepticus',
    ),
    hasAcuteIschemicStrokeResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'acute-ischemic-stroke',
    ),
    hasIntracranialHemorrhageResponse: scenario.timeline.some(
      (event) => event.type === 'narrative'
        && event.target === 'intracranial-hemorrhage-deterioration',
    ),
    hasDiabeticKetoacidosisResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'diabetic-ketoacidosis',
    ),
    hasHyperkalemiaResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'hyperkalemia-with-ecg-change',
    ),
    hasSevereHyponatremiaResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'severe-hyponatremia-with-seizure',
    ),
    hasOpioidToxicityResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'opioid-toxicity',
    ),
    hasHeatStrokeResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'exertional-heat-stroke',
    ),
    hasTraumaPrimarySurveyResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'trauma-primary-survey',
    ),
    hasAcuteAorticSyndromeResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'acute-aortic-syndrome',
    ),
    hasArdsLungProtectiveResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'ards-lung-protective-ventilation',
    ),
    hasEscalatingHypoxemiaResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'escalating-hypoxemia',
    ),
    hasVentilatorDyssynchronyResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'ventilator-dyssynchrony',
    ),
    hasAutoPeepResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'auto-peep',
    ),
    hasMucusPluggingResponse: scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'mucus-plugging',
    ),
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
  } = crisisResponseAvailability(props.scenario, props.injectedCrisisIds);
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
    || hasMucusPluggingResponse;
  const focusedArrestScenario = props.scenario.formulary.length === 0
    && props.scenario.timeline.some((event) => event.type === 'rhythm-change'
      && ['ventricular-fibrillation', 'pea'].includes(event.target ?? ''));
  const focusedPeaScenario = props.scenario.formulary.length === 0
    && props.scenario.timeline.some((event) => event.type === 'rhythm-change'
      && event.target === 'pea');
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
    || hasVentilatorDyssynchronyResponse || hasAutoPeepResponse || hasMucusPluggingResponse;
  const responseTray = hasMucusPluggingResponse
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
            {hasAspirationRiskResponse && (
              <AspirationRiskTray
                assessment={props.resuscitation.aspirationRiskAssessment}
                onAction={props.onAspirationRiskAssessment ?? (() => {})}
              />
            )}
            {hasCiedPlanningResponse && (
              <CiedPlanningTray
                assessment={props.resuscitation.ciedPlanningAssessment}
                onAction={props.onCiedPlanningAssessment ?? (() => {})}
              />
            )}
            {hasPostoperativeHandoffResponse && (
              <PostoperativeHandoffTray
                assessment={props.resuscitation.postoperativeHandoffAssessment}
                onAction={props.onPostoperativeHandoffAssessment ?? (() => {})}
              />
            )}
            {hasUndifferentiatedShockResponse && (
              <UndifferentiatedShockTray
                assessment={props.resuscitation.undifferentiatedShockAssessment}
                onAction={props.onUndifferentiatedShockAssessment ?? (() => {})}
              />
            )}
            {hasSepticShockResponse && (
              <SepticShockTray
                assessment={props.resuscitation.septicShockAssessment}
                onAction={props.onSepticShockAssessment ?? (() => {})}
              />
            )}
            {hasHemorrhagicShockResponse && (
              <HemorrhagicShockTray
                assessment={props.resuscitation.hemorrhagicShockAssessment}
                onAction={props.onHemorrhagicShockAssessment ?? (() => {})}
              />
            )}
            {hasCardiacTamponadeResponse && (
              <CardiacTamponadeTray
                fraction={props.resuscitation.cardiacTamponadeFraction ?? 0}
                assessment={props.resuscitation.cardiacTamponadeAssessment}
                onAction={props.onCardiacTamponadeAssessment ?? (() => {})}
              />
            )}
            {hasEmergencyAnaphylaxisResponse && (
              <EmergencyAnaphylaxisTray
                assessment={props.resuscitation.emergencyAnaphylaxisAssessment}
                onAction={props.onEmergencyAnaphylaxisResponse ?? (() => {})}
              />
            )}
            {hasAdultAsthmaResponse && (
              <AdultAsthmaTray
                assessment={props.resuscitation.adultAsthmaAssessment}
                onAction={props.onAdultAsthmaResponse ?? (() => {})}
              />
            )}
            {hasCopdExacerbationResponse && (
              <CopdExacerbationTray
                assessment={props.resuscitation.copdExacerbationAssessment}
                onAction={props.onCopdExacerbationResponse ?? (() => {})}
              />
            )}
            {hasAcutePulmonaryEdemaResponse && (
              <AcutePulmonaryEdemaTray
                assessment={props.resuscitation.acutePulmonaryEdemaAssessment}
                onAction={props.onAcutePulmonaryEdemaResponse ?? (() => {})}
              />
            )}
            {hasPulmonaryEmbolismResponse && (
              <PulmonaryEmbolismTray
                assessment={props.resuscitation.pulmonaryEmbolismAssessment}
                onAction={props.onPulmonaryEmbolismResponse ?? (() => {})}
              />
            )}
            {hasStemiResponse && (
              <StemiTray assessment={props.resuscitation.stemiAssessment}
                onAction={props.onStemiResponse ?? (() => {})} />
            )}
            {hasUnstableNarrowTachycardiaResponse && (
              <UnstableNarrowTachycardiaTray
                assessment={props.resuscitation.unstableNarrowTachycardiaAssessment}
                onAction={props.onUnstableNarrowTachycardiaResponse ?? (() => {})} />
            )}
            {hasUnstableBradycardiaResponse && (
              <UnstableBradycardiaTray assessment={props.resuscitation.unstableBradycardiaAssessment}
                onAction={props.onUnstableBradycardiaResponse ?? (() => {})} />
            )}
            {hasStatusEpilepticusResponse && (
              <StatusEpilepticusTray
                assessment={props.resuscitation.statusEpilepticusAssessment}
                seizureActivityFraction={props.resuscitation.seizureActivityFraction ?? 0}
                onAction={props.onStatusEpilepticusResponse ?? (() => {})} />
            )}
            {hasAcuteIschemicStrokeResponse && (
              <AcuteIschemicStrokeTray
                assessment={props.resuscitation.acuteIschemicStrokeAssessment}
                onAction={props.onAcuteIschemicStrokeResponse ?? (() => {})} />
            )}
            {hasIntracranialHemorrhageResponse && (
              <IntracranialHemorrhageTray
                assessment={props.resuscitation.intracranialHemorrhageAssessment}
                onAction={props.onIntracranialHemorrhageResponse ?? (() => {})} />
            )}
            {hasDiabeticKetoacidosisResponse && (
              <DiabeticKetoacidosisTray
                assessment={props.resuscitation.diabeticKetoacidosisAssessment}
                onAction={props.onDiabeticKetoacidosisResponse ?? (() => {})} />
            )}
            {hasHyperkalemiaResponse && (
              <HyperkalemiaTray assessment={props.resuscitation.hyperkalemiaAssessment}
                onAction={props.onHyperkalemiaResponse ?? (() => {})} />
            )}
            {hasSevereHyponatremiaResponse && (
              <HyponatremiaTray assessment={props.resuscitation.hyponatremiaAssessment}
                onAction={props.onHyponatremiaResponse ?? (() => {})} />
            )}
            {hasOpioidToxicityResponse && (
              <OpioidToxicityTray assessment={props.resuscitation.opioidToxicityAssessment}
                onAction={props.onOpioidToxicityResponse ?? (() => {})} />
            )}
            {hasHeatStrokeResponse && (
              <HeatStrokeTray assessment={props.resuscitation.heatStrokeAssessment}
                onAction={props.onHeatStrokeResponse ?? (() => {})} />
            )}
            {hasTraumaPrimarySurveyResponse && (
              <TraumaPrimarySurveyTray assessment={props.resuscitation.traumaPrimarySurveyAssessment}
                onAction={props.onTraumaPrimarySurveyResponse ?? (() => {})} />
            )}
            {hasAcuteAorticSyndromeResponse && (
              <AcuteAorticSyndromeTray assessment={props.resuscitation.acuteAorticSyndromeAssessment}
                onAction={props.onAcuteAorticSyndromeResponse ?? (() => {})} />
            )}
            {hasArdsLungProtectiveResponse && (
              <ArdsLungProtectiveTray assessment={props.resuscitation.ardsLungProtectiveAssessment}
                onAction={props.onArdsLungProtectiveResponse ?? (() => {})} />
            )}
            {hasEscalatingHypoxemiaResponse && (
              <EscalatingHypoxemiaTray
                assessment={props.resuscitation.escalatingHypoxemiaAssessment}
                onAction={props.onEscalatingHypoxemiaResponse ?? (() => {})} />
            )}
            {hasVentilatorDyssynchronyResponse && (
              <VentilatorDyssynchronyTray
                assessment={props.resuscitation.ventilatorDyssynchronyAssessment}
                onAction={props.onVentilatorDyssynchronyResponse ?? (() => {})} />
            )}
            {hasAutoPeepResponse && (
              <AutoPeepTray assessment={props.resuscitation.autoPeepAssessment}
                onAction={props.onAutoPeepResponse ?? (() => {})} />
            )}
            {hasMucusPluggingResponse && (
              <MucusPluggingTray assessment={props.resuscitation.mucusPluggingAssessment}
                onAction={props.onMucusPluggingResponse ?? (() => {})} />
            )}
            {hasEmergenceResidualBlockResponse && (
              <EmergenceResidualBlockTray
                assessment={props.resuscitation.emergenceResidualBlockAssessment}
                trainOfFourCount={props.trainOfFourCount ?? 4}
                trainOfFourRatio={props.trainOfFourRatio ?? 1}
                onAction={props.onEmergenceResidualBlockAssessment ?? (() => {})}
              />
            )}
            {hasDelayedEmergenceResponse && (
              <DelayedEmergenceTray
                assessment={props.resuscitation.delayedEmergenceAssessment}
                onAction={props.onDelayedEmergenceAssessment ?? (() => {})}
              />
            )}
            {hasExtubationReadinessResponse && (
              <ExtubationReadinessTray
                assessment={props.resuscitation.extubationReadinessAssessment}
                onAction={props.onExtubationReadinessAssessment ?? (() => {})}
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
  roscAtTick, shockable, onCompressions, onEpinephrine, onDefibrillation,
}: {
  active: boolean;
  compressionsActive: boolean;
  compressionSeconds: number;
  epinephrineTotalMg: number;
  shockCount: number;
  lastEnergyJ: number | null;
  roscAtTick: number | null;
  shockable: boolean;
  onCompressions: (active: boolean) => void;
  onEpinephrine: () => void;
  onDefibrillation: (energyJ: number) => void;
}) {
  const [pending, setPending] = useState<'epinephrine' | number | null>(null);
  const energies = [120, 150, 200];
  return (
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
          onClick={() => onCompressions(!compressionsActive)}>
          {compressionsActive ? 'Pause compressions' : 'Start compressions'}
        </Button>
        <p className="field__hint">Depth, recoil, interruptions, fatigue, and physical skill are not modeled.</p>
      </section>
      <section className="syringe">
        <div className="syringe__name">Cardiac-arrest epinephrine</div>
        <div className="syringe__meta">1 mg IV · bounded adult action</div>
        <p className="syringe__remaining" role="status">Accepted total: {epinephrineTotalMg.toFixed(0)} mg</p>
        {pending !== 'epinephrine' ? (
          <Button disabled={!active || epinephrineTotalMg > 0} onClick={() => setPending('epinephrine')}>Prepare 1 mg IV</Button>
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
              onClick={() => setPending(energy)}>{energy} J</Button>)}
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
  onCallForHelp, onAction, onOxygen,
}: {
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
  );
}

function AspirationRiskTray({
  assessment, onAction,
}: {
  assessment?: {
    readonly cuesReviewedAtTick: number | null;
    readonly classification: 'elevated' | 'routine' | null;
    readonly classifiedAtTick: number | null;
    readonly plan: 'defer-and-replan' | 'proceed-routine' | null;
    readonly planAtTick: number | null;
  };
  onAction: (
    action: 'review-cues' | 'classify-elevated' | 'classify-routine'
      | 'defer-and-replan' | 'proceed-routine',
  ) => void;
}) {
  const [pendingPlan, setPendingPlan] = useState<'defer-and-replan' | 'proceed-routine' | null>(null);
  const reviewed = assessment?.cuesReviewedAtTick !== null
    && assessment?.cuesReviewedAtTick !== undefined;
  const classification = assessment?.classification ?? null;
  const plan = assessment?.plan ?? null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="aspiration-cues-title">
        <div id="aspiration-cues-title" className="syringe__name">Read the whole pattern</div>
        <Badge kind="teaching">Focused vignette</Badge>
        <div className="syringe__meta">Medication phase · symptoms · fasting · urgency</div>
        <p className="syringe__remaining" role="status">
          {reviewed
            ? 'Week 3 escalation · dose increased 3 days ago · nausea + bloating · fasted 10 h/2 h · elective case'
            : 'Combined cue review pending'}
        </p>
        <Button className="crisis-drug__action" disabled={reviewed}
          onClick={() => onAction('review-cues')}>Review aspiration-risk cues</Button>
        <p className="field__hint">
          This case asks whether ordinary fasting instructions settle the question for this patient.
          It does not estimate gastric volume or teach ultrasound.
        </p>
      </section>
      <section className="syringe" aria-labelledby="aspiration-decision-title">
        <div id="aspiration-decision-title" className="syringe__name">Classify, then choose</div>
        <div className="syringe__meta">One classification · one disposition</div>
        <p className="syringe__remaining" role="status">
          {plan === 'defer-and-replan' ? 'Elective deferral + shared replanning recorded'
            : plan === 'proceed-routine' ? 'Routine same-day progression recorded'
              : classification === 'elevated' ? 'Elevated risk classified · disposition pending'
                : classification === 'routine' ? 'Routine fasting risk classified · disposition pending'
                  : 'Classification pending'}
        </p>
        {classification === null && (
          <div className="syringe__presets">
            <Button className="crisis-drug__action" disabled={!reviewed}
              onClick={() => onAction('classify-elevated')}>Elevated delayed-emptying risk</Button>
            <Button className="crisis-drug__action" disabled={!reviewed}
              onClick={() => onAction('classify-routine')}>Routine fasting risk</Button>
          </div>
        )}
        {classification !== null && plan === null && pendingPlan === null && (
          <div className="syringe__presets">
            <Button className="crisis-drug__action"
              onClick={() => setPendingPlan('defer-and-replan')}>Defer elective case</Button>
            <Button className="crisis-drug__action"
              onClick={() => setPendingPlan('proceed-routine')}>Proceed routinely today</Button>
          </div>
        )}
        {pendingPlan !== null && (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span>{pendingPlan === 'defer-and-replan'
              ? 'Record elective deferral and shared replanning?'
              : 'Record routine same-day progression?'}</span>
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
          The patient-specific choice is not a universal GLP-1 medication rule. Shared decision-making,
          future preparation, gastric assessment, and anesthetic technique remain outside this screen.
        </p>
      </section>
    </div>
  );
}

function CiedPlanningTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['ciedPlanningAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onCiedPlanningAssessment']>;
}) {
  const deviceReviewed = assessment?.deviceRecordReviewedAtTick != null;
  const procedureReviewed = assessment?.procedureRiskReviewedAtTick != null;
  const plan = assessment?.plan ?? null;
  const restoration = assessment?.backupAndRestorationDocumentedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="cied-facts-title">
        <div id="cied-facts-title" className="syringe__name">Build the device picture</div>
        <Badge kind="teaching">Focused vignette</Badge>
        <div className="syringe__meta">Device · dependence · procedure · interference</div>
        <p className="syringe__remaining" role="status">
          {!deviceReviewed ? 'Device-record review pending'
            : !procedureReviewed ? 'Dual-chamber pacemaker · pacing dependent · documented magnet response'
              : 'Right shoulder · above umbilicus · anticipated monopolar electrosurgery'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={deviceReviewed}
            onClick={() => onAction('review-device-record')}>Review device record</Button>
          <Button className="crisis-drug__action" disabled={procedureReviewed}
            onClick={() => onAction('review-procedure-emi')}>Review procedure + EMI</Button>
        </div>
        <p className="field__hint">No interrogation, programming, magnet effect, cautery technique, or current-path calculation is simulated.</p>
      </section>
      <section className="syringe" aria-labelledby="cied-plan-title">
        <div id="cied-plan-title" className="syringe__name">Coordinate the whole plan</div>
        <div className="syringe__meta">Pacing strategy · backup · restoration</div>
        <p className="syringe__remaining" role="status">
          {restoration ? 'Backup, monitoring, and restoration documented'
            : plan === 'coordinate-asynchronous-pacing' ? 'Coordinated asynchronous pacing plan recorded'
              : plan ? 'Unsafe shortcut recorded for debrief' : 'Plan pending both reviews'}
        </p>
        {plan === null && <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!deviceReviewed || !procedureReviewed}
            onClick={() => onAction('coordinate-asynchronous-pacing')}>Coordinate asynchronous pacing</Button>
          <Button className="crisis-drug__action" disabled={!deviceReviewed || !procedureReviewed}
            onClick={() => onAction('apply-unverified-magnet')}>Apply magnet without confirmation</Button>
          <Button className="crisis-drug__action" disabled={!deviceReviewed || !procedureReviewed}
            onClick={() => onAction('proceed-no-change')}>Proceed with no device change</Button>
        </div>}
        <Button className="crisis-drug__action" disabled={plan === null || restoration}
          onClick={() => onAction('document-backup-and-restoration')}>Document backup + restoration</Button>
        <p className="field__hint">This case supports a patient-specific team plan, never a universal magnet rule or device order.</p>
      </section>
    </div>
  );
}

function PostoperativeHandoffTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['postoperativeHandoffAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onPostoperativeHandoffAssessment']>;
}) {
  const ready = assessment?.receiverReadyAtTick != null;
  const course = assessment?.patientAndCourseAtTick != null;
  const current = assessment?.currentStateAtTick != null;
  const risks = assessment?.risksActionsOwnershipAtTick != null;
  const readback = assessment?.receiverReadbackAtTick != null;
  const accepted = assessment?.transferAcceptedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="handoff-content-title">
        <div id="handoff-content-title" className="syringe__name">Create shared attention</div>
        <Badge kind="teaching">Focused vignette</Badge>
        <div className="syringe__meta">Ready · course · current state</div>
        <p className="syringe__remaining" role="status">
          {!ready ? 'Receiver and monitoring readiness pending'
            : !course || !current ? 'Receiver ready · critical content incomplete'
              : 'Patient, perioperative course, and current state shared'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={ready}
            onClick={() => onAction('confirm-receiver-readiness')}>Confirm receiver readiness</Button>
          <Button className="crisis-drug__action" disabled={!ready || course}
            onClick={() => onAction('share-patient-and-course')}>Share patient + course</Button>
          <Button className="crisis-drug__action" disabled={!ready || current}
            onClick={() => onAction('share-current-state')}>Share current state</Button>
        </div>
        <p className="field__hint">The content blocks are fixed. Voice, interruptions, nonverbal behavior, workload, and bedside examination are not scored.</p>
      </section>
      <section className="syringe" aria-labelledby="handoff-closure-title">
        <div id="handoff-closure-title" className="syringe__name">Close the loop</div>
        <div className="syringe__meta">Risk · timing · ownership · synthesis</div>
        <p className="syringe__remaining" role="status">
          {accepted ? 'Transfer acknowledged + accepted'
            : readback ? 'Receiver synthesis recorded · acceptance pending'
              : risks ? 'Risks, actions, timing, and ownership shared'
                : 'Unresolved-risk ownership pending core content'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!course || !current || risks}
            onClick={() => onAction('share-risks-actions-ownership')}>Share risks + ownership</Button>
          <Button className="crisis-drug__action" disabled={!risks || readback}
            onClick={() => onAction('receiver-readback')}>Record receiver synthesis</Button>
          <Button className="crisis-drug__action" disabled={!readback || accepted}
            onClick={() => onAction('accept-transfer')}>Acknowledge + accept transfer</Button>
        </div>
        <p className="field__hint">Responsibility changes only after explicit acknowledgment here. This is a teaching-state transition, not a real clinical transfer.</p>
      </section>
    </div>
  );
}

function UndifferentiatedShockTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['undifferentiatedShockAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onUndifferentiatedShockAssessment']>;
}) {
  const perfusion = assessment?.perfusionReviewedAtTick != null;
  const lactate = assessment?.lactateReviewedAtTick != null;
  const echo = assessment?.focusedEchoReviewedAtTick != null;
  const plr = assessment?.passiveLegRaiseAtTick != null;
  const fluid = assessment?.fluidChallengeAtTick != null;
  const reassessed = assessment?.perfusionReassessedAtTick != null;
  const escalated = assessment?.escalationAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="shock-evidence-title">
        <div id="shock-evidence-title" className="syringe__name">Build the perfusion picture</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Skin · brain · kidney · lactate · heart</div>
        <p className="syringe__remaining" role="status">
          {echo ? 'Whole-patient evidence + focused cardiac phenotype reviewed'
            : perfusion && lactate ? 'Perfusion and lactate reviewed · cardiac phenotype pending'
              : 'Serial tissue-perfusion evidence pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={perfusion}
            onClick={() => onAction('review-perfusion')}>Review tissue perfusion</Button>
          <Button className="crisis-drug__action" disabled={lactate}
            onClick={() => onAction('review-lactate')}>Review fixed lactate</Button>
          <Button className="crisis-drug__action" disabled={!perfusion || !lactate || echo}
            onClick={() => onAction('review-focused-echo')}>Review focused cardiac findings</Button>
        </div>
        <p className="field__hint">These are authored findings. The screen does not perform an examination, acquire ultrasound, draw blood, or diagnose the shock cause.</p>
      </section>
      <section className="syringe" aria-labelledby="shock-response-title">
        <div id="shock-response-title" className="syringe__name">Test, act, reassess</div>
        <div className="syringe__meta">Dynamic response · 500 mL · same markers</div>
        <p className="syringe__remaining" role="status">
          {escalated ? 'Serial reassessment complete · ongoing shock escalated'
            : reassessed ? 'Perfusion reassessed · escalation pending'
              : fluid ? 'Bounded challenge delivered · reassessment pending'
                : plr ? 'Positive authored dynamic response reviewed'
                  : 'Dynamic fluid-responsiveness evidence pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!echo || plr}
            onClick={() => onAction('perform-passive-leg-raise')}>Review passive-leg-raise response</Button>
          <Button className="crisis-drug__action" disabled={!plr || fluid}
            onClick={() => onAction('give-targeted-fluid-challenge')}>Give bounded 500 mL challenge</Button>
          <Button className="crisis-drug__action" disabled={!fluid || reassessed}
            onClick={() => onAction('reassess-perfusion')}>Reassess tissue perfusion</Button>
          <Button className="crisis-drug__action" disabled={!reassessed || escalated}
            onClick={() => onAction('escalate-after-reassessment')}>Escalate ongoing shock workup</Button>
        </div>
        <p className="field__hint">No liberal repeat-fluid shortcut is offered. Etiologic treatment, vasopressors, procedures, and disposition remain outside this first slice.</p>
      </section>
    </div>
  );
}

function SepticShockTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['septicShockAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onSepticShockAssessment']>;
}) {
  const recognized = assessment?.infectionAndOrganDysfunctionReviewedAtTick != null;
  const diagnostics = assessment?.culturesAndLactateAtTick != null;
  const antimicrobials = assessment?.antimicrobialIntentAtTick != null;
  const fluid = assessment?.initialCrystalloidAtTick != null;
  const reassessed = assessment?.postFluidReassessmentAtTick != null;
  const norepinephrine = assessment?.norepinephrineIntentAtTick != null;
  const escalated = assessment?.sourceControlEscalationAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="sepsis-recognition-title">
        <div id="sepsis-recognition-title" className="syringe__name">Recognize and treat infection</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Source clues · organ dysfunction · cultures · lactate</div>
        <p className="syringe__remaining" role="status">
          {antimicrobials ? 'Immediate empiric antimicrobial intent recorded'
            : diagnostics ? 'Diagnostics recorded · do not wait for results'
              : recognized ? 'Probable infection + organ dysfunction recognized'
                : 'Parallel recognition and treatment pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            onClick={() => onAction('review-infection-and-organ-dysfunction')}>
            Review infection + organ dysfunction
          </Button>
          <Button className="crisis-drug__action" disabled={!recognized || diagnostics}
            onClick={() => onAction('obtain-cultures-and-lactate')}>
            Record cultures + lactate
          </Button>
          <Button className="crisis-drug__action" disabled={!diagnostics || antimicrobials}
            onClick={() => onAction('record-immediate-antimicrobial-intent')}>
            Record immediate antimicrobial intent
          </Button>
        </div>
        <p className="field__hint">These controls record authored intent. They do not collect a specimen, select a drug, or simulate antimicrobial delivery.</p>
      </section>
      <section className="syringe" aria-labelledby="sepsis-resuscitation-title">
        <div id="sepsis-resuscitation-title" className="syringe__name">Resuscitate, reassess, escalate</div>
        <div className="syringe__meta">30 mL/kg · persistent shock · MAP 65 · source control</div>
        <p className="syringe__remaining" role="status">
          {escalated && norepinephrine ? 'Initial sequence closed · parallel support escalated'
            : escalated ? 'Source-control escalation active · support shock in parallel'
            : norepinephrine ? 'First-line vasopressor intent recorded'
              : reassessed ? 'Persistent shock recognized after initial fluid'
                : fluid ? 'Initial crystalloid course started · reassess next'
                  : 'Initial hemodynamic response pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!recognized || fluid}
            onClick={() => onAction('begin-initial-crystalloid')}>
            Begin fixed 2,100 mL crystalloid course
          </Button>
          <Button className="crisis-drug__action" disabled={!fluid || reassessed}
            onClick={() => onAction('reassess-after-initial-fluid')}>
            Reassess after initial fluid
          </Button>
          <Button className="crisis-drug__action" disabled={!reassessed || norepinephrine}
            onClick={() => onAction('start-norepinephrine-intent')}>
            Record norepinephrine intent · MAP 65
          </Button>
          <Button className="crisis-drug__action" disabled={!recognized || escalated}
            onClick={() => onAction('escalate-source-control')}>
            Escalate source control + critical care
          </Button>
        </div>
        <p className="field__hint">No antimicrobial choice, vasopressor dose, procedure, liberal repeat-fluid shortcut, or outcome is offered.</p>
      </section>
    </div>
  );
}

function HemorrhagicShockTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['hemorrhagicShockAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onHemorrhagicShockAssessment']>;
}) {
  const recognized = assessment?.mechanismAndPerfusionReviewedAtTick != null;
  const stabilized = assessment?.pelvicStabilizationAtTick != null;
  const activated = assessment?.majorHemorrhageActivatedAtTick != null;
  const redCells = assessment?.redCellsAtTick != null;
  const monitoring = assessment?.coagulationAndTemperatureAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const definitiveControl = assessment?.definitiveControlEscalatedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="trauma-control-title">
        <div id="trauma-control-title" className="syringe__name">Recognize and control</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Mechanism · pelvis · perfusion · immediate control</div>
        <p className="syringe__remaining" role="status">
          {definitiveControl ? 'Definitive bleeding-control escalation recorded'
            : stabilized ? 'Pelvic stabilization recorded · escalate without delay'
              : recognized ? 'Concealed traumatic hemorrhage recognized'
                : 'Mechanism, injury pattern, and perfusion review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recognized}
            onClick={() => onAction('review-mechanism-and-perfusion')}>
            Review mechanism + perfusion
          </Button>
          <Button className="crisis-drug__action" disabled={!recognized || stabilized}
            onClick={() => onAction('record-pelvic-stabilization')}>
            Record pelvic stabilization
          </Button>
          <Button className="crisis-drug__action" disabled={!stabilized || definitiveControl}
            onClick={() => onAction('escalate-definitive-bleeding-control')}>
            Escalate definitive bleeding control
          </Button>
        </div>
        <p className="field__hint">These controls record intent. They do not place a device, choose a procedure, stop bleeding, or predict outcome.</p>
      </section>
      <section className="syringe" aria-labelledby="trauma-resuscitation-title">
        <div id="trauma-resuscitation-title" className="syringe__name">Resuscitate and reassess</div>
        <div className="syringe__meta">Major hemorrhage · 2 red-cell units · coagulation · temperature</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Serial perfusion reassessment recorded'
            : redCells && monitoring ? 'Bridge + monitoring complete · reassess next'
              : activated ? 'Major-hemorrhage response active · parallel tasks open'
                : 'Bounded resuscitation bridge pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!recognized || activated}
            onClick={() => onAction('activate-major-hemorrhage')}>
            Activate major-hemorrhage response
          </Button>
          <Button className="crisis-drug__action" disabled={!activated || redCells}
            onClick={() => onAction('give-two-red-cell-units')}>
            Give fixed 2-unit red-cell bridge
          </Button>
          <Button className="crisis-drug__action" disabled={!activated || monitoring}
            onClick={() => onAction('review-coagulation-and-temperature')}>
            Review coagulation + temperature
          </Button>
          <Button className="crisis-drug__action" disabled={!redCells || !monitoring || reassessed}
            onClick={() => onAction('reassess-perfusion')}>
            Reassess perfusion
          </Button>
        </div>
        <p className="field__hint">No TXA, calcium, component ratio, procedure, local protocol, repeat transfusion, or outcome is offered.</p>
      </section>
    </div>
  );
}

function CardiacTamponadeTray({ fraction, assessment, onAction }: {
  fraction: number;
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['cardiacTamponadeAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onCardiacTamponadeAssessment']>;
}) {
  const reviewed = assessment?.contextReviewedAtTick != null;
  const pocus = assessment?.pocusReviewedAtTick != null;
  const control = assessment?.definitiveControlAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="tamponade-recognition-title">
        <div id="tamponade-recognition-title" className="syringe__name">Recognize obstructed filling</div>
        <Badge kind="teaching">Fixed trauma vignette</Badge>
        <div className="syringe__meta">Mechanism · perfusion · bilateral breathing · POCUS</div>
        <p className="syringe__remaining" role="status">
          {pocus ? 'Fixed pericardial finding reviewed'
            : reviewed ? 'Whole-patient pattern reviewed · focused finding next'
              : `Modeled obstructive burden ${(fraction * 100).toFixed(0)}%`}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-context-and-perfusion')}>
            Review context + perfusion
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || pocus}
            onClick={() => onAction('review-fixed-pocus')}>
            Review fixed POCUS finding
          </Button>
        </div>
        <p className="field__hint">The interface reveals authored findings. It does not acquire images, teach views, or establish diagnostic competence.</p>
      </section>
      <section className="syringe" aria-labelledby="tamponade-control-title">
        <div id="tamponade-control-title" className="syringe__name">Escalate definitive control</div>
        <div className="syringe__meta">Immediate team transfer · intent only · reassess</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Post-intent perfusion reassessed'
            : control ? 'Definitive-control intent recorded · reassess next'
              : 'Obstructive shock continues'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!pocus || control}
            onClick={() => onAction('record-definitive-control-intent')}>
            Record immediate definitive-control intent
          </Button>
          <Button className="crisis-drug__action" disabled={!control || reassessed}
            onClick={() => onAction('reassess-perfusion')}>
            Reassess perfusion
          </Button>
        </div>
        <p className="field__hint">No pericardiocentesis or thoracotomy technique, equipment, transport, technical success, complication, or outcome is offered.</p>
      </section>
    </div>
  );
}

function EmergencyAnaphylaxisTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['emergencyAnaphylaxisAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onEmergencyAnaphylaxisResponse']>;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const positioned = assessment?.positionedAndHelpedAtTick != null;
  const epinephrine = assessment?.imEpinephrineAtTick != null;
  const oxygen = assessment?.oxygenAtTick != null;
  const fluid = assessment?.crystalloidAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="ed-anaphylaxis-recognition-title">
        <div id="ed-anaphylaxis-recognition-title" className="syringe__name">Recognize and lead</div>
        <Badge kind="teaching">Fixed community vignette</Badge>
        <div className="syringe__meta">Airway · breathing · circulation · exposure</div>
        <p className="syringe__remaining" role="status">
          {epinephrine ? 'First-line IM epinephrine recorded'
            : positioned ? 'Support mobilized · first-line treatment next'
              : reviewed ? 'Systemic pattern reviewed · lead the response'
                : 'Abrupt multisystem deterioration'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-systemic-pattern')}>
            Review systemic pattern
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || positioned}
            onClick={() => onAction('position-and-call-for-help')}>
            Position + call for help
          </Button>
          <Button className="crisis-drug__action" disabled={!positioned || epinephrine}
            onClick={() => onAction('give-im-epinephrine')}>
            Give 500 µg epinephrine IM
          </Button>
        </div>
        <p className="field__hint">This is a fixed adult first-line action, not a dosing calculator or injection-technique trainer. IV bolus epinephrine is not offered.</p>
      </section>
      <section className="syringe" aria-labelledby="ed-anaphylaxis-support-title">
        <div id="ed-anaphylaxis-support-title" className="syringe__name">Support and reassess</div>
        <div className="syringe__meta">Oxygen · isotonic crystalloid · serial review</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Initial response reassessed'
            : oxygen && fluid ? 'Parallel support recorded · reassess next'
              : epinephrine ? 'First-line treatment recorded · parallel support open'
                : 'First-line treatment pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!epinephrine || oxygen}
            onClick={() => onAction('give-high-flow-oxygen')}>
            Record high-flow oxygen
          </Button>
          <Button className="crisis-drug__action" disabled={!epinephrine || fluid}
            onClick={() => onAction('begin-fixed-crystalloid')}>
            Begin fixed 1,500 mL crystalloid
          </Button>
          <Button className="crisis-drug__action" disabled={!oxygen || !fluid || reassessed}
            onClick={() => onAction('reassess-response')}>
            Reassess airway + perfusion
          </Button>
        </div>
        <p className="field__hint">No repeat-dose clock, refractory infusion, bronchodilator, antihistamine, steroid, airway procedure, observation, discharge, referral, or outcome is offered.</p>
      </section>
    </div>
  );
}

function AdultAsthmaTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['adultAsthmaAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onAdultAsthmaResponse']>;
}) {
  const reviewed = assessment?.severityReviewedAtTick != null;
  const oxygen = assessment?.controlledOxygenAtTick != null;
  const bronchodilators = assessment?.bronchodilatorBundleAtTick != null;
  const corticosteroid = assessment?.corticosteroidIntentAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="adult-asthma-assessment-title">
        <div id="adult-asthma-assessment-title" className="syringe__name">Read severity, not wheeze alone</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Speech · work · SpO₂ · PEF · immediate mimics</div>
        <p className="syringe__remaining" role="status">
          {oxygen ? 'Controlled oxygen target recorded'
            : reviewed ? 'Severe pattern reviewed · initial treatment open'
              : 'Whole-patient severity review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-severity-and-mimics')}>
            Review severity + immediate mimics
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || oxygen}
            onClick={() => onAction('record-controlled-oxygen')}>
            Target controlled oxygen · 92–95%
          </Button>
        </div>
        <p className="field__hint">Findings and peak flow are authored. The screen does not perform examination, spirometry, blood gas, imaging, or differential diagnosis.</p>
      </section>
      <section className="syringe" aria-labelledby="adult-asthma-treatment-title">
        <div id="adult-asthma-treatment-title" className="syringe__name">Treat, then look again</div>
        <div className="syringe__meta">Conservative inhaled bundle · early anti-inflammatory intent</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Initial response reassessed · repeat PEF 55%'
            : bronchodilators && corticosteroid ? 'Initial treatment complete · reassess next'
              : reviewed ? 'Parallel initial treatment open' : 'Severity review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!reviewed || bronchodilators}
            onClick={() => onAction('give-fixed-inhaled-bronchodilators')}>
            Give fixed pMDI + spacer bundle
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || corticosteroid}
            onClick={() => onAction('record-early-corticosteroid-intent')}>
            Record early corticosteroid intent
          </Button>
          <Button className="crisis-drug__action"
            disabled={!oxygen || !bronchodilators || !corticosteroid || reassessed}
            onClick={() => onAction('reassess-after-initial-treatment')}>
            Reassess symptoms + PEF
          </Button>
        </div>
        <p className="field__hint">No inhaler technique, individualized dose, repeat cycle, toxicity, magnesium, ventilatory support, disposition, discharge prescription, or prevention plan is offered.</p>
      </section>
    </div>
  );
}

function CopdExacerbationTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['copdExacerbationAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onCopdExacerbationResponse']>;
}) {
  const reviewed = assessment?.severityReviewedAtTick != null;
  const oxygen = assessment?.controlledOxygenAtTick != null;
  const bronchodilators = assessment?.bronchodilatorBundleAtTick != null;
  const corticosteroid = assessment?.corticosteroidIntentAtTick != null;
  const antibiotic = assessment?.antibioticIntentAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="copd-assessment-title">
        <div id="copd-assessment-title" className="syringe__name">Read the whole respiratory story</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Symptoms · work · SpO₂ · sputum · blood gas · mimics</div>
        <p className="syringe__remaining" role="status">
          {oxygen ? 'Controlled oxygen target recorded'
            : reviewed ? 'Moderate pattern reviewed · initial treatment open'
              : 'Severity and blood-gas review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-severity-and-mimics')}>
            Review severity + blood gas + mimics
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || oxygen}
            onClick={() => onAction('record-controlled-oxygen')}>
            Target controlled oxygen · 88–92%
          </Button>
        </div>
        <p className="field__hint">Findings and blood gases are authored. The screen does not perform examination, sampling, imaging, ECG, microbiology, or differential diagnosis.</p>
      </section>
      <section className="syringe" aria-labelledby="copd-treatment-title">
        <div id="copd-treatment-title" className="syringe__name">Open the airways, then look again</div>
        <div className="syringe__meta">Air-driven inhaled intent · short anti-inflammatory course · indication check</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Initial response reassessed · repeat pH 7.38'
            : bronchodilators && corticosteroid && antibiotic
              ? 'Initial treatment recorded · reassess next'
              : reviewed ? 'Parallel initial treatment open' : 'Severity review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!reviewed || bronchodilators}
            onClick={() => onAction('give-air-driven-bronchodilators')}>
            Give air-driven SABA + SAMA intent
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || corticosteroid}
            onClick={() => onAction('record-five-day-corticosteroid-intent')}>
            Record 5-day corticosteroid intent
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || antibiotic}
            onClick={() => onAction('record-antibiotic-indication')}>
            Record antibiotic indication · purulence
          </Button>
          <Button className="crisis-drug__action"
            disabled={!oxygen || !bronchodilators || !corticosteroid || !antibiotic || reassessed}
            onClick={() => onAction('reassess-and-review-ventilatory-support')}>
            Reassess blood gas + ventilatory need
          </Button>
        </div>
        <p className="field__hint">No device technique, individualized or repeat dose, toxicity, antibiotic selection, NIV setup, disposition, maintenance plan, or outcome is offered.</p>
      </section>
    </div>
  );
}

function AcutePulmonaryEdemaTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['acutePulmonaryEdemaAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onAcutePulmonaryEdemaResponse']>;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const niv = assessment?.nivAtTick != null;
  const diuretic = assessment?.diureticIntentAtTick != null;
  const vasodilator = assessment?.vasodilatorIntentAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="pulmonary-edema-pattern-title">
        <div id="pulmonary-edema-pattern-title" className="syringe__name">See lungs, pressure, and perfusion together</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Work · SpO₂ · congestion · BP · perfusion · mimics</div>
        <p className="syringe__remaining" role="status">
          {niv ? 'Early positive-pressure support recorded'
            : reviewed ? 'Pulmonary-edema pattern reviewed · support open'
              : 'Whole-patient pattern review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-pattern-mimics-and-precipitants')}>
            Review pattern + mimics + precipitants
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || niv}
            onClick={() => onAction('record-niv-and-titrated-oxygen')}>
            Start NIV + titrated oxygen intent
          </Button>
        </div>
        <p className="field__hint">Findings, ECG, radiograph, and focused ultrasound are authored. The screen does not acquire an examination, test, image, or diagnosis.</p>
      </section>
      <section className="syringe" aria-labelledby="pulmonary-edema-treatment-title">
        <div id="pulmonary-edema-treatment-title" className="syringe__name">Unload, decongest, then re-read the patient</div>
        <div className="syringe__meta">Congestion intent · pressure-safe vasodilation · serial response</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Initial response reassessed · BP 146/86'
            : diuretic && vasodilator ? 'Initial treatment recorded · reassess next'
              : reviewed ? 'Parallel initial treatment open' : 'Pattern review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!reviewed || diuretic}
            onClick={() => onAction('record-loop-diuretic-intent')}>
            Record IV loop-diuretic intent
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || vasodilator}
            onClick={() => onAction('record-vasodilator-intent')}>
            Record IV vasodilator intent · SBP &gt;110
          </Button>
          <Button className="crisis-drug__action"
            disabled={!niv || !diuretic || !vasodilator || reassessed}
            onClick={() => onAction('reassess-breathing-pressure-and-perfusion')}>
            Reassess breathing + BP + perfusion
          </Button>
        </div>
        <p className="field__hint">No NIV technique, drug dose or titration, urine output, precipitant treatment, intubation, shock pathway, disposition, or outcome is offered.</p>
      </section>
    </div>
  );
}

function PulmonaryEmbolismTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['pulmonaryEmbolismAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onPulmonaryEmbolismResponse']>;
}) {
  const reviewed = assessment?.severityReviewedAtTick != null;
  const oxygen = assessment?.oxygenAtTick != null;
  const anticoagulated = assessment?.anticoagulationAtTick != null;
  const deteriorated = assessment?.deteriorationAtTick != null;
  const escalated = assessment?.escalationAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="pe-severity-title">
        <div id="pe-severity-title" className="syringe__name">Read the right ventricle, lungs, and circulation together</div>
        <Badge kind="teaching">Fixed confirmed PE</Badge>
        <div className="syringe__meta">CTPA · RV · biomarkers · RR · SpO₂ · perfusion</div>
        <p className="syringe__remaining" role="status">
          {deteriorated ? 'Deterioration recognized · Category E1'
            : reviewed ? 'Initial Category C3R pattern reviewed' : 'Serial severity review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-confirmed-pe-severity')}>
            Review confirmed PE + severity
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || oxygen}
            onClick={() => onAction('record-titrated-oxygen')}>
            Record titrated oxygen intent
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || anticoagulated}
            onClick={() => onAction('record-therapeutic-anticoagulation-intent')}>
            Record therapeutic anticoagulation intent
          </Button>
        </div>
        <p className="field__hint">Imaging, echocardiography, biomarkers, and category are authored. No live diagnostic or risk calculator is implied.</p>
      </section>
      <section className="syringe" aria-labelledby="pe-deterioration-title">
        <div id="pe-deterioration-title" className="syringe__name">Catch the turn, then bring the whole team</div>
        <div className="syringe__meta">Serial BP · perfusion · PERT · reperfusion strategy</div>
        <p className="syringe__remaining" role="status">
          {escalated ? 'PERT + urgent reperfusion intent recorded'
            : deteriorated ? 'Persistent hypotension + shock · escalate now'
              : oxygen && anticoagulated ? 'Initial response recorded · reassess now'
                : 'Initial response pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action"
            disabled={!oxygen || !anticoagulated || deteriorated}
            onClick={() => onAction('reassess-for-deterioration')}>
            Reassess pressure + perfusion
          </Button>
          <Button className="crisis-drug__action" disabled={!deteriorated || escalated}
            onClick={() => onAction('activate-pert-and-record-reperfusion-intent')}>
            Activate PERT + reperfusion intent
          </Button>
        </div>
        <p className="field__hint">No anticoagulant or reperfusion dose, contraindication decision, airway technique, procedure selection, transfer, disposition, or outcome is offered.</p>
      </section>
    </div>
  );
}

function StemiTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['stemiAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onStemiResponse']>;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const activated = assessment?.pathwayActivatedAtTick != null;
  const aspirin = assessment?.aspirinAtTick != null;
  const antithrombotics = assessment?.additionalAntithromboticsAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="stemi-pattern-title">
        <div id="stemi-pattern-title" className="syringe__name">See the pattern, start the clock</div>
        <Badge kind="teaching">Fixed PCI-capable ED</Badge>
        <div className="syringe__meta">45 min · fixed 12-lead · pressure · perfusion · mimics</div>
        <p className="syringe__remaining" role="status">
          {activated ? 'STEMI pathway + primary PCI intent active'
            : reviewed ? 'Anterior STEMI pattern reviewed · pathway open'
              : 'Time-critical pattern review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-stemi-pattern')}>
            Review symptoms + fixed 12-lead
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || activated}
            onClick={() => onAction('activate-stemi-pathway')}>
            Activate STEMI pathway + primary PCI
          </Button>
        </div>
        <p className="field__hint">The diagnostic 12-lead and PCI-capable setting are authored. The bedside lead-II monitor is not a live 12-lead interpreter.</p>
      </section>
      <section className="syringe" aria-labelledby="stemi-treatment-title">
        <div id="stemi-treatment-title" className="syringe__name">Protect the pathway, then hand off clearly</div>
        <div className="syringe__meta">Aspirin · P2Y12 · anticoagulation · serial complications</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Reassessed + reperfusion handoff recorded · BP 146/92'
            : activated && aspirin && antithrombotics ? 'Immediate sequence complete · reassess now'
              : 'Parallel pathway preparation pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!reviewed || aspirin}
            onClick={() => onAction('record-aspirin-load')}>
            Record aspirin load · 162–325 mg
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || antithrombotics}
            onClick={() => onAction('record-p2y12-anticoagulation-intent')}>
            Record P2Y12 + anticoagulation intent
          </Button>
          <Button className="crisis-drug__action"
            disabled={!activated || !aspirin || !antithrombotics || reassessed}
            onClick={() => onAction('reassess-and-handoff')}>
            Reassess + hand off for reperfusion
          </Button>
        </div>
        <p className="field__hint">SpO₂ is 95%, so routine oxygen is not selected. No agent selection, individualized dose, nitrate or opioid pathway, PCI technique, complication treatment, disposition, or outcome is offered.</p>
      </section>
    </div>
  );
}

function UnstableNarrowTachycardiaTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['unstableNarrowTachycardiaAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onUnstableNarrowTachycardiaResponse']>;
}) {
  const reviewed = assessment?.reviewedAtTick != null;
  const prepared = assessment?.preparedAtTick != null;
  const cardioverted = assessment?.cardiovertedAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="unstable-nct-recognition-title">
        <div id="unstable-nct-recognition-title" className="syringe__name">Read the rhythm through the patient</div>
        <Badge kind="teaching">Fixed unstable NCT</Badge>
        <div className="syringe__meta">188/min · QRS 0.08 s · BP · brain · chest · perfusion</div>
        <p className="syringe__remaining" role="status">
          {prepared ? 'Immediate support + synchronized pads prepared'
            : reviewed ? 'Instability recognized · prepare now'
              : 'Rhythm + whole-patient review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-rhythm-and-instability')}>
            Review rhythm + instability
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || prepared}
            onClick={() => onAction('prepare-synchronized-cardioversion')}>
            Prepare support + synchronized pads
          </Button>
        </div>
        <p className="field__hint">The fixed 12-lead supplies width and regularity. The teaching waveform does not diagnose the atrial mechanism.</p>
      </section>
      <section className="syringe" aria-labelledby="unstable-nct-response-title">
        <div id="unstable-nct-response-title" className="syringe__name">Synchronize, restore, reassess</div>
        <div className="syringe__meta">Sedate if feasible · do not delay · rhythm + perfusion</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Response reassessed · HR 92 · BP 118/72'
            : cardioverted ? 'Synchronized-cardioversion intent recorded · reassess next'
              : prepared ? 'Ready for prompt synchronized intent' : 'Preparation pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!prepared || cardioverted}
            onClick={() => onAction('record-synchronized-cardioversion-intent')}>
            Record synchronized cardioversion intent
          </Button>
          <Button className="crisis-drug__action" disabled={!cardioverted || reassessed}
            onClick={() => onAction('reassess-rhythm-and-perfusion')}>
            Reassess rhythm + whole-patient perfusion
          </Button>
        </div>
        <p className="field__hint">SpO₂ is 94%, so routine oxygen is not selected. No energy, sedation drug, device operation, shock technique, adenosine, refractory pathway, recurrence, disposition, or outcome is offered.</p>
      </section>
    </div>
  );
}

function UnstableBradycardiaTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['unstableBradycardiaAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onUnstableBradycardiaResponse']>;
}) {
  const reviewed = assessment?.reviewedAtTick != null;
  const supported = assessment?.supportedAtTick != null;
  const atropine = assessment?.atropineAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="unstable-bradycardia-recognition-title">
        <div id="unstable-bradycardia-recognition-title" className="syringe__name">Read the rate through the patient</div>
        <Badge kind="teaching">Fixed unstable bradycardia</Badge>
        <div className="syringe__meta">38/min · palpable pulse · BP · brain · chest · perfusion</div>
        <p className="syringe__remaining" role="status">
          {supported ? 'Airway + oxygen + monitors + pulse + access recorded'
            : reviewed ? 'Compromise recognized · support now'
              : 'Rate + whole-patient review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-bradycardia-and-compromise')}>
            Review bradycardia + compromise
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || supported}
            onClick={() => onAction('record-bradycardia-support')}>
            Record immediate support + access
          </Button>
        </div>
        <p className="field__hint">The fixed rhythm has a pulse. The case authors compromise but does not diagnose its cause.</p>
      </section>
      <section className="syringe" aria-labelledby="unstable-bradycardia-response-title">
        <div id="unstable-bradycardia-response-title" className="syringe__name">Treat, observe, keep looking</div>
        <div className="syringe__meta">Fixed 1 mg IV intent · reversible causes · escalation</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Response reassessed · HR 68 · BP 112/70'
            : atropine ? 'Atropine intent recorded · reassess next'
              : supported ? 'Persistent compromise · atropine intent available' : 'Support pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!supported || atropine}
            onClick={() => onAction('record-atropine-intent')}>
            Record atropine 1 mg IV intent
          </Button>
          <Button className="crisis-drug__action" disabled={!atropine || reassessed}
            onClick={() => onAction('reassess-bradycardia-response')}>
            Reassess rhythm + whole-patient perfusion
          </Button>
        </div>
        <p className="field__hint">No medication delivery, repeat dose, pacing, capture, adrenergic infusion, definitive cause, procedure, recurrence, disposition, or outcome is offered.</p>
      </section>
    </div>
  );
}

function StatusEpilepticusTray({ assessment, seizureActivityFraction, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['statusEpilepticusAssessment']>;
  seizureActivityFraction: number;
  onAction: NonNullable<ActionCockpitProps['onStatusEpilepticusResponse']>;
}) {
  const reviewed = assessment?.reviewedAtTick != null;
  const supported = assessment?.supportedAtTick != null;
  const lorazepam = assessment?.lorazepamAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="status-epilepticus-recognition-title">
        <div id="status-epilepticus-recognition-title" className="syringe__name">Five minutes changes the name</div>
        <Badge kind="teaching">Generalized convulsive status</Badge>
        <div className="syringe__meta">6:20 elapsed · no recovery · airway + breathing + pulse</div>
        <p className="syringe__remaining" role="status">
          {supported ? 'Stabilized · glucose 118 mg/dL · IV access ready'
            : reviewed ? 'Status recognized · stabilize in parallel'
              : 'Seizure type + time + recovery review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-convulsive-status')}>
            Review seizure + clock
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || supported}
            onClick={() => onAction('record-status-stabilization')}>
            Stabilize + check glucose
          </Button>
        </div>
        <p className="field__hint">Protect from injury without restraint. Position the airway, prepare suction, titrate oxygen, monitor, obtain access, call for help, and check glucose without delaying first-line treatment.</p>
      </section>
      <section className="syringe" aria-labelledby="status-epilepticus-treatment-title">
        <div id="status-epilepticus-treatment-title" className="syringe__name">Stop it, then prove it stopped</div>
        <div className="syringe__meta">Fixed adult first-line action · lorazepam 4 mg IV</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Convulsions stopped · airway + ventilation reassessed'
            : lorazepam ? 'Lorazepam accepted · reassess next'
              : supported ? 'First-line treatment ready' : 'Stabilization pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!supported || lorazepam}
            onClick={() => onAction('give-lorazepam-4-mg-iv')}>
            Give lorazepam 4 mg IV
          </Button>
          <Button className="crisis-drug__action" disabled={!lorazepam || reassessed}
            onClick={() => onAction('reassess-after-lorazepam')}>
            Reassess seizure + airway
          </Button>
        </div>
        <p className="field__hint">Visible seizure signal: {seizureActivityFraction > 0 ? 'active' : 'stopped'}. Persistent or recurrent seizure needs prompt second-line therapy. No repeat dose, alternate route, second-line loading, EEG, airway procedure, cause, recurrence, disposition, or outcome is offered.</p>
      </section>
    </div>
  );
}

function AcuteIschemicStrokeTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['acuteIschemicStrokeAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onAcuteIschemicStrokeResponse']>;
}) {
  const reviewed = assessment?.presentationReviewedAtTick != null;
  const activated = assessment?.systemActivatedAtTick != null;
  const imaging = assessment?.imagingReviewedAtTick != null;
  const tenecteplase = assessment?.tenecteplaseAtTick != null;
  const thrombectomy = assessment?.thrombectomyActivatedAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="acute-stroke-recognition-title">
        <div id="acute-stroke-recognition-title" className="syringe__name">Time is tissue. Facts before treatment.</div>
        <Badge kind="teaching">Disabling deficit · 70-minute clock</Badge>
        <div className="syringe__meta">Aphasia + right weakness · glucose 112 · BP 168/94</div>
        <p className="syringe__remaining" role="status">
          {imaging ? 'No hemorrhage · left M1 occlusion · authored eligible'
            : activated ? 'Stroke system active · CT + CTA ready'
              : reviewed ? 'Acute disabling stroke recognized · activate now'
                : 'Last-known-well + deficit + glucose review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-stroke-presentation')}>Review deficit + clock</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || activated}
            onClick={() => onAction('activate-stroke-system')}>Activate stroke system</Button>
          <Button className="crisis-drug__action" disabled={!activated || imaging}
            onClick={() => onAction('review-stroke-imaging-and-eligibility')}>Review CT + CTA + eligibility</Button>
        </div>
        <p className="field__hint">The findings are authored. This screen does not examine the patient, calculate a stroke score, interpret imaging, or adjudicate a real contraindication.</p>
      </section>
      <section className="syringe" aria-labelledby="acute-stroke-reperfusion-title">
        <div id="acute-stroke-reperfusion-title" className="syringe__name">Two reperfusion tracks. One clock.</div>
        <div className="syringe__meta">80 kg · tenecteplase 0.25 mg/kg · left M1 LVO</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Surveillance + clock-explicit handoff recorded'
            : thrombectomy ? 'Thrombolysis intent + thrombectomy transfer active'
              : tenecteplase ? '20 mg intent recorded · do not wait for response'
                : imaging ? 'Both reperfusion tracks ready' : 'Eligibility review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!imaging || tenecteplase}
            onClick={() => onAction('record-tenecteplase-20-mg-intent')}>Record tenecteplase 20 mg IV intent</Button>
          <Button className="crisis-drug__action" disabled={!tenecteplase || thrombectomy}
            onClick={() => onAction('activate-thrombectomy-transfer')}>Activate thrombectomy transfer</Button>
          <Button className="crisis-drug__action" disabled={!thrombectomy || reassessed}
            onClick={() => onAction('reassess-and-handoff-stroke')}>Reassess + hand off with clocks</Button>
        </div>
        <p className="field__hint">No drug delivery, neurologic improvement, thrombectomy, reperfusion, complication, disposition, or outcome is simulated.</p>
      </section>
    </div>
  );
}

function IntracranialHemorrhageTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['intracranialHemorrhageAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onIntracranialHemorrhageResponse']>;
}) {
  const reviewed = assessment?.deteriorationReviewedAtTick != null;
  const activated = assessment?.pathwayActivatedAtTick != null;
  const findings = assessment?.findingsReviewedAtTick != null;
  const reversal = assessment?.reversalAtTick != null;
  const pressure = assessment?.pressureControlAtTick != null;
  const escalated = assessment?.escalatedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="ich-deterioration-title">
        <div id="ich-deterioration-title" className="syringe__name">Notice the change. Protect the next minute.</div>
        <Badge kind="teaching">Worsening alertness · airway watch</Badge>
        <div className="syringe__meta">15-minute decline · BP 202/112 · glucose 126</div>
        <p className="syringe__remaining" role="status">
          {findings ? '28 mL thalamic ICH · IVH · early hydrocephalus · INR 3.2'
            : activated ? 'ICH pathway active · fixed findings ready'
              : reviewed ? 'Deterioration recognized · activate now'
                : 'Serial neurologic + whole-patient review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-ich-deterioration')}>Review serial deterioration</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || activated}
            onClick={() => onAction('activate-ich-pathway')}>Activate ICH pathway + support</Button>
          <Button className="crisis-drug__action" disabled={!activated || findings}
            onClick={() => onAction('review-ich-findings-and-coagulopathy')}>Review CT + warfarin + INR</Button>
        </div>
        <p className="field__hint">Airway protection can fail despite adequate oxygenation. The screen does not examine, score consciousness, interpret CT, or operate airway equipment.</p>
      </section>
      <section className="syringe" aria-labelledby="ich-control-title">
        <div id="ich-control-title" className="syringe__name">Reverse the driver. Smooth the pressure.</div>
        <div className="syringe__meta">Stop warfarin · urgent reversal · neurosurgical capability</div>
        <p className="syringe__remaining" role="status">
          {escalated ? 'Neurocritical + neurosurgical handoff active'
            : pressure ? 'Reversal + smooth pressure intents recorded'
              : reversal ? 'Reversal intent recorded · pressure track open'
                : findings ? 'Two urgent treatment tracks ready' : 'Fixed findings review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!findings || reversal}
            onClick={() => onAction('record-warfarin-reversal-intent')}>Stop warfarin + record reversal intent</Button>
          <Button className="crisis-drug__action" disabled={!reversal || pressure}
            onClick={() => onAction('record-smooth-ich-pressure-control')}>Record smooth SBP control</Button>
          <Button className="crisis-drug__action" disabled={!pressure || escalated}
            onClick={() => onAction('escalate-ich-neurocritical-care')}>Escalate + hand off serial findings</Button>
        </div>
        <p className="field__hint">No dose, drug delivery, pressure response, hematoma expansion, airway procedure, ventricular drain, evacuation, complication, disposition, or outcome is simulated.</p>
      </section>
    </div>
  );
}

function DiabeticKetoacidosisTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['diabeticKetoacidosisAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onDiabeticKetoacidosisResponse']>;
}) {
  const reviewed = assessment?.presentationReviewedAtTick != null;
  const fluids = assessment?.fluidsAtTick != null;
  const potassium = assessment?.potassiumAtTick != null;
  const insulin = assessment?.insulinAtTick != null;
  const dextrose = assessment?.dextroseAtTick != null;
  const transitioned = assessment?.transitionAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="dka-foundation-title">
        <div id="dka-foundation-title" className="syringe__name">Three signals name the crisis.</div>
        <Badge kind="teaching">Glucose + ketones + acidosis</Badge>
        <div className="syringe__meta">486 · β-OHB 5.4 · pH 7.16 · HCO₃ 11 · K 3.2</div>
        <p className="syringe__remaining" role="status">
          {potassium ? 'Fixed repeat K 3.7 · insulin gate open'
            : fluids ? 'Fluids + serial panels active · correct K first'
              : reviewed ? 'Moderate DKA recognized · support next'
                : 'Triad + severity + precipitant review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-dka-presentation')}>Review DKA triad + cause</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || fluids}
            onClick={() => onAction('record-dka-fluids-and-monitoring')}>Record fluids + serial monitoring</Button>
          <Button className="crisis-drug__action" disabled={!fluids || potassium}
            onClick={() => onAction('record-dka-potassium-replacement')}>Replace K + recheck before insulin</Button>
        </div>
        <p className="field__hint">Potassium 3.2 mmol/L keeps insulin locked. The screen does not examine, sample, choose a fluid or electrolyte dose, or deliver treatment.</p>
      </section>
      <section className="syringe" aria-labelledby="dka-clearance-title">
        <div id="dka-clearance-title" className="syringe__name">Treat the ketones, not just the glucose.</div>
        <div className="syringe__meta">Insulin after K · dextrose before resolution · safe overlap</div>
        <p className="syringe__remaining" role="status">
          {transitioned ? 'Resolved · β-OHB 0.4 · pH 7.32 · HCO₃ 19'
            : dextrose ? 'Glucose 238 · ketoacidosis persists · continue insulin'
              : insulin ? 'Insulin intent active · interval panel ready'
                : potassium ? 'K gate cleared · insulin intent available' : 'Potassium gate pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!potassium || insulin}
            onClick={() => onAction('record-dka-insulin-intent')}>Record IV insulin protocol intent</Button>
          <Button className="crisis-drug__action" disabled={!insulin || dextrose}
            onClick={() => onAction('add-dextrose-and-continue-insulin')}>Add dextrose + continue insulin</Button>
          <Button className="crisis-drug__action" disabled={!dextrose || transitioned}
            onClick={() => onAction('confirm-dka-resolution-and-transition')}>Confirm resolution + transition safely</Button>
        </div>
        <p className="field__hint">Resolution uses plasma ketone plus pH or bicarbonate, not anion gap or urine ketones alone. No infusion, lab kinetics, complication, disposition, or outcome is simulated.</p>
      </section>
    </div>
  );
}

function HyperkalemiaTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['hyperkalemiaAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onHyperkalemiaResponse']>;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const calcium = assessment?.calciumAtTick != null;
  const insulin = assessment?.insulinGlucoseAtTick != null;
  const betaAgonist = assessment?.betaAgonistAtTick != null;
  const removal = assessment?.removalAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="hyperkalemia-heart-title">
        <div id="hyperkalemia-heart-title" className="syringe__name">Protect the heart first.</div>
        <Badge kind="teaching">K 7.1 · ECG toxicity · no arrest</Badge>
        <div className="syringe__meta">HR 48 · peaked T · flat P · QRS 140 ms</div>
        <p className="syringe__remaining" role="status">
          {calcium ? 'ECG stabilized · QRS 104 ms · K still 7.1'
            : reviewed ? 'Severe toxicity recognized · calcium intent next'
              : 'Confirmed K + ECG + driver review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-hyperkalemia-pattern')}>Review K + ECG + drivers</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || calcium}
            onClick={() => onAction('record-hyperkalemia-calcium-intent')}>Record IV calcium-salt intent</Button>
        </div>
        <p className="field__hint">Calcium protects the myocardium; it does not lower potassium. Salt, dose, access, delivery, and repeat dosing follow local protocol and are not simulated.</p>
      </section>
      <section className="syringe" aria-labelledby="hyperkalemia-potassium-title">
        <div id="hyperkalemia-potassium-title" className="syringe__name">Shift now. Remove next. Watch for return.</div>
        <div className="syringe__meta">Insulin-glucose · adjunct shift · removal · rebound</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? '1-hour K 5.8 · glucose 92 · QRS 98 ms · keep watching'
            : removal ? 'Removal + cause control active · reassess next'
              : betaAgonist ? 'Temporary shifting complete · remove K next'
                : insulin ? 'Insulin-glucose recorded · adjunct available'
                  : calcium ? 'Myocardium protected · shifting available' : 'Calcium intent pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!calcium || insulin}
            onClick={() => onAction('record-hyperkalemia-insulin-glucose')}>Record insulin-glucose + surveillance</Button>
          <Button className="crisis-drug__action" disabled={!insulin || betaAgonist}
            onClick={() => onAction('record-hyperkalemia-beta-agonist')}>Record adjunct beta-2 shift</Button>
          <Button className="crisis-drug__action" disabled={!betaAgonist || removal}
            onClick={() => onAction('record-hyperkalemia-removal-and-cause-control')}>Remove K + stop drivers + renal help</Button>
          <Button className="crisis-drug__action" disabled={!removal || reassessed}
            onClick={() => onAction('reassess-hyperkalemia')}>Recheck ECG + K + glucose</Button>
        </div>
        <p className="field__hint">No ECG reading, dose, delivery, potassium kinetics, glucose complication, binder, diuresis, dialysis, recurrence, disposition, or outcome is simulated.</p>
      </section>
    </div>
  );
}

function HyponatremiaTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['hyponatremiaAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onHyponatremiaResponse']>;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const stabilized = assessment?.stabilizedAtTick != null;
  const hypertonic = assessment?.hypertonicAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const guardrails = assessment?.guardrailsAtTick != null;
  return (
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
            onClick={() => onAction('review-hyponatremia-pattern')}>Review seizure + Na + exclusions</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || stabilized}
            onClick={() => onAction('record-hyponatremia-stabilization')}>Protect + support + monitor + call</Button>
          <Button className="crisis-drug__action" disabled={!stabilized || hypertonic}
            onClick={() => onAction('record-hypertonic-saline-intent')}>Record hypertonic bolus + 5 target</Button>
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
            onClick={() => onAction('reassess-hyponatremia-first-hour')}>Review first-hour brain + Na + urine</Button>
          <Button className="crisis-drug__action" disabled={!reassessed || guardrails}
            onClick={() => onAction('record-hyponatremia-guardrails-and-cause-plan')}>Stop rescue + set ceiling + find cause</Button>
        </div>
        <p className="field__hint">This authored path stops after +5 mmol/L improvement, caps total rise at 10 mmol/L in the first 24 hours and 8 mmol/L per day after, and keeps a specialist overcorrection plan visible.</p>
      </section>
    </div>
  );
}

function OpioidToxicityTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['opioidToxicityAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onOpioidToxicityResponse']>;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const ventilated = assessment?.ventilationAtTick != null;
  const antagonist = assessment?.antagonistAtTick != null;
  const initial = assessment?.initialReassessmentAtTick != null;
  const recurrence = assessment?.recurrenceReviewedAtTick != null;
  const plan = assessment?.recurrencePlanAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="opioid-breathe-title">
        <div id="opioid-breathe-title" className="syringe__name">Breathe first. Antidote without delay.</div>
        <Badge kind="teaching">Pulse 58 · RR 4 · SpO₂ 78% · ETCO₂ 68</Badge>
        <div className="syringe__meta">Unresponsive · pinpoint pupils · glucose 102 · no arrest</div>
        <p className="syringe__remaining" role="status">
          {initial ? 'RR 14 · SpO₂ 97% · ETCO₂ 43 · responds to voice'
            : antagonist ? 'Ventilation continues · initial response next'
              : ventilated ? 'Breathing supported · naloxone intent next'
                : reviewed ? 'Respiratory emergency recognized · ventilate now'
                  : 'Pulse + breathing + oxygenation + mimics review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-opioid-toxicity-pattern')}>Review pulse + breathing + pattern</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || ventilated}
            onClick={() => onAction('record-opioid-ventilation-support')}>Open airway + oxygen + ventilate</Button>
          <Button className="crisis-drug__action" disabled={!ventilated || antagonist}
            onClick={() => onAction('record-opioid-naloxone-intent')}>Record naloxone toward breathing</Button>
          <Button className="crisis-drug__action" disabled={!antagonist || initial}
            onClick={() => onAction('reassess-opioid-initial-response')}>Recheck breathing + CO₂ + pulse</Button>
        </div>
        <p className="field__hint">Ventilation does not wait for naloxone. Normal spontaneous breathing and airway reflexes are the endpoint; full arousal is not required.</p>
      </section>
      <section className="syringe" aria-labelledby="opioid-recurrence-title">
        <div id="opioid-recurrence-title" className="syringe__name">The opioid can outlast the antidote.</div>
        <div className="syringe__meta">Observe · detect recurrence · rescue again · leave safer</div>
        <p className="syringe__remaining" role="status">
          {plan ? 'Renewed rescue + observation + discharge safety handed off'
            : recurrence ? 'RR 7 · SpO₂ 90% · ETCO₂ 58 · respiratory depression is back'
              : initial ? 'Initial response is not the finish line · advance observation'
                : 'Initial breathing response pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!initial || recurrence}
            onClick={() => onAction('review-opioid-recurrence')}>Review 25-minute recurrence</Button>
          <Button className="crisis-drug__action" disabled={!recurrence || plan}
            onClick={() => onAction('record-opioid-recurrence-and-safety-plan')}>Ventilate again + repeat + observe</Button>
        </div>
        <p className="field__hint">Keep co-exposures and complications open. Eventual discharge requires low recurrence risk, normal consciousness and vital signs, antagonist access with instruction, and treatment linkage.</p>
      </section>
    </div>
  );
}

function HeatStrokeTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['heatStrokeAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onHeatStrokeResponse']>;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const supported = assessment?.supportAtTick != null;
  const cooling = assessment?.coolingAtTick != null;
  const target = assessment?.targetAtTick != null;
  const surveillance = assessment?.surveillanceAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="heat-cool-title">
        <div id="heat-cool-title" className="syringe__name">Hot brain. Cool now.</div>
        <Badge kind="teaching">Rectal 41.3°C · confused · HR 146</Badge>
        <div className="syringe__meta">Exertion · glucose 110 · sodium 139 · no trauma</div>
        <p className="syringe__remaining" role="status">
          {target ? '14 min · 38.9°C · coherent · stop active cooling'
            : cooling ? 'Whole-body cooling active · watch rectal core'
              : supported ? 'Support ready · immersion now'
                : reviewed ? 'Heat stroke recognized · support while cooling starts'
                  : 'Brain + core + glucose + sodium + mimics review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            onClick={() => onAction('review-heat-stroke-pattern')}>Review brain + rectal core + mimics</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || supported}
            onClick={() => onAction('record-heat-stroke-support')}>Support ABCs + strip + prepare</Button>
          <Button className="crisis-drug__action" disabled={!supported || cooling}
            onClick={() => onAction('record-cold-water-immersion')}>Immerse + monitor core + coordinate</Button>
          <Button className="crisis-drug__action" disabled={!cooling || target}
            onClick={() => onAction('reassess-heat-stroke-cooling-target')}>Review cooling target</Button>
        </div>
        <p className="field__hint">Whole-body cold-water immersion is the fastest cooling path. Preserve airway access, monitor rectal core continuously, and organize transport around cooling.</p>
      </section>
      <section className="syringe" aria-labelledby="heat-surveillance-title">
        <div id="heat-surveillance-title" className="syringe__name">Stop the cooling, not the surveillance.</div>
        <div className="syringe__meta">Below 39°C · prevent overshoot · watch delayed injury</div>
        <p className="syringe__remaining" role="status">
          {surveillance ? 'Thermal rescue closed · multiorgan surveillance handed off'
            : target ? 'Temperature target met · organ-injury plan next'
              : 'Cooling target pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!target || surveillance}
            onClick={() => onAction('record-heat-stroke-organ-surveillance')}>Watch kidney + liver + clotting + muscle</Button>
        </div>
        <p className="field__hint">Temperature recovery does not exclude delayed injury. Antipyretics and dantrolene do not treat heat stroke and are outside this path.</p>
      </section>
    </div>
  );
}

function TraumaPrimarySurveyTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['traumaPrimarySurveyAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onTraumaPrimarySurveyResponse']>;
}) {
  const activated = assessment?.activatedAtTick != null;
  const hemorrhage = assessment?.catastrophicHemorrhageAtTick != null;
  const airwayBreathing = assessment?.airwayBreathingAtTick != null;
  const circulation = assessment?.circulationAtTick != null;
  const disabilityExposure = assessment?.disabilityExposureAtTick != null;
  const repeated = assessment?.repeatedAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="trauma-sweep-title">
        <div id="trauma-sweep-title" className="syringe__name">Stop the leak. Keep the sweep moving.</div>
        <Badge kind="teaching">&lt;C&gt; · A · B</Badge>
        <div className="syringe__meta">35 min · failed pressure · pulse 128 · BP 86/54</div>
        <p className="syringe__remaining" role="status">
          {airwayBreathing ? 'Bleed controlled · airway patent · bilateral breathing present'
            : hemorrhage ? 'No visible limb flow · continue A + B'
              : activated ? 'Team ready · catastrophic hemorrhage first'
                : 'Mechanism + injuries + signs + treatment handoff pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={activated}
            onClick={() => onAction('activate-trauma-primary-survey')}>Receive handoff + activate + declare sweep</Button>
          <Button className="crisis-drug__action" disabled={!activated || hemorrhage}
            onClick={() => onAction('control-trauma-catastrophic-hemorrhage')}>Control limb bleed + record time</Button>
          <Button className="crisis-drug__action" disabled={!hemorrhage || airwayBreathing}
            onClick={() => onAction('review-trauma-airway-and-breathing')}>Review airway + spine + breathing</Button>
        </div>
        <p className="field__hint">Catastrophic hemorrhage comes first. A currently patent airway and bilateral breathing are findings to recheck, not permission to skip A or B.</p>
      </section>
      <section className="syringe" aria-labelledby="trauma-repeat-title">
        <div id="trauma-repeat-title" className="syringe__name">Every intervention earns another survey.</div>
        <Badge kind="teaching">C · D · E · repeat</Badge>
        <div className="syringe__meta">Pelvis · blood · brain · back · warmth · trends</div>
        <p className="syringe__remaining" role="status">
          {repeated ? 'Repeat complete · trends + uncertainty handed to definitive control'
            : disabilityExposure ? 'D + E complete · repeat &lt;C&gt;ABCDE now'
              : circulation ? 'Hemorrhage path active · complete D + E'
                : airwayBreathing ? 'Persistent shock · circulation next' : 'A + B pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!airwayBreathing || circulation}
            onClick={() => onAction('record-trauma-circulation-response')}>Pelvis + blood + TXA + control</Button>
          <Button className="crisis-drug__action" disabled={!circulation || disabilityExposure}
            onClick={() => onAction('review-trauma-disability-and-exposure')}>Review brain + glucose + back + warmth</Button>
          <Button className="crisis-drug__action" disabled={!disabilityExposure || repeated}
            onClick={() => onAction('repeat-trauma-primary-survey')}>Repeat sweep + hand off change</Button>
        </div>
        <p className="field__hint">Use only imaging that directs intervention in persistent instability. A negative FAST would not exclude bleeding; the authored positive statement does not replace definitive control.</p>
      </section>
    </div>
  );
}

function AcuteAorticSyndromeTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['acuteAorticSyndromeAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onAcuteAorticSyndromeResponse']>;
}) {
  const initial = assessment?.initialReviewedAtTick != null;
  const evolution = assessment?.evolutionReviewedAtTick != null;
  const escalated = assessment?.escalatedAtTick != null;
  const antiImpulse = assessment?.antiImpulseAtTick != null;
  const imaging = assessment?.imagingAtTick != null;
  const handedOff = assessment?.handedOffAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="aortic-drift-title">
        <div id="aortic-drift-title" className="syringe__name">The first exam is a timestamp.</div>
        <Badge kind="teaching">pain · pressure · pulse · perfusion · brain</Badge>
        <div className="syringe__meta">18 min · abrupt maximum · ECG nondiagnostic · initially symmetric</div>
        <p className="syringe__remaining" role="status">
          {escalated ? 'Aortic + critical-care teams activated · unsupported defaults paused'
            : evolution ? 'ΔBP 36 · weak right radial · cool left foot · left-arm drift'
              : initial ? 'Danger remains open · repeat every territory'
                : 'Incomplete presentation · no diagnosis leaked'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={initial}
            onClick={() => onAction('review-aortic-initial-pattern')}>Review pain + ECG + symmetric baseline</Button>
          <Button className="crisis-drug__action" disabled={!initial || evolution}
            onClick={() => onAction('repeat-aortic-asymmetry-exam')}>Repeat both arms + pulses + brain</Button>
          <Button className="crisis-drug__action" disabled={!evolution || escalated}
            onClick={() => onAction('activate-aortic-pathway')}>Escalate aortic concern + pause defaults</Button>
        </div>
        <p className="field__hint">A normal first pulse or neurologic exam does not stay normal by promise. Recheck discordant territories when the story changes.</p>
      </section>
      <section className="syringe" aria-labelledby="aortic-protect-title">
        <div id="aortic-protect-title" className="syringe__name">Quiet the impulse. Protect the organs.</div>
        <Badge kind="teaching">rate first · pressure second · perfusion always</Badge>
        <div className="syringe__meta">analgesia · arterial line · urgent CT · serial handoff</div>
        <p className="syringe__remaining" role="status">
          {handedOff ? 'Evolution + uncertainty handed off · scan still unavailable'
            : imaging ? 'Definitive imaging prioritized · repeat before leaving'
              : antiImpulse ? 'HR 60–80 target · SBP &lt;120 only with organ perfusion'
                : escalated ? 'Monitored anti-impulse intent next' : 'Escalation pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!escalated || antiImpulse}
            onClick={() => onAction('record-aortic-anti-impulse-intent')}>Analgesia + rate-first anti-impulse</Button>
          <Button className="crisis-drug__action" disabled={!antiImpulse || imaging}
            onClick={() => onAction('prioritize-aortic-imaging')}>Prioritize definitive aortic imaging</Button>
          <Button className="crisis-drug__action" disabled={!imaging || handedOff}
            onClick={() => onAction('repeat-and-handoff-aortic-evolution')}>Repeat territories + hand off uncertainty</Button>
        </div>
        <p className="field__hint">CT is the authored first imaging intent while transportable; TEE or MRI may fit another context. This lesson ends before any result or operative choice.</p>
      </section>
    </div>
  );
}

function ArdsLungProtectiveTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['ardsLungProtectiveAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onArdsLungProtectiveResponse']>;
}) {
  const baseline = assessment?.baselineAtTick != null;
  const pbw = assessment?.pbwAtTick != null;
  const protection = assessment?.protectionAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="ards-size-title">
        <div id="ards-size-title" className="syringe__name">Size the breath to the lung.</div>
        <Badge kind="teaching">height + sex → PBW · never actual weight</Badge>
        <div className="syringe__meta">170 cm · 92 kg actual · 61.5 kg PBW · plateau 32</div>
        <p className="syringe__remaining" role="status">
          {protection ? '370 mL · 6 mL/kg PBW · plateau limit <30'
            : pbw ? '500 mL is 8.1 mL/kg PBW · protect now'
              : baseline ? 'Oxygenation + mechanics integrated · find PBW' : 'Baseline review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={baseline}
            onClick={() => onAction('review-ards-baseline')}>Review gas + mechanics + circulation</Button>
          <Button className="crisis-drug__action" disabled={!baseline || pbw}
            onClick={() => onAction('calculate-ards-pbw')}>Calculate height-based PBW</Button>
          <Button className="crisis-drug__action" disabled={!pbw || protection}
            onClick={() => onAction('record-ards-protective-settings')}>Set 370 mL + plateau guardrail</Button>
        </div>
        <p className="field__hint">A reassuring pH does not make a plateau pressure of 32 safe. Protect first, then measure what the change costs.</p>
      </section>
      <section className="syringe" aria-labelledby="ards-response-title">
        <div id="ards-response-title" className="syringe__name">Every setting owes you a response.</div>
        <Badge kind="teaching">pressure · gas · synchrony · circulation</Badge>
        <div className="syringe__meta">30 min · plateau 27 · pH 7.29 · PaCO₂ 52 · MAP 70</div>
        <p className="syringe__remaining" role="status">
          {escalation ? 'PEEP/FiO₂ + >12 h prone-team intent handed off'
            : reassessment ? 'Protection held · hypoxemia persists · escalate deliberately'
              : protection ? 'Reassessment due before escalation' : 'Protective setting pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!protection || reassessment}
            onClick={() => onAction('reassess-ards-protection')}>Review 30-minute response</Button>
          <Button className="crisis-drug__action" disabled={!reassessment || escalation}
            onClick={() => onAction('record-ards-peep-prone-escalation')}>PEEP/FiO₂ + prolonged prone team</Button>
        </div>
        <p className="field__hint">Accept bounded hypercapnia only with serial pH and whole-patient review. Proning is a trained-team procedure, not a button skill.</p>
      </section>
    </div>
  );
}

function EscalatingHypoxemiaTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['escalatingHypoxemiaAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onEscalatingHypoxemiaResponse']>;
}) {
  const signal = assessment?.signalAtTick != null;
  const support = assessment?.supportAtTick != null;
  const deliveryPath = assessment?.deliveryPathAtTick != null;
  const bedsidePattern = assessment?.bedsidePatternAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="hypoxemia-signal-title">
        <div id="hypoxemia-signal-title" className="syringe__name">Believe the drop. Verify the signal.</div>
        <Badge kind="teaching">pleth · trend · patient · arterial panel</Badge>
        <div className="syringe__meta">94% → 84% in 6 min · strong pleth · PaO₂ 51</div>
        <p className="syringe__remaining" role="status">
          {support ? 'Oxygen support + ICU and respiratory help active'
            : signal ? 'Credible hypoxemia · support while you troubleshoot'
              : 'Signal and whole-patient trend pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={signal}
            onClick={() => onAction('validate-hypoxemia-signal')}>Corroborate the decline</Button>
          <Button className="crisis-drug__action" disabled={!signal || support}
            onClick={() => onAction('support-hypoxemia-and-call-help')}>Support oxygenation + call help</Button>
        </div>
        <p className="field__hint">A good pleth earns attention, not certainty. Treat urgency and verify the story in parallel.</p>
      </section>
      <section className="syringe" aria-labelledby="hypoxemia-path-title">
        <div id="hypoxemia-path-title" className="syringe__name">Trace oxygen from wall to alveolus.</div>
        <Badge kind="teaching">source · circuit · tube · chest · circulation</Badge>
        <div className="syringe__meta">tube 23 cm · suction path passes · peak 36 · plateau 29</div>
        <p className="syringe__remaining" role="status">
          {escalation ? '15-min response · SpO₂ 92% · PaO₂ 68 · MAP 72'
            : bedsidePattern ? 'Bilateral parenchymal pattern · escalate without overclaiming'
              : deliveryPath ? 'Delivery path reviewed · integrate chest + pressure + flow'
                : support ? 'Outside-in delivery-path review due' : 'Immediate support pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!support || deliveryPath}
            onClick={() => onAction('trace-hypoxemia-delivery-path')}>Trace source → circuit → tube</Button>
          <Button className="crisis-drug__action" disabled={!deliveryPath || bedsidePattern}
            onClick={() => onAction('integrate-hypoxemia-bedside-pattern')}>Integrate chest + pressure + flow</Button>
          <Button className="crisis-drug__action" disabled={!bedsidePattern || escalation}
            onClick={() => onAction('escalate-and-reassess-hypoxemia')}>Escalate + review 15-min response</Button>
        </div>
        <p className="field__hint">A passed check narrows the field; it never makes tube, pleural, embolic, or equipment danger impossible.</p>
      </section>
    </div>
  );
}

function VentilatorDyssynchronyTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['ventilatorDyssynchronyAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onVentilatorDyssynchronyResponse']>;
}) {
  const graphics = assessment?.graphicsAtTick != null;
  const drivers = assessment?.driversAtTick != null;
  const classification = assessment?.classificationAtTick != null;
  const correction = assessment?.correctionAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="dyssynchrony-read-title">
        <div id="dyssynchrony-read-title" className="syringe__name">Read the person and the breath.</div>
        <Badge kind="teaching">effort · pressure · flow · volume</Badge>
        <div className="syringe__meta">8/20 double triggers · 420 mL set · 760 mL stacked</div>
        <p className="syringe__remaining" role="status">
          {classification ? 'Flow starvation + premature cycling · bounded pattern'
            : drivers ? 'Drivers reviewed · classify the interaction'
              : graphics ? 'Pattern seen · look for the reason' : 'Patient + graphics review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={graphics}
            onClick={() => onAction('review-dyssynchrony-patient-and-graphics')}>Read patient + pressure + flow + volume</Button>
          <Button className="crisis-drug__action" disabled={!graphics || drivers}
            onClick={() => onAction('review-dyssynchrony-drivers')}>Review pain + drive + airway + mechanics</Button>
          <Button className="crisis-drug__action" disabled={!drivers || classification}
            onClick={() => onAction('classify-dyssynchrony-pattern')}>Classify the bounded pattern</Button>
        </div>
        <p className="field__hint">Irregularity is a clue, not a diagnosis. Name the phase and mechanism only after you read the patient.</p>
      </section>
      <section className="syringe" aria-labelledby="dyssynchrony-match-title">
        <div id="dyssynchrony-match-title" className="syringe__name">Match support. Keep protection.</div>
        <Badge kind="teaching">cause first · flow · cycle · volume</Badge>
        <div className="syringe__meta">analgesia first · PBW volume · plateau guardrail · RT review</div>
        <p className="syringe__remaining" role="status">
          {reassessment ? '10 min · 1/20 double trigger · 420–450 mL · plateau 22'
            : correction ? 'Correction recorded · response due'
              : classification ? 'Match demand without surrendering protection' : 'Classification pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!classification || correction}
            onClick={() => onAction('record-dyssynchrony-correction-intent')}>Analgesia first + match flow and cycle</Button>
          <Button className="crisis-drug__action" disabled={!correction || reassessment}
            onClick={() => onAction('reassess-dyssynchrony-response')}>Review 10-minute response</Button>
        </div>
        <p className="field__hint">A quieter waveform is not enough. Recheck comfort, effort, delivered volume, pressure, gas, and circulation.</p>
      </section>
    </div>
  );
}

function AutoPeepTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['autoPeepAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onAutoPeepResponse']>;
}) {
  const flow = assessment?.flowAtTick != null;
  const measurement = assessment?.measurementAtTick != null;
  const classification = assessment?.classificationAtTick != null;
  const correction = assessment?.correctionAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="auto-peep-watch-title">
        <div id="auto-peep-watch-title" className="syringe__name">Watch the breath leave.</div>
        <Badge kind="teaching">flow · time · total PEEP · pressure</Badge>
        <div className="syringe__meta">flow never reaches zero · set 5 · total 16 · intrinsic 11</div>
        <p className="syringe__remaining" role="status">
          {classification ? 'Dynamic hyperinflation · bounded obstructive pattern'
            : measurement ? 'Intrinsic PEEP measured · connect the consequences'
              : flow ? 'Incomplete exhalation seen · validate the hold' : 'Whole-patient flow review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={flow}
            onClick={() => onAction('review-auto-peep-patient-and-flow')}>Review patient + expiratory flow</Button>
          <Button className="crisis-drug__action" disabled={!flow || measurement}
            onClick={() => onAction('measure-auto-peep')}>Review passive expiratory hold</Button>
          <Button className="crisis-drug__action" disabled={!measurement || classification}
            onClick={() => onAction('classify-auto-peep-pattern')}>Classify the bounded pattern</Button>
        </div>
        <p className="field__hint">Flow that misses zero is a clue. Effort, airway closure, and uneven emptying can make one hold value incomplete.</p>
      </section>
      <section className="syringe" aria-labelledby="auto-peep-room-title">
        <div id="auto-peep-room-title" className="syringe__name">Make room for the next breath.</div>
        <Badge kind="teaching">drive · rate · flow · resistance</Badge>
        <div className="syringe__meta">treat obstruction · preserve expiration · keep pressure guardrails</div>
        <p className="syringe__remaining" role="status">
          {reassessment ? '10 min · intrinsic 4 · flow reaches zero · MAP 72'
            : correction ? 'Correction intent recorded · response due'
              : classification ? 'Create time without inventing a universal setting' : 'Classification pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!classification || correction}
            onClick={() => onAction('record-auto-peep-correction-intent')}>Treat resistance + preserve exhalation</Button>
          <Button className="crisis-drug__action" disabled={!correction || reassessment}
            onClick={() => onAction('reassess-auto-peep-response')}>Review 10-minute response</Button>
        </div>
        <p className="field__hint">External PEEP is individualized. Recheck flow, mechanics, triggering, gas exchange, and circulation after any change.</p>
      </section>
    </div>
  );
}

function MucusPluggingTray({ assessment, onAction }: {
  assessment?: NonNullable<ActionCockpitProps['resuscitation']['mucusPluggingAssessment']>;
  onAction: NonNullable<ActionCockpitProps['onMucusPluggingResponse']>;
}) {
  const support = assessment?.supportAtTick != null;
  const indicators = assessment?.indicatorsAtTick != null;
  const suction = assessment?.suctionAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="mucus-listen-title">
        <div id="mucus-listen-title" className="syringe__name">Listen to the resistance.</div>
        <Badge kind="teaching">sounds · secretions · flow · pressure</Badge>
        <div className="syringe__meta">sawtooth flow · peak 38 · plateau 23 · SpO₂ 87%</div>
        <p className="syringe__remaining" role="status">
          {indicators ? 'Retained-secretion indicators converge · location unproven'
            : support ? 'Support active · review the airway-resistance pattern'
              : 'Oxygenation support + experienced help due'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={support}
            onClick={() => onAction('support-mucus-plugging-and-call-help')}>Support oxygenation + call help</Button>
          <Button className="crisis-drug__action" disabled={!support || indicators}
            onClick={() => onAction('review-mucus-plugging-indicators')}>Review airway + graphics + mechanics</Button>
        </div>
        <p className="field__hint">No single sign diagnoses a plug. Keep tube, circuit, pleural, parenchymal, blood, and foreign-body causes open.</p>
      </section>
      <section className="syringe" aria-labelledby="mucus-clear-title">
        <div id="mucus-clear-title" className="syringe__name">Clear, then prove it.</div>
        <Badge kind="teaching">preoxygenate · as needed · no routine saline</Badge>
        <div className="syringe__meta">shallow first · reassess · focal finding persists</div>
        <p className="syringe__remaining" role="status">
          {escalation ? 'Persistent left-base concern · imaging + airway review recorded'
            : reassessment ? 'Central resistance improved · focal concern remains'
              : suction ? 'Clearance intent recorded · response due' : 'Indication review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!indicators || suction}
            onClick={() => onAction('record-indicated-airway-suction-intent')}>Record indicated suction intent</Button>
          <Button className="crisis-drug__action" disabled={!suction || reassessment}
            onClick={() => onAction('reassess-mucus-plugging-response')}>Review post-clearance response</Button>
          <Button className="crisis-drug__action" disabled={!reassessment || escalation}
            onClick={() => onAction('escalate-persistent-mucus-plugging')}>Escalate persistent focal concern</Button>
        </div>
        <p className="field__hint">Routine bronchoscopy is not the answer. Persistent focal physiology still earns imaging and experienced evaluation.</p>
      </section>
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

function DelayedEmergenceTray({ assessment, onAction }: {
  assessment?: {
    readonly supportReviewedAtTick: number | null;
    readonly exposureReviewedAtTick: number | null;
    readonly metabolicReviewedAtTick: number | null;
    readonly neurologicExamAtTick: number | null;
    readonly escalation: 'urgent-neurologic-evaluation' | 'continue-routine-recovery' | null;
    readonly escalatedAtTick: number | null;
  };
  onAction: NonNullable<ActionCockpitProps['onDelayedEmergenceAssessment']>;
}) {
  const [pendingEscalation, setPendingEscalation] = useState<
    'urgent-neurologic-evaluation' | 'continue-routine-recovery' | null
  >(null);
  const support = assessment?.supportReviewedAtTick != null;
  const exposure = assessment?.exposureReviewedAtTick != null;
  const metabolic = assessment?.metabolicReviewedAtTick != null;
  const neurologic = assessment?.neurologicExamAtTick != null;
  const escalation = assessment?.escalation ?? null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="delayed-emergence-review-title">
        <div id="delayed-emergence-review-title" className="syringe__name">
          Stabilize, then narrow
        </div>
        <Badge kind="teaching">Focused vignette</Badge>
        <div className="syringe__meta">Support · exposure · reversible categories</div>
        <p className="syringe__remaining" role="status">
          {!support ? 'Immediate support review pending'
            : !exposure ? 'Tube + ventilation established · physiology stable'
              : !metabolic ? 'Agents off · no benzodiazepine · TOF ratio 0.95'
                : 'Glucose 102 · PaCO₂ 41 · sodium 139 · 36.7°C'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={support}
            onClick={() => onAction('review-support')}>Review immediate support</Button>
          <Button className="crisis-drug__action" disabled={!support || exposure}
            onClick={() => onAction('review-exposure-and-block')}>Reconcile drugs + block</Button>
          <Button className="crisis-drug__action" disabled={!exposure || metabolic}
            onClick={() => onAction('check-metabolic-causes')}>Check reversible causes</Button>
        </div>
        <p className="field__hint">
          The fixed values organize a differential. They do not simulate laboratory testing or
          exclude every real cause of delayed emergence.
        </p>
      </section>
      <section className="syringe" aria-labelledby="delayed-emergence-exam-title">
        <div id="delayed-emergence-exam-title" className="syringe__name">
          Look for what changes urgency
        </div>
        <div className="syringe__meta">Focused examination · escalation</div>
        <p className="syringe__remaining" role="status">
          {escalation === 'urgent-neurologic-evaluation'
            ? 'Urgent neurologic evaluation · airway support continues'
            : escalation === 'continue-routine-recovery'
              ? 'Routine recovery observation recorded'
              : neurologic
                ? 'Left arm localizes · right absent · left gaze preference'
                : 'Focused neurologic examination pending'}
        </p>
        <Button className="crisis-drug__action" disabled={!metabolic || neurologic}
          onClick={() => onAction('perform-focused-neurologic-exam')}>
          Perform focused neurologic exam
        </Button>
        {neurologic && escalation === null && pendingEscalation === null && (
          <div className="syringe__presets">
            <Button className="crisis-drug__action"
              onClick={() => setPendingEscalation('urgent-neurologic-evaluation')}>
              Escalate urgently
            </Button>
            <Button className="crisis-drug__action"
              onClick={() => setPendingEscalation('continue-routine-recovery')}>
              Continue routine recovery
            </Button>
          </div>
        )}
        {pendingEscalation !== null && (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span>{pendingEscalation === 'urgent-neurologic-evaluation'
              ? 'Record urgent neurologic evaluation while support continues?'
              : 'Record routine observation despite the new asymmetry?'}</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" className="crisis-drug__action" onClick={() => {
                onAction(pendingEscalation);
                setPendingEscalation(null);
              }}>Confirm choice</Button>
              <Button variant="ghost" className="crisis-drug__action"
                onClick={() => setPendingEscalation(null)}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="field__hint">
          This screen recognizes a lateralizing pattern. Diagnosis, imaging, treatment, team
          workflow, and outcome remain outside the vignette.
        </p>
      </section>
    </div>
  );
}

function ExtubationReadinessTray({ assessment, onAction }: {
  assessment?: {
    readonly quantitativeRecoveryReviewedAtTick: number | null;
    readonly awakeAirwayReviewedAtTick: number | null;
    readonly gasExchangeReviewedAtTick: number | null;
    readonly airwayPlanReviewedAtTick: number | null;
    readonly decision: 'ready-for-planned-awake-extubation'
      | 'continue-support-and-reassess' | null;
    readonly decidedAtTick: number | null;
  };
  onAction: NonNullable<ActionCockpitProps['onExtubationReadinessAssessment']>;
}) {
  const [pendingDecision, setPendingDecision] = useState<
    'ready-for-planned-awake-extubation' | 'continue-support-and-reassess' | null
  >(null);
  const recovery = assessment?.quantitativeRecoveryReviewedAtTick != null;
  const awakeAirway = assessment?.awakeAirwayReviewedAtTick != null;
  const gasExchange = assessment?.gasExchangeReviewedAtTick != null;
  const airwayPlan = assessment?.airwayPlanReviewedAtTick != null;
  const decision = assessment?.decision ?? null;
  return (
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="extubation-readiness-title">
        <div id="extubation-readiness-title" className="syringe__name">Build the readiness picture</div>
        <Badge kind="teaching">Focused vignette</Badge>
        <div className="syringe__meta">Recovery · awake airway · gas exchange</div>
        <p className="syringe__remaining" role="status">
          {!recovery ? 'Quantitative recovery review pending'
            : !awakeAirway ? 'TOF ratio 0.93 · necessary, not sufficient'
              : !gasExchange ? 'Eyes open · follows commands · strong cough · secretions cleared'
                : 'Spontaneous 14/min · 420 mL · EtCO₂ 39 · SpO₂ 98% on FiO₂ 0.40'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={recovery}
            onClick={() => onAction('review-quantitative-recovery')}>Review quantitative recovery</Button>
          <Button className="crisis-drug__action" disabled={!recovery || awakeAirway}
            onClick={() => onAction('review-awake-airway-protection')}>Review awake airway</Button>
          <Button className="crisis-drug__action" disabled={!awakeAirway || gasExchange}
            onClick={() => onAction('review-spontaneous-gas-exchange')}>Review gas exchange</Button>
        </div>
        <p className="field__hint">
          These are fixed readiness findings. The screen does not measure consciousness,
          respiratory effort, airway reflexes, or secretion burden.
        </p>
      </section>
      <section className="syringe" aria-labelledby="extubation-plan-title">
        <div id="extubation-plan-title" className="syringe__name">Make removal a plan</div>
        <div className="syringe__meta">Airway risk · rescue · decision</div>
        <p className="syringe__remaining" role="status">
          {decision === 'ready-for-planned-awake-extubation'
            ? 'Ready for planned awake extubation · tube remains in place here'
            : decision === 'continue-support-and-reassess'
              ? 'Continue support + reassess recorded'
              : airwayPlan
                ? 'Low risk · skilled help + oxygen + monitoring + reintubation plan available'
                : 'Airway risk and rescue-plan review pending'}
        </p>
        <Button className="crisis-drug__action" disabled={!gasExchange || airwayPlan}
          onClick={() => onAction('review-airway-risk-and-rescue')}>Review airway risk + rescue</Button>
        {airwayPlan && decision === null && pendingDecision === null && (
          <div className="syringe__presets">
            <Button className="crisis-drug__action"
              onClick={() => setPendingDecision('ready-for-planned-awake-extubation')}>
              Ready for planned awake extubation
            </Button>
            <Button className="crisis-drug__action"
              onClick={() => setPendingDecision('continue-support-and-reassess')}>
              Continue support + reassess
            </Button>
          </div>
        )}
        {pendingDecision !== null && (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span>{pendingDecision === 'ready-for-planned-awake-extubation'
              ? 'Record readiness after all declared checkpoints?'
              : 'Continue support despite all declared low-risk checkpoints?'}</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" className="crisis-drug__action" onClick={() => {
                onAction(pendingDecision);
                setPendingDecision(null);
              }}>Confirm choice</Button>
              <Button variant="ghost" className="crisis-drug__action"
                onClick={() => setPendingDecision(null)}>Cancel</Button>
            </div>
          </div>
        )}
        <p className="field__hint">
          Tube removal, technique, advanced at-risk strategies, reintubation, and post-extubation
          monitoring or outcome remain outside this screen.
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
