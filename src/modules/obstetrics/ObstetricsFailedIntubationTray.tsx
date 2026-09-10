import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { failedIntubationInlinePrompt } from '../obstetrics/tutor/failed-obstetric-intubation-oxygenation-first-guidance';
import { Button } from '@platform/ui';

export function ObstetricsFailedIntubationTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsFailedIntubationAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = failedIntubationInlinePrompt(guidance, { scenarioVersion, failedIntubation: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const decision = assessment?.decisionAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="obstetrics-failed-intubation-now-title">
      <div id="obstetrics-failed-intubation-now-title" className="syringe__name">Name the failure. Keep oxygenation at the center.</div>
      <p className="syringe__remaining">Connect attempts, rescue ventilation, aspiration, awareness, fetal urgency, and the whole person. Every physical airway action stays with the qualified team.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-failed-intubation-oxygenation-anesthesia-obstetric-theatre-newborn-and-support-response') : undefined}>Declare + activate shared response</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-failed-intubation-attempts-device-ventilation-aspiration-fetus-and-whole-person') : undefined}>Connect airway + whole person</Button>}
        {context && !safety && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-failed-intubation-attempt-limit-oxygenation-cico-awareness-and-aspiration-boundaries') : undefined}>Review safety boundaries</Button>}
        {safety && !decision && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-failed-intubation-individualized-wake-or-proceed-and-parallel-readiness') : undefined}>Review individualized decision</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="obstetrics-failed-intubation-later-title">
      <div id="obstetrics-failed-intubation-later-title" className="syringe__name">Adequate oxygenation creates space to think, not certainty.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Airway, aspiration, awareness, birth, newborn, support, and outcome risks handed off.' : reassessment ? 'Qualified ventilation remains stable and essential surgery proceeds. Delivery and every outcome remain open.' : decision ? 'The qualified team is weighing the whole case. Review the fixed report after time passes.' : support ? 'The failure is named and help is present. Connect the whole pattern without returning to repeated attempts.' : 'Begin with a clear declaration and calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {decision && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-failed-intubation-fixed-three-minute-qualified-course-report') : undefined}>Review the fixed 3-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-failed-intubation-airway-aspiration-awareness-birth-newborn-support-and-outcome-risk') : undefined}>Hand off active airway risk</Button>}
      </div>
    </section>
  </>;
}
