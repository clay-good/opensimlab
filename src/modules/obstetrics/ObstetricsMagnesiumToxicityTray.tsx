import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { magnesiumToxicityInlinePrompt } from '../obstetrics/tutor/magnesium-sulfate-toxicity-recognition-guidance';
import { Button } from '@platform/ui';

export function ObstetricsMagnesiumToxicityTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsMagnesiumToxicityAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = magnesiumToxicityInlinePrompt(guidance, { scenarioVersion, magnesiumToxicity: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const uncertainty = assessment?.uncertaintyAtTick != null;
  const readiness = assessment?.readinessAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="obstetrics-magnesium-toxicity-now-title">
      <div id="obstetrics-magnesium-toxicity-now-title" className="syringe__name">Notice the quiet change. Bring the whole team close.</div>
      <p className="syringe__remaining">Connect breathing, strength, reflexes, exposure, and clearance. The learner surface keeps every infusion, airway, antidote, and dose with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-magnesium-toxicity-airway-anesthesia-critical-care-pharmacy-and-support-response') : undefined}>Activate airway-capable response</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-magnesium-toxicity-exposure-renal-respiratory-reflex-neurologic-and-whole-person') : undefined}>Connect exposure + clearance</Button>}
        {context && !uncertainty && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-magnesium-toxicity-multisignal-level-unit-and-alternative-cause-boundaries') : undefined}>Review units + alternatives</Button>}
        {uncertainty && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-magnesium-toxicity-source-stop-airway-ventilation-antidote-monitoring-newborn-and-support-readiness') : undefined}>Review parallel readiness</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="obstetrics-magnesium-toxicity-later-title">
      <div id="obstetrics-magnesium-toxicity-later-title" className="syringe__name">A better number is not yet a safe person.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Respiratory, renal, preeclampsia, medication, newborn, support, and outcome risks handed off.' : reassessment ? 'Breathing is partly improved in the fixed report. Reflexes, clearance, recovery, and outcomes remain open.' : readiness ? 'The qualified response is moving in parallel. Review the fixed report after time passes.' : support ? 'The response is active. Connect the pattern without waiting for one serum threshold.' : 'Start with a calm declaration and airway-capable shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-magnesium-toxicity-fixed-five-minute-qualified-response-report') : undefined}>Review the fixed 5-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-magnesium-toxicity-respiratory-renal-preeclampsia-medication-newborn-support-and-outcome-risk') : undefined}>Hand off active quiet risk</Button>}
      </div>
    </section>
  </>;
}
