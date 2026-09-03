import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency
 * obstructive-shock-tension-pneumothorax lesson.
 *
 * This lesson is shaped differently from every other emergency-medicine one.
 * There is no `obstructive-shock-tension-pneumothorax-response` case in the
 * engine and no bespoke assessment snapshot, because the lab is scored against
 * the GENERIC resuscitation mechanics: a pleural assessment, a help request, a
 * ventilator setting and a decompression intent, each a different action type.
 *
 * It is also the only emergency lesson graded on the clock rather than on
 * order. src/modules/anesthesia/ui/Debrief.tsx credits the assessment and the
 * help request at 30 seconds and partly at 60, the oxygen inside 60, and the
 * decompression at 60 and partly at 120 — all measured from the modelled
 * pleural event rather than from each other.
 */
export type ObstructivePleuralShockResuscitation = EquipmentSnapshot['resuscitation'];

/** Seconds, from the modelled event, at which the declared objectives close. */
export const OBSTRUCTIVE_PLEURAL_SHOCK_WINDOWS = {
  assessmentSeconds: 30,
  helpSeconds: 30,
  oxygenSeconds: 60,
  decompressionSeconds: 60,
} as const;

/**
 * What the tutor reads. Every field is already published by the shared engine;
 * nothing here is a new snapshot.
 */
export interface ObstructivePleuralShockProgress {
  readonly pleuralFraction: number;
  readonly assessedAtTick: number | null;
  readonly decompressedAtTick: number | null;
  readonly helpRequestedAtTick: number | null;
  readonly highConcentrationOxygen: boolean;
}

/**
 * Project the ordinary equipment snapshot into the five things this lesson
 * watches. The airway device is a facemask in this vignette, which is why an
 * inspired fraction of 1.0 alone counts as high-concentration oxygen — the
 * debrief applies the same rule.
 */
export function obstructivePleuralShockProgress(
  equipment: Pick<EquipmentSnapshot, 'resuscitation' | 'ventilator' | 'airway'>,
): ObstructivePleuralShockProgress {
  return {
    pleuralFraction: equipment.resuscitation.tensionPneumothoraxFraction ?? 0,
    assessedAtTick: equipment.resuscitation.pneumothoraxAssessedAtTick ?? null,
    decompressedAtTick: equipment.resuscitation.pneumothoraxDecompressedAtTick ?? null,
    helpRequestedAtTick: equipment.airway.helpRequestedAtTick,
    highConcentrationOxygen: equipment.ventilator.fio2 >= 1,
  };
}

/** The four dispatches this lesson uses, each through a different action type. */
export const OBSTRUCTIVE_PLEURAL_SHOCK_DISPATCHES = {
  assess: { type: 'pneumothorax-response', payload: { action: 'assess-bilateral-ventilation' } },
  help: { type: 'call-for-help', payload: { context: 'tension-pneumothorax' } },
  oxygen: { type: 'ventilator', payload: { fio2: 1 } },
  decompress: { type: 'pneumothorax-response', payload: { action: 'decompress-left-chest' } },
} as const;

/** The five declared objectives, in order, as the scenario states them. */
export const OBSTRUCTIVE_PLEURAL_SHOCK_OBJECTIVES = [
  'assess-obstructive-pleural-shock',
  'escalate-obstructive-pleural-shock',
  'support-obstructive-pleural-oxygenation',
  'decompress-obstructive-pleural-shock',
  'reassess-obstructive-pleural-recovery',
] as const;

/**
 * The identity guard. The pleural event's own target is what separates this
 * from the anaesthesia pneumothorax-under-positive-pressure lesson, which
 * shares the same generic mechanics and the same debrief branch.
 */
export function supportsObstructivePleuralShock(scenario: Scenario): boolean {
  return scenario.metadata.id === 'obstructive-shock-tension-pneumothorax'
    && scenario.timeline.filter((event) => event.type === 'tension-pneumothorax'
      && event.target === 'left-pleural-space').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'obstructive-shock-tension-pneumothorax').length === 1
    && scenario.timeline.length === 2
    && scenario.equipment.airwayDevice === 'facemask'
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === OBSTRUCTIVE_PLEURAL_SHOCK_OBJECTIVES.join('|');
}
