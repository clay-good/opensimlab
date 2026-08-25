/**
 * The solver worker protocol.
 *
 * Designed once, for the FULL specification rather than for the current slice
 * (see openspec/changes/mvp-anesthesia-alpha/design.md). It carries the complete
 * state vector, the attribution terms the Why panel needs, and the waveform sample
 * buffers, because retrofitting attribution into a worker protocol later means
 * touching every consumer.
 *
 * The protocol is generic over the module's state type. The platform holds no
 * specialty knowledge (platform/module-contract → The core has no anesthesiology
 * knowledge); the anesthesia module supplies its own state shape.
 */

/** Bumped whenever the message shape changes incompatibly. Version 98 reports right-ventricular-infarction state. */
export const WORKER_PROTOCOL_VERSION = 98;

/** A single ranked contribution to a change in one state variable. */
export interface AttributionTerm {
  /** Stable identifier, for example `propofol-vasodilation`. */
  readonly termId: string;
  /** Learner-facing name. */
  readonly label: string;
  /** Signed contribution in the variable's own units. */
  readonly contribution: number;
  /** Share of the total absolute change, 0 to 1. */
  readonly share: number;
  /**
   * True when this term comes from an Open Sim Lab teaching model rather than a
   * published one, so the Why panel can say so in that line.
   */
  readonly teachingModel: boolean;
}

/** Attribution for one state variable at one tick. */
export interface Attribution {
  /** The state variable this explains, for example `map`. */
  readonly variable: string;
  /** Terms ranked by absolute contribution, largest first. */
  readonly terms: readonly AttributionTerm[];
}

/** One block of waveform samples for one signal. */
export interface WaveformBlock {
  readonly signal: string;
  readonly sampleRateHz: number;
  readonly startSeconds: number;
  readonly samples: Float32Array;
}

/** A concentration pair for one active drug. */
export interface DrugConcentration {
  readonly drugId: string;
  readonly modelId: string;
  /** `published`, `pending-check`, `out-of-range` or `teaching`. */
  readonly confidence: 'published' | 'pending-check' | 'out-of-range' | 'teaching';
  readonly plasma: number;
  readonly effectSite: number;
  readonly unit: string;
}

/** An entry destined for the event log. */
export interface EngineEvent {
  readonly tick: number;
  readonly severity: 'info' | 'advisory' | 'warning' | 'critical' | 'artifact';
  readonly category: string;
  readonly message: string;
  /** Stable id so the debrief and the transcript can refer to it. */
  readonly eventId: string;
  /** Structured payload, kept out of the message string so it stays translatable. */
  readonly data?: Readonly<Record<string, string | number | boolean>>;
}

/** An active alarm as the engine sees it. The monitor owns only the visual treatment. */
export interface EngineAlarm {
  readonly alarmId: string;
  readonly priority: 'high' | 'medium' | 'low';
  readonly parameter: string;
  readonly value: number;
  readonly unit: string;
  readonly message: string;
  readonly sinceTick: number;
  readonly silencedUntilTick: number | null;
}

/** A learner action, recorded verbatim in the transcript so replay is exact. */
export interface LearnerAction {
  readonly tick: number;
  readonly type: string;
  readonly payload: Readonly<Record<string, string | number | boolean>>;
}

// --- Messages to the worker ------------------------------------------------

export interface InitMessage {
  readonly v: number;
  readonly type: 'init';
  readonly scenarioId: string;
  readonly scenarioVersion: string;
  readonly contentVersion: string;
  readonly modelSetRevision: string;
  readonly engineVersion: string;
  readonly practiceRegion: string;
  readonly seed: number;
  /** The scenario document, already validated against the schema on the main thread. */
  readonly scenario: unknown;
}

export interface AdvanceMessage {
  readonly v: number;
  readonly type: 'advance';
  /** Number of 100 ms ticks to execute in this pass. */
  readonly ticks: number;
}

