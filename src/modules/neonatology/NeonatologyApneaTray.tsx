import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { neonatalApneaInlinePrompt } from '../neonatology/tutor/neonatal-apnea-guidance';
import { Button } from '@platform/ui';

export function NeonatologyApneaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neonatologyApneaAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = neonatalApneaInlinePrompt(guidance, { scenarioVersion, neonatalApnea: assessment });
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
    <section className="syringe" aria-labelledby="neonatology-apnea-now-title">
      <div id="neonatology-apnea-now-title" className="syringe__name">Make breathing effective. Watch the heart rate answer.</div>
      <p className="syringe__remaining">Connect the birth clock, completed initial steps, apnea, heart rate, warmth, parent, and whole dyad. Every physical resuscitation step stays with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neonatal-apnea-qualified-newborn-airway-clock-and-dyad-support') : undefined}>Activate qualified response</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neonatal-apnea-gestation-birth-clock-breathing-heart-rate-tone-temperature-and-whole-dyad') : undefined}>Connect newborn + whole dyad</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neonatal-apnea-ventilation-threshold-without-cause-or-outcome-closure') : undefined}>Recognize the threshold</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neonatal-apnea-qualified-effective-ventilation-heart-rate-and-escalation-readiness') : undefined}>Review qualified response</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neonatology-apnea-later-title">
      <div id="neonatology-apnea-later-title" className="syringe__name">A rising heart rate is the first answer, not the last word.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Respiratory, thermal, glucose, neurologic, parent, disposition, and outcome risks handed off.' : reassessment ? 'Heart rate rises and respirations emerge. Durable breathing, stable transition, cause, and outcomes remain open.' : readiness ? 'Qualified ventilation and direct assessment continue. Review the fixed report after time passes.' : support ? 'The team is ready. Connect the whole clock and dyad before naming the threshold.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-neonatal-apnea-fixed-ninety-second-qualified-response-report') : undefined}>Review the fixed 90-second report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neonatal-apnea-respiratory-thermal-glucose-neurologic-parent-and-outcome-risk') : undefined}>Hand off active newborn risk</Button>}
      </div>
    </section>
  </>;
}
