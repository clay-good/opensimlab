import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { neonatalHypoglycemiaInlinePrompt } from '../neonatology/tutor/neonatal-hypoglycemia-guidance';
import { Button } from '@platform/ui';

export function NeonatologyHypoglycemiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neonatologyHypoglycemiaAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = neonatalHypoglycemiaInlinePrompt(guidance, { scenarioVersion, neonatalHypoglycemia: assessment });
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
    <section className="syringe" aria-labelledby="neonatology-hypoglycemia-now-title">
      <div id="neonatology-hypoglycemia-now-title" className="syringe__name">Read the sign and the number together.</div>
      <p className="syringe__remaining">Connect risk, clock, signs, verified glucose, warmth, feeding, parent, and whole dyad. Thresholds vary; every measurement and treatment stays with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neonatal-hypoglycemia-newborn-glucose-feeding-neurologic-and-family-support') : undefined}>Confirm prepared support</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neonatal-hypoglycemia-risk-clock-signs-glucose-temperature-feeding-and-whole-dyad') : undefined}>Connect newborn + whole dyad</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-symptomatic-low-neonatal-glucose-requiring-qualified-immediate-escalation-without-universal-threshold-closure') : undefined}>Recognize the urgent pattern</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-qualified-neonatal-hypoglycemia-local-protocol-treatment-confirmation-and-cause-boundaries') : undefined}>Review qualified boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neonatology-hypoglycemia-later-title">
      <div id="neonatology-hypoglycemia-later-title" className="syringe__name">One better value is a checkpoint, not closure.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Recurrence, neurologic, feeding, thermal, cause, family, disposition, and outcome risks handed off.' : reassessment ? 'The supplied glucose is higher. Durable stability, neurologic safety, cause, and outcomes remain open.' : readiness ? 'Qualified local-protocol care and serial reassessment continue. Review the fixed report after time passes.' : support ? 'Prepared support is present. Connect the whole newborn and dyad before naming the pattern.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neonatal-hypoglycemia-fixed-thirty-minute-qualified-report') : undefined}>Review the fixed 30-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neonatal-hypoglycemia-recurrence-neurologic-feeding-thermal-cause-family-and-outcome-risk') : undefined}>Hand off active newborn risk</Button>}
      </div>
    </section>
  </>;
}