export interface ActionMessage {
  readonly v: number;
  readonly type: 'action';
  readonly action: LearnerAction;
}

export interface ReplayMessage {
  readonly v: number;
  readonly type: 'replay';
  /** A complete transcript to replay into a fresh worker. */
  readonly transcript: unknown;
}

export interface ResetMessage {
  readonly v: number;
  readonly type: 'reset';
}

export type ToWorkerMessage =
  | InitMessage | AdvanceMessage | ActionMessage | ReplayMessage | ResetMessage;

// --- Messages from the worker ----------------------------------------------

export interface ReadyMessage {
  readonly v: number;
  readonly type: 'ready';
  readonly engineVersion: string;
  readonly modelSetRevision: string;
}

/** The full per-tick emission. Every consumer reads from this one shape. */
/**
 * What the equipment is actually doing, as opposed to what the learner last
 * asked it to do.
 *
 * The action region has to render the engine's answer, not its own memory of the
 * request: a hypoxic guard can refuse an inspired oxygen fraction, a syringe can
 * run out mid-push, and an intubation attempt can fail. A control that shows the
 * request rather than the result teaches the learner to trust a number that is
 * not true (cockpit/action-cockpit → the tray reflects the patient).
 */
export interface EquipmentSnapshot {
  readonly ventilator: {
    readonly mode: 'volume-control' | 'pressure-control' | 'manual';
    readonly tidalVolumeMl: number;
    readonly respiratoryRateBpm: number;
    readonly freshGasFlowLPerMin: number;
    readonly fio2: number;
    readonly peep: number;
    readonly delivering: boolean;
    readonly sevofluranePercent: number;
  };
  readonly airway: {
    readonly intubated: boolean;
    /** The airway device actually in place; a facemask is the unsecured default. */
    readonly device: 'facemask' | 'supraglottic-airway' | 'tracheal-tube';
    readonly attempts: number;
    /** The Cormack-Lehane grade of the last attempt, or null before the first. */
    readonly lastGrade: number | null;
    /** True while an attempt is consuming simulated time. */
    readonly attemptInProgress: boolean;
    /** Whole simulated seconds remaining, or zero when no attempt is active. */
    readonly attemptSecondsRemaining: number;
    /** Whole seconds remaining in a bounded supraglottic-airway insertion. */
    readonly supraglotticInsertionSecondsRemaining: number;
    /** Accepted request for airway help, or null when none was made. */
    readonly helpRequestedAtTick: number | null;
    /** Fraction of the upper airway open to gas flow, without diagnosing its cause. */
    readonly patencyFraction: number;
    /** Modeled post-extubation soft-tissue obstruction severity, kept distinct from laryngospasm. */
    readonly postExtubationObstructionSeverity: number;
    /** Lower-airway obstruction that shapes the capnogram, kept distinct from patency. */
    readonly bronchospasmSeverity: number;
    /** Whole seconds left in the bounded held jaw-thrust/CPAP maneuver. */
    readonly jawThrustCpapSecondsRemaining: number;
  };
  readonly trachealTubePosition?: {
    readonly depthCm: number;
    readonly position: 'tracheal' | 'right-mainstem';
    readonly leftVentilation: 'present' | 'markedly-reduced';
    readonly rightVentilation: 'present' | 'markedly-reduced';
    readonly securement: 'intact';
    readonly cuffState: 'unchanged';
    readonly exhaledTidalVolumeMl: number;
    readonly peakPressureCmH2O: number;
    readonly plateauPressureCmH2O: number;
    readonly peepCmH2O: number;
    readonly continuousCapnography: boolean;
  };
  /** The physical delivery path for the propofol infusion. */
  readonly hypnoticLine: {
    /** False when the pump is running but its propofol is not reaching the patient. */
    readonly connected: boolean;
    /** True after the learner has deliberately inspected or reconnected the line. */
    readonly inspected: boolean;
  };
  /** The sidestream carbon-dioxide sample path, distinct from patient ventilation. */
  readonly capnographyLine: {
    readonly obstructed: boolean;
    readonly ventilationCrossChecked: boolean;
  };
  /** The circle breathing system, distinct from the sampled capnography line. */
  readonly breathingCircuit?: {
    readonly co2Absorbent: 'normal' | 'exhausted';
    readonly inspiredCo2MmHg: number;
    readonly capnogramAssessed: boolean;
    readonly absorbentReplaced: boolean;
  };
  /** The invasive-pressure display path, kept separate from canonical patient pressure. */
  readonly arterialLine?: {
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
  };
  /** Accepted crisis treatments and exposure, as distinct from requested actions. */
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
    /** Bounded local-anesthetic toxicity response state. Optional for older saved snapshots. */
    readonly localAnestheticToxicityFraction?: number;
    readonly seizureActivityFraction?: number;
    readonly seizureSuppressed?: boolean;
    readonly lipidEmulsionTotalMl?: number;
    readonly lipidEmulsionBolusRemainingMl?: number;
    readonly lipidEmulsionInfusionMlPerMin?: number;
    readonly lipidEmulsionEffectFraction?: number;
    readonly lastLipidEmulsionTick?: number | null;
    /** Bounded scripted cardiac-arrest response. Optional for older saved snapshots. */
    readonly cardiacArrestActive?: boolean;
    readonly chestCompressionsActive?: boolean;
    readonly chestCompressionSeconds?: number;
    readonly compressionPerfusionFraction?: number;
    readonly arrestEpinephrineTotalMg?: number;
    readonly lastArrestEpinephrineTick?: number | null;
    readonly defibrillationShockCount?: number;
    readonly lastDefibrillationEnergyJ?: number | null;
    readonly roscAtTick?: number | null;
    /** Early high-spinal and venous-air-embolism teaching drives. */
    readonly highSpinalFraction?: number;
    readonly ephedrineTotalMg?: number;
    readonly lastEphedrineTick?: number | null;
    /** Bounded severe-pregnancy-hypertension response. Optional for older saved snapshots. */
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
    /** Bounded positive-pressure pneumothorax response. Optional for older saved snapshots. */
    readonly tensionPneumothoraxFraction?: number;
    readonly pneumothoraxAssessedAtTick?: number | null;
    readonly pneumothoraxDecompressedAtTick?: number | null;
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
      readonly reperfusionAtTick: number | null;
      readonly supportAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly treatmentDeliveredByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly reperfusionPerformedByLearner: false;
      readonly deviceSelected: false;
      readonly liveEcgInterpreted: false;
      readonly imageAcquired: false;
      readonly nitrateSelected: false;
      readonly diureticSelected: false;
      readonly blindFluidLoading: false;
      readonly fixedFluidVolumeSelected: false;
      readonly treatmentDelivered: false;
      readonly pciPerformed: false;
      readonly reperfusionCompleted: false;
    };
    /** Bounded aspiration-risk recognition vignette. Optional for older saved snapshots. */
    readonly aspirationRiskAssessment?: {
      readonly cuesReviewedAtTick: number | null;
      readonly classification: 'elevated' | 'routine' | null;
      readonly classifiedAtTick: number | null;
      readonly plan: 'defer-and-replan' | 'proceed-routine' | null;
      readonly planAtTick: number | null;
    };
    /** Bounded emergence decision when quantitative monitoring shows residual blockade. */
    readonly emergenceResidualBlockAssessment?: {
      readonly monitorReviewedAtTick: number | null;
      readonly classification: 'residual' | 'recovered' | null;
      readonly classifiedAtTick: number | null;
      readonly plan: 'defer-extubation-and-support' | 'proceed-to-extubation' | null;
      readonly planAtTick: number | null;
    };
    /** Ordered delayed-emergence differential vignette. */
    readonly delayedEmergenceAssessment?: {
      readonly supportReviewedAtTick: number | null;
      readonly exposureReviewedAtTick: number | null;
      readonly metabolicReviewedAtTick: number | null;
      readonly neurologicExamAtTick: number | null;
      readonly escalation: 'urgent-neurologic-evaluation' | 'continue-routine-recovery' | null;
      readonly escalatedAtTick: number | null;
    };
    /** Ordered low-risk awake-extubation readiness vignette. */
    readonly extubationReadinessAssessment?: {
      readonly quantitativeRecoveryReviewedAtTick: number | null;
      readonly awakeAirwayReviewedAtTick: number | null;
      readonly gasExchangeReviewedAtTick: number | null;
      readonly airwayPlanReviewedAtTick: number | null;
      readonly decision: 'ready-for-planned-awake-extubation'
        | 'continue-support-and-reassess' | null;
      readonly decidedAtTick: number | null;
    };
    /** Bounded postoperative opioid-induced ventilatory impairment response. */
    readonly opioidVentilatoryResponse?: {
      readonly severity: number;
      readonly furtherOpioidHeldAtTick: number | null;
      readonly naloxoneIntentAtTick: number | null;
    };
    /** Bounded intraoperative hypothermia recognition and warming response. */
    readonly thermalResponse?: {
      readonly targetTemperatureC: number | null;
      readonly coreTemperatureConfirmedAtTick: number | null;
      readonly forcedAirWarmingAtTick: number | null;
      readonly warmedBulkFluidsAtTick: number | null;
    };
    /** Bounded perioperative hyperglycemia recognition and response. */
    readonly glycemicResponse?: {
      readonly pointOfCareGlucoseMgPerDl: number | null;
      readonly pointOfCareConfirmedAtTick: number | null;
      readonly insulinProtocolIntentAtTick: number | null;
      readonly repeatEligible: boolean;
      readonly repeatPointOfCareAtTick: number | null;
      readonly repeatPointOfCareGlucoseMgPerDl: number | null;
    };
    /** Bounded pacemaker and electrosurgery planning vignette. */
    readonly ciedPlanningAssessment?: {
      readonly deviceRecordReviewedAtTick: number | null;
      readonly procedureRiskReviewedAtTick: number | null;
      readonly plan: 'coordinate-asynchronous-pacing' | 'apply-unverified-magnet'
        | 'proceed-no-change' | null;
      readonly planAtTick: number | null;
      readonly backupAndRestorationDocumentedAtTick: number | null;
    };
    /** Bounded postoperative transfer-of-care vignette. */
    readonly postoperativeHandoffAssessment?: {
      readonly receiverReadyAtTick: number | null;
      readonly patientAndCourseAtTick: number | null;
      readonly currentStateAtTick: number | null;
      readonly risksActionsOwnershipAtTick: number | null;
      readonly receiverReadbackAtTick: number | null;
      readonly transferAcceptedAtTick: number | null;
    };
    /** Ordered fixed-vignette assessment and reassessment of undifferentiated shock. */
    readonly undifferentiatedShockAssessment?: {
      readonly perfusionReviewedAtTick: number | null;
      readonly lactateReviewedAtTick: number | null;
      readonly focusedEchoReviewedAtTick: number | null;
      readonly passiveLegRaiseAtTick: number | null;
      readonly fluidChallengeAtTick: number | null;
      readonly perfusionReassessedAtTick: number | null;
      readonly escalationAtTick: number | null;
    };
    /** Ordered recognition and initial-response intents for the fixed septic-shock vignette. */
    readonly septicShockAssessment?: {
      readonly infectionAndOrganDysfunctionReviewedAtTick: number | null;
      readonly culturesAndLactateAtTick: number | null;
      readonly antimicrobialIntentAtTick: number | null;
      readonly initialCrystalloidAtTick: number | null;
      readonly postFluidReassessmentAtTick: number | null;
      readonly norepinephrineIntentAtTick: number | null;
      readonly sourceControlEscalationAtTick: number | null;
    };
    /** Ordered recognition and initial-response intents for traumatic hemorrhagic shock. */
    readonly hemorrhagicShockAssessment?: {
      readonly mechanismAndPerfusionReviewedAtTick: number | null;
      readonly pelvicStabilizationAtTick: number | null;
      readonly majorHemorrhageActivatedAtTick: number | null;
      readonly redCellsAtTick: number | null;
      readonly coagulationAndTemperatureAtTick: number | null;
      readonly reassessedAtTick: number | null;
      readonly definitiveControlEscalatedAtTick: number | null;
    };
    /** Accepted quantitative neuromuscular-reversal teaching state. */
    readonly neuromuscularReversalFraction?: number;
    readonly postTetanicCount?: number;
    readonly lastNeuromuscularReversal?: {
      readonly agent: 'sugammadex' | 'neostigmine';
      readonly doseMgPerKg: number | null;
      readonly tick: number;
    } | null;
  };
  /** The most recent modeled trigger exposure, without diagnosing the response. */
  readonly lastExposure: { readonly agentId: string; readonly tick: number } | null;
  /** Most recently accepted manual crisis injection, or null before one is used. */
  readonly lastInjectedCrisis: { readonly crisisId: string; readonly tick: number } | null;
  /** All accepted manual crisis ids in this session, used to disable truthful repeat controls. */
  readonly injectedCrisisIds: readonly string[];
  /** Per drug: the running infusion rate and what is left in the syringe. */
  readonly drugs: readonly {
    readonly drugId: string;
    readonly infusionRate: number;
    readonly infusionUnit: string;
    readonly infusionSinceTick: number | null;
    readonly syringeRemainingMl: number;
  }[];
  /**
   * Simulated seconds spent at an inspired oxygen fraction of 0.8 or above with
   * the airway not yet secured. The debrief judges the preoxygenation objective
   * on this, so it has to be the engine's count and not the interface's guess.
   */
  readonly preoxygenationSeconds: number;
  /** The rhythm currently driving the electrocardiogram. */
  readonly rhythmId: string;
  /** Parameters that cannot be measured right now, so the tile shows `--`. */
  readonly invalidParameters: readonly string[];
  /** Parameters a sensor artifact is currently corrupting. */
  readonly artifactParameters: readonly string[];
  /** Waveform signals a sensor artifact is currently corrupting. */
  readonly waveformArtifacts: readonly string[];
}

