/**
 * RightVentricularInfarctionTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasRightVentricularInfarctionResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { rightVentricularInfarctionInlinePrompt } from './tutor/right-ventricular-infarction-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function RightVentricularInfarctionTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['rightVentricularInfarctionAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const pattern = assessment?.reconciledAtTick != null;
  const phenotype = assessment?.phenotypeAtTick != null;
  const support = assessment?.supportAtTick != null;
  const reperfusion = assessment?.reperfusionAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : rightVentricularInfarctionInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="right-ventricular-infarction-pattern-title">
      <div id="right-ventricular-infarction-pattern-title" className="syringe__name">The right side changes the bridge.</div>
      <Badge kind="teaching">inferior infarction · RV pattern · pulse present</Badge>
      <div className="syringe__meta">right-sided ECG · authored echo · preload + medication harms · perfusion</div>
      <p className="syringe__remaining" role="status">{phenotype ? 'RV phenotype + bridge hazards reconciled' : pattern ? 'RV pattern reconciled · phenotype review ready' : 'Read the RV pattern beside the whole circulation'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={pattern} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-right-ventricular-infarction') : undefined}>Reconcile RV trajectory</Button>
        <Button className="crisis-drug__action" disabled={!pattern || phenotype} aria-disabled={demonstrating} onClick={act ? () => act('review-right-ventricular-infarction-phenotype') : undefined}>Review RV phenotype + harms</Button>
      </div>
      <p className="field__hint">The ECG and echo are authored reports, not acquired skills. In this hypotensive, preload-sensitive case no nitrate or reflex diuretic is selected; no universal prohibition is taught.</p>
    </section>
    <section className="syringe" aria-labelledby="right-ventricular-infarction-support-title">
      <div id="right-ventricular-infarction-support-title" className="syringe__name">Support gently. Reperfuse early.</div>
      <Badge kind="teaching">cautious bridge · reperfusion owner · serial perfusion</Badge>
      <div className="syringe__meta">pressure + brain + skin + kidney · rhythm + conduction · congestion</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Later perfusion + owners handed off · RV risk remains' : support && reperfusion ? 'Team + bridge aligned · allow a later handoff' : reperfusion ? 'Reperfusion stays active · cautious support remains' : support ? 'Support intent recorded · active reperfusion remains' : phenotype ? 'Reperfusion + support lanes are open' : pattern ? 'Keep reperfusion moving while RV review continues' : 'Reconcile the whole-patient trajectory first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!phenotype || support} aria-disabled={demonstrating} onClick={act ? () => act('record-right-ventricular-infarction-support') : undefined}>Record cautious support intent</Button>
        <Button className="crisis-drug__action" disabled={!pattern || reperfusion} aria-disabled={demonstrating} onClick={act ? () => act('preserve-right-ventricular-infarction-reperfusion') : undefined}>Keep reperfusion moving</Button>
        <Button className="crisis-drug__action" disabled={!support || !reperfusion || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-right-ventricular-infarction') : undefined}>Hand off later trajectory</Button>
      </div>
      <p className="field__hint">No bolus volume, drug, dose, medication delivery, PCI, device, shock-center transfer, disposition, prognosis, or outcome is selected. New compromise or pulse loss opens acute rescue.</p>
    </section>
    </div>
  </div>;
}
