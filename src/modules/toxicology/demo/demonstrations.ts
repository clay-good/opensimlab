/**
 * toxicology's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/toxicology.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { acetaminophenDemonstrationStep, supportsAcetaminophenDemonstration } from './acetaminophen-clock-and-nomogram-demonstration';
import { anticholinergicDemonstrationStep, supportsAnticholinergicDemonstration } from './anticholinergic-hyperthermia-delirium-demonstration';
import { betaBlockerDemonstrationStep, supportsBetaBlockerDemonstration } from './beta-blocker-cardiogenic-shock-demonstration';
import { calciumChannelBlockerDemonstrationStep, supportsCalciumChannelBlockerDemonstration } from './calcium-channel-blocker-shock-demonstration';
import { carbonMonoxideDemonstrationStep, supportsCarbonMonoxideDemonstration } from './carbon-monoxide-reassuring-monitor-demonstration';
import { cholinergicDemonstrationStep, supportsCholinergicDemonstration } from './cholinergic-pesticide-respiratory-failure-demonstration';
import { delayedLastDemonstrationStep, supportsDelayedLastDemonstration } from './delayed-local-anesthetic-cns-cardiac-toxicity-demonstration';
import { digoxinDemonstrationStep, supportsDigoxinDemonstration } from './digoxin-rhythm-potassium-demonstration';
import { methanolDemonstrationStep, supportsMethanolDemonstration } from './methanol-visual-acidosis-gaps-demonstration';
import { methemoglobinemiaDemonstrationStep, supportsMethemoglobinemiaDemonstration } from './methemoglobinemia-saturation-gap-demonstration';
import { opioidXylazineDemonstrationStep, supportsOpioidXylazineDemonstration } from './opioid-xylazine-persistent-sedation-demonstration';
import { salicylateDemonstrationStep, supportsSalicylateDemonstration } from './salicylate-falling-number-demonstration';
import { serotoninDemonstrationStep, supportsSerotoninDemonstration } from './serotonin-toxicity-hyperthermia-clonus-demonstration';
import { supportsSympathomimeticDemonstration, sympathomimeticDemonstrationStep } from './sympathomimetic-hyperadrenergic-hyperthermia-demonstration';
import { supportsTricyclicDemonstration, tricyclicDemonstrationStep } from './tricyclic-sodium-channel-cardiotoxicity-demonstration';

export const TOXICOLOGY_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'Acetaminophen', supports: supportsAcetaminophenDemonstration, actionType: 'acetaminophen-clock-and-nomogram-response', step: (r) => acetaminophenDemonstrationStep(r?.toxicologyAcetaminophenAssessment) },
  { id: 'Anticholinergic', supports: supportsAnticholinergicDemonstration, actionType: 'anticholinergic-hyperthermia-delirium-response', step: (r) => anticholinergicDemonstrationStep(r?.toxicologyAnticholinergicAssessment) },
  { id: 'BetaBlocker', supports: supportsBetaBlockerDemonstration, actionType: 'beta-blocker-cardiogenic-shock-response', step: (r) => betaBlockerDemonstrationStep(r?.toxicologyBetaBlockerAssessment) },
  { id: 'CalciumChannelBlocker', supports: supportsCalciumChannelBlockerDemonstration, actionType: 'calcium-channel-blocker-shock-response', step: (r) => calciumChannelBlockerDemonstrationStep(r?.toxicologyCalciumChannelBlockerAssessment) },
  { id: 'CarbonMonoxide', supports: supportsCarbonMonoxideDemonstration, actionType: 'carbon-monoxide-reassuring-monitor-response', step: (r) => carbonMonoxideDemonstrationStep(r?.toxicologyCarbonMonoxideAssessment) },
  { id: 'Cholinergic', supports: supportsCholinergicDemonstration, actionType: 'cholinergic-pesticide-respiratory-failure-response', step: (r) => cholinergicDemonstrationStep(r?.toxicologyCholinergicAssessment) },
  { id: 'DelayedLast', supports: supportsDelayedLastDemonstration, actionType: 'delayed-local-anesthetic-cns-cardiac-toxicity-response', step: (r) => delayedLastDemonstrationStep(r?.toxicologyDelayedLastAssessment) },
  { id: 'Digoxin', supports: supportsDigoxinDemonstration, actionType: 'digoxin-rhythm-potassium-response', step: (r) => digoxinDemonstrationStep(r?.toxicologyDigoxinAssessment) },
  { id: 'Methanol', supports: supportsMethanolDemonstration, actionType: 'methanol-visual-acidosis-gaps-response', step: (r) => methanolDemonstrationStep(r?.toxicologyMethanolAssessment) },
  { id: 'Methemoglobinemia', supports: supportsMethemoglobinemiaDemonstration, actionType: 'methemoglobinemia-saturation-gap-response', step: (r) => methemoglobinemiaDemonstrationStep(r?.toxicologyMethemoglobinemiaAssessment) },
  { id: 'OpioidXylazine', supports: supportsOpioidXylazineDemonstration, actionType: 'opioid-xylazine-persistent-sedation-response', step: (r) => opioidXylazineDemonstrationStep(r?.toxicologyOpioidXylazineAssessment) },
  { id: 'Salicylate', supports: supportsSalicylateDemonstration, actionType: 'salicylate-falling-number-response', step: (r) => salicylateDemonstrationStep(r?.toxicologySalicylateAssessment) },
  { id: 'Serotonin', supports: supportsSerotoninDemonstration, actionType: 'serotonin-toxicity-hyperthermia-clonus-response', step: (r) => serotoninDemonstrationStep(r?.toxicologySerotoninAssessment) },
  { id: 'Sympathomimetic', supports: supportsSympathomimeticDemonstration, actionType: 'sympathomimetic-hyperadrenergic-hyperthermia-response', step: (r) => sympathomimeticDemonstrationStep(r?.toxicologySympathomimeticAssessment) },
  { id: 'Tricyclic', supports: supportsTricyclicDemonstration, actionType: 'tricyclic-sodium-channel-cardiotoxicity-response', step: (r) => tricyclicDemonstrationStep(r?.toxicologyTricyclicAssessment) },
];
