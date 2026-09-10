/**
 * toxicology's action trays, handed to the cockpit by the module's route.
 *
 * Each was written inline in `ActionCockpit.tsx` behind a gate computed from the scenario,
 * which meant every module downloaded every one of them. The gate moves here as the tray's
 * `supports` predicate, unchanged.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { ToxicologyMethemoglobinemiaTray } from './ToxicologyMethemoglobinemiaTray';
import { ToxicologyCarbonMonoxideTray } from './ToxicologyCarbonMonoxideTray';
import { ToxicologyAcetaminophenTray } from './ToxicologyAcetaminophenTray';
import { ToxicologySalicylateTray } from './ToxicologySalicylateTray';
import { ToxicologyTricyclicTray } from './ToxicologyTricyclicTray';
import { ToxicologyBetaBlockerTray } from './ToxicologyBetaBlockerTray';
import { ToxicologyCalciumChannelBlockerTray } from './ToxicologyCalciumChannelBlockerTray';
import { ToxicologyDigoxinTray } from './ToxicologyDigoxinTray';
import { ToxicologyCholinergicTray } from './ToxicologyCholinergicTray';
import { ToxicologyAnticholinergicTray } from './ToxicologyAnticholinergicTray';
import { ToxicologySerotoninTray } from './ToxicologySerotoninTray';
import { ToxicologySympathomimeticTray } from './ToxicologySympathomimeticTray';
import { ToxicologyMethanolTray } from './ToxicologyMethanolTray';
import { ToxicologyDelayedLastTray } from './ToxicologyDelayedLastTray';
import { ToxicologyOpioidXylazineTray } from './ToxicologyOpioidXylazineTray';

export const TOXICOLOGY_TRAYS: readonly LessonTray[] = [
  {
    id: 'ToxicologyMethemoglobinemia',
    demoId: 'Methemoglobinemia',
    actionType: 'methemoglobinemia-saturation-gap-response',
    supports: (scenario) => scenario.metadata.id === 'methemoglobinemia-saturation-gap'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'methemoglobinemia-saturation-gap-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'methemoglobinemia-saturation-gap-transition-boundary'),
    assessment: (r) => r?.toxicologyMethemoglobinemiaAssessment,
    Component: ToxicologyMethemoglobinemiaTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologyCarbonMonoxide',
    demoId: 'CarbonMonoxide',
    actionType: 'carbon-monoxide-reassuring-monitor-response',
    supports: (scenario) => scenario.metadata.id === 'carbon-monoxide-reassuring-monitor'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'carbon-monoxide-reassuring-monitor-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'carbon-monoxide-reassuring-monitor-transition-boundary'),
    assessment: (r) => r?.toxicologyCarbonMonoxideAssessment,
    Component: ToxicologyCarbonMonoxideTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologyAcetaminophen',
    demoId: 'Acetaminophen',
    actionType: 'acetaminophen-clock-and-nomogram-response',
    supports: (scenario) => scenario.metadata.id === 'acetaminophen-clock-and-nomogram'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'acetaminophen-clock-and-nomogram-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'acetaminophen-clock-and-nomogram-transition-boundary'),
    assessment: (r) => r?.toxicologyAcetaminophenAssessment,
    Component: ToxicologyAcetaminophenTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologySalicylate',
    demoId: 'Salicylate',
    actionType: 'salicylate-falling-number-response',
    supports: (scenario) => scenario.metadata.id === 'salicylate-falling-number'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'salicylate-falling-number-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'salicylate-falling-number-transition-boundary'),
    assessment: (r) => r?.toxicologySalicylateAssessment,
    Component: ToxicologySalicylateTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologyTricyclic',
    demoId: 'Tricyclic',
    actionType: 'tricyclic-sodium-channel-cardiotoxicity-response',
    supports: (scenario) => scenario.metadata.id === 'tricyclic-sodium-channel-cardiotoxicity'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'tricyclic-sodium-channel-cardiotoxicity-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'tricyclic-sodium-channel-cardiotoxicity-transition-boundary'),
    assessment: (r) => r?.toxicologyTricyclicAssessment,
    Component: ToxicologyTricyclicTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologyBetaBlocker',
    demoId: 'BetaBlocker',
    actionType: 'beta-blocker-cardiogenic-shock-response',
    supports: (scenario) => scenario.metadata.id === 'beta-blocker-cardiogenic-shock'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'beta-blocker-cardiogenic-shock-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'beta-blocker-cardiogenic-shock-transition-boundary'),
    assessment: (r) => r?.toxicologyBetaBlockerAssessment,
    Component: ToxicologyBetaBlockerTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologyCalciumChannelBlocker',
    demoId: 'CalciumChannelBlocker',
    actionType: 'calcium-channel-blocker-shock-response',
    supports: (scenario) => scenario.metadata.id === 'calcium-channel-blocker-shock'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'calcium-channel-blocker-shock-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'calcium-channel-blocker-shock-transition-boundary'),
    assessment: (r) => r?.toxicologyCalciumChannelBlockerAssessment,
    Component: ToxicologyCalciumChannelBlockerTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologyDigoxin',
    demoId: 'Digoxin',
    actionType: 'digoxin-rhythm-potassium-response',
    supports: (scenario) => scenario.metadata.id === 'digoxin-rhythm-potassium'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'digoxin-rhythm-potassium-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'digoxin-rhythm-potassium-transition-boundary'),
    assessment: (r) => r?.toxicologyDigoxinAssessment,
    Component: ToxicologyDigoxinTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologyCholinergic',
    demoId: 'Cholinergic',
    actionType: 'cholinergic-pesticide-respiratory-failure-response',
    supports: (scenario) => scenario.metadata.id === 'cholinergic-pesticide-respiratory-failure'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'cholinergic-pesticide-respiratory-failure-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'cholinergic-pesticide-respiratory-failure-transition-boundary'),
    assessment: (r) => r?.toxicologyCholinergicAssessment,
    Component: ToxicologyCholinergicTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologyAnticholinergic',
    demoId: 'Anticholinergic',
    actionType: 'anticholinergic-hyperthermia-delirium-response',
    supports: (scenario) => scenario.metadata.id === 'anticholinergic-hyperthermia-delirium'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'anticholinergic-hyperthermia-delirium-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'anticholinergic-hyperthermia-delirium-transition-boundary'),
    assessment: (r) => r?.toxicologyAnticholinergicAssessment,
    Component: ToxicologyAnticholinergicTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologySerotonin',
    demoId: 'Serotonin',
    actionType: 'serotonin-toxicity-hyperthermia-clonus-response',
    supports: (scenario) => scenario.metadata.id === 'serotonin-toxicity-hyperthermia-clonus'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'serotonin-toxicity-hyperthermia-clonus-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'serotonin-toxicity-hyperthermia-clonus-transition-boundary'),
    assessment: (r) => r?.toxicologySerotoninAssessment,
    Component: ToxicologySerotoninTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologySympathomimetic',
    demoId: 'Sympathomimetic',
    actionType: 'sympathomimetic-hyperadrenergic-hyperthermia-response',
    supports: (scenario) => scenario.metadata.id === 'sympathomimetic-hyperadrenergic-hyperthermia'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'sympathomimetic-hyperadrenergic-hyperthermia-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'sympathomimetic-hyperadrenergic-hyperthermia-transition-boundary'),
    assessment: (r) => r?.toxicologySympathomimeticAssessment,
    Component: ToxicologySympathomimeticTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologyMethanol',
    demoId: 'Methanol',
    actionType: 'methanol-visual-acidosis-gaps-response',
    supports: (scenario) => scenario.metadata.id === 'methanol-visual-acidosis-gaps'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'methanol-visual-acidosis-gaps-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'methanol-visual-acidosis-gaps-transition-boundary'),
    assessment: (r) => r?.toxicologyMethanolAssessment,
    Component: ToxicologyMethanolTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologyDelayedLast',
    demoId: 'DelayedLast',
    actionType: 'delayed-local-anesthetic-cns-cardiac-toxicity-response',
    supports: (scenario) => scenario.metadata.id === 'delayed-local-anesthetic-cns-cardiac-toxicity'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'delayed-local-anesthetic-cns-cardiac-toxicity-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'delayed-local-anesthetic-cns-cardiac-toxicity-transition-boundary'),
    assessment: (r) => r?.toxicologyDelayedLastAssessment,
    Component: ToxicologyDelayedLastTray as LessonTray['Component'],
  },
  {
    id: 'ToxicologyOpioidXylazine',
    demoId: 'OpioidXylazine',
    actionType: 'opioid-xylazine-persistent-sedation-response',
    supports: (scenario) => scenario.metadata.id === 'opioid-xylazine-persistent-sedation'
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'opioid-xylazine-persistent-sedation-transition')
      && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'opioid-xylazine-persistent-sedation-transition-boundary'),
    assessment: (r) => r?.toxicologyOpioidXylazineAssessment,
    Component: ToxicologyOpioidXylazineTray as LessonTray['Component'],
  },
];
