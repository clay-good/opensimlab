/**
 * emergency-medicine's action trays, handed to the cockpit by the module's route.
 *
 * Each was written inline in `ActionCockpit.tsx` behind a gate computed from the scenario,
 * which meant every module downloaded every one of them. The gate moves here as the tray's
 * `supports` predicate, unchanged.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { EmergencyAnaphylaxisTray } from './EmergencyAnaphylaxisTray';
import { AdultAsthmaTray } from './AdultAsthmaTray';
import { CopdExacerbationTray } from './CopdExacerbationTray';
import { AcutePulmonaryEdemaTray } from './AcutePulmonaryEdemaTray';
import { PulmonaryEmbolismTray } from './PulmonaryEmbolismTray';
import { StemiTray } from './StemiTray';
import { UnstableNarrowTachycardiaTray } from './UnstableNarrowTachycardiaTray';
import { UnstableBradycardiaTray } from './UnstableBradycardiaTray';
import { AcuteIschemicStrokeTray } from './AcuteIschemicStrokeTray';
import { IntracranialHemorrhageTray } from './IntracranialHemorrhageTray';
import { DiabeticKetoacidosisTray } from './DiabeticKetoacidosisTray';
import { HyperkalemiaTray } from './HyperkalemiaTray';
import { OpioidToxicityTray } from './OpioidToxicityTray';
import { HeatStrokeTray } from './HeatStrokeTray';
import { TraumaPrimarySurveyTray } from './TraumaPrimarySurveyTray';
import { AcuteAorticSyndromeTray } from './AcuteAorticSyndromeTray';

export const EMERGENCY_MEDICINE_TRAYS: readonly LessonTray[] = [
  {
    id: 'EmergencyAnaphylaxis',
    actionType: 'emergency-anaphylaxis-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'emergency-anaphylaxis',
    ),
    assessment: (r) => r?.emergencyAnaphylaxisAssessment,
    Component: EmergencyAnaphylaxisTray as LessonTray['Component'],
  },
  {
    id: 'AdultAsthma',
    actionType: 'adult-asthma-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'adult-asthma',
    ),
    assessment: (r) => r?.adultAsthmaAssessment,
    Component: AdultAsthmaTray as LessonTray['Component'],
  },
  {
    id: 'CopdExacerbation',
    actionType: 'copd-exacerbation-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'copd-exacerbation',
    ),
    assessment: (r) => r?.copdExacerbationAssessment,
    Component: CopdExacerbationTray as LessonTray['Component'],
  },
  {
    id: 'AcutePulmonaryEdema',
    actionType: 'acute-pulmonary-edema-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'acute-pulmonary-edema',
    ),
    assessment: (r) => r?.acutePulmonaryEdemaAssessment,
    Component: AcutePulmonaryEdemaTray as LessonTray['Component'],
  },
  {
    id: 'PulmonaryEmbolism',
    actionType: 'pulmonary-embolism-deterioration-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'pulmonary-embolism-deterioration',
    ),
    assessment: (r) => r?.pulmonaryEmbolismAssessment,
    Component: PulmonaryEmbolismTray as LessonTray['Component'],
  },
  {
    id: 'Stemi',
    actionType: 'stemi-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'stemi',
    ),
    assessment: (r) => r?.stemiAssessment,
    Component: StemiTray as LessonTray['Component'],
  },
  {
    id: 'UnstableNarrowTachycardia',
    actionType: 'unstable-narrow-tachycardia-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'unstable-narrow-complex-tachycardia',
    ),
    assessment: (r) => r?.unstableNarrowTachycardiaAssessment,
    Component: UnstableNarrowTachycardiaTray as LessonTray['Component'],
  },
  {
    id: 'UnstableBradycardia',
    actionType: 'unstable-bradycardia-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'unstable-bradycardia',
    ),
    assessment: (r) => r?.unstableBradycardiaAssessment,
    Component: UnstableBradycardiaTray as LessonTray['Component'],
  },
  {
    id: 'AcuteIschemicStroke',
    actionType: 'acute-ischemic-stroke-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'acute-ischemic-stroke',
    ),
    assessment: (r) => r?.acuteIschemicStrokeAssessment,
    Component: AcuteIschemicStrokeTray as LessonTray['Component'],
  },
  {
    id: 'IntracranialHemorrhage',
    actionType: 'intracranial-hemorrhage-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'intracranial-hemorrhage-deterioration',
    ),
    assessment: (r) => r?.intracranialHemorrhageAssessment,
    Component: IntracranialHemorrhageTray as LessonTray['Component'],
  },
  {
    id: 'DiabeticKetoacidosis',
    actionType: 'diabetic-ketoacidosis-response',
    supports: (scenario) => scenario.metadata.id === 'diabetic-ketoacidosis'
    && scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'diabetic-ketoacidosis',
    ),
    assessment: (r) => r?.diabeticKetoacidosisAssessment,
    Component: DiabeticKetoacidosisTray as LessonTray['Component'],
  },
  {
    id: 'Hyperkalemia',
    actionType: 'hyperkalemia-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'hyperkalemia-with-ecg-change',
    ),
    assessment: (r) => r?.hyperkalemiaAssessment,
    Component: HyperkalemiaTray as LessonTray['Component'],
  },
  {
    id: 'OpioidToxicity',
    actionType: 'opioid-toxicity-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'opioid-toxicity',
    ),
    assessment: (r) => r?.opioidToxicityAssessment,
    Component: OpioidToxicityTray as LessonTray['Component'],
  },
  {
    id: 'HeatStroke',
    actionType: 'heat-stroke-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'exertional-heat-stroke',
    ),
    assessment: (r) => r?.heatStrokeAssessment,
    Component: HeatStrokeTray as LessonTray['Component'],
  },
  {
    id: 'TraumaPrimarySurvey',
    actionType: 'trauma-primary-survey-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'trauma-primary-survey',
    ),
    assessment: (r) => r?.traumaPrimarySurveyAssessment,
    Component: TraumaPrimarySurveyTray as LessonTray['Component'],
  },
  {
    id: 'AcuteAorticSyndrome',
    actionType: 'acute-aortic-syndrome-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'acute-aortic-syndrome',
    ),
    assessment: (r) => r?.acuteAorticSyndromeAssessment,
    Component: AcuteAorticSyndromeTray as LessonTray['Component'],
  },
];
