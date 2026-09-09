import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the arterial-transducer lesson.
 *
 * The thirty-third anaesthesia lab, and the second in the module where the
 * monitor is wrong and the patient is well. Two artifacts arrive together -- a
 * 20 cm hydrostatic offset and an over-damped trace -- and the true mean
 * arterial pressure is 78 mmHg for the whole case whatever anyone does.
 */

/** The three declared objectives, in order, as the scenario states them. */
export const ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT_OBJECTIVES = [
  'verify-invasive-pressure-independently',
  'correct-transducer-level',
  'assess-arterial-dynamic-response',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted artifact events, because the bounded cuff action checks
 * the timeline for them by name and every objective is timed from their arrival.
 */
export function supportsArterialPressureTransducerArtifact(scenario: Scenario): boolean {
  return scenario.metadata.id === 'arterial-pressure-transducer-artifact'
    && scenario.timeline.some((event) => event.type === 'artifact'
      && event.target === 'arterial-transducer-misleveled')
    && scenario.timeline.some((event) => event.type === 'artifact'
      && event.target === 'arterial-damping')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT_OBJECTIVES.join('|');
}
