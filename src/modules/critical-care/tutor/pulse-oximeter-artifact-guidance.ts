import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PulseOximeterArtifactProgress } from '../pulse-oximeter-artifact';

export const PULSE_OXIMETER_ARTIFACT_TUTOR_VERSION = '0.1.0';

export interface PulseOximeterArtifactPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There are two opposite reflexes here and the lesson works against both. One
 * is treating the number: 82% on a screen makes hands reach for oxygen and an
 * airway trolley for a woman who is talking to you. The other is more dangerous
 * and is the one this chain is built to prevent — deciding it is artifact
 * because it looks like artifact, and dismissing a real desaturation on the
 * strength of a story. The corroboration step exists so that "the signal is
 * bad" is a measurement rather than an opinion.
 *
 * It is silent on the unassisted setting, silent once the clean-site reading is
 * recorded, and silent for any scenario version it was not written against.
 */
export function pulseOximeterArtifactInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PulseOximeterArtifactProgress },
): PulseOximeterArtifactPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.discordanceAtTick === null) return prompt('pox-discordance', true,
    'The screen says 82%. The patient is talking to you. Hold both.',
    'She is shivering; the oximeter reads 82% with a pulse of 132 while the ECG says 86, and she is awake, speaking clearly, breathing 16 without distress, MAP 76, EtCO2 37 on unchanged oxygen. That pulse-rate mismatch is the first real evidence — an oximeter that cannot agree with the ECG about how fast the heart is beating is not in a position to tell you what the blood is carrying. Keep the states apart: the display, the signal, the alarm, the perfusion at the finger, and her actual oxygenation are five different things, and the reflex to fix the number is the same reflex that turns into a needless intubation. Recognising the discordance is not the same as deciding it is artifact.');
  if (patient.plethAtTick === null) return prompt('pox-pleth', true,
    'Look at the waveform the number came from.',
    'The pleth is irregular and low amplitude, and its 132 does not match the ECG\'s 86. A saturation is computed from a pulsatile signal, so a poor pleth means the arithmetic had bad input and the number that came out of it deserves less confidence. Notice the size of that claim: this lowers confidence, and it does not diagnose artifact. A genuinely hypoxaemic patient with cold shut-down fingers also has a bad pleth. What you have now is a reason not to trust the reading, not a reason to disbelieve the hypoxaemia.');
  if (patient.probePerfusionAtTick === null) return prompt('pox-probe', true,
    'Now the path: the probe, the movement, the temperature, the finger.',
    'The declared contact, the shivering, the cool skin and the local perfusion. This is where the explanation stops being general and becomes specific to her — motion and a cold poorly perfused digit are a mechanism, and having a mechanism is what separates "this reading looks odd" from "here is why this reading looks odd". It is also where the honest limit sits: nothing on this screen inspects or moves a probe or examines a perfusion. The path is reviewed from what has been declared, and a probe fault or optical interference has not been excluded by any of it.');
  if (patient.corroboratedAtTick === null) return prompt('pox-corroborate', true,
    'Measure her oxygenation another way. The case so far is not a measurement.',
    'This is the step the whole chain exists for. Everything up to here builds a persuasive story that the signal is bad, and the failure mode of a persuasive story is dismissing a real desaturation because it fit. So: the whole patient, and the fixed arterial panel — SaO2 97%, PaO2 94. That is independent, and it is what makes the conclusion safe. One caution: the clean capnogram is reassuring about ventilation and is not an oxygenation measurement, so it supports her breathing without excluding hypoxaemia. And in a patient who is actually unstable, support and escalation do not wait for any of this — you do both, and the signal gets checked while the treatment happens.');
  return prompt('pox-reassess', true,
    'Read the clean site, and keep the differential open anyway.',
    'The clean-site reassessment shows 97%, pulse 86 now matching the ECG, and a regular stronger pleth with her physiology unchanged. The pulse rates agreeing is the part that closes the loop, because that mismatch was the first thing that was wrong. Motion artifact is supported in this authored state — supported, which is a different word from proven, and true hypoxaemia, dyshaemoglobinaemia, optical interference, venous pulsation, a probe fault and an evolving illness all stay open the moment the evidence stops agreeing. Nothing here inspects or moves a probe, examines perfusion, samples blood, diagnoses artifact or hypoxaemia, delivers oxygen or treatment, configures a monitor, determines disposition, or predicts outcome.');
}
