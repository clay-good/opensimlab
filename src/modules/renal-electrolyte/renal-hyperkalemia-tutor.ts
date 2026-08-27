import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RenalHyperkalemiaSnapshot } from '@platform/kernel/protocol';

export const RENAL_HYPERKALEMIA_SOURCE_HREF = 'https://www.ukkidney.org/health-professionals/guidelines/treatment-acute-hyperkalaemia-adults-0';
export const RENAL_HYPERKALEMIA_KDIGO_SOURCE_HREF = 'https://kdigo.org/wp-content/uploads/2018/04/KDIGO-Acute-Hyperkalemia-conf-report-FINAL.pdf';

/** Accepted care and requested findings guide the tutor; hidden potassium does not. */
export function renalHyperkalemiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly renalHyperkalemia?: RenalHyperkalemiaSnapshot;
}) {
  const patient = input.renalHyperkalemia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because, sourceHref: RENAL_HYPERKALEMIA_SOURCE_HREF };
  if (patient.calciumAtTick === null) return prompt('renal-hyperkalemia-calcium', true,
    'Address the supplied ECG conduction change with qualified cardioprotection.',
    'Calcium and potassium-lowering care serve different purposes. Neither waits for a review acknowledgment or another laboratory click. This lesson supplies no dose or route.');
  if (patient.shiftAtTick === null) return prompt('renal-hyperkalemia-shift', true,
    'Arrange qualified potassium-shifting treatment alongside glucose surveillance.',
    'A better ECG after calcium does not show potassium removal. The shifting response is temporary; review definitive removal and continued monitoring in parallel.');
  if (!patient.supportActive) return prompt('renal-hyperkalemia-support', true,
    'Bring qualified acute-care and kidney support into the plan.',
    'Share urgent treatment and continuing-care ownership. A support acknowledgment is not a prerequisite for cardioprotection, shifting, or delivered removal.');
  if (patient.contextReviewedAtTick === null) return prompt('renal-hyperkalemia-context', true,
    'Review the confirmed sample, kidney injury, medications, and volume context.',
    'The starting potassium is a supplied nonhemolyzed finding. Individualize the cause review and treatment while urgent care continues.');
  if (patient.removalPlanAtTick === null) return prompt('renal-hyperkalemia-plan', true,
    'Coordinate an individualized potassium-removal plan.',
    'Planning and actual treatment delivery are distinct. No single removal modality or automatic dialysis decision is prescribed here.');
  if (patient.removalAtTick === null) return prompt('renal-hyperkalemia-removal', true,
    'Confirm qualified potassium-removal treatment is actually delivered.',
    'A plan alone has no potassium effect. Calcium does not lower potassium, and shifting does not remove it from the body.');
  if (patient.monitoringAtTick === null) return prompt('renal-hyperkalemia-monitor', true,
    'Arrange serial potassium, ECG, and blood-glucose surveillance.',
    'A glucose or ECG check is useful partial information, but neither refreshes an older potassium measurement. Surveillance continues after apparent improvement.');
  if (!patient.shiftResponseObserved && !patient.removalResponseObserved && !patient.reboundObserved
    && patient.removalDueInSeconds !== null) return patient.shiftDueInSeconds !== null
    ? prompt('renal-hyperkalemia-observe-shift', false, 'Continue treatment and reassessment while the example progresses.',
      'The 30-minute checkpoint is authored, not a required clinical wait. Earlier requested findings remain historical; reassess sooner whenever needed.')
    : prompt('renal-hyperkalemia-reassess-shift', true, 'Request potassium, glucose, ECG, and bedside reassessment together.',
      'The response must be observed, not inferred from accepted care, an ECG change, or a teaching clock.');
  if (patient.removalDueInSeconds !== null) return prompt('renal-hyperkalemia-observe-removal', false,
    'Continue the removal plan and serial surveillance.',
    'The 60-minute contrast is authored rather than predicted treatment kinetics. Temporary cardioprotection and shifting do not establish durable control.');
  if (!patient.removalResponseObserved) return prompt('renal-hyperkalemia-reassess-removal', true,
    'Request fresh full findings before handing off the continuing plan.',
    'New ECG or glucose findings do not refresh potassium. Keep any observed rebound and unresolved treatment response explicit.');
  return prompt('renal-hyperkalemia-handoff', false, 'Hand off active risks, delivered treatment, and repeated assessments.',
    'Confirm who owns potassium and glucose follow-up. Handoff does not mean normalization, discharge, or durable safety.');
}
