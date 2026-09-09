/**
 * A lesson's worked example, described as data.
 *
 * Every observed-state demonstration is the same three things: a predicate that
 * recognises the lesson, the action type its beats dispatch, and a step read
 * from the patient's resuscitation snapshot. Written this way, a module can hand
 * its own examples to the cockpit through `ClinicalModuleConfig` instead of the
 * cockpit importing all 242 of them.
 *
 * That import is why this exists. `Cockpit.tsx` called one
 * `use<Lesson>Demonstration` hook per lesson, and a demonstration module carries
 * its narration, so every lesson's script was in the shared cockpit chunk and a
 * lesson added to one module grew the download for all sixteen.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { Scenario } from '@anesthesia/scenarios/types';
import type { ObservedStep } from './useObservedDemonstration';

export interface LessonDemonstration {
  /**
   * Which lesson this is, so the cockpit can tell one tray that its own example
   * is running without importing the lesson. A string costs nothing in the
   * shared chunk; the narration behind it is what did.
   */
  readonly id: string;
  /** True for the exact scenario, at the exact content version, this example was written against. */
  readonly supports: (scenario: Scenario) => boolean;
  readonly actionType: string;
  /** Undefined before the first state message arrives, which the step handles. */
  readonly step: (resuscitation: EquipmentSnapshot['resuscitation'] | undefined) => ObservedStep;
}
