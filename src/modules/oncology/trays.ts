/**
 * oncology's action trays, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's tray controls, labels and tutor prose and
 * nothing else. The cockpit used to import all 48 lesson trays, which measured 98.9 KB gz
 * of the chunk every module downloads.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { DelayedImmuneEventTray } from './DelayedImmuneEventTray';
import { EasyLabelTray } from './EasyLabelTray';
import { IncidentalClotTray } from './IncidentalClotTray';
import { InheritedUrgencyTray } from './InheritedUrgencyTray';
import { LaboratoryTlsTray } from './LaboratoryTlsTray';
import { LoweringTheCountTray } from './LoweringTheCountTray';
import { NormalTestToxicityTray } from './NormalTestToxicityTray';
import { PrognosisQuestionTray } from './PrognosisQuestionTray';
import { RareEarlyMyocarditisTray } from './RareEarlyMyocarditisTray';
import { SilentInteractionTray } from './SilentInteractionTray';
import { TrialRuleTray } from './TrialRuleTray';
import { supportsDelayedImmuneEvent } from './delayed-immune-event';
import { supportsEasyLabel } from './easy-label';
import { supportsIncidentalClot } from './incidental-clot';
import { supportsInheritedUrgency } from './inherited-urgency';
import { supportsLaboratoryTls } from './laboratory-tls';
import { supportsLoweringTheCount } from './lowering-the-count';
import { supportsNormalTestToxicity } from './normal-test-toxicity';
import { supportsPrognosisQuestion } from './prognosis-question';
import { supportsRareEarlyMyocarditis } from './rare-early-myocarditis';
import { supportsSilentInteraction } from './silent-interaction';
import { supportsTrialRule } from './trial-rule';

export const ONCOLOGY_TRAYS: readonly LessonTray[] = [
  { id: 'DelayedImmuneEvent', actionType: 'delayed-immune-event-response', supports: supportsDelayedImmuneEvent, assessment: (r) => r?.delayedImmuneEvent, Component: DelayedImmuneEventTray as LessonTray['Component'] },
  { id: 'EasyLabel', actionType: 'easy-label-response', supports: supportsEasyLabel, assessment: (r) => r?.easyLabel, Component: EasyLabelTray as LessonTray['Component'] },
  { id: 'IncidentalClot', actionType: 'incidental-clot-response', supports: supportsIncidentalClot, assessment: (r) => r?.incidentalClot, Component: IncidentalClotTray as LessonTray['Component'] },
  { id: 'InheritedUrgency', actionType: 'inherited-urgency-response', supports: supportsInheritedUrgency, assessment: (r) => r?.inheritedUrgency, Component: InheritedUrgencyTray as LessonTray['Component'] },
  { id: 'LaboratoryTls', actionType: 'laboratory-tls-response', supports: supportsLaboratoryTls, assessment: (r) => r?.laboratoryTls, Component: LaboratoryTlsTray as LessonTray['Component'] },
  { id: 'LoweringTheCount', actionType: 'lowering-the-count-response', supports: supportsLoweringTheCount, assessment: (r) => r?.loweringTheCount, Component: LoweringTheCountTray as LessonTray['Component'] },
  { id: 'NormalTestToxicity', actionType: 'normal-test-toxicity-response', supports: supportsNormalTestToxicity, assessment: (r) => r?.normalTestToxicity, Component: NormalTestToxicityTray as LessonTray['Component'] },
  { id: 'PrognosisQuestion', actionType: 'prognosis-question-response', supports: supportsPrognosisQuestion, assessment: (r) => r?.prognosisQuestion, Component: PrognosisQuestionTray as LessonTray['Component'] },
  { id: 'RareEarlyMyocarditis', actionType: 'rare-early-myocarditis-response', supports: supportsRareEarlyMyocarditis, assessment: (r) => r?.rareEarlyMyocarditis, Component: RareEarlyMyocarditisTray as LessonTray['Component'] },
  { id: 'SilentInteraction', actionType: 'silent-interaction-response', supports: supportsSilentInteraction, assessment: (r) => r?.silentInteraction, Component: SilentInteractionTray as LessonTray['Component'] },
  { id: 'TrialRule', actionType: 'trial-rule-response', supports: supportsTrialRule, assessment: (r) => r?.trialRule, Component: TrialRuleTray as LessonTray['Component'] },
];
