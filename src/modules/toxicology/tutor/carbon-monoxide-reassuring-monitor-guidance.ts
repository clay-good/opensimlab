import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CarbonMonoxideProgress } from '../carbon-monoxide-reassuring-monitor';

export const CARBON_MONOXIDE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a monitor that has nothing useful to say and says
 * it confidently.
 *
 * The methemoglobinemia lesson next door has a number that looks alarming and
 * is not measuring the right thing. This one is the same failure pointing the
 * other way: 99% on a conventional pulse oximeter cannot rule out carbon
 * monoxide, and it is the reassuring direction that gets people sent home. The
 * prompts hold two refusals the whole way through — the oximetry does not
 * exclude the poisoning, and the co-oximetry number does not grade it — and
 * they keep the partner in view as a second patient rather than a detail of
 * this one's history. None of them names a chamber, a pressure, a duration, a
 * threshold, or an eligibility result, and none reads the later report as a
 * treatment effect or as delayed sequelae excluded.
 */
export function carbonMonoxideInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly carbonMonoxide?: CarbonMonoxideProgress;
}) {
  const patient = input.carbonMonoxide;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('carbon-monoxide-trajectory', true,
    'Say the exposure, the clock, and the syncope out loud before you look at the monitor again.',
    'A generator in an attached garage, two people with the same headache and nausea, a transient loss of consciousness, and confusion that has not cleared. The SpO2 of 99% belongs in that sentence as a finding to be explained rather than as the reassurance it looks like.');
  if (patient.recognitionAtTick === null) return prompt('carbon-monoxide-recognize', true,
    'Record this as a suspected pattern, and record why the oximeter cannot argue with it.',
    'A conventional two-wavelength pulse oximeter cannot rule out carbon-monoxide poisoning; a normal reading is not evidence against it. That is a reason to keep going rather than a diagnosis — neurologic, cardiac, metabolic, toxic, traumatic, infectious and other causes all stay open here.');
  if (patient.supportAtTick === null) return prompt('carbon-monoxide-support', true,
    'Move on the scene and the other person, not only on the patient in front of you.',
    'Removal from exposure is confirmed and the oxygen is running, so the part still outstanding is outside this room: the source, the scene, and a partner with the same symptoms who is a second patient rather than a line in his history. The poison center or medical toxicology service and emergency ownership are called rather than assumed.');
  if (patient.severityAtTick === null) return prompt('carbon-monoxide-severity', true,
    'Read the 28% with its timing beside it, and refuse to let it grade him.',
    'The sample was drawn after removal and after oxygen had already started, so the number is lower than his exposure was. Carboxyhemoglobin does not reliably grade severity or predict outcome; the syncope, the persistent confusion, the cardiac findings and the whole patient are what carry that weight, and none of them excludes a co-exposure or another cause.');
  if (patient.reassessmentAtTick === null) return prompt('carbon-monoxide-observe', false,
    'Record the hyperbaric consultation as a consultation, let the interval pass, and read the report.',
    'Selection is individualized around symptoms, neurologic and cardiac involvement, severity, chamber availability, transport risk and elapsed time. There is no universal threshold to apply here, and this lesson picks no chamber, pressure, duration or transfer.');
  return prompt('carbon-monoxide-handoff', true,
    'Hand off the part that gets better and the part that has not happened yet.',
    'COHb 7%, clearer orientation, rate 92, SpO2 100% — and none of that proves a treatment effect, complete clearance, or durable neurologic recovery. Delayed neurologic sequelae can appear days to weeks after an exposure that looked resolved, so the follow-up, the cardiac surveillance, the co-exposed partner and the scene all travel with him.');
}
