import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PostPeDyspneaProgress } from '../post-pulmonary-embolism-persistent-dyspnea';

export const POST_PE_DYSPNEA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for the clinic visit that gets dismissed.
 *
 * Four months after a treated pulmonary embolism she walked two miles and
 * climbed two flights; now she stops at 150 metres. The comfortable resting
 * observations are what make this easy to write off as deconditioning, and
 * that is the error the lesson exists to refuse — because the echo and the
 * perfusion scan in front of it raise chronic thromboembolic disease, which is
 * the one cause of persistent post-PE dyspnea that is potentially curable and
 * is missed by not being looked for. The second refusal is the opposite
 * mistake: these reports raise concern and diagnose nothing. None of these
 * prompts examines her, acquires or interprets a test, diagnoses CTEPD,
 * selects or stops an anticoagulant, or determines a disposition.
 */
export function postPeDyspneaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly postPeDyspnea?: PostPeDyspneaProgress;
}) {
  const patient = input.postPeDyspnea;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('post-pe-trajectory', true,
    'Put her old exercise tolerance next to her current one, and take the anticoagulation as given.',
    'Two miles and two flights without stopping before the embolism; 150 metres or one flight now, four months later. The record documents continuous therapeutic anticoagulation for those four months with no missed doses, no major bleeding and no early discontinuation — that is verified history rather than something to prescribe or re-check. So this is not a treatment failure question. It is a question about why someone properly treated is still this limited.');
  if (patient.safetyAtTick === null) return prompt('post-pe-safety', true,
    'Establish that she is safe today before you interpret anything.',
    'Comfortable at rest, a pulse of 88, a room-air saturation of 96%, warm and well perfused, and a supervised six-minute walk of 280 metres with the saturation falling only to 91% and no syncope or chest pain. No hypotension, no rest hypoxemia, no hemoptysis, no new leg swelling, no bleeding. That is a chronic limitation rather than an emergency — and none of it permanently excludes a recurrence, which is why it is established rather than assumed.');
  if (patient.evidenceAtTick === null) return prompt('post-pe-evidence', true,
    'Read the two reports as a reason to refer, not as a diagnosis.',
    'Mild right ventricular enlargement with reduced RV systolic function and a tricuspid-regurgitation velocity of 3.2 m/s, alongside multiple bilateral segmental mismatched perfusion defects on V/Q SPECT. That combination raises chronic thromboembolic disease, and a mismatched-defect pattern is what makes the perfusion scan the right test for this question. It does not diagnose CTEPD or CTEPH: there is no right-heart catheterization, no anatomic adjudication and no expert conclusion here. Left-heart disease, parenchymal lung disease, anemia, deconditioning and a recurrence all stay open.');
  if (patient.referralAtTick === null) return prompt('post-pe-referral', true,
    'Refer to pulmonary vascular expertise and say who holds the anticoagulation until then.',
    'This is the step the lesson exists for. Chronic thromboembolic pulmonary hypertension is the potentially curable cause of persistent post-PE dyspnea, it is diagnosed by a multidisciplinary assessment rather than by a clinic, and the way it gets missed is that nobody makes the referral. Anticoagulation continues under named ownership while that evaluation is arranged, because the interval before an appointment is exactly when ownership goes missing.');
  return prompt('post-pe-handoff', true,
    'Hand off a limitation nobody has explained yet.',
    'Nothing here establishes CTEPD, a treatment, a procedure or an outcome. What travels is the gap between what she could do and what she can, the current safety and what it does not exclude, the two reports and what they raise rather than settle, the referral and who is chasing it, and the anticoagulation ownership until somebody with the right expertise has seen her.');
}
