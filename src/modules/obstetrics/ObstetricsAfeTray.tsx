/**
 * ObstetricsAfeTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit used to define this tray inline and render it behind a `hasObstetricsAfeResponse`
 * gate computed from the scenario. That gate is now this tray's `supports` predicate in
 * `trays.ts`, and the component lives in its own module so the shared cockpit chunk stops
 * carrying obstetrics prose to every other specialty. The body is the original.
 */
import { Button } from '@platform/ui';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { afeInlinePrompt } from '../obstetrics/tutor/suspected-amniotic-fluid-embolism-pattern-guidance';

export function ObstetricsAfeTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsAfeAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = afeInlinePrompt(guidance, { scenarioVersion, afe: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="obstetrics-afe-now-title">
      <div id="obstetrics-afe-now-title" className="syringe__name">Connect the sudden whole-body change.</div>
      <p className="syringe__remaining">Qualified help starts first. Then keep birth timing, breathing, circulation, alertness, bleeding, coagulation, the newborn, and her support in one picture.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-afe-coordinated-obstetric-anesthesia-critical-care-cardiopulmonary-hemorrhage-newborn-and-dignity-response') : undefined}>Activate coordinated response</Button>}
        {support && !trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-afe-birth-clock-symptom-order-cardiorespiratory-state-bleeding-coagulation-newborn-and-whole-person') : undefined}>Connect birth clock + whole pattern</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-obstetrics-afe-rapid-maternal-collapse-and-coagulopathy-pattern-without-diagnostic-closure') : undefined}>Recognize rapid maternal collapse</Button>}
        {recognition && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-afe-supplied-cardiac-pulmonary-hemorrhage-coagulation-uterine-anesthetic-thrombotic-infectious-allergic-and-competing-cause-boundary') : undefined}>Review shock + bleeding + open causes</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="obstetrics-afe-later-title">
      <div id="obstetrics-afe-later-title" className="syringe__name">Reassess breathing, circulation, and bleeding.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Active shock, hypoxemia, bleeding, coagulation, arrest, newborn-support, family, staff, and outcome risks handed off.' : reassessment ? 'A central pulse remains. Shock, respiratory compromise, rising bleeding, progressive coagulopathy, cause, procedures, and treatment effect remain open.' : evidence ? 'Qualified support is active. Review the fixed 12-minute report after time passes.' : support ? 'The coordinated response is active. Connect the sequence, recognize without diagnostic closure, and review the supplied evidence.' : 'Activate qualified coordinated ownership now; then work through the pattern without adding treatment controls.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-afe-fixed-later-breathing-circulation-bleeding-coagulation-and-support-report') : undefined}>Review the 12-minute report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-afe-hypoxemia-shock-coagulopathy-bleeding-arrest-procedure-newborn-family-support-and-outcome-risk') : undefined}>Hand off active maternal risk</Button>}
      </div>
    </section>
  </>;
}
