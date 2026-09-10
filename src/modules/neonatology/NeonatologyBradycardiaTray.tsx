import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { neonatalBradycardiaInlinePrompt } from '../neonatology/tutor/neonatal-bradycardia-guidance';
import { Button } from '@platform/ui';

export function NeonatologyBradycardiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neonatologyBradycardiaAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = neonatalBradycardiaInlinePrompt(guidance, { scenarioVersion, neonatalBradycardia: assessment });
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
    <section className="syringe" aria-labelledby="neonatology-bradycardia-now-title">
      <div id="neonatology-bradycardia-now-title" className="syringe__name">Verify the lungs first. Then support the heart together.</div>
      <p className="syringe__remaining">Connect effective lung inflation, the heart-rate trajectory, airway, oxygenation, warmth, parent, and whole dyad. Every physical resuscitation step stays with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neonatal-bradycardia-qualified-compression-ventilation-clock-and-dyad-response') : undefined}>Activate qualified response</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neonatal-bradycardia-adequate-ventilation-heart-rate-airway-oxygenation-and-whole-dyad') : undefined}>Connect trajectory + whole dyad</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neonatal-bradycardia-compression-threshold-after-adequate-ventilation') : undefined}>Recognize the threshold</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-qualified-neonatal-compression-ventilation-coordination-and-epinephrine-boundary') : undefined}>Review later-branch boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neonatology-bradycardia-later-title">
      <div id="neonatology-bradycardia-later-title" className="syringe__name">A heart-rate rise changes the branch. It does not close the case.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Respiratory, circulatory, neurologic, parent, disposition, and outcome risks handed off.' : reassessment ? 'Heart rate rises above 60/min. Durable circulation, breathing, cause, and outcomes remain open.' : readiness ? 'Qualified coordinated support continues. Review the fixed report after time passes.' : support ? 'The team is ready. Connect the supplied evidence of effective lung inflation before naming the threshold.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neonatal-bradycardia-fixed-three-minute-qualified-response-report') : undefined}>Review the fixed 3-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neonatal-bradycardia-respiratory-circulatory-neurologic-parent-and-outcome-risk') : undefined}>Hand off active newborn risk</Button>}
      </div>
    </section>
  </>;
}
