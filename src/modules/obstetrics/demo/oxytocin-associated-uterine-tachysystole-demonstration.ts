import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsOxytocinTachysystole, type OxytocinTachysystoleAction, type OxytocinTachysystoleProgress,
} from '../oxytocin-associated-uterine-tachysystole';
import { oxytocinTachysystoleInlinePrompt } from '../tutor/oxytocin-associated-uterine-tachysystole-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: OxytocinTachysystoleProgress): string {
  const prompt = oxytocinTachysystoleInlinePrompt('guided', { scenarioVersion: '0.1.0', oxytocinTachysystole: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const OXYTOCIN_TACHYSYSTOLE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsOxytocinTachysystoleDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsOxytocinTachysystole(scenario);
}

export interface OxytocinTachysystoleDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: OxytocinTachysystoleAction; readonly finished?: boolean;
}

/**
 * The worked example for a complication somebody caused.
 *
 * The drug that produced this is still running, so the interval spent
 * interpreting is an interval the fetus spends under the same contractions.
 * This example examines and palpates nobody, operates no infusion, changes no
 * position, delivers no oxygen or fluid, and plans no birth.
 */
export function oxytocinTachysystoleDemonstrationStep(
  patient?: OxytocinTachysystoleProgress,
): OxytocinTachysystoleDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with a fetus that is better and a cause that could be repeated. Nothing was proven and nothing was excluded — not durable fetal safety, not the other explanations, not whether this labour ends the way she hoped. This ends the example, not the labour.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-oxytocin-tachysystole-qualified-obstetric-fetal-and-support-response',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-oxytocin-tachysystole-infusion-contraction-fetal-maternal-and-whole-person-context',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.46, action: 'recognize-obstetrics-oxytocin-tachysystole-with-fetal-heart-deterioration-without-single-trace-closure',
      narration: narrate(patient) };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.64, action: 'review-obstetrics-oxytocin-tachysystole-qualified-source-stop-position-cause-and-birth-readiness',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-oxytocin-tachysystole-fixed-six-minute-qualified-recovery-report',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-oxytocin-tachysystole-recurrence-fetal-birth-medication-maternal-and-outcome-risk',
    narration: narrate(patient) };
}
