/**
 * critical-care's action trays, handed to the cockpit by the module's route.
 *
 * Each was written inline in `ActionCockpit.tsx` behind a gate computed from the scenario,
 * which meant every module downloaded every one of them. The gate moves here as the tray's
 * `supports` predicate, unchanged.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { ArdsLungProtectiveTray } from './ArdsLungProtectiveTray';
import { EscalatingHypoxemiaTray } from './EscalatingHypoxemiaTray';
import { VentilatorDyssynchronyTray } from './VentilatorDyssynchronyTray';
import { AutoPeepTray } from './AutoPeepTray';
import { MucusPluggingTray } from './MucusPluggingTray';
import { UnplannedExtubationTray } from './UnplannedExtubationTray';
import { SpontaneousBreathingTrialTray } from './SpontaneousBreathingTrialTray';
import { PostIntubationHypotensionTray } from './PostIntubationHypotensionTray';
import { CardiogenicShockTray } from './CardiogenicShockTray';
import { MixedShockTray } from './MixedShockTray';
import { RightVentricularFailureTray } from './RightVentricularFailureTray';
import { MassivePulmonaryEmbolismTray } from './MassivePulmonaryEmbolismTray';
import { UpperGiHemorrhageTray } from './UpperGiHemorrhageTray';
import { CriticalCareStatusEpilepticusTray } from './CriticalCareStatusEpilepticusTray';
import { PostArrestTemperatureTray } from './PostArrestTemperatureTray';
import { IntracranialHypertensionTray } from './IntracranialHypertensionTray';
import { AkiFluidOverloadTray } from './AkiFluidOverloadTray';
import { SevereAcidemiaTray } from './SevereAcidemiaTray';
import { IcuHiddenDeteriorationHandoffTray } from './IcuHiddenDeteriorationHandoffTray';
import { VentilatorCircuitDisconnectionTray } from './VentilatorCircuitDisconnectionTray';
import { DelayedVasopressorDeliveryTray } from './DelayedVasopressorDeliveryTray';
import { PulseOximeterArtifactTray } from './PulseOximeterArtifactTray';
import { EndotrachealTubeMigrationTray } from './EndotrachealTubeMigrationTray';
import { SepticShockResuscitationTray } from './SepticShockResuscitationTray';

export const CRITICAL_CARE_TRAYS: readonly LessonTray[] = [
  {
    id: 'ArdsLungProtective',
    actionType: 'ards-lung-protective-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'ards-lung-protective-ventilation',
    ),
    assessment: (r) => r?.ardsLungProtectiveAssessment,
    Component: ArdsLungProtectiveTray as LessonTray['Component'],
  },
  {
    id: 'EscalatingHypoxemia',
    actionType: 'escalating-hypoxemia-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'escalating-hypoxemia',
    ),
    assessment: (r) => r?.escalatingHypoxemiaAssessment,
    Component: EscalatingHypoxemiaTray as LessonTray['Component'],
  },
  {
    id: 'VentilatorDyssynchrony',
    demoId: 'Dyssynchrony',
    actionType: 'ventilator-dyssynchrony-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'ventilator-dyssynchrony',
    ),
    assessment: (r) => r?.ventilatorDyssynchronyAssessment,
    Component: VentilatorDyssynchronyTray as LessonTray['Component'],
  },
  {
    id: 'AutoPeep',
    actionType: 'auto-peep-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'auto-peep',
    ),
    assessment: (r) => r?.autoPeepAssessment,
    Component: AutoPeepTray as LessonTray['Component'],
  },
  {
    id: 'MucusPlugging',
    actionType: 'mucus-plugging-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'mucus-plugging',
    ),
    assessment: (r) => r?.mucusPluggingAssessment,
    Component: MucusPluggingTray as LessonTray['Component'],
  },
  {
    id: 'UnplannedExtubation',
    actionType: 'unplanned-extubation-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'unplanned-extubation',
    ),
    assessment: (r) => r?.unplannedExtubationAssessment,
    Component: UnplannedExtubationTray as LessonTray['Component'],
  },
  {
    id: 'SpontaneousBreathingTrial',
    actionType: 'spontaneous-breathing-trial-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'spontaneous-breathing-trial',
    ),
    assessment: (r) => r?.spontaneousBreathingTrialAssessment,
    Component: SpontaneousBreathingTrialTray as LessonTray['Component'],
  },
  {
    id: 'PostIntubationHypotension',
    actionType: 'post-intubation-hypotension-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'post-intubation-hypotension',
    ),
    assessment: (r) => r?.postIntubationHypotensionAssessment,
    Component: PostIntubationHypotensionTray as LessonTray['Component'],
  },
  {
    id: 'CardiogenicShock',
    actionType: 'cardiogenic-shock-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'cardiogenic-shock',
    ),
    assessment: (r) => r?.cardiogenicShockAssessment,
    Component: CardiogenicShockTray as LessonTray['Component'],
  },
  {
    id: 'MixedShock',
    actionType: 'mixed-shock-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'mixed-shock',
    ),
    assessment: (r) => r?.mixedShockAssessment,
    Component: MixedShockTray as LessonTray['Component'],
  },
  {
    id: 'RightVentricularFailure',
    demoId: 'RvFailure',
    actionType: 'right-ventricular-failure-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'right-ventricular-failure',
    ),
    assessment: (r) => r?.rightVentricularFailureAssessment,
    Component: RightVentricularFailureTray as LessonTray['Component'],
  },
  {
    id: 'MassivePulmonaryEmbolism',
    demoId: 'MassivePe',
    actionType: 'massive-pulmonary-embolism-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'massive-pulmonary-embolism',
    ),
    assessment: (r) => r?.massivePulmonaryEmbolismAssessment,
    Component: MassivePulmonaryEmbolismTray as LessonTray['Component'],
  },
  {
    id: 'UpperGiHemorrhage',
    actionType: 'upper-gi-hemorrhage-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'upper-gi-hemorrhage',
    ),
    assessment: (r) => r?.upperGiHemorrhageAssessment,
    Component: UpperGiHemorrhageTray as LessonTray['Component'],
  },
  {
    id: 'CriticalCareStatusEpilepticus',
    actionType: 'critical-care-status-epilepticus-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'critical-care-status-epilepticus',
    ),
    assessment: (r) => r?.criticalCareStatusEpilepticusAssessment,
    Component: CriticalCareStatusEpilepticusTray as LessonTray['Component'],
  },
  {
    id: 'PostArrestTemperature',
    demoId: 'TargetedTemperatureManagement',
    actionType: 'targeted-temperature-management-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'targeted-temperature-management',
    ),
    assessment: (r) => r?.postArrestTemperatureAssessment,
    Component: PostArrestTemperatureTray as LessonTray['Component'],
  },
  {
    id: 'IntracranialHypertension',
    actionType: 'intracranial-hypertension-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'intracranial-hypertension',
    ),
    assessment: (r) => r?.intracranialHypertensionAssessment,
    Component: IntracranialHypertensionTray as LessonTray['Component'],
  },
  {
    id: 'AkiFluidOverload',
    actionType: 'aki-fluid-overload-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'acute-kidney-injury-with-fluid-overload',
    ),
    assessment: (r) => r?.akiFluidOverloadAssessment,
    Component: AkiFluidOverloadTray as LessonTray['Component'],
  },
  {
    id: 'SevereAcidemia',
    actionType: 'severe-acidemia-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'severe-acidemia',
    ),
    assessment: (r) => r?.severeAcidemiaAssessment,
    Component: SevereAcidemiaTray as LessonTray['Component'],
  },
  {
    id: 'IcuHiddenDeteriorationHandoff',
    demoId: 'IcuHandoff',
    actionType: 'icu-hidden-deterioration-handoff-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'icu-handoff-with-hidden-deterioration',
    ),
    assessment: (r) => r?.icuHiddenDeteriorationHandoffAssessment,
    Component: IcuHiddenDeteriorationHandoffTray as LessonTray['Component'],
  },
  {
    id: 'VentilatorCircuitDisconnection',
    demoId: 'CircuitDisconnection',
    actionType: 'ventilator-circuit-disconnection-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'ventilator-circuit-disconnection',
    ),
    assessment: (r) => r?.ventilatorCircuitDisconnectionAssessment,
    Component: VentilatorCircuitDisconnectionTray as LessonTray['Component'],
  },
  {
    id: 'DelayedVasopressorDelivery',
    actionType: 'delayed-vasopressor-delivery-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'delayed-vasopressor-delivery',
    ),
    assessment: (r) => r?.delayedVasopressorDeliveryAssessment,
    Component: DelayedVasopressorDeliveryTray as LessonTray['Component'],
  },
  {
    id: 'PulseOximeterArtifact',
    actionType: 'pulse-oximeter-artifact-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'pulse-oximeter-motion-artifact',
    ),
    assessment: (r) => r?.pulseOximeterArtifactAssessment,
    Component: PulseOximeterArtifactTray as LessonTray['Component'],
  },
  {
    id: 'EndotrachealTubeMigration',
    demoId: 'TubeMigration',
    actionType: 'endotracheal-tube-migration-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'endotracheal-tube-migration-after-repositioning',
    ),
    assessment: (r) => r?.endotrachealTubeMigrationAssessment,
    Component: EndotrachealTubeMigrationTray as LessonTray['Component'],
  },
  {
    id: 'SepticShockResuscitation',
    actionType: 'septic-shock-resuscitation-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'septic-shock-resuscitation',
    ),
    assessment: (r) => r?.septicShockResuscitationAssessment,
    Component: SepticShockResuscitationTray as LessonTray['Component'],
  },
];
