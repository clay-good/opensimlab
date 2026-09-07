import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PersistentVfProgress } from '../persistent-vf-arrest';

export const PERSISTENT_VF_TUTOR_VERSION = '0.1.0';

export interface PersistentVfPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the third shock. Two have already failed, the
 * learner has just taken the arrest over, and the defibrillator is the thing in
 * the room that feels like doing something. The lesson is that a shock is not a
 * treatment applied to a rhythm, it is a treatment applied to a muscle: it has
 * to land on a heart that has been perfused, and the case says so in the only
 * way a model can, by refusing to convert unless it has been.
 *
 * The correction beat reads which of the three conditions the last shock was
 * missing rather than saying "that did not work", because "that did not work"
 * is what the monitor already said.
 *
 * It is silent on the unassisted setting, silent before the arrest, silent once
 * the bounded case has converted, and silent for any scenario version it was
 * not written against.
 */
export function persistentVfInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PersistentVfProgress },
): PersistentVfPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.roscAtTick != null) return null;
  if (!patient.cardiacArrestActive) return null;

  const compressing = patient.chestCompressionsActive === true;
  const compressed = (patient.chestCompressionSeconds ?? 0) > 0 || compressing;
  const dosed = (patient.arrestEpinephrineTotalMg ?? 0) >= 1;
  const shocked = (patient.defibrillationShockCount ?? 0) > 0;
  const underEnergy = shocked && patient.lastDefibrillationEnergyJ !== 200;

  const prompt = (id: string, suggestion: string, because: string) => ({ id, suggestion, because });

  if (!compressed) return prompt('vf-compressions',
    'Compressions first, not a third shock.',
    'Two shocks have already failed on this heart, and the reason a third one on its own is unlikely to do better is that nothing has changed about the muscle in between. Defibrillation does not restart a heart; it stops everything at once and leaves the pacemaker to restart it, and a myocardium with no coronary flow for the last minute has very little left to restart with. Compressions are what change that. The pause at handoff is the one interruption in this whole arrest that you personally control.');
  if (underEnergy) return prompt('vf-energy',
    'The setting, not the effort. This device declares 200 J.',
    `The last shock went out at ${patient.lastDefibrillationEnergyJ} J and did not convert. Energy is a property of the device, not a measure of how hard the case is being tried: the number that belongs to a defibrillator comes from its manufacturer's testing of that waveform, and choosing below it because the rhythm has been stubborn treats the dial as an expression of urgency. This case declares 200 J. On a real device you use what the manufacturer specifies, and if you do not know it, the maximum.`);
  if (!compressing) return prompt('vf-resume-compressions',
    'Compressions are paused. Restart them before the next shock.',
    'This case checks the last ten seconds before it will convert, which is a model of something real: the longer the pause before a shock, the less likely it lands. The way that is done at the bedside is to charge while compressions continue and clear only for the moment of delivery, so the hands-off time is a second or two rather than the ten or fifteen a careful, sequential team accidentally takes.');
  if (!dosed) return prompt('vf-epinephrine',
    'One milligram, IV or IO, while the compressions keep running.',
    'In a shockable arrest the drug comes after shocks have failed rather than before them, which is where this case has picked you up: two are already spent. Giving it during compressions is the point — a drug in a peripheral vein has not reached the heart until something is circulating it. This bounded case accepts exactly one dose; the real algorithm repeats it every three to five minutes, and the antiarrhythmic that would also be in play by now is not modeled here.');
  if (shocked) return prompt('vf-shock-again',
    'Now the same shock, with the conditions it needs in place.',
    'The last one was delivered at the declared setting and still did not convert, because one of the three things this case checks was missing at the time. All three are true now. This is a deterministic teaching case: it converts because the model says so under stated conditions, and that is a statement about the model rather than a prediction about any person.');
  return prompt('vf-shock',
    'Now the shock, at the declared 200 J.',
    'Compressions are running and the dose is in, which is what makes this attempt different from the two that failed before you arrived. Clear for the delivery and no longer. What follows in this case is a modeled organized rhythm under stated conditions — not a prediction about a person, and not the end of anything: post-arrest care is entirely outside this vignette.');
}
