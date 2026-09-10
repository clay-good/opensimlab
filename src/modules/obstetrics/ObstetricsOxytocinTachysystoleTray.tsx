import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { oxytocinTachysystoleInlinePrompt } from '../obstetrics/tutor/oxytocin-associated-uterine-tachysystole-guidance';
import { Button } from '@platform/ui';

export function ObstetricsOxytocinTachysystoleTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsOxytocinTachysystoleAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = oxytocinTachysystoleInlinePrompt(guidance, { scenarioVersion, oxytocinTachysystole: assessment });
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
    <section className="syringe" aria-labelledby="obstetrics-oxytocin-tachysystole-now-title">
      <div id="obstetrics-oxytocin-tachysystole-now-title" className="syringe__name">Reduce the uterine load. Keep the whole pair visible.</div>
      <p className="syringe__remaining">Connect oxytocin, contractions, fetal trajectory, maternal state, labour, and preferences. Every physical intervention stays with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-oxytocin-tachysystole-qualified-obstetric-fetal-and-support-response') : undefined}>Activate qualified response</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-oxytocin-tachysystole-infusion-contraction-fetal-maternal-and-whole-person-context') : undefined}>Connect contractions + whole person</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-obstetrics-oxytocin-tachysystole-with-fetal-heart-deterioration-without-single-trace-closure') : undefined}>Recognize the whole pattern</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-oxytocin-tachysystole-qualified-source-stop-position-cause-and-birth-readiness') : undefined}>Review qualified response</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="obstetrics-oxytocin-tachysystole-later-title">
      <div id="obstetrics-oxytocin-tachysystole-later-title" className="syringe__name">A calmer trace is a new snapshot, not permission to close.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Recurrence, fetal, birth, medication, maternal, support, and outcome risks handed off.' : reassessment ? 'Contraction frequency and the fetal report improve. Durable safety, restart, birth, and outcomes remain open.' : readiness ? 'Qualified correction and surveillance are active. Review the fixed report after time passes.' : support ? 'The response is active. Connect the whole trajectory before naming the pattern.' : 'Begin with calm shared ownership and stay with the patient. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-oxytocin-tachysystole-fixed-six-minute-qualified-recovery-report') : undefined}>Review the fixed 6-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-oxytocin-tachysystole-recurrence-fetal-birth-medication-maternal-and-outcome-risk') : undefined}>Hand off active fetal risk</Button>}
      </div>
    </section>
  </>;
}
