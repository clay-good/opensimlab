/**
 * The audio audit (cockpit/sonification → Every sound has a visual equivalent).
 *
 * Every audio event the application can produce is declared here alongside the
 * visual element that conveys the same information, and
 * `tests/unit/sonification.test.ts` fails the build if any audio event lacks a
 * pair. That makes the guarantee structural rather than a promise.
 */

export interface AudioVisualPair {
  /** Stable id of the audio event. */
  readonly audioEvent: string;
  /** What the sound conveys. */
  readonly conveys: string;
  /** The visual element that conveys the same thing. */
  readonly visualEquivalent: string;
  /** Where in the interface that element is. */
  readonly visualLocation: string;
}

export const AUDIO_VISUAL_PAIRS: readonly AudioVisualPair[] = [
  {
    audioEvent: 'pulse-tone',
    conveys: 'Heart rate, as tone repetition rate.',
    visualEquivalent: 'The electrocardiogram trace and the heart rate numeric.',
    visualLocation: 'Monitor region, ECG track and its VitalTile.',
  },
  {
    audioEvent: 'pulse-tone-pitch',
    conveys: 'Oxygen saturation, as pitch.',
    visualEquivalent: 'The saturation numeric and the plethysmogram trace.',
    visualLocation: 'Monitor region, SpO2 track and its VitalTile.',
  },
  {
    audioEvent: 'pulse-tone-absent',
    conveys: 'Loss of a mechanical pulse.',
    visualEquivalent: 'The plethysmogram loses pulsatility and the saturation tile shows `--` with a reason.',
    visualLocation: 'Monitor region.',
  },
  {
    audioEvent: 'alarm-burst-high',
    conveys: 'A high-priority alarm.',
    visualEquivalent: 'The alarm rail item flashing at 2 Hz with the words "High priority", plus the alarmed tile treatment.',
    visualLocation: 'AlarmRail above the traces.',
  },
  {
    audioEvent: 'alarm-burst-medium',
    conveys: 'A medium-priority alarm.',
    visualEquivalent: 'The alarm rail item flashing at 0.6 Hz with the word "Medium".',
    visualLocation: 'AlarmRail above the traces.',
  },
  {
    audioEvent: 'alarm-burst-low',
    conveys: 'A low-priority alarm.',
    visualEquivalent: 'A steady alarm rail item with the word "Low".',
    visualLocation: 'AlarmRail above the traces.',
  },
  {
    audioEvent: 'extended-cue-map-drone',
    conveys: 'Mean arterial pressure, continuously.',
    visualEquivalent: 'The arterial trace and the pressure numerics.',
    visualLocation: 'Monitor region, arterial track and its VitalTile.',
  },
  {
    audioEvent: 'extended-cue-etco2-pulse',
    conveys: 'End-tidal carbon dioxide, per breath.',
    visualEquivalent: 'The capnogram trace and the end-tidal numeric.',
    visualLocation: 'Monitor region, capnography track and its VitalTile.',
  },
  {
    audioEvent: 'extended-cue-depth-drone',
    conveys: 'The predicted depth index, continuously.',
    visualEquivalent: 'The depth index numeric.',
    visualLocation: 'Monitor region, depth VitalTile.',
  },
  // Vibration is a second non-visual channel, held to the same rule: it may
  // repeat what the screen says, never say something the screen does not.
  {
    audioEvent: 'haptic-alarm-high',
    conveys: 'A high-priority alarm, as three short vibrations every 2 seconds.',
    visualEquivalent: 'The same alarm rail item flashing at 2 Hz with the words "High priority".',
    visualLocation: 'AlarmRail above the traces.',
  },
  {
    audioEvent: 'haptic-alarm-medium',
    conveys: 'A medium-priority alarm, as one longer vibration every 1.5 seconds.',
    visualEquivalent: 'The same alarm rail item flashing at 0.6 Hz with the word "Medium".',
    visualLocation: 'AlarmRail above the traces.',
  },
  {
    audioEvent: 'haptic-alarm-low',
    conveys: 'A low-priority alarm, as one short vibration at onset.',
    visualEquivalent: 'The same steady alarm rail item with the word "Low".',
    visualLocation: 'AlarmRail above the traces.',
  },
  // Narration reads text that is already on screen, word for word.
  {
    audioEvent: 'speech-beat',
    conveys: 'The current worked-example step.',
    visualEquivalent: 'The same narration line in the worked-example banner.',
    visualLocation: 'Demonstration banner above the action region.',
  },
  {
    audioEvent: 'speech-tutor',
    conveys: 'A tutor prompt and its reason.',
    visualEquivalent: 'The same suggestion and reason on the tutor prompt card.',
    visualLocation: 'Tutor prompt card beside the monitor.',
  },
  {
    audioEvent: 'speech-alarm',
    conveys: 'A threshold or alarm announcement.',
    visualEquivalent: 'The alarm rail item and the changed vital tile the announcement describes.',
    visualLocation: 'AlarmRail and the monitor region.',
  },
  {
    audioEvent: 'speech-summary',
    conveys: 'The state summary or waveform description on request.',
    visualEquivalent: 'Every value it reads is a numeric tile or trace on the monitor.',
    visualLocation: 'Monitor region.',
  },
];

/** Every audio event this build can emit. The audit compares against this list. */
export const AUDIO_EVENTS: readonly string[] = [
  'pulse-tone', 'pulse-tone-pitch', 'pulse-tone-absent',
  'alarm-burst-high', 'alarm-burst-medium', 'alarm-burst-low',
  'extended-cue-map-drone', 'extended-cue-etco2-pulse', 'extended-cue-depth-drone',
  'haptic-alarm-high', 'haptic-alarm-medium', 'haptic-alarm-low',
  'speech-beat', 'speech-tutor', 'speech-alarm', 'speech-summary',
];
