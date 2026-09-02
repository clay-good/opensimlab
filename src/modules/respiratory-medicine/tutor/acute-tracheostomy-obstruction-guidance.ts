import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AcuteTracheostomyObstructionProgress } from '../acute-tracheostomy-obstruction';

export const ACUTE_TRACHEOSTOMY_OBSTRUCTION_TUTOR_VERSION = '0.1.0';

export interface AcuteTracheostomyObstructionPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps, including their last
 * wrong turn.
 *
 * This is the most dangerous lesson in the module, and its four refusals are
 * the four ways people get hurt: waiting for a picture, pushing gas down a
 * path nobody has verified, forcing a catheter past resistance, and pulling
 * the whole tube out first. It is silent on the unassisted setting, silent
 * once the handoff is recorded, and silent for any scenario version it was
 * not written against.
 */
export function acuteTracheostomyObstructionInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: AcuteTracheostomyObstructionProgress },
): AcuteTracheostomyObstructionPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('ato-recognition', true,
    'Read the bedhead sign first. It changes everything that follows.',
    'It declares a tracheostomy and not a laryngectomy, a patent native upper airway, an established stoma twenty-eight days old, spontaneous breathing, and a nonfenestrated cuffless dual-cannula tube with a removable inner cannula and no cap or valve fitted. That is the difference between a patient who can be oxygenated from above and one who cannot. Ten minutes ago he was at his communication baseline and 96%. He is now agitated, one-word, working hard, and 82%, with scant airflow at the tracheostomy, faint airflow at the mouth, no waveform CO₂ at the tube, a secure unchanged flange, and no kink or source failure. Those converge on patency failure — and note that the absent capnography is one strand of that, not the finding on its own.');
  if (patient.supportAtTick === null) {
    if (patient.lastUnsupportedChoice === 'imaging') return prompt('ato-imaging-refused', true,
      'He is 82% and working. A picture cannot help him in the next two minutes.',
      'Imaging is how you answer a question you have time to ask, and the question here has already been answered by the findings at the bedside. What the scan would cost is the only thing he is actually short of. Get airway-expert and resuscitation help coming and get oxygen to both routes first; the fault can be characterized once he is oxygenated. Nothing changed when you chose it, because nothing about him changed.');
    if (patient.lastUnsupportedChoice === 'unverified-ventilation') return prompt('ato-unverified-refused', true,
      'Do not push gas down a path nobody has verified.',
      'There is no waveform CO₂ at that tube and scant airflow through it, which means you do not know where the far end is or what is in the way. Positive pressure through an unverified tracheostomy can inflate tissue rather than lung and can turn a patency problem into a surgical-emphysema problem in seconds. Oxygen to the declared possible airways — face and stoma both, because his upper airway is patent — is the intervention that is safe before anything has been verified. Nothing changed when you chose it, because nothing about him changed.');
    return prompt('ato-support', true,
      'Call for airway expertise, and oxygenate both routes at once.',
      'Face and tracheostomy together, because the bedhead sign says his native upper airway is patent and that gives you two ways in rather than one. This is the step that buys every other step its time, and it comes before troubleshooting the device rather than after it. The oxygen is delivered by the team, not by you: no source, interface, flow, fraction, target or humidification is selected here, and nothing is removed, passed, suctioned or ventilated by you.');
  }
  if (patient.devicePathwayAtTick === null) return prompt('ato-pathway', true,
    'Now let the experienced team follow the pathway this device actually has.',
    'No cap and no speaking valve are fitted, so there is nothing to take off first. The tube is a dual-cannula design with a removable inner cannula, and that is the bounded branch this declared device offers. The qualified review reports what they find: the inner cannula lumen occluded by thick dried secretion, the outer tube still correctly in place, a catheter then passing freely through it, airflow improving and waveform CO₂ returning. That sequence is specific to this authored device and this anatomy — it is not a universal pathway for a laryngectomy, a fresh stoma, another tube design, upper-airway obstruction, or a ventilator-dependent patient.');
  if (patient.innerCannulaAtTick === null) {
    if (patient.lastUnsupportedChoice === 'force-catheter') return prompt('ato-catheter-refused', true,
      'Resistance is information. Do not push through it.',
      'A suction catheter that will not pass is telling you where the obstruction is, and forcing it past that point risks false passage, bleeding and losing a stoma track that is currently intact and usable. The obstruction in this declared device has a bounded branch that does not require force: the inner cannula comes out. Let the experienced staff take that branch. Nothing changed when you chose it, because nothing about him changed.');
    if (patient.lastUnsupportedChoice === 'whole-tube') return prompt('ato-whole-tube-refused', true,
      'Not the whole tube. Not first.',
      'Removing or exchanging the entire tracheostomy is a real and sometimes necessary step, and it is not the first bounded branch for a declared isolated inner-cannula obstruction. It gives up a secure, correctly sited outer tube in a stoma, and replacing it is a harder, bloodier problem than the one you started with — especially under the time pressure of a patient at 82%. Take the reversible step that addresses the declared obstruction first. Nothing changed when you chose it, because nothing about him changed.');
    return prompt('ato-inner-cannula', true,
      'Record the reversible step: the inner cannula comes out.',
      'It is the smallest intervention that addresses the declared obstruction, it leaves the outer tube and the stoma track intact, and it is immediately reversible if it turns out not to be the answer. The removal is experienced-team work rather than yours: you are recording that this is the branch being taken and the standard it has to meet. Nothing here handles a cannula or tube, passes a catheter, suctions, deflates a cuff or ventilates anything.');
  }
  if (patient.restorationAtTick === null) return prompt('ato-restoration', true,
    'Give it time, then check that the airway and the person both came back.',
    'The two-minute report is fixed and cannot be read before simulated time has passed. Two separate things have to be true: that the tracheostomy is patent again — airflow, a catheter passing, waveform CO₂ returning — and that he is actually better, his effort, his communication, his rate and his saturation together. A patent tube is not the same as a recovered patient, and reading only the first is how the second gets missed.');
  return prompt('ato-handoff', true,
    'Hand off an airway that failed once and can fail again.',
    'What travels is his declared anatomy and bedhead plan, what he looked like when the tube stopped working, the dual-route oxygenation, the device pathway and what was actually found in the inner cannula, the two-minute restoration, and what stays open — humidification, secretion management, the frequency of inner-cannula care, and who to call and how fast if this recurs. Thick dried secretion that occluded a lumen once has a cause, and that cause has not been fixed. Nothing here proves durable patency, decides disposition or prognosis, or predicts an outcome.');
}
