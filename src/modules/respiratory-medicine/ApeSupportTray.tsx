/**
 * ApeSupportTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasApeSupportResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { apeSupportInlinePrompt } from './tutor/acute-pulmonary-edema-respiratory-support-reassessment-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function ApeSupportTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['apeSupportAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = apeSupportInlinePrompt(guidance, { scenarioVersion, apeSupport: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const failure = assessment?.failureAtTick != null;
  const wholePatient = assessment?.wholePatientAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="ape-support-failure-title">
      <div id="ape-support-failure-title" className="syringe__name">A quieter breath can be the warning.</div>
      <Badge kind="teaching">30 min after rescue · NIV already active</Badge>
      <div className="syringe__meta">trajectory · mentation · work · oxygenation · ventilation</div>
      <p className="syringe__remaining" role="status">{wholePatient ? 'Failure recognized · whole patient held together' : failure ? 'Fatigue recognized · review pressure, perfusion + causes' : trajectory ? 'Reported care reconciled · read the current breathing pattern' : 'Start with what changed after initial rescue'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={trajectory} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-ape-initial-care-and-trajectory') : undefined}>Reconcile initial care + trajectory</Button>
        <Button className="crisis-drug__action" disabled={!trajectory || failure} aria-disabled={demonstrating} onClick={act ? () => act('review-ape-progressive-respiratory-failure') : undefined}>Review progressive respiratory failure</Button>
        <Button className="crisis-drug__action" disabled={!failure || wholePatient} aria-disabled={demonstrating} onClick={act ? () => act('review-ape-pressure-perfusion-congestion-and-causes') : undefined}>Review perfusion + congestion + causes</Button>
      </div>
      <p className="field__hint">The support, pulse oximetry, blood gas, imaging, and examination claims are authored. RR 12/min is fatigue in this fixed trajectory, not improvement or a universal threshold.</p>
    </section>
    <section className="syringe" aria-labelledby="ape-support-escalation-title">
      <div id="ape-support-escalation-title" className="syringe__name">Bring the rescue team close before the margin closes.</div>
      <Badge kind="teaching">respiratory · critical care · airway · nursing · pharmacy</Badge>
      <div className="syringe__meta">rescue ready · causes open · named owners</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Active failure + rescue readiness handed off' : escalation ? 'Experienced help active · advance time before handoff' : wholePatient ? 'Progressive failure is clear · activate airway-capable help' : 'Complete the whole-patient review first'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!wholePatient || escalation} aria-disabled={demonstrating} onClick={act ? () => act('activate-ape-airway-capable-escalation') : undefined}>Activate airway-capable escalation</Button>
        <Button className="crisis-drug__action" disabled={!escalation || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-ape-respiratory-support-reassessment') : undefined}>Hand off active respiratory failure</Button>
      </div>
      <p className="field__hint">No interface, oxygen, pressure, PEEP, ventilator setting, drug, dose, airway procedure, later response, disposition, prognosis, resolution, or outcome is chosen here.</p>
    </section>
  </div>;
}
