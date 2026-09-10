/**
 * respiratory-medicine's action trays, handed to the cockpit by the module's route.
 *
 * Each was written inline in `ActionCockpit.tsx` behind a gate computed from the scenario,
 * which meant every module downloaded every one of them. The gate moves here as the tray's
 * `supports` predicate, unchanged.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { AcuteSevereAsthmaTray } from './AcuteSevereAsthmaTray';
import { AcuteTracheostomyObstructionTray } from './AcuteTracheostomyObstructionTray';
import { ApeSupportTray } from './ApeSupportTray';
import { BronchiectasisMucusPluggingTray } from './BronchiectasisMucusPluggingTray';
import { CapHypoxemiaTray } from './CapHypoxemiaTray';
import { ChronicOpioidHypoventilationTray } from './ChronicOpioidHypoventilationTray';
import { CopdTransitionTray } from './CopdTransitionTray';
import { HighFlowOxygenEscalationTray } from './HighFlowOxygenEscalationTray';
import { LargePleuralEffusionTray } from './LargePleuralEffusionTray';
import { NeuromuscularRespiratoryFailureTray } from './NeuromuscularRespiratoryFailureTray';
import { NoninvasiveVentilationSelectionTray } from './NoninvasiveVentilationSelectionTray';
import { ObesityHypoventilationTray } from './ObesityHypoventilationTray';
import { OxygenDeviceFailureTray } from './OxygenDeviceFailureTray';
import { PostPeDyspneaTray } from './PostPeDyspneaTray';
import { PostTensionPneumothoraxTray } from './PostTensionPneumothoraxTray';

export const RESPIRATORY_MEDICINE_TRAYS: readonly LessonTray[] = [
  {
    id: 'AcuteSevereAsthma',
    actionType: 'acute-severe-asthma-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'acute-severe-asthma-reassessment',
    ),
    assessment: (r) => r?.acuteSevereAsthmaAssessment,
    Component: AcuteSevereAsthmaTray as LessonTray['Component'],
  },
  {
    id: 'AcuteTracheostomyObstruction',
    actionType: 'acute-tracheostomy-obstruction-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'acute-tracheostomy-obstruction-reassessment',
    ),
    assessment: (r) => r?.acuteTracheostomyObstructionAssessment,
    Component: AcuteTracheostomyObstructionTray as LessonTray['Component'],
  },
  {
    id: 'ApeSupport',
    actionType: 'acute-pulmonary-edema-respiratory-support-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'acute-pulmonary-edema-respiratory-support-reassessment',
    ),
    assessment: (r) => r?.apeSupportAssessment,
    Component: ApeSupportTray as LessonTray['Component'],
  },
  {
    id: 'BronchiectasisMucusPlugging',
    actionType: 'bronchiectasis-mucus-plugging-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'bronchiectasis-mucus-plugging-reassessment',
    ),
    assessment: (r) => r?.bronchiectasisMucusPluggingAssessment,
    Component: BronchiectasisMucusPluggingTray as LessonTray['Component'],
  },
  {
    id: 'CapHypoxemia',
    actionType: 'community-acquired-pneumonia-hypoxemia-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'community-acquired-pneumonia-hypoxemia-reassessment',
    ),
    assessment: (r) => r?.capHypoxemiaAssessment,
    Component: CapHypoxemiaTray as LessonTray['Component'],
  },
  {
    id: 'ChronicOpioidHypoventilation',
    actionType: 'chronic-opioid-related-hypoventilation-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'chronic-opioid-related-hypoventilation-reassessment',
    ),
    assessment: (r) => r?.chronicOpioidHypoventilationAssessment,
    Component: ChronicOpioidHypoventilationTray as LessonTray['Component'],
  },
  {
    id: 'CopdTransition',
    actionType: 'copd-exacerbation-transition-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'copd-exacerbation-transition-reassessment',
    ),
    assessment: (r) => r?.copdTransitionAssessment,
    Component: CopdTransitionTray as LessonTray['Component'],
  },
  {
    id: 'HighFlowOxygenEscalation',
    actionType: 'high-flow-nasal-oxygen-escalation-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'high-flow-nasal-oxygen-escalation',
    ),
    assessment: (r) => r?.highFlowOxygenEscalationAssessment,
    Component: HighFlowOxygenEscalationTray as LessonTray['Component'],
  },
  {
    id: 'LargePleuralEffusion',
    actionType: 'large-unilateral-pleural-effusion-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'large-unilateral-pleural-effusion-reassessment',
    ),
    assessment: (r) => r?.largePleuralEffusionAssessment,
    Component: LargePleuralEffusionTray as LessonTray['Component'],
  },
  {
    id: 'NeuromuscularRespiratoryFailure',
    actionType: 'neuromuscular-respiratory-failure-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'neuromuscular-respiratory-failure-reassessment',
    ),
    assessment: (r) => r?.neuromuscularRespiratoryFailureAssessment,
    Component: NeuromuscularRespiratoryFailureTray as LessonTray['Component'],
  },
  {
    id: 'NoninvasiveVentilationSelection',
    actionType: 'noninvasive-ventilation-selection-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'noninvasive-ventilation-selection',
    ),
    assessment: (r) => r?.noninvasiveVentilationSelectionAssessment,
    Component: NoninvasiveVentilationSelectionTray as LessonTray['Component'],
  },
  {
    id: 'ObesityHypoventilation',
    actionType: 'obesity-hypoventilation-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'obesity-hypoventilation-reassessment',
    ),
    assessment: (r) => r?.obesityHypoventilationAssessment,
    Component: ObesityHypoventilationTray as LessonTray['Component'],
  },
  {
    id: 'OxygenDeviceFailure',
    actionType: 'oxygen-device-failure-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'oxygen-device-failure',
    ),
    assessment: (r) => r?.oxygenDeviceFailureAssessment,
    Component: OxygenDeviceFailureTray as LessonTray['Component'],
  },
  {
    id: 'PostPeDyspnea',
    actionType: 'post-pulmonary-embolism-persistent-dyspnea-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'post-pulmonary-embolism-persistent-dyspnea-reassessment',
    ),
    assessment: (r) => r?.postPeDyspneaAssessment,
    Component: PostPeDyspneaTray as LessonTray['Component'],
  },
  {
    id: 'PostTensionPneumothorax',
    actionType: 'spontaneous-tension-pneumothorax-post-drainage-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'spontaneous-tension-pneumothorax-post-drainage-reassessment',
    ),
    assessment: (r) => r?.postTensionPneumothoraxAssessment,
    Component: PostTensionPneumothoraxTray as LessonTray['Component'],
  },
];
