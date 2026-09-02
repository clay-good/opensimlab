import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { BronchiolitisProgress } from '../bronchiolitis';

export const BRONCHIOLITIS_TUTOR_VERSION = '0.1.0';

export interface BronchiolitisPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps, including their last
 * wrong turn.
 *
 * Bronchiolitis is a disease people treat too much, so this lesson offers
 * five ways to do something instead of the right thing — a radiograph, a
 * saturation watched on its own, a bronchodilator, an antibiotic, and a
 * discharge decided by a number. It is silent on the unassisted setting,
 * silent once the handoff is recorded, and silent for any scenario version
 * it was not written against.
 */
export function bronchiolitisInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: BronchiolitisProgress },
): BronchiolitisPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('bronch-recognition', true,
    'Take in the whole infant, and the feeding history with it.',
    'A previously well twelve-month-old, ten kilos, day four of his first coryzal illness. He is awake and interactive, with nasal congestion, diffuse crackles and wheeze, moderate subcostal recession and equal air entry. Heart rate 156, respiratory rate 58, temperature 38.0, and a persistent 88% on air with a clean pleth — warm, strong pulses, refill of two seconds, no apnea, grunting, exhaustion or cyanosis. And the part that is easy to leave out of the summary: intake at about 40% of usual over twenty-four hours, with two wet diapers, feeds interrupted by coughing and fatigue. In an infant this age, how he is feeding is a vital sign.');
  if (patient.patternAtTick === null) {
    if (patient.lastUnsupportedChoice === 'radiograph-first') return prompt('bronch-radiograph-refused', true,
      'A film will not change what he needs today.',
      'A qualified team has already supplied the working diagnosis from the history and the examination, and there is no focal asymmetry to chase. Routine radiography in typical bronchiolitis mostly finds atelectasis that gets read as pneumonia and answered with antibiotics he does not need — so the film has a way of causing the next mistake rather than preventing one. Exceptions exist and stay context dependent; this is not one of them. Nothing changed when you chose it, because nothing about him changed.');
    if (patient.lastUnsupportedChoice === 'single-saturation') return prompt('bronch-saturation-refused', true,
      'Watching the number is not the same as watching the baby.',
      'Saturation is one lane, and in bronchiolitis it is the lane most likely to be watched to the exclusion of the others. His work of breathing, his feeding, his hydration, his apnea risk and his circulation are all still live and all still moving. An infant can hold a saturation while he tires, and can stop feeding long before anything on the monitor says so. Nothing changed when you chose it, because nothing about him changed.');
    return prompt('bronch-pattern', true,
      'Name it as the supportive-care pattern it is.',
      'Recording that this is typical bronchiolitis is what makes the rest of the lesson coherent: it is a disease that gets better with oxygen, feeding, hydration and watching, and worse with enthusiasm. The fixed absences — no focal asymmetry, choking, bark, stridor, drooling, urticaria, facial swelling, prior wheeze, prematurity, chronic cardiopulmonary disease or immunodeficiency — narrow the field, and they do not permanently exclude another diagnosis or a bacterial coinfection.');
  }
  if (patient.supportAtTick === null) {
    if (patient.lastUnsupportedChoice === 'routine-albuterol') return prompt('bronch-albuterol-refused', true,
      'The wheeze is real. It is not asthma, and this is his first episode.',
      'Wheeze in a twelve-month-old on day four of his first coryzal illness is the sound of small airways full of debris and edema, not bronchospasm waiting for a beta agonist. Routine bronchodilators do not change the course of bronchiolitis, and giving one costs time, tachycardia and a false sense that something has been done. Keep the supportive pathway; context-dependent exceptions live outside this lab. Nothing changed when you chose it, because nothing about him changed.');
    if (patient.lastUnsupportedChoice === 'routine-antibiotic') return prompt('bronch-antibiotic-refused', true,
      'Fever on day four of a viral illness is not a bacterial focus.',
      'There is no authored bacterial focus here — and that is different from bacterial coinfection being excluded, which it is not. The honest position is to keep coinfection open, watch him, and treat it if it declares itself, rather than to start an antibacterial now and call the question closed. A temperature of 38.0 in an infant with bronchiolitis is what bronchiolitis does. Nothing changed when you chose it, because nothing about him changed.');
    return prompt('bronch-support', true,
      'Get experienced supportive-care ownership and monitoring around him.',
      'Oxygenation and continuous monitoring, owned by people qualified to choose the specifics — because at 88% he does need oxygen, and none of the details are yours here. No device, flow, fraction or target is selected, nothing is suctioned or delivered by you, and no drug, ventilation or procedure happens. What you are recording is that he is being watched properly by people who can act.');
  }
  if (patient.feedingHydrationAtTick === null) return prompt('bronch-feeding', true,
    'Let time pass, then take the feeding as seriously as the breathing.',
    'It is a fixed report and cannot be read before simulated time has passed. Forty percent of usual intake and two wet diapers in twenty-four hours is the finding that decides where this infant spends tonight, more often than the saturation does — an infant who cannot feed because he cannot breathe and cannot breathe well because he is dehydrated is on a loop that support interrupts. The route and the volume belong to the team, not to you: nothing here selects or delivers a feed, a fluid route or a fluid.');
  if (patient.laterResponseAtTick === null) {
    if (patient.lastUnsupportedChoice === 'discharge-on-saturation') return prompt('bronch-discharge-refused', true,
      'A saturation that has come up is not a baby who is ready to go home.',
      'Discharge in bronchiolitis rests on feeding, hydration, work of breathing, apnea risk, the trajectory he is on and whether his family can get back quickly — the number is one input among those and the least sufficient of them on its own. Day four is also around when this illness tends to peak, so an infant who looks better for an hour may not have turned the corner yet. Nothing changed when you chose it, because nothing about him changed.');
    return prompt('bronch-later', true,
      'Allow more time, then read the later report as a whole infant again.',
      'Fixed and strictly later. Look at his work of breathing, his feeding, his hydration, his alertness and his oxygenation together, and ask which way the group is moving. Whatever it says, it is a report on where he is now rather than a verdict on where he ends up — no recovery is proven here and no discharge readiness is established.');
  }
  return prompt('bronch-handoff', true,
    'Hand off an infant whose illness has probably not peaked.',
    'What travels is the day-four timing and what that means for the days after it, the whole-infant severity rather than the saturation alone, the feeding and hydration numbers, the support that was activated, both reviews and the direction between them, the apnea risk, and what stays open — another diagnosis and bacterial coinfection both, which the fixed absences narrowed and did not exclude. Nothing here confirms a diagnosis, identifies a virus, proves recovery or discharge readiness, determines disposition, or predicts an outcome.');
}
