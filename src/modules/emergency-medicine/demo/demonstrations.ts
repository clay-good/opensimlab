/**
 * emergency-medicine's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/emergency-medicine.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { acuteAorticSyndromeDemonstrationStep, supportsAcuteAorticSyndromeDemonstration } from './acute-aortic-syndrome-demonstration';
import { acuteIschemicStrokeDemonstrationStep, supportsAcuteIschemicStrokeDemonstration } from './acute-ischemic-stroke-demonstration';
import { acutePulmonaryEdemaDemonstrationStep, supportsAcutePulmonaryEdemaDemonstration } from './acute-pulmonary-edema-demonstration';
import { adultAsthmaDemonstrationStep, supportsAdultAsthmaDemonstration } from './adult-asthma-demonstration';
import { cardiacTamponadeDemonstrationStep, supportsCardiacTamponadeDemonstration } from './cardiac-tamponade-demonstration';
import { copdExacerbationDemonstrationStep, supportsCopdExacerbationDemonstration } from './copd-exacerbation-demonstration';
import { diabeticKetoacidosisDemonstrationStep, supportsDiabeticKetoacidosisDemonstration } from './diabetic-ketoacidosis-demonstration';
import { emergencyAnaphylaxisDemonstrationStep, supportsEmergencyAnaphylaxisDemonstration } from './emergency-anaphylaxis-demonstration';
import { exertionalHeatStrokeDemonstrationStep, supportsExertionalHeatStrokeDemonstration } from './exertional-heat-stroke-demonstration';
import { hemorrhagicShockDemonstrationStep, supportsHemorrhagicShockDemonstration } from './hemorrhagic-shock-demonstration';
import { hyperkalemiaWithEcgChangeDemonstrationStep, supportsHyperkalemiaWithEcgChangeDemonstration } from './hyperkalemia-with-ecg-change-demonstration';
import { intracranialHemorrhageDemonstrationStep, supportsIntracranialHemorrhageDemonstration } from './intracranial-hemorrhage-deterioration-demonstration';
import { opioidToxicityDemonstrationStep, supportsOpioidToxicityDemonstration } from './opioid-toxicity-demonstration';
import { pulmonaryEmbolismDemonstrationStep, supportsPulmonaryEmbolismDemonstration } from './pulmonary-embolism-deterioration-demonstration';
import { septicShockDemonstrationStep, supportsSepticShockDemonstration } from './septic-shock-demonstration';
import { severeHyponatremiaDemonstrationStep, supportsSevereHyponatremiaDemonstration } from './severe-hyponatremia-with-seizure-demonstration';
import { statusEpilepticusDemonstrationStep, supportsStatusEpilepticusDemonstration } from './status-epilepticus-demonstration';
import { stemiDemonstrationStep, supportsStemiDemonstration } from './stemi-demonstration';
import { supportsTraumaPrimarySurveyDemonstration, traumaPrimarySurveyDemonstrationStep } from './trauma-primary-survey-demonstration';
import { supportsUndifferentiatedShockDemonstration, undifferentiatedShockDemonstrationStep } from './undifferentiated-shock-demonstration';
import { supportsUnstableBradycardiaDemonstration, unstableBradycardiaDemonstrationStep } from './unstable-bradycardia-demonstration';

export const EMERGENCY_MEDICINE_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'AcuteAorticSyndrome', supports: supportsAcuteAorticSyndromeDemonstration, actionType: 'acute-aortic-syndrome-response', step: (r) => acuteAorticSyndromeDemonstrationStep(r?.acuteAorticSyndromeAssessment) },
  { id: 'AcuteIschemicStroke', supports: supportsAcuteIschemicStrokeDemonstration, actionType: 'acute-ischemic-stroke-response', step: (r) => acuteIschemicStrokeDemonstrationStep(r?.acuteIschemicStrokeAssessment) },
  { id: 'AcutePulmonaryEdema', supports: supportsAcutePulmonaryEdemaDemonstration, actionType: 'acute-pulmonary-edema-response', step: (r) => acutePulmonaryEdemaDemonstrationStep(r?.acutePulmonaryEdemaAssessment) },
  { id: 'AdultAsthma', supports: supportsAdultAsthmaDemonstration, actionType: 'adult-asthma-response', step: (r) => adultAsthmaDemonstrationStep(r?.adultAsthmaAssessment) },
  { id: 'CardiacTamponade', supports: supportsCardiacTamponadeDemonstration, actionType: 'cardiac-tamponade-assessment', step: (r) => cardiacTamponadeDemonstrationStep(r?.cardiacTamponadeAssessment) },
  { id: 'CopdExacerbation', supports: supportsCopdExacerbationDemonstration, actionType: 'copd-exacerbation-response', step: (r) => copdExacerbationDemonstrationStep(r?.copdExacerbationAssessment) },
  { id: 'DiabeticKetoacidosis', supports: supportsDiabeticKetoacidosisDemonstration, actionType: 'diabetic-ketoacidosis-response', step: (r) => diabeticKetoacidosisDemonstrationStep(r?.diabeticKetoacidosisAssessment) },
  { id: 'EmergencyAnaphylaxis', supports: supportsEmergencyAnaphylaxisDemonstration, actionType: 'emergency-anaphylaxis-response', step: (r) => emergencyAnaphylaxisDemonstrationStep(r?.emergencyAnaphylaxisAssessment) },
  { id: 'ExertionalHeatStroke', supports: supportsExertionalHeatStrokeDemonstration, actionType: 'heat-stroke-response', step: (r) => exertionalHeatStrokeDemonstrationStep(r?.heatStrokeAssessment) },
  { id: 'HemorrhagicShock', supports: supportsHemorrhagicShockDemonstration, actionType: 'hemorrhagic-shock-assessment', step: (r) => hemorrhagicShockDemonstrationStep(r?.hemorrhagicShockAssessment) },
  { id: 'HyperkalemiaWithEcgChange', supports: supportsHyperkalemiaWithEcgChangeDemonstration, actionType: 'hyperkalemia-response', step: (r) => hyperkalemiaWithEcgChangeDemonstrationStep(r?.hyperkalemiaAssessment) },
  { id: 'IntracranialHemorrhage', supports: supportsIntracranialHemorrhageDemonstration, actionType: 'intracranial-hemorrhage-response', step: (r) => intracranialHemorrhageDemonstrationStep(r?.intracranialHemorrhageAssessment) },
  { id: 'OpioidToxicity', supports: supportsOpioidToxicityDemonstration, actionType: 'opioid-toxicity-response', step: (r) => opioidToxicityDemonstrationStep(r?.opioidToxicityAssessment) },
  { id: 'PulmonaryEmbolism', supports: supportsPulmonaryEmbolismDemonstration, actionType: 'pulmonary-embolism-deterioration-response', step: (r) => pulmonaryEmbolismDemonstrationStep(r?.pulmonaryEmbolismAssessment) },
  { id: 'SepticShock', supports: supportsSepticShockDemonstration, actionType: 'septic-shock-assessment', step: (r) => septicShockDemonstrationStep(r?.septicShockAssessment) },
  { id: 'SevereHyponatremia', supports: supportsSevereHyponatremiaDemonstration, actionType: 'hyponatremia-response', step: (r) => severeHyponatremiaDemonstrationStep(r?.hyponatremiaAssessment) },
  { id: 'StatusEpilepticus', supports: supportsStatusEpilepticusDemonstration, actionType: 'status-epilepticus-response', step: (r) => statusEpilepticusDemonstrationStep(r?.statusEpilepticusAssessment) },
  { id: 'Stemi', supports: supportsStemiDemonstration, actionType: 'stemi-response', step: (r) => stemiDemonstrationStep(r?.stemiAssessment) },
  { id: 'TraumaPrimarySurvey', supports: supportsTraumaPrimarySurveyDemonstration, actionType: 'trauma-primary-survey-response', step: (r) => traumaPrimarySurveyDemonstrationStep(r?.traumaPrimarySurveyAssessment) },
  { id: 'UndifferentiatedShock', supports: supportsUndifferentiatedShockDemonstration, actionType: 'undifferentiated-shock-assessment', step: (r) => undifferentiatedShockDemonstrationStep(r?.undifferentiatedShockAssessment) },
  { id: 'UnstableBradycardia', supports: supportsUnstableBradycardiaDemonstration, actionType: 'unstable-bradycardia-response', step: (r) => unstableBradycardiaDemonstrationStep(r?.unstableBradycardiaAssessment) },
];
