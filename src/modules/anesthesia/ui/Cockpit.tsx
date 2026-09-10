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
import { useObservedDemonstration, type ObservedStep } from '@anesthesia/demo/useObservedDemonstration';
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import type { LessonTray } from './lesson-tray';
import { useStatusEpilepticusDemonstration as useCriticalCareStatusEpilepticusDemonstration } from '../../critical-care/demo/useStatusEpilepticusDemonstration';
import { supportsStatusEpilepticusDemonstration as supportsCriticalCareStatusEpilepticusDemonstration } from '../../critical-care/demo/status-epilepticus-demonstration';
import { usePeaArrestDemonstration } from '../../emergency-medicine/demo/usePeaArrestDemonstration';
import { supportsPeaArrestDemonstration } from '../../emergency-medicine/demo/pea-arrest-demonstration';
import { usePersistentVfArrestDemonstration } from '../../emergency-medicine/demo/usePersistentVfArrestDemonstration';
import { supportsPersistentVfArrestDemonstration } from '../../emergency-medicine/demo/persistent-vf-arrest-demonstration';
import { useRapidDesaturationDemonstration } from '@anesthesia/demo/useRapidDesaturationDemonstration';
import { supportsRapidDesaturationDemonstration } from '@anesthesia/demo/rapid-desaturation-demonstration';
import { useHypotensionAfterInductionDemonstration } from '@anesthesia/demo/useHypotensionAfterInductionDemonstration';
import { supportsHypotensionAfterInductionDemonstration } from '@anesthesia/demo/hypotension-after-induction-demonstration';
import { useRapidSequenceInductionDemonstration } from '@anesthesia/demo/useRapidSequenceInductionDemonstration';
import { supportsRapidSequenceInductionDemonstration } from '@anesthesia/demo/rapid-sequence-induction-demonstration';
import { useAwarenessUnderParalysisDemonstration } from '@anesthesia/demo/useAwarenessUnderParalysisDemonstration';
import { supportsAwarenessUnderParalysisDemonstration } from '@anesthesia/demo/awareness-under-paralysis-demonstration';
import { useLaryngospasmDemonstration } from '@anesthesia/demo/useLaryngospasmDemonstration';
import { supportsLaryngospasmDemonstration } from '@anesthesia/demo/laryngospasm-demonstration';
import { useBronchospasmDemonstration } from '@anesthesia/demo/useBronchospasmDemonstration';
import { supportsBronchospasmDemonstration } from '@anesthesia/demo/bronchospasm-demonstration';
import { useUnexpectedHemorrhageDemonstration } from '@anesthesia/demo/useUnexpectedHemorrhageDemonstration';
import { supportsUnexpectedHemorrhageDemonstration } from '@anesthesia/demo/unexpected-hemorrhage-demonstration';
import { useDilutionalCoagulopathyDemonstration } from '@anesthesia/demo/useDilutionalCoagulopathyDemonstration';
import { supportsDilutionalCoagulopathyDemonstration } from '@anesthesia/demo/dilutional-coagulopathy-demonstration';
import { useObstetricGeneralAnesthesiaDemonstration } from '@anesthesia/demo/useObstetricGeneralAnesthesiaDemonstration';
import { supportsObstetricGeneralAnesthesiaDemonstration } from '@anesthesia/demo/obstetric-general-anesthesia-demonstration';
import { useGeriatricInductionDemonstration } from '@anesthesia/demo/useGeriatricInductionDemonstration';
import { supportsGeriatricInductionDemonstration } from '@anesthesia/demo/geriatric-induction-demonstration';
import { usePostoperativeHandoffDemonstration } from '@anesthesia/demo/usePostoperativeHandoffDemonstration';
import { supportsPostoperativeHandoffDemonstration } from '@anesthesia/demo/postoperative-handoff-demonstration';
import { usePacemakerAndCauteryPlanningDemonstration } from '@anesthesia/demo/usePacemakerAndCauteryPlanningDemonstration';
import { supportsPacemakerAndCauteryPlanningDemonstration } from '@anesthesia/demo/pacemaker-and-cautery-planning-demonstration';
import { usePreeclampsiaUrgentDeliveryDemonstration } from '@anesthesia/demo/usePreeclampsiaUrgentDeliveryDemonstration';
import { supportsPreeclampsiaUrgentDeliveryDemonstration } from '@anesthesia/demo/preeclampsia-urgent-delivery-demonstration';
import { useOpioidVentilatoryImpairmentDemonstration } from '@anesthesia/demo/useOpioidVentilatoryImpairmentDemonstration';
import { supportsOpioidVentilatoryImpairmentDemonstration } from '@anesthesia/demo/opioid-ventilatory-impairment-demonstration';
import { usePneumothoraxDemonstration } from '@anesthesia/demo/usePneumothoraxDemonstration';
import { supportsPneumothoraxUnderPositivePressureDemonstration } from '@anesthesia/demo/pneumothorax-under-positive-pressure-demonstration';
import { useRepeatedLaryngoscopyDemonstration } from '@anesthesia/demo/useRepeatedLaryngoscopyDemonstration';
import { supportsRepeatedLaryngoscopyDemonstration } from '@anesthesia/demo/repeated-laryngoscopy-demonstration';
import { useSupraglotticRescueDemonstration } from '@anesthesia/demo/useSupraglotticRescueDemonstration';
import { supportsSupraglotticRescueDemonstration } from '@anesthesia/demo/supraglottic-rescue-demonstration';
import { useHighSpinalDemonstration } from '@anesthesia/demo/useHighSpinalDemonstration';
import { supportsHighSpinalDemonstration } from '@anesthesia/demo/high-spinal-demonstration';
import { useVenousAirEmbolismDemonstration } from '@anesthesia/demo/useVenousAirEmbolismDemonstration';
import { supportsVenousAirEmbolismDemonstration } from '@anesthesia/demo/venous-air-embolism-demonstration';
import { usePostExtubationObstructionDemonstration } from '@anesthesia/demo/usePostExtubationObstructionDemonstration';
import { supportsPostExtubationObstructionDemonstration } from '@anesthesia/demo/post-extubation-obstruction-demonstration';
import { useCircleSystemRebreathingDemonstration } from '@anesthesia/demo/useCircleSystemRebreathingDemonstration';
import { supportsCircleSystemRebreathingDemonstration } from '@anesthesia/demo/circle-system-rebreathing-demonstration';
import { useCapnographyLineDemonstration } from '@anesthesia/demo/useCapnographyLineDemonstration';
import { supportsCapnographyLineDemonstration } from '@anesthesia/demo/capnography-line-demonstration';
import { useBloodBankHandoffDemonstration } from '@anesthesia/demo/useBloodBankHandoffDemonstration';
import { supportsBloodBankHandoffDemonstration } from '@anesthesia/demo/blood-bank-handoff-demonstration';
import { useArterialTransducerDemonstration } from '@anesthesia/demo/useArterialTransducerDemonstration';
import { supportsArterialTransducerDemonstration } from '@anesthesia/demo/arterial-transducer-demonstration';
import { useHypothermiaRewarmingDemonstration } from '@anesthesia/demo/useHypothermiaRewarmingDemonstration';
import { supportsHypothermiaRewarmingDemonstration } from '@anesthesia/demo/hypothermia-rewarming-demonstration';
import { usePerioperativeHyperglycemiaDemonstration } from '@anesthesia/demo/usePerioperativeHyperglycemiaDemonstration';
import { supportsPerioperativeHyperglycemiaDemonstration } from '@anesthesia/demo/perioperative-hyperglycemia-demonstration';
import { useInhalationalMaintenanceDemonstration } from '@anesthesia/demo/useInhalationalMaintenanceDemonstration';
import { supportsInhalationalMaintenanceDemonstration } from '@anesthesia/demo/inhalational-maintenance-demonstration';
import { usePersistentVfCardiacArrestDemonstration } from '@anesthesia/demo/usePersistentVfCardiacArrestDemonstration';
import { supportsPersistentVfCardiacArrestDemonstration } from '@anesthesia/demo/persistent-vf-cardiac-arrest-demonstration';
import { usePediatricIvInductionDemonstration } from '@anesthesia/demo/usePediatricIvInductionDemonstration';
import { supportsPediatricIvInductionDemonstration } from '@anesthesia/demo/pediatric-iv-induction-demonstration';
import { usePediatricInhalationalInductionDemonstration } from '@anesthesia/demo/usePediatricInhalationalInductionDemonstration';
import { supportsPediatricInhalationalInductionDemonstration } from '@anesthesia/demo/pediatric-inhalational-induction-demonstration';
import { useLastDemonstration } from '@anesthesia/demo/useLastDemonstration';
import { supportsLastDemonstration } from '@anesthesia/demo/last-demonstration';
import { useMalignantHyperthermiaDemonstration } from '@anesthesia/demo/useMalignantHyperthermiaDemonstration';
import { supportsMalignantHyperthermiaDemonstration } from '@anesthesia/demo/malignant-hyperthermia-demonstration';
import { useAnaphylaxisDemonstration } from '@anesthesia/demo/useAnaphylaxisDemonstration';
import { supportsAnaphylaxisDemonstration } from '@anesthesia/demo/anaphylaxis-demonstration';
import { useQuantitativeReversalDemonstration } from '@anesthesia/demo/useQuantitativeReversalDemonstration';
import { supportsQuantitativeReversalDemonstration } from '@anesthesia/demo/quantitative-reversal-demonstration';
import { useEmergenceResidualBlockadeDemonstration } from '@anesthesia/demo/useEmergenceResidualBlockadeDemonstration';
import { supportsEmergenceResidualBlockadeDemonstration } from '@anesthesia/demo/emergence-residual-blockade-demonstration';
import { useAspirationRiskDemonstration } from '@anesthesia/demo/useAspirationRiskDemonstration';
import { supportsAspirationRiskDemonstration } from '@anesthesia/demo/aspiration-risk-demonstration';
import { useDelayedEmergenceDemonstration } from '@anesthesia/demo/useDelayedEmergenceDemonstration';
import { supportsDelayedEmergenceDemonstration } from '@anesthesia/demo/delayed-emergence-demonstration';
import { useExtubationReadinessDemonstration } from '@anesthesia/demo/useExtubationReadinessDemonstration';
import { supportsExtubationReadinessDemonstration } from '@anesthesia/demo/extubation-readiness-demonstration';
import { useUnstableNarrowTachycardiaDemonstration as useEmergencyUnstableNarrowTachycardiaDemonstration } from '../../emergency-medicine/demo/useUnstableNarrowTachycardiaDemonstration';
import { supportsUnstableNarrowTachycardiaDemonstration } from '../../emergency-medicine/demo/unstable-narrow-complex-tachycardia-demonstration';
import { useObstructivePleuralShockDemonstration } from '../../emergency-medicine/demo/useObstructivePleuralShockDemonstration';
import { supportsObstructivePleuralShockDemonstration } from '../../emergency-medicine/demo/obstructive-shock-tension-pneumothorax-demonstration';
import { obstructivePleuralShockProgress } from '../../emergency-medicine/obstructive-shock-tension-pneumothorax';
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

