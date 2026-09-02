import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsRaisedIcp, type RaisedIcpAction, type RaisedIcpProgress,
} from '../raised-intracranial-pressure-visual-threat';

export const RAISED_ICP_DEMONSTRATION_VERSION = '0.1.0';

export function supportsRaisedIcpDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsRaisedIcp(scenario);
}

export interface RaisedIcpDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: RaisedIcpAction; readonly finished?: boolean;
}

/**
 * The worked example for an eye that reads 20/20 while it is being lost.
 *
 * The headache is five weeks old and is not the emergency; the optic nerve is.
 * What makes this hard is that acuity is the last measure to fail — she reads
 * 20/20 with full colour and no afferent defect while her fields already show
 * early inferior-nasal depression, and at twenty-four hours the fields are
 * moderately constricted with the acuity unchanged. So this example treats the
 * visual field as the clock, keeps the sixth-nerve palsy as a false localizing
 * sign, and refuses to let demographics plus one opening pressure become a
 * diagnosis before the venogram is read. It examines no eyes, grades no disc,
 * interprets no study, and performs no puncture.
 */
export function raisedIcpDemonstrationStep(
  patient?: RaisedIcpProgress,
): RaisedIcpDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on reading the same line on the chart and seeing less of the room. Nothing was proven and nothing was excluded — not the cause, not the rescue, not how much field comes back. This ends the example, not the threat.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-raised-icp-headache-visual-tinnitus-diplopia-and-whole-patient',
      narration: 'Read the headache as the background and the three-day-old diplopia as the change. Five weeks of daily pressure headache, worse on waking and with coughing, with pulse-synchronous tinnitus and seconds-long greying of vision on standing — and horizontal diplopia that started three days ago. The abduction deficit is a sixth-nerve palsy, which in raised pressure is a false localizing sign rather than a lesion in the nerve: it tells you the pressure is high, not where anything is.' };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.26, action: 'activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership',
      narration: 'Get neurology, neuro-ophthalmology, imaging and procedure ownership involved together. Neuro-ophthalmology is not a follow-up appointment in this presentation — it holds the measurement that decides urgency, and imaging and the procedure team are needed on the same timeline because what they find determines whether this is idiopathic at all. Assembling them together is what lets the next two reviews happen in hours rather than in clinic.' };
  }
  if (patient.eyesAtTick === null) {
    return { id: 'eyes', focus: 'monitor', progress: 0.46, action: 'review-neurology-raised-icp-confirmed-papilledema-visual-function-and-pseudopapilledema-boundary',
      narration: 'Look at the fields, and do not be reassured by the acuity. The specialist has confirmed true bilateral papilledema rather than pseudopapilledema, using stereoscopic examination, fundus photography and OCT — that distinction is the whole basis for everything that follows. And she reads 20/20 in each eye with full colour plates and no afferent defect, while reliable perimetry already shows enlarged blind spots with early inferior-nasal depression. In this disease acuity is the last thing to go, so the field is the clock and the letters on the chart are not.' };
  }
  if (patient.diagnosticsAtTick === null) {
    return { id: 'diagnostics', focus: 'monitor', progress: 0.64, action: 'review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary',
      narration: 'Rule the secondary causes out before letting anyone say idiopathic. The contrast MRI reports no mass, no hydrocephalus and no abnormal meningeal enhancement, and the venography reports no cerebral venous sinus thrombosis — that venogram is the one that has to be negative before the word idiopathic is allowed near this. The posterior-globe flattening and perioptic CSF prominence support raised pressure and are not diagnostic alone, and an opening pressure of 34 with normal constituents is one value: demographics plus a number is not a diagnosis.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-raised-icp-strict-later-worsening-visual-field-and-imminent-sight-threat',
      narration: 'Let the authored interval pass and read the qualified team’s 24-hour fields. The interval is a contrast rather than a required wait, and nothing here says what any individual visual field does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-raised-icp-vision-rescue-cause-disease-headache-follow-up-and-active-risk',
    narration: 'Reliable perimetry now shows new moderate inferior-nasal constriction in both eyes, worse than baseline — and the acuity is still 20/20, the pupils are still equal, the GCS is still 15. That combination is the argument: the measures people watch did not move and the one that matters did. Hand off vision rescue, the cause, the disease, the headache and the follow-up interval, and settle none of them.' };
}
