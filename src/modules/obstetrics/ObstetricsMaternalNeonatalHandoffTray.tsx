import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { maternalNeonatalHandoffInlinePrompt } from '../obstetrics/tutor/maternal-to-neonatal-resuscitation-handoff-guidance';
import { Button } from '@platform/ui';

export function ObstetricsMaternalNeonatalHandoffTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsMaternalNeonatalHandoffAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = maternalNeonatalHandoffInlinePrompt(guidance, { scenarioVersion, maternalNeonatalHandoff: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const transfer = assessment?.transferAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="obstetrics-maternal-neonatal-handoff-now-title">
      <div id="obstetrics-maternal-neonatal-handoff-now-title" className="syringe__name">Two patients. Two teams. One clear transfer.</div>
      <p className="syringe__remaining">Carry the birth clock, maternal context, newborn trajectory, current support, and open risks together. Every physical intervention stays with the qualified teams.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-maternal-neonatal-handoff-two-patient-team-and-support-ownership') : undefined}>Name teams + transfer owners</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-maternal-neonatal-handoff-antenatal-intrapartum-birth-resuscitation-and-whole-family-context') : undefined}>Connect clocks + whole family</Button>}
        {context && !safety && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-maternal-neonatal-handoff-ventilation-priority-response-and-uncertainty-boundaries') : undefined}>Review response + uncertainty</Button>}
        {safety && !transfer && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-maternal-neonatal-handoff-structured-transfer-readback-and-parallel-readiness') : undefined}>Review transfer + readback</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="obstetrics-maternal-neonatal-handoff-later-title">
      <div id="obstetrics-maternal-neonatal-handoff-later-title" className="syringe__name">A rising heart rate is encouraging, not the end of the story.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Postresuscitation, maternal, family, documentation, follow-up, and outcome risks handed off.' : reassessment ? 'Spontaneous breathing is supplied while qualified support continues. Monitoring, maternal recovery, disposition, and outcomes remain open.' : transfer ? 'The transfer structure is ready. Review the fixed report after time passes.' : support ? 'Ownership is explicit. Connect the whole trajectory before compressing it into a handoff.' : 'Begin by naming who owns each patient and the transfer. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {transfer && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-maternal-neonatal-handoff-fixed-five-minute-qualified-course-report') : undefined}>Review the fixed 5-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-maternal-neonatal-postresuscitation-monitoring-maternal-family-and-outcome-risk') : undefined}>Hand off active two-patient risk</Button>}
      </div>
    </section>
  </>;
}
