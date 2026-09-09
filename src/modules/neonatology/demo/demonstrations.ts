/**
 * neonatology's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/neonatology.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { nicuHandoffDemonstrationStep, supportsNicuHandoffDemonstration } from './delivery-room-to-nicu-handoff-demonstration';
import { ineffectiveVentilationDemonstrationStep, supportsIneffectiveVentilationDemonstration } from './ineffective-ventilation-correction-demonstration';
import { meconiumTransitionDemonstrationStep, supportsMeconiumTransitionDemonstration } from './meconium-stained-transition-demonstration';
import { neonatalApneaDemonstrationStep, supportsNeonatalApneaDemonstration } from './neonatal-apnea-demonstration';
import { neonatalBradycardiaDemonstrationStep, supportsNeonatalBradycardiaDemonstration } from './neonatal-bradycardia-demonstration';
import { neonatalHypoglycemiaDemonstrationStep, supportsNeonatalHypoglycemiaDemonstration } from './neonatal-hypoglycemia-demonstration';
import { neonatalSepsisDemonstrationStep, supportsNeonatalSepsisDemonstration } from './neonatal-sepsis-demonstration';
import { supportsTensionPneumothoraxDemonstration, tensionPneumothoraxDemonstrationStep } from './neonatal-tension-pneumothorax-demonstration';
import { pretermRespiratoryDistressDemonstrationStep, supportsPretermRespiratoryDistressDemonstration } from './preterm-respiratory-distress-demonstration';
import { supportsTermTransitionDemonstration, termTransitionDemonstrationStep } from './term-newborn-transition-demonstration';
import { supportsThermoregulationDemonstration, thermoregulationDemonstrationStep } from './thermoregulation-failure-demonstration';

export const NEONATOLOGY_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'IneffectiveVentilation', supports: supportsIneffectiveVentilationDemonstration, actionType: 'ineffective-ventilation-correction-response', step: (r) => ineffectiveVentilationDemonstrationStep(r?.neonatologyIneffectiveVentilationAssessment) },
  { id: 'MeconiumTransition', supports: supportsMeconiumTransitionDemonstration, actionType: 'meconium-stained-transition-response', step: (r) => meconiumTransitionDemonstrationStep(r?.neonatologyMeconiumTransitionAssessment) },
  { id: 'NeonatalApnea', supports: supportsNeonatalApneaDemonstration, actionType: 'neonatal-apnea-response', step: (r) => neonatalApneaDemonstrationStep(r?.neonatologyApneaAssessment) },
  { id: 'NeonatalBradycardia', supports: supportsNeonatalBradycardiaDemonstration, actionType: 'neonatal-bradycardia-response', step: (r) => neonatalBradycardiaDemonstrationStep(r?.neonatologyBradycardiaAssessment) },
  { id: 'NeonatalHypoglycemia', supports: supportsNeonatalHypoglycemiaDemonstration, actionType: 'neonatal-hypoglycemia-response', step: (r) => neonatalHypoglycemiaDemonstrationStep(r?.neonatologyHypoglycemiaAssessment) },
  { id: 'NeonatalSepsis', supports: supportsNeonatalSepsisDemonstration, actionType: 'neonatal-sepsis-response', step: (r) => neonatalSepsisDemonstrationStep(r?.neonatologySepsisAssessment) },
  { id: 'NicuHandoff', supports: supportsNicuHandoffDemonstration, actionType: 'delivery-room-to-nicu-handoff-response', step: (r) => nicuHandoffDemonstrationStep(r?.neonatologyNicuHandoffAssessment) },
  { id: 'PretermRespiratoryDistress', supports: supportsPretermRespiratoryDistressDemonstration, actionType: 'preterm-respiratory-distress-response', step: (r) => pretermRespiratoryDistressDemonstrationStep(r?.neonatologyPretermRespiratoryDistressAssessment) },
  { id: 'TensionPneumothorax', supports: supportsTensionPneumothoraxDemonstration, actionType: 'neonatal-tension-pneumothorax-response', step: (r) => tensionPneumothoraxDemonstrationStep(r?.neonatologyTensionPneumothoraxAssessment) },
  { id: 'TermTransition', supports: supportsTermTransitionDemonstration, actionType: 'term-newborn-transition-response', step: (r) => termTransitionDemonstrationStep(r?.neonatologyTermTransitionAssessment) },
  { id: 'Thermoregulation', supports: supportsThermoregulationDemonstration, actionType: 'neonatal-thermoregulation-response', step: (r) => thermoregulationDemonstrationStep(r?.neonatologyThermoregulationAssessment) },
];
