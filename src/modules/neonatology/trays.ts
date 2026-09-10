/**
 * neonatology's action trays, handed to the cockpit by the module's route.
 *
 * Each was written inline in `ActionCockpit.tsx` behind a gate computed from the scenario,
 * which meant every module downloaded every one of them. The gate moves here as the tray's
 * `supports` predicate, unchanged.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { NeonatologyTermTransitionTray } from './NeonatologyTermTransitionTray';
import { NeonatologyApneaTray } from './NeonatologyApneaTray';
import { NeonatologyIneffectiveVentilationTray } from './NeonatologyIneffectiveVentilationTray';
import { NeonatologyBradycardiaTray } from './NeonatologyBradycardiaTray';
import { NeonatologyMeconiumTransitionTray } from './NeonatologyMeconiumTransitionTray';
import { NeonatologyPretermRespiratoryDistressTray } from './NeonatologyPretermRespiratoryDistressTray';
import { NeonatologyHypoglycemiaTray } from './NeonatologyHypoglycemiaTray';
import { NeonatologySepsisTray } from './NeonatologySepsisTray';
import { NeonatologyThermoregulationTray } from './NeonatologyThermoregulationTray';
import { NeonatologyNicuHandoffTray } from './NeonatologyNicuHandoffTray';
import { NeonatologyTensionPneumothoraxTray } from './NeonatologyTensionPneumothoraxTray';

export const NEONATOLOGY_TRAYS: readonly LessonTray[] = [
  {
    id: 'NeonatologyTermTransition',
    demoId: 'TermTransition',
    actionType: 'term-newborn-transition-response',
    supports: (scenario) => scenario.metadata.id === 'term-newborn-transition'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'term-newborn-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'term-newborn-transition-boundary').length === 1,
    assessment: (r) => r?.neonatologyTermTransitionAssessment,
    Component: NeonatologyTermTransitionTray as LessonTray['Component'],
  },
  {
    id: 'NeonatologyApnea',
    demoId: 'NeonatalApnea',
    actionType: 'neonatal-apnea-response',
    supports: (scenario) => scenario.metadata.id === 'neonatal-apnea'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'neonatal-apnea-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'neonatal-apnea-transition-boundary').length === 1,
    assessment: (r) => r?.neonatologyApneaAssessment,
    Component: NeonatologyApneaTray as LessonTray['Component'],
  },
  {
    id: 'NeonatologyIneffectiveVentilation',
    demoId: 'IneffectiveVentilation',
    actionType: 'ineffective-ventilation-correction-response',
    supports: (scenario) => scenario.metadata.id === 'ineffective-ventilation-correction'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'ineffective-ventilation-correction-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'ineffective-ventilation-correction-transition-boundary').length === 1,
    assessment: (r) => r?.neonatologyIneffectiveVentilationAssessment,
    Component: NeonatologyIneffectiveVentilationTray as LessonTray['Component'],
  },
  {
    id: 'NeonatologyBradycardia',
    demoId: 'NeonatalBradycardia',
    actionType: 'neonatal-bradycardia-response',
    supports: (scenario) => scenario.metadata.id === 'neonatal-bradycardia'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'neonatal-bradycardia-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'neonatal-bradycardia-transition-boundary').length === 1,
    assessment: (r) => r?.neonatologyBradycardiaAssessment,
    Component: NeonatologyBradycardiaTray as LessonTray['Component'],
  },
  {
    id: 'NeonatologyMeconiumTransition',
    demoId: 'MeconiumTransition',
    actionType: 'meconium-stained-transition-response',
    supports: (scenario) => scenario.metadata.id === 'meconium-stained-transition'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'meconium-stained-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'meconium-stained-transition-boundary').length === 1,
    assessment: (r) => r?.neonatologyMeconiumTransitionAssessment,
    Component: NeonatologyMeconiumTransitionTray as LessonTray['Component'],
  },
  {
    id: 'NeonatologyPretermRespiratoryDistress',
    demoId: 'PretermRespiratoryDistress',
    actionType: 'preterm-respiratory-distress-response',
    supports: (scenario) => scenario.metadata.id === 'preterm-respiratory-distress'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'preterm-respiratory-distress').length === 1
    && scenario.timeline.filter((event) => event.target === 'preterm-respiratory-distress-boundary').length === 1,
    assessment: (r) => r?.neonatologyPretermRespiratoryDistressAssessment,
    Component: NeonatologyPretermRespiratoryDistressTray as LessonTray['Component'],
  },
  {
    id: 'NeonatologyHypoglycemia',
    demoId: 'NeonatalHypoglycemia',
    actionType: 'neonatal-hypoglycemia-response',
    supports: (scenario) => scenario.metadata.id === 'neonatal-hypoglycemia'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'neonatal-hypoglycemia').length === 1
    && scenario.timeline.filter((event) => event.target === 'neonatal-hypoglycemia-boundary').length === 1,
    assessment: (r) => r?.neonatologyHypoglycemiaAssessment,
    Component: NeonatologyHypoglycemiaTray as LessonTray['Component'],
  },
  {
    id: 'NeonatologySepsis',
    demoId: 'NeonatalSepsis',
    actionType: 'neonatal-sepsis-response',
    supports: (scenario) => scenario.metadata.id === 'neonatal-sepsis'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'neonatal-sepsis').length === 1
    && scenario.timeline.filter((event) => event.target === 'neonatal-sepsis-boundary').length === 1,
    assessment: (r) => r?.neonatologySepsisAssessment,
    Component: NeonatologySepsisTray as LessonTray['Component'],
  },
  {
    id: 'NeonatologyThermoregulation',
    demoId: 'Thermoregulation',
    actionType: 'neonatal-thermoregulation-response',
    supports: (scenario) => scenario.metadata.id === 'thermoregulation-failure'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'thermoregulation-failure').length === 1
    && scenario.timeline.filter((event) => event.target === 'thermoregulation-failure-boundary').length === 1,
    assessment: (r) => r?.neonatologyThermoregulationAssessment,
    Component: NeonatologyThermoregulationTray as LessonTray['Component'],
  },
  {
    id: 'NeonatologyNicuHandoff',
    demoId: 'NicuHandoff',
    actionType: 'delivery-room-to-nicu-handoff-response',
    supports: (scenario) => scenario.metadata.id === 'delivery-room-to-nicu-handoff'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'delivery-room-to-nicu-handoff').length === 1
    && scenario.timeline.filter((event) => event.target === 'delivery-room-to-nicu-handoff-boundary').length === 1,
    assessment: (r) => r?.neonatologyNicuHandoffAssessment,
    Component: NeonatologyNicuHandoffTray as LessonTray['Component'],
  },
  {
    id: 'NeonatologyTensionPneumothorax',
    demoId: 'TensionPneumothorax',
    actionType: 'neonatal-tension-pneumothorax-response',
    supports: (scenario) => scenario.metadata.id === 'neonatal-tension-pneumothorax'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'neonatal-tension-pneumothorax').length === 1
    && scenario.timeline.filter((event) => event.target === 'neonatal-tension-pneumothorax-boundary').length === 1,
    assessment: (r) => r?.neonatologyTensionPneumothoraxAssessment,
    Component: NeonatologyTensionPneumothoraxTray as LessonTray['Component'],
  },
];
