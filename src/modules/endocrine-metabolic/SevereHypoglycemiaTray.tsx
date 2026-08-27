import { Button } from '@platform/ui';
import type { SevereHypoglycemiaSnapshot } from '@platform/kernel/protocol';
import type { HypoglycemiaAction } from './severe-hypoglycemia';

export function SevereHypoglycemiaTray({ assessment, onAction }: {
  readonly assessment?: SevereHypoglycemiaSnapshot;
  readonly onAction: (action: HypoglycemiaAction) => void;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const rescueAvailable = assessment.firstRescueAtTick === null
    || (assessment.recurrenceActive && assessment.secondRescueAtTick === null);
  return <>
    <section className="syringe" aria-labelledby="hypoglycemia-observe-title">
      <div id="hypoglycemia-observe-title" className="syringe__name">Notice the person. Verify the glucose.</div>
      <p className="syringe__remaining" role="status">
        {assessment.consciousness === 'more-alert' ? 'More alert.' : assessment.consciousness === 'hard-to-rouse' ? 'Harder to rouse; urgent rescue remains open.' : 'Sweaty and drowsy; oral treatment is unsafe.'}
        {' '}{assessment.glucoseMgPerDl === null ? 'Glucose has not been checked.' : `Last checked glucose: ${assessment.glucoseMgPerDl} mg/dL, at simulated ${Math.floor((assessment.measuredAtTick ?? 0) / 600)} min. A past result may be stale.`}
        {assessment.choiceFeedback && !assessment.ended && <span> {assessment.choiceFeedback}</span>}
      </p>
      <p className="syringe__remaining">{assessment.medicationReviewed ? 'Record: glimepiride, kidney disease, and poor intake for 2 days. Qualified medication, nutrition, and recurrence review remain necessary.' : 'The medication and intake record is available to review.'}</p>
      {!assessment.ended && <div className="crisis-drug__actions">
        <Button onClick={() => onAction('check-glucose')}>Check bedside glucose</Button>
        {!assessment.medicationReviewed && <Button onClick={() => onAction('review-medications')}>Review medication and intake record</Button>}
        {!assessment.supportActive && <Button onClick={() => onAction('call-support')}>Call qualified support</Button>}
      </div>}
    </section>
    <section className="syringe" aria-labelledby="hypoglycemia-act-title">
      <div id="hypoglycemia-act-title" className="syringe__name">Rescue, reassess, stay with the risk.</div>
      <p className="syringe__remaining">{assessment.ended === 'handoff' ? 'Practice complete: supervised monitoring and recurrence-risk ownership are handed off. This is not discharge clearance.' : assessment.ended === 'instructor-takeover' ? 'This branch ended with instructor takeover. Open the debrief, then try a different rescue decision.' : assessment.monitoringActive ? 'Continued monitoring is active. Watch for new symptoms and repeat glucose when they change.' : 'A reassuring result does not end the risk. Choose your response and keep reassessing.'}</p>
      {assessment.recheckDueInSeconds !== null && !assessment.ended && <p className="syringe__remaining">Post-rescue check due in {assessment.recheckDueInSeconds} simulated seconds. Use the 60× clock speed to move through the observation period.</p>}
      {!assessment.ended && <div className="crisis-drug__actions">
        {rescueAvailable && <>
          <Button disabled={!assessment.supportActive || assessment.glucoseMgPerDl === null} onClick={() => onAction('iv-rescue')}>{assessment.recurrenceActive ? 'Request repeat qualified IV rescue' : 'Request qualified IV rescue'}</Button>
          <Button onClick={() => onAction('oral-glucose')}>Choose oral glucose</Button>
        </>}
        {(assessment.firstRecheckComplete || assessment.secondRecheckComplete) && !assessment.monitoringActive && <Button onClick={() => onAction('continue-monitoring')}>Continue supervised monitoring</Button>}
        {assessment.firstRecheckComplete && !assessment.recurrenceActive && !assessment.secondRecheckComplete && <Button onClick={() => onAction('close-case')}>Close the episode after this result</Button>}
        {assessment.secondRecheckComplete && <Button onClick={() => onAction('handoff')}>Hand off with ongoing monitoring</Button>}
      </div>}
    </section>
  </>;
}
