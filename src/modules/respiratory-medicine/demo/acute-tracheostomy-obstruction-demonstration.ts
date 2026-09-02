import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAcuteTracheostomyObstruction, type AcuteTracheostomyObstructionAction,
  type AcuteTracheostomyObstructionProgress,
} from '../acute-tracheostomy-obstruction';

export const ACUTE_TRACHEOSTOMY_OBSTRUCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAcuteTracheostomyObstructionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAcuteTracheostomyObstruction(scenario);
}

export interface AcuteTracheostomyObstructionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AcuteTracheostomyObstructionAction; readonly finished?: boolean;
}

/**
 * The worked example for a tracheostomy that has stopped working.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example takes none of the four shortcuts. It examines
 * nobody, acquires and interprets no capnography, oximetry or imaging,
 * removes no cap, valve, cannula or tube, passes no catheter, suctions
 * nothing, deflates no cuff, ventilates neither face nor stoma, intubates
 * nobody, and performs no procedure: it recognizes, oxygenates both routes,
 * and lets the experienced team take the bounded branch this device has.
 */
export function acuteTracheostomyObstructionDemonstrationStep(
  patient?: AcuteTracheostomyObstructionProgress,
): AcuteTracheostomyObstructionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He has a patent tracheostomy, an outer tube still where it belongs, a stoma track nobody had to fight for, and a team that knows why the lumen occluded and what has to change so it does not happen again tonight. Nothing here proves the patency will hold. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.1, action: 'reconcile-acute-tracheostomy-obstruction-anatomy-and-patency',
      narration: 'Read the bedhead sign first. It changes everything that follows. It declares a tracheostomy and not a laryngectomy, a patent native upper airway, an established stoma twenty-eight days old, spontaneous breathing, and a nonfenestrated cuffless dual-cannula tube with a removable inner cannula and no cap or valve fitted. That is the difference between a patient who can be oxygenated from above and one who cannot. Ten minutes ago he was at his communication baseline and 96%. He is now agitated, one-word, working hard, and 82%, with scant airflow at the tracheostomy, faint airflow at the mouth, no waveform CO₂ at the tube, a secure unchanged flange, and no kink or source failure. Those converge on patency failure — and note that the absent capnography is one strand of that, not the finding on its own.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.28, action: 'activate-acute-tracheostomy-obstruction-help-and-oxygenation',
      narration: 'Call for airway expertise, and oxygenate both routes at once. Face and tracheostomy together, because the bedhead sign says his native upper airway is patent and that gives you two ways in rather than one. This is the step that buys every other step its time, and it comes before troubleshooting the device rather than after it. The oxygen is delivered by the team, not by you: no source, interface, flow, fraction, target or humidification is selected here, and nothing is removed, passed, suctioned or ventilated by you.' };
  }
  if (patient.devicePathwayAtTick === null) {
    return { id: 'pathway', focus: 'monitor', progress: 0.46, action: 'review-acute-tracheostomy-obstruction-device-pathway',
      narration: 'Now let the experienced team follow the pathway this device actually has. No cap and no speaking valve are fitted, so there is nothing to take off first. The tube is a dual-cannula design with a removable inner cannula, and that is the bounded branch this declared device offers. The qualified review reports what they find: the inner cannula lumen occluded by thick dried secretion, the outer tube still correctly in place, a catheter then passing freely through it, airflow improving and waveform CO₂ returning. That sequence is specific to this authored device and this anatomy — it is not a universal pathway for a laryngectomy, a fresh stoma, another tube design, upper-airway obstruction, or a ventilator-dependent patient.' };
  }
  if (patient.innerCannulaAtTick === null) {
    return { id: 'innerCannula', focus: 'actions', progress: 0.64, action: 'record-acute-tracheostomy-obstruction-inner-cannula-removal',
      narration: 'Record the reversible step: the inner cannula comes out. It is the smallest intervention that addresses the declared obstruction, it leaves the outer tube and the stoma track intact, and it is immediately reversible if it turns out not to be the answer. The removal is experienced-team work rather than yours: you are recording that this is the branch being taken and the standard it has to meet. Nothing here handles a cannula or tube, passes a catheter, suctions, deflates a cuff or ventilates anything.' };
  }
  if (patient.restorationAtTick === null) {
    return { id: 'restoration', focus: 'monitor', progress: 0.8, action: 'reassess-acute-tracheostomy-obstruction-restoration',
      narration: 'Give it time, then check that the airway and the person both came back. The two-minute report is fixed and cannot be read before simulated time has passed. Two separate things have to be true: that the tracheostomy is patent again — airflow, a catheter passing, waveform CO₂ returning — and that he is actually better, his effort, his communication, his rate and his saturation together. A patent tube is not the same as a recovered patient, and reading only the first is how the second gets missed.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-acute-tracheostomy-obstruction-reassessment',
    narration: 'Hand off an airway that failed once and can fail again. What travels is his declared anatomy and bedhead plan, what he looked like when the tube stopped working, the dual-route oxygenation, the device pathway and what was actually found in the inner cannula, the two-minute restoration, and what stays open — humidification, secretion management, the frequency of inner-cannula care, and who to call and how fast if this recurs. Thick dried secretion that occluded a lumen once has a cause, and that cause has not been fixed. Nothing here proves durable patency, decides disposition or prognosis, or predicts an outcome.' };
}
