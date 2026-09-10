/**
 * NeurologyCerebellarIchTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyCerebellarIchResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { cerebellarIchInlinePrompt } from './tutor/spontaneous-cerebellar-intracerebral-hemorrhage-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyCerebellarIchTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyCerebellarIchAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = cerebellarIchInlinePrompt(guidance, { scenarioVersion, cerebellarIch: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const imaging = assessment?.imagingAtTick != null;
  const boundary = assessment?.boundaryAtTick != null;
  const ownership = assessment?.ownershipAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-cerebellar-ich-location-title">
      <div id="neurology-cerebellar-ich-location-title" className="syringe__name">Location changes the danger.</div>
      <div className="syringe__meta">fixed cerebellar hemorrhage report · supplied neurologic record</div>
      <p className="syringe__remaining">{ownership ? 'Qualified neurocritical, neurosurgical, and airway-capable ownership is active.' : boundary ? 'Escalation boundary clear · activate qualified ownership' : imaging ? 'Posterior-fossa threats reviewed · recognize the escalation boundary' : trajectory ? 'Trajectory clear · review the supplied CT context' : 'Start with the clock, posterior pattern, alertness, and whole patient.'}</p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient') : undefined}>Review clock + neurologic trajectory</Button>}
        {trajectory && !imaging && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-cerebellar-ich-imaging-location-causes-and-immediate-threats') : undefined}>Review fixed CT + threat context</Button>}
        {imaging && !boundary && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary') : undefined}>Recognize posterior-fossa escalation</Button>}
        {boundary && !ownership && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership') : undefined}>Activate qualified neuro + airway ownership</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neurology-cerebellar-ich-trajectory-title">
      <div id="neurology-cerebellar-ich-trajectory-title" className="syringe__name">Stability is only a checkpoint.</div>
      <div className="syringe__meta">fixed later report · procedure and outcome remain open</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Trajectory, imaging context, active risk, and owners handed off.' : later ? 'Repeat CT reports expansion, hydrocephalus, and brainstem compression. Future course remains open.' : ownership ? 'Qualified ownership is active. Review the fixed later report.' : 'Complete recognition and qualified ownership before reassessment.'}</p>
      <div className="syringe__presets">
        {ownership && !later && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-cerebellar-ich-strict-later-neurologic-and-airway-trajectory') : undefined}>Review the later neurologic report</Button>}
        {later && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-cerebellar-ich-imaging-expansion-etiology-and-active-risk') : undefined}>Hand off imaging + active risk</Button>}
      </div>
    </section>
  </div>;
}
