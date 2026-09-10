/**
 * ObstetricsAtonyTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit used to define this tray inline and render it behind a `hasObstetricsAtonyResponse`
 * gate computed from the scenario. That gate is now this tray's `supports` predicate in
 * `trays.ts`, and the component lives in its own module so the shared cockpit chunk stops
 * carrying obstetrics prose to every other specialty. The body is the original.
 */
import { Button } from '@platform/ui';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { atonyInlinePrompt } from '../obstetrics/tutor/postpartum-hemorrhage-uterine-atony-guidance';

export function ObstetricsAtonyTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsAtonyAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = atonyInlinePrompt(guidance, { scenarioVersion, atony: assessment });
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
    <section className="syringe" aria-labelledby="obstetrics-atony-early-title">
      <div id="obstetrics-atony-early-title" className="syringe__name">See the bleeding early. Bring calm around it.</div>
      <p className="syringe__remaining">Begin with the birth clock, measured loss, symptoms, perfusion, uterine tone, and the whole person. One clue never gets to close every cause.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-atony-hemorrhage-birth-clock-measured-loss-physiology-tone-and-whole-person') : undefined}>Connect birth + whole person</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-obstetrics-atony-postpartum-hemorrhage-and-atony-pattern-without-threshold-tone-or-single-cause-closure') : undefined}>Act early, keep causes open</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-atony-hemorrhage-obstetric-anesthesia-nursing-blood-bank-operating-room-and-dignity-ownership') : undefined}>Bring the room together</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-atony-supplied-tone-placenta-tract-coagulation-perfusion-and-competing-cause-boundary') : undefined}>Review tone + hidden causes</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="obstetrics-atony-later-title">
      <div id="obstetrics-atony-later-title" className="syringe__name">Slower bleeding is a checkpoint, not closure.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Recurrent bleeding, shock, coagulation, blood-bank, operative, dignity, newborn, fertility, and outcome uncertainty handed off.' : reassessment ? 'Pressure, pulse, uterine tone, and visible bleeding improved. Cumulative loss, hidden bleeding, durable control, treatment effect, and outcome remain open.' : evidence ? 'Tone, placenta, tract, coagulation, perfusion, laboratory, and competing-cause evidence stay coupled. Record bounded bundled intent after time passes.' : support ? 'Hemorrhage, resuscitation, blood-bank, escalation, newborn-support, and dignity-centered ownership are active. Review the supplied evidence.' : 'Recognize the early actionable hemorrhage and atony pattern before the bundled-care boundary.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-obstetrics-atony-bounded-qualified-motive-bundle-escalation-intent-and-strict-later-review') : undefined}>Record bundle + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-atony-recurrent-bleeding-shock-coagulopathy-blood-procedure-newborn-and-outcome-risk') : undefined}>Hand off what stays open</Button>}
      </div>
    </section>
  </>;
}