export interface StateMessage<TState> {
  readonly v: number;
  readonly type: 'state';
  readonly tick: number;
  readonly state: TState;
  readonly concentrations: readonly DrugConcentration[];
  readonly attribution: readonly Attribution[];
  readonly waveforms: readonly WaveformBlock[];
  readonly alarms: readonly EngineAlarm[];
  readonly events: readonly EngineEvent[];
  /** Engine warnings, such as a state variable clamped at its hard bound. */
  readonly warnings: readonly string[];
  readonly equipment: EquipmentSnapshot;
}

export interface ErrorMessage {
  readonly v: number;
  readonly type: 'error';
  readonly code: string;
  readonly message: string;
}

export type FromWorkerMessage<TState> = ReadyMessage | StateMessage<TState> | ErrorMessage;

/** Reject a message from an incompatible protocol version rather than guessing. */
export function assertProtocolVersion(message: { v: number }): void {
  if (message.v !== WORKER_PROTOCOL_VERSION) {
    throw new Error(
      `Worker protocol mismatch: message version ${message.v}, this build speaks ${WORKER_PROTOCOL_VERSION}`,
    );
  }
}

/** The transferable buffers in a state message, so the structured clone is cheap. */
export function transferablesOf<TState>(message: StateMessage<TState>): Transferable[] {
  return message.waveforms.map((block) => block.samples.buffer as ArrayBuffer);
}
