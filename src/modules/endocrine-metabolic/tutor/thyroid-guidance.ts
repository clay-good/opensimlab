import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ThyroidStormSnapshot } from '../thyroid-storm';

export const THYROID_SOURCE_HREF = 'https://doi.org/10.1530/ETJ-26-0043';
export const THYROID_SOURCE_ID = 'eta-bta-sfe-thyroid-emergencies-2026';

/** Quiet, version-bound reading support; never selects or dispatches treatment. */
export function thyroidInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly thyroidStorm?: ThyroidStormSnapshot;
}) {
  const patient = input.thyroidStorm;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.1' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because, sourceHref: THYROID_SOURCE_HREF };
  if (patient.synthesisAtTick === null || patient.supportiveCareAtTick === null || !patient.supportActive) {
    return prompt('thyroid-urgent-care', true, 'Start the emergency response while the team investigates.',
      'Qualified synthesis blockade, supportive care, and help address different parts of this emergency. Laboratory confirmation and circulation assessment do not hold up urgent treatment.');
  }
  if (patient.circulationAssessedAtTick === null) {
    return prompt('thyroid-circulation', true, 'What is sustaining circulation behind the fast pulse?',
      'Assess perfusion and congestion before an individualized rate-control decision. Slowing a compensatory pulse can worsen circulatory failure; pulse rate alone does not establish safety.');
  }
  if (patient.rateControlReviewedAtTick === null) {
    return prompt('thyroid-rate-review', true, 'Bring the poor perfusion and congestion into the qualified rate-control review.',
      'The team must weigh cardiac function and hemodynamic monitoring. Recording a review does not give a beta blocker or prove any agent is safe.');
  }
  if (patient.iodineAtTick === null) {
    return patient.iodineDueInSeconds === 0
      ? prompt('thyroid-iodine-ready', false, 'The selected pathway’s iodine interval has elapsed.',
        'This lesson follows at least 1 hour of thionamide synthesis blockade before iodine. The timing constraint is now satisfied; treatment still needs an explicit decision.')
      : prompt('thyroid-iodine-sequence', false, 'Keep urgent care and frequent assessment going while preserving the iodine sequence.',
        'In this selected pathway, block new hormone synthesis before supplying iodine. Other specialist pathways can differ. Never wait for a teaching checkpoint if the patient worsens.');
  }
  if (patient.responseDueInSeconds !== null) {
    return prompt('thyroid-serial-assessment', false, 'Keep checking temperature, alertness, breathing, and perfusion.',
      'The 2-hour checkpoint is an authored early partial-support response, not a predicted hormone response. It does not set the bedside reassessment interval.');
  }
  if (!patient.responseObserved) {
    return prompt('thyroid-fresh-assessment', true, 'What does a fresh bedside reassessment show now?',
      'A completed treatment package is not an observed response. Persistent fever, tachycardia, and circulatory risk need ongoing qualified review even when some observations improve.');
  }
  return prompt('thyroid-handoff', false, 'Hand off an active emergency, not a recovered patient.',
    'Include the suspected trigger, treatments and timing, current response, and cardiac risk. The receiving team owns ongoing treatment and serial review; this rehearsal cannot establish recovery.');
}
