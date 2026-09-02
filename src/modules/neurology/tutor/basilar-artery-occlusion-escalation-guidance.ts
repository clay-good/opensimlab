import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { BasilarLvoProgress } from '../basilar-artery-occlusion-escalation';

export const BASILAR_LVO_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a clock that reads like a closed door.
 *
 * Ten hours is the number that ends the conversation in the anterior
 * circulation, and this is not that. The posterior syndrome is also the one
 * that gets under-called, because diplopia, vertigo, dysarthria and ataxia can
 * be filed under something benign — until you notice that a man whose prestroke
 * Rankin was 0 is now drowsy with a NIHSS of 14. And the escalation is not
 * downstream of the thrombolysis question: the two run alongside each other,
 * which is why the boundary exists to trigger a phone call rather than a
 * decision. So the prompts read the clock as a reason to hurry, keep the
 * secretions a snapshot rather than a reassurance, and refuse to let the
 * activation wait on anything. None of them scores him, excludes a mimic,
 * determines eligibility, or selects a device, drug, dose, route, airway, or
 * anesthetic.
 */
export function basilarLvoInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly basilarLvo?: BasilarLvoProgress;
}) {
  const patient = input.basilarLvo;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('basilar-lvo-trajectory', true,
    'Read ten hours as a reason to hurry, not as a door that has closed.',
    'Witnessed abrupt diplopia, vertigo, severe dysarthria and left-sided weakness ten hours ago, now drowsy but following commands, with impaired horizontal eye movements and marked ataxia. The supplied NIHSS is 14 against a prestroke Rankin of 0 — a man who was fully independent this morning. A posterior syndrome is the one that gets filed under something benign, and the clock that would settle the question elsewhere does not settle it here.');
  if (patient.imagingAtTick === null) return prompt('basilar-lvo-imaging', true,
    'Read the two imaging facts that make this a live question rather than a late one.',
    'Noncontrast CT reports no hemorrhage and a pc-ASPECTS of 8, and the CTA reports a mid-basilar occlusion. Those are selection facts, not a mechanism and not a verdict — and the authored absences of seizure, trauma, fever, hypoglycemia and intoxication are snapshots taken once, so mimics, etiology, bleeding context and deterioration all stay open.');
  if (patient.boundaryAtTick === null) return prompt('basilar-lvo-boundary', true,
    'Name the escalation boundary as something that has already been met.',
    'The supplied boundary describes a disabling posterior deficit with a demonstrated basilar occlusion and preserved posterior tissue. Saying it out loud is what converts a set of facts into a reason to move — and it is a description of the case rather than a decision about his eligibility, which stays with the qualified teams.');
  if (patient.activationAtTick === null) return prompt('basilar-lvo-activation', true,
    'Call the endovascular and airway-capable owners now, and do not let anything hold that call.',
    'Escalation does not wait on the thrombolysis review or on watching which way he goes: those run alongside the call rather than in front of it, and time spent waiting is the only thing here that cannot be recovered. The airway travels with it — he has a cough and handles secretions at this snapshot, and bulbar findings with fluctuating alertness are exactly the combination that stops being true without warning.');
  if (patient.laterAtTick === null) return prompt('basilar-lvo-later', false,
    'Record the activation, let the interval pass, and read the later report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual deficit does next.');
  return prompt('basilar-lvo-handoff', true,
    'Hand off a picture that has not changed, and be exact about what that does and does not mean.',
    'He is still drowsy, still dysarthric, still weak on the left, still coughing and handling secretions. Unchanged is not failure and not reassurance: nothing here proves the vessel is open or closed, nothing proves reperfusion or a treatment effect, and the airway is protected only as far as this snapshot goes. The clocks, the imaging, the thrombolysis review, the deterioration and airway risk, the etiology, the procedure and its complications, and the disposition all travel with him.');
}
