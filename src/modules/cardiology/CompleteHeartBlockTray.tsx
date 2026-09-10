/**
 * CompleteHeartBlockTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasCompleteHeartBlockResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { completeHeartBlockInlinePrompt } from './tutor/complete-heart-block-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function CompleteHeartBlockTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['completeHeartBlockAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const stability = assessment?.stabilityAtTick != null;
  const context = assessment?.contextAtTick != null;
  const pathway = assessment?.pathwayAtTick != null;
  const reassessed = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : completeHeartBlockInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="complete-heart-block-first-title">
      <div id="complete-heart-block-first-title" className="syringe__name">Two rhythms. One patient.</div>
      <Badge kind="teaching">fixed complete AV block · stable now</Badge>
      <div className="syringe__meta">atria 82/min · escape 34/min · BP 116/70</div>
      <p className="syringe__remaining" role="status">{context ? 'Context reviewed · complete block remains authored' : stability ? 'Stable now · context and escalation can proceed together' : 'Read the fixed block through the whole patient'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={stability} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-complete-heart-block-stability') : undefined}>Reconcile block + stability</Button>
        <Button className="crisis-drug__action" disabled={!stability || context} aria-disabled={demonstrating} onClick={act ? () => act('review-complete-heart-block-context') : undefined}>Review causes + escape rhythm</Button>
      </div>
      <p className="field__hint">The fixed diagnostic report establishes AV dissociation. The teaching monitor illustrates it; stable does not mean low risk.</p>
    </section>
    <section className="syringe" aria-labelledby="complete-heart-block-plan-title">
      <div id="complete-heart-block-plan-title" className="syringe__name">Prepare early. Decide together.</div>
      <Badge kind="teaching">continuous monitor · pads · pacing-capable team</Badge>
      <div className="syringe__meta">deterioration plan · definitive evaluation · handoff</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Pacing evaluation + owner + handoff recorded' : reassessed ? 'Persistent block · definitive evaluation due' : context && pathway ? 'Context + escalation aligned · allow reassessment time' : pathway ? 'Pacing-capable care active · cause review continues' : context ? 'Context ready · activate pacing-capable care' : 'Whole-patient review opens monitored escalation'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!stability || pathway} aria-disabled={demonstrating} onClick={act ? () => act('activate-complete-heart-block-pathway') : undefined}>Activate monitored pacing pathway</Button>
        <Button className="crisis-drug__action" disabled={!context || !pathway || reassessed} aria-disabled={demonstrating} onClick={act ? () => act('reassess-complete-heart-block-trajectory') : undefined}>Reassess block + perfusion</Button>
        <Button className="crisis-drug__action" disabled={!reassessed || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-complete-heart-block-pacing-plan') : undefined}>Record pacing evaluation + handoff</Button>
      </div>
      <p className="field__hint">No routine oxygen, atropine gate, pacing, capture check, device choice, or implantation occurs here. New compromise opens acute rescue care.</p>
    </section>
    </div>
  </div>;
}
