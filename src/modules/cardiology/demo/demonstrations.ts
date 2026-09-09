/**
 * cardiology's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/cardiology.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { afRvrDemonstrationStep, supportsAfRvrDemonstration } from './af-rvr-demonstration';
import { clinicStemiDemonstrationStep, supportsClinicStemiDemonstration } from './clinic-stemi-demonstration';
import { completeHeartBlockDemonstrationStep, supportsCompleteHeartBlockDemonstration } from './complete-heart-block-demonstration';
import { heartFailureDemonstrationStep, supportsHeartFailureDemonstration } from './heart-failure-demonstration';
import { hyperkalemicConductionDemonstrationStep, supportsHyperkalemicConductionDemonstration } from './hyperkalemic-conduction-demonstration';
import { hypertensiveEmergencyDemonstrationStep, supportsHypertensiveEmergencyDemonstration } from './hypertensive-emergency-demonstration';
import { nstemiRiskDemonstrationStep, supportsNstemiRiskDemonstration } from './nstemi-risk-demonstration';
import { pacemakerCaptureFailureDemonstrationStep, supportsPacemakerCaptureFailureDemonstration } from './pacemaker-capture-failure-demonstration';
import { pericardialTamponadeDemonstrationStep, supportsPericardialTamponadeDemonstration } from './pericardial-tamponade-demonstration';
import { postInfarctionShockDemonstrationStep, supportsPostInfarctionShockDemonstration } from './post-infarction-shock-demonstration';
import { rightVentricularInfarctionDemonstrationStep, supportsRightVentricularInfarctionDemonstration } from './right-ventricular-infarction-demonstration';
import { stableChestPainDemonstrationStep, supportsStableChestPainDemonstration } from './stable-chest-pain-demonstration';
import { stableNarrowTachycardiaDemonstrationStep, supportsStableNarrowTachycardiaDemonstration } from './stable-narrow-tachycardia-demonstration';
import { stableWideTachycardiaDemonstrationStep, supportsStableWideTachycardiaDemonstration } from './stable-wide-tachycardia-demonstration';
import { supportsSymptomaticBradycardiaDemonstration, symptomaticBradycardiaDemonstrationStep } from './symptomatic-bradycardia-demonstration';
import { supportsTorsadesDemonstration, torsadesDemonstrationStep } from './torsades-demonstration';
import { supportsTranscutaneousPacingCaptureDemonstration, transcutaneousPacingCaptureDemonstrationStep } from './transcutaneous-pacing-capture-demonstration';

export const CARDIOLOGY_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'AfRvr', supports: supportsAfRvrDemonstration, actionType: 'af-rvr-response', step: (r) => afRvrDemonstrationStep(r?.afRvrAssessment) },
  { id: 'ClinicStemi', supports: supportsClinicStemiDemonstration, actionType: 'clinic-stemi-response', step: (r) => clinicStemiDemonstrationStep(r?.clinicStemiAssessment) },
  { id: 'CompleteHeartBlock', supports: supportsCompleteHeartBlockDemonstration, actionType: 'complete-heart-block-response', step: (r) => completeHeartBlockDemonstrationStep(r?.completeHeartBlockAssessment) },
  { id: 'HeartFailure', supports: supportsHeartFailureDemonstration, actionType: 'heart-failure-response', step: (r) => heartFailureDemonstrationStep(r?.heartFailureAssessment) },
  { id: 'HyperkalemicConduction', supports: supportsHyperkalemicConductionDemonstration, actionType: 'hyperkalemic-conduction-response', step: (r) => hyperkalemicConductionDemonstrationStep(r?.hyperkalemicConductionAssessment) },
  { id: 'HypertensiveEmergency', supports: supportsHypertensiveEmergencyDemonstration, actionType: 'hypertensive-emergency-response', step: (r) => hypertensiveEmergencyDemonstrationStep(r?.hypertensiveEmergencyAssessment) },
  { id: 'NstemiRisk', supports: supportsNstemiRiskDemonstration, actionType: 'nstemi-risk-response', step: (r) => nstemiRiskDemonstrationStep(r?.nstemiRiskAssessment) },
  { id: 'PacemakerCaptureFailure', supports: supportsPacemakerCaptureFailureDemonstration, actionType: 'pacemaker-capture-failure-response', step: (r) => pacemakerCaptureFailureDemonstrationStep(r?.pacemakerCaptureFailureAssessment) },
  { id: 'PericardialTamponade', supports: supportsPericardialTamponadeDemonstration, actionType: 'pericardial-tamponade-response', step: (r) => pericardialTamponadeDemonstrationStep(r?.pericardialTamponadeAssessment) },
  { id: 'PostInfarctionShock', supports: supportsPostInfarctionShockDemonstration, actionType: 'post-infarction-shock-response', step: (r) => postInfarctionShockDemonstrationStep(r?.postInfarctionShockAssessment) },
  { id: 'RightVentricularInfarction', supports: supportsRightVentricularInfarctionDemonstration, actionType: 'right-ventricular-infarction-response', step: (r) => rightVentricularInfarctionDemonstrationStep(r?.rightVentricularInfarctionAssessment) },
  { id: 'StableChestPain', supports: supportsStableChestPainDemonstration, actionType: 'stable-chest-pain-response', step: (r) => stableChestPainDemonstrationStep(r?.stableChestPainAssessment) },
  { id: 'StableNarrowTachycardia', supports: supportsStableNarrowTachycardiaDemonstration, actionType: 'stable-narrow-tachycardia-response', step: (r) => stableNarrowTachycardiaDemonstrationStep(r?.stableNarrowTachycardiaAssessment) },
  { id: 'StableWideTachycardia', supports: supportsStableWideTachycardiaDemonstration, actionType: 'stable-wide-tachycardia-response', step: (r) => stableWideTachycardiaDemonstrationStep(r?.stableWideTachycardiaAssessment) },
  { id: 'SymptomaticBradycardia', supports: supportsSymptomaticBradycardiaDemonstration, actionType: 'symptomatic-bradycardia-response', step: (r) => symptomaticBradycardiaDemonstrationStep(r?.symptomaticBradycardiaAssessment) },
  { id: 'Torsades', supports: supportsTorsadesDemonstration, actionType: 'torsades-response', step: (r) => torsadesDemonstrationStep(r?.torsadesAssessment) },
  { id: 'TranscutaneousPacingCapture', supports: supportsTranscutaneousPacingCaptureDemonstration, actionType: 'transcutaneous-pacing-capture-response', step: (r) => transcutaneousPacingCaptureDemonstrationStep(r?.transcutaneousPacingCaptureAssessment) },
];
