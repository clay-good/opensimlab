/**
 * endocrine-metabolic's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/endocrine-metabolic.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { adrenalDemonstrationStep, supportsAdrenalDemonstration } from './adrenal-demonstration';
import { avpDeficiencyDemonstrationStep, supportsAvpDeficiencyDemonstration } from './avp-deficiency-demonstration';
import { dkaResolutionDemonstrationStep, supportsDkaResolutionDemonstration } from './dka-resolution-demonstration';
import { hhsOsmolalityDemonstrationStep, supportsHhsOsmolalityDemonstration } from './hhs-osmolality-demonstration';
import { hypercalcemiaDemonstrationStep, supportsHypercalcemiaDemonstration } from './hypercalcemia-demonstration';
import { hypocalcemiaDemonstrationStep, supportsHypocalcemiaDemonstration } from './hypocalcemia-demonstration';
import { hypoglycemiaDemonstrationStep, supportsHypoglycemiaDemonstration } from './hypoglycemia-demonstration';
import { hyponatremiaCorrectionDemonstrationStep, supportsHyponatremiaCorrectionDemonstration } from './hyponatremia-correction-demonstration';
import { myxedemaDemonstrationStep, supportsMyxedemaDemonstration } from './myxedema-demonstration';
import { perioperativeDiabetesDemonstrationStep, supportsPerioperativeDiabetesDemonstration } from './perioperative-diabetes-demonstration';
import { refeedingDemonstrationStep, supportsRefeedingDemonstration } from './refeeding-demonstration';
import { supportsThyroidDemonstration, thyroidDemonstrationStep } from './thyroid-demonstration';

export const ENDOCRINE_METABOLIC_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'Adrenal', supports: supportsAdrenalDemonstration, actionType: 'adrenal-crisis-response', step: (r) => adrenalDemonstrationStep(r?.adrenalCrisis) },
  { id: 'AvpDeficiency', supports: supportsAvpDeficiencyDemonstration, actionType: 'avp-deficiency-response', step: (r) => avpDeficiencyDemonstrationStep(r?.avpDeficiency) },
  { id: 'DkaResolution', supports: supportsDkaResolutionDemonstration, actionType: 'dka-resolution-transition-response', step: (r) => dkaResolutionDemonstrationStep(r?.endocrineDkaResolutionAssessment) },
  { id: 'HhsOsmolality', supports: supportsHhsOsmolalityDemonstration, actionType: 'hhs-osmolality-trajectory-response', step: (r) => hhsOsmolalityDemonstrationStep(r?.endocrineHhsAssessment) },
  { id: 'Hypercalcemia', supports: supportsHypercalcemiaDemonstration, actionType: 'hypercalcemia-response', step: (r) => hypercalcemiaDemonstrationStep(r?.hypercalcemia) },
  { id: 'Hypocalcemia', supports: supportsHypocalcemiaDemonstration, actionType: 'hypocalcemia-response', step: (r) => hypocalcemiaDemonstrationStep(r?.hypocalcemia) },
  { id: 'Hypoglycemia', supports: supportsHypoglycemiaDemonstration, actionType: 'severe-hypoglycemia-response', step: (r) => hypoglycemiaDemonstrationStep(r?.severeHypoglycemia) },
  { id: 'HyponatremiaCorrection', supports: supportsHyponatremiaCorrectionDemonstration, actionType: 'hyponatremia-correction-response', step: (r) => hyponatremiaCorrectionDemonstrationStep(r?.hyponatremiaCorrection) },
  { id: 'Myxedema', supports: supportsMyxedemaDemonstration, actionType: 'myxedema-response', step: (r) => myxedemaDemonstrationStep(r?.myxedema) },
  { id: 'PerioperativeDiabetes', supports: supportsPerioperativeDiabetesDemonstration, actionType: 'perioperative-diabetes-response', step: (r) => perioperativeDiabetesDemonstrationStep(r?.perioperativeDiabetes) },
  { id: 'Refeeding', supports: supportsRefeedingDemonstration, actionType: 'refeeding-response', step: (r) => refeedingDemonstrationStep(r?.refeeding) },
  { id: 'Thyroid', supports: supportsThyroidDemonstration, actionType: 'thyroid-storm-response', step: (r) => thyroidDemonstrationStep(r?.thyroidStorm) },
];
