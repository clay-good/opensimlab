import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PeaArrestProgress } from '../pea-arrest';

export const PEA_ARREST_TUTOR_VERSION = '0.1.0';

export interface PeaArrestPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the defibrillator. Every other arrest this
 * learner has practised put a shock at the front, and here the monitor is
 * showing complexes that look like a rhythm worth shocking. The lesson is that
 * the picture on the screen is not the question — whether it is moving blood
 * is — and that the answer changes which pathway the next four minutes belong
 * to.
 *
 * It is silent on the unassisted setting, silent before the arrest, silent once
 * compressions are running with the dose given, and silent for any scenario
 * version it was not written against.
 *
 * The shock correction displaces the current beat rather than being appended
 * after the last one. A tutor advises the next decision; it does not grade a
 * finished run. Once the run is complete the debrief is what says a shock was
 * delivered to a non-shockable rhythm, and it says so whether or not the tutor
 * was ever switched on.
 */
export function peaArrestInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PeaArrestProgress },
): PeaArrestPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (!patient.cardiacArrestActive) return null;

  const compressing = patient.chestCompressionsActive === true;
  const compressed = (patient.chestCompressionSeconds ?? 0) > 0 || compressing;
  const dosed = (patient.arrestEpinephrineTotalMg ?? 0) >= 1;
  if (compressing && dosed) return null;

  const prompt = (id: string, suggestion: string, because: string) => ({ id, suggestion, because });

  if ((patient.defibrillationShockCount ?? 0) > 0) return prompt('pa-nonshockable',
    'That rhythm does not take a shock. Go back to compressions.',
    'A shock works by stopping a heart that is quivering out of step with itself, so that the pacemaker can restart it in step. There is nothing here to stop: the electrical order is already normal and the muscle is not answering it. The shock cost a pause in compressions, which is the one thing in this room that is currently moving blood, and it bought nothing. PEA and asystole are the non-shockable half of the algorithm for that reason, not as a convention.');
  if (!compressed) return prompt('pa-compressions',
    'Compressions now. The monitor is not the patient.',
    'Organized complexes with no pulse is the finding, and it is a finding about the muscle, not the wiring. Nothing on the screen will change until something moves blood, and the only thing here that does is your hands. Every second before the first compression is a second of no flow to a brain that is already without it, which is why the objective is written in seconds. The engine models a fixed 110 per minute and nothing about depth, recoil or fatigue — the real thing is harder than this button.');
  if (!compressing) return prompt('pa-resume-compressions',
    'Compressions are paused. Restart them.',
    'The dose is not the treatment; the flow is what carries it to a coronary artery. Epinephrine given into a chest nobody is compressing goes as far as the vein it was injected into. Restart, and keep the pause for anything else as short as you can make it.');
  if (!dosed) return prompt('pa-epinephrine',
    'One milligram, IV or IO, early — while the compressions keep running.',
    'Non-shockable arrest is the case where the timing of epinephrine is least argued about: there is no shock to wait for, so as soon as access exists is as good as the answer gets, and the observational evidence for earlier being better is strongest here. The point of giving it during compressions is circulation — a drug sitting in a peripheral vein is not a drug that has reached the heart. This bounded case accepts exactly one dose; the real algorithm repeats it every three to five minutes, and none of the rest of that algorithm — the reversible causes you would be working through in parallel — is modeled here.');
  return null;
}
