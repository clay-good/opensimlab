/**
 * HypertensiveEmergencyTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasHypertensiveEmergencyResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { hypertensiveEmergencyInlinePrompt } from './tutor/hypertensive-emergency-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function HypertensiveEmergencyTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['hypertensiveEmergencyAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const measurement = assessment?.measurementAtTick != null;
  const organInjury = assessment?.organInjuryAtTick != null;
  const phenotype = assessment?.phenotypeAtTick != null;
  const reduction = assessment?.reductionIntentAtTick != null;
  const laterPanel = assessment?.laterPanelAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : hypertensiveEmergencyInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="hypertensive-emergency-context-title">
      <div id="hypertensive-emergency-context-title" className="syringe__name">The number needs context.</div>
      <Badge kind="teaching">verified pressure · acute organ injury · pulse present</Badge>
      <div className="syringe__meta">serial readings · symptoms · brain + heart + kidney · dangerous alternatives</div>
      <p className="syringe__remaining" role="status">{phenotype && reduction ? 'Parallel review lanes complete · later panel ready' : phenotype ? 'Phenotype + causes reviewed · reduction intent remains' : reduction ? 'Reduction intent recorded · phenotype + causes remain' : organInjury ? 'Organ injury reconciled · two review lanes are open' : measurement ? 'Measurement + trajectory reconciled · organ injury review ready' : 'Verify the pressure and read its trajectory'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={measurement} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-hypertensive-emergency-measurement-and-trajectory') : undefined}>Reconcile pressure trajectory</Button>
        <Button className="crisis-drug__action" disabled={!measurement || organInjury} aria-disabled={demonstrating} onClick={act ? () => act('review-hypertensive-emergency-organ-injury') : undefined}>Review acute organ injury</Button>
        <Button className="crisis-drug__action" disabled={!organInjury || phenotype} aria-disabled={demonstrating} onClick={act ? () => act('review-hypertensive-emergency-phenotype-and-causes') : undefined}>Review phenotype + causes</Button>
      </div>
      <p className="field__hint">Readings, examination, laboratory, ECG, and imaging statements are authored. Pressure magnitude alone does not distinguish emergency from severe hypertension without acute organ injury.</p>
    </section>
    <section className="syringe" aria-labelledby="hypertensive-emergency-reassessment-title">
      <div id="hypertensive-emergency-reassessment-title" className="syringe__name">Lower carefully. Protect perfusion.</div>
      <Badge kind="teaching">monitored intent · symptoms · organ perfusion · serial pressure</Badge>
      <div className="syringe__meta">controlled trajectory · no normalization race · cause work stays open</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Trajectory, pending causes, and owners handed off' : laterPanel ? 'Pressure + organ-perfusion panel reviewed · handoff due' : phenotype && reduction ? 'Phenotype + reduction intent aligned · allow the later panel' : phenotype ? 'Phenotype reviewed · controlled-reduction intent remains' : reduction ? 'Reduction intent recorded · phenotype + causes remain' : organInjury ? 'Phenotype and reduction lanes can proceed in parallel' : 'Complete the organ-injury review first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!organInjury || reduction} aria-disabled={demonstrating} onClick={act ? () => act('record-hypertensive-emergency-controlled-reduction-intent') : undefined}>Record controlled-reduction intent</Button>
        <Button className="crisis-drug__action" disabled={!phenotype || !reduction || laterPanel} aria-disabled={demonstrating} onClick={act ? () => act('review-hypertensive-emergency-later-panel') : undefined}>Review later organ panel</Button>
        <Button className="crisis-drug__action" disabled={!laterPanel || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-hypertensive-emergency-reassessment') : undefined}>Hand off causes + owners</Button>
      </div>
      <p className="field__hint">No agent, dose, infusion, numeric goal, access, device, delivery, home regimen, disposition, prognosis, or outcome is selected. New organ-specific deterioration opens acute rescue.</p>
    </section>
    </div>
  </div>;
}
