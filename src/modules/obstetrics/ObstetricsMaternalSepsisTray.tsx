/**
 * ObstetricsMaternalSepsisTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit used to define this tray inline and render it behind a `hasObstetricsMaternalSepsisResponse`
 * gate computed from the scenario. That gate is now this tray's `supports` predicate in
 * `trays.ts`, and the component lives in its own module so the shared cockpit chunk stops
 * carrying obstetrics prose to every other specialty. The body is the original.
 */
import { Button } from '@platform/ui';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { maternalSepsisInlinePrompt } from '../obstetrics/tutor/maternal-sepsis-postpartum-deterioration-guidance';

export function ObstetricsMaternalSepsisTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsMaternalSepsisAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = maternalSepsisInlinePrompt(guidance, { scenarioVersion, maternalSepsis: assessment });
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
    <section className="syringe" aria-labelledby="maternal-sepsis-now-title">
      <div id="maternal-sepsis-now-title" className="syringe__name">Notice the whole person. Move together.</div>
      <p className="syringe__remaining">The postpartum clock, infection pattern, brain, kidney, circulation, breathing, newborn context, and dignity belong in one calm view.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-sepsis-postpartum-clock-infection-organ-dysfunction-and-whole-person') : undefined}>Connect infection + organs</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-obstetrics-maternal-sepsis-emergency-without-fever-score-source-or-single-value-closure') : undefined}>See the emergency, keep it open</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-sepsis-obstetric-critical-care-anesthesia-nursing-pharmacy-microbiology-source-newborn-and-dignity-ownership') : undefined}>Bring every owner in</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-sepsis-supplied-infectious-noninfectious-culture-lactate-perfusion-and-source-boundary') : undefined}>Review source + mimics</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="maternal-sepsis-later-title">
      <div id="maternal-sepsis-later-title" className="syringe__name">A better number is a checkpoint, not recovery.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Shock, source, organ, antimicrobial, VTE, newborn, survivor, and outcome uncertainty handed off.' : reassessment ? 'Pulse, pressure, breathing, and responses improved modestly. Repeat perfusion, source control, organ recovery, treatment effect, and outcome remain open.' : evidence ? 'Infection, perfusion, organ dysfunction, source, cultures, lactate, and noninfectious mimics stay coupled. Record bounded immediate-care intent after time passes.' : support ? 'Sepsis, organ-support, source, newborn, and dignity-centered owners are together. Review the supplied evidence.' : 'Connect the whole pattern before one fever, score, value, or source closes the view.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-obstetrics-sepsis-bounded-qualified-immediate-care-source-control-intent-and-strict-later-review') : undefined}>Record care intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-sepsis-shock-source-organ-antimicrobial-vte-newborn-survivor-and-outcome-risk') : undefined}>Hand off what stays open</Button>}
      </div>
    </section>
  </>;
}
