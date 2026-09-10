import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { ineffectiveVentilationInlinePrompt } from '../neonatology/tutor/ineffective-ventilation-correction-guidance';
import { Button } from '@platform/ui';

export function NeonatologyIneffectiveVentilationTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neonatologyIneffectiveVentilationAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = ineffectiveVentilationInlinePrompt(guidance, { scenarioVersion, ineffectiveVentilation: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const readiness = assessment?.readinessAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neonatology-ineffective-ventilation-now-title">
      <div id="neonatology-ineffective-ventilation-now-title" className="syringe__name">Make the ventilation visible. Let the heart rate verify it.</div>
      <p className="syringe__remaining">Connect the clock, interface, chest movement, heart-rate trajectory, oxygenation signal, warmth, parent, and whole dyad. Every physical resuscitation step stays with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-ineffective-neonatal-ventilation-qualified-airway-ventilation-clock-and-dyad-response') : undefined}>Activate qualified response</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-ineffective-neonatal-ventilation-birth-clock-interface-chest-movement-heart-rate-and-whole-dyad') : undefined}>Connect response + whole dyad</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-ineffective-neonatal-ventilation-from-absent-heart-rate-rise-without-cause-closure') : undefined}>Recognize the ineffective pattern</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-qualified-neonatal-ventilation-correction-alternative-airway-and-compression-boundary') : undefined}>Review escalation boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neonatology-ineffective-ventilation-later-title">
      <div id="neonatology-ineffective-ventilation-later-title" className="syringe__name">Correction earns another assessment, not closure.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Airway, respiratory, neurologic, parent, disposition, and outcome risks handed off.' : reassessment ? 'Chest movement and heart rate improve. Durable breathing, stable transition, cause, and outcomes remain open.' : readiness ? 'Qualified correction and direct assessment continue. Review the fixed report after time passes.' : support ? 'The response is active. Connect the entire ventilation trajectory before naming the pattern.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-ineffective-neonatal-ventilation-fixed-two-minute-qualified-response-report') : undefined}>Review the fixed 2-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-ineffective-neonatal-ventilation-airway-respiratory-neurologic-parent-and-outcome-risk') : undefined}>Hand off active newborn risk</Button>}
      </div>
    </section>
  </>;
}
