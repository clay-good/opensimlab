import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricInjurySafeguardingProgress } from '../pediatric-injury-safeguarding';

export const PEDIATRIC_INJURY_SAFEGUARDING_TUTOR_VERSION = '0.1.0';

export interface PediatricInjurySafeguardingPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * This is the only lesson in the module where the restraint is not only
 * clinical: the learner does not diagnose abuse, does not name a person, does
 * not judge whether a caregiver is telling the truth, does not confront or
 * separate anyone, and does not decide a threshold, a jurisdiction, a referral
 * or a placement. What they do is notice, say so accurately, and hand it to the
 * people whose job it is. It is silent on the unassisted setting, silent once
 * the handoff is recorded, and silent for any scenario version it was not
 * written against.
 */
export function pediatricInjurySafeguardingInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricInjurySafeguardingProgress },
): PediatricInjurySafeguardingPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('psg-trajectory', true,
    'Read what was recorded, and keep it separate from what it might mean.',
    'A previously well two-year-old, walking and running independently, brought in about two hours after a reported trip forward onto a carpeted level floor. She is awake, interactive, using age-appropriate speech and play, staying near her caregiver, and physiologically unremarkable. The supplied objective skin description is the part to read carefully and without interpretation: one oval bruise on the posterior left pinna, three separate similarly shaped bruises clustered over the right lateral torso below the axilla, and two small anterior-shin bruises. Note that bruise age is deliberately not inferred from colour, because it cannot reliably be. Shins are where mobile toddlers bruise. Ears and lateral torso are not.');
  if (patient.concernAtTick === null) return prompt('psg-concern', true,
    'Say the true sentence, which is narrower than the one you are tempted to say.',
    'The fixed experienced-team statement is that a single forward carpet fall does not adequately account for this distribution of injuries. That establishes a safeguarding concern requiring further evaluation. It is not a diagnosis of physical abuse, it does not attribute anything to a person, and it is not a ruling on whether her caregiver is telling the truth — and you are recording none of those three. Holding the concern at exactly that width is the skill. Widening it invents a finding nobody has made; narrowing it back into an accident because the child looks well and the caregiver seems plausible is how these are missed.');
  if (patient.safeguardingAtTick === null) return prompt('psg-safeguarding', true,
    'Two things, both owned by other people: the safeguarding process and her safety right now.',
    'Experienced pediatric and safeguarding teams own the evaluation from here, and immediate safety is owned alongside it rather than after it. What you are not doing is as specific as what you are: no confronting the caregiver, no separating her from them, no deciding a reporting threshold, no choosing a jurisdiction or an agency, no submitting a referral or a report, no custody decision and no placement. Those belong to a locally governed multi-agency pathway, and the local part is not a detail — thresholds, agencies and duties genuinely differ, and this lab teaches none of them as the answer.');
  if (patient.alternativesAtTick === null) return prompt('psg-alternatives', true,
    'Keep the medical alternatives genuinely open, and keep the information narrow.',
    'The absences you were handed narrow nothing: no reported bleeding disorder, anticoagulant exposure, chronic illness, recent major trauma or cultural skin practice — and a bleeding condition, an accidental mechanism, a cultural practice, an occult injury and a limitation in the history all stay open, alongside the safeguarding concern rather than instead of it. Two of those deserve saying plainly: a child with a coagulopathy nobody has tested for looks exactly like this, and so does a family whose ordinary practice a clinician has not recognized. On the information: this stays need-to-know rather than confidential, and it is recorded as source-aware — what was observed, and separately what was reported and by whom. You solicit no disclosure and collect no free text.');
  if (patient.laterSafetyAtTick === null) return prompt('psg-later', true,
    'Let time pass, then be careful about what a settled room means.',
    'At the later checkpoint she is still awake, interactive, warm and stable in a supervised clinical setting with named pediatric and safeguarding ownership, and every part of the work is still running: the injury assessment, the medical alternatives, the information gathering, her immediate safety, the risk to any other child at home, and the multi-agency pathway. Nothing has come back. No abuse determination, no perpetrator, no test result, no completed referral, no legal report, no custody action. A stable child in a safe room is genuinely reassuring about this hour and it establishes nothing about the next one — and it is not discharge readiness.');
  return prompt('psg-handoff', true,
    'Hand off a concern, not a conclusion.',
    'What travels is the supplied history exactly as it was given and attributed to who gave it, the objective injury description without inferred dating, why the two do not fit together, that this is a concern requiring evaluation and not a diagnosis, who owns the safeguarding process and who owns her immediate safety, the medical alternatives still open and which would change the picture, the risk to other children at home, what the multi-agency pathway is waiting on, and the information boundary. Nothing here proves abuse, identifies a person, rules on anybody\'s credibility, excludes a medical mimic or an occult injury, proves immediate or durable safety, completes a referral or a legal report, determines custody, disposition or prognosis, or predicts an outcome. Somebody will decide those things. It is not you, and it is not today.');
}
