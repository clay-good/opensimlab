/**
 * respiratory-medicine's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/respiratory-medicine.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { apeSupportDemonstrationStep, supportsApeSupportDemonstration } from './acute-pulmonary-edema-respiratory-support-reassessment-demonstration';
import { acuteSevereAsthmaDemonstrationStep, supportsAcuteSevereAsthmaDemonstration } from './acute-severe-asthma-demonstration';
import { acuteTracheostomyObstructionDemonstrationStep, supportsAcuteTracheostomyObstructionDemonstration } from './acute-tracheostomy-obstruction-demonstration';
import { bronchiectasisMucusPluggingDemonstrationStep, supportsBronchiectasisMucusPluggingDemonstration } from './bronchiectasis-mucus-plugging-reassessment-demonstration';
import { chronicOpioidHypoventilationDemonstrationStep, supportsChronicOpioidHypoventilationDemonstration } from './chronic-opioid-related-hypoventilation-reassessment-demonstration';
import { capHypoxemiaDemonstrationStep, supportsCapHypoxemiaDemonstration } from './community-acquired-pneumonia-hypoxemia-reassessment-demonstration';
import { copdTransitionDemonstrationStep, supportsCopdTransitionDemonstration } from './copd-exacerbation-transition-reassessment-demonstration';
import { highFlowOxygenEscalationDemonstrationStep, supportsHighFlowOxygenEscalationDemonstration } from './high-flow-nasal-oxygen-escalation-demonstration';
import { largePleuralEffusionDemonstrationStep, supportsLargePleuralEffusionDemonstration } from './large-unilateral-pleural-effusion-reassessment-demonstration';
import { neuromuscularRespiratoryFailureDemonstrationStep, supportsNeuromuscularRespiratoryFailureDemonstration } from './neuromuscular-respiratory-failure-reassessment-demonstration';
import { noninvasiveVentilationSelectionDemonstrationStep, supportsNoninvasiveVentilationSelectionDemonstration } from './noninvasive-ventilation-selection-demonstration';
import { obesityHypoventilationDemonstrationStep, supportsObesityHypoventilationDemonstration } from './obesity-hypoventilation-reassessment-demonstration';
import { oxygenDeviceFailureDemonstrationStep, supportsOxygenDeviceFailureDemonstration } from './oxygen-device-failure-demonstration';
import { postPeDyspneaDemonstrationStep, supportsPostPeDyspneaDemonstration } from './post-pulmonary-embolism-persistent-dyspnea-demonstration';
import { postTensionPneumothoraxDemonstrationStep, supportsPostTensionPneumothoraxDemonstration } from './spontaneous-tension-pneumothorax-post-drainage-reassessment-demonstration';

export const RESPIRATORY_MEDICINE_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'AcuteSevereAsthma', supports: supportsAcuteSevereAsthmaDemonstration, actionType: 'acute-severe-asthma-response', step: (r) => acuteSevereAsthmaDemonstrationStep(r?.acuteSevereAsthmaAssessment) },
  { id: 'AcuteTracheostomyObstruction', supports: supportsAcuteTracheostomyObstructionDemonstration, actionType: 'acute-tracheostomy-obstruction-response', step: (r) => acuteTracheostomyObstructionDemonstrationStep(r?.acuteTracheostomyObstructionAssessment) },
  { id: 'ApeSupport', supports: supportsApeSupportDemonstration, actionType: 'acute-pulmonary-edema-respiratory-support-response', step: (r) => apeSupportDemonstrationStep(r?.apeSupportAssessment) },
  { id: 'BronchiectasisMucusPlugging', supports: supportsBronchiectasisMucusPluggingDemonstration, actionType: 'bronchiectasis-mucus-plugging-response', step: (r) => bronchiectasisMucusPluggingDemonstrationStep(r?.bronchiectasisMucusPluggingAssessment) },
  { id: 'CapHypoxemia', supports: supportsCapHypoxemiaDemonstration, actionType: 'community-acquired-pneumonia-hypoxemia-response', step: (r) => capHypoxemiaDemonstrationStep(r?.capHypoxemiaAssessment) },
  { id: 'ChronicOpioidHypoventilation', supports: supportsChronicOpioidHypoventilationDemonstration, actionType: 'chronic-opioid-related-hypoventilation-response', step: (r) => chronicOpioidHypoventilationDemonstrationStep(r?.chronicOpioidHypoventilationAssessment) },
  { id: 'CopdTransition', supports: supportsCopdTransitionDemonstration, actionType: 'copd-exacerbation-transition-response', step: (r) => copdTransitionDemonstrationStep(r?.copdTransitionAssessment) },
  { id: 'HighFlowOxygenEscalation', supports: supportsHighFlowOxygenEscalationDemonstration, actionType: 'high-flow-nasal-oxygen-escalation-response', step: (r) => highFlowOxygenEscalationDemonstrationStep(r?.highFlowOxygenEscalationAssessment) },
  { id: 'LargePleuralEffusion', supports: supportsLargePleuralEffusionDemonstration, actionType: 'large-unilateral-pleural-effusion-response', step: (r) => largePleuralEffusionDemonstrationStep(r?.largePleuralEffusionAssessment) },
  { id: 'NeuromuscularRespiratoryFailure', supports: supportsNeuromuscularRespiratoryFailureDemonstration, actionType: 'neuromuscular-respiratory-failure-response', step: (r) => neuromuscularRespiratoryFailureDemonstrationStep(r?.neuromuscularRespiratoryFailureAssessment) },
  { id: 'NoninvasiveVentilationSelection', supports: supportsNoninvasiveVentilationSelectionDemonstration, actionType: 'noninvasive-ventilation-selection-response', step: (r) => noninvasiveVentilationSelectionDemonstrationStep(r?.noninvasiveVentilationSelectionAssessment) },
  { id: 'ObesityHypoventilation', supports: supportsObesityHypoventilationDemonstration, actionType: 'obesity-hypoventilation-response', step: (r) => obesityHypoventilationDemonstrationStep(r?.obesityHypoventilationAssessment) },
  { id: 'OxygenDeviceFailure', supports: supportsOxygenDeviceFailureDemonstration, actionType: 'oxygen-device-failure-response', step: (r) => oxygenDeviceFailureDemonstrationStep(r?.oxygenDeviceFailureAssessment) },
  { id: 'PostPeDyspnea', supports: supportsPostPeDyspneaDemonstration, actionType: 'post-pulmonary-embolism-persistent-dyspnea-response', step: (r) => postPeDyspneaDemonstrationStep(r?.postPeDyspneaAssessment) },
  { id: 'PostTensionPneumothorax', supports: supportsPostTensionPneumothoraxDemonstration, actionType: 'spontaneous-tension-pneumothorax-post-drainage-response', step: (r) => postTensionPneumothoraxDemonstrationStep(r?.postTensionPneumothoraxAssessment) },
];
