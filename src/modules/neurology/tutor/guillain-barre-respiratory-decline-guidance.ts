import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { GbsProgress } from '../guillain-barre-respiratory-decline';

export const GBS_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a story so typical it stops people looking.
 *
 * The myasthenic lesson next door shares the saturation trap, and this one adds
 * two things it does not have. The first is a mimic that has to be excluded
 * before the obvious answer is allowed: ascending weakness with areflexia is
 * also what a cord lesion looks like, and the findings that argue against it
 * here — preserved sensation, no sensory level, no extensor plantar — are worth
 * saying rather than assuming. The second is dysautonomia, a third axis of risk
 * running alongside the breathing and the bulbar failure, where the instruction
 * is to monitor rather than to chase: a rate between 48 and 138 and a pressure
 * between 88/52 and 188/110 is a reason for cardiac ownership, not a list of
 * numbers to treat one at a time. None of these prompts measures mechanics,
 * takes a gas or CSF, interprets the monitor, or selects a drug, dose, oxygen,
 * ventilation, airway, rhythm or pressure treatment.
 */
export function gbsInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly gbs?: GbsProgress;
}) {
  const patient = input.gbs;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('gbs-trajectory', true,
    'Measure this in days rather than in findings, because the speed is the risk.',
    'He walked yesterday morning, needed two people last night, and now cannot stand or lift either arm — forty-eight hours of ascending symmetric weakness after diarrhoea a fortnight ago. Facial diplegia, neck flexion weakness, mild dysphagia, short-phrase speech and a weak cough put the bulbar muscles in it too, and a rate of 112 with shallow breathing at 24 belongs to the same picture. How fast this has climbed is what predicts where it goes next.');
  if (patient.evidenceAtTick === null) return prompt('gbs-evidence', true,
    'Ask what else does this, before the obvious answer is allowed to close.',
    'A CSF protein of 86 with 3 cells and a demyelinating nerve-conduction pattern support the picture and do not make any one test diagnostic. The mimic that matters is a cord lesion, because ascending weakness with absent reflexes is also what that looks like — and what argues against it here is worth saying out loud: sensation preserved enough for him to report tingling, no sensory level, no extensor plantar. Brainstem, junctional, motor-neuron, toxic, metabolic, infectious and inflammatory causes all stay open.');
  if (patient.recognitionAtTick === null) return prompt('gbs-recognition', true,
    'Call this a high-risk respiratory decline while the saturation is still 98%.',
    'The vital capacity has gone from 3.6 to 2.4 litres, the single-breath count from 28 to 18, and the maximal inspiratory pressure from -45 to -30, all in twelve hours — and the blood gas is entirely normal, because in neuromuscular failure it is normal until it is not. No score and no single cutoff carries this decision: what carries it is the slope, plus a cough and a swallow that are already failing.');
  if (patient.ownershipAtTick === null) return prompt('gbs-ownership', true,
    'Bring neurocritical care, respiratory, an airway-capable owner and cardiac monitoring in together.',
    'The cardiac piece is the part that gets left off. A monitored hour with sinus rates from 58 to 126 and pressures from 96/58 to 176/104 is labile autonomic function, which is its own cause of death in this disease and is a reason to watch him continuously rather than a set of readings to correct one by one. Provoking or automatically treating each value is the failure mode; ownership and monitoring are the response.');
  if (patient.laterAtTick === null) return prompt('gbs-later', false,
    'Record the ownership, let the interval pass, and read the 4-hour report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual patient does next.');
  return prompt('gbs-handoff', true,
    'Hand off three problems, not one.',
    'He cannot lift his head, speaks one word per breath, has a barely audible cough and needs continuous help clearing saliva; the vital capacity is 1.5 litres, the single-breath count 8, the PaCO2 only 46 — and the saturation is still 96%. Meanwhile the captured interval swings between 48 and 138 beats and between 88/52 and 188/110. The airway, the ventilation and the dysautonomia each travel with him, and so do the treatment decision, the recurrence risk and a diagnosis that is still probable rather than proven.');
}
