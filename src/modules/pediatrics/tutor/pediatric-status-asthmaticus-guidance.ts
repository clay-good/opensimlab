import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricStatusAsthmaticusProgress } from '../pediatric-status-asthmaticus';

export const PEDIATRIC_STATUS_ASTHMATICUS_TUTOR_VERSION = '0.1.0';

export interface PediatricStatusAsthmaticusPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps, including their last
 * wrong turn.
 *
 * The failure mode here is not doing too much, as in bronchiolitis, but
 * spending time: a measurement she cannot perform, a film that answers a
 * different question, a trigger conversation that belongs to a calmer hour,
 * and a saturation that says the crisis is over when it is not. It is
 * silent on the unassisted setting, silent once the handoff is recorded, and
 * silent for any scenario version it was not written against.
 */
export function pediatricStatusAsthmaticusInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricStatusAsthmaticusProgress },
): PediatricStatusAsthmaticusPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('psa-trajectory', true,
    'An hour of correct treatment has already happened. Start from what it did not fix.',
    'A ten-year-old with established asthma, one previous PICU admission, and a personal best of 330 L/min. She followed her action plan at home and got worse. On arrival she was speaking one or two words at a time at 89% on air, with marked recession and a PEF of 105 — 32% of her own best, which is a fact about this child rather than a universal threshold. Since then a qualified team has given monitored oxygen, three bronchodilator and antimuscarinic cycles, and early systemic steroid. At minute sixty she is still one-word, still recessing, still poorly moving air, with a heart rate of 154 and a saturation of 93% on oxygen. That is what nonresponse looks like.');
  if (patient.nonresponseAtTick === null) {
    if (patient.lastUnsupportedChoice === 'force-peak-flow') return prompt('psa-peak-flow-refused', true,
      'She cannot do it, and making her try costs her breath.',
      'Peak flow is genuinely useful when a child can perform it comfortably and reliably — and a girl speaking one word at a time cannot. Asking her to take the deepest breath she can and blow it out hard, repeatedly, spends the reserve she is using to stay conscious, and produces a number you could not trust anyway. You already have her arrival PEF of 32% and something better than a repeat: her speech, her mentation, her effort, her air entry, her oxygenation and her circulation. Nothing changed when you chose it, because nothing about her changed.');
    if (patient.lastUnsupportedChoice === 'radiograph-delay') return prompt('psa-radiograph-refused', true,
      'A film answers a question you are not currently asking.',
      'Imaging earns its place when a specific complication or alternative changes what you would do — a pneumothorax, a focal collapse, a foreign body. None of those are reported here: air entry is reduced equally, there is no abrupt choking and no focal asymmetry. What the film would reliably do is move a child in severe nonresponse away from the people escalating her care, for a result that will not change the next step. Nothing changed when you chose it, because nothing about her changed.');
    return prompt('psa-nonresponse', true,
      'Say plainly that first-line treatment has not worked.',
      'Recording severe nonresponse is what turns an hour of correct care into a decision. Everything reasonable has been delivered and she is still one-word, still recessing, still moving air poorly. Note what is reassuring and what it does not mean: she is alert rather than drowsy, there is no quiet chest, no weakening effort, no apnea, no shock and no pulse loss — which tells you she has not arrived at respiratory failure, not that she is safe from it. The fixed absences also narrow rather than exclude foreign body, anaphylaxis, upper-airway disease, infection, pneumothorax, mucus plugging and treatment toxicity, and if allergic features emerge, anaphylaxis care must not wait behind this pathway.');
  }
  if (patient.escalationAtTick === null) return prompt('psa-escalation', true,
    'Get pediatric critical care and airway-capable people here now.',
    'She has failed first-line treatment in front of you, and the escalation is warranted by that alone — you are not waiting for her to deteriorate further to justify the call. Activating ownership is not performing anything: no drug, dose, route, concentration, interval, intravenous access, infusion, device, setting, ventilation, airway maneuver, intubation, sedation or paralysis is chosen or delivered by you. The point of calling early is that the people who can do those things are present before the moment they are needed.');
  if (patient.secondLineIntentAtTick === null) {
    if (patient.lastUnsupportedChoice === 'trigger-review-delay') return prompt('psa-trigger-refused', true,
      'Those questions matter. They do not belong in this hour.',
      'Controller access, adherence, triggers and the barriers behind them are real, patient-centered questions, and the answers may be why she is here at all — but they are asked without blame, later, by someone with the time to listen properly. Right now she is in severe nonresponse and every minute spent on history is a minute not spent on the second-line plan. This is a sequencing judgment rather than a dismissal: the conversation is owed to her, just not while she is speaking one word at a time. Nothing changed when you chose it, because nothing about her changed.');
    return prompt('psa-second-line', true,
      'Record experienced-team ownership of the second-line plan, and monitoring with it.',
      'The supplied second-line care belongs to the qualified team: the agent, the dose, the concentration, the route, the interval, the access and the infusion are all theirs, and none of them are yours to choose. What you are recording is that somebody experienced owns this plan and that she is being monitored closely enough to see it work or fail. In a child this sick, naming the owner and the monitoring is the intervention available to you.');
  }
  if (patient.laterResponseAtTick === null) return prompt('psa-later', true,
    'Let time pass, then read the whole child again rather than the best number.',
    'It is fixed and strictly later. Compare like with like: her speech, her mentation, her effort, her air entry, her oxygenation and her heart rate against where they were at minute sixty. A partial response is a real and useful thing — it is simply not the same as a resolved one, and the distinction is what the next hour depends on.');
  if (patient.lastUnsupportedChoice === 'saturation-discharge') return prompt('psa-discharge-refused', true,
    'A saturation on oxygen is not a child ready to leave.',
    'Improvement in that number is welcome and it is the easiest thing in the room to over-read. She has had three bronchodilator cycles, a steroid and a second-line plan, she is on oxygen rather than air, and a child with one prior PICU admission who failed first-line treatment an hour ago is not discharged on a partial response. What her saturation cannot tell you is her work of breathing, her air entry, her speech, or how she does when the treatment interval lengthens. Nothing changed when you chose it, because nothing about her changed.');
  return prompt('psa-handoff', true,
    'Hand off a child who is better and still in trouble.',
    'What travels is her asthma history including the prior PICU admission, her personal best and the 32% she arrived at, the verified first-hour care and that it did not work, the nonresponse you named, who was called and when, the second-line plan and who owns it, the partial response and what it is not, and the causes the fixed absences narrowed without excluding. The controller access and trigger conversation travels too, as work still owed to her. Nothing here diagnoses, measures, treats, determines disposition or prognosis, or predicts an outcome.');
}
