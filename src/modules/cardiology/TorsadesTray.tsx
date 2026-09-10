/**
 * TorsadesTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasTorsadesResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { torsadesInlinePrompt } from './tutor/torsades-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function TorsadesTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['torsadesAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const recognition = assessment?.recognitionAtTick != null;
  const shock = assessment?.shockIntentAtTick != null;
  const postShock = assessment?.postShockAtTick != null;
  const context = assessment?.contextAtTick != null;
  const recurrence = assessment?.recurrenceIntentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  const prompt = demonstrating ? null
    : torsadesInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
    <section className="syringe" aria-labelledby="torsades-rescue-title">
      <div id="torsades-rescue-title" className="syringe__name">Polymorphic means shock now.</div>
      <Badge kind="out-of-range">sustained torsades · weak pulse · compromised</Badge>
      <div className="syringe__meta">~220/min · BP 74/42 · confused · QTc 560 ms before event</div>
      <p className="syringe__remaining" role="status">{postShock ? 'Sinus 52/min · QT remains prolonged' : shock ? 'Unsynchronized intent recorded · allow post-team review time' : recognition ? 'Pulse confirmed · do not delay unsynchronized shock' : 'Read the rhythm through pulse + perfusion'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={recognition} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-torsades-pulse-and-pattern') : undefined}>Reconcile pulse + polymorphic pattern</Button>
        <Button className="crisis-drug__action" disabled={!recognition || shock} aria-disabled={demonstrating} onClick={act ? () => act('record-torsades-unsynchronized-shock-intent') : undefined}>Record immediate unsynchronized shock</Button>
        <Button className="crisis-drug__action" disabled={!shock || postShock} aria-disabled={demonstrating} onClick={act ? () => act('review-torsades-post-shock-rhythm') : undefined}>Review post-team rhythm</Button>
      </div>
      <p className="field__hint">Sustained polymorphic VT cannot be synchronized reliably. Pulse loss opens the cardiac-arrest pathway; no energy, device operation, or shock delivery occurs here.</p>
    </section>
    <section className="syringe" aria-labelledby="torsades-prevention-title">
      <div id="torsades-prevention-title" className="syringe__name">Correct. Protect. Reassess.</div>
      <Badge kind="teaching">QT · magnesium · electrolytes · culprits · bradycardia</Badge>
      <div className="syringe__meta">K 3.0 · Mg 1.5 · kidney + QT-active medication context</div>
      <p className="syringe__remaining" role="status">{handoff ? 'QT risk remains · owner + arrest triggers handed off' : context && recurrence ? 'Both prevention lanes complete · allow reassessment time' : context ? 'Context reviewed · suppression intent remains' : recurrence ? 'Suppression intent recorded · context remains' : postShock ? 'Sinus returned · recurrence risk did not' : 'Immediate unsynchronized rescue comes first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!postShock || context} aria-disabled={demonstrating} onClick={act ? () => act('review-torsades-long-qt-context') : undefined}>Review QT + culprits + electrolytes</Button>
        <Button className="crisis-drug__action" disabled={!postShock || recurrence} aria-disabled={demonstrating} onClick={act ? () => act('record-torsades-recurrence-suppression-intent') : undefined}>Record magnesium + correction intent</Button>
        <Button className="crisis-drug__action" disabled={!context || !recurrence || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-torsades-recurrence-plan') : undefined}>Reassess recurrence risk + hand off</Button>
      </div>
      <p className="field__hint">Magnesium is bounded to recurrent long-QT polymorphic VT. No dose, target, medication change, pacing, isoproterenol, capture, device, or durable outcome is supplied.</p>
    </section>
    </div>
  </div>;
}
