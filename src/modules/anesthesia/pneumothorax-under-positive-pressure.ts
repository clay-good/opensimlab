import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the pneumothorax-under-
 * positive-pressure lesson.
 *
 * The twenty-fourth anaesthesia lab, and the first bound one carrying a defect
 * rather than a subtlety: its fifth objective cannot be earned by any transcript.
 * See the completion evidence for the measurement and where the fault lies.
 */

/** The five declared objectives, in order, as the scenario states them. */
export const PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_OBJECTIVES = [
  'assess-pneumothorax-pattern',
  'escalate-pneumothorax-pattern',
  'support-pneumothorax-oxygenation',
  'decompress-pneumothorax',
  'reassess-pneumothorax-recovery',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Keyed on the scripted pleural event, because every objective measures delay
 * FROM it: without that event there is no clock and the whole branch reports
 * not-exercised. The emergency-medicine lesson sharing this rubric branch has
 * its own scenario id and is excluded by the first check.
 */
export function supportsPneumothoraxUnderPositivePressure(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pneumothorax-under-positive-pressure'
    && scenario.timeline.some((event) => event.type === 'tension-pneumothorax')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_OBJECTIVES.join('|');
}
