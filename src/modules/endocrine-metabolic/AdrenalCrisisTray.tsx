import { Button } from '@platform/ui';
import type { AdrenalCrisisSnapshot } from '@platform/kernel/protocol';
import type { AdrenalCrisisAction } from './adrenal-crisis';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { adrenalInlinePrompt, ADRENAL_SOURCE_HREF } from './tutor/adrenal-guidance';

export function AdrenalCrisisTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', onOpenSource, demonstrating = false }: {
  readonly assessment?: AdrenalCrisisSnapshot;
  readonly scenarioVersion: string;
  readonly onAction: (action: AdrenalCrisisAction) => void;
  readonly guidance?: GuidanceLevel;
  readonly onOpenSource?: () => void;
  readonly demonstrating?: boolean;
}) {
  if (!assessment) return <p role="status">Preparing the fictional patient…</p>;
  const observation = assessment.observation;
  const prompt = adrenalInlinePrompt(guidance, { scenarioId: 'adrenal-crisis-treatment-before-tests', scenarioVersion,
    adrenalCrisis: assessment, tick: 0, state: null, actions: [], ventilating: false, alarmCount: 0 });
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    {!demonstrating && prompt && <aside className="syringe" aria-label="Private tutor">
      <div className="syringe__name">A moment to think</div>
      <p className="syringe__remaining">{prompt.suggestion}</p>
      <p className="syringe__remaining">{prompt.because}</p>
    </aside>}
    <p className="syringe__remaining"><a href={ADRENAL_SOURCE_HREF} target="_blank" rel="noreferrer" onClick={onOpenSource}>Read the source (opens in a new tab)</a></p>
    <section className="syringe" aria-labelledby="adrenal-rescue-title">
      <div id="adrenal-rescue-title" className="syringe__name">Treat the emergency. Keep investigating.</div>
      <p className="syringe__remaining">Current alertness: {assessment.alertness}. Do not wait for cortisol to begin qualified rescue.</p>
      <p className="syringe__remaining" role="status">{assessment.choiceFeedback ?? 'Choose your first response. The patient clock keeps running until you pause.'}</p>
      {!assessment.ended && <div className="crisis-drug__actions">
        {assessment.hydrocortisoneAtTick === null && <Button disabled={demonstrating} onClick={() => onAction('hydrocortisone')}>Start qualified parenteral hydrocortisone</Button>}
        {assessment.salineAtTick === null && <Button disabled={demonstrating} onClick={() => onAction('saline')}>Start qualified isotonic saline pathway</Button>}
        {!assessment.supportActive && <Button disabled={demonstrating} onClick={() => onAction('call-support')}>Call qualified support</Button>}
        {assessment.hydrocortisoneAtTick === null && <>
          <Button disabled={demonstrating} onClick={() => onAction('wait-for-cortisol')}>Wait for cortisol before steroids</Button>
          <Button disabled={demonstrating} onClick={() => onAction('oral-only')}>Rely on oral replacement only</Button>
        </>}
      </div>}
    </section>
    <section className="syringe" aria-labelledby="adrenal-reassess-title">
      <div id="adrenal-reassess-title" className="syringe__name">Reassess now. Protect the next handoff.</div>
      <p className="syringe__remaining">{observation ? `Last bedside reassessment at simulated ${Math.floor(observation.atTick / 600)} min: BP ${observation.systolicMmHg}/${observation.diastolicMmHg} mmHg, HR ${observation.heartRateBpm}/min; ${observation.alertness}. This observation can become stale.` : 'No new bedside reassessment has been requested.'}</p>
      <p className="syringe__remaining">{assessment.recordReviewed ? 'Record: primary adrenal insufficiency; hydrocortisone and fludrocortisone not retained during 2 days of vomiting. Initial Na 126 mmol/L, K 5.7 mmol/L, glucose 96 mg/dL. These are not current repeat results. Continue serial laboratory, fluid-balance, and precipitant review.' : 'The replacement history and initial laboratory record are available. Reviewing them is not a prerequisite for rescue.'}</p>
      {assessment.responseDueInSeconds !== null && !assessment.ended && <p className="syringe__remaining">Authored combined-response checkpoint in {assessment.responseDueInSeconds} simulated seconds. Keep reassessing in the meantime; 60× advances the observation period.</p>}
      {assessment.ended ? <p className="syringe__remaining">{assessment.ended === 'handoff' ? 'Practice complete: ongoing treatment and prevention ownership are handed off. This is not discharge clearance.' : 'Instructor takeover ended this branch. Open the debrief, then try a different rescue decision.'}</p> : <div className="crisis-drug__actions">
        <Button disabled={demonstrating} onClick={() => onAction('reassess')}>Reassess circulation and alertness</Button>
        {!assessment.recordReviewed && <Button disabled={demonstrating} onClick={() => onAction('review-record')}>Review replacement and laboratory record</Button>}
        {assessment.responseObserved && !assessment.preventionPlanned && <Button disabled={demonstrating} onClick={() => onAction('prevention')}>Plan steroid continuity and prevention</Button>}
        {assessment.preventionPlanned && <Button disabled={demonstrating} onClick={() => onAction('handoff')}>Hand off ongoing treatment and risk</Button>}
      </div>}
    </section>
  </>;
}
