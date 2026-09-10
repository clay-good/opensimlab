/**
 * endocrine-metabolic's action trays, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's tray controls, labels and tutor prose and
 * nothing else. The cockpit used to import all 48 lesson trays, which measured 98.9 KB gz
 * of the chunk every module downloads.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { AdrenalCrisisTray } from './AdrenalCrisisTray';
import { AvpDeficiencyTray } from './AvpDeficiencyTray';
import { HypercalcemiaTray } from './HypercalcemiaTray';
import { HypocalcemiaTray } from './HypocalcemiaTray';
import { HyponatremiaCorrectionTray } from './HyponatremiaCorrectionTray';
import { MyxedemaTray } from './MyxedemaTray';
import { PerioperativeDiabetesTray } from './PerioperativeDiabetesTray';
import { RefeedingTray } from './RefeedingTray';
import { SevereHypoglycemiaTray } from './SevereHypoglycemiaTray';
import { ThyroidStormTray } from './ThyroidStormTray';
import { supportsAdrenalCrisis } from './adrenal-crisis';
import { supportsAvpDeficiency } from './avp-deficiency';
import { supportsHypercalcemia } from './hypercalcemia';
import { supportsHypocalcemia } from './hypocalcemia';
import { supportsHyponatremiaCorrection } from './hyponatremia-correction';
import { supportsMyxedema } from './myxedema';
import { supportsPerioperativeDiabetes } from './perioperative-diabetes';
import { supportsRefeeding } from './refeeding';
import { supportsSevereHypoglycemia } from './severe-hypoglycemia';
import { supportsThyroidStorm } from './thyroid-storm';

import { EndocrineDkaResolutionTray } from './EndocrineDkaResolutionTray';
import { EndocrineHhsTray } from './EndocrineHhsTray';

export const ENDOCRINE_METABOLIC_TRAYS: readonly LessonTray[] = [
  { id: 'AdrenalCrisis', demoId: 'Adrenal', actionType: 'adrenal-crisis-response', supports: supportsAdrenalCrisis, assessment: (r) => r?.adrenalCrisis, opensSource: true, Component: AdrenalCrisisTray as LessonTray['Component'] },
  { id: 'AvpDeficiency', actionType: 'avp-deficiency-response', supports: supportsAvpDeficiency, assessment: (r) => r?.avpDeficiency, opensSource: true, Component: AvpDeficiencyTray as LessonTray['Component'] },
  { id: 'Hypercalcemia', actionType: 'hypercalcemia-response', supports: supportsHypercalcemia, assessment: (r) => r?.hypercalcemia, opensSource: true, Component: HypercalcemiaTray as LessonTray['Component'] },
  { id: 'Hypocalcemia', actionType: 'hypocalcemia-response', supports: supportsHypocalcemia, assessment: (r) => r?.hypocalcemia, opensSource: true, Component: HypocalcemiaTray as LessonTray['Component'] },
  { id: 'HyponatremiaCorrection', actionType: 'hyponatremia-correction-response', supports: supportsHyponatremiaCorrection, assessment: (r) => r?.hyponatremiaCorrection, opensSource: true, Component: HyponatremiaCorrectionTray as LessonTray['Component'] },
  { id: 'Myxedema', actionType: 'myxedema-response', supports: supportsMyxedema, assessment: (r) => r?.myxedema, opensSource: true, Component: MyxedemaTray as LessonTray['Component'] },
  { id: 'PerioperativeDiabetes', actionType: 'perioperative-diabetes-response', supports: supportsPerioperativeDiabetes, assessment: (r) => r?.perioperativeDiabetes, opensSource: true, Component: PerioperativeDiabetesTray as LessonTray['Component'] },
  { id: 'Refeeding', actionType: 'refeeding-response', supports: supportsRefeeding, assessment: (r) => r?.refeeding, opensSource: true, Component: RefeedingTray as LessonTray['Component'] },
  { id: 'SevereHypoglycemia', demoId: 'Hypoglycemia', actionType: 'severe-hypoglycemia-response', supports: supportsSevereHypoglycemia, assessment: (r) => r?.severeHypoglycemia, Component: SevereHypoglycemiaTray as LessonTray['Component'] },
  { id: 'ThyroidStorm', demoId: 'Thyroid', actionType: 'thyroid-storm-response', supports: supportsThyroidStorm, assessment: (r) => r?.thyroidStorm, opensSource: true, Component: ThyroidStormTray as LessonTray['Component'] },
  {
    id: 'EndocrineDkaResolution',
    demoId: 'DkaResolution',
    actionType: 'dka-resolution-transition-response',
    supports: (scenario) => scenario.metadata.id === 'dka-resolution-transition'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'dka-resolution-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'dka-resolution-transition-boundary').length === 1,
    assessment: (r) => r?.endocrineDkaResolutionAssessment,
    Component: EndocrineDkaResolutionTray as LessonTray['Component'],
  },
  {
    id: 'EndocrineHhs',
    demoId: 'HhsOsmolality',
    actionType: 'hhs-osmolality-trajectory-response',
    supports: (scenario) => scenario.metadata.id === 'hhs-osmolality-trajectory'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'hhs-osmolality-trajectory').length === 1
    && scenario.timeline.filter((event) => event.target === 'hhs-osmolality-trajectory-boundary').length === 1,
    assessment: (r) => r?.endocrineHhsAssessment,
    Component: EndocrineHhsTray as LessonTray['Component'],
  },
];
