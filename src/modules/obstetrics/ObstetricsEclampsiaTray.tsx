/**
 * ObstetricsEclampsiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit used to define this tray inline and render it behind a `hasObstetricsEclampsiaResponse`
 * gate computed from the scenario. That gate is now this tray's `supports` predicate in
 * `trays.ts`, and the component lives in its own module so the shared cockpit chunk stops
 * carrying obstetrics prose to every other specialty. The body is the original.
 */
import { Button } from '@platform/ui';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { eclampsiaInlinePrompt } from '../obstetrics/tutor/eclampsia-first-seizure-response-guidance';

export function ObstetricsEclampsiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsEclampsiaAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = eclampsiaInlinePrompt(guidance, { scenarioVersion, eclampsia: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const support = assessment?.supportAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="eclampsia-now-title">
      <div id="eclampsia-now-title" className="syringe__name">Read the seizure in its pregnancy context.</div>
      <p className="syringe__remaining">Start with the witnessed event, breathing, pulse, glucose, pressure, recovery, pregnancy, fetal report, injury, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-eclampsia-seizure-clock-recovery-pressure-organs-fetal-context-and-whole-person') : undefined}>Review seizure + pregnancy context</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-obstetrics-supplied-eclampsia-pattern-after-first-seizure-with-dangerous-alternatives-open') : undefined}>Recognize the eclampsia emergency</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-eclampsia-maternal-stabilization-seizure-severe-pressure-airway-obstetric-fetal-and-dignity-response-now') : undefined}>Activate qualified maternal response</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-eclampsia-supplied-neurologic-airway-aspiration-organ-fetal-metabolic-toxic-infectious-and-trauma-boundary') : undefined}>Review recovery + open causes</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="eclampsia-later-title">
      <div id="eclampsia-later-title" className="syringe__name">After the seizure, reassess the whole picture.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Recurrent-seizure, airway, maternal-organ, fetal, birth-planning, postpartum, and support risks handed off.' : reassessment ? 'No recurrent seizure is reported in this brief window. Alertness is improving; pressure, cause, fetal safety, and durable control remain open.' : evidence ? 'Qualified care is active. Review the fixed 20-minute maternal-fetal report after time passes.' : support ? 'The urgent response is active. Review recovery, organs, fetal context, and dangerous alternative causes.' : 'Begin with what happened, what has recovered, and what remains at risk.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-eclampsia-fixed-later-recovery-pressure-breathing-fetal-and-organ-report') : undefined}>Review the 20-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-eclampsia-recurrence-airway-aspiration-stroke-pressure-organ-fetal-delivery-and-outcome-risk') : undefined}>Hand off recurrent-seizure risk</Button>}
      </div>
    </section>
  </>;
}
