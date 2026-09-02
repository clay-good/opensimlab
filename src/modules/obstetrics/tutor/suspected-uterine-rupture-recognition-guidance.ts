import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UterineRuptureProgress } from '../suspected-uterine-rupture-recognition';

export const UTERINE_RUPTURE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a diagnosis that only the operation can make.
 *
 * Nothing at the bedside will confirm a uterine rupture, so waiting to be sure
 * means waiting for the laparotomy — which is exactly the thing the waiting
 * delays. The error this lesson refuses is treating "suspected" as a weaker
 * state that justifies more looking. What is here is a coupled pattern rather
 * than a classic triad: a prior scar, pain that persists between contractions,
 * a fetal heart at 72, station lost from -1 to -3, efficient contractions that
 * stopped, and new bleeding. None of these prompts examines her, interprets
 * the fetal monitoring, or selects an anesthetic, a birth, a repair or a
 * hysterectomy.
 */
export function uterineRuptureInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly uterineRupture?: UterineRuptureProgress;
}) {
  const patient = input.uterineRupture;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('rupture-support', true,
    'Call for the theatre on the suspicion, because nothing here will upgrade it.',
    'A uterine rupture is confirmed by opening the abdomen and not before, so waiting to be certain means waiting for the operation that the waiting is delaying. Category-1 surgery, anesthesia, blood, the newborn team, a leader, communication and support all start now. She is pale and frightened and asking what is happening; someone whose job is to talk to her is part of this response.');
  if (patient.contextAtTick === null) return prompt('rupture-context', true,
    'Read the findings as one coupled pattern rather than a list.',
    'One prior low-transverse caesarean, sudden severe pain that persists between contractions, a fetal heart that has fallen to 72, station lost from -1 to -3, efficient uterine activity that simply stopped, 60 mL of new bleeding, scar tenderness, and a mother at 118 and 96/58. Any one of those has other explanations. Together, and appearing together twelve minutes ago, they are the pattern.');
  if (patient.uncertaintyAtTick === null) return prompt('rupture-uncertainty', true,
    'Keep it suspected, and keep the alternatives alive while you act on it.',
    'The classic triad is neither necessary nor reliable — the abnormal fetal heart rate is the most consistent sign and even it is not specific, and loss of station is suggestive rather than diagnostic. Placental abruption, a fetal or vascular cause, a surgical complication and non-obstetric explanations all stay open. Acting on a suspicion at full urgency and holding it as a suspicion are the same posture here rather than opposite ones.');
  if (patient.readinessAtTick === null) return prompt('rupture-readiness', true,
    'Let the readiness run in parallel rather than in sequence.',
    'Maternal resuscitation and hemorrhage readiness, fetal and newborn readiness, the surgical and anesthetic preparation, and the conversation with her all proceed at once, because arranging any of them after the others costs the same minutes. The fertility question belongs in that conversation before theatre rather than after, since what happens to her uterus may be decided while she is asleep.');
  if (patient.reassessmentAtTick === null) return prompt('rupture-reassess', false,
    'Read the fixed report as this case rather than as a trajectory.',
    'It describes worsening and a laparotomy that has started. It is a contrast rather than a prediction, and it confirms nothing about what will be found.');
  return prompt('rupture-handoff', true,
    'Hand off a suspicion that is still a suspicion and an operation that has just begun.',
    'The abdomen is open and nothing is settled: no operative confirmation, no controlled bleeding, no known total loss, no fetal condition, no treatment effect. The shock, the hidden bleeding, the fetal compromise, the surgical decisions including the ones about her fertility, the newborn team, what she will remember of this, the record, and the review that follows all travel with them.');
}
