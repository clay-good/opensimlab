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
  const [tray, setTray] = useState<TrayId>(() => props.scenario.formulary.length === 0
    && props.scenario.timeline.some((event) => event.type === 'tension-pneumothorax'
      || (event.type === 'narrative' && [
        'persistent-severe-preeclampsia', 'aspiration-risk-recognition',
        'emergence-residual-blockade', 'delayed-emergence-differential',
        'extubation-readiness',
      ].includes(event.target ?? '')))
    ? 'crisis' : 'syringes');
  const {
    hasAnaphylaxisResponse, hasHypermetabolicResponse, hasLastResponse,
    hasCardiacArrestResponse, hasHighSpinalResponse, hasVenousAirEmbolismResponse,
    hasBronchospasmResponse, hasPreeclampsiaResponse, hasPneumothoraxResponse,
    hasAspirationRiskResponse, hasEmergenceResidualBlockResponse, hasDelayedEmergenceResponse,
    hasExtubationReadinessResponse,
  } = crisisResponseAvailability(props.scenario, props.injectedCrisisIds);
  const hasDifficultAirwayResponse = props.scenario.timeline.some(
    (event) => event.type === 'difficult-airway',
  );
  const hasEpinephrineResponse = hasAnaphylaxisResponse || hasLastResponse;
  const hasNonMaternalCrisisResponse = hasEpinephrineResponse || hasHypermetabolicResponse
    || hasCardiacArrestResponse || hasHighSpinalResponse || hasVenousAirEmbolismResponse
    || hasPneumothoraxResponse || hasBronchospasmResponse;
  const hasCrisisResponse = hasNonMaternalCrisisResponse || hasPreeclampsiaResponse
    || hasAspirationRiskResponse || hasEmergenceResidualBlockResponse
    || hasDelayedEmergenceResponse || hasExtubationReadinessResponse;
  const responseTray = hasExtubationReadinessResponse && !hasNonMaternalCrisisResponse
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
  const trays = hasCrisisResponse
    ? props.scenario.formulary.length === 0 ? [responseTray, ...TRAYS] : [...TRAYS, responseTray]
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
      <Tabs
        label="Action trays"
        tabs={visibleTrays}
        active={tray}
        onSelect={(id) => setTray(id as TrayId)}
      />

      {/* Pinned: running infusions are visible regardless of the selected tray. */}
      <div className="actions__pinned" role="status" aria-label="Pump settings for running infusions">
        {props.infusions.length === 0
          ? <span>No infusions running</span>
          : props.infusions.map((infusion) => (
            <span key={infusion.drugId} className="numeric">
              Pump set: {infusion.drugId} {infusion.rate.toFixed(1)} {infusion.unit} ·{' '}
              {Math.floor(infusion.elapsedSeconds / 60)}m {Math.floor(infusion.elapsedSeconds % 60)}s
            </span>
          ))}
      </div>

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
                onCallForHelp={props.onPneumothoraxHelp ?? (() => {})}
                onAction={props.onPneumothoraxResponse ?? (() => {})}
              />
            )}
            {hasAspirationRiskResponse && (
              <AspirationRiskTray
                assessment={props.resuscitation.aspirationRiskAssessment}
                onAction={props.onAspirationRiskAssessment ?? (() => {})}
              />
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
        {(tray === 'fluids' || (tray === 'crisis'
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
  roscAtTick, onCompressions, onEpinephrine, onDefibrillation,
}: {
  active: boolean;
  compressionsActive: boolean;
  compressionSeconds: number;
  epinephrineTotalMg: number;
  shockCount: number;
  lastEnergyJ: number | null;
  roscAtTick: number | null;
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
        <p className="field__hint">The current AHA adult algorithm repeats epinephrine every 3–5 minutes; this case ends at initial ROSC.</p>
      </section>
      <section className="syringe">
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
      </section>
    </div>
  );
}

function FluidTray({
  crystalloidTotalMl, packedRedBloodCellUnits, freshFrozenPlasmaUnits, bloodProductTotalMl,
  ageYears, hemorrhageAvailable, coagulationAvailable, coagulationPanelReported, bloodProductsReleased,
  prothrombinTimeRatio, fibrinogenGPerL,
  onFluid, onBloodProduct, onBloodBankRequest, onCoagulationLabs,
}: {
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
}) {
  const pediatric = ageYears < 18;
  const [pending, setPending] = useState<{ fluidId: string; volumeMl: number } | null>(null);
  const [pendingBlood, setPendingBlood] = useState<{ productId: string; units: number } | null>(null);
  const [pendingBloodBank, setPendingBloodBank] = useState(false);
  return (
    <div className="tray-grid">
      {FLUIDS.map((fluid) => (
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
  fraction, assessed, decompressed, helpRequested, onCallForHelp, onAction,
}: {
  fraction: number;
  assessed: boolean;
  decompressed: boolean;
  helpRequested: boolean;
  onCallForHelp: () => void;
  onAction: (action: 'assess-bilateral-ventilation' | 'decompress-left-chest') => void;
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
        </div>
        <p className="field__hint">
          Use Airway &amp; Vent for 100% oxygen. The pressure alarm is declared because airway
          pressure and compliance are not numerical engine states yet.
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
  helpRequestedAtTick, showDifficultAirwayRescue, region, onVentilator, onLaryngoscopy,
  onAirwayManeuver, onCallForHelp, onAirwayDevice,
  showCapnographyLine, capnographyLine, onCapnographyLine,
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
          <Button
            aria-describedby="jaw-thrust-cpap-status"
            disabled={holdingAirway}
            onClick={() => onAirwayManeuver('jaw-thrust-cpap')}
          >
            Apply jaw thrust + continuous positive pressure
          </Button>
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
        </div>
        <p id="jaw-thrust-cpap-status" className="field__hint">
          {holdingAirway
            ? ventilator.delivering
              ? `Jaw thrust and continuous positive pressure in progress: ${Math.ceil(jawThrustCpapSecondsRemaining)} simulated seconds remaining.`
              : `Jaw thrust hold in progress: ${Math.ceil(jawThrustCpapSecondsRemaining)} simulated seconds remaining. The ventilator is not delivering positive pressure.`
            : `Applies a fixed ${JAW_THRUST_CPAP_SECONDS}-second teaching-model hold, not a recommended clinical duration. Assess its effect from gas movement and the capnogram.`}
        </p>
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
        {showDifficultAirwayRescue && (
          <section aria-labelledby="airway-rescue-title" style={{ marginBlockStart: 'var(--space-3)' }}>
            <h4 id="airway-rescue-title" className="field__label">Airway rescue</h4>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                className="airway-rescue__action"
                aria-describedby="airway-rescue-status"
                disabled={helpRequested}
                onClick={onCallForHelp}
              >
                Call for help
              </Button>
              <Button
                className="airway-rescue__action"
                aria-describedby="airway-rescue-status airway-rescue-countdown"
                disabled={device !== 'facemask' || attemptInProgress || insertingSupraglottic}
                onClick={() => onAirwayDevice('supraglottic-airway')}
              >
                Insert supraglottic airway
              </Button>
            </div>
            <p id="airway-rescue-status" className="field__hint" role="status" aria-live="polite">
              {helpRequested ? 'Help has been requested. ' : 'No help request has been recorded. '}
              {supraglotticStatus}
            </p>
            <p id="airway-rescue-countdown" className="field__hint" aria-live="off">
              {insertingSupraglottic
                ? `Insertion countdown: ${Math.ceil(supraglotticInsertionSecondsRemaining)} simulated seconds remaining.`
                : 'Insertion takes a fixed 15 simulated seconds in this teaching model.'}
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