/** What the one registry hook reads when this module supplied no example for the lesson. */
const IDLE_STEP: ObservedStep = { id: 'idle', narration: '', focus: 'none', progress: 0 };

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
  /**
   * This module's worked examples, supplied by its route.
   *
   * The cockpit used to call one `use<Lesson>Demonstration` hook per lesson, and
   * a demonstration module carries its narration, so all 242 lessons' scripts
   * sat in the shared cockpit chunk and a lesson added to one module grew the
   * download for all sixteen. A module that supplies this keeps its scripts in
   * its own chunk. The hooks still written out below are the lessons that read
   * more than the resuscitation snapshot and have not moved yet.
   */
  readonly demonstrations?: readonly LessonDemonstration[];
  /** This module's lesson trays, supplied by its route beside its worked examples. */
  readonly trays?: readonly LessonTray[];
  readonly moduleId?: 'anesthesia' | 'emergency-medicine' | 'critical-care' | 'cardiology' | 'respiratory-medicine' | 'pediatrics' | 'neurology' | 'toxicology' | 'obstetrics' | 'neonatology' | 'endocrine-metabolic' | 'renal-electrolyte' | 'infectious-disease' | 'medical-surgical-nursing' | 'oncology' | 'surgery-trauma';
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
  demonstrations,
  trays,
  moduleId = 'anesthesia',
}: CockpitProps) {
  const session = useSession();
  const reducedMotion = usePrefersReducedMotion();
  // The demonstration performs the same actions through the same path a learner
  // does, so what it shows is the engine and not a recording of it.
  // The lesson this module's registry recognises, if it supplied one.
  const registryDemo = demonstrations?.find((entry) => entry.supports(scenario));
  const criticalCareStatusEpilepticusDemoSupported = supportsCriticalCareStatusEpilepticusDemonstration(scenario);
  const peaArrestDemoSupported = supportsPeaArrestDemonstration(scenario);
  const persistentVfDemoSupported = supportsPersistentVfArrestDemonstration(scenario);
  const rapidDesaturationDemoSupported = supportsRapidDesaturationDemonstration(scenario);
  const hypotensionAfterInductionDemoSupported = supportsHypotensionAfterInductionDemonstration(scenario);
  const rapidSequenceInductionDemoSupported = supportsRapidSequenceInductionDemonstration(scenario);
  const awarenessUnderParalysisDemoSupported = supportsAwarenessUnderParalysisDemonstration(scenario);
  const laryngospasmDemoSupported = supportsLaryngospasmDemonstration(scenario);
  const bronchospasmDemoSupported = supportsBronchospasmDemonstration(scenario);
  const unexpectedHemorrhageDemoSupported = supportsUnexpectedHemorrhageDemonstration(scenario);
  const dilutionalCoagulopathyDemoSupported = supportsDilutionalCoagulopathyDemonstration(scenario);
  const obstetricGeneralAnesthesiaDemoSupported = supportsObstetricGeneralAnesthesiaDemonstration(scenario);
  const geriatricInductionDemoSupported = supportsGeriatricInductionDemonstration(scenario);
  const postoperativeHandoffDemoSupported = supportsPostoperativeHandoffDemonstration(scenario);
  const ciedPlanningDemoSupported = supportsPacemakerAndCauteryPlanningDemonstration(scenario);
  const preeclampsiaDemoSupported = supportsPreeclampsiaUrgentDeliveryDemonstration(scenario);
  const opioidVentilatoryDemoSupported = supportsOpioidVentilatoryImpairmentDemonstration(scenario);
  const pneumothoraxDemoSupported = supportsPneumothoraxUnderPositivePressureDemonstration(scenario);
  const repeatedLaryngoscopyDemoSupported = supportsRepeatedLaryngoscopyDemonstration(scenario);
  const supraglotticRescueDemoSupported = supportsSupraglotticRescueDemonstration(scenario);
  const highSpinalDemoSupported = supportsHighSpinalDemonstration(scenario);
  const venousAirDemoSupported = supportsVenousAirEmbolismDemonstration(scenario);
  const postExtubationDemoSupported = supportsPostExtubationObstructionDemonstration(scenario);
  const circleRebreathingDemoSupported = supportsCircleSystemRebreathingDemonstration(scenario);
  const capnographyLineDemoSupported = supportsCapnographyLineDemonstration(scenario);
  const bloodBankDemoSupported = supportsBloodBankHandoffDemonstration(scenario);
  const arterialTransducerDemoSupported = supportsArterialTransducerDemonstration(scenario);
  const hypothermiaDemoSupported = supportsHypothermiaRewarmingDemonstration(scenario);
  const hyperglycemiaDemoSupported = supportsPerioperativeHyperglycemiaDemonstration(scenario);
  const inhalationalMaintenanceDemoSupported = supportsInhalationalMaintenanceDemonstration(scenario);
  const vfCardiacArrestDemoSupported = supportsPersistentVfCardiacArrestDemonstration(scenario);
  const pediatricIvDemoSupported = supportsPediatricIvInductionDemonstration(scenario);
  const pediatricGasDemoSupported = supportsPediatricInhalationalInductionDemonstration(scenario);
  const lastDemoSupported = supportsLastDemonstration(scenario);
  const malignantHyperthermiaDemoSupported = supportsMalignantHyperthermiaDemonstration(scenario);
  const anaphylaxisDemoSupported = supportsAnaphylaxisDemonstration(scenario);
  const quantitativeReversalDemoSupported = supportsQuantitativeReversalDemonstration(scenario);
  const emergenceResidualBlockadeDemoSupported = supportsEmergenceResidualBlockadeDemonstration(scenario);
  const aspirationRiskDemoSupported = supportsAspirationRiskDemonstration(scenario);
  const delayedEmergenceDemoSupported = supportsDelayedEmergenceDemonstration(scenario);
  const extubationReadinessDemoSupported = supportsExtubationReadinessDemonstration(scenario);
  const emergencySvtDemoSupported = supportsUnstableNarrowTachycardiaDemonstration(scenario);
  const obstructivePleuralShockDemoSupported = supportsObstructivePleuralShockDemonstration(scenario);

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
  const observedStateDemoSupported = !!registryDemo
    || criticalCareStatusEpilepticusDemoSupported
    || peaArrestDemoSupported
    || persistentVfDemoSupported
    || rapidDesaturationDemoSupported
    || hypotensionAfterInductionDemoSupported
    || rapidSequenceInductionDemoSupported
    || awarenessUnderParalysisDemoSupported
    || laryngospasmDemoSupported
    || bronchospasmDemoSupported
    || unexpectedHemorrhageDemoSupported
    || dilutionalCoagulopathyDemoSupported
    || obstetricGeneralAnesthesiaDemoSupported
    || geriatricInductionDemoSupported
    || postoperativeHandoffDemoSupported
    || ciedPlanningDemoSupported
    || preeclampsiaDemoSupported
    || opioidVentilatoryDemoSupported
    || pneumothoraxDemoSupported
    || repeatedLaryngoscopyDemoSupported
    || supraglotticRescueDemoSupported
    || highSpinalDemoSupported
    || venousAirDemoSupported
    || postExtubationDemoSupported
    || circleRebreathingDemoSupported
    || capnographyLineDemoSupported
    || bloodBankDemoSupported
    || arterialTransducerDemoSupported
    || hypothermiaDemoSupported
    || hyperglycemiaDemoSupported
    || inhalationalMaintenanceDemoSupported
    || vfCardiacArrestDemoSupported
    || pediatricIvDemoSupported
    || pediatricGasDemoSupported
    || lastDemoSupported
    || malignantHyperthermiaDemoSupported
    || anaphylaxisDemoSupported
    || quantitativeReversalDemoSupported
    || emergenceResidualBlockadeDemoSupported
    || aspirationRiskDemoSupported
    || delayedEmergenceDemoSupported
    || extubationReadinessDemoSupported
    || emergencySvtDemoSupported
    || obstructivePleuralShockDemoSupported;
  const scenarioDemoSupported = observedStateDemoSupported;
  const inductionDemonstration = useDemonstration({
    active: demonstrating && !scenarioDemoSupported,
    tick: session.tick,
    act: session.act,
    onFinished: () => onTakeControls?.(),
  });
  const criticalCareStatusEpilepticusDemonstration = useCriticalCareStatusEpilepticusDemonstration({
    active: demonstrating && criticalCareStatusEpilepticusDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.criticalCareStatusEpilepticusAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const obstructivePleuralShockDemonstration = useObstructivePleuralShockDemonstration({
    active: demonstrating && obstructivePleuralShockDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment ? obstructivePleuralShockProgress(session.equipment) : undefined,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const emergencySvtDemonstration = useEmergencyUnstableNarrowTachycardiaDemonstration({
    active: demonstrating && emergencySvtDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.unstableNarrowTachycardiaAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const peaArrestDemonstration = usePeaArrestDemonstration({
    active: demonstrating && peaArrestDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * This lesson has no assessment sidecar, so its worked example reads the
   * patient: the flowmeter, the end-tidal fraction, the engine's own
   * preoxygenation counter, whether he is still breathing, what has arrived in
   * the plasma, and the airway. Assembled here rather than in the hook, because
   * only the cockpit holds all four of those sources at once.
   */
  const rapidDesaturationProgress = session.state && session.equipment ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    endTidalOxygenFraction: session.state.endTidalO2Fraction ?? 0,
    preoxygenationSeconds: session.equipment.preoxygenationSeconds,
    respiratoryRateBpm: session.state.respiratoryRateBpm ?? 0,
    remifentanilPlasma: session.concentrations
      .find((drug) => drug.drugId === 'remifentanil')?.plasma ?? 0,
    propofolPlasma: session.concentrations
      .find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    intubated: session.equipment.airway.intubated,
    ventilating: session.equipment.ventilator.delivering,
    airwayAttempts: session.equipment.airway.attempts,
    airwayAttemptInProgress: session.equipment.airway.attemptInProgress,
  } : undefined;
  const rapidDesaturationDemonstration = useRapidDesaturationDemonstration({
    active: demonstrating && rapidDesaturationDemoSupported,
    running: session.transport === 'running',
    patient: rapidDesaturationProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The same four sources as the lesson before it, plus two the pressure lesson
   * needs: the engine's own accepted crystalloid total, and whether the modelled
   * losses are still running. Reading the total rather than counting dispatches
   * is what makes the example resumable after a learner hangs a bag themselves.
   */
  const hypotensionAfterInductionProgress = session.state && session.equipment ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    endTidalOxygenFraction: session.state.endTidalO2Fraction ?? 0,
    meanArterialMmHg: session.state.meanArterialMmHg ?? 0,
    crystalloidTotalMl: session.equipment.resuscitation.crystalloidTotalMl,
    lossesRunning: session.equipment.resuscitation.hemorrhageActive === true,
    remifentanilPlasma: session.concentrations
      .find((drug) => drug.drugId === 'remifentanil')?.plasma ?? 0,
    propofolPlasma: session.concentrations
      .find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    intubated: session.equipment.airway.intubated,
    airwayAttempts: session.equipment.airway.attempts,
    airwayAttemptInProgress: session.equipment.airway.attemptInProgress,
  } : undefined;
  const hypotensionAfterInductionDemonstration = useHypotensionAfterInductionDemonstration({
    active: demonstrating && hypotensionAfterInductionDemoSupported,
    running: session.transport === 'running',
    patient: hypotensionAfterInductionProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The block lesson needs two sources the others do not: the post-tetanic count,
   * and both rocuronium curves. The pair is what tells onset from offset — during
   * onset the plasma leads, during offset the effect site does — and the reversal
   * control is refused on the wrong limb, so the example cannot be written
   * without them.
   */
  const rapidSequenceInductionProgress = session.state && session.equipment ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    endTidalOxygenFraction: session.state.endTidalO2Fraction ?? 0,
    depthIndex: session.state.depthIndex ?? 100,
    trainOfFourCount: session.state.trainOfFourCount ?? 4,
    trainOfFourRatio: session.state.trainOfFourRatio ?? 1,
    postTetanicCount: session.equipment.resuscitation.postTetanicCount ?? 0,
    remifentanilPlasma: session.concentrations
      .find((drug) => drug.drugId === 'remifentanil')?.plasma ?? 0,
    propofolPlasma: session.concentrations
      .find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    rocuroniumPlasma: session.concentrations
      .find((drug) => drug.drugId === 'rocuronium')?.plasma ?? 0,
    rocuroniumEffectSite: session.concentrations
      .find((drug) => drug.drugId === 'rocuronium')?.effectSite ?? 0,
    intubated: session.equipment.airway.intubated,
    reversed: session.equipment.resuscitation.lastNeuromuscularReversal != null,
    airwayAttempts: session.equipment.airway.attempts,
    airwayAttemptInProgress: session.equipment.airway.attemptInProgress,
  } : undefined;
  const rapidSequenceInductionDemonstration = useRapidSequenceInductionDemonstration({
    active: demonstrating && rapidSequenceInductionDemoSupported,
    running: session.transport === 'running',
    patient: rapidSequenceInductionProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The silent-failure lesson reads the delivery path itself rather than any
   * action list, because that is the only place the failure is visible: the pump
   * keeps reporting its commanded rate, and the infusion rate below is the
   * commanded one rather than the delivered one.
   */
  const awarenessUnderParalysisProgress = session.state && session.equipment ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    depthIndex: session.state.depthIndex ?? 100,
    trainOfFourRatio: session.state.trainOfFourRatio ?? 1,
    hypnoticLineConnected: session.equipment.hypnoticLine.connected,
    hypnoticLineInspected: session.equipment.hypnoticLine.inspected,
    propofolInfusionRate: session.equipment.drugs
      .find((drug) => drug.drugId === 'propofol')?.infusionRate ?? 0,
    remifentanilPlasma: session.concentrations
      .find((drug) => drug.drugId === 'remifentanil')?.plasma ?? 0,
    propofolPlasma: session.concentrations
      .find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    rocuroniumPlasma: session.concentrations
      .find((drug) => drug.drugId === 'rocuronium')?.plasma ?? 0,
    intubated: session.equipment.airway.intubated,
    airwayAttempts: session.equipment.airway.attempts,
    airwayAttemptInProgress: session.equipment.airway.attemptInProgress,
  } : undefined;
  const awarenessUnderParalysisDemonstration = useAwarenessUnderParalysisDemonstration({
    active: demonstrating && awarenessUnderParalysisDemoSupported,
    running: session.transport === 'running',
    patient: awarenessUnderParalysisProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The closure lesson reads the airway's own patency fraction alongside the
   * depth index, because the engine relieves the spasm only while the held
   * maneuver, positive pressure, oxygen and a depth at or below 60 are all true
   * at once — so neither number alone can order the example's beats.
   */
  const laryngospasmProgress = session.state && session.equipment ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    ventilatorDelivering: session.equipment.ventilator.delivering,
    endTidalOxygenFraction: session.state.endTidalO2Fraction ?? 0,
    patencyFraction: session.equipment.airway.patencyFraction,
    jawThrustSecondsRemaining: session.equipment.airway.jawThrustCpapSecondsRemaining,
    depthIndex: session.state.depthIndex ?? 100,
    spo2Percent: session.state.spo2Percent ?? 100,
  } : undefined;
  const laryngospasmDemonstration = useLaryngospasmDemonstration({
    active: demonstrating && laryngospasmDemoSupported,
    running: session.transport === 'running',
    patient: laryngospasmProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The obstruction lesson reads the engine's own bronchospasm severity rather
   * than the end-tidal figure, because the severity moves while the number is
   * still inside its alarm limits — which is the delay the lesson argues
   * against, and would be reproduced by an example that waited for the number.
   */
  const bronchospasmProgress = session.state && session.equipment ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    endTidalOxygenFraction: session.state.endTidalO2Fraction ?? 0,
    ventilatorDelivering: session.equipment.ventilator.delivering,
    bronchospasmSeverity: session.equipment.airway.bronchospasmSeverity,
    etco2MmHg: session.state.etco2MmHg ?? 0,
    depthIndex: session.state.depthIndex ?? 100,
    helpRequested: session.equipment.airway.helpRequestedAtTick !== null,
    salbutamolTotalMg: session.equipment.resuscitation.salbutamolTotalMg ?? 0,
    remifentanilPlasma: session.concentrations
      .find((drug) => drug.drugId === 'remifentanil')?.plasma ?? 0,
    propofolPlasma: session.concentrations
      .find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    intubated: session.equipment.airway.intubated,
    airwayAttempts: session.equipment.airway.attempts,
    airwayAttemptInProgress: session.equipment.airway.attemptInProgress,
  } : undefined;
  const bronchospasmDemonstration = useBronchospasmDemonstration({
    active: demonstrating && bronchospasmDemoSupported,
    running: session.transport === 'running',
    patient: bronchospasmProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The haemorrhage lesson reads the accepted crystalloid total and the released
   * products rather than the engine's hemorrhage flag alone: that flag is true
   * from tick 300 because of the slow loss as well as the tamponade release, so
   * it can start the sequence and cannot order it.
   */
  const unexpectedHemorrhageProgress = session.state && session.equipment ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    endTidalOxygenFraction: session.state.endTidalO2Fraction ?? 0,
    hemorrhageActive: session.equipment.resuscitation.hemorrhageActive === true,
    crystalloidTotalMl: session.equipment.resuscitation.crystalloidTotalMl,
    bloodProductsReleased: session.equipment.resuscitation.bloodProductsReleased === true,
    packedRedBloodCellUnits: session.equipment.resuscitation.packedRedBloodCellUnits ?? 0,
    meanArterialMmHg: session.state.meanArterialMmHg ?? 0,
    remifentanilPlasma: session.concentrations
      .find((drug) => drug.drugId === 'remifentanil')?.plasma ?? 0,
    propofolPlasma: session.concentrations
      .find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    intubated: session.equipment.airway.intubated,
    airwayAttempts: session.equipment.airway.attempts,
    airwayAttemptInProgress: session.equipment.airway.attemptInProgress,
  } : undefined;
  const unexpectedHemorrhageDemonstration = useUnexpectedHemorrhageDemonstration({
    active: demonstrating && unexpectedHemorrhageDemoSupported,
    running: session.transport === 'running',
    patient: unexpectedHemorrhageProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The only demonstration in this module that reads the session's event log.
   * Ordering a coagulation panel changes no modelled state — it reports numbers
   * the solver was already computing — so a second panel is invisible to the
   * equipment snapshot, and counting the accepted events is the only honest way
   * to observe an action whose whole effect is on the observer.
   */
  const dilutionalCoagulopathyProgress = session.state && session.equipment ? {
    coagulationPanelCount: session.log
      .filter((entry) => entry.eventId.startsWith('coagulation-labs-')).length,
    bloodProductsReleased: session.equipment.resuscitation.bloodProductsReleased === true,
    freshFrozenPlasmaUnits: session.equipment.resuscitation.freshFrozenPlasmaUnits ?? 0,
    prothrombinTimeRatio: session.state.prothrombinTimeRatio ?? 1,
    fibrinogenGPerL: session.state.fibrinogenGPerL ?? 3,
  } : undefined;
  const dilutionalCoagulopathyDemonstration = useDilutionalCoagulopathyDemonstration({
    active: demonstrating && dilutionalCoagulopathyDemoSupported,
    running: session.transport === 'running',
    patient: dilutionalCoagulopathyProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The obstetric lesson is the only one that needs the fresh-gas flow, because
   * its preparation objective asks for both halves of the wash-in: a circle
   * system left at 2 L/min rebreathes nitrogen however high the dial reads.
   */
  const obstetricGeneralAnesthesiaProgress = session.state && session.equipment ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    freshGasFlowLPerMin: session.equipment.ventilator.freshGasFlowLPerMin ?? 0,
    endTidalOxygenFraction: session.state.endTidalO2Fraction ?? 0,
    trainOfFourCount: session.state.trainOfFourCount ?? 4,
    propofolPlasma: session.concentrations
      .find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    rocuroniumPlasma: session.concentrations
      .find((drug) => drug.drugId === 'rocuronium')?.plasma ?? 0,
    intubated: session.equipment.airway.intubated,
    ventilating: session.equipment.ventilator.delivering,
    spo2Percent: session.state.spo2Percent ?? 100,
    airwayAttempts: session.equipment.airway.attempts,
    airwayAttemptInProgress: session.equipment.airway.attemptInProgress,
  } : undefined;
  const obstetricGeneralAnesthesiaDemonstration = useObstetricGeneralAnesthesiaDemonstration({
    active: demonstrating && obstetricGeneralAnesthesiaDemoSupported,
    running: session.transport === 'running',
    patient: obstetricGeneralAnesthesiaProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The geriatric lesson counts accepted milligrams rather than clicks, and
   * derives them from the engine's own syringe volume so the example stays
   * resumable after a learner gives an increment themselves. The plasma
   * concentration cannot do the job: it falls between increments.
   */
  const geriatricPropofol = scenario.formulary.find((entry) => entry.drugId === 'propofol');
  const geriatricInductionProgress = session.state && session.equipment && geriatricPropofol ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    endTidalOxygenFraction: session.state.endTidalO2Fraction ?? 0,
    propofolTotalMg: (geriatricPropofol.syringeVolumeMl - (session.equipment.drugs
      .find((drug) => drug.drugId === 'propofol')?.syringeRemainingMl
      ?? geriatricPropofol.syringeVolumeMl)) * geriatricPropofol.concentration,
    propofolPlasma: session.concentrations
      .find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    depthIndex: session.state.depthIndex ?? 100,
    meanArterialMmHg: session.state.meanArterialMmHg ?? 0,
    ventilating: session.equipment.ventilator.delivering,
    spo2Percent: session.state.spo2Percent ?? 100,
  } : undefined;
  const geriatricInductionDemonstration = useGeriatricInductionDemonstration({
    active: demonstrating && geriatricInductionDemoSupported,
    running: session.transport === 'running',
    patient: geriatricInductionProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The LAST lesson is sequenced on quantities that only rise or latch. The
   * toxicity and seizure fractions both FALL as the treatment works, so a beat
   * gated on either fires again as the model relaxes.
   */
  const lastProgress = session.state && session.equipment ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    ventilatorDelivering: session.equipment.ventilator.delivering,
    tidalVolumeMl: session.equipment.ventilator.tidalVolumeMl,
    respiratoryRateBpm: session.equipment.ventilator.respiratoryRateBpm,
    toxicityFraction: session.equipment.resuscitation.localAnestheticToxicityFraction ?? 0,
    seizureFraction: session.equipment.resuscitation.seizureActivityFraction ?? 0,
    lipidInfusionMlPerMin: session.equipment.resuscitation.lipidEmulsionInfusionMlPerMin ?? 0,
    epinephrineTotalMicrograms: session.equipment.resuscitation.epinephrineTotalMicrograms,
    weightKg: scenario.patient.weightKg,
  } : undefined;
  const lastDemonstration = useLastDemonstration({
    active: demonstrating && lastDemoSupported,
    running: session.transport === 'running',
    patient: lastProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The MH lesson is sequenced on the dantrolene total, the only quantity here
   * that cannot go back down: the rigidity fraction climbs before treatment and
   * falls after it, so a beat gated on it fires again on the way down.
   */
  const malignantHyperthermiaProgress = session.state && session.equipment ? {
    sevofluranePercent: session.equipment.ventilator.sevofluranePercent ?? 0,
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    freshGasFlowLPerMin: session.equipment.ventilator.freshGasFlowLPerMin ?? 0,
    tidalVolumeMl: session.equipment.ventilator.tidalVolumeMl,
    respiratoryRateBpm: session.equipment.ventilator.respiratoryRateBpm,
    ventilatorDelivering: session.equipment.ventilator.delivering,
    muscleRigidityFraction: session.state.muscleRigidityFraction ?? 0,
    etco2MmHg: session.state.etco2MmHg ?? 0,
    coreTemperatureC: session.state.coreTemperatureC ?? 0,
    dantroleneTotalMg: session.equipment.resuscitation.dantroleneTotalMg,
  } : undefined;
  const malignantHyperthermiaDemonstration = useMalignantHyperthermiaDemonstration({
    active: demonstrating && malignantHyperthermiaDemoSupported,
    running: session.transport === 'running',
    patient: malignantHyperthermiaProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The anaphylaxis lesson has no severity field on the snapshot, so its example
   * triggers on the collapse itself — the same observation the learner has. Its
   * treatment branch latches on epinephrine given, because the drug lifts the
   * pressure back over the trigger threshold for a while.
   */
  const anaphylaxisProgress = session.state && session.equipment ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    ventilatorDelivering: session.equipment.ventilator.delivering,
    epinephrineTotalMicrograms: session.equipment.resuscitation.epinephrineTotalMicrograms,
    crystalloidTotalMl: session.equipment.resuscitation.crystalloidTotalMl,
    meanArterialMmHg: session.state.meanArterialMmHg ?? 0,
  } : undefined;
  const anaphylaxisDemonstration = useAnaphylaxisDemonstration({
    active: demonstrating && anaphylaxisDemoSupported,
    running: session.transport === 'running',
    patient: anaphylaxisProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The reversal lesson is sequenced on the rocuronium in the plasma and on the
   * accepted reversal, both of which latch. Neither the train-of-four count nor
   * the ratio can order anything: both return to their starting values, and the
   * post-tetanic count reads the same on each limb of the block.
   */
  const quantitativeReversalProgress = session.state && session.equipment ? {
    trainOfFourCount: session.state.trainOfFourCount ?? 4,
    trainOfFourRatio: session.state.trainOfFourRatio ?? 1,
    postTetanicCount: session.equipment.resuscitation.postTetanicCount ?? 0,
    rocuroniumPlasma: session.concentrations
      .find((drug) => drug.drugId === 'rocuronium')?.plasma ?? 0,
    rocuroniumEffectSite: session.concentrations
      .find((drug) => drug.drugId === 'rocuronium')?.effectSite ?? 0,
    reversed: session.equipment.resuscitation.lastNeuromuscularReversal != null,
    depthIndex: session.state.depthIndex ?? 100,
  } : undefined;
  const quantitativeReversalDemonstration = useQuantitativeReversalDemonstration({
    active: demonstrating && quantitativeReversalDemoSupported,
    running: session.transport === 'running',
    patient: quantitativeReversalProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The first anaesthesia lesson with an assessment sidecar to read: its
   * recorded steps are ticks that are either null or not, so this example needs
   * no physiological gate at all. The sidecar lives under `resuscitation`
   * alongside the crisis totals rather than at the top of the snapshot.
   */
  const emergenceResidualBlockadeProgress = session.state && session.equipment ? {
    monitorReviewedAtTick: session.equipment.resuscitation
      .emergenceResidualBlockAssessment?.monitorReviewedAtTick ?? null,
    classification: session.equipment.resuscitation
      .emergenceResidualBlockAssessment?.classification ?? null,
    plan: session.equipment.resuscitation.emergenceResidualBlockAssessment?.plan ?? null,
    trainOfFourCount: session.state.trainOfFourCount ?? 4,
    trainOfFourRatio: session.state.trainOfFourRatio ?? 1,
  } : undefined;
  const emergenceResidualBlockadeDemonstration = useEmergenceResidualBlockadeDemonstration({
    active: demonstrating && emergenceResidualBlockadeDemoSupported,
    running: session.transport === 'running',
    patient: emergenceResidualBlockadeProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /** The second sidecar lesson: recorded steps under `resuscitation`, no physiology. */
  const aspirationRiskProgress = session.equipment ? {
    cuesReviewedAtTick: session.equipment.resuscitation
      .aspirationRiskAssessment?.cuesReviewedAtTick ?? null,
    classification: session.equipment.resuscitation
      .aspirationRiskAssessment?.classification ?? null,
    plan: session.equipment.resuscitation.aspirationRiskAssessment?.plan ?? null,
  } : undefined;
  const aspirationRiskDemonstration = useAspirationRiskDemonstration({
    active: demonstrating && aspirationRiskDemoSupported,
    running: session.transport === 'running',
    patient: aspirationRiskProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /** The third sidecar lesson, and the longest: five recorded steps in order. */
  const delayedEmergenceProgress = session.equipment ? {
    supportReviewedAtTick: session.equipment.resuscitation
      .delayedEmergenceAssessment?.supportReviewedAtTick ?? null,
    exposureReviewedAtTick: session.equipment.resuscitation
      .delayedEmergenceAssessment?.exposureReviewedAtTick ?? null,
    metabolicReviewedAtTick: session.equipment.resuscitation
      .delayedEmergenceAssessment?.metabolicReviewedAtTick ?? null,
    neurologicExamAtTick: session.equipment.resuscitation
      .delayedEmergenceAssessment?.neurologicExamAtTick ?? null,
    escalation: session.equipment.resuscitation.delayedEmergenceAssessment?.escalation ?? null,
  } : undefined;
  const delayedEmergenceDemonstration = useDelayedEmergenceDemonstration({
    active: demonstrating && delayedEmergenceDemoSupported,
    running: session.transport === 'running',
    patient: delayedEmergenceProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /** The fourth sidecar lesson: four ordered reviews, then a decision. */
  const extubationReadinessProgress = session.state && session.equipment ? {
    quantitativeRecoveryReviewedAtTick: session.equipment.resuscitation
      .extubationReadinessAssessment?.quantitativeRecoveryReviewedAtTick ?? null,
    awakeAirwayReviewedAtTick: session.equipment.resuscitation
      .extubationReadinessAssessment?.awakeAirwayReviewedAtTick ?? null,
    gasExchangeReviewedAtTick: session.equipment.resuscitation
      .extubationReadinessAssessment?.gasExchangeReviewedAtTick ?? null,
    airwayPlanReviewedAtTick: session.equipment.resuscitation
      .extubationReadinessAssessment?.airwayPlanReviewedAtTick ?? null,
    decision: session.equipment.resuscitation.extubationReadinessAssessment?.decision ?? null,
    trainOfFourRatio: session.state.trainOfFourRatio ?? 1,
  } : undefined;
  const extubationReadinessDemonstration = useExtubationReadinessDemonstration({
    active: demonstrating && extubationReadinessDemoSupported,
    running: session.transport === 'running',
    patient: extubationReadinessProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The laryngoscopy lesson keys on quantities that only rise, and holds a beat
   * while an attempt is in progress: the count is still zero until it completes.
   */
  const repeatedLaryngoscopyPropofol = scenario.formulary.find((entry) => entry.drugId === 'propofol');
  const repeatedLaryngoscopyProgress = session.state && session.equipment && repeatedLaryngoscopyPropofol ? {
    endTidalOxygenFraction: session.state.endTidalO2Fraction ?? 0,
    helpRequestedAtTick: session.equipment.airway.helpRequestedAtTick ?? null,
    propofolTotalMg: (repeatedLaryngoscopyPropofol.syringeVolumeMl - (session.equipment.drugs
      .find((drug) => drug.drugId === 'propofol')?.syringeRemainingMl
      ?? repeatedLaryngoscopyPropofol.syringeVolumeMl)) * repeatedLaryngoscopyPropofol.concentration,
    attempts: session.equipment.airway.attempts,
    attemptInProgress: session.equipment.airway.attemptInProgress,
    airwayDevice: session.equipment.airway.device,
    ventilatorDelivering: session.equipment.ventilator.delivering,
  } : undefined;
  const repeatedLaryngoscopyDemonstration = useRepeatedLaryngoscopyDemonstration({
    active: demonstrating && repeatedLaryngoscopyDemoSupported,
    running: session.transport === 'running',
    patient: repeatedLaryngoscopyProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const supraglotticRescueDemonstration = useSupraglotticRescueDemonstration({
    active: demonstrating && supraglotticRescueDemoSupported,
    running: session.transport === 'running',
    patient: repeatedLaryngoscopyProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const pediatricGasProgress = session.state && session.equipment ? {
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    freshGasFlowLPerMin: session.equipment.ventilator.freshGasFlowLPerMin ?? 0,
    sevofluranePercent: session.equipment.ventilator.sevofluranePercent ?? 0,
    endTidalSevofluranePercent: session.state.endTidalSevofluranePercent ?? 0,
    ventilatorDelivering: session.equipment.ventilator.delivering,
  } : undefined;
  const pediatricGasDemonstration = usePediatricInhalationalInductionDemonstration({
    active: demonstrating && pediatricGasDemoSupported,
    running: session.transport === 'running',
    patient: pediatricGasProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const pediatricIvPropofol = scenario.formulary.find((entry) => entry.drugId === 'propofol');
  const pediatricIvProgress = session.state && session.equipment && pediatricIvPropofol ? {
    endTidalOxygenFraction: session.state.endTidalO2Fraction ?? 0,
    propofolTotalMg: (pediatricIvPropofol.syringeVolumeMl - (session.equipment.drugs
      .find((drug) => drug.drugId === 'propofol')?.syringeRemainingMl
      ?? pediatricIvPropofol.syringeVolumeMl)) * pediatricIvPropofol.concentration,
    tidalVolumeMl: session.equipment.ventilator.tidalVolumeMl,
    ventilatorDelivering: session.equipment.ventilator.delivering,
    weightKg: scenario.patient.weightKg,
  } : undefined;
  const pediatricIvDemonstration = usePediatricIvInductionDemonstration({
    active: demonstrating && pediatricIvDemoSupported,
    running: session.transport === 'running',
    patient: pediatricIvProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const vfCardiacArrestProgress = session.state && session.equipment ? {
    arrestActive: session.equipment.resuscitation.cardiacArrestActive ?? false,
    compressionsActive: session.equipment.resuscitation.chestCompressionsActive ?? false,
    arrestEpinephrineTotalMg: session.equipment.resuscitation.arrestEpinephrineTotalMg ?? 0,
    defibrillationShockCount: session.equipment.resuscitation.defibrillationShockCount ?? 0,
    roscAtTick: session.equipment.resuscitation.roscAtTick ?? null,
  } : undefined;
  const vfCardiacArrestDemonstration = usePersistentVfCardiacArrestDemonstration({
    active: demonstrating && vfCardiacArrestDemoSupported,
    running: session.transport === 'running',
    patient: vfCardiacArrestProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const inhalationalMaintenanceProgress = session.state && session.equipment ? {
    tick: session.tick ?? 0,
    stimulusActive: (session.state.surgicalStimulus ?? 0) > 0,
    sevofluranePercent: session.equipment.ventilator.sevofluranePercent ?? 0,
    remifentanilRate: session.equipment.drugs
      .find((drug) => drug.drugId === 'remifentanil')?.infusionRate ?? 0,
    depthIndex: session.state.depthIndex ?? 100,
  } : undefined;
  const inhalationalMaintenanceDemonstration = useInhalationalMaintenanceDemonstration({
    active: demonstrating && inhalationalMaintenanceDemoSupported,
    running: session.transport === 'running',
    patient: inhalationalMaintenanceProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const hyperglycemiaDemonstration = usePerioperativeHyperglycemiaDemonstration({
    active: demonstrating && hyperglycemiaDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.glycemicResponse,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const hypothermiaProgress = session.state && session.equipment ? {
    targetTemperatureC:
      session.equipment.resuscitation.thermalResponse?.targetTemperatureC ?? null,
    coreTemperatureConfirmedAtTick:
      session.equipment.resuscitation.thermalResponse?.coreTemperatureConfirmedAtTick ?? null,
    forcedAirWarmingAtTick:
      session.equipment.resuscitation.thermalResponse?.forcedAirWarmingAtTick ?? null,
    warmedBulkFluidsAtTick:
      session.equipment.resuscitation.thermalResponse?.warmedBulkFluidsAtTick ?? null,
    coreTemperatureC: session.state.coreTemperatureC ?? 0,
  } : undefined;
  const hypothermiaDemonstration = useHypothermiaRewarmingDemonstration({
    active: demonstrating && hypothermiaDemoSupported,
    running: session.transport === 'running',
    patient: hypothermiaProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const arterialTransducerProgress = session.state && session.equipment ? {
    mislevelingCm: session.equipment.arterialLine?.mislevelingCm ?? 0,
    dynamicResponse: session.equipment.arterialLine?.dynamicResponse ?? 'normal',
    waveformAssessed: session.equipment.arterialLine?.waveformAssessed ?? false,
    leveledAndZeroed: session.equipment.arterialLine?.leveledAndZeroed ?? false,
    cuffStatus: session.equipment.arterialLine?.cuff?.status ?? 'idle',
    cuffMeanArterialMmHg: session.equipment.arterialLine?.cuff?.meanArterialMmHg ?? null,
  } : undefined;
  const arterialTransducerDemonstration = useArterialTransducerDemonstration({
    active: demonstrating && arterialTransducerDemoSupported,
    running: session.transport === 'running',
    patient: arterialTransducerProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const bloodBankProgress = session.state && session.equipment ? {
    hemorrhageActive: session.equipment.resuscitation.hemorrhageActive ?? false,
    bloodProductsReleased: session.equipment.resuscitation.bloodProductsReleased ?? false,
    packedRedBloodCellUnits: session.equipment.resuscitation.packedRedBloodCellUnits ?? 0,
    hemoglobinGPerDl: session.state.hemoglobinGPerDl ?? 0,
    meanArterialMmHg: session.state.meanArterialMmHg ?? 0,
  } : undefined;
  const bloodBankDemonstration = useBloodBankHandoffDemonstration({
    active: demonstrating && bloodBankDemoSupported,
    running: session.transport === 'running',
    patient: bloodBankProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const capnographyLineProgress = session.state && session.equipment ? {
    samplingLineObstructed: session.equipment.capnographyLine?.obstructed ?? false,
    ventilationCrossChecked: session.equipment.capnographyLine?.ventilationCrossChecked ?? false,
    spontaneousRateBpm: session.state.respiratoryRateBpm ?? 0,
    spo2Percent: session.state.spo2Percent ?? 100,
  } : undefined;
  const capnographyLineDemonstration = useCapnographyLineDemonstration({
    active: demonstrating && capnographyLineDemoSupported,
    running: session.transport === 'running',
    patient: capnographyLineProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const circleRebreathingProgress = session.state && session.equipment ? {
    absorbentExhausted: session.equipment.breathingCircuit?.co2Absorbent === 'exhausted',
    inspiredCo2MmHg: session.equipment.breathingCircuit?.inspiredCo2MmHg ?? 0,
    capnogramAssessed: session.equipment.breathingCircuit?.capnogramAssessed ?? false,
    absorbentReplaced: session.equipment.breathingCircuit?.absorbentReplaced ?? false,
    freshGasFlowLPerMin: session.equipment.ventilator.freshGasFlowLPerMin ?? 0,
  } : undefined;
  const circleRebreathingDemonstration = useCircleSystemRebreathingDemonstration({
    active: demonstrating && circleRebreathingDemoSupported,
    running: session.transport === 'running',
    patient: circleRebreathingProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const postExtubationProgress = session.state && session.equipment ? {
    obstructionSeverity: session.equipment.airway.postExtubationObstructionSeverity ?? 0,
    helpRequestedAtTick: session.equipment.airway.helpRequestedAtTick ?? null,
    ventilatorDelivering: session.equipment.ventilator.delivering,
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    jawThrustCpapSecondsRemaining: session.equipment.airway.jawThrustCpapSecondsRemaining ?? 0,
    patencyFraction: session.equipment.airway.patencyFraction ?? 0,
  } : undefined;
  const postExtubationDemonstration = usePostExtubationObstructionDemonstration({
    active: demonstrating && postExtubationDemoSupported,
    running: session.transport === 'running',
    patient: postExtubationProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const venousAirProgress = session.state && session.equipment ? {
    severity: session.equipment.resuscitation.venousAirEmbolismFraction ?? 0,
    helpRequestedAtTick: session.equipment.airway.helpRequestedAtTick ?? null,
    entryControlled: session.equipment.resuscitation.venousAirEntryControlled ?? false,
    ventilatorDelivering: session.equipment.ventilator.delivering,
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
  } : undefined;
  const venousAirDemonstration = useVenousAirEmbolismDemonstration({
    active: demonstrating && venousAirDemoSupported,
    running: session.transport === 'running',
    patient: venousAirProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const highSpinalProgress = session.state && session.equipment ? {
    severity: session.equipment.resuscitation.highSpinalFraction ?? 0,
    helpRequestedAtTick: session.equipment.airway.helpRequestedAtTick ?? null,
    ventilatorDelivering: session.equipment.ventilator.delivering,
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    crystalloidTotalMl: session.equipment.resuscitation.crystalloidTotalMl ?? 0,
    ephedrineTotalMg: session.equipment.resuscitation.ephedrineTotalMg ?? 0,
  } : undefined;
  const highSpinalDemonstration = useHighSpinalDemonstration({
    active: demonstrating && highSpinalDemoSupported,
    running: session.transport === 'running',
    patient: highSpinalProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const pneumothoraxProgress = session.state && session.equipment ? {
    severity: session.equipment.resuscitation.tensionPneumothoraxFraction ?? 0,
    assessedAtTick: session.equipment.resuscitation.pneumothoraxAssessedAtTick ?? null,
    helpRequestedAtTick: session.equipment.airway.helpRequestedAtTick ?? null,
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    ventilatorDelivering: session.equipment.ventilator.delivering,
    decompressedAtTick: session.equipment.resuscitation.pneumothoraxDecompressedAtTick ?? null,
  } : undefined;
  const pneumothoraxDemonstration = usePneumothoraxDemonstration({
    active: demonstrating && pneumothoraxDemoSupported,
    running: session.transport === 'running',
    patient: pneumothoraxProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The opioid lesson never keys on the saturation, which reads 100% both when
   * the patient is supported and when they are only receiving oxygen while
   * breathing four times a minute. Latched ticks and the machine state instead.
   */
  const opioidVentilatoryProgress = session.state && session.equipment ? {
    severity: session.equipment.resuscitation.opioidVentilatoryResponse?.severity ?? 0,
    helpRequestedAtTick: session.equipment.airway.helpRequestedAtTick ?? null,
    ventilatorDelivering: session.equipment.ventilator.delivering,
    inspiredOxygenFraction: session.equipment.ventilator.fio2,
    furtherOpioidHeldAtTick:
      session.equipment.resuscitation.opioidVentilatoryResponse?.furtherOpioidHeldAtTick ?? null,
    naloxoneIntentAtTick:
      session.equipment.resuscitation.opioidVentilatoryResponse?.naloxoneIntentAtTick ?? null,
    respiratoryRateBpm: session.state.respiratoryRateBpm ?? 0,
  } : undefined;
  const opioidVentilatoryDemonstration = useOpioidVentilatoryImpairmentDemonstration({
    active: demonstrating && opioidVentilatoryDemoSupported,
    running: session.transport === 'running',
    patient: opioidVentilatoryProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  /**
   * The preeclampsia lesson keys on a check count and two cumulative doses,
   * all of which only rise. The pressure itself falls after labetalol, so a
   * beat gated on it would walk backwards once the drug worked.
   */
  const preeclampsiaProgress = session.state && session.equipment ? {
    bloodPressureChecks: session.equipment.resuscitation.preeclampsiaBloodPressureChecks ?? 0,
    labetalolTotalMg: session.equipment.resuscitation.labetalolTotalMg ?? 0,
    magnesiumSulfateTotalG: session.equipment.resuscitation.magnesiumSulfateTotalG ?? 0,
    systolicMmHg: session.state.systolicMmHg ?? 0,
  } : undefined;
  const preeclampsiaDemonstration = usePreeclampsiaUrgentDeliveryDemonstration({
    active: demonstrating && preeclampsiaDemoSupported,
    running: session.transport === 'running',
    patient: preeclampsiaProgress,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const ciedPlanningDemonstration = usePacemakerAndCauteryPlanningDemonstration({
    active: demonstrating && ciedPlanningDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.ciedPlanningAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const postoperativeHandoffDemonstration = usePostoperativeHandoffDemonstration({
    active: demonstrating && postoperativeHandoffDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation.postoperativeHandoffAssessment,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const persistentVfDemonstration = usePersistentVfArrestDemonstration({
    active: demonstrating && persistentVfDemoSupported,
    running: session.transport === 'running',
    patient: session.equipment?.resuscitation,
    pause: session.pause, play: session.play, act: session.act, onFinished: () => onTakeControls?.(),
  });
  const registryDemonstration = useObservedDemonstration({
    active: demonstrating && !!registryDemo,
    running: session.transport === 'running',
    step: registryDemo?.step(session.equipment?.resuscitation) ?? IDLE_STEP,
    actionType: registryDemo?.actionType ?? '',
    pause: session.pause, play: session.play, act: session.act,
    onFinished: () => onTakeControls?.(),
  });
  const demonstration = registryDemo ? registryDemonstration
    : criticalCareStatusEpilepticusDemoSupported ? criticalCareStatusEpilepticusDemonstration
    : peaArrestDemoSupported ? peaArrestDemonstration
    : persistentVfDemoSupported ? persistentVfDemonstration
    : rapidDesaturationDemoSupported ? rapidDesaturationDemonstration
    : hypotensionAfterInductionDemoSupported ? hypotensionAfterInductionDemonstration
    : rapidSequenceInductionDemoSupported ? rapidSequenceInductionDemonstration
    : awarenessUnderParalysisDemoSupported ? awarenessUnderParalysisDemonstration
    : laryngospasmDemoSupported ? laryngospasmDemonstration
    : bronchospasmDemoSupported ? bronchospasmDemonstration
    : unexpectedHemorrhageDemoSupported ? unexpectedHemorrhageDemonstration
    : dilutionalCoagulopathyDemoSupported ? dilutionalCoagulopathyDemonstration
    : obstetricGeneralAnesthesiaDemoSupported ? obstetricGeneralAnesthesiaDemonstration
    : geriatricInductionDemoSupported ? geriatricInductionDemonstration
    : postoperativeHandoffDemoSupported ? postoperativeHandoffDemonstration
    : ciedPlanningDemoSupported ? ciedPlanningDemonstration
    : preeclampsiaDemoSupported ? preeclampsiaDemonstration
    : opioidVentilatoryDemoSupported ? opioidVentilatoryDemonstration
    : pneumothoraxDemoSupported ? pneumothoraxDemonstration
    : repeatedLaryngoscopyDemoSupported ? repeatedLaryngoscopyDemonstration
    : supraglotticRescueDemoSupported ? supraglotticRescueDemonstration
    : highSpinalDemoSupported ? highSpinalDemonstration
    : venousAirDemoSupported ? venousAirDemonstration
    : postExtubationDemoSupported ? postExtubationDemonstration
    : circleRebreathingDemoSupported ? circleRebreathingDemonstration
    : capnographyLineDemoSupported ? capnographyLineDemonstration
    : bloodBankDemoSupported ? bloodBankDemonstration
    : arterialTransducerDemoSupported ? arterialTransducerDemonstration
    : hypothermiaDemoSupported ? hypothermiaDemonstration
    : hyperglycemiaDemoSupported ? hyperglycemiaDemonstration
    : inhalationalMaintenanceDemoSupported ? inhalationalMaintenanceDemonstration
    : vfCardiacArrestDemoSupported ? vfCardiacArrestDemonstration
    : pediatricIvDemoSupported ? pediatricIvDemonstration
    : pediatricGasDemoSupported ? pediatricGasDemonstration
    : lastDemoSupported ? lastDemonstration
    : malignantHyperthermiaDemoSupported ? malignantHyperthermiaDemonstration
    : anaphylaxisDemoSupported ? anaphylaxisDemonstration
    : quantitativeReversalDemoSupported ? quantitativeReversalDemonstration
    : emergenceResidualBlockadeDemoSupported ? emergenceResidualBlockadeDemonstration
    : aspirationRiskDemoSupported ? aspirationRiskDemonstration
    : delayedEmergenceDemoSupported ? delayedEmergenceDemonstration
    : extubationReadinessDemoSupported ? extubationReadinessDemonstration
    : emergencySvtDemoSupported ? emergencySvtDemonstration
    : obstructivePleuralShockDemoSupported ? obstructivePleuralShockDemonstration : inductionDemonstration;
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
      equipment?.resuscitation.myxedema || equipment?.resuscitation.hypercalcemia || equipment?.resuscitation.hypocalcemia || equipment?.resuscitation.hyponatremiaCorrection || equipment?.resuscitation.avpDeficiency || equipment?.resuscitation.refeeding || equipment?.resuscitation.perioperativeDiabetes || equipment?.resuscitation.renalHyperkalemia || equipment?.resuscitation.renalHypokalemia || equipment?.resuscitation.renalHyponatremia || equipment?.resuscitation.renalHypernatremia || equipment?.resuscitation.renalHypocalcemia || equipment?.resuscitation.renalHypermagnesemia || equipment?.resuscitation.meningococcalSepsis || equipment?.resuscitation.obstructedKidney || equipment?.resuscitation.febrileNeutropenia || equipment?.resuscitation.necrotizingInfection || equipment?.resuscitation.endocarditisHeartFailure || equipment?.resuscitation.severePneumonia || equipment?.resuscitation.toxicShock || equipment?.resuscitation.possibleSepsis || equipment?.resuscitation.septicShockLabel || equipment?.resuscitation.meningitisImaging || equipment?.resuscitation.lowScore || equipment?.resuscitation.countedRate || equipment?.resuscitation.pairedReading || equipment?.resuscitation.afferentLimb || equipment?.resuscitation.quietPatient || equipment?.resuscitation.proxyScale || equipment?.resuscitation.lastKnownWell || equipment?.resuscitation.oxygenTargetScale || equipment?.resuscitation.lostContingency || equipment?.resuscitation.delayedImmuneEvent || equipment?.resuscitation.incidentalClot || equipment?.resuscitation.normalTestToxicity || equipment?.resuscitation.prognosisQuestion || equipment?.resuscitation.laboratoryTls || equipment?.resuscitation.rareEarlyMyocarditis || equipment?.resuscitation.loweringTheCount || equipment?.resuscitation.inheritedUrgency || equipment?.resuscitation.trialRule || equipment?.resuscitation.silentInteraction || equipment?.resuscitation.easyLabel || equipment?.resuscitation.negativeScan || equipment?.resuscitation.risingRequirement || equipment?.resuscitation.unfinishedSurvey || equipment?.resuscitation.transientResponse || equipment?.resuscitation.quietChest || equipment?.resuscitation.unownedDelay || equipment?.resuscitation.thirdAttendance || equipment?.resuscitation.deferredStep || equipment?.resuscitation.knownLabel || equipment?.resuscitation.unspokenDoubt ? invalidParameters : undefined);
    previousState.current = session.state;
    if (announcements.length === 0) return;
    const critical = announcements.filter((entry) => entry.severity === 'critical');
    if (critical.length > 0) setCriticalAnnouncement(critical.map((entry) => entry.text).join('. '));
    else setAnnouncement(announcements.map((entry) => entry.text).join('. '));
  }, [session.state, session.alarms, equipment?.resuscitation.myxedema, equipment?.resuscitation.hypercalcemia, equipment?.resuscitation.hypocalcemia, equipment?.resuscitation.hyponatremiaCorrection, equipment?.resuscitation.avpDeficiency, equipment?.resuscitation.refeeding, equipment?.resuscitation.perioperativeDiabetes, equipment?.resuscitation.renalHyperkalemia, equipment?.resuscitation.renalHypokalemia, equipment?.resuscitation.renalHyponatremia, equipment?.resuscitation.renalHypernatremia, equipment?.resuscitation.renalHypocalcemia, equipment?.resuscitation.renalHypermagnesemia, equipment?.resuscitation.meningococcalSepsis, equipment?.resuscitation.obstructedKidney, equipment?.resuscitation.febrileNeutropenia, equipment?.resuscitation.necrotizingInfection, equipment?.resuscitation.endocarditisHeartFailure, equipment?.resuscitation.severePneumonia, equipment?.resuscitation.toxicShock, equipment?.resuscitation.possibleSepsis, equipment?.resuscitation.septicShockLabel, equipment?.resuscitation.meningitisImaging, equipment?.resuscitation.lowScore, equipment?.resuscitation.countedRate, equipment?.resuscitation.pairedReading, equipment?.resuscitation.afferentLimb, equipment?.resuscitation.quietPatient, equipment?.resuscitation.proxyScale, equipment?.resuscitation.lastKnownWell, equipment?.resuscitation.oxygenTargetScale, equipment?.resuscitation.lostContingency, equipment?.resuscitation.delayedImmuneEvent, equipment?.resuscitation.incidentalClot, equipment?.resuscitation.normalTestToxicity, equipment?.resuscitation.prognosisQuestion, equipment?.resuscitation.laboratoryTls, equipment?.resuscitation.rareEarlyMyocarditis, equipment?.resuscitation.loweringTheCount, equipment?.resuscitation.inheritedUrgency, equipment?.resuscitation.trialRule, equipment?.resuscitation.silentInteraction, equipment?.resuscitation.easyLabel, equipment?.resuscitation.negativeScan, equipment?.resuscitation.risingRequirement, equipment?.resuscitation.unfinishedSurvey, equipment?.resuscitation.transientResponse, equipment?.resuscitation.quietChest, equipment?.resuscitation.unownedDelay, equipment?.resuscitation.thirdAttendance, equipment?.resuscitation.deferredStep, equipment?.resuscitation.knownLabel, equipment?.resuscitation.unspokenDoubt, invalidParameters]);

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
      negativeScan: equipment?.resuscitation.negativeScan,
      risingRequirement: equipment?.resuscitation.risingRequirement,
      unfinishedSurvey: equipment?.resuscitation.unfinishedSurvey,
      transientResponse: equipment?.resuscitation.transientResponse,
      quietChest: equipment?.resuscitation.quietChest,
      unownedDelay: equipment?.resuscitation.unownedDelay,
      thirdAttendance: equipment?.resuscitation.thirdAttendance,
      deferredStep: equipment?.resuscitation.deferredStep,
      knownLabel: equipment?.resuscitation.knownLabel,
      unspokenDoubt: equipment?.resuscitation.unspokenDoubt,
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
    hasBronchospasmResponse, capnographyLine, hasArterialLine, equipment?.resuscitation.myxedema, equipment?.resuscitation.hypercalcemia, equipment?.resuscitation.hypocalcemia, equipment?.resuscitation.hyponatremiaCorrection, equipment?.resuscitation.avpDeficiency, equipment?.resuscitation.refeeding, equipment?.resuscitation.perioperativeDiabetes, equipment?.resuscitation.renalHyperkalemia, equipment?.resuscitation.renalHypokalemia, equipment?.resuscitation.renalHyponatremia, equipment?.resuscitation.renalHypernatremia, equipment?.resuscitation.renalHypocalcemia, equipment?.resuscitation.renalHypermagnesemia, equipment?.resuscitation.meningococcalSepsis, equipment?.resuscitation.obstructedKidney, equipment?.resuscitation.febrileNeutropenia, equipment?.resuscitation.necrotizingInfection, equipment?.resuscitation.endocarditisHeartFailure, equipment?.resuscitation.severePneumonia, equipment?.resuscitation.toxicShock, equipment?.resuscitation.possibleSepsis, equipment?.resuscitation.septicShockLabel, equipment?.resuscitation.meningitisImaging, equipment?.resuscitation.lowScore, equipment?.resuscitation.countedRate, equipment?.resuscitation.pairedReading, equipment?.resuscitation.afferentLimb, equipment?.resuscitation.quietPatient, equipment?.resuscitation.proxyScale, equipment?.resuscitation.lastKnownWell, equipment?.resuscitation.oxygenTargetScale, equipment?.resuscitation.lostContingency, equipment?.resuscitation.delayedImmuneEvent, equipment?.resuscitation.incidentalClot, equipment?.resuscitation.normalTestToxicity, equipment?.resuscitation.prognosisQuestion, equipment?.resuscitation.laboratoryTls, equipment?.resuscitation.rareEarlyMyocarditis, equipment?.resuscitation.loweringTheCount, equipment?.resuscitation.inheritedUrgency, equipment?.resuscitation.trialRule, equipment?.resuscitation.silentInteraction, equipment?.resuscitation.easyLabel, equipment?.resuscitation.negativeScan, equipment?.resuscitation.risingRequirement, equipment?.resuscitation.unfinishedSurvey, equipment?.resuscitation.transientResponse, equipment?.resuscitation.quietChest, equipment?.resuscitation.unownedDelay, equipment?.resuscitation.thirdAttendance, equipment?.resuscitation.deferredStep, equipment?.resuscitation.knownLabel, equipment?.resuscitation.unspokenDoubt,
    arterialLine.cuff.meanArterialMmHg, hasCircuitScenario, breathingCircuit,
  ]);

  const readWaveforms = useCallback(() => {
    speak(waveformDescriptions({
      rhythm,
      bronchospasmSeverity: airway.bronchospasmSeverity,
      airwayPatencyFraction: airway.patencyFraction,
      perfusionIndex: session.state?.perfusionIndex ?? 0.8,
      artifacts: waveformArtifacts,
      capnographyUnavailable: !!equipment?.resuscitation.myxedema || !!equipment?.resuscitation.hypercalcemia || !!equipment?.resuscitation.hypocalcemia || !!equipment?.resuscitation.hyponatremiaCorrection || !!equipment?.resuscitation.avpDeficiency || !!equipment?.resuscitation.refeeding || !!equipment?.resuscitation.perioperativeDiabetes || !!equipment?.resuscitation.renalHyperkalemia || !!equipment?.resuscitation.renalHypokalemia || !!equipment?.resuscitation.renalHyponatremia || !!equipment?.resuscitation.renalHypernatremia || !!equipment?.resuscitation.renalHypocalcemia || !!equipment?.resuscitation.renalHypermagnesemia || !!equipment?.resuscitation.meningococcalSepsis || !!equipment?.resuscitation.obstructedKidney || !!equipment?.resuscitation.febrileNeutropenia || !!equipment?.resuscitation.necrotizingInfection || !!equipment?.resuscitation.endocarditisHeartFailure || !!equipment?.resuscitation.severePneumonia || !!equipment?.resuscitation.toxicShock || !!equipment?.resuscitation.possibleSepsis || !!equipment?.resuscitation.septicShockLabel || !!equipment?.resuscitation.meningitisImaging || !!equipment?.resuscitation.lowScore || !!equipment?.resuscitation.countedRate || !!equipment?.resuscitation.pairedReading || !!equipment?.resuscitation.afferentLimb || !!equipment?.resuscitation.quietPatient || !!equipment?.resuscitation.proxyScale || !!equipment?.resuscitation.lastKnownWell || !!equipment?.resuscitation.oxygenTargetScale || !!equipment?.resuscitation.lostContingency || !!equipment?.resuscitation.delayedImmuneEvent || !!equipment?.resuscitation.incidentalClot || !!equipment?.resuscitation.normalTestToxicity || !!equipment?.resuscitation.prognosisQuestion || !!equipment?.resuscitation.laboratoryTls || !!equipment?.resuscitation.rareEarlyMyocarditis || !!equipment?.resuscitation.loweringTheCount || !!equipment?.resuscitation.inheritedUrgency || !!equipment?.resuscitation.trialRule || !!equipment?.resuscitation.silentInteraction || !!equipment?.resuscitation.easyLabel || !!equipment?.resuscitation.negativeScan || !!equipment?.resuscitation.risingRequirement || !!equipment?.resuscitation.unfinishedSurvey || !!equipment?.resuscitation.transientResponse || !!equipment?.resuscitation.quietChest || !!equipment?.resuscitation.unownedDelay || !!equipment?.resuscitation.thirdAttendance || !!equipment?.resuscitation.deferredStep || !!equipment?.resuscitation.knownLabel || !!equipment?.resuscitation.unspokenDoubt,
      capnographySampleObstructed: capnographyLine.obstructed,
      tracheostomyPatencyFraction: equipment?.tracheostomy?.patencyFraction,
      arterialDamped: arterialLine.dynamicResponse === 'overdamped',
      inspiredCo2MmHg: breathingCircuit.inspiredCo2MmHg,
      ventilating: (session.state?.respiratoryRateBpm ?? 0) > 0,
      mechanicalPulse: mechanicalPulseFromState(session.state),
    }).map((entry) => `${entry.label}: ${entry.description}`).join(' '));
  }, [session.state, speak, rhythm, waveformArtifacts, airway, capnographyLine.obstructed,
    arterialLine.dynamicResponse, breathingCircuit.inspiredCo2MmHg, ventilator.delivering,
    equipment?.tracheostomy?.patencyFraction, equipment?.resuscitation.myxedema, equipment?.resuscitation.hypercalcemia, equipment?.resuscitation.hypocalcemia, equipment?.resuscitation.hyponatremiaCorrection, equipment?.resuscitation.avpDeficiency, equipment?.resuscitation.refeeding, equipment?.resuscitation.perioperativeDiabetes, equipment?.resuscitation.renalHyperkalemia, equipment?.resuscitation.renalHypokalemia, equipment?.resuscitation.renalHyponatremia, equipment?.resuscitation.renalHypernatremia, equipment?.resuscitation.renalHypocalcemia, equipment?.resuscitation.renalHypermagnesemia, equipment?.resuscitation.meningococcalSepsis, equipment?.resuscitation.obstructedKidney, equipment?.resuscitation.febrileNeutropenia, equipment?.resuscitation.necrotizingInfection, equipment?.resuscitation.endocarditisHeartFailure, equipment?.resuscitation.severePneumonia, equipment?.resuscitation.toxicShock, equipment?.resuscitation.possibleSepsis, equipment?.resuscitation.septicShockLabel, equipment?.resuscitation.meningitisImaging, equipment?.resuscitation.lowScore, equipment?.resuscitation.countedRate, equipment?.resuscitation.pairedReading, equipment?.resuscitation.afferentLimb, equipment?.resuscitation.quietPatient, equipment?.resuscitation.proxyScale, equipment?.resuscitation.lastKnownWell, equipment?.resuscitation.oxygenTargetScale, equipment?.resuscitation.lostContingency, equipment?.resuscitation.delayedImmuneEvent, equipment?.resuscitation.incidentalClot, equipment?.resuscitation.normalTestToxicity, equipment?.resuscitation.prognosisQuestion, equipment?.resuscitation.laboratoryTls, equipment?.resuscitation.rareEarlyMyocarditis, equipment?.resuscitation.loweringTheCount, equipment?.resuscitation.inheritedUrgency, equipment?.resuscitation.trialRule, equipment?.resuscitation.silentInteraction, equipment?.resuscitation.easyLabel, equipment?.resuscitation.negativeScan, equipment?.resuscitation.risingRequirement, equipment?.resuscitation.unfinishedSurvey, equipment?.resuscitation.transientResponse, equipment?.resuscitation.quietChest, equipment?.resuscitation.unownedDelay, equipment?.resuscitation.thirdAttendance, equipment?.resuscitation.deferredStep, equipment?.resuscitation.knownLabel, equipment?.resuscitation.unspokenDoubt, equipment?.resuscitation.risingRequirement]);

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
            // Myxedema is checked first because it is now inside the registry, and
            // the registry is the first term of `observedStateDemoSupported`. It
            // used to sit after that guard and be reached because the guard did
            // not name it; keeping its own message needs the order swapped.
            : registryDemo?.id === 'Myxedema'
              ? { etco2MmHg: 'Exhaled carbon dioxide not supplied; request a bedside PaCO₂ assessment',
                  fio2: 'Oxygen setting is not modeled' }
            : observedStateDemoSupported
              ? { etco2MmHg: 'Exhaled carbon dioxide is not supplied in this lesson',
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
          lessonTrays={trays}
          guidance={session.guidance}
          demonstratingLessonId={demonstrating ? registryDemo?.id : undefined}
          onLessonTutorSource={session.pause}
          onLessonAction={(type, action) => session.act({ type, payload: { action } })}
          renalHyperkalemia={equipment?.resuscitation.renalHyperkalemia}
          renalHypokalemia={equipment?.resuscitation.renalHypokalemia}
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
          neonatologyNicuHandoffGuidance={session.guidance}
          neonatologyNicuHandoffDemonstrating={demonstrating && registryDemo?.id === 'NicuHandoff'}
          neonatologyThermoregulationGuidance={session.guidance}
          neonatologyThermoregulationDemonstrating={demonstrating && registryDemo?.id === 'Thermoregulation'}
          neonatologySepsisGuidance={session.guidance}
          neonatologySepsisDemonstrating={demonstrating && registryDemo?.id === 'NeonatalSepsis'}
          neonatologyHypoglycemiaGuidance={session.guidance}
          neonatologyHypoglycemiaDemonstrating={demonstrating && registryDemo?.id === 'NeonatalHypoglycemia'}
          neonatologyPretermRespiratoryGuidance={session.guidance}
          neonatologyPretermRespiratoryDemonstrating={demonstrating && registryDemo?.id === 'PretermRespiratoryDistress'}
          neonatologyMeconiumGuidance={session.guidance}
          neonatologyMeconiumDemonstrating={demonstrating && registryDemo?.id === 'MeconiumTransition'}
          neonatologyBradycardiaGuidance={session.guidance}
          neonatologyBradycardiaDemonstrating={demonstrating && registryDemo?.id === 'NeonatalBradycardia'}
          neonatologyIneffectiveVentilationGuidance={session.guidance}
          neonatologyIneffectiveVentilationDemonstrating={demonstrating && registryDemo?.id === 'IneffectiveVentilation'}
          neonatologyApneaGuidance={session.guidance}
          neonatologyApneaDemonstrating={demonstrating && registryDemo?.id === 'NeonatalApnea'}
          neonatologyTermTransitionGuidance={session.guidance}
          neonatologyTermTransitionDemonstrating={demonstrating && registryDemo?.id === 'TermTransition'}
          neonatologyTensionPneumothoraxGuidance={session.guidance}
          neonatologyTensionPneumothoraxDemonstrating={demonstrating && registryDemo?.id === 'TensionPneumothorax'}
          neurologyMyastheniaGuidance={session.guidance}
          neurologyMyastheniaDemonstrating={demonstrating && registryDemo?.id === 'Myasthenia'}
          neurologyDysreflexiaGuidance={session.guidance}
          neurologyDysreflexiaDemonstrating={demonstrating && registryDemo?.id === 'Dysreflexia'}
          obstetricsMaternalArrestGuidance={session.guidance}
          obstetricsMaternalArrestDemonstrating={demonstrating && registryDemo?.id === 'MaternalArrest'}
          obstetricsShoulderDystociaGuidance={session.guidance}
          obstetricsShoulderDystociaDemonstrating={demonstrating && registryDemo?.id === 'ShoulderDystocia'}
          obstetricsCordProlapseGuidance={session.guidance}
          obstetricsCordProlapseDemonstrating={demonstrating && registryDemo?.id === 'CordProlapse'}
          obstetricsUterineRuptureGuidance={session.guidance}
          obstetricsUterineRuptureDemonstrating={demonstrating && registryDemo?.id === 'UterineRupture'}
          obstetricsMagnesiumToxicityGuidance={session.guidance}
          obstetricsMagnesiumToxicityDemonstrating={demonstrating && registryDemo?.id === 'MagnesiumToxicity'}
          obstetricsHighNeuraxialGuidance={session.guidance}
          obstetricsHighNeuraxialDemonstrating={demonstrating && registryDemo?.id === 'HighNeuraxial'}
          obstetricsFailedIntubationGuidance={session.guidance}
          obstetricsFailedIntubationDemonstrating={demonstrating && registryDemo?.id === 'FailedIntubation'}
          obstetricsMaternalNeonatalHandoffGuidance={session.guidance}
          obstetricsMaternalNeonatalHandoffDemonstrating={demonstrating && registryDemo?.id === 'MaternalNeonatalHandoff'}
          obstetricsOxytocinTachysystoleGuidance={session.guidance}
          obstetricsOxytocinTachysystoleDemonstrating={demonstrating && registryDemo?.id === 'OxytocinTachysystole'}
          hemorrhagicShockGuidance={session.guidance}
          hemorrhagicShockDemonstrating={demonstrating && registryDemo?.id === 'HemorrhagicShock'}
          undifferentiatedShockGuidance={session.guidance}
          undifferentiatedShockDemonstrating={demonstrating && registryDemo?.id === 'UndifferentiatedShock'}
          peaArrestGuidance={session.guidance}
          peaArrestDemonstrating={demonstrating && peaArrestDemoSupported}
          persistentVfGuidance={session.guidance}
          persistentVfDemonstrating={demonstrating && persistentVfDemoSupported}
          cardiacTamponadeGuidance={session.guidance}
          cardiacTamponadeDemonstrating={demonstrating && registryDemo?.id === 'CardiacTamponade'}
          exertionalHeatStrokeGuidance={session.guidance}
          exertionalHeatStrokeDemonstrating={demonstrating && registryDemo?.id === 'ExertionalHeatStroke'}
          hyperkalemiaEcgGuidance={session.guidance}
          hyperkalemiaEcgDemonstrating={demonstrating && registryDemo?.id === 'HyperkalemiaWithEcgChange'}
          severeHyponatremiaGuidance={session.guidance}
          severeHyponatremiaDemonstrating={demonstrating && registryDemo?.id === 'SevereHyponatremia'}
          emergencyStemiGuidance={session.guidance}
          emergencyStemiDemonstrating={demonstrating && registryDemo?.id === 'Stemi'}
          emergencySvtGuidance={session.guidance}
          emergencySvtDemonstrating={demonstrating && emergencySvtDemoSupported}
          obstructivePleuralShockGuidance={session.guidance}
          obstructivePleuralShockDemonstrating={demonstrating && obstructivePleuralShockDemoSupported}
          statusEpilepticusGuidance={session.guidance}
          statusEpilepticusDemonstrating={demonstrating && registryDemo?.id === 'StatusEpilepticus'}
          emergencySepticShockGuidance={session.guidance}
          emergencySepticShockDemonstrating={demonstrating && registryDemo?.id === 'SepticShock'}
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
          negativeScan={equipment?.resuscitation.negativeScan}
          risingRequirement={equipment?.resuscitation.risingRequirement}
          endocrineDkaResolutionGuidance={session.guidance}
          endocrineDkaResolutionDemonstrating={demonstrating && registryDemo?.id === 'DkaResolution'}
          endocrineHhsGuidance={session.guidance}
          endocrineHhsDemonstrating={demonstrating && registryDemo?.id === 'HhsOsmolality'}
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
          onStatusEpilepticusResponse={(action) => session.act({
            type: 'status-epilepticus-response', payload: { action },
          })}
          onHyponatremiaResponse={(action) => session.act({
            type: 'hyponatremia-response', payload: { action },
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
