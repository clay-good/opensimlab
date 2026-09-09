/**
 * oncology's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/oncology.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { delayedImmuneEventDemonstrationStep, supportsDelayedImmuneEventDemonstration } from './delayed-immune-event-demonstration';
import { easyLabelDemonstrationStep, supportsEasyLabelDemonstration } from './easy-label-demonstration';
import { incidentalClotDemonstrationStep, supportsIncidentalClotDemonstration } from './incidental-clot-demonstration';
import { inheritedUrgencyDemonstrationStep, supportsInheritedUrgencyDemonstration } from './inherited-urgency-demonstration';
import { laboratoryTlsDemonstrationStep, supportsLaboratoryTlsDemonstration } from './laboratory-tls-demonstration';
import { loweringTheCountDemonstrationStep, supportsLoweringTheCountDemonstration } from './lowering-the-count-demonstration';
import { normalTestToxicityDemonstrationStep, supportsNormalTestToxicityDemonstration } from './normal-test-toxicity-demonstration';
import { prognosisQuestionDemonstrationStep, supportsPrognosisQuestionDemonstration } from './prognosis-question-demonstration';
import { rareEarlyMyocarditisDemonstrationStep, supportsRareEarlyMyocarditisDemonstration } from './rare-early-myocarditis-demonstration';
import { silentInteractionDemonstrationStep, supportsSilentInteractionDemonstration } from './silent-interaction-demonstration';
import { supportsTrialRuleDemonstration, trialRuleDemonstrationStep } from './trial-rule-demonstration';

export const ONCOLOGY_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'DelayedImmuneEvent', supports: supportsDelayedImmuneEventDemonstration, actionType: 'delayed-immune-event-response', step: (r) => delayedImmuneEventDemonstrationStep(r?.delayedImmuneEvent) },
  { id: 'EasyLabel', supports: supportsEasyLabelDemonstration, actionType: 'easy-label-response', step: (r) => easyLabelDemonstrationStep(r?.easyLabel) },
  { id: 'IncidentalClot', supports: supportsIncidentalClotDemonstration, actionType: 'incidental-clot-response', step: (r) => incidentalClotDemonstrationStep(r?.incidentalClot) },
  { id: 'InheritedUrgency', supports: supportsInheritedUrgencyDemonstration, actionType: 'inherited-urgency-response', step: (r) => inheritedUrgencyDemonstrationStep(r?.inheritedUrgency) },
  { id: 'LaboratoryTls', supports: supportsLaboratoryTlsDemonstration, actionType: 'laboratory-tls-response', step: (r) => laboratoryTlsDemonstrationStep(r?.laboratoryTls) },
  { id: 'LoweringTheCount', supports: supportsLoweringTheCountDemonstration, actionType: 'lowering-the-count-response', step: (r) => loweringTheCountDemonstrationStep(r?.loweringTheCount) },
  { id: 'NormalTestToxicity', supports: supportsNormalTestToxicityDemonstration, actionType: 'normal-test-toxicity-response', step: (r) => normalTestToxicityDemonstrationStep(r?.normalTestToxicity) },
  { id: 'PrognosisQuestion', supports: supportsPrognosisQuestionDemonstration, actionType: 'prognosis-question-response', step: (r) => prognosisQuestionDemonstrationStep(r?.prognosisQuestion) },
  { id: 'RareEarlyMyocarditis', supports: supportsRareEarlyMyocarditisDemonstration, actionType: 'rare-early-myocarditis-response', step: (r) => rareEarlyMyocarditisDemonstrationStep(r?.rareEarlyMyocarditis) },
  { id: 'SilentInteraction', supports: supportsSilentInteractionDemonstration, actionType: 'silent-interaction-response', step: (r) => silentInteractionDemonstrationStep(r?.silentInteraction) },
  { id: 'TrialRule', supports: supportsTrialRuleDemonstration, actionType: 'trial-rule-response', step: (r) => trialRuleDemonstrationStep(r?.trialRule) },
];
