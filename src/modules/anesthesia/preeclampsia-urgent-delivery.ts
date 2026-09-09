import type { Scenario } from './scenarios/types';

/**
 * The identity and the reference transcripts of the preeclampsia-urgent-delivery
 * lesson.
 *
 * The twenty-second anaesthesia lab. Three bounded actions and a counterfactual
 * that is unusually clean: one of the two drugs is credited by an objective and
 * moves the pressure not at all.
 */

/** The four declared objectives, in order, as the scenario states them. */
export const PREECLAMPSIA_URGENT_DELIVERY_OBJECTIVES = [
  'confirm-persistent-severe-hypertension',
  'treat-severe-pregnancy-hypertension',
  'start-preeclampsia-seizure-prophylaxis',
  'reassess-preeclampsia-response',
] as const;

/**
 * The same identity guard the evidence applies, so nothing reads a look-alike.
 *
 * Named by the narrative target the engine checks before offering any of the
 * three bounded actions. The module holds a second severe-preeclampsia lesson in
 * obstetrics with a different target, and this guard must never answer for it.
 */
export function supportsPreeclampsiaUrgentDelivery(scenario: Scenario): boolean {
  return scenario.metadata.id === 'preeclampsia-urgent-delivery'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'persistent-severe-preeclampsia')
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PREECLAMPSIA_URGENT_DELIVERY_OBJECTIVES.join('|');
}
