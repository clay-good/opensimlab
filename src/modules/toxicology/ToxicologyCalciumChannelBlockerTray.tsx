import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { calciumChannelBlockerInlinePrompt } from '../toxicology/tutor/calcium-channel-blocker-shock-guidance';
import { Button } from '@platform/ui';

export function ToxicologyCalciumChannelBlockerTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyCalciumChannelBlockerAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = calciumChannelBlockerInlinePrompt(guidance, { scenarioVersion, calciumChannelBlocker: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const support = assessment?.supportAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="toxicology-calcium-channel-blocker-early-title">
      <div id="toxicology-calcium-channel-blocker-early-title" className="syringe__name">The high glucose belongs beside the slow rhythm.</div>
      <p className="syringe__remaining">Begin with product, formulation, clock, perfusion, conduction, glucose, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-calcium-channel-blocker-product-formulation-clock-perfusion-rhythm-glucose-and-whole-patient') : undefined}>Connect rhythm + glucose</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-calcium-channel-blocker-mixed-shock-pattern-without-glucose-or-pulse-only-closure') : undefined}>Recognize mixed shock</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-calcium-channel-blocker-poison-center-resuscitation-cardiac-metabolic-airway-and-safety-ownership') : undefined}>Build the rescue circle</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-calcium-channel-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary') : undefined}>Review pump + vessels</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-calcium-channel-blocker-later-title">
      <div id="toxicology-calcium-channel-blocker-later-title" className="syringe__name">Extended release means the clock keeps mattering.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Shock, conduction, glucose, potassium, volume, absorption, rescue, safety, and outcome uncertainty handed off.' : reassessment ? 'The fixed perfusion, rhythm, mental-state, and metabolic report improved. Durable stability and completed absorption remain unproven.' : evidence ? 'Perfusion, conduction, contractility, vascular tone, glucose, electrolytes, prior care, and prolonged absorption stay coupled. Record qualified intent after time passes.' : support ? 'Qualified toxicology, resuscitation, cardiac, metabolic, airway, and safety ownership are active. Review the supplied evidence.' : 'Complete whole-pattern recognition and rescue ownership before treatment-boundary review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-calcium-channel-blocker-bounded-qualified-vasopressor-calcium-insulin-euglycemia-and-rescue-intent-with-strict-later-review') : undefined}>Record rescue intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-calcium-channel-blocker-recurrent-shock-av-block-hyperglycemia-electrolyte-volume-rescue-and-active-risk') : undefined}>Hand off delayed risk</Button>}
      </div>
    </section>
  </>;
}
