import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PulmonaryEmbolismProgress } from '../pulmonary-embolism-deterioration';

export const PULMONARY_EMBOLISM_TUTOR_VERSION = '0.1.0';

export interface PulmonaryEmbolismPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is treating a category as a conclusion. This
 * patient arrives normotensive with right-ventricular strain, which is the
 * band people file under "not the emergency" — and then his pressure falls
 * while the correct treatment is running. The engine refuses the escalation
 * until the deterioration has actually been looked for.
 *
 * The two initial intents are unordered, so the claim about not intubating
 * lives in the beat for the state where neither has been recorded.
 *
 * It is silent on the unassisted setting, silent once the escalation is
 * recorded, and silent for any scenario version it was not written against.
 */
export function pulmonaryEmbolismInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PulmonaryEmbolismProgress },
): PulmonaryEmbolismPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.escalationAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.severityReviewedAtTick === null) return prompt('pe-severity', true,
    'The pressure is normal. Read everything else before you let that reassure you.',
    'Sudden dyspnoea and pleuritic pain, heart rate 124, respiratory rate 30, SpO₂ 90%, blood pressure 112/70, alert, warm and perfused. Then the findings that matter more than the pressure: CT pulmonary angiography confirms bilateral main and lobar emboli, echocardiography shows an enlarged and poorly contracting right ventricle with no effusion, and both troponin and BNP are up with a lactate of 1.8. A normal blood pressure in a patient whose right ventricle is failing is not evidence that he is well — it is evidence that he is still compensating, which is a different and much more temporary statement. This is a fixed Category C3R pattern rather than a live calculation; the screen acquires no test.');

  const untreated = patient.oxygenAtTick === null && patient.anticoagulationAtTick === null;
  if (untreated) return prompt('pe-initial', true,
    'Two intents are open at once — and the important part of the oxygen decision is what it rules out.',
    'Titrated supplemental oxygen and immediate therapeutic anticoagulation, in either order; neither waits on the other. What the oxygen control quietly records is that deep sedation and mechanical ventilation are not being selected, and that is worth being explicit about. A failing right ventricle is being held up by two things this patient still has: his own sympathetic tone and his preload. Induction agents remove the first and positive-pressure ventilation removes the second, so intubating a patient in acute right-ventricular failure can convert a compensating circulation into an arrest in under a minute. It is one of the few places in emergency medicine where the airway intervention is the more dangerous choice. The anticoagulation is immediate because the embolism is confirmed and no absolute contraindication is authored. Device choice, flow, escalation, airway rescue, agent, dose, renal adjustment, monitoring and bleeding assessment are outside this vignette.');

  if (patient.oxygenAtTick === null) return prompt('pe-oxygen', true,
    'Oxygen is still unrecorded — titrated, and notice what the control does not offer.',
    'Supplemental oxygen titrated to a target rather than an airway. The control deliberately does not offer sedation or invasive ventilation, because acute right-ventricular dysfunction decompensates when sympathetic tone and preload are removed, and both are removed by induction and positive pressure. If this patient eventually needs an airway it is a decision made by people who can support the right ventricle through it, not a reflex response to a saturation of 90%. Device choice, flow, escalation and airway rescue are outside this vignette.');

  if (patient.anticoagulationAtTick === null) return prompt('pe-anticoagulation', true,
    'Record the anticoagulation now. The diagnosis is already confirmed.',
    'Immediate therapeutic anticoagulation for an imaging-confirmed acute pulmonary embolism with no authored absolute contraindication. There is nothing left to wait for: the CT has answered the question, and the interval people spend deciding is an interval in which more clot forms on the existing one. It is also not the same decision as reperfusion — anticoagulation stops propagation and lets endogenous lysis work, while reperfusion removes what is already there, and recording one does not commit you to the other. Agent, dose, renal adjustment, laboratory monitoring, bleeding assessment and any interaction with a reperfusion strategy are outside this vignette.');

  if (patient.deteriorationAtTick === null) return prompt('pe-reassess', true,
    'Look again. The category you assigned was a snapshot, and this is the lesson.',
    'The reassessment is gated behind a further engine tick because a serial finding needs two moments to exist. What it shows is a patient who has moved bands while being treated correctly: blood pressure 78/50 and persistent, heart rate 138, cool mottled extremities, delayed capillary refill, new confusion, and a lactate that has gone from 1.8 to 4.8 — all while the oxygenation improved to 92%. That last detail is the trap in miniature: the number you were watching got better and the patient got worse, because oxygenation was never the problem. This is now Category E1 cardiopulmonary failure with cardiogenic shock, and the reason the lesson is built this way is that intermediate-risk pulmonary embolism is defined by the possibility of exactly this, which means the observation is part of the treatment.');

  return prompt('pe-escalation', true,
    'Escalate to the team, and record a reperfusion intent without choosing the method.',
    'Immediate pulmonary-embolism response-team activation and an urgent reperfusion-strategy intent for Category E1. The deliberate omission is which reperfusion: systemic thrombolysis, catheter-directed therapy, mechanical thrombectomy and surgical embolectomy are all real answers here and choosing between them needs contraindication review, local capability and this particular patient, none of which a screen can supply. Recording the intent and getting the people who decide it into the room is the emergency-department contribution, and it is a real one — the delay in these cases is usually in the assembling rather than in the procedure. Transfer, disposition, procedure performance and outcome are outside this vignette.');
}
