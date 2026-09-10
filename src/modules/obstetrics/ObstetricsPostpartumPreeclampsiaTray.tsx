/**
 * ObstetricsPostpartumPreeclampsiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit used to define this tray inline and render it behind a `hasObstetricsPostpartumPreeclampsiaResponse`
 * gate computed from the scenario. That gate is now this tray's `supports` predicate in
 * `trays.ts`, and the component lives in its own module so the shared cockpit chunk stops
 * carrying obstetrics prose to every other specialty. The body is the original.
 */
import { Button } from '@platform/ui';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { postpartumPreeclampsiaInlinePrompt } from '../obstetrics/tutor/postpartum-severe-preeclampsia-warning-signs-guidance';

export function ObstetricsPostpartumPreeclampsiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsPostpartumPreeclampsiaAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = postpartumPreeclampsiaInlinePrompt(guidance, { scenarioVersion, postpartumPreeclampsia: assessment });
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
    <section className="syringe" aria-labelledby="postpartum-preeclampsia-now-title">
      <div id="postpartum-preeclampsia-now-title" className="syringe__name">Listen past the pressure.</div>
      <p className="syringe__remaining">The postpartum clock, headache, vision, organs, newborn context, and her priorities belong in the same picture.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-postpartum-preeclampsia-clock-symptoms-pressure-organs-newborn-and-whole-person') : undefined}>Connect pressure + whole person</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-obstetrics-persistent-severe-postpartum-hypertension-and-supplied-preeclampsia-pattern-without-waiting-for-proteinuria') : undefined}>Recognize the emergency</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-postpartum-severe-hypertension-protocol-qualified-obstetric-response-and-patient-centered-support-now') : undefined}>Activate urgent response now</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-postpartum-preeclampsia-supplied-neurologic-pulmonary-hematologic-renal-hepatic-medication-and-competing-cause-boundary') : undefined}>Review organs + open causes</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="postpartum-preeclampsia-later-title">
      <div id="postpartum-preeclampsia-later-title" className="syringe__name">A better pressure is one checkpoint.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Neurologic, seizure, pressure, pulmonary, organ, newborn-care, follow-up, cardiovascular, fertility, and outcome uncertainty handed off.' : reassessment ? 'The single pressure is no longer severe-range but remains hypertensive, and symptoms persist. Organ trajectory, neurologic safety, treatment effect, disposition, and outcome remain open.' : evidence ? 'Brain, lungs, platelets, liver, kidneys, urine, medicines, hemorrhage, infection, thrombosis, and other causes stay coupled. Review the fixed later report after time passes.' : support ? 'The urgent response is active while organ and alternative-cause review continues in parallel.' : 'Two persistent severe-range pressures make this an immediate treatment emergency. Connect the whole pattern without waiting for urine protein.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-postpartum-preeclampsia-fixed-later-pressure-symptom-organ-and-support-report') : undefined}>Review the later report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-postpartum-preeclampsia-recurrent-pressure-seizure-stroke-pulmonary-hellp-renal-newborn-follow-up-and-outcome-risk') : undefined}>Hand off what stays open</Button>}
      </div>
    </section>
  </>;
}
