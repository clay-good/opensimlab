/**
 * obstetrics's action trays, handed to the cockpit by the module's route.
 *
 * Each of these was written inline in `ActionCockpit.tsx` behind a gate computed from the
 * scenario, which meant every module downloaded every one of them. The gate moves here as the
 * tray's `supports` predicate, unchanged, and the cockpit renders whichever tray the scenario
 * matches without naming a lesson.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { ObstetricsAfeTray } from './ObstetricsAfeTray';
import { ObstetricsAtonyTray } from './ObstetricsAtonyTray';
import { ObstetricsConcealedAbruptionTray } from './ObstetricsConcealedAbruptionTray';
import { ObstetricsEclampsiaTray } from './ObstetricsEclampsiaTray';
import { ObstetricsMaternalSepsisTray } from './ObstetricsMaternalSepsisTray';
import { ObstetricsPostpartumPreeclampsiaTray } from './ObstetricsPostpartumPreeclampsiaTray';

import { ObstetricsMaternalArrestTray } from './ObstetricsMaternalArrestTray';
import { ObstetricsShoulderDystociaTray } from './ObstetricsShoulderDystociaTray';
import { ObstetricsCordProlapseTray } from './ObstetricsCordProlapseTray';
import { ObstetricsUterineRuptureTray } from './ObstetricsUterineRuptureTray';
import { ObstetricsMagnesiumToxicityTray } from './ObstetricsMagnesiumToxicityTray';
import { ObstetricsHighNeuraxialTray } from './ObstetricsHighNeuraxialTray';
import { ObstetricsFailedIntubationTray } from './ObstetricsFailedIntubationTray';
import { ObstetricsMaternalNeonatalHandoffTray } from './ObstetricsMaternalNeonatalHandoffTray';
import { ObstetricsOxytocinTachysystoleTray } from './ObstetricsOxytocinTachysystoleTray';

export const OBSTETRICS_TRAYS: readonly LessonTray[] = [
  {
    id: 'ObstetricsAfe',
    demoId: 'Afe',
    actionType: 'suspected-amniotic-fluid-embolism-pattern-response',
    supports: (scenario) => scenario.metadata.id === 'suspected-amniotic-fluid-embolism-pattern'
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'suspected-amniotic-fluid-embolism-pattern-transition')
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'suspected-amniotic-fluid-embolism-pattern-transition-boundary'),
    assessment: (r) => r?.obstetricsAfeAssessment,
    Component: ObstetricsAfeTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsAtony',
    demoId: 'Atony',
    actionType: 'postpartum-hemorrhage-uterine-atony-response',
    supports: (scenario) => scenario.metadata.id === 'postpartum-hemorrhage-uterine-atony'
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'postpartum-hemorrhage-uterine-atony-transition')
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'postpartum-hemorrhage-uterine-atony-transition-boundary'),
    assessment: (r) => r?.obstetricsAtonyAssessment,
    Component: ObstetricsAtonyTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsConcealedAbruption',
    demoId: 'ConcealedAbruption',
    actionType: 'concealed-placental-abruption-hemorrhage-response',
    supports: (scenario) => scenario.metadata.id === 'concealed-placental-abruption-hemorrhage'
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'concealed-placental-abruption-hemorrhage-transition')
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'concealed-placental-abruption-hemorrhage-transition-boundary'),
    assessment: (r) => r?.obstetricsConcealedAbruptionAssessment,
    Component: ObstetricsConcealedAbruptionTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsEclampsia',
    demoId: 'Eclampsia',
    actionType: 'eclampsia-first-seizure-response',
    supports: (scenario) => scenario.metadata.id === 'eclampsia-first-seizure-response'
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'eclampsia-first-seizure-response-transition')
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'eclampsia-first-seizure-response-transition-boundary'),
    assessment: (r) => r?.obstetricsEclampsiaAssessment,
    Component: ObstetricsEclampsiaTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsMaternalSepsis',
    demoId: 'MaternalSepsis',
    actionType: 'maternal-sepsis-postpartum-deterioration-response',
    supports: (scenario) => scenario.metadata.id === 'maternal-sepsis-postpartum-deterioration'
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'maternal-sepsis-postpartum-deterioration-transition')
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'maternal-sepsis-postpartum-deterioration-transition-boundary'),
    assessment: (r) => r?.obstetricsMaternalSepsisAssessment,
    Component: ObstetricsMaternalSepsisTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsPostpartumPreeclampsia',
    demoId: 'PostpartumPreeclampsia',
    actionType: 'postpartum-severe-preeclampsia-warning-signs-response',
    supports: (scenario) => scenario.metadata.id === 'postpartum-severe-preeclampsia-warning-signs'
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'postpartum-severe-preeclampsia-warning-signs-transition')
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'postpartum-severe-preeclampsia-warning-signs-transition-boundary'),
    assessment: (r) => r?.obstetricsPostpartumPreeclampsiaAssessment,
    Component: ObstetricsPostpartumPreeclampsiaTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsMaternalArrest',
    demoId: 'MaternalArrest',
    actionType: 'maternal-cardiac-arrest-response',
    supports: (scenario) => scenario.metadata.id === 'maternal-cardiac-arrest-coordinated-response'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'maternal-cardiac-arrest-coordinated-response-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'maternal-cardiac-arrest-coordinated-response-transition-boundary').length === 1,
    assessment: (r) => r?.obstetricsMaternalArrestAssessment,
    Component: ObstetricsMaternalArrestTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsShoulderDystocia',
    demoId: 'ShoulderDystocia',
    actionType: 'shoulder-dystocia-cognitive-sequence-response',
    supports: (scenario) => scenario.metadata.id === 'shoulder-dystocia-cognitive-sequence'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'shoulder-dystocia-cognitive-sequence-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'shoulder-dystocia-cognitive-sequence-transition-boundary').length === 1,
    assessment: (r) => r?.obstetricsShoulderDystociaAssessment,
    Component: ObstetricsShoulderDystociaTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsCordProlapse',
    demoId: 'CordProlapse',
    actionType: 'umbilical-cord-prolapse-urgent-birth-coordination-response',
    supports: (scenario) => scenario.metadata.id === 'umbilical-cord-prolapse-urgent-birth-coordination'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'umbilical-cord-prolapse-urgent-birth-coordination-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'umbilical-cord-prolapse-urgent-birth-coordination-transition-boundary').length === 1,
    assessment: (r) => r?.obstetricsCordProlapseAssessment,
    Component: ObstetricsCordProlapseTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsUterineRupture',
    demoId: 'UterineRupture',
    actionType: 'suspected-uterine-rupture-recognition-response',
    supports: (scenario) => scenario.metadata.id === 'suspected-uterine-rupture-recognition'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'suspected-uterine-rupture-recognition-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'suspected-uterine-rupture-recognition-transition-boundary').length === 1,
    assessment: (r) => r?.obstetricsUterineRuptureAssessment,
    Component: ObstetricsUterineRuptureTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsMagnesiumToxicity',
    demoId: 'MagnesiumToxicity',
    actionType: 'magnesium-sulfate-toxicity-recognition-response',
    supports: (scenario) => scenario.metadata.id === 'magnesium-sulfate-toxicity-recognition'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'magnesium-sulfate-toxicity-recognition-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'magnesium-sulfate-toxicity-recognition-transition-boundary').length === 1,
    assessment: (r) => r?.obstetricsMagnesiumToxicityAssessment,
    Component: ObstetricsMagnesiumToxicityTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsHighNeuraxial',
    demoId: 'HighNeuraxial',
    actionType: 'high-neuraxial-block-obstetric-coordination-response',
    supports: (scenario) => scenario.metadata.id === 'high-neuraxial-block-obstetric-coordination'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'high-neuraxial-block-obstetric-coordination-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'high-neuraxial-block-obstetric-coordination-transition-boundary').length === 1,
    assessment: (r) => r?.obstetricsHighNeuraxialAssessment,
    Component: ObstetricsHighNeuraxialTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsFailedIntubation',
    demoId: 'FailedIntubation',
    actionType: 'failed-obstetric-intubation-oxygenation-first-response',
    supports: (scenario) => scenario.metadata.id === 'failed-obstetric-intubation-oxygenation-first'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'failed-obstetric-intubation-oxygenation-first-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'failed-obstetric-intubation-oxygenation-first-transition-boundary').length === 1,
    assessment: (r) => r?.obstetricsFailedIntubationAssessment,
    Component: ObstetricsFailedIntubationTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsMaternalNeonatalHandoff',
    demoId: 'MaternalNeonatalHandoff',
    actionType: 'maternal-to-neonatal-resuscitation-handoff-response',
    supports: (scenario) => scenario.metadata.id === 'maternal-to-neonatal-resuscitation-handoff'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'maternal-to-neonatal-resuscitation-handoff-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'maternal-to-neonatal-resuscitation-handoff-transition-boundary').length === 1,
    assessment: (r) => r?.obstetricsMaternalNeonatalHandoffAssessment,
    Component: ObstetricsMaternalNeonatalHandoffTray as LessonTray['Component'],
  },
  {
    id: 'ObstetricsOxytocinTachysystole',
    demoId: 'OxytocinTachysystole',
    actionType: 'oxytocin-associated-uterine-tachysystole-response',
    supports: (scenario) => scenario.metadata.id === 'oxytocin-associated-uterine-tachysystole'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'oxytocin-associated-uterine-tachysystole-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'oxytocin-associated-uterine-tachysystole-transition-boundary').length === 1,
    assessment: (r) => r?.obstetricsOxytocinTachysystoleAssessment,
    Component: ObstetricsOxytocinTachysystoleTray as LessonTray['Component'],
  },
];
