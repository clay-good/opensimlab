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

/** Bumped whenever the message shape changes incompatibly. Version 164 reports maternal-sepsis state. */
export const WORKER_PROTOCOL_VERSION = 164;

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
  /** Scenario-scoped tracheostomy gas path, kept distinct from an oral tracheal tube. */
  readonly tracheostomy?: {
    readonly present: true;
    readonly device: 'cuffless-dual-cannula';
    readonly stoma: 'established';
    readonly nativeUpperAirway: 'patent';
    readonly innerCannula: 'obstructed' | 'removed-by-qualified-team';
    /** Fraction of the declared tracheostomy gas path that is patent. */
    readonly patencyFraction: number;
    readonly airflow: 'scant' | 'restored';
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
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly bronchiolitisWorkingPatternAuthored: true; readonly hypoxemiaAuthored: true;
      readonly poorIntakeAuthored: true; readonly preservedPerfusionAuthored: true;
      readonly currentApneaAuthored: false; readonly experiencedSupportActivated: boolean;
      readonly patientExaminedByLearner: false; readonly monitorInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly testAcquiredByLearner: false;
      readonly oxygenSelectedByLearner: false; readonly oxygenDeliveredByLearner: false;
      readonly deviceSelectedByLearner: false; readonly flowSelectedByLearner: false;
      readonly fio2SelectedByLearner: false; readonly oxygenTargetSelectedByLearner: false;
      readonly feedingDeliveredByLearner: false; readonly fluidRouteSelectedByLearner: false;
      readonly fluidDeliveredByLearner: false; readonly suctionPerformedByLearner: false;
      readonly drugDeliveredByLearner: false; readonly ventilationDeliveredByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly durableRecoveryProven: false; readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly croupAssessment?: {
      readonly patternAtTick: number | null; readonly severityAtTick: number | null;
      readonly treatmentIntentAtTick: number | null; readonly earlyResponseAtTick: number | null;
      readonly recurrenceAtTick: number | null; readonly handoffAtTick: number | null;
      readonly lastUnsupportedChoice: 'albuterol' | 'radiograph' | 'discharge-early'
        | 'normal-saturation' | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly croupWorkingPatternAuthored: true; readonly stridorAtRestAuthored: true;
      readonly preservedRoomAirOxygenationAuthored: true; readonly abruptChokingAuthored: false;
      readonly lowerAirwayPatternAuthored: false; readonly droolingOrToxicAppearanceAuthored: false;
      readonly experiencedTreatmentAuthored: boolean; readonly recurrenceAuthored: boolean;
      readonly patientExaminedByLearner: false; readonly monitorInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly testAcquiredByLearner: false;
      readonly imagingAcquiredByLearner: false; readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly concentrationSelectedByLearner: false; readonly oxygenSelectedByLearner: false;
      readonly deviceSelectedByLearner: false; readonly flowSelectedByLearner: false;
      readonly nebulizerOperatedByLearner: false; readonly airwayManeuverPerformedByLearner: false;
      readonly ventilationDeliveredByLearner: false; readonly intubationPerformedByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly durableRecoveryProven: false; readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly pediatricStatusAsthmaticusAssessment?: {
      readonly trajectoryAtTick: number | null; readonly nonresponseAtTick: number | null;
      readonly escalationAtTick: number | null; readonly secondLineIntentAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly lastUnsupportedChoice: 'force-peak-flow' | 'radiograph-delay'
        | 'trigger-review-delay' | 'saturation-discharge' | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly asthmaHistoryAuthored: true; readonly treatmentRecordAuthored: true;
      readonly persistentSevereNonresponseAuthored: true;
      readonly experiencedSecondLineCareAuthored: boolean; readonly partialResponseAuthored: boolean;
      readonly quietChestAuthored: false; readonly respiratoryFailureAuthored: false;
      readonly anaphylaxisPatternAuthored: false; readonly upperAirwayPatternAuthored: false;
      readonly foreignBodyPatternAuthored: false;
      readonly patientExaminedByLearner: false; readonly monitorInterpretedByLearner: false;
      readonly pefMeasuredByLearner: false; readonly scoreCalculatedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly testAcquiredByLearner: false;
      readonly imagingAcquiredByLearner: false; readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly concentrationSelectedByLearner: false; readonly oxygenSelectedByLearner: false;
      readonly deviceSelectedByLearner: false; readonly flowSelectedByLearner: false;
      readonly nebulizerOperatedByLearner: false; readonly ivAccessPlacedByLearner: false;
      readonly infusionOperatedByLearner: false; readonly airwayManeuverPerformedByLearner: false;
      readonly ventilationDeliveredByLearner: false; readonly intubationPerformedByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly durableRecoveryProven: false; readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly pediatricSepsisAssessment?: {
      readonly patternAtTick: number | null; readonly shockBoundaryAtTick: number | null;
      readonly careAtTick: number | null; readonly sourceReviewAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly suspectedInfectionAuthored: true; readonly coagulationDysfunctionAuthored: true;
      readonly phoenixSepsisScoreAuthored: 2;
      readonly phoenixCardiovascularSubscoreAuthored: 0;
      readonly sepsisWithoutShockAuthored: true; readonly hypotensionAuthored: false;
      readonly respiratoryDysfunctionAuthored: false; readonly neurologicDysfunctionAuthored: false;
      readonly qualifiedCareOwnershipConfirmed: boolean; readonly laterReportAuthored: boolean;
      readonly sourceConfirmed: false; readonly pathogenIdentified: false;
      readonly patientExaminedByLearner: false; readonly monitorInterpretedByLearner: false;
      readonly scoreCalculatedByLearner: false; readonly testAcquiredByLearner: false;
      readonly testInterpretedByLearner: false; readonly cultureAcquiredByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly antimicrobialSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly concentrationSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false; readonly fluidSelectedByLearner: false;
      readonly fluidVolumeSelectedByLearner: false; readonly fluidRateSelectedByLearner: false;
      readonly fluidDeliveredByLearner: false; readonly vasoactiveSelectedByLearner: false;
      readonly oxygenSelectedByLearner: false; readonly deviceSelectedByLearner: false;
      readonly oxygenFlowSelectedByLearner: false; readonly oxygenDeliveredByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly treatmentEffectProven: false; readonly durableRecoveryProven: false;
      readonly dischargeReadinessProven: false; readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly pediatricSepticShockAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly rescueAtTick: number | null; readonly sourceAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly suspectedInfectionAuthored: true; readonly organDysfunctionAuthored: true;
      readonly impairedPerfusionAuthored: true; readonly septicShockAuthored: true;
      readonly phoenixScoreAuthored: 2; readonly phoenixCardiovascularSubscoreAuthored: 2;
      readonly congestionWarningsAuthored: true; readonly qualifiedCareRecordAuthored: true;
      readonly qualifiedVasoactiveOwnershipActive: boolean;
      readonly qualifiedSourceControlOwnershipActive: boolean;
      readonly laterReportAuthored: boolean; readonly persistentShockAuthored: boolean;
      readonly sourceConfirmed: false; readonly pathogenIdentified: false;
      readonly patientExaminedByLearner: false; readonly monitorInterpretedByLearner: false;
      readonly scoreCalculatedByLearner: false; readonly testAcquiredByLearner: false;
      readonly testInterpretedByLearner: false; readonly cultureAcquiredByLearner: false;
      readonly imagingAcquiredByLearner: false; readonly imagingInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly antimicrobialSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly concentrationSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false; readonly fluidSelectedByLearner: false;
      readonly fluidVolumeSelectedByLearner: false; readonly fluidRateSelectedByLearner: false;
      readonly fluidDeliveredByLearner: false; readonly vasoactiveSelectedByLearner: false;
      readonly vasoactiveRateSelectedByLearner: false; readonly infusionOperatedByLearner: false;
      readonly oxygenSelectedByLearner: false; readonly deviceSelectedByLearner: false;
      readonly oxygenFlowSelectedByLearner: false; readonly oxygenDeliveredByLearner: false;
      readonly airwayManeuverPerformedByLearner: false;
      readonly ventilationDeliveredByLearner: false; readonly procedurePerformedByLearner: false;
      readonly sourceControlPerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly treatmentEffectProven: false;
      readonly durableRecoveryProven: false; readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly pediatricDehydrationAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly rehydrationAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly gastrointestinalLossesAuthored: true; readonly reducedIntakeAuthored: true;
      readonly clinicalDehydrationAuthored: true; readonly compensatedHypovolemiaAuthored: true;
      readonly shockAuthored: false; readonly bleedingAuthored: false;
      readonly sepsisAuthored: false; readonly diabeticKetoacidosisAuthored: false;
      readonly qualifiedRehydrationOwnershipActive: boolean;
      readonly qualifiedSafetyReviewActive: boolean; readonly laterReportAuthored: boolean;
      readonly patientExaminedByLearner: false; readonly patientWeighedByLearner: false;
      readonly dehydrationPercentageCalculatedByLearner: false;
      readonly fluidDeficitCalculatedByLearner: false;
      readonly maintenanceCalculatedByLearner: false;
      readonly testAcquiredByLearner: false; readonly testInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly glucoseSelectedByLearner: false;
      readonly electrolyteSelectedByLearner: false; readonly drugSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly accessPlacedByLearner: false;
      readonly fluidSelectedByLearner: false; readonly fluidVolumeSelectedByLearner: false;
      readonly fluidRateSelectedByLearner: false; readonly fluidDeliveredByLearner: false;
      readonly feedingPlanSelectedByLearner: false; readonly oxygenSelectedByLearner: false;
      readonly deviceSelectedByLearner: false; readonly airwayManeuverPerformedByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly treatmentEffectProven: false; readonly durableRecoveryProven: false;
      readonly dischargeReadinessProven: false; readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly pediatricDiabeticKetoacidosisAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly careAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly pediatricDkaAuthored: true; readonly dehydrationAuthored: true;
      readonly shockAuthored: false; readonly cerebralInjuryAuthored: false;
      readonly cerebralInjuryRiskActive: true; readonly fixedBiochemicalPatternAuthored: true;
      readonly qualifiedCareOwnershipActive: boolean;
      readonly qualifiedSafetyReviewActive: boolean; readonly laterReportAuthored: boolean;
      readonly patientExaminedByLearner: false; readonly neurologicExamPerformedByLearner: false;
      readonly dehydrationCalculatedByLearner: false; readonly sodiumCalculatedByLearner: false;
      readonly osmolalityCalculatedByLearner: false; readonly anionGapCalculatedByLearner: false;
      readonly testAcquiredByLearner: false; readonly testInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly severityCalculatedByLearner: false;
      readonly fluidSelectedByLearner: false; readonly insulinSelectedByLearner: false;
      readonly electrolyteSelectedByLearner: false; readonly glucoseSelectedByLearner: false;
      readonly fluidDeliveredByLearner: false; readonly drugSelectedByLearner: false;
      readonly deviceSelectedByLearner: false; readonly procedurePerformedByLearner: false;
      readonly doseSelectedByLearner: false; readonly concentrationSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly accessPlacedByLearner: false;
      readonly fluidVolumeSelectedByLearner: false; readonly fluidRateSelectedByLearner: false;
      readonly infusionOperatedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly cerebralInjuryExcluded: false; readonly treatmentEffectProven: false;
      readonly biochemicalResolutionProven: false; readonly durableRecoveryProven: false;
      readonly dischargeReadinessProven: false; readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly pediatricHypoglycemicSeizureAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly rescueAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly seizureAuthored: true; readonly hypoglycemiaAuthored: true;
      readonly initialGlucoseMgPerDl: 34; readonly laterGlucoseMgPerDl: 86;
      readonly qualifiedRescueOwnershipActive: boolean;
      readonly qualifiedSafetyReviewActive: boolean; readonly laterReportAuthored: boolean;
      readonly patientExaminedByLearner: false; readonly glucoseAcquiredByLearner: false;
      readonly glucoseInterpretedByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly drugSelectedByLearner: false; readonly glucoseFormulationSelectedByLearner: false;
      readonly doseSelectedByLearner: false; readonly concentrationSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly volumeSelectedByLearner: false;
      readonly rateSelectedByLearner: false; readonly accessPlacedByLearner: false;
      readonly deviceSelectedByLearner: false; readonly drugDeliveredByLearner: false;
      readonly glucoseDeliveredByLearner: false; readonly airwayManeuverPerformedByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly treatmentEffectProven: false; readonly seizureCauseProven: false;
      readonly durableEuglycemiaProven: false; readonly neurologicRecoveryProven: false;
      readonly recurrenceExcluded: false; readonly dispositionDetermined: false;
      readonly outcomePredicted: false;
    };
    readonly pediatricFebrileSeizureAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly careAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly stoppedSeizureAuthored: true; readonly feverAuthored: true;
      readonly statusEpilepticusAuthored: false; readonly qualifiedCareOwnershipActive: boolean;
      readonly qualifiedSafetyReviewActive: boolean; readonly laterReportAuthored: boolean;
      readonly patientExaminedByLearner: false; readonly temperatureAcquiredByLearner: false;
      readonly testAcquiredByLearner: false; readonly testInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly classificationMadeByLearner: false;
      readonly lumbarPuncturePerformedByLearner: false; readonly eegAcquiredByLearner: false;
      readonly imagingAcquiredByLearner: false; readonly drugSelectedByLearner: false;
      readonly antipyreticSelectedByLearner: false;
      readonly anticonvulsantSelectedByLearner: false;
      readonly antimicrobialSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly concentrationSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly volumeSelectedByLearner: false; readonly rateSelectedByLearner: false;
      readonly accessPlacedByLearner: false; readonly deviceSelectedByLearner: false;
      readonly drugDeliveredByLearner: false; readonly airwayManeuverPerformedByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly simpleFebrileSeizureFinallyProven: false; readonly benignCourseProven: false;
      readonly seizureCauseProven: false; readonly cnsInfectionExcluded: false;
      readonly seriousInfectionExcluded: false;
      readonly treatmentEffectProven: false; readonly durableRecoveryProven: false;
      readonly recurrenceExcluded: false; readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly pediatricStatusEpilepticusAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly secondLineAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly initialOngoingConvulsionAuthored: true; readonly statusThresholdAuthored: true;
      readonly firstLineCareAuthored: true; readonly qualifiedSecondLineOwnershipActive: boolean;
      readonly qualifiedSafetyReviewActive: boolean; readonly laterReportAuthored: boolean;
      readonly patientExaminedByLearner: false; readonly seizureTimedByLearner: false;
      readonly monitoringAcquiredByLearner: false; readonly glucoseAcquiredByLearner: false;
      readonly glucoseInterpretedByLearner: false; readonly testAcquiredByLearner: false;
      readonly testInterpretedByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly drugSelectedByLearner: false; readonly benzodiazepineSelectedByLearner: false;
      readonly antiseizureDrugSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly concentrationSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly volumeSelectedByLearner: false; readonly rateSelectedByLearner: false;
      readonly accessPlacedByLearner: false; readonly deviceSelectedByLearner: false;
      readonly drugDeliveredByLearner: false; readonly oxygenDeliveredByLearner: false;
      readonly airwayManeuverPerformedByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly seizureCauseProven: false; readonly treatmentEffectProven: false;
      readonly electrographicSeizureControlProven: false;
      readonly durableSeizureControlProven: false; readonly neurologicRecoveryProven: false;
      readonly recurrenceExcluded: false; readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly pediatricAnaphylaxisAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly firstLineAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly plausibleExposureAuthored: true; readonly multisystemCompromiseAuthored: true;
      readonly firstLineCareAuthored: true; readonly qualifiedFirstLineOwnershipActive: boolean;
      readonly qualifiedSafetyReviewActive: boolean; readonly laterReportAuthored: boolean;
      readonly patientExaminedByLearner: false; readonly exposureVerifiedByLearner: false;
      readonly monitoringAcquiredByLearner: false; readonly testAcquiredByLearner: false;
      readonly testInterpretedByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly classificationMadeByLearner: false; readonly positioningPerformedByLearner: false;
      readonly triggerRemovedByLearner: false; readonly drugSelectedByLearner: false;
      readonly epinephrineSelectedByLearner: false; readonly productSelectedByLearner: false;
      readonly concentrationSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly intervalSelectedByLearner: false;
      readonly volumeSelectedByLearner: false; readonly rateSelectedByLearner: false;
      readonly accessPlacedByLearner: false; readonly deviceSelectedByLearner: false;
      readonly drugDeliveredByLearner: false; readonly oxygenDeliveredByLearner: false;
      readonly fluidDeliveredByLearner: false; readonly airwayManeuverPerformedByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly anaphylaxisFinallyProven: false; readonly triggerConfirmed: false;
      readonly treatmentEffectProven: false; readonly airwayRiskResolved: false;
      readonly shockResolved: false; readonly refractoryAnaphylaxisExcluded: false;
      readonly biphasicReactionExcluded: false; readonly recurrenceExcluded: false;
      readonly durableRecoveryProven: false; readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false; readonly outcomePredicted: false;
    };
    readonly pediatricSupraventricularTachycardiaAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly careAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true; readonly spontaneousBreathingAuthored: true;
      readonly abruptRegularNarrowTachycardiaAuthored: true;
      readonly probableSvtPatternAuthored: true; readonly perfusionCompromiseAuthored: true;
      readonly qualifiedRhythmCareOwnershipActive: boolean;
      readonly qualifiedSafetyReviewActive: boolean; readonly laterReportAuthored: boolean;
      readonly laterSinusRhythmAuthored: boolean;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly ecgAcquiredByLearner: false; readonly ecgInterpretedByLearner: false;
      readonly testAcquiredByLearner: false; readonly testInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly mechanismAssignedByLearner: false;
      readonly maneuverPerformedByLearner: false; readonly accessPlacedByLearner: false;
      readonly modalitySelectedByLearner: false; readonly drugSelectedByLearner: false;
      readonly adenosineSelectedByLearner: false; readonly productSelectedByLearner: false;
      readonly concentrationSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly volumeSelectedByLearner: false;
      readonly rateSelectedByLearner: false; readonly deviceSelectedByLearner: false;
      readonly energySelectedByLearner: false; readonly sedationSelectedByLearner: false;
      readonly oxygenDeliveredByLearner: false; readonly drugDeliveredByLearner: false;
      readonly cardioversionPerformedByLearner: false;
      readonly airwayManeuverPerformedByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly svtFinallyProven: false; readonly sinusTachycardiaExcluded: false;
      readonly mechanismProven: false; readonly causeProven: false;
      readonly treatmentEffectProven: false; readonly durableConversionProven: false;
      readonly durableRecoveryProven: false; readonly heartFailureExcluded: false;
      readonly deteriorationExcluded: false; readonly recurrenceExcluded: false;
      readonly dischargeReadinessProven: false; readonly dispositionDetermined: false;
      readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly pediatricBradycardicArrestAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly resuscitationAtTick: number | null; readonly safetyAtTick: number | null;
      readonly laterResponseAtTick: number | null; readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly effectiveAssistedVentilationAuthored: true;
      readonly persistentBradycardiaWithCompromiseAuthored: true;
      readonly laterPulseLossAuthored: boolean; readonly laterPeaAuthored: boolean;
      readonly qualifiedResuscitationOwnershipActive: boolean;
      readonly qualifiedSafetyReviewActive: boolean; readonly laterReportAuthored: boolean;
      readonly patientExaminedByLearner: false; readonly pulseAssessedByLearner: false;
      readonly monitoringAcquiredByLearner: false; readonly ecgAcquiredByLearner: false;
      readonly ecgInterpretedByLearner: false; readonly testAcquiredByLearner: false;
      readonly testInterpretedByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly causeAssignedByLearner: false; readonly cprDeliveredByLearner: false;
      readonly chestCompressionsDeliveredByLearner: false;
      readonly oxygenDeliveredByLearner: false; readonly ventilationDeliveredByLearner: false;
      readonly accessPlacedByLearner: false; readonly drugSelectedByLearner: false;
      readonly epinephrineSelectedByLearner: false; readonly productSelectedByLearner: false;
      readonly concentrationSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly intervalSelectedByLearner: false;
      readonly volumeSelectedByLearner: false; readonly rateSelectedByLearner: false;
      readonly fluidDeliveredByLearner: false; readonly pacingSelectedByLearner: false;
      readonly deviceSelectedByLearner: false; readonly currentSelectedByLearner: false;
      readonly energySelectedByLearner: false; readonly shockDeliveredByLearner: false;
      readonly defibrillationPerformedByLearner: false;
      readonly airwayManeuverPerformedByLearner: false;
      readonly procedurePerformedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly causeProven: false; readonly conductionMechanismProven: false;
      readonly treatmentEffectProven: false; readonly roscReported: false;
      readonly durableRoscProven: false; readonly durableRecoveryProven: false;
      readonly neurologicRecoveryProven: false; readonly recurrenceExcluded: false;
      readonly deathDeclared: false; readonly resuscitationTerminated: false;
      readonly dischargeReadinessProven: false; readonly dispositionDetermined: false;
      readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly pediatricForeignBodyAirwayObstructionAssessment?: {
      readonly reconciledAtTick: number | null;
      readonly effectiveCoughAtTick: number | null;
      readonly severeResponsiveAtTick: number | null;
      readonly responsivePathwayAtTick: number | null;
      readonly unresponsivePathwayAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly witnessedAbruptChokingAuthored: true;
      readonly initialEffectiveCoughAuthored: true;
      readonly initialPulsePresent: true;
      readonly continuousSurveillanceAuthored: boolean;
      readonly severeResponsiveTransitionAuthored: boolean;
      readonly severeResponsivePulsePresent: boolean;
      readonly qualifiedResponsivePathwayActive: boolean;
      readonly unresponsiveNoNormalBreathingAuthored: boolean;
      readonly unresponsivePulseStatusUnavailable: boolean;
      readonly qualifiedUnresponsiveCprPathwayActive: boolean;
      readonly patientExaminedByLearner: false;
      readonly responsivenessAssessedByLearner: false;
      readonly pulseAssessedByLearner: false;
      readonly airwayAssessedByLearner: false;
      readonly coughAssessedByLearner: false;
      readonly coughEncouragedByLearner: false;
      readonly monitoringAcquiredByLearner: false;
      readonly testAcquiredByLearner: false;
      readonly testInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly objectVisualizedByLearner: false;
      readonly objectRemovedByLearner: false;
      readonly maneuverPerformedByLearner: false;
      readonly backBlowsPerformedByLearner: false;
      readonly abdominalThrustsPerformedByLearner: false;
      readonly chestThrustsPerformedByLearner: false;
      readonly blindFingerSweepPerformedByLearner: false;
      readonly cprDeliveredByLearner: false;
      readonly chestCompressionsDeliveredByLearner: false;
      readonly oxygenDeliveredByLearner: false;
      readonly ventilationDeliveredByLearner: false;
      readonly accessPlacedByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly deviceSelectedByLearner: false;
      readonly suctionPerformedByLearner: false;
      readonly laryngoscopyPerformedByLearner: false;
      readonly forcepsUsedByLearner: false;
      readonly airwayManeuverPerformedByLearner: false;
      readonly procedurePerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly objectClearanceReported: false;
      readonly completeClearanceProven: false;
      readonly aspirationExcluded: false;
      readonly airwayInjuryExcluded: false;
      readonly treatmentEffectProven: false;
      readonly cardiacArrestDeclared: false;
      readonly pulseLossProven: false;
      readonly roscReported: false;
      readonly durableRecoveryProven: false;
      readonly recurrenceExcluded: false;
      readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly pediatricInjurySafeguardingAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly concernAtTick: number | null;
      readonly safeguardingAtTick: number | null;
      readonly alternativesAtTick: number | null;
      readonly laterSafetyAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly spontaneousBreathingAuthored: true;
      readonly stablePhysiologyAuthored: true;
      readonly independentlyMobileAuthored: true;
      readonly concerningInjuryPatternAuthored: true;
      readonly suppliedHistoryDevelopmentMismatchAuthored: true;
      readonly safeguardingConcernAuthored: boolean;
      readonly qualifiedSafeguardingOwnershipActive: boolean;
      readonly qualifiedImmediateSafetyOwnershipActive: boolean;
      readonly medicalAlternativesRemainOpen: true;
      readonly laterChildRemainsInQualifiedCareAuthored: boolean;
      readonly patientExaminedByLearner: false;
      readonly developmentAssessedByLearner: false;
      readonly historyTakenByLearner: false;
      readonly caregiverInterviewedByLearner: false;
      readonly disclosureSolicitedByLearner: false;
      readonly identifyingInformationCollected: false;
      readonly freeTextDisclosureCollected: false;
      readonly bruiseIdentifiedByLearner: false;
      readonly bruiseDatedByLearner: false;
      readonly photographCapturedByLearner: false;
      readonly bodyMapCreatedByLearner: false;
      readonly screeningRuleCalculatedByLearner: false;
      readonly testAcquiredByLearner: false;
      readonly testInterpretedByLearner: false;
      readonly imagingAcquiredByLearner: false;
      readonly imagingInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly abuseDiagnosedByLearner: false;
      readonly perpetratorNamedByLearner: false;
      readonly caregiverCredibilityJudgedByLearner: false;
      readonly caregiverConfrontedByLearner: false;
      readonly caregiverSeparatedByLearner: false;
      readonly reportingThresholdDeterminedByLearner: false;
      readonly jurisdictionSelectedByLearner: false;
      readonly agencySelectedByLearner: false;
      readonly agencyContactedByLearner: false;
      readonly referralSubmittedByLearner: false;
      readonly reportSubmittedByLearner: false;
      readonly custodyActionSelectedByLearner: false;
      readonly childRemovedByLearner: false;
      readonly safetyPlanDeterminedByLearner: false;
      readonly monitoringAcquiredByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false;
      readonly fluidSelectedByLearner: false;
      readonly oxygenSelectedByLearner: false;
      readonly deviceSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly procedurePerformedByLearner: false;
      readonly abuseFinallyProven: false;
      readonly perpetratorIdentified: false;
      readonly caregiverCredibilityDetermined: false;
      readonly medicalMimicExcluded: false;
      readonly occultInjuryExcluded: false;
      readonly immediateSafetyProven: false;
      readonly futureHarmExcluded: false;
      readonly referralCompletionProven: false;
      readonly legalReportingCompleted: false;
      readonly custodyDetermined: false;
      readonly durableSafetyProven: false;
      readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyMinorStrokeAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly threatsAtTick: number | null;
      readonly boundaryAtTick: number | null;
      readonly intentAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly spontaneousBreathingAuthored: true;
      readonly persistentFocalDeficitAuthored: true;
      readonly individualizedFunctionIntactAuthored: true;
      readonly fixedImagingAuthored: true;
      readonly suppliedGlucoseAuthored: true;
      readonly nondisablingBoundaryAuthored: boolean;
      readonly boundaryRevisable: true;
      readonly qualifiedAntiplateletStrategyIntentActive: boolean;
      readonly qualifiedNeurologicSurveillanceActive: boolean;
      readonly laterPersistentDeficitWithoutSpreadAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly neurologicExamPerformedByLearner: false;
      readonly scoreCalculatedByLearner: false;
      readonly disabilityAdjudicatedByLearner: false;
      readonly clockDeterminedByLearner: false;
      readonly glucoseAcquiredByLearner: false;
      readonly bloodPressureAcquiredByLearner: false;
      readonly testAcquiredByLearner: false;
      readonly testInterpretedByLearner: false;
      readonly imagingAcquiredByLearner: false;
      readonly imagingInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly strokeMimicExcluded: false;
      readonly thrombolysisEligibilityDeterminedByLearner: false;
      readonly antiplateletEligibilityDeterminedByLearner: false;
      readonly productSelectedByLearner: false;
      readonly combinationSelectedByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly durationSelectedByLearner: false;
      readonly concentrationSelectedByLearner: false;
      readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false;
      readonly prescriptionCreatedByLearner: false;
      readonly medicationPreparedByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly bloodPressureTargetSelectedByLearner: false;
      readonly reperfusionSelectedByLearner: false;
      readonly reperfusionPerformedByLearner: false;
      readonly deviceSelectedByLearner: false;
      readonly procedurePerformedByLearner: false;
      readonly swallowAssessmentPerformedByLearner: false;
      readonly dietSelectedByLearner: false;
      readonly rehabilitationSelectedByLearner: false;
      readonly dispositionDeterminedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly strokeMechanismProven: false;
      readonly etiologyProven: false;
      readonly treatmentEffectProven: false;
      readonly infarctResolutionProven: false;
      readonly hemorrhagicTransformationExcluded: false;
      readonly deteriorationExcluded: false;
      readonly durableNeurologicStabilityProven: false;
      readonly completeRecoveryProven: false;
      readonly lowRecurrenceRiskProven: false;
      readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyBasilarLvoAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly imagingAtTick: number | null;
      readonly boundaryAtTick: number | null;
      readonly activationAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly spontaneousBreathingAuthored: true;
      readonly posteriorCirculationSyndromeAuthored: true;
      readonly disablingDeficitAuthored: true;
      readonly basilarOcclusionAuthored: true;
      readonly fixedImagingAuthored: true;
      readonly thrombectomyEscalationBoundaryAuthored: boolean;
      readonly qualifiedEndovascularOwnershipActive: boolean;
      readonly qualifiedAirwayCapableOwnershipActive: boolean;
      readonly laterPosteriorSyndromePersistsAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly neurologicExamPerformedByLearner: false;
      readonly scoreCalculatedByLearner: false;
      readonly clockDeterminedByLearner: false;
      readonly imagingAcquiredByLearner: false;
      readonly imagingInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly strokeMimicExcluded: false;
      readonly eligibilityDeterminedByLearner: false;
      readonly thrombolysisSelectedByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly bloodPressureTargetSelectedByLearner: false;
      readonly transportSelectedByLearner: false;
      readonly airwayDeviceSelectedByLearner: false;
      readonly airwayProcedurePerformedByLearner: false;
      readonly anesthesiaSelectedByLearner: false;
      readonly thrombectomyDeviceSelectedByLearner: false;
      readonly procedureSelectedByLearner: false;
      readonly procedurePerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly vesselPatencyProven: false;
      readonly reperfusionProven: false;
      readonly treatmentEffectProven: false;
      readonly durableAirwayProtectionProven: false;
      readonly durableNeurologicRecoveryProven: false;
      readonly deteriorationExcluded: false;
      readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyCerebellarIchAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly imagingAtTick: number | null;
      readonly boundaryAtTick: number | null;
      readonly ownershipAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly spontaneousBreathingAuthored: true;
      readonly cerebellarDeficitAuthored: true;
      readonly initialAlertnessAuthored: true;
      readonly cerebellarIchAuthored: true;
      readonly fourthVentricleEffacementAuthored: true;
      readonly posteriorFossaEscalationBoundaryAuthored: boolean;
      readonly qualifiedNeurocriticalOwnershipActive: boolean;
      readonly qualifiedNeurosurgicalOwnershipActive: boolean;
      readonly qualifiedAirwayCapableOwnershipActive: boolean;
      readonly laterDeteriorationAuthored: boolean;
      readonly obstructiveHydrocephalusAuthored: boolean;
      readonly brainstemCompressionAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly neurologicExamPerformedByLearner: false;
      readonly scoreCalculatedByLearner: false;
      readonly hematomaVolumeCalculatedByLearner: false;
      readonly clockDeterminedByLearner: false;
      readonly glucoseAcquiredByLearner: false;
      readonly bloodPressureAcquiredByLearner: false;
      readonly testAcquiredByLearner: false;
      readonly testInterpretedByLearner: false;
      readonly imagingAcquiredByLearner: false;
      readonly imagingInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly etiologyDeterminedByLearner: false;
      readonly anticoagulantExposureExcludedByLearner: false;
      readonly reversalEligibilityDeterminedByLearner: false;
      readonly reversalProductSelectedByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly bloodPressureTargetSelectedByLearner: false;
      readonly airwayDeviceSelectedByLearner: false;
      readonly airwayProcedurePerformedByLearner: false;
      readonly drainSelectedByLearner: false;
      readonly surgerySelectedByLearner: false;
      readonly deviceSelectedByLearner: false;
      readonly procedureSelectedByLearner: false;
      readonly procedurePerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly etiologyProven: false;
      readonly anticoagulantExposureExcluded: false;
      readonly futureExpansionExcluded: false;
      readonly herniationExcluded: false;
      readonly treatmentEffectProven: false;
      readonly durablePressureControlProven: false;
      readonly durableAirwayProtectionProven: false;
      readonly neurologicRecoveryProven: false;
      readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyAsahAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly evidenceAtTick: number | null;
      readonly boundaryAtTick: number | null;
      readonly ownershipAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly spontaneousBreathingAuthored: true;
      readonly priorAneurysmalSahAuthored: true;
      readonly reportedAneurysmSecuredAuthored: true;
      readonly newFocalDeficitAuthored: true;
      readonly fixedImagingAuthored: true;
      readonly fixedPerfusionEvidenceAuthored: true;
      readonly possibleDciBoundaryAuthored: boolean;
      readonly qualifiedNeurocriticalOwnershipActive: boolean;
      readonly qualifiedNeurovascularOwnershipActive: boolean;
      readonly qualifiedRescueOwnershipActive: boolean;
      readonly laterDeteriorationAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly neurologicExamPerformedByLearner: false;
      readonly scoreCalculatedByLearner: false;
      readonly clockDeterminedByLearner: false;
      readonly glucoseAcquiredByLearner: false;
      readonly sodiumAcquiredByLearner: false;
      readonly bloodPressureAcquiredByLearner: false;
      readonly testAcquiredByLearner: false;
      readonly testInterpretedByLearner: false;
      readonly imagingAcquiredByLearner: false;
      readonly imagingInterpretedByLearner: false;
      readonly eegAcquiredByLearner: false;
      readonly eegInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly dciDiagnosedByLearner: false;
      readonly aneurysmSecurityValidatedByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly fluidSelectedByLearner: false;
      readonly bloodPressureTargetSelectedByLearner: false;
      readonly vasopressorSelectedByLearner: false;
      readonly airwayDeviceSelectedByLearner: false;
      readonly airwayProcedurePerformedByLearner: false;
      readonly angiographySelectedByLearner: false;
      readonly angioplastySelectedByLearner: false;
      readonly intraArterialTherapySelectedByLearner: false;
      readonly drainSelectedByLearner: false;
      readonly deviceSelectedByLearner: false;
      readonly procedureSelectedByLearner: false;
      readonly procedurePerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly dciFinallyProven: false;
      readonly vasospasmProvenCausal: false;
      readonly aneurysmDurableSecurityProven: false;
      readonly rebleedingExcluded: false;
      readonly hydrocephalusExcluded: false;
      readonly seizureExcluded: false;
      readonly infectionExcluded: false;
      readonly metabolicCauseExcluded: false;
      readonly establishedInfarctExcluded: false;
      readonly treatmentEffectProven: false;
      readonly durableNeurologicRecoveryProven: false;
      readonly durableAirwayProtectionProven: false;
      readonly dischargeReadinessProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyFocalMotorStatusAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly recognitionAtTick: number | null;
      readonly ownershipAtTick: number | null;
      readonly safetyAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly spontaneousBreathingAuthored: true;
      readonly overtFocalClonusAuthored: true;
      readonly meaningfulRecoveryAbsentAuthored: true;
      readonly qualifiedInitialRescueCareAuthored: true;
      readonly focalMotorStatusRecognized: boolean;
      readonly qualifiedSeizureOwnershipActive: boolean;
      readonly qualifiedAirwayOwnershipActive: boolean;
      readonly laterVisibleClonusAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly seizureTimedByLearner: false;
      readonly monitoringAcquiredByLearner: false;
      readonly glucoseAcquiredByLearner: false;
      readonly eegAcquiredByLearner: false;
      readonly eegInterpretedByLearner: false;
      readonly imagingAcquiredByLearner: false;
      readonly laboratoryTestAcquiredByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly oxygenSelectedByLearner: false;
      readonly airwayDeviceSelectedByLearner: false;
      readonly airwayProcedurePerformedByLearner: false;
      readonly procedureSelectedByLearner: false;
      readonly procedurePerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly nonconvulsiveStatusDiagnosedByLearner: false;
      readonly causeProven: false;
      readonly movementCessationProven: false;
      readonly electrographicControlProven: false;
      readonly treatmentEffectProven: false;
      readonly durableNeurologicRecoveryProven: false;
      readonly durableAirwayProtectionProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyNcseAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly suspicionAtTick: number | null;
      readonly ownershipAtTick: number | null;
      readonly alternativesAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly initialPulsePresent: true;
      readonly spontaneousBreathingAuthored: true;
      readonly fluctuatingDysfunctionAuthored: true;
      readonly noConvulsionAuthored: true;
      readonly urgentEegBoundaryRecognized: boolean;
      readonly qualifiedNeurologyOwnershipActive: boolean;
      readonly qualifiedEegOwnershipActive: boolean;
      readonly qualifiedAirwayOwnershipActive: boolean;
      readonly laterElectrographicStatusReportAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly seizureTimedByLearner: false;
      readonly monitoringAcquiredByLearner: false;
      readonly glucoseAcquiredByLearner: false;
      readonly sodiumAcquiredByLearner: false;
      readonly eegPlacedByLearner: false;
      readonly eegAcquiredByLearner: false;
      readonly rawEegInterpretedByLearner: false;
      readonly imagingAcquiredByLearner: false;
      readonly imagingInterpretedByLearner: false;
      readonly laboratoryTestAcquiredByLearner: false;
      readonly clinicalOnlyNcseDiagnosisMade: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly oxygenSelectedByLearner: false;
      readonly airwayDeviceSelectedByLearner: false;
      readonly procedureSelectedByLearner: false;
      readonly procedurePerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly causeProven: false;
      readonly treatmentEffectProven: false;
      readonly durableElectrographicControlProven: false;
      readonly durableNeurologicRecoveryProven: false;
      readonly durableAirwayProtectionProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyMyasthenicCrisisAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly recognitionAtTick: number | null;
      readonly ownershipAtTick: number | null;
      readonly causesAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly rapidFatigableWeaknessAuthored: true;
      readonly bulbarWeaknessAuthored: true;
      readonly spontaneousBreathingAuthored: true;
      readonly impendingCrisisRecognized: boolean;
      readonly qualifiedNeurocriticalOwnershipActive: boolean;
      readonly qualifiedAirwayOwnershipActive: boolean;
      readonly laterManifestCrisisAuthored: boolean;
      readonly suppliedInvasiveVentilationAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly respiratoryMechanicsAcquiredByLearner: false;
      readonly bloodGasAcquiredByLearner: false;
      readonly imagingAcquiredByLearner: false;
      readonly laboratoryTestAcquiredByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly oxygenSelectedByLearner: false;
      readonly ventilationSelectedByLearner: false;
      readonly airwayDeviceSelectedByLearner: false;
      readonly airwayProcedurePerformedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly triggerProven: false;
      readonly treatmentEffectProven: false;
      readonly weaningSuccessProven: false;
      readonly durableNeurologicRecoveryProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyGbsAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly evidenceAtTick: number | null;
      readonly recognitionAtTick: number | null;
      readonly ownershipAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly ascendingWeaknessAuthored: true;
      readonly bulbarWeaknessAuthored: true;
      readonly autonomicLabilityAuthored: true;
      readonly highRiskRespiratoryDeclineRecognized: boolean;
      readonly qualifiedNeurocriticalOwnershipActive: boolean;
      readonly qualifiedAirwayOwnershipActive: boolean;
      readonly qualifiedCardiacMonitoringOwnershipActive: boolean;
      readonly laterRespiratoryDeclineAuthored: boolean;
      readonly laterAutonomicLabilityAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly scoreCalculatedByLearner: false;
      readonly respiratoryMechanicsAcquiredByLearner: false;
      readonly bloodGasAcquiredByLearner: false;
      readonly csfAcquiredByLearner: false;
      readonly electrodiagnosticTestInterpretedByLearner: false;
      readonly cardiacMonitoringInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly oxygenSelectedByLearner: false;
      readonly ventilationSelectedByLearner: false;
      readonly airwayDeviceSelectedByLearner: false;
      readonly airwayProcedurePerformedByLearner: false;
      readonly rhythmTreatmentDeliveredByLearner: false;
      readonly pressureTreatmentDeliveredByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly diagnosisProven: false;
      readonly treatmentEffectProven: false;
      readonly respiratoryArrestAuthored: false;
      readonly durableNeurologicRecoveryProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyMeningitisAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly ownershipAtTick: number | null;
      readonly diagnosticsAtTick: number | null;
      readonly treatmentAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly acuteMeningealInfectionPatternAuthored: true;
      readonly initialAlertNonfocalStateAuthored: true;
      readonly qualifiedTimeCriticalOwnershipActive: boolean;
      readonly qualifiedLpWithoutRoutineImagingBoundaryReviewed: boolean;
      readonly qualifiedEarlyEmpiricPathwayActive: boolean;
      readonly laterBacterialPatternCsfAuthored: boolean;
      readonly qualifiedLpAuthored: boolean;
      readonly qualifiedEmpiricTreatmentAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly scoreCalculatedByLearner: false;
      readonly bloodTestAcquiredByLearner: false;
      readonly cultureAcquiredByLearner: false;
      readonly csfAcquiredByLearner: false;
      readonly csfInterpretedByLearner: false;
      readonly imagingAcquiredByLearner: false;
      readonly imagingInterpretedByLearner: false;
      readonly lumbarPuncturePerformedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly pathogenIdentified: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false;
      readonly accessPlacedByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly oxygenSelectedByLearner: false;
      readonly fluidSelectedByLearner: false;
      readonly airwayDeviceSelectedByLearner: false;
      readonly airwayProcedurePerformedByLearner: false;
      readonly isolationEquipmentSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly treatmentEffectProven: false;
      readonly durableNeurologicStabilityProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyEncephalitisAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly ownershipAtTick: number | null;
      readonly treatmentAtTick: number | null;
      readonly diagnosticsAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly encephaliticSyndromeAuthored: true;
      readonly qualifiedOwnershipActive: boolean;
      readonly qualifiedEarlyAntiviralPathwayActive: boolean;
      readonly qualifiedDiagnosticsReviewed: boolean;
      readonly earlyNegativeHsvPcrAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly csfAcquiredByLearner: false;
      readonly imagingInterpretedByLearner: false;
      readonly eegInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly pathogenIdentified: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly medicationDeliveredByLearner: false;
      readonly treatmentEffectProven: false;
      readonly durableNeurologicStabilityProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyRaisedIcpAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly ownershipAtTick: number | null;
      readonly eyesAtTick: number | null;
      readonly diagnosticsAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly raisedPressureVisualSyndromeAuthored: true;
      readonly qualifiedOwnershipActive: boolean;
      readonly confirmedPapilledemaReviewed: boolean;
      readonly qualifiedDiagnosticsReviewed: boolean;
      readonly laterVisualFieldDeteriorationAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly ophthalmicTestInterpretedByLearner: false;
      readonly imagingInterpretedByLearner: false;
      readonly lumbarPuncturePerformedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly procedureSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly visualRescueProven: false;
      readonly herniationAuthored: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyHerniationAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly recognitionAtTick: number | null;
      readonly ownershipAtTick: number | null;
      readonly boundaryAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly acuteTranstentorialHerniationPatternAuthored: true;
      readonly convergingPatternRecognized: boolean;
      readonly qualifiedOwnershipActive: boolean;
      readonly qualifiedBrainRescueBoundaryReviewed: boolean;
      readonly laterQualifiedRescueAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly scoreCalculatedByLearner: false;
      readonly imagingInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly airwayProcedurePerformedByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly procedureSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly treatmentEffectProven: false;
      readonly neurologicRecoveryProven: false;
      readonly durablePressureControlProven: false;
      readonly definitiveSourceControlProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyMsccAssessment?: {
      readonly trajectoryAtTick: number | null;
      readonly recognitionAtTick: number | null;
      readonly ownershipAtTick: number | null;
      readonly boundaryAtTick: number | null;
      readonly laterAtTick: number | null;
      readonly handoffAtTick: number | null;
      readonly suspectedMetastaticSpinalCordCompressionAuthored: true;
      readonly emergencyRecognizedBeforeImaging: boolean;
      readonly qualifiedOwnershipActive: boolean;
      readonly qualifiedCareBoundaryReviewed: boolean;
      readonly laterQualifiedMriAuthored: boolean;
      readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false;
      readonly patientMovedByLearner: false;
      readonly imagingOrderedByLearner: false;
      readonly imagingInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false;
      readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false;
      readonly procedureSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false;
      readonly treatmentEffectProven: false;
      readonly neurologicRecoveryProven: false;
      readonly definitiveTreatmentProven: false;
      readonly dispositionDetermined: false;
      readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly neurologyDeliriumAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly ownershipAtTick: number | null; readonly boundaryAtTick: number | null;
      readonly laterAtTick: number | null; readonly handoffAtTick: number | null;
      readonly acuteFluctuationAuthored: true; readonly qualifiedAssessmentBoundaryRecognized: boolean;
      readonly qualifiedOwnershipActive: boolean; readonly qualifiedContributorBoundaryReviewed: boolean;
      readonly laterContributorsAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly scoreCalculatedByLearner: false;
      readonly capacityAssessedByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly restraintSelectedByLearner: false; readonly observationSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly singleCauseProven: false; readonly treatmentEffectProven: false;
      readonly cognitiveRecoveryProven: false; readonly dispositionDetermined: false;
      readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly neurologyAutonomicDysreflexiaAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly triggerAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly baselineRelativePatternAuthored: true; readonly syndromePatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly externalTubingKinkReleased: boolean;
      readonly responseStateAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly catheterManipulatedByLearner: false;
      readonly bowelCarePerformedByLearner: false; readonly drugSelectedByLearner: false;
      readonly procedurePerformedByLearner: false; readonly soleCauseProven: false;
      readonly individualizedResponsePredicted: false; readonly durableResolutionProven: false;
      readonly complicationsExcluded: false; readonly recurrenceExcluded: false;
      readonly dispositionDetermined: false; readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly toxicologyMethemoglobinemiaAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly hazardsAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly discordanceAuthored: true; readonly dyshemoglobinPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly cooximetryAndHazardsReviewed: boolean;
      readonly qualifiedAntidoteIntentRecorded: boolean; readonly responseStateAuthored: boolean;
      readonly patientHistoryTakenByLearner: false; readonly patientExaminedByLearner: false;
      readonly monitoringAcquiredByLearner: false; readonly bloodSampleAcquiredByLearner: false;
      readonly saturationGapCalculatedByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly oxygenSelectedByLearner: false; readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly rescuePerformedByLearner: false;
      readonly treatmentEffectProven: false; readonly reboundExcluded: false;
      readonly hemolysisExcluded: false; readonly serotoninSyndromeExcluded: false;
      readonly ongoingExposureExcluded: false; readonly rescueEligibilityDetermined: false;
      readonly dispositionDetermined: false; readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly toxicologyCarbonMonoxideAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly severityAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly exposurePatternAuthored: true; readonly carbonMonoxidePatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly cooximetryAndSeverityReviewed: boolean;
      readonly qualifiedHyperbaricConsultationRecorded: boolean; readonly responseStateAuthored: boolean;
      readonly patientHistoryTakenByLearner: false; readonly patientExaminedByLearner: false;
      readonly monitoringAcquiredByLearner: false; readonly bloodSampleAcquiredByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly oxygenSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly hyperbaricTreatmentSelectedByLearner: false;
      readonly hyperbaricEligibilityDetermined: false; readonly transportSelectedByLearner: false;
      readonly treatmentEffectProven: false; readonly durableNeurologicRecoveryProven: false;
      readonly delayedNeurologicComplicationsExcluded: false; readonly cardiacComplicationsExcluded: false;
      readonly coexposureExcluded: false; readonly dispositionDetermined: false;
      readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly toxicologyAcetaminophenAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly timedAcuteExposureAuthored: true; readonly nomogramApplicabilityRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly timedEvidenceReviewed: boolean;
      readonly qualifiedAntidoteIntentRecorded: boolean; readonly responseStateAuthored: boolean;
      readonly patientHistoryTakenByLearner: false; readonly patientExaminedByLearner: false;
      readonly monitoringAcquiredByLearner: false; readonly bloodSampleAcquiredByLearner: false;
      readonly nomogramPlottedByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly decontaminationSelectedByLearner: false; readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly stoppingDeterminedByLearner: false;
      readonly treatmentEffectProven: false; readonly delayedAbsorptionExcluded: false;
      readonly liverInjuryExcluded: false; readonly coingestionExcluded: false;
      readonly safetyDispositionDetermined: false; readonly dispositionDetermined: false;
      readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly toxicologySalicylateAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly acuteExposureAuthored: true; readonly mixedAcidBasePatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly serialEvidenceReviewed: boolean;
      readonly qualifiedAlkalinizationIntentRecorded: boolean; readonly qualifiedDialysisPreparednessRecorded: boolean;
      readonly deteriorationStateAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly bloodSampleAcquiredByLearner: false; readonly acidBaseCalculatedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly decontaminationSelectedByLearner: false;
      readonly fluidSelectedByLearner: false; readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly airwayPlanSelectedByLearner: false; readonly ventilationSelectedByLearner: false;
      readonly dialysisSelectedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly tissueConcentrationProven: false; readonly ongoingAbsorptionExcluded: false;
      readonly pulmonaryComplicationsExcluded: false; readonly dialysisEligibilityDetermined: false;
      readonly treatmentEffectProven: false; readonly safetyDispositionDetermined: false;
      readonly dispositionDetermined: false; readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly toxicologyTricyclicAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly exposureAndElectricalPatternAuthored: true; readonly sodiumChannelPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly ecgAndLaboratoryEvidenceReviewed: boolean;
      readonly qualifiedBicarbonateIntentRecorded: boolean; readonly qualifiedRescuePreparednessRecorded: boolean;
      readonly responseStateAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly ecgAcquiredByLearner: false; readonly ecgInterpretedByLearner: false;
      readonly bloodSampleAcquiredByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly decontaminationSelectedByLearner: false; readonly fluidSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly airwaySelectedByLearner: false;
      readonly ventilationSelectedByLearner: false; readonly rhythmTreatmentSelectedByLearner: false;
      readonly rescueSelectedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly durableElectricalStabilityProven: false; readonly seizureRecurrenceExcluded: false;
      readonly coingestionExcluded: false; readonly rescueEligibilityDetermined: false;
      readonly treatmentEffectProven: false; readonly safetyDispositionDetermined: false;
      readonly dispositionDetermined: false; readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly toxicologyBetaBlockerAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly exposurePerfusionAndMetabolicPatternAuthored: true; readonly betaBlockerShockPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly ecgCardiacMetabolicAndPriorCareEvidenceReviewed: boolean;
      readonly qualifiedVasopressorIntentRecorded: boolean; readonly qualifiedGlucagonIntentRecorded: boolean;
      readonly qualifiedInsulinEuglycemiaIntentRecorded: boolean; readonly qualifiedRescuePreparednessRecorded: boolean;
      readonly responseStateAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly ecgAcquiredByLearner: false; readonly ecgInterpretedByLearner: false;
      readonly cardiacImagingAcquiredByLearner: false; readonly bloodSampleAcquiredByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly decontaminationSelectedByLearner: false;
      readonly glucoseOrElectrolyteSelectedByLearner: false; readonly fluidSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly airwaySelectedByLearner: false;
      readonly ventilationSelectedByLearner: false; readonly pacingSelectedByLearner: false;
      readonly dialysisSelectedByLearner: false; readonly rescueSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly durablePerfusionStabilityProven: false;
      readonly glucoseStabilityProven: false; readonly electrolyteStabilityProven: false;
      readonly coingestionExcluded: false; readonly rescueEligibilityDetermined: false;
      readonly treatmentEffectProven: false; readonly safetyDispositionDetermined: false;
      readonly dispositionDetermined: false; readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly toxicologyCalciumChannelBlockerAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly exposurePerfusionConductionAndMetabolicPatternAuthored: true; readonly calciumChannelBlockerShockPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly ecgCardiacMetabolicPriorCareAndAbsorptionEvidenceReviewed: boolean;
      readonly qualifiedVasopressorIntentRecorded: boolean; readonly qualifiedCalciumIntentRecorded: boolean;
      readonly qualifiedInsulinEuglycemiaIntentRecorded: boolean; readonly qualifiedRescuePreparednessRecorded: boolean;
      readonly responseStateAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly ecgAcquiredByLearner: false; readonly ecgInterpretedByLearner: false;
      readonly cardiacImagingAcquiredByLearner: false; readonly bloodSampleAcquiredByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly decontaminationSelectedByLearner: false;
      readonly glucoseOrElectrolyteSelectedByLearner: false; readonly fluidSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly airwaySelectedByLearner: false;
      readonly ventilationSelectedByLearner: false; readonly pacingSelectedByLearner: false;
      readonly rescueSelectedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly durablePerfusionStabilityProven: false; readonly absorptionComplete: false;
      readonly glucoseStabilityProven: false; readonly electrolyteStabilityProven: false;
      readonly coingestionExcluded: false; readonly rescueEligibilityDetermined: false;
      readonly treatmentEffectProven: false; readonly safetyDispositionDetermined: false;
      readonly dispositionDetermined: false; readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly toxicologyDigoxinAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly exposureRhythmPotassiumAndLevelPatternAuthored: true; readonly lifeThreateningDigoxinPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly ecgLevelTimingPotassiumRenalPriorCareAndAntidoteEvidenceReviewed: boolean;
      readonly qualifiedImmuneFabIntentRecorded: boolean; readonly qualifiedRhythmPotassiumSurveillanceRecorded: boolean;
      readonly qualifiedRescuePreparednessRecorded: boolean; readonly responseStateAuthored: boolean;
      readonly patientHistoryTakenByLearner: false; readonly patientExaminedByLearner: false;
      readonly monitoringAcquiredByLearner: false; readonly ecgAcquiredByLearner: false;
      readonly ecgInterpretedByLearner: false; readonly bloodSampleAcquiredByLearner: false;
      readonly levelInterpretedByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly decontaminationSelectedByLearner: false; readonly glucoseOrElectrolyteSelectedByLearner: false;
      readonly fluidSelectedByLearner: false; readonly drugSelectedByLearner: false;
      readonly vialCountSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly airwaySelectedByLearner: false;
      readonly ventilationSelectedByLearner: false; readonly pacingSelectedByLearner: false;
      readonly dialysisSelectedByLearner: false; readonly rescueSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly durablePerfusionStabilityProven: false;
      readonly potassiumStabilityProven: false; readonly assayInterferenceResolved: false;
      readonly coingestionExcluded: false; readonly antidoteEligibilityDetermined: false;
      readonly rescueEligibilityDetermined: false; readonly treatmentEffectProven: false;
      readonly safetyDispositionDetermined: false; readonly dispositionDetermined: false;
      readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly toxicologyCholinergicAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly safetyAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly exposureRespiratoryNeuromuscularAndCnsPatternAuthored: true; readonly cholinergicPatternRecognized: boolean;
      readonly qualifiedSafetyOwnershipActive: boolean; readonly respiratoryNeuromuscularCnsExposureAndLaboratoryEvidenceReviewed: boolean;
      readonly qualifiedAtropineIntentRecorded: boolean; readonly qualifiedPralidoximeIntentRecorded: boolean;
      readonly qualifiedBenzodiazepineIfNeededIntentRecorded: boolean; readonly qualifiedAirwayVentilationIntentRecorded: boolean;
      readonly qualifiedDecontaminationIntentRecorded: boolean; readonly responseStateAuthored: boolean;
      readonly patientHistoryTakenByLearner: false; readonly patientExaminedByLearner: false;
      readonly monitoringAcquiredByLearner: false; readonly bloodSampleAcquiredByLearner: false;
      readonly cholinesteraseInterpretedByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly ppeSelectedByLearner: false; readonly decontaminationPerformedByLearner: false;
      readonly fluidSelectedByLearner: false; readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly airwaySelectedByLearner: false; readonly ventilationSelectedByLearner: false;
      readonly neuromuscularBlockerSelectedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly durableVentilationProven: false; readonly neuromuscularRecoveryProven: false;
      readonly decontaminationCompleteProven: false; readonly coWorkerSafetyProven: false;
      readonly seizureExcluded: false; readonly treatmentEffectProven: false;
      readonly safetyDispositionDetermined: false; readonly dispositionDetermined: false;
      readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly toxicologyAnticholinergicAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly exposureDeliriumHyperthermiaRetentionAndEcgPatternAuthored: true; readonly anticholinergicPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly temperatureCnsEcgRenalCkRetentionAndDifferentialEvidenceReviewed: boolean;
      readonly qualifiedCoolingSupportIntentRecorded: boolean; readonly qualifiedSedationSeizureIntentRecorded: boolean;
      readonly qualifiedTemperatureRenalCkBladderSurveillanceRecorded: boolean; readonly qualifiedPhysostigmineEligibilityIntentRecorded: boolean;
      readonly responseStateAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly ecgAcquiredByLearner: false; readonly ecgInterpretedByLearner: false;
      readonly temperatureMeasuredByLearner: false; readonly bloodSampleAcquiredByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly alternativeExcludedByLearner: false;
      readonly coolingSelectedByLearner: false; readonly restraintSelectedByLearner: false;
      readonly catheterSelectedByLearner: false; readonly fluidSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly airwaySelectedByLearner: false;
      readonly ventilationSelectedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly antidoteEligibilityDetermined: false; readonly durableTemperatureControlProven: false;
      readonly renalSafetyProven: false; readonly rhabdomyolysisExcluded: false;
      readonly seizureExcluded: false; readonly exposurePurityProven: false;
      readonly treatmentEffectProven: false; readonly safetyDispositionDetermined: false;
      readonly dispositionDetermined: false; readonly prognosisPredicted: false;
      readonly outcomePredicted: false;
    };
    readonly toxicologySerotoninAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly interactionMentalAutonomicNeuromuscularHyperthermiaPatternAuthored: true; readonly serotoninPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly cnsAutonomicNeuromuscularTemperatureEcgRenalCkAndDifferentialEvidenceReviewed: boolean;
      readonly qualifiedSourceCessationIntentRecorded: boolean; readonly qualifiedCoolingSupportIntentRecorded: boolean;
      readonly qualifiedSedationSeizureIntentRecorded: boolean; readonly qualifiedTemperatureRenalCkSurveillanceRecorded: boolean;
      readonly qualifiedAirwayPreparednessRecorded: boolean; readonly qualifiedSerotoninAntagonistRescueIntentRecorded: boolean;
      readonly responseStateAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly ecgAcquiredByLearner: false; readonly ecgInterpretedByLearner: false;
      readonly temperatureMeasuredByLearner: false; readonly bloodSampleAcquiredByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly alternativeExcludedByLearner: false;
      readonly coolingSelectedByLearner: false; readonly restraintSelectedByLearner: false;
      readonly fluidSelectedByLearner: false; readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly airwaySelectedByLearner: false; readonly ventilationSelectedByLearner: false;
      readonly neuromuscularBlockerSelectedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly rescueEligibilityDetermined: false; readonly durableTemperatureControlProven: false;
      readonly neuromuscularRecoveryProven: false; readonly renalSafetyProven: false;
      readonly rhabdomyolysisExcluded: false; readonly seizureExcluded: false;
      readonly exposureCompletenessProven: false; readonly treatmentEffectProven: false;
      readonly safetyDispositionDetermined: false; readonly dispositionDetermined: false;
      readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly toxicologySympathomimeticAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly exposureMentalAutonomicHyperthermiaPatternAuthored: true; readonly sympathomimeticPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly mentalAutonomicCardiacTemperatureRenalCkAndDifferentialEvidenceReviewed: boolean;
      readonly qualifiedDeescalationSupportIntentRecorded: boolean; readonly qualifiedGabaergicSedationIntentRecorded: boolean;
      readonly qualifiedCoolingIntentRecorded: boolean; readonly qualifiedCardiacTemperatureRenalCkSurveillanceRecorded: boolean;
      readonly qualifiedAirwayPreparednessRecorded: boolean; readonly qualifiedPersistentHyperadrenergicAdjunctIntentRecorded: boolean;
      readonly responseStateAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly ecgAcquiredByLearner: false; readonly ecgInterpretedByLearner: false;
      readonly temperatureMeasuredByLearner: false; readonly toxicologyScreenInterpretedByLearner: false;
      readonly bloodSampleAcquiredByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly alternativeExcludedByLearner: false; readonly restraintSelectedByLearner: false;
      readonly coolingSelectedByLearner: false; readonly fluidSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly cardiovascularTherapySelectedByLearner: false;
      readonly airwaySelectedByLearner: false; readonly ventilationSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly adjunctEligibilityDetermined: false;
      readonly durableTemperatureControlProven: false; readonly durablePressureControlProven: false;
      readonly psychiatricSafetyProven: false; readonly cardiacSafetyProven: false;
      readonly renalSafetyProven: false; readonly rhabdomyolysisExcluded: false;
      readonly seizureExcluded: false; readonly exposureCompletenessProven: false;
      readonly treatmentEffectProven: false; readonly safetyDispositionDetermined: false;
      readonly dispositionDetermined: false; readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly toxicologyMethanolAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly exposureVisualAcidosisAndGapsPatternAuthored: true; readonly methanolPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly acidBaseOsmolarRenalVisualAndDifferentialEvidenceReviewed: boolean;
      readonly qualifiedSourceAntidoteCofactorAcidBaseExtracorporealAndAirwayIntentRecorded: boolean;
      readonly responseStateAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly ecgAcquiredByLearner: false; readonly ecgInterpretedByLearner: false;
      readonly bloodSampleAcquiredByLearner: false; readonly gapCalculatedByLearner: false;
      readonly laboratoryInterpretedByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly alternativeExcludedByLearner: false; readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly airwaySelectedByLearner: false; readonly ventilationSelectedByLearner: false;
      readonly extracorporealTreatmentSelectedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly antidoteEligibilityDetermined: false; readonly extracorporealEligibilityDetermined: false;
      readonly toxinClearanceProven: false; readonly durableAcidBaseControlProven: false;
      readonly visualRecoveryProven: false; readonly neurologicRecoveryProven: false;
      readonly renalSafetyProven: false; readonly electrolyteSafetyProven: false;
      readonly exposureCompletenessProven: false; readonly treatmentEffectProven: false;
      readonly safetyDispositionDetermined: false; readonly dispositionDetermined: false;
      readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly toxicologyDelayedLastAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly delayedSourceCnsCardiacPatternAuthored: true; readonly delayedLastPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean; readonly sourceCnsEcgPerfusionAcidBaseElectrolyteAndDifferentialEvidenceReviewed: boolean;
      readonly qualifiedSourceAirwaySeizureLipidAcidBaseModifiedResuscitationAndEclsIntentRecorded: boolean;
      readonly responseStateAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly ecgAcquiredByLearner: false; readonly ecgInterpretedByLearner: false;
      readonly bloodSampleAcquiredByLearner: false; readonly sourceDeliveryInterpretedByLearner: false;
      readonly catheterHandledByLearner: false; readonly diagnosisMadeByLearner: false;
      readonly alternativeExcludedByLearner: false; readonly oxygenSelectedByLearner: false;
      readonly ventilationSelectedByLearner: false; readonly seizureCareSelectedByLearner: false;
      readonly lipidSelectedByLearner: false; readonly drugSelectedByLearner: false;
      readonly doseSelectedByLearner: false; readonly routeSelectedByLearner: false;
      readonly airwaySelectedByLearner: false; readonly rhythmCareSelectedByLearner: false;
      readonly eclsSelectedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly rescueEligibilityDetermined: false; readonly durableSeizureControlProven: false;
      readonly durableRhythmStabilityProven: false; readonly durablePerfusionStabilityProven: false;
      readonly neurologicRecoveryProven: false; readonly airwayRecoveryProven: false;
      readonly acidBaseSafetyProven: false; readonly electrolyteSafetyProven: false;
      readonly lipidSafetyProven: false; readonly sourceCompletenessProven: false;
      readonly treatmentEffectProven: false; readonly safetyDispositionDetermined: false;
      readonly dispositionDetermined: false; readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly toxicologyOpioidXylazineAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly opioidEmergencyPersistentSedationAndPossibleAdulterantPatternAuthored: true;
      readonly opioidEmergencyAndPossibleAdulterantPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean;
      readonly respiratoryCirculatoryTemperatureScreenSkinAndDifferentialEvidenceReviewed: boolean;
      readonly qualifiedContinuedSupportOpioidAntagonistSymptomaticCareAndNoVeterinaryAntagonistIntentRecorded: boolean;
      readonly responseStateAuthored: boolean; readonly patientHistoryTakenByLearner: false;
      readonly patientExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly ecgAcquiredByLearner: false; readonly ecgInterpretedByLearner: false;
      readonly bloodSampleAcquiredByLearner: false; readonly toxicologyScreenInterpretedByLearner: false;
      readonly skinExaminedByLearner: false; readonly streetProductIdentifiedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly alternativeExcludedByLearner: false;
      readonly oxygenSelectedByLearner: false; readonly ventilationSelectedByLearner: false;
      readonly opioidAntagonistSelectedByLearner: false; readonly veterinaryAntagonistSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly airwaySelectedByLearner: false;
      readonly woundCareSelectedByLearner: false; readonly treatmentDeliveredByLearner: false;
      readonly adulterantConfirmedByLearner: false; readonly naloxoneResistanceProven: false;
      readonly durableVentilationProven: false; readonly durablePerfusionProven: false;
      readonly neurologicRecoveryProven: false; readonly airwayRecoveryProven: false;
      readonly aspirationExcluded: false; readonly pulmonarySafetyProven: false;
      readonly temperatureSafetyProven: false; readonly woundSafetyProven: false;
      readonly withdrawalSafetyProven: false; readonly treatmentEffectProven: false;
      readonly safetyDispositionDetermined: false; readonly dispositionDetermined: false;
      readonly prognosisPredicted: false; readonly outcomePredicted: false;
    };
    readonly obstetricsAtonyAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly postpartumHemorrhageAndAtonyPatternAuthored: true;
      readonly postpartumHemorrhageAndAtonyPatternRecognized: boolean;
      readonly qualifiedSupportActive: boolean;
      readonly uterinePlacentalTractCoagPerfusionAndDifferentialEvidenceReviewed: boolean;
      readonly qualifiedMotiveBundleAndEscalationIntentRecorded: boolean;
      readonly responseStateAuthored: boolean;
      readonly bloodLossMeasuredByLearner: false; readonly bloodLossCalculatedByLearner: false;
      readonly patientHistoryTakenByLearner: false; readonly patientExaminedByLearner: false;
      readonly uterineToneExaminedByLearner: false; readonly placentaExaminedByLearner: false;
      readonly genitalTractExaminedByLearner: false; readonly monitoringAcquiredByLearner: false;
      readonly bloodSampleAcquiredByLearner: false; readonly coagulationInterpretedByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly alternativeExcludedByLearner: false;
      readonly massageSelectedByLearner: false; readonly uterotonicSelectedByLearner: false;
      readonly tranexamicAcidSelectedByLearner: false; readonly fluidSelectedByLearner: false;
      readonly bloodComponentSelectedByLearner: false; readonly oxygenSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly accessSelectedByLearner: false;
      readonly tamponadeSelectedByLearner: false; readonly procedureSelectedByLearner: false;
      readonly surgerySelectedByLearner: false; readonly hysterectomySelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly durableHemostasisProven: false;
      readonly coagulationSafetyProven: false; readonly concealedBleedingExcluded: false;
      readonly transfusionNeedDetermined: false; readonly procedureNeedDetermined: false;
      readonly treatmentEffectProven: false; readonly fertilityOutcomePredicted: false;
      readonly safetyDispositionDetermined: false; readonly dispositionDetermined: false;
      readonly prognosisPredicted: false; readonly maternalOutcomePredicted: false;
      readonly newbornOutcomePredicted: false; readonly outcomePredicted: false;
    };
    readonly obstetricsMaternalSepsisAssessment?: {
      readonly trajectoryAtTick: number | null; readonly recognitionAtTick: number | null;
      readonly supportAtTick: number | null; readonly evidenceAtTick: number | null;
      readonly reassessmentAtTick: number | null; readonly handoffAtTick: number | null;
      readonly postpartumInfectionOrganDysfunctionPatternAuthored: true;
      readonly maternalSepsisEmergencyRecognized: boolean; readonly qualifiedSupportActive: boolean;
      readonly infectiousNoninfectiousPerfusionOrganAndSourceEvidenceReviewed: boolean;
      readonly qualifiedImmediateCareAndSourceControlIntentRecorded: boolean;
      readonly responseStateAuthored: boolean;
      readonly patientExaminedByLearner: false; readonly sepsisScoreCalculatedByLearner: false;
      readonly monitoringAcquiredByLearner: false; readonly cultureAcquiredByLearner: false;
      readonly bloodSampleAcquiredByLearner: false; readonly imagingAcquiredByLearner: false;
      readonly diagnosisMadeByLearner: false; readonly alternativeExcludedByLearner: false;
      readonly antimicrobialSelectedByLearner: false; readonly fluidSelectedByLearner: false;
      readonly vasopressorSelectedByLearner: false; readonly oxygenSelectedByLearner: false;
      readonly drugSelectedByLearner: false; readonly doseSelectedByLearner: false;
      readonly routeSelectedByLearner: false; readonly accessSelectedByLearner: false;
      readonly sourceControlSelectedByLearner: false; readonly procedureSelectedByLearner: false;
      readonly treatmentDeliveredByLearner: false; readonly treatmentEffectProven: false;
      readonly organRecoveryProven: false; readonly sourceControlProven: false;
      readonly safetyDispositionDetermined: false; readonly dispositionDetermined: false;
      readonly maternalOutcomePredicted: false; readonly newbornOutcomePredicted: false;
      readonly outcomePredicted: false;
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
