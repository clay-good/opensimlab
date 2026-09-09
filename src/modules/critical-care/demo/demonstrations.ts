/**
 * critical-care's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/critical-care.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { akiFluidOverloadDemonstrationStep, supportsAkiFluidOverloadDemonstration } from './aki-fluid-overload-demonstration';
import { ardsLungProtectiveDemonstrationStep, supportsArdsLungProtectiveDemonstration } from './ards-lung-protective-demonstration';
import { autoPeepDemonstrationStep, supportsAutoPeepDemonstration } from './auto-peep-demonstration';
import { cardiogenicShockDemonstrationStep, supportsCardiogenicShockDemonstration } from './cardiogenic-shock-demonstration';
import { circuitDisconnectionDemonstrationStep, supportsCircuitDisconnectionDemonstration } from './circuit-disconnection-demonstration';
import { delayedVasopressorDeliveryDemonstrationStep, supportsDelayedVasopressorDeliveryDemonstration } from './delayed-vasopressor-delivery-demonstration';
import { dyssynchronyDemonstrationStep, supportsDyssynchronyDemonstration } from './dyssynchrony-demonstration';
import { escalatingHypoxemiaDemonstrationStep, supportsEscalatingHypoxemiaDemonstration } from './escalating-hypoxemia-demonstration';
import { icuHandoffDemonstrationStep, supportsIcuHandoffDemonstration } from './icu-handoff-demonstration';
import { intracranialHypertensionDemonstrationStep, supportsIntracranialHypertensionDemonstration } from './intracranial-hypertension-demonstration';
import { massivePeDemonstrationStep, supportsMassivePeDemonstration } from './massive-pe-demonstration';
import { mixedShockDemonstrationStep, supportsMixedShockDemonstration } from './mixed-shock-demonstration';
import { mucusPluggingDemonstrationStep, supportsMucusPluggingDemonstration } from './mucus-plugging-demonstration';
import { postIntubationHypotensionDemonstrationStep, supportsPostIntubationHypotensionDemonstration } from './post-intubation-hypotension-demonstration';
import { pulseOximeterArtifactDemonstrationStep, supportsPulseOximeterArtifactDemonstration } from './pulse-oximeter-artifact-demonstration';
import { rvFailureDemonstrationStep, supportsRvFailureDemonstration } from './rv-failure-demonstration';
import { septicShockResuscitationDemonstrationStep, supportsSepticShockResuscitationDemonstration } from './septic-shock-resuscitation-demonstration';
import { severeAcidemiaDemonstrationStep, supportsSevereAcidemiaDemonstration } from './severe-acidemia-demonstration';
import { spontaneousBreathingTrialDemonstrationStep, supportsSpontaneousBreathingTrialDemonstration } from './spontaneous-breathing-trial-demonstration';
import { supportsTargetedTemperatureManagementDemonstration, targetedTemperatureManagementDemonstrationStep } from './targeted-temperature-management-demonstration';
import { supportsTubeMigrationDemonstration, tubeMigrationDemonstrationStep } from './tube-migration-demonstration';
import { supportsUnplannedExtubationDemonstration, unplannedExtubationDemonstrationStep } from './unplanned-extubation-demonstration';
import { supportsUpperGiHemorrhageDemonstration, upperGiHemorrhageDemonstrationStep } from './upper-gi-hemorrhage-demonstration';

export const CRITICAL_CARE_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'AkiFluidOverload', supports: supportsAkiFluidOverloadDemonstration, actionType: 'aki-fluid-overload-response', step: (r) => akiFluidOverloadDemonstrationStep(r?.akiFluidOverloadAssessment) },
  { id: 'ArdsLungProtective', supports: supportsArdsLungProtectiveDemonstration, actionType: 'ards-lung-protective-response', step: (r) => ardsLungProtectiveDemonstrationStep(r?.ardsLungProtectiveAssessment) },
  { id: 'AutoPeep', supports: supportsAutoPeepDemonstration, actionType: 'auto-peep-response', step: (r) => autoPeepDemonstrationStep(r?.autoPeepAssessment) },
  { id: 'CardiogenicShock', supports: supportsCardiogenicShockDemonstration, actionType: 'cardiogenic-shock-response', step: (r) => cardiogenicShockDemonstrationStep(r?.cardiogenicShockAssessment) },
  { id: 'CircuitDisconnection', supports: supportsCircuitDisconnectionDemonstration, actionType: 'ventilator-circuit-disconnection-response', step: (r) => circuitDisconnectionDemonstrationStep(r?.ventilatorCircuitDisconnectionAssessment) },
  { id: 'DelayedVasopressorDelivery', supports: supportsDelayedVasopressorDeliveryDemonstration, actionType: 'delayed-vasopressor-delivery-response', step: (r) => delayedVasopressorDeliveryDemonstrationStep(r?.delayedVasopressorDeliveryAssessment) },
  { id: 'Dyssynchrony', supports: supportsDyssynchronyDemonstration, actionType: 'ventilator-dyssynchrony-response', step: (r) => dyssynchronyDemonstrationStep(r?.ventilatorDyssynchronyAssessment) },
  { id: 'EscalatingHypoxemia', supports: supportsEscalatingHypoxemiaDemonstration, actionType: 'escalating-hypoxemia-response', step: (r) => escalatingHypoxemiaDemonstrationStep(r?.escalatingHypoxemiaAssessment) },
  { id: 'IcuHandoff', supports: supportsIcuHandoffDemonstration, actionType: 'icu-hidden-deterioration-handoff-response', step: (r) => icuHandoffDemonstrationStep(r?.icuHiddenDeteriorationHandoffAssessment) },
  { id: 'IntracranialHypertension', supports: supportsIntracranialHypertensionDemonstration, actionType: 'intracranial-hypertension-response', step: (r) => intracranialHypertensionDemonstrationStep(r?.intracranialHypertensionAssessment) },
  { id: 'MassivePe', supports: supportsMassivePeDemonstration, actionType: 'massive-pulmonary-embolism-response', step: (r) => massivePeDemonstrationStep(r?.massivePulmonaryEmbolismAssessment) },
  { id: 'MixedShock', supports: supportsMixedShockDemonstration, actionType: 'mixed-shock-response', step: (r) => mixedShockDemonstrationStep(r?.mixedShockAssessment) },
  { id: 'MucusPlugging', supports: supportsMucusPluggingDemonstration, actionType: 'mucus-plugging-response', step: (r) => mucusPluggingDemonstrationStep(r?.mucusPluggingAssessment) },
  { id: 'PostIntubationHypotension', supports: supportsPostIntubationHypotensionDemonstration, actionType: 'post-intubation-hypotension-response', step: (r) => postIntubationHypotensionDemonstrationStep(r?.postIntubationHypotensionAssessment) },
  { id: 'PulseOximeterArtifact', supports: supportsPulseOximeterArtifactDemonstration, actionType: 'pulse-oximeter-artifact-response', step: (r) => pulseOximeterArtifactDemonstrationStep(r?.pulseOximeterArtifactAssessment) },
  { id: 'RvFailure', supports: supportsRvFailureDemonstration, actionType: 'right-ventricular-failure-response', step: (r) => rvFailureDemonstrationStep(r?.rightVentricularFailureAssessment) },
  { id: 'SepticShockResuscitation', supports: supportsSepticShockResuscitationDemonstration, actionType: 'septic-shock-resuscitation-response', step: (r) => septicShockResuscitationDemonstrationStep(r?.septicShockResuscitationAssessment) },
  { id: 'SevereAcidemia', supports: supportsSevereAcidemiaDemonstration, actionType: 'severe-acidemia-response', step: (r) => severeAcidemiaDemonstrationStep(r?.severeAcidemiaAssessment) },
  { id: 'SpontaneousBreathingTrial', supports: supportsSpontaneousBreathingTrialDemonstration, actionType: 'spontaneous-breathing-trial-response', step: (r) => spontaneousBreathingTrialDemonstrationStep(r?.spontaneousBreathingTrialAssessment) },
  { id: 'TargetedTemperatureManagement', supports: supportsTargetedTemperatureManagementDemonstration, actionType: 'targeted-temperature-management-response', step: (r) => targetedTemperatureManagementDemonstrationStep(r?.postArrestTemperatureAssessment) },
  { id: 'TubeMigration', supports: supportsTubeMigrationDemonstration, actionType: 'endotracheal-tube-migration-response', step: (r) => tubeMigrationDemonstrationStep(r?.endotrachealTubeMigrationAssessment) },
  { id: 'UnplannedExtubation', supports: supportsUnplannedExtubationDemonstration, actionType: 'unplanned-extubation-response', step: (r) => unplannedExtubationDemonstrationStep(r?.unplannedExtubationAssessment) },
  { id: 'UpperGiHemorrhage', supports: supportsUpperGiHemorrhageDemonstration, actionType: 'upper-gi-hemorrhage-response', step: (r) => upperGiHemorrhageDemonstrationStep(r?.upperGiHemorrhageAssessment) },
];
