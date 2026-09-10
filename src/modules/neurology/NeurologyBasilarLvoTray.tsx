/**
 * NeurologyBasilarLvoTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyBasilarLvoResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { basilarLvoInlinePrompt } from './tutor/basilar-artery-occlusion-escalation-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function NeurologyBasilarLvoTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyBasilarLvoAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = basilarLvoInlinePrompt(guidance, { scenarioVersion, basilarLvo: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const imaging = assessment?.imagingAtTick != null;
  const boundary = assessment?.boundaryAtTick != null;
  const activation = assessment?.activationAtTick != null;
  const later = assessment?.laterAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <div className="tray-grid">
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-basilar-lvo-recognition-title">
      <div id="neurology-basilar-lvo-recognition-title" className="syringe__name">Posterior signs still need speed.</div>
      <Badge kind="teaching">clock · posterior syndrome · CT · CTA · selection · airway watch</Badge>
      <div className="syringe__meta">fixed posterior-circulation record · basilar occlusion supplied</div>
      <p className="syringe__remaining">
        {activation ? 'Qualified EVT and airway-capable ownership are active'
          : boundary ? 'Escalation boundary clear · activate qualified ownership'
            : imaging ? 'Fixed imaging and selection context reviewed · recognize the escalation boundary'
              : trajectory ? 'Clock and posterior syndrome reconciled · review the supplied imaging context'
                : 'Start with the clock, posterior pattern, physiology, and whole patient.'}
      </p>
      <div className="syringe__presets">
        {!trajectory && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient') : undefined}>Review clock + posterior syndrome</Button>}
        {trajectory && !imaging && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-basilar-lvo-imaging-selection-and-open-mimics') : undefined}>Review fixed imaging + selection context</Button>}
        {imaging && !boundary && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary') : undefined}>Recognize the escalation boundary</Button>}
        {boundary && !activation && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership') : undefined}>Activate qualified EVT + airway ownership</Button>}
      </div>
      <p className="field__hint">The examination, score, imaging, and selection context are supplied. Qualified stroke, endovascular, transfer, and airway-capable teams own eligibility, treatment, procedures, transport, and deterioration support.</p>
    </section>
    <section className="syringe" aria-labelledby="neurology-basilar-lvo-handoff-title">
      <div id="neurology-basilar-lvo-handoff-title" className="syringe__name">The handoff keeps every risk open.</div>
      <Badge kind="teaching">neurologic change · airway risk · clocks · imaging · owners · uncertainty</Badge>
      <div className="syringe__meta">fixed later report · reperfusion and outcome remain open</div>
      <p className="syringe__remaining" role="status">
        {handoff ? 'Clocks, imaging context, deterioration risk, and owners handed off.'
          : later ? 'The posterior syndrome persists. Airway risk and outcome remain open.'
            : activation ? 'Qualified ownership is active. Review the fixed later neurologic report.'
              : 'Complete recognition and qualified escalation before reassessment.'}
      </p>
      <div className="syringe__presets">
        {activation && !later && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory') : undefined}>Review the later neurologic report</Button>}
        {later && !handoff && <Button className="crisis-drug__action"
          aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-basilar-lvo-clocks-imaging-deterioration-and-unresolved-outcome') : undefined}>Hand off clocks + active risk</Button>}
      </div>
      <p className="field__hint">The later report does not establish reperfusion, treatment effect, durable airway protection, neurological recovery, transfer completion, disposition, prognosis, or outcome.</p>
    </section>
  </div>;
}
