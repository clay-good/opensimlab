/**
 * PericardialTamponadeTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasPericardialTamponadeResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { pericardialTamponadeInlinePrompt } from './tutor/pericardial-tamponade-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function PericardialTamponadeTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['pericardialTamponadeAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const trajectory = assessment?.trajectoryAtTick != null;
  const drainage = assessment?.drainageResponseAtTick != null;
  const etiology = assessment?.etiologyAtTick != null;
  const surveillance = assessment?.surveillanceAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : pericardialTamponadeInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="pericardial-tamponade-response-title">
      <div id="pericardial-tamponade-response-title" className="syringe__name">Drainage changed the curve.</div>
      <Badge kind="teaching">reported drainage · serial circulation</Badge>
      <div className="syringe__meta">pulse + pressure · perfusion + symptoms · authored echo</div>
      <p className="syringe__remaining" role="status">{drainage ? 'Immediate response reviewed · two follow-up lanes are open' : trajectory ? 'Serial circulation reconciled · reported drainage response ready' : 'Begin with the pre- and post-drainage circulation'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={trajectory} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-pericardial-tamponade-trajectory') : undefined}>Reconcile serial circulation</Button>
        <Button className="crisis-drug__action" disabled={!trajectory || drainage} aria-disabled={demonstrating} onClick={act ? () => act('review-pericardial-tamponade-drainage-response') : undefined}>Review reported drainage response</Button>
      </div>
      <p className="field__hint">The drainage and echo statements are authored team reports. Response supports the working physiology without proving exclusive cause, imaging skill, procedural skill, or durable resolution.</p>
    </section>
    <section className="syringe" aria-labelledby="pericardial-tamponade-follow-up-title">
      <div id="pericardial-tamponade-follow-up-title" className="syringe__name">Explain. Watch. Hand off.</div>
      <Badge kind="teaching">etiology · recurrence · surveillance · owner</Badge>
      <div className="syringe__meta">medications + bleeding · pathology · serial examination + echo</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Cause, recurrence risk, and owners handed off' : etiology && surveillance ? 'Both follow-up lanes complete · handoff ready' : etiology ? 'Etiology reviewed · surveillance remains' : surveillance ? 'Surveillance reviewed · etiology remains' : drainage ? 'Etiology and surveillance can proceed in parallel' : 'Review the reported drainage response first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!drainage || etiology} aria-disabled={demonstrating} onClick={act ? () => act('review-pericardial-tamponade-etiology') : undefined}>Review etiology + contributors</Button>
        <Button className="crisis-drug__action" disabled={!drainage || surveillance} aria-disabled={demonstrating} onClick={act ? () => act('review-pericardial-tamponade-surveillance') : undefined}>Review recurrence surveillance</Button>
        <Button className="crisis-drug__action" disabled={!etiology || !surveillance || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-pericardial-tamponade-reassessment') : undefined}>Hand off open risks</Button>
      </div>
      <p className="field__hint">No fluid or vasoactive recipe, image acquisition, drainage route, catheter manipulation, device choice, technical success, disposition, or outcome is supplied.</p>
    </section>
    </div>
  </div>;
}
