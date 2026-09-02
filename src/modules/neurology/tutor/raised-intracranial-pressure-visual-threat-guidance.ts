import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RaisedIcpProgress } from '../raised-intracranial-pressure-visual-threat';

export const RAISED_ICP_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for an eye that reads 20/20 while it is being lost.
 *
 * The headache is five weeks old and is not the emergency. The emergency is the
 * optic nerve, and the thing that makes this hard is that acuity is the last
 * measure to fail: she reads 20/20 in both eyes with full colour and no
 * afferent defect while her fields already show early inferior-nasal
 * depression, and at twenty-four hours the fields are moderately constricted
 * with the acuity still 20/20. So the prompts treat the visual field as the
 * clock, keep the sixth-nerve palsy as the false localizing sign it is, and
 * refuse to let demographics plus one opening pressure become a diagnosis
 * before the venogram has been read. None of them examines eyes, grades a disc,
 * interprets a study, or performs a puncture.
 */
export function raisedIcpInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly raisedIcp?: RaisedIcpProgress;
}) {
  const patient = input.raisedIcp;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('raised-icp-trajectory', true,
    'Read the headache as the background and the three-day-old diplopia as the change.',
    'Five weeks of daily pressure headache, worse on waking and with coughing, with pulse-synchronous tinnitus and seconds-long greying of vision on standing — and horizontal diplopia that started three days ago. The abduction deficit is a sixth-nerve palsy, which in raised pressure is a false localizing sign rather than a lesion in the nerve: it tells you the pressure is high, not where anything is.');
  if (patient.ownershipAtTick === null) return prompt('raised-icp-ownership', true,
    'Get neurology, neuro-ophthalmology, imaging and procedure ownership involved together.',
    'Neuro-ophthalmology is not a follow-up appointment in this presentation — it holds the measurement that decides urgency, and imaging and the procedure team are needed on the same timeline because what they find determines whether this is idiopathic at all. Assembling them together is what lets the next two reviews happen in hours rather than in clinic.');
  if (patient.eyesAtTick === null) return prompt('raised-icp-eyes', true,
    'Look at the fields, and do not be reassured by the acuity.',
    'The specialist has confirmed true bilateral papilledema rather than pseudopapilledema, using stereoscopic examination, fundus photography and OCT — that distinction is the whole basis for everything that follows. And she reads 20/20 in each eye with full colour plates and no afferent defect, while reliable perimetry already shows enlarged blind spots with early inferior-nasal depression. In this disease acuity is the last thing to go, so the field is the clock and the letters on the chart are not.');
  if (patient.diagnosticsAtTick === null) return prompt('raised-icp-diagnostics', true,
    'Rule the secondary causes out before letting anyone say idiopathic.',
    'The contrast MRI reports no mass, no hydrocephalus, no abnormal meningeal enhancement, and the venography reports no cerebral venous sinus thrombosis — that venogram is the one that has to be negative before the word idiopathic is allowed near this. The posterior-globe flattening and perioptic CSF prominence support raised pressure and are not diagnostic alone, and an opening pressure of 34 with normal constituents is one value: demographics plus a number is not a diagnosis, and pregnancy testing and the secondary-cause exposure review stay qualified-team work.');
  if (patient.laterAtTick === null) return prompt('raised-icp-later', false,
    'Record the reviews, let the interval pass, and read the 24-hour fields.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual visual field does next.');
  return prompt('raised-icp-handoff', true,
    'Hand off a field that has closed in while everything reassuring stayed the same.',
    'Reliable perimetry now shows new moderate inferior-nasal constriction in both eyes, worse than baseline — and the acuity is still 20/20, the pupils are still equal, the GCS is still 15. That combination is the argument: the measures people watch did not move and the one that matters did. Vision rescue, the cause, the disease itself, the headache and the follow-up interval all travel with her, and none of them is settled here.');
}
