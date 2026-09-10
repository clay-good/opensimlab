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
];
