/**
 * AcuteSevereAsthmaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasAcuteSevereAsthmaResponse` gate
 * computed from the scenario, so every specialty downloaded it. The gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { acuteSevereAsthmaInlinePrompt } from './tutor/acute-severe-asthma-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function AcuteSevereAsthmaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['acuteSevereAsthmaAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = acuteSevereAsthmaInlinePrompt(guidance, { scenarioVersion, acuteSevereAsthma: assessment });
  const act = demonstrating ? undefined : onAction;
  const treatment = assessment?.treatmentAtTick != null;
  const failure = assessment?.failureAtTick != null;
  const escalation = assessment?.escalationAtTick != null;
  const risks = assessment?.risksAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="acute-severe-asthma-trajectory-title">
      <div id="acute-severe-asthma-trajectory-title" className="syringe__name">Quieter is not always better.</div>
      <Badge kind="teaching">post-treatment · exhausted · hypercapnic failure</Badge>
      <div className="syringe__meta">delivery record → whole trajectory → gas trend</div>
      <p className="syringe__remaining" role="status">{escalation ? 'Respiratory failure recognized · critical-care help active' : failure ? 'Life-threatening failure recognized · escalate now' : treatment ? 'Treatment verified · reconcile the quieter, slower patient' : 'Start with what was delivered and what changed'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={treatment} aria-disabled={demonstrating} onClick={act ? () => act('reconcile-acute-severe-asthma-treatment-and-trajectory') : undefined}>Reconcile treatment + trajectory</Button>
        <Button className="crisis-drug__action" disabled={!treatment || failure} aria-disabled={demonstrating} onClick={act ? () => act('recognize-acute-severe-asthma-respiratory-failure') : undefined}>Recognize respiratory failure</Button>
        <Button className="crisis-drug__action" disabled={!failure || escalation} aria-disabled={demonstrating} onClick={act ? () => act('activate-acute-severe-asthma-critical-care-escalation') : undefined}>Activate critical-care help</Button>
      </div>
      <p className="field__hint">A fall from 36 to 18 breaths/min, less wheeze, and SpO₂ 93% on oxygen do not signal recovery when mentation and effort worsen. Peak flow is not forced in an exhausted, drowsy patient.</p>
    </section>
    <section className="syringe" aria-labelledby="acute-severe-asthma-open-work-title">
      <div id="acute-severe-asthma-open-work-title" className="syringe__name">Call early. Keep the causes open.</div>
      <Badge kind="teaching">continuous watch · expert airway help · active failure</Badge>
      <div className="syringe__meta">alternatives · air trapping · ownership + triggers</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Active failure, hazards, and owners handed off' : risks ? 'Open causes + ventilation hazards reviewed · advance time before handoff' : escalation ? 'Help is active · review alternatives and support hazards' : 'Escalation comes before the complete cause review'}</p>
      <div className="syringe__presets">
        <Button className="crisis-drug__action" disabled={!escalation || risks} aria-disabled={demonstrating} onClick={act ? () => act('review-acute-severe-asthma-alternatives-and-ventilation-risks') : undefined}>Review causes + ventilation risks</Button>
        <Button className="crisis-drug__action" disabled={!risks || handoff} aria-disabled={demonstrating} onClick={act ? () => act('handoff-acute-severe-asthma-reassessment') : undefined}>Hand off active respiratory failure</Button>
      </div>
      <p className="field__hint">No repeat medication, oxygen change, support device, airway procedure, sedation, ventilator setting, disposition, or outcome is selected. Gas values inform this trajectory; they are not universal intubation cutoffs.</p>
    </section>
  </div>;
}
