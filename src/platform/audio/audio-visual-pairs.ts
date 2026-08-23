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
];

/** Every audio event this build can emit. The audit compares against this list. */
export const AUDIO_EVENTS: readonly string[] = [
  'pulse-tone', 'pulse-tone-pitch', 'pulse-tone-absent',
  'alarm-burst-high', 'alarm-burst-medium', 'alarm-burst-low',
  'extended-cue-map-drone', 'extended-cue-etco2-pulse', 'extended-cue-depth-drone',
];
