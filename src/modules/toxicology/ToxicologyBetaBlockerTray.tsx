import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { betaBlockerInlinePrompt } from '../toxicology/tutor/beta-blocker-cardiogenic-shock-guidance';
import { Button } from '@platform/ui';

export function ToxicologyBetaBlockerTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyBetaBlockerAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = betaBlockerInlinePrompt(guidance, { scenarioVersion, betaBlocker: assessment });
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
    <section className="syringe" aria-labelledby="toxicology-beta-blocker-early-title">
      <div id="toxicology-beta-blocker-early-title" className="syringe__name">A slow pulse can hide a failing pump.</div>
      <p className="syringe__remaining">Begin with product, clock, pulse, perfusion, mentation, glucose, supplied ECG, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-beta-blocker-product-clock-pulse-perfusion-mentation-glucose-ecg-and-whole-patient') : undefined}>Connect pulse + perfusion</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-beta-blocker-cardiogenic-shock-pattern-without-pulse-only-closure') : undefined}>Recognize the shock pattern</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-beta-blocker-poison-center-resuscitation-cardiac-glucose-airway-and-safety-ownership') : undefined}>Build the rescue circle</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-beta-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary') : undefined}>Review pump + metabolism</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-beta-blocker-later-title">
      <div id="toxicology-beta-blocker-later-title" className="syringe__name">A better pressure is a checkpoint, not an exit.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Shock, rhythm, glucose, potassium, volume, recurrence, rescue, safety, and outcome uncertainty handed off.' : reassessment ? 'The fixed perfusion, mental-state, and metabolic report improved. Durable stability and treatment effect remain unproven.' : evidence ? 'Perfusion, rhythm, contractility, glucose, electrolytes, prior care, and rescue readiness stay coupled. Record qualified intent after time passes.' : support ? 'Qualified toxicology, resuscitation, cardiac, metabolic, airway, and safety ownership are active. Review the supplied evidence.' : 'Complete whole-pattern recognition and rescue ownership before treatment-boundary review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-beta-blocker-bounded-qualified-vasopressor-glucagon-insulin-euglycemia-and-rescue-intent-with-strict-later-review') : undefined}>Record rescue intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-beta-blocker-recurrent-shock-bradycardia-hypoglycemia-electrolyte-volume-rescue-and-active-risk') : undefined}>Hand off what can recur</Button>}
      </div>
    </section>
  </>;
}
