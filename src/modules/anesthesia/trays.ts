/**
 * anesthesia's action trays, handed to the cockpit by the module's route.
 *
 * Each was written inline in `ActionCockpit.tsx` behind a gate computed from the scenario,
 * which meant every module downloaded every one of them. The gate moves here as the tray's
 * `supports` predicate, unchanged.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { AspirationRiskTray } from './AspirationRiskTray';
import { CiedPlanningTray } from './CiedPlanningTray';
import { PostoperativeHandoffTray } from './PostoperativeHandoffTray';
import { DelayedEmergenceTray } from './DelayedEmergenceTray';
import { ExtubationReadinessTray } from './ExtubationReadinessTray';

export const ANESTHESIA_TRAYS: readonly LessonTray[] = [
  {
    id: 'AspirationRisk',
    actionType: 'aspiration-risk-assessment',
    supports: (scenario) => scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'aspiration-risk-recognition',
    ),
    assessment: (r) => r?.aspirationRiskAssessment,
    Component: AspirationRiskTray as LessonTray['Component'],
  },
  {
    id: 'CiedPlanning',
    actionType: 'cied-planning-assessment',
    supports: (scenario) => scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'cied-cautery-planning',
    ),
    assessment: (r) => r?.ciedPlanningAssessment,
    Component: CiedPlanningTray as LessonTray['Component'],
  },
  {
    id: 'PostoperativeHandoff',
    actionType: 'postoperative-handoff-assessment',
    supports: (scenario) => scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'postoperative-handoff',
    ),
    assessment: (r) => r?.postoperativeHandoffAssessment,
    Component: PostoperativeHandoffTray as LessonTray['Component'],
  },
  {
    id: 'DelayedEmergence',
    actionType: 'delayed-emergence-assessment',
    supports: (scenario) => scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'delayed-emergence-differential',
    ),
    assessment: (r) => r?.delayedEmergenceAssessment,
    Component: DelayedEmergenceTray as LessonTray['Component'],
  },
  {
    id: 'ExtubationReadiness',
    actionType: 'extubation-readiness-assessment',
    supports: (scenario) => scenario.timeline.some(
      (event) => event.type === 'narrative' && event.target === 'extubation-readiness',
    ),
    assessment: (r) => r?.extubationReadinessAssessment,
    Component: ExtubationReadinessTray as LessonTray['Component'],
  },
];
