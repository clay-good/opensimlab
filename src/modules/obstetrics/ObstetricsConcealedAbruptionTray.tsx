/**
 * ObstetricsConcealedAbruptionTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit used to define this tray inline and render it behind a `hasObstetricsConcealedAbruptionResponse`
 * gate computed from the scenario. That gate is now this tray's `supports` predicate in
 * `trays.ts`, and the component lives in its own module so the shared cockpit chunk stops
 * carrying obstetrics prose to every other specialty. The body is the original.
 */
import { Button } from '@platform/ui';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { concealedAbruptionInlinePrompt } from '../obstetrics/tutor/concealed-placental-abruption-hemorrhage-guidance';

export function ObstetricsConcealedAbruptionTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['obstetricsConcealedAbruptionAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = concealedAbruptionInlinePrompt(guidance, { scenarioVersion, concealedAbruption: assessment });
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
    <section className="syringe" aria-labelledby="concealed-abruption-now-title">
      <div id="concealed-abruption-now-title" className="syringe__name">Look beyond what you can see.</div>
      <p className="syringe__remaining">Pain, perfusion, uterine tone, fetal context, coagulation, and the whole person tell more than the visible blood alone.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-obstetrics-abruption-pain-visible-blood-maternal-physiology-fetal-context-and-whole-person') : undefined}>Connect mother + fetus</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-obstetrics-abruption-concealed-hemorrhage-pattern-without-visible-volume-ultrasound-or-single-cause-closure') : undefined}>Trust the pattern, not the puddle</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-obstetrics-abruption-hemorrhage-anesthesia-blood-bank-operating-room-neonatal-and-dignity-ownership') : undefined}>Bring both teams together</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-obstetrics-abruption-supplied-perfusion-uterine-fetal-coagulation-placental-and-competing-cause-boundary') : undefined}>Review blood + competing causes</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="concealed-abruption-later-title">
      <div id="concealed-abruption-later-title" className="syringe__name">Readiness is progress. It is not resolution.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Hidden loss, shock, coagulation, fetal, delivery, neonatal, dignity, support, fertility, and outcome uncertainty handed off.' : reassessment ? 'Maternal numbers improved modestly, but fetal compromise persists. Total loss, coagulation, anesthesia, delivery, treatment effect, and outcome remain open.' : evidence ? 'Perfusion, fetus, coagulation, placenta, rupture, previa, vasa previa, labor, trauma, and non-obstetric causes stay coupled. Record bounded urgent intent after time passes.' : support ? 'Hemorrhage, anesthesia, blood-bank, operating-room, neonatal, consent, communication, and dignity-centered ownership are together. Review the supplied evidence.' : 'Connect the maternal-fetal pattern before visible volume or ultrasound narrows the view.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-obstetrics-abruption-bounded-qualified-resuscitation-coagulation-and-urgent-delivery-intent-with-strict-later-review') : undefined}>Record urgent intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-obstetrics-abruption-concealed-loss-shock-coagulopathy-fetal-delivery-neonatal-bereavement-and-outcome-risk') : undefined}>Hand off both horizons</Button>}
      </div>
    </section>
  </>;
}
