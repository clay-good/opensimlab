/**
 * cardiology's action trays, handed to the cockpit by the module's route.
 *
 * Each was written inline in `ActionCockpit.tsx` behind a gate computed from the scenario,
 * which meant every module downloaded every one of them. The gate moves here as the tray's
 * `supports` predicate, unchanged.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { StableChestPainTray } from './StableChestPainTray';
import { NstemiRiskTray } from './NstemiRiskTray';
import { ClinicStemiTray } from './ClinicStemiTray';
import { HeartFailureTray } from './HeartFailureTray';
import { AfRvrTray } from './AfRvrTray';
import { PostInfarctionShockTray } from './PostInfarctionShockTray';
import { StableNarrowTachycardiaTray } from './StableNarrowTachycardiaTray';
import { StableWideTachycardiaTray } from './StableWideTachycardiaTray';
import { SymptomaticBradycardiaTray } from './SymptomaticBradycardiaTray';
import { CompleteHeartBlockTray } from './CompleteHeartBlockTray';
import { TorsadesTray } from './TorsadesTray';
import { HyperkalemicConductionTray } from './HyperkalemicConductionTray';
import { PericardialTamponadeTray } from './PericardialTamponadeTray';
import { RightVentricularInfarctionTray } from './RightVentricularInfarctionTray';
import { HypertensiveEmergencyTray } from './HypertensiveEmergencyTray';
import { PacemakerCaptureFailureTray } from './PacemakerCaptureFailureTray';
import { TranscutaneousPacingCaptureTray } from './TranscutaneousPacingCaptureTray';

export const CARDIOLOGY_TRAYS: readonly LessonTray[] = [
  {
    id: 'StableChestPain',
    actionType: 'stable-chest-pain-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'stable-chest-pain-evaluation',
    ),
    assessment: (r) => r?.stableChestPainAssessment,
    Component: StableChestPainTray as LessonTray['Component'],
  },
  {
    id: 'NstemiRisk',
    actionType: 'nstemi-risk-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'nstemi-risk-reassessment',
    ),
    assessment: (r) => r?.nstemiRiskAssessment,
    Component: NstemiRiskTray as LessonTray['Component'],
  },
  {
    id: 'ClinicStemi',
    actionType: 'clinic-stemi-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'stemi-recognition-and-first-actions',
    ),
    assessment: (r) => r?.clinicStemiAssessment,
    Component: ClinicStemiTray as LessonTray['Component'],
  },
  {
    id: 'HeartFailure',
    actionType: 'heart-failure-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'acute-decompensated-heart-failure',
    ),
    assessment: (r) => r?.heartFailureAssessment,
    Component: HeartFailureTray as LessonTray['Component'],
  },
  {
    id: 'AfRvr',
    actionType: 'af-rvr-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'atrial-fibrillation-with-rapid-response',
    ),
    assessment: (r) => r?.afRvrAssessment,
    Component: AfRvrTray as LessonTray['Component'],
  },
  {
    id: 'PostInfarctionShock',
    actionType: 'post-infarction-shock-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'post-infarction-cardiogenic-shock-escalation',
    ),
    assessment: (r) => r?.postInfarctionShockAssessment,
    Component: PostInfarctionShockTray as LessonTray['Component'],
  },
  {
    id: 'StableNarrowTachycardia',
    actionType: 'stable-narrow-tachycardia-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'regular-narrow-complex-tachycardia',
    ),
    assessment: (r) => r?.stableNarrowTachycardiaAssessment,
    Component: StableNarrowTachycardiaTray as LessonTray['Component'],
  },
  {
    id: 'StableWideTachycardia',
    actionType: 'stable-wide-tachycardia-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'wide-complex-tachycardia',
    ),
    assessment: (r) => r?.stableWideTachycardiaAssessment,
    Component: StableWideTachycardiaTray as LessonTray['Component'],
  },
  {
    id: 'SymptomaticBradycardia',
    actionType: 'symptomatic-bradycardia-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'symptomatic-sinus-bradycardia-reassessment',
    ),
    assessment: (r) => r?.symptomaticBradycardiaAssessment,
    Component: SymptomaticBradycardiaTray as LessonTray['Component'],
  },
  {
    id: 'CompleteHeartBlock',
    actionType: 'complete-heart-block-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'complete-heart-block',
    ),
    assessment: (r) => r?.completeHeartBlockAssessment,
    Component: CompleteHeartBlockTray as LessonTray['Component'],
  },
  {
    id: 'Torsades',
    actionType: 'torsades-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'torsades-de-pointes',
    ),
    assessment: (r) => r?.torsadesAssessment,
    Component: TorsadesTray as LessonTray['Component'],
  },
  {
    id: 'HyperkalemicConduction',
    actionType: 'hyperkalemic-conduction-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'hyperkalemic-conduction-disturbance',
    ),
    assessment: (r) => r?.hyperkalemicConductionAssessment,
    Component: HyperkalemicConductionTray as LessonTray['Component'],
  },
  {
    id: 'PericardialTamponade',
    actionType: 'pericardial-tamponade-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'pericardial-tamponade-reassessment',
    ),
    assessment: (r) => r?.pericardialTamponadeAssessment,
    Component: PericardialTamponadeTray as LessonTray['Component'],
  },
  {
    id: 'RightVentricularInfarction',
    actionType: 'right-ventricular-infarction-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'right-ventricular-infarction',
    ),
    assessment: (r) => r?.rightVentricularInfarctionAssessment,
    Component: RightVentricularInfarctionTray as LessonTray['Component'],
  },
  {
    id: 'HypertensiveEmergency',
    actionType: 'hypertensive-emergency-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'hypertensive-emergency-reassessment',
    ),
    assessment: (r) => r?.hypertensiveEmergencyAssessment,
    Component: HypertensiveEmergencyTray as LessonTray['Component'],
  },
  {
    id: 'PacemakerCaptureFailure',
    actionType: 'pacemaker-capture-failure-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'pacemaker-capture-failure-reassessment',
    ),
    assessment: (r) => r?.pacemakerCaptureFailureAssessment,
    Component: PacemakerCaptureFailureTray as LessonTray['Component'],
  },
  {
    id: 'TranscutaneousPacingCapture',
    actionType: 'transcutaneous-pacing-capture-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'transcutaneous-pacing-mechanical-capture-reassessment',
    ),
    assessment: (r) => r?.transcutaneousPacingCaptureAssessment,
    Component: TranscutaneousPacingCaptureTray as LessonTray['Component'],
  },
];
