import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { uterineRuptureInlinePrompt } from '../obstetrics/tutor/suspected-uterine-rupture-recognition-guidance';
import { Button } from '@platform/ui';

export function ObstetricsUterineRuptureTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsUterineRuptureAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = uterineRuptureInlinePrompt(guidance, { scenarioVersion, uterineRupture: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const uncertainty = assessment?.uncertaintyAtTick != null;
  const readiness = assessment?.readinessAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="obstetrics-uterine-rupture-now-title">
      <div id="obstetrics-uterine-rupture-now-title" className="syringe__name">Act on the pattern. Keep the diagnosis honest.</div>
      <p className="syringe__remaining">Bring surgery, blood, anesthesia, and newborn care together now. The learner surface keeps treatment and every operation with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-suspected-uterine-rupture-category-one-surgery-anesthesia-blood-newborn-and-support-response') : undefined}>Activate suspected-rupture response</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-suspected-uterine-rupture-scar-pain-fetal-heart-station-activity-bleeding-and-whole-person') : undefined}>Connect the whole pattern</Button>}
        {context && !uncertainty && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-suspected-uterine-rupture-multisignal-nonclassic-triad-and-alternative-cause-boundaries') : undefined}>Review uncertainty + alternatives</Button>}
        {uncertainty && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-suspected-uterine-rupture-parallel-maternal-fetal-surgical-hemorrhage-fertility-and-communication-readiness') : undefined}>Review parallel readiness</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="obstetrics-uterine-rupture-later-title">
      <div id="obstetrics-uterine-rupture-later-title" className="syringe__name">The operation answers what the monitor cannot.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Maternal, fetal, hemorrhage, surgery, newborn, fertility, support, and outcome risks handed off.' : reassessment ? 'Laparotomy begins in the fixed report. Findings, birth, hemostasis, fertility, and outcomes remain open.' : readiness ? 'The qualified team is preparing simultaneous maternal, fetal, surgical, blood, and newborn care. Review the fixed report after time passes.' : support ? 'The response is active. Connect the whole pattern without waiting for a classic triad or diagnostic certainty.' : 'Start with a calm declaration and immediate shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-suspected-uterine-rupture-fixed-worsening-and-laparotomy-start-report') : undefined}>Review the fixed theatre report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-suspected-uterine-rupture-maternal-fetal-hemorrhage-surgery-newborn-fertility-support-and-outcome-risk') : undefined}>Hand off maternal + fetal risk</Button>}
      </div>
    </section>
  </>;
}
